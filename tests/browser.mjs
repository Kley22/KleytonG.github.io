// Optional browser QA: npm install --no-save playwright; npx playwright install chromium.
// Start python -m http.server and set PORTFOLIO_URL to the served project path.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:8765/KleytonG.github.io/';
const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER||chromium.executablePath(),args:['--no-sandbox']});
const page=await browser.newPage();
const failures=[];let checked=0;
page.on('pageerror',e=>failures.push(e.message));
page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+' '+r.status());});
const projects=JSON.parse(fs.readFileSync(new URL('../content/projects.json',import.meta.url),'utf8'));
for(const width of [375,390,430,768,1366,1920]){
  await page.setViewportSize({width,height:900});
  for(const route of ['','404.html',...projects.map(p=>'projetos/'+p.slug+'/')]){
    const response=await page.goto(url+route);assert.equal(response.status(),200);
    assert.equal(await page.locator('h1').count(),1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow)console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.scrollWidth>e.clientWidth+2 && !e.closest('.table-wrap')).map(e=>({tag:e.tagName,class:e.className,width:e.clientWidth,scroll:e.scrollWidth})).slice(0,15)));
    assert.equal(overflow,false,`Horizontal page overflow: ${route} at ${width}`);
    checked++;
  }
}
await page.setViewportSize({width:390,height:844});await page.goto(url);
await page.getByRole('button',{name:'Menu'}).click();assert.equal(await page.locator('#navigation').isVisible(),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#navigation').isVisible(),false);
await page.locator('[data-filter=financeiro]').click();assert.equal(await page.locator('.project-card:visible').count(),2);
await page.locator('[data-filter=operacoes]').click();assert.equal(await page.locator('.project-card:visible').count(),1);
await page.locator('[data-filter=all]').click();assert.equal(await page.locator('.project-card:visible').count(),5);
await page.goto(url+'projetos/vigencia-contratual/');
assert.equal(await page.locator('tbody tr').count(),5);await page.locator('#status').selectOption('A renovar');assert.equal(await page.locator('tbody tr').count(),1);
await page.locator('#search').fill('Inexistente');assert.match(await page.locator('tbody').innerText(),/Nenhum registro/);
await page.getByRole('button',{name:'Restaurar exemplo'}).click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===5);assert.equal(await page.locator('tbody tr').count(),5);
await page.goto(url+'projetos/previsao-contratual/');
assert.equal(await page.locator('#material-panel.risk').count(),1);
await page.locator('#serviceBalance').fill('1000.02');await page.locator('#serviceMonthly').fill('333.33');await page.locator('#months').fill('3');
assert.match(await page.locator('#service-balance').innerText(),/0,03/);assert.equal(await page.locator('#service-panel.risk').count(),0);
await page.locator('#serviceBalance').fill('999.98');assert.equal(await page.locator('#service-panel.risk').count(),1);
await page.goto(url+'projetos/pagamentos/');await page.locator('#status').selectOption('Em atraso');assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').innerText(),/Aurora/);
await page.goto(url+'projetos/aditivos-repactuacoes/');await page.locator('#percent').fill('10');assert.match(await page.locator('#metric-three').innerText(),/2.640,00/);
await page.goto(url+'projetos/gestao-frota/');await page.locator('#current').fill('41000');assert.match(await page.locator('#demo-error').innerText(),/crescentes/);
await page.getByRole('button',{name:'Restaurar exemplo'}).click();await page.waitForFunction(()=>document.querySelector('#demo-error').textContent==='');assert.equal(await page.locator('#demo-error').innerText(),'');assert.match(await page.locator('#metric-two').innerText(),/12 km/);
const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(url);assert.equal(await staticPage.locator('.project-card').count(),5);await staticPage.goto(url+'projetos/pagamentos/');assert.equal(await staticPage.locator('tbody tr').count(),4);await nojs.close();
assert.deepEqual(failures,[]);
await browser.close();console.log(JSON.stringify({viewport_checks:checked,viewports:[375,390,430,768,1366,1920],interactions:'passed',no_javascript:'passed',console_errors:failures.length},null,2));
