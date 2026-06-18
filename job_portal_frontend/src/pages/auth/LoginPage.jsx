import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => searchParams.get('authError') || '')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!formData.email) nextErrors.email = 'Email is required'
    if (!formData.password) nextErrors.password = 'Password is required'
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await authService.login(formData)
      const { token, user } = response.data

      login(user, token)
      toast.success('Login successful!')
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const continueWithGoogle = () => {
    window.location.href = authService.getGoogleAuthUrl('candidate')
  }

  return (
    <MainLayout fullBleed>
      <section className="bg-[#F1F2F4] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[8px] border border-[#E4E5E8] bg-white shadow-[0_18px_44px_rgba(28,39,49,0.08)]">
          <div className="p-6 sm:p-10">
            <h2 className="text-3xl font-semibold text-[#18191C]">Sign in</h2>
            <p className="mt-2 text-[#5E6670]">Use your candidate or recruiter account.</p>

            {error && <div className="mt-6"><Error message={error} /></div>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#474C54]">Email Address</span>
                <div className={`flex h-12 items-center rounded-[4px] border px-4 ${errors.email ? 'border-red-400' : 'border-[#E4E5E8]'}`}>
                  <FiMail className="mr-3 h-5 w-5 text-primary" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-full w-full outline-none"
                  />
                </div>
                {errors.email && <span className="mt-1 block text-sm text-red-500">{errors.email}</span>}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#474C54]">Password</span>
                <div className={`flex h-12 items-center rounded-[4px] border px-4 ${errors.password ? 'border-red-400' : 'border-[#E4E5E8]'}`}>
                  <FiLock className="mr-3 h-5 w-5 text-primary" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-full w-full outline-none"
                  />
                </div>
                {errors.password && <span className="mt-1 block text-sm text-red-500">{errors.password}</span>}
              </label>

              <div className="flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
                <Link to="/register" className="font-medium text-primary hover:underline">Create account</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-primary font-semibold text-white transition hover:bg-[#0855A2] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-7 flex items-center gap-4 text-xs text-[#9199A3]">
              <span className="h-px flex-1 bg-[#E4E5E8]" /> or <span className="h-px flex-1 bg-[#E4E5E8]" />
            </div>

            <button
              type="button"
              onClick={continueWithGoogle}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#E4E5E8] bg-white text-sm font-semibold text-[#474C54] transition hover:bg-[#F1F2F4]"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default LoginPage
