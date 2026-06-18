const TextBlock = ({ title, children }) => {
  if (!children) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{children}</p>
    </div>
  )
}

const JobDetailsDescriptionSection = ({ job }) => {
  return (
    <section>
      <div className="space-y-9">
        <TextBlock title="Job Description">{job.description}</TextBlock>
        <TextBlock title="Responsibilities">{job.responsibilities}</TextBlock>
        <TextBlock title="Requirements">{job.requirements}</TextBlock>
      </div>
    </section>
  )
}

export default JobDetailsDescriptionSection
