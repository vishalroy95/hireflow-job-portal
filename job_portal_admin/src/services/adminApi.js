import api from './api'

// ============= User Management =============
export const userService = {
  getUsers: (page = 1, search = '', role = '') =>
    api.get('/admin/users', { params: { page, search, role } }),

  getUserById: (id) =>
    api.get(`/admin/users/${id}`),

  updateUser: (id, data) =>
    api.put(`/admin/users/${id}`, data),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  blockUser: (id) =>
    api.put(`/admin/users/${id}/block`),

  unblockUser: (id) =>
    api.put(`/admin/users/${id}/unblock`),
}

// ============= Job Management =============
export const jobService = {
  getJobs: (page = 1, search = '', filters = {}) =>
    api.get('/admin/jobs', { params: { page, search, ...filters } }),

  getJobById: (id) =>
    api.get(`/admin/jobs/${id}`),

  deleteJob: (id) =>
    api.delete(`/admin/jobs/${id}`),

  activateJob: (id) =>
    api.put(`/admin/jobs/${id}/activate`),

  deactivateJob: (id) =>
    api.put(`/admin/jobs/${id}/deactivate`),
}

// ============= Application Management =============
export const applicationService = {
  getApplications: (page = 1, filters = {}) =>
    api.get('/admin/applications', { params: { page, ...filters } }),

  getApplicationStats: () =>
    api.get('/admin/applications/stats'),
}

// ============= Testimonial Management =============
export const testimonialService = {
  getTestimonials: (page = 1, filters = {}) =>
    api.get('/admin/testimonials', { params: { page, ...filters } }),

  updateTestimonial: (id, data) =>
    api.put(`/admin/testimonials/${id}`, data),

  approveTestimonial: (id) =>
    api.put(`/admin/testimonials/${id}/approve`),

  rejectTestimonial: (id) =>
    api.put(`/admin/testimonials/${id}/reject`),

  markPending: (id) =>
    api.put(`/admin/testimonials/${id}/pending`),

  deleteTestimonial: (id) =>
    api.delete(`/admin/testimonials/${id}`),
}

// ============= Support Management =============
export const supportService = {
  getTickets: (page = 1, filters = {}) =>
    api.get('/admin/support/tickets', { params: { page, ...filters } }),

  updateTicket: (id, data) =>
    api.put(`/admin/support/tickets/${id}`, data),

  replyToTicket: (id, data) =>
    api.post(`/admin/support/tickets/${id}/reply`, data),

  deleteTicket: (id) =>
    api.delete(`/admin/support/tickets/${id}`),
}

// ============= Recruiter Management =============
export const recruiterService = {
  getRecruiters: (page = 1, status = '', search = '') =>
    api.get('/admin/recruiters', { params: { page, status, search } }),

  getRecruiterById: (id) =>
    api.get(`/admin/recruiters/${id}`),

  approveRecruiter: (id) =>
    api.put(`/admin/recruiters/${id}/approve`),

  rejectRecruiter: (id) =>
    api.put(`/admin/recruiters/${id}/reject`),

  updateRecruiterAccount: (id, data) =>
    api.put(`/admin/recruiters/${id}`, data),
}

// ============= Dashboard Insights =============
export const analyticsService = {
  getStats: () =>
    api.get('/admin/analytics/stats'),

  getAnalyticsData: (dateRange = {}) =>
    api.get('/admin/analytics/data', { params: dateRange }),
}

// ============= Settings =============
export const settingsService = {
  getSettings: () =>
    api.get('/admin/settings'),

  updateSettings: (section, data) =>
    api.put(`/admin/settings/${section}`, data),

  getPaymentPlans: () =>
    api.get('/admin/payment-plans'),

  updatePaymentPlans: (plans) =>
    api.put('/admin/payment-plans', { plans }),

  uploadLogo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  uploadBanner: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/settings/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ============= System Logs =============
export const logService = {
  getLogs: (params = {}) =>
    api.get('/admin/logs', { params }),
}
