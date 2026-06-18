// controllers/authController.js
// Authentication controller - register, login, logout, profile

const User = require('../models/User');
const Company = require('../models/Company');
const RecruiterProfile = require('../models/RecruiterProfile');
const Subscription = require('../models/Subscription');
const CandidateProfile = require('../models/CandidateProfile');
const PendingRegistration = require('../models/PendingRegistration');
const { getOrCreateSettings } = require('../utils/platformSettings');
const { sendTemplateEmail } = require('../utils/emailService');
const { logEvent } = require('../utils/systemLogger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateGoogleRecruiterSetupToken = (payload) => (
  jwt.sign(
    { ...payload, purpose: 'google_recruiter_setup' },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  )
);

const authCookieOptions = () => ({
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  secure: process.env.NODE_ENV === 'production',
});

const buildAuthUser = async (user) => {
  const baseUser = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    recruiterStatus: user.recruiterStatus,
    profileImage: user.profileImage || '',
  };

  if (user.role === 'recruiter') {
    const company = await Company.findOne({ recruiterId: user._id }).select('name logo');
    baseUser.company = company || null;
    baseUser.companyLogo = company?.logo || '';
  }

  return baseUser;
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const frontendUrl = () => String(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

const googleRedirectUri = () => (
  process.env.GOOGLE_CALLBACK_URL
  || process.env.GOOGLE_REDIRECT_URI
  || 'http://localhost:5000/api/auth/google/callback'
);

const isGoogleAuthConfigured = () => (
  process.env.GOOGLE_CLIENT_ID
  && process.env.GOOGLE_CLIENT_SECRET
  && googleRedirectUri()
);

const encodeGoogleState = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeGoogleState = (state) => {
  try {
    return JSON.parse(Buffer.from(String(state || ''), 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

const redirectToFrontend = (path, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return `${frontendUrl()}${path}${query ? `?${query}` : ''}`;
};

const normalizeRegistrationPayload = (body) => ({
  name: String(body.name || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  password: body.password || '',
  role: body.role || 'candidate',
  phone: String(body.phone || '').trim(),
  companyName: String(body.companyName || '').trim(),
  companyWebsite: String(body.companyWebsite || '').trim(),
  companyLogo: String(body.companyLogo || '').trim(),
  designation: String(body.designation || '').trim(),
  companySize: String(body.companySize || '').trim(),
  industryType: String(body.industryType || '').trim(),
  linkedinUrl: String(body.linkedinUrl || '').trim(),
  gstNumber: String(body.gstNumber || '').trim(),
  companyDescription: String(body.companyDescription || '').trim(),
  companyAddress: String(body.companyAddress || '').trim(),
});

const createRegisteredUser = async (payload) => {
  const {
    name,
    email,
    password,
    authProvider = 'local',
    providerId = '',
    profileImage = '',
    role,
    phone,
    companyName,
    companyWebsite,
    companyLogo,
    designation,
    companySize,
    industryType,
    linkedinUrl,
    gstNumber,
    companyDescription,
    companyAddress,
  } = payload;

  const user = await User.create({
    name,
    email,
    password,
    role,
    authProvider,
    providerId,
    recruiterStatus: role === 'recruiter' ? 'pending' : 'approved',
    emailVerified: true,
    profileImage,
    emailVerificationToken: null,
    contact: { phone },
  });

  if (user.role === 'recruiter') {
    const company = await Company.create({
      recruiterId: user._id,
      name: companyName,
      website: companyWebsite,
      logo: companyLogo,
      industryType,
      companySize,
      linkedinUrl,
      gstNumber,
      description: companyDescription,
      address: companyAddress,
      socialLinks: { linkedin: linkedinUrl },
      officeLocations: companyAddress ? [{ label: 'Head Office', address: companyAddress }] : [],
    });

    await RecruiterProfile.create({
      userId: user._id,
      companyId: company._id,
      phone,
      designation,
      linkedinUrl,
    });

    await Subscription.create({ recruiterId: user._id });
  } else {
    await CandidateProfile.create({
      userId: user._id,
      phone,
    });
  }

  return user;
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const payload = normalizeRegistrationPayload(req.body);

    // Validation
    if (!payload.name || !payload.email || !payload.password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    if (payload.password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    if (!['candidate', 'recruiter'].includes(payload.role)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid account type',
      });
    }

    const settings = await getOrCreateSettings();

    if (payload.role === 'candidate' && !settings.general?.allowCandidateRegistration) {
      return res.status(403).json({
        success: false,
        message: 'Candidate registration is currently disabled',
      });
    }

    if (payload.role === 'recruiter' && !settings.general?.allowRecruiterRegistration) {
      return res.status(403).json({
        success: false,
        message: 'Recruiter registration is currently disabled',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    if (!payload.phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    if (payload.role === 'recruiter' && (!payload.companyName || !payload.designation)) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter registration requires company name and designation',
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await PendingRegistration.findOneAndUpdate(
      { email: payload.email },
      {
        email: payload.email,
        otpHash: hashOtp(otp),
        payload,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { new: true, upsert: true, runValidators: true }
    );

    let emailSent = false;
    let emailError = '';

    try {
      await sendTemplateEmail('registrationOtp', payload.email, {
        name: payload.name,
        otp,
        minutes: 10,
      });
      emailSent = true;
    } catch (error) {
      emailError = error.message;
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }

    await logEvent({
      req,
      actor: { actorEmail: payload.email, actorRole: payload.role },
      action: 'auth.registration_otp_requested',
      category: 'auth',
      severity: emailSent ? 'info' : 'warning',
      message: `${payload.role} registration verification code requested`,
      metadata: { emailSent, role: payload.role },
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: payload.email,
      emailSent,
      ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOtp: otp, emailError } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const verifyRegistration = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const pending = await PendingRegistration.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (!pending) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please register again.' });
    }

    if ((pending.attempts || 0) >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
    }

    if (pending.otpHash !== hashOtp(otp)) {
      pending.attempts = (pending.attempts || 0) + 1;
      await pending.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await createRegisteredUser(pending.payload);
    await PendingRegistration.deleteOne({ _id: pending._id });

    await logEvent({
      req,
      actor: user,
      action: 'auth.registration_verified',
      category: 'auth',
      message: `${user.role} account created after email verification`,
      metadata: { role: user.role },
    });

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, authCookieOptions());

    const authUser = await buildAuthUser(user);

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully',
      token,
      user: authUser,
    });
  } catch (error) {
    next(error);
  }
};

const completeGoogleRecruiterRegistration = async (req, res, next) => {
  try {
    const {
      googleToken,
      phone,
      companyName,
      companyWebsite,
      designation,
    } = req.body;

    if (!googleToken) {
      return res.status(400).json({ success: false, message: 'Google verification is required' });
    }

    let googlePayload;
    try {
      googlePayload = jwt.verify(googleToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Google verification expired. Please try again.' });
    }

    if (googlePayload.purpose !== 'google_recruiter_setup' || !googlePayload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google verification token' });
    }

    const payload = normalizeRegistrationPayload({
      role: 'recruiter',
      name: googlePayload.name,
      email: googlePayload.email,
      phone,
      companyName,
      companyWebsite,
      designation,
    });

    if (!payload.phone || !payload.companyName || !payload.designation) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, company name, and designation are required',
      });
    }

    const settings = await getOrCreateSettings();
    if (!settings.general?.allowRecruiterRegistration) {
      return res.status(403).json({
        success: false,
        message: 'Recruiter registration is currently disabled',
      });
    }

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await createRegisteredUser({
      ...payload,
      authProvider: 'google',
      providerId: googlePayload.providerId || '',
      profileImage: googlePayload.profileImage || '',
    });

    await logEvent({
      req,
      actor: user,
      action: 'auth.google_recruiter_registration_submitted',
      category: 'auth',
      message: 'Recruiter registered with Google and is pending admin approval',
      metadata: { role: user.role, provider: 'google' },
    });

    res.status(201).json({
      success: true,
      message: 'Recruiter account submitted for admin approval',
      user: await buildAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await logEvent({
        req,
        actor: { actorEmail: String(email || '').toLowerCase(), actorRole: 'guest' },
        action: 'auth.login_failed',
        category: 'auth',
        severity: 'warning',
        message: 'Login failed for unknown email',
        metadata: { reason: 'user_not_found' },
      });
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address',
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      await logEvent({
        req,
        actor: user,
        action: 'auth.login_failed',
        category: 'auth',
        severity: 'warning',
        message: 'Login failed because password was invalid',
        metadata: { reason: 'invalid_password' },
      });
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    if (user.isBlocked) {
      await logEvent({
        req,
        actor: user,
        action: 'auth.login_failed',
        category: 'auth',
        severity: 'warning',
        message: 'Blocked account attempted to log in',
        metadata: { reason: 'account_blocked' },
      });

      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. Please contact support.',
      });
    }

    if (user.role === 'recruiter' && user.recruiterStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your recruiter account is pending admin approval.',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    res.cookie('token', token, authCookieOptions());

    const authUser = await buildAuthUser(user);

    await logEvent({
      req,
      actor: user,
      action: 'auth.login_success',
      category: 'auth',
      message: `${user.role} logged in`,
      metadata: { role: user.role },
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: authUser,
    });
  } catch (error) {
    next(error);
  }
};

const startGoogleAuth = async (req, res, next) => {
  try {
    if (!isGoogleAuthConfigured()) {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Google sign in is not configured yet',
      }));
    }

    const requestedRole = String(req.query.role || 'candidate').toLowerCase();
    const role = requestedRole === 'recruiter' ? 'recruiter' : 'candidate';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    authUrl.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: googleRedirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state: encodeGoogleState({ role }),
    }).toString();

    return res.redirect(authUrl.toString());
  } catch (error) {
    next(error);
  }
};

const exchangeGoogleCode = async (code) => {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed');
  }

  return tokenData.access_token;
};

const getGoogleProfile = async (accessToken) => {
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profileData = await profileResponse.json();
  if (!profileResponse.ok) {
    throw new Error(profileData.error_description || profileData.error || 'Google profile fetch failed');
  }

  return profileData;
};

const handleGoogleCallback = async (req, res, next) => {
  try {
    if (req.query.error) {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Google sign in was cancelled',
      }));
    }

    if (!isGoogleAuthConfigured() || !req.query.code) {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Google sign in could not be completed',
      }));
    }

    const state = decodeGoogleState(req.query.state);
    const requestedRole = state.role === 'recruiter' ? 'recruiter' : 'candidate';

    const accessToken = await exchangeGoogleCode(req.query.code);
    const googleProfile = await getGoogleProfile(accessToken);
    const email = String(googleProfile.email || '').trim().toLowerCase();

    if (!email || googleProfile.email_verified === false) {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Google account email is not verified',
      }));
    }

    let user = await User.findOne({ email }).select('+providerId');
    const isNewUser = !user;

    if (requestedRole === 'recruiter') {
      if (user) {
        if (user.role !== 'recruiter') {
          return res.redirect(redirectToFrontend('/login', {
            authError: 'This email is already registered as a candidate account',
          }));
        }

        if (user.isBlocked) {
          return res.redirect(redirectToFrontend('/login', {
            authError: 'Your account is blocked. Please contact support.',
          }));
        }

        const updates = {};
        if (!user.providerId && googleProfile.sub) updates.providerId = googleProfile.sub;
        if (user.authProvider !== 'google') updates.authProvider = 'google';
        if (!user.emailVerified) updates.emailVerified = true;
        if (!user.profileImage && googleProfile.picture) updates.profileImage = googleProfile.picture;

        if (Object.keys(updates).length) {
          user.set(updates);
          await user.save();
        }

        if (user.recruiterStatus !== 'approved') {
          return res.redirect(redirectToFrontend('/login', {
            authError: 'Your recruiter account is pending admin approval.',
          }));
        }

        const token = generateToken(user._id, user.role);
        res.cookie('token', token, authCookieOptions());

        await logEvent({
          req,
          actor: user,
          action: 'auth.google_login_success',
          category: 'auth',
          message: 'Recruiter logged in with Google',
          metadata: { role: user.role, provider: 'google' },
        });

        return res.redirect(redirectToFrontend('/oauth/callback', { token }));
      }

      const settings = await getOrCreateSettings();
      if (!settings.general?.allowRecruiterRegistration) {
        return res.redirect(redirectToFrontend('/login', {
          authError: 'Recruiter registration is currently disabled',
        }));
      }

      const setupToken = generateGoogleRecruiterSetupToken({
        email,
        name: googleProfile.name || email.split('@')[0],
        providerId: googleProfile.sub || '',
        profileImage: googleProfile.picture || '',
      });

      return res.redirect(redirectToFrontend('/register', {
        role: 'recruiter',
        googleToken: setupToken,
        email,
        name: googleProfile.name || email.split('@')[0],
      }));
    }

    if (!user) {
      const settings = await getOrCreateSettings();
      if (!settings.general?.allowCandidateRegistration) {
        return res.redirect(redirectToFrontend('/login', {
          authError: 'Candidate registration is currently disabled',
        }));
      }

      user = await User.create({
        name: googleProfile.name || email.split('@')[0],
        email,
        role: 'candidate',
        authProvider: 'google',
        providerId: googleProfile.sub || '',
        recruiterStatus: 'approved',
        emailVerified: true,
        profileImage: googleProfile.picture || '',
      });

      await CandidateProfile.create({
        userId: user._id,
        profileImage: googleProfile.picture || '',
      });
    } else {
      const updates = {};
      if (!user.providerId && googleProfile.sub) updates.providerId = googleProfile.sub;
      if (!user.emailVerified) updates.emailVerified = true;
      if (!user.profileImage && googleProfile.picture) updates.profileImage = googleProfile.picture;

      if (Object.keys(updates).length) {
        user.set(updates);
        await user.save();
      }
    }

    if (user.role !== 'candidate') {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Google sign in is only available for candidate accounts',
      }));
    }

    if (user.isBlocked) {
      return res.redirect(redirectToFrontend('/login', {
        authError: 'Your account is blocked. Please contact support.',
      }));
    }

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, authCookieOptions());

    await logEvent({
      req,
      actor: user,
      action: isNewUser ? 'auth.google_signup_success' : 'auth.google_login_success',
      category: 'auth',
      message: isNewUser ? 'Candidate signed up with Google' : `${user.role} logged in with Google`,
      metadata: { role: user.role, provider: 'google' },
    });

    return res.redirect(redirectToFrontend('/oauth/callback', { token }));
  } catch (error) {
    await logEvent({
      req,
      actor: { actorRole: 'guest' },
      action: 'auth.google_auth_failed',
      category: 'auth',
      severity: 'error',
      message: 'Google authentication failed',
      metadata: { error: error.message },
    });

    return res.redirect(redirectToFrontend('/login', {
      authError: 'Google sign in failed. Please try again.',
    }));
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const authUser = await buildAuthUser(user);

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        ...authUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * GET /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, contact, resume, profileImage } = req.body;

    const updateData = {
      name,
      bio,
      contact,
      profileImage,
    };

    if (req.userRole === 'candidate') {
      updateData.skills = skills;
      updateData.resume = resume;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, an OTP has been sent',
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    user.resetOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    user.resetOtpAttempts = 0;
    await user.save();

    let emailSent = false;
    let emailError = '';

    try {
      await sendTemplateEmail('passwordResetOtp', user.email, {
        name: user.name || 'there',
        otp,
        minutes: 10,
      });
      emailSent = true;
    } catch (error) {
      emailError = error.message;
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }

    await logEvent({
      req,
      actor: user,
      action: 'auth.password_reset_otp_requested',
      category: 'auth',
      severity: emailSent ? 'info' : 'warning',
      message: 'Password reset OTP requested',
      metadata: { emailSent },
    });

    res.status(200).json({
      success: true,
      message: 'If that email exists, an OTP has been sent',
      emailSent,
      ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOtp: otp, emailError } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and password are required' });
    }

    const user = await User.findOne({
      email,
      resetOtpExpires: { $gt: Date.now() },
    }).select('+password +resetOtpHash +resetOtpExpires +resetOtpAttempts');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if ((user.resetOtpAttempts || 0) >= 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP attempts. Please request a new OTP.' });
    }

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (otpHash !== user.resetOtpHash) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.password = password;
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyRegistration,
  login,
  startGoogleAuth,
  handleGoogleCallback,
  logout,
  profile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPasswordWithOtp,
  resetPassword,
  completeGoogleRecruiterRegistration,
};
