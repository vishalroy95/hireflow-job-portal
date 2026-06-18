const crypto = require('crypto');
const Payment = require('../models/Payment');
const PaymentPlan = require('../models/PaymentPlan');
const Subscription = require('../models/Subscription');
const { getOrCreateSettings } = require('../utils/platformSettings');
const { ensureDefaultPaymentPlans } = require('../utils/paymentPlans');
const { logEvent } = require('../utils/systemLogger');

const getRazorpayConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
});

const toRazorpayAmount = (amount) => Math.round(Number(amount || 0) * 100);
const isDemoMode = (settings) => settings.payments?.mode === 'demo';

const buildDemoOrder = ({ plan, recruiterId }) => ({
  id: `order_demo_${recruiterId.toString().slice(-8)}_${Date.now()}`,
  amount: toRazorpayAmount(plan.amount),
  currency: plan.currency,
  receipt: `demo_${Date.now()}`,
  status: 'created',
  notes: {
    recruiterId: recruiterId.toString(),
    planId: plan._id.toString(),
    planKey: plan.key,
  },
});

const activateSubscription = async ({ recruiterId, payment, plan, provider }) => {
  payment.status = 'paid';
  await payment.save();

  const currentPeriodEnd = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
  return Subscription.findOneAndUpdate(
    { recruiterId },
    {
      recruiterId,
      plan: plan.key,
      status: 'active',
      jobPostingLimit: plan.jobPostingLimit,
      premiumJobCredits: plan.premiumJobCredits,
      resumeUnlockCredits: plan.resumeUnlockCredits,
      currentPeriodEnd,
      lastPaymentId: payment._id,
      paymentProvider: provider,
    },
    { new: true, upsert: true, runValidators: true }
  );
};

