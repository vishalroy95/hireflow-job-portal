import { useState, useCallback } from 'react'
import { handleApiError } from '../utils/errorHandler'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (apiCall) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()
      return response
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, loading, error }
}
