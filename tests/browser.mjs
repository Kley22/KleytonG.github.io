// Optional browser QA: npm install --no-save playwright; npx playwright install chromium.
// Serve the project and set PORTFOLIO_URL to its base URL.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getInitialWorkspace} from '../assets/js/workspace.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8765/KleytonG.github.io/';
const projects=JSON.parse(fs.readFileSync(new URL('../content/projects.json',import.meta.url),'utf8'));
const viewports=[375,390,430,768,1366,1920];
const routes=['','404.html',...projects.map(project=>'projetos/'+project.slug+'/')];
const legacyRoutes={'gestao-frota':'controle-frota','aditivos-repactuacoes':'vigencia-contratual'};
const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER||chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const failures=[],sourceRequests=[];
const sourcePattern=/(?:\.xlsx?(?:[?#]|$)|docs\.google\.com\/spreadsheets|drive\.google\.com\/(?:file|open))/i;
let checked=0,explorersChecked=0,stepsChecked=0,keyboardChecks=0,staticPanelsChecked=0,demoChecks=0,connectedChecks=0;
const normalize=text=>text.replace(/\s+/g,' ').trim();
const moneyCents=text=>Math.round(Number(text.replace(/[^\d,-]/g,'').replace(',','.'))*100);
const rowsIn=locator=>locator.locator('tbody tr:not(:has(td[colspan]))');
const initialWorkspace=getInitialWorkspace();
async function resetVisit(page){
  // Existing isolated scenarios must not inherit a previous visitor action.
  await page.evaluate(()=>sessionStorage.clear());
}
async function dashboardReconciles(app){
  const items=await rowsIn(app.locator('#dashboard-records')).evaluateAll(rows=>rows.map(row=>Array.from(row.cells,cell=>cell.textContent.trim())));
  const unique=new Set(items.map(row=>row[0]));
  assert.equal(unique.size,items.length,'The dashboard ledger includes each obligation exactly once');
  const total=items.reduce((sum,row)=>sum+moneyCents(row[4]),0);
  const paid=items.filter(row=>row[5]==='Pago').reduce((sum,row)=>sum+moneyCents(row[4]),0);
  const metric=async key=>moneyCents(await app.locator('[data-metric="'+key+'"]').innerText());
  assert.equal(await metric('dashboard-total'),total,'Registered metric reconciles to the visible ledger');
  assert.equal(await metric('dashboard-paid'),paid,'Paid metric includes only paid ledger records');
  assert.equal(await metric('dashboard-open'),total-paid,'Open metric excludes paid records');
  const groups=await rowsIn(app.locator('#dashboard-breakdown')).evaluateAll(rows=>rows.map(row=>Array.from(row.cells,cell=>cell.textContent.trim())));
  assert.equal(groups.reduce((sum,row)=>sum+moneyCents(row[2]),0),total,'Grouped origins reconcile without double counting');
  return {items,total,paid,open:total-paid};
}

function monitor(page){
  page.on('pageerror',error=>failures.push({type:'pageerror',message:error.message}));
  page.on('console',message=>{if(message.type()==='error')failures.push({type:'console',message:message.text()});});
  page.on('response',response=>{if(response.status()>=400)failures.push({type:'http',url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>failures.push({type:'request',url:request.url(),message:request.failure()?.errorText}));
  page.on('request',request=>{
    if(sourcePattern.test(request.url()))sourceRequests.push(request.url());
  });
}
async function visit(page,route,{interactive=true}={}){
  const response=await page.goto(url+route);
  assert.equal(response.status(),200,`HTTP status for ${route||'home'}`);
  assert.equal(await page.locator('h1').count(),1,`One main heading: ${route||'home'}`);
  assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'),/^https:\/\/kleyton-gsilva\.netlify\.app\//,'Canonical URLs use the published Netlify domain');
  if(interactive&&await page.locator('[data-overview]').count())await page.locator('[data-overview][data-ready="true"]').waitFor({state:'visible'});
  if(interactive&&await page.locator('.demo-app[data-demo]').count())await page.locator('.demo-app[data-demo][data-ready="true"]').waitFor({state:'visible'});
}
async function assertCase(page,project,{interactive=true}={}){
  assert.equal(normalize(await page.locator('h1').innerText()),project.name);
  const body=normalize(await page.locator('main').innerText());
  for(const text of [project.problem,project.solution,project.role])assert.ok(body.includes(normalize(text)),`Professional context remains readable: ${project.slug}`);
  const app=page.locator('.demo-app[data-demo="'+project.slug+'"]');
  assert.equal(await app.count(),1,`One demonstration belongs to the case: ${project.slug}`);
  if(interactive){
    assert.equal(await app.getAttribute('data-ready'),'true',`Demonstration mounted: ${project.slug}`);
    assert.ok(await app.locator('input,select,button').count()>0,`Demonstration has working controls: ${project.slug}`);
  }else assert.equal(await app.locator('.demo-fallback').isVisible(),true,`Readable fallback without JavaScript: ${project.slug}`);
  const targets=await page.locator('a[href],script[src],link[href]').evaluateAll(elements=>elements.map(element=>element.getAttribute('href')||element.getAttribute('src')||''));
  assert.deepEqual(targets.filter(target=>sourcePattern.test(target)),[],`No operational workbook or internal Drive source link: ${project.slug}`);
}
async function checkExplorer(explorer,label,expectedSteps){
  const buttons=explorer.locator('button[data-panel]'),panels=explorer.locator('.explorer-panel');
  const count=await buttons.count();
  assert.ok(count>1,`Explorer has multiple steps: ${label}`);
  assert.equal(await panels.count(),count,`Every control has a panel: ${label}`);
  if(expectedSteps)assert.equal(count,expectedSteps.length,`All described steps are available: ${label}`);
  const identifiers=await panels.evaluateAll(elements=>elements.map(element=>element.id));
  assert.equal(new Set(identifiers).size,count,`Panel IDs are unique: ${label}`);
  async function selected(index,checkFocus=false){
    const button=buttons.nth(index),target=await button.getAttribute('data-panel');
    assert.equal(await button.getAttribute('aria-controls'),target,`Control relationship: ${label}`);
    assert.ok(identifiers.includes(target),`Target exists locally: ${label}`);
    assert.equal(await button.getAttribute('aria-pressed'),'true',`Selected step: ${label}`);
    assert.equal(await explorer.locator('button[data-panel][aria-pressed="true"]').count(),1,`One selected control: ${label}`);
    assert.equal(await explorer.locator('.explorer-panel:visible').count(),1,`One visible panel: ${label}`);
    assert.equal(await explorer.locator('.explorer-panel:visible').getAttribute('id'),target,`Visible content follows selection: ${label}`);
    if(checkFocus)assert.equal(await button.evaluate(element=>document.activeElement===element),true,`Keyboard focus follows selection: ${label}`);
    if(expectedSteps){
      const step=expectedSteps[index],content=normalize(await explorer.locator('.explorer-panel:visible').innerText());
      for(const text of [step.title,step.input,step.action,step.output])assert.ok(content.includes(normalize(text)),`Complete step content: ${label}, ${step.label}`);
    }
  }
  await selected(0);
  for(let index=0;index<count;index++){
    assert.equal(await buttons.nth(index).isVisible(),true,`Enhanced controls are visible: ${label}`);
    await buttons.nth(index).click();await selected(index);stepsChecked++;
  }
  // Include boundary wrapping, both axes, first/last shortcuts and focus behavior.
  const keyCases=[['Home',0],['ArrowLeft',count-1],['ArrowRight',0],['ArrowDown',1],['ArrowUp',0],['End',count-1],['Home',0]];
  let current=count-1;
  for(const [key,next] of keyCases){
    await buttons.nth(current).press(key);await selected(next,true);current=next;keyboardChecks++;
  }
  explorersChecked++;
}

async function checkOperations(app,slug){
  const metricText=async key=>normalize(await app.locator('[data-metric="'+key+'"]').innerText());
  const rows=async id=>app.locator('#'+id+' tbody tr:not(:has(td[colspan]))').count();
  if(slug==='controle-imoveis'){
    assert.equal(await rows('property-records'),8);
    assert.equal(await metricText('property-open'),'R$ 4.338,50');
    assert.equal(await metricText('property-paid'),'R$ 10.320,00');
    assert.equal(await metricText('property-documents'),'3');
    await app.locator('#property-filter').selectOption('p1');
    assert.equal(await rows('property-records'),3);
    assert.equal(await metricText('property-open'),'R$ 915,00');
    await app.locator('#property-type').selectOption('Condomínio');
    assert.equal(await rows('property-records'),1);
    await app.locator('#property-status').selectOption('paid');
    assert.equal(await rows('property-records'),0);
    assert.match(await app.locator('#property-records').innerText(),/Nenhum registro/);
    await app.locator('#property-reset').click();
    await app.locator('#property-status').selectOption('overdue');
    assert.equal(await rows('property-records'),1);
    assert.equal(await metricText('property-overdue'),'R$ 680,00');
    await app.locator('#property-reference').fill('2026-10-01');
    assert.equal(await rows('property-records'),5,'Reference change moves all unpaid September obligations into overdue');
    assert.equal(await metricText('property-paid'),'R$ 0,00','Paid obligations stay out of the overdue filter');
    await app.locator('#property-reference').fill('');
    assert.equal(await app.locator('#property-reference').getAttribute('aria-invalid'),'true');
    assert.match(await app.locator('#property-error').innerText(),/data de referência válida/);
    assert.equal(await app.locator('#property-records').isVisible(),false,'Invalid reference suppresses stale results');
    await app.locator('#property-reset').click();
    assert.equal(await app.locator('#property-records').isVisible(),true);
    assert.equal(await rows('property-records'),8);
    demoChecks+=6;
  }else if(slug==='controle-frota'){
    assert.equal(await metricText('fleet-efficiency'),'12,00 km/l');
    await app.locator('#fleet-current').fill('12300');
    assert.match(await app.locator('#fleet-calculation-error').innerText(),/maior que a leitura inicial/);
    assert.equal(await metricText('fleet-efficiency'),'—');
    await app.locator('#fleet-current').fill('12820');
    await app.locator('#fleet-liters').fill('0');
    assert.match(await app.locator('#fleet-calculation-error').innerText(),/maior que zero/);
    await app.locator('#fleet-liters').fill('35');
    await app.locator('#fleet-full').uncheck();
    assert.match(await app.locator('#fleet-calculation-error').innerText(),/dois tanques completos/);
    assert.equal(await metricText('fleet-efficiency'),'—');
    assert.equal(await metricText('fleet-distance'),'420,00 km');
    await app.locator('#fleet-full').check();
    await app.locator('#fleet-current').fill('12960');
    assert.equal(await metricText('fleet-efficiency'),'16,00 km/l','Valid changed readings recompute efficiency');
    await app.locator('#fleet-status').selectOption('pending');
    assert.equal(await rows('fleet-records'),3);
    await app.locator('[data-occurrence="OC-101"]').click();
    assert.equal(await rows('fleet-records'),2,'Review action removes the occurrence from pending results');
    assert.match(await app.locator('#fleet-results').innerText(),/OC-101 conferida/);
    assert.equal(await app.locator('#fleet-status').evaluate(element=>document.activeElement===element),true,'Focus remains useful when a reviewed row leaves the filter');
    await app.locator('#fleet-status').selectOption('reviewed');
    assert.equal(await rows('fleet-records'),3);
    await app.locator('#fleet-search').fill('veiculo 01');
    assert.equal(await rows('fleet-records'),2,'Vehicle search ignores accents');
    await app.locator('#fleet-reset').click();
    assert.equal(await rows('fleet-records'),5);
    assert.equal(await metricText('fleet-efficiency'),'12,00 km/l');
    await app.locator('#fleet-status').selectOption('pending');
    assert.equal(await rows('fleet-records'),3,'Reset restores the original occurrence states');
    demoChecks+=7;
  }else if(slug==='paineis-acompanhamento'){
    const baseline=await dashboardReconciles(app);
    assert.equal(await rows('dashboard-breakdown'),3);
    await app.locator('#dashboard-ledger summary').click();
    assert.equal(await app.locator('#dashboard-records').isVisible(),true);
    assert.equal(baseline.items.length,14,'Three September contract records join property and fleet obligations');
    const contractRows=baseline.items.filter(row=>row[1]==='Contratos');
    assert.deepEqual(contractRows.map(row=>row[0]).sort(),initialWorkspace.payments.filter(row=>row.competence==='2026-09').map(row=>row.id).sort(),'The panel uses the same contract ledger as payments');
    assert.equal(await rows('dashboard-forecasts'),3);
    assert.equal(await app.locator('#dashboard-forecasts [data-risk="true"]').count(),1);
    await app.locator('#dashboard-category').selectOption('frota');
    assert.equal(await metricText('dashboard-total'),'R$ 1.547,00');
    assert.equal(await metricText('dashboard-paid'),'R$ 365,00');
    assert.equal(await metricText('dashboard-open'),'R$ 1.182,00');
    assert.equal(await rows('dashboard-records'),3);
    assert.equal(await rows('dashboard-breakdown'),1);
    assert.equal(await app.locator('.dashboard-forecast').isVisible(),false,'Fleet results do not present contract forecasts');
    await dashboardReconciles(app);
    await app.locator('#dashboard-category').selectOption('all');
    await app.locator('#dashboard-month').selectOption('2026-08');
    const august=await dashboardReconciles(app);
    assert.equal(august.open,720000,'The unpaid August climate record remains open in its actual competence');
    assert.equal(await app.locator('#dashboard-forecasts').isVisible(),false,'September forecast is not mislabeled as August');
    await app.locator('#dashboard-month').selectOption('2026-10');
    const october=await dashboardReconciles(app);
    assert.equal(october.paid,0,'Future obligations remain open at the fixed reference');
    assert.equal(october.items.filter(row=>row[1]==='Contratos').length,0,'A forecast must not fabricate contract payment records');
    await app.locator('#dashboard-reset').click();
    assert.deepEqual(await dashboardReconciles(app),baseline,'Restoring filters recovers the same September ledger');
    await app.locator('#dashboard-challenge').click();
    assert.equal(await app.locator('#dashboard-contract').inputValue(),'CT-102');
    assert.match(await app.locator('#dashboard-challenge-results').innerText(),/CT-102/);
    await app.locator('#dashboard-documents-challenge').click();
    assert.equal(await app.locator('#dashboard-status').inputValue(),'documents');
    assert.deepEqual((await dashboardReconciles(app)).items.map(row=>row[0]).sort(),['PG-201','PG-203']);
    demoChecks+=9;
  }else assert.fail('No interaction check defined for '+slug);
}

async function checkDemo(page,slug){
  const app=page.locator('.demo-app[data-demo="'+slug+'"]');
  const rowCount=async()=>app.locator('tbody tr:not(:has(td[colspan]))').count();
  if(slug==='vigencia-contratual'){
    assert.match(await app.locator('[data-contract-summary]').innerText(),/^6 contratos encontrados\. 3 com atenção/);
    await app.locator('#contract-search').fill('climatizacao');
    assert.equal(await rowCount(),1,'Accent-insensitive search finds the climate contract');
    assert.match(await app.locator('tbody').innerText(),/CT-102/);
    await app.getByRole('button',{name:'Ver histórico de CT-102',exact:true}).click();
    assert.match(await app.locator('[data-contract-detail]').innerText(),/CT-102 · Histórico/);
    await app.locator('#contract-search').fill('');
    await app.locator('#contract-alert').selectOption('attention');
    assert.equal(await rowCount(),2,'Upcoming alerts include a contract ending on the reference date');
    await app.locator('#contract-alert').selectOption('expired');
    assert.equal(await rowCount(),1,'Only an elapsed end date is expired');
    await app.locator('#contract-reference').fill('2026-10-01');
    assert.equal(await rowCount(),3,'Reference date recalculates deadline alerts');
    await app.locator('#contract-reference').fill('');
    assert.equal(await app.locator('#contract-reference').getAttribute('aria-invalid'),'true');
    assert.match(await app.locator('[data-contract-summary]').innerText(),/data de referência válida/);
    await app.locator('#contract-reference').fill('2026-09-17');
    await app.locator('#contract-alert').selectOption('all');
    await app.locator('#contract-situation').selectOption('Encerrado');
    assert.equal(await rowCount(),1);
    assert.match(await app.locator('tbody').innerText(),/CT-105/);
    assert.doesNotMatch(await app.locator('tbody').innerText(),/Prazo terminado/,'Closed administrative status is not an overdue alert');
    demoChecks+=6;
  }else if(slug==='previsao-contratual'){
    const service=app.locator('[data-forecast-component="service"]'),material=app.locator('[data-forecast-component="material"]');
    assert.match(normalize(await service.innerText()),/10\.500,00/);
    assert.match(normalize(await material.innerText()),/4\.200,00/);
    await app.locator('#forecast-months').fill('4');
    assert.match(await service.innerText(),/Saldo insuficiente/);
    assert.match(await service.innerText(),/-R\$\s*2\.000,00/);
    assert.match(await material.innerText(),/Saldo suficiente/,'Material does not inherit the service shortage');
    await app.locator('#forecast-contract').selectOption('CT-106');
    assert.match(await material.innerText(),/Projeção indisponível/,'Missing premise is distinct from zero');
    await app.locator('#material-monthly').fill('0');
    assert.match(await material.innerText(),/Saldo suficiente/);
    assert.match(await material.innerText(),/2\.800,00/);
    await app.locator('#forecast-months').fill('0');
    assert.equal(await app.locator('#forecast-months').getAttribute('aria-invalid'),'true');
    assert.match(await service.innerText(),/Projeção indisponível/);
    assert.match(await material.innerText(),/Projeção indisponível/);
    await app.locator('#forecast-months').fill('3');
    await app.locator('#service-balance').fill('0,30');
    await app.locator('#service-monthly').fill('0,09');
    assert.match(await service.innerText(),/0,03/,'Cent arithmetic preserves a positive three-cent balance');
    assert.match(await service.innerText(),/Saldo suficiente/);
    await app.locator('#service-monthly').fill('-1');
    assert.match(await service.innerText(),/Projeção indisponível/,'Negative monthly consumption is rejected');
    await app.getByRole('button',{name:'Restaurar valores do cenário',exact:true}).click();
    assert.equal(await app.locator('#service-balance').inputValue(),'15200,00');
    demoChecks+=7;
  }else if(slug==='pagamentos'){
    assert.match(await app.locator('[data-payment-summary]').innerText(),/^5 registros encontrados; 2 com pendência/);
    await app.locator('#payment-due-filter').selectOption('overdue');
    assert.equal(await rowCount(),1);
    assert.match(await app.locator('tbody').innerText(),/PG-202/);
    assert.doesNotMatch(await app.locator('tbody').innerText(),/PG-204/,'Paid items cannot be counted overdue');
    await app.locator('#payment-period').selectOption('2026-09');
    assert.equal(await rowCount(),0,'Combining independent filters can produce no records');
    assert.match(await app.locator('tbody').innerText(),/Nenhum registro/);
    await app.locator('#payment-period').selectOption('all');
    await app.locator('#payment-due-filter').selectOption('all');
    await app.getByRole('button',{name:'Conferir PG-201',exact:true}).click();
    assert.equal(await app.locator('[data-payment-forward]').isDisabled(),true);
    await app.locator('#payment-document-confirmation').check();
    assert.equal(await app.locator('[data-payment-forward]').isEnabled(),true);
    assert.equal(await app.locator('[data-payment-pay]').isDisabled(),true,'Completing documents alone does not register payment');
    await app.locator('[data-payment-forward]').click();
    assert.match(await app.locator('[data-payment-action-status]').innerText(),/PG-201: encaminhamento registrado/);
    assert.equal(await app.locator('[data-payment-pay]').isEnabled(),true);
    await app.locator('#payment-paid-date').fill('2026-09-18');
    assert.equal(await app.locator('#payment-paid-date').getAttribute('aria-invalid'),'true');
    assert.equal(await app.locator('[data-payment-pay]').isDisabled(),true,'A future payment date is rejected');
    await app.locator('#payment-paid-date').fill('2026-09-17');
    await app.locator('[data-payment-pay]').click();
    assert.match(await app.locator('[data-payment-action-status]').innerText(),/PG-201: pagamento de/);
    await app.locator('#payment-due-filter').selectOption('paid');
    assert.equal(await rowCount(),2,'Newly registered payment enters the paid filter');
    await app.getByRole('button',{name:'Recomeçar demonstração',exact:true}).click();
    assert.equal(await rowCount(),5);
    assert.equal(await app.locator('#payment-document-confirmation').isChecked(),false,'Reset restores the original document checklist');
    demoChecks+=7;
  }else await checkOperations(app,slug);
}

async function checkConnectedJourney(page){
  await resetVisit(page);
  await visit(page,'projetos/paineis-acompanhamento/');
  const baseline=await dashboardReconciles(page.locator('.demo-app'));
  await visit(page,'');
  const overview=page.locator('[data-overview]');
  const overviewValue=key=>overview.locator('[data-overview-metric="'+key+'"] strong');
  const initialOpen=initialWorkspace.payments.filter(row=>!row.paidAt).reduce((sum,row)=>sum+row.amount,0);
  assert.equal(moneyCents(await overviewValue('payments').innerText()),initialOpen,'Home shows the shared unpaid ledger');
  assert.equal(await overviewValue('deadlines').innerText(),'3');
  await overview.locator('[data-overview-task]').click();
  assert.equal(await overview.locator('[data-overview-filter]').inputValue(),'CT-102');
  assert.match(await overview.locator('[data-overview-feedback]').innerText(),/CT-102/);
  assert.equal(await overview.locator('[data-overview-feedback]').evaluate(element=>document.activeElement===element),true,'The home challenge moves focus to its answer');
  await overview.locator('[data-overview-filter]').selectOption('CT-103');
  assert.equal(await overviewValue('risk').innerText(),'—','An unavailable forecast is distinct from a healthy zero');
  assert.equal(await overview.locator('[data-overview-forecast-link]').count(),0);
  await overview.locator('[data-overview-filter]').selectOption('CT-101');
  assert.equal(moneyCents(await overviewValue('payments').innerText()),1430000);
  await overview.locator('[data-overview-contract-link]').click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('contrato'),'CT-101');
  assert.equal(await page.locator('#contract-search').inputValue(),'CT-101','A home selection follows the visitor into contracts');
  assert.equal(await rowsIn(page.locator('.demo-table')).count(),1);
  await page.getByRole('link',{name:'Ver pagamentos',exact:true}).click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#payment-contract').inputValue(),'CT-101');
  assert.equal(await rowsIn(page.locator('.demo-table')).count(),2,'Only the selected contract payment records appear');
  await page.getByRole('button',{name:'Conferir PG-201',exact:true}).click();
  await page.locator('#payment-document-confirmation').check();
  await page.locator('[data-payment-forward]').click();
  await page.locator('[data-payment-pay]').click();
  assert.match(await page.locator('[data-payment-action-status]').innerText(),/PG-201: pagamento de/);
  await page.goBack();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  await page.goBack();
  await page.locator('[data-overview][data-ready="true"]').waitFor();
  await overview.locator('[data-overview-filter]').selectOption('CT-101');
  assert.equal(moneyCents(await overviewValue('payments').innerText()),180000,'Back navigation must not resurrect stale payment state');
  await page.goForward();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  await page.goForward();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  await page.reload();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(await page.locator('[data-payment-pay]').isDisabled(),true,'A confirmed payment survives page reload');
  assert.equal(await page.locator('#payment-paid-date').inputValue(),'2026-09-17');
  await page.getByRole('link',{name:'Ver no painel',exact:true}).click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#dashboard-contract').inputValue(),'CT-101');
  const contractPaid=await dashboardReconciles(page.locator('.demo-app'));
  assert.equal(contractPaid.paid,1250000);
  assert.equal(contractPaid.open,180000);
  assert.equal(contractPaid.total,1430000,'Registering a payment changes its situation, not the registered total');
  await page.locator('#dashboard-reset').click();
  const updated=await dashboardReconciles(page.locator('.demo-app'));
  assert.equal(updated.total,baseline.total);
  assert.equal(updated.paid,baseline.paid+1250000,'The consolidated paid total responds to the same confirmation');
  assert.equal(updated.open,baseline.open-1250000);
  assert.equal(await page.locator('[data-metric="dashboard-documents"]').innerText(),'5','Completing a document removes one pending item');
  await page.locator('#dashboard-forecasts [data-forecast="CT-101"] a').click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#forecast-contract').inputValue(),'CT-101');
  await page.locator('#forecast-months').fill('4');
  assert.match(await page.locator('[data-forecast-component="service"]').innerText(),/-R\$\s*2\.000,00/);
  await page.getByRole('link',{name:'Ver impacto no painel',exact:true}).click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  const projected=page.locator('#dashboard-forecasts [data-forecast="CT-101"]');
  assert.equal(await projected.getAttribute('data-risk'),'true');
  assert.match(await projected.innerText(),/4 meses/);
  assert.match(await projected.innerText(),/-R\$\s*2\.000,00/);
  assert.equal((await dashboardReconciles(page.locator('.demo-app'))).paid,1250000,'A changed projection is never added to the actual payment ledger');
  await visit(page,'');
  await overview.locator('[data-overview-filter]').selectOption('CT-101');
  assert.equal(moneyCents(await overviewValue('payments').innerText()),180000);
  assert.equal(await overviewValue('risk').innerText(),'1');
  assert.match(await overview.locator('[data-overview-component="service"]').innerText(),/-R\$\s*2\.000,00/,'Home shows the same modified projection');
  await page.reload();
  await page.locator('[data-overview][data-ready="true"]').waitFor();
  assert.equal(moneyCents(await overviewValue('payments').innerText()),initialOpen-1250000,'Home retains changes across reload');
  await overview.locator('[data-overview-filter]').selectOption('CT-101');
  await overview.locator('[data-overview-forecast-link]').click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#forecast-months').inputValue(),'4','The forecast form retains its own modified premise');
  await page.getByRole('link',{name:'Ver pagamentos do contrato',exact:true}).click();
  await page.locator('.demo-app[data-ready="true"]').waitFor();
  await page.getByRole('button',{name:'Recomeçar demonstração',exact:true}).click();
  assert.equal(await page.locator('#payment-document-confirmation').isChecked(),false);
  await visit(page,'projetos/paineis-acompanhamento/');
  assert.deepEqual(await dashboardReconciles(page.locator('.demo-app')),baseline,'Reset restores the original shared ledger');
  assert.match(await page.locator('#dashboard-forecasts [data-forecast="CT-101"]').innerText(),/3 meses/);
  assert.equal(await page.locator('#dashboard-forecasts [data-forecast="CT-101"]').getAttribute('data-risk'),'false');
  await visit(page,'');
  assert.equal(moneyCents(await overviewValue('payments').innerText()),initialOpen);
  assert.equal(await overviewValue('risk').innerText(),'1');
  connectedChecks+=13;
}

try{
  const page=await browser.newPage();monitor(page);
  for(const width of viewports){
    await page.setViewportSize({width,height:900});
    for(const route of routes){
      await visit(page,route);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Horizontal page overflow: ${route||'home'} at ${width}`);
      checked++;
    }
  }
  await page.setViewportSize({width:390,height:844});await visit(page,'');
  const menu=page.getByRole('button',{name:'Menu'});
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#navigation').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#navigation').isVisible(),false);
  assert.equal(await menu.evaluate(element=>document.activeElement===element),true);
  const filters=page.locator('[data-filter]');
  for(let index=0;index<await filters.count();index++){
    const filter=filters.nth(index),category=await filter.getAttribute('data-filter');
    const expected=projects.filter(project=>category==='all'||project.category.split(/\s+/).includes(category));
    await filter.click();
    assert.equal(await filter.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-filter][aria-pressed="true"]').count(),1);
    assert.equal(await page.locator('.project-card:visible').count(),expected.length,`Filter ${category}`);
    const links=await page.locator('.project-card:visible .project-bottom a').evaluateAll(elements=>elements.map(element=>new URL(element.href).pathname.split('/').filter(Boolean).at(-1)).sort());
    assert.deepEqual(links,expected.map(project=>project.slug).sort(),`Correct projects for ${category}`);
    assert.match(await page.locator('#filter-status').innerText(),new RegExp(`^${expected.length} projeto`));
  }
  await page.locator('[data-filter="all"]').click();
  const homeExplorers=page.locator('.method-explorer[data-explorer]');
  assert.equal(await homeExplorers.count(),1);await checkExplorer(homeExplorers,'home method');
  for(const project of projects){
    await resetVisit(page);
    await visit(page,'projetos/'+project.slug+'/');await assertCase(page,project);
    await checkDemo(page,project.slug);
    const explorer=page.locator('.workflow-explorer[data-explorer]');
    assert.equal(await explorer.count(),1,`One workflow explorer: ${project.slug}`);
    await checkExplorer(explorer,project.slug,project.steps);
  }
  await checkConnectedJourney(page);
  for(const [legacy,current] of Object.entries(legacyRoutes)){
    const route='projetos/'+legacy+'/';await visit(page,route);
    assert.equal(page.url(),url+route,`Legacy URL remains open until a visitor follows its link: ${legacy}`);
    assert.equal(await page.locator('meta[http-equiv="refresh" i]').count(),0,`No automatic refresh: ${legacy}`);
    const link=page.locator('main a[href="../'+current+'/"]');
    assert.equal(await link.count(),1,`Legacy route points to current case: ${legacy}`);
    assert.ok((await page.locator('link[rel="canonical"]').getAttribute('href')).endsWith('/projetos/'+current+'/'));
    await link.click();assert.equal(page.url(),url+'projetos/'+current+'/');
    await page.locator('.demo-app[data-ready="true"]').waitFor({state:'visible'});
    assert.equal(normalize(await page.locator('h1').innerText()),projects.find(project=>project.slug===current).name);
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const staticPage=await nojs.newPage();monitor(staticPage);
    for(const project of [null,...projects]){
      await visit(staticPage,project?'projetos/'+project.slug+'/':'',{interactive:false});
      if(project)await assertCase(staticPage,project,{interactive:false});
      else{
        assert.equal(await staticPage.locator('.project-card:visible').count(),projects.length);
        assert.match(await staticPage.locator('#experiencia').innerText(),/CREA-RJ|Crea-RJ/);
      }
      const count=await staticPage.locator('[data-explorer] .explorer-panel').count();
      assert.ok(count>1);
      assert.equal(await staticPage.locator('[data-explorer] .explorer-panel:visible').count(),count,'All process content is visible without JavaScript');
      assert.equal(await staticPage.locator('[data-explorer] button[data-panel]:visible').count(),0,'Inactive explorer buttons stay hidden without JavaScript');
      if(project){
        const text=normalize(await staticPage.locator('main').innerText());
        for(const step of project.steps)for(const value of [step.title,step.input,step.action,step.output])assert.ok(text.includes(normalize(value)),`All static step details remain available: ${project.slug}`);
      }
      staticPanelsChecked+=count;
    }
  }finally{await nojs.close();}
  assert.deepEqual(sourceRequests,[],'No operational workbook or internal Drive source is requested');
  assert.deepEqual(failures,[],'No browser console, script, network or HTTP errors');
  console.log(JSON.stringify({viewport_checks:checked,viewports,projects:projects.length,explorers:explorersChecked,steps:stepsChecked,keyboard_checks:keyboardChecks,legacy_routes:Object.keys(legacyRoutes).length,no_javascript_panels:staticPanelsChecked,interactions:'passed',no_javascript:'passed',demo_checks:demoChecks,connected_checks:connectedChecks,source_requests:sourceRequests.length,console_and_network_errors:failures.length},null,2));
}finally{await browser.close();}
