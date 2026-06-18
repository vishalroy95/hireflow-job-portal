export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password) {
  return password && password.length >= 6
}

export function validateUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validatePhoneNumber(phone) {
  const re = /^[\d\s\-\+\(\)]+$/
  return re.test(phone)
}

export function validateSalaryRange(min, max) {
  return min > 0 && max > 0 && min <= max
}
