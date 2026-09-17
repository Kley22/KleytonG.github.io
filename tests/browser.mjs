// Optional browser QA: npm install --no-save playwright; npx playwright install chromium.
// Serve the project and set PORTFOLIO_URL to its base URL.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8765/KleytonG.github.io/';
const projects=JSON.parse(fs.readFileSync(new URL('../content/projects.json',import.meta.url),'utf8'));
const viewports=[375,390,430,768,1366,1920];
const routes=['','404.html',...projects.map(project=>'projetos/'+project.slug+'/')];
const legacyRoutes={'gestao-frota':'controle-frota','aditivos-repactuacoes':'vigencia-contratual'};
const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER||chromium.executablePath(),args:['--no-sandbox']});
const failures=[],datasetRequests=[];
let checked=0,explorersChecked=0,stepsChecked=0,keyboardChecks=0,staticPanelsChecked=0;
const normalize=text=>text.replace(/\s+/g,' ').trim();

function monitor(page){
  page.on('pageerror',error=>failures.push({type:'pageerror',message:error.message}));
  page.on('console',message=>{if(message.type()==='error')failures.push({type:'console',message:message.text()});});
  page.on('response',response=>{if(response.status()>=400)failures.push({type:'http',url:response.url(),status:response.status()});});
  page.on('requestfailed',request=>failures.push({type:'request',url:request.url(),message:request.failure()?.errorText}));
  page.on('request',request=>{
    if(/(?:\/modelo\/|dados-ficticios|demo-data|\.(?:xlsx?|csv|tsv|json)(?:[?#]|$))/i.test(request.url()))datasetRequests.push(request.url());
  });
}
async function visit(page,route){
  const response=await page.goto(url+route);
  assert.equal(response.status(),200,`HTTP status for ${route||'home'}`);
  assert.equal(await page.locator('h1').count(),1,`One main heading: ${route||'home'}`);
}
async function assertConceptualCase(page,project){
  assert.equal(normalize(await page.locator('h1').innerText()),project.name);
  const body=normalize(await page.locator('main').innerText());
  for(const text of [project.problem,project.solution,project.role])assert.ok(body.includes(normalize(text)),`Professional context remains readable: ${project.slug}`);
  assert.equal(await page.locator('input,select,textarea,table,[data-demo],[data-model],#demo-data').count(),0,`No data tables, models or calculators: ${project.slug}`);
  const prohibitedLinks=await page.locator('a[href],script[src],link[href]').evaluateAll(elements=>elements
    .map(element=>element.getAttribute('href')||element.getAttribute('src')||'')
    .filter(target=>/(?:\/modelo\/|dados-ficticios|demo-data|\/demo\.js|\.(?:xlsx?|csv|tsv|json|zip)(?:[?#]|$))/i.test(target)));
  assert.deepEqual(prohibitedLinks,[],`No dataset downloads or demo data resources: ${project.slug}`);
  const inlineModels=await page.locator('script:not([src])').evaluateAll(elements=>elements
    .filter(element=>element.id==='demo-data'||element.matches('[data-model]')||/(?:demo-data|dados-ficticios)/i.test(element.textContent))
    .map(element=>element.id||element.type));
  assert.deepEqual(inlineModels,[],`No inline dataset: ${project.slug}`);
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
    await visit(page,'projetos/'+project.slug+'/');await assertConceptualCase(page,project);
    const explorer=page.locator('.workflow-explorer[data-explorer]');
    assert.equal(await explorer.count(),1,`One workflow explorer: ${project.slug}`);
    await checkExplorer(explorer,project.slug,project.steps);
  }
  for(const [legacy,current] of Object.entries(legacyRoutes)){
    const route='projetos/'+legacy+'/';await visit(page,route);
    assert.equal(page.url(),url+route,`Legacy URL remains open until a visitor follows its link: ${legacy}`);
    assert.equal(await page.locator('meta[http-equiv="refresh" i]').count(),0,`No automatic refresh: ${legacy}`);
    const link=page.locator('main a[href="../'+current+'/"]');
    assert.equal(await link.count(),1,`Legacy route points to current case: ${legacy}`);
    assert.ok((await page.locator('link[rel="canonical"]').getAttribute('href')).endsWith('/projetos/'+current+'/'));
    await link.click();assert.equal(page.url(),url+'projetos/'+current+'/');
    assert.equal(normalize(await page.locator('h1').innerText()),projects.find(project=>project.slug===current).name);
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const staticPage=await nojs.newPage();monitor(staticPage);
    for(const project of [null,...projects]){
      await visit(staticPage,project?'projetos/'+project.slug+'/':'');
      if(project)await assertConceptualCase(staticPage,project);
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
  assert.deepEqual(datasetRequests,[],'No dataset is requested during navigation or interaction');
  assert.deepEqual(failures,[],'No browser console, script, network or HTTP errors');
  console.log(JSON.stringify({viewport_checks:checked,viewports,projects:projects.length,explorers:explorersChecked,steps:stepsChecked,keyboard_checks:keyboardChecks,legacy_routes:Object.keys(legacyRoutes).length,no_javascript_panels:staticPanelsChecked,interactions:'passed',no_javascript:'passed',dataset_requests:datasetRequests.length,console_and_network_errors:failures.length},null,2));
}finally{await browser.close();}
