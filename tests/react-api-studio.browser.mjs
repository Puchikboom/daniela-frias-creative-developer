import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
const base='http://127.0.0.1:43883';
const server=spawn('python3',['-m','http.server','43883','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let count=0;
function check(value,label){if(!value)throw Error(label);count++}
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/react-api-studio/')).ok)break}catch{}if(i===79)throw Error('Static build unavailable');await new Promise(r=>setTimeout(r,200))}
 for(const lang of ['en','es']){
  const ctx=await browser.newContext({viewport:lang==='en'?{width:1400,height:850}:{width:390,height:844}});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/react-api-studio/?lang='+lang,{waitUntil:'networkidle'});
  check(await page.locator('button.go').count()===1,lang+' React application rendered');
  await page.getByRole('button',{name:lang==='es'?/Consultar datos/i:/Fetch data/i}).click();
  await page.waitForSelector('.indicator.success',{timeout:7000});
  check(await page.locator('.record').count()===6,lang+' same-origin fetch returned six fictional records');
  await page.getByRole('combobox').selectOption('Creative');
  check(await page.locator('.record').count()===2,lang+' React derived filter');
  await page.getByRole('searchbox').fill('Thread');
  check(await page.locator('.record').count()===1,lang+' combined search and category filter');
  await page.getByRole('searchbox').fill('');
  await page.getByRole('combobox').selectOption('All');
  await page.locator('input[type="checkbox"]').check();
  await page.locator('input[type="range"]').fill('0');
  await page.getByRole('button',{name:lang==='es'?/Consultar datos/i:/Fetch data/i}).click();
  await page.waitForSelector('.indicator.error',{timeout:7000});
  check(await page.locator('.error-state').count()===1,lang+' simulated failure message');
  await page.locator('input[type="checkbox"]').uncheck();
  await page.getByRole('button',{name:lang==='es'?/Reintentar/i:/Retry request/i}).first().click();
  await page.waitForSelector('.indicator.success',{timeout:7000});
  check(await page.locator('.record').count()===6,lang+' recovery after error');
  const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  for(const v of a11y.violations)console.log(lang,'axe',v.id,v.nodes.map(n=>n.target));
  check(a11y.violations.length===0,lang+' automated accessibility');
  check(errors.length===0,lang+' no runtime errors '+errors.join(';'));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  check(overflow,lang+' no horizontal overflow');
  await ctx.close();
 }
 console.log('React API Studio browser checks:',count);
}catch(error){console.error('React API Studio QA failed',error);process.exitCode=1}finally{await browser.close();server.kill()}
