const CandidateProfile = require('../models/CandidateProfile');

const idString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const buildCandidatePrivacyMap = async (applications) => {
  const userIds = [
    ...new Set(
      applications
        .map((application) => idString(application.userId))
        .filter(Boolean)
    ),
  ];

  if (!userIds.length) return new Map();

  const profiles = await CandidateProfile.find({ userId: { $in: userIds } }).select('userId privacy');
  return new Map(profiles.map((profile) => [idString(profile.userId), profile.privacy || {}]));
};

const applyCandidatePrivacy = (application, privacyMap) => {
  const applicationObject = application.toObject ? application.toObject() : { ...application };
  const candidateId = idString(applicationObject.userId);
  const privacy = privacyMap.get(candidateId) || {};
  const showContactInfo = privacy.showContactInfo !== false;
  const visibleToRecruiters = privacy.visibleToRecruiters !== false;

  applicationObject.candidatePrivacy = {
    visibleToRecruiters,
    showContactInfo,
  };

  if (!showContactInfo && applicationObject.userId) {
    applicationObject.userId.email = '';
    applicationObject.userId.contact = {};
    applicationObject.userId.contactHidden = true;
  }

  return applicationObject;
};

const applyCandidatePrivacyToApplications = async (applications) => {
  const privacyMap = await buildCandidatePrivacyMap(applications);
  return applications.map((application) => applyCandidatePrivacy(application, privacyMap));
};

module.exports = {
  applyCandidatePrivacyToApplications,
};
