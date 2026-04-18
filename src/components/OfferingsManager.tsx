import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Download, Trash2, Save, RotateCcw, Paperclip,
  FileText, FileAudio, FileVideo, FileImage, FileSpreadsheet,
  FileArchive, File as FileIcon, Presentation, Image as ImageIcon, Info,
} from 'lucide-react';
import { useOfferings, updateOffering, resetOffering } from '../utils/offerings';
import {
  deleteAttachment, downloadAttachment, formatBytes,
  iconKindForType, listAttachments, saveAttachment,
} from '../utils/attachments';
import type { Attachment, Course } from '../data/sampleData';

export default function OfferingsManager() {
  const offerings = useOfferings();
  const [selectedId, setSelectedId] = useState(offerings[0]?.id ?? '');
  const course = useMemo(
    () => offerings.find(c => c.id === selectedId),
    [offerings, selectedId],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offerings (Curriculum Manager)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit offering details and attach any file — handouts, slide decks, audio tracks,
          video, sheet music, syllabi. Attachments are stored locally on this device.
        </p>
      </div>

      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Offering</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {offerings.map(c => (
            <option key={c.id} value={c.id}>
              {c.id} · {c.title} — {c.day} {c.time}
            </option>
          ))}
        </select>
      </div>

      {course && (
        <>
          <OfferingDetailsEditor key={course.id} course={course} />
          <AttachmentsPanel course={course} />
        </>
      )}
    </div>
  );
}

/* ---------------- Details editor ---------------- */

function OfferingDetailsEditor({ course }: { course: Course }) {
  const [description, setDescription] = useState(course.description);
  const [imageUrl, setImageUrl]       = useState(course.imageUrl ?? '');
  const [doorPrice, setDoorPrice]     = useState(String(course.doorPrice));
  const [startDate, setStartDate]     = useState(course.startDate);
  const [weeks, setWeeks]             = useState(String(course.weeks));
  const [saved, setSaved]             = useState(false);

  const dirty =
    description !== course.description ||
    imageUrl !== (course.imageUrl ?? '') ||
    Number(doorPrice) !== course.doorPrice ||
    startDate !== course.startDate ||
    Number(weeks) !== course.weeks;

  const save = () => {
    updateOffering(course.id, {
      description,
      imageUrl: imageUrl || undefined,
      doorPrice: Number(doorPrice) || 0,
      startDate,
      weeks: Math.max(1, Number(weeks) || 1),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (!confirm('Reset this offering to its catalog defaults?')) return;
    resetOffering(course.id);
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
          <p className="text-sm text-gray-500">{course.instructor} · {course.day} {course.time}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty}
            className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="desc" className="block text-sm font-semibold text-gray-700 mb-1">
          Description (used in catalog, registration, posters, and reminders)
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={5}
          className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="img" className="block text-sm font-semibold text-gray-700 mb-1">
            Cover image URL
          </label>
          <input
            id="img"
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="mt-2 max-h-32 rounded-lg border border-gray-200 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="mt-2 h-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              <ImageIcon className="w-5 h-5 mr-1" /> No cover image
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="door" className="block text-sm font-semibold text-gray-700 mb-1">Door price ($)</label>
            <input id="door" type="number" min={0} value={doorPrice} onChange={e => setDoorPrice(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label htmlFor="start" className="block text-sm font-semibold text-gray-700 mb-1">Start date</label>
            <input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="wk" className="block text-sm font-semibold text-gray-700 mb-1">Weeks</label>
            <input id="wk" type="number" min={1} max={52} value={weeks} onChange={e => setWeeks(e.target.value)}
                   className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Attachments ---------------- */

function AttachmentsPanel({ course }: { course: Course }) {
  const [items, setItems]       = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setItems(await listAttachments(course.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [course.id]);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const f of list) {
        await saveAttachment(course.id, f);
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const totalSize = items.reduce((sum, a) => sum + a.size, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Attached files</h2>
          <span className="badge bg-gray-100 text-gray-600">{items.length}</span>
        </div>
        <div className="text-xs text-gray-500">{formatBytes(totalSize)} stored</div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer?.files?.length) void addFiles(e.dataTransfer.files);
        }}
        className={[
          'rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-700 font-medium">
          {uploading ? 'Uploading…' : 'Drop files here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Any type — audio, video, PDFs, Word, slides, images, sheet music, ZIPs.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Info className="w-4 h-4" /> {error}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-5 divide-y divide-gray-100">
          {items.map(a => (
            <li key={a.id} className="py-3 flex items-center gap-3">
              <AttachmentIcon kind={iconKindForType(a.type, a.name)} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{a.name}</div>
                <div className="text-xs text-gray-500">
                  {formatBytes(a.size)} · {a.type || 'unknown'} · added {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => downloadAttachment(a)}
                className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                aria-label={`Download ${a.name}`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete "${a.name}"?`)) return;
                  await deleteAttachment(a.id);
                  await refresh();
                }}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                aria-label={`Delete ${a.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AttachmentIcon({ kind }: { kind: ReturnType<typeof iconKindForType> }) {
  const map = {
    image:    { Icon: FileImage,       color: 'text-pink-600 bg-pink-50' },
    video:    { Icon: FileVideo,       color: 'text-purple-600 bg-purple-50' },
    audio:    { Icon: FileAudio,       color: 'text-indigo-600 bg-indigo-50' },
    pdf:      { Icon: FileText,        color: 'text-red-600 bg-red-50' },
    doc:      { Icon: FileText,        color: 'text-blue-600 bg-blue-50' },
    sheet:    { Icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
    slides:   { Icon: Presentation,    color: 'text-amber-600 bg-amber-50' },
    archive:  { Icon: FileArchive,     color: 'text-gray-700 bg-gray-100' },
    text:     { Icon: FileText,        color: 'text-gray-700 bg-gray-100' },
    file:     { Icon: FileIcon,        color: 'text-gray-600 bg-gray-100' },
  } as const;
  const { Icon, color } = map[kind];
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
}
