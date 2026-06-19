/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export const countries = [
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'JP', name: 'Japan', dial: '+81' },
]

const storageKey = 'locationPreference'

const LocationContext = createContext(null)

const getFlagEmoji = (countryCode) =>
  String(countryCode || 'IN')
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()))

const getFlagUrl = (countryCode) => `https://flagcdn.com/w40/${String(countryCode || 'IN').toLowerCase()}.png`

const findCountry = (code) => countries.find((country) => country.code === code) || countries[0]

const getSavedPreference = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}')
  } catch {
    return {}
  }
}

const inferCountryFromBrowser = () => {
  const localeCode = navigator.language?.split('-')?.[1]?.toUpperCase()
  if (localeCode && countries.some((country) => country.code === localeCode)) return localeCode

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (timezone.includes('Kolkata')) return 'IN'
  if (timezone.includes('New_York') || timezone.includes('Chicago') || timezone.includes('Los_Angeles')) return 'US'
  if (timezone.includes('London')) return 'GB'
  if (timezone.includes('Dubai')) return 'AE'
  if (timezone.includes('Singapore')) return 'SG'
  if (timezone.includes('Tokyo')) return 'JP'
  return 'IN'
}

const reverseGeocodeCountry = async ({ latitude, longitude }) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 4500)

  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    )
    const data = await response.json()
    return data.countryCode?.toUpperCase()
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const detectCountryFromIp = async () => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 4500)

  try {
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    if (!response.ok) return null

    const data = await response.json()
    return data.country_code?.toUpperCase() || null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const LocationProvider = ({ children }) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    const saved = getSavedPreference()
    return saved.countryCode || inferCountryFromBrowser()
  })
  const [locationStatus, setLocationStatus] = useState('idle')
  const [coordinates, setCoordinates] = useState(() => getSavedPreference().coordinates || null)
  const preferenceSourceRef = useRef(getSavedPreference().source || 'auto')

  const saveCountry = useCallback((countryCode, nextCoordinates = coordinates, source = 'auto') => {
    const country = findCountry(countryCode)
    preferenceSourceRef.current = source
    setSelectedCountryCode(country.code)
    localStorage.setItem(storageKey, JSON.stringify({ countryCode: country.code, coordinates: nextCoordinates, source }))
  }, [coordinates])

  const saveAutoCountry = useCallback((countryCode, nextCoordinates = coordinates) => {
    if (preferenceSourceRef.current === 'manual') return
    saveCountry(countryCode, nextCoordinates, 'auto')
  }, [coordinates, saveCountry])

  const runIpFallback = useCallback(async () => {
    try {
      const countryCode = await detectCountryFromIp()
      saveAutoCountry(countryCode || inferCountryFromBrowser(), null)
    } catch {
      saveAutoCountry(inferCountryFromBrowser(), null)
    }
  }, [saveAutoCountry])

  const selectCountry = useCallback((countryCode) => {
    saveCountry(countryCode, coordinates, 'manual')
  }, [coordinates, saveCountry])

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported')
      runIpFallback()
      return
    }

    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        setCoordinates(nextCoordinates)

        try {
          const countryCode = await reverseGeocodeCountry(nextCoordinates)
          saveAutoCountry(countryCode || inferCountryFromBrowser(), nextCoordinates)
        } catch {
          saveAutoCountry(inferCountryFromBrowser(), nextCoordinates)
        }

        setLocationStatus('granted')
      },
      () => {
        setLocationStatus('denied')
        runIpFallback()
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
    )
  }, [runIpFallback, saveAutoCountry])

  useEffect(() => {
    const saved = getSavedPreference()
    if (saved.countryCode || saved.source === 'manual') return

    const timerId = window.setTimeout(() => requestLocation(), 700)
    return () => window.clearTimeout(timerId)
  }, [requestLocation])

  const selectedCountry = useMemo(() => findCountry(selectedCountryCode), [selectedCountryCode])
  const value = useMemo(
    () => ({
      coordinates,
      countries,
      flag: getFlagEmoji(selectedCountry.code),
      flagUrl: getFlagUrl(selectedCountry.code),
      getFlagEmoji,
      getFlagUrl,
      locationStatus,
      requestLocation,
      selectCountry,
      selectedCountry,
    }),
    [
      coordinates,
      locationStatus,
      requestLocation,
      selectCountry,
      selectedCountry,
    ]
  )

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocationPreference = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationPreference must be used within LocationProvider')
  }
  return context
}
