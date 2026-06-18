import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/ui/Loading'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, loading, user } = useAuth()

  if (loading) {
    return <Loading fullScreen message="Loading..." />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
