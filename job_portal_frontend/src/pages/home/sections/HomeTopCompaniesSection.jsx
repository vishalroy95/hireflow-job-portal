import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiMapPin, FiShield } from 'react-icons/fi'
import { resolveUploadUrl } from '../../../utils/uploads'

const getInitials = (name = 'HF') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const buildCompanies = (employers = []) =>
  employers.slice(0, 8).map((employer) => {
    const locations = employer.locations?.filter(Boolean) || []

    return {
      ...employer,
      location: locations[0] || 'Location not added',
      logoUrl: resolveUploadUrl(employer.logo || ''),
      logoText: getInitials(employer.name),
    }
  })

const CompanyLogo = ({ company }) => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-blue-50 text-sm font-bold text-primary ring-1 ring-blue-100">
    {company.logoUrl ? (
      <img src={company.logoUrl} alt={`${company.name} logo`} className="h-full w-full object-cover" />
    ) : (
      company.logoText
    )}
  </div>
)

const EmptyCompanies = () => (
  <div className="rounded-[8px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center sm:col-span-2 lg:col-span-4">
    <p className="text-base font-semibold text-slate-950">No companies are hiring yet.</p>
    <p className="mt-2 text-sm text-slate-500">Approved recruiter companies with active jobs will appear here automatically.</p>
  </div>
)

const HomeTopCompaniesSection = ({ employers }) => {
  const companies = buildCompanies(employers)

  return (
    <section className="bg-white px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Top companies</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-primary transition hover:bg-blue-100"
              aria-label="Previous companies"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-primary transition hover:bg-blue-100"
              aria-label="Next companies"
            >
              <FiArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="section-interaction grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companies.length === 0 && <EmptyCompanies />}
          {companies.map((company, index) => (
            <article
              key={company.companyId || company._id || `${company.name}-${index}`}
              className="section-hover-card rounded-[8px] border border-slate-200 bg-white p-5 transition duration-300 hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start gap-3">
                <CompanyLogo company={company} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-slate-950">{company.name}</h3>
                    {company.verificationStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <FiShield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <FiMapPin className="h-3.5 w-3.5 text-slate-400" />
                    {company.location}
                  </p>
                </div>
              </div>

              <Link
                to={`/jobs?company=${encodeURIComponent(company.name)}`}
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-blue-50 text-sm font-semibold text-blue-600 transition hover:bg-primary hover:text-white"
              >
                {company.openJobs || 0} Open {(company.openJobs || 0) === 1 ? 'Position' : 'Positions'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeTopCompaniesSection
