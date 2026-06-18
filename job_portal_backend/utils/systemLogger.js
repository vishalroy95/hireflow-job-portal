const SystemLog = require('../models/SystemLog');
const User = require('../models/User');

const SENSITIVE_KEYS = ['password', 'token', 'otp', 'secret', 'smtp', 'authorization', 'cookie'];

const getClientIp = (req) => {
  if (!req) return '';
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) return String(forwardedFor).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
};

const sanitizeMetadata = (value) => {
  if (!value || typeof value !== 'object') return value || {};

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  return Object.entries(value).reduce((safe, [key, item]) => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      safe[key] = '[redacted]';
      return safe;
    }

    safe[key] = typeof item === 'object' && item !== null ? sanitizeMetadata(item) : item;
    return safe;
  }, {});
};

const resolveActor = async (req, actor = {}) => {
  const actorId = actor.actorId || actor.id || req?.userId || null;
  let actorEmail = actor.actorEmail || actor.email || '';
  let actorRole = actor.actorRole || actor.role || req?.userRole || (actorId ? 'system' : 'guest');

  if (actorId && (!actorEmail || !actorRole || actorRole === 'system')) {
    const user = await User.findById(actorId).select('email role').lean();
    actorEmail = actorEmail || user?.email || '';
    actorRole = actorRole === 'system' ? user?.role || actorRole : actorRole;
  }

  return { actorId, actorEmail, actorRole };
};

const logEvent = async ({
  req,
  actor,
  action,
  category = 'system',
  severity = 'info',
  message,
  metadata = {},
}) => {
  try {
    if (!action || !message) return null;
    const resolvedActor = await resolveActor(req, actor);

    return SystemLog.create({
      ...resolvedActor,
      action,
      category,
      severity,
      message,
      metadata: sanitizeMetadata(metadata),
      ipAddress: getClientIp(req),
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (error) {
    console.error('[system-log] Failed to write log:', error.message);
    return null;
  }
};

module.exports = {
  logEvent,
};
