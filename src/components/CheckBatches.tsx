import { useEffect, useMemo, useState } from 'react';
import {
  FilePlus2, Printer, Trash2, Layers, Download, Check, ChevronLeft,
  UserCheck, Info,
} from 'lucide-react';
import type { CheckBatch, RegistrationRecord } from '../data/sampleData';
import { useOfferings } from '../utils/offerings';
import { unbatchedPaperRegistrations } from '../utils/registrations';
import { createBatch, deleteBatch, listBatches, batchRegistrations } from '../utils/batches';
import { loadJSON, saveJSON } from '../utils/storage';

const PREPARER_KEY = 'schola:preparer-name';

export default function CheckBatches() {
  const [batches, setBatches] = useState<CheckBatch[]>(() => listBatches());
  const [regsVersion, setRegsVersion] = useState(0);
  const [viewing, setViewing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const refresh = () => { setBatches(listBatches()); setRegsVersion(v => v + 1); };
    window.addEventListener('schola:batches-updated', refresh);
    window.addEventListener('schola:registrations-updated', refresh);
    return () => {
      window.removeEventListener('schola:batches-updated', refresh);
      window.removeEventListener('schola:registrations-updated', refresh);
    };
  }, []);

  const unbatched = useMemo(() => unbatchedPaperRegistrations(), [regsVersion]);

  if (viewing) {
    return <BatchReport batchId={viewing} onBack={() => setViewing(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check batches</h1>
          <p className="text-gray-500 text-sm mt-1">
            Group paper registrations that came in together, produce a report to staple to the checks,
            and hand everything to the treasurer.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          disabled={unbatched.length === 0}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FilePlus2 className="w-4 h-4" />
          New batch ({unbatched.length} unbatched)
        </button>
      </div>

      {creating && (
        <BatchBuilder
          unbatched={unbatched}
          onCancel={() => setCreating(false)}
          onCreated={(b) => { setCreating(false); setViewing(b.id); }}
        />
      )}

      {batches.length === 0 && !creating ? (
        <div className="card text-center py-12 text-gray-500">
          <Layers className="w-8 h-8 mx-auto text-gray-300" />
          <p className="mt-3">No batches yet. Enter some paper registrations first, then create a batch here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map(b => <BatchCard key={b.id} batch={b} onView={() => setViewing(b.id)} />)}
        </div>
      )}
    </div>
  );
}

/* ---------------- Batch card (list tile) ---------------- */

