import { useNavigate } from 'react-router-dom'
import { FiBriefcase, FiMapPin, FiSearch, FiUsers } from 'react-icons/fi'
import HomeHeroIllustration from './HomeHeroIllustration'

const HomeHeroSection = ({ searchForm, setSearchForm, stats }) => {
  const navigate = useNavigate()
  const statCards = [
    { label: 'Live Job', value: stats.liveJobs, icon: FiBriefcase },
    { label: 'Companies', value: stats.companies, icon: FiBriefcase },
    { label: 'Candidates', value: stats.candidates, icon: FiUsers },
    { label: 'New Jobs', value: stats.newJobs, icon: FiBriefcase },
  ]

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    const title = searchForm.title.trim()
    const location = searchForm.location.trim()

    if (title) params.set('title', title)
    if (location) params.set('location', location)

    navigate(params.toString() ? `/find-job?${params.toString()}` : '/find-job')
  }

  return (
    <section className="bg-[#F1F2F4] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
          <div className="max-w-[680px]">
            <h1 className="max-w-[640px] text-[36px] font-semibold leading-[1.18] text-[#18191C] sm:text-[48px]">
              Find jobs faster with AI-powered resume matching.
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-7 text-[#5E6670] sm:text-[17px]">
              HireFlow analyzes your profile, skills, and resume to surface relevant openings, improve your applications, and keep your job search organized in one place.
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-9 max-w-[680px] rounded-[8px] bg-white p-3 shadow-[0_18px_44px_rgba(28,39,49,0.08)]">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_132px]">
                <label className="relative flex h-14 items-center border-[#E4E5E8] md:border-r">
                  <FiSearch className="absolute left-5 h-6 w-6 text-[#0A66C2]" />
                  <input
                    type="text"
                    placeholder="Job title, Keyword..."
                    value={searchForm.title}
                    onChange={(event) => setSearchForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="h-full w-full rounded-md border-0 bg-transparent pl-14 pr-5 text-[#18191C] outline-none placeholder:text-[#9199A3]"
                  />
                </label>
                <label className="relative flex h-14 items-center">
                  <FiMapPin className="absolute left-5 h-6 w-6 text-[#0A66C2]" />
                  <input
                    type="text"
                    placeholder="Your Location"
                    value={searchForm.location}
                    onChange={(event) => setSearchForm((prev) => ({ ...prev, location: event.target.value }))}
                    className="h-full w-full rounded-md border-0 bg-transparent pl-14 pr-5 text-[#18191C] outline-none placeholder:text-[#9199A3]"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-14 items-center justify-center rounded-[4px] bg-[#0A66C2] px-6 font-semibold text-white transition hover:bg-[#0855A2]"
                >
                  Find Job
                </button>
              </div>
            </form>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HomeHeroIllustration />
          </div>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="flex items-center gap-5 rounded-[8px] bg-white p-5 transition hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[4px] bg-[#E7F0FA] text-[#0A66C2]">
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#18191C]">{stat.value}</p>
                  <p className="mt-2 text-base text-[#767F8C]">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeHeroSection
