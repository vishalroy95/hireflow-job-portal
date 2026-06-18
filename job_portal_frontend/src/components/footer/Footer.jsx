import { Link } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { useLocationPreference } from '../../context/LocationContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'

const Footer = () => {
  const { settings, assetUrl } = usePlatformSettings()
  const { flagUrl, selectedCountry } = useLocationPreference()
  const logoUrl = assetUrl(settings.branding.logoUrl)
  const siteName = settings.general.siteName || 'JobPortal'
  const supportEmail = settings.general.supportEmail || 'info@jobportal.com'
  const supportPhone = settings.general.supportPhone || '+1-202-555-0178'
  const footerText = settings.branding.footerText || 'Connect talent with the right opportunity. Search jobs, manage applications, and grow with confidence.'
  const showRegisterLink = settings.general.allowCandidateRegistration || settings.general.allowRecruiterRegistration

  return (
    <footer className="border-t border-[#E4E5E8] bg-[#18191C] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded-[4px] object-contain" />
              ) : (
                <img src="/favicon.svg" alt={siteName} className="h-10 w-10 rounded-[4px] object-contain" />
              )}
              <span className="text-2xl font-bold">{siteName}</span>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#A3ABB5]">{footerText}</p>
            <p className="mt-5 text-2xl font-semibold">{supportPhone}</p>
            <p className="mt-1 text-sm text-[#A3ABB5]">Call us anytime for support</p>
          </div>

          <div>
            <h3 className="mb-5 font-semibold">Quick Link</h3>
            <ul className="space-y-3 text-sm text-[#A3ABB5]">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/find-job" className="hover:text-white">Find Job</Link></li>
              <li><Link to="/find-employers" className="hover:text-white">Find Employers</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Support</Link></li>
              {showRegisterLink && <li><Link to="/register" className="hover:text-white">Create Account</Link></li>}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 font-semibold">Candidate</h3>
            <ul className="space-y-3 text-sm text-[#A3ABB5]">
              <li><Link to="/find-job" className="hover:text-white">Browse Jobs</Link></li>
              <li><Link to="/candidate/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link to="/candidate/dashboard" className="hover:text-white">Applications</Link></li>
              <li><Link to="/candidate/dashboard" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 font-semibold">Contact</h3>
            <ul className="space-y-4 text-sm text-[#A3ABB5]">
              <li className="flex items-center gap-3">
                <FiMail className="h-4 w-4 text-primary" />
                <a href={`mailto:${supportEmail}`} className="hover:text-white">
                  {supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="h-4 w-4 text-primary" />
                <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                  {supportPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span className="inline-flex items-center gap-2">
                  <img src={flagUrl} alt={`${selectedCountry.name} flag`} className="h-4 w-6 rounded-[2px] object-cover ring-1 ring-white/10" />
                  {selectedCountry.name}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-[#A3ABB5] md:flex-row">
            <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
