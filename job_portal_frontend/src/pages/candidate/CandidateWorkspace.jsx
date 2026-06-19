import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiCpu,
  FiDownload,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiLock,
  FiLink,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlusCircle,
  FiSettings,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { applicationService, candidateService } from '../../services/api'
import { formatSalary, getSalaryDisplayOptions } from '../../utils/currency'
import { downloadUpload, isDataUrl, openUpload, resolveUploadUrl } from '../../utils/uploads'
import { useLocationPreference } from '../../context/LocationContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'applied', label: 'Applied Jobs', icon: FiBriefcase },
  { id: 'favorites', label: 'Favorite Jobs', icon: FiBookmark },
  { id: 'settings', label: 'Settings', icon: FiSettings },
]

const stats = [
  { label: 'Applied jobs', value: 0, icon: FiBriefcase, className: 'bg-blue-50 text-primary' },
  { label: 'Favorite jobs', value: 0, icon: FiBookmark, className: 'bg-amber-50 text-amber-500' },
  { label: 'Unread Updates', value: 0, icon: FiBell, className: 'bg-emerald-50 text-emerald-500' },
]

const defaultSettingsForm = {
  name: '',
  email: '',
  headline: '',
  phone: '',
  location: '',
  profileImage: '',
  portfolioUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  skills: '',
  bio: '',
  educationDegree: '',
  educationInstitution: '',
  educationStartYear: '',
  educationEndYear: '',
  experienceTitle: '',
  experienceCompany: '',
  experienceStartDate: '',
  experienceEndDate: '',
  privacyVisibleToRecruiters: true,
  privacyShowContactInfo: true,
  privacyJobAlerts: true,
}

const buildSettingsForm = (user = {}, profile = {}) => {
  const education = profile.education?.[0] || {}
  const experience = profile.experience?.[0] || {}

  return {
    ...defaultSettingsForm,
    name: user.name || '',
    email: user.email || '',
    headline: profile.resumeParsed?.headline || '',
    phone: profile.phone || user.contact?.phone || '',
    location: profile.location || '',
    profileImage: profile.profileImage || user.profileImage || '',
    portfolioUrl: profile.portfolioUrl || user.contact?.portfolio || '',
    linkedinUrl: profile.linkedinUrl || user.contact?.linkedin || '',
    githubUrl: profile.githubUrl || user.contact?.github || '',
    skills: (user.skills || profile.resumeParsed?.skills || []).join(', '),
    bio: user.bio || '',
    educationDegree: education.degree || '',
    educationInstitution: education.institution || '',
    educationStartYear: education.startYear || '',
    educationEndYear: education.endYear || '',
    experienceTitle: experience.title || '',
    experienceCompany: experience.company || '',
    experienceStartDate: experience.startDate || '',
    experienceEndDate: experience.endDate || '',
    privacyVisibleToRecruiters: profile.privacy?.visibleToRecruiters !== false,
    privacyShowContactInfo: profile.privacy?.showContactInfo !== false,
    privacyJobAlerts: profile.privacy?.jobAlerts !== false,
  }
}

