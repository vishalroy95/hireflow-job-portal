import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiCpu,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiLink,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMoreVertical,
  FiPhone,
  FiPlusCircle,
  FiSettings,
  FiStar,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { jobService, recruiterService } from '../../services/api'
import { resolveUploadUrl } from '../../utils/uploads'

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'profile', label: 'Employers Profile', icon: FiUser },
  { id: 'post', label: 'Post a Job', icon: FiPlusCircle },
  { id: 'jobs', label: 'My Jobs', icon: FiBriefcase },
  { id: 'applications', label: 'Applications', icon: FiFileText },
  { id: 'saved', label: 'Saved Candidate', icon: FiStar },
  { id: 'billing', label: 'Plans & Billing', icon: FiCreditCard },
  { id: 'companies', label: 'All Companies', icon: FiUsers },
  { id: 'settings', label: 'Settings', icon: FiSettings },
]

const setupTabs = [
  { id: 'company', label: 'Company Info', icon: FiUser, progress: 0 },
  { id: 'founding', label: 'Founding Info', icon: FiCheckCircle, progress: 25 },
  { id: 'social', label: 'Social Media Profile', icon: FiGlobe, progress: 50 },
  { id: 'contact', label: 'Contact', icon: FiMail, progress: 75 },
]

const settingTabs = [
  { id: 'company', label: 'Company Info', icon: FiUser },
  { id: 'founding', label: 'Founding Info', icon: FiCheckCircle },
  { id: 'social', label: 'Social Media Profile', icon: FiGlobe },
  { id: 'account', label: 'Account Setting', icon: FiSettings },
]

const emptyCompanyForm = {
  name: '',
  website: '',
  logo: '',
  industryType: '',
  companySize: '',
  linkedinUrl: '',
  description: '',
  address: '',
  phone: '',
  designation: '',
}

const emptyJobForm = {
  title: '',
  location: '',
  minSalary: '',
  maxSalary: '',
  currency: 'INR',
  description: '',
  responsibilities: '',
  requirements: '',
  skillsRequired: '',
  jobType: 'Full-time',
  experience: 'Entry Level',
  openingsCount: 1,
  workplaceType: 'Onsite',
  status: 'active',
  featured: false,
}

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = reject
    document.body.appendChild(script)
  })

const buildCompanyForm = (company = {}, profile = {}) => ({
  ...emptyCompanyForm,
  name: company?.name || '',
  website: company?.website || '',
  logo: company?.logo || '',
  industryType: company?.industryType || '',
  companySize: company?.companySize || '',
  linkedinUrl: company?.linkedinUrl || profile?.linkedinUrl || '',
  description: company?.description || '',
  address: company?.address || '',
  phone: profile?.phone || '',
  designation: profile?.designation || '',
})

