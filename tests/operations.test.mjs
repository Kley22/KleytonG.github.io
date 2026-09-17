import test from 'node:test';
import assert from 'node:assert/strict';
import { validDate, normalizeText, obligationStatus, filterObligations, summarizeObligations, groupObligations, calculateConsumption } from '../assets/js/operations-logic.mjs';

const obligations = [
  { id: 'a', property: 'Pátio', category: 'imoveis', type: 'Aluguel', month: '2026-09', due: '2026-09-17', paidOn: '', cents: 101, documents: false },
  { id: 'b', property: 'Pátio', category: 'imoveis', type: 'IPTU', month: '2026-09', due: '2026-09-10', paidOn: '2026-09-16', cents: 205, documents: true },
  { id: 'c', property: 'Anexo', category: 'contratos', type: 'Serviço', month: '2026-08', due: '2026-08-31', paidOn: '', cents: 303, documents: true },
  { id: 'd', property: 'Anexo', category: 'frota', type: 'Abastecimento', month: '2026-09', due: '2026-09-25', paidOn: '', cents: 409, documents: false }
];

test('calendar dates reject overflow and retain the due date as not overdue', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(obligationStatus(obligations[0], '2026-09-17'), 'open');
  assert.equal(obligationStatus(obligations[0], '2026-09-18'), 'overdue');
  assert.throws(() => obligationStatus(obligations[0], ''), RangeError);
});
test('payment confirmation respects the reference date, independently of document availability', () => {
  assert.equal(obligationStatus(obligations[1], '2026-09-15'), 'overdue');
  assert.equal(obligationStatus(obligations[1], '2026-09-16'), 'paid');
  assert.equal(obligationStatus({ ...obligations[1], documents: false }, '2026-09-17'), 'paid');
});
test('filters intersect origin, competence, property, type and independent document status', () => {
  assert.equal(filterObligations(obligations, { month: '2026-09', category: 'imoveis' }).length, 2);
  assert.equal(filterObligations(obligations, { property: 'Pátio', type: 'Aluguel', status: 'documents' })[0].id, 'a');
  assert.equal(filterObligations(obligations, { status: 'overdue' })[0].id, 'c');
  assert.deepEqual(filterObligations(obligations, { month: '2026-10' }), []);
});
test('cent values reconcile exactly and category totals partition the consolidated total', () => {
  const total = summarizeObligations(obligations);
  assert.equal(total.totalCents, 1018);
  assert.equal(total.paidCents, 205);
  assert.equal(total.openCents, 813);
  assert.equal(total.overdueCents, 303);
  assert.equal(total.pendingDocuments, 2);
  assert.equal(total.paidCents + total.openCents, total.totalCents);
  const groups = groupObligations(obligations);
  for (const field of ['totalCents', 'paidCents', 'openCents', 'overdueCents', 'count']) {
    assert.equal(groups.reduce((sum, group) => sum + group[field], 0), total[field]);
  }
  assert.deepEqual(summarizeObligations([]), { count: 0, totalCents: 0, paidCents: 0, openCents: 0, overdueCents: 0, pendingDocuments: 0 });
});
test('duplicate obligations and non-cent values cannot silently inflate totals', () => {
  assert.throws(() => summarizeObligations([obligations[0], obligations[0]]), /repetida/);
  assert.throws(() => summarizeObligations([{ ...obligations[0], cents: 1.25 }]), /centavos/);
  assert.throws(() => groupObligations([obligations[0], { ...obligations[0], category: 'frota' }]), /repetida/);
});
test('efficiency uses the full interval, rejects reversed/equal readings and absent full tanks', () => {
  assert.deepEqual(calculateConsumption({ previous: 12400, current: 12820, liters: 35, fullToFull: true }), { distance: 420, efficiency: 12 });
  for (const current of [12400, 12000]) assert.match(calculateConsumption({ previous: 12400, current, liters: 35, fullToFull: true }).error, /maior/);
  assert.match(calculateConsumption({ previous: 0, current: 10, liters: 0, fullToFull: true }).error, /zero/);
  assert.match(calculateConsumption({ previous: '', current: 10, liters: 1, fullToFull: true }).error, /Preencha/);
  assert.match(calculateConsumption({ previous: -1, current: 10, liters: 1, fullToFull: true }).error, /negativas/);
  assert.equal(calculateConsumption({ previous: 0, current: 100, liters: 10, fullToFull: false }).efficiency, undefined);
  assert.match(calculateConsumption({ previous: 0, current: 100, liters: Number.MIN_VALUE, fullToFull: true }).error, /escala/);
});
test('search normalization is accent-insensitive', () => assert.equal(normalizeText('  VEÍCULO 01 '), 'veiculo 01'));
