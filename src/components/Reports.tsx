import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Printer, Download, Users, DollarSign, Gift, AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { students, transactions, type AttendanceRecord, type RegistrationRecord } from '../data/sampleData';
import { useOfferings } from '../utils/offerings';
import { listAttendance } from '../utils/attendance';
import { listRegistrations } from '../utils/registrations';

type Section = 'overview' | 'revenue' | 'attendance' | 'donations' | 'balances';

export default function Reports() {
  const courses = useOfferings();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [regRecords, setRegRecords] = useState<RegistrationRecord[]>([]);
  const [section, setSection] = useState<Section>('overview');

  useEffect(() => {
    const reload = () => {
      setAttendance(listAttendance());
      setRegRecords(listRegistrations());
    };
    reload();
    window.addEventListener('schola:attendance-updated', reload);
    window.addEventListener('schola:registrations-updated', reload);
    return () => {
      window.removeEventListener('schola:attendance-updated', reload);
      window.removeEventListener('schola:registrations-updated', reload);
    };
  }, []);

  /* ---- Per-course rollups ---- */
  const perCourse = useMemo(() => {
    return courses.map(c => {
      const courseAtt = attendance.filter(a => a.courseId === c.id);
      const sessions     = courseAtt.length;
      const regPresent   = courseAtt.reduce((s, a) => s + a.registeredPresent, 0);
      const doorCount    = courseAtt.reduce((s, a) => s + a.doorCount, 0);
      const doorRevenue  = courseAtt.reduce((s, a) => s + a.doorRevenue, 0);
      const donationsAt  = courseAtt.reduce((s, a) => s + a.donations, 0);

      // Registration revenue from transaction log — matches course title in description.
      const titleTokens = c.title.split(/[—–-]/)[0].trim().toLowerCase();
      const registrationRevenue = transactions
        .filter(t => t.category === 'Course Fee' && t.description.toLowerCase().includes(titleTokens.split(' ')[0].toLowerCase()))
        .reduce((s, t) => s + t.amount, 0);

      // Add paper/online registration actual payments to this course
      const regPaidForCourse = regRecords
        .filter(r => r.courseIds.includes(c.id))
        .reduce((s, r) => {
          // Allocate amountEnclosed proportionally across registered courses
          if (!r.courseIds.length) return s;
          const perCourseShare = r.amountEnclosed / r.courseIds.length;
          return s + perCourseShare;
        }, 0);

      return {
        courseId: c.id,
        title: c.title,
        fee: c.fee,
        doorPrice: c.doorPrice,
        enrolled: c.enrolled,
        sessions,
        regPresent,
        doorCount,
        doorRevenue,
        donationsAt,
        registrationRevenue: registrationRevenue + regPaidForCourse,
      };
    });
  }, [courses, attendance, regRecords]);

  /* ---- Semester totals ---- */
  const totals = useMemo(() => {
    return perCourse.reduce(
      (acc, row) => ({
        sessions:             acc.sessions + row.sessions,
        regPresent:           acc.regPresent + row.regPresent,
        doorCount:            acc.doorCount + row.doorCount,
        doorRevenue:          acc.doorRevenue + row.doorRevenue,
        donationsAtSessions:  acc.donationsAtSessions + row.donationsAt,
        registrationRevenue:  acc.registrationRevenue + row.registrationRevenue,
      }),
      { sessions: 0, regPresent: 0, doorCount: 0, doorRevenue: 0, donationsAtSessions: 0, registrationRevenue: 0 },
    );
  }, [perCourse]);

  const donationsFromLedger = useMemo(
    () => transactions.filter(t => t.category === 'Donation').reduce((s, t) => s + t.amount, 0),
    [],
  );

  const donationsGrandTotal = donationsFromLedger + totals.donationsAtSessions;

  /* ---- Balances (expected vs paid) per student ---- */
  const balances = useMemo(() => {
    return students.map(s => {
      const expected = s.enrolledCourses.reduce(
        (sum, cid) => sum + (courses.find(c => c.id === cid)?.fee ?? 0),
        0,
      );
      const paidFromLedger = transactions
        .filter(t => t.studentName === s.name && (t.category === 'Course Fee' || t.category === 'Materials'))
        .reduce((sum, t) => sum + t.amount, 0);
      const paidFromRegRecords = regRecords
        .filter(r => r.studentName.toLowerCase() === s.name.toLowerCase())
        .reduce((sum, r) => sum + r.amountEnclosed, 0);
      const paid = paidFromLedger + paidFromRegRecords;
      const balance = expected - paid; // positive = owes; negative = overpaid
      return { ...s, expected, paid, balance };
    }).filter(r => r.expected > 0);
  }, [courses, regRecords]);

  const underpaymentsTotal = balances.filter(b => b.balance > 0).reduce((s, b) => s + b.balance, 0);
  const overpaymentsTotal  = balances.filter(b => b.balance < 0).reduce((s, b) => s + -b.balance, 0);

  /* ---- CSV export helper ---- */
  const exportCSV = (filename: string, rows: (string | number)[][]) => {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Revenue, attendance, donations, and balances for the current semester.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Nav tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
        <SectionTile icon={<BarChart3 className="w-5 h-5" />}     label="Overview"   active={section==='overview'}   onClick={() => setSection('overview')}   />
        <SectionTile icon={<DollarSign className="w-5 h-5" />}    label="Revenue"    active={section==='revenue'}    onClick={() => setSection('revenue')}    />
        <SectionTile icon={<Users className="w-5 h-5" />}         label="Attendance" active={section==='attendance'} onClick={() => setSection('attendance')} />
        <SectionTile icon={<Gift className="w-5 h-5" />}          label="Donations"  active={section==='donations'}  onClick={() => setSection('donations')}  />
        <SectionTile icon={<AlertTriangle className="w-5 h-5" />} label="Balances"   active={section==='balances'}   onClick={() => setSection('balances')}   />
      </div>

      {section === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Registered attendance"   value={totals.regPresent.toString()}           sub={`${totals.sessions} sessions recorded`} />
            <Stat label="Walk-in / door attendance" value={totals.doorCount.toString()}          sub={`$${totals.doorRevenue.toFixed(2)} at the door`} />
            <Stat label="Registration revenue"    value={`$${totals.registrationRevenue.toFixed(2)}`} sub="Ledger + paper entries" />
            <Stat label="Donations"               value={`$${donationsGrandTotal.toFixed(2)}`}  sub="Ledger + session drop-ins" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label="Outstanding balances" value={`$${underpaymentsTotal.toFixed(2)}`} sub="Students who owe" />
            <Stat label="Credits / overpays"   value={`$${overpaymentsTotal.toFixed(2)}`}  sub="Students with credit" />
            <Stat label="Total received"       value={`$${(totals.registrationRevenue + totals.doorRevenue + donationsGrandTotal).toFixed(2)}`} sub="All channels combined" />
          </div>
        </div>
      )}

      {section === 'revenue' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800">Revenue by offering</h2>
              <p className="text-sm text-gray-500 mt-0.5">Registration income and door income per class.</p>
            </div>
            <button
              onClick={() => exportCSV('revenue-by-offering.csv', [
                ['Offering', 'Fee', 'Door Price', 'Enrolled', 'Sessions', 'Reg Revenue', 'Door Count', 'Door Revenue', 'Session Donations', 'Total'],
                ...perCourse.map(r => [r.title, r.fee, r.doorPrice, r.enrolled, r.sessions, r.registrationRevenue.toFixed(2), r.doorCount, r.doorRevenue.toFixed(2), r.donationsAt.toFixed(2), (r.registrationRevenue + r.doorRevenue + r.donationsAt).toFixed(2)]),
              ])}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Offering</th>
                  <th className="table-header text-right">Fee</th>
                  <th className="table-header text-right">Enrolled</th>
                  <th className="table-header text-right">Registration $</th>
                  <th className="table-header text-right">Door #</th>
                  <th className="table-header text-right">Door $</th>
                  <th className="table-header text-right">Session Donations</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {perCourse.map(r => (
                  <tr key={r.courseId} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{r.title}</td>
                    <td className="table-cell text-right">${r.fee}</td>
                    <td className="table-cell text-right">{r.enrolled}</td>
                    <td className="table-cell text-right">${r.registrationRevenue.toFixed(2)}</td>
                    <td className="table-cell text-right">{r.doorCount}</td>
                    <td className="table-cell text-right">${r.doorRevenue.toFixed(2)}</td>
                    <td className="table-cell text-right">${r.donationsAt.toFixed(2)}</td>
                    <td className="table-cell text-right font-semibold">${(r.registrationRevenue + r.doorRevenue + r.donationsAt).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                  <td className="table-cell">Semester total</td>
                  <td className="table-cell" />
                  <td className="table-cell text-right">{perCourse.reduce((s,r)=>s+r.enrolled,0)}</td>
                  <td className="table-cell text-right">${totals.registrationRevenue.toFixed(2)}</td>
                  <td className="table-cell text-right">{totals.doorCount}</td>
                  <td className="table-cell text-right">${totals.doorRevenue.toFixed(2)}</td>
                  <td className="table-cell text-right">${totals.donationsAtSessions.toFixed(2)}</td>
                  <td className="table-cell text-right">${(totals.registrationRevenue + totals.doorRevenue + totals.donationsAtSessions).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {section === 'attendance' && (
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Attendance by offering</h2>
                <p className="text-sm text-gray-500 mt-0.5">Registered attendance vs. walk-ins for the semester.</p>
              </div>
              <button
                onClick={() => exportCSV('attendance-by-offering.csv', [
                  ['Offering', 'Sessions', 'Registered', 'Door', 'Total'],
                  ...perCourse.map(r => [r.title, r.sessions, r.regPresent, r.doorCount, r.regPresent + r.doorCount]),
                ])}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Offering</th>
                    <th className="table-header text-right">Sessions</th>
                    <th className="table-header text-right">Registered attendance</th>
                    <th className="table-header text-right">Door attendance</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {perCourse.map(r => (
                    <tr key={r.courseId} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{r.title}</td>
                      <td className="table-cell text-right">{r.sessions}</td>
                      <td className="table-cell text-right">{r.regPresent}</td>
                      <td className="table-cell text-right">{r.doorCount}</td>
                      <td className="table-cell text-right font-semibold">{r.regPresent + r.doorCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                    <td className="table-cell">Semester total</td>
                    <td className="table-cell text-right">{totals.sessions}</td>
                    <td className="table-cell text-right">{totals.regPresent}</td>
                    <td className="table-cell text-right">{totals.doorCount}</td>
                    <td className="table-cell text-right">{totals.regPresent + totals.doorCount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {totals.sessions === 0 && (
            <p className="text-sm text-gray-500">
              No sessions recorded yet. Go to <strong>Class Rosters</strong>, mark attendance, and save the session record.
            </p>
          )}
        </div>
      )}

      {section === 'donations' && (
        <DonationsSection ledgerTotal={donationsFromLedger} sessionTotal={totals.donationsAtSessions} />
      )}

      {section === 'balances' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800">Balances (underpayments &amp; overpayments)</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Compares what each student owes (fees × enrolled courses) to what's been received
                in the ledger and paper-registration records.
              </p>
            </div>
            <button
              onClick={() => exportCSV('balances.csv', [
                ['Student', 'Email', 'Expected', 'Paid', 'Balance'],
                ...balances.map(b => [b.name, b.email, b.expected.toFixed(2), b.paid.toFixed(2), b.balance.toFixed(2)]),
              ])}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <div className="px-6 py-3 flex flex-wrap gap-2">
            <span className="badge bg-red-100 text-red-700">Outstanding: ${underpaymentsTotal.toFixed(2)}</span>
            <span className="badge bg-emerald-100 text-emerald-700">Overpaid / credits: ${overpaymentsTotal.toFixed(2)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Student</th>
                  <th className="table-header">Email</th>
                  <th className="table-header text-right">Expected</th>
                  <th className="table-header text-right">Received</th>
                  <th className="table-header text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balances.sort((a, b) => b.balance - a.balance).map(b => (
                  <tr key={b.id} className={b.balance > 0 ? 'hover:bg-red-50' : b.balance < 0 ? 'hover:bg-emerald-50' : 'hover:bg-gray-50'}>
                    <td className="table-cell font-medium">{b.name}</td>
                    <td className="table-cell text-gray-600">{b.email}</td>
                    <td className="table-cell text-right">${b.expected.toFixed(2)}</td>
                    <td className="table-cell text-right">${b.paid.toFixed(2)}</td>
                    <td className={`table-cell text-right font-semibold ${b.balance > 0 ? 'text-red-700' : b.balance < 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {b.balance === 0 ? '—' : `${b.balance > 0 ? '' : '+'}$${Math.abs(b.balance).toFixed(2)}${b.balance > 0 ? ' owed' : ' credit'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print-only footer */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-6">
        Generated {new Date().toLocaleString()} · Schola Academy
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.5in; }
          .print\\:hidden { display: none !important; }
          .print-show-overview { display: block !important; }
          body { background: #fff !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

function SectionTile({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'card flex items-center justify-between text-left transition-all',
        active ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-100' : 'hover:border-gray-300',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <span className="font-semibold text-gray-900">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function DonationsSection({ ledgerTotal, sessionTotal }: { ledgerTotal: number; sessionTotal: number }) {
  const donationTxs = transactions.filter(t => t.category === 'Donation');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Ledger donations"  value={`$${ledgerTotal.toFixed(2)}`}  sub={`${donationTxs.length} transactions`} />
        <Stat label="Session drop-ins"  value={`$${sessionTotal.toFixed(2)}`} sub="From attendance records" />
        <Stat label="Total"              value={`$${(ledgerTotal + sessionTotal).toFixed(2)}`} sub="All donations" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-600" />
          <h2 className="font-semibold text-gray-800">Donation ledger</h2>
        </div>
        {donationTxs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No ledger donations yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">From</th>
                <th className="table-header">Method</th>
                <th className="table-header text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donationTxs.map((t, i) => (
                <tr key={i}>
                  <td className="table-cell text-gray-500 whitespace-nowrap">{t.date}</td>
                  <td className="table-cell font-medium">{t.studentName}</td>
                  <td className="table-cell text-gray-500">{t.paymentMethod}</td>
                  <td className="table-cell text-right font-semibold">${t.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
