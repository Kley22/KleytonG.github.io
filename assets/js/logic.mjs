// Pure domain functions. Values are demonstrative, never institutional data.
export const money = value => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(value);
export const dateBR = value => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : '—';
export function daysBetween(start, end) {
  return Math.round((Date.parse(end+'T00:00:00Z') - Date.parse(start+'T00:00:00Z')) / 86400000);
}
export function contractStatus(row, reference, threshold=60) {
  if (row.closed) return 'Encerrado';
  if (daysBetween(reference, row.start) > 0) return 'Não iniciado';
  const days = daysBetween(reference, row.end);
  return days < 0 ? 'Vencido' : days <= threshold ? 'A renovar' : 'Vigente';
}
export function projectBalance(balance, monthly, months) {
  const projectedCents = Math.round(balance*100) - Math.round(monthly*100) * months;
  return {remaining:projectedCents/100, spend:Math.round(monthly*100)*months/100, risk:projectedCents<0};
}
export function paymentStatus(row, reference) {
  if (row.paid) return 'Pago';
  return daysBetween(reference,row.due) < 0 ? 'Em atraso' : 'A pagar';
}
export function adjustment(base, percent) {
  const added = Math.round(base*percent)/100;
  return {added, total:Math.round((base+added)*100)/100};
}
export function fleetMetrics(previous, current, litres, maintenance) {
  if (![previous,current,litres,maintenance].every(Number.isFinite) || current <= previous || previous<0 || litres<=0 || maintenance<0) throw new RangeError('Informe hodômetros crescentes e litros maiores que zero.');
  return {distance:current-previous, efficiency:(current-previous)/litres, untilMaintenance:maintenance-current};
}
