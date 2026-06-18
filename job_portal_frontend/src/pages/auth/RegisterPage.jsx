import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FcGoogle } from 'react-icons/fc'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import MainLayout from '../../layouts/MainLayout'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { usePlatformSettings } from '../../context/PlatformSettingsContext'

const initialForm = {
  role: 'candidate',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  designation: '',
  companyWebsite: '',
  terms: false,
}

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const googleRecruiterToken = searchParams.get('googleToken') || ''
  const isGoogleRecruiterFlow = Boolean(googleRecruiterToken)
  const [formData, setFormData] = useState(() => ({
    ...initialForm,
    role: searchParams.get('role') === 'recruiter' ? 'recruiter' : initialForm.role,
    name: searchParams.get('name') || initialForm.name,
    email: searchParams.get('email') || initialForm.email,
  }))
  const [step, setStep] = useState('form')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(() => searchParams.get('authError') || '')
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { login } = useAuth()
  const { settings } = usePlatformSettings()
  const navigate = useNavigate()
  const candidateSignupEnabled = settings.general.allowCandidateRegistration
  const recruiterSignupEnabled = settings.general.allowRecruiterRegistration
  const selectedRole = formData.role

  const availableRoles = [
    candidateSignupEnabled && { value: 'candidate', label: 'Candidate' },
    recruiterSignupEnabled && { value: 'recruiter', label: 'Recruiter' },
  ].filter(Boolean)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Full name is required'
    if (!formData.email.trim()) nextErrors.email = 'Email address is required'
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required'
    if (!isGoogleRecruiterFlow) {
      if (!formData.password) nextErrors.password = 'Password is required'
      else if (formData.password.length < 6) nextErrors.password = 'Password must be at least 6 characters'
      if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.terms) nextErrors.terms = 'Please accept the terms of services'

    if (selectedRole === 'recruiter') {
      if (!formData.companyName.trim()) nextErrors.companyName = 'Company name is required'
      if (!formData.designation.trim()) nextErrors.designation = 'Designation is required'
    }

    return nextErrors
  }

  const buildPayload = () => ({
    role: selectedRole,
    name: formData.name.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    password: formData.password,
    companyName: formData.companyName.trim(),
    designation: formData.designation.trim(),
    companyWebsite: formData.companyWebsite.trim(),
  })

  const requestVerification = async (event) => {
    event?.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    if (isGoogleRecruiterFlow) {
      try {
        setLoading(true)
        setError('')
        await authService.completeGoogleRecruiterRegistration({
          googleToken: googleRecruiterToken,
          phone: formData.phone.trim(),
          companyName: formData.companyName.trim(),
          designation: formData.designation.trim(),
          companyWebsite: formData.companyWebsite.trim(),
        })
        setStep('submitted')
        toast.success('Recruiter account submitted for approval')
      } catch (err) {
        const message = err.response?.data?.message || 'Could not submit recruiter registration'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await authService.register(buildPayload())
      setDevOtp(response.data.devOtp || '')
      setStep('verify')
      toast.success(response.data.emailSent ? 'Verification code sent' : 'Verification code generated')
    } catch (err) {
      const message = err.response?.data?.message || 'Could not start registration'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const verifyAndCreate = async (event) => {
    event.preventDefault()

    if (otp.trim().length !== 6) {
      setError('Enter the 6 digit verification code')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await authService.verifyRegistration({
        email: formData.email.trim(),
        otp: otp.trim(),
      })
      const { token, user } = response.data
      login(user, token)
      toast.success('Account created successfully')
      navigate(user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const continueWithGoogle = () => {
    window.location.href = authService.getGoogleAuthUrl(selectedRole)
  }

  if (!candidateSignupEnabled && !recruiterSignupEnabled) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-lg rounded-[8px] bg-white p-8 text-center shadow-lg">
            <h1 className="mb-4 text-3xl font-bold">Registration Closed</h1>
            <p className="text-slate-600">New account registration is currently disabled.</p>
            <Link to="/login" className="mt-6 inline-block font-medium text-primary hover:underline">
              Go to login
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout fullBleed>
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div className="mx-auto max-w-xl">
              <Link to="/" className="mb-14 inline-flex items-center gap-2 text-2xl font-bold text-slate-950">
                <img src="/favicon.svg" alt="HireFlow" className="h-9 w-9 rounded-[4px] object-contain" />
                HireFlow
              </Link>

              {step === 'form' ? (
                <>
                  <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h1 className="text-3xl font-semibold text-slate-950">Create account.</h1>
                      <p className="mt-2 text-sm text-slate-500">
                        Already have account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:underline">Log In</Link>
                      </p>
                    </div>
                    <select
                      value={selectedRole}
                      onChange={(event) => updateField('role', event.target.value)}
                      disabled={isGoogleRecruiterFlow}
                      className="h-11 rounded-[4px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  {error && <div className="mb-5"><Error message={error} /></div>}
                  {isGoogleRecruiterFlow && (
                    <div className="mb-5 rounded-[4px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Google verified your email. Complete company details and admin will review your recruiter account.
                    </div>
                  )}

                  <form onSubmit={requestVerification} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field error={errors.name} icon={FiUser}>
                        <input value={formData.name} onChange={(event) => updateField('name', event.target.value)} readOnly={isGoogleRecruiterFlow} placeholder="Full Name" className="h-full w-full outline-none read-only:bg-white read-only:text-slate-600" />
                      </Field>
                      <Field error={errors.phone} icon={FiPhone}>
                        <input value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Phone Number" className="h-full w-full outline-none" />
                      </Field>
                    </div>

                    <Field error={errors.email} icon={FiMail}>
                      <input type="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} readOnly={isGoogleRecruiterFlow} placeholder={selectedRole === 'recruiter' ? 'Work email address' : 'Email address'} className="h-full w-full outline-none read-only:bg-white read-only:text-slate-600" />
                    </Field>

                    {selectedRole === 'recruiter' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field error={errors.companyName} icon={FiBriefcase}>
                          <input value={formData.companyName} onChange={(event) => updateField('companyName', event.target.value)} placeholder="Company Name" className="h-full w-full outline-none" />
                        </Field>
                        <Field error={errors.designation} icon={FiUser}>
                          <input value={formData.designation} onChange={(event) => updateField('designation', event.target.value)} placeholder="Your Designation" className="h-full w-full outline-none" />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field icon={FiBriefcase}>
                            <input type="url" value={formData.companyWebsite} onChange={(event) => updateField('companyWebsite', event.target.value)} placeholder="Company website (optional)" className="h-full w-full outline-none" />
                          </Field>
                        </div>
                      </div>
                    )}

                    {!isGoogleRecruiterFlow && (
                      <>
                        <Field error={errors.password} icon={FiLock} action={<PasswordToggle active={showPassword} onClick={() => setShowPassword((current) => !current)} />}>
                          <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Password" className="h-full w-full outline-none" />
                        </Field>

                        <Field error={errors.confirmPassword} icon={FiLock} action={<PasswordToggle active={showConfirmPassword} onClick={() => setShowConfirmPassword((current) => !current)} />}>
                          <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Confirm Password" className="h-full w-full outline-none" />
                        </Field>
                      </>
                    )}

                    <label className="flex items-start gap-3 text-sm text-slate-500">
                      <input
                        type="checkbox"
                        checked={formData.terms}
                        onChange={(event) => updateField('terms', event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>
                        I've read and agree with your{' '}
                        <Link to="/terms" className="font-semibold text-primary hover:underline">Terms of Services</Link>
                        {errors.terms && <span className="mt-1 block text-xs text-red-500">{errors.terms}</span>}
                      </span>
                    </label>

                    <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-primary font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                      {loading ? 'Submitting...' : isGoogleRecruiterFlow ? 'Submit for Approval' : 'Create Account'} <FiArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  {!isGoogleRecruiterFlow && (
                    <>
                      <div className="my-7 flex items-center gap-4 text-xs text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
                      </div>

                      <button
                        type="button"
                        onClick={continueWithGoogle}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <FcGoogle className="h-5 w-5" />
                        Sign up with Google
                      </button>
                    </>
                  )}
                </>
              ) : step === 'verify' ? (
                <form onSubmit={verifyAndCreate} className="mx-auto max-w-md py-16 text-center">
                  <button type="button" onClick={() => setStep('form')} className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <FiArrowLeft className="h-4 w-4" />
                    Back to details
                  </button>
                  <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-primary">
                    <FiShield className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-semibold text-slate-950">Email Verification</h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    We've sent a verification code to <span className="font-semibold text-slate-700">{formData.email}</span>.
                  </p>
                  {error && <div className="mt-5 text-left"><Error message={error} /></div>}
                  {devOtp && <div className="mt-5 rounded-[4px] bg-amber-50 p-3 text-sm text-amber-800">Development OTP: <span className="font-semibold">{devOtp}</span></div>}
                  <Field className="mt-6" icon={FiShield}>
                    <input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="Verification Code" className="h-full w-full text-center tracking-[0.3em] outline-none" />
                  </Field>
                  <button type="submit" disabled={loading} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-primary font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    {loading ? 'Verifying...' : 'Verify My Account'} <FiArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={loading} onClick={requestVerification} className="mt-5 text-sm text-slate-500 disabled:opacity-60">
                    Didn't receive any code? <span className="font-semibold text-primary">Resend</span>
                  </button>
                </form>
              ) : (
                <div className="mx-auto max-w-md py-16 text-center">
                  <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <FiShield className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-semibold text-slate-950">Submitted for Review</h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    Your recruiter account is created with Google verification. Admin will approve your company account before you can post jobs.
                  </p>
                  <Link to="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[4px] bg-primary px-5 text-sm font-semibold text-white">
                    Back to Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

const Field = ({ action, children, className = '', error, icon: Icon }) => (
  <div className={className}>
    <div className={`flex h-12 items-center rounded-[4px] border bg-white px-4 ${error ? 'border-red-400' : 'border-slate-200'} focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100`}>
      <Icon className="mr-3 h-5 w-5 shrink-0 text-primary" />
      {children}
      {action}
    </div>
    {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
  </div>
)

const PasswordToggle = ({ active, onClick }) => {
  const Icon = active ? FiEyeOff : FiEye

  return (
    <button type="button" onClick={onClick} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-slate-500 hover:bg-blue-50 hover:text-primary" aria-label={active ? 'Hide password' : 'Show password'}>
      <Icon className="h-5 w-5" />
    </button>
  )
}

export default RegisterPage
