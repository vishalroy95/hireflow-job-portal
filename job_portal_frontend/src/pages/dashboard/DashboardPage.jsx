import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const DashboardPage = () => {
  const { user } = useAuth()

  if (user?.role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />
  }

  return <Navigate to="/candidate/dashboard" replace />
}

export default DashboardPage
