import axios from 'axios'

// In Docker: VITE_API_URL is set per env. In dev with proxy: use /api
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          api.defaults.headers.common.Authorization = `Bearer ${data.access}`
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  users: () => api.get('/auth/users/'),
  organizations: () => api.get('/auth/organizations/'),
  evaluateurs: () => api.get('/auth/evaluateurs/'),
}

// ─── Tenders ─────────────────────────────────────────────────
export const tendersApi = {
  list: (params) => api.get('/tenders/', { params }),
  detail: (id) => api.get(`/tenders/${id}/`),
  // JSON create - no multipart needed (dao_file upload handled separately)
  create: (data) => api.post('/tenders/', data),
  update: (id, data) => api.patch(`/tenders/${id}/`, data),
  delete: (id) => api.delete(`/tenders/${id}/`),
  publish: (id) => api.post(`/tenders/${id}/publish/`),
  close: (id) => api.post(`/tenders/${id}/close/`),
  startEvaluation: (id) => api.post(`/tenders/${id}/start_evaluation/`),
  attribute: (id, data) => api.post(`/tenders/${id}/attribute/`, data),
  assignEvaluator: (id, data) => api.post(`/tenders/${id}/assign_evaluator/`, data),
  removeEvaluator: (id, data) => api.post(`/tenders/${id}/remove_evaluator/`, data),
  stats: () => api.get('/tenders/stats/'),
  // Criteria
  getCriteria: (tenderId) => api.get(`/tenders/${tenderId}/criteria_list/`),
  addCriterion: (tenderId, data) => api.post(`/tenders/${tenderId}/criteria_list/`, data),
  updateCriterion: (tenderId, criterionId, data) => api.patch(`/tenders/${tenderId}/criteria/${criterionId}/`, data),
  deleteCriterion: (tenderId, criterionId) => api.delete(`/tenders/${tenderId}/criteria/${criterionId}/`),
}

// ─── Submissions ──────────────────────────────────────────────
export const submissionsApi = {
  list: (params) => api.get('/submissions/', { params }),
  detail: (id) => api.get(`/submissions/${id}/`),
  create: (data) => api.post('/submissions/', data),
  submit: (id) => api.post(`/submissions/${id}/submit/`),
  uploadDocument: (id, formData) => api.post(`/submissions/${id}/upload_document/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeDocument: (id, documentId) => api.delete(`/submissions/${id}/remove_document/`, {
    data: { document_id: documentId }
  }),
  updateExtracted: (id, data) => api.patch(`/submissions/${id}/update_extracted/`, data),
  mySubmissions: () => api.get('/submissions/my_submissions/'),
}

// ─── Evaluation ───────────────────────────────────────────────
export const evaluationApi = {
  submitScore: (data) => api.post('/evaluation/submit_manual_score/', data),
  submissionScores: (submissionId) => api.get('/evaluation/submission_scores/', {
    params: { submission_id: submissionId }
  }),
  tenderRanking: (tenderId) => api.get('/evaluation/tender_ranking/', {
    params: { tender_id: tenderId }
  }),
  criteriaScores: (tenderId) => api.get('/evaluation/criteria_scores/', {
    params: { tender_id: tenderId }
  }),
  runAutoScoring: (tenderId) => api.post('/evaluation/run_auto_scoring/', { tender_id: tenderId }),
  session: (tenderId) => api.get('/evaluation/session/', { params: { tender_id: tenderId } }),
  downloadReport: (tenderId) => {
    const token = localStorage.getItem('access_token')
    window.open(`${API_BASE}/evaluation/report/${tenderId}/?token=${token}`, '_blank')
  },
}

// ─── Audit ────────────────────────────────────────────────────
export const auditApi = {
  logs: (params) => api.get('/audit/', { params }),
}

// ─── Password Reset (add to authApi) ─────────────────────────
// These are added as standalone exports for clarity
export const passwordResetApi = {
  forgotPassword: (email, frontendUrl) =>
    api.post('/auth/forgot-password/', { email, frontend_url: frontendUrl }),
  validateToken: (token) =>
    api.get('/auth/validate-reset-token/', { params: { token } }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password/', { token, new_password: newPassword }),
}
