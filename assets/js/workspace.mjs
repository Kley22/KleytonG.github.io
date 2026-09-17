import { REFERENCE_DATE, validDate, paymentActionAllowed, documentsComplete } from './finance-logic.mjs';
export { REFERENCE_DATE } from './finance-logic.mjs';
// Independent demonstration records, created for this portfolio.
const CONTRACTS = [
  { id: 'CT-101', provider: 'Alameda Serviços', object: 'Conservação predial', cycle: 'V02', start: '2026-02-01', end: '2027-01-31', status: 'Em acompanhamento', history: ['V01 · 01/02/2025 a 31/01/2026 · período concluído', 'V02 · 01/02/2026 a 31/01/2027 · período em acompanhamento'] },
  { id: 'CT-102', provider: 'Horizonte Climatização', object: 'Manutenção de climatização', cycle: 'V01', start: '2025-10-01', end: '2026-09-30', status: 'Em acompanhamento', history: ['V01 · 01/10/2025 a 30/09/2026 · período em acompanhamento', 'Próximo encaminhamento: reunir referências para análise do encerramento ou continuidade.'] },
  { id: 'CT-103', provider: 'Cedro Instalações', object: 'Adequações elétricas', cycle: 'V01', start: '2026-06-01', end: '2026-09-10', status: 'Em acompanhamento', history: ['V01 · 01/06/2026 a 10/09/2026 · prazo terminado', 'Próximo encaminhamento: conferir a situação administrativa e os documentos de encerramento.'] },
  { id: 'CT-104', provider: 'Ponte Apoio Técnico', object: 'Inspeções periódicas', cycle: 'V01', start: '2026-10-01', end: '2027-09-30', status: 'Em acompanhamento', history: ['V01 · 01/10/2026 a 30/09/2027 · início programado'] },
  { id: 'CT-105', provider: 'Lume Conservação', object: 'Manutenção de áreas comuns', cycle: 'V01', start: '2025-09-01', end: '2026-08-31', status: 'Encerrado', history: ['V01 · 01/09/2025 a 31/08/2026 · período concluído', 'Encerramento administrativo registrado em 04/09/2026.'] },
  { id: 'CT-106', provider: 'Aurora Equipamentos', object: 'Manutenção de elevadores', cycle: 'V03', start: '2026-05-18', end: '2026-09-17', status: 'Em acompanhamento', history: ['V02 · 18/01/2026 a 17/05/2026 · período concluído', 'V03 · 18/05/2026 a 17/09/2026 · período em acompanhamento'] }
];
const FORECASTS = [
  { id: 'CT-101', label: 'CT-101 · Conservação predial', serviceBalance: '48000,00', serviceMonthly: '12500,00', materialBalance: '9600,00', materialMonthly: '1800,00' },
  { id: 'CT-102', label: 'CT-102 · Climatização', serviceBalance: '18500,00', serviceMonthly: '7200,00', materialBalance: '3100,00', materialMonthly: '950,00' },
  { id: 'CT-106', label: 'CT-106 · Elevadores', serviceBalance: '15200,00', serviceMonthly: '4200,00', materialBalance: '2800,00', materialMonthly: '' }
];
const PAYMENT_SEED = [
  { id: 'PG-201', contract: 'CT-101', provider: 'Alameda Serviços', description: 'Conservação predial', competence: '2026-09', amount: 1250000, due: '2026-09-25', received: '2026-09-10', protocol: 'PR-1201', stage: 'Em conferência', paidAt: '', documents: { invoice: true, reference: true, confirmation: false } },
  { id: 'PG-202', contract: 'CT-102', provider: 'Horizonte Climatização', description: 'Manutenção de climatização', competence: '2026-08', amount: 720000, due: '2026-09-12', received: '2026-09-02', protocol: 'PR-1202', stage: 'Encaminhado', paidAt: '', documents: { invoice: true, reference: true, confirmation: true } },
  { id: 'PG-203', contract: 'CT-103', provider: 'Cedro Instalações', description: 'Adequações elétricas', competence: '2026-09', amount: 435000, due: '2026-09-17', received: '2026-09-11', protocol: 'PR-1203', stage: 'Em conferência', paidAt: '', documents: { invoice: true, reference: false, confirmation: false } },
  { id: 'PG-204', contract: 'CT-106', provider: 'Aurora Equipamentos', description: 'Manutenção de elevadores', competence: '2026-08', amount: 420000, due: '2026-09-08', received: '2026-09-01', protocol: 'PR-1204', stage: 'Pago', paidAt: '2026-09-05', documents: { invoice: true, reference: true, confirmation: true } },
  { id: 'PG-205', contract: 'CT-101', provider: 'Alameda Serviços', description: 'Materiais de conservação', competence: '2026-09', amount: 180000, due: '2026-09-28', received: '2026-09-15', protocol: 'PR-1205', stage: 'Encaminhado', paidAt: '', documents: { invoice: true, reference: true, confirmation: true } }
];

