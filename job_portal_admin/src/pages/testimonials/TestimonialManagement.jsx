import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AiOutlineCheck, AiOutlineDelete, AiOutlineEdit, AiOutlineStar, AiOutlineStop } from 'react-icons/ai'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { testimonialService } from '../../services/adminApi'
import { confirmAction } from '../../utils/confirmToast.jsx'

const statusStyles = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  approved: 'border-green-500/30 bg-green-500/10 text-green-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
}

const emptyEdit = {
  name: '',
  roleTitle: '',
  message: '',
  rating: 5,
}

function TestimonialManagement() {
  const [testimonials, setTestimonials] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState(emptyEdit)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadTestimonials = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await testimonialService.getTestimonials(nextPage, { status, search })
      setTestimonials(response.data.testimonials || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTestimonials(1)
  }, [status])

  const handleSearch = (event) => {
    event.preventDefault()
    loadTestimonials(1)
  }

  const runAction = async (testimonial, action) => {
    try {
      setUpdatingId(testimonial._id)
      if (action === 'approve') {
        await testimonialService.approveTestimonial(testimonial._id)
        toast.success('Testimonial approved')
      }
      if (action === 'reject') {
        await testimonialService.rejectTestimonial(testimonial._id)
        toast.success('Testimonial rejected')
      }
      if (action === 'feature') {
        await testimonialService.updateTestimonial(testimonial._id, {
          isFeatured: !testimonial.isFeatured,
          status: testimonial.status === 'approved' ? testimonial.status : 'approved',
        })
        toast.success(testimonial.isFeatured ? 'Removed from featured' : 'Marked as featured')
      }
      await loadTestimonials()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update testimonial')
    } finally {
      setUpdatingId('')
    }
  }

  const deleteTestimonial = async (testimonial) => {
    const confirmed = await confirmAction({
      title: 'Delete testimonial?',
      message: 'This testimonial will be removed permanently.',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    try {
      setUpdatingId(testimonial._id)
      await testimonialService.deleteTestimonial(testimonial._id)
      toast.success('Testimonial deleted')
      await loadTestimonials()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete testimonial')
    } finally {
      setUpdatingId('')
    }
  }

  const startEdit = (testimonial) => {
    setEditingId(testimonial._id)
    setEditForm({
      name: testimonial.name || '',
      roleTitle: testimonial.roleTitle || '',
      message: testimonial.message || '',
      rating: testimonial.rating || 5,
    })
  }

  const saveEdit = async (testimonial) => {
    try {
      setUpdatingId(testimonial._id)
      await testimonialService.updateTestimonial(testimonial._id, editForm)
      toast.success('Testimonial saved')
      setEditingId('')
      await loadTestimonials()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save testimonial')
    } finally {
      setUpdatingId('')
    }
  }

  const updateEdit = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Testimonials</h1>
          <p className="mt-1 text-slate-400">Review real customer stories before they appear on the homepage.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-300">Search testimonials</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, role, or message"
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

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} testimonial{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10"><LoadingSpinner /></div>
            ) : testimonials.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-10 text-center text-slate-400">
                No testimonials found.
              </div>
            ) : testimonials.map((testimonial) => {
              const isEditing = editingId === testimonial._id
              const isUpdating = updatingId === testimonial._id

              return (
                <article key={testimonial._id} className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[testimonial.status] || statusStyles.pending}`}>
                          {testimonial.status}
                        </span>
                        {testimonial.isFeatured && (
                          <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300">
                            Featured
                          </span>
                        )}
                        <span className="text-xs capitalize text-slate-500">{testimonial.userRole}</span>
                      </div>

                      {isEditing ? (
                        <div className="grid gap-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <input value={editForm.name} onChange={(event) => updateEdit('name', event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white outline-none focus:border-blue-500" />
                            <input value={editForm.roleTitle} onChange={(event) => updateEdit('roleTitle', event.target.value)} className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white outline-none focus:border-blue-500" />
                          </div>
                          <select value={editForm.rating} onChange={(event) => updateEdit('rating', Number(event.target.value))} className="max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-4 py-2 text-white outline-none focus:border-blue-500">
                            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                          </select>
                          <textarea value={editForm.message} onChange={(event) => updateEdit('message', event.target.value)} rows={4} className="rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg font-semibold text-white">{testimonial.name}</h2>
                          <p className="text-sm text-slate-400">{testimonial.roleTitle}</p>
                          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">"{testimonial.message}"</p>
                          <p className="mt-3 text-xs text-slate-500">
                            {testimonial.rating}/5 stars · Submitted by {testimonial.userId?.email || 'unknown user'}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {isEditing ? (
                        <>
                          <Button size="sm" disabled={isUpdating} onClick={() => saveEdit(testimonial)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId('')}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <button disabled={isUpdating} onClick={() => runAction(testimonial, 'approve')} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50" title="Approve">
                            <AiOutlineCheck />
                          </button>
                          <button disabled={isUpdating} onClick={() => runAction(testimonial, 'reject')} className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50" title="Reject">
                            <AiOutlineStop />
                          </button>
                          <button disabled={isUpdating} onClick={() => runAction(testimonial, 'feature')} className={`rounded-lg p-2 text-white disabled:opacity-50 ${testimonial.isFeatured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}`} title="Feature">
                            <AiOutlineStar />
                          </button>
                          <button onClick={() => startEdit(testimonial)} className="rounded-lg bg-slate-700 p-2 text-white hover:bg-slate-600" title="Edit">
                            <AiOutlineEdit />
                          </button>
                          <button disabled={isUpdating} onClick={() => deleteTestimonial(testimonial)} className="rounded-lg bg-slate-700 p-2 text-red-300 hover:bg-slate-600 disabled:opacity-50" title="Delete">
                            <AiOutlineDelete />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => loadTestimonials(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pages} onClick={() => loadTestimonials(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default TestimonialManagement
