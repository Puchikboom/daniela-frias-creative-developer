import {spawnSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve('.');
const lab=resolve(root,'labs/pulse-studio');
function run(command,args,cwd){
 const result=spawnSync(command,args,{cwd,stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status??1);
}
if(!existsSync(resolve(lab,'node_modules'))){
 run('npm',['install','--no-audit','--no-fund'],lab);
}
run('npm',['run','build:demo'],lab);
const destination=resolve(root,'public/pulse-studio');
rmSync(destination,{recursive:true,force:true});
mkdirSync(destination,{recursive:true});
cpSync(resolve(lab,'dist'),destination,{recursive:true});
if(!existsSync(resolve(destination,'index.html')))throw Error('Static Pulse demo index missing');
// Only compiled frontend assets are copied. PHP files, SQLite DB and API source
// remain separate and are never deployed with the public Astro site.
run('npm',['exec','--','astro','build'],root);
