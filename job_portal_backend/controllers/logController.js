const SystemLog = require('../models/SystemLog');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSystemLogs = async (req, res, next) => {
  try {
    const {
      category,
      severity,
      actorRole,
      search,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (actorRole) query.actorRole = actorRole;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { action: regex },
        { message: regex },
        { actorEmail: regex },
        { 'metadata.jobTitle': regex },
        { 'metadata.company': regex },
      ];
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * pageSize;

    const [logs, total] = await Promise.all([
      SystemLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      SystemLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      logs,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemLogs,
};
