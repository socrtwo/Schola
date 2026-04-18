import { useMemo, useState } from 'react';
import {
  Printer, Palette, Image as ImageIcon, CalendarDays,
  MapPin, Clock, DollarSign, User, GraduationCap,
} from 'lucide-react';
import { useOfferings } from '../utils/offerings';

/* Paper sizes in inches (width × height). */
const PAPER_SIZES = {
  'letter-portrait':  { label: 'Letter · 8.5 × 11 in (portrait)',  w: 8.5,  h: 11,   css: 'letter portrait' },
  'letter-landscape': { label: 'Letter · 11 × 8.5 in (landscape)', w: 11,   h: 8.5,  css: 'letter landscape' },
  'tabloid':          { label: 'Tabloid · 11 × 17 in',             w: 11,   h: 17,   css: 'tabloid portrait' },
  'a4':               { label: 'A4 · 210 × 297 mm',                w: 8.27, h: 11.69,css: 'A4 portrait' },
  'a3':               { label: 'A3 · 297 × 420 mm',                w: 11.69,h: 16.54,css: 'A3 portrait' },
  'square-12':        { label: 'Square · 12 × 12 in',              w: 12,   h: 12,   css: '12in 12in' },
  'flyer-half':       { label: 'Half-page flyer · 5.5 × 8.5 in',   w: 5.5,  h: 8.5,  css: '5.5in 8.5in' },
} as const;
type PaperKey = keyof typeof PAPER_SIZES;

const THEMES = {
  sunset:  { from: '#ea580c', to: '#7c2d12', title: '#fff7ed' },
  ocean:   { from: '#0369a1', to: '#0c4a6e', title: '#f0f9ff' },
  forest:  { from: '#047857', to: '#064e3b', title: '#ecfdf5' },
  plum:    { from: '#6d28d9', to: '#3b0764', title: '#f5f3ff' },
  rose:    { from: '#be123c', to: '#4c0519', title: '#fff1f2' },
  graphite:{ from: '#334155', to: '#0f172a', title: '#f1f5f9' },
  cream:   { from: '#fef3c7', to: '#fde68a', title: '#1f2937', titleOnLight: true },
} as const;
type ThemeKey = keyof typeof THEMES;

const formatLabel: Record<string, string> = {
  course: 'Course',
  lecture: 'Lecture',
  workshop: 'Workshop',
  performance: 'Performance',
};

