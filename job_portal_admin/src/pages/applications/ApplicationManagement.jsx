import { useEffect, useState } from 'react'
import { AdminLayout } from '../../layouts/AdminLayout'
import { applicationService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { formatDate } from '../../utils/dateFormatter'
import { Button } from '../../components/ui/Button'

const statusOptions = [
  'pending',
  'applied',
  'under-review',
  'shortlisted',
  'interview-scheduled',
  'selected',
  'accepted',
  'rejected',
]

function ApplicationManagement() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadApplications = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await applicationService.getApplications(nextPage, { status, search })
      setApplications(response.data.applications || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications(1)
  }, [status])

  const handleSearch = (event) => {
    event.preventDefault()
    loadApplications(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Application Management</h1>
          <p className="mt-1 text-slate-400">Audit applications by candidate, job, company, owner, and current recruiter decision.</p>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-300">Search applications</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Candidate, email, job title, or company"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="lg:w-64">
              <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={loading}>Apply</Button>
          </form>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} application{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Job Title</th>
                  <th className="px-4 py-3 text-left">Applied Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8"><LoadingSpinner /></td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No applications found. Jobs appear here only after candidates apply.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application._id} className="border-b border-slate-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{application.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{application.userId?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{application.jobId?.title || 'Deleted job'}</div>
                        <div className="text-xs text-slate-400">{application.jobId?.company}</div>
                      </td>
                      <td className="px-4 py-3">{formatDate(application.appliedAt)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-blue-300">
                          {application.status?.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        Recruiter decision
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => loadApplications(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pages} onClick={() => loadApplications(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ApplicationManagement
