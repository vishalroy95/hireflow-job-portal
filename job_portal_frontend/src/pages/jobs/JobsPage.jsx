import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiArrowRight,
  FiBookmark,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiGrid,
  FiLayers,
  FiList,
  FiMapPin,
  FiSearch,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { candidateService, jobService } from '../../services/api'
import { formatSalary, getSalaryDisplayOptions } from '../../utils/currency'
import { useLocationPreference } from '../../context/LocationContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'
import { formatDate } from '../../utils/validators'

const emptyFilters = {
  title: '',
  location: '',
  company: '',
  skills: '',
  experience: '',
  workplaceType: '',
  jobType: '',
  minSalary: '',
  maxSalary: '',
}

const filterLabels = {
  title: 'Keyword',
  location: 'Location',
  company: 'Company',
  skills: 'Category',
  experience: 'Experience',
  workplaceType: 'Workplace',
  jobType: 'Type',
  minSalary: 'Min salary',
  maxSalary: 'Max salary',
}

const categoryOptions = ['Design', 'Development', 'Marketing', 'Finance', 'Health Care', 'Data Science']
const experienceOptions = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', '0-1 years', '1-3 years', '3-5 years', '5+ years']
const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship']
const workplaceOptions = ['Onsite', 'Remote', 'Hybrid']
const salaryRanges = [
  { label: 'Below 1L', minSalary: '', maxSalary: '100000' },
  { label: '1L - 5L', minSalary: '100000', maxSalary: '500000' },
  { label: '5L - 10L', minSalary: '500000', maxSalary: '1000000' },
  { label: '10L - 20L', minSalary: '1000000', maxSalary: '2000000' },
  { label: '20L+', minSalary: '2000000', maxSalary: '' },
]
const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'salaryHigh', label: 'Salary high to low' },
  { value: 'salaryLow', label: 'Salary low to high' },
]
const limitOptions = [6, 9, 12, 24]

const getInitials = (job) => (job.company || job.title || 'HF')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase()

const pageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('left-gap')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push('right-gap')
  pages.push(total)
  return pages
}

