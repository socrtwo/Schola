import Papa from 'papaparse';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mail, MessageSquare, Send, Copy, CheckCircle2, Upload, Download,
  Trash2, Users, AlertTriangle, Paperclip, ClipboardList, Info,
} from 'lucide-react';
import { students, type Contact, type ReminderLog } from '../data/sampleData';
import { useOfferings } from '../utils/offerings';
import { listAttachments } from '../utils/attachments';
import { genId, loadJSON, saveJSON } from '../utils/storage';

const CONTACTS_KEY  = 'schola:contacts';
const LOG_KEY       = 'schola:reminder-log';

type Tab = 'compose' | 'contacts' | 'log';

/* ---------------- Page ---------------- */

export default function Reminders() {
  const [tab, setTab] = useState<Tab>('compose');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 text-sm mt-1">
          Send weekly emails and text messages to registered students
          and to your imported "walk-in / pay-at-the-door" contacts.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1" aria-label="Reminders tabs">
          <TabButton active={tab === 'compose'}  onClick={() => setTab('compose')}  icon={<Mail className="w-4 h-4" />}            label="Compose" />
          <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')} icon={<Users className="w-4 h-4" />}           label="Contact List" />
          <TabButton active={tab === 'log'}      onClick={() => setTab('log')}      icon={<ClipboardList className="w-4 h-4" />}   label="Sent Log" />
        </nav>
      </div>

      {tab === 'compose'  && <Compose />}
      {tab === 'contacts' && <Contacts />}
      {tab === 'log'      && <SentLog />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        '-mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- Compose ---------------- */

type Channel = 'email' | 'sms' | 'both';

interface OfferingRollup {
  courseId: string;
  title: string;
  instructor: string;
  day: string;
  time: string;
  location: string;
  doorPrice: number;
  fee: number;
  description: string;
  imageUrl?: string;
  attachmentCount: number;
  attachmentNames: string[];
}

function Compose() {
  const offerings = useOfferings();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()).toISOString().slice(0, 10));
  const [channel, setChannel]       = useState<Channel>('email');
  const [includeRegistered, setIncludeRegistered] = useState(true);
  const [includeContacts, setIncludeContacts]     = useState(true);
  const [attachmentCounts, setAttachmentCounts]   = useState<Record<string, { count: number; names: string[] }>>({});
  const [sentFlash, setSentFlash] = useState(false);
  const [copied, setCopied]       = useState(false);

  const contacts = loadJSON<Contact[]>(CONTACTS_KEY, []);

  /* This week's offerings. Each course recurs weekly, so for every Monday anchor
     we show everything that meets in that 7-day span. */
  const weeklyOfferings = useMemo<OfferingRollup[]>(() => {
    return offerings.map(c => ({
      courseId: c.id,
      title: c.title,
      instructor: c.instructor,
      day: c.day,
      time: c.time,
      location: c.location,
      doorPrice: c.doorPrice,
      fee: c.fee,
      description: c.description,
      imageUrl: c.imageUrl,
      attachmentCount: attachmentCounts[c.id]?.count ?? 0,
      attachmentNames: attachmentCounts[c.id]?.names ?? [],
    }));
  }, [offerings, attachmentCounts]);

  // Load attachment counts per course.
  useEffect(() => {
    (async () => {
      const map: Record<string, { count: number; names: string[] }> = {};
      for (const c of offerings) {
        const atts = await listAttachments(c.id);
        map[c.id] = { count: atts.length, names: atts.map(a => a.name) };
      }
      setAttachmentCounts(map);
    })();
  }, [offerings]);

  // Recipients from registered students (email + phone) per offering.
  const registeredRecipients = useMemo(() => {
    const bag = new Map<string, { name: string; email: string; phone: string; courses: string[] }>();
    for (const s of students) {
      if (!s.enrolledCourses.length) continue;
      bag.set(s.email.toLowerCase(), {
        name: s.name, email: s.email, phone: s.phone,
        courses: s.enrolledCourses,
      });
    }
    return Array.from(bag.values());
  }, []);

  const doorRecipients = useMemo(() => contacts, [contacts]);

  const totalRecipients =
    (includeRegistered ? registeredRecipients.length : 0) +
    (includeContacts   ? doorRecipients.length : 0);

  const weekLabel = formatWeekLabel(weekStart);

  const subject = `${weekLabel} at Schola Academy — This week's classes & events`;
  const body = buildEmailBody({ weekLabel, offerings: weeklyOfferings });
  const sms  = buildSmsBody({ weekLabel, offerings: weeklyOfferings });

  const emailList = useMemo(() => {
    const set = new Set<string>();
    if (includeRegistered) registeredRecipients.forEach(r => r.email && set.add(r.email));
    if (includeContacts)   doorRecipients.forEach(r => r.email && set.add(r.email));
    return Array.from(set);
  }, [includeRegistered, includeContacts, registeredRecipients, doorRecipients]);

  const phoneList = useMemo(() => {
    const set = new Set<string>();
    if (includeRegistered) registeredRecipients.forEach(r => r.phone && set.add(r.phone));
    if (includeContacts)   doorRecipients.forEach(r => r.phone && set.add(r.phone));
    return Array.from(set);
  }, [includeRegistered, includeContacts, registeredRecipients, doorRecipients]);

  const sendNow = () => {
    const log = loadJSON<ReminderLog[]>(LOG_KEY, []);
    log.unshift({
      id: genId('rem-'),
      weekStart,
      courseIds: weeklyOfferings.map(o => o.courseId),
      recipientCount: totalRecipients,
      sentAt: Date.now(),
      channel,
    });
    saveJSON(LOG_KEY, log.slice(0, 50));

    // Launch the user's mail client with BCC and attached body.
    if (channel === 'email' || channel === 'both') {
      const href = `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(href, '_blank');
    }
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 2500);
  };

  const copyRecipients = async (kind: 'email' | 'sms') => {
    const text = kind === 'email' ? emailList.join(', ') : phoneList.join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="wk" className="block text-sm font-semibold text-gray-700 mb-1">
              Week of (Monday)
            </label>
            <input
              id="wk" type="date" value={weekStart}
              onChange={e => setWeekStart(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Channel</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(['email', 'sms', 'both'] as Channel[]).map(c => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={[
                    'flex-1 px-3 py-2 text-sm font-medium transition-colors',
                    channel === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {c === 'email' ? 'Email' : c === 'sms' ? 'Text' : 'Both'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Include</label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeRegistered}
                       onChange={e => setIncludeRegistered(e.target.checked)} />
                Registered students ({registeredRecipients.length})
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeContacts}
                       onChange={e => setIncludeContacts(e.target.checked)} />
                Door-price contacts ({doorRecipients.length})
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <strong className="text-gray-900">{totalRecipients}</strong> recipients ·
            <strong className="text-gray-900">{emailList.length}</strong> emails ·
            <strong className="text-gray-900">{phoneList.length}</strong> phones
          </div>
          <div className="flex-1" />
          <button onClick={() => copyRecipients('email')} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Copy className="w-4 h-4" /> Copy emails
          </button>
          <button onClick={() => copyRecipients('sms')} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Copy className="w-4 h-4" /> Copy phones
          </button>
          <button onClick={sendNow} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Send className="w-4 h-4" /> Send reminder
          </button>
        </div>

        {(sentFlash || copied) && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            {sentFlash && 'Reminder queued — your email client should open with the message.'}
            {copied && !sentFlash && 'Copied to clipboard.'}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Email preview</h2>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">Subject</div>
            <div className="font-semibold text-gray-900">{subject}</div>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed text-gray-700 font-sans">{body}</div>
        </div>

        {/* Offering cards within the preview (what recipients "see") */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weeklyOfferings.map(o => (
            <OfferingPreviewCard key={o.courseId} o={o} />
          ))}
        </div>
      </div>

      {(channel === 'sms' || channel === 'both') && (
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Text-message preview</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            SMS is kept under 320 characters. A sending integration would deliver this via your provider.
          </p>
          <pre className="whitespace-pre-wrap text-sm bg-gray-900 text-gray-100 rounded-lg p-4">{sms}</pre>
        </div>
      )}

      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Delivery:</strong> this build composes the message and opens your
            mail client with every recipient BCC'd. To send automatically at scale,
            connect a transactional email / SMS provider in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}

function OfferingPreviewCard({ o }: { o: OfferingRollup }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {o.imageUrl && (
        <img src={o.imageUrl} alt="" className="w-full h-32 object-cover"
             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      )}
      <div className="p-4">
        <div className="font-semibold text-gray-900">{o.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {o.day}s · {o.time} · {o.location}
        </div>
        <p className="text-sm text-gray-700 mt-2 line-clamp-3">{o.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-500">Door price <strong className="text-gray-900">${o.doorPrice}</strong></span>
          {o.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-500" title={o.attachmentNames.join('\n')}>
              <Paperclip className="w-3.5 h-3.5" />
              {o.attachmentCount} file{o.attachmentCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Contacts (door-price list) ---------------- */

function Contacts() {
  const [list, setList] = useState<Contact[]>(() => loadJSON<Contact[]>(CONTACTS_KEY, []));
  const [query, setQuery] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = (next: Contact[]) => {
    setList(next);
    saveJSON(CONTACTS_KEY, next);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? list.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
        )
      : list;
  }, [query, list]);

  const onImport = (file: File) => {
    setImportError(null);
    setImportCount(0);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          const toLower = (k: string) => k.toLowerCase().trim();
          const out: Contact[] = rows.map(r => {
            const keys = Object.keys(r);
            const pick = (...candidates: string[]) => {
              const hit = keys.find(k => candidates.includes(toLower(k)));
              return hit ? String(r[hit] ?? '').trim() : '';
            };
            return {
              id: genId('ct-'),
              name:  pick('name', 'full name', 'contact'),
              email: pick('email', 'e-mail', 'email address'),
              phone: pick('phone', 'mobile', 'mobile phone', 'cell'),
              notes: pick('notes', 'note', 'memo') || undefined,
            };
          }).filter(c => c.name || c.email || c.phone);

          // De-dupe by email + phone
          const seen = new Set<string>();
          const merged = [...list];
          let added = 0;
          for (const c of out) {
            const key = `${c.email.toLowerCase()}|${c.phone}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const existing = merged.find(m => `${m.email.toLowerCase()}|${m.phone}` === key);
            if (existing) continue;
            merged.push(c);
            added++;
          }
          save(merged);
          setImportCount(added);
        } catch (e) {
          setImportError((e as Error).message);
        }
      },
      error: (err) => setImportError(err.message),
    });
  };

  const exportCsv = () => {
    const csv = Papa.unparse(
      list.map(c => ({ name: c.name, email: c.email, phone: c.phone, notes: c.notes ?? '' })),
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schola-door-contacts.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const remove = (id: string) => save(list.filter(c => c.id !== id));
  const clear  = () => {
    if (!confirm(`Delete all ${list.length} contacts? This cannot be undone.`)) return;
    save([]);
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Door-price contacts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Import a spreadsheet of people who pay at the door. We look for
            columns named <code>name</code>, <code>email</code>, <code>phone</code>
            (<code>mobile</code> also works). Any order, any case.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <input
            ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only"
            onChange={e => e.target.files?.[0] && onImport(e.target.files[0])}
          />
          <button onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2 text-sm" disabled={!list.length}>
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={clear} className="btn-secondary inline-flex items-center gap-2 text-sm text-red-700" disabled={!list.length}>
            <Trash2 className="w-4 h-4" /> Clear all
          </button>

          <div className="flex-1" />
          <input
            type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {importError && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <Info className="w-4 h-4" /> {importError}
          </div>
        )}
        {importCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Imported {importCount} new contact{importCount === 1 ? '' : 's'}.
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No contacts yet. Import a CSV to get started.
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header hidden md:table-cell">Notes</th>
                <th className="table-header w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-800">{c.name}</td>
                  <td className="table-cell text-gray-600">{c.email}</td>
                  <td className="table-cell text-gray-600">{c.phone}</td>
                  <td className="table-cell text-gray-500 hidden md:table-cell max-w-[220px] truncate">{c.notes}</td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Sent log ---------------- */

function SentLog() {
  const [log, setLog] = useState<ReminderLog[]>(() => loadJSON<ReminderLog[]>(LOG_KEY, []));

  const clear = () => {
    if (!confirm('Clear the sent-reminder log?')) return;
    saveJSON(LOG_KEY, []);
    setLog([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Shows the last 50 reminders queued from this browser.</p>
        <button onClick={clear} className="btn-secondary inline-flex items-center gap-2 text-sm" disabled={!log.length}>
          <Trash2 className="w-4 h-4" /> Clear log
        </button>
      </div>

      {log.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">No reminders sent yet.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Sent</th>
                <th className="table-header">Week of</th>
                <th className="table-header">Channel</th>
                <th className="table-header">Offerings</th>
                <th className="table-header text-right">Recipients</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {log.map(r => (
                <tr key={r.id}>
                  <td className="table-cell text-gray-500 whitespace-nowrap">{new Date(r.sentAt).toLocaleString()}</td>
                  <td className="table-cell">{formatWeekLabel(r.weekStart)}</td>
                  <td className="table-cell capitalize">{r.channel}</td>
                  <td className="table-cell text-gray-500">{r.courseIds.length}</td>
                  <td className="table-cell text-right font-semibold">{r.recipientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function mondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const dow = copy.getDay(); // 0 = Sun
  const diff = (dow + 6) % 7; // distance back to Monday
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function formatWeekLabel(isoMonday: string): string {
  const start = new Date(`${isoMonday}T12:00:00`);
  if (isNaN(start.getTime())) return isoMonday;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const s = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const e = end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
  return `Week of ${s}–${e}`;
}

function buildEmailBody({ weekLabel, offerings }: { weekLabel: string; offerings: OfferingRollup[] }): string {
  const lines: string[] = [];
  lines.push('Hello,');
  lines.push('');
  lines.push(`Here is what's happening at Schola Academy during the ${weekLabel.toLowerCase()}:`);
  lines.push('');
  for (const o of offerings) {
    lines.push(`• ${o.title} — ${o.day}s, ${o.time}`);
    lines.push(`  Instructor: ${o.instructor}   Location: ${o.location}`);
    lines.push(`  Walk-in (door) price: $${o.doorPrice}`);
    lines.push(`  ${o.description}`);
    if (o.attachmentNames.length) {
      lines.push(`  Materials: ${o.attachmentNames.join(', ')}`);
    }
    lines.push('');
  }
  lines.push('If you prefer not to receive these reminders, reply to this email and we will remove you.');
  lines.push('');
  lines.push('— The Schola Academy team');
  return lines.join('\n');
}

function buildSmsBody({ weekLabel, offerings }: { weekLabel: string; offerings: OfferingRollup[] }): string {
  const titles = offerings.slice(0, 3).map(o => `${o.title} (${o.day.slice(0, 3)})`).join(', ');
  const more = offerings.length > 3 ? ` +${offerings.length - 3} more` : '';
  return `Schola Academy — ${weekLabel}: ${titles}${more}. Door prices apply; see email for details. Reply STOP to opt out.`.slice(0, 320);
}
