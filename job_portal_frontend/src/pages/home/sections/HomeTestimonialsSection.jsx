import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiArrowRight, FiStar } from 'react-icons/fi'
import { useAuth } from '../../../context/AuthContext'
import { testimonialService } from '../../../services/api'
import { resolveUploadUrl } from '../../../utils/uploads'

const fallbackTestimonials = [
  {
    message: 'HireFlow helped me keep my profile and resume ready, so applying to the right roles became much faster.',
    name: 'Robert Fox',
    roleTitle: 'UI/UX Designer',
    rating: 5,
    avatarClass: 'bg-amber-400 text-white',
  },
  {
    message: 'The hiring workflow is simple and clean. We could review applicants and move faster without losing context.',
    name: 'Bessie Cooper',
    roleTitle: 'Creative Director',
    rating: 5,
    avatarClass: 'bg-purple-200 text-purple-700',
  },
  {
    message: 'I found relevant jobs quickly, saved the ones I liked, and tracked my applications from one dashboard.',
    name: 'Jane Cooper',
    roleTitle: 'Photographer',
    rating: 5,
    avatarClass: 'bg-orange-300 text-white',
  },
]

const defaultForm = {
  name: '',
  roleTitle: '',
  message: '',
  rating: 5,
  publicConsent: false,
}

const candidateRoleOptions = [
  'Candidate',
  'Student',
  'Fresher',
  'Software Developer',
  'UI/UX Designer',
  'Marketing Specialist',
  'Data Analyst',
  'Project Manager',
]

const recruiterRoleOptions = [
  'Recruiter',
  'HR Manager',
  'Talent Acquisition',
  'Hiring Manager',
  'Founder',
  'Business Owner',
  'Team Lead',
]

const getInitials = (name = 'HF') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase()

const HomeTestimonialsSection = () => {
  const { user } = useAuth()
  const [testimonials, setTestimonials] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const visibleTestimonials = useMemo(() => {
    const source = testimonials.length ? testimonials : fallbackTestimonials
    if (source.length <= 3) return source

    return Array.from({ length: 3 }).map((_, index) => source[(activeIndex + index) % source.length])
  }, [activeIndex, testimonials])
  const roleOptions = user?.role === 'recruiter' ? recruiterRoleOptions : candidateRoleOptions

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await testimonialService.getPublicTestimonials({ featured: true, limit: 9 })
        setTestimonials(response.data.testimonials || [])
      } catch {
        setTestimonials([])
      }
    }

    loadTestimonials()
  }, [])

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || '',
        roleTitle: current.roleTitle || (user.role === 'recruiter' ? 'Recruiter' : 'Candidate'),
      }))
    })
  }, [user])

  const next = () => {
    const count = testimonials.length || fallbackTestimonials.length
    setActiveIndex((current) => (current + 1) % count)
  }

  const previous = () => {
    const count = testimonials.length || fallbackTestimonials.length
    setActiveIndex((current) => (current - 1 + count) % count)
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openSubmitForm = () => {
    if (!user) {
      toast.error('Please login to share your testimonial')
      return
    }

    if (!['candidate', 'recruiter'].includes(user.role)) {
      toast.error('Only candidates and recruiters can submit testimonials')
      return
    }

    setShowForm(true)
  }

  const submitTestimonial = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      await testimonialService.submitTestimonial(form)
      toast.success('Thanks! Your testimonial is waiting for admin review.')
      setShowForm(false)
      setForm({
        ...defaultForm,
        name: user?.name || '',
        roleTitle: user?.role === 'recruiter' ? 'Recruiter' : 'Candidate',
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit testimonial')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-slate-100 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Clients Testimonial</h2>
          <button
            type="button"
            onClick={openSubmitForm}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Share Your Story <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-10">
          <button
            type="button"
            onClick={previous}
            className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[4px] bg-white text-primary shadow-sm transition hover:bg-blue-50 lg:flex"
            aria-label="Previous testimonial"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[4px] bg-white text-primary shadow-sm transition hover:bg-blue-50 lg:flex"
            aria-label="Next testimonial"
          >
            <FiArrowRight className="h-5 w-5" />
          </button>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {visibleTestimonials.map((testimonial) => (
              <article key={testimonial._id || testimonial.name} className="rounded-[8px] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="mb-5 flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FiStar key={index} className={`h-4 w-4 ${index < Math.round(testimonial.rating || 5) ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="min-h-[96px] text-sm leading-6 text-slate-600">"{testimonial.message}"</p>
                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img src={resolveUploadUrl(testimonial.avatar)} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${testimonial.avatarClass || 'bg-blue-100 text-primary'}`}>
                        {getInitials(testimonial.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{testimonial.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{testimonial.roleTitle}</p>
                    </div>
                  </div>
                  <span className="text-5xl font-bold leading-none text-slate-200">"</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {(testimonials.length ? testimonials : fallbackTestimonials).slice(0, 5).map((testimonial, dot) => (
              <button
                type="button"
                key={testimonial._id || testimonial.name}
                onClick={() => setActiveIndex(dot)}
                className={`h-2 rounded-full ${dot === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-blue-300'}`}
                aria-label={`Show testimonial ${dot + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-[8px] bg-slate-200 p-8 md:p-10">
            <h3 className="text-2xl font-bold text-slate-950">Become a Candidate</h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Create your profile, save jobs, and apply to roles that match your skills.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-white px-5 text-sm font-semibold text-primary transition hover:bg-blue-50"
            >
              Get Started <FiArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-[8px] bg-primary p-8 text-white md:p-10">
            <h3 className="text-2xl font-bold">Browse Jobs</h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
              Explore current openings and move straight into the jobs list.
            </p>
            <Link
              to="/jobs"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-white px-5 text-sm font-semibold text-primary transition hover:bg-blue-50"
            >
              Browse Jobs <FiArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <form onSubmit={submitTestimonial} className="w-full max-w-lg rounded-[8px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.30)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Share your testimonial</h3>
                <p className="mt-1 text-sm text-slate-500">Your story will appear only after admin approval.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-950">Close</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700">Display name</span>
                <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="h-11 w-full rounded-[4px] border border-slate-200 px-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700">Role / title</span>
                <select
                  value={form.roleTitle}
                  onChange={(event) => updateForm('roleTitle', event.target.value)}
                  className="h-11 w-full rounded-[4px] border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="" disabled>Select your role</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Rating</span>
              <div className="flex h-12 items-center justify-between rounded-[4px] border border-slate-200 px-4 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                <div className="flex gap-1" role="radiogroup" aria-label="Select rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() => updateForm('rating', rating)}
                      className={`rounded-[4px] p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        rating <= form.rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
                      }`}
                      role="radio"
                      aria-checked={form.rating === rating}
                      aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                    >
                      <FiStar className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-600">
                  {form.rating}.0
                </span>
              </div>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
              <textarea value={form.message} onChange={(event) => updateForm('message', event.target.value)} rows={5} minLength={20} maxLength={500} className="w-full resize-y rounded-[4px] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" required />
            </label>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-500">
              <input type="checkbox" checked={form.publicConsent} onChange={(event) => updateForm('publicConsent', event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" required />
              I allow HireFlow to show this testimonial publicly after review.
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-[4px] bg-blue-50 px-5 text-sm font-semibold text-primary">Cancel</button>
              <button type="submit" disabled={submitting} className="h-11 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default HomeTestimonialsSection
