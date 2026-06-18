import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('adminToken')
        if (savedToken) {
          setToken(savedToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`

          const response = await api.get('/auth/profile')
          if (response.data.success && response.data.user?.role === 'admin') {
            setUser(response.data.user)
            setError(null)
          } else {
            localStorage.removeItem('adminToken')
            setToken(null)
            setUser(null)
          }
        }
      } catch (err) {
        localStorage.removeItem('adminToken')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.post('/auth/login', { email, password })

      if (response.data.success) {
        const { token, user } = response.data

        if (user?.role !== 'admin') {
          setError('Admin access required')
          toast.error('Admin access required')
          return false
        }

        localStorage.setItem('adminToken', token)
        setToken(token)
        setUser(user)

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        toast.success('Login successful!')
        return true
      } else {
        setError(response.data.message || 'Login failed')
        toast.error(response.data.message || 'Login failed')
        return false
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.get('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('adminToken')
      setToken(null)
      setUser(null)
      delete api.defaults.headers.common['Authorization']
      toast.success('Logged out successfully')
    }
  }, [])

  const updateProfile = useCallback(async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData)
      if (response.data.success) {
        setUser(response.data.user)
        toast.success('Profile updated successfully')
        return true
      }
      return false
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile'
      toast.error(errorMessage)
      return false
    }
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