const FilterRadio = ({ checked, label, name, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 transition hover:text-primary">
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
    />
    {label}
  </label>
)

const FilterColumn = ({ title, children }) => (
  <div className="border-slate-100 px-6 py-5 lg:border-l first:lg:border-l-0">
    <h3 className="mb-4 text-sm font-semibold text-slate-950">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
)

const JobsPage = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const searchParamKey = searchParams.toString()

  const committedValues = useMemo(() => {
    const params = new URLSearchParams(searchParamKey)

    return {
      filters: {
        ...emptyFilters,
        ...Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, params.get(key) || ''])),
      },
      sort: params.get('sort') || 'latest',
      limit: Number(params.get('limit')) || 12,
      view: params.get('view') || 'grid',
      page: Number(params.get('page')) || 1,
    }
  }, [searchParamKey])
  const committedFilters = committedValues.filters
  const committedSort = committedValues.sort
  const committedLimit = committedValues.limit
  const viewMode = committedValues.view
  const [filters, setFilters] = useState(committedFilters)

  const activeFilters = useMemo(
    () => Object.entries(committedFilters).filter(([, value]) => String(value).trim()),
    [committedFilters]
  )

  const fetchJobs = useCallback(async (page = 1, nextFilters = committedFilters) => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit: committedLimit,
        sort: committedSort,
        ...Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => String(value).trim())),
      }
      const response = await jobService.getAllJobs(params)
      setJobs(response.data.jobs || [])
      setCurrentPage(response.data.page || page)
      setTotalPages(response.data.pages || response.data.totalPages || 1)
      setTotalJobs(response.data.total || response.data.count || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [committedFilters, committedLimit, committedSort])

  useEffect(() => {
    // The jobs list is server-driven, so URL changes intentionally refresh React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs(committedValues.page, committedFilters)
  }, [committedFilters, committedValues.page, fetchJobs])

  useEffect(() => {
    if (user?.role !== 'candidate') return

    const fetchSavedJobs = async () => {
      try {
        const response = await candidateService.getSavedJobs()
        const savedIds = (response.data.jobs || []).map((job) => job._id || job)
        setSavedJobIds(new Set(savedIds.map(String)))
      } catch {
        setSavedJobIds(new Set())
      }
    }

    fetchSavedJobs()
  }, [user?.role])

  const syncParams = (nextFilters, page = 1, extras = {}) => {
    const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => String(value).trim()))
    const sort = extras.sort ?? committedSort
    const limit = extras.limit ?? committedLimit
    const view = extras.view ?? viewMode
    if (page > 1) params.page = String(page)
    if (sort !== 'latest') params.sort = sort
    if (limit !== 12) params.limit = String(limit)
    if (view !== 'grid') params.view = view
    setSearchParams(params)
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const setFilterValue = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: prev[name] === value ? '' : value }))
  }

  const handleSalaryRange = (range) => {
    setFilters((prev) => ({
      ...prev,
      minSalary: prev.minSalary === range.minSalary && prev.maxSalary === range.maxSalary ? '' : range.minSalary,
      maxSalary: prev.minSalary === range.minSalary && prev.maxSalary === range.maxSalary ? '' : range.maxSalary,
    }))
  }

  const selectedSalaryRange = salaryRanges.find(
    (range) => range.minSalary === filters.minSalary && range.maxSalary === filters.maxSalary
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    syncParams(filters, 1)
  }

  const handleRemoveFilter = (key) => {
    const nextFilters = { ...committedFilters, [key]: '' }
    if (key === 'minSalary' || key === 'maxSalary') {
      nextFilters.minSalary = ''
      nextFilters.maxSalary = ''
    }
    setFilters(nextFilters)
    syncParams(nextFilters, 1)
  }

  const handleResetFilters = () => {
    setFilters(emptyFilters)
    syncParams(emptyFilters, 1)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    syncParams(committedFilters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (event) => {
    syncParams(committedFilters, 1, { sort: event.target.value })
  }

  const handleLimitChange = (event) => {
    syncParams(committedFilters, 1, { limit: Number(event.target.value) })
  }

  const handleViewChange = (mode) => {
    syncParams(committedFilters, currentPage, { view: mode })
  }

  const handleToggleSavedJob = async (jobId) => {
    if (user?.role !== 'candidate') {
      toast.error('Please sign in as a candidate to save jobs.')
      return
    }

    try {
      const response = await candidateService.toggleSavedJob(jobId)
      const nextSavedIds = (response.data.savedJobs || []).map(String)
      setSavedJobIds(new Set(nextSavedIds))
      toast.success(response.data.saved ? 'Job saved' : 'Job removed from saved jobs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update saved job')
    }
  }

  return (
    <MainLayout fullBleed>
      <section className="border-b border-slate-200 bg-[#F1F2F4] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between text-sm">
            <h1 className="font-semibold text-slate-950">Find Job</h1>
            <span className="text-slate-500">
              <Link to="/" className="transition hover:text-primary">Home</Link>
              {' / '}
              <span className="text-slate-950">Find Job</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr_0.9fr_auto_auto]">
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiSearch className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  name="title"
                  placeholder="Job title, keyword..."
                  value={filters.title}
                  onChange={handleFilterChange}
                  className="h-14 w-full bg-white py-3 pl-14 pr-4 text-sm outline-none"
                />
              </label>
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiMapPin className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="h-14 w-full bg-white py-3 pl-14 pr-4 text-sm outline-none"
                />
              </label>
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiLayers className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <select
                  name="skills"
                  value={filters.skills}
                  onChange={handleFilterChange}
                  className="h-14 w-full appearance-none bg-white py-3 pl-14 pr-10 text-sm text-slate-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </label>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
                className="inline-flex h-14 items-center justify-center gap-2 border-b border-slate-100 px-5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-primary lg:border-b-0 lg:border-r"
              >
                Advance Filter {showAdvancedFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              <button type="submit" className="inline-flex h-14 items-center justify-center bg-primary px-7 text-sm font-semibold text-white transition hover:bg-blue-700">
                Find Job
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="grid border-t border-slate-100 bg-white md:grid-cols-2 lg:grid-cols-5">
                <FilterColumn title="Experience">
                  {experienceOptions.map((option) => (
                    <FilterRadio key={option} name="experience" label={option} checked={filters.experience === option} onChange={() => setFilterValue('experience', option)} />
                  ))}
                </FilterColumn>
                <FilterColumn title="Salary">
                  {salaryRanges.map((range) => (
                    <FilterRadio key={range.label} name="salary" label={range.label} checked={selectedSalaryRange?.label === range.label} onChange={() => handleSalaryRange(range)} />
                  ))}
                </FilterColumn>
                <FilterColumn title="Job Type">
                  {jobTypeOptions.map((option) => (
                    <FilterRadio key={option} name="jobType" label={option} checked={filters.jobType === option} onChange={() => setFilterValue('jobType', option)} />
                  ))}
                </FilterColumn>
                <FilterColumn title="Workplace">
                  {workplaceOptions.map((option) => (
                    <FilterRadio key={option} name="workplaceType" label={option} checked={filters.workplaceType === option} onChange={() => setFilterValue('workplaceType', option)} />
                  ))}
                </FilterColumn>
                <FilterColumn title="Company">
                  <label className="block">
                    <span className="mb-2 block text-sm text-slate-500">Company name</span>
                    <input
                      name="company"
                      value={filters.company}
                      onChange={handleFilterChange}
                      placeholder="Search company"
                      className="h-10 w-full rounded-[4px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-300"
                    />
                  </label>
                  <button type="button" onClick={handleResetFilters} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary">
                    <FiX className="h-4 w-4" />
                    Reset Filters
                  </button>
                </FilterColumn>
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {activeFilters.length ? activeFilters.map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRemoveFilter(key)}
                  className="inline-flex h-8 items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-primary"
                >
                  {filterLabels[key]}: {value}
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )) : (
                <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-500">All active jobs</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select value={committedSort} onChange={handleSortChange} className="h-10 rounded-[4px] border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-300">
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={committedLimit} onChange={handleLimitChange} className="h-10 rounded-[4px] border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-300">
                {limitOptions.map((limit) => <option key={limit} value={limit}>{limit} per page</option>)}
              </select>
              <div className="inline-flex rounded-[4px] border border-slate-200 bg-white p-1">
                <button type="button" onClick={() => handleViewChange('grid')} className={`grid h-8 w-8 place-items-center rounded-[3px] ${viewMode === 'grid' ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:text-primary'}`} aria-label="Grid view">
                  <FiGrid className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => handleViewChange('list')} className={`grid h-8 w-8 place-items-center rounded-[3px] ${viewMode === 'list' ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:text-primary'}`} aria-label="List view">
                  <FiList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {error && <Error message={error} onRetry={() => fetchJobs(currentPage)} />}

          {loading ? (
            <Loading />
          ) : jobs.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                {jobs.map((job) => (
                  <FindJobCard
                    key={job._id}
                    job={job}
                    viewMode={viewMode}
                    isSaved={savedJobIds.has(String(job._id))}
                    onToggleSave={user?.role === 'candidate' ? handleToggleSavedJob : undefined}
                  />
                ))}
              </div>

              <ProfessionalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalJobs}
                pageSize={committedLimit}
                currentCount={jobs.length}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-2xl font-bold text-slate-950">No jobs found</h2>
              <p className="mt-2 text-slate-600">Try removing a filter or searching a broader keyword.</p>
              <button onClick={handleResetFilters} className="mt-5 rounded-[4px] bg-primary px-5 py-2 font-semibold text-white">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}

const FindJobCard = ({ job, viewMode, isSaved, onToggleSave }) => {
  const { selectedCountry } = useLocationPreference()
  const { settings } = usePlatformSettings()
  const salaryOptions = getSalaryDisplayOptions(settings, selectedCountry)
  const initials = getInitials(job)

  const handleSaveClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleSave?.(job._id)
  }

  if (viewMode === 'list') {
    return (
      <article className="group rounded-[6px] border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-[0_14px_38px_rgba(10,102,194,0.10)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyMark initials={initials} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950 group-hover:text-primary">{job.title}</h2>
                {job.featured && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">Featured</span>}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{job.company}</span>
                <span className="inline-flex items-center gap-1"><FiMapPin /> {job.location || 'Location not added'}</span>
                <span>{job.jobType || 'Full-time'}</span>
                <span>{formatSalary(job.salary, salaryOptions)}</span>
              </p>
            </div>
          </div>
          <CardActions job={job} isSaved={isSaved} onSave={handleSaveClick} />
        </div>
      </article>
    )
  }

  return (
    <article className="group flex min-h-[188px] flex-col justify-between rounded-[6px] border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-[0_14px_38px_rgba(10,102,194,0.10)]">
      <div>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <CompanyMark initials={initials} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-950">{job.company}</p>
                {job.featured && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">Featured</span>}
              </div>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><FiMapPin className="shrink-0" /> {job.location || 'Location not added'}</p>
            </div>
          </div>
          {onToggleSave && (
            <button type="button" onClick={handleSaveClick} className={`grid h-10 w-10 shrink-0 place-items-center rounded-[4px] transition ${isSaved ? 'bg-primary text-white' : 'bg-blue-50 text-primary hover:bg-primary hover:text-white'}`} aria-label={isSaved ? 'Remove saved job' : 'Save job'}>
              <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <Link to={`/jobs/${job._id}`} className="text-base font-semibold text-slate-950 transition group-hover:text-primary">{job.title}</Link>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{job.jobType || 'Full-time'}</span>
          <span>.</span>
          <span>{formatSalary(job.salary, salaryOptions)}</span>
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><FiClock /> {formatDate(job.createdAt)}</span>
        <Link to={`/jobs/${job._id}`} className="inline-flex items-center gap-1 font-semibold text-primary">Details <FiArrowRight /></Link>
      </div>
    </article>
  )
}

const CompanyMark = ({ initials }) => (
  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[4px] bg-primary text-sm font-bold text-white">
    {initials}
  </span>
)

const CardActions = ({ job, isSaved, onSave }) => (
  <div className="flex shrink-0 items-center gap-2">
    {onSave && (
      <button type="button" onClick={onSave} className={`grid h-10 w-10 place-items-center rounded-[4px] transition ${isSaved ? 'bg-primary text-white' : 'bg-blue-50 text-primary hover:bg-primary hover:text-white'}`} aria-label={isSaved ? 'Remove saved job' : 'Save job'}>
        <FiBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>
    )}
    <Link to={`/jobs/${job._id}`} className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white">
      View Details <FiArrowRight className="h-4 w-4" />
    </Link>
  </div>
)

const ProfessionalPagination = ({ currentPage, totalPages, totalItems, pageSize, currentCount, onPageChange }) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(totalItems, start + currentCount - 1)

  if (totalPages <= 1) {
    return (
      <div className="mt-8 text-center text-sm text-slate-500">
        Showing {start}-{end} of {totalItems} jobs
      </div>
    )
  }

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-500">Showing {start}-{end} of {totalItems} jobs</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>
        {pageNumbers(currentPage, totalPages).map((page) => (
          typeof page === 'number' ? (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${currentPage === page ? 'bg-primary text-white' : 'text-slate-500 hover:bg-blue-50 hover:text-primary'}`}
            >
              {String(page).padStart(2, '0')}
            </button>
          ) : (
            <span key={page} className="px-2 text-slate-400">...</span>
          )
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}

export default JobsPage
