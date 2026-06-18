import { Link } from 'react-router-dom'
import { FiArrowRight, FiBookmark, FiBriefcase, FiClock, FiCreditCard, FiMapPin, FiUsers } from 'react-icons/fi'
import { formatDate } from '../../utils/validators'
import { formatSalary, getSalaryDisplayOptions } from '../../utils/currency'
import { useLocationPreference } from '../../context/LocationContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'

const JobCard = ({ job, isSaved = false, onToggleSave }) => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = getSalaryDisplayOptions(settings, selectedCountry)
  const initials = (job.company || job.title || 'HF')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleSaveClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleSave?.(job._id)
  }

  return (
    <article className="group flex h-full min-h-[310px] flex-col overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-slate-900 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-950 transition group-hover:text-primary">
                  {job.title}
                </h3>
                <p className="mt-1 truncate text-sm font-medium text-slate-500">{job.company}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                {job.jobType || 'Full-time'}
              </span>
              {onToggleSave && (
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                    isSaved
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
                  }`}
                  aria-label={isSaved ? 'Remove saved job' : 'Save job'}
                >
                  <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <p className="mb-5 line-clamp-2 text-sm leading-6 text-slate-600">
            {job.description}
          </p>

          <div className="mb-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            {job.location && (
              <div className="flex min-w-0 items-center gap-2">
                <FiMapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex min-w-0 items-center gap-2">
                <FiCreditCard className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{formatSalary(job.salary, salaryOptions)}</span>
              </div>
            )}
            {job.experience && (
              <div className="flex min-w-0 items-center gap-2">
                <FiBriefcase className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{job.experience}</span>
              </div>
            )}
            {job.openingsCount && (
              <div className="flex min-w-0 items-center gap-2">
                <FiUsers className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{job.openingsCount} opening{job.openingsCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {job.skillsRequired.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {skill}
                </span>
              ))}
              {job.skillsRequired.length > 4 && (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  +{job.skillsRequired.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5" />
              {formatDate(job.createdAt)}
            </span>
            <Link to={`/jobs/${job._id}`} className="inline-flex items-center gap-1 font-semibold text-primary">
              View Details <FiArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </article>
  )
}

export default JobCard
