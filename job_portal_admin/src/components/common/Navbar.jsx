import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiOutlineMenu, AiOutlineBell } from 'react-icons/ai'
import ProfileDropdown from './ProfileDropdown'
import { logService } from '../../services/adminApi'

function Navbar({ onMenuClick }) {
  const [open, setOpen] = useState(false)
  const [issueLogs, setIssueLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const loadIssueLogs = async () => {
    try {
      setLoading(true)
      const [errorsResponse, warningsResponse] = await Promise.all([
        logService.getLogs({ severity: 'error', limit: 5 }),
        logService.getLogs({ severity: 'warning', limit: 5 }),
      ])

      const nextLogs = [
        ...(errorsResponse.data.logs || []),
        ...(warningsResponse.data.logs || []),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)

      setIssueLogs(nextLogs)
    } catch (error) {
      console.error('Failed to load admin issue logs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssueLogs()
    const intervalId = window.setInterval(loadIssueLogs, 30000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openLogs = () => {
    setOpen(false)
    navigate('/logs')
  }

  return (
    <nav className="h-16 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="text-slate-400 hover:text-white md:hidden">
          <AiOutlineMenu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen((current) => !current)
              if (!open) loadIssueLogs()
            }}
            className="text-slate-400 hover:text-white relative"
            aria-label="System alerts"
          >
            <AiOutlineBell size={20} />
            {issueLogs.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                {issueLogs.length > 9 ? '9+' : issueLogs.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-4 w-96 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">System Alerts</p>
                  <p className="text-xs text-slate-400">Recent warning and error logs</p>
                </div>
                <button onClick={openLogs} className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                  View logs
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-400">Loading alerts...</p>
                ) : issueLogs.length ? (
                  issueLogs.map((log) => (
                    <button
                      key={log._id}
                      type="button"
                      onClick={openLogs}
                      className="block w-full border-b border-slate-700 px-4 py-3 text-left transition hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${log.severity === 'error' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{log.severity}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-white">{log.message}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{log.action}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No system alerts.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <ProfileDropdown />
      </div>
    </nav>
  )
}

export default Navbar
