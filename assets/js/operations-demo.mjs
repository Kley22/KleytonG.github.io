import { validDate, normalizeText, filterObligations, summarizeObligations, groupObligations, calculateConsumption, obligationStatus, summarizeForecasts } from './operations-logic.mjs';

import { REFERENCE_DATE as REFERENCE, getWorkspace, getLedgerRecords, subscribe } from './workspace.mjs';
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const decimal = value => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const dateLabel = value => value.split('-').reverse().join('/');
const categories = { contratos: 'Contratos', imoveis: 'Imóveis', frota: 'Frota' };
const statuses = { paid: ['Pago', 'is-success'], overdue: ['Vencido', 'is-danger'], open: ['Em prazo', ''] };

// These examples are authored for the public demonstration, independently of work records.
const properties = { p1: 'Unidade Aurora', p2: 'Unidade Jardim', p3: 'Unidade Horizonte' };
const propertyRecords = [
  { id: 'IM-01', property: 'p1', type: 'Aluguel', cents: 420000, due: '2026-09-10', paidOn: '2026-09-09', documents: true },
  { id: 'IM-02', property: 'p1', type: 'Condomínio', cents: 68000, due: '2026-09-12', paidOn: '', documents: false },
  { id: 'IM-03', property: 'p1', type: 'IPTU', cents: 23500, due: '2026-09-25', paidOn: '', documents: true },
  { id: 'IM-04', property: 'p2', type: 'Aluguel', cents: 315000, due: '2026-09-20', paidOn: '', documents: true },
  { id: 'IM-05', property: 'p2', type: 'Condomínio', cents: 52000, due: '2026-09-15', paidOn: '2026-09-16', documents: true },
  { id: 'IM-06', property: 'p2', type: 'IPTU', cents: 18750, due: '2026-09-25', paidOn: '', documents: false },
  { id: 'IM-07', property: 'p3', type: 'Aluguel', cents: 560000, due: '2026-09-05', paidOn: '2026-09-04', documents: true },
  { id: 'IM-08', property: 'p3', type: 'Taxa', cents: 8600, due: '2026-09-30', paidOn: '', documents: false }
].map(record => ({ ...record, category: 'imoveis', month: '2026-09', description: `${properties[record.property]} · ${record.type}` }));

const occurrences = [
  { id: 'OC-101', vehicle: 'Veículo 01', date: '2026-09-15', reason: 'Dois abastecimentos no mesmo dia: conferir os comprovantes.', state: 'pending' },
  { id: 'OC-102', vehicle: 'Veículo 02', date: '2026-09-14', reason: 'Leitura inferior à anterior: conferir a sequência do hodômetro.', state: 'pending' },
  { id: 'OC-103', vehicle: 'Veículo 03', date: '2026-09-12', reason: 'Comprovante de abastecimento aguardando conferência.', state: 'pending' },
  { id: 'OC-104', vehicle: 'Veículo 01', date: '2026-09-10', reason: 'Identificação do veículo conferida no lançamento.', state: 'reviewed' },
  { id: 'OC-105', vehicle: 'Veículo 04', date: '2026-09-08', reason: 'Leitura do hodômetro conferida com o comprovante.', state: 'reviewed' }
];

const standaloneRecords = [...propertyRecords];
for (const [month, multiplier] of [['2026-08', 0.96], ['2026-10', 1.02]]) {
  propertyRecords.forEach((record, index) => standaloneRecords.push({
    ...record,
    id: `${record.id}-${month}`,
    month,
    cents: Math.round(record.cents * multiplier),
    due: `${month}-${record.due.slice(-2)}`,
    paidOn: month === '2026-08' ? `${month}-${record.due.slice(-2)}` : '',
    documents: month === '2026-08' || index % 3 !== 0
  }));
}
for (const [month, multiplier] of [['2026-08', 0.92], ['2026-09', 1], ['2026-10', 1.04]]) {
  const templates = [
    ['FR-01', 'frota', 'Abastecimentos · Veículo 01', 36500, '08', true],
    ['FR-02', 'frota', 'Abastecimentos · Veículo 02', 28700, '18', false],
    ['FR-03', 'frota', 'Revisão · Veículo 03', 89500, '24', false]
  ];
  templates.forEach(([id, category, description, cents, day, settled], index) => standaloneRecords.push({
    id: `${id}-${month}`, category, description, type: category === 'contratos' ? 'Contrato' : 'Despesa de frota', month,
    cents: Math.round(cents * multiplier), due: `${month}-${day}`,
    paidOn: month === '2026-08' || (month === '2026-09' && settled) ? `${month}-${day}` : '',
    documents: month === '2026-08' || index !== 2
  }));
}

