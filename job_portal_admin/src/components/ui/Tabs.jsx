import { useState } from 'react'

export function Tabs({ tabs, defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div>
      <div className="flex border-b border-slate-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === index
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs[activeTab].content}
      </div>
    </div>
  )
}
