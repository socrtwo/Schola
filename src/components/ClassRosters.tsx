import { useState } from 'react';
import { CheckSquare, Square, Download } from 'lucide-react';
import { courses, students } from '../data/sampleData';

export default function ClassRosters() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0].id);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const course = courses.find(c => c.id === selectedCourse)!;
  const enrolled = students.filter(s => s.enrolledCourses.includes(selectedCourse));

  const toggle = (name: string) =>
    setAttendance(prev => ({ ...prev, [name]: !prev[name] }));

  const presentCount = enrolled.filter(s => attendance[s.name]).length;

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Present'],
      ...enrolled.map(s => [s.name, s.email, s.phone, attendance[s.name] ? 'Yes' : 'No']),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.id}-roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Rosters</h1>
        <p className="text-gray-500 text-sm mt-1">Attendance tracking per course</p>
      </div>

      {/* Course selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={e => { setSelectedCourse(e.target.value); setAttendance({}); }}
          className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.day} · {c.time})</option>
          ))}
        </select>
      </div>

      {/* Roster */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">{course.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {enrolled.length} enrolled · {presentCount} present today
            </p>
          </div>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {enrolled.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No students enrolled in this course.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={enrolled.length > 0 && enrolled.every(s => attendance[s.name])}
                    onChange={e => {
                      const next: Record<string, boolean> = {};
                      enrolled.forEach(s => { next[s.name] = e.target.checked; });
                      setAttendance(next);
                    }}
                  />
                </th>
                <th className="table-header">Student</th>
                <th className="table-header hidden sm:table-cell">Phone</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrolled.map(s => {
                const present = !!attendance[s.name];
                return (
                  <tr
                    key={s.id}
                    onClick={() => toggle(s.name)}
                    className={`cursor-pointer transition-colors ${present ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="table-cell">
                      {present
                        ? <CheckSquare className="w-5 h-5 text-green-600" />
                        : <Square className="w-5 h-5 text-gray-300" />}
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{s.phone}</td>
                    <td className="table-cell">
                      <span className={`badge ${present ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Click a row to toggle attendance. Use Export to download a CSV.
        </div>
      </div>
    </div>
  );
}
