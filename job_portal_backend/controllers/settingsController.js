const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const SystemLog = require('../models/SystemLog');
const { getOrCreateSettings } = require('../utils/platformSettings');
const { logEvent } = require('../utils/systemLogger');

const uploadDir = path.join(__dirname, '..', 'uploads', 'branding');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageOnly = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }

  return cb(null, true);
};

const uploadBrandingAsset = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const allowedSections = ['general', 'branding', 'email', 'currency', 'ai', 'payments'];

const getSettings = async (req, res, next) => {
  try {
    const [settings, totalAnalyses, aiLogCount] = await Promise.all([
      getOrCreateSettings(),
      ResumeAnalysis.countDocuments(),
      SystemLog.countDocuments({ category: 'ai' }),
    ]);

    res.json({
      success: true,
      settings,
      usage: {
        ai: {
          totalAnalyses,
          logCount: aiLogCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSettingsSection = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!allowedSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section',
      });
    }

    const settings = await getOrCreateSettings();
    const currentSection = settings[section]?.toObject?.() || settings[section] || {};

    settings.set(section, {
      ...currentSection,
      ...req.body,
    });

    await settings.save();

    await logEvent({
      req,
      action: 'settings.updated',
      category: 'admin',
      message: `Admin updated ${section} settings`,
      metadata: {
        section,
        fields: Object.keys(req.body || {}),
      },
    });

    res.json({
      success: true,
      message: `${section} settings saved`,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const saveAsset = (field) => async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    const settings = await getOrCreateSettings();
    const fileUrl = `/uploads/branding/${req.file.filename}`;

    settings.set('branding', {
      ...(settings.branding?.toObject?.() || settings.branding || {}),
      [field]: fileUrl,
    });

    await settings.save();

    await logEvent({
      req,
      action: 'settings.branding_asset_uploaded',
      category: 'admin',
      message: `Admin uploaded ${field === 'logoUrl' ? 'logo' : 'banner'} asset`,
      metadata: {
        field,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    res.json({
      success: true,
      message: 'Branding asset uploaded',
      url: fileUrl,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettingsSection,
  uploadBrandingAsset,
  uploadLogo: saveAsset('logoUrl'),
  uploadBanner: saveAsset('bannerUrl'),
};