export default function Posters() {
  const offerings = useOfferings();
  const [selectedId, setSelectedId] = useState(offerings[0]?.id ?? '');
  const [paper, setPaper] = useState<PaperKey>('letter-portrait');
  const [theme, setTheme] = useState<ThemeKey>('sunset');
  const [tagline, setTagline] = useState('');

  const course = useMemo(
    () => offerings.find(c => c.id === selectedId),
    [offerings, selectedId],
  );

  const paperSpec = PAPER_SIZES[paper];
  const themeSpec = THEMES[theme];

  if (!course) {
    return <div className="card">No offering selected.</div>;
  }

  const dateLabel = formatDateRange(course.startDate, course.weeks);

  return (
    <div className="space-y-6">
      {/* Page header (hidden when printing) */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publicity Posters</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pick any offering and generate a print-ready poster.
              Use your browser's "Save as PDF" option in the print dialog for digital posting.
            </p>
          </div>
          <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Offering</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {offerings.map(c => (
                <option key={c.id} value={c.id}>{c.title} — {formatLabel[c.format]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Paper size</label>
            <select
              value={paper}
              onChange={e => setPaper(e.target.value as PaperKey)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(PAPER_SIZES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Color theme</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(THEMES) as ThemeKey[]).map(k => {
                const t = THEMES[k];
                const active = k === theme;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTheme(k)}
                    title={k}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform
                      ${active ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'border-white shadow-sm hover:scale-105'}`}
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                    aria-label={`${k} theme`}
                    aria-pressed={active}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Optional tagline <span className="font-normal text-gray-400">(appears above the title)</span>
          </label>
          <input
            type="text"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="e.g. Fall 2025 · Community Series"
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="print:hidden text-center text-xs text-gray-400 uppercase tracking-wide">
        Preview (scaled)
      </div>

      {/* Sized-to-paper poster. A single CSS px === 1/96 in for print. */}
      <div className="print-area mx-auto overflow-hidden shadow-2xl rounded-sm bg-white"
           style={{ width: `${paperSpec.w * 96}px`, height: `${paperSpec.h * 96}px`, transform: 'scale(var(--poster-scale, 1))', transformOrigin: 'top center' }}>
        <PosterArtwork
          course={course}
          theme={themeSpec}
          tagline={tagline}
          dateLabel={dateLabel}
          paperKey={paper}
        />
      </div>

      {/* Print-only CSS: set the page size, hide chrome, show only the poster. */}
      <style>{`
        /* Scale oversized previews down to fit the viewport. */
        .print-area { --poster-scale: 1; }
        @media (max-width: 1100px) {
          .print-area { --poster-scale: 0.65; margin-bottom: calc(-1 * var(--poster-shrink-offset, 0px)); }
        }
        @media (max-width: 720px) {
          .print-area { --poster-scale: 0.4; }
        }

        @media print {
          @page { size: ${paperSpec.css}; margin: 0; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute; left: 0; top: 0;
            width: 100% !important; height: 100% !important;
            box-shadow: none !important; border-radius: 0 !important;
            transform: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function PosterArtwork({
  course, theme, tagline, dateLabel, paperKey,
}: {
  course: ReturnType<typeof useOfferings>[number];
  theme: (typeof THEMES)[ThemeKey];
  tagline: string;
  dateLabel: string;
  paperKey: PaperKey;
}) {
  const titleColor = theme.title;
  const onLight = 'titleOnLight' in theme && theme.titleOnLight;
  const isLandscape = paperKey === 'letter-landscape';

  return (
    <article
      className="w-full h-full flex flex-col relative"
      style={{
        background: `linear-gradient(160deg, ${theme.from} 0%, ${theme.to} 100%)`,
        color: titleColor,
      }}
    >
      {/* Decorative corner accents */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-1/3 h-1/3 rounded-bl-full opacity-20"
           style={{ background: onLight ? '#000' : '#fff' }} />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-1/4 h-1/4 rounded-tr-full opacity-10"
           style={{ background: onLight ? '#000' : '#fff' }} />

      {/* Header strip */}
      <header className="flex items-center justify-between px-10 pt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
               style={{ background: onLight ? '#1f2937' : 'rgba(255,255,255,0.15)' }}>
            <GraduationCap className="w-6 h-6" style={{ color: onLight ? '#fff' : titleColor }} />
          </div>
          <div className="font-bold text-xl tracking-tight">Schola Academy</div>
        </div>
        <div className="text-sm uppercase tracking-[0.2em] opacity-80">
          {formatLabel[course.format] ?? course.format}
        </div>
      </header>

      {/* Hero image */}
      {course.imageUrl && (
        <div className={`mx-10 mt-6 rounded-2xl overflow-hidden shadow-lg ${isLandscape ? 'max-h-[40%]' : 'max-h-[45%]'}`}
             style={{ flex: '0 0 auto' }}>
          <img
            src={course.imageUrl}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            style={{ aspectRatio: isLandscape ? '3/1' : '16/9' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Title block */}
      <div className="px-10 mt-8">
        {tagline && (
          <div className="text-sm uppercase tracking-[0.3em] font-semibold opacity-85 mb-3">
            {tagline}
          </div>
        )}
        <h1 className="font-extrabold leading-[0.95] tracking-tight"
            style={{ fontSize: isLandscape ? '56px' : '72px' }}>
          {course.title}
        </h1>
        <p className="mt-3 text-xl opacity-90">with {course.instructor}</p>
      </div>

      {/* Description */}
      <p className="px-10 mt-5 text-lg leading-relaxed opacity-95"
         style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {course.description}
      </p>

      {/* Spacer pushes footer info down */}
      <div className="flex-1" />

      {/* Details strip */}
      <div className="mx-10 mb-4 rounded-xl p-6"
           style={{ background: onLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-lg">
          <InfoRow icon={<CalendarDays className="w-6 h-6" />} label={dateLabel || 'See schedule'} />
          <InfoRow icon={<Clock className="w-6 h-6" />}        label={`${course.day}s · ${course.time}`} />
          <InfoRow icon={<MapPin className="w-6 h-6" />}        label={course.location} />
          <InfoRow icon={<User className="w-6 h-6" />}          label={course.instructor} />
          <InfoRow icon={<DollarSign className="w-6 h-6" />}    label={`$${course.fee} registered · $${course.doorPrice} at the door`} />
          <InfoRow icon={<Palette className="w-6 h-6" />}       label={course.category} />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-10 pb-8 flex items-center justify-between text-sm opacity-90">
        <div>
          <div className="font-semibold">Register today</div>
          <div>Visit the registration desk or call our office.</div>
        </div>
        <div className="text-right font-mono tracking-tight">
          <div className="text-xs uppercase opacity-70">Offering code</div>
          <div className="font-bold">{course.id}</div>
        </div>
      </footer>

      {/* Dim image icon indicator when no art */}
      {!course.imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <ImageIcon className="w-64 h-64" />
        </div>
      )}
    </article>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function formatDateRange(startISO?: string, weeks?: number): string {
  if (!startISO || !weeks) return '';
  const start = new Date(`${startISO}T12:00:00`);
  if (isNaN(start.getTime())) return '';
  const end = new Date(start);
  end.setDate(end.getDate() + (weeks - 1) * 7);
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const yearFmt: Intl.DateTimeFormatOptions = { ...fmt, year: 'numeric' };
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${start.toLocaleDateString('en-US', fmt)} – ${end.toLocaleDateString('en-US', sameYear ? fmt : yearFmt)}, ${end.getFullYear()}`;
}
