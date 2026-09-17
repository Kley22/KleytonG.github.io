import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceStore, getInitialWorkspace } from '../assets/js/workspace.mjs';
import { projectComponent } from '../assets/js/finance-logic.mjs';

function storage() {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
}

test('one payment confirmation changes the shared ledger and survives a fresh route', () => {
  const saved = storage();
  const first = createWorkspaceStore(saved);
  assert.equal(first.updatePayment('PG-201', { stage: 'Pago', paidAt: '2026-09-17' }), false);
  assert.equal(first.updatePayment('PG-201', { stage: 'Encaminhado' }), false);
  assert.equal(first.updatePayment('PG-201', { documents: { confirmation: true } }), true);
  assert.equal(first.updatePayment('PG-201', { stage: 'Encaminhado' }), true);
  assert.equal(first.updatePayment('PG-201', { stage: 'Pago', paidAt: '2026-09-18' }), false);
  assert.equal(first.updatePayment('PG-201', { stage: 'Pago', paidAt: '2026-09-17' }), true);
  const nextRoute = createWorkspaceStore(saved);
  const invoice = nextRoute.getLedgerRecords().find(row => row.id === 'PG-201');
  assert.equal(invoice.contract, 'CT-101');
  assert.equal(invoice.documents, true);
  assert.equal(invoice.paidOn, '2026-09-17');
  assert.equal(invoice.cents, 1250000);
  assert.equal(nextRoute.updatePayment('PG-201', { documents: { confirmation: false } }), false);
});

test('forecast edits persist per contract without mixing service and material or rounding away positive cents', () => {
  const saved = storage();
  const first = createWorkspaceStore(saved);
  first.updateForecast('CT-101', { serviceBalance: '0,30', serviceMonthly: '0,09', months: '3' });
  const nextRoute = createWorkspaceStore(saved);
  const row = nextRoute.getWorkspace().forecasts.find(item => item.id === 'CT-101');
  const service = projectComponent(row.serviceBalance, row.serviceMonthly, row.months);
  assert.equal(service.remaining, 3);
  assert.equal(service.risk, false);
  assert.equal(row.materialBalance, '9600,00');
  assert.equal(nextRoute.getWorkspace().forecasts.find(item => item.id === 'CT-102').serviceBalance, '18500,00');
  first.updateForecast('CT-101', { materialMonthly: '' });
  const missing = createWorkspaceStore(saved).getWorkspace().forecasts.find(item => item.id === 'CT-101');
  assert.equal(projectComponent(missing.materialBalance, missing.materialMonthly, missing.months).status, 'missing');
});

test('readers receive copies and reset restores all datasets and notifies subscribers', () => {
  const saved = storage();
  const workspace = createWorkspaceStore(saved);
  const read = workspace.getWorkspace();
  read.payments[0].amount = 1;
  read.contracts[0].provider = 'changed';
  assert.equal(workspace.getWorkspace().payments[0].amount, 1250000);
  assert.equal(workspace.getWorkspace().contracts[0].provider, 'Alameda Serviços');
  let calls = 0;
  const unsubscribe = workspace.subscribe(() => calls++);
  workspace.updateForecast('CT-101', { months: '6' });
  workspace.updatePayment('PG-201', { documents: { confirmation: true } });
  workspace.resetWorkspace();
  assert.equal(calls, 3);
  assert.deepEqual(workspace.getWorkspace(), getInitialWorkspace());
  assert.deepEqual(createWorkspaceStore(saved).getWorkspace(), getInitialWorkspace());
  unsubscribe();
  workspace.resetWorkspace();
  assert.equal(calls, 3);
});

test('corrupted, foreign or partially invalid saved data restores the complete seed safely', () => {
  const key = 'kleyton-portfolio-workspace-v1';
  const saved = storage();
  for (const raw of ['{broken', JSON.stringify({ version: 99 }), JSON.stringify({ version: 1, payments: [null], forecasts: [] })]) {
    saved.setItem(key, raw);
    assert.deepEqual(createWorkspaceStore(saved).getWorkspace(), getInitialWorkspace());
  }
  const altered = getInitialWorkspace();
  altered.payments[0].documents.confirmation = true;
  altered.forecasts[1].months = null;
  saved.setItem(key, JSON.stringify({ version: 1, ...altered }));
  assert.deepEqual(createWorkspaceStore(saved).getWorkspace(), getInitialWorkspace());
  const foreign = getInitialWorkspace();
  foreign.payments[0].provider = '<script>ignore</script>';
  foreign.payments[0].amount = 10;
  saved.setItem(key, JSON.stringify({ version: 1, ...foreign }));
  assert.deepEqual(createWorkspaceStore(saved).getWorkspace(), getInitialWorkspace());
});

test('storage denial leaves usable in-memory controls and rejected mutations do not corrupt state', () => {
  const denied = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const workspace = createWorkspaceStore(denied);
  assert.equal(workspace.updateForecast('CT-101', { months: '8' }), true);
  assert.equal(workspace.getWorkspace().forecasts[0].months, '8');
  assert.equal(workspace.updatePayment('PG-201', { amount: 10 }), false);
  assert.equal(workspace.updatePayment('PG-201', { documents: { invoice: 'yes' } }), false);
  assert.equal(workspace.updateForecast('CT-101', { serviceBalance: 'x'.repeat(33) }), false);
  assert.equal(workspace.updateForecast('NOT-FOUND', { months: '2' }), false);
  assert.equal(workspace.getWorkspace().payments[0].amount, 1250000);
});


test('a page restored from history refreshes its existing subscribers from the shared visit', () => {
  const saved = storage();
  const previousPage = createWorkspaceStore(saved);
  let observed = null;
  previousPage.subscribe(value => { observed = value; });
  const nextPage = createWorkspaceStore(saved);
  nextPage.updateForecast('CT-101', { serviceMonthly: '17000,00' });
  nextPage.updatePayment('PG-201', { documents: { confirmation: true } });
  nextPage.updatePayment('PG-201', { stage: 'Encaminhado' });
  nextPage.updatePayment('PG-201', { stage: 'Pago', paidAt: '2026-09-17' });
  previousPage.refreshWorkspace();
  assert.equal(observed.payments.find(row => row.id === 'PG-201').paidAt, '2026-09-17');
  assert.equal(observed.forecasts.find(row => row.id === 'CT-101').serviceMonthly, '17000,00');
  assert.equal(previousPage.getLedgerRecords().find(row => row.id === 'PG-201').paidOn, '2026-09-17');
});
