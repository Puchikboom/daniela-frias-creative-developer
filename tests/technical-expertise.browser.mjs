import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
const base='http://127.0.0.1:43884';
const server=spawn('python3',['-m','http.server','43884','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let count=0;
const check=(v,message)=>{if(!v)throw new Error(message);count++};
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/en/about/')).ok)break}catch{}if(i===79)throw new Error('Static server unavailable');await new Promise(r=>setTimeout(r,200))}
 for(const language of ['en','es'])for(const pagePath of ['','about/']){
  const context=await browser.newContext({viewport:pagePath?{width:390,height:844}:{width:1365,height:850}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=base+'/'+language+'/'+pagePath;
  await page.goto(url,{waitUntil:'networkidle'});
  const block=page.locator('.expertise-proof');
  check(await block.count()===1,url+' has exactly one expertise section');
  check(await block.locator('article.expertise-proof-card').count()===4,url+' has four evidence categories');
  check(await block.locator('a').count()===9,url+' has source/demo and engineering links');
  check((await block.locator('a[href*="/react-api-studio/"]').count())===1,url+' has real React demo');
  check((await block.locator('a[href*="/engineering/forma-studio/"]').count())===1,url+' has WordPress technical study');
  check((await block.locator('a[href*="/threadlab/"]').count())===1,url+' has creative front-end demo');
  const links=await block.locator('a[href]').evaluateAll(nodes=>nodes.filter(n=>n.getAttribute('href')?.startsWith('/')).map(n=>n.getAttribute('href')));
  for(const href of links){const response=await fetch(base+href);check(response.ok,url+' locally links to existing page '+href)}
  const violations=(await new AxeBuilder({page}).include('.expertise-proof').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations;
  for(const v of violations)console.log(language,pagePath||'home','axe',v.id,v.nodes.map(n=>n.target));
  check(violations.length===0,url+' WCAG automated audit');
  check(errors.length===0,url+' no JS errors '+errors.join(';'));
  const width=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  check(width,url+' no page-level horizontal overflow');
  await context.close();
 }
 console.log('Bilingual technical expertise browser tests passed:',count);
}catch(e){console.error(e);process.exitCode=1}
finally{await browser.close();server.kill()}
