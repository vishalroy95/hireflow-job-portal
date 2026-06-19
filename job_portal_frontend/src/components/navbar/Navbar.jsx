import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiBell, FiBriefcase, FiCheck, FiLogOut, FiMenu, FiSearch, FiX } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'
import { notificationService } from '../../services/api'
import { confirmAction } from '../../utils/confirmToast.jsx'
import { resolveUploadUrl } from '../../utils/uploads'
import CountrySelector from '../location/CountrySelector'

const topLinks = [
  { label: 'Home', path: '/', match: 'exact' },
  { label: 'Find Job', path: '/find-job', match: 'jobs' },
  { label: 'Find Employers', path: '/find-employers', match: 'employers' },
]

const NOTIFICATION_CACHE_TTL_MS = 60 * 1000
const notificationCache = {
  token: '',
  items: [],
  fetchedAt: 0,
  inFlight: null,
}

const BrandLink = ({ logoUrl, siteName }) => (
  <Link to="/" className="inline-flex items-center gap-3">
    {logoUrl ? (
      <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded-[4px] object-contain" />
    ) : (
      <img src="/favicon.svg" alt={siteName} className="h-9 w-9 rounded-[4px] object-contain" />
    )}
    <span className="text-2xl font-bold text-[#18191C]">{siteName}</span>
  </Link>
)

