import { useEffect, useState } from 'react';
import { courses as baseCourses, type Course } from '../data/sampleData';
import { loadJSON, saveJSON } from './storage';

export interface OfferingOverride {
  description?: string;
  imageUrl?: string;
  doorPrice?: number;
  startDate?: string;
  weeks?: number;
}

const STORAGE_KEY = 'schola:offering-overrides';

function readOverrides(): Record<string, OfferingOverride> {
  return loadJSON(STORAGE_KEY, {});
}

function writeOverrides(v: Record<string, OfferingOverride>): void {
  saveJSON(STORAGE_KEY, v);
}

export function mergedCourses(): Course[] {
  const over = readOverrides();
  return baseCourses.map(c => {
    const o = over[c.id];
    return o ? { ...c, ...o } : c;
  });
}

export function getOffering(id: string): Course | undefined {
  return mergedCourses().find(c => c.id === id);
}

export function updateOffering(id: string, patch: OfferingOverride): void {
  const over = readOverrides();
  over[id] = { ...over[id], ...patch };
  writeOverrides(over);
  window.dispatchEvent(new Event('schola:offerings-updated'));
}

export function resetOffering(id: string): void {
  const over = readOverrides();
  delete over[id];
  writeOverrides(over);
  window.dispatchEvent(new Event('schola:offerings-updated'));
}

/** React hook — returns the merged course list, re-rendering on updates. */
export function useOfferings(): Course[] {
  const [value, setValue] = useState<Course[]>(() => mergedCourses());
  useEffect(() => {
    const refresh = () => setValue(mergedCourses());
    window.addEventListener('schola:offerings-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('schola:offerings-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return value;
}
