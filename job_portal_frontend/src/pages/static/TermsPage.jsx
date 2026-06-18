import { Link } from 'react-router-dom'
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiFileText, FiMail, FiShield, FiUser } from 'react-icons/fi'
import StaticPageShell from './StaticPageShell'

const sections = [
  {
    title: '1. Who Can Use HireFlow',
    body: [
      'HireFlow is built for candidates searching for jobs and recruiters posting genuine hiring opportunities.',
      'You must provide accurate account details, including a valid email address, phone number, and role information. Recruiter accounts may require admin review before full access is granted.',
    ],
  },
  {
    title: '2. Candidate Accounts',
    body: [
      'Candidates are responsible for keeping profile details, resume, skills, and contact information accurate and up to date.',
      'When you apply to a job, HireFlow may share your application, resume, profile details, and cover letter with the recruiter who posted that job.',
    ],
  },
  {
    title: '3. Recruiter Accounts and Job Posts',
    body: [
      'Recruiters must post real jobs connected to a legitimate company or hiring requirement.',
      'Job posts must not contain misleading salary information, fake company details, spam, discrimination, illegal work, or requests for payment from candidates.',
      'HireFlow may review, pause, reject, or remove recruiter accounts and job posts that appear unsafe, misleading, or abusive.',
    ],
  },
  {
    title: '4. Email Verification and Notifications',
    body: [
      'HireFlow uses email OTP verification during registration to reduce invalid or fake accounts.',
      'You may receive transactional emails such as verification codes, password reset OTPs, application confirmations, recruiter alerts, support replies, and application status updates.',
    ],
  },
  {
    title: '5. Applications and Hiring Decisions',
    body: [
      'HireFlow helps connect candidates and recruiters, but final hiring decisions are made by recruiters or employers.',
      'Application statuses such as shortlisted, rejected, selected, or interview scheduled are controlled by the recruiter or platform admin.',
    ],
  },
  {
    title: '6. Resume, Files, and Content',
    body: [
      'You must only upload files and content that belong to you or that you have permission to use.',
      'Do not upload harmful files, false documents, copied resumes, offensive content, or private information belonging to another person.',
    ],
  },
  {
    title: '7. Account Security',
    body: [
      'You are responsible for keeping your password and email account secure.',
      'If you suspect unauthorized access, reset your password and contact support as soon as possible.',
    ],
  },
  {
    title: '8. Platform Limits',
    body: [
      'HireFlow may update features, email templates, country and currency display, notifications, and dashboard tools as the platform improves.',
      'We try to keep the service available, but we do not guarantee uninterrupted access, error-free operation, or a job offer from using the platform.',
    ],
  },
]

const summaryItems = [
  { icon: FiShield, label: 'Verified signup', text: 'Email OTP helps protect accounts from invalid registrations.' },
  { icon: FiUser, label: 'Candidate control', text: 'Candidates manage profiles, resumes, and applications.' },
  { icon: FiBriefcase, label: 'Recruiter review', text: 'Recruiters must post genuine jobs and company information.' },
  { icon: FiMail, label: 'Status updates', text: 'Important actions can trigger professional email notifications.' },
]

const TermsPage = () => {
  return (
    <StaticPageShell title="Terms of Services" crumb="Terms">
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="min-w-0">
            <div className="mb-10">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] bg-blue-50 text-primary">
                <FiFileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">HireFlow Policy</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">Terms of Services</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                These terms explain how candidates, recruiters, and admins should use HireFlow. By creating an account,
                posting jobs, applying to jobs, or using support tools, you agree to follow these rules.
              </p>
              <p className="mt-3 text-sm text-slate-500">Last updated: June 12, 2026</p>
            </div>

            <div className="space-y-5">
              {sections.map((section) => (
                <section key={section.title} className="rounded-[8px] border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
                  <div className="mt-4 space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-slate-600">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <section className="rounded-[8px] border border-slate-200 bg-slate-950 p-6 text-white">
              <h3 className="text-lg font-semibold">Quick Summary</h3>
              <div className="mt-5 space-y-4">
                {summaryItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.label} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-blue-500/15 text-blue-200">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{item.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[8px] border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-emerald-50 text-emerald-600">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Need Help?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you have questions about your account, applications, recruiter access, or support tickets, contact HireFlow support.
              </p>
              <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Contact support <FiArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </StaticPageShell>
  )
}

export default TermsPage
