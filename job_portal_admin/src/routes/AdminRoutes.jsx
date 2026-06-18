import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AdminLoginPage from '../pages/auth/AdminLoginPage'
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import UserManagement from '../pages/users/UserManagement'
import JobManagement from '../pages/jobs/JobManagement'
import ApplicationManagement from '../pages/applications/ApplicationManagement'
import RecruiterManagement from '../pages/recruiters/RecruiterManagement'
import SettingsPage from '../pages/settings/SettingsPage'
import TestimonialManagement from '../pages/testimonials/TestimonialManagement'
import SupportTicketManagement from '../pages/support/SupportTicketManagement'
import LogManagement from '../pages/logs/LogManagement'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <JobManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <ApplicationManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiters"
        element={
          <ProtectedRoute>
            <RecruiterManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testimonials"
        element={
          <ProtectedRoute>
            <TestimonialManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportTicketManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <LogManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AdminRoutes
