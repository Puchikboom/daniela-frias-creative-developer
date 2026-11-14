import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','43881','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let count=0;
const check=(condition,message)=>{if(!condition)throw Error(message);count++};
try{
 for(let n=0;n<80;n++){try{const r=await fetch('http://127.0.0.1:43881/en/playground/');if(r.ok)break;}catch{}if(n===79)throw Error('Server unavailable');await new Promise(r=>setTimeout(r,200))}
 for(const lang of ['en','es']){
  const context=await browser.newContext({viewport:lang==='en'?{width:1440,height:900}:{width:390,height:844},acceptDownloads:true});
  const page=await context.newPage();
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto('http://127.0.0.1:43881/'+lang+'/playground/',{waitUntil:'networkidle'});
  check(await page.locator('#data-lab').count()===1,lang+' lab exists');
  check(await page.locator('#dl-rows tr').count()===6,lang+' pagination shows 6 of 12');
  check(await page.locator('#dl-total').textContent()==='12',lang+' derived total');
  await page.locator('#dl-status').selectOption('Done');
  check(await page.locator('#dl-total').textContent()==='04',lang+' status filter recalculates metrics');
  check(await page.locator('#dl-progress').textContent()==='100%',lang+' average progress derived from selection');
  await page.locator('#dl-search').fill('lumen');
  check(await page.locator('#dl-total').textContent()==='01',lang+' text + status compose');
  check(await page.locator('#dl-rows tr').count()===1,lang+' filtered row visible');
  await page.locator('#dl-reset').click();
  check(await page.locator('#dl-total').textContent()==='12',lang+' reset works');
  await page.locator('#dl-next').click();
  check((await page.locator('#dl-page').textContent()).includes('2'),lang+' next page');
  const download=page.waitForEvent('download');await page.locator('#dl-export').click();
  check((await download).suggestedFilename()==='df-data-lab-fictional.csv',lang+' download');
  check(failures.length===0,lang+' no JS runtime errors: '+failures.join(','));
  const audit=await new AxeBuilder({page}).include('#data-lab').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  for(const v of audit.violations)console.log(lang,'axe',v.id,v.nodes.map(n=>n.target));
  check(audit.violations.length===0,lang+' data-lab axe violations');
  await context.close();
 }
 console.log('Data Lab browser checks passed:',count);
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close();server.kill();}