const getPaymentPlans = async (req, res, next) => {
  try {
    await ensureDefaultPaymentPlans();
    const plans = await PaymentPlan.find({ isActive: true }).sort({ sortOrder: 1, amount: 1 }).lean();
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      plans,
      payments: {
        enabled: Boolean(settings.payments?.enabled),
        provider: settings.payments?.provider || 'razorpay',
        mode: settings.payments?.mode || 'demo',
        keyId: getRazorpayConfig().keyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createRazorpayOrder = async ({ keyId, keySecret, plan, recruiterId }) => {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const receipt = `hf_${recruiterId.toString().slice(-8)}_${Date.now()}`.slice(0, 40);

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: toRazorpayAmount(plan.amount),
      currency: plan.currency,
      receipt,
      notes: {
        recruiterId: recruiterId.toString(),
        planId: plan._id.toString(),
        planKey: plan.key,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.description || 'Unable to create Razorpay order');
    error.statusCode = 502;
    throw error;
  }

  return payload;
};

const createPaymentOrder = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    if (!settings.payments?.enabled) {
      return res.status(400).json({ success: false, message: 'Payments are disabled by admin.' });
    }

    await ensureDefaultPaymentPlans();
    const plan = await PaymentPlan.findOne({ _id: req.body.planId, isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Payment plan not found.' });
    }

    const { keyId, keySecret } = getRazorpayConfig();
    const demoMode = isDemoMode(settings);

    if (!demoMode && (!keyId || !keySecret)) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env.',
      });
    }

    const order = demoMode
      ? buildDemoOrder({ plan, recruiterId: req.userId })
      : await createRazorpayOrder({ keyId, keySecret, plan, recruiterId: req.userId });

    const payment = await Payment.create({
      recruiterId: req.userId,
      planId: plan._id,
      provider: demoMode ? 'demo' : 'razorpay',
      providerOrderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      metadata: {
        planKey: plan.key,
        planName: plan.name,
        receipt: order.receipt,
        mode: settings.payments?.mode || 'demo',
      },
    });

    await logEvent({
      req,
      action: 'payment.order_created',
      category: 'payment',
      message: `Recruiter created payment order for ${plan.name}`,
      metadata: {
        paymentId: payment._id.toString(),
        planId: plan._id.toString(),
        orderId: order.id,
        amount: plan.amount,
      },
    });

    res.status(201).json({
      success: true,
      order,
      payment,
      plan,
      keyId: demoMode ? '' : keyId,
      demo: demoMode,
    });
  } catch (error) {
    next(error);
  }
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature, keySecret }) => {
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature || '');
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const verifyPayment = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const demoMode = isDemoMode(settings);
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      demo_order_id: demoOrderId,
      demo_payment_id: demoPaymentId,
    } = req.body;
    const orderId = demoMode ? demoOrderId : razorpayOrderId;
    const paymentId = demoMode ? demoPaymentId : razorpayPaymentId;
    const { keySecret } = getRazorpayConfig();

    if (!orderId || !paymentId || (!demoMode && !signature)) {
      return res.status(400).json({ success: false, message: 'Payment verification details are missing.' });
    }

    const payment = await Payment.findOne({ providerOrderId: orderId, recruiterId: req.userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment order not found.' });
    }

    const plan = await PaymentPlan.findById(payment.planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Payment plan not found.' });
    }

    if (!demoMode && !verifyRazorpaySignature({ orderId, paymentId, signature, keySecret })) {
      payment.status = 'failed';
      payment.failureReason = 'Invalid Razorpay signature';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    payment.providerPaymentId = paymentId;
    payment.providerSignature = demoMode ? 'demo-verified' : signature;
    const subscription = await activateSubscription({
      recruiterId: req.userId,
      payment,
      plan,
      provider: demoMode ? 'demo' : 'razorpay',
    });

    await logEvent({
      req,
      action: 'payment.verified',
      category: 'payment',
      message: `Recruiter payment verified for ${plan.name}`,
      metadata: {
        paymentId: payment._id.toString(),
        planId: plan._id.toString(),
        plan: plan.key,
        providerPaymentId: paymentId,
        mode: demoMode ? 'demo' : settings.payments?.mode,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified. Your plan is active.',
      payment,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ recruiterId: req.userId })
      .populate('planId', 'name key')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

const getAdminPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('recruiterId', 'name email')
      .populate('planId', 'name key')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

const getAdminPaymentPlans = async (req, res, next) => {
  try {
    await ensureDefaultPaymentPlans();
    const plans = await PaymentPlan.find().sort({ sortOrder: 1, amount: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    next(error);
  }
};

const updateAdminPaymentPlans = async (req, res, next) => {
  try {
    const plans = Array.isArray(req.body.plans) ? req.body.plans : [];
    if (plans.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one payment plan.' });
    }

    const normalizedPlans = plans.map((plan, index) => {
      const name = String(plan.name || '').trim();
      const key = String(plan.key || name || `plan-${index + 1}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      return {
        _id: plan._id,
        key: key || `plan-${index + 1}`,
        name: name || `Plan ${index + 1}`,
        description: String(plan.description || '').trim(),
        amount: Math.max(0, Number(plan.amount) || 0),
        currency: 'INR',
        durationDays: Math.max(1, Number(plan.durationDays) || 30),
        jobPostingLimit: Math.max(0, Number(plan.jobPostingLimit) || 0),
        premiumJobCredits: Math.max(0, Number(plan.premiumJobCredits) || 0),
        resumeUnlockCredits: Math.max(0, Number(plan.resumeUnlockCredits) || 0),
        isActive: Boolean(plan.isActive),
        sortOrder: Number(plan.sortOrder) || index + 1,
      };
    });

    const seenKeys = new Set();
    const duplicateKey = normalizedPlans.find((plan) => {
      if (seenKeys.has(plan.key)) return true;
      seenKeys.add(plan.key);
      return false;
    });

    if (duplicateKey) {
      return res.status(400).json({ success: false, message: 'Payment plan keys must be unique.' });
    }

    await Promise.all(normalizedPlans.map((plan) => {
      const update = { ...plan };
      delete update._id;

      return PaymentPlan.findOneAndUpdate(
        { key: plan.key },
        update,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }));

    const keepKeys = normalizedPlans.map((plan) => plan.key);
    await PaymentPlan.updateMany({ key: { $nin: keepKeys } }, { isActive: false });

    await logEvent({
      req,
      action: 'payment.plans_updated',
      category: 'payment',
      message: 'Admin updated recruiter payment plans',
      metadata: {
        planKeys: keepKeys,
      },
    });

    const savedPlans = await PaymentPlan.find().sort({ sortOrder: 1, amount: 1 });
    res.status(200).json({ success: true, message: 'Payment plans saved', plans: savedPlans });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentPlans,
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
  getAdminPayments,
  getAdminPaymentPlans,
  updateAdminPaymentPlans,
};
