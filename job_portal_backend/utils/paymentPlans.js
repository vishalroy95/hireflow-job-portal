const PaymentPlan = require('../models/PaymentPlan');

const defaultPlans = [
  {
    key: 'basic',
    name: 'Basic',
    description: 'Starter plan for small hiring needs.',
    amount: 199,
    jobPostingLimit: 3,
    premiumJobCredits: 1,
    resumeUnlockCredits: 10,
    sortOrder: 1,
  },
  {
    key: 'standard',
    name: 'Standard',
    description: 'Balanced plan for regular recruiter activity.',
    amount: 499,
    jobPostingLimit: 8,
    premiumJobCredits: 3,
    resumeUnlockCredits: 30,
    sortOrder: 2,
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'Higher visibility for active hiring teams.',
    amount: 999,
    jobPostingLimit: 20,
    premiumJobCredits: 8,
    resumeUnlockCredits: 75,
    sortOrder: 3,
  },
];

const ensureDefaultPaymentPlans = async () => {
  const count = await PaymentPlan.countDocuments();
  if (count > 0) return;

  await PaymentPlan.insertMany(defaultPlans);
};

module.exports = {
  defaultPlans,
  ensureDefaultPaymentPlans,
};
