import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FiArrowRight,
  FiBriefcase,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiGrid,
  FiList,
  FiMapPin,
  FiSearch,
  FiSliders,
  FiX,
} from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { jobService } from '../../services/api'
import { resolveUploadUrl } from '../../utils/uploads'

const emptyFilters = {
  search: '',
  location: '',
  category: '',
  organizationType: '',
  radius: '32',
}

const categoryOptions = ['Design', 'Development', 'Marketing', 'Finance', 'Health Care', 'Data Science']
const organizationTypes = ['Government', 'Semi Government', 'NGO', 'Private Company', 'International Agencies', 'Others']
const sortOptions = [
  { value: 'openJobs', label: 'Most open jobs' },
  { value: 'latest', label: 'Latest' },
  { value: 'name', label: 'Company name' },
]
const limitOptions = [6, 12, 24]

const getInitials = (name = 'HF') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const EmployerLogo = ({ employer, compact = false }) => {
  const size = compact ? 'h-12 w-12' : 'h-14 w-14'

  if (employer.logo) {
    return (
      <img
        src={resolveUploadUrl(employer.logo)}
        alt={`${employer.name} logo`}
        className={`${size} rounded-[4px] object-cover ring-1 ring-slate-200`}
      />
    )
  }

  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-[4px] bg-primary text-sm font-bold text-white`}>
      {getInitials(employer.name)}
    </span>
  )
}

const FilterRadio = ({ checked, label, name, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 transition hover:text-primary">
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

const EmployersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamKey = searchParams.toString()
  const committedValues = useMemo(() => {
    const params = new URLSearchParams(searchParamKey)

    return {
      filters: {
        ...emptyFilters,
        search: params.get('search') || '',
        location: params.get('location') || '',
        category: params.get('category') || '',
        organizationType: params.get('organizationType') || '',
        radius: params.get('radius') || '32',
      },
      page: Number(params.get('page')) || 1,
      sort: params.get('sort') || 'openJobs',
      limit: Number(params.get('limit')) || 12,
      view: params.get('view') || 'list',
    }
  }, [searchParamKey])

  const committedFilters = committedValues.filters
  const [filters, setFilters] = useState(committedFilters)
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(committedValues.page)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEmployers, setTotalEmployers] = useState(0)
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      setFilters(committedFilters)
    })
  }, [committedFilters])

  const activeFilters = useMemo(
    () => Object.entries(committedFilters).filter(([key, value]) => key !== 'radius' && String(value).trim()),
    [committedFilters]
  )

  const syncParams = (nextFilters, page = 1, extras = {}) => {
    const params = Object.fromEntries(
      Object.entries(nextFilters).filter(([key, value]) => String(value).trim() && !(key === 'radius' && value === '32'))
    )
    const sort = extras.sort ?? committedValues.sort
    const limit = extras.limit ?? committedValues.limit
    const view = extras.view ?? committedValues.view
    if (page > 1) params.page = String(page)
    if (sort !== 'openJobs') params.sort = sort
    if (limit !== 12) params.limit = String(limit)
    if (view !== 'list') params.view = view
    setSearchParams(params)
  }

  const fetchEmployers = useCallback(async (page = 1, nextFilters = committedFilters) => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit: committedValues.limit,
        sort: committedValues.sort,
        ...Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => String(value).trim())),
      }
      const response = await jobService.getEmployers(params)
      setEmployers(response.data.employers || [])
      setCurrentPage(response.data.page || page)
      setTotalPages(response.data.pages || 1)
      setTotalEmployers(response.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employers')
    } finally {
      setLoading(false)
    }
  }, [committedFilters, committedValues.limit, committedValues.sort])

  useEffect(() => {
    // URL filters drive this backend-backed employer directory.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployers(committedValues.page, committedFilters)
  }, [committedFilters, committedValues.page, fetchEmployers])

  const handleSubmit = (event) => {
    event.preventDefault()
    syncParams(filters, 1)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const setFilterValue = (name, value) => {
    const nextFilters = { ...filters, [name]: filters[name] === value ? '' : value }
    setFilters(nextFilters)
    syncParams(nextFilters, 1)
  }

  const handleReset = () => {
    setFilters(emptyFilters)
    setSearchParams({})
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    syncParams(committedFilters, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MainLayout fullBleed>
      <section className="border-b border-slate-200 bg-[#F1F2F4] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between text-sm">
            <h1 className="font-semibold text-slate-950">Find Employers</h1>
            <span className="text-slate-500">
              <Link to="/" className="transition hover:text-primary">Home</Link>
              {' / '}
              <span className="text-slate-950">Find Employers</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr_0.9fr_auto]">
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiSearch className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input name="search" value={filters.search} onChange={handleChange} placeholder="Job title, Keyword..." className="h-14 w-full bg-white py-3 pl-14 pr-4 text-sm outline-none" />
              </label>
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiMapPin className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input name="location" value={filters.location} onChange={handleChange} placeholder="Location" className="h-14 w-full bg-white py-3 pl-14 pr-4 text-sm outline-none" />
              </label>
              <label className="relative block border-b border-slate-100 lg:border-b-0 lg:border-r">
                <FiBriefcase className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <select name="category" value={filters.category} onChange={handleChange} className="h-14 w-full appearance-none bg-white py-3 pl-14 pr-10 text-sm text-slate-500 outline-none">
                  <option value="">Select Category</option>
                  {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </label>
              <button type="submit" className="inline-flex h-14 items-center justify-center bg-primary px-7 text-sm font-semibold text-white transition hover:bg-blue-700">
                Find Employers
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => setShowFilters((current) => !current)} className="inline-flex h-11 w-fit items-center gap-2 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white">
              <FiSliders className="h-4 w-4" />
              Filter
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {activeFilters.map(([key, value]) => (
                <button key={key} type="button" onClick={() => setFilterValue(key, value)} className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600">
                  {value}
                  <FiX className="h-3.5 w-3.5" />
                </button>
              ))}
              <select value={committedValues.sort} onChange={(event) => syncParams(committedFilters, 1, { sort: event.target.value })} className="h-10 rounded-[4px] border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={committedValues.limit} onChange={(event) => syncParams(committedFilters, 1, { limit: Number(event.target.value) })} className="h-10 rounded-[4px] border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                {limitOptions.map((limit) => <option key={limit} value={limit}>{limit} per page</option>)}
              </select>
              <div className="inline-flex rounded-[4px] border border-slate-200 bg-white p-1">
                <button type="button" onClick={() => syncParams(committedFilters, currentPage, { view: 'grid' })} className={`grid h-8 w-8 place-items-center rounded-[3px] ${committedValues.view === 'grid' ? 'bg-blue-50 text-primary' : 'text-slate-500'}`} aria-label="Grid view"><FiGrid /></button>
                <button type="button" onClick={() => syncParams(committedFilters, currentPage, { view: 'list' })} className={`grid h-8 w-8 place-items-center rounded-[3px] ${committedValues.view === 'list' ? 'bg-blue-50 text-primary' : 'text-slate-500'}`} aria-label="List view"><FiList /></button>
              </div>
            </div>
          </div>

          <div className={`grid gap-6 ${showFilters ? 'lg:grid-cols-[300px_1fr]' : 'lg:grid-cols-1'}`}>
            {showFilters && (
              <aside className="h-fit rounded-[6px] border border-slate-200 bg-white p-6">
                <div className="border-b border-slate-100 pb-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Location Radius: <span className="text-primary">{filters.radius} miles</span></p>
                    <FiChevronUp className="text-slate-500" />
                  </div>
                  <input name="radius" type="range" min="5" max="100" value={filters.radius} onChange={handleChange} onMouseUp={() => syncParams(filters, 1)} onTouchEnd={() => syncParams(filters, 1)} className="w-full accent-primary" />
                </div>

                <div className="border-b border-slate-100 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">Organization Type</p>
                    <FiChevronUp className="text-slate-500" />
                  </div>
                  <div className="space-y-3">
                    {organizationTypes.map((type) => (
                      <FilterRadio key={type} name="organizationType" label={type} checked={filters.organizationType === type} onChange={() => setFilterValue('organizationType', type)} />
                    ))}
                  </div>
                </div>

                <button type="button" onClick={handleReset} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary">
                  <FiX className="h-4 w-4" />
                  Reset Filters
                </button>
              </aside>
            )}

            <div>
              {error && <Error message={error} onRetry={() => fetchEmployers(currentPage)} />}

              {loading ? (
                <Loading message="Loading employers..." />
              ) : employers.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {employers.map((employer) => (
                      <EmployerRow key={employer._id || employer.name} employer={employer} />
                    ))}
                  </div>

                  <EmployerPagination currentPage={currentPage} totalPages={totalPages} totalItems={totalEmployers} currentCount={employers.length} onPageChange={handlePageChange} />
                </>
              ) : (
                <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-12 text-center">
                  <h2 className="text-2xl font-bold text-slate-950">No employers found</h2>
                  <p className="mt-2 text-slate-600">Try another company name, location, or category.</p>
                  <button onClick={handleReset} className="mt-5 rounded-[4px] bg-primary px-5 py-2 font-semibold text-white">Clear Search</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

const EmployerRow = ({ employer }) => {
  const location = employer.locations?.filter(Boolean)?.[0] || 'Location not added'
  const openJobs = employer.openJobs || 0

  return (
    <article className="group rounded-[6px] border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-[0_14px_38px_rgba(10,102,194,0.10)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <EmployerLogo employer={employer} compact />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-slate-950">{employer.name}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><FiMapPin className="text-slate-400" /> {location}</span>
              <span className="inline-flex items-center gap-1"><FiBriefcase className="text-slate-400" /> {openJobs} open Job</span>
            </p>
          </div>
        </div>

        <Link to={`/find-job?company=${encodeURIComponent(employer.name)}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[4px] bg-[#E7F0FA] px-5 text-sm font-semibold text-[#0A66C2] transition hover:bg-[#D6E7F9] hover:text-[#0A66C2]">
          Open Position
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}

const EmployerPagination = ({ currentPage, totalPages, totalItems, currentCount, onPageChange }) => {
  if (totalPages <= 1) {
    return <p className="mt-8 text-center text-sm text-slate-500">Showing {currentCount} of {totalItems} employers</p>
  }

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-slate-500">Showing {currentCount} of {totalItems} employers</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Previous page">
          <FiChevronLeft />
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button key={page} type="button" onClick={() => onPageChange(page)} className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${currentPage === page ? 'bg-primary text-white' : 'text-slate-500 hover:bg-blue-50 hover:text-primary'}`}>
            {String(page).padStart(2, '0')}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300" aria-label="Next page">
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}

export default EmployersPage
