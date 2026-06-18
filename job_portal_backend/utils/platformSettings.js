const PlatformSettings = require('../models/PlatformSettings');

const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne({ key: 'platform' });

  if (!settings) {
    settings = await PlatformSettings.create({ key: 'platform' });
  }

  return settings;
};

const toPublicSettings = (settings) => ({
  general: {
    siteName: settings.general?.siteName,
    siteTitle: settings.general?.siteTitle,
    supportEmail: settings.general?.supportEmail,
    supportPhone: settings.general?.supportPhone,
    defaultCurrency: settings.general?.defaultCurrency,
    timezone: settings.general?.timezone,
    maintenanceMode: Boolean(settings.general?.maintenanceMode),
    allowCandidateRegistration: Boolean(settings.general?.allowCandidateRegistration),
    allowRecruiterRegistration: Boolean(settings.general?.allowRecruiterRegistration),
  },
  branding: {
    logoUrl: settings.branding?.logoUrl,
    bannerUrl: settings.branding?.bannerUrl,
    faviconUrl: settings.branding?.faviconUrl,
    primaryColor: settings.branding?.primaryColor,
    secondaryColor: settings.branding?.secondaryColor,
    footerText: settings.branding?.footerText,
  },
  currency: {
    baseCurrency: settings.currency?.baseCurrency || 'INR',
    usdRate: Number(settings.currency?.usdRate || 0.012),
  },
});

module.exports = {
  getOrCreateSettings,
  toPublicSettings,
};
