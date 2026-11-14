import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
const base='http://127.0.0.1:43885';
const server=spawn('python3',['-m','http.server','43885','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let count=0;function check(ok,msg){if(!ok)throw Error(msg);count++}
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/pulse-studio/')).ok)break}catch{}if(i===79)throw Error('Server unavailable');await new Promise(r=>setTimeout(r,200))}
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,acceptDownloads:true});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/pulse-studio/',{waitUntil:'networkidle'});
 check(await page.locator('.stats section').count()===4,'four reactive KPIs');
 check(await page.locator('.category-row').count()>0,'categories rendered');
 check(await page.locator('.status-column').count()===3,'status distribution bars');
 await page.getByRole('combobox',{name:'Status'}).selectOption('Completed');
 check((await page.locator('.stats section').first().innerText()).includes('01'),'filtered count updates');
 check(await page.locator('tbody tr').count()===1,'table reflects filter');
 await page.getByRole('combobox',{name:'Status'}).selectOption('All');
 await page.getByRole('combobox',{name:'Category'}).selectOption('Web Application');
 check(await page.locator('tbody tr').count()===1,'category filters independently');
 await page.getByRole('button',{name:'Clear filters'}).click();
 check(await page.locator('tbody tr').count()===4,'clear restores records');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:/Export filtered CSV/}).click();
 check((await download).suggestedFilename()==='pulse-studio-fictional-projects.csv','CSV generated');
 const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations;
 for(const v of violations)console.log('axe',v.id,v.nodes.map(n=>n.target));
 check(violations.length===0,'automated WCAG audit');
 check(errors.length===0,'no runtime errors '+errors.join(';'));
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'no page overflow');
 await context.close();
 }
 console.log('Pulse Studio 2.0 browser checks passed',count);
}catch(e){console.error('Pulse Studio 2.0 QA failed:',e);process.exitCode=1}finally{await browser.close();server.kill()}
