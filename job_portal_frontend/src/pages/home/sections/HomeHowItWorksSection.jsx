import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiSearch, FiUploadCloud, FiUserPlus } from 'react-icons/fi'
import { useAuth } from '../../../context/AuthContext'

const getSteps = (user) => [
  {
    title: 'Create account',
    description: 'Build your profile with contact details, skills, resume, and job preferences.',
    icon: FiUserPlus,
    cta: user ? 'Open Workspace' : 'Create Profile',
    path: user?.role === 'recruiter' ? '/recruiter/dashboard' : user ? '/candidate/dashboard' : '/register',
  },
  {
    title: 'Upload CV/Resume',
    description: 'Keep your latest resume ready so every job application takes only a moment.',
    icon: FiUploadCloud,
    cta: 'Update Resume',
    path: user ? '/candidate/dashboard?tab=settings&section=resume' : '/login',
  },
  {
    title: 'Find suitable job',
    description: 'Search roles by title, skill, category, location, salary, and workplace type.',
    icon: FiSearch,
    cta: 'Browse Jobs',
    path: '/jobs',
  },
  {
    title: 'Apply job',
    description: 'Apply from job details, then track status and recruiter updates from your dashboard.',
    icon: FiCheckCircle,
    cta: 'Apply Now',
    path: '/jobs',
  },
]

const HomeHowItWorksSection = () => {
  const { user } = useAuth()
  const steps = getSteps(user)

  return (
    <section className="bg-[#F1F2F4] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase text-primary">Simple hiring flow</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">How HireFlow Works</h2>
        </div>

        <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-10 hidden h-12 lg:block">
            <div className="h-full rounded-[50%] border-t border-dashed border-blue-300" />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <Link
                key={step.title}
                to={step.path}
                className="group relative z-10 flex min-h-[248px] flex-col items-center rounded-[8px] border border-transparent bg-white/0 px-6 py-7 text-center transition hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] focus-visible:-translate-y-1 focus-visible:border-blue-200 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
              >
                <span className="absolute left-5 top-5 text-xs font-semibold text-slate-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary ring-1 ring-blue-50 transition group-hover:ring-blue-100 group-focus-visible:ring-blue-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
                <span className="mt-auto inline-flex h-10 items-center gap-2 rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:!text-white group-focus-visible:bg-primary group-focus-visible:!text-white">
                  {step.cta} <FiArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeHowItWorksSection
