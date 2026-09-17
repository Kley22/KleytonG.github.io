import {money,dateBR,daysBetween,contractStatus,projectBalance,paymentStatus,adjustment,fleetMetrics} from './logic.mjs';
const dataElement=document.querySelector('#demo-data');
const root=document.querySelector('[data-demo]');
if(root&&dataElement){
  const data=JSON.parse(dataElement.textContent), type=root.dataset.demo;
  const form=root.querySelector('form');
  const get=name=>form.elements.namedItem(name).value;
  const set=(id,value)=>{root.querySelector('#'+id).textContent=value;};
  const pill=value=>{const span=document.createElement('span');span.className='pill '+(['Vencido','Em atraso'].includes(value)?'danger':value==='A renovar'?'warn':['Encerrado','Não iniciado'].includes(value)?'neutral':'');span.textContent=value;return span;};
  const cell=(row,text,secondary)=>{const td=document.createElement('td');td.textContent=text;if(secondary){const small=document.createElement('small');small.textContent=secondary;td.append(small);}row.append(td);return td;};
  const rows=(values,render,cols)=>{
    const tbody=root.querySelector('tbody');tbody.replaceChildren();
    values.forEach(value=>{const row=document.createElement('tr');render(row,value);tbody.append(row);});
    if(!values.length){const row=document.createElement('tr'),td=cell(row,'Nenhum registro encontrado para esses filtros.');td.colSpan=cols;td.className='empty-state';tbody.append(row);}
    set('demo-status',`${values.length} registros exibidos. Dados fictícios.`);
  };
  const update=()=>{
    if(!form.checkValidity()){set('demo-error','Revise os campos destacados. Os resultados abaixo mantêm a última simulação válida.');return;}
    set('demo-error','');
    if(type==='vigencia-contratual'){
      const reference=get('reference'),threshold=Number(get('threshold')),filter=get('status'),search=get('search').toLocaleLowerCase('pt-BR');
      const values=data.rows.map(r=>({...r,state:contractStatus(r,reference,threshold)})).filter(r=>(filter==='all'||r.state===filter)&&`${r.id} ${r.supplier} ${r.object}`.toLocaleLowerCase('pt-BR').includes(search));
      set('metric-one',values.filter(r=>['Vigente','A renovar'].includes(r.state)).length);
      set('metric-two',values.filter(r=>r.state==='A renovar').length);
      set('metric-three',values.filter(r=>r.state==='Vencido').length);
      rows(values,(row,r)=>{cell(row,r.id,r.supplier);cell(row,r.object);cell(row,dateBR(r.end));cell(row,r.closed?'—':daysBetween(reference,r.end)+' dias');cell(row,'').append(pill(r.state));},5);
    }
    if(type==='pagamentos'){
      const reference=get('reference'),filter=get('status'),period=get('period'),search=get('search').toLocaleLowerCase('pt-BR');
      const values=data.rows.map(r=>({...r,state:paymentStatus(r,reference)})).filter(r=>(filter==='all'||r.state===filter)&&(period==='all'||period===r.period)&&`${r.supplier} ${r.id} ${r.contract}`.toLocaleLowerCase('pt-BR').includes(search));
      ['Pago','A pagar','Em atraso'].forEach((state,i)=>set(['metric-one','metric-two','metric-three'][i],money(values.filter(r=>r.state===state).reduce((sum,r)=>sum+Math.round(r.value*100),0)/100)));
      rows(values,(row,r)=>{cell(row,r.id,r.supplier);cell(row,r.period.split('-').reverse().join('/'));cell(row,money(r.value));cell(row,dateBR(r.due));cell(row,r.documents);cell(row,dateBR(r.paid||''));cell(row,'').append(pill(r.state));},7);
    }
    if(type==='previsao-contratual'){
      const months=Number(get('months'));
      ['service','material'].forEach(key=>{
        const result=projectBalance(Number(get(key+'Balance')),Number(get(key+'Monthly')),months);
        set(key+'-balance',money(result.remaining));set(key+'-spend',`Consumo previsto: ${money(result.spend)} em ${months} ${months===1?'mês':'meses'}.`);
        set(key+'-state',result.risk?'Insuficiência projetada':'Saldo suficiente na simulação');
        root.querySelector('#'+key+'-panel').classList.toggle('risk',result.risk);
      });
      set('demo-status','Projeção atualizada. Cada componente é avaliado separadamente.');
    }
    if(type==='aditivos-repactuacoes'){
      const base=Number(get('base')),percent=Number(get('percent')),result=adjustment(base,percent);
      set('metric-one',money(base));set('metric-two',money(result.added));set('metric-three',money(result.total));
      set('adjustment-description',`Aplicação demonstrativa de ${percent.toLocaleString('pt-BR')}% sobre ${money(base)}. Novo valor mensal: ${money(result.total)}.`);
      set('demo-status','Simulação atualizada; o histórico ilustrativo permanece preservado.');
    }
    if(type==='gestao-frota'){
      try{
        const result=fleetMetrics(Number(get('previous')),Number(get('current')),Number(get('litres')),Number(get('maintenance')));
        set('metric-one',result.distance.toLocaleString('pt-BR')+' km');set('metric-two',result.efficiency.toLocaleString('pt-BR',{maximumFractionDigits:2})+' km/L');
        set('metric-three',result.untilMaintenance.toLocaleString('pt-BR')+' km');
        set('maintenance-state',result.untilMaintenance<=0?'Quilometragem de manutenção atingida.':result.untilMaintenance<=500?'Manutenção próxima: conferir o agendamento.':'Manutenção dentro do intervalo informado.');
        root.querySelector('#metric-three').classList.toggle('bad',result.untilMaintenance<=0);
        set('demo-status','Indicadores atualizados. Dados fictícios.');
      }catch(error){set('demo-error',error.message+' Os resultados mantêm a última simulação válida.');}
    }
  };
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  form.addEventListener('submit',event=>event.preventDefault());
  // Native controls reset after the event; calculate after that default action.
  form.addEventListener('reset',()=>setTimeout(update,0));
  root.querySelector('[type=reset]').hidden=false;
  update();
}
