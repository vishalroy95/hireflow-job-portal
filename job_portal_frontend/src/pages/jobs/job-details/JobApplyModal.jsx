import { FiAlignLeft, FiBold, FiFileText, FiItalic, FiLink, FiList, FiSend, FiUploadCloud, FiX } from 'react-icons/fi'

const toolbarItems = [
  { label: 'Bold', icon: FiBold },
  { label: 'Italic', icon: FiItalic },
  { label: 'Link', icon: FiLink },
  { label: 'Bulleted list', icon: FiList },
  { label: 'Align left', icon: FiAlignLeft },
]

const JobApplyModal = ({
  applicationData,
  candidateProfile,
  job,
  onCancel,
  onChange,
  onResumeUpload,
  onSubmit,
  resumeUploading,
  submitting,
}) => {
  const profileResume = candidateProfile?.user?.resume || candidateProfile?.profile?.resume || ''
  const profileResumeFile = candidateProfile?.profile?.resumeFile

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-8">
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-xl rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-primary shadow-lg transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          aria-label="Close application form"
        >
          <FiX className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-950">Apply Job: {job.title}</h2>
        </div>

        <div className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Choose Resume</span>
            <select
              value={applicationData.resume}
              onChange={(event) => onChange('resume', event.target.value)}
              className="h-12 w-full rounded-[4px] border border-slate-200 bg-white px-4 text-sm text-slate-500 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select...</option>
              {profileResume && <option value="__profile__">Use resume from my profile</option>}
              {applicationData.resume && applicationData.resume !== '__profile__' && (
                <option value={applicationData.resume}>Use uploaded resume</option>
              )}
            </select>
          </label>

          <label className="block rounded-[6px] border border-dashed border-blue-200 bg-blue-50/60 px-4 py-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FiUploadCloud className="h-5 w-5 text-primary" />
              Upload resume from device
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              PDF, DOC, or DOCX up to 5 MB. Uploading here also saves it to your profile.
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={resumeUploading || submitting}
              onChange={(event) => {
                onResumeUpload(event.target.files?.[0])
                event.target.value = ''
              }}
              className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-[4px] file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-60"
            />
            {(profileResumeFile?.originalName || profileResume || applicationData.resume) && (
              <span className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <FiFileText className="h-4 w-4 text-primary" />
                {applicationData.resume && applicationData.resume !== '__profile__'
                  ? 'Uploaded resume selected'
                  : profileResumeFile?.originalName || 'Profile resume available'}
              </span>
            )}
            {resumeUploading && <span className="mt-2 block text-xs font-semibold text-primary">Uploading resume...</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cover Letter</span>
            <textarea
              placeholder="Write down your biography here. Let the employers know who you are..."
              value={applicationData.coverLetter}
              onChange={(event) => onChange('coverLetter', event.target.value)}
              className="min-h-[150px] w-full resize-y rounded-t-[4px] border border-b-0 border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
            />
            <div className="flex items-center gap-1 rounded-b-[4px] border border-slate-200 bg-white px-3 py-2">
              {toolbarItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-400 transition hover:bg-blue-50 hover:text-primary"
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-[4px] bg-blue-50 px-5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || resumeUploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resumeUploading ? 'Uploading...' : submitting ? 'Applying...' : 'Apply Now'}
            {!submitting && !resumeUploading && <FiSend className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}

export default JobApplyModal
