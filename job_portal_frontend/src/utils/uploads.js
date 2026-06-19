const PRODUCTION_API_BASE_URL = 'https://hireflow-backend-lsd5.onrender.com/api'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API_BASE_URL : 'http://localhost:5000/api')

const API_ORIGIN = API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : ''

export const resolveUploadUrl = (value = '') => {
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}

export const isDataUrl = (value = '') => /^data:/i.test(value)

const dataUrlToBlobUrl = (value = '') => {
  const [meta = '', data = ''] = value.split(',')
  const mime = meta.match(/^data:([^;]+)/i)?.[1] || 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

const withTemporaryObjectUrl = (value, callback, revokeDelay = 60000) => {
  const url = isDataUrl(value) ? dataUrlToBlobUrl(value) : resolveUploadUrl(value)
  callback(url)

  if (url.startsWith('blob:')) {
    window.setTimeout(() => URL.revokeObjectURL(url), revokeDelay)
  }
}

export const openUpload = (value = '') => {
  if (!value) return

  withTemporaryObjectUrl(value, (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  })
}

export const downloadUpload = (value = '', filename = 'download') => {
  if (!value) return

  withTemporaryObjectUrl(value, (url) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, 1000)
}
