import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { students, courses } from '../data/sampleData';

export default function StudentDirectory() {
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter(s => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);
      const matchesGender = genderFilter === 'All' || s.gender === genderFilter;
      return matchesQuery && matchesGender;
    });
  }, [query, genderFilter]);

  const student = selectedStudent !== null
    ? students.find(s => s.id === selectedStudent)
    : null;

  const getCourseTitle = (id: string) =>
    courses.find(c => c.id === id)?.title ?? id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
        <p className="text-gray-500 text-sm mt-1">{students.length} registered students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, or city…"
            aria-label="Search students"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            aria-label="Filter by gender"
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All genders</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table */}
        <div className="card flex-1 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header hidden md:table-cell">City</th>
                  <th className="table-header hidden lg:table-cell">Education</th>
                  <th className="table-header">Courses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id === selectedStudent ? null : s.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedStudent(s.id === selectedStudent ? null : s.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={s.id === selectedStudent}
                    aria-label={`View details for ${s.name}`}
                    className={`cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${s.id === selectedStudent ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{s.city}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-500">{s.education}</td>
                    <td className="table-cell">
                      <span className="badge bg-blue-50 text-blue-700">{s.enrolledCourses.length}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No students match your search.</div>
          )}
        </div>

        {/* Detail panel */}
        {student && (
          <div className="card lg:w-72 xl:w-80 space-y-4 h-fit">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-500">{student.gender === 'F' ? 'Female' : 'Male'}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <Detail label="Email" value={student.email} />
              <Detail label="Phone" value={student.phone} />
              <Detail label="City" value={`${student.city}, ${student.state}`} />
              <Detail label="Date of Birth" value={student.dob} />
              <Detail label="Education" value={student.education} />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Enrolled Courses ({student.enrolledCourses.length})
              </p>
              <ul className="space-y-1">
                {student.enrolledCourses.map(id => (
                  <li key={id} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {getCourseTitle(id)}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="btn-secondary w-full text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Showing {filtered.length} of {students.length} students
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
