import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StudentDirectory from './components/StudentDirectory';
import CourseSchedule from './components/CourseSchedule';
import Transactions from './components/Transactions';
import ClassRosters from './components/ClassRosters';
import Registration from './components/Registration';
import Posters from './components/Posters';
import OfferingsManager from './components/OfferingsManager';
import Reminders from './components/Reminders';

export default function App() {
  return (
    <Routes>
      {/* Public, senior-facing registration — no admin chrome */}
      <Route path="/register" element={<Registration />} />

      {/* Admin app */}
      <Route path="/*" element={<AdminLayout />} />
    </Routes>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full bg-gray-50">
      <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between bg-schola-navy px-4 py-3 pt-[calc(0.75rem+var(--sat))]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1 rounded-md hover:bg-white/10"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-lg">Schola</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentDirectory />} />
            <Route path="/schedule" element={<CourseSchedule />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/rosters" element={<ClassRosters />} />
            <Route path="/offerings" element={<OfferingsManager />} />
            <Route path="/posters" element={<Posters />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