function BatchCard({ batch, onView }: { batch: CheckBatch; onView: () => void }) {
  const regs = useMemo(() => batchRegistrations(batch.id), [batch.id]);
  const total = regs.reduce((s, r) => s + r.amountEnclosed, 0);
  const checkCount = regs.filter(r => r.paymentMethod === 'check').length;
  const cashCount  = regs.filter(r => r.paymentMethod === 'cash').length;

  return (
    <article className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{batch.label}</h3>
          <p className="text-xs text-gray-500">
            Prepared {new Date(batch.preparedAt).toLocaleDateString()}
            {batch.preparedBy && <> by <strong>{batch.preparedBy}</strong></>}
          </p>
        </div>
        <span className="badge bg-blue-50 text-blue-700">{regs.length} items</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <Tile label="Checks" value={checkCount.toString()} />
        <Tile label="Cash"   value={cashCount.toString()} />
        <Tile label="Total"  value={`$${total.toFixed(2)}`} />
      </dl>
      {batch.notes && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{batch.notes}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button onClick={onView} className="btn-secondary inline-flex items-center gap-2 text-sm">
          <Printer className="w-4 h-4" /> Open report
        </button>
        <button
          onClick={() => { if (confirm(`Delete "${batch.label}"? Its registrations will become unbatched.`)) deleteBatch(batch.id); }}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-600 hover:bg-red-50"
          aria-label="Delete batch"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/* ---------------- Batch builder ---------------- */

function BatchBuilder({
  unbatched, onCancel, onCreated,
}: {
  unbatched: RegistrationRecord[];
  onCancel: () => void;
  onCreated: (b: CheckBatch) => void;
}) {
  const offerings = useOfferings();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(unbatched.map(r => r.id)));
  const [label, setLabel]           = useState('');
  const [preparedBy, setPreparedBy] = useState(() => loadJSON<string>(PREPARER_KEY, ''));
  const [notes, setNotes]           = useState('');

  const chosen = unbatched.filter(r => selected.has(r.id));
  const total  = chosen.reduce((s, r) => s + r.amountEnclosed, 0);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const submit = () => {
    if (chosen.length === 0) return;
    const finalLabel = label.trim() || `Batch ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    saveJSON(PREPARER_KEY, preparedBy.trim());
    const b = createBatch({ label: finalLabel, preparedBy: preparedBy.trim(), notes, registrationIds: chosen.map(r => r.id) });
    onCreated(b);
  };

  const titleOf = (courseId: string) => offerings.find(c => c.id === courseId)?.title ?? courseId;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">New batch</h2>
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Label</label>
          <input
            type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Oct 14 deposit"
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prepared by</label>
          <input
            type="text" value={preparedBy} onChange={e => setPreparedBy(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
          <input
            type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="For the treasurer"
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {unbatched.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <Info className="w-4 h-4" /> No unbatched paper registrations to include.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === unbatched.length}
                    onChange={e => setSelected(e.target.checked ? new Set(unbatched.map(r => r.id)) : new Set())}
                  />
                </th>
                <th className="table-header">Received</th>
                <th className="table-header">Registrant</th>
                <th className="table-header">Offerings</th>
                <th className="table-header">Method</th>
                <th className="table-header">Check #</th>
                <th className="table-header text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {unbatched.map(r => {
                const isOn = selected.has(r.id);
                return (
                  <tr key={r.id} onClick={() => toggle(r.id)} className={`cursor-pointer ${isOn ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="table-cell">
                      <input type="checkbox" checked={isOn} readOnly />
                    </td>
                    <td className="table-cell text-gray-500 whitespace-nowrap">{new Date(r.recordedAt).toLocaleDateString()}</td>
                    <td className="table-cell font-medium">{r.studentName}</td>
                    <td className="table-cell text-gray-600 max-w-[280px]">
                      <div className="truncate">{r.courseIds.map(titleOf).join(', ')}</div>
                    </td>
                    <td className="table-cell capitalize">{r.paymentMethod ?? '—'}</td>
                    <td className="table-cell text-gray-600">{r.checkNumber ?? ''}</td>
                    <td className="table-cell text-right font-semibold">${r.amountEnclosed.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <td className="table-cell" />
                <td className="table-cell" colSpan={5}>{chosen.length} selected</td>
                <td className="table-cell text-right">${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button
          onClick={submit}
          disabled={chosen.length === 0}
          className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
          Create batch ({chosen.length} items · ${total.toFixed(2)})
        </button>
      </div>
    </div>
  );
}

/* ---------------- Printable treasurer report ---------------- */

function BatchReport({ batchId, onBack }: { batchId: string; onBack: () => void }) {
  const offerings = useOfferings();
  const batch = useMemo(() => listBatches().find(b => b.id === batchId), [batchId]);
  const regs = useMemo(() => batchRegistrations(batchId), [batchId]);

  if (!batch) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="btn-secondary inline-flex items-center gap-2 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="card text-gray-500">Batch not found.</div>
      </div>
    );
  }

  const total = regs.reduce((s, r) => s + r.amountEnclosed, 0);
  const expected = regs.reduce((s, r) => s + r.expectedAmount, 0);
  const checkTotal = regs.filter(r => r.paymentMethod === 'check').reduce((s, r) => s + r.amountEnclosed, 0);
  const cashTotal  = regs.filter(r => r.paymentMethod === 'cash').reduce((s, r) => s + r.amountEnclosed, 0);
  const otherTotal = total - checkTotal - cashTotal;

  const titleOf = (courseId: string) =>
    offerings.find(c => c.id === courseId)?.title ?? courseId;

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['Received', 'Registrant', 'Email', 'Phone', 'Method', 'Check #', 'Offerings', 'Expected', 'Enclosed', 'Variance'],
      ...regs.map(r => [
        new Date(r.recordedAt).toLocaleDateString(),
        r.studentName, r.email, r.phone,
        r.paymentMethod ?? '',
        r.checkNumber ?? '',
        r.courseIds.map(titleOf).join(' | '),
        r.expectedAmount.toFixed(2),
        r.amountEnclosed.toFixed(2),
        (r.amountEnclosed - r.expectedAmount).toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${batch.label.replace(/\s+/g, '-')}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Controls (not printed) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <button onClick={onBack} className="btn-secondary inline-flex items-center gap-2 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to batches
        </button>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" /> Print report
          </button>
        </div>
      </div>

      {/* Printable sheet, sized to Letter */}
      <article
        className="batch-sheet mx-auto bg-white text-black shadow-xl print:shadow-none"
        style={{ width: '8.5in', minHeight: '11in' }}
      >
        <div className="px-[0.6in] py-[0.55in] space-y-5" style={{ fontSize: '11pt' }}>
          <header className="flex items-start justify-between border-b-2 border-black pb-3">
            <div>
              <div className="text-xl font-extrabold tracking-tight leading-tight">SCHOLA ACADEMY</div>
              <div className="text-xs uppercase tracking-widest">Continuing Education</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-widest">Check batch report</div>
              <div className="text-xs">For the treasurer</div>
            </div>
          </header>

          {/* Batch meta */}
          <section className="grid grid-cols-2 gap-4 text-[10.5pt]">
            <div>
              <MetaRow label="Batch" value={batch.label} />
              <MetaRow label="Batch ID" mono value={batch.id} />
              <MetaRow label="Prepared by" value={batch.preparedBy || '—'} />
              <MetaRow label="Date prepared" value={new Date(batch.preparedAt).toLocaleString()} />
            </div>
            <div>
              <MetaRow label="# items"      value={regs.length.toString()} />
              <MetaRow label="Check total"  value={`$${checkTotal.toFixed(2)}`} />
              <MetaRow label="Cash total"   value={`$${cashTotal.toFixed(2)}`} />
              <MetaRow label="Other"        value={`$${otherTotal.toFixed(2)}`} />
              <MetaRow label="GRAND TOTAL"  value={`$${total.toFixed(2)}`} strong />
            </div>
          </section>

          {batch.notes && (
            <section className="border border-gray-400 rounded p-2 text-[10.5pt]">
              <div className="text-[9pt] uppercase tracking-widest text-gray-700 mb-1">Notes</div>
              {batch.notes}
            </section>
          )}

          {/* Items table */}
          <section>
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-1 pr-2">#</th>
                  <th className="text-left py-1 pr-2">Received</th>
                  <th className="text-left py-1 pr-2">Registrant</th>
                  <th className="text-left py-1 pr-2">Offerings</th>
                  <th className="text-left py-1 pr-2">Method</th>
                  <th className="text-left py-1 pr-2">Check&nbsp;#</th>
                  <th className="text-right py-1 pl-2">Expected</th>
                  <th className="text-right py-1 pl-2">Enclosed</th>
                  <th className="text-right py-1 pl-2">Variance</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r, i) => {
                  const variance = r.amountEnclosed - r.expectedAmount;
                  return (
                    <tr key={r.id} className="border-b border-gray-400 align-top">
                      <td className="py-1 pr-2">{i + 1}</td>
                      <td className="py-1 pr-2 whitespace-nowrap">{new Date(r.recordedAt).toLocaleDateString()}</td>
                      <td className="py-1 pr-2">
                        <div className="font-semibold">{r.studentName}</div>
                        {(r.email || r.phone) && <div className="text-[9pt] text-gray-700">{[r.email, r.phone].filter(Boolean).join(' · ')}</div>}
                      </td>
                      <td className="py-1 pr-2">
                        <div>{r.courseIds.map(titleOf).join(', ')}</div>
                      </td>
                      <td className="py-1 pr-2 capitalize">{r.paymentMethod ?? ''}</td>
                      <td className="py-1 pr-2">{r.checkNumber ?? ''}</td>
                      <td className="py-1 pl-2 text-right">${r.expectedAmount.toFixed(2)}</td>
                      <td className="py-1 pl-2 text-right font-semibold">${r.amountEnclosed.toFixed(2)}</td>
                      <td className={`py-1 pl-2 text-right font-semibold ${variance < 0 ? 'text-red-700' : variance > 0 ? 'text-blue-700' : ''}`}>
                        {variance === 0 ? '—' : `${variance > 0 ? '+' : ''}$${variance.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={6} className="py-1.5 pr-2">Totals</td>
                  <td className="py-1.5 pl-2 text-right">${expected.toFixed(2)}</td>
                  <td className="py-1.5 pl-2 text-right">${total.toFixed(2)}</td>
                  <td className="py-1.5 pl-2 text-right">
                    {total - expected === 0 ? '—' : `${total - expected > 0 ? '+' : ''}$${(total - expected).toFixed(2)}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Hand-off block */}
          <section className="grid grid-cols-2 gap-6 pt-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Prepared by (registrar)</h3>
              <div className="h-10 border-b border-black" />
              <div className="text-[9pt] mt-1 text-gray-700">Signature &amp; date</div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Received by (treasurer)</h3>
              <div className="h-10 border-b border-black" />
              <div className="text-[9pt] mt-1 text-gray-700">Signature &amp; date</div>
            </div>
          </section>

          <footer className="pt-3 border-t border-black text-[9pt] text-gray-700 text-center flex items-center justify-center gap-2">
            <UserCheck className="w-3.5 h-3.5" />
            Please verify item count and totals before depositing. Keep this page with the deposit receipt.
          </footer>
        </div>
      </article>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .batch-sheet, .batch-sheet * { visibility: visible !important; }
          .batch-sheet { position: absolute; left: 0; top: 0; width: 100% !important; box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function MetaRow({ label, value, mono, strong }: {
  label: string; value: string; mono?: boolean; strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 py-0.5 ${strong ? 'font-bold text-[12pt] border-t border-gray-400 mt-1 pt-1' : ''}`}>
      <span className="text-gray-700 uppercase tracking-wider text-[9pt]">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}