export const getDashboardRecords = () => [...structuredClone(standaloneRecords), ...getLedgerRecords()];

function node(tag, className = '', text = '') {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text) result.textContent = text;
  return result;
}
function field(id, label, control, help = '') {
  const wrapper = node('div', 'demo-field');
  const title = node('label', '', label);
  title.htmlFor = id;
  control.id = id;
  wrapper.append(title, control);
  if (help) {
    const description = node('small', 'demo-help', help);
    description.id = `${id}-help`;
    control.setAttribute('aria-describedby', description.id);
    wrapper.append(description);
  }
  return wrapper;
}
function select(options) {
  const control = document.createElement('select');
  for (const [value, label] of options) {
    const option = node('option', '', label);
    option.value = value;
    control.append(option);
  }
  return control;
}
function input(type, value = '') {
  const control = document.createElement('input');
  control.type = type;
  control.value = value;
  return control;
}
function live(id) {
  const status = node('p', 'demo-help');
  status.id = id;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  return status;
}
function metric(key, label) {
  const wrapper = node('div', 'demo-metric');
  const value = node('strong', '', '—');
  value.dataset.metric = key;
  wrapper.append(node('span', '', label), value);
  return { wrapper, value };
}
function metrics(definitions) {
  const wrapper = node('div', 'demo-metrics');
  const values = {};
  for (const [key, label] of definitions) {
    const item = metric(key, label);
    wrapper.append(item.wrapper);
    values[key] = item.value;
  }
  return { wrapper, values };
}
function table(label, headers, id = '') {
  const region = node('div', 'demo-table-wrap');
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', label);
  region.tabIndex = 0;
  const element = node('table', 'demo-table');
  if (id) element.id = id;
  const head = document.createElement('thead');
  const row = document.createElement('tr');
  headers.forEach(header => {
    const cell = node('th', '', header);
    cell.scope = 'col';
    row.append(cell);
  });
  const body = document.createElement('tbody');
  head.append(row);
  element.append(head, body);
  region.append(element);
  return { region, body };
}
function addRow(body, values) {
  const row = document.createElement('tr');
  values.forEach((value, index) => {
    const cell = document.createElement('td');
    cell.dataset.label = body.closest('table').tHead.rows[0].cells[index]?.textContent || '';
    if (value instanceof Node) cell.append(value);
    else cell.textContent = String(value);
    row.append(cell);
  });
  body.append(row);
  return row;
}
function emptyRow(body, columns, text = 'Nenhum registro corresponde aos filtros selecionados.') {
  const cell = node('td', 'demo-empty', text);
  cell.colSpan = columns;
  const row = document.createElement('tr');
  row.append(cell);
  body.append(row);
}
function statusBadge(status) {
  const [label, className] = statuses[status];
  return node('span', `demo-status ${className}`.trim(), label);
}
function button(label, id = '') {
  const element = node('button', 'demo-button', label);
  element.type = 'button';
  if (id) element.id = id;
  return element;
}

