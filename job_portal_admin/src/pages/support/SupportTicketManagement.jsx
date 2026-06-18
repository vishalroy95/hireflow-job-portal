import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AiOutlineDelete, AiOutlineMessage, AiOutlineSend } from 'react-icons/ai'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { supportService } from '../../services/adminApi'
import { confirmAction } from '../../utils/confirmToast.jsx'

const statusStyles = {
  open: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  'in-progress': 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  resolved: 'border-green-500/30 bg-green-500/10 text-green-300',
  closed: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}

const priorityStyles = {
  low: 'text-slate-300',
  medium: 'text-amber-300',
  high: 'text-red-300',
}

function SupportTicketManagement() {
  const [tickets, setTickets] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [replyingId, setReplyingId] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadTickets = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await supportService.getTickets(nextPage, { search, status, priority, category })
      setTickets(response.data.tickets || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets(1)
  }, [status, priority, category])

  const handleSearch = (event) => {
    event.preventDefault()
    loadTickets(1)
  }

  const updateTicket = async (ticket, data) => {
    try {
      setUpdatingId(ticket._id)
      await supportService.updateTicket(ticket._id, data)
      toast.success('Ticket updated')
      await loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket')
    } finally {
      setUpdatingId('')
    }
  }

  const submitReply = async (ticket) => {
    if (!replyMessage.trim()) {
      toast.error('Please write a reply')
      return
    }

    try {
      setUpdatingId(ticket._id)
      await supportService.replyToTicket(ticket._id, {
        message: replyMessage,
        status: ticket.status === 'open' ? 'in-progress' : ticket.status,
      })
      toast.success('Reply added')
      setReplyingId('')
      setReplyMessage('')
      await loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reply')
    } finally {
      setUpdatingId('')
    }
  }

  const deleteTicket = async (ticket) => {
    const confirmed = await confirmAction({
      title: 'Delete support ticket?',
      message: 'This ticket and its replies will be removed permanently.',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    try {
      setUpdatingId(ticket._id)
      await supportService.deleteTicket(ticket._id)
      toast.success('Ticket deleted')
      await loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete ticket')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="mt-1 text-slate-400">Handle customer support requests from candidates, recruiters, and guests.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_180px_180px_200px_auto] lg:items-end">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">Search tickets</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, subject, message" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <FilterSelect label="Status" value={status} onChange={setStatus} options={['open', 'in-progress', 'resolved', 'closed']} empty="All statuses" />
            <FilterSelect label="Priority" value={priority} onChange={setPriority} options={['low', 'medium', 'high']} empty="All priorities" />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={['Account', 'Job Application', 'Recruiter', 'Technical Issue', 'Payment', 'Other']} empty="All categories" />
            <Button type="submit" disabled={loading}>Apply</Button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} ticket{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-10"><LoadingSpinner /></div>
            ) : tickets.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-10 text-center text-slate-400">No support tickets found.</div>
            ) : tickets.map((ticket) => {
              const isReplying = replyingId === ticket._id
              const isUpdating = updatingId === ticket._id

              return (
                <article key={ticket._id} className="rounded-lg border border-slate-700 bg-slate-900 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[ticket.status] || statusStyles.open}`}>{ticket.status}</span>
                        <span className={`text-xs font-semibold uppercase ${priorityStyles[ticket.priority] || priorityStyles.medium}`}>{ticket.priority}</span>
                        <span className="text-xs text-slate-500">{ticket.category}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-white">{ticket.subject}</h2>
                      <p className="mt-1 text-sm text-slate-400">{ticket.name} · {ticket.email}</p>
                      <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-300">{ticket.message}</p>

                      {ticket.replies?.length > 0 && (
                        <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
                          {ticket.replies.map((reply) => (
                            <div key={reply._id || reply.createdAt} className="rounded-lg bg-slate-800 px-4 py-3">
                              <p className="text-xs font-semibold uppercase text-blue-300">Admin reply</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isReplying && (
                        <div className="mt-4">
                          <textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} rows={4} placeholder="Write admin reply..." className="w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500" />
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" disabled={isUpdating} onClick={() => submitReply(ticket)}>Send Reply</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setReplyingId(''); setReplyMessage('') }}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <select value={ticket.status} disabled={isUpdating} onChange={(event) => updateTicket(ticket, { status: event.target.value })} className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-white outline-none">
                        {['open', 'in-progress', 'resolved', 'closed'].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <button disabled={isUpdating} onClick={() => setReplyingId(ticket._id)} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50" title="Reply">
                        <AiOutlineMessage />
                      </button>
                      <button disabled={isUpdating} onClick={() => updateTicket(ticket, { status: 'resolved' })} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50" title="Resolve">
                        <AiOutlineSend />
                      </button>
                      <button disabled={isUpdating} onClick={() => deleteTicket(ticket)} className="rounded-lg bg-slate-700 p-2 text-red-300 hover:bg-slate-600 disabled:opacity-50" title="Delete">
                        <AiOutlineDelete />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => loadTickets(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pages} onClick={() => loadTickets(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

const FilterSelect = ({ label, value, onChange, options, empty }) => (
  <label>
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
      <option value="">{empty}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
)

export default SupportTicketManagement
