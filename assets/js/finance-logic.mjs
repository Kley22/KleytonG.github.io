const DAY = 86400000;
export const REFERENCE_DATE = '2026-09-17';
export const formatMoney = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const formatDate = value => validDate(value) ? value.split('-').reverse().join('/') : '—';
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function daysBetween(start, end) {
  return validDate(start) && validDate(end) ? (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY : null;
}
export function contractAlert(row, reference, threshold = 60) {
  if (!validDate(reference) || !validDate(row.start) || !validDate(row.end) || row.end < row.start || !Number.isInteger(threshold) || threshold < 0) return { key: 'unavailable', label: 'Conferir datas', tone: 'is-warning', days: null };
  const days = daysBetween(reference, row.end);
  if (row.status === 'Encerrado') return { key: 'closed', label: 'Encerramento registrado', tone: '', days };
  if (reference < row.start) return { key: 'future', label: 'Ainda não iniciado', tone: '', days };
  if (days < 0) return { key: 'expired', label: `Prazo terminado há ${Math.abs(days)} dia${days === -1 ? '' : 's'}`, tone: 'is-danger', days };
  if (days === 0) return { key: 'attention', label: 'Termina hoje', tone: 'is-warning', days };
  if (days <= threshold) return { key: 'attention', label: `Termina em ${days} dia${days === 1 ? '' : 's'}`, tone: 'is-warning', days };
  return { key: 'current', label: `Prazo de ${days} dias`, tone: 'is-success', days };
}
export function parseMoney(value) {
  const text = String(value ?? '').trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!text) return { status: 'missing' };
  let normalized;
  if (/^-?\d+(?:[.,]\d{1,2})?$/.test(text)) normalized = text.replace(',', '.');
  else if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text)) normalized = text.replace(/\./g, '').replace(',', '.');
  else return { status: 'invalid' };
  const negative = normalized.startsWith('-');
  const [whole, fraction = ''] = normalized.replace(/^-/, '').split('.');
  const cents = (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * (negative ? -1 : 1);
  return Number.isSafeInteger(cents) ? { status: 'valid', cents } : { status: 'invalid' };
}
export function projectComponent(balanceValue, monthlyValue, monthsValue) {
  const balance = parseMoney(balanceValue);
  const monthly = parseMoney(monthlyValue);
  const horizon = String(monthsValue ?? '').trim();
  if (balance.status === 'missing' || monthly.status === 'missing' || !horizon) return { status: 'missing', message: 'Preencha saldo, consumo mensal e horizonte para calcular.' };
  if (balance.status !== 'valid' || monthly.status !== 'valid' || monthly.cents < 0 || !/^\d+$/.test(horizon) || Number(horizon) < 1 || Number(horizon) > 60) return { status: 'invalid', message: 'Use valores com até duas casas decimais, consumo não negativo e horizonte de 1 a 60 meses.' };
  const months = Number(horizon);
  const spend = monthly.cents * months;
  const remaining = balance.cents - spend;
  if (!Number.isSafeInteger(spend) || !Number.isSafeInteger(remaining)) return { status: 'invalid', message: 'Os valores informados excedem o limite do cálculo.' };
  return { status: 'valid', balance: balance.cents, monthly: monthly.cents, months, spend, remaining, risk: remaining < 0 };
}
export function paymentStatus(row, reference = REFERENCE_DATE) {
  if (row.paidAt && validDate(row.paidAt) && row.paidAt <= reference) return { key: 'paid', label: 'Pago', tone: 'is-success' };
  const days = daysBetween(reference, row.due);
  if (days === null) return { key: 'unavailable', label: 'Conferir vencimento', tone: 'is-warning' };
  if (days < 0) return { key: 'overdue', label: 'Vencido, sem pagamento registrado', tone: 'is-danger' };
  if (days === 0) return { key: 'today', label: 'Vence hoje', tone: 'is-warning' };
  return { key: 'open', label: 'A vencer', tone: '' };
}
export const documentsComplete = row => Object.values(row.documents).every(Boolean);
export function paymentActionAllowed(row, action, date = REFERENCE_DATE) {
  if (action === 'forward') return row.stage === 'Em conferência' && documentsComplete(row);
  if (action === 'pay') return row.stage === 'Encaminhado' && validDate(date) && date >= row.received && date <= REFERENCE_DATE;
  return false;
}