function mountProperties(root) {
  const intro = node('p', 'demo-help', 'Explore as obrigações de setembro de 2026. Combine os filtros e mude a data de referência para acompanhar os vencimentos.');
  const toolbar = node('div', 'demo-toolbar');
  const property = select([['all', 'Todos os imóveis'], ...Object.entries(properties)]);
  const type = select([['all', 'Todas as obrigações'], ...['Aluguel', 'Condomínio', 'IPTU', 'Taxa'].map(value => [value, value])]);
  const status = select([['all', 'Todas as situações'], ['open', 'Em prazo'], ['overdue', 'Vencido'], ['paid', 'Pago'], ['documents', 'Documentação pendente']]);
  const reference = input('date', REFERENCE);
  toolbar.append(field('property-filter', 'Imóvel', property), field('property-type', 'Obrigação', type), field('property-status', 'Situação', status), field('property-reference', 'Data de referência', reference));
  const cards = metrics([['property-open', 'Em aberto'], ['property-paid', 'Pago até a referência'], ['property-overdue', 'Vencido em aberto'], ['property-documents', 'Documentação pendente']]);
  const summary = live('property-results');
  const error = node('p', 'demo-error');
  error.id = 'property-error';
  error.setAttribute('role', 'alert');
  const grid = table('Obrigações imobiliárias filtradas', ['Imóvel', 'Obrigação', 'Vencimento', 'Valor', 'Situação', 'Documentos'], 'property-records');
  const reset = button('Restaurar filtros', 'property-reset');
  const challenge = button('Encontrar documentos pendentes', 'property-challenge');
  const actions = node('div', 'demo-actions');
  actions.append(challenge, reset);
  const help = node('p', 'demo-help', 'Em aberto inclui obrigações vencidas e ainda em prazo. Documentação pendente é acompanhada separadamente da situação do pagamento.');
  root.replaceChildren(intro, toolbar, cards.wrapper, summary, error, grid.region, help, actions);
  function update() {
    const isValid = validDate(reference.value);
    error.textContent = isValid ? '' : 'Selecione uma data de referência válida.';
    reference.setAttribute('aria-invalid', String(!isValid));
    cards.wrapper.hidden = !isValid;
    grid.region.hidden = !isValid;
    if (!isValid) { summary.textContent = 'Informe a data para atualizar a consulta.'; return; }
    const records = filterObligations(propertyRecords, { property: property.value, type: type.value, status: status.value, reference: reference.value });
    const totals = summarizeObligations(records, reference.value);
    cards.values['property-open'].textContent = money(totals.openCents);
    cards.values['property-paid'].textContent = money(totals.paidCents);
    cards.values['property-overdue'].textContent = money(totals.overdueCents);
    cards.values['property-documents'].textContent = String(totals.pendingDocuments);
    summary.textContent = `${records.length} ${records.length === 1 ? 'obrigação exibida' : 'obrigações exibidas'} · referência ${dateLabel(reference.value)} · total ${money(totals.totalCents)}.`;
    grid.body.replaceChildren();
    records.forEach(record => addRow(grid.body, [properties[record.property], record.type, dateLabel(record.due), money(record.cents), statusBadge(obligationStatus(record, reference.value)), node('span', `demo-status ${record.documents ? 'is-success' : 'is-warning'}`, record.documents ? 'Conferidos' : 'Pendente')]));
    if (!records.length) emptyRow(grid.body, 6);
  }
  [property, type, status, reference].forEach(control => control.addEventListener('change', update));
  reference.addEventListener('input', update);
  challenge.addEventListener('click', () => { property.value = 'all'; type.value = 'all'; status.value = 'documents'; reference.value = REFERENCE; update(); status.focus(); });
  reset.addEventListener('click', () => { property.value = 'all'; type.value = 'all'; status.value = 'all'; reference.value = REFERENCE; update(); });
  update();
}

