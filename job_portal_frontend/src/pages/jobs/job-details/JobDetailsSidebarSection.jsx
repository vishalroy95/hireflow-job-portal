import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import { formatSalary, getSalaryDisplayOptions } from '../../../utils/currency'
import { formatDate } from '../../../utils/validators'
import { resolveUploadUrl } from '../../../utils/uploads'
import { useLocationPreference } from '../../../context/LocationContext'
import { usePlatformSettings } from '../../../context/PlatformSettingsContext'

const addDays = (value, days) => {
  if (!value) return null
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

const InfoTile = ({ icon: Icon, label, value }) => {
  if (!value) return null

  return (
    <div>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[4px] bg-blue-50 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}

const CompanyLogo = ({ companyName, logo }) => {
  const logoUrl = resolveUploadUrl(logo || '')
  const initials = (companyName || 'HF')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-blue-50 text-base font-bold text-primary ring-1 ring-blue-100">
      {logoUrl ? <img src={logoUrl} alt={`${companyName} logo`} className="h-full w-full object-cover" /> : initials}
    </div>
  )
}

const DetailRow = ({ label, value }) => {
  if (!value) return null

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-slate-950">{value}</span>
    </div>
  )
}

const JobDetailsSidebarSection = ({ job }) => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = getSalaryDisplayOptions(settings, selectedCountry)
  const company = job.companyProfile || {}
  const expiryDate = job.expiresAt || addDays(job.createdAt, 30)
  const overviewItems = [
    { icon: FiCalendar, label: 'Job Posted', value: formatDate(job.createdAt) },
    { icon: FiClock, label: 'Job Expire In', value: expiryDate ? formatDate(expiryDate) : '' },
    { icon: FiCreditCard, label: 'Salary', value: job.salary ? formatSalary(job.salary, salaryOptions) : '' },
    { icon: FiMapPin, label: 'Location', value: job.location },
    { icon: FiBriefcase, label: 'Job Type', value: job.jobType },
    { icon: FiUsers, label: 'Openings', value: job.openingsCount ? `${job.openingsCount} opening${job.openingsCount > 1 ? 's' : ''}` : '' },
    { icon: FiShield, label: 'Experience', value: job.experience },
  ]

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
      <section className="rounded-[8px] border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-950">Job Overview</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7">
          {overviewItems.map((item) => (
            <InfoTile key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="rounded-[8px] border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo companyName={job.company} logo={company.logo} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-950">{job.company}</h2>
              {company.verificationStatus === 'approved' && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Verified</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{company.industryType || 'Hiring company'}</p>
          </div>
        </div>

        {company.description && (
          <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">{company.description}</p>
        )}

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
          <DetailRow label="Company size" value={company.companySize} />
          <DetailRow label="Organization type" value={company.organizationType} />
          <DetailRow label="Website" value={company.website} />
          <DetailRow label="Email" value={job.createdBy?.email || company.email} />
        </div>

        <div className="mt-6 flex gap-2">
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-blue-50 text-primary transition hover:bg-primary hover:text-white" aria-label="Company website">
              <FiGlobe className="h-4 w-4" />
            </a>
          )}
          {(job.createdBy?.email || company.email) && (
            <a href={`mailto:${job.createdBy?.email || company.email}`} className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-blue-50 text-primary transition hover:bg-primary hover:text-white" aria-label="Email company">
              <FiMail className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>
    </aside>
  )
}

export default JobDetailsSidebarSection