const formatDate = (value) => {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

const getRecruiterJobStatus = (job) => {
  if (job.adminDisabled || (!job.active && job.status === 'active')) {
    return {
      label: 'Disabled by Admin',
      tone: 'amber',
      note: 'This job is hidden from candidates. Contact admin support to reactivate it.',
      canClose: false,
    }
  }

  if (job.status === 'closed') {
    return {
      label: 'Closed',
      tone: 'slate',
      note: 'You closed this job. Candidates can no longer apply.',
      canClose: false,
    }
  }

  if (job.status === 'paused' || !job.active) {
    return {
      label: 'Paused',
      tone: 'blue',
      note: 'This job is paused and hidden from candidates.',
      canClose: true,
    }
  }

  return {
    label: 'Active',
    tone: 'green',
    note: 'This job is live and candidates can apply.',
    canClose: true,
  }
}

const mapRecruiterJob = (job) => {
  const status = getRecruiterJobStatus(job)

  return {
    id: job._id,
    title: job.title,
    type: job.jobType || job.workplaceType || 'Full Time',
    days: formatDate(job.createdAt),
    status: status.label,
    statusTone: status.tone,
    statusNote: status.note,
    canClose: status.canClose,
    apps: job.applicants?.length || 0,
  }
}

const mapRecruiterApplication = (application) => ({
  id: application._id,
  jobId: application.jobId?._id,
  name: application.userId?.name || 'Candidate',
  email: application.userId?.email || '',
  phone: application.userId?.contact?.phone || '',
  contactHidden: Boolean(application.userId?.contactHidden || application.candidatePrivacy?.showContactInfo === false),
  profileVisibleToRecruiters: application.candidatePrivacy?.visibleToRecruiters !== false,
  profileImage: application.userId?.profileImage || '',
  resume: application.resume || application.userId?.resume || '',
  coverLetter: application.coverLetter || '',
  bio: application.userId?.bio || '',
  skills: application.userId?.skills || [],
  role: application.jobId?.title || 'Applicant',
  company: application.jobId?.company || '',
  location: application.jobId?.location || '',
  edu: application.education || 'Profile submitted',
  status: application.status || 'pending',
  appliedAt: application.appliedAt || application.createdAt,
  skillMatch: application.skillMatch || 0,
  aiScreening: application.aiScreening,
  aiAnalysis: application.resumeAnalysis || null,
})

const RecruiterWorkspace = () => {
  const { logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [setupTab, setSetupTab] = useState('company')
  const [settingsTab, setSettingsTab] = useState('company')
  const [jobMode, setJobMode] = useState('pricing')
  const [openMenu, setOpenMenu] = useState(null)
  const [modal, setModal] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentPlans, setPaymentPlans] = useState([])
  const [paymentConfig, setPaymentConfig] = useState({ enabled: false, keyId: '', mode: 'demo' })
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [paymentReceipt, setPaymentReceipt] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm)
  const [companySaving, setCompanySaving] = useState(false)
  const [jobForm, setJobForm] = useState(emptyJobForm)
  const [jobSaving, setJobSaving] = useState(false)
  const [allApplications, setAllApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [analyzingApplicationId, setAnalyzingApplicationId] = useState('')
  const [applicationJobFilter, setApplicationJobFilter] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [publicCompanies, setPublicCompanies] = useState([])
  const [logoUploading, setLogoUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const activeSetup = useMemo(() => setupTabs.find((tab) => tab.id === setupTab), [setupTab])
  const recruiterJobs = useMemo(
    () => (dashboardData?.jobs || []).map(mapRecruiterJob),
    [dashboardData]
  )
  const recruiterApplications = useMemo(
    () => allApplications.map(mapRecruiterApplication),
    [allApplications]
  )
  const hasActiveRecruiterPlan = Boolean(
    dashboardData?.subscription?.status === 'active'
    && dashboardData?.subscription?.plan
    && dashboardData.subscription.plan !== 'free'
  )

  const fetchApplicants = async (params = {}) => {
    try {
      setApplicationsLoading(true)
      const response = await recruiterService.getApplicants(params)
      setAllApplications(response.data.applications || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load applicants')
      setAllApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError('')
      const [response, applicantsResponse, employersResponse, plansResponse, paymentsResponse] = await Promise.all([
        recruiterService.getDashboard(),
        recruiterService.getApplicants(),
        jobService.getEmployers({ limit: 12 }),
        recruiterService.getBillingPlans(),
        recruiterService.getPayments(),
      ])
      setDashboardData(response.data)
      setAllApplications(applicantsResponse.data.applications || [])
      setPublicCompanies(employersResponse.data.employers || [])
      setPaymentPlans(plansResponse.data.plans || [])
      setPaymentConfig(plansResponse.data.payments || { enabled: false, keyId: '', mode: 'demo' })
      setPaymentHistory(paymentsResponse.data.payments || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recruiter workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Recruiter workspace data is loaded from the backend when the route opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (!dashboardData) return
    // Dashboard refreshes should keep recruiter company forms in sync with backend data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompanyForm(buildCompanyForm(dashboardData.company, dashboardData.profile))
  }, [dashboardData])

  useEffect(() => {
    if (!dashboardData || activeTab !== 'post') return
    // Paid recruiters should land directly on the job form; pricing is only for free/expired plans.
    setJobMode(hasActiveRecruiterPlan ? 'form' : 'pricing')
  }, [activeTab, dashboardData, hasActiveRecruiterPlan])

  const updateCompanyField = (field, value) => {
    setCompanyForm((current) => ({ ...current, [field]: value }))
  }

  const updateJobField = (field, value) => {
    setJobForm((current) => ({ ...current, [field]: value }))
  }

  const handleSaveCompany = async (event) => {
    event?.preventDefault()

    try {
      setCompanySaving(true)
      await recruiterService.saveCompany(companyForm)
      await fetchDashboard()
      toast.success('Company profile saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company profile')
    } finally {
      setCompanySaving(false)
    }
  }

  const handleCreateJob = async (event) => {
    event?.preventDefault()

    const payload = {
      title: jobForm.title,
      location: jobForm.location,
      salary: {
        min: Number(jobForm.minSalary) || 0,
        max: Number(jobForm.maxSalary) || 0,
        currency: 'INR',
      },
      description: jobForm.description,
      responsibilities: jobForm.responsibilities,
      requirements: jobForm.requirements,
      skillsRequired: jobForm.skillsRequired,
      jobType: jobForm.jobType,
      experience: jobForm.experience,
      openingsCount: Number(jobForm.openingsCount) || 1,
      workplaceType: jobForm.workplaceType,
      status: jobForm.status,
      active: jobForm.status === 'active',
      featured: Boolean(jobForm.featured),
    }

    try {
      setJobSaving(true)
      await recruiterService.createJob(payload)
      await fetchDashboard()
      setJobForm(emptyJobForm)
      setJobMode('form')
      setModal('success')
      toast.success('Job posted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally {
      setJobSaving(false)
    }
  }

  const handleDuplicateJob = async (jobId) => {
    try {
      await recruiterService.duplicateJob(jobId)
      await fetchDashboard()
      setOpenMenu(null)
      toast.success('Job duplicated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate job')
    }
  }

  const handleExpireJob = async (jobId) => {
    try {
      await recruiterService.updateJobStatus(jobId, { status: 'closed' })
      await fetchDashboard()
      setOpenMenu(null)
      toast.success('Job closed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status')
    }
  }

  const handleApplicantStatus = async (applicationId, status) => {
    try {
      await recruiterService.updateApplicantStatus(applicationId, status)
      await fetchApplicants(applicationJobFilter ? { jobId: applicationJobFilter } : {})
      await fetchDashboard()
      toast.success('Application status updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application')
    }
  }

  const handleAnalyzeApplicant = async (applicationId) => {
    try {
      setAnalyzingApplicationId(applicationId)
      const response = await recruiterService.analyzeApplicant(applicationId)
      await fetchApplicants()
      toast.success(response.data.cached ? 'AI analysis loaded' : 'AI analysis completed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed')
    } finally {
      setAnalyzingApplicationId('')
    }
  }

  const handleCompanyLogoUpload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    try {
      setLogoUploading(true)
      const response = await recruiterService.uploadCompanyLogo(file)
      const uploadedLogo = response.data.logo || ''
      updateCompanyField('logo', uploadedLogo)
      setUser((current) => current ? {
        ...current,
        companyLogo: uploadedLogo,
        company: {
          ...(current.company || {}),
          ...(response.data.company || {}),
          logo: uploadedLogo,
        },
      } : current)
      await fetchDashboard()
      toast.success('Company logo uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload company logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleCheckout = async (plan) => {
    if (!plan?._id) {
      toast.error('Please choose a valid plan')
      return
    }

    try {
      setPaymentProcessing(true)
      const response = await recruiterService.createPaymentOrder(plan._id)
      const { order, keyId, demo } = response.data

      if (!order?.id) {
        throw new Error('Payment order could not be prepared')
      }

      if (demo) {
        const verifyResponse = await recruiterService.verifyPayment({
          demo_order_id: order.id,
          demo_payment_id: `pay_demo_${Date.now()}`,
        })
        if (verifyResponse.data?.subscription) {
          setDashboardData((current) => current ? { ...current, subscription: verifyResponse.data.subscription } : current)
        }
        await fetchDashboard()
        setPaymentReceipt({
          plan,
          subscription: verifyResponse.data?.subscription,
          paymentId: verifyResponse.data?.payment?.providerPaymentId || verifyResponse.data?.payment?.providerOrderId || order.id,
        })
        setModal('paymentSuccess')
        toast.success('Payment verified. Your recruiter plan is active.')
        return
      }

      if (!keyId) {
        throw new Error('Razorpay public key is missing')
      }

      await loadRazorpayScript()

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'HireFlow',
        description: `${plan.name} recruiter plan`,
        order_id: order.id,
        notes: {
          plan: plan.key,
        },
        handler: async (paymentResult) => {
          const verifyResponse = await recruiterService.verifyPayment(paymentResult)
          if (verifyResponse.data?.subscription) {
            setDashboardData((current) => current ? { ...current, subscription: verifyResponse.data.subscription } : current)
          }
          await fetchDashboard()
          setPaymentReceipt({
            plan,
            subscription: verifyResponse.data?.subscription,
            paymentId: paymentResult.razorpay_payment_id || paymentResult.razorpay_order_id,
          })
          setModal('paymentSuccess')
          toast.success('Payment verified. Your recruiter plan is active.')
        },
        modal: {
          ondismiss: () => setPaymentProcessing(false),
        },
        theme: {
          color: '#2563eb',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (event) => {
        toast.error(event.error?.description || 'Payment failed')
        setPaymentProcessing(false)
      })
      razorpay.open()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed')
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleViewApplications = async (jobId) => {
    setApplicationJobFilter(jobId)
    setActiveTab('applications')
    await fetchApplicants(jobId ? { jobId } : {})
  }

  const handleOpenCandidate = async (candidate) => {
    setSelectedCandidate(candidate)
    setModal('candidate')

    if (!candidate?.id) return

    try {
      await recruiterService.recordCandidateProfileView(candidate.id)
    } catch (err) {
      console.error('Failed to record candidate profile view', err)
    }
  }

  return (
    <MainLayout fullBleed hideFooter>
      <div className="bg-[#F5F7FB] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <main className="mx-auto grid max-w-6xl grid-cols-1 overflow-hidden rounded-[8px] border border-slate-200 bg-white md:grid-cols-[260px_1fr]">
        <aside className="min-h-[720px] border-r border-slate-200 px-4 py-7">
          <p className="mb-4 text-xs uppercase tracking-wide text-slate-400">Recruiter Dashboard</p>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setOpenMenu(null)
                }}
              />
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-80 flex items-center gap-3 px-4 py-3 text-sm text-slate-500">
            <FiLogOut /> Log-out
          </button>
        </aside>

        <section className="min-h-[720px] px-6 py-9 lg:px-10">
          {error && <Error message={error} onRetry={fetchDashboard} />}
          {loading ? (
            <Loading message="Loading recruiter workspace..." />
          ) : (
            <>
          {activeTab === 'overview' && <OverviewPage company={dashboardData?.company} jobs={recruiterJobs} stats={dashboardData?.stats} setActiveTab={setActiveTab} openMenu={openMenu} setOpenMenu={setOpenMenu} setModal={setModal} onViewApplications={handleViewApplications} />}
          {activeTab === 'profile' && (
            <SetupPage activeSetup={activeSetup} companyForm={companyForm} logoUploading={logoUploading} saving={companySaving} setupTab={setupTab} setSetupTab={setSetupTab} onChange={updateCompanyField} onLogoUpload={handleCompanyLogoUpload} onSubmit={handleSaveCompany} />
          )}
          {activeTab === 'post' && (
            <PostJobPage
              jobForm={jobForm}
              loading={jobSaving}
              mode={jobMode}
              setMode={setJobMode}
              setModal={setModal}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              paymentPlans={paymentPlans}
              subscription={dashboardData?.subscription}
              onChange={updateJobField}
              onSubmit={handleCreateJob}
            />
          )}
          {activeTab === 'jobs' && <MyJobsPage rows={recruiterJobs} openMenu={openMenu} setOpenMenu={setOpenMenu} setModal={setModal} onDuplicateJob={handleDuplicateJob} onExpireJob={handleExpireJob} onViewApplications={handleViewApplications} />}
          {activeTab === 'applications' && <ApplicationsPage applications={recruiterApplications} jobFilter={applicationJobFilter} loading={applicationsLoading} onAnalyzeApplicant={handleAnalyzeApplicant} analyzingApplicationId={analyzingApplicationId} onClearJobFilter={() => { setApplicationJobFilter(''); fetchApplicants() }} onOpenCandidate={handleOpenCandidate} onStatusChange={handleApplicantStatus} />}
          {activeTab === 'saved' && <SavedCandidatesPage rows={recruiterApplications.filter((application) => application.status === 'shortlisted')} openMenu={openMenu} setOpenMenu={setOpenMenu} onOpenCandidate={handleOpenCandidate} />}
          {activeTab === 'billing' && <BillingPage subscription={dashboardData?.subscription} plans={paymentPlans} payments={paymentHistory} paymentConfig={paymentConfig} setSelectedPlan={setSelectedPlan} setModal={setModal} />}
          {activeTab === 'companies' && <AllCompaniesPage companies={publicCompanies} />}
          {activeTab === 'settings' && (
            <SettingsPage companyForm={companyForm} logoUploading={logoUploading} saving={companySaving} settingsTab={settingsTab} setSettingsTab={setSettingsTab} onChange={updateCompanyField} onLogoUpload={handleCompanyLogoUpload} onSubmit={handleSaveCompany} />
          )}
            </>
          )}
        </section>
      </main>

      {modal === 'checkout' && <CheckoutModal plan={selectedPlan} paymentConfig={paymentConfig} processing={paymentProcessing} onPay={handleCheckout} onClose={() => setModal(null)} />}
      {modal === 'paymentSuccess' && (
        <PaymentSuccessModal
          receipt={paymentReceipt}
          onClose={() => setModal(null)}
          onPostJob={() => {
            setModal(null)
            setActiveTab('post')
            setJobMode('form')
          }}
          onViewBilling={() => {
            setModal(null)
            setActiveTab('billing')
          }}
        />
      )}
      {modal === 'promote' && <PromoteModal onClose={() => setModal(null)} />}
      {modal === 'success' && <JobSuccessModal onClose={() => setModal(null)} setModal={setModal} />}
      {modal === 'column' && <AddColumnModal onClose={() => setModal(null)} />}
      {modal === 'candidate' && <CandidateProfileModal candidate={selectedCandidate} onClose={() => setModal(null)} />}
      </div>
    </MainLayout>
  )
}

const Brand = ({ logoUrl = '', siteName = 'HireFlow' }) => (
  <div className="flex items-center gap-2">
    {logoUrl ? (
      <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded object-contain" />
    ) : (
      <img src="/favicon.svg" alt={siteName} className="h-8 w-8 rounded object-contain" />
    )}
    <span className="text-lg font-bold">{siteName}</span>
  </div>
)

const SidebarButton = ({ item, active, onClick }) => {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
        active ? 'border-l-2 border-blue-600 bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon />
      <span>{item.label}</span>
    </button>
  )
}

const OverviewPage = ({ company, jobs: dashboardJobs, stats, setActiveTab, openMenu, setOpenMenu, setModal, onViewApplications }) => (
  <div>
    <p className="text-lg font-semibold">Hello, {company?.name || 'Recruiter'}</p>
    <p className="mt-1 text-sm text-slate-500">Here is your daily activities and applications</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <StatCard title="Open Jobs" value={stats?.activeJobs || 0} icon={FiBriefcase} tone="blue" />
      <StatCard title="Applicants" value={stats?.totalApplicants || 0} icon={FiUsers} tone="amber" />
    </div>
    <div className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Recently Posted Jobs</h2>
        <button onClick={() => setActiveTab('jobs')} className="flex items-center gap-2 text-sm text-slate-500">
          View all <FiArrowRight />
        </button>
      </div>
      <JobsTable rows={dashboardJobs.slice(0, 5)} openMenu={openMenu} setOpenMenu={setOpenMenu} setModal={setModal} onViewApplications={onViewApplications} />
    </div>
  </div>
)

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className={`flex items-center justify-between rounded p-5 ${tones[tone]}`}>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-600">{title}</p>
      </div>
      <div className="grid h-12 w-12 place-items-center rounded bg-white">
        <Icon />
      </div>
    </div>
  )
}

const SetupPage = ({ activeSetup, companyForm, logoUploading, saving, setupTab, setSetupTab, onChange, onLogoUpload, onSubmit }) => (
  <div className="mx-auto max-w-4xl">
    <div className="mb-10 flex items-center justify-between">
      <Brand />
      <Progress value={activeSetup.progress} />
    </div>
    <TabRow tabs={setupTabs} active={setupTab} setActive={setSetupTab} />
    <div className="mt-7">
      {setupTab === 'company' && <CompanyInfoForm form={companyForm} logoUploading={logoUploading} saving={saving} setup onChange={onChange} onLogoUpload={onLogoUpload} onSubmit={onSubmit} />}
      {setupTab === 'founding' && <FoundingForm form={companyForm} saving={saving} setup onChange={onChange} onSubmit={onSubmit} />}
      {setupTab === 'social' && <SocialForm form={companyForm} saving={saving} setup onChange={onChange} onSubmit={onSubmit} />}
      {setupTab === 'contact' && <ContactForm form={companyForm} saving={saving} setup onChange={onChange} onSubmit={onSubmit} />}
    </div>
  </div>
)

const Progress = ({ value }) => (
  <div className="w-48">
    <div className="mb-1 flex justify-between text-[10px] text-blue-600">
      <span className="text-slate-400">Setup Progress</span>
      <span>{value}% Completed</span>
    </div>
    <div className="h-1.5 rounded-full bg-blue-50">
      <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
    </div>
  </div>
)

const TabRow = ({ tabs, active, setActive }) => (
  <div className="flex flex-wrap gap-4 border-b border-slate-200">
    {tabs.map((tab) => {
      const Icon = tab.icon
      return (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm ${
            active === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          <Icon /> {tab.label}
        </button>
      )
    })}
  </div>
)

const CompanyInfoForm = ({ form = emptyCompanyForm, logoUploading = false, saving = false, setup, onChange, onLogoUpload, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <h3 className="mb-4 font-semibold">Logo & Banner Image</h3>
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <UploadBox label="Upload Logo" loading={logoUploading} preview={form.logo} small onUpload={onLogoUpload} />
      <UploadBox label="Banner Image" disabled />
    </div>
    <Input label="Company name" value={form.name} onChange={(event) => onChange('name', event.target.value)} />
    <RichTextarea label="About us" value={form.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Write down about your company here. Let the candidate know who we are..." />
    <FormActions saving={saving} setup={setup} />
  </FormShell>
)

const FoundingForm = ({ form = emptyCompanyForm, saving = false, setup, onChange, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <div className="grid gap-4 md:grid-cols-3">
      <Select label="Organization Type" value={form.designation} onChange={(event) => onChange('designation', event.target.value)} options={['Private', 'Public', 'Startup', 'Agency']} />
      <Select label="Industry Types" value={form.industryType} onChange={(event) => onChange('industryType', event.target.value)} options={['Technology', 'Design', 'Marketing', 'Finance', 'Healthcare']} />
      <Select label="Team Size" value={form.companySize} onChange={(event) => onChange('companySize', event.target.value)} options={['1-10', '11-50', '51-200', '201-500', '500+']} />
      <Input label="Map Location" value={form.address} onChange={(event) => onChange('address', event.target.value)} icon={FiMapPin} />
      <Input label="Company Website" value={form.website} onChange={(event) => onChange('website', event.target.value)} placeholder="Website url..." icon={FiLink} />
    </div>
    <RichTextarea label="Company Vision" value={form.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Tell us about your company vision..." />
    <FormActions saving={saving} setup={setup} />
  </FormShell>
)

const SocialForm = ({ form = emptyCompanyForm, saving = false, setup, onChange, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <Input label="LinkedIn Profile" value={form.linkedinUrl} onChange={(event) => onChange('linkedinUrl', event.target.value)} icon={FiGlobe} placeholder="https://linkedin.com/company/..." />
    <FormActions saving={saving} setup={setup} />
  </FormShell>
)

const ContactForm = ({ form = emptyCompanyForm, saving = false, setup, onChange, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <Input label="Map Location" value={form.address} onChange={(event) => onChange('address', event.target.value)} />
    <Input label="Phone" value={form.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="Phone number..." icon={FiPhone} />
    <Input label="Email" value={form.website} onChange={(event) => onChange('website', event.target.value)} placeholder="Company website or email" icon={FiMail} />
    <FormActions saving={saving} setup={setup} finish />
  </FormShell>
)

const FormShell = ({ children, onSubmit }) => <form onSubmit={onSubmit} className="space-y-5">{children}</form>

const FormActions = ({ saving = false, setup, finish }) => (
  <div className="flex gap-3 pt-2">
    {setup && <button type="button" className="bg-slate-100 px-5 py-3 text-sm font-semibold">Previous</button>}
    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
      {saving ? 'Saving...' : finish ? 'Finish Editing' : setup ? 'Save & Next' : 'Save Changes'} <FiArrowRight />
    </button>
  </div>
)

const UploadBox = ({ label, loading = false, preview = '', disabled = false, small, onUpload }) => (
  <div>
    <label className="mb-2 block text-sm">{label}</label>
    <label className={`relative grid place-items-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500 ${small ? 'h-36' : 'h-36'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'}`}>
      {preview ? (
        <img src={resolveUploadUrl(preview)} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div>
          <FiUploadCloud className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-700">{loading ? 'Uploading...' : disabled ? 'Coming soon' : 'Browse photo'}</p>
          <p>{disabled ? 'Banner upload is not enabled yet.' : 'Image up to 5 MB.'}</p>
        </div>
      )}
      {!disabled && (
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(event) => onUpload?.(event.target.files?.[0])}
          className="sr-only"
        />
      )}
    </label>
  </div>
)

const PostJobPage = ({ jobForm, loading, mode, setMode, setModal, selectedPlan, setSelectedPlan, paymentPlans = [], subscription, onChange, onSubmit }) => (
  <div>
    {mode === 'pricing' ? (
      <div>
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <h1 className="text-2xl font-semibold">Choose a recruiter plan to post jobs</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Your current plan allows {subscription?.jobPostingLimit ?? 3} active jobs and {subscription?.premiumJobCredits ?? 0} featured job credits.
            </p>
          </div>
          <div className="hidden rounded bg-blue-50 p-8 text-blue-600 lg:block">
            <FiUsers className="h-24 w-24" />
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {paymentPlans.map((plan, index) => (
            <PricingCard
              key={plan._id || plan.key}
              plan={plan}
              active={subscription?.plan === plan.key}
              recommended={index === 1}
              onChoose={() => {
                setSelectedPlan(plan)
                setModal('checkout')
              }}
            />
          ))}
        </div>
        <button onClick={() => setMode('form')} className="mt-6 text-sm font-semibold text-blue-600">
          Skip pricing and open post job form
        </button>
      </div>
    ) : (
      <JobForm form={jobForm} loading={loading} onChange={onChange} onSubmit={onSubmit} setModal={setModal} />
    )}
  </div>
)

const PricingCard = ({ plan, active, recommended, onChoose }) => (
  <div className={`relative border p-5 ${active ? 'border-blue-600 bg-blue-50/40 shadow-xl' : 'border-slate-200'}`}>
    {active ? (
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 px-4 py-1 text-xs font-semibold text-white">Active Plan</span>
    ) : recommended ? (
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 text-xs text-white">Recommended</span>
    ) : null}
    <p className="text-sm font-semibold uppercase">{plan.name}</p>
    <p className="mt-2 min-h-10 text-sm text-slate-500">{plan.description || 'Professional recruiter plan for HireFlow.'}</p>
    <p className="mt-5 text-3xl font-bold text-blue-600">INR {Number(plan.amount || 0).toLocaleString('en-IN')}<span className="text-sm font-normal text-slate-400">/{plan.durationDays || 30} days</span></p>
    <ul className="mt-5 space-y-3 text-sm text-slate-600">
      {[
        `${plan.jobPostingLimit || 0} active jobs`,
        `${plan.premiumJobCredits || 0} featured job credits`,
        `${plan.resumeUnlockCredits || 0} resume/profile credits`,
        'Applicant pipeline access',
        'Professional email updates',
      ].map((feature) => (
        <li key={feature} className="flex items-center gap-2"><FiCheck className="text-blue-600" /> {feature}</li>
      ))}
    </ul>
    <button
      onClick={onChoose}
      disabled={active}
      className={`mt-6 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold disabled:cursor-default ${active ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'}`}
    >
      {active ? 'Current Plan' : 'Choose Plan'} {!active && <FiArrowRight />}
    </button>
  </div>
)

const JobForm = ({ form, loading, onChange, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <h1 className="text-xl font-semibold">Post a job</h1>
    <Input label="Job Title" value={form.title} onChange={(event) => onChange('title', event.target.value)} placeholder="Add job title, role, vacancies etc" />
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <Input label="Skills" value={form.skillsRequired} onChange={(event) => onChange('skillsRequired', event.target.value)} placeholder="React, Node.js, UI Design" />
      <Select label="Workplace" value={form.workplaceType} onChange={(event) => onChange('workplaceType', event.target.value)} options={['Onsite', 'Remote', 'Hybrid']} />
    </div>
    <h3 className="font-semibold">Salary</h3>
    <div className="grid gap-4 md:grid-cols-3">
      <Input label="Min Salary" value={form.minSalary} onChange={(event) => onChange('minSalary', event.target.value)} placeholder="Minimum salary..." type="number" />
      <Input label="Max Salary" value={form.maxSalary} onChange={(event) => onChange('maxSalary', event.target.value)} placeholder="Maximum salary..." type="number" />
      <Select label="Currency" value="INR" onChange={() => {}} options={['INR']} />
    </div>
    <h3 className="font-semibold">Advance Information</h3>
    <div className="grid gap-4 md:grid-cols-3">
      <Input label="Location" value={form.location} onChange={(event) => onChange('location', event.target.value)} />
      <Select label="Experience" value={form.experience} onChange={(event) => onChange('experience', event.target.value)} options={['Entry Level', 'Mid Level', 'Senior Level', '0-1 years', '1-3 years', '3-5 years', '5+ years']} />
      <Select label="Job Type" value={form.jobType} onChange={(event) => onChange('jobType', event.target.value)} options={['Full-time', 'Part-time', 'Internship', 'Contract']} />
      <Input label="Vacancies" value={form.openingsCount} onChange={(event) => onChange('openingsCount', event.target.value)} type="number" />
      <Select label="Status" value={form.status} onChange={(event) => onChange('status', event.target.value)} options={['active', 'paused', 'closed']} />
      <Select label="Job Level" value={form.experience} onChange={(event) => onChange('experience', event.target.value)} options={['Entry Level', 'Mid Level', 'Senior Level']} />
    </div>
    <label className="flex items-start gap-3 rounded border border-blue-100 bg-blue-50 p-4 text-sm">
      <input
        type="checkbox"
        checked={Boolean(form.featured)}
        onChange={(event) => onChange('featured', event.target.checked)}
        className="mt-1"
      />
      <span>
        <span className="block font-semibold text-slate-950">Mark as featured job</span>
        <span className="block text-slate-500">Featured jobs appear higher in listings and consume one featured credit.</span>
      </span>
    </label>
    <div className="bg-slate-100 p-4">
      <p className="mb-3 text-sm font-semibold">Apply Job on:</p>
      <div className="grid gap-3 md:grid-cols-3">
        {['On Platform', 'External Platform', 'On Your Email'].map((item, index) => (
          <label key={item} className={`border p-4 text-sm ${index === 0 ? 'border-blue-600 bg-white' : 'border-transparent bg-slate-50'}`}>
            <input type="radio" name="apply" defaultChecked={index === 0} /> <span className="ml-2 font-semibold">{item}</span>
            <p className="mt-2 text-xs text-slate-500">Candidate will apply using this job portal application flow.</p>
          </label>
        ))}
      </div>
    </div>
    <RichTextarea label="Description" value={form.description} onChange={(event) => onChange('description', event.target.value)} placeholder="Add your job description..." />
    <RichTextarea label="Responsibilities" value={form.responsibilities} onChange={(event) => onChange('responsibilities', event.target.value)} placeholder="Add your job responsibilities..." />
    <RichTextarea label="Requirements" value={form.requirements} onChange={(event) => onChange('requirements', event.target.value)} placeholder="Add requirements..." />
    <button type="submit" disabled={loading} className="w-fit bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
      {loading ? 'Posting...' : 'Post Job'} <FiArrowRight className="ml-2 inline" />
    </button>
  </FormShell>
)

const MyJobsPage = ({ rows, openMenu, setOpenMenu, setModal, onDuplicateJob, onExpireJob, onViewApplications }) => (
  <div>
    <div className="mb-5 flex items-center justify-between">
      <h1 className="text-xl font-semibold">My Jobs <span className="text-slate-400">({rows.length})</span></h1>
      <label className="flex items-center gap-3 text-sm">
        Job status <select className="rounded border border-slate-200 px-4 py-2"><option>All Jobs</option></select>
      </label>
    </div>
    <JobsTable rows={rows} openMenu={openMenu} setOpenMenu={setOpenMenu} setModal={setModal} onDuplicateJob={onDuplicateJob} onExpireJob={onExpireJob} onViewApplications={onViewApplications} />
    <Pagination />
  </div>
)

const JobsTable = ({ rows, openMenu, setOpenMenu, setModal, onDuplicateJob, onExpireJob, onViewApplications }) => (
  <div className="overflow-visible">
    <div className="grid grid-cols-[1fr_120px_160px_190px] bg-slate-100 px-4 py-3 text-xs uppercase text-slate-500">
      <span>Jobs</span><span>Status</span><span>Applications</span><span>Actions</span>
    </div>
    {rows.length === 0 && (
      <div className="border border-t-0 border-slate-100 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No jobs posted yet.
      </div>
    )}
    {rows.map((job, index) => (
      <div key={job.id || job.title} className="relative grid grid-cols-[1fr_120px_160px_190px] items-center border-b border-slate-100 px-4 py-4 text-sm transition hover:bg-slate-50">
        <div>
          <p className="font-semibold">{job.title}</p>
          <p className="mt-1 text-xs text-slate-500">{job.type} <span className="mx-2">.</span> {job.days}</p>
        </div>
        <StatusPill job={job} />
        <span className="flex items-center gap-2 text-slate-500"><FiUsers /> {job.apps} Applications</span>
        <div className="flex items-center gap-3">
          <button onClick={() => onViewApplications?.(job.id)} className="bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">View Applications</button>
          <button onClick={() => setOpenMenu(openMenu === `job-${index}` ? null : `job-${index}`)} className="p-2 text-slate-500"><FiMoreVertical /></button>
          {openMenu === `job-${index}` && <ActionMenu job={job} setModal={setModal} onDuplicateJob={onDuplicateJob} onExpireJob={onExpireJob} />}
        </div>
      </div>
    ))}
  </div>
)

const statusToneClasses = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
}

const StatusPill = ({ job }) => (
  <span
    title={job.statusNote}
    className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusToneClasses[job.statusTone] || statusToneClasses.slate}`}
  >
    {job.status}
  </span>
)

const ActionMenu = ({ job, setModal, onDuplicateJob, onExpireJob }) => (
  <div className="absolute right-4 top-14 z-20 w-40 border border-slate-100 bg-white py-2 text-sm shadow-xl">
    <button onClick={() => setModal('promote')} className="flex w-full items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50"><FiPlusCircle /> Promote Job</button>
    <button onClick={() => window.open(`/jobs/${job.id}`, '_blank', 'noopener,noreferrer')} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><FiEye /> View Detail</button>
    <button onClick={() => onDuplicateJob(job.id)} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><FiFileText /> Duplicate</button>
    {job.canClose ? (
      <button onClick={() => onExpireJob(job.id)} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50"><FiX /> Close Job</button>
    ) : (
      <p className="px-4 py-2 text-xs leading-5 text-slate-400">{job.statusNote}</p>
    )}
  </div>
)

const ApplicationsPage = ({
  applications: applicationRows,
  jobFilter,
  loading,
  onAnalyzeApplicant,
  analyzingApplicationId,
  onClearJobFilter,
  onOpenCandidate,
  onStatusChange,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredRows = applicationRows.filter((application) => {
    const text = `${application.name} ${application.email} ${application.role} ${application.skills.join(' ')}`.toLowerCase()
    const matchesSearch = !search || text.includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter
    return matchesSearch && matchesStatus
  })
  const shortlisted = filteredRows.filter((application) => application.status === 'shortlisted')
  const rejected = filteredRows.filter((application) => application.status === 'rejected')
  const inReview = filteredRows.filter((application) => !['shortlisted', 'rejected'].includes(application.status))

  return (
  <div>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-500">Home / Jobs / <span className="text-blue-600">Applications</span></p>
        <h1 className="mt-2 text-xl font-semibold">Job Applications</h1>
        {jobFilter && (
          <button onClick={onClearJobFilter} className="mt-2 text-xs font-semibold text-blue-600">
            Clear selected job filter
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates..." className="h-10 rounded border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="applied">Applied</option>
          <option value="under-review">Under review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview-scheduled">Interview scheduled</option>
          <option value="selected">Selected</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
    {loading ? (
      <Loading message="Loading applicants..." />
    ) : (
    <div className="grid gap-5 xl:grid-cols-3">
      <ApplicationColumn title="In Review" count={inReview.length} items={inReview} onAnalyzeApplicant={onAnalyzeApplicant} analyzingApplicationId={analyzingApplicationId} onOpenCandidate={onOpenCandidate} onStatusChange={onStatusChange} />
      <ApplicationColumn title="Shortlisted" count={shortlisted.length} items={shortlisted} onAnalyzeApplicant={onAnalyzeApplicant} analyzingApplicationId={analyzingApplicationId} onOpenCandidate={onOpenCandidate} onStatusChange={onStatusChange} />
      <ApplicationColumn title="Rejected" count={rejected.length} items={rejected} onAnalyzeApplicant={onAnalyzeApplicant} analyzingApplicationId={analyzingApplicationId} onOpenCandidate={onOpenCandidate} onStatusChange={onStatusChange} />
    </div>
    )}
  </div>
  )
}

const CandidateAvatar = ({ candidate, square = false }) => {
  const url = resolveUploadUrl(candidate.profileImage || '')
  return (
    <div className={`${square ? 'rounded' : 'rounded-full'} flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-blue-50 text-sm font-bold text-primary ring-1 ring-blue-100`}>
      {url ? <img src={url} alt={candidate.name} className="h-full w-full object-cover" /> : ''}
    </div>
  )
}

const ApplicationColumn = ({ title, count, items, onAnalyzeApplicant, analyzingApplicationId, onOpenCandidate, onStatusChange }) => (
  <div className="rounded border border-slate-200 bg-slate-50 p-4">
    <div className="mb-4 flex justify-between text-sm font-semibold">
      <span>{title} ({count})</span><FiMoreVertical />
    </div>
    <div className="space-y-4">
      {items.length === 0 && (
        <div className="rounded bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
          No applications yet.
        </div>
      )}
      {items.map((item) => (
        <article key={item.id || item.name} className="w-full rounded bg-white p-4 text-left shadow-sm">
          <div className="flex gap-3 border-b border-slate-100 pb-3">
            <CandidateAvatar candidate={item} />
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-slate-500">{item.role}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            <li>Skill match: {item.skillMatch}%</li>
            <li>Education: {item.edu}</li>
            <li>Applied: {formatDate(item.appliedAt)}</li>
            {item.skills.length > 0 && <li>Skills: {item.skills.slice(0, 3).join(', ')}</li>}
          </ul>
          {(item.aiAnalysis || item.aiScreening?.summary) && (
            <div className="mt-3 rounded border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-600">
              <span className="font-semibold text-blue-700">AI match {item.aiAnalysis?.matchScore ?? item.skillMatch}%:</span>{' '}
              {item.aiAnalysis?.summary || item.aiScreening?.summary}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenCandidate(item)} className="flex items-center gap-2 text-xs font-semibold text-blue-600"><FiEye /> View</button>
            <button
              type="button"
              onClick={() => onAnalyzeApplicant?.(item.id)}
              disabled={analyzingApplicationId === item.id}
              className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCpu />
              {analyzingApplicationId === item.id ? 'Analyzing...' : item.aiAnalysis ? 'AI Ready' : 'Analyze'}
            </button>
            {item.status !== 'shortlisted' && <button type="button" onClick={() => onStatusChange(item.id, 'shortlisted')} className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">Shortlist</button>}
            {item.status !== 'rejected' && <button type="button" onClick={() => onStatusChange(item.id, 'rejected')} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">Reject</button>}
          </div>
        </article>
      ))}
    </div>
  </div>
)

const SavedCandidatesPage = ({ rows, openMenu, setOpenMenu, onOpenCandidate }) => (
  <div>
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Saved Candidates</h1>
      <p className="text-sm text-slate-500">Showing shortlisted candidates from your real applications.</p>
    </div>
    <div className="space-y-0">
      {rows.length === 0 && (
        <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No shortlisted candidates yet.
        </div>
      )}
      {rows.map((candidate, index) => (
        <div key={candidate.id || candidate.name} className={`relative grid grid-cols-[1fr_48px_160px_44px] items-center border-b border-slate-100 px-4 py-3 ${index === 2 ? 'border border-blue-600 shadow-lg' : ''}`}>
          <div className="flex items-center gap-4">
            <CandidateAvatar candidate={candidate} square />
            <div>
              <p className="font-semibold">{candidate.name}</p>
              <p className="text-sm text-slate-500">{candidate.role}</p>
            </div>
          </div>
          <FiStar className="text-blue-600" />
          <button onClick={() => onOpenCandidate(candidate)} className="bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600">
            View Profile <FiArrowRight className="ml-2 inline" />
          </button>
          <button onClick={() => setOpenMenu(openMenu === `saved-${index}` ? null : `saved-${index}`)} className="p-2 text-slate-500"><FiMoreVertical /></button>
          {openMenu === `saved-${index}` && (
            <div className="absolute right-2 top-12 z-20 w-36 border border-slate-100 bg-white py-2 text-sm shadow-xl">
              {candidate.email && <a href={`mailto:${candidate.email}`} className="flex w-full items-center gap-2 px-4 py-2 text-slate-600"><FiMail /> Send Email</a>}
              {candidate.resume && <a href={resolveUploadUrl(candidate.resume)} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2 px-4 py-2 text-slate-600"><FiDownload /> Download Cv</a>}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)

const BillingPage = ({ subscription, plans = [], payments = [], paymentConfig = {}, setSelectedPlan, setModal }) => {
  const plan = subscription?.plan || 'free'
  const currentPlan = plans.find((item) => item.key === plan)
  const planLabel = currentPlan?.name || plan.charAt(0).toUpperCase() + plan.slice(1)
  const periodEnd = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'No renewal date'
  const recentPayments = payments.slice(0, 3)

  return (
  <div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className={plan !== 'free' ? 'border-blue-200 bg-blue-50/40' : ''}>
        <p className="text-sm text-slate-500">Current Plan</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{planLabel}</h1>
          {plan !== 'free' && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Active
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500">Subscription status: <span className="font-semibold capitalize text-slate-950">{subscription?.status || 'active'}</span></p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Secure billing verification enabled</p>
        <button onClick={() => { setSelectedPlan(plans[0] || null); setModal('checkout') }} className="mt-5 bg-slate-100 px-5 py-3 text-sm font-semibold text-blue-600">Change Plan</button>
      </Panel>
      <Panel>
        <h2 className="font-semibold">Plan Benefits</h2>
        <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          {[`${subscription?.jobPostingLimit ?? 3} Active Jobs`, `${subscription?.resumeUnlockCredits ?? 10} Resume Unlock Credits`, `${subscription?.premiumJobCredits ?? 0} Premium Job Credits`, 'Applicant pipeline access'].map((item) => (
            <p key={item} className="flex items-center gap-2"><FiCheck className="text-blue-600" /> {item}</p>
          ))}
        </div>
      </Panel>
      <Panel>
        <p className="text-sm text-slate-500">Current Period End</p>
        <p className="mt-4 text-2xl font-semibold text-blue-600">{periodEnd}</p>
        <p className="mt-2 text-sm text-slate-500">Your plan limits update only after secure payment verification succeeds.</p>
      </Panel>
      <Panel>
        <h2 className="font-semibold">Billing Status</h2>
        <p className="mt-5 text-sm text-slate-500">
          Secure checkout is {paymentConfig.enabled ? 'enabled' : 'disabled by admin'}.
        </p>
        <button onClick={() => { setSelectedPlan(plans[0] || null); setModal('checkout') }} className="mt-5 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600">Open Checkout</button>
      </Panel>
    </div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {plans.map((item) => (
        <PricingCard
          key={item._id || item.key}
          plan={item}
          active={item.key === plan}
          onChoose={() => {
            setSelectedPlan(item)
            setModal('checkout')
          }}
        />
      ))}
    </div>
    <Panel className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Recent Payments</h2>
        {payments.length > 3 && (
          <span className="text-xs font-medium text-slate-400">Showing latest 3 of {payments.length}</span>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {payments.length === 0 && <p className="text-sm text-slate-500">No payment history yet.</p>}
        {recentPayments.map((payment) => (
          <div key={payment._id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
            <div>
              <p className="font-semibold">{payment.planId?.name || 'Recruiter plan'}</p>
              <p className="text-slate-500">{formatDate(payment.createdAt)} · {payment.providerOrderId}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">INR {Number(payment.amount || 0).toLocaleString('en-IN')}</p>
              <p className="capitalize text-slate-500">{payment.status}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  </div>
)
}

const CompanyTile = ({ company }) => {
  const logoUrl = resolveUploadUrl(company.logo || '')
  const initials = (company.name || 'HF').slice(0, 2).toUpperCase()

  return (
    <Panel>
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center overflow-hidden rounded bg-blue-50 font-semibold text-blue-600">
          {logoUrl ? <img src={logoUrl} alt={company.name} className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{company.name}</p>
          <p className="text-sm text-slate-500"><FiMapPin className="inline" /> {(company.locations || []).filter(Boolean)[0] || 'Location not added'}</p>
        </div>
      </div>
      <button onClick={() => window.open(`/jobs?company=${encodeURIComponent(company.name)}`, '_blank', 'noopener,noreferrer')} className="mt-5 w-full bg-blue-50 py-3 text-sm font-semibold text-blue-600">
        {company.openJobs || 0} Open {(company.openJobs || 0) === 1 ? 'Position' : 'Positions'}
      </button>
    </Panel>
  )
}

const AllCompaniesPage = ({ companies = [] }) => (
  <div>
    <h1 className="text-xl font-semibold">All Companies</h1>
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {companies.length === 0 && <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500 md:col-span-2 lg:col-span-3">No public hiring companies found.</div>}
      {companies.map((company) => <CompanyTile key={company.companyId || company.name} company={company} />)}
    </div>
  </div>
)

const SettingsPage = ({ companyForm, logoUploading, saving, settingsTab, setSettingsTab, onChange, onLogoUpload, onSubmit }) => (
  <div>
    <h1 className="text-xl font-semibold">Settings</h1>
    <div className="mt-5">
      <TabRow tabs={settingTabs} active={settingsTab} setActive={setSettingsTab} />
    </div>
    <div className="mt-7">
      {settingsTab === 'company' && <CompanyInfoForm form={companyForm} logoUploading={logoUploading} saving={saving} onChange={onChange} onLogoUpload={onLogoUpload} onSubmit={onSubmit} />}
      {settingsTab === 'founding' && <FoundingForm form={companyForm} saving={saving} onChange={onChange} onSubmit={onSubmit} />}
      {settingsTab === 'social' && <SocialForm form={companyForm} saving={saving} onChange={onChange} onSubmit={onSubmit} />}
      {settingsTab === 'account' && <AccountForm form={companyForm} saving={saving} onChange={onChange} onSubmit={onSubmit} />}
    </div>
  </div>
)

const AccountForm = ({ form = emptyCompanyForm, saving = false, onChange, onSubmit }) => (
  <FormShell onSubmit={onSubmit}>
    <h3 className="font-semibold">Contact Information</h3>
    <Input label="Map Location" value={form.address} onChange={(event) => onChange('address', event.target.value)} />
    <Input label="Phone" value={form.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="Phone number..." icon={FiPhone} />
    <Input label="Company Website" value={form.website} onChange={(event) => onChange('website', event.target.value)} placeholder="Website address" icon={FiMail} />
    <button type="submit" disabled={saving} className="w-fit bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
    <hr />
    <h3 className="font-semibold">Change Password</h3>
    <div className="grid gap-4 md:grid-cols-3">
      <Input label="Current Password" placeholder="Password" />
      <Input label="New Password" placeholder="Password" />
      <Input label="Confirm Password" placeholder="Password" />
    </div>
    <button type="button" className="w-fit bg-blue-600 px-6 py-3 text-sm font-semibold text-white">Change Password</button>
    <hr />
    <h3 className="font-semibold">Delete Your Company</h3>
    <p className="max-w-xl text-sm text-slate-500">If you delete your account, you will no longer be able to get information about the matched jobs and applications.</p>
    <button type="button" className="flex items-center gap-2 text-sm text-red-500"><FiX /> Close Account</button>
  </FormShell>
)

const Input = ({ label, icon: Icon, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm">{label}</span>
    <div className="flex items-center gap-2 rounded border border-slate-200 px-4">
      {Icon && <Icon className="text-blue-600" />}
      <input className="h-11 w-full outline-none" {...props} />
    </div>
  </label>
)

const Select = ({ label, options = [], ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm">{label}</span>
    <select {...props} className="h-11 w-full rounded border border-slate-200 px-4 text-sm text-slate-600 outline-none">
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </label>
)

const RichTextarea = ({ label, placeholder, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-sm">{label}</span>
    <textarea {...props} className="h-32 w-full rounded border border-slate-200 p-4 outline-none" placeholder={placeholder} />
    <div className="-mt-10 flex gap-4 px-4 text-slate-400">
      <b>B</b><i>I</i><u>U</u><FiLink /><FiGrid />
    </div>
  </label>
)

const Panel = ({ children, className = '' }) => <div className={`rounded border border-slate-200 bg-white p-5 ${className}`}>{children}</div>

const Pagination = () => (
  <div className="mt-8 flex items-center justify-center gap-4 text-sm">
    <button className="text-blue-600">←</button>
    {['01', '02', '03', '04', '05'].map((page, index) => (
      <button key={page} className={`h-9 w-9 rounded-full ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{page}</button>
    ))}
    <button className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">→</button>
  </div>
)

const CheckoutModal = ({ plan, paymentConfig = {}, processing = false, onPay, onClose }) => (
  <Modal onClose={onClose} width="max-w-2xl">
    <h2 className="text-lg font-semibold">Checkout</h2>
    <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
      <div>
        <p className="mb-4 text-sm font-semibold">Payment Provider</p>
        <div className="rounded border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-slate-950"><FiCreditCard className="text-blue-600" /> Secure Checkout</p>
          <p className="mt-2">
            {paymentConfig.mode === 'demo'
              ? 'Review your selected plan and complete checkout to activate recruiter billing.'
              : 'Pay securely using cards, UPI, net banking, or wallet options supported by Razorpay.'}
          </p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Backend verified activation</p>
        </div>
        {!paymentConfig.enabled && (
          <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Payments are disabled by admin. Enable payments from Admin Settings before accepting checkout.
          </p>
        )}
        {paymentConfig.mode !== 'demo' && !paymentConfig.keyId && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            Razorpay public key is missing. Add Razorpay keys in backend .env and restart the server.
          </p>
        )}
      </div>
      <Panel>
        <h3 className="font-semibold">Summary</h3>
        {plan ? (
          <>
            <div className="mt-5 flex justify-between text-sm text-slate-500"><span>Pricing Plan</span><span>{plan.name}</span></div>
            <div className="mt-3 flex justify-between text-sm text-slate-500"><span>Active jobs</span><span>{plan.jobPostingLimit}</span></div>
            <div className="mt-3 flex justify-between text-sm text-slate-500"><span>Featured credits</span><span>{plan.premiumJobCredits}</span></div>
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-semibold"><span>Total:</span><span>INR {Number(plan.amount || 0).toLocaleString('en-IN')}</span></div>
            <button
              disabled={processing || !paymentConfig.enabled || (paymentConfig.mode !== 'demo' && !paymentConfig.keyId)}
              onClick={() => onPay?.(plan)}
              className="mt-5 w-full bg-blue-600 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? 'Processing...' : paymentConfig.mode === 'demo' ? 'Complete Secure Checkout' : 'Pay with Razorpay'} <FiArrowRight className="ml-2 inline" />
            </button>
            <p className="mt-4 text-center text-xs text-slate-400">Your plan activates only after backend verification.</p>
          </>
        ) : (
          <p className="mt-5 text-sm text-slate-500">Choose a plan from Plans & Billing.</p>
        )}
      </Panel>
    </div>
  </Modal>
)

const PaymentSuccessModal = ({ receipt, onClose, onPostJob, onViewBilling }) => {
  const plan = receipt?.plan
  const subscription = receipt?.subscription
  const periodEnd = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : null

  return (
    <Modal onClose={onClose} width="max-w-lg">
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
          <FiCheckCircle className="h-10 w-10" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Payment Verified</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your recruiter plan is active</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          Your checkout was verified successfully and your hiring limits are ready to use.
        </p>
      </div>

      <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Plan</p>
            <p className="mt-1 font-semibold text-slate-950">{plan?.name || subscription?.plan || 'Recruiter Plan'}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
        </div>

        <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Amount Paid</p>
            <p className="mt-1 font-semibold text-slate-950">INR {Number(plan?.amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Valid Until</p>
            <p className="mt-1 font-semibold text-slate-950">{periodEnd || `${plan?.durationDays || 30} days`}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Active Jobs</p>
            <p className="mt-1 font-semibold text-slate-950">{subscription?.jobPostingLimit ?? plan?.jobPostingLimit ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Featured Credits</p>
            <p className="mt-1 font-semibold text-slate-950">{subscription?.premiumJobCredits ?? plan?.premiumJobCredits ?? 0}</p>
          </div>
        </div>

        {receipt?.paymentId && (
          <p className="mt-5 truncate border-t border-slate-200 pt-4 text-xs text-slate-400">
            Transaction ID: <span className="font-medium text-slate-500">{receipt.paymentId}</span>
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={onViewBilling} className="border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600">
          Back to Billing
        </button>
        <button onClick={onPostJob} className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
          Post a Job <FiArrowRight className="ml-2 inline" />
        </button>
      </div>
    </Modal>
  )
}

const PromoteModal = ({ onClose }) => (
  <Modal onClose={onClose} width="max-w-2xl">
    <h2 className="text-xl font-semibold">Promote Job: UI/UX Designer</h2>
    <p className="mt-3 text-sm text-slate-500">Choose a promotion style for this job listing.</p>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      {['Feature Your Job', 'Highlight Your Job'].map((item, index) => (
        <label key={item} className={`border p-4 ${index === 0 ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
          <div className="mb-4 h-28 rounded bg-white p-4">
            <div className="mb-2 h-5 w-28 bg-slate-200" />
            <div className="h-3 w-36 bg-slate-200" />
            <div className={`mt-4 h-6 w-32 ${index === 0 ? 'bg-blue-600' : 'bg-amber-400'}`} />
          </div>
          <input type="radio" name="promote" defaultChecked={index === 0} /> <span className="ml-2 font-semibold">{item}</span>
          <p className="mt-2 text-xs text-slate-500">Sed neque diam, lacinia nec dolor et, euismod bibendum turpis.</p>
        </label>
      ))}
    </div>
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onClose} className="text-sm text-slate-500">Cancel</button>
      <button className="bg-blue-600 px-6 py-3 text-sm font-semibold text-white">PROMOTE JOB <FiArrowRight className="ml-2 inline" /></button>
    </div>
  </Modal>
)

const JobSuccessModal = ({ onClose, setModal }) => (
  <Modal onClose={onClose} width="max-w-2xl">
    <p className="font-semibold">Congratulations, Your Job is successfully posted!</p>
    <p className="mt-2 text-sm text-slate-500">You can manage your form my-jobs section in your dashboard</p>
    <button className="mt-5 border border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600">View Jobs <FiArrowRight className="ml-2 inline" /></button>
    <hr className="my-6" />
    <h2 className="text-xl font-semibold">Promote Job: UI/UX Designer</h2>
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <Panel><div className="h-28 bg-blue-50" /><p className="mt-3 font-semibold">Featured Your Job</p></Panel>
      <Panel><div className="h-28 bg-amber-50" /><p className="mt-3 font-semibold">Highlight Your Job</p></Panel>
    </div>
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onClose} className="text-sm text-slate-500">Skip Now</button>
      <button onClick={() => setModal('promote')} className="bg-blue-600 px-6 py-3 text-sm font-semibold text-white">PROMOTE JOB <FiArrowRight className="ml-2 inline" /></button>
    </div>
  </Modal>
)

const AddColumnModal = ({ onClose }) => (
  <Modal onClose={onClose} width="max-w-md">
    <h2 className="text-lg font-semibold">Add New Column</h2>
    <div className="mt-5"><Input label="Column Name" /></div>
    <div className="mt-6 flex justify-between">
      <button onClick={onClose} className="bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600">Cancel</button>
      <button className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Add Column</button>
    </div>
  </Modal>
)

const CandidateProfileModal = ({ candidate, onClose }) => {
  if (!candidate) return null

  const resumeUrl = resolveUploadUrl(candidate.resume || '')

  return (
  <Modal onClose={onClose} width="max-w-3xl">
    <div className="grid gap-8 md:grid-cols-[1fr_240px]">
      <div>
        <div className="flex items-center gap-4">
          <CandidateAvatar candidate={candidate} />
          <div>
            <h2 className="text-xl font-semibold">{candidate.name}</h2>
            <p className="text-sm text-slate-500">{candidate.role}</p>
          </div>
        </div>
        <SectionTitle>Biography</SectionTitle>
        <p className="text-sm leading-6 text-slate-600">
          {candidate.bio || 'Candidate has not added a biography yet.'}
        </p>
        <SectionTitle>Cover Letter</SectionTitle>
        <p className="text-sm leading-6 text-slate-600">
          {candidate.coverLetter || 'No cover letter submitted.'}
        </p>
        <SectionTitle>Skills</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.length > 0 ? candidate.skills.map((skill) => (
            <span key={skill} className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">{skill}</span>
          )) : <span className="text-sm text-slate-500">No skills added.</span>}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button className="bg-blue-50 p-3 text-blue-600"><FiStar /></button>
          {candidate.email && <a href={`mailto:${candidate.email}`} className="border border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600"><FiMail className="mr-2 inline" /> Send Mail</a>}
        </div>
        <button className="w-full bg-blue-600 py-3 text-sm font-semibold text-white"><FiPlusCircle className="mr-2 inline" /> Move Forward</button>
        <Panel>
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
            <p><FiCalendar className="mb-1 text-blue-600" /> Applied<br /><b className="text-slate-900">{formatDate(candidate.appliedAt)}</b></p>
            <p><FiMapPin className="mb-1 text-blue-600" /> Job Location<br /><b className="text-slate-900">{candidate.location || 'Not added'}</b></p>
            <p><FiCheckCircle className="mb-1 text-blue-600" /> Match<br /><b className="text-slate-900">{candidate.skillMatch}%</b></p>
            <p><FiFileText className="mb-1 text-blue-600" /> Education<br /><b className="text-slate-900">{candidate.edu}</b></p>
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Candidate Resume</p>
          {resumeUrl ? (
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-blue-600"><FiDownload className="mr-2" /> Download resume</a>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No resume attached.</p>
          )}
        </Panel>
        <Panel>
          <p className="mb-4 font-semibold">Contact Information</p>
          {candidate.phone && <p className="text-sm text-slate-600"><FiPhone className="inline text-blue-600" /> {candidate.phone}</p>}
          {candidate.email && <p className="mt-3 text-sm text-slate-600"><FiMail className="inline text-blue-600" /> {candidate.email}</p>}
          {candidate.contactHidden ? (
            <p className="text-sm text-slate-500">Candidate has hidden contact information.</p>
          ) : (
            !candidate.phone && !candidate.email && <p className="text-sm text-slate-500">No contact information shared.</p>
          )}
        </Panel>
      </div>
    </div>
  </Modal>
  )
}

const SectionTitle = ({ children }) => <h3 className="mb-3 mt-7 text-sm font-semibold uppercase">{children}</h3>

const Modal = ({ children, onClose, width }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
    <div className={`relative w-full ${width} rounded bg-white p-6 shadow-2xl`}>
      <button onClick={onClose} className="absolute -right-4 -top-4 grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
        <FiX />
      </button>
      {children}
    </div>
  </div>
)

export default RecruiterWorkspace