function mountFleet(root) {
  const calculator = node('section');
  calculator.setAttribute('aria-labelledby', 'fleet-calculator-title');
  const heading = node('h3', '', 'Conferência de consumo');
  heading.id = 'fleet-calculator-title';
  const intro = node('p', 'demo-help', 'Altere as leituras e os litros para conferir o consumo no intervalo. O cálculo usa a distância entre duas leituras de tanque completo.');
  const toolbar = node('div', 'demo-toolbar');
  const previous = input('number', '12400');
  const current = input('number', '12820');
  const liters = input('number', '35');
  [previous, current, liters].forEach(control => { control.min = '0'; control.step = '0.01'; control.inputMode = 'decimal'; });
  toolbar.append(field('fleet-previous', 'Hodômetro inicial (km)', previous), field('fleet-current', 'Hodômetro final (km)', current), field('fleet-liters', 'Litros repostos no intervalo', liters));
  const full = input('checkbox');
  full.checked = true;
  full.id = 'fleet-full';
  const fullLabel = node('label', 'demo-help');
  fullLabel.htmlFor = full.id;
  fullLabel.append(full, document.createTextNode(' As duas leituras são de tanque completo.'));
  const cards = metrics([['fleet-distance', 'Distância no intervalo'], ['fleet-efficiency', 'Consumo médio']]);
  const calculationSummary = live('fleet-calculation-results');
  const error = node('p', 'demo-error');
  error.id = 'fleet-calculation-error';
  error.setAttribute('role', 'alert');
  [previous, current, liters, full].forEach(control => control.setAttribute('aria-describedby', error.id));
  calculator.append(heading, intro, toolbar, fullLabel, cards.wrapper, calculationSummary, error);

  const review = node('section');
  review.setAttribute('aria-labelledby', 'fleet-occurrences-title');
  const reviewHeading = node('h3', '', 'Acompanhamento de ocorrências');
  reviewHeading.id = 'fleet-occurrences-title';
  const reviewIntro = node('p', 'demo-help', 'Localize uma ocorrência e marque a conferência. O alerta aponta o que verificar; dois abastecimentos no mesmo dia, por exemplo, podem ser válidos.');
  const reviewToolbar = node('div', 'demo-toolbar');
  const search = input('search');
  search.placeholder = 'Veículo, ocorrência ou motivo';
  const status = select([['all', 'Todas as situações'], ['pending', 'A conferir'], ['reviewed', 'Conferidas']]);
  reviewToolbar.append(field('fleet-search', 'Buscar ocorrência', search), field('fleet-status', 'Situação da conferência', status));
  const summary = live('fleet-results');
  const grid = table('Ocorrências de frota filtradas', ['Ocorrência', 'Veículo', 'Data', 'Ponto de conferência', 'Situação', 'Ação'], 'fleet-records');
  const reset = button('Restaurar demonstração', 'fleet-reset');
  const states = new Map(occurrences.map(record => [record.id, record.state]));
  const fleetStorageKey = 'kleyton-portfolio-fleet-v1';
  try {
    const saved = JSON.parse(sessionStorage.getItem(fleetStorageKey) || '{}');
    occurrences.forEach(record => { if (['pending', 'reviewed'].includes(saved[record.id])) states.set(record.id, saved[record.id]); });
  } catch { /* A browser with disabled storage can still use the demonstration. */ }
  function saveStates() { try { sessionStorage.setItem(fleetStorageKey, JSON.stringify(Object.fromEntries(states))); } catch { /* Keep the in-memory state. */ } }
  const challenge = button('Localizar leituras para conferir', 'fleet-challenge');
  const actions = node('div', 'demo-actions');
  actions.append(challenge, reset);
  review.append(reviewHeading, reviewIntro, reviewToolbar, summary, grid.region, node('p', 'demo-help', 'As conferências são mantidas nesta aba durante a navegação. Use “Restaurar demonstração” para começar de novo.'), actions);
  root.replaceChildren(calculator, review);
  function calculate() {
    const result = calculateConsumption({ previous: previous.value, current: current.value, liters: liters.value, fullToFull: full.checked });
    cards.values['fleet-distance'].textContent = Number.isFinite(result.distance) ? `${decimal(result.distance)} km` : '—';
    cards.values['fleet-efficiency'].textContent = Number.isFinite(result.efficiency) ? `${decimal(result.efficiency)} km/l` : '—';
    error.textContent = result.error || '';
    calculationSummary.textContent = result.error ? 'Consumo não calculado. Confira a orientação abaixo.' : `Distância de ${decimal(result.distance)} km e consumo médio de ${decimal(result.efficiency)} km/l.`;
  }
  function renderOccurrences(announcement = '') {
    const query = normalizeText(search.value);
    const filtered = occurrences.filter(record => (status.value === 'all' || states.get(record.id) === status.value) && normalizeText(`${record.id} ${record.vehicle} ${record.reason}`).includes(query));
    const pending = filtered.filter(record => states.get(record.id) === 'pending').length;
    summary.textContent = `${announcement}${filtered.length} ${filtered.length === 1 ? 'ocorrência exibida' : 'ocorrências exibidas'} · ${pending} a conferir.`;
    grid.body.replaceChildren();
    filtered.forEach(record => {
      const reviewed = states.get(record.id) === 'reviewed';
      const action = button(reviewed ? 'Reabrir' : 'Marcar conferida');
      action.dataset.occurrence = record.id;
      action.setAttribute('aria-label', `${reviewed ? 'Reabrir' : 'Marcar conferida'} a ocorrência ${record.id}`);
      action.addEventListener('click', () => {
        states.set(record.id, reviewed ? 'pending' : 'reviewed');
        saveStates();
        renderOccurrences(`Ocorrência ${record.id} ${reviewed ? 'reaberta' : 'conferida'}. `);
        const updatedAction = [...grid.body.querySelectorAll('button')].find(item => item.dataset.occurrence === record.id);
        (updatedAction || status).focus();
      });
      addRow(grid.body, [record.id, record.vehicle, dateLabel(record.date), record.reason, node('span', `demo-status ${reviewed ? 'is-success' : 'is-warning'}`, reviewed ? 'Conferida' : 'A conferir'), action]);
    });
    if (!filtered.length) emptyRow(grid.body, 6);
  }
  [previous, current, liters].forEach(control => control.addEventListener('input', calculate));
  full.addEventListener('change', calculate);
  search.addEventListener('input', () => renderOccurrences());
  status.addEventListener('change', () => renderOccurrences());
  challenge.addEventListener('click', () => { search.value = 'hodômetro'; status.value = 'all'; renderOccurrences('Confira a sequência das leituras antes de concluir. '); search.focus(); });
  reset.addEventListener('click', () => {
    occurrences.forEach(record => states.set(record.id, record.state));
    saveStates();
    search.value = ''; status.value = 'all'; previous.value = '12400'; current.value = '12820'; liters.value = '35'; full.checked = true;
    calculate(); renderOccurrences('Demonstração restaurada. ');
  });
  calculate();
  renderOccurrences();
}

function mountDashboard(root) {
  const intro = node('p', 'demo-help', 'Do panorama ao lançamento: filtre a competência e a origem ou acompanhe um contrato. As conferências e simulações feitas nos outros projetos aparecem aqui.');
  const toolbar = node('div', 'demo-toolbar');
  const month = select([['2026-08', 'Agosto de 2026'], ['2026-09', 'Setembro de 2026'], ['2026-10', 'Outubro de 2026']]);
  month.value = '2026-09';
  const category = select([['all', 'Todas as origens'], ...Object.entries(categories)]);
  const contract = select([['all', 'Todos os contratos'], ...getWorkspace().contracts.map(item => [item.id, `${item.id} · ${item.object}`])]);
  const status = select([['all', 'Todas as situações'], ['documents', 'Documentação pendente'], ['overdue', 'Vencido em aberto'], ['open', 'Em prazo'], ['paid', 'Pago']]);
  const requested = new URLSearchParams(location.search).get('contrato');
  if (getWorkspace().contracts.some(item => item.id === requested)) { contract.value = requested; category.value = 'contratos'; }
  toolbar.append(field('dashboard-month', 'Competência', month), field('dashboard-category', 'Origem', category), field('dashboard-contract', 'Contrato', contract), field('dashboard-status', 'Situação', status));
  const cards = metrics([['dashboard-total', 'Valor registrado'], ['dashboard-paid', 'Pago até 17/09/2026'], ['dashboard-open', 'Em aberto'], ['dashboard-documents', 'Documentação pendente']]);
  const summary = live('dashboard-results');
  const bars = node('div', 'demo-bars');
  bars.setAttribute('aria-label', 'Valores registrados por origem');
  const breakdown = table('Consolidação por origem', ['Origem', 'Obrigações', 'Registrado', 'Pago', 'Em aberto'], 'dashboard-breakdown');
  const details = document.createElement('details');
  details.id = 'dashboard-ledger';
  details.append(node('summary', '', 'Ver registros que compõem o painel'));
  const recordsTable = table('Registros que compõem o painel', ['Referência', 'Origem', 'Descrição', 'Vencimento', 'Valor', 'Situação', 'Consulta'], 'dashboard-records');
  details.append(recordsTable.region);
  const help = node('p', 'demo-help', 'Uma linha por obrigação, agrupada pela competência. Registrado = pago + em aberto. Documentação e previsão de saldo são acompanhadas separadamente.');
  const forecasts = node('section', 'dashboard-forecast');
  forecasts.setAttribute('aria-labelledby', 'dashboard-forecast-title');
  const forecastTitle = node('h3', '', 'Projeção de saldos por contrato');
  forecastTitle.id = 'dashboard-forecast-title';
  const forecastSummary = live('dashboard-forecast-results');
  const forecastGrid = table('Projeções de serviço e material por contrato', ['Contrato', 'Horizonte', 'Serviço · saldo projetado', 'Material · saldo projetado', 'Consulta'], 'dashboard-forecasts');
  const forecastHelp = node('p', 'demo-help', 'Posição em 17/09/2026, com as premissas da simulação. Serviço e material não se compensam. As projeções não são somadas aos valores registrados acima.');
  forecasts.append(forecastTitle, forecastSummary, forecastGrid.region, forecastHelp);
  const links = node('div', 'demo-actions');
  const reset = button('Restaurar filtros', 'dashboard-reset');
  const challenge = button('Encontrar saldo insuficiente', 'dashboard-challenge');
  const challengeDocuments = button('Conferir documentos pendentes', 'dashboard-documents-challenge');
  const challenges = node('div', 'demo-actions');
  challenges.append(challenge, challengeDocuments, reset);
  const challengeStatus = live('dashboard-challenge-results');
  root.replaceChildren(intro, toolbar, challenges, challengeStatus, cards.wrapper, summary, bars, breakdown.region, details, help, forecasts, links);
  function projectLink(slug, label, id = '') {
    const link = node('a', 'text-link', label);
    link.href = `../${slug}/${id ? `?contrato=${encodeURIComponent(id)}` : ''}#demonstracao`;
    return link;
  }
  function projectedCell(result) {
    const cell = node('div');
    if (result.status !== 'valid') {
      cell.append(node('span', 'demo-status is-warning', 'Projeção indisponível'));
      return cell;
    }
    cell.append(node('strong', '', money(result.remaining)), node('small', `demo-status ${result.risk ? 'is-danger' : result.remaining === 0 ? 'is-warning' : 'is-success'}`, result.risk ? 'Saldo insuficiente' : result.remaining === 0 ? 'Saldo comprometido' : 'Saldo suficiente'));
    return cell;
  }
  function updateForecasts() {
    const matchingOrigin = ['all', 'contratos'].includes(category.value);
    forecasts.hidden = !matchingOrigin;
    if (!matchingOrigin) return;
    forecastGrid.body.replaceChildren();
    forecastGrid.region.hidden = month.value !== '2026-09';
    forecastHelp.hidden = month.value !== '2026-09';
    if (month.value !== '2026-09') {
      forecastSummary.textContent = 'As simulações têm posição em setembro de 2026. Selecione essa competência para consultar as projeções.';
      return;
    }
    const rows = summarizeForecasts(getWorkspace().forecasts.filter(item => contract.value === 'all' || item.id === contract.value));
    const risks = rows.filter(item => item.risk).length;
    const incomplete = rows.filter(item => item.unavailable).length;
    forecastSummary.textContent = `${rows.length} cenários · ${risks} com saldo insuficiente · ${incomplete} com premissa pendente ou inválida. A situação documental filtra os lançamentos acima.`;
    rows.forEach(item => {
      const row = addRow(forecastGrid.body, [item.label, `${item.months} meses`, projectedCell(item.service), projectedCell(item.material), projectLink('previsao-contratual', `Simular ${item.id} ↗`, item.id)]);
      row.dataset.forecast = item.id;
      row.dataset.risk = String(item.risk);
    });
    if (!rows.length) emptyRow(forecastGrid.body, 5, 'Este contrato ainda não tem um cenário de projeção cadastrado.');
  }
  function update() {
    const records = filterObligations(getDashboardRecords(), { month: month.value, category: category.value, contract: contract.value, status: status.value, reference: REFERENCE });
    const totals = summarizeObligations(records, REFERENCE);
    const groups = groupObligations(records, REFERENCE);
    cards.values['dashboard-total'].textContent = money(totals.totalCents);
    cards.values['dashboard-paid'].textContent = money(totals.paidCents);
    cards.values['dashboard-open'].textContent = money(totals.openCents);
    cards.values['dashboard-documents'].textContent = String(totals.pendingDocuments);
    summary.textContent = `${records.length} obrigações · ${month.options[month.selectedIndex].text} · ${category.options[category.selectedIndex].text}${contract.value !== 'all' ? ` · ${contract.value}` : ''} · ${money(totals.overdueCents)} vencidos em aberto.`;
    bars.replaceChildren();
    breakdown.body.replaceChildren();
    groups.forEach(group => {
      const row = node('div', 'demo-bar-row');
      const caption = node('div', 'demo-bar-label', `${categories[group.category]} · ${money(group.totalCents)}`);
      const track = node('div', 'demo-bar-track');
      track.setAttribute('aria-hidden', 'true');
      const fill = node('span', 'demo-bar-fill');
      fill.style.width = `${totals.totalCents ? group.totalCents / totals.totalCents * 100 : 0}%`;
      track.append(fill);
      row.append(caption, track);
      bars.append(row);
      addRow(breakdown.body, [categories[group.category], group.count, money(group.totalCents), money(group.paidCents), money(group.openCents)]);
    });
    recordsTable.body.replaceChildren();
    records.forEach(record => addRow(recordsTable.body, [record.id, categories[record.category], record.description, dateLabel(record.due), money(record.cents), statusBadge(obligationStatus(record, REFERENCE)), record.contract ? projectLink('pagamentos', `Conferir ${record.id} ↗`, record.contract) : projectLink(record.category === 'imoveis' ? 'controle-imoveis' : 'controle-frota', 'Abrir controle ↗')]));
    if (!records.length) { emptyRow(breakdown.body, 5); emptyRow(recordsTable.body, 7); }
    const id = contract.value === 'all' ? '' : contract.value;
    const forecastAvailable = !id || getWorkspace().forecasts.some(item => item.id === id);
    links.replaceChildren(projectLink('vigencia-contratual', 'Consultar vigências ↗', id), projectLink('pagamentos', 'Conferir pagamentos ↗', id), ...(forecastAvailable ? [projectLink('previsao-contratual', 'Ajustar previsões ↗', id)] : []));
    updateForecasts();
  }
  month.addEventListener('change', update);
  status.addEventListener('change', update);
  category.addEventListener('change', () => { if (!['all', 'contratos'].includes(category.value)) contract.value = 'all'; update(); });
  contract.addEventListener('change', () => { if (contract.value !== 'all') category.value = 'contratos'; update(); });
  reset.addEventListener('click', () => { month.value = '2026-09'; category.value = 'all'; contract.value = 'all'; status.value = 'all'; challengeStatus.textContent = ''; update(); });
  challenge.addEventListener('click', () => {
    const risk = summarizeForecasts(getWorkspace().forecasts).find(item => item.risk);
    month.value = '2026-09'; category.value = 'contratos'; status.value = 'all';
    contract.value = risk?.id || 'all';
    update();
    challengeStatus.textContent = risk ? `${risk.id} tem saldo projetado negativo. Abra a simulação para conferir serviço e material e ajustar as premissas.` : 'Nenhum componente calculado tem saldo negativo. As projeções indisponíveis continuam exigindo conferência.';
    forecastTitle.tabIndex = -1;
    forecastTitle.focus();
  });
  challengeDocuments.addEventListener('click', () => {
    month.value = '2026-09'; category.value = 'contratos'; contract.value = 'all'; status.value = 'documents'; details.open = true;
    update();
    challengeStatus.textContent = 'Abra um pagamento, conclua a conferência documental e volte ao painel para acompanhar a atualização.';
    status.focus();
  });
  subscribe(update);
  update();
}

export function mount(slug, root) {
  const mounts = { 'controle-imoveis': mountProperties, 'controle-frota': mountFleet, 'paineis-acompanhamento': mountDashboard };
  if (!mounts[slug] || !root) return false;
  mounts[slug](root);
  return true;
}
