import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBriefcase, FiMapPin, FiCreditCard, FiCheckCircle, FiClock, FiCpu, FiX } from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { applicationService } from '../../services/api'
import { formatDate } from '../../utils/validators'
import { formatSalary, getSalaryDisplayOptions } from '../../utils/currency'
import { useLocationPreference } from '../../context/LocationContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'

const MyApplicationsPage = () => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = getSalaryDisplayOptions(settings, selectedCountry)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzingId, setAnalyzingId] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await applicationService.getMyApplications()
      setApplications(response.data.applications || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Applications are loaded once when this page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplications()
  }, [])

  const handleAnalyzeApplication = async (applicationId) => {
    try {
      setAnalyzingId(applicationId)
      const response = await applicationService.analyzeApplication(applicationId)
      await fetchApplications()
      toast.success(response.data.cached ? 'Resume analysis loaded' : 'Resume analysis completed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resume analysis failed')
    } finally {
      setAnalyzingId('')
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'shortlisted':
        return 'bg-blue-50 border-blue-200'
      case 'accepted':
        return 'bg-green-50 border-green-200'
      case 'rejected':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-600" />
      case 'shortlisted':
        return <FiCheckCircle className="w-5 h-5 text-blue-600" />
      case 'accepted':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <FiX className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <MainLayout>
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-2">My Applications</h1>
        <p className="text-gray-600 mb-8">Track all your job applications</p>

        {error && <Error message={error} onRetry={() => window.location.reload()} />}

        {/* Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'pending', 'shortlisted', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-primary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const analysis = application.resumeAnalysis

              return (
                <div key={application._id} className={`card border-2 ${getStatusColor(application.status)} hover:shadow-lg transition`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
                          <FiBriefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-dark">
                            {application.jobId.title}
                          </h3>
                          <p className="text-gray-600">{application.jobId.company}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-0 md:ml-15">
                        {application.jobId.location && (
                          <div className="flex items-center gap-1">
                            <FiMapPin className="w-4 h-4" />
                            <span>{application.jobId.location}</span>
                          </div>
                        )}
                        {application.jobId.salary && (
                          <div className="flex items-center gap-1">
                            <FiCreditCard className="w-4 h-4" />
                            <span>{formatSalary(application.jobId.salary, salaryOptions)}</span>
                          </div>
                        )}
                        <div className="text-xs">
                          Applied {formatDate(application.appliedAt)}
                        </div>
                      </div>
                      {(analysis || application.aiScreening?.summary) && (
                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700">
                          <span className="font-semibold text-primary">AI match {analysis?.matchScore ?? application.skillMatch ?? 0}%:</span>{' '}
                          {analysis?.summary || application.aiScreening?.summary}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'shortlisted'
                          ? 'bg-blue-100 text-blue-800'
                          : application.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeApplication(application._id)}
                        disabled={analyzingId === application._id}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 font-semibold text-primary hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiCpu className="w-4 h-4" />
                        {analyzingId === application._id ? 'Analyzing...' : analysis ? 'Refresh AI' : 'Analyze Resume'}
                      </button>
                      <Link to={`/jobs/${application.jobId._id}`} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700">
                        View Job
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">
              {filter === 'all'
                ? 'No applications yet. Start applying to jobs!'
                : `No ${filter} applications.`}
            </p>
            <Link to="/jobs" className="text-primary font-medium hover:underline mt-4 inline-block">
              Browse Jobs →
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default MyApplicationsPage
