import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root='http://127.0.0.1:43886',server=spawn('python3',['-m','http.server','43886','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
mkdirSync('qa-artifacts/portfolio',{recursive:true});
let passed=0;const check=(condition,message)=>{if(!condition)throw Error(message);passed++};
const routes=['/en/','/es/','/en/about/','/es/about/','/en/work/','/es/work/','/en/playground/','/es/playground/','/en/engineering/','/en/contact/','/es/contact/','/en/engineering/forma-studio/','/en/threadlab/','/pulse-studio/','/react-api-studio/?lang=en'];
const report=[];
try{
 for(let i=0;i<80;i++){try{if((await fetch(root+'/en/')).ok)break}catch{}if(i===79)throw Error('Server unavailable');await new Promise(r=>setTimeout(r,200))}
 check((await fetch(root+'/sitemap.xml')).ok,'sitemap accessible');
 check((await fetch(root+'/robots.txt')).ok,'robots accessible');
 const sitemap=readFileSync(resolve('dist/sitemap.xml'),'utf8');
 check(sitemap.includes('/en/contact/')&&sitemap.includes('/pulse-studio/'),'sitemap includes built routes');
 for(const [width,height] of [[390,844],[768,1024],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  for(const route of routes){
   const page=await context.newPage(),consoleErrors=[];
   page.on('pageerror',e=>consoleErrors.push(e.message));
   await page.goto(root+route,{waitUntil:'networkidle',timeout:40000});
   const local=route.startsWith('/en/')||route.startsWith('/es/');
   if(local){
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    check(canonical==='https://daniela-frias-creative-developer.pages.dev'+route,'canonical '+route);
    const desc=await page.locator('meta[name="description"]').getAttribute('content');
    check(Boolean(desc&&desc.length>=40),'description '+route);
   }
   const dimensions=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
   const overflow=dimensions.page>dimensions.viewport+2;
   const timings=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return n?{domContentLoadedMs:Math.round(n.domContentLoadedEventEnd-n.startTime),loadEventMs:Math.round(n.loadEventEnd-n.startTime),transferSizeBytes:n.transferSize}:null});
   const row={route,width,overflow,jsErrors:consoleErrors.length,navigationTimingLocal:timings};
   report.push(row);
   if(overflow)console.warn('RESPONSIVE OVERFLOW',JSON.stringify(row));
   check(consoleErrors.length===0,'JavaScript page errors '+route+' '+width);
   if(['/en/','/es/','/en/playground/','/es/playground/','/en/contact/','/es/contact/','/pulse-studio/'].includes(route)){
    await page.screenshot({path:`qa-artifacts/portfolio/${route.replace(/[/?]/g,'_').replace(/^_/,'')}-${width}.png`,fullPage:true});
   }
   if(route==='/en/contact/'||route==='/es/contact/'){
    const mail=page.locator('a[href^="mailto:briefcase.df@gmail.com"]');
    check(await mail.count()>=1,'recruitment mail link visible');
    const axe=(await new AxeBuilder({page}).include('.folio-contact-page').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations;
    for(const v of axe)console.warn('CONTACT AXE',v.id,v.nodes.map(n=>n.target));
    check(axe.length===0,'contact accessibility audit');
   }
   await page.close();
  }
  await context.close();
 }
 writeFileSync('qa-artifacts/portfolio/report.json',JSON.stringify({note:'Synthetic local build navigation diagnostics, not Core Web Vitals or production field data; automated accessibility checks are scoped to the contact section.',checks:passed,pages:report},null,2));
 console.log('Portfolio audit checks passed:',passed);
}catch(e){console.error('Portfolio audit failure:',e);process.exitCode=1}
finally{await browser.close();server.kill()}
