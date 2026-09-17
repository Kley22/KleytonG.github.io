// Monetary amounts in the published dataset are BRL; arithmetic uses integer cents.
export const toCents = value => typeof value === 'number' && Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) : null;
export const money = cents => cents == null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const decimal = value => value == null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export const dateLabel = value => validDate(value) ? value.split('-').reverse().join('/') : 'Não informado';
export function contractStatus(row, reference, window = 30) {
  if (row.status === 'Encerrado') return { key: 'closed', label: 'Encerrado', tone: '' };
  if (!validDate(row.start) || !validDate(row.end) || !validDate(reference)) return { key: 'missing', label: 'Conferir datas', tone: 'is-warning' };
  if (row.start > reference) return { key: 'future', label: 'Ainda não iniciado', tone: '' };
  const days = Math.round((Date.parse(`${row.end}T00:00:00Z`) - Date.parse(`${reference}T00:00:00Z`)) / 86400000);
  if (days < 0) return { key: 'expired', label: `Prazo terminado há ${-days} dias`, tone: 'is-danger', days };
  if (days === 0) return { key: 'attention', label: 'Termina hoje', tone: 'is-warning', days };
  if (days <= window) return { key: 'attention', label: `Termina em ${days} dias`, tone: 'is-warning', days };
  return { key: 'current', label: 'Dentro do prazo', tone: 'is-success', days };
}
export function paymentStatus(row, reference) {
  if (validDate(row.paidOn)) return { key: 'paid', label: 'Pago', tone: 'is-success' };
  if (!validDate(row.due) || !validDate(reference)) return { key: 'missing', label: 'Conferir vencimento', tone: 'is-warning' };
  return row.due < reference ? { key: 'overdue', label: 'Vencido', tone: 'is-danger' } : row.due === reference ? { key: 'today', label: 'Vence hoje', tone: 'is-warning' } : { key: 'open', label: 'A vencer', tone: '' };
}
export function paymentSummary(records, reference) {
  return records.reduce((out, row) => {
    const cents = toCents(row.amount); if (cents == null) return out;
    const status = paymentStatus(row, reference).key;
    out.total += cents; out[status === 'paid' ? 'paid' : 'open'] += cents;
    if (status === 'overdue') out.overdue += cents;
    if (row.documents !== 'Completa') out.documents++;
    out.count++; return out;
  }, { total: 0, paid: 0, open: 0, overdue: 0, documents: 0, count: 0 });
}
export function paymentPatch(row, action, paidOn = '') {
  if (action === 'documents' && !row.paidOn) return { documents: 'Completa' };
  if (action === 'forward' && row.documents === 'Completa' && row.stage === 'Em conferência') return { stage: 'Encaminhado' };
  if (action === 'pay' && row.documents === 'Completa' && (!row.stage || row.stage === 'Encaminhado') && validDate(paidOn)) return { paidOn, ...(row.stage ? { stage: 'Pago' } : {}) };
  return null;
}
export function projectBalance(balance, monthly, months) {
  if (balance == null || monthly == null) return { valid: false, reason: 'Preencha o saldo e o consumo mensal para calcular.' };
  if (![balance, monthly].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0) || !Number.isInteger(months) || months < 1 || months > 60) return { valid: false, reason: 'Use valores a partir de zero e um horizonte de 1 a 60 meses.' };
  const available = toCents(balance), spend = toCents(monthly) * months, remaining = available - spend;
  return { valid: true, available, spend, remaining, risk: remaining < 0 };
}
export function parkingMonthly(row) {
  return Number.isInteger(row.spaces) && row.spaces > 0 && toCents(row.rate) > 0 ? row.spaces * toCents(row.rate) : null;
}
export function fuelResult(row) {
  const complete = [row.previous, row.current, row.liters, row.pricePerLiter].every(value => typeof value === 'number' && Number.isFinite(value));
  if (!complete || row.previous < 0 || row.current <= row.previous || row.liters <= 0 || row.pricePerLiter <= 0) return { valid: false, reason: 'Informe leituras crescentes, litros e preço positivos.' };
  const distance = row.current - row.previous;
  return { valid: true, distance, cost: Math.round(row.liters * toCents(row.pricePerLiter)), consumption: row.full ? distance / row.liters : null, liters: row.liters, full: row.full };
}
export function summarizeFuel(rows) {
  const valid = rows.map(fuelResult).filter(row => row.valid), full = valid.filter(row => row.full);
  const distance = full.reduce((sum, row) => sum + row.distance, 0), liters = full.reduce((sum, row) => sum + row.liters, 0);
  return { count: valid.length, full: full.length, partial: valid.length - full.length, cost: valid.reduce((sum, row) => sum + row.cost, 0), distance, liters, consumption: liters ? distance / liters : null };
}
export function referencePrice(values, method = 'median') {
  const quotes = values.map(toCents).filter(value => value != null && value > 0).sort((a, b) => a - b);
  if (!quotes.length) return { cents: null, count: 0 };
  let cents;
  if (method === 'mean') cents = Math.round(quotes.reduce((sum, value) => sum + value, 0) / quotes.length);
  else { const half = Math.floor(quotes.length / 2); cents = quotes.length % 2 ? quotes[half] : Math.round((quotes[half - 1] + quotes[half]) / 2); }
  return { cents, count: quotes.length };
}
export function priceComparison(items, method = 'median') {
  const lines = items.map(item => {
    const reference = referencePrice(item.research, method);
    return { id: item.id, quantity: item.quantity, reference, total: reference.cents == null || !Number.isInteger(item.quantity) || item.quantity < 1 ? null : reference.cents * item.quantity,
      proposals: item.suppliers.map(value => value == null || value <= 0 || !Number.isInteger(item.quantity) || item.quantity < 1 ? null : toCents(value) * item.quantity) };
  });
  const referenceComplete = lines.every(line => line.total != null), referenceTotal = referenceComplete ? lines.reduce((sum, line) => sum + line.total, 0) : null;
  const proposals = [0, 1, 2].map(index => {
    const complete = lines.every(line => line.proposals[index] != null), partial = lines.reduce((sum, line) => sum + (line.proposals[index] ?? 0), 0);
    return { index, complete, total: complete ? partial : null, partial, missing: lines.filter(line => line.proposals[index] == null).length, variation: complete && referenceTotal > 0 ? (partial - referenceTotal) / referenceTotal * 100 : null };
  });
  const complete = proposals.filter(proposal => proposal.complete), lowest = complete.length ? Math.min(...complete.map(proposal => proposal.total)) : null;
  return { lines, referenceTotal, proposals, lowest, lowestIndexes: proposals.filter(proposal => proposal.complete && proposal.total === lowest).map(proposal => proposal.index) };
}
