import { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare, Square, Download, Save, UserCheck, Users, DollarSign,
  Trash2, History, Printer,
} from 'lucide-react';
import { students, type AttendanceRecord } from '../data/sampleData';
import { useOfferings } from '../utils/offerings';
import { deleteAttendance, listAttendance, saveAttendance } from '../utils/attendance';

export default function ClassRosters() {
  const courses = useOfferings();
  const [selectedCourse, setSelectedCourse] = useState(courses[0].id);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doorCount, setDoorCount] = useState('0');
  const [doorRevenue, setDoorRevenue] = useState('0');
  const [donations, setDonations] = useState('0');
  const [notes, setNotes] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  const course = courses.find(c => c.id === selectedCourse)!;
  const enrolled = students.filter(s => s.enrolledCourses.includes(selectedCourse));
  const presentCount = enrolled.filter(s => attendance[s.name]).length;

  // Load history for current course, and refresh when attendance storage changes.
  useEffect(() => {
    const load = () => setHistory(listAttendance(selectedCourse).sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)));
    load();
    window.addEventListener('schola:attendance-updated', load);
    return () => window.removeEventListener('schola:attendance-updated', load);
  }, [selectedCourse]);

  // Reset board when course changes.
  useEffect(() => {
    setAttendance({});
    setDoorCount('0');
    setDoorRevenue('0');
    setDonations('0');
    setNotes('');
  }, [selectedCourse]);

  const toggle = (name: string) =>
    setAttendance(prev => ({ ...prev, [name]: !prev[name] }));

  const doorRevenueNum = Number(doorRevenue) || 0;
  const doorCountNum = Math.max(0, Math.floor(Number(doorCount) || 0));
  const donationsNum = Number(donations) || 0;

  const totalAttendance = presentCount + doorCountNum;
  const sessionRevenue = doorRevenueNum + donationsNum;

  const saveRecord = () => {
    saveAttendance({
      courseId: selectedCourse,
      sessionDate,
      registeredPresent: presentCount,
      registeredEnrolled: enrolled.length,
      doorCount: doorCountNum,
      doorRevenue: doorRevenueNum,
      donations: donationsNum,
      notes: notes.trim() || undefined,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const historyTotals = useMemo(() => {
    return history.reduce(
      (acc, r) => ({
        sessions: acc.sessions + 1,
        registered: acc.registered + r.registeredPresent,
        door: acc.door + r.doorCount,
        doorRevenue: acc.doorRevenue + r.doorRevenue,
        donations: acc.donations + r.donations,
      }),
      { sessions: 0, registered: 0, door: 0, doorRevenue: 0, donations: 0 },
    );
  }, [history]);

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Street', 'City', 'State', 'ZIP', 'Present'],
      ...enrolled.map(s => [
        s.name, s.email, s.phone,
        s.street ?? '', s.city, s.state, s.zip ?? '',
        attendance[s.name] ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.id}-roster-${sessionDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printRoster = () => window.print();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Rosters</h1>
        <p className="text-gray-500 text-sm mt-1">
          Take attendance for each session. Record registered attendees, walk-ins paying at the door, and any session donations.
        </p>
      </div>

      {/* Course + date */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.day} · {c.time})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Session date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={e => setSessionDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Registered roster */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">{course.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {enrolled.length} enrolled · {presentCount} registered present · {doorCountNum} at the door · {totalAttendance} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={printRoster} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" />
              Print roster
            </button>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {enrolled.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No registered students for this course.</div>
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
          Click a row to toggle attendance.
        </div>
      </div>

      {/* Walk-in / door section */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Walk-ins &amp; donations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Door attendees</label>
            <input
              type="number" min={0} inputMode="numeric" value={doorCount}
              onChange={e => setDoorCount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Door revenue ($)</label>
            <input
              type="number" min={0} step="0.01" inputMode="decimal" value={doorRevenue}
              onChange={e => setDoorRevenue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Suggested: {doorCountNum} × ${course.doorPrice} = ${(doorCountNum * course.doorPrice).toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Donations ($)</label>
            <input
              type="number" min={0} step="0.01" inputMode="decimal" value={donations}
              onChange={e => setDonations(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. guest speaker"
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Session total: <strong className="text-gray-900">{totalAttendance}</strong> attendees ·
            <strong className="text-gray-900"> ${sessionRevenue.toFixed(2)}</strong> collected
          </div>
          <button onClick={saveRecord} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            {savedFlash ? 'Saved' : 'Save session record'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-800">Session history — {course.title}</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header text-right">Registered</th>
                  <th className="table-header text-right">Door</th>
                  <th className="table-header text-right">Door $</th>
                  <th className="table-header text-right">Donations</th>
                  <th className="table-header">Notes</th>
                  <th className="table-header w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-600 whitespace-nowrap">{r.sessionDate}</td>
                    <td className="table-cell text-right"><UserCheck className="w-3.5 h-3.5 inline text-green-600 mr-1" />{r.registeredPresent}<span className="text-gray-400"> / {r.registeredEnrolled}</span></td>
                    <td className="table-cell text-right">{r.doorCount}</td>
                    <td className="table-cell text-right"><DollarSign className="w-3.5 h-3.5 inline text-gray-400" />{r.doorRevenue.toFixed(2)}</td>
                    <td className="table-cell text-right">${r.donations.toFixed(2)}</td>
                    <td className="table-cell text-gray-500 max-w-[240px] truncate">{r.notes ?? ''}</td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => { if (confirm(`Delete record for ${r.sessionDate}?`)) deleteAttendance(r.id); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                  <td className="table-cell">{historyTotals.sessions} sessions</td>
                  <td className="table-cell text-right">{historyTotals.registered}</td>
                  <td className="table-cell text-right">{historyTotals.door}</td>
                  <td className="table-cell text-right">${historyTotals.doorRevenue.toFixed(2)}</td>
                  <td className="table-cell text-right">${historyTotals.donations.toFixed(2)}</td>
                  <td className="table-cell" />
                  <td className="table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Printable roster — visible only on print (Letter landscape). */}
      <section className="roster-print hidden print:block">
        <header className="flex items-start justify-between border-b-2 border-black pb-2 mb-3">
          <div>
            <div className="text-xl font-extrabold tracking-tight">SCHOLA ACADEMY</div>
            <div className="text-[10pt] uppercase tracking-widest">Attendance roster</div>
          </div>
          <div className="text-right text-[10pt]">
            <div className="font-bold">{course.title}</div>
            <div>{course.day}s · {course.time}</div>
            <div>{course.location}</div>
            <div>Instructor: {course.instructor}</div>
            <div className="mt-1">Session date: <strong>{sessionDate}</strong></div>
            <div>Roster printed {new Date().toLocaleDateString()}</div>
          </div>
        </header>

        <table className="w-full border-collapse" style={{ fontSize: '10pt' }}>
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1 pr-2 w-[0.3in]">#</th>
              <th className="text-left py-1 pr-2 w-[0.4in]">Pres.</th>
              <th className="text-left py-1 pr-2">Registrant</th>
              <th className="text-left py-1 pr-2">Phone</th>
              <th className="text-left py-1 pr-2">Email</th>
              <th className="text-left py-1 pr-2">Street</th>
              <th className="text-left py-1 pr-2">City</th>
              <th className="text-left py-1 pr-2 w-[0.4in]">State</th>
              <th className="text-left py-1 pr-2 w-[0.55in]">ZIP</th>
            </tr>
          </thead>
          <tbody>
            {enrolled.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-400 align-top">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="py-1.5 pr-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-black align-middle" aria-hidden />
                </td>
                <td className="py-1.5 pr-2 font-semibold">{s.name}</td>
                <td className="py-1.5 pr-2 whitespace-nowrap">{s.phone}</td>
                <td className="py-1.5 pr-2">{s.email}</td>
                <td className="py-1.5 pr-2">{s.street ?? ''}</td>
                <td className="py-1.5 pr-2">{s.city}</td>
                <td className="py-1.5 pr-2">{s.state}</td>
                <td className="py-1.5 pr-2">{s.zip ?? ''}</td>
              </tr>
            ))}
            {enrolled.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-center">No registrants enrolled.</td></tr>
            )}
          </tbody>
        </table>

        <footer className="mt-4 flex items-start justify-between text-[9pt]">
          <div>
            <div>Total registered: <strong>{enrolled.length}</strong></div>
            <div>Use the checkboxes above to mark attendance, or record attendance digitally in the app.</div>
          </div>
          <div className="text-right">
            <div>Instructor signature ______________________________</div>
            <div className="mt-2">Date __________</div>
          </div>
        </footer>
      </section>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: letter landscape; margin: 0.4in; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .roster-print, .roster-print * { visibility: visible !important; }
          .roster-print { position: absolute; left: 0; top: 0; width: 100% !important; color: #000; }
          .roster-print tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
