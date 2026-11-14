import type {Project,Status} from './types';
export type SortKey='due'|'budget'|'progress'|'name';
export type SortOrder='asc'|'desc';
export type FilterSet={query:string;status:'All'|Status;category:string;sort:SortKey;order:SortOrder};
export type CategoryPoint={name:string;count:number;budget:number};
const norm=(s:string)=>s.trim().toLocaleLowerCase();
export function selectProjects(items:readonly Project[],filters:FilterSet):Project[]{
 const text=norm(filters.query);
 const result=items.filter(p=>(filters.status==='All'||p.status===filters.status)&&(filters.category==='All'||p.category===filters.category)&&(!text||norm([p.name,p.client,p.category,p.status].join(' ')).includes(text)));
 const direction=filters.order==='asc'?1:-1;
 return [...result].sort((a,b)=>{
  if(filters.sort==='name')return direction*a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  if(filters.sort==='due')return direction*a.due.localeCompare(b.due)||a.id.localeCompare(b.id);
  return direction*(a[filters.sort]-b[filters.sort])||a.id.localeCompare(b.id);
 });
}
export function summarizeProjects(items:readonly Project[]){
 const total=items.length;
 const budget=items.reduce((sum,p)=>sum+p.budget,0);
 const active=items.filter(p=>p.status==='In progress').length;
 const completed=items.filter(p=>p.status==='Completed').length;
 const progress=total?Math.round(items.reduce((sum,p)=>sum+p.progress,0)/total):0;
 const categories=new Map<string,CategoryPoint>();
 for(const p of items){const entry=categories.get(p.category)??{name:p.category,count:0,budget:0};entry.count++;entry.budget+=p.budget;categories.set(p.category,entry)}
 return {total,budget,active,completed,progress,categories:[...categories.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name))};
}
export function exportCsv(items:readonly Project[]):string{
 const fields=['ID','Project','Client','Category','Status','Budget (USD)','Progress (%)','Due'];
 const safe=(v:string|number)=>{let value=String(v);if(/^\s*[=+@\-]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"'};
 return [fields,...items.map(p=>[p.id,p.name,p.client,p.category,p.status,p.budget,p.progress,p.due])].map(row=>row.map(safe).join(',')).join('\r\n');
}
