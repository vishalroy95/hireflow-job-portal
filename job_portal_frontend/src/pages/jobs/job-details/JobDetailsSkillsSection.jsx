import { FiCheckCircle } from 'react-icons/fi'

const JobDetailsSkillsSection = ({ skills = [] }) => {
  if (!skills.length) return null

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">Required Skills</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        {skills.map((skill, index) => (
          <div key={`${skill}-${index}`} className="flex items-center gap-2 rounded-[4px] bg-blue-50 px-3 py-2">
            <FiCheckCircle className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-semibold text-slate-800">{skill}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default JobDetailsSkillsSection
