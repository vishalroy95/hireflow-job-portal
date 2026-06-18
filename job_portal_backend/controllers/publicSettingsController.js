const { getOrCreateSettings, toPublicSettings } = require('../utils/platformSettings');

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    res.json({
      success: true,
      settings: toPublicSettings(settings),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSettings,
};
