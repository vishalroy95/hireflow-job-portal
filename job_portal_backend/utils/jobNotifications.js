const Notification = require('../models/Notification');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');

const normalizeSkill = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9+#.]+/g, ' ')
  .trim();

const hasSkillMatch = (candidateSkills, jobSkills) => {
  const normalizedCandidateSkills = candidateSkills.map(normalizeSkill).filter(Boolean);
  const normalizedJobSkills = jobSkills.map(normalizeSkill).filter(Boolean);

  if (!normalizedJobSkills.length) return true;

  return normalizedCandidateSkills.some((candidateSkill) =>
    normalizedJobSkills.some((jobSkill) =>
      candidateSkill === jobSkill ||
      candidateSkill.includes(jobSkill) ||
      jobSkill.includes(candidateSkill)
    )
  );
};

const notifyCandidatesAboutNewJob = async (job) => {
  if (!job?._id) return;

  const skills = (job.skillsRequired || [])
    .map((skill) => String(skill).trim())
    .filter(Boolean);

  const candidates = await User.find({ role: 'candidate', isBlocked: { $ne: true } })
    .select('_id skills')
    .limit(500)
    .lean();

  if (!candidates.length) return;

  const profiles = await CandidateProfile.find({
    userId: { $in: candidates.map((candidate) => candidate._id) },
    'privacy.jobAlerts': { $ne: false },
  })
    .select('userId resumeParsed.skills privacy')
    .lean();

  const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const matchedCandidates = candidates
    .filter((candidate) => {
      const profile = profileByUserId.get(String(candidate._id));
      const candidateSkills = [
        ...(candidate.skills || []),
        ...(profile?.resumeParsed?.skills || []),
      ];

      return profile && hasSkillMatch(candidateSkills, skills);
    })
    .slice(0, 200);

  if (!matchedCandidates.length) return;

  await Notification.insertMany(
    matchedCandidates.map((candidate) => ({
      userId: candidate._id,
      type: 'job',
      title: 'New job matched your profile',
      message: `${job.company} posted ${job.title}${job.location ? ` in ${job.location}` : ''}.`,
      metadata: {
        jobId: job._id,
        company: job.company,
        location: job.location,
      },
    })),
    { ordered: false }
  );
};

const notifyCandidateAboutMatchingJobs = async (user, profile, limit = 10) => {
  if (!user?._id || profile?.privacy?.jobAlerts === false) return [];

  const candidateSkills = [
    ...(user.skills || []),
    ...(profile?.resumeParsed?.skills || []),
  ];

  if (!candidateSkills.length) return [];

  const jobs = await Job.find({
    active: true,
    status: 'active',
    adminDisabled: { $ne: true },
  })
    .select('title company location skillsRequired')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const matchedJobs = jobs
    .filter((job) => hasSkillMatch(candidateSkills, job.skillsRequired || []))
    .slice(0, limit);

  if (!matchedJobs.length) return [];

  const existingNotifications = await Notification.find({
    userId: user._id,
    type: 'job',
    'metadata.jobId': { $in: matchedJobs.map((job) => job._id) },
  })
    .select('metadata.jobId')
    .lean();

  const alreadyNotifiedJobIds = new Set(
    existingNotifications.map((notification) => String(notification.metadata?.jobId))
  );
  const newMatches = matchedJobs.filter((job) => !alreadyNotifiedJobIds.has(String(job._id)));

  if (!newMatches.length) return [];

  return Notification.insertMany(
    newMatches.map((job) => ({
      userId: user._id,
      type: 'job',
      title: 'Job alert matched your skills',
      message: `${job.company} is hiring for ${job.title}${job.location ? ` in ${job.location}` : ''}.`,
      metadata: {
        jobId: job._id,
        company: job.company,
        location: job.location,
      },
    })),
    { ordered: false }
  );
};

module.exports = {
  notifyCandidateAboutMatchingJobs,
  notifyCandidatesAboutNewJob,
};
