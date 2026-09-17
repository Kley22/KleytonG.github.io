import { createTopicStore } from './topics-store.mjs';
import { money, decimal, toCents, dateLabel, validDate, contractStatus, paymentStatus, paymentSummary, paymentPatch, projectBalance, parkingMonthly, fuelResult, summarizeFuel, referencePrice, priceComparison } from './topics-logic.mjs';

function el(tag, attrs = {}, children = []) {
  const out = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'text') out.textContent = value;
    else if (key === 'class') out.className = value;
    else if (key === 'disabled') out.disabled = value;
    else out.setAttribute(key, value);
  }
  for (const child of (Array.isArray(children) ? children : [children])) if (child != null) out.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return out;
}
const text = (tag, value, className = '') => el(tag, { text: value, class: className });
const badge = (label, tone = '') => text('span', label, `demo-status ${tone}`);
const btn = (label, action, attrs = {}) => { const out = el('button', { type: 'button', class: 'demo-button', text: label, ...attrs }); out.addEventListener('click', action); return out; };
const select = (id, options, value) => { const out = el('select', { id, name: id }, options.map(([key, label]) => el('option', { value: key, text: label }))); if (value != null) out.value = value; return out; };
const number = (id, value, attrs = {}) => el('input', { id, name: id, type: 'number', value: value ?? '', min: '0', max: '1000000000', step: '0.01', inputmode: 'decimal', ...attrs });
const field = (label, control, help = '') => el('div', { class: 'demo-field' }, [el('label', { for: control.id, text: label }), control, ...(help ? [text('small', help, 'demo-help')] : [])]);
const metric = (key, label, value, tone = '') => el('div', { class: `demo-metric ${tone}` }, [text('span', label), el('strong', { text: value, 'data-metric': key })]);
const metrics = rows => el('div', { class: 'demo-metrics' }, rows.map(row => metric(...row)));
const advanced = (...children) => el('details', { class: 'topic-advanced' }, [el('summary', { text: 'Mais opções' }), el('div', { class: 'demo-toolbar' }, children)]);
function table(headers, rows, label) {
  const body = el('tbody', {}, rows.map((row, index) => el('tr', { 'data-row': String(index) }, row.map((cell, column) => el('td', { 'data-label': headers[column] }, cell)))));
  if (!rows.length) body.append(el('tr', {}, el('td', { colspan: String(headers.length), text: 'Nenhum registro corresponde à consulta. Selecione outro filtro para continuar.', class: 'demo-empty' })));
  return el('div', { class: 'demo-table-wrap', role: 'region', 'aria-label': label, tabindex: '0' }, el('table', { class: 'demo-table' }, [el('caption', { class: 'sr-only', text: label }), el('thead', {}, el('tr', {}, headers.map(label => el('th', { scope: 'col', text: label })))), body]));
}
const parseNumber = input => input.value.trim() === '' ? null : Number(input.value);
const validNumber = input => input.value.trim() === '' || input.checkValidity();
const shortDate = value => validDate(value) ? dateLabel(value) : '—';

const setup = {
  'obras-facilities': { label: 'Obras e facilities', collection: 'contracts', filter: 'Escolha um contrato', tabs: [['contracts', 'Contratos e prazos'], ['payments', 'Pagamentos'], ['forecast', 'Previsão de saldos'], ['panel', 'Painel']], intro: 'Comece pelos prazos. Depois, acompanhe os documentos, os pagamentos e os saldos do mesmo assunto.', challenge: 'Veja quais contratos precisam de atenção' },
  imoveis: { label: 'Imóveis', collection: 'properties', filter: 'Escolha um imóvel', tabs: [['properties', 'Imóveis'], ['payments', 'Obrigações e pagamentos'], ['panel', 'Painel']], intro: 'Escolha um imóvel para consultar suas obrigações. Aluguel, condomínio, IPTU e taxas ficam identificados separadamente.', challenge: 'Encontre uma obrigação com documento pendente' },
  frota: { label: 'Frota', collection: 'vehicles', filter: 'Escolha um veículo', tabs: [['fuel', 'Abastecimentos'], ['occurrences', 'Conferências'], ['panel', 'Painel']], intro: 'Confira a sequência de leituras e acompanhe os abastecimentos. O consumo considera os intervalos entre tanques cheios.', challenge: 'Confira uma ocorrência de abastecimento' },
  estacionamentos: { label: 'Contratos de estacionamento', collection: 'contracts', filter: 'Escolha um contrato', tabs: [['contracts', 'Contratos e vagas'], ['payments', 'Mensalidades'], ['panel', 'Painel']], intro: 'Acompanhe vagas contratadas, valores mensais, documentos e vigências dos contratos de estacionamento.', challenge: 'Encontre o contrato que termina em breve' },
  'mapa-precos': { label: 'Mapa comparativo de preços', collection: 'items', filter: 'Escolha um item para editar', tabs: [['quotes', 'Pesquisa e propostas'], ['panel', 'Comparação completa']], intro: 'Escolha um item, altere uma cotação e veja o efeito no comparativo. A cesta reúne materiais e serviços identificados por tipo.', challenge: 'Experimente alterar uma cotação' }
};

