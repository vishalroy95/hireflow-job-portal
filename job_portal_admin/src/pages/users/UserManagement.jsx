import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { userService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { confirmAction } from '../../utils/confirmToast.jsx'
import { AiOutlineDelete, AiOutlineLock, AiOutlineUnlock } from 'react-icons/ai'

const roleStyles = {
  admin: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  recruiter: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  candidate: 'border-green-500/30 bg-green-500/10 text-green-300',
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState('')

  const loadUsers = async (nextPage = page) => {
    try {
      setLoading(true)
      const response = await userService.getUsers(nextPage, search, role)
      setUsers(response.data.users || [])
      setPage(response.data.page || nextPage)
      setPages(response.data.pages || 1)
      setTotal(response.data.total || 0)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1)
  }, [role])

  const toggleBlock = async (user) => {
    try {
      setUpdatingId(user._id)
      if (user.isBlocked) {
        await userService.unblockUser(user._id)
        toast.success('User unblocked')
      } else {
        await userService.blockUser(user._id)
        toast.success('User blocked')
      }
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setUpdatingId('')
    }
  }

  const deleteUser = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete user?',
      message: 'This will remove the user account permanently.',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    try {
      await userService.deleteUser(id)
      toast.success('User deleted')
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadUsers(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-slate-400">Search, filter, block, unblock, and remove platform accounts.</p>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-300">Search users</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="lg:w-56">
              <span className="mb-2 block text-sm font-medium text-slate-300">Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </label>
            <Button type="submit" disabled={loading}>Apply</Button>
          </form>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">{total} user{total === 1 ? '' : 's'} found</p>
            {loading && <LoadingSpinner size="sm" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-700 text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8"><LoadingSpinner /></td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-700">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${roleStyles[user.role] || roleStyles.candidate}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${user.isBlocked ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-green-500/30 bg-green-500/10 text-green-300'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                        <button disabled={updatingId === user._id} onClick={() => toggleBlock(user)} className="text-blue-400 hover:text-blue-300 disabled:opacity-50">
                          {user.isBlocked ? <AiOutlineUnlock /> : <AiOutlineLock />}
                        </button>
                        <button onClick={() => deleteUser(user._id)} className="text-red-400 hover:text-red-300">
                          <AiOutlineDelete />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => loadUsers(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pages} onClick={() => loadUsers(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default UserManagement
