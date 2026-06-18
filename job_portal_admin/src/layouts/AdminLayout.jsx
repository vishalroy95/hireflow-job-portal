import { useState } from 'react'
import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'


export function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto bg-slate-900">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
