import { useState } from 'react';
import { Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { courses } from '../data/sampleData';

const categoryColors: Record<string, string> = {
  'Current Events': 'bg-blue-100 text-blue-700',
  'Writing': 'bg-violet-100 text-violet-700',
  'History': 'bg-amber-100 text-amber-700',
  'Arts': 'bg-pink-100 text-pink-700',
  'Music': 'bg-emerald-100 text-emerald-700',
  'Technology': 'bg-cyan-100 text-cyan-700',
  'Finance': 'bg-green-100 text-green-700',
  'Health': 'bg-red-100 text-red-700',
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function CourseSchedule() {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [filterDay, setFilterDay] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = Array.from(new Set(courses.map(c => c.category))).sort();

  const filtered = courses.filter(c => {
    const dayOk = filterDay === 'All' || c.day === filterDay;
    const catOk = filterCategory === 'All' || c.category === filterCategory;
    return dayOk && catOk;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Fall 2025 – {courses.length} courses offered</p>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Schedule view">
          <button
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterDay}
          onChange={e => setFilterDay(e.target.value)}
          aria-label="Filter by day"
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All days</option>
          {days.map(d => <option key={d}>{d}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          aria-label="Filter by category"
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {filtered.map(course => {
            const pct = Math.round((course.enrolled / course.capacity) * 100);
            return (
              <div key={course.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <span className={`badge ${categoryColors[course.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {course.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{course.instructor}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {course.day} · {course.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {course.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        ${course.fee}
                      </span>
                    </div>
                  </div>

                  <div className="sm:w-36 flex-shrink-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        {course.enrolled}/{course.capacity}
                      </span>
                      <span className={`text-xs font-medium ${pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly grid view */
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-5 min-w-[640px]">
            {days.map(day => (
              <div key={day} className="border-r border-gray-100 last:border-r-0">
                <div className="bg-gray-50 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  {day}
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {courses.filter(c => c.day === day && (filterCategory === 'All' || c.category === filterCategory)).map(c => (
                    <div key={c.id} className={`rounded-lg p-2 text-xs ${categoryColors[c.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      <div className="font-semibold leading-tight">{c.title}</div>
                      <div className="opacity-75 mt-1">{c.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card py-12 text-center text-gray-400 text-sm">
          No courses match your filters.
        </div>
      )}
    </div>
  );
}
