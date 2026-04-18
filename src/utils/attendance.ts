import type { AttendanceRecord } from '../data/sampleData';
import { genId, loadJSON, saveJSON } from './storage';

const KEY = 'schola:attendance';

export function listAttendance(courseId?: string): AttendanceRecord[] {
  const all = loadJSON<AttendanceRecord[]>(KEY, []);
  return courseId ? all.filter(r => r.courseId === courseId) : all;
}

export function saveAttendance(rec: Omit<AttendanceRecord, 'id' | 'recordedAt'>): AttendanceRecord {
  const full: AttendanceRecord = { ...rec, id: genId('att-'), recordedAt: Date.now() };
  const all = loadJSON<AttendanceRecord[]>(KEY, []);
  // Replace any existing record for same course/date
  const filtered = all.filter(r => !(r.courseId === rec.courseId && r.sessionDate === rec.sessionDate));
  filtered.push(full);
  saveJSON(KEY, filtered);
  window.dispatchEvent(new Event('schola:attendance-updated'));
  return full;
}

export function deleteAttendance(id: string): void {
  const all = loadJSON<AttendanceRecord[]>(KEY, []);
  saveJSON(KEY, all.filter(r => r.id !== id));
  window.dispatchEvent(new Event('schola:attendance-updated'));
}
