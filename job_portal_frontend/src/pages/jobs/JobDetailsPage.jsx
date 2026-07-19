import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { applicationService, candidateService, jobService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import JobApplyModal from './job-details/JobApplyModal'
import JobDetailsDescriptionSection from './job-details/JobDetailsDescriptionSection'
import JobDetailsHeaderSection from './job-details/JobDetailsHeaderSection'
import JobDetailsRecommendedSection from './job-details/JobDetailsRecommendedSection'
import JobResumeMatchPanel from './job-details/JobResumeMatchPanel'
import JobDetailsSidebarSection from './job-details/JobDetailsSidebarSection'
import JobDetailsSkillsSection from './job-details/JobDetailsSkillsSection'

const JobDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const isCandidate = user?.role === 'candidate'
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [recommendedLoading, setRecommendedLoading] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeMatchLoading, setResumeMatchLoading] = useState(false)
  const [resumeMatch, setResumeMatch] = useState(null)
  const [resumeMatchError, setResumeMatchError] = useState('')
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationData, setApplicationData] = useState({
    resume: '',
    coverLetter: '',
  })

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        setError('')
        setRecommendedJobs([])
        setResumeMatch(null)
        setResumeMatchError('')
        setShowApplicationForm(false)
        setApplicationData({ resume: '', coverLetter: '' })
        const response = await jobService.getJobById(id)
        setJob(response.data.job || response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job details')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  useEffect(() => {
    if (!isCandidate) return

    const fetchSavedJobs = async () => {
      try {
        const response = await candidateService.getSavedJobs()
        const savedIds = (response.data.jobs || []).map((savedJob) => savedJob._id || savedJob)
        setSavedJobIds(new Set(savedIds.map(String)))
      } catch {
        setSavedJobIds(new Set())
      }
    }

    fetchSavedJobs()
  }, [isCandidate])

  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      try {
        setRecommendedLoading(true)
        const response = await jobService.getRecommendedJobs(id, { limit: 4 })
        setRecommendedJobs(response.data.jobs || [])
      } catch {
        setRecommendedJobs([])
      } finally {
        setRecommendedLoading(false)
      }
    }

    if (job?._id) {
      fetchRecommendedJobs()
    }
  }, [id, job?._id])

  const handleApplyClick = () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!isCandidate) {
      toast.error('Please use a candidate account to apply for jobs.')
      return
    }

    const openForm = async () => {
      try {
        const response = await candidateService.getProfile()
        const profileData = response.data || {}
        const resume = profileData.user?.resume || profileData.profile?.resume || ''
        setCandidateProfile(profileData)
        setApplicationData((current) => ({ ...current, resume: resume ? '__profile__' : '' }))
      } catch {
        setCandidateProfile(null)
        setApplicationData((current) => ({ ...current, resume: '' }))
      } finally {
        setShowApplicationForm(true)
      }
    }

    openForm()
  }

  const handleToggleSavedJob = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!isCandidate) {
      toast.error('Please use a candidate account to save jobs.')
      return
    }

    try {
      const response = await candidateService.toggleSavedJob(id)
      const nextSavedIds = (response.data.savedJobs || []).map(String)
      setSavedJobIds(new Set(nextSavedIds))
      toast.success(response.data.saved ? 'Job saved' : 'Job removed from saved jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update saved job')
    }
  }

  const handleAnalyzeJobResume = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!isCandidate) {
      toast.error('Please use a candidate account to check resume match.')
      return
    }

    try {
      setResumeMatchLoading(true)
      setResumeMatchError('')
      const response = await applicationService.analyzeJobResume(id)
      setResumeMatch(response.data.analysis || null)
      toast.success('Resume match checked')
    } catch (err) {
      const message = err.response?.data?.message || 'Could not check resume match'
      setResumeMatchError(message)
      toast.error(message)
    } finally {
      setResumeMatchLoading(false)
    }
  }

  const handleApplicationChange = (field, value) => {
    setApplicationData((prev) => ({ ...prev, [field]: value }))
  }

  const handleResumeUpload = async (file) => {
    if (!file) return

    try {
      setResumeUploading(true)
      const response = await candidateService.uploadResume(file)
      const uploadedResume = response.data.filePath
      setCandidateProfile((current) => ({
        ...(current || {}),
        user: { ...(current?.user || {}), resume: uploadedResume },
        profile: {
          ...(current?.profile || {}),
          resume: uploadedResume,
          resumeFile: response.data.resumeFile || current?.profile?.resumeFile,
        },
      }))
      setApplicationData((current) => ({ ...current, resume: uploadedResume }))
      toast.success('Resume uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload resume')
    } finally {
      setResumeUploading(false)
    }
  }

  const handleApplySubmit = async (event) => {
    event.preventDefault()
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setSubmitting(true)
      const profileResume = candidateProfile?.user?.resume || candidateProfile?.profile?.resume || ''
      const selectedResume = applicationData.resume === '__profile__' ? profileResume : applicationData.resume

      if (!selectedResume) {
        toast.error('Please upload a resume before applying.')
        return
      }

      const payload = {
        ...applicationData,
        resume: selectedResume,
      }
      await applicationService.applyForJob(id, payload)
      toast.success('Application submitted successfully!')
      setShowApplicationForm(false)
      setApplicationData({ resume: '', coverLetter: '' })
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit application'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading fullScreen />

  if (error) {
    return (
      <MainLayout>
        <Error message={error} onRetry={() => window.location.reload()} />
      </MainLayout>
    )
  }

  if (!job) {
    return (
      <MainLayout>
        <div className="py-20 text-center">Job not found</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout fullBleed>
      <JobDetailsHeaderSection
        isSaved={savedJobIds.has(String(job._id))}
        job={job}
        onApplyClick={handleApplyClick}
        onBack={() => navigate('/jobs')}
        onToggleSave={handleToggleSavedJob}
      />

      <div className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-8">
              {(!user || isCandidate) && (
                <JobResumeMatchPanel
                  analysis={resumeMatch}
                  error={resumeMatchError}
                  loading={resumeMatchLoading}
                  onAnalyze={handleAnalyzeJobResume}
                />
              )}
              <JobDetailsDescriptionSection job={job} />
              <JobDetailsSkillsSection skills={job.skillsRequired || []} />
            </div>

            <JobDetailsSidebarSection job={job} />
          </div>

          <JobDetailsRecommendedSection jobs={recommendedJobs} loading={recommendedLoading} />
        </div>
      </div>

      {showApplicationForm && (
        <JobApplyModal
          applicationData={applicationData}
          candidateProfile={candidateProfile}
          job={job}
          onCancel={() => setShowApplicationForm(false)}
          onChange={handleApplicationChange}
          onResumeUpload={handleResumeUpload}
          onSubmit={handleApplySubmit}
          resumeUploading={resumeUploading}
          submitting={submitting}
        />
      )}
    </MainLayout>
  )
}

export default JobDetailsPage
