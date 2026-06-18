import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'
import FloatingSupportWidget from '../components/support/FloatingSupportWidget'
import { usePlatformSettings } from '../context/PlatformSettingsContext'

const MainLayout = ({ children, fullBleed = false, hideFooter = false }) => {
  const { settings } = usePlatformSettings()

  if (settings.general.maintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-dark mb-4">We will be back soon</h1>
            <p className="text-gray-600">
              {settings.general.siteName} is temporarily under maintenance. Please try again later.
            </p>
          </div>
        </main>
        <FloatingSupportWidget />
        {!hideFooter && <Footer />}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={fullBleed ? 'flex-1 w-full' : 'flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>
      <FloatingSupportWidget />
      {!hideFooter && <Footer />}
    </div>
  )
}

export default MainLayout
