import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCpu, FiPlus, FiSave, FiTrash2, FiUpload } from 'react-icons/fi'
import { AdminLayout } from '../../layouts/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { settingsService } from '../../services/adminApi'

const emptySettings = {
  general: {
    siteName: 'HireFlow',
    siteTitle: 'HireFlow - Job Portal',
    supportEmail: 'support@hireflow.com',
    supportPhone: '',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    allowCandidateRegistration: true,
    allowRecruiterRegistration: true,
  },
  branding: {
    logoUrl: '',
    bannerUrl: '',
    faviconUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    footerText: 'HireFlow connects candidates and recruiters.',
  },
  email: {
    provider: 'smtp',
    fromName: 'HireFlow',
    fromEmail: 'no-reply@hireflow.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    enableEmailVerification: true,
    enableJobAlerts: true,
    events: {
      registrationOtp: true,
      passwordResetOtp: true,
      applicationSubmitted: true,
      applicationReceived: true,
      applicationShortlisted: true,
      applicationRejected: true,
      supportReply: true,
    },
    templates: {
      registrationOtp: {
        subject: 'Verify your HireFlow account',
        body: 'Hello {{name}},\n\nYour HireFlow verification code is {{otp}}.\nThis code expires in {{minutes}} minutes.\n\n{{siteName}}',
      },
      passwordResetOtp: {
        subject: 'Your HireFlow password reset OTP',
        body: 'Hello {{name}},\n\nYour password reset OTP is {{otp}}.\nThis OTP expires in {{minutes}} minutes.\n\n{{siteName}}',
      },
      applicationSubmitted: {
        subject: 'Application submitted for {{jobTitle}}',
        body: 'Hello {{candidateName}},\n\nYour application for {{jobTitle}} at {{company}} has been submitted successfully.\n\n{{siteName}}',
      },
      applicationReceived: {
        subject: 'New application received for {{jobTitle}}',
        body: 'Hello {{recruiterName}},\n\n{{candidateName}} applied for {{jobTitle}}.\n\n{{siteName}}',
      },
      applicationShortlisted: {
        subject: 'You have been shortlisted for {{jobTitle}}',
        body: 'Hello {{candidateName}},\n\nGood news. Your application for {{jobTitle}} at {{company}} has been shortlisted.\n\nPlease keep an eye on your dashboard for the next update.\n\n{{siteName}}',
      },
      applicationRejected: {
        subject: 'Update on your application for {{jobTitle}}',
        body: 'Hello {{candidateName}},\n\nThank you for applying for {{jobTitle}} at {{company}}.\n\nAfter review, your application was not selected for this role. We encourage you to keep exploring new opportunities on {{siteName}}.\n\n{{siteName}}',
      },
      supportReply: {
        subject: 'Support ticket updated: {{subject}}',
        body: 'Hello {{name}},\n\nAdmin replied to your support ticket: {{subject}}.\n\n{{message}}\n\n{{siteName}}',
      },
    },
  },
  currency: {
    baseCurrency: 'INR',
    usdRate: 0.012,
  },
  ai: {
    resumeAnalyzerEnabled: false,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    manualOnly: true,
    maxAnalysesPerDay: 50,
  },
  payments: {
    enabled: false,
    provider: 'razorpay',
    requirePaymentForJobPost: true,
    allowFreePlan: true,
    mode: 'demo',
  },
}

const emptyPaymentPlan = {
  key: '',
  name: '',
  description: '',
  amount: 0,
  durationDays: 30,
  jobPostingLimit: 1,
  premiumJobCredits: 0,
  resumeUnlockCredits: 10,
  isActive: true,
  sortOrder: 1,
}

const normalizeAiModel = (model) => {
  const legacyModelMap = {
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-flash-8b': 'gemini-2.5-flash-lite',
  }

  return legacyModelMap[model] || model || emptySettings.ai.model
}

const normalizeAiSettings = (ai = {}) => ({
  ...emptySettings.ai,
  ...ai,
  model: normalizeAiModel(ai.model),
})

function TextInput({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  )
}

