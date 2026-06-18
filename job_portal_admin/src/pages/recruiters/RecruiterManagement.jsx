import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { recruiterService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const statusStyles = {
  approved: 'border-green-500/30 bg-green-500/10 text-green-300',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
}

function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState('')

  const loadRecruiters = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await recruiterService.getRecruiters(nextPage, status, search)
      setRecruiters(response.data.users || response.data.recruiters || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recruiters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecruiters(1)
  }, [status])

  const updateStatus = async (id, action) => {
    try {
      setUpdatingId(id)
      if (action === 'approve') {
        await recruiterService.approveRecruiter(id)
        toast.success('Recruiter approved')
      } else {
        await recruiterService.rejectRecruiter(id)
        toast.success('Recruiter rejected')
      }
      loadRecruiters()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update recruiter')
    } finally {
      setUpdatingId('')
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadRecruiters(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Recruiter Management</h1>
          <p className="mt-1 text-slate-400">Review recruiter accounts, company details, and approval status.</p>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-300">Search recruiters</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="lg:w-56">
              <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <Button type="submit" disabled={loading}>Apply</Button>
          </form>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} recruiter{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">Industry</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8"><LoadingSpinner /></td>
                  </tr>
                ) : recruiters.length === 0 ? (
                  <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No recruiters found.
                  </td>
                </tr>
                ) : (
                  recruiters.map((recruiter) => (
                    <tr key={recruiter._id} className="border-b border-slate-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{recruiter.name}</div>
                        <div className="text-xs text-slate-400">{recruiter.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{recruiter.company?.name || '-'}</div>
                        <div className="text-xs text-slate-400">{recruiter.company?.website || ''}</div>
                      </td>
                      <td className="px-4 py-3">{recruiter.recruiterProfile?.designation || '-'}</td>
                      <td className="px-4 py-3">{recruiter.company?.industryType || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[recruiter.recruiterStatus || 'pending']}`}>
                          {recruiter.recruiterStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={updatingId === recruiter._id || recruiter.recruiterStatus === 'approved'}
                            onClick={() => updateStatus(recruiter._id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={updatingId === recruiter._id || recruiter.recruiterStatus === 'rejected'}
                            onClick={() => updateStatus(recruiter._id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
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
              <Button
                size="sm"
                variant="secondary"
                disabled={loading || page <= 1}
                onClick={() => loadRecruiters(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={loading || page >= pages}
                onClick={() => loadRecruiters(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default RecruiterManagement
