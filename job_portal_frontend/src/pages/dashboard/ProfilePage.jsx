import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import MainLayout from '../../layouts/MainLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Error from '../../components/ui/Error'
import { authService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const ProfilePage = () => {
  const { user, setUser } = useAuth()
  const isCandidate = user?.role === 'candidate'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    resume: '',
    profileImage: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await authService.getProfile()
        const profileData = response.data.user

        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.contact?.phone || '',
          skills: profileData.skills?.join(', ') || '',
          resume: profileData.resume || '',
          profileImage: profileData.profileImage || '',
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const updateData = {
        name: formData.name,
        contact: {
          phone: formData.phone,
        },
        profileImage: formData.profileImage,
      }

      if (isCandidate) {
        updateData.resume = formData.resume
        updateData.skills = formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      }

      const response = await authService.updateProfile(updateData)
      setUser(response.data.user)
      toast.success('Profile updated successfully!')
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading fullScreen />

  return (
    <MainLayout>
      <div className="py-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
        <p className="text-gray-600 mb-8">
          {isCandidate
            ? 'Update your candidate profile and resume'
            : 'Update your recruiter account information'}
        </p>

        {error && <Error message={error} />}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled
          />

          <Input
            label="Contact Number"
            type="tel"
            name="phone"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={handleChange}
          />

          {isCandidate && (
            <Input
              label="Resume URL"
              type="url"
              name="resume"
              placeholder="https://..."
              value={formData.resume}
              onChange={handleChange}
            />
          )}

          <Input
            label="Profile Image URL"
            type="url"
            name="profileImage"
            placeholder="https://..."
            value={formData.profileImage}
            onChange={handleChange}
          />

          {isCandidate && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills (comma-separated)
              </label>
              <textarea
                name="skills"
                placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                value={formData.skills}
                onChange={handleChange}
                className="input-field min-h-24"
              />
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" loading={saving} className="flex-1">
              Save Changes
            </Button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default ProfilePage
