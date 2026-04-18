import type { RegistrationRecord } from '../data/sampleData';
import { genId, loadJSON, saveJSON } from './storage';

const KEY = 'schola:registrations';

export function listRegistrations(): RegistrationRecord[] {
  return loadJSON<RegistrationRecord[]>(KEY, []);
}

export function saveRegistration(rec: Omit<RegistrationRecord, 'id' | 'recordedAt'>): RegistrationRecord {
  const full: RegistrationRecord = { ...rec, id: genId('reg-'), recordedAt: Date.now() };
  const all = listRegistrations();
  all.unshift(full);
  saveJSON(KEY, all);
  window.dispatchEvent(new Event('schola:registrations-updated'));
  return full;
}

export function markConfirmationSent(id: string): void {
  const all = listRegistrations();
  const next = all.map(r => r.id === id ? { ...r, confirmationSent: true } : r);
  saveJSON(KEY, next);
  window.dispatchEvent(new Event('schola:registrations-updated'));
}
