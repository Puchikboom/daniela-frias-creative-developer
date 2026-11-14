// Original independent Playground Data Lab. No personal, employer, or client data.
export const records=Object.freeze([
{id:'001',name:'Solaris Interface',client:'Northstar',type:'Product',status:'Active',hours:148,completion:75},
{id:'002',name:'Signal Commerce',client:'Morrow',type:'Commerce',status:'Review',hours:94,completion:91},
{id:'003',name:'Forma Portal',client:'Fictional Co.',type:'Platform',status:'Done',hours:126,completion:100},
{id:'004',name:'Violet Studio',client:'Arclight',type:'Brand',status:'Active',hours:88,completion:46},
{id:'005',name:'Orbit Console',client:'Future Lab',type:'Product',status:'Active',hours:232,completion:62},
{id:'006',name:'Kite Campaign',client:'Morrow',type:'Brand',status:'Done',hours:75,completion:100},
{id:'007',name:'Canvas System',client:'Northstar',type:'Platform',status:'Review',hours:193,completion:87},
{id:'008',name:'Tide Checkout',client:'Fictional Co.',type:'Commerce',status:'Active',hours:167,completion:34},
{id:'009',name:'Lumen Platform',client:'Arclight',type:'Platform',status:'Done',hours:215,completion:100},
{id:'010',name:'Minor Key',client:'Future Lab',type:'Brand',status:'Review',hours:61,completion:94},
{id:'011',name:'Atlas Product',client:'Northstar',type:'Product',status:'Active',hours:184,completion:57},
{id:'012',name:'Neon Storefront',client:'Morrow',type:'Commerce',status:'Done',hours:109,completion:100}
]);
export const TYPES=['All','Product','Commerce','Platform','Brand'];
export const STATUSES=['All','Active','Review','Done'];
export const normalize=s=>String(s??'').trim().toLocaleLowerCase();
export function filterRecords(rows,{query='',type='All',status='All',sort='name'}={}){
 const q=normalize(query);
 const filtered=rows.filter(r=>(type==='All'||r.type===type)&&(status==='All'||r.status===status)&&(!q||normalize(r.name+' '+r.client+' '+r.type).includes(q)));
 const comparators={
 name:(a,b)=>a.name.localeCompare(b.name),
 hours:(a,b)=>b.hours-a.hours||a.name.localeCompare(b.name),
 progress:(a,b)=>b.completion-a.completion||a.name.localeCompare(b.name),
 };
 return [...filtered].sort(comparators[sort]||comparators.name);
}
export function summarize(rows){
 const total=rows.length;
 const hours=rows.reduce((sum,r)=>sum+r.hours,0);
 const completion=total?Math.round(rows.reduce((sum,r)=>sum+r.completion,0)/total):0;
 return {total,hours,completion,active:rows.filter(r=>r.status==='Active').length,
 categories:['Product','Commerce','Platform','Brand'].map(name=>({name,value:rows.filter(r=>r.type===name).length}))};
}
export function toCSV(rows){
 const safe=value=>{const s=String(value);const neutral=/^[\s]*[=+@-]/.test(s)?"'"+s:s;return '"'+neutral.replaceAll('"','""')+'"';};
 return [['ID','Project','Client','Type','Status','Hours','Progress'],...rows.map(r=>[r.id,r.name,r.client,r.type,r.status,r.hours,r.completion])].map(row=>row.map(safe).join(',')).join('\r\n');
}
