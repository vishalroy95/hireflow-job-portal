export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export const validateForm = (formData) => {
  const errors = {}

  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format'
  }

  if (!formData.password) {
    errors.password = 'Password is required'
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters'
  }

  return errors
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const truncateText = (text, limit = 100) => {
  if (!text) return ''
  return text.length > limit ? text.substring(0, limit) + '...' : text
}

export const getInitials = (name) => {
  if (!name) return ''
  const parts = name.split(' ')
  return parts.map((p) => p[0]).join('').toUpperCase()
}
