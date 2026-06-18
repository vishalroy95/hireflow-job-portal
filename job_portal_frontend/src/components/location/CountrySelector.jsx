import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiMapPin, FiX } from 'react-icons/fi'
import { useLocationPreference } from '../../context/LocationContext'

const FlagIcon = ({ code, name, className = '' }) => {
  const { getFlagUrl } = useLocationPreference()

  return (
    <img
      src={getFlagUrl(code)}
      alt={`${name} flag`}
      className={`h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-black/5 ${className}`}
      loading="lazy"
    />
  )
}

const CountrySelector = ({ compact = false }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { countries, selectCountry, selectedCountry } = useLocationPreference()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-11 items-center justify-between gap-2 rounded-[4px] border border-[#E4E5E8] bg-white px-4 text-sm text-[#474C54] transition hover:border-blue-200 ${
          compact ? 'w-full' : 'min-w-[118px]'
        }`}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <FlagIcon code={selectedCountry.code} name={selectedCountry.name} />
          <span className="truncate">{selectedCountry.name}</span>
        </span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-[#767F8C] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-64 overflow-hidden rounded-[8px] border border-[#E4E5E8] bg-white shadow-[0_18px_44px_rgba(28,39,49,0.14)]">
          <div className="border-b border-[#E4E5E8] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#767F8C]">Select country</p>
          </div>
          <div className="max-h-72 overflow-y-auto py-2">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  selectCountry(country.code)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                  country.code === selectedCountry.code ? 'bg-blue-50 text-primary' : 'text-[#474C54]'
                }`}
              >
                <FlagIcon code={country.code} name={country.name} />
                <span className="flex-1">{country.name}</span>
                <span className="text-xs text-[#9199A3]">{country.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const LocationPrompt = () => {
  const { dismissLocationPrompt, locationStatus, requestLocation, showLocationPrompt } = useLocationPreference()

  if (!showLocationPrompt) return null

  const handleAllow = () => {
    requestLocation()
  }

  return (
    <div className="fixed left-4 top-24 z-[80] w-[calc(100%-2rem)] max-w-[322px] sm:left-[184px] sm:top-[118px]">
      <div className="rounded-[11px] border border-[#DADCE0] bg-white p-5 shadow-[0_14px_34px_rgba(28,39,49,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-bold leading-6 text-[#18191C]">{window.location.hostname || 'HireFlow'} wants to</h2>
          <button
            type="button"
            onClick={dismissLocationPrompt}
            className="-mr-2 -mt-2 flex h-7 w-7 items-center justify-center rounded-full text-[#474C54] transition hover:bg-[#F1F2F4]"
            aria-label="Close location permission"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-[#2F3338]">
          <FiMapPin className="h-5 w-5 shrink-0 text-[#474C54]" />
          <span>Know your location</span>
        </div>

        <div className="mt-6 grid gap-2.5">
          <button
            type="button"
            onClick={handleAllow}
            disabled={locationStatus === 'requesting'}
            className="h-10 rounded-full bg-[#D8E6FF] px-4 text-sm font-semibold text-[#061A35] transition hover:bg-[#C8DBFB] disabled:opacity-70"
          >
            {locationStatus === 'requesting' ? 'Checking location...' : 'Allow while visiting the site'}
          </button>
          <button
            type="button"
            onClick={handleAllow}
            disabled={locationStatus === 'requesting'}
            className="h-10 rounded-full bg-[#D8E6FF] px-4 text-sm font-semibold text-[#061A35] transition hover:bg-[#C8DBFB] disabled:opacity-70"
          >
            {locationStatus === 'requesting' ? 'Checking location...' : 'Allow this time'}
          </button>
          <button
            type="button"
            onClick={dismissLocationPrompt}
            className="h-10 rounded-full bg-[#D8E6FF] px-4 text-sm font-semibold text-[#061A35] transition hover:bg-[#C8DBFB]"
          >
            Never allow
          </button>
        </div>
      </div>
    </div>
  )
}

export default CountrySelector
