export function formatErrorMessage(error) {
  if (typeof error === 'string') return error

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function handleApiError(error) {
  const message = formatErrorMessage(error)
  const statusCode = error?.response?.status

  return {
    message,
    statusCode,
    isNetworkError: !error?.response,
  }
}
