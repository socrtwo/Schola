import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, BookOpen, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { students, courses, transactions } from '../data/sampleData';

const COLORS = ['#2563eb', '#d97706', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export default function Dashboard() {
  const totalRevenue = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [],
  );

  const enrollmentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    courses.forEach(c => { map[c.category] = (map[c.category] ?? 0) + c.enrolled; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  const revenueByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, []);

  const totalEnrolled = useMemo(
    () => courses.reduce((sum, c) => sum + c.enrolled, 0),
    [],
  );

  const totalCapacity = useMemo(
    () => courses.reduce((sum, c) => sum + c.capacity, 0),
    [],
  );

  const fillRate = Math.round((totalEnrolled / totalCapacity) * 100);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Sampleschool School – Fall 2025 Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Students"
          value={students.length.toString()}
          sub="enrolled this semester"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          label="Courses"
          value={courses.length.toString()}
          sub={`${fillRate}% fill rate`}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Revenue"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          sub="Jul – Aug 2025"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Transactions"
          value={transactions.length.toString()}
          sub="this period"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by category bar chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByCategory} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollment by category pie chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Enrollment by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={enrollmentByCategory}
                cx="50%"
                cy="45%"
                outerRadius={75}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {enrollmentByCategory.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course fill rates */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Course Enrollment</h2>
          <Link to="/schedule" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {courses.slice(0, 5).map(c => {
            const pct = Math.round((c.enrolled / c.capacity) * 100);
            return (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 truncate pr-4">{c.title}</span>
                  <span className="text-gray-500 whitespace-nowrap">{c.enrolled}/{c.capacity}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header pl-0">Date</th>
                <th className="table-header">Student</th>
                <th className="table-header hidden sm:table-cell">Category</th>
                <th className="table-header text-right pr-0">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.slice(0, 6).map((t, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell pl-0 text-gray-500">{t.date}</td>
                  <td className="table-cell font-medium">{t.studentName}</td>
                  <td className="table-cell hidden sm:table-cell">
                    <span className="badge bg-blue-50 text-blue-700">{t.category}</span>
                  </td>
                  <td className="table-cell text-right pr-0 font-semibold text-gray-800">
                    ${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, sub }: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
