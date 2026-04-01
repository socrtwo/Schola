import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CreditCard,
  ClipboardList,
  X,
  GraduationCap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/schedule', icon: CalendarDays, label: 'Course Schedule' },
  { to: '/rosters', icon: ClipboardList, label: 'Class Rosters' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
];

export default function Navigation({ isOpen, onClose }: Props) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-schola-navy flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:flex
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ paddingTop: 'var(--sat)' }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">Schola</div>
              <div className="text-blue-300 text-xs mt-0.5">Sampleschool School</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 py-2 mt-2">
            Main Menu
          </div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-gray-500 text-xs">
            © 2026 Paul D Pruitt
          </p>
          <p className="text-gray-600 text-xs mt-0.5">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
