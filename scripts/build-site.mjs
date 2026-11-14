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
// Build an independent React + TypeScript Playground experiment as static assets.
const reactLab=resolve(root,'labs/react-api-studio');
if(!existsSync(resolve(reactLab,'node_modules'))){
 run('npm',['install','--no-audit','--no-fund'],reactLab);
}
run('npm',['run','build'],reactLab);
const reactDestination=resolve(root,'public/react-api-studio');
rmSync(reactDestination,{recursive:true,force:true});
mkdirSync(reactDestination,{recursive:true});
cpSync(resolve(reactLab,'dist'),reactDestination,{recursive:true});
if(!existsSync(resolve(reactDestination,'index.html')))throw Error('React API Studio build missing');
// Only compiled static assets are deployed. No backend credentials or private data.
run('npm',['exec','--','astro','build'],root);
