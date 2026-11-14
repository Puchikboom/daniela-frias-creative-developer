import {readFileSync} from 'node:fs';
import {transform} from '@astrojs/compiler';
const src=readFileSync('src/templates/ThreadLabInteractive.astro','utf8');
try{const result=await transform(src,{filename:'src/templates/ThreadLabInteractive.astro'});
const lines=result.code.split('\n');
console.log('TRANSFORMED ASTRO LINES (FIRST 50)');
console.log(lines.slice(0,50).map((l,i)=>String(i+1).padStart(3)+' '+l.slice(0,500)).join('\n'));
}catch(e){console.error(e);process.exit(1)}
