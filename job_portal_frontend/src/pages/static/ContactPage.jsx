import { useState } from 'react'
import toast from 'react-hot-toast'
import { FiNavigation } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'
import { supportService } from '../../services/api'
import StaticPageShell from './StaticPageShell'

const ContactPage = () => {
  const { settings } = usePlatformSettings()
  const { user } = useAuth()
  const supportEmail = settings.general.supportEmail || 'support@hireflow.com'
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  }))

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill all contact form fields')
      return
    }

    try {
      setSubmitting(true)
      await supportService.createTicket({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: 'Other',
        priority: 'medium',
      })
      toast.success('Message sent to support')
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <StaticPageShell title="Contact">
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[1fr_410px]">
          <div className="flex items-center">
            <div className="max-w-md">
              <p className="mb-3 text-sm font-semibold text-blue-600">Who we are</p>
              <h1 className="text-4xl font-semibold leading-tight text-slate-950">
                We care about customer services
              </h1>
              <p className="mt-6 text-sm leading-7 text-slate-500">
                Want to chat? We'd love to hear from you. Get in touch with our Customer Success Team to inquire about speaking events, advertising rates, or just say hello.
              </p>
              <a
                href={`mailto:${supportEmail}`}
                className="mt-7 inline-flex items-center gap-2 bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Email Support
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded bg-white p-8 shadow-2xl shadow-slate-200">
            <h2 className="mb-6 text-lg font-semibold">Get in Touch</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="h-11 rounded border border-slate-200 px-4 text-sm outline-none" placeholder="Name" required />
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="h-11 rounded border border-slate-200 px-4 text-sm outline-none" placeholder="Email" required />
            </div>
            <input value={form.subject} onChange={(event) => updateField('subject', event.target.value)} className="mt-4 h-11 w-full rounded border border-slate-200 px-4 text-sm outline-none" placeholder="Subject" required />
            <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} className="mt-4 h-28 w-full rounded border border-slate-200 p-4 text-sm outline-none" placeholder="Message" required />
            <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 bg-blue-600 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Sending...' : 'Send Message'} <FiNavigation />
            </button>
          </form>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-5">
            <p className="text-sm font-semibold text-blue-600">Our service area</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Delhi NCR, India</h2>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(28,39,49,0.08)]">
            <iframe
              title="HireFlow Delhi NCR location map"
              src="https://www.google.com/maps?q=Delhi%20NCR%2C%20India&output=embed"
              className="h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>
    </StaticPageShell>
  )
}

export default ContactPage
