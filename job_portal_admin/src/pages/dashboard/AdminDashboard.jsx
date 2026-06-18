import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminLayout } from '../../layouts/AdminLayout'
import api from '../../services/api'
import { analyticsService, logService } from '../../services/adminApi'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  AiOutlineArrowRight,
  AiOutlineFileDone,
  AiOutlineFileText,
  AiOutlineHistory,
  AiOutlineSetting,
  AiOutlineTeam,
  AiOutlineUser,
} from 'react-icons/ai'

const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7']

const formatLabel = (value) =>
  String(value || 'unknown')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const chartData = (items = []) =>
  items.map((item) => ({
    name: formatLabel(item._id),
    value: item.count,
  }))

function MetricCard({ title, value, detail, icon: Icon, tone }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="mt-3 text-3xl font-bold text-white">{value}</div>
          {detail && <p className="mt-2 text-sm text-slate-400">{detail}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  )
}

function Legend({ items = [] }) {
  return (
    <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
      {items.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return <div className="flex h-64 items-center justify-center text-slate-400">No data yet.</div>
}

const formatLogTime = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const severityTone = {
  info: 'bg-blue-500/15 text-blue-300',
  warning: 'bg-amber-500/15 text-amber-300',
  error: 'bg-red-500/15 text-red-300',
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLogsLoading(true)
        const [statsResponse, analyticsResponse, logsResponse] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          analyticsService.getAnalyticsData(),
          logService.getLogs({ limit: 6 }),
        ])
        setStats(statsResponse.data.stats)
        setAnalytics(analyticsResponse.data)
        setRecentLogs(logsResponse.data.logs || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard')
      } finally {
        setLogsLoading(false)
      }
    }

    loadStats()
  }, [])

  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers,
      detail: `${stats?.totalCandidates || 0} candidates, ${stats?.totalRecruiters || 0} recruiters`,
      icon: AiOutlineUser,
      tone: 'bg-blue-500/15 text-blue-300',
    },
    {
      title: 'Recruiters',
      value: stats?.totalRecruiters,
      detail: `${stats?.approvedRecruiters || 0} approved, ${stats?.pendingRecruiters || 0} pending`,
      icon: AiOutlineTeam,
      tone: 'bg-emerald-500/15 text-emerald-300',
    },
    {
      title: 'Jobs',
      value: stats?.totalJobs,
      detail: `${stats?.activeJobs || 0} currently active`,
      icon: AiOutlineFileText,
      tone: 'bg-amber-500/15 text-amber-300',
    },
    {
      title: 'Applications',
      value: stats?.totalApplications,
      detail: `${stats?.pendingApplications || 0} pending, ${stats?.shortlistedApplications || 0} shortlisted`,
      icon: AiOutlineFileDone,
      tone: 'bg-purple-500/15 text-purple-300',
    },
  ]
  const appStatusData = chartData(analytics?.applicationsByStatus)
  const usersByRoleData = chartData(analytics?.usersByRole)
  const jobsByTypeData = chartData(analytics?.jobsByType)
  const jobsByStatusData = chartData(analytics?.jobsByStatus)
  const loading = !stats || !analytics
  const quickActions = [
    { label: 'Review Recruiters', detail: `${stats?.pendingRecruiters || 0} pending`, icon: AiOutlineTeam, path: '/recruiters' },
    { label: 'Pending Applications', detail: `${stats?.pendingApplications || 0} pending`, icon: AiOutlineFileDone, path: '/applications' },
    { label: 'Open Logs', detail: 'Audit activity', icon: AiOutlineHistory, path: '/logs' },
    { label: 'Manage Settings', detail: 'Email, currency, site', icon: AiOutlineSetting, path: '/settings' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard & Insights</h1>
          <p className="mt-1 text-slate-400">One admin overview for platform health, pending work, recent activity, and job mix.</p>
        </div>
        {error && <div className="mb-4 rounded-lg border border-red-500 bg-red-950 px-4 py-3 text-red-200">{error}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <MetricCard
              key={card.title}
              {...card}
              value={stats ? card.value || 0 : <LoadingSpinner size="sm" />}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 p-4 text-left transition hover:border-blue-500/70 hover:bg-slate-700"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                  <action.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white">{action.label}</span>
                  <span className="mt-1 block text-sm text-slate-400">{action.detail}</span>
                </span>
              </span>
              <AiOutlineArrowRight className="shrink-0 text-slate-400" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title="Applications by Status">
            {loading ? (
              <div className="flex h-72 items-center justify-center"><LoadingSpinner /></div>
            ) : appStatusData.length ? (
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Pie data={appStatusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={3}>
                    {appStatusData.map((entry, index) => (
                      <Cell key={entry.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
            {!loading && appStatusData.length > 0 && <Legend items={appStatusData} />}
          </Panel>

          <div>
            <Panel title="Users by Role">
              {loading ? (
                <div className="flex h-72 items-center justify-center"><LoadingSpinner /></div>
              ) : usersByRoleData.length ? (
                <ResponsiveContainer width="100%" height={288}>
                  <PieChart>
                    <Pie data={usersByRoleData} dataKey="value" nameKey="name" outerRadius={104} label>
                      {usersByRoleData.map((entry, index) => (
                        <Cell key={entry.name} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
              {!loading && usersByRoleData.length > 0 && <Legend items={usersByRoleData} />}
            </Panel>
          </div>

          <div>
            <Panel title="Jobs by Type">
              {loading ? (
                <div className="flex h-72 items-center justify-center"><LoadingSpinner /></div>
              ) : jobsByTypeData.length ? (
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart data={jobsByTypeData}>
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {jobsByTypeData.map((entry, index) => (
                        <Cell key={entry.name} fill={palette[index % palette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
              {!loading && jobsByTypeData.length > 0 && <Legend items={jobsByTypeData} />}
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Panel title="Jobs by Status">
            {loading ? (
              <div className="flex h-56 items-center justify-center"><LoadingSpinner /></div>
            ) : jobsByStatusData.length ? (
              <div className="space-y-4">
                {jobsByStatusData.map((item, index) => {
                  const total = jobsByStatusData.reduce((sum, row) => sum + row.value, 0) || 1
                  const percent = Math.round((item.value / total) * 100)

                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: palette[index % palette.length] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyChart />
            )}
          </Panel>

          <Panel title="Recent Activity & Alerts">
            {logsLoading ? (
              <div className="flex h-56 items-center justify-center"><LoadingSpinner /></div>
            ) : recentLogs.length ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <button
                    key={log._id}
                    onClick={() => navigate('/logs')}
                    className="flex w-full gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-left transition hover:border-blue-500/60 hover:bg-slate-900"
                  >
                    <span className={`mt-0.5 rounded-full px-2 py-1 text-xs font-semibold capitalize ${severityTone[log.severity] || severityTone.info}`}>
                      {log.severity || 'info'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{log.message}</span>
                      <span className="mt-1 block truncate text-xs text-slate-400">{log.action} · {formatLogTime(log.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center text-slate-400">No activity logs yet.</div>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
