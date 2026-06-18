import { useNavigate, useLocation } from 'react-router-dom'
import { 
  AiOutlineDashboard,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineBars,
  AiOutlineClose,
  AiOutlineTeam,
  AiOutlineContacts,
  AiOutlineSetting,
  AiOutlineStar,
  AiOutlineCustomerService,
  AiOutlineHistory
} from 'react-icons/ai'

function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: AiOutlineDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: AiOutlineUser, label: 'Users', path: '/users' },
    { icon: AiOutlineTeam, label: 'Recruiters', path: '/recruiters' },
    { icon: AiOutlineFileText, label: 'Jobs', path: '/jobs' },
    { icon: AiOutlineContacts, label: 'Applications', path: '/applications' },
    { icon: AiOutlineStar, label: 'Testimonials', path: '/testimonials' },
    { icon: AiOutlineCustomerService, label: 'Support', path: '/support' },
    { icon: AiOutlineHistory, label: 'Logs', path: '/logs' },
    { icon: AiOutlineSetting, label: 'Settings', path: '/settings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col fixed h-full md:relative z-40 overflow-y-auto`}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {isOpen && <h1 className="text-xl font-bold text-white">HireFlow</h1>}
          <button onClick={onToggle} className="text-slate-400 hover:text-white md:hidden">
            {isOpen ? <AiOutlineClose size={20} /> : <AiOutlineBars size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <item.icon size={20} />
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => onToggle()}
        />
      )}
    </>
  )
}

export default Sidebar
