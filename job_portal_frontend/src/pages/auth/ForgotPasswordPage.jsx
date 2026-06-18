import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [formData, setFormData] = useState({ email: '', otp: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleRequestOtp = async (event) => {
    event.preventDefault()

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await authService.forgotPassword(formData.email.trim())
      setDevOtp(response.data.devOtp || '')
      setStep('reset')
      toast.success(response.data.emailSent ? 'OTP sent to your email' : 'OTP generated')
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to send OTP'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    if (!formData.otp.trim()) {
      setError('OTP is required')
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
      await authService.resetPasswordWithOtp({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        password: formData.password,
      })
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

          <h1 className="text-3xl font-semibold text-[#18191C]">Forgot password?</h1>
          <p className="mt-2 text-[#5E6670]">
            {step === 'request'
              ? 'Enter your account email and we will send a 6 digit OTP.'
              : `Enter the OTP sent to ${formData.email} and choose a new password.`}
          </p>

          {error && <div className="mt-6"><Error message={error} /></div>}
          {devOtp && (
            <div className="mt-6 rounded-[6px] bg-amber-50 p-4 text-sm text-amber-800">
              Development OTP: <span className="font-semibold">{devOtp}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="mt-8 space-y-5">
              <Field label="Email Address" icon={FiMail}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                  className="h-full w-full outline-none"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-primary font-semibold text-white transition hover:bg-[#0855A2] disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send OTP'}
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              <Field label="OTP" icon={FiShield}>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(event) => updateField('otp', event.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6 digit OTP"
                  className="h-full w-full outline-none"
                />
              </Field>
              <Field
                label="New Password"
                icon={FiLock}
                action={
                  <PasswordToggle
                    active={showPassword}
                    label={showPassword ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowPassword((current) => !current)}
                  />
                }
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="New password"
                  className="h-full w-full outline-none"
                />
              </Field>
              <Field
                label="Confirm Password"
                icon={FiLock}
                action={
                  <PasswordToggle
                    active={showConfirmPassword}
                    label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  />
                }
              >
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="Confirm password"
                  className="h-full w-full outline-none"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] bg-primary px-5 font-semibold text-white transition hover:bg-[#0855A2] disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                  <FiArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="h-12 rounded-[4px] border border-blue-100 px-5 font-semibold text-primary transition hover:bg-blue-50 disabled:opacity-60"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </MainLayout>
  )
}

const Field = ({ action, children, icon: Icon, label }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-[#474C54]">{label}</span>
    <div className="flex h-12 items-center rounded-[4px] border border-[#E4E5E8] px-4">
      <Icon className="mr-3 h-5 w-5 text-primary" />
      {children}
      {action}
    </div>
  </label>
)

const PasswordToggle = ({ active, label, onClick }) => {
  const Icon = active ? FiEyeOff : FiEye

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-slate-500 transition hover:bg-blue-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

export default ForgotPasswordPage
