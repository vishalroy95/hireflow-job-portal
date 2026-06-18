import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCreditCard, FiMapPin, FiRefreshCw } from 'react-icons/fi'
import { formatSalary, getSalaryDisplayOptions } from '../../../utils/currency'
import { useLocationPreference } from '../../../context/LocationContext'
import { usePlatformSettings } from '../../../context/PlatformSettingsContext'

const initialsFor = (value = 'HF') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const MetaItem = ({ icon: Icon, value }) => {
  if (!value) return null

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{value}</span>
    </span>
  )
}

const RelatedJobCard = ({ job, salaryOptions }) => {
  const salary = job.salary ? formatSalary(job.salary, salaryOptions) : ''

  return (
    <Link
      to={`/jobs/${job._id}`}
      className="group block rounded-[4px] border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-primary text-sm font-bold text-white">
          {initialsFor(job.company || job.title).slice(0, 2)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-950 transition group-hover:text-primary">
              {job.company || job.title}
            </h3>
            {job.featured && (
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                Featured
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{job.location || job.workplaceType || 'Hiring location'}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="truncate text-sm font-semibold text-slate-950">{job.title}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <MetaItem icon={FiBriefcase} value={job.jobType || 'Full-time'} />
          <MetaItem icon={FiCreditCard} value={salary || 'Salary not disclosed'} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <MetaItem icon={FiMapPin} value={job.location} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Details <FiArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

const ArrowButton = ({ direction }) => {
  const Icon = direction === 'left' ? FiArrowLeft : FiArrowRight

  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-blue-50 text-primary transition hover:bg-primary hover:text-white"
      aria-label={direction === 'left' ? 'Previous related jobs' : 'Next related jobs'}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

const JobDetailsRecommendedSection = ({ jobs = [], loading = false }) => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = getSalaryDisplayOptions(settings, selectedCountry)
  const visibleJobs = jobs.slice(0, 6)

  if (loading) {
    return (
      <section className="mt-14 border-t border-slate-100 pt-9">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <FiRefreshCw className="h-5 w-5 animate-spin text-primary" />
          Loading related jobs...
        </div>
      </section>
    )
  }

  if (!visibleJobs.length) return null

  return (
    <section className="mt-14 border-t border-slate-100 pt-9">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-950">Related Jobs</h2>
        <div className="flex items-center gap-2">
          <ArrowButton direction="left" />
          <ArrowButton direction="right" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleJobs.map((job) => (
          <RelatedJobCard key={job._id} job={job} salaryOptions={salaryOptions} />
        ))}
      </div>

      {jobs.length > 6 && (
        <div className="mt-6 text-right">
          <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-blue-700">
            Browse all <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  )
}

export default JobDetailsRecommendedSection
