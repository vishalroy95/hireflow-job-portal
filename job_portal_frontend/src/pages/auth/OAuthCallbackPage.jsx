import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import MainLayout from '../../layouts/MainLayout'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const getWorkspacePath = (role) => (role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const handledRef = useRef(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const completeGoogleAuth = async () => {
      const token = searchParams.get('token')

      if (!token) {
        const message = searchParams.get('authError') || 'Google sign in could not be completed'
        setError(message)
        toast.error(message)
        return
      }

      try {
        localStorage.setItem('authToken', token)
        const response = await authService.getProfile()
        const user = response.data.user

        login(user, token)
        toast.success('Signed in with Google', { id: 'google-login-success' })
        navigate(getWorkspacePath(user.role), { replace: true })
      } catch {
        localStorage.removeItem('authToken')
        setError('Could not finish Google sign in. Please try again.')
      }
    }

    completeGoogleAuth()
  }, [login, navigate, searchParams])

  return (
    <MainLayout fullBleed>
      <section className="flex min-h-[520px] items-center justify-center bg-[#F1F2F4] px-4 py-16">
        <div className="w-full max-w-md rounded-[8px] border border-[#E4E5E8] bg-white p-8 text-center shadow-[0_18px_44px_rgba(28,39,49,0.08)]">
          {error ? (
            <>
              <h1 className="text-2xl font-semibold text-[#18191C]">Google sign in failed</h1>
              <div className="mt-5 text-left">
                <Error message={error} />
              </div>
            </>
          ) : (
            <>
              <Loading message="Verifying your Google account..." />
              <h1 className="mt-5 text-2xl font-semibold text-[#18191C]">Signing you in</h1>
              <p className="mt-2 text-sm text-[#5E6670]">Please wait while we verify your Google account.</p>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  )
}

export default OAuthCallbackPage
