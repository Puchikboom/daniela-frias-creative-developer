import {readdirSync,writeFileSync,statSync,readFileSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
const dist=resolve('dist'),origin='https://daniela-frias-creative-developer.pages.dev';
const urls=[];
function walk(dir){
 for(const name of readdirSync(dir)){
  const path=resolve(dir,name);
  if(statSync(path).isDirectory())walk(path);
  else if(name==='index.html'){
   let rel=relative(dist,path).split(sep).join('/');
   let route='/'+rel.replace(/index\.html$/,'');
   if(route==='//')route='/';
   const html=readFileSync(path,'utf8');
   if(/<meta[^>]+name="robots"[^>]+noindex/.test(html))continue;
   urls.push(route);
  }
 }
}
walk(dist);urls.sort();
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(path=>'  <url><loc>'+origin+path.replaceAll('&','&amp;')+'</loc></url>').join('\n')+'\n</urlset>\n';
writeFileSync(resolve(dist,'sitemap.xml'),xml);
writeFileSync(resolve(dist,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
console.log('Generated sitemap for',urls.length,'built pages');
