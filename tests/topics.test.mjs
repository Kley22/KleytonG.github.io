import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toCents, validDate, contractStatus, paymentStatus, paymentSummary, paymentPatch, projectBalance, parkingMonthly, fuelResult, summarizeFuel, referencePrice, priceComparison } from '../assets/js/topics-logic.mjs';
import { createTopicStore } from '../assets/js/topics-store.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../content/topic-data.json', import.meta.url), 'utf8'));
function memory() { const entries = new Map(); return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) }; }

test('reference dates are real calendar dates and due-today is distinct from overdue', () => {
  assert.equal(validDate('2026-02-30'), false); assert.equal(validDate(''), false); assert.equal(validDate('2024-02-29'), true);
  assert.equal(paymentStatus({ due: data.reference, paidOn: '' }, data.reference).key, 'today');
  assert.equal(paymentStatus({ due: '', paidOn: '' }, data.reference).key, 'missing');
  const expired = data['obras-facilities'].contracts.find(row => row.id === 'OF-103');
  assert.equal(contractStatus(expired, data.reference).key, 'expired');
  assert.equal(contractStatus(data.estacionamentos.contracts[2], data.reference).key, 'closed');
});

test('cent arithmetic, independent components, zero and missing premises', () => {
  assert.equal(toCents(1.005), 101);
  assert.deepEqual(projectBalance(0.3, 0.1, 3), { valid: true, available: 30, spend: 30, remaining: 0, risk: false });
  assert.equal(projectBalance(100, 0, 3).remaining, 10000);
  assert.equal(projectBalance(100, null, 3).valid, false);
  assert.equal(projectBalance(100, -1, 3).valid, false);
  assert.equal(projectBalance(100, 10, null).valid, false);
  const contract = data['obras-facilities'].contracts[1];
  assert.equal(projectBalance(contract.serviceBalance, contract.serviceMonthly, 3).remaining, -310000);
  assert.equal(projectBalance(contract.materialBalance, contract.materialMonthly, 3).remaining, 25000);
});

test('payment progression requires documents, forwarding, and a real payment date', () => {
  const original = data['obras-facilities'].payments[0];
  assert.equal(paymentPatch(original, 'forward'), null); assert.equal(paymentPatch(original, 'pay', data.reference), null);
  const documented = { ...original, ...paymentPatch(original, 'documents') };
  assert.equal(paymentPatch(documented, 'pay', data.reference), null);
  const forwarded = { ...documented, ...paymentPatch(documented, 'forward') };
  assert.equal(paymentPatch(forwarded, 'pay', ''), null);
  assert.equal(paymentPatch(forwarded, 'pay', '2026-02-30'), null);
  const paid = { ...forwarded, ...paymentPatch(forwarded, 'pay', data.reference) };
  assert.equal(paid.stage, 'Pago'); assert.equal(paymentStatus(paid, data.reference).key, 'paid');
});

test('parking monthly contracts have separate totals and no closed-contract active quantity', () => {
  assert.equal(parkingMonthly(data.estacionamentos.contracts[0]), 336000);
  assert.equal(parkingMonthly({ spaces: null, rate: 280 }), null);
  assert.equal(parkingMonthly({ spaces: 12, rate: null }), null);
  const current = data.estacionamentos.payments.filter(row => row.competence === data.period);
  assert.deepEqual(paymentSummary(current, data.reference), { total: 522000, paid: 186000, open: 336000, overdue: 0, documents: 1, count: 2 });
  assert.equal(data.estacionamentos.contracts.filter(row => row.status === 'Ativo').reduce((sum, row) => sum + row.spaces, 0), 18);
});

test('full-to-full consumption uses weighted totals and partials never invent consumption', () => {
  const rows = data.frota.fuel;
  assert.equal(fuelResult(rows[0]).consumption, 12);
  assert.equal(fuelResult(rows[3]).consumption, null);
  assert.equal(fuelResult({ ...rows[0], current: 11000 }).valid, false);
  assert.equal(fuelResult({ ...rows[0], liters: null }).valid, false);
  const totals = summarizeFuel(rows);
  assert.equal(totals.full, 3); assert.equal(totals.partial, 1);
  assert.equal(totals.consumption, 1120 / 95.5);
  assert.equal(totals.cost, 71895);
});

