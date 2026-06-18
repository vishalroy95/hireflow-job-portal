/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useContext, useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('authToken'))

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('authToken')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        setToken(storedToken)
        const response = await authService.getProfile()
        if (response.data.success) {
          setUser(response.data.user)
        }
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('authToken', authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
