import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { confirmAction } from '../../utils/confirmToast.jsx'
import { AiOutlineUser, AiOutlineSetting, AiOutlineLogout, AiOutlineDown } from 'react-icons/ai'

function ProfileDropdown() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: 'Logout?',
      message: 'You will need to login again to access admin.',
      confirmText: 'Logout',
    })
    if (!confirmed) return

    await logout()
    navigate('/login')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
          <p className="text-xs text-slate-400">{user?.email || 'admin@example.com'}</p>
        </div>
        <AiOutlineDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-slate-400">{user?.email || 'admin@example.com'}</p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate('/profile')
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3"
            >
              <AiOutlineUser size={16} />
              Profile
            </button>

            <button
              onClick={() => {
                navigate('/settings')
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-3"
            >
              <AiOutlineSetting size={16} />
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-3 border-t border-slate-700"
            >
              <AiOutlineLogout size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
