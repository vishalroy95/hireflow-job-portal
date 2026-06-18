import { FiArrowLeft, FiArrowRight, FiBookmark, FiGlobe, FiMail, FiPhone } from 'react-icons/fi'
import { resolveUploadUrl } from '../../../utils/uploads'

const JobDetailsHeaderSection = ({ isSaved, job, onBack, onApplyClick, onToggleSave }) => {
  const company = job.companyProfile || {}
  const initials = (job.company || job.title || 'HF')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const logoUrl = resolveUploadUrl(company.logo || '')
  const contactItems = [
    company.website && { icon: FiGlobe, label: company.website, href: company.website },
    company.phone && { icon: FiPhone, label: company.phone },
    (job.createdBy?.email || company.email) && { icon: FiMail, label: job.createdBy?.email || company.email, href: `mailto:${job.createdBy?.email || company.email}` },
  ].filter(Boolean)

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xl font-bold text-primary ring-1 ring-blue-100">
              {logoUrl ? (
                <img src={logoUrl} alt={`${job.company} logo`} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">{job.title}</h1>
                {job.featured && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">Featured</span>}
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary">{job.jobType || 'Full-time'}</span>
                {job.workplaceType && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{job.workplaceType}</span>}
              </div>
              <p className="font-medium text-slate-600">{job.company}</p>
              {contactItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  {contactItems.map((item) => {
                    const Icon = item.icon
                    const content = (
                      <>
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="truncate">{item.label}</span>
                      </>
                    )

                    return item.href ? (
                      <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="inline-flex max-w-xs items-center gap-2 hover:text-primary">
                        {content}
                      </a>
                    ) : (
                      <span key={item.label} className="inline-flex items-center gap-2">{content}</span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <button
              type="button"
              onClick={onToggleSave}
              className={`inline-flex h-12 w-full items-center justify-center rounded-[4px] border sm:w-12 ${
                isSaved
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
              }`}
              aria-label={isSaved ? 'Remove saved job' : 'Save job'}
            >
              <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button onClick={onApplyClick} className="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-[4px] bg-primary px-6 text-sm font-semibold text-white transition hover:bg-blue-700">
              Apply Now <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JobDetailsHeaderSection