const formatDate = (value) => {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getResumeFileName = (resumePath = '', resumeFile = {}) => {
  if (resumeFile?.originalName) return resumeFile.originalName
  const fileName = String(resumePath).split('/').pop() || 'Uploaded resume'
  return decodeURIComponent(fileName)
}

const jobLogo = (job) => (job?.company || job?.title || 'HF').slice(0, 2).toUpperCase()

const applicationStatusLabels = {
  pending: 'Pending',
  applied: 'Applied',
  'under-review': 'Under Review',
  shortlisted: 'Shortlisted',
  'interview-scheduled': 'Interview Scheduled',
  selected: 'Selected',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

const applicationStatusClasses = {
  pending: 'bg-slate-100 text-slate-600',
  applied: 'bg-blue-50 text-blue-700',
  'under-review': 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-emerald-50 text-emerald-700',
  'interview-scheduled': 'bg-indigo-50 text-indigo-700',
  selected: 'bg-cyan-50 text-cyan-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

const ApplicationStatusBadge = ({ status = 'pending' }) => (
  <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${applicationStatusClasses[status] || applicationStatusClasses.pending}`}>
    {applicationStatusLabels[status] || status}
  </span>
)

const mapJob = (job = {}, extra = {}, salaryOptions = {}) => ({
  id: job._id,
  title: job.title || 'Job opening',
  company: job.company || 'Company',
  type: job.jobType || job.workplaceType || 'Full Time',
  location: job.location || 'Location not added',
  salary: formatSalary(job.salary, salaryOptions) || 'Salary not disclosed',
  date: formatDate(job.createdAt || extra.date),
  logo: jobLogo(job),
  logoClass: 'bg-slate-950 text-white',
  ...extra,
})

const mapApplication = (application, salaryOptions = {}) => mapJob(application.jobId, {
  applicationId: application._id,
  date: formatDate(application.appliedAt || application.createdAt),
  status: application.status || 'pending',
  skillMatch: application.resumeAnalysis?.matchScore ?? application.skillMatch ?? 0,
  aiSummary: application.resumeAnalysis?.summary || application.aiScreening?.summary || '',
  aiAnalysis: application.resumeAnalysis || null,
}, salaryOptions)

const CandidateWorkspace = () => {
  const { user, setUser, logout } = useAuth()
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = useMemo(
    () => getSalaryDisplayOptions(settings, selectedCountry),
    [settings, selectedCountry]
  )
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [settingsTab, setSettingsTab] = useState('personal')
  const [showCvModal, setShowCvModal] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [profileImageUploading, setProfileImageUploading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [analyzingApplicationId, setAnalyzingApplicationId] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const candidateName = dashboardData?.user?.name || user?.name || 'Candidate'
  const appliedRows = useMemo(
    () => (dashboardData?.applications || []).map((application) => mapApplication(application, salaryOptions)),
    [dashboardData, salaryOptions]
  )
  const savedRows = useMemo(
    () => (dashboardData?.savedJobs || []).map((job) => mapJob(job, {}, salaryOptions)),
    [dashboardData, salaryOptions]
  )
  const currentResume = dashboardData?.profile?.resume || dashboardData?.user?.resume || ''
  const currentResumeFile = dashboardData?.profile?.resumeFile || {}
  const currentUser = dashboardData?.user || user || {}
  const currentProfile = dashboardData?.profile || {}

  const dashboardStats = useMemo(() => {
    const backendStats = dashboardData?.stats
    if (!backendStats) return stats

    return [
      { label: 'Applied jobs', value: backendStats.appliedJobs || 0, icon: FiBriefcase, className: 'bg-blue-50 text-primary' },
      { label: 'Favorite jobs', value: backendStats.savedJobs || 0, icon: FiBookmark, className: 'bg-amber-50 text-amber-500' },
      { label: 'Unread Updates', value: backendStats.unreadNotifications || 0, icon: FiBell, className: 'bg-emerald-50 text-emerald-500' },
    ]
  }, [dashboardData])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await candidateService.getDashboard()
      setDashboardData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Candidate workspace data is loaded from the backend when the route opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard()
  }, [])

  useEffect(() => {
    const requestedTab = searchParams.get('tab')
    const requestedSection = searchParams.get('section')

    if (requestedTab === 'settings' || requestedSection === 'resume') {
      queueMicrotask(() => {
        setActiveTab('settings')
        setSettingsTab('personal')
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (loading || activeTab !== 'settings' || settingsTab !== 'personal') return
    if (searchParams.get('section') !== 'resume') return

    window.requestAnimationFrame(() => {
      document.getElementById('resume-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }, [activeTab, loading, searchParams, settingsTab])

  const handleResumeUpload = async (file) => {
    if (!file) {
      toast.error('Please select a PDF resume')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF resumes are allowed')
      return
    }

    try {
      setResumeUploading(true)
      await candidateService.uploadResume(file)
      await fetchDashboard()
      setShowCvModal(false)
      toast.success('Resume uploaded successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume upload failed')
    } finally {
      setResumeUploading(false)
    }
  }

  const handleProfileImageUpload = async (file) => {
    if (!file) return

    try {
      setProfileImageUploading(true)
      const response = await candidateService.uploadProfileImage(file)
      const uploadedImage = response.data.filePath
      if (uploadedImage) {
        setUser((previous) => previous ? { ...previous, profileImage: uploadedImage } : previous)
        setDashboardData((previous) => previous ? {
          ...previous,
          user: { ...(previous.user || {}), profileImage: uploadedImage },
          profile: { ...(previous.profile || {}), profileImage: uploadedImage },
        } : previous)
      }
      await fetchDashboard()
      toast.success('Profile photo updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile photo upload failed')
    } finally {
      setProfileImageUploading(false)
    }
  }

  const handleSettingsSave = async (form) => {
    const payload = {
      name: form.name,
      headline: form.headline,
      phone: form.phone,
      location: form.location,
      portfolioUrl: form.portfolioUrl,
      linkedinUrl: form.linkedinUrl,
      githubUrl: form.githubUrl,
      skills: form.skills,
      bio: form.bio,
      education: form.educationDegree || form.educationInstitution
        ? [{
            degree: form.educationDegree,
            institution: form.educationInstitution,
            startYear: form.educationStartYear,
            endYear: form.educationEndYear,
          }]
        : [],
      experience: form.experienceTitle || form.experienceCompany
        ? [{
            title: form.experienceTitle,
            company: form.experienceCompany,
            startDate: form.experienceStartDate,
            endDate: form.experienceEndDate,
          }]
        : [],
      privacy: {
        visibleToRecruiters: form.privacyVisibleToRecruiters,
        showContactInfo: form.privacyShowContactInfo,
        jobAlerts: form.privacyJobAlerts,
      },
    }

    try {
      setSettingsSaving(true)
      await candidateService.updateProfile(payload)
      await fetchDashboard()
      toast.success('Profile settings saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  const handlePasswordChange = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (!currentPassword || !newPassword) {
      toast.error('Current and new password are required')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    try {
      setSettingsSaving(true)
      await candidateService.changePassword({ currentPassword, newPassword })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account permanently? This cannot be undone.')
    if (!confirmed) return

    try {
      setSettingsSaving(true)
      await candidateService.deleteAccount()
      logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleToggleSavedJob = async (jobId) => {
    try {
      const response = await candidateService.toggleSavedJob(jobId)
      await fetchDashboard()
      toast.success(response.data.saved ? 'Job saved' : 'Job removed from saved jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update saved job')
    }
  }

  const handleAnalyzeApplication = async (applicationId) => {
    if (!applicationId) return

    try {
      setAnalyzingApplicationId(applicationId)
      const response = await applicationService.analyzeApplication(applicationId)
      await fetchDashboard()
      toast.success(response.data.cached ? 'Resume analysis loaded' : 'Resume analysis completed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume analysis failed')
    } finally {
      setAnalyzingApplicationId('')
    }
  }

  return (
    <MainLayout fullBleed hideFooter>
      <div className="bg-[#F5F7FB] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto min-h-[760px] max-w-[1440px] overflow-hidden rounded-[8px] border border-slate-200 bg-white">
        <div className="grid min-h-[760px] lg:grid-cols-[280px_1fr]">
          <DashboardSidebar
            activeTab={activeTab}
            onChange={setActiveTab}
            onLogout={logout}
          />

          <main className="px-5 py-8 lg:px-10">
            {error && <Error message={error} onRetry={fetchDashboard} />}
            {loading ? (
              <Loading message="Loading candidate workspace..." />
            ) : (
              <>
            {activeTab === 'overview' && (
              <OverviewPage
                appliedRows={appliedRows}
                candidateName={candidateName}
                profileCompletion={dashboardData?.stats?.profileCompletion || 0}
                profileImage={currentProfile.profileImage || currentUser.profileImage || ''}
                stats={dashboardStats}
                onNavigate={setActiveTab}
                onAnalyzeApplication={handleAnalyzeApplication}
                analyzingApplicationId={analyzingApplicationId}
              />
            )}
            {activeTab === 'applied' && (
              <AppliedJobsPage
                rows={appliedRows}
                onAnalyzeApplication={handleAnalyzeApplication}
                analyzingApplicationId={analyzingApplicationId}
              />
            )}
            {activeTab === 'favorites' && <FavoriteJobsPage rows={savedRows} onToggleSavedJob={handleToggleSavedJob} />}
            {activeTab === 'settings' && (
              <SettingsPage
                activeSettingsTab={settingsTab}
                currentResume={currentResume}
                currentResumeFile={currentResumeFile}
                loading={settingsSaving}
                profile={currentProfile}
                profileImageUploading={profileImageUploading}
                user={currentUser}
                onAddCv={() => setShowCvModal(true)}
                onDeleteAccount={handleDeleteAccount}
                onPasswordChange={handlePasswordChange}
                onProfileImageUpload={handleProfileImageUpload}
                onSave={handleSettingsSave}
                onSettingsTabChange={setSettingsTab}
              />
            )}
              </>
            )}
          </main>
        </div>
      </div>

      {showCvModal && <AddCvModal loading={resumeUploading} onClose={() => setShowCvModal(false)} onUpload={handleResumeUpload} />}
      </div>
    </MainLayout>
  )
}

const DashboardSidebar = ({ activeTab, onChange, onLogout }) => (
  <aside className="flex min-h-full flex-col border-r border-slate-200 bg-white px-5 py-6">
    <p className="mb-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Candidate Dashboard</p>
    <nav className="space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const active = activeTab === item.id

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex h-12 w-full items-center justify-between rounded-[4px] px-4 text-sm font-medium transition ${
              active ? 'border-l-2 border-primary bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>

    <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-primary">
      <FiLogOut className="h-5 w-5" />
      Log-out
    </button>
  </aside>
)

const OverviewPage = ({
  appliedRows,
  candidateName,
  profileCompletion,
  profileImage,
  stats: dashboardStats,
  onNavigate,
  onAnalyzeApplication,
  analyzingApplicationId,
}) => (
  <section>
    <div className="mb-6">
      <h1 className="text-xl font-semibold">Hello, {candidateName}</h1>
      <p className="mt-1 text-sm text-slate-500">Here is your daily activity and application progress</p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {dashboardStats.map((stat) => {
        const Icon = stat.icon
        return (
          <article key={stat.label} className={`flex items-center justify-between rounded-[8px] p-6 ${stat.className}`}>
            <div>
              <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[4px] bg-white">
              <Icon className="h-6 w-6" />
            </div>
          </article>
        )
      })}
    </div>

    <section className={`mt-6 flex flex-col gap-5 rounded-[6px] p-6 text-white sm:flex-row sm:items-center sm:justify-between ${
      profileCompletion >= 100 ? 'bg-emerald-500' : 'bg-red-500'
    }`}>
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-white/40 bg-white/20">
          {profileImage && (
            <img src={resolveUploadUrl(profileImage)} alt={candidateName} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {profileCompletion >= 100 ? 'Congratulations, your profile is complete!' : 'Your profile editing is not completed.'}
          </h2>
          <p className={`mt-1 text-sm ${profileCompletion >= 100 ? 'text-emerald-50' : 'text-red-50'}`}>
            {profileCompletion >= 100
              ? 'You are ready to apply faster and stand out to recruiters.'
              : `Profile completion: ${profileCompletion}%. Complete your profile & build your resume.`}
          </p>
        </div>
      </div>
      <button
        onClick={() => onNavigate(profileCompletion >= 100 ? 'applied' : 'settings')}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-white px-5 text-sm font-semibold ${
          profileCompletion >= 100 ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'
        }`}
      >
        {profileCompletion >= 100 ? (
          <>
            View Applications <FiCheckCircle className="h-4 w-4" />
          </>
        ) : (
          <>
            Edit Profile <FiChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </section>

    <section className="mt-7">
      <SectionHeader title="Recently Applied" action="View all" onClick={() => onNavigate('applied')} />
      <AppliedTable
        rows={appliedRows.slice(0, 4)}
        onAnalyzeApplication={onAnalyzeApplication}
        analyzingApplicationId={analyzingApplicationId}
      />
    </section>
  </section>
)

const AppliedJobsPage = ({ rows, onAnalyzeApplication, analyzingApplicationId }) => (
  <section>
    <h1 className="mb-5 text-xl font-semibold">Applied Jobs <span className="text-slate-400">({rows.length})</span></h1>
    <AppliedTable
      rows={rows}
      paginated
      onAnalyzeApplication={onAnalyzeApplication}
      analyzingApplicationId={analyzingApplicationId}
    />
  </section>
)

const FavoriteJobsPage = ({ rows, onToggleSavedJob }) => (
  <section>
    <h1 className="mb-5 text-xl font-semibold">Favorite Jobs <span className="text-slate-400">({rows.length})</span></h1>
    <div className="space-y-1">
      {rows.map((job, index) => (
        <JobListRow key={job.id || `${job.title}-${index}`} job={job} onToggleSavedJob={onToggleSavedJob} showDeadline />
      ))}
      {rows.length === 0 && <EmptyDashboardState message="No saved jobs yet." />}
    </div>
    {rows.length > 0 && <Pagination />}
  </section>
)

const SettingsPage = ({
  activeSettingsTab,
  currentResume,
  currentResumeFile,
  loading,
  profile,
  profileImageUploading,
  user,
  onAddCv,
  onDeleteAccount,
  onPasswordChange,
  onProfileImageUpload,
  onSave,
  onSettingsTabChange,
}) => {
  const [settingsForm, setSettingsForm] = useState(() => buildSettingsForm(user, profile))
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const tabs = [
    { id: 'personal', label: 'Personal', icon: FiUser },
    { id: 'profile', label: 'Profile', icon: FiBriefcase },
    { id: 'social', label: 'Social Links', icon: FiGlobe },
    { id: 'account', label: 'Account Setting', icon: FiSettings },
  ]

  useEffect(() => {
    // Backend profile refreshes update the controlled settings fields.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettingsForm(buildSettingsForm(user, profile))
  }, [user, profile])

  const updateField = (field, value) => {
    setSettingsForm((current) => ({ ...current, [field]: value }))
  }

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(settingsForm)
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    await onPasswordChange(passwordForm)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Setting</h1>
      <div className="mb-7 flex flex-wrap gap-8 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeSettingsTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onSettingsTabChange(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold ${active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-950'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeSettingsTab === 'personal' && (
        <PersonalSettings
          currentResume={currentResume}
          currentResumeFile={currentResumeFile}
          loading={loading}
          profileImageUploading={profileImageUploading}
          settingsForm={settingsForm}
          onAddCv={onAddCv}
          onChange={updateField}
          onProfileImageUpload={onProfileImageUpload}
          onSubmit={handleSubmit}
        />
      )}
      {activeSettingsTab === 'profile' && <ProfileSettings loading={loading} settingsForm={settingsForm} onChange={updateField} onSubmit={handleSubmit} />}
      {activeSettingsTab === 'social' && <SocialLinksSettings loading={loading} settingsForm={settingsForm} onChange={updateField} onSubmit={handleSubmit} />}
      {activeSettingsTab === 'account' && (
        <AccountSettings
          loading={loading}
          passwordForm={passwordForm}
          settingsForm={settingsForm}
          onChange={updateField}
          onDeleteAccount={onDeleteAccount}
          onPasswordChange={updatePasswordField}
          onPasswordSubmit={handlePasswordSubmit}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  )
}

const PersonalSettings = ({ currentResume, currentResumeFile, loading, profileImageUploading, settingsForm, onAddCv, onChange, onProfileImageUpload, onSubmit }) => (
  <form onSubmit={onSubmit}>
    <h2 className="mb-5 text-lg font-semibold">Basic Information</h2>
    <div className="grid gap-7 lg:grid-cols-[220px_1fr]">
      <div>
        <p className="mb-2 text-sm font-medium">Profile Picture</p>
        <label className="flex h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[6px] border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-primary hover:bg-blue-50">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onProfileImageUpload(event.target.files?.[0])}
          />
          {settingsForm.profileImage ? (
            <img src={resolveUploadUrl(settingsForm.profileImage)} alt={settingsForm.name || 'Candidate'} className="h-full w-full object-cover" />
          ) : (
            <>
              <FiUploadCloud className="mb-3 h-8 w-8 text-slate-400" />
              <span className="font-medium text-slate-700">{profileImageUploading ? 'Uploading photo...' : 'Browse photo'}</span>
              <span>or drop here</span>
              <span className="mt-2 text-xs">A photo larger than 400 pixels works best.</span>
            </>
          )}
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Full name" value={settingsForm.name} onChange={(event) => onChange('name', event.target.value)} />
        <TextInput label="Title/headline" value={settingsForm.headline} onChange={(event) => onChange('headline', event.target.value)} />
        <SelectInput label="Experience" value={settingsForm.experienceTitle} onChange={(event) => onChange('experienceTitle', event.target.value)} options={['Fresher', '1-3 years', '3-5 years', '5+ years']} />
        <SelectInput label="Educations" value={settingsForm.educationDegree} onChange={(event) => onChange('educationDegree', event.target.value)} options={['High School', 'Bachelor', 'Master', 'Doctorate']} />
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Personal Website</span>
          <div className="relative">
            <FiLink className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              value={settingsForm.portfolioUrl}
              onChange={(event) => onChange('portfolioUrl', event.target.value)}
              placeholder="Website url..."
              className="h-11 w-full rounded-[4px] border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </label>
        <SaveButton loading={loading} />
      </div>
    </div>

    <div id="resume-section" className="mt-10 scroll-mt-8 rounded-[8px] border border-blue-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Resume</p>
          <h2 className="mt-1 text-lg font-semibold">Your CV/Resume</h2>
        </div>
        <button type="button" onClick={onAddCv} className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700">
          <FiUploadCloud className="h-4 w-4" />
          Update Resume
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
      {currentResume ? (
        <div className="rounded-[6px] border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[4px] bg-white text-primary ring-1 ring-blue-100">
              <FiFileText className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">Current resume</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-700" title={getResumeFileName(currentResume, currentResumeFile)}>
                {getResumeFileName(currentResume, currentResumeFile)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {[formatFileSize(currentResumeFile?.size), currentResumeFile?.uploadedAt ? `Uploaded ${formatDate(currentResumeFile.uploadedAt)}` : 'Saved in profile'].filter(Boolean).join(' . ')}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400" title={isDataUrl(currentResume) ? 'Stored securely in profile' : currentResume}>
                {isDataUrl(currentResume) ? 'Stored securely in profile' : currentResume}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openUpload(currentResume)}
              className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Resume
            </button>
            <button
              type="button"
              onClick={() => downloadUpload(currentResume, getResumeFileName(currentResume, currentResumeFile))}
              className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-white px-4 text-sm font-semibold text-primary ring-1 ring-blue-100 hover:bg-blue-50"
            >
              <FiDownload className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[6px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          No resume uploaded yet. Add your latest PDF so recruiters can review it with applications.
        </div>
      )}
      <button type="button" onClick={onAddCv} className="flex items-center gap-3 rounded-[6px] border border-dashed border-slate-300 p-4 text-left hover:border-primary hover:bg-blue-50">
        <FiPlusCircle className="h-6 w-6 text-primary" />
        <span>
          <span className="block text-sm font-semibold">Add Cv/Resume</span>
          <span className="text-xs text-slate-500">Browse file or drop here, only pdf</span>
        </span>
      </button>
      </div>
    </div>
  </form>
)

const ProfileSettings = ({ loading, settingsForm, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="max-w-5xl">
    <div className="grid gap-5 md:grid-cols-2">
      <TextInput label="Skills" value={settingsForm.skills} onChange={(event) => onChange('skills', event.target.value)} placeholder="React, Node.js, UI Design" />
      <TextInput label="Location" value={settingsForm.location} onChange={(event) => onChange('location', event.target.value)} />
      <TextInput label="Education institution" value={settingsForm.educationInstitution} onChange={(event) => onChange('educationInstitution', event.target.value)} />
      <TextInput label="Education end year" value={settingsForm.educationEndYear} onChange={(event) => onChange('educationEndYear', event.target.value)} />
      <TextInput label="Experience title" value={settingsForm.experienceTitle} onChange={(event) => onChange('experienceTitle', event.target.value)} />
      <TextInput label="Experience company" value={settingsForm.experienceCompany} onChange={(event) => onChange('experienceCompany', event.target.value)} />
    </div>

    <label className="mt-5 block">
      <span className="mb-2 block text-sm font-medium">Biography</span>
      <textarea
        value={settingsForm.bio}
        onChange={(event) => onChange('bio', event.target.value)}
        placeholder="Write down your biography here. Let the employers know who you are..."
        className="min-h-[230px] w-full resize-y rounded-t-[4px] border border-b-0 border-slate-200 px-4 py-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex items-center gap-1 rounded-b-[4px] border border-slate-200 px-4 py-2 text-slate-400">
        {['B', 'I', 'U', 'S', '🔗', '≡', '1.'].map((item) => (
          <button key={item} type="button" className="flex h-8 w-8 items-center justify-center rounded-[4px] text-sm hover:bg-blue-50 hover:text-primary">
            {item}
          </button>
        ))}
      </div>
    </label>

    <SaveButton loading={loading} />
  </form>
)

const SocialLinksSettings = ({ loading, settingsForm, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="max-w-5xl">
    <div className="space-y-5">
      <IconTextInput label="LinkedIn" icon={FiLink} value={settingsForm.linkedinUrl} onChange={(event) => onChange('linkedinUrl', event.target.value)} placeholder="https://linkedin.com/in/..." />
      <IconTextInput label="GitHub" icon={FiLink} value={settingsForm.githubUrl} onChange={(event) => onChange('githubUrl', event.target.value)} placeholder="https://github.com/..." />
      <IconTextInput label="Portfolio" icon={FiLink} value={settingsForm.portfolioUrl} onChange={(event) => onChange('portfolioUrl', event.target.value)} placeholder="https://your-portfolio.com" />
    </div>

    <SaveButton loading={loading} />
  </form>
)

const AccountSettings = ({ loading, passwordForm, settingsForm, onChange, onDeleteAccount, onPasswordChange, onPasswordSubmit, onSubmit }) => (
  <section className="max-w-5xl space-y-8">
    <form onSubmit={onSubmit}>
      <h2 className="mb-5 text-lg font-semibold">Contact Info</h2>
      <TextInput label="Map Location" value={settingsForm.location} onChange={(event) => onChange('location', event.target.value)} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <IconTextInput label="Phone" icon={FiPhone} value={settingsForm.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="Phone number..." />
        <IconTextInput label="Email" icon={FiMail} value={settingsForm.email} placeholder="Email address" readOnly />
      </div>
      <SaveButton compact loading={loading} />
    </form>

    <Divider />

    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Privacy & alerts</h2>
          <p className="mt-1 text-sm text-slate-500">Control what recruiters can see and which job updates you receive.</p>
        </div>
        <SaveButton compact loading={loading} label="Save Privacy" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['Allow recruiters to view my profile', 'privacyVisibleToRecruiters'],
          ['Show my contact information to recruiters', 'privacyShowContactInfo'],
          ['Send me matching job alerts', 'privacyJobAlerts'],
        ].map(([label, field]) => (
          <CheckboxRow key={field} label={label} checked={settingsForm[field]} onChange={(event) => onChange(field, event.target.checked)} />
        ))}
      </div>
    </form>

    <Divider />

    <form onSubmit={onPasswordSubmit}>
      <h2 className="mb-4 text-lg font-semibold">Change Password</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <IconTextInput label="Current Password" icon={FiLock} value={passwordForm.currentPassword} onChange={(event) => onPasswordChange('currentPassword', event.target.value)} placeholder="Password" type="password" />
        <IconTextInput label="New Password" icon={FiLock} value={passwordForm.newPassword} onChange={(event) => onPasswordChange('newPassword', event.target.value)} placeholder="Password" type="password" />
        <IconTextInput label="Confirm Password" icon={FiLock} value={passwordForm.confirmPassword} onChange={(event) => onPasswordChange('confirmPassword', event.target.value)} placeholder="Password" type="password" />
      </div>
      <SaveButton compact loading={loading} label="Change Password" />
    </form>

    <Divider />

    <div>
      <h2 className="mb-2 text-lg font-semibold">Delete Your Account</h2>
      <p className="max-w-2xl text-sm leading-6 text-slate-500">
        If you delete your account, you will no longer be able to access applications, saved jobs, messages, or notifications.
      </p>
      <button type="button" onClick={onDeleteAccount} className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600">
        <FiTrash2 className="h-4 w-4" />
        Close Account
      </button>
    </div>
  </section>
)

const AppliedTable = ({ rows, paginated = false, onAnalyzeApplication, analyzingApplicationId }) => (
  <div className="overflow-hidden rounded-[6px] border border-slate-100 bg-white">
    <div className="grid grid-cols-[1.5fr_0.9fr_0.6fr_0.7fr] bg-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
      <span>Jobs</span>
      <span>Date Applied</span>
      <span>Status</span>
      <span className="text-right">Action</span>
    </div>
    {rows.length === 0 && <EmptyDashboardState message="No applications yet." />}
    {rows.map((job, index) => (
      <article key={`${job.title}-${index}`} className={`grid grid-cols-1 gap-4 border-t border-slate-100 px-5 py-4 md:grid-cols-[1.5fr_0.9fr_0.6fr_0.7fr] md:items-center ${job.highlighted ? 'rounded-[4px] border border-primary shadow-[0_14px_35px_rgba(10,102,194,0.10)]' : ''}`}>
        <JobIdentity job={job} />
        <p className="text-sm text-slate-500">{job.date}</p>
        <ApplicationStatusBadge status={job.status} />
        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => onAnalyzeApplication?.(job.applicationId)}
            disabled={!job.applicationId || analyzingApplicationId === job.applicationId}
            className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-primary transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCpu className="h-4 w-4" />
            {analyzingApplicationId === job.applicationId ? 'Analyzing...' : job.aiAnalysis ? 'View AI Match' : 'Analyze Resume'}
          </button>
          <Link to={job.id ? `/jobs/${job.id}` : '/jobs'} className={`inline-flex h-10 items-center rounded-[4px] px-5 text-sm font-semibold ${job.highlighted ? 'bg-primary text-white' : 'bg-slate-100 text-primary hover:bg-blue-50'}`}>View Details</Link>
        </div>
        {(job.aiAnalysis || job.aiSummary) && (
          <div className="rounded-[6px] border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-600 md:col-span-4">
            <span className="font-semibold text-primary">AI match {job.skillMatch}%:</span> {job.aiSummary || 'Resume analysis is ready.'}
          </div>
        )}
      </article>
    ))}
    {paginated && <Pagination />}
  </div>
)

const EmptyDashboardState = ({ message }) => (
  <div className="bg-white px-5 py-10 text-center text-sm text-slate-500">
    {message}
  </div>
)

const JobListRow = ({ job, onToggleSavedJob, showDeadline = false }) => (
  <article className={`grid grid-cols-1 gap-4 border-b border-slate-100 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center ${job.highlighted ? 'rounded-[4px] border border-primary shadow-[0_14px_35px_rgba(10,102,194,0.10)]' : ''}`}>
    <JobIdentity job={job} />
    {onToggleSavedJob ? (
      <button
        type="button"
        onClick={() => onToggleSavedJob(job.id)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-primary transition hover:bg-blue-100"
        aria-label="Remove saved job"
      >
        <FiBookmark className="fill-current" />
      </button>
    ) : (
      <FiBookmark className="text-slate-700" />
    )}
    {showDeadline && job.expired ? (
      <button className="h-10 rounded-[4px] bg-slate-100 px-5 text-sm font-semibold text-slate-400">Deadline Expired</button>
    ) : (
      <Link to={job.id ? `/jobs/${job.id}` : '/jobs'} className={`inline-flex h-10 items-center gap-2 rounded-[4px] px-5 text-sm font-semibold ${job.highlighted ? 'bg-primary text-white' : 'bg-blue-50 text-primary hover:bg-blue-100'}`}>
        Apply Now <FiChevronRight />
      </Link>
    )}
  </article>
)

const JobIdentity = ({ job }) => (
  <div className="flex items-center gap-4">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] text-sm font-bold ${job.logoClass}`}>{job.logo}</div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-950">{job.title}</h3>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-primary">{job.type}</span>
        {job.expired && <span className="text-xs font-medium text-red-500">Job Expire</span>}
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1"><FiMapPin className="h-4 w-4 text-slate-400" />{job.location}</span>
        <span>{job.salary}</span>
        <span>Open now</span>
      </p>
    </div>
  </div>
)

const SectionHeader = ({ title, action, onClick }) => (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-lg font-semibold">{title}</h2>
    <button onClick={onClick} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">{action} <FiChevronRight /></button>
  </div>
)

const Pagination = () => (
  <div className="flex items-center justify-center gap-4 px-5 py-8 text-sm">
    <button className="text-primary">Prev</button>
    {['01', '02', '03', '04', '05'].map((page, index) => (
      <button key={page} className={`h-10 w-10 rounded-full ${index === 0 ? 'bg-primary text-white' : index === 3 ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}>{page}</button>
    ))}
    <button className="h-10 rounded-full bg-blue-50 px-4 text-primary">Next</button>
  </div>
)

const TextInput = ({ label, ...props }) => (
  <label>
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <input {...props} className="h-11 w-full rounded-[4px] border border-slate-200 px-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50" />
  </label>
)

const SelectInput = ({ label, options = [], ...props }) => (
  <label>
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <select {...props} className="h-11 w-full rounded-[4px] border border-slate-200 px-4 text-sm text-slate-500 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </label>
)

const IconTextInput = ({ icon: Icon, label, prefix, type = 'text', placeholder, ...props }) => (
  <label>
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <div className="flex h-11 overflow-hidden rounded-[4px] border border-slate-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
      {prefix && <span className="flex items-center border-r border-slate-200 px-3 text-sm text-slate-600">{prefix}</span>}
      <div className="relative flex-1">
        <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input {...props} type={type} placeholder={placeholder} className="h-full w-full pl-11 pr-4 text-sm outline-none read-only:bg-slate-50" />
      </div>
    </div>
  </label>
)

const CheckboxRow = ({ label, checked, defaultChecked = false, onChange }) => (
  <label className="flex items-center gap-2 text-sm text-slate-500">
    <input type="checkbox" checked={checked} defaultChecked={checked === undefined ? defaultChecked : undefined} onChange={onChange} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
    {label}
  </label>
)

const SaveButton = ({ compact = false, label = 'Save Changes', loading = false }) => (
  <button type="submit" disabled={loading} className={`${compact ? 'mt-5' : 'mt-6'} h-12 rounded-[4px] bg-primary px-8 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60`}>
    {loading ? 'Saving...' : label}
  </button>
)

