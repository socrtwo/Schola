import { useState, useMemo } from 'react';
import { Search, Download, TrendingUp } from 'lucide-react';
import { transactions } from '../data/sampleData';

const categoryColors: Record<string, string> = {
  'Course Fee': 'bg-blue-100 text-blue-700',
  'Membership': 'bg-violet-100 text-violet-700',
  'Materials': 'bg-amber-100 text-amber-700',
  'Donation': 'bg-emerald-100 text-emerald-700',
  'Fee': 'bg-red-100 text-red-700',
};

const methodColors: Record<string, string> = {
  'Credit Card': 'bg-blue-50 text-blue-600',
  'Cash': 'bg-green-50 text-green-600',
  'Check': 'bg-gray-100 text-gray-600',
};

export default function Transactions() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return transactions
      .filter(t => {
        const matchQ = !q || t.studentName.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
        const matchCat = categoryFilter === 'All' || t.category === categoryFilter;
        return matchQ && matchCat;
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [query, categoryFilter, sortDir]);

  const total = useMemo(() => filtered.reduce((sum, t) => sum + t.amount, 0), [filtered]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Student', 'Description', 'Category', 'Payment Method', 'Amount'],
      ...filtered.map(t => [t.date, t.studentName, t.description, t.category, t.paymentMethod, t.amount.toFixed(2)]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schola-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Jul – Aug 2025 · {transactions.length} records</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm w-fit">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${filtered.reduce((s, t) => s + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {byCategory.slice(0, 3).map(([cat, amt]) => (
          <div key={cat} className="card">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider truncate">{cat}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">${amt.toFixed(0)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student or description…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Date {sortDir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Student</th>
                <th className="table-header hidden md:table-cell">Description</th>
                <th className="table-header">Category</th>
                <th className="table-header hidden sm:table-cell">Method</th>
                <th className="table-header text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-gray-500 whitespace-nowrap">{t.date}</td>
                  <td className="table-cell font-medium">{t.studentName}</td>
                  <td className="table-cell hidden md:table-cell text-gray-500 max-w-[200px] truncate">{t.description}</td>
                  <td className="table-cell">
                    <span className={`badge ${categoryColors[t.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="table-cell hidden sm:table-cell">
                    <span className={`badge ${methodColors[t.paymentMethod] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="table-cell text-right font-semibold text-gray-800">
                    ${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={5} className="table-cell font-semibold text-gray-700">Total ({filtered.length} records)</td>
                <td className="table-cell text-right font-bold text-gray-900">${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No transactions match your search.</div>
        )}
      </div>
    </div>
  );
}
