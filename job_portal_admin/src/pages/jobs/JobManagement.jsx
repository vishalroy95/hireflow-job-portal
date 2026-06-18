import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { jobService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { confirmAction } from '../../utils/confirmToast.jsx'
import { AiOutlineDelete } from 'react-icons/ai'
import { formatSalary } from '../../utils/currency'

const getAdminJobStatus = (job) => {
  if (job.active) {
    return { label: 'Active', className: 'border-green-500/30 bg-green-500/10 text-green-300' }
  }

  if (job.adminDisabled || job.status === 'active') {
    return { label: 'Admin Disabled', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' }
  }

  if (job.status === 'closed') {
    return { label: 'Closed by Recruiter', className: 'border-slate-500/30 bg-slate-500/10 text-slate-300' }
  }

  return { label: 'Paused', className: 'border-blue-500/30 bg-blue-500/10 text-blue-300' }
}

function JobManagement() {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState('')

  const loadJobs = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await jobService.getJobs(nextPage, search, {
        active: activeFilter,
        jobType: jobTypeFilter,
      })
      setJobs(response.data.jobs || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs(1)
  }, [activeFilter, jobTypeFilter])

  const toggleActive = async (job) => {
    try {
      setUpdatingId(job._id)
      if (job.active) {
        await jobService.deactivateJob(job._id)
        toast.success('Job deactivated')
      } else {
        await jobService.activateJob(job._id)
        toast.success('Job activated')
      }
      loadJobs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job')
    } finally {
      setUpdatingId('')
    }
  }

  const deleteJob = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete job?',
      message: 'This job will be removed permanently.',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    try {
      await jobService.deleteJob(id)
      toast.success('Job deleted')
      loadJobs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job')
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadJobs(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div>
            <h1 className="text-3xl font-bold text-white">Job Management</h1>
            <p className="mt-1 text-slate-400">Moderate recruiter job posts, visibility, and policy removals.</p>
          </div>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-300">Search jobs</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title, company, or location"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="lg:w-48">
              <span className="mb-2 block text-sm font-medium text-slate-300">Status</span>
              <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label className="lg:w-52">
              <span className="mb-2 block text-sm font-medium text-slate-300">Job Type</span>
              <select value={jobTypeFilter} onChange={(event) => setJobTypeFilter(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <option value="">All types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </label>
            <Button type="submit" disabled={loading}>Apply</Button>
          </form>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} job{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Salary</th>
                  <th className="px-4 py-3 text-left">Applications</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8"><LoadingSpinner /></td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">No jobs found.</td>
                  </tr>
                ) : (
                  jobs.map((job) => {
                    const status = getAdminJobStatus(job)

                    return (
                    <tr key={job._id} className="border-b border-slate-700">
                      <td className="px-4 py-3">{job.title}</td>
                      <td className="px-4 py-3">{job.company}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{job.createdBy?.name || 'Unknown'}</div>
                        <div className="text-xs capitalize text-slate-400">{job.createdBy?.role || 'deleted owner'}</div>
                      </td>
                      <td className="px-4 py-3">{job.location}</td>
                      <td className="px-4 py-3">{formatSalary(job.salary)}</td>
                      <td className="px-4 py-3">{job.applicants?.length || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={updatingId === job._id} onClick={() => toggleActive(job)}>
                          {job.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <button onClick={() => deleteJob(job._id)} className="text-red-400 hover:text-red-300">
                          <AiOutlineDelete />
                        </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => loadJobs(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pages} onClick={() => loadJobs(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default JobManagement
