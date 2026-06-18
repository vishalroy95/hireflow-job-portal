import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AdminRoutes from './routes/AdminRoutes'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AdminRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