const Divider = () => <div className="border-t border-slate-200" />

const AddCvModal = ({ loading, onClose, onUpload }) => {
  const [resumeName, setResumeName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    onUpload(selectedFile)
  }

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4">
    <form onSubmit={handleSubmit} className="relative w-full max-w-md rounded-[8px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
        aria-label="Close resume upload"
      >
        <FiX className="h-4 w-4" />
      </button>
      <h2 className="mb-5 text-lg font-semibold">Add Cv/Resume</h2>
      <label>
        <span className="mb-2 block text-sm font-medium">Cv/Resume Name</span>
        <input
          value={resumeName}
          onChange={(event) => setResumeName(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-slate-200 px-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium">Upload your Cv/Resume</p>
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-primary hover:bg-blue-50">
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <FiUploadCloud className="mb-2 h-8 w-8 text-slate-400" />
          <span className="font-medium text-slate-700">{selectedFile ? selectedFile.name : 'Browse File'}</span>
          <span>{selectedFile ? 'Ready to upload' : 'or drop here'}</span>
          <span className="mt-2 text-xs">Only PDF format available. Max file size 12 MB.</span>
        </label>
      </div>
      <div className="mt-5 flex justify-between">
        <button type="button" onClick={onClose} className="h-11 rounded-[4px] bg-blue-50 px-5 text-sm font-semibold text-primary">Cancel</button>
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="h-11 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Add Cv/Resume'}
        </button>
      </div>
    </form>
  </div>
)
}

export default CandidateWorkspace
