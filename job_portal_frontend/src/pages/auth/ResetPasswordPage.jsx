import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiArrowRight, FiLock } from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'

const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in both password fields')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.resetPassword(token, formData.password)
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to reset password'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout fullBleed>
      <section className="bg-[#F1F2F4] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-[8px] border border-[#E4E5E8] bg-white p-6 shadow-[0_18px_44px_rgba(28,39,49,0.08)] sm:p-10">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <FiArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <h1 className="text-3xl font-semibold text-[#18191C]">Reset password</h1>
          <p className="mt-2 text-[#5E6670]">Enter a new password for your account.</p>

          {error && <div className="mt-6"><Error message={error} /></div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <PasswordInput
              label="New Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
            />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-primary font-semibold text-white transition hover:bg-[#0855A2] disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
              <FiArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </MainLayout>
  )
}

const PasswordInput = ({ label, ...inputProps }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#474C54]">{label}</span>
    <div className="flex h-12 items-center rounded-[4px] border border-[#E4E5E8] px-4">
      <FiLock className="mr-3 h-5 w-5 text-primary" />
      <input
        type="password"
        className="h-full w-full outline-none"
        {...inputProps}
      />
    </div>
  </label>
)

export default ResetPasswordPage
