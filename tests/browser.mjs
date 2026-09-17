// Optional browser QA: install Playwright and serve the repository locally.
// PORTFOLIO_URL can point to / or to the historical GitHub Pages subdirectory.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=new URL(process.env.PORTFOLIO_URL||'http://127.0.0.1:8765/KleytonG.github.io/');
const topics=JSON.parse(fs.readFileSync(new URL('../content/topics.json',import.meta.url),'utf8'));
const viewports=[320,390,768,1024,1366,1440];
const legacyRoutes={
  'vigencia-contratual':'obras-facilities',
  'previsao-contratual':'obras-facilities',
  'pagamentos':'obras-facilities',
  'controle-imoveis':'imoveis',
  'controle-frota':'frota',
  'paineis-acompanhamento':'obras-facilities',
  'gestao-frota':'frota',
  'aditivos-repactuacoes':'obras-facilities',
};
const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER||chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const errors=[];
const checks={viewport:0,keyboard:0,topic_flows:0,invalid_inputs:0,isolation:0,downloads:0,legacy:0,no_javascript:0};
const compact=text=>text.replace(/\s+/g,' ').trim();
const money=text=>Math.round(Number(text.replace(/[^\d,-]/g,'').replace(',','.'))*100);
const topicApp=page=>page.locator('[data-topic]');
function monitor(page){
  page.on('pageerror',error=>errors.push({type:'script',message:error.message}));
  page.on('console',message=>{if(message.type()==='error')errors.push({type:'console',message:message.text()});});
  page.on('response',response=>{if(response.status()>=400)errors.push({type:'http',url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>errors.push({type:'request',url:request.url(),message:request.failure()?.errorText}));
  page.on('request',request=>{
    const address=request.url();
    if(/docs\.google\.com\/spreadsheets|drive\.google\.com\/(?:file|open)|\.xlsm(?:[?#]|$)/i.test(address))errors.push({type:'private_source',url:address});
    if(/\.xlsx?(?:[?#]|$)/i.test(address)&&!new URL(address).pathname.includes('/downloads/'))errors.push({type:'unexpected_workbook',url:address});
  });
}
async function visit(page,route='',interactive=true){
  const response=await page.goto(new URL(route,base).href);
  assert.equal(response.status(),200,`HTTP status: ${route||'home'}`);
  assert.equal(await page.locator('h1').count(),1,`One main heading: ${route||'home'}`);
  assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'),/^https:\/\/kleyton-gsilva\.netlify\.app\//,'Canonical uses the primary Netlify domain');
  if(interactive&&await topicApp(page).count())await page.locator('[data-topic][data-ready="true"]').waitFor({state:'visible'});
}
async function freshTopic(page,slug){
  await visit(page);
  await page.evaluate(()=>sessionStorage.clear());
  await visit(page,`projetos/${slug}/`);
  return topicApp(page);
}
async function assertTopic(page,topic,interactive=true){
  assert.equal(compact(await page.locator('h1').innerText()),topic.name);
  const app=topicApp(page);
  assert.equal(await app.count(),1,'A case has one subject demonstration');
  assert.equal(await app.getAttribute('data-topic'),topic.slug);
  assert.equal(await page.locator(`a[href*="kit-${topic.slug}.zip"]`).count(),1,'One obvious subject kit download');
  if(interactive){
    assert.equal(await app.getAttribute('data-ready'),'true');
    assert.ok(await app.locator('button,input,select').count()>0,'Demonstration includes usable controls');
    const prefixes={'obras-facilities':['OF'],'imoveis':['IM','IL'],'frota':['FR'],'estacionamentos':['ES'],'mapa-precos':['MP']};
    const identifiers=(await app.innerText()).match(/\b(?:OF|IM|IL|FR|ES|MP)-[A-Z0-9]+\b/g)||[];
    assert.ok(identifiers.every(id=>prefixes[topic.slug].includes(id.split('-')[0])),`Records stay within their own subject: ${topic.slug}`);
  }else{
    assert.equal(await app.locator('.demo-fallback').isVisible(),true,'An explanation remains when JavaScript is disabled');
    assert.ok(compact(await app.innerText()).length>30,'Fallback has meaningful context');
  }
  assert.equal((await page.locator('body').innerText()).split('Demonstrações com dados de exemplo.').length-1,1,'One discreet sample-data note');
}
async function downloadKit(page,topic){
  const link=page.locator(`a[href*="kit-${topic.slug}.zip"]`);
  assert.ok(await link.getAttribute('download')!==null,'ZIP link has the download attribute');
  const target=await link.getAttribute('href');
  const response=await page.request.get(new URL(target,page.url()).href);
  assert.equal(response.status(),200,'The ZIP can be retrieved');
  assert.equal((await response.body()).subarray(0,4).toString('hex'),'504b0304','Download contains ZIP bytes');
  const downloadEvent=page.waitForEvent('download');
  await link.click();
  const download=await downloadEvent;
  assert.equal(download.suggestedFilename(),`kit-${topic.slug}.zip`);
  assert.equal(await download.failure(),null,'The browser completes the download');
  const guide=page.locator('main a[href$="guia-de-uso.pdf"]');
  assert.equal(await guide.count(),1,'The guide is also available without downloading the ZIP');
  const guideResponse=await page.request.get(new URL(await guide.getAttribute('href'),page.url()).href);
  assert.equal(guideResponse.status(),200);
  assert.equal((await guideResponse.body()).subarray(0,5).toString(),'%PDF-');
  checks.downloads+=2;
}

// Subject interactions follow the visitor's steps through each isolated demo.
async function tab(app,name){
  const button=app.locator(`[data-topic-tab="${name}"]`);
  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.equal(await app.locator('[data-topic-tab][aria-pressed="true"]').count(),1);
}
const metric=async(app,key)=>money(await app.locator(`[data-metric="${key}"]`).innerText());
async function completePayment(app,id,{forward=true}={}){
  await tab(app,'payments');
  await app.locator(`[data-payment-id="${id}"]`).click();
  assert.equal(await app.locator('[data-action="pay"]').isDisabled(),true,'Unconfirmed documents block payment');
  await app.locator('#payment-documents').check();
  assert.equal(await app.locator('[data-payment-detail]').getAttribute('data-selected-payment'),id,'Document confirmation keeps the selected obligation even when it leaves a filter');
  if(forward){
    assert.equal(await app.locator('[data-action="pay"]').isDisabled(),true,'The contractual payment still needs forwarding');
    await app.locator('[data-action="forward-payment"]').click();
  }
  await app.locator('#payment-date').fill('');
  await app.locator('[data-action="pay"]').click();
  assert.equal(await app.locator('#payment-date').getAttribute('aria-invalid'),'true');
  assert.match(await app.locator('[data-payment-feedback]').innerText(),/data válida/,'Missing payment date does not create a payment');
  checks.invalid_inputs++;
  await app.locator('#payment-date').fill('2026-09-17');
  await app.locator('[data-action="pay"]').click();
  assert.match(await app.locator('[data-topic-status]').innerText(),/pagamento registrado/);
  assert.equal(await app.locator('[data-payment-detail]').getAttribute('data-selected-payment'),id,'Payment confirmation never jumps to a different obligation');
  assert.equal(await app.locator('[data-action="pay"]').isDisabled(),true,'The same obligation cannot be paid twice');
}
async function checkTopicFlow(page,slug){
  const app=await freshTopic(page,slug);
  const start=app.locator('[data-action="start"]');
  await start.focus();await start.press('Enter');
  assert.ok((await app.locator('[data-topic-status]').innerText()).length>10,'The first action provides direction');
  checks.keyboard++;
  if(slug==='obras-facilities'){
    assert.equal(await app.locator('[data-metric="contracts"]').innerText(),'3','The first action finds nearby and elapsed deadlines');
    await tab(app,'panel');
    assert.equal(await metric(app,'panel-open'),2300000);assert.equal(await metric(app,'panel-paid'),420000);
    await completePayment(app,'OF-P01');
    await tab(app,'panel');
    assert.equal(await metric(app,'panel-open'),1050000);assert.equal(await metric(app,'panel-paid'),1670000);
    assert.equal(await metric(app,'panel-total'),2720000,'Payment changes paid and open values without changing the registered amount');
    await app.locator('#topic-filter').selectOption('OF-101');await tab(app,'forecast');
    assert.equal(await metric(app,'service-remaining'),1050000);
    await app.locator('#forecast-months').fill('4');
    assert.equal(await metric(app,'service-remaining'),-200000);
    assert.match(await app.locator('[data-forecast-component="service"]').innerText(),/Saldo insuficiente/);
    assert.match(await app.locator('[data-forecast-component="material"]').innerText(),/Saldo suficiente/);
    await app.locator('#topic-filter').selectOption('OF-104');
    assert.match(await app.locator('[data-forecast-component="material"]').innerText(),/Cálculo indisponível/,'Missing material use is not treated as zero');
    await app.locator('#material-monthly').fill('0');
    assert.equal(await metric(app,'material-remaining'),280000);
    await app.locator('#forecast-months').fill('3');
    await app.locator('#service-balance').fill('0.30');await app.locator('#service-monthly').fill('0.09');
    assert.equal(await metric(app,'service-remaining'),3,'Three positive cents do not become an insufficient balance');
    await app.locator('#service-monthly').fill('-1');
    assert.match(await app.locator('[data-forecast-component="service"]').innerText(),/Cálculo indisponível/);
    checks.invalid_inputs+=2;
    await app.locator('[data-action="reset-topic"]').click();
    await app.locator('#topic-filter').selectOption('all');await tab(app,'panel');
    assert.equal(await metric(app,'panel-open'),2300000);
  }else if(slug==='imoveis'){
    assert.equal(await app.locator('[data-payment-id]').count(),3,'The first action finds obligations with pending documents');
    await tab(app,'properties');await app.locator('#topic-filter').selectOption('IM-003');
    assert.match(await app.locator('[data-topic-panel]').innerText(),/Próprio/);
    assert.match(await app.locator('[data-topic-panel]').innerText(),/Sem contrato de locação/);
    await app.locator('#topic-filter').selectOption('all');await tab(app,'panel');
    assert.equal(await metric(app,'panel-open'),433850);assert.equal(await metric(app,'panel-paid'),506000);
    await completePayment(app,'IM-P02',{forward:false});
    await tab(app,'panel');assert.equal(await metric(app,'panel-open'),365850);assert.equal(await metric(app,'panel-paid'),574000);
    await app.locator('[data-action="reset-topic"]').click();
    assert.equal(await metric(app,'panel-open'),433850);
  }else if(slug==='frota'){
    assert.equal(await app.locator('[data-metric="occurrences-pending"]').innerText(),'3');
    await app.locator('[data-occurrence-id="FR-O01"]').click();
    assert.equal(await app.locator('[data-metric="occurrences-pending"]').innerText(),'2');
    await tab(app,'fuel');
    assert.match(await app.locator('[data-fuel-result]').innerText(),/Consumo: 12 km\/l/);
    await app.locator('#fuel-current').fill('12560');
    assert.match(await app.locator('[data-fuel-result]').innerText(),/Consumo: 16 km\/l/);
    await app.locator('#fuel-full').uncheck();
    assert.match(await app.locator('[data-fuel-result]').innerText(),/Abastecimento parcial/);
    assert.doesNotMatch(await app.locator('[data-fuel-result]').innerText(),/Consumo: 16/);
    await app.locator('#fuel-liters').fill('0');
    assert.match(await app.locator('[data-fuel-result]').innerText(),/leituras crescentes, litros e preço positivos/);
    await app.locator('#fuel-liters').fill('');
    assert.match(await app.locator('[data-fuel-result]').innerText(),/leituras crescentes, litros e preço positivos/);
    checks.invalid_inputs+=2;
    await app.locator('[data-action="reset-topic"]').click();await tab(app,'panel');
    assert.equal(await metric(app,'fuel-panel-cost'),71895);assert.equal(await app.locator('[data-metric="fuel-panel-pending"]').innerText(),'3');
  }else if(slug==='estacionamentos'){
    assert.equal(await app.locator('[data-metric="contracts"]').innerText(),'1','The closed parking contract does not enter the deadline alert');
    await app.locator('.topic-advanced > summary').click();await app.locator('#contract-status').selectOption('all');
    await app.getByRole('button',{name:'Simular vagas de ES-101',exact:true}).click();
    await app.locator('#parking-spaces').fill('16');
    assert.match(await app.locator('[data-parking-monthly]').innerText(),/4\.480,00/);
    await tab(app,'payments');await app.locator('[data-payment-id="ES-P01"]').click();
    assert.match(await app.locator('[data-parking-comparison]').innerText(),/Diferença da cobrança/,'A changed expected monthly amount is compared to the recorded bill');
    await tab(app,'panel');
    assert.equal(await metric(app,'parking-expected'),634000);assert.equal(await metric(app,'panel-total'),522000,'Simulated vacancies do not rewrite a recorded bill');
    await app.locator('[data-action="reset-topic"]').click();
    assert.equal(await metric(app,'parking-expected'),522000);
    await completePayment(app,'ES-P01');await tab(app,'panel');
    assert.equal(await metric(app,'panel-open'),0);assert.equal(await metric(app,'panel-paid'),522000);
    await page.reload();await page.locator('[data-topic][data-ready="true"]').waitFor();await tab(app,'panel');
    assert.equal(await metric(app,'panel-paid'),522000,'The subject keeps its own changes across reload');
    await visit(page,'projetos/obras-facilities/');await tab(topicApp(page),'panel');
    assert.equal(await metric(topicApp(page),'panel-open'),2300000);assert.equal(await metric(topicApp(page),'panel-paid'),420000,'Parking payment does not change works/facilities');
    await topicApp(page).locator('[data-action="reset-topic"]').click();
    await visit(page,'projetos/estacionamentos/');await tab(topicApp(page),'panel');
    assert.equal(await metric(topicApp(page),'panel-paid'),522000,'Restoring works/facilities does not restore parking');
    await topicApp(page).locator('[data-action="reset-topic"]').click();
    assert.equal(await metric(topicApp(page),'panel-paid'),186000);
    checks.isolation+=3;
  }else if(slug==='mapa-precos'){
    await tab(app,'panel');assert.equal(await metric(app,'price-basket-reference'),145871);assert.equal(await metric(app,'price-lowest-complete'),140000);
    await tab(app,'quotes');await app.locator('.topic-advanced > summary').click();await app.locator('#price-method').selectOption('median');
    await app.locator('#price-quantity').fill('8');
    assert.equal(await metric(app,'price-item-total'),68000);
    await tab(app,'panel');assert.equal(await metric(app,'price-basket-reference'),180600);assert.equal(await metric(app,'price-lowest-complete'),172100);
    await tab(app,'quotes');await app.locator('#supplier-0').fill('');
    await tab(app,'panel');assert.equal(await app.locator('[data-metric="price-complete-proposals"]').innerText(),'2 de 3');
    assert.equal(await metric(app,'price-lowest-complete'),172100,'A partially quoted proposal cannot win the whole-basket comparison');
    assert.match(await app.locator('[data-topic-panel]').innerText(),/1 item ausente · fora da comparação completa/);
    await tab(app,'quotes');await app.locator('#research-0').fill('110');
    assert.equal(await metric(app,'price-reference'),9000);assert.equal(await metric(app,'price-item-total'),72000);
    await app.locator('.topic-advanced > summary').click();await app.locator('#price-method').selectOption('mean');
    assert.equal(await metric(app,'price-reference'),9500,'Changing the method recalculates the unit reference');
    for(const index of [0,1,2])await app.locator(`#research-${index}`).fill('');
    assert.equal(await app.locator('[data-metric="price-reference"]').innerText(),'Não informado');
    assert.equal(await app.locator('[data-metric="price-research-count"]').innerText(),'0');
    await tab(app,'panel');assert.equal(await app.locator('[data-metric="price-basket-reference"]').innerText(),'Não informado','Missing research does not masquerade as a zero reference');
    await tab(app,'quotes');await app.locator('#price-quantity').fill('0');
    assert.equal(await app.locator('#price-quantity').getAttribute('aria-invalid'),'true');
    assert.equal(await app.locator('[data-metric="price-item-total"]').innerText(),'Não informado');
    checks.invalid_inputs+=3;
    await app.locator('[data-action="reset-topic"]').click();await tab(app,'panel');
    assert.equal(await metric(app,'price-basket-reference'),145871);assert.equal(await metric(app,'price-lowest-complete'),140000);
  }else assert.fail(`No visitor flow for ${slug}`);
  checks.topic_flows++;
}

try{
  const page=await browser.newPage();monitor(page);
  for(const width of viewports){
    await page.setViewportSize({width,height:900});
    for(const route of ['',...topics.map(topic=>`projetos/${topic.slug}/`),'404.html']){
      await visit(page,route);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`No horizontal page overflow: ${route||'home'} at ${width}px`);
      checks.viewport++;
      if(await topicApp(page).count()){
        const summaries=topicApp(page).locator('details > summary');
        for(let index=0;index<await summaries.count();index++){
          if(!await summaries.nth(index).evaluate(element=>element.parentElement.open))await summaries.nth(index).click();
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Expanded controls do not overflow: ${route} at ${width}px`);
        checks.viewport++;
      }
    }
  }
  await page.setViewportSize({width:390,height:844});await visit(page);
  assert.equal(await page.locator('.hero [data-overview],.hero [data-topic],.hero input,.hero select').count(),0,'The opening introduces the person without a working dashboard');
  assert.equal(await page.locator('.project-card:visible').count(),5,'All five subjects are immediately available');
  assert.ok(await page.locator('.hero a').count()<=2,'Opening has at most two competing calls to action');
  const menu=page.getByRole('button',{name:'Menu',exact:true});
  await menu.focus();await menu.press('Enter');
  assert.equal(await menu.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#navigation').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#navigation').isVisible(),false);
  assert.equal(await menu.evaluate(element=>element===document.activeElement),true,'Escape returns focus to the menu button');
  checks.keyboard+=2;
  await page.keyboard.press('Tab');
  const focused=await page.evaluate(()=>({tag:document.activeElement.tagName,visible:document.activeElement.getBoundingClientRect().height>0}));
  assert.equal(focused.visible,true,'Tab navigation skips the closed menu');
  checks.keyboard++;
  await page.setViewportSize({width:1366,height:900});
  for(const topic of topics){
    await visit(page,`projetos/${topic.slug}/`);await assertTopic(page,topic);await downloadKit(page,topic);
    await checkTopicFlow(page,topic.slug);
  }
  for(const [legacy,destination] of Object.entries(legacyRoutes)){
    await visit(page,`projetos/${legacy}/`);
    assert.equal(await page.locator('meta[http-equiv="refresh" i]').count(),0,'Old links offer an explicit destination without an automatic jump');
    const expected=new URL(`projetos/${destination}/#demonstracao`,base).href;
    const matching=page.locator(`main a[data-legacy-target="${destination}"]`);
    const hrefs=await matching.evaluateAll(links=>links.map(link=>link.href));
    assert.ok(hrefs.includes(expected),`Legacy ${legacy} leads to ${destination}`);
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.ok(destination==='home'?canonical==='https://kleyton-gsilva.netlify.app/':canonical.endsWith(`/projetos/${destination}/`),'Legacy canonical points to its successor');
    checks.legacy++;
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const staticPage=await nojs.newPage();monitor(staticPage);
    await visit(staticPage,'',false);
    assert.equal(await staticPage.locator('.project-card:visible').count(),5,'Projects remain reachable without JavaScript');
    assert.match(await staticPage.locator('#experiencia').innerText(),/CREA-RJ|Crea-RJ/,'Career information is readable without JavaScript');
    checks.no_javascript++;
    for(const topic of topics){
      await visit(staticPage,`projetos/${topic.slug}/`,false);await assertTopic(staticPage,topic,false);
      assert.equal(await staticPage.locator(`a[href*="kit-${topic.slug}.zip"]`).isVisible(),true,'Download remains usable without JavaScript');
      checks.no_javascript++;
    }
  }finally{await nojs.close();}
  assert.deepEqual(errors,[],'No script, console, source-file, network, or HTTP errors');
  console.log(JSON.stringify({subjects:topics.length,viewports,checks,errors:errors.length},null,2));
}finally{await browser.close();}