function TextAreaInput({ label, value, onChange, placeholder = '', rows = 5 }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-2">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleInput({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900/70 p-4">
      <span>
        <span className="block font-medium text-white">{label}</span>
        <span className="block text-sm text-slate-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-500 bg-slate-800 text-blue-600 focus:ring-blue-500"
      />
    </label>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState(emptySettings)
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState('')
  const [savingPaymentPlans, setSavingPaymentPlans] = useState(false)
  const [paymentPlans, setPaymentPlans] = useState([])
  const [uploadingAsset, setUploadingAsset] = useState('')
  const [usage, setUsage] = useState({ ai: { totalAnalyses: 0, logCount: 0 } })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [response, plansResponse] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getPaymentPlans(),
      ])
      const savedSettings = response.data.settings || {}
      setUsage(response.data.usage || { ai: { totalAnalyses: 0, logCount: 0 } })
      setPaymentPlans(plansResponse.data.plans || [])

      setSettings({
        general: { ...emptySettings.general, ...savedSettings.general },
        branding: { ...emptySettings.branding, ...savedSettings.branding },
        email: {
          ...emptySettings.email,
          ...savedSettings.email,
          events: { ...emptySettings.email.events, ...savedSettings.email?.events },
          templates: {
            registrationOtp: { ...emptySettings.email.templates.registrationOtp, ...savedSettings.email?.templates?.registrationOtp },
            passwordResetOtp: { ...emptySettings.email.templates.passwordResetOtp, ...savedSettings.email?.templates?.passwordResetOtp },
            applicationSubmitted: { ...emptySettings.email.templates.applicationSubmitted, ...savedSettings.email?.templates?.applicationSubmitted },
            applicationReceived: { ...emptySettings.email.templates.applicationReceived, ...savedSettings.email?.templates?.applicationReceived },
            applicationShortlisted: { ...emptySettings.email.templates.applicationShortlisted, ...savedSettings.email?.templates?.applicationShortlisted },
            applicationRejected: { ...emptySettings.email.templates.applicationRejected, ...savedSettings.email?.templates?.applicationRejected },
            supportReply: { ...emptySettings.email.templates.supportReply, ...savedSettings.email?.templates?.supportReply },
          },
        },
        currency: { ...emptySettings.currency, ...savedSettings.currency },
        ai: normalizeAiSettings(savedSettings.ai),
        payments: { ...emptySettings.payments, ...savedSettings.payments },
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSectionField = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  const updateEmailEvent = (eventKey, value) => {
    setSettings((current) => ({
      ...current,
      email: {
        ...current.email,
        events: {
          ...current.email.events,
          [eventKey]: value,
        },
      },
    }))
  }

  const updateEmailTemplate = (templateKey, field, value) => {
    setSettings((current) => ({
      ...current,
      email: {
        ...current.email,
        templates: {
          ...current.email.templates,
          [templateKey]: {
            ...current.email.templates[templateKey],
            [field]: value,
          },
        },
      },
    }))
  }

  const saveSection = async (section) => {
    try {
      setSavingSection(section)
      const response = await settingsService.updateSettings(section, settings[section])
      const savedSettings = response.data.settings || {}

      setSettings((current) => ({
        ...current,
        [section]: { ...current[section], ...savedSettings[section] },
      }))
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setSavingSection('')
    }
  }

  const updatePaymentPlan = (index, field, value) => {
    setPaymentPlans((current) => current.map((plan, planIndex) => (
      planIndex === index ? { ...plan, [field]: value } : plan
    )))
  }

  const addPaymentPlan = () => {
    setPaymentPlans((current) => [
      ...current,
      {
        ...emptyPaymentPlan,
        key: `plan-${current.length + 1}`,
        name: `Plan ${current.length + 1}`,
        sortOrder: current.length + 1,
      },
    ])
  }

  const removePaymentPlan = (index) => {
    setPaymentPlans((current) => current.filter((_, planIndex) => planIndex !== index))
  }

  const savePaymentPlans = async () => {
    try {
      setSavingPaymentPlans(true)
      const response = await settingsService.updatePaymentPlans(paymentPlans)
      setPaymentPlans(response.data.plans || [])
      toast.success('Payment plans saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save payment plans')
    } finally {
      setSavingPaymentPlans(false)
    }
  }

  const uploadAsset = async (field, file) => {
    if (!file) return

    try {
      setUploadingAsset(field)
      const response =
        field === 'logoUrl'
          ? await settingsService.uploadLogo(file)
          : await settingsService.uploadBanner(file)

      updateSectionField('branding', field, response.data.url)
      toast.success(field === 'logoUrl' ? 'Logo uploaded' : 'Banner uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingAsset('')
    }
  }

  const saveButton = (section) => (
    <Button
      onClick={() => saveSection(section)}
      disabled={savingSection === section || loading}
      className="w-full sm:w-auto"
    >
      <FiSave />
      {savingSection === section ? 'Saving...' : 'Save Changes'}
    </Button>
  )

  const generalTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TextInput label="Site Name" value={settings.general.siteName} onChange={(value) => updateSectionField('general', 'siteName', value)} required />
        <TextInput label="Website Title" value={settings.general.siteTitle} onChange={(value) => updateSectionField('general', 'siteTitle', value)} required />
        <TextInput label="Support Email" type="email" value={settings.general.supportEmail} onChange={(value) => updateSectionField('general', 'supportEmail', value)} />
        <TextInput label="Support Phone" value={settings.general.supportPhone} onChange={(value) => updateSectionField('general', 'supportPhone', value)} />
        <TextInput label="Default Currency" value="INR" onChange={() => {}} />
        <SelectInput
          label="Timezone"
          value={settings.general.timezone}
          onChange={(value) => updateSectionField('general', 'timezone', value)}
          options={[
            { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'America/New_York' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ToggleInput
          label="Maintenance Mode"
          description="Temporarily block public traffic during deployment."
          checked={settings.general.maintenanceMode}
          onChange={(value) => updateSectionField('general', 'maintenanceMode', value)}
        />
        <ToggleInput
          label="Candidate Signup"
          description="Allow new candidate accounts."
          checked={settings.general.allowCandidateRegistration}
          onChange={(value) => updateSectionField('general', 'allowCandidateRegistration', value)}
        />
        <ToggleInput
          label="Recruiter Signup"
          description="Allow new recruiter accounts."
          checked={settings.general.allowRecruiterRegistration}
          onChange={(value) => updateSectionField('general', 'allowRecruiterRegistration', value)}
        />
      </div>

      {saveButton('general')}
    </div>
  )

  const brandingTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TextInput label="Logo URL" value={settings.branding.logoUrl} onChange={(value) => updateSectionField('branding', 'logoUrl', value)} />
        <TextInput label="Banner URL" value={settings.branding.bannerUrl} onChange={(value) => updateSectionField('branding', 'bannerUrl', value)} />
        <TextInput label="Favicon URL" value={settings.branding.faviconUrl} onChange={(value) => updateSectionField('branding', 'faviconUrl', value)} />
        <TextInput label="Footer Text" value={settings.branding.footerText} onChange={(value) => updateSectionField('branding', 'footerText', value)} />
        <TextInput label="Primary Color" type="color" value={settings.branding.primaryColor} onChange={(value) => updateSectionField('branding', 'primaryColor', value)} />
        <TextInput label="Secondary Color" type="color" value={settings.branding.secondaryColor} onChange={(value) => updateSectionField('branding', 'secondaryColor', value)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <label className="block rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <span className="mb-3 block text-sm font-medium text-slate-300">Upload Logo</span>
          <input type="file" accept="image/*" onChange={(event) => uploadAsset('logoUrl', event.target.files?.[0])} className="w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700" />
          <span className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <FiUpload />
            {uploadingAsset === 'logoUrl' ? 'Uploading...' : 'PNG, JPG, or SVG up to 2 MB'}
          </span>
        </label>
        <label className="block rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <span className="mb-3 block text-sm font-medium text-slate-300">Upload Banner</span>
          <input type="file" accept="image/*" onChange={(event) => uploadAsset('bannerUrl', event.target.files?.[0])} className="w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700" />
          <span className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <FiUpload />
            {uploadingAsset === 'bannerUrl' ? 'Uploading...' : 'PNG, JPG, or SVG up to 2 MB'}
          </span>
        </label>
      </div>

      {saveButton('branding')}
    </div>
  )

  const emailTab = (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        Free Gmail SMTP setup: Host smtp.gmail.com, Port 465, Secure enabled. Use your Gmail address as SMTP User and a Gmail App Password as SMTP Password.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SelectInput
          label="Email Provider"
          value={settings.email.provider}
          onChange={(value) => updateSectionField('email', 'provider', value)}
          options={[
            { value: 'smtp', label: 'SMTP' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'mailgun', label: 'Mailgun' },
          ]}
        />
        <TextInput label="From Name" value={settings.email.fromName} onChange={(value) => updateSectionField('email', 'fromName', value)} />
        <TextInput label="From Email" type="email" value={settings.email.fromEmail} onChange={(value) => updateSectionField('email', 'fromEmail', value)} />
        <TextInput label="SMTP Host" value={settings.email.smtpHost} onChange={(value) => updateSectionField('email', 'smtpHost', value)} />
        <TextInput label="SMTP Port" type="number" value={settings.email.smtpPort} onChange={(value) => updateSectionField('email', 'smtpPort', Number(value))} />
        <TextInput label="SMTP User" value={settings.email.smtpUser} onChange={(value) => updateSectionField('email', 'smtpUser', value)} />
        <TextInput label="SMTP Password" type="password" value={settings.email.smtpPassword} onChange={(value) => updateSectionField('email', 'smtpPassword', value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleInput
          label="Secure SMTP"
          description="Use SSL/TLS. Keep enabled for Gmail port 465."
          checked={settings.email.smtpSecure}
          onChange={(value) => updateSectionField('email', 'smtpSecure', value)}
        />
        <ToggleInput
          label="Email Verification"
          description="Require users to verify email during signup."
          checked={settings.email.enableEmailVerification}
          onChange={(value) => updateSectionField('email', 'enableEmailVerification', value)}
        />
        <ToggleInput
          label="Job Alerts"
          description="Allow automatic job alert emails."
          checked={settings.email.enableJobAlerts}
          onChange={(value) => updateSectionField('email', 'enableJobAlerts', value)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Email Events</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ToggleInput
            label="Registration OTP"
            description="Send OTP email before creating a new account."
            checked={settings.email.events.registrationOtp}
            onChange={(value) => updateEmailEvent('registrationOtp', value)}
          />
          <ToggleInput
            label="Password Reset OTP"
            description="Send OTP email when user resets password."
            checked={settings.email.events.passwordResetOtp}
            onChange={(value) => updateEmailEvent('passwordResetOtp', value)}
          />
          <ToggleInput
            label="Application Submitted"
            description="Email candidate after applying to a job."
            checked={settings.email.events.applicationSubmitted}
            onChange={(value) => updateEmailEvent('applicationSubmitted', value)}
          />
          <ToggleInput
            label="Application Received"
            description="Email recruiter when a candidate applies."
            checked={settings.email.events.applicationReceived}
            onChange={(value) => updateEmailEvent('applicationReceived', value)}
          />
          <ToggleInput
            label="Application Shortlisted"
            description="Email candidate when recruiter shortlists an application."
            checked={settings.email.events.applicationShortlisted}
            onChange={(value) => updateEmailEvent('applicationShortlisted', value)}
          />
          <ToggleInput
            label="Application Rejected"
            description="Email candidate when recruiter rejects an application."
            checked={settings.email.events.applicationRejected}
            onChange={(value) => updateEmailEvent('applicationRejected', value)}
          />
          <ToggleInput
            label="Support Reply"
            description="Email user when admin replies to support ticket."
            checked={settings.email.events.supportReply}
            onChange={(value) => updateEmailEvent('supportReply', value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Email Templates</h2>
        <p className="text-sm text-slate-400">
          Variables: {'{{siteName}}'}, {'{{name}}'}, {'{{otp}}'}, {'{{minutes}}'}, {'{{jobTitle}}'}, {'{{company}}'}, {'{{candidateName}}'}, {'{{recruiterName}}'}, {'{{status}}'}, {'{{subject}}'}, {'{{message}}'}.
        </p>
        {[
          ['passwordResetOtp', 'Password Reset OTP'],
          ['registrationOtp', 'Registration OTP'],
          ['applicationSubmitted', 'Application Submitted'],
          ['applicationReceived', 'Application Received'],
          ['applicationShortlisted', 'Application Shortlisted'],
          ['applicationRejected', 'Application Rejected'],
          ['supportReply', 'Support Reply'],
        ].map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <h3 className="mb-4 font-semibold text-white">{label}</h3>
            <div className="grid gap-4">
              <TextInput
                label="Subject"
                value={settings.email.templates[key].subject}
                onChange={(value) => updateEmailTemplate(key, 'subject', value)}
              />
              <TextAreaInput
                label="Body"
                value={settings.email.templates[key].body}
                onChange={(value) => updateEmailTemplate(key, 'body', value)}
              />
            </div>
          </div>
        ))}
      </div>

      {saveButton('email')}
    </div>
  )

  const currencyTab = (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        All job salaries stay saved in INR. Users who select India see INR, and users who select any other country see USD using this admin-defined conversion rate.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TextInput label="Base Currency" value={settings.currency.baseCurrency} onChange={() => {}} />
        <TextInput
          label="USD Rate"
          type="number"
          value={settings.currency.usdRate}
          onChange={(value) => updateSectionField('currency', 'usdRate', Number(value))}
          placeholder="Example: 0.012"
          required
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
        Example: if INR salary is 600000 and USD rate is {settings.currency.usdRate || 0}, users outside India will see about ${(600000 * Number(settings.currency.usdRate || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}.
      </div>

      {saveButton('currency')}
    </div>
  )

  const aiTab = (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        Gemini API key stays in backend .env for security. Admin controls whether resume analysis is available, which model is used, and how many manual analyses should be allowed per day.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Total AI Analyses</p>
          <p className="mt-2 text-3xl font-bold text-white">{usage.ai?.totalAnalyses || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">AI Log Events</p>
          <p className="mt-2 text-3xl font-bold text-white">{usage.ai?.logCount || 0}</p>
        </article>
        <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Mode</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
            <FiCpu className="text-blue-400" />
            {settings.ai.resumeAnalyzerEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleInput
          label="AI Resume Analyzer"
          description="Allow candidates and recruiters to run resume analysis from application screens."
          checked={settings.ai.resumeAnalyzerEnabled}
          onChange={(value) => updateSectionField('ai', 'resumeAnalyzerEnabled', value)}
        />
        <ToggleInput
          label="Manual Only"
          description="Keep AI calls user-triggered. This avoids unnecessary API usage."
          checked={settings.ai.manualOnly}
          onChange={(value) => updateSectionField('ai', 'manualOnly', value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SelectInput
          label="AI Provider"
          value={settings.ai.provider}
          onChange={(value) => updateSectionField('ai', 'provider', value)}
          options={[{ value: 'gemini', label: 'Gemini' }]}
        />
        <SelectInput
          label="Gemini Model"
          value={settings.ai.model}
          onChange={(value) => updateSectionField('ai', 'model', value)}
          options={[
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
            { value: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
          ]}
        />
        <TextInput
          label="Max Analyses Per Day"
          type="number"
          value={settings.ai.maxAnalysesPerDay}
          onChange={(value) => updateSectionField('ai', 'maxAnalysesPerDay', Number(value))}
          required
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
        Required backend .env key: <span className="font-semibold text-white">GEMINI_API_KEY</span>. Without it, the admin toggle can be enabled but analysis will show a clear missing-key error.
      </div>

      {saveButton('ai')}
    </div>
  )

  const paymentsTab = (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        Razorpay keys stay in backend .env. Admin controls checkout mode, job posting enforcement, and recruiter plan price/limits from here.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleInput
          label="Enable Razorpay Checkout"
          description="Allow recruiters to buy plans from Plans & Billing."
          checked={settings.payments.enabled}
          onChange={(value) => updateSectionField('payments', 'enabled', value)}
        />
        <ToggleInput
          label="Require Payment for Job Posting"
          description="Enforce recruiter plan limits and featured job credits from the backend."
          checked={settings.payments.requirePaymentForJobPost}
          onChange={(value) => updateSectionField('payments', 'requirePaymentForJobPost', value)}
        />
        <ToggleInput
          label="Allow Free Plan"
          description="Keep the default free recruiter plan available for demo accounts."
          checked={settings.payments.allowFreePlan}
          onChange={(value) => updateSectionField('payments', 'allowFreePlan', value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SelectInput
          label="Payment Provider"
          value={settings.payments.provider}
          onChange={(value) => updateSectionField('payments', 'provider', value)}
          options={[{ value: 'razorpay', label: 'Razorpay' }]}
        />
        <SelectInput
          label="Mode"
          value={settings.payments.mode}
          onChange={(value) => updateSectionField('payments', 'mode', value)}
          options={[
            { value: 'demo', label: 'Demo Mode - no Razorpay keys needed' },
            { value: 'test', label: 'Test Mode' },
            { value: 'live', label: 'Live Mode' },
          ]}
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
        Required backend .env keys for test/live: <span className="font-semibold text-white">RAZORPAY_KEY_ID</span> and <span className="font-semibold text-white">RAZORPAY_KEY_SECRET</span>. Demo mode activates plans without contacting Razorpay, useful for interviews and local testing.
      </div>

      {saveButton('payments')}

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recruiter Payment Plans</h2>
            <p className="mt-1 text-sm text-slate-400">These plans appear on recruiter Plans & Billing and Post Job pricing.</p>
          </div>
          <Button type="button" variant="secondary" onClick={addPaymentPlan}>
            <FiPlus />
            Add Plan
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {paymentPlans.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              No payment plans found. Add one plan to start.
            </div>
          )}

          {paymentPlans.map((plan, index) => (
            <div key={plan._id || `${plan.key}-${index}`} className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{plan.name || 'New plan'}</p>
                  <p className="text-sm text-slate-400">INR {Number(plan.amount || 0).toLocaleString('en-IN')} / {plan.durationDays || 30} days</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(plan.isActive)}
                    onChange={(event) => updatePaymentPlan(index, 'isActive', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-blue-600"
                  />
                  Active
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TextInput label="Plan Key" value={plan.key} onChange={(value) => updatePaymentPlan(index, 'key', value)} />
                <TextInput label="Plan Name" value={plan.name} onChange={(value) => updatePaymentPlan(index, 'name', value)} />
                <TextInput label="Price (INR)" type="number" value={plan.amount} onChange={(value) => updatePaymentPlan(index, 'amount', Number(value))} />
                <TextInput label="Duration Days" type="number" value={plan.durationDays} onChange={(value) => updatePaymentPlan(index, 'durationDays', Number(value))} />
                <TextInput label="Active Job Limit" type="number" value={plan.jobPostingLimit} onChange={(value) => updatePaymentPlan(index, 'jobPostingLimit', Number(value))} />
                <TextInput label="Featured Job Credits" type="number" value={plan.premiumJobCredits} onChange={(value) => updatePaymentPlan(index, 'premiumJobCredits', Number(value))} />
                <TextInput label="Resume/Profile Credits" type="number" value={plan.resumeUnlockCredits} onChange={(value) => updatePaymentPlan(index, 'resumeUnlockCredits', Number(value))} />
                <TextInput label="Sort Order" type="number" value={plan.sortOrder} onChange={(value) => updatePaymentPlan(index, 'sortOrder', Number(value))} />
                <div className="flex items-end">
                  <Button type="button" variant="danger" className="w-full" onClick={() => removePaymentPlan(index)}>
                    <FiTrash2 />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <TextAreaInput
                  label="Description"
                  value={plan.description}
                  onChange={(value) => updatePaymentPlan(index, 'description', value)}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={savePaymentPlans}
          disabled={savingPaymentPlans || loading}
          className="mt-5 w-full sm:w-auto"
        >
          <FiSave />
          {savingPaymentPlans ? 'Saving Plans...' : 'Save Payment Plans'}
        </Button>
      </div>
    </div>
  )

  const tabs = [
    { label: 'General', content: generalTab },
    { label: 'Branding', content: brandingTab },
    { label: 'Email', content: emailTab },
    { label: 'Currency', content: currencyTab },
    { label: 'AI Resume Analyzer', content: aiTab },
    { label: 'Payments', content: paymentsTab },
  ]

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-slate-400">Manage platform, branding, email, currency, AI, and payment configuration.</p>
          </div>
          {loading && <span className="text-sm text-slate-400">Loading settings...</span>}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </AdminLayout>
  )
}

export default SettingsPage
