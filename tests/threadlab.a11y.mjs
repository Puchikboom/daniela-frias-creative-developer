import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:43880';
mkdirSync('qa-artifacts',{recursive:true});
const server=spawn('python3',['-m','http.server','43880','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
let failed=false;
try{
 for(let tries=0;tries<60;tries++){
  try{if((await fetch(base+'/en/threadlab/')).ok)break;}catch{}
  if(tries===59)throw Error('Local site did not start');
  await new Promise(r=>setTimeout(r,200));
 }
 for(const locale of ['en','es']){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'/'+locale+'/threadlab/',{waitUntil:'networkidle'});
  const result=await new AxeBuilder({page})
     .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
     .analyze();
  writeFileSync('qa-artifacts/threadlab-axe-'+locale+'.json',JSON.stringify({
   locale,violations:result.violations.map(x=>({id:x.id,impact:x.impact,description:x.description,nodes:x.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),
   passes:result.passes.length,
  },null,2));
  console.log(locale, 'WCAG 2.1 A/AA automated:', result.violations.length,'violations',result.passes.length,'passed rules');
  for(const v of result.violations)console.log(v.impact,v.id,v.nodes.map(n=>n.target));
  if(result.violations.length)failed=true;
  await page.close();
 }
}catch(e){console.error(e);failed=true;}
finally{await browser.close();server.kill();}
if(failed)process.exitCode=1;
