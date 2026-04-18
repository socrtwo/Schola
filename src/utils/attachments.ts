import type { Attachment } from '../data/sampleData';
import { genId } from './storage';

const DB_NAME = 'schola-attachments';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_META = 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        const s = db.createObjectStore(STORE_META, { keyPath: 'id' });
        s.createIndex('byCourse', 'courseId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

export async function saveAttachment(courseId: string, file: File): Promise<Attachment> {
  const db = await openDb();
  const meta: Attachment = {
    id: genId('att-'),
    courseId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_FILES, STORE_META], 'readwrite');
    tx.objectStore(STORE_FILES).put(file, meta.id);
    tx.objectStore(STORE_META).put(meta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
  });
  return meta;
}

export async function listAttachments(courseId?: string): Promise<Attachment[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META);
    const req = tx.objectStore(STORE_META).getAll();
    req.onsuccess = () => {
      const all = (req.result as Attachment[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(courseId ? all.filter(a => a.courseId === courseId) : all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES);
    const req = tx.objectStore(STORE_FILES).get(id);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_FILES, STORE_META], 'readwrite');
    tx.objectStore(STORE_FILES).delete(id);
    tx.objectStore(STORE_META).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function downloadAttachment(att: Attachment): Promise<void> {
  const blob = await getAttachmentBlob(att.id);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = att.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function iconKindForType(type: string, name: string): 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'slides' | 'archive' | 'text' | 'file' {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'sheet';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'slides';
  if (['zip', '7z', 'tar', 'gz', 'rar'].includes(ext)) return 'archive';
  if (type.startsWith('text/') || ['txt', 'md'].includes(ext)) return 'text';
  return 'file';
}
