import { REFERENCE_DATE, getWorkspace, subscribe } from './workspace.mjs';
import { contractAlert, projectComponent, formatMoney, formatDate, paymentStatus } from './finance-logic.mjs';

function element(tag, attributes = {}, children = []) {
  const result = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'text') result.textContent = value;
    else if (key === 'class') result.className = value;
    else result.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) if (child != null) result.append(child);
  return result;
}
const text = (tag, value, className = '') => element(tag, { text: value, ...(className ? { class: className } : {}) });
const caseUrl = (slug, contract = '') => `./projetos/${slug}/${contract ? `?contrato=${encodeURIComponent(contract)}` : ''}`;
function project(row) {
  return [
    { label: 'Serviço', key: 'service', result: projectComponent(row.serviceBalance, row.serviceMonthly, row.months) },
    { label: 'Material', key: 'material', result: projectComponent(row.materialBalance, row.materialMonthly, row.months) }
  ];
}

export function mountOverview(root) {
  let selectedId = 'all';
  const filterId = 'overview-contract';
  const filter = element('select', { id: filterId, 'data-overview-filter': '' }, [
    element('option', { value: 'all', text: 'Todos os contratos' }),
    ...getWorkspace().contracts.map(row => element('option', { value: row.id, text: `${row.id} · ${row.object}` }))
  ]);
  const metrics = element('div', { class: 'overview-metrics', 'data-overview-metrics': '' });
  const priorities = element('div', { class: 'overview-priorities', 'data-overview-priorities': '' });
  const progress = element('div', { class: 'overview-progress', 'data-overview-progress': '' });
  const footer = element('div', { class: 'overview-footer' });
  const feedback = element('p', { class: 'overview-feedback', role: 'status', 'aria-live': 'polite', tabindex: '-1', 'data-overview-feedback': '' });
  const updates = element('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'data-overview-status': '' });
  const challenge = element('button', { type: 'button', class: 'overview-task', 'data-overview-task': '', text: 'Encontrar um prazo próximo' });
  const metric = (label, value, caption, key) => element('div', { class: 'overview-metric', 'data-overview-metric': key }, [text('span', label), text('strong', value), text('small', caption)]);

  function render(announce = false) {
    const state = getWorkspace();
    const contracts = state.contracts.filter(row => selectedId === 'all' || row.id === selectedId);
    const payments = state.payments.filter(row => selectedId === 'all' || row.contract === selectedId);
    const forecasts = state.forecasts.filter(row => selectedId === 'all' || row.id === selectedId);
    const alerts = contracts.map(row => ({ ...row, alert: contractAlert(row, REFERENCE_DATE, 60) }));
    const attention = alerts.filter(row => ['attention', 'expired'].includes(row.alert.key));
    const open = payments.filter(row => paymentStatus(row, REFERENCE_DATE).key !== 'paid');
    const pendingValue = open.reduce((total, row) => total + row.amount, 0);
    const components = forecasts.flatMap(project).map(row => row.result);
    const valid = components.filter(row => row.status === 'valid');
    const risk = valid.filter(row => row.risk).length;
    const unavailable = components.length - valid.length;
    const riskCaption = !components.length ? 'Este contrato não tem cenário de saldo' : `${valid.length} calculados${unavailable ? ` · ${unavailable} sem projeção` : ''}`;
    metrics.replaceChildren(
      metric('Atenção ao prazo', String(attention.length), `Janela de até 60 dias · ${contracts.length} na consulta`, 'deadlines'),
      metric('Pagamentos em aberto', formatMoney(pendingValue), `${open.length} registro${open.length === 1 ? '' : 's'} sem pagamento`, 'payments'),
      metric('Componentes em risco', valid.length ? String(risk) : '—', riskCaption, 'risk')
    );

    const ordered = [...alerts].sort((a, b) => {
      const priority = row => ['expired', 'attention', 'unavailable', 'current', 'future', 'closed'].indexOf(row.alert.key);
      return priority(a) - priority(b) || (a.alert.days ?? Infinity) - (b.alert.days ?? Infinity);
    }).slice(0, 3);
    priorities.replaceChildren(text('h3', selectedId === 'all' ? 'Prioridades do acompanhamento' : 'Contrato em foco'));
    for (const row of ordered) {
      const status = text('small', row.alert.label, row.alert.tone);
      priorities.append(element('a', { class: 'overview-row', href: caseUrl('vigencia-contratual', row.id), 'data-overview-contract': row.id }, [
        element('span', {}, [text('strong', row.id), text('span', row.object)]), status,
        element('span', { 'aria-hidden': 'true', text: '↗' })
      ]));
    }

    const focusedForecast = forecasts.find(row => project(row).some(component => component.result.status === 'valid' && component.result.risk)) || forecasts[0];
    progress.replaceChildren();
    if (focusedForecast) {
      const horizon = /^\d+$/.test(focusedForecast.months) && Number(focusedForecast.months) >= 1 && Number(focusedForecast.months) <= 60 ? ` · ${focusedForecast.months} ${focusedForecast.months === '1' ? 'mês' : 'meses'}` : '';
      progress.append(text('h3', `Projeção de saldo · ${focusedForecast.id}${horizon}`));
      for (const component of project(focusedForecast)) {
        const data = component.result;
        const validResult = data.status === 'valid';
        const detail = validResult ? `Saldo previsto: ${formatMoney(data.remaining)}` : 'Projeção indisponível';
        const ratio = validResult ? data.balance > 0 ? Math.max(0, Math.min(100, data.spend / data.balance * 100)) : data.spend > 0 ? 100 : 0 : 0;
        const track = element('div', { class: 'overview-track', 'aria-hidden': 'true' }, element('span', { class: `overview-fill${validResult && data.risk ? ' is-danger' : ''}` }));
        track.firstElementChild.style.width = `${ratio}%`;
        const caption = validResult ? `${formatMoney(data.spend)} previstos sobre ${formatMoney(data.balance)} disponíveis` : 'Complete as premissas no simulador';
        progress.append(element('div', { class: `overview-component${validResult && data.risk ? ' is-danger' : ''}`, 'data-overview-component': component.key }, [
          element('div', { class: 'overview-progress-label' }, [text('span', component.label), text('strong', detail)]), track, text('small', caption)
        ]));
      }
    } else progress.append(text('h3', 'Saldo contratual'), text('p', 'Não há cenário de previsão para este contrato. Consulte os prazos e pagamentos relacionados.'));

    const destinationId = selectedId === 'all' ? '' : selectedId;
    footer.replaceChildren(
      element('a', { class: 'overview-link', href: caseUrl('vigencia-contratual', destinationId), text: 'Consultar contratos ↗', 'data-overview-contract-link': '' }),
      element('a', { class: 'overview-link', href: caseUrl('pagamentos', destinationId), text: 'Conferir pagamentos ↗', 'data-overview-payments-link': '' })
    );
    if (focusedForecast) footer.append(element('a', { class: 'overview-link', href: caseUrl('previsao-contratual', focusedForecast.id), text: 'Simular saldo ↗', 'data-overview-forecast-link': '' }));
    if (announce) updates.textContent = `${selectedId === 'all' ? 'Todos os contratos' : selectedId}: ${attention.length} com atenção ao prazo; ${formatMoney(pendingValue)} em pagamentos abertos; ${valid.length ? `${risk} componentes em risco${unavailable ? ` e ${unavailable} sem projeção` : ''}` : 'sem projeção de saldo disponível'}.`;
  }

  filter.addEventListener('change', () => { selectedId = filter.value; feedback.replaceChildren(); render(true); });
  challenge.addEventListener('click', () => {
    selectedId = 'CT-102'; filter.value = selectedId; render();
    const contract = getWorkspace().contracts.find(row => row.id === selectedId);
    const alert = contractAlert(contract, REFERENCE_DATE, 60);
    feedback.replaceChildren(document.createTextNode(`${selectedId}: ${alert.label.toLocaleLowerCase('pt-BR')}. Confira o histórico e o próximo encaminhamento. `), element('a', { href: caseUrl('vigencia-contratual', selectedId), text: 'Abrir esse contrato ↗', class: 'overview-link' }));
    feedback.focus({ preventScroll: true });
  });
  root.replaceChildren(
    element('div', { class: 'overview-top' }, [text('span', 'Experimente o controle', 'overview-live'), text('span', `Referência · ${formatDate(REFERENCE_DATE)}`)]),
    text('h2', 'Visão do acompanhamento', 'overview-title'),
    element('div', { class: 'overview-filter' }, [element('label', { for: filterId, text: 'Contrato em foco' }), filter]),
    metrics, priorities, progress, footer, challenge, feedback, updates
  );
  render();
  subscribe(() => render(true));
  root.dataset.ready = 'true';
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-overview]')) {
    try { mountOverview(root); }
    catch {
      root.replaceChildren(text('h2', 'Visão do acompanhamento', 'overview-title'), text('p', 'Explore os controles de contratos, pagamentos e previsões.'), element('a', { class: 'overview-link', href: './#projetos', text: 'Conhecer os projetos ↗' }));
    }
  }
}
