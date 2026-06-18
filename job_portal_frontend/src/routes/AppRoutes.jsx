import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Pages
import HomePage from '../pages/home/HomePage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import OAuthCallbackPage from '../pages/auth/OAuthCallbackPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import JobsPage from '../pages/jobs/JobsPage'
import JobDetailsPage from '../pages/jobs/JobDetailsPage'
import EmployersPage from '../pages/employers/EmployersPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import ProfilePage from '../pages/dashboard/ProfilePage'
import MyApplicationsPage from '../pages/dashboard/MyApplicationsPage'
import RecruiterWorkspace from '../pages/recruiter/RecruiterWorkspace'
import CandidateWorkspace from '../pages/candidate/CandidateWorkspace'
import ContactPage from '../pages/static/ContactPage'
import TermsPage from '../pages/static/TermsPage'
import PrivacyPolicyPage from '../pages/static/PrivacyPolicyPage'
import ComingSoonPage from '../pages/static/ComingSoonPage'
import NotFoundPage from '../pages/static/NotFoundPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/find-job" element={<JobsPage />} />
      <Route path="/find-jobs" element={<JobsPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:id" element={<JobDetailsPage />} />
      <Route path="/find-employers" element={<EmployersPage />} />
      <Route path="/employers" element={<EmployersPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <RecruiterWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-applications"
        element={
          <ProtectedRoute requiredRole="candidate">
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
