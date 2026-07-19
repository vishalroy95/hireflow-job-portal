import { FiAlertCircle, FiCheckCircle, FiCpu, FiTrendingUp } from 'react-icons/fi'

const scoreTone = (score = 0) => {
  if (score >= 80) return { label: 'Strong match', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' }
  if (score >= 60) return { label: 'Good match', bar: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' }
  if (score >= 40) return { label: 'Partial match', bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' }
  return { label: 'Needs improvement', bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' }
}

const SkillList = ({ emptyLabel, items = [], tone = 'blue' }) => {
  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const classes = tone === 'green'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-blue-50 text-primary'

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

const JobResumeMatchPanel = ({ analysis, error, loading, onAnalyze }) => {
  const score = analysis?.matchScore ?? 0
  const tone = scoreTone(score)

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-primary">
            <FiCpu className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-950">Resume Match</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Check how your resume and profile align with this role before applying.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiTrendingUp className="h-4 w-4" />
          {loading ? 'Checking...' : analysis ? 'Refresh Match' : 'Check Resume Match'}
        </button>
      </div>

      {error && (
        <div className="mt-5 flex gap-3 rounded-[6px] border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-5">
          <div className={`rounded-[6px] ${tone.bg} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold ${tone.text}`}>{tone.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{analysis.summary || 'Resume match analysis is ready.'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-3xl font-bold ${tone.text}`}>{score}%</p>
                <p className="text-xs font-semibold uppercase text-slate-500">Match</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full ${tone.bar}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                Matching Skills
              </div>
              <SkillList emptyLabel="No direct skill matches found yet." items={analysis.matchedSkills || []} tone="green" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Skills to Improve</p>
              <SkillList emptyLabel="No major missing skills found." items={analysis.missingSkills || []} />
            </div>
          </div>

          {!!analysis.suggestions?.length && (
            <div className="rounded-[6px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Suggestions</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                {analysis.suggestions.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default JobResumeMatchPanel
