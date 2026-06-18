/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
const promptSeenKey = 'locationPromptSeen'

const LocationContext = createContext(null)

const getFlagEmoji = (countryCode) =>
  String(countryCode || 'IN')
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()))

const getFlagUrl = (countryCode) => `https://flagcdn.com/w40/${String(countryCode || 'IN').toLowerCase()}.png`

const findCountry = (code) => countries.find((country) => country.code === code) || countries[0]

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

export const LocationProvider = ({ children }) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      return saved.countryCode || inferCountryFromBrowser()
    } catch {
      return inferCountryFromBrowser()
    }
  })
  const [locationStatus, setLocationStatus] = useState('idle')
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [coordinates, setCoordinates] = useState(null)

  useEffect(() => {
    const promptSeen = localStorage.getItem(promptSeenKey)
    if (!promptSeen && 'geolocation' in navigator) {
      const timerId = window.setTimeout(() => setShowLocationPrompt(true), 700)
      return () => window.clearTimeout(timerId)
    }
  }, [])

  const saveCountry = useCallback((countryCode, nextCoordinates = coordinates) => {
    const country = findCountry(countryCode)
    setSelectedCountryCode(country.code)
    localStorage.setItem(storageKey, JSON.stringify({ countryCode: country.code, coordinates: nextCoordinates }))
  }, [coordinates])

  const selectCountry = useCallback((countryCode) => {
    saveCountry(countryCode)
  }, [saveCountry])

  const dismissLocationPrompt = useCallback(() => {
    localStorage.setItem(promptSeenKey, 'true')
    setShowLocationPrompt(false)
  }, [])

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported')
      dismissLocationPrompt()
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
          saveCountry(countryCode || inferCountryFromBrowser(), nextCoordinates)
        } catch {
          saveCountry(inferCountryFromBrowser(), nextCoordinates)
        }

        setLocationStatus('granted')
        dismissLocationPrompt()
      },
      () => {
        setLocationStatus('denied')
        dismissLocationPrompt()
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
    )
  }, [dismissLocationPrompt, saveCountry])

  const selectedCountry = useMemo(() => findCountry(selectedCountryCode), [selectedCountryCode])
  const value = useMemo(
    () => ({
      coordinates,
      countries,
      dismissLocationPrompt,
      flag: getFlagEmoji(selectedCountry.code),
      flagUrl: getFlagUrl(selectedCountry.code),
      getFlagEmoji,
      getFlagUrl,
      locationStatus,
      requestLocation,
      selectCountry,
      selectedCountry,
      showLocationPrompt,
    }),
    [
      coordinates,
      dismissLocationPrompt,
      locationStatus,
      requestLocation,
      selectCountry,
      selectedCountry,
      showLocationPrompt,
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