const AvatarImage = ({ src, alt, fallback }) => {
  const [failedSrc, setFailedSrc] = useState('')

  if (!src || failedSrc === src) {
    return <span className="text-sm font-semibold text-primary">{fallback}</span>
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setFailedSrc(src)}
    />
  )
}

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const { user, logout, token } = useAuth()
  const { settings, assetUrl } = usePlatformSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const notificationsRef = useRef(null)
  const logoUrl = assetUrl(settings.branding.logoUrl)
  const siteName = settings.general.siteName || 'JobPortal'
  const workspacePath = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard'
  const navLinks = useMemo(
    () => (token ? [...topLinks, { label: 'Dashboard', path: workspacePath, match: 'dashboard' }] : topLinks),
    [token, workspacePath]
  )
  const canRegister = settings.general.allowCandidateRegistration || settings.general.allowRecruiterRegistration
  const userAvatarSource = user?.role === 'recruiter'
    ? user?.companyLogo || user?.company?.logo || ''
    : user?.profileImage || ''
  const userAvatarUrl = resolveUploadUrl(userAvatarSource)
  const userAvatarFallback = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read && !notification.readAt).length,
    [notifications]
  )

  const fetchNotifications = useCallback(async ({ force = false } = {}) => {
    if (!token) return

    const now = Date.now()
    const cacheIsFresh =
      notificationCache.token === token &&
      notificationCache.fetchedAt > 0 &&
      now - notificationCache.fetchedAt < NOTIFICATION_CACHE_TTL_MS

    if (!force && cacheIsFresh) {
      setNotifications(notificationCache.items)
      return
    }

    if (notificationCache.inFlight) {
      const cachedItems = await notificationCache.inFlight
      setNotifications(cachedItems)
      return
    }

    try {
      setNotificationsLoading(notificationCache.fetchedAt === 0)
      notificationCache.inFlight = notificationService.getNotifications().then(({ data }) => {
        const items = data.notifications || []
        notificationCache.token = token
        notificationCache.items = items
        notificationCache.fetchedAt = Date.now()
        return items
      })

      const items = await notificationCache.inFlight
      setNotifications(items)
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      notificationCache.inFlight = null
      setNotificationsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setNotifications([])
        setNotificationsOpen(false)
        notificationCache.token = ''
        notificationCache.items = []
        notificationCache.fetchedAt = 0
        notificationCache.inFlight = null
      })
      return
    }

    queueMicrotask(fetchNotifications)
  }, [fetchNotifications, token])

  useEffect(() => {
    queueMicrotask(() => {
      setNotificationsOpen(false)
      setMenuOpen(false)
    })
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: 'Logout?',
      message: 'You will need to login again to access your account.',
      confirmText: 'Logout',
    })
    if (!confirmed) return

    logout()
    navigate('/')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') || '').trim()
    const params = title ? `?title=${encodeURIComponent(title)}` : ''
    navigate(`/find-job${params}`)
    setMenuOpen(false)
  }

  const handleNavClick = (event, path) => {
    event.preventDefault()
    navigate(path)
    setMenuOpen(false)
  }

  const getNotificationTarget = (notification) => {
    const metadata = notification.metadata || {}

    if (metadata.jobId) return `/jobs/${metadata.jobId}`
    if (metadata.ticketId) return `${workspacePath}?support=tickets`
    if (metadata.interviewId || metadata.messageId || metadata.applicationId) return workspacePath
    return workspacePath
  }

  const handleNotificationClick = async (notification) => {
    const notificationId = notification.id || notification._id

    if (!notification.read && !notification.readAt && notificationId) {
      setNotifications((items) =>
        items.map((item) =>
          (item.id || item._id) === notificationId ? { ...item, read: true, readAt: new Date().toISOString() } : item
        )
      )

      try {
        await notificationService.markNotificationRead(notificationId)
      } catch (error) {
        console.error('Failed to mark notification read', error)
        fetchNotifications({ force: true })
      }
    }

    setNotificationsOpen(false)
    navigate(getNotificationTarget(notification))
  }

  const handleMarkAllRead = async () => {
    if (!unreadCount) return

    const readAt = new Date().toISOString()
    setNotifications((items) => items.map((item) => ({ ...item, read: true, readAt })))

    try {
      await notificationService.markAllNotificationsRead()
    } catch (error) {
      console.error('Failed to mark notifications read', error)
      fetchNotifications({ force: true })
    }
  }

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return ''

    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(createdAt))
  }

  const isTopLinkActive = (link) => {
    if (link.match === 'exact') return location.pathname === link.path
    if (link.match === 'jobs') return location.pathname === '/find-job' || location.pathname === '/find-jobs' || location.pathname.startsWith('/jobs')
    if (link.match === 'employers') return location.pathname === '/find-employers' || location.pathname.startsWith('/employers')
    if (link.match === 'dashboard') return location.pathname === workspacePath
    return location.pathname.startsWith(link.path)
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E4E5E8] bg-white">
      <div className="hidden border-b border-[#E4E5E8] bg-[#F1F2F4] lg:block">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center px-8 text-sm text-[#5E6670]">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={(event) => handleNavClick(event, link.path)}
                className={`h-12 border-b-2 pt-4 transition ${
                  isTopLinkActive(link) ? 'border-primary font-semibold text-primary' : 'border-transparent hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[92px] items-center justify-between gap-6">
          <BrandLink logoUrl={logoUrl} siteName={siteName} />

          <form onSubmit={handleSearchSubmit} className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex">
            <CountrySelector />
            <label className="relative w-full max-w-[560px]">
              <FiSearch className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input
                name="title"
                placeholder="Job title, keyword, company"
                className="h-11 w-full rounded-[4px] border border-[#E4E5E8] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </form>

          <div className="hidden items-center gap-3 md:flex">
            {!token ? (
              <>
                <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-[4px] border border-[#D6E7F9] px-5 text-sm font-semibold text-primary transition hover:bg-blue-50">
                  Sign In
                </Link>
                {canRegister && (
                  <Link to="/register" className="inline-flex h-11 items-center justify-center rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#0855A2]">
                    Post A Jobs
                  </Link>
                )}
              </>
            ) : (
              <>
                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((open) => !open)
                      if (!notificationsOpen) fetchNotifications()
                    }}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full text-[#5E6670] transition hover:bg-slate-50 hover:text-primary"
                    aria-label="Notifications"
                  >
                    <FiBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-950">Notifications</p>
                          <p className="text-xs text-slate-500">{unreadCount} unread update{unreadCount === 1 ? '' : 's'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={!unreadCount}
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs font-semibold text-primary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          <FiCheck className="h-3.5 w-3.5" />
                          Read all
                        </button>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto py-1">
                        {notificationsLoading ? (
                          <p className="px-4 py-6 text-center text-sm text-slate-500">Loading updates...</p>
                        ) : notifications.length ? (
                          notifications.map((notification) => {
                            const notificationId = notification.id || notification._id
                            const isUnread = !notification.read && !notification.readAt

                            return (
                              <button
                                key={notificationId}
                                type="button"
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-blue-50 ${
                                  isUnread ? 'bg-blue-50/60' : 'bg-white'
                                }`}
                              >
                                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isUnread ? 'bg-primary' : 'bg-slate-200'}`} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-950">{notification.title}</span>
                                  {notification.message && (
                                    <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-600">{notification.message}</span>
                                  )}
                                  <span className="mt-1 block text-xs text-slate-400">{formatNotificationTime(notification.createdAt)}</span>
                                </span>
                              </button>
                            )
                          })
                        ) : (
                          <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Link to={workspacePath} className="inline-flex h-11 items-center justify-center rounded-[4px] bg-blue-50 px-4 text-sm font-semibold text-primary">
                  {user?.role === 'recruiter' ? 'Recruiter Workspace' : 'Candidate Workspace'}
                </Link>
                {user?.role === 'recruiter' && (
                  <Link to="/recruiter/dashboard" className="inline-flex h-11 items-center gap-2 rounded-[4px] bg-primary px-4 text-sm font-semibold text-white">
                    <FiBriefcase className="h-4 w-4" />
                    Post Job
                  </Link>
                )}
                <Link
                  to={workspacePath}
                  className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white"
                  title={user?.name || 'Profile'}
                >
                  <AvatarImage
                    src={userAvatarUrl}
                    alt={user?.role === 'recruiter' ? user?.company?.name || 'Company logo' : user?.name || 'Profile'}
                    fallback={userAvatarFallback}
                  />
                </Link>
                <button onClick={handleLogout} className="inline-flex h-11 items-center gap-2 rounded-[4px] px-3 text-sm font-semibold text-[#474C54] hover:text-red-600">
                  <FiLogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#474C54]">
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="space-y-3 border-t border-[#E4E5E8] pb-5 pt-4 md:hidden">
            <CountrySelector compact />
            <form onSubmit={handleSearchSubmit} className="relative">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
              <input name="title" placeholder="Job title, keyword, company" className="h-11 w-full rounded-[4px] border border-[#E4E5E8] pl-12 pr-4 outline-none" />
            </form>
            {navLinks.map((link) => (
              <Link key={link.label} to={link.path} className="block py-2 text-[#474C54] hover:text-primary" onClick={(event) => handleNavClick(event, link.path)}>
                {link.label}
              </Link>
            ))}

            {!token ? (
              <div className="grid gap-2 border-t border-[#E4E5E8] pt-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-[4px] border border-[#D6E7F9] px-4 py-2 text-center font-semibold text-primary">
                  Sign In
                </Link>
                {canRegister && (
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-[4px] bg-primary px-4 py-2 text-center font-semibold text-white">
                    Register
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2 border-t border-[#E4E5E8] pt-3">
                <div className="flex items-center gap-3 py-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                    <AvatarImage
                      src={userAvatarUrl}
                      alt={user?.role === 'recruiter' ? user?.company?.name || 'Company logo' : user?.name || 'Profile'}
                      fallback={userAvatarFallback}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-950">{user?.name || 'User'}</span>
                    <span className="block truncate text-sm text-slate-500">{user?.email}</span>
                  </span>
                </div>
                <Link
                  to={workspacePath}
                  className="block py-2 font-semibold text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  {user?.role === 'recruiter' ? 'Recruiter Workspace' : 'Candidate Workspace'}
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 py-2 text-left text-[#474C54] hover:text-red-600"
                >
                  <FiLogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
