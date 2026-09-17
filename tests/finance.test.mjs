import test from 'node:test';
import assert from 'node:assert/strict';
import { validDate, daysBetween, contractAlert, parseMoney, projectComponent, paymentStatus, documentsComplete, paymentActionAllowed } from '../assets/js/finance-logic.mjs';

test('calendar dates are strict and UTC day intervals are stable', () => {
  assert.equal(validDate('2026-02-31'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
  assert.equal(daysBetween('2026-09-17', '2026-09-18'), 1);
});
test('contract alerts preserve administrative closure, inclusive end date and future starts', () => {
  const row = { start: '2026-01-01', end: '2026-09-17', status: 'Em acompanhamento' };
  assert.equal(contractAlert(row, '2026-09-17').key, 'attention');
  assert.equal(contractAlert(row, '2026-09-18').key, 'expired');
  assert.equal(contractAlert({ ...row, status: 'Encerrado' }, '2026-09-18').key, 'closed');
  assert.equal(contractAlert({ ...row, start: '2026-10-01', end: '2027-09-30' }, '2026-09-17').key, 'future');
  assert.equal(contractAlert(row, '').key, 'unavailable');
});
test('currency parsing retains exact cents and rejects unsupported input', () => {
  assert.deepEqual(parseMoney('1.234,56'), { status: 'valid', cents: 123456 });
  assert.deepEqual(parseMoney('0,03'), { status: 'valid', cents: 3 });
  assert.deepEqual(parseMoney('-18.05'), { status: 'valid', cents: -1805 });
  assert.equal(parseMoney('1e7').status, 'invalid');
  assert.equal(parseMoney('abc').status, 'invalid');
  assert.equal(parseMoney('').status, 'missing');
});
test('forecast calculates components independently and distinguishes zero, positive cents and risk', () => {
  assert.equal(projectComponent('0,30', '0,09', 3).remaining, 3);
  assert.equal(projectComponent('0,30', '0,09', 3).risk, false);
  assert.equal(projectComponent('0,30', '0,10', 3).remaining, 0);
  assert.equal(projectComponent('0,30', '0,10', 3).risk, false);
  assert.equal(projectComponent('0,30', '0,11', 3).risk, true);
  assert.equal(projectComponent('100', '0', 3).remaining, 10000);
  assert.equal(projectComponent('100', '', 3).status, 'missing');
  assert.equal(projectComponent('100', '-1', 3).status, 'invalid');
  assert.equal(projectComponent('100', '1', 1.5).status, 'invalid');
  assert.equal(projectComponent('100', '1', 61).status, 'invalid');
});
test('positive invoice value never implies payment; payment date controls a paid record', () => {
  const row = { amount: 10000, due: '2026-09-01', paidAt: '' };
  assert.equal(paymentStatus(row).key, 'overdue');
  assert.equal(paymentStatus({ ...row, paidAt: '2026-09-05' }).key, 'paid');
  assert.equal(paymentStatus({ ...row, paidAt: '2026-09-20' }).key, 'overdue');
  assert.equal(paymentStatus({ ...row, due: '2026-09-17' }).key, 'today');
});
test('workflow requires completed documents, explicit forwarding, and plausible confirmation date', () => {
  const row = { stage: 'Em conferência', received: '2026-09-10', documents: { invoice: true, reference: true, confirmation: false } };
  assert.equal(documentsComplete(row), false);
  assert.equal(paymentActionAllowed(row, 'forward'), false);
  row.documents.confirmation = true;
  assert.equal(paymentActionAllowed(row, 'forward'), true);
  assert.equal(paymentActionAllowed(row, 'pay'), false);
  row.stage = 'Encaminhado';
  assert.equal(paymentActionAllowed(row, 'pay', '2026-09-17'), true);
  assert.equal(paymentActionAllowed(row, 'pay', '2026-09-18'), false);
  assert.equal(paymentActionAllowed(row, 'pay', '2026-09-09'), false);
});
