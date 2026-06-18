import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowRight, FiBookmark, FiCalendar, FiCreditCard, FiMapPin } from 'react-icons/fi'
import { useAuth } from '../../../context/AuthContext'
import { useLocationPreference } from '../../../context/LocationContext'
import { usePlatformSettings } from '../../../context/PlatformSettingsContext'
import Loading from '../../../components/ui/Loading'
import Error from '../../../components/ui/Error'
import { candidateService } from '../../../services/api'

const fallbackJobs = [
  {
    _id: 'demo-senior-ux-designer',
    title: 'Senior UX Designer',
    company: 'Upwork',
    location: 'Australia',
    salary: { min: 2500000, max: 3000000, currency: 'INR' },
    jobType: 'Contract Base',
    logoText: 'Up',
    logoClass: 'bg-[#66d83f] text-white',
  },
  {
    _id: 'demo-software-engineer',
    title: 'Software Engineer',
    company: 'Apple',
    location: 'China',
    salary: { min: 4200000, max: 5000000, currency: 'INR' },
    jobType: 'Full Time',
    logoText: 'A',
    logoClass: 'bg-slate-950 text-white',
  },
  {
    _id: 'demo-junior-graphic-designer',
    title: 'Junior Graphic Designer',
    company: 'Figma',
    location: 'Canada',
    salary: { min: 4000000, max: 5800000, currency: 'INR' },
    jobType: 'Full Time',
    logoText: 'Fi',
    logoClass: 'bg-black text-[#24cb71]',
  },
  {
    _id: 'demo-product-designer',
    title: 'Product Designer',
    company: 'Dribbble',
    location: 'United States',
    salary: { min: 3000000, max: 3400000, currency: 'INR' },
    jobType: 'Full Time',
    logoText: 'u',
    logoClass: 'bg-red-500 text-white',
  },
  {
    _id: 'demo-marketing-officer',
    title: 'Marketing Officer',
    company: 'Facebook',
    location: 'Germany',
    salary: { min: 4200000, max: 7500000, currency: 'INR' },
    jobType: 'Internship',
    logoText: 'f',
    logoClass: 'bg-blue-600 text-white',
  },
  {
    _id: 'demo-interaction-designer',
    title: 'Interaction Designer',
    company: 'Google',
    location: 'France',
    salary: { min: 450000, max: 850000, currency: 'INR' },
    jobType: 'Full Time',
    logoText: 'G',
    logoClass: 'bg-slate-100 text-blue-600',
  },
]

const formatCompactSalary = (salary, { countryCode = 'IN', usdRate = 0.012 } = {}) => {
  if (!salary?.min || !salary?.max) return countryCode === 'IN' ? 'INR 30K-INR 35K' : '$360-$420'

  const sourceCurrency = salary.currency || 'INR'
  const minInr = sourceCurrency === 'USD' && usdRate > 0 ? Number(salary.min) / usdRate : Number(salary.min)
  const maxInr = sourceCurrency === 'USD' && usdRate > 0 ? Number(salary.max) / usdRate : Number(salary.max)
  const showUsd = countryCode !== 'IN'
  const symbol = showUsd ? '$' : 'INR '
  const minAmount = showUsd ? minInr * Number(usdRate || 0.012) : minInr
  const maxAmount = showUsd ? maxInr * Number(usdRate || 0.012) : maxInr
  const min = Math.round(minAmount / 1000)
  const max = Math.round(maxAmount / 1000)

  return `${symbol}${min}K-${symbol}${max}K`
}

const getLogo = (job) => {
  if (job.logoText) return job.logoText

  return (job.company || job.title || 'J')
    .split(' ')
    .filter(Boolean)
    .slice(0, 1)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const FeaturedJobRow = ({ isSaved, job, index, onToggleSave }) => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = {
    countryCode: selectedCountry?.code || 'IN',
    usdRate: Number(settings?.currency?.usdRate || 0.012),
  }
  const canSave = !String(job._id).startsWith('demo-') && onToggleSave

  return (
    <article
      className="section-hover-card flex flex-col gap-5 rounded-[8px] border bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-300 sm:flex-row sm:items-center sm:justify-between"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] text-base font-bold ${
            job.logoClass || 'bg-primary text-white'
          }`}
        >
          {getLogo(job)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/jobs/${job._id}`}
              className="truncate text-base font-semibold text-slate-950 hover:text-primary"
            >
              {job.title}
            </Link>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
              {job.jobType || 'Full Time'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiMapPin className="h-3.5 w-3.5 text-slate-400" />
              {job.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1.5">
              <FiCreditCard className="h-3.5 w-3.5 text-slate-400" />
              {formatCompactSalary(job.salary, salaryOptions)}
            </span>
            <span className="flex items-center gap-1.5">
              <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
              Open now
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => canSave && onToggleSave(job._id)}
          disabled={!canSave}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] text-primary transition hover:bg-blue-50"
          aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
        >
          <FiBookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        <Link
          to={`/jobs/${job._id}`}
          className="inline-flex h-10 min-w-[122px] items-center justify-center gap-2 rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-blue-600 transition hover:bg-primary hover:text-white"
        >
          Apply Now <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

const HomeFeaturedJobsSection = ({ jobs, loading, error }) => {
  const { user } = useAuth()
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const visibleJobs = jobs.length > 0 ? jobs.slice(0, 6) : fallbackJobs

  useEffect(() => {
    if (user?.role !== 'candidate') return

    const fetchSavedJobs = async () => {
      try {
        const response = await candidateService.getSavedJobs()
        const ids = (response.data.jobs || []).map((job) => job._id || job)
        setSavedJobIds(new Set(ids.map(String)))
      } catch {
        setSavedJobIds(new Set())
      }
    }

    fetchSavedJobs()
  }, [user?.role])

  const handleToggleSave = async (jobId) => {
    if (user?.role !== 'candidate') {
      toast.error('Please sign in as a candidate to save jobs.')
      return
    }

    try {
      const response = await candidateService.toggleSavedJob(jobId)
      const ids = (response.data.savedJobs || []).map(String)
      setSavedJobIds(new Set(ids))
      toast.success(response.data.saved ? 'Job saved' : 'Job removed from saved jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update saved job')
    }
  }

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Featured job</h2>
          <Link
            to="/jobs"
            className="inline-flex h-11 items-center gap-2 rounded-[4px] border border-blue-100 px-5 text-sm font-semibold text-primary transition hover:border-blue-200 hover:bg-blue-50"
          >
            View All <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error && <Error message={error} />}

        {loading ? (
          <Loading />
        ) : (
          <div className="section-interaction space-y-4">
            {visibleJobs.map((job, index) => (
              <FeaturedJobRow
                key={job._id}
                isSaved={savedJobIds.has(String(job._id))}
                job={job}
                index={index}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HomeFeaturedJobsSection

