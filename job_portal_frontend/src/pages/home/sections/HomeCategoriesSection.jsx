import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCode,
  FiDatabase,
  FiMonitor,
  FiMusic,
  FiPenTool,
  FiTrendingUp,
} from 'react-icons/fi'

const defaultCategories = [
  { label: 'Graphics & Design', count: 357, icon: FiPenTool },
  { label: 'Code & Programming', count: 312, icon: FiCode },
  { label: 'Digital Marketing', count: 297, icon: FiTrendingUp },
  { label: 'Video & Animation', count: 247, icon: FiMonitor },
  { label: 'Music & Audio', count: 204, icon: FiMusic },
  { label: 'Account & Finance', count: 167, icon: FiBarChart2 },
  { label: 'Health & Care', count: 125, icon: FiBriefcase },
  { label: 'Data & Science', count: 57, icon: FiDatabase, featured: true },
]

const iconSet = [FiPenTool, FiCode, FiTrendingUp, FiMonitor, FiMusic, FiBarChart2, FiBriefcase, FiDatabase]

const buildCategories = (categories = []) => {
  if (!categories.length) return defaultCategories

  return categories.slice(0, 8).map((category, index) => ({
    label: category.label,
    count: category.count,
    icon: iconSet[index % iconSet.length],
    featured: index === 7,
  }))
}

const HomeCategoriesSection = ({ categories }) => {
  const visibleCategories = buildCategories(categories)

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Popular category</h2>
          <Link
            to="/jobs"
            className="inline-flex h-11 items-center gap-2 rounded-[4px] border border-blue-100 px-5 text-sm font-semibold text-primary transition hover:border-blue-200 hover:bg-blue-50"
          >
            View All <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category) => {
            const Icon = category.icon

            return (
              <Link
                key={category.label}
                to={`/jobs?skills=${encodeURIComponent(category.label)}`}
                className={`group flex min-h-[80px] items-center gap-4 rounded-[8px] p-4 transition ${
                  category.featured
                    ? 'bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]'
                    : 'hover:bg-slate-50 hover:shadow-sm'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] ${
                    category.featured ? 'bg-primary text-white' : 'bg-blue-50 text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${category.featured ? 'text-primary' : 'text-slate-950'}`}>
                    {category.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{category.count} Open position</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeCategoriesSection
