import { REFERENCE_DATE, formatMoney, formatDate, validDate, contractAlert, parseMoney, projectComponent, paymentStatus, documentsComplete, paymentActionAllowed } from './finance-logic.mjs';

import { getWorkspace, getInitialWorkspace, updatePayment, updateForecast, resetWorkspace, subscribe } from './workspace.mjs';

const fold = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
function node(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') element.className = value;
    else if (key === 'text') element.textContent = value;
    else element.setAttribute(key, value);
  }
  for (const child of (Array.isArray(children) ? children : [children])) if (child != null) element.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return element;
}
const text = (tag, content, className = '') => node(tag, { text: content, ...(className ? { class: className } : {}) });
function field(id, label, control, help = '') {
  control.id = id;
  const contents = [node('label', { for: id, text: label }), control];
  if (help) { control.setAttribute('aria-describedby', `${id}-help`); contents.push(node('small', { id: `${id}-help`, class: 'demo-help', text: help })); }
  return node('div', { class: 'demo-field' }, contents);
}
const input = (name, type, value, attributes = {}) => node('input', { name, type, value, ...attributes });
function select(name, options) { return node('select', { name }, options.map(([value, label]) => node('option', { value, text: label }))); }
const button = (label, callback, attributes = {}) => { const result = node('button', { type: 'button', class: 'demo-button', text: label, ...attributes }); result.addEventListener('click', callback); return result; };
const badge = (label, tone = '') => text('span', label, `demo-status ${tone}`.trim());
const metric = (label, value, tone = '') => node('div', { class: `demo-metric ${tone}`.trim() }, [text('span', label), text('strong', value)]);
function table(headers, label) {
  const body = node('tbody');
  const tableNode = node('table', { class: 'demo-table' }, [node('caption', { class: 'sr-only', text: label }), node('thead', {}, node('tr', {}, headers.map(header => node('th', { scope: 'col', text: header })))), body]);
  return { wrapper: node('div', { class: 'demo-table-wrap', tabindex: '0', role: 'region', 'aria-label': label }, tableNode), body };
}
function labelRows(body) {
  const headers = [...body.closest('table').querySelectorAll('thead th')].map(header => header.textContent);
  for (const row of body.rows) for (const [index, cell] of [...row.cells].entries()) if (!cell.hasAttribute('colspan')) cell.dataset.label = headers[index];
}
const currentContract = () => new URLSearchParams(location.search).get('contrato') || '';
const routeLink = (path, id, label) => node('a', { class: 'demo-button demo-link', href: `../${path}/?contrato=${encodeURIComponent(id)}`, text: label });
function emptyRow(body, span) { body.append(node('tr', {}, node('td', { colspan: String(span), class: 'demo-empty', text: 'Nenhum registro corresponde aos filtros. Ajuste a consulta para continuar.' }))); }
function contracts(root) {
  const search = input('contract-search', 'search', currentContract(), { placeholder: 'Contrato, fornecedor ou objeto' });
  const reference = input('contract-reference', 'date', REFERENCE_DATE, { min: '2000-01-01', max: '2100-12-31' });
  const threshold = select('contract-threshold', [['30', '30 dias'], ['60', '60 dias'], ['90', '90 dias']]); threshold.value = '60';
  const situation = select('contract-situation', [['all', 'Todas'], ['Em acompanhamento', 'Em acompanhamento'], ['Encerrado', 'Encerrado']]);
  const alert = select('contract-alert', [['all', 'Todos os prazos'], ['attention', 'Termina em breve'], ['expired', 'Prazo terminado'], ['current', 'Dentro do prazo'], ['future', 'Ainda não iniciado'], ['closed', 'Encerramento registrado']]);
  const summary = node('p', { class: 'demo-help', role: 'status', 'aria-live': 'polite', 'data-contract-summary': '' });
  const metrics = node('div', { class: 'demo-metrics' });
  const detail = node('div', { class: 'demo-detail', 'data-contract-detail': '', tabindex: '-1' });
  const rows = table(['Contrato e vigência', 'Fornecedor e objeto', 'Período', 'Situação administrativa', 'Alerta de prazo', 'Consulta'], 'Contratos, vigências e alertas');
  let selected = null;
  function renderDetail() {
    detail.replaceChildren();
    if (!selected) { detail.append(text('p', 'Abra o histórico de um contrato para consultar os períodos e o próximo encaminhamento.', 'demo-help')); return; }
    detail.append(text('h4', `${selected.id} · Histórico e encaminhamento`), node('ul', {}, selected.history.map(item => text('li', item))));
  }
  function render() {
    const referenceValid = validDate(reference.value);
    reference.setAttribute('aria-invalid', String(!referenceValid));
    const filtered = getWorkspace().contracts.map(row => ({ ...row, alert: contractAlert(row, reference.value, Number(threshold.value)) })).filter(row => fold(`${row.id} ${row.provider} ${row.object}`).includes(fold(search.value.trim())) && (situation.value === 'all' || row.status === situation.value) && (alert.value === 'all' || row.alert.key === alert.value));
    const warnings = filtered.filter(row => ['attention', 'expired'].includes(row.alert.key)).length;
    summary.textContent = referenceValid ? `${filtered.length} contratos encontrados. ${warnings} com atenção ao prazo. Referência: ${formatDate(reference.value)}.` : 'Informe uma data de referência válida para calcular os alertas.';
    metrics.replaceChildren(metric('Contratos na consulta', String(filtered.length)), metric('Atenção ao prazo', referenceValid ? String(warnings) : '—', warnings ? 'is-warning' : ''), metric('Encerramentos registrados', String(filtered.filter(row => row.status === 'Encerrado').length)));
    rows.body.replaceChildren();
    for (const row of filtered) {
      const open = button('Ver histórico', () => { selected = row; renderDetail(); detail.focus(); }, { 'aria-label': `Ver histórico de ${row.id}` });
      rows.body.append(node('tr', {}, [node('td', {}, [text('strong', row.id), text('small', `Vigência ${row.cycle}`)]), node('td', {}, [text('strong', row.provider), text('small', row.object)]), text('td', `${formatDate(row.start)} a ${formatDate(row.end)}`), node('td', {}, badge(row.status)), node('td', {}, badge(row.alert.label, row.alert.tone)), node('td', {}, node('div', { class: 'demo-row-actions' }, [open, routeLink('pagamentos', row.id, 'Ver pagamentos'), ...(getWorkspace().forecasts.some(item => item.id === row.id) ? [routeLink('previsao-contratual', row.id, 'Simular saldo')] : [])]))]));
    }
    if (!filtered.length) emptyRow(rows.body, 6);
    labelRows(rows.body);
  }
  const challenge = button('Encontrar prazos que precisam de atenção', () => { search.value = ''; reference.value = REFERENCE_DATE; threshold.value = '60'; situation.value = 'Em acompanhamento'; alert.value = 'attention'; render(); summary.focus(); }, { class: 'demo-button demo-challenge' });
  summary.tabIndex = -1;
  root.replaceChildren(challenge, text('p', 'Pesquise contratos, altere a referência e acompanhe quais prazos precisam de conferência.', 'demo-help'), node('div', { class: 'demo-toolbar' }, [field('contract-search', 'Buscar contrato', search), field('contract-reference', 'Data de referência', reference), field('contract-threshold', 'Janela de atenção', threshold), field('contract-situation', 'Situação administrativa', situation), field('contract-alert', 'Alerta de prazo', alert)]), metrics, summary, rows.wrapper, detail, text('p', 'A situação administrativa e o alerta de prazo são acompanhados separadamente. Um prazo terminado sinaliza a necessidade de conferir o cadastro e os documentos.', 'demo-help'));
  for (const control of [search, reference, threshold, situation, alert]) control.addEventListener('input', render);
  render(); renderDetail();
}
function forecasts(root) {
  const preset = select('forecast-contract', getWorkspace().forecasts.map(row => [row.id, row.label]));
  if (getWorkspace().forecasts.some(row => row.id === currentContract())) preset.value = currentContract();
  const months = input('forecast-months', 'number', '3', { min: '1', max: '60', step: '1', inputmode: 'numeric' });
  const serviceBalance = input('service-balance', 'text', '', { inputmode: 'decimal' });
  const serviceMonthly = input('service-monthly', 'text', '', { inputmode: 'decimal' });
  const materialBalance = input('material-balance', 'text', '', { inputmode: 'decimal' });
  const materialMonthly = input('material-monthly', 'text', '', { inputmode: 'decimal', placeholder: 'Informe a premissa mensal' });
  const summary = node('p', { class: 'demo-help', role: 'status', 'aria-live': 'polite', 'data-forecast-summary': '' });
  const result = node('div', { class: 'demo-grid', 'data-forecast-results': '' });
  function componentPanel(label, projected, key) {
    const panel = node('section', { class: 'demo-result', 'data-forecast-component': key }, text('h4', label));
    if (projected.status !== 'valid') { panel.append(badge('Projeção indisponível', 'is-warning'), text('p', projected.message, projected.status === 'invalid' ? 'demo-error' : 'demo-help')); return panel; }
    const status = projected.risk ? 'Saldo insuficiente no horizonte' : projected.remaining === 0 ? 'Saldo totalmente comprometido' : 'Saldo suficiente no horizonte';
    panel.append(badge(status, projected.risk ? 'is-danger' : projected.remaining === 0 ? 'is-warning' : 'is-success'), node('div', { class: 'demo-metrics' }, [metric('Saldo atual', formatMoney(projected.balance)), metric('Consumo previsto', formatMoney(projected.spend)), metric('Saldo após a previsão', formatMoney(projected.remaining), projected.risk ? 'is-danger' : '')]), text('p', `${formatMoney(projected.monthly)} por mês × ${projected.months} ${projected.months === 1 ? 'mês' : 'meses'}.`, 'demo-help'));
    return panel;
  }
  function render() {
    const service = projectComponent(serviceBalance.value, serviceMonthly.value, months.value);
    const material = projectComponent(materialBalance.value, materialMonthly.value, months.value);
    const components = [service, material];
    result.replaceChildren(componentPanel('Serviço', service, 'service'), componentPanel('Material', material, 'material'));
    const missing = components.filter(item => item.status !== 'valid').length;
    const risk = components.filter(item => item.status === 'valid' && item.risk).length;
    summary.textContent = `${missing ? `${missing} ${missing === 1 ? 'componente sem projeção disponível' : 'componentes sem projeção disponível'}. ` : 'Dois componentes calculados. '}${missing === 2 ? 'Preencha as premissas para calcular.' : risk ? `${risk} ${risk === 1 ? 'componente com saldo insuficiente' : 'componentes com saldo insuficiente'}.` : 'Nenhum saldo negativo entre os componentes calculados.'}`;
    for (const [control, consumption] of [[serviceBalance, false], [serviceMonthly, true], [materialBalance, false], [materialMonthly, true]]) {
      const parsed = parseMoney(control.value);
      control.setAttribute('aria-invalid', String(parsed.status === 'invalid' || (consumption && parsed.status === 'valid' && parsed.cents < 0)));
    }
    months.setAttribute('aria-invalid', String(months.value !== '' && (!/^\d+$/.test(months.value) || Number(months.value) < 1 || Number(months.value) > 60)));
  }
  function loadPreset() {
    const data = getWorkspace().forecasts.find(row => row.id === preset.value);
    months.value = data.months;
    serviceBalance.value = data.serviceBalance; serviceMonthly.value = data.serviceMonthly;
    materialBalance.value = data.materialBalance; materialMonthly.value = data.materialMonthly;
    panelLink.href = `../paineis-acompanhamento/?contrato=${encodeURIComponent(preset.value)}`;
    paymentLink.href = `../pagamentos/?contrato=${encodeURIComponent(preset.value)}`;
    render();
  }
  function persist() {
    updateForecast(preset.value, { serviceBalance: serviceBalance.value, serviceMonthly: serviceMonthly.value, materialBalance: materialBalance.value, materialMonthly: materialMonthly.value, months: months.value });
    render();
  }
  const panelLink = routeLink('paineis-acompanhamento', preset.value, 'Ver impacto no painel');
  const paymentLink = routeLink('pagamentos', preset.value, 'Ver pagamentos do contrato');
  const challenge = button('Carregar um cenário com saldo insuficiente', () => { preset.value = 'CT-102'; const { id, label, ...values } = getInitialWorkspace().forecasts.find(row => row.id === preset.value); updateForecast(preset.value, values); loadPreset(); summary.focus(); }, { class: 'demo-button demo-challenge' });
  summary.tabIndex = -1;
  const componentFields = (title, fields) => node('fieldset', { class: 'demo-component-fields' }, [text('legend', title), ...fields]);
  root.replaceChildren(challenge, text('p', 'Altere os saldos, o consumo mensal e o horizonte para simular cada componente. Posição inicial em 17/09/2026; premissa de consumo constante nos meses seguintes.', 'demo-help'), node('div', { class: 'demo-toolbar' }, [field('forecast-contract', 'Cenário contratual', preset), field('forecast-months', 'Horizonte em meses', months)]), node('div', { class: 'demo-grid' }, [componentFields('Serviço', [field('service-balance', 'Saldo disponível de serviço (R$)', serviceBalance), field('service-monthly', 'Consumo mensal de serviço (R$)', serviceMonthly)]), componentFields('Material', [field('material-balance', 'Saldo disponível de material (R$)', materialBalance), field('material-monthly', 'Consumo mensal de material (R$)', materialMonthly)])]), summary, result, node('div', { class: 'demo-actions' }, [panelLink, paymentLink, button('Restaurar valores do cenário', () => { const { id, label, ...values } = getInitialWorkspace().forecasts.find(row => row.id === preset.value); updateForecast(preset.value, values); loadPreset(); })]), text('p', 'Saldo previsto = saldo disponível − consumo mensal × meses. Serviço e material são calculados separadamente; um componente não cobre a insuficiência do outro. Campo em branco indica ausência de premissa, enquanto zero indica consumo previsto igual a zero.', 'demo-help'));
  preset.addEventListener('change', loadPreset);
  for (const control of [months, serviceBalance, serviceMonthly, materialBalance, materialMonthly]) control.addEventListener('input', persist);
  loadPreset();
  subscribe(() => loadPreset());
}
function payments(root) {
  let records = getWorkspace().payments;
  let selectedId = (records.find(row => row.contract === currentContract()) || records[0]).id;
  let localChange = false;
  function save(id, patch) { localChange = true; const result = updatePayment(id, patch); localChange = false; records = getWorkspace().payments; return result; }
  const search = input('payment-search', 'search', '', { placeholder: 'Protocolo, fornecedor ou contrato' });
  const contractFilter = select('payment-contract', [['all', 'Todos os contratos'], ...getWorkspace().contracts.map(row => [row.id, `${row.id} · ${row.object}`])]);
  if (getWorkspace().contracts.some(row => row.id === currentContract())) contractFilter.value = currentContract();
  const stage = select('payment-stage', [['all', 'Todas as etapas'], ['Em conferência', 'Em conferência'], ['Encaminhado', 'Encaminhado'], ['Pago', 'Pago']]);
  const dueFilter = select('payment-due-filter', [['all', 'Todos os prazos'], ['overdue', 'Vencido, sem pagamento'], ['today', 'Vence hoje'], ['open', 'A vencer'], ['paid', 'Pago']]);
  const period = select('payment-period', [['all', 'Todas as competências'], ['2026-09', 'Setembro de 2026'], ['2026-08', 'Agosto de 2026']]);
  const summary = node('p', { class: 'demo-help', role: 'status', 'aria-live': 'polite', 'data-payment-summary': '' });
  const actionStatus = node('p', { class: 'demo-help', role: 'status', 'aria-live': 'polite', 'data-payment-action-status': '' });
  const metrics = node('div', { class: 'demo-metrics' });
  const detail = node('section', { class: 'demo-detail', 'data-payment-detail': '', tabindex: '-1' });
  const rows = table(['Registro e protocolo', 'Fornecedor e competência', 'Valor', 'Vencimento', 'Documentos', 'Etapa e prazo', 'Consulta'], 'Documentos e andamento dos pagamentos');
  function renderRows() {
    const filtered = records.filter(row => fold(`${row.id} ${row.protocol} ${row.provider} ${row.contract} ${row.description}`).includes(fold(search.value.trim())) && (contractFilter.value === 'all' || row.contract === contractFilter.value) && (stage.value === 'all' || row.stage === stage.value) && (dueFilter.value === 'all' || paymentStatus(row).key === dueFilter.value) && (period.value === 'all' || row.competence === period.value));
    const open = filtered.filter(row => paymentStatus(row).key !== 'paid');
    const overdue = filtered.filter(row => paymentStatus(row).key === 'overdue');
    metrics.replaceChildren(metric('Registros na consulta', String(filtered.length)), metric('Valor sem pagamento registrado', formatMoney(open.reduce((total, row) => total + row.amount, 0))), metric('Vencidos sem pagamento', String(overdue.length), overdue.length ? 'is-warning' : ''));
    summary.textContent = `${filtered.length} registros encontrados; ${filtered.filter(row => !documentsComplete(row)).length} com pendência documental. Referência: ${formatDate(REFERENCE_DATE)}.`;
    rows.body.replaceChildren();
    for (const row of filtered) {
      const status = paymentStatus(row);
      const view = button('Conferir', () => { selectedId = row.id; actionStatus.textContent = ''; renderDetail(); detail.focus(); }, { 'aria-label': `Conferir ${row.id}` });
      rows.body.append(node('tr', {}, [node('td', {}, [text('strong', row.id), text('small', row.protocol)]), node('td', {}, [text('strong', row.provider), text('small', `${row.contract} · ${row.competence.split('-').reverse().join('/')}`)]), text('td', formatMoney(row.amount)), text('td', formatDate(row.due)), node('td', {}, badge(documentsComplete(row) ? 'Conferência completa' : 'Pendência documental', documentsComplete(row) ? 'is-success' : 'is-warning')), node('td', {}, [text('strong', row.stage), badge(status.label, status.tone)]), node('td', {}, view)]));
    }
    if (!filtered.length) emptyRow(rows.body, 7);
    labelRows(rows.body);
    if (!filtered.some(row => row.id === selectedId)) { selectedId = filtered[0]?.id || null; renderDetail(); }
  }
  function renderDetail() {
    const row = records.find(item => item.id === selectedId);
    if (!row) { detail.replaceChildren(text('p', 'Ajuste os filtros para abrir um registro.', 'demo-help')); return; }
    detail.replaceChildren(text('h4', `${row.id} · Conferência e andamento`), text('p', `${row.provider} · ${row.description} · Recebido em ${formatDate(row.received)} · Protocolo ${row.protocol}`, 'demo-help'));
    const checklist = node('fieldset', { class: 'demo-checklist' }, text('legend', 'Conferência documental'));
    const docNames = { invoice: 'Nota fiscal recebida', reference: 'Contrato e competência conferidos', confirmation: 'Comprovante de conferência recebido' };
    for (const [key, label] of Object.entries(docNames)) {
      const checkbox = input(`document-${key}`, 'checkbox', key); checkbox.id = `payment-document-${key}`; checkbox.checked = row.documents[key]; checkbox.disabled = row.stage !== 'Em conferência';
      checkbox.addEventListener('change', () => { row.documents[key] = checkbox.checked; save(row.id, { documents: { [key]: checkbox.checked } }); actionStatus.textContent = `${label}: ${checkbox.checked ? 'concluído' : 'pendente'}.`; renderRows(); refreshActions(); });
      checklist.append(node('label', { for: checkbox.id }, [checkbox, document.createTextNode(label)]));
    }
    const paidDate = input('payment-paid-date', 'date', row.paidAt || REFERENCE_DATE, { min: row.received, max: REFERENCE_DATE });
    paidDate.disabled = row.stage === 'Pago';
    const actionsHelp = text('p', '', 'demo-help');
    const forward = button('Registrar encaminhamento', () => {
      if (!paymentActionAllowed(row, 'forward')) return;
      save(row.id, { stage: 'Encaminhado' }); actionStatus.textContent = `${row.id}: encaminhamento registrado em ${formatDate(REFERENCE_DATE)}.`;
      renderRows(); renderDetail(); detail.focus();
    }, { 'data-payment-forward': '' });
    const pay = button('Registrar pagamento', () => {
      if (!paymentActionAllowed(row, 'pay', paidDate.value)) return;
      save(row.id, { stage: 'Pago', paidAt: paidDate.value });
      actionStatus.textContent = `${row.id}: pagamento de ${formatMoney(row.amount)} registrado em ${formatDate(paidDate.value)}.`;
      renderRows(); renderDetail(); detail.focus();
    }, { 'data-payment-pay': '' });
    function refreshActions() {
      forward.disabled = !paymentActionAllowed(row, 'forward');
      pay.disabled = !paymentActionAllowed(row, 'pay', paidDate.value);
      const dateInvalid = !validDate(paidDate.value) || paidDate.value < row.received || paidDate.value > REFERENCE_DATE;
      paidDate.setAttribute('aria-invalid', String(dateInvalid));
      if (row.stage === 'Pago') actionsHelp.textContent = `Pagamento registrado em ${formatDate(row.paidAt)}. Etapa concluída.`;
      else if (row.stage === 'Em conferência') actionsHelp.textContent = documentsComplete(row) ? 'Documentos conferidos. O registro está pronto para o encaminhamento.' : 'Complete a conferência documental para registrar o encaminhamento.';
      else actionsHelp.textContent = dateInvalid ? 'Informe uma data de pagamento entre o recebimento e 17/09/2026.' : 'O registro está encaminhado. Atualize o pagamento quando houver confirmação da ocorrência.';
    }
    paidDate.addEventListener('input', refreshActions);
    detail.append(node('div', { class: 'demo-actions' }, [routeLink('vigencia-contratual', row.contract, 'Abrir contrato'), ...(getWorkspace().forecasts.some(item => item.id === row.contract) ? [routeLink('previsao-contratual', row.contract, 'Simular saldo')] : []), routeLink('paineis-acompanhamento', row.contract, 'Ver no painel')]), checklist, field('payment-paid-date', 'Data do pagamento confirmado', paidDate), actionsHelp, node('div', { class: 'demo-actions' }, [forward, pay]));
    refreshActions();
  }
  const reset = button('Recomeçar demonstração', () => { resetWorkspace(); records = getWorkspace().payments; selectedId = records[0].id; search.value = ''; contractFilter.value = 'all'; stage.value = 'all'; dueFilter.value = 'all'; period.value = 'all'; actionStatus.textContent = 'Demonstração reiniciada: pagamentos e previsões restaurados.'; renderRows(); renderDetail(); });
  const challenge = button('Conferir uma pendência documental', () => { const pending = records.find(row => !documentsComplete(row)); if (!pending) { actionStatus.textContent = 'Todos os documentos estão conferidos nesta visita.'; return; } contractFilter.value = pending.contract; search.value = ''; stage.value = 'all'; dueFilter.value = 'all'; period.value = 'all'; selectedId = pending.id; renderRows(); renderDetail(); detail.focus(); }, { class: 'demo-button demo-challenge' });
  root.replaceChildren(challenge, text('p', 'Consulte competências e protocolos. Abra um registro para conferir os documentos e atualizar o andamento. Referência em 17/09/2026.', 'demo-help'), node('div', { class: 'demo-toolbar' }, [field('payment-contract', 'Contrato', contractFilter), field('payment-search', 'Buscar pagamento', search), field('payment-stage', 'Etapa administrativa', stage), field('payment-due-filter', 'Situação do prazo', dueFilter), field('payment-period', 'Competência', period)]), metrics, summary, rows.wrapper, detail, actionStatus, node('div', { class: 'demo-actions' }, reset), text('p', 'Documento conferido, encaminhamento e pagamento são registros distintos. Suas alterações acompanham esta visita e aparecem no painel consolidado.', 'demo-help'));
  for (const control of [contractFilter, search, stage, dueFilter, period]) control.addEventListener('input', renderRows);
  renderRows(); renderDetail();
  subscribe(() => { if (localChange) return; records = getWorkspace().payments; renderRows(); renderDetail(); });
}
export function mount(slug, root) {
  const implementations = { 'vigencia-contratual': contracts, 'previsao-contratual': forecasts, pagamentos: payments };
  if (!implementations[slug]) return false;
  implementations[slug](root);
  return true;
}
