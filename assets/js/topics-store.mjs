import { validDate } from './topics-logic.mjs';
export const TOPICS = ['obras-facilities', 'imoveis', 'frota', 'estacionamentos', 'mapa-precos'];
const clone = value => structuredClone(value);
const numeric = value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000000);
const positive = value => value === null || (numeric(value) && value > 0);
function permitted(topic, collection) {
  if (collection === 'payments' && ['obras-facilities', 'estacionamentos'].includes(topic)) return { documents: value => ['Pendente', 'Completa'].includes(value), stage: value => ['Em conferência', 'Encaminhado', 'Pago'].includes(value), paidOn: value => value === '' || validDate(value) };
  if (topic === 'imoveis' && collection === 'obligations') return { documents: value => ['Pendente', 'Completa'].includes(value), paidOn: value => value === '' || validDate(value) };
  if (topic === 'obras-facilities' && collection === 'contracts') return Object.fromEntries(['serviceBalance', 'serviceMonthly', 'materialBalance', 'materialMonthly'].map(key => [key, numeric]));
  if (topic === 'estacionamentos' && collection === 'contracts') return { spaces: value => value === null || (Number.isInteger(value) && value > 0 && value <= 10000), rate: positive };
  if (topic === 'frota' && collection === 'fuel') return { previous: numeric, current: numeric, liters: positive, pricePerLiter: positive, full: value => typeof value === 'boolean' };
  if (topic === 'frota' && collection === 'occurrences') return { status: value => ['Pendente', 'Conferido'].includes(value) };
  if (topic === 'mapa-precos' && collection === 'items') return { quantity: value => value === null || (Number.isInteger(value) && value > 0 && value <= 100000), research: value => Array.isArray(value) && value.length === 3 && value.every(item => positive(item) && (item === null || item <= 10000000)), suppliers: value => Array.isArray(value) && value.length === 3 && value.every(item => positive(item) && (item === null || item <= 10000000)) };
  return {};
}
function sanitize(topic, collection, original, patch, reference) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return null;
  const rules = permitted(topic, collection), clean = {};
  for (const [key, value] of Object.entries(patch)) if (Object.hasOwn(rules, key) && rules[key](value)) clean[key] = clone(value); else return null;
  const candidate = { ...original, ...clean };
  if (candidate.paidOn && (!validDate(reference) || candidate.paidOn > reference)) return null;
  if ((collection === 'payments' || collection === 'obligations') && ((candidate.paidOn && candidate.documents !== 'Completa') || (candidate.stage === 'Pago' && !candidate.paidOn) || (candidate.stage && candidate.paidOn && candidate.stage !== 'Pago') || (candidate.stage === 'Encaminhado' && candidate.documents !== 'Completa'))) return null;
  return clean;
}
export function createTopicStore(dataset, storage = null) {
  const state = {}, overlays = {}, listeners = new Set();
  const key = topic => `kleyton-topic-${dataset.version}-${topic}`;
  function restore(topic) {
    state[topic] = clone(dataset[topic]); overlays[topic] = {};
    let saved;
    try { saved = JSON.parse(storage?.getItem(key(topic)) || '{}'); } catch { return; }
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    for (const [collection, records] of Object.entries(saved)) {
      if (!Array.isArray(state[topic][collection]) || !records || typeof records !== 'object' || Array.isArray(records)) continue;
      for (const [id, patch] of Object.entries(records)) {
        const original = state[topic][collection].find(row => row.id === id);
        if (!original) continue;
        const clean = sanitize(topic, collection, original, patch, dataset.reference);
        if (!clean) continue;
        Object.assign(original, clean); (overlays[topic][collection] ||= {})[id] = clean;
      }
    }
  }
  TOPICS.forEach(restore);
  return {
    get(topic) { if (!TOPICS.includes(topic)) throw new Error('Assunto desconhecido'); return clone(state[topic]); },
    patch(topic, collection, id, patch) {
      if (!TOPICS.includes(topic) || !Array.isArray(state[topic][collection])) return false;
      const current = state[topic][collection].find(row => row.id === id); if (!current) return false;
      const clean = sanitize(topic, collection, current, patch, dataset.reference); if (!clean) return false;
      Object.assign(current, clean); Object.assign(((overlays[topic][collection] ||= {})[id] ||= {}), clean);
      try { storage?.setItem(key(topic), JSON.stringify(overlays[topic])); } catch { /* Memory fallback preserves usability. */ }
      listeners.forEach(fn => fn(topic)); return true;
    },
    reset(topic) { if (!TOPICS.includes(topic)) return; try { storage?.removeItem(key(topic)); } catch {} state[topic] = clone(dataset[topic]); overlays[topic] = {}; listeners.forEach(fn => fn(topic)); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
