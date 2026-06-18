import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLock, AiOutlineMail } from 'react-icons/ai'
import { useAuth } from '../../hooks/useAuth'

function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    const success = await login(email, password)
    if (success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">HireFlow Admin</h1>
            <p className="text-slate-400">Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <AiOutlineMail className="absolute left-3 top-3.5 text-slate-500" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2.5 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <AiOutlineLock className="absolute left-3 top-3.5 text-slate-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2.5 pl-10 pr-10 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-3.5 text-slate-500 transition hover:text-slate-700 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