const STORAGE_KEY = 'kleyton-portfolio-workspace-v1';
const clone = value => structuredClone(value);
const forecastKeys = ['serviceBalance', 'serviceMonthly', 'materialBalance', 'materialMonthly', 'months'];
const documentKeys = ['invoice', 'reference', 'confirmation'];
export const getInitialWorkspace = () => ({ contracts: clone(CONTRACTS), payments: clone(PAYMENT_SEED), forecasts: FORECASTS.map(row => ({ ...row, months: '3' })) });
function validForecastPatch(patch) {
  return patch && !Array.isArray(patch) && typeof patch === 'object' && Object.keys(patch).every(key => forecastKeys.includes(key) && typeof patch[key] === 'string' && patch[key].length <= 32);
}
function restoredState(raw) {
  const initial = getInitialWorkspace();
  if (!raw || raw.version !== 1 || !Array.isArray(raw.payments) || !Array.isArray(raw.forecasts)) return getInitialWorkspace();
  const knownPayments = new Map(initial.payments.map(row => [row.id, row]));
  const knownForecasts = new Map(initial.forecasts.map(row => [row.id, row]));
  if (raw.payments.length !== knownPayments.size || new Set(raw.payments.map(row => row?.id)).size !== knownPayments.size || raw.forecasts.length !== knownForecasts.size || new Set(raw.forecasts.map(row => row?.id)).size !== knownForecasts.size) return getInitialWorkspace();
  for (const saved of raw.payments) {
    const row = knownPayments.get(saved?.id);
    if (!row || !saved.documents || !documentKeys.every(key => typeof saved.documents[key] === 'boolean') || !['Em conferência', 'Encaminhado', 'Pago'].includes(saved.stage)) return getInitialWorkspace();
    if (saved.stage !== 'Em conferência' && !documentsComplete(saved)) return getInitialWorkspace();
    if (saved.stage === 'Pago' ? (!validDate(saved.paidAt) || saved.paidAt < row.received || saved.paidAt > REFERENCE_DATE) : saved.paidAt !== '') return getInitialWorkspace();
    row.documents = Object.fromEntries(documentKeys.map(key => [key, saved.documents[key]]));
    row.stage = saved.stage; row.paidAt = saved.paidAt;
  }
  for (const saved of raw.forecasts) {
    const row = knownForecasts.get(saved?.id);
    const patch = Object.fromEntries(forecastKeys.map(key => [key, saved?.[key]]));
    if (!row || !validForecastPatch(patch)) return getInitialWorkspace();
    Object.assign(row, patch);
  }
  return initial;
}
export function createWorkspaceStore(storage = null) {
  let state = getInitialWorkspace();
  const listeners = new Set();
  try { const raw = storage?.getItem(STORAGE_KEY); if (raw) state = restoredState(JSON.parse(raw)); } catch { /* Browsers may disable storage; the visit still works in memory. */ }
  const getWorkspace = () => clone(state);
  function changed() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, payments: state.payments, forecasts: state.forecasts })); } catch { /* Keep working in memory. */ }
    for (const listener of listeners) listener(getWorkspace());
  }
  function updateForecast(id, patch) {
    const row = state.forecasts.find(item => item.id === id);
    if (!row || !validForecastPatch(patch)) return false;
    Object.assign(row, patch); changed(); return true;
  }
  function updatePayment(id, patch) {
    const row = state.payments.find(item => item.id === id);
    if (!row || !patch || typeof patch !== 'object' || Object.keys(patch).some(key => !['documents', 'stage', 'paidAt'].includes(key))) return false;
    const next = clone(row);
    if ('documents' in patch) {
      if (row.stage !== 'Em conferência' || !patch.documents || typeof patch.documents !== 'object' || Object.entries(patch.documents).some(([key, value]) => !documentKeys.includes(key) || typeof value !== 'boolean')) return false;
      Object.assign(next.documents, patch.documents);
    }
    if ('stage' in patch && patch.stage !== row.stage) {
      if (patch.stage === 'Encaminhado' && paymentActionAllowed(next, 'forward')) next.stage = 'Encaminhado';
      else if (patch.stage === 'Pago' && paymentActionAllowed(next, 'pay', patch.paidAt)) { next.stage = 'Pago'; next.paidAt = patch.paidAt; }
      else return false;
    }
    if ('paidAt' in patch && patch.paidAt !== next.paidAt) return false;
    Object.assign(row, next); changed(); return true;
  }
  function resetWorkspace() { state = getInitialWorkspace(); changed(); }
  function refreshWorkspace() {
    if (!storage) return;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const next = raw ? restoredState(JSON.parse(raw)) : getInitialWorkspace();
      if (JSON.stringify(next) === JSON.stringify(state)) return;
      state = next;
      for (const listener of listeners) listener(getWorkspace());
    } catch { /* Preserve the working visit when storage cannot be read. */ }
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function getLedgerRecords() { return state.payments.map(row => ({ id: row.id, contract: row.contract, category: 'contratos', description: row.description, month: row.competence, cents: row.amount, due: row.due, paidOn: row.paidAt, documents: documentsComplete(row) })); }
  return { getWorkspace, updatePayment, updateForecast, resetWorkspace, refreshWorkspace, subscribe, getLedgerRecords };
}
let browserStorage = null;
try { browserStorage = globalThis.sessionStorage || null; } catch { /* Storage is optional. */ }
const store = createWorkspaceStore(browserStorage);
export const { getWorkspace, updatePayment, updateForecast, resetWorkspace, subscribe, getLedgerRecords } = store;
if (typeof globalThis.addEventListener === 'function') globalThis.addEventListener('pageshow', event => { if (event.persisted) store.refreshWorkspace(); });
