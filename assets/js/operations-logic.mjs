import { projectComponent } from './finance-logic.mjs';

/** Calculations used by the interactive portfolio examples. Amounts are integer cents. */
export function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function obligationStatus(record, reference) {
  if (!validDate(reference) || !validDate(record.due)) throw new RangeError('Informe uma data válida.');
  if (record.paidOn && validDate(record.paidOn) && record.paidOn <= reference) return 'paid';
  return record.due < reference ? 'overdue' : 'open';
}

export function filterObligations(records, { property = 'all', type = 'all', status = 'all', month = 'all', category = 'all', contract = 'all', reference = '2026-09-17' } = {}) {
  return records.filter(record =>
    (property === 'all' || record.property === property) &&
    (type === 'all' || record.type === type) &&
    (month === 'all' || record.month === month) &&
    (category === 'all' || record.category === category) &&
    (contract === 'all' || record.contract === contract) &&
    (status === 'all' || (status === 'documents' ? !record.documents : obligationStatus(record, reference) === status))
  );
}

export function summarizeObligations(records, reference = '2026-09-17') {
  const result = { count: records.length, totalCents: 0, paidCents: 0, openCents: 0, overdueCents: 0, pendingDocuments: 0 };
  const identifiers = new Set();
  for (const record of records) {
    if (identifiers.has(record.id)) throw new RangeError(`Obrigação repetida: ${record.id}`);
    if (!Number.isSafeInteger(record.cents) || record.cents < 0) throw new RangeError('O valor deve ser não negativo e informado em centavos.');
    identifiers.add(record.id);
    const status = obligationStatus(record, reference);
    result.totalCents += record.cents;
    if (status === 'paid') result.paidCents += record.cents;
    else result.openCents += record.cents;
    if (status === 'overdue') result.overdueCents += record.cents;
    if (!record.documents) result.pendingDocuments += 1;
  }
  return result;
}

export function groupObligations(records, reference = '2026-09-17') {
  // Validate the complete set before splitting it: one obligation can have one origin only.
  summarizeObligations(records, reference);
  const categories = [...new Set(records.map(record => record.category))];
  return categories.map(category => ({ category, ...summarizeObligations(records.filter(record => record.category === category), reference) }));
}

export function calculateConsumption({ previous, current, liters, fullToFull }) {
  const values = [previous, current, liters];
  if (values.some(value => value === '' || value === null || value === undefined || !Number.isFinite(Number(value)))) {
    return { error: 'Preencha as duas leituras e o volume abastecido com números válidos.' };
  }
  const [start, end, volume] = values.map(Number);
  if (start < 0 || end < 0) return { error: 'As leituras do hodômetro não podem ser negativas.' };
  if (end <= start) return { error: 'A leitura final precisa ser maior que a leitura inicial. Confira a sequência do hodômetro.' };
  if (volume <= 0) return { error: 'O volume abastecido precisa ser maior que zero.' };
  if (!fullToFull) return { distance: end - start, error: 'Para calcular km/l, use um intervalo entre dois tanques completos e some os litros repostos nesse intervalo.' };
  const efficiency = (end - start) / volume;
  if (!Number.isFinite(efficiency)) return { error: 'Confira a escala dos valores informados antes de calcular o consumo.' };
  return { distance: end - start, efficiency };
}

/** Project each financial component independently; missing premises never become zero. */
export function summarizeForecasts(forecasts) {
  return forecasts.map(forecast => {
    const service = projectComponent(forecast.serviceBalance, forecast.serviceMonthly, forecast.months);
    const material = projectComponent(forecast.materialBalance, forecast.materialMonthly, forecast.months);
    const components = [service, material];
    return {
      ...forecast,
      service,
      material,
      risk: components.some(component => component.status === 'valid' && component.risk),
      unavailable: components.some(component => component.status !== 'valid')
    };
  });
}