export function mountTopic(root, data, store) {
  const topic = root.dataset.topic, config = setup[topic];
  if (!config) throw new Error('Demonstração desconhecida');
  let active = config.tabs[0][0], selectedPayment = '', selectedFuel = '', filterValue = topic === 'mapa-precos' ? data[topic].items[0].id : 'all';
  let contractMode = 'all', paymentMode = 'all', selectedPeriod = data.period, months = 3, method = 'mean';
  const get = () => store.get(topic);
  const records = get()[config.collection];
  const filter = select('topic-filter', [...(topic !== 'mapa-precos' ? [['all', topic === 'imoveis' ? 'Todos os imóveis' : topic === 'frota' ? 'Todos os veículos' : 'Todos os contratos']] : []), ...records.map(row => [row.id, `${row.id} · ${row.description || row.name}`])], filterValue);
  filter.dataset.topicFilter = '';
  const body = el('div', { class: 'topic-panel', 'data-topic-panel': '', tabindex: '-1' });
  const live = el('p', { class: 'demo-help', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'data-topic-status': '' });
  const message = value => { live.textContent = value; };
  const tabButtons = config.tabs.map(([key, label]) => btn(label, () => { active = key; render(); }, { 'data-topic-tab': key, 'aria-pressed': String(key === active) }));
  function chooseTab(key) { active = key; render(); body.focus({ preventScroll: true }); }
  const challenge = btn(config.challenge, () => {
    filterValue = topic === 'mapa-precos' ? records[0].id : 'all'; filter.value = filterValue;
    if (topic === 'obras-facilities' || topic === 'estacionamentos') { contractMode = 'attention'; chooseTab('contracts'); message('A consulta mostra os prazos próximos ou já terminados. Abra “Mais opções” para consultar todos.'); }
    if (topic === 'imoveis') { paymentMode = 'documents'; selectedPayment = ''; chooseTab('payments'); message('Escolha uma obrigação e confira o documento antes de registrar o pagamento.'); }
    if (topic === 'frota') { chooseTab('occurrences'); message('Leia a ocorrência e use “Marcar como conferido” depois de verificar o registro.'); }
    if (topic === 'mapa-precos') { chooseTab('quotes'); body.querySelector('#research-0')?.focus(); message('Altere a pesquisa A e acompanhe a referência do item e o total da cesta.'); }
  }, { class: 'demo-button demo-challenge', 'data-action': 'start' });
  const reference = `Referência: ${dateLabel(data.reference)} · Competência inicial: ${data.period.split('-').reverse().join('/')}.`;
  root.replaceChildren(el('div', { class: 'topic-intro' }, [text('p', config.intro), challenge]), field(config.filter, filter), el('div', { class: 'topic-tabs', role: 'group', 'aria-label': `Etapas de ${config.label}` }, tabButtons), live, body, el('div', { class: 'topic-summary' }, [text('p', reference, 'demo-help'), btn('Restaurar este projeto', () => { store.reset(topic); selectedPayment = ''; selectedFuel = ''; months = 3; method = 'mean'; render(); message(`Os exemplos de ${config.label.toLocaleLowerCase('pt-BR')} foram restaurados.`); }, { class: 'demo-button topic-reset', 'data-action': 'reset-topic' })]));
  filter.addEventListener('change', () => { filterValue = filter.value; selectedPayment = ''; selectedFuel = ''; render(); });
  function matching(row) { return filterValue === 'all' || row.id === filterValue || row.contract === filterValue || row.property === filterValue || row.vehicle === filterValue; }
  function change(collection, id, patch) { if (!store.patch(topic, collection, id, patch)) { message('Confira o preenchimento antes de continuar.'); return false; } return true; }
  function render() {
    tabButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topicTab === active)));
    body.replaceChildren();
    if (active === 'contracts') renderContracts();
    else if (active === 'payments') renderPayments();
    else if (active === 'forecast') renderForecast();
    else if (active === 'properties') renderProperties();
    else if (active === 'fuel') renderFuel();
    else if (active === 'occurrences') renderOccurrences();
    else if (active === 'quotes') renderQuotes();
    else renderPanel();
  }
  function renderContracts() {
    const state = get(), parking = topic === 'estacionamentos';
    const statusFilter = select('contract-status', [['all', 'Todos os prazos'], ['attention', 'Precisam de atenção'], ['current', 'Dentro do prazo'], ['closed', 'Encerrados']], contractMode);
    const results = el('div', { 'data-contract-results': '' });
    body.append(text('h3', parking ? 'Vagas, mensalidades e vigências' : 'Contratos, vigências e histórico'), advanced(field('Filtrar por prazo', statusFilter)), results);
    statusFilter.addEventListener('change', () => { contractMode = statusFilter.value; output(); });
    function output() {
      const contracts = state.contracts.filter(matching).map(row => ({ ...row, alert: contractStatus(row, data.reference) })).filter(row => contractMode === 'all' || (contractMode === 'attention' ? ['attention', 'expired'].includes(row.alert.key) : row.alert.key === contractMode));
      const warnings = contracts.filter(row => ['attention', 'expired'].includes(row.alert.key)).length;
      results.replaceChildren(metrics([['contracts', 'Contratos na consulta', String(contracts.length)], ['attention', 'Atenção ao prazo', String(warnings), warnings ? 'is-warning' : ''], ...(parking ? [['spaces', 'Vagas em contratos ativos', String(contracts.filter(row => row.status === 'Ativo').reduce((sum, row) => sum + (row.spaces || 0), 0))]] : [])]));
      const rows = contracts.map(row => {
        const actions = [btn('Ver mensalidades', () => { filterValue = row.id; filter.value = row.id; chooseTab('payments'); }, { 'aria-label': `Ver pagamentos de ${row.id}` })];
        if (!parking) actions[0].textContent = 'Ver pagamentos';
        if (parking) actions.push(btn('Simular vagas e valor', () => parkingEditor(row), { 'aria-label': `Simular vagas de ${row.id}` }));
        else actions.push(el('details', {}, [el('summary', { text: 'Histórico' }), el('ul', {}, state.changes.filter(item => item.contract === row.id).map(item => text('li', `${dateLabel(item.date)} · ${item.type}: ${item.description}`))), ...(state.changes.some(item => item.contract === row.id) ? [] : [text('p', 'Nenhuma atualização registrada para este contrato.', 'demo-help')])]));
        return [[text('strong', row.id), text('small', row.description), text('small', row.supplier)], `${dateLabel(row.start)} a ${dateLabel(row.end)}`, badge(row.alert.label, row.alert.tone), ...(parking ? [`${row.spaces ?? '—'} vagas × ${money(toCents(row.rate))}`, money(parkingMonthly(row))] : [badge(row.status)]), el('div', { class: 'demo-row-actions' }, actions)];
      });
      results.append(table(parking ? ['Contrato', 'Vigência', 'Prazo', 'Quantidade e valor por vaga', 'Mensalidade prevista', 'Consulta'] : ['Contrato', 'Vigência', 'Prazo', 'Situação', 'Consulta'], rows, 'Consulta de contratos'));
      if (parking) results.append(text('p', 'A mensalidade prevista considera vagas × valor unitário. Contratos encerrados aparecem no histórico e não compõem o total ativo.', 'demo-help'));
      else results.append(text('p', 'O prazo e a situação administrativa são informações diferentes. Um prazo terminado pede conferência do cadastro e dos documentos.', 'demo-help'));
    }
    function parkingEditor(row) {
      const panel = el('section', { class: 'demo-detail', 'data-parking-editor': '', tabindex: '-1' });
      const spaces = number('parking-spaces', row.spaces, { min: '1', max: '10000', step: '1' }), rate = number('parking-rate', row.rate, { min: '0.01' });
      const result = el('p', { role: 'status', 'aria-live': 'polite', 'data-parking-monthly': '' });
      const update = () => {
        const valid = validNumber(spaces) && validNumber(rate);
        if (valid) change('contracts', row.id, { spaces: parseNumber(spaces), rate: parseNumber(rate) });
        const expected = valid ? parkingMonthly({ spaces: parseNumber(spaces), rate: parseNumber(rate) }) : null;
        result.textContent = expected == null ? 'Preencha a quantidade de vagas e o valor unitário.' : `Mensalidade prevista: ${money(expected)}.`;
        spaces.setAttribute('aria-invalid', String(!validNumber(spaces))); rate.setAttribute('aria-invalid', String(!validNumber(rate)));
      };
      panel.append(text('h4', `${row.id} · Simular mensalidade`), el('div', { class: 'demo-toolbar' }, [field('Vagas contratadas', spaces), field('Valor mensal por vaga (R$)', rate)]), result, text('p', 'Esta simulação atualiza o valor previsto. A cobrança registrada permanece disponível para conferência.', 'demo-help'), btn('Atualizar a consulta', () => { render(); message('A consulta já considera a quantidade e o valor informados.'); }));
      body.querySelector('[data-parking-editor]')?.remove(); body.append(panel); spaces.addEventListener('input', update); rate.addEventListener('input', update); update(); panel.focus();
    }
    output();
  }
  function renderPayments() {
    const property = topic === 'imoveis', collection = property ? 'obligations' : 'payments', state = get();
    const options = select('payment-status', [['all', 'Todas as situações'], ['documents', 'Documentos pendentes'], ['open', 'Sem pagamento'], ['overdue', 'Vencidos'], ['paid', 'Pagos']], paymentMode);
    const periods = [...new Set(state[collection].map(row => row.competence))].sort().reverse();
    const period = select('payment-period', [['all', 'Todas as competências'], ...periods.map(value => [value, value.split('-').reverse().join('/')])], selectedPeriod);
    const list = el('div', { 'data-payment-results': '' }), detail = el('section', { class: 'demo-detail', 'data-payment-detail': '', tabindex: '-1' });
    let visibleIds = [];
    body.append(text('h3', property ? 'Obrigações e documentos' : topic === 'estacionamentos' ? 'Mensalidades e documentos' : 'Conferência e acompanhamento dos pagamentos'), advanced(field('Situação do pagamento', options), field('Competência', period)), list, detail);
    options.addEventListener('change', () => { paymentMode = options.value; selectedPayment = ''; output(); });
    period.addEventListener('change', () => { selectedPeriod = period.value; selectedPayment = ''; output(); });
    function output() {
      const current = get();
      const rows = current[collection].filter(matching).filter(row => selectedPeriod === 'all' || row.competence === selectedPeriod).filter(row => paymentMode === 'all' || (paymentMode === 'documents' ? row.documents !== 'Completa' : paymentMode === 'open' ? !row.paidOn : paymentStatus(row, data.reference).key === paymentMode));
      visibleIds = rows.map(row => row.id);
      const summary = paymentSummary(rows, data.reference);
      list.replaceChildren(metrics([['payment-open', 'A acompanhar', money(summary.open)], ['payment-paid', 'Pago', money(summary.paid)], ['payment-documents', 'Documentos pendentes', String(summary.documents), summary.documents ? 'is-warning' : '']]));
      list.append(table(['Registro', 'Valor', 'Vencimento', 'Documentos', 'Andamento', 'Consulta'], rows.map(row => {
        const owner = property ? current.properties.find(item => item.id === row.property)?.name : row.contract;
        const status = paymentStatus(row, data.reference);
        return [[text('strong', row.id), text('small', `${owner} · ${row.type || row.description}`), text('small', `Competência ${row.competence.split('-').reverse().join('/')}`)], money(toCents(row.amount)), dateLabel(row.due), badge(row.documents, row.documents === 'Completa' ? 'is-success' : 'is-warning'), [badge(status.label, status.tone), ...(row.stage ? [text('small', row.stage)] : [])], btn('Conferir registro', () => { selectedPayment = row.id; renderDetail(); detail.focus(); }, { 'aria-label': `Conferir ${row.id}`, 'data-payment-id': row.id })];
      }), 'Pagamentos do assunto selecionado'));
      const stillInScope = current[collection].some(row => row.id === selectedPayment && matching(row) && (selectedPeriod === 'all' || row.competence === selectedPeriod));
      if (!stillInScope) selectedPayment = (rows.find(row => !row.paidOn) || rows[0])?.id || '';
      renderDetail();
    }
    function renderDetail() {
      const row = get()[collection].find(item => item.id === selectedPayment); detail.replaceChildren();
      if (!row) { detail.append(text('p', 'Ajuste os filtros para consultar um registro.', 'demo-help')); return; }
      detail.dataset.selectedPayment = row.id;
      if (!visibleIds.includes(row.id)) detail.append(text('p', 'A situação deste registro mudou e ele saiu do filtro da lista. Ele continua selecionado aqui para você acompanhar os próximos passos.', 'demo-help'));
      const docs = el('input', { id: 'payment-documents', type: 'checkbox' }); docs.checked = row.documents === 'Completa'; docs.disabled = docs.checked || !!row.paidOn;
      const paidDate = el('input', { id: 'payment-date', name: 'payment-date', type: 'date', value: row.paidOn || data.reference, min: '2000-01-01', max: data.reference });
      paidDate.disabled = !!row.paidOn;
      const actionStatus = el('p', { role: 'status', 'aria-live': 'polite', 'data-payment-feedback': '', class: 'demo-help' });
      detail.append(text('h4', `${row.id} · ${row.type || row.description}`), text('p', `${money(toCents(row.amount))} · Vencimento ${dateLabel(row.due)}.`, 'demo-help'));
      if (topic === 'estacionamentos') {
        const contract = get().contracts.find(item => item.id === row.contract), expected = parkingMonthly(contract), billed = toCents(row.amount);
        detail.append(el('p', { class: expected != null && expected !== billed ? 'demo-error' : 'demo-help', 'data-parking-comparison': '', text: expected == null ? 'Preencha vagas e valor unitário no contrato para conferir a cobrança.' : `Previsto pelo contrato: ${money(expected)}. ${expected === billed ? 'A cobrança corresponde à mensalidade prevista.' : `Diferença da cobrança: ${money(billed - expected)}. Confira o período e a composição antes de encaminhar.`}` }));
      }
      detail.append(el('label', { class: 'demo-check', for: 'payment-documents' }, [docs, 'Documentos conferidos e completos']), field('Data do pagamento', paidDate));
      const forward = btn('Encaminhar para pagamento', () => { const patch = paymentPatch(get()[collection].find(item => item.id === row.id), 'forward'); if (patch && change(collection, row.id, patch)) { output(); detail.querySelector('[data-action=pay]')?.focus({ preventScroll: true }); message(`${row.id}: encaminhamento registrado.`); } }, { 'data-action': 'forward-payment', disabled: !paymentPatch(row, 'forward') });
      const pay = btn('Registrar pagamento', () => {
        if (!validDate(paidDate.value) || paidDate.value > data.reference) { paidDate.setAttribute('aria-invalid', 'true'); actionStatus.textContent = `Informe uma data válida até ${dateLabel(data.reference)}.`; return; }
        const patch = paymentPatch(get()[collection].find(item => item.id === row.id), 'pay', paidDate.value);
        if (patch && change(collection, row.id, patch)) { output(); message(`${row.id}: pagamento registrado. Consulte o painel para acompanhar o resultado.`); }
      }, { 'data-action': 'pay', disabled: row.documents !== 'Completa' || !!row.paidOn || (!!row.stage && row.stage !== 'Encaminhado') });
      detail.append(el('div', { class: 'demo-actions' }, [...(property ? [] : [forward]), pay, btn('Ver resultado no painel', () => chooseTab('panel'))]), actionStatus,
        text('p', row.paidOn ? `Pagamento registrado em ${dateLabel(row.paidOn)}.` : row.documents !== 'Completa' ? 'Primeiro, marque os documentos como conferidos. Depois, avance para o pagamento.' : row.stage === 'Em conferência' ? 'Documentação completa. O próximo passo é registrar o encaminhamento.' : 'Confira a data e registre o pagamento quando concluído.', 'demo-help'));
      docs.addEventListener('change', () => { const patch = paymentPatch(row, 'documents'); if (patch && change(collection, row.id, patch)) { output(); detail.querySelector('[data-action=forward-payment]:not([disabled]), [data-action=pay]:not([disabled])')?.focus({ preventScroll: true }); message(`${row.id}: documentos conferidos.`); } });
    }
    output();
  }
  function renderForecast() {
    const row = get().contracts.find(matching), result = el('div', { class: 'demo-grid', 'data-forecast-results': '' });
    if (!row) return;
    const horizon = number('forecast-months', months, { min: '1', max: '60', step: '1' });
    const fields = {};
    const components = [['service', 'Serviço'], ['material', 'Material']].map(([key, label]) => {
      const balance = number(`${key}-balance`, row[`${key}Balance`]), monthly = number(`${key}-monthly`, row[`${key}Monthly`]);
      fields[`${key}Balance`] = balance; fields[`${key}Monthly`] = monthly;
      return el('fieldset', { class: 'demo-component-fields' }, [text('legend', label), field('Saldo disponível (R$)', balance), field('Consumo mensal previsto (R$)', monthly, 'Em branco: premissa ausente. Zero: nenhum consumo previsto.')]);
    });
    body.append(text('h3', `${row.id} · Simular saldo de serviço e material`), text('p', 'Escolha o contrato no filtro acima. Altere as premissas para acompanhar o saldo ao final do horizonte.', 'demo-help'), field('Horizonte em meses', horizon), el('div', { class: 'demo-grid' }, components), result, text('p', 'Saldo previsto = saldo disponível − consumo mensal × meses. Só um saldo negativo indica insuficiência. Serviço e material são analisados separadamente; pagamentos registrados não alteram automaticamente estas premissas.', 'demo-help'), btn('Ver previsão no painel', () => chooseTab('panel')));
    function update() {
      months = parseNumber(horizon);
      const patch = Object.fromEntries(Object.entries(fields).map(([key, control]) => [key, parseNumber(control)]));
      if (Object.values(fields).every(validNumber)) change('contracts', row.id, patch);
      const blocks = [['service', 'Serviço'], ['material', 'Material']].map(([key, label]) => {
        const out = projectBalance(patch[`${key}Balance`], patch[`${key}Monthly`], months);
        return el('section', { class: 'demo-result', 'data-forecast-component': key }, [text('h4', label), ...(out.valid ? [badge(out.risk ? 'Saldo insuficiente' : out.remaining === 0 ? 'Saldo totalmente comprometido' : 'Saldo suficiente', out.risk ? 'is-danger' : out.remaining === 0 ? 'is-warning' : 'is-success'), metrics([[`${key}-spend`, 'Consumo previsto', money(out.spend)], [`${key}-remaining`, 'Saldo previsto', money(out.remaining)]])] : [badge('Cálculo indisponível', 'is-warning'), text('p', out.reason, 'demo-help')])]);
      });
      result.replaceChildren(...blocks);
      for (const control of [...Object.values(fields), horizon]) control.setAttribute('aria-invalid', String(!validNumber(control)));
    }
    for (const control of [...Object.values(fields), horizon]) control.addEventListener('input', update);
    update();
  }
  function renderProperties() {
    const state = get(), props = state.properties.filter(matching);
    body.append(text('h3', 'Cadastro e obrigações por imóvel'), table(['Imóvel', 'Vínculo', 'Contrato e vigência', 'Obrigações'], props.map(row => [
      [text('strong', row.name), text('small', row.id)], badge(row.ownership), row.ownership === 'Próprio' ? 'Sem contrato de locação' : [text('strong', row.contract), text('small', `${dateLabel(row.start)} a ${dateLabel(row.end)}`), badge(contractStatus({ ...row, status: 'Ativo' }, data.reference).label)], btn('Ver obrigações', () => { filterValue = row.id; filter.value = row.id; selectedPayment = ''; chooseTab('payments'); }, { 'aria-label': `Ver obrigações de ${row.name}` })
    ]), 'Cadastro de imóveis'), text('p', 'Imóveis próprios podem ter IPTU e taxas. O aluguel está vinculado aos imóveis locados.', 'demo-help'));
  }
  function renderFuel() {
    const state = get(), rows = state.fuel.filter(matching), stats = summarizeFuel(rows), editor = el('section', { class: 'demo-detail', 'data-fuel-editor': '' });
    if (!rows.some(row => row.id === selectedFuel)) selectedFuel = rows[0]?.id || '';
    body.append(text('h3', 'Abastecimentos e consumo'), metrics([['fuel-cost', 'Valor dos abastecimentos', money(stats.cost)], ['fuel-consumption', 'Consumo entre tanques cheios', stats.consumption == null ? 'Sem intervalo completo' : `${decimal(stats.consumption)} km/l`], ['fuel-partial', 'Abastecimentos parciais', String(stats.partial)]]), table(['Registro', 'Distância', 'Abastecimento', 'Consumo', 'Consulta'], rows.map(row => {
      const calc = fuelResult(row);
      return [[text('strong', row.id), text('small', `${row.vehicle} · ${dateLabel(row.date)}`)], calc.valid ? `${decimal(calc.distance)} km` : 'Conferir leituras', `${decimal(row.liters)} l × ${money(toCents(row.pricePerLiter))}`, !calc.valid ? 'Cálculo indisponível' : calc.consumption == null ? 'Parcial: não apurar km/l' : `${decimal(calc.consumption)} km/l`, btn('Simular leitura', () => { selectedFuel = row.id; edit(); editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, { 'aria-label': `Simular ${row.id}` })];
    }), 'Registros de abastecimento'), editor, text('p', 'O consumo consolidado usa a soma dos quilômetros dividida pela soma dos litros dos intervalos completos. Um abastecimento parcial não informa consumo isolado.', 'demo-help'));
    function edit() {
      const row = get().fuel.find(item => item.id === selectedFuel); if (!row) return;
      const inputs = [['previous', 'Leitura anterior (km)'], ['current', 'Leitura atual (km)'], ['liters', 'Litros abastecidos'], ['pricePerLiter', 'Preço por litro (R$)']].map(([key, label]) => [key, field(label, number(`fuel-${key}`, row[key], { min: ['liters', 'pricePerLiter'].includes(key) ? '0.01' : '0' }))]);
      const full = el('input', { id: 'fuel-full', type: 'checkbox' }); full.checked = row.full;
      const result = el('p', { role: 'status', 'aria-live': 'polite', 'data-fuel-result': '' });
      editor.replaceChildren(text('h4', `${row.id} · Conferir intervalo`), el('div', { class: 'demo-toolbar' }, inputs.map(([, control]) => control)), el('label', { class: 'demo-check', for: 'fuel-full' }, [full, 'Intervalo completo entre dois tanques cheios']), result, btn('Atualizar consulta e painel', () => { render(); message('Os abastecimentos deste veículo foram atualizados.'); }));
      function update() {
        const patch = Object.fromEntries(inputs.map(([key, wrapper]) => [key, parseNumber(wrapper.querySelector('input'))])); patch.full = full.checked;
        const valid = inputs.every(([, wrapper]) => validNumber(wrapper.querySelector('input')));
        if (valid) change('fuel', row.id, patch);
        const calc = fuelResult(patch);
        result.className = calc.valid ? 'demo-help' : 'demo-error';
        result.textContent = calc.valid ? `${decimal(calc.distance)} km · ${money(calc.cost)}. ${calc.consumption == null ? 'Abastecimento parcial: aguarde completar o intervalo para apurar o consumo.' : `Consumo: ${decimal(calc.consumption)} km/l.`}` : calc.reason;
        inputs.forEach(([, wrapper]) => { const control = wrapper.querySelector('input'); control.setAttribute('aria-invalid', String(!validNumber(control))); });
      }
      inputs.forEach(([, wrapper]) => wrapper.querySelector('input').addEventListener('input', update)); full.addEventListener('change', update); update();
    }
    edit();
  }
  function renderOccurrences() {
    const rows = get().occurrences.filter(matching);
    body.append(text('h3', 'Conferência de ocorrências'), metrics([['occurrences-pending', 'Aguardando conferência', String(rows.filter(row => row.status === 'Pendente').length)], ['occurrences-reviewed', 'Conferidas', String(rows.filter(row => row.status === 'Conferido').length)]]), table(['Registro', 'Motivo da conferência', 'Situação', 'Ação'], rows.map(row => [[text('strong', row.id), text('small', `${row.vehicle} · ${dateLabel(row.date)}`)], [text('strong', row.type), text('small', row.description)], badge(row.status, row.status === 'Conferido' ? 'is-success' : 'is-warning'), btn(row.status === 'Conferido' ? 'Conferido' : 'Marcar como conferido', () => { if (change('occurrences', row.id, { status: 'Conferido' })) { render(); message(`${row.id}: conferência registrada.`); } }, { disabled: row.status === 'Conferido', 'data-occurrence-id': row.id })]), 'Ocorrências de frota'));
  }
  function renderQuotes() {
    const row = get().items.find(item => item.id === filterValue) || get().items[0];
    const quantity = number('price-quantity', row.quantity, { min: '1', max: '100000', step: '1' });
    const research = row.research.map((value, index) => number(`research-${index}`, value, { min: '0.01', max: '10000000' }));
    const suppliers = row.suppliers.map((value, index) => number(`supplier-${index}`, value, { min: '0.01', max: '10000000' }));
    const methodInput = select('price-method', [['median', 'Mediana'], ['mean', 'Média']], method);
    const result = el('div', { 'data-price-results': '' });
    body.append(text('h3', `${row.id} · ${row.description}`), text('p', `${row.kind} · Unidade de medida: ${row.unit}. Informe valores unitários. Deixe em branco uma cotação ainda não disponível.`, 'demo-help'), field('Quantidade', quantity), el('div', { class: 'demo-grid' }, [el('fieldset', { class: 'demo-component-fields' }, [text('legend', 'Pesquisa de mercado'), ...research.map((control, index) => field(`Pesquisa ${'ABC'[index]} (R$ por unidade)`, control))]), el('fieldset', { class: 'demo-component-fields' }, [text('legend', 'Propostas recebidas'), ...suppliers.map((control, index) => field(`Fornecedor ${'ABC'[index]} (R$ por unidade)`, control))])]), advanced(field('Método para o valor de referência', methodInput)), result, btn('Ver comparação da cesta completa', () => chooseTab('panel')),
      text('p', 'A média soma os valores disponíveis e divide pela quantidade de pesquisas. A mediana usa o valor central. As fontes e as condições da proposta devem ser conferidas antes de qualquer decisão.', 'demo-help'));
    function update() {
      const patch = { quantity: parseNumber(quantity), research: research.map(parseNumber), suppliers: suppliers.map(parseNumber) };
      method = methodInput.value;
      const valid = [quantity, ...research, ...suppliers].every(validNumber);
      if (valid) change('items', row.id, patch);
      const calculation = valid ? priceComparison([{ ...row, ...patch }], method) : null;
      const ref = calculation?.lines[0].reference;
      result.replaceChildren(metrics([['price-reference', `${method === 'median' ? 'Mediana' : 'Média'} por unidade`, money(ref?.cents)], ['price-item-total', 'Referência total do item', money(calculation?.referenceTotal)], ['price-research-count', 'Pesquisas preenchidas', String(ref?.count || 0)]]));
      if (!valid) result.append(text('p', 'Use uma quantidade inteira positiva e cotações maiores que zero. Para indicar ausência de uma cotação, deixe o campo em branco.', 'demo-error'));
      else if ((ref?.count || 0) < 3) result.append(text('p', `${ref?.count || 0} de 3 pesquisas preenchidas. Confira as referências ausentes antes de finalizar o mapa.`, 'demo-help'));
      if (calculation) result.append(table(['Proposta', 'Total do item', 'Situação'], calculation.proposals.map(proposal => [`Fornecedor ${'ABC'[proposal.index]}`, money(proposal.total), proposal.complete ? 'Cotação preenchida' : 'Cotação ausente']), 'Propostas do item selecionado'));
      for (const control of [quantity, ...research, ...suppliers]) control.setAttribute('aria-invalid', String(!validNumber(control)));
    }
    [quantity, ...research, ...suppliers].forEach(control => control.addEventListener('input', update)); methodInput.addEventListener('change', update); update();
  }
  function renderPanel() {
    const state = get();
    body.append(text('h3', 'Painel deste projeto'));
    if (topic === 'mapa-precos') {
      const comparison = priceComparison(state.items, method), methodInput = select('panel-price-method', [['median', 'Mediana'], ['mean', 'Média']], method);
      body.append(text('p', 'O comparativo considera todos os itens da cesta, independentemente do item selecionado para edição.', 'demo-help'), advanced(field('Método da referência', methodInput)), metrics([['price-basket-reference', 'Referência da cesta', money(comparison.referenceTotal)], ['price-complete-proposals', 'Propostas com todos os itens', `${comparison.proposals.filter(row => row.complete).length} de 3`], ['price-lowest-complete', 'Menor total completo', money(comparison.lowest)]]));
      methodInput.addEventListener('change', () => { method = methodInput.value; render(); });
      body.append(table(['Fornecedor', 'Total da proposta', 'Diferença para referência', 'Conferência'], comparison.proposals.map(row => [`Fornecedor ${'ABC'[row.index]}`, row.complete ? money(row.total) : `Parcial: ${money(row.partial)}`, row.variation == null ? 'Não comparável' : `${row.variation >= 0 ? '+' : ''}${decimal(row.variation)}%`, row.complete ? badge(comparison.lowestIndexes.includes(row.index) ? 'Menor total entre propostas completas' : 'Todos os itens cotados', comparison.lowestIndexes.includes(row.index) ? 'is-success' : '') : badge(`${row.missing} ${row.missing === 1 ? 'item ausente' : 'itens ausentes'} · fora da comparação completa`, 'is-warning')]), 'Comparação das propostas completas'));
      body.append(table(['Item', 'Tipo e quantidade', 'Referência unitária', 'Referência total', 'Propostas A / B / C'], state.items.map((row, index) => { const calc = comparison.lines[index]; return [[text('strong', row.id), text('small', row.description)], `${row.kind} · ${row.quantity ?? '—'} ${row.unit}`, money(calc.reference.cents), money(calc.total), calc.proposals.map(money).join(' / ')]; }), 'Composição do mapa comparativo'));
      body.append(el('details', {}, [el('summary', { text: 'Fontes e datas das cotações' }), table(['Referência', 'Origem', 'Data'], state.sources.map(row => [row.name, `${row.type} · ${row.reference}`, dateLabel(row.date)]), 'Fontes da pesquisa e das propostas')]), text('p', 'Uma proposta incompleta não concorre ao menor total da cesta. O comparativo apoia a conferência de preços; a escolha também depende de escopo, condições, documentação e critérios aplicáveis.', 'demo-help'));
      return;
    }
    if (topic === 'frota') {
      const fuel = summarizeFuel(state.fuel.filter(matching)), occurrences = state.occurrences.filter(matching);
      body.append(metrics([['fuel-panel-cost', 'Total dos abastecimentos', money(fuel.cost)], ['fuel-panel-consumption', 'Consumo ponderado', fuel.consumption == null ? 'Sem intervalo completo' : `${decimal(fuel.consumption)} km/l`], ['fuel-panel-pending', 'Conferências pendentes', String(occurrences.filter(row => row.status === 'Pendente').length)]]), text('p', `${fuel.full} intervalos completos e ${fuel.partial} abastecimentos parciais. O consumo usa ${decimal(fuel.distance)} km ÷ ${decimal(fuel.liters)} litros dos intervalos completos.`, 'demo-help'), table(['Veículo', 'Abastecimentos', 'Valor', 'Consumo entre tanques cheios'], state.vehicles.filter(matching).map(vehicle => { const calc = summarizeFuel(state.fuel.filter(row => row.vehicle === vehicle.id)); return [vehicle.name, String(calc.count), money(calc.cost), calc.consumption == null ? 'Sem intervalo completo' : `${decimal(calc.consumption)} km/l`]; }), 'Resumo de abastecimentos por veículo'));
      return;
    }
    const property = topic === 'imoveis', rows = state[property ? 'obligations' : 'payments'].filter(matching).filter(row => row.competence === data.period), summary = paymentSummary(rows, data.reference);
    body.append(text('p', `Pagamentos da competência ${data.period.split('-').reverse().join('/')}, considerando o filtro escolhido acima.`, 'demo-help'), metrics([['panel-total', 'Total registrado', money(summary.total)], ['panel-paid', 'Pago', money(summary.paid)], ['panel-open', 'A acompanhar', money(summary.open)], ['panel-overdue', 'Vencido e sem pagamento', money(summary.overdue), summary.overdue ? 'is-danger' : '']]));
    const percent = summary.total ? summary.paid / summary.total * 100 : 0;
    body.append(el('label', { for: 'payment-progress', text: `${decimal(percent)}% do valor registrado foi pago.` }), el('progress', { id: 'payment-progress', class: 'topic-progress', max: '100', value: String(percent) }), text('p', `${summary.documents} registros com documentos pendentes.`, 'demo-help'));
    if (property) {
      body.append(table(['Imóvel', 'Vínculo', 'Pago', 'A acompanhar'], state.properties.filter(matching).map(row => { const values = paymentSummary(rows.filter(item => item.property === row.id), data.reference); return [row.name, row.ownership, money(values.paid), money(values.open)]; }), 'Acompanhamento por imóvel'));
    } else if (topic === 'estacionamentos') {
      const contracts = state.contracts.filter(matching), current = contracts.filter(row => row.status === 'Ativo');
      const complete = current.every(row => parkingMonthly(row) != null);
      body.append(metrics([['parking-spaces', 'Vagas em contratos ativos', current.some(row => row.spaces == null) ? 'Preenchimento pendente' : String(current.reduce((sum, row) => sum + row.spaces, 0))], ['parking-expected', 'Mensalidade prevista ativa', complete ? money(current.reduce((sum, row) => sum + parkingMonthly(row), 0)) : 'Preenchimento pendente'], ['parking-attention', 'Prazos que precisam de atenção', String(contracts.filter(row => ['attention', 'expired'].includes(contractStatus(row, data.reference).key)).length)]]));
      body.append(text('p', 'A previsão mensal vem das vagas e do valor unitário dos contratos ativos. Os valores registrados para pagamento são conferidos separadamente.', 'demo-help'));
    } else {
      const contracts = state.contracts.filter(matching);
      body.append(text('h4', `Previsão de saldos · ${months || '—'} meses`), table(['Contrato', 'Serviço', 'Material', 'Conferência'], contracts.map(row => {
        const service = projectBalance(row.serviceBalance, row.serviceMonthly, months), material = projectBalance(row.materialBalance, row.materialMonthly, months), risk = [service, material].some(item => item.valid && item.risk), missing = [service, material].some(item => !item.valid);
        return [row.id, service.valid ? money(service.remaining) : 'Premissa ausente ou inválida', material.valid ? money(material.remaining) : 'Premissa ausente ou inválida', badge(risk ? 'Saldo insuficiente' : missing ? 'Completar premissas' : 'Sem saldo negativo', risk ? 'is-danger' : missing ? 'is-warning' : 'is-success')];
      }), 'Previsão de serviço e material por contrato'), text('p', 'A previsão usa as premissas da aba “Previsão de saldos”. Alterar uma premissa atualiza esta visão; registrar um pagamento atualiza os valores pagos acima.', 'demo-help'));
    }
  }
  render(); root.dataset.ready = 'true';
}

async function start() {
  const roots = [...document.querySelectorAll('[data-topic]')];
  if (!roots.length) return;
  try {
    const response = await fetch(new URL('../../content/topic-data.json', import.meta.url));
    if (!response.ok) throw new Error('Base indisponível');
    const data = await response.json();
    let storage = null; try { storage = window.sessionStorage; } catch {}
    const store = createTopicStore(data, storage);
    roots.forEach(root => mountTopic(root, data, store));
  } catch {
    roots.forEach(root => { root.replaceChildren(text('p', 'A demonstração não carregou. Você pode continuar lendo o projeto ou baixar o kit completo abaixo.', 'demo-help'), btn('Tentar novamente', () => start())); root.dataset.ready = 'error'; });
  }
}
if (typeof document !== 'undefined') start();
