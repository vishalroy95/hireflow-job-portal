import axios from 'axios'

const PRODUCTION_API_BASE_URL = 'https://hireflow-backend-lsd5.onrender.com/api'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API_BASE_URL : 'http://localhost:5000/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthRequest = requestUrl.startsWith('/auth/')

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyRegistration: (data) => api.post('/auth/register/verify', data),
  completeGoogleRecruiterRegistration: (data) => api.post('/auth/register/google-recruiter', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPasswordWithOtp: (data) => api.put('/auth/reset-password/otp', data),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getGoogleAuthUrl: (role = 'candidate') => `${API_BASE_URL}/auth/google?role=${encodeURIComponent(role)}`,
}

export const platformSettingsService = {
  getPublicSettings: () => api.get('/settings/public'),
}

export const testimonialService = {
  getPublicTestimonials: (params) => api.get('/testimonials', { params }),
  submitTestimonial: (data) => api.post('/testimonials', data),
}

export const supportService = {
  createTicket: (data) => api.post('/support/tickets', data),
  getMyTickets: () => api.get('/support/tickets/my'),
}

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all'),
}

export const jobService = {
  getAllJobs: (params) => api.get('/jobs', { params }),
  getStats: () => api.get('/jobs/stats'),
  getEmployers: (params) => api.get('/jobs/employers', { params }),
  getFeaturedJobs: (params) => api.get('/jobs/featured', { params }),
  getPopularCategories: () => api.get('/jobs/categories'),
  getJobById: (id) => api.get(`/jobs/${id}`),
  getRecommendedJobs: (id, params) => api.get(`/jobs/${id}/recommended`, { params }),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/recruiter/my-jobs'),
}

export const applicationService = {
  applyForJob: (jobId, data) => api.post(`/applications/apply/${jobId}`, data),
  getMyApplications: () => api.get('/applications/my-applications'),
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
  updateApplicationStatus: (id, status) => api.put(`/applications/status/${id}`, { status }),
  analyzeApplication: (id, force = false) => api.post(`/applications/${id}/analyze`, { force }),
  getApplicationAnalysis: (id) => api.get(`/applications/${id}/analysis`),
  getStats: () => api.get('/applications/stats'),
}

export const candidateService = {
  getDashboard: () => api.get('/candidate/dashboard'),
  getProfile: () => api.get('/candidate/profile'),
  updateProfile: (data) => api.put('/candidate/profile', data),
  uploadResume: (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post('/candidate/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadProfileImage: (file) => {
    const formData = new FormData()
    formData.append('profileImage', file)
    return api.post('/candidate/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  parseResume: () => api.post('/candidate/profile/parse-resume'),
  getSavedJobs: () => api.get('/candidate/saved-jobs'),
  toggleSavedJob: (jobId) => api.put(`/candidate/saved-jobs/${jobId}`),
  markViewedJob: (jobId) => api.post(`/candidate/viewed-jobs/${jobId}`),
  getRecommendedJobs: () => api.get('/candidate/recommended-jobs'),
  getNotifications: () => api.get('/candidate/notifications'),
  markNotificationRead: (id) => api.put(`/candidate/notifications/${id}/read`),
  changePassword: (data) => api.put('/candidate/settings/password', data),
  deleteAccount: () => api.delete('/candidate/settings/account'),
}

export const recruiterService = {
  getDashboard: () => api.get('/recruiter/dashboard'),
  getCompany: () => api.get('/recruiter/company'),
  saveCompany: (data) => api.put('/recruiter/company', data),
  uploadCompanyLogo: (file) => {
    const formData = new FormData()
    formData.append('companyLogo', file)
    return api.post('/recruiter/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  createJob: (data) => api.post('/recruiter/jobs', data),
  updateJob: (id, data) => api.put(`/recruiter/jobs/${id}`, data),
  duplicateJob: (id) => api.post(`/recruiter/jobs/${id}/duplicate`),
  updateJobStatus: (id, data) => api.put(`/recruiter/jobs/${id}/status`, data),
  getApplicants: (params) => api.get('/recruiter/applicants', { params }),
  recordCandidateProfileView: (id) => api.post(`/recruiter/applicants/${id}/profile-view`),
  updateApplicantStatus: (id, status) => api.put(`/recruiter/applicants/${id}/status`, { status }),
  screenApplicant: (id) => api.post(`/recruiter/applicants/${id}/screen`),
  analyzeApplicant: (id, force = false) => api.post(`/applications/${id}/analyze`, { force }),
  getInterviews: () => api.get('/recruiter/interviews'),
  scheduleInterview: (data) => api.post('/recruiter/interviews', data),
  updateInterview: (id, data) => api.put(`/recruiter/interviews/${id}`, data),
  getMessages: () => api.get('/recruiter/messages'),
  sendMessage: (data) => api.post('/recruiter/messages', data),
  getAnalytics: () => api.get('/recruiter/analytics'),
  getSubscription: () => api.get('/recruiter/subscription'),
  getBillingPlans: () => api.get('/recruiter/billing/plans'),
  getPayments: () => api.get('/recruiter/billing/payments'),
  createPaymentOrder: (planId) => api.post('/recruiter/billing/orders', { planId }),
  verifyPayment: (data) => api.post('/recruiter/billing/verify', data),
}

export default api
