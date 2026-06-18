import { FiArrowRight, FiMail } from 'react-icons/fi'
import StaticPageShell from './StaticPageShell'

const ComingSoonPage = () => {
  return (
    <StaticPageShell title="" footer={false}>
      <main className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2">
        <section>
          <h1 className="max-w-md text-4xl font-semibold leading-tight">
            Our website is under construction
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
            In ac turpis mi. Donec quis semper neque. Nulla cursus gravida interdum. Curabitur luctus sapien.
          </p>
          <div className="mt-7 flex max-w-md overflow-hidden border border-slate-200">
            <div className="flex flex-1 items-center gap-2 px-4 text-slate-400">
              <FiMail className="text-blue-600" />
              <input className="h-12 w-full outline-none" placeholder="Email Address" />
            </div>
            <button className="flex items-center gap-2 bg-blue-600 px-6 text-sm font-semibold text-white">
              Subscribe <FiArrowRight />
            </button>
          </div>
          <div className="mt-28">
            <p className="mb-3 text-xs text-slate-500">Follow us</p>
            <div className="flex gap-2 text-blue-600">
              {['f', 'tw', 'ig', 'yt'].map((item) => (
                <button key={item} className="grid h-8 w-8 place-items-center bg-blue-50 text-xs">{item}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex justify-center">
          <img src="/image1.png" alt="Coming soon illustration" className="max-h-[360px] w-full max-w-lg object-contain" />
        </section>
      </main>
    </StaticPageShell>
  )
}

export default ComingSoonPage
