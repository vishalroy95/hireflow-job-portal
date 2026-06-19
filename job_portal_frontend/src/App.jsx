import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { PlatformSettingsProvider } from './context/PlatformSettingsContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <Router>
      <PlatformSettingsProvider>
        <LocationProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LocationProvider>
      </PlatformSettingsProvider>
    </Router>
  )
}

export default App
