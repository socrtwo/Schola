import type { CheckBatch } from '../data/sampleData';
import { genId, loadJSON, saveJSON } from './storage';
import { listRegistrations, setBatchOnRegistrations } from './registrations';

const KEY = 'schola:check-batches';

export function listBatches(): CheckBatch[] {
  return loadJSON<CheckBatch[]>(KEY, []).sort((a, b) => b.preparedAt - a.preparedAt);
}

export function getBatch(id: string): CheckBatch | undefined {
  return listBatches().find(b => b.id === id);
}

export function createBatch(input: {
  label: string;
  preparedBy: string;
  notes?: string;
  registrationIds: string[];
}): CheckBatch {
  const batch: CheckBatch = {
    id: genId('batch-'),
    label: input.label.trim() || defaultLabel(),
    preparedBy: input.preparedBy.trim(),
    notes: input.notes?.trim() || undefined,
    registrationIds: input.registrationIds,
    preparedAt: Date.now(),
  };
  const all = listBatches();
  all.unshift(batch);
  saveJSON(KEY, all);
  setBatchOnRegistrations(input.registrationIds, batch.id);
  window.dispatchEvent(new Event('schola:batches-updated'));
  return batch;
}

export function deleteBatch(id: string): void {
  const all = listBatches();
  const batch = all.find(b => b.id === id);
  if (batch) setBatchOnRegistrations(batch.registrationIds, null);
  saveJSON(KEY, all.filter(b => b.id !== id));
  window.dispatchEvent(new Event('schola:batches-updated'));
}

export function batchRegistrations(batchId: string) {
  const batch = getBatch(batchId);
  if (!batch) return [];
  const regs = listRegistrations();
  const order = new Map(batch.registrationIds.map((id, i) => [id, i]));
  return regs
    .filter(r => order.has(r.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function defaultLabel(): string {
  return `Batch ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
