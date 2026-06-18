const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

const API_ORIGIN = API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : ''

export const resolveUploadUrl = (value = '') => {
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}