test('price reference rounds unit cents before multiplying quantities', () => {
  const mean = priceComparison(data['mapa-precos'].items, 'mean');
  const median = priceComparison(data['mapa-precos'].items);
  assert.equal(mean.referenceTotal, 145871); assert.equal(median.referenceTotal, 146600);
  assert.deepEqual(median.proposals.map(row => row.total), [140000, 140500, 141000]);
  assert.deepEqual(referencePrice([null, null, null]), { cents: null, count: 0 });
  assert.deepEqual(referencePrice([80, null, 90]), { cents: 8500, count: 2 });
  const changed = structuredClone(data['mapa-precos'].items); changed[0].quantity = 8;
  assert.equal(priceComparison(changed).referenceTotal, 180600);
  assert.deepEqual(priceComparison(changed).proposals.map(row => row.total), [172800, 172100, 176200]);
  changed[0].suppliers[0] = null;
  const result = priceComparison(changed);
  assert.equal(result.proposals[0].complete, false); assert.equal(result.proposals[0].total, null);
  assert.equal(result.lowest, 172100); assert.deepEqual(result.lowestIndexes, [1]);
  changed[0].quantity = null;
  assert.equal(priceComparison(changed).referenceTotal, null); assert.equal(priceComparison(changed).lowest, null);
});

test('subject changes persist independently and resetting one preserves all others', () => {
  const storage = memory(), store = createTopicStore(data, storage);
  assert.equal(store.patch('obras-facilities', 'contracts', 'OF-101', { serviceMonthly: 999 }), true);
  assert.equal(store.patch('estacionamentos', 'contracts', 'ES-101', { spaces: 9 }), true);
  const reloaded = createTopicStore(data, storage);
  assert.equal(reloaded.get('obras-facilities').contracts[0].serviceMonthly, 999);
  assert.equal(reloaded.get('estacionamentos').contracts[0].spaces, 9);
  reloaded.reset('obras-facilities');
  assert.equal(reloaded.get('obras-facilities').contracts[0].serviceMonthly, 12500);
  assert.equal(reloaded.get('estacionamentos').contracts[0].spaces, 9);
  const copy = reloaded.get('estacionamentos'); copy.contracts[0].spaces = 200;
  assert.equal(reloaded.get('estacionamentos').contracts[0].spaces, 9);
});

test('payment state cannot contradict documents/date and source strings cannot be overwritten', () => {
  const store = createTopicStore(data, memory());
  assert.equal(store.patch('obras-facilities', 'payments', 'OF-P01', { stage: 'Pago' }), false);
  assert.equal(store.patch('obras-facilities', 'payments', 'OF-P01', { stage: 'Pago', documents: 'Completa', paidOn: '2026-09-18' }), false);
  assert.equal(store.patch('obras-facilities', 'payments', 'OF-P01', { paidOn: data.reference, stage: 'Pago' }), false);
  assert.equal(store.patch('obras-facilities', 'contracts', 'OF-101', { description: '<img onerror=alert(1)>' }), false);
  assert.equal(store.patch('frota', 'fuel', 'FR-A01', { liters: -1 }), false);
  assert.equal(store.patch('mapa-precos', 'items', 'MP-01', { research: [80, '99', 100] }), false);
});

test('restored storage is rebased on canonical fields and malformed payloads are discarded', () => {
  const storage = memory();
  storage.setItem('kleyton-topic-1.0-obras-facilities', JSON.stringify({ contracts: { 'OF-101': { serviceMonthly: 999, description: '<script>evil</script>' }, 'OF-102': { serviceMonthly: 500 } }, payments: { 'OF-P01': { stage: 'Pago', paidOn: '' } } }));
  storage.setItem('kleyton-topic-1.0-imoveis', '{malformed');
  const store = createTopicStore(data, storage);
  assert.equal(store.get('obras-facilities').contracts[0].serviceMonthly, 12500);
  assert.equal(store.get('obras-facilities').contracts[1].serviceMonthly, 500);
  assert.equal(store.get('obras-facilities').payments[0].stage, 'Em conferência');
  assert.deepEqual(store.get('imoveis'), data.imoveis);
});

test('blocked session storage retains an in-memory usable state', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const store = createTopicStore(data, storage);
  assert.equal(store.patch('mapa-precos', 'items', 'MP-01', { quantity: 8 }), true);
  assert.equal(store.get('mapa-precos').items[0].quantity, 8);
  store.reset('mapa-precos'); assert.equal(store.get('mapa-precos').items[0].quantity, 4);
});
