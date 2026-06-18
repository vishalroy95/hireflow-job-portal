import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiClock, FiHeadphones, FiMessageCircle, FiRefreshCw, FiSend, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { supportService } from '../../services/api'

const categories = ['Account', 'Job Application', 'Recruiter', 'Technical Issue', 'Payment', 'Other']
const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const defaultForm = {
  name: '',
  email: '',
  subject: '',
  category: 'Account',
  priority: 'medium',
  message: '',
}

const SUPPORT_TICKETS_CACHE_TTL_MS = 60 * 1000
const supportTicketsCache = {
  token: '',
  items: [],
  fetchedAt: 0,
  inFlight: null,
}

const statusStyles = {
  open: 'bg-blue-50 text-primary',
  'in-progress': 'bg-amber-50 text-amber-600',
  resolved: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-slate-100 text-slate-500',
}

const formatDate = (value) => {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const FloatingSupportWidget = () => {
  const { token, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('new')
  const [submitting, setSubmitting] = useState(false)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || '',
        email: current.email || user.email || '',
        category: user.role === 'recruiter' ? 'Recruiter' : current.category,
      }))
    })
  }, [user])

  useEffect(() => {
    if (token) return

    queueMicrotask(() => {
      setTickets([])
      supportTicketsCache.token = ''
      supportTicketsCache.items = []
      supportTicketsCache.fetchedAt = 0
      supportTicketsCache.inFlight = null
    })
  }, [token])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const loadMyTickets = useCallback(async ({ force = false } = {}) => {
    if (!token) return

    const now = Date.now()
    const cacheIsFresh =
      supportTicketsCache.token === token &&
      supportTicketsCache.fetchedAt > 0 &&
      now - supportTicketsCache.fetchedAt < SUPPORT_TICKETS_CACHE_TTL_MS

    if (!force && cacheIsFresh) {
      setTickets(supportTicketsCache.items)
      return
    }

    if (supportTicketsCache.inFlight) {
      const cachedTickets = await supportTicketsCache.inFlight
      setTickets(cachedTickets)
      return
    }

    try {
      setTicketsLoading(supportTicketsCache.fetchedAt === 0)
      supportTicketsCache.inFlight = supportService.getMyTickets().then((response) => {
        const items = response.data.tickets || []
        supportTicketsCache.token = token
        supportTicketsCache.items = items
        supportTicketsCache.fetchedAt = Date.now()
        return items
      })

      const items = await supportTicketsCache.inFlight
      setTickets(items)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load support tickets')
    } finally {
      supportTicketsCache.inFlight = null
      setTicketsLoading(false)
    }
  }, [token])

  const openWidget = () => {
    setOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      await supportService.createTicket(form)
      toast.success('Support ticket submitted. Our team will respond soon.')
      setForm({
        ...defaultForm,
        name: user?.name || '',
        email: user?.email || '',
        category: user?.role === 'recruiter' ? 'Recruiter' : 'Account',
      })
      if (token) {
        supportTicketsCache.fetchedAt = 0
        await loadMyTickets({ force: true })
        setActiveTab('tickets')
      } else {
        setOpen(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openWidget}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_45px_rgba(10,102,194,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
        aria-label="Open customer support"
      >
        <FiMessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/35 px-4 py-5 sm:px-6">
          <div className="w-full max-w-md rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-blue-50 text-primary">
                  <FiHeadphones className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Customer Support</h2>
                  <p className="text-xs text-slate-500">Create and track support tickets.</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Close support">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-100 px-5 pt-3">
              <button type="button" onClick={() => setActiveTab('new')} className={`border-b-2 px-3 pb-3 text-sm font-semibold ${activeTab === 'new' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-950'}`}>
                New Ticket
              </button>
              <button type="button" onClick={() => { setActiveTab('tickets'); loadMyTickets() }} className={`border-b-2 px-3 pb-3 text-sm font-semibold ${activeTab === 'tickets' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-950'}`}>
                My Tickets
              </button>
            </div>

            {activeTab === 'new' && (
              <form onSubmit={handleSubmit}>
                <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto px-5 py-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                      <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="h-10 w-full rounded-[4px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                      <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="h-10 w-full rounded-[4px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Subject</span>
                    <input value={form.subject} onChange={(event) => updateField('subject', event.target.value)} placeholder="How can we help?" className="h-10 w-full rounded-[4px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Category</span>
                      <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="h-10 w-full rounded-[4px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">Priority</span>
                      <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} className="h-10 w-full rounded-[4px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                        {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Message</span>
                    <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} rows={5} minLength={10} placeholder="Describe the issue or question..." className="w-full resize-y rounded-[4px] border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
                  <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-primary">Cancel</button>
                  <button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Ticket'} <FiSend className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'tickets' && (
              <div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-sm font-semibold text-slate-950">Recent tickets</p>
                  {token && (
                    <button type="button" onClick={() => loadMyTickets({ force: true })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-blue-700">
                      <FiRefreshCw className={`h-3.5 w-3.5 ${ticketsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                </div>

                <div className="max-h-[calc(100vh-240px)] space-y-3 overflow-y-auto px-5 pb-5">
                  {!token ? (
                    <div className="rounded-[6px] border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-sm font-semibold text-slate-950">Login required</p>
                      <p className="mt-1 text-sm text-slate-500">Please login to view ticket progress and admin replies.</p>
                    </div>
                  ) : ticketsLoading ? (
                    <div className="rounded-[6px] border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Loading tickets...</div>
                  ) : tickets.length === 0 ? (
                    <div className="rounded-[6px] border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-sm font-semibold text-slate-950">No tickets yet</p>
                      <p className="mt-1 text-sm text-slate-500">Create a ticket and updates will appear here.</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <article key={ticket._id} className="rounded-[6px] border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-950">{ticket.subject}</h3>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <FiClock className="h-3.5 w-3.5" />
                              Updated {formatDate(ticket.updatedAt || ticket.createdAt)}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[ticket.status] || statusStyles.open}`}>
                            {ticket.status}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{ticket.message}</p>

                        {ticket.replies?.length > 0 ? (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            {ticket.replies.map((reply) => (
                              <div key={reply._id || reply.createdAt} className="rounded-[4px] bg-blue-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase text-primary">Admin reply</p>
                                <p className="mt-1 text-sm leading-5 text-slate-700">{reply.message}</p>
                                <p className="mt-1 text-xs text-slate-400">{formatDate(reply.createdAt)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 rounded-[4px] bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            No admin reply yet. We will update this ticket soon.
                          </p>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingSupportWidget
