import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import StaticPageShell from './StaticPageShell'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <StaticPageShell title="">
      <main className="mx-auto grid min-h-[560px] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2">
        <section>
          <h1 className="text-3xl font-semibold">Oops! Page not found</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
            Something went wrong. It's look like the link is broken or the page is removed.
          </p>
          <div className="mt-7 flex gap-3">
            <Link to="/" className="flex items-center gap-2 bg-blue-600 px-6 py-3 text-sm font-semibold text-white">
              Home <FiArrowRight />
            </Link>
            <button onClick={() => navigate(-1)} className="border border-slate-200 px-6 py-3 text-sm font-semibold text-blue-600">
              Go Back
            </button>
          </div>
        </section>

        <section className="flex justify-center">
          <img src="/image1.png" alt="Page not found illustration" className="max-h-80 w-full max-w-md object-contain" />
        </section>
      </main>
    </StaticPageShell>
  )
}

export default NotFoundPage
