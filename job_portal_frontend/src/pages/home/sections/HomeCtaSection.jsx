import { Link } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import Button from '../../../components/ui/Button'

const HomeCtaSection = ({ showRegisterLink, siteName }) => {
  return (
    <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            {['Verified jobs', 'Candidate workspace', 'Application tracking'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
                <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                {item}
              </span>
            ))}
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">Ready to move with {siteName}?</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Create your profile or jump straight into the jobs list. The application flow is already wired to your backend.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {showRegisterLink && (
            <Link to="/register">
              <Button variant="secondary" className="w-full sm:w-auto">Get Started</Button>
            </Link>
          )}
          <Link to="/jobs">
            <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-slate-950 sm:w-auto">
              Browse Jobs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeCtaSection
