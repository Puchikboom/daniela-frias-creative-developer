import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const base='http://127.0.0.1:43879';
mkdirSync('qa-artifacts',{recursive:true});
const server=spawn('python3',['-m','http.server','43879','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let passed=0;
function check(value,message){if(!value)throw new Error(message);passed++;}
async function waitServer(){
 for(let i=0;i<60;i++){
  try{const r=await fetch(base+'/en/threadlab/');if(r.ok)return;}
  catch{}
  await new Promise(r=>setTimeout(r,250));
 }
 throw new Error('Astro static build server not ready');
}
try{
 await waitServer();
 for(const [locale,view] of [['en',{width:1440,height:900}],['es',{width:390,height:844}]]){
  const context=await browser.newContext({viewport:view,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text())});
  page.on('requestfailed',req=>errors.push('request: '+req.url()+' '+req.failure()?.errorText));
  await page.goto(base+'/'+locale+'/threadlab/',{waitUntil:'networkidle'});
  check(await page.locator('#tl-garment').count()===1,locale+': visual SVG exists');
  check(await page.locator('#tl-material').innerText().then(s=>s.length>0),locale+': material label available');
  const original=await page.locator('#tl-body').getAttribute('d');
  await page.locator('label:has(input[name="fabric"][value="linen"])').click();
  const materialAfter=await page.locator('#tl-material').innerText();
  if(!materialAfter.toLowerCase().includes(locale==='es'?'lino':'linen')){
    console.error('Browser debug',JSON.stringify({locale,materialAfter,errors,scripts:await page.locator('script[src]').evaluateAll(nodes=>nodes.map(x=>x.getAttribute('src'))),checked:await page.locator('input[name="fabric"]:checked').inputValue()}));
  }
  check(materialAfter.toLowerCase().includes(locale==='es'?'lino':'linen'),locale+': fabric selection updates text');
  await page.locator('label:has(input[name="color"][value="cobalt"])').click();
  check(await page.locator('#tl-body').getAttribute('fill')==='#5879D1',locale+': color updates SVG');
  await page.locator('label:has(input[name="fit"][value="oversized"])').click();
  check(await page.locator('#tl-body').getAttribute('d')!==original,locale+': silhouette changes');
  await page.locator('#tl-monogram').fill('ABC');
  check(await page.locator('#tl-shirt-mark').textContent()==='ABC',locale+': editable monogram renders');
  await page.reload({waitUntil:'networkidle'});
  check(await page.locator('#tl-body').getAttribute('fill')==='#5879D1',locale+': state persists after reload');
  check(await page.locator('#tl-monogram').inputValue()==='ABC',locale+': monogram persists');
  await page.locator('#tl-grid').uncheck();
  check(await page.locator('#tl-tech-grid').evaluate(el=>getComputedStyle(el).display)==='none',locale+': grid toggle hides guide');
  const download=page.waitForEvent('download');
  await page.locator('#tl-export').click();
  check((await download).suggestedFilename()==='threadlab-design.svg',locale+': SVG export');
  await page.screenshot({path:'qa-artifacts/threadlab-'+locale+'.png',fullPage:true});
  await page.locator('#tl-reset').click();
  check(await page.locator('#tl-body').getAttribute('fill')==='#29212d',locale+': reset restores color');
  check(await page.locator('#tl-monogram').inputValue()==='DF',locale+': reset restores monogram');
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  check(dims.scroll<=dims.inner+2,locale+': no horizontal overflow');
  check(errors.length===0,locale+': no uncaught page errors '+errors.join('; '));
  await context.close();
 }
 const c=await browser.newContext();
 const p=await c.newPage();
 await p.goto(base+'/en/threadlab/?fabric=canvas&color=berry&fit=relaxed&mark=AX&grid=0');
 check(await p.locator('#tl-body').getAttribute('fill')==='#A65F7C','shareable deep link restores color');
 check(await p.locator('#tl-monogram').inputValue()==='AX','shareable deep link restores monogram');
 // Native keyboard operation should reach each control and maintain focus visibility.
 await p.locator('input[name="fabric"][value="cotton"]').focus();
 await p.keyboard.press('ArrowDown');
 check(await p.locator('input[name="fabric"][value="canvas"]').isChecked(),'keyboard changes native radio selection');
 await c.close();
 console.log('ThreadLab browser checks passed:',passed);
}catch(e){console.error('ThreadLab browser QA failed:',e);process.exitCode=1;}
finally{await browser.close();server.kill();}
