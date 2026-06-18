import { Link } from 'react-router-dom'
import { FiArrowRight, FiBell, FiBriefcase, FiDatabase, FiLock, FiMail, FiShield, FiUserCheck } from 'react-icons/fi'
import StaticPageShell from './StaticPageShell'

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'HireFlow collects account details such as name, email address, phone number, role, and profile image when you register or sign in.',
      'Candidate profiles may include resumes, skills, education, work experience, location, social links, biography, saved jobs, applications, and cover letters.',
      'Recruiter profiles may include company name, designation, company website, company logo, company description, contact details, posted jobs, applicants, and hiring activity.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'We use your information to create accounts, verify email addresses, manage candidate profiles, process job applications, and help recruiters review applicants.',
      'We use email and notification settings to send OTPs, password reset codes, application confirmations, recruiter alerts, support replies, and application status updates.',
      'Admin activity, support tickets, and system logs help us monitor platform health, investigate issues, and keep the project reliable.',
    ],
  },
  {
    title: '3. Resume and Application Sharing',
    body: [
      'When a candidate applies to a job, HireFlow shares the application, selected resume, profile details, cover letter, and relevant contact details with the recruiter for that job.',
      'Recruiters can only use candidate information for genuine hiring activity and should not misuse, sell, or redistribute candidate data.',
    ],
  },
  {
    title: '4. Recruiter Visibility Controls',
    body: [
      'Candidates can control whether recruiters may view their profile and whether contact information is visible from candidate account settings.',
      'If a recruiter views a candidate profile, HireFlow may create a notification so the candidate can see that profile activity.',
    ],
  },
  {
    title: '5. Google Sign In and Verification',
    body: [
      'If you sign up or sign in with Google, HireFlow receives your verified email, display name, Google account identifier, and profile picture when available.',
      'Recruiters using Google sign up must still complete company details and may require admin approval before posting jobs.',
    ],
  },
  {
    title: '6. Support Tickets and Messages',
    body: [
      'When you contact support, we store your name, email, subject, message, priority, ticket status, and admin replies so the support team can respond and track progress.',
      'Logged-in users may see ticket updates and admin replies from the support widget or notifications.',
    ],
  },
  {
    title: '7. Cookies and Local Storage',
    body: [
      'HireFlow uses basic browser storage for login sessions, selected country, currency preference, and user experience settings.',
      'At this stage, HireFlow does not require a separate cookie policy because it does not use advertising or third-party tracking cookies.',
    ],
  },
  {
    title: '8. Data Security and Retention',
    body: [
      'Passwords are stored securely using hashing, and sensitive actions such as password reset use OTP verification.',
      'We keep account, application, support, notification, and log data for as long as needed to operate the platform, debug issues, and maintain a useful job history.',
      'If you want your account removed, contact support or use available account deletion options where provided.',
    ],
  },
]

const summaryItems = [
  { icon: FiDatabase, label: 'Data collected', text: 'Accounts, resumes, applications, recruiter details, support tickets, and logs.' },
  { icon: FiUserCheck, label: 'Candidate control', text: 'Candidates can manage recruiter profile visibility and contact sharing.' },
  { icon: FiBell, label: 'Notifications', text: 'Important account, application, and support events can create alerts or emails.' },
  { icon: FiLock, label: 'Security', text: 'Passwords are hashed and reset flows use OTP verification.' },
]

const PrivacyPolicyPage = () => {
  return (
    <StaticPageShell title="Privacy Policy" crumb="Privacy">
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="min-w-0">
            <div className="mb-10">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] bg-blue-50 text-primary">
                <FiShield className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">HireFlow Data Policy</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">Privacy Policy</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This policy explains what information HireFlow collects, how it is used, and how candidates and recruiters
                can manage data visibility while using the job portal.
              </p>
              <p className="mt-3 text-sm text-slate-500">Last updated: June 14, 2026</p>
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
              <h3 className="text-lg font-semibold">Privacy Summary</h3>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-primary">
                <FiMail className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Questions About Data?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Contact support if you want to ask about profile visibility, resumes, applications, or account deletion.
              </p>
              <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Contact support <FiArrowRight className="h-4 w-4" />
              </Link>
            </section>

            <section className="rounded-[8px] border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-emerald-50 text-emerald-600">
                <FiBriefcase className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Related Terms</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read the platform rules for candidates, recruiters, applications, and account responsibilities.
              </p>
              <Link to="/terms" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View terms <FiArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </StaticPageShell>
  )
}

export default PrivacyPolicyPage
