import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { logService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'

const categoryOptions = ['auth', 'admin', 'recruiter', 'candidate', 'application', 'email', 'support', 'system']
const severityOptions = ['info', 'warning', 'error']
const roleOptions = ['admin', 'recruiter', 'candidate', 'guest', 'system']

const severityClass = {
  info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/10 text-red-300 border-red-500/30',
}

const formatLogDate = (value) => {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function LogManagement() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    severity: '',
    actorRole: '',
    from: '',
    to: '',
  })

  const activeFilters = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
  }, [filters])

  const loadLogs = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await logService.getLogs({ ...activeFilters, page: nextPage, limit: 20 })
      setLogs(response.data.logs || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(1)
  }, [filters.category, filters.severity, filters.actorRole])

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadLogs(1)
  }

  const handleReset = () => {
    setFilters({ search: '', category: '', severity: '', actorRole: '', from: '', to: '' })
    setSelectedLog(null)
    setPage(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold text-white">System Logs</h1>
            <p className="mt-1 text-slate-400">Track admin actions, recruiter activity, candidate events, emails, and system errors.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-300">
            {total} log{total === 1 ? '' : 's'} found
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="grid gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto_auto] xl:items-end">
            <FilterInput label="Search" value={filters.search} onChange={(value) => updateFilter('search', value)} placeholder="Action, message, actor, company" />
            <FilterSelect label="Category" value={filters.category} onChange={(value) => updateFilter('category', value)} options={categoryOptions} />
            <FilterSelect label="Severity" value={filters.severity} onChange={(value) => updateFilter('severity', value)} options={severityOptions} />
            <FilterSelect label="Actor" value={filters.actorRole} onChange={(value) => updateFilter('actorRole', value)} options={roleOptions} />
            <FilterInput label="From" type="date" value={filters.from} onChange={(value) => updateFilter('from', value)} />
            <FilterInput label="To" type="date" value={filters.to} onChange={(value) => updateFilter('to', value)} />
            <Button type="submit" disabled={loading}>Apply</Button>
            <button type="button" onClick={handleReset} className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Reset
            </button>
          </form>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <h2 className="font-semibold text-white">Activity Timeline</h2>
              {loading && <LoadingSpinner size="sm" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead className="bg-slate-700 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Actor</th>
                    <th className="px-4 py-3 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-10"><LoadingSpinner /></td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-400">No logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer border-b border-slate-700 transition hover:bg-slate-700/60 ${selectedLog?._id === log._id ? 'bg-slate-700/80' : ''}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatLogDate(log.createdAt)}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={log.severity} /></td>
                        <td className="px-4 py-3 capitalize">{log.category}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium capitalize text-white">{log.actorRole || 'system'}</p>
                          <p className="max-w-[180px] truncate text-xs text-slate-400">{log.actorEmail || log.actorId?.email || 'No actor'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{log.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{log.action}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-400">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1 || loading} onClick={() => loadLogs(page - 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Prev</button>
                <button disabled={page >= pages || loading} onClick={() => loadLogs(page + 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>

          <LogDetail log={selectedLog} />
        </div>
      </div>
    </AdminLayout>
  )
}

const FilterInput = ({ label, onChange, type = 'text', value, placeholder = '' }) => (
  <label>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  </label>
)

const FilterSelect = ({ label, onChange, options, value }) => (
  <label>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    >
      <option value="">All</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </label>
)

const SeverityBadge = ({ severity }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${severityClass[severity] || severityClass.info}`}>
    {severity || 'info'}
  </span>
)

const LogDetail = ({ log }) => (
  <aside className="rounded-lg border border-slate-700 bg-slate-800 p-5">
    <h2 className="text-lg font-semibold text-white">Log Details</h2>
    {!log ? (
      <p className="mt-4 text-sm leading-6 text-slate-400">Select a log row to inspect actor details, request metadata, and technical context.</p>
    ) : (
      <div className="mt-5 space-y-4 text-sm">
        <DetailRow label="Action" value={log.action} />
        <DetailRow label="Message" value={log.message} />
        <DetailRow label="Actor" value={`${log.actorRole || 'system'}${log.actorEmail ? ` - ${log.actorEmail}` : ''}`} />
        <DetailRow label="IP Address" value={log.ipAddress || 'Not captured'} />
        <DetailRow label="User Agent" value={log.userAgent || 'Not captured'} />
        <div>
          <p className="mb-2 font-medium text-slate-300">Metadata</p>
          <pre className="max-h-[360px] overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-5 text-slate-300">
            {JSON.stringify(log.metadata || {}, null, 2)}
          </pre>
        </div>
      </div>
    )}
  </aside>
)

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-slate-200">{value}</p>
  </div>
)

export default LogManagement
