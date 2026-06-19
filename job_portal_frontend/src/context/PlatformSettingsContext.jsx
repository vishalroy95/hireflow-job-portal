/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { platformSettingsService } from '../services/api'

const defaultSettings = {
  general: {
    siteName: 'JobPortal',
    siteTitle: 'JobPortal - Job Portal',
    supportEmail: 'info@jobportal.com',
    supportPhone: '+1 (234) 567-890',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    allowCandidateRegistration: true,
    allowRecruiterRegistration: true,
  },
  branding: {
    logoUrl: '',
    bannerUrl: '',
    faviconUrl: '',
    primaryColor: '#0A66C2',
    secondaryColor: '#0D1117',
    footerText: 'Connect jobs with talent. Find your next opportunity today.',
  },
  currency: {
    baseCurrency: 'INR',
    usdRate: 0.012,
  },
}

const PlatformSettingsContext = createContext({
  settings: defaultSettings,
  loading: false,
  assetUrl: (url) => url,
})

const PRODUCTION_API_BASE_URL = 'https://hireflow-backend-lsd5.onrender.com/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API_BASE_URL : 'http://localhost:5000/api')

const API_ORIGIN = API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : ''

const buildAssetUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

const applyBranding = (settings) => {
  const primaryColor = settings.branding?.primaryColor || defaultSettings.branding.primaryColor
  const secondaryColor = settings.branding?.secondaryColor || defaultSettings.branding.secondaryColor

  document.documentElement.style.setProperty('--color-primary', primaryColor)
  document.documentElement.style.setProperty('--color-secondary', secondaryColor)
  document.title = settings.general?.siteTitle || defaultSettings.general.siteTitle

  const faviconUrl = buildAssetUrl(settings.branding?.faviconUrl)
  if (faviconUrl) {
    let favicon = document.querySelector("link[rel='icon']")
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }
    favicon.href = faviconUrl
  }
}

export const PlatformSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchSettings = async () => {
      try {
        const response = await platformSettingsService.getPublicSettings()
        const savedSettings = response.data.settings || {}
        const mergedSettings = {
          general: { ...defaultSettings.general, ...savedSettings.general },
          branding: { ...defaultSettings.branding, ...savedSettings.branding },
          currency: { ...defaultSettings.currency, ...savedSettings.currency },
        }

        if (mounted) {
          setSettings(mergedSettings)
          applyBranding(mergedSettings)
        }
      } catch {
        applyBranding(defaultSettings)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      settings,
      loading,
      assetUrl: buildAssetUrl,
    }),
    [settings, loading]
  )

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  )
}

export const usePlatformSettings = () => useContext(PlatformSettingsContext)
