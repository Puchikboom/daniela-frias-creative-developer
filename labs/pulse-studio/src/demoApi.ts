import type {Project, Draft} from './types';

const STORAGE_KEY='pulse-studio-demo-v1';
const initial:Project[]=[
{id:'demo1',name:'Northstar Brand System',client:'Northstar Studio',category:'Brand Experience',status:'In progress',budget:8200,progress:72,due:'2026-12-10',createdAt:'2026-10-25'},
{id:'demo2',name:'Arclight Web Platform',client:'Arclight Labs',category:'Web Application',status:'In review',budget:11400,progress:91,due:'2026-11-29',createdAt:'2026-10-27'},
{id:'demo3',name:'Solstice Campaign',client:'Solstice Collective',category:'Digital Campaign',status:'Completed',budget:5400,progress:100,due:'2026-11-12',createdAt:'2026-10-02'},
{id:'demo4',name:'Morrow Dashboard',client:'Morrow Industries',category:'Product Interface',status:'In progress',budget:9900,progress:48,due:'2026-12-18',createdAt:'2026-11-01'}
];
function read():Project[]{
 try{
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved!==null){const value:unknown=JSON.parse(saved);if(Array.isArray(value))return value as Project[];}
 }catch{ /* Browser storage is optional; use seeded synthetic data. */ }
 return initial.map(x=>({...x}));
}
function write(value:Project[]):void{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(value))}catch{/* Storage disabled, current operation still updates in-memory fallback. */}fallback=value;}
let fallback:Project[]|null=null;
function data():Project[]{return fallback??read();}
function validate(payload:unknown):Draft{
 if(!payload||typeof payload!=='object')throw new Error('Invalid project');
 const v=payload as Partial<Project>;
 if(typeof v.name!=='string'||v.name.trim().length<2||v.name.length>100)throw new Error('Invalid project name');
 if(typeof v.client!=='string'||v.client.trim().length<2||v.client.length>100)throw new Error('Invalid client');
 if(typeof v.category!=='string'||v.category.trim().length<2||v.category.length>100)throw new Error('Invalid category');
 if(!['In progress','In review','Completed'].includes(v.status??''))throw new Error('Invalid status');
 if(typeof v.budget!=='number'||!Number.isFinite(v.budget)||v.budget<0||v.budget>10000000)throw new Error('Invalid budget');
 if(typeof v.progress!=='number'||!Number.isInteger(v.progress)||v.progress<0||v.progress>100)throw new Error('Invalid progress');
 if(typeof v.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.due)||Number.isNaN(new Date(v.due+'T00:00:00Z').getTime())||new Date(v.due+'T00:00:00Z').toISOString().slice(0,10)!==v.due)throw new Error('Invalid due date');
 return {name:v.name.trim(),client:v.client.trim(),category:v.category.trim(),status:v.status!,budget:v.budget,progress:v.progress,due:v.due};
}
export async function demoRequest<T>(method:string,body?:unknown):Promise<T>{
 let records=data();
 if(method==='GET')return {data:records} as T;
 if(method==='POST'){
  const values=validate(body);
  const item:Project={...values,id:'demo-'+crypto.randomUUID(),createdAt:new Date().toISOString().slice(0,10)};
  records=[...records,item];write(records);return {data:item} as T;
 }
 if(!body||typeof body!=='object'||typeof (body as Partial<Project>).id!=='string')throw new Error('Invalid id');
 const id=(body as Project).id;
 const index=records.findIndex(x=>x.id===id);
 if(index===-1)throw new Error('Project not found');
 if(method==='DELETE'){
  const item=records[index];write(records.filter(x=>x.id!==id));return {data:item} as T;
 }
 if(method==='PUT'){
  const values=validate(body);
  const item={...records[index],...values};
  records=records.map(x=>x.id===id?item:x);write(records);return {data:item} as T;
 }
 throw new Error('Unsupported operation');
}
export function resetDemo():void{try{localStorage.removeItem(STORAGE_KEY)}catch{}fallback=null;}
