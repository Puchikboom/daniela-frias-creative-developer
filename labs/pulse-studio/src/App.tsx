import {useEffect,useMemo,useState,type FormEvent} from 'react';
import type {Project, Draft, Status} from './types';
import {demoRequest,resetDemo} from './demoApi';
import {selectProjects,summarizeProjects,exportCsv,type SortKey,type SortOrder} from './analytics';

const statuses:Status[]=['In progress','In review','Completed'];
const blank:Draft={name:'',client:'',category:'Web Application',status:'In progress',budget:0,progress:0,due:'2026-12-31'};
const currency=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const isDemo=import.meta.env.VITE_DEMO_MODE==='true';
async function request<T>(method:string,body?:unknown):Promise<T>{
 if(isDemo)return demoRequest<T>(method,body);
 const res=await fetch('/api/projects',{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const json:unknown=await res.json();
 if(!res.ok)throw new Error((json as {error?:string}).error||'API request failed');
 return json as T;
}
export default function App(){
 const [items,setItems]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<'All'|Status>('All');
 const [category,setCategory]=useState('All');
 const [sort,setSort]=useState<SortKey>('due');
 const [order,setOrder]=useState<SortOrder>('asc');
 const [form,setForm]=useState<Draft>(blank);
 const [editing,setEditing]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const reset=async()=>{resetDemo();setQuery('');setFilter('All');setCategory('All');setSort('due');setOrder('asc');setError('');await refresh()};
 const refresh=async()=>{const result=await request<{data:Project[]}>('GET');setItems(result.data)};
 useEffect(()=>{refresh().catch(e=>setError(String(e))).finally(()=>setLoading(false))},[]);
 const visible=useMemo(()=>selectProjects(items,{query,status:filter,category,sort,order}),[items,query,filter,category,sort,order]);
 const summary=useMemo(()=>summarizeProjects(visible),[visible]);
 const fullSummary=useMemo(()=>summarizeProjects(items),[items]);
 const allCategories=useMemo(()=>['All',...new Set(items.map(p=>p.category))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b)),[items]);
 const exportVisible=()=>{const file=new Blob([exportCsv(visible)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='pulse-studio-fictional-projects.csv';document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)};
 function startCreate(){setForm({...blank});setEditing(null);setOpen(true);setError('')}
 function startEdit(p:Project){const {id:_id,createdAt:_createdAt,...values}=p;setForm(values);setEditing(p.id);setOpen(true);setError('')}
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{
   await request(editing?'PUT':'POST',editing?{...form,id:editing}:form);
   await refresh();setOpen(false);setEditing(null);
 }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 async function remove(p:Project){if(!window.confirm('Delete '+p.name+'?'))return;setBusy(true);setError('');try{await request('DELETE',{id:p.id});await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <div className="app">
  <aside className="sidebar"><div className="brand">P<span>///</span> STUDIO</div><div className="sidebar-label">ENGINEERING LAB / 01</div><nav aria-label="Dashboard"><a className="nav-selected" href="#overview">01 <span>Overview</span></a><a href="#projects">02 <span>Projects</span></a><a href="#about">03 <span>About this demo</span></a></nav><div className="side-bottom"><span className="live-dot"/> {isDemo?'BROWSER-ONLY DEMO':'LOCAL API MODE'}<br/><small>All names and records are fictional</small></div></aside>
  <main id="overview"><div className="eyebrow">INDEPENDENT PORTFOLIO PROJECT — REACT / TYPESCRIPT / PHP {isDemo?'· SAFE BROWSER DEMO':''}</div><header className="top"><div><h1>Studio <em>operations.</em></h1><p>A design-led product dashboard with interactive analytics, typed data and local PHP/SQLite engineering.</p></div><div className="top-actions">{isDemo&&<button className="reset-button" type="button" onClick={reset}>Reset demo data</button>}<button type="button" className="primary" onClick={startCreate}>+ New project</button></div></header>
  <div className="stats" aria-label="Metrics computed from current filters"><section><span>TOTAL PROJECTS</span><strong>{summary.total.toString().padStart(2,'0')}</strong><small>Filtered workspace records</small></section><section><span>ACTIVE WORK</span><strong>{summary.active.toString().padStart(2,'0')}</strong><small>In progress</small></section><section><span>TOTAL DEMO BUDGET</span><strong>{currency(summary.budget)}</strong><small>Illustrative, not revenue</small></section><section><span>AVERAGE PROGRESS</span><strong>{summary.progress}%</strong><small>{summary.completed} completed</small></section></div>
<section className="insights" aria-labelledby="insights-heading">
    <div className="insights-head"><div><span className="eyebrow">02 / LIVE ANALYTICS</span><h2 id="insights-heading">A clearer <em>picture.</em></h2></div><p>Every chart is recalculated from the filtered project records. Values are fictional.</p></div>
    <div className="insights-grid"><div className="insight-panel">
      <h3>Project mix <span>BY CATEGORY</span></h3>
      <div className="category-chart">{summary.categories.length?summary.categories.map((item,index)=><div className="category-row" key={item.name}><div className="category-top"><span>{item.name}</span><strong>{item.count} / {summary.total}</strong></div><div className="category-track"><span style={{width:(summary.total?100*item.count/summary.total:0)+'%',background:['#ba6b95','#bfd78a','#8a82bc','#cba47d'][index%4]}}/></div></div>):<p className="chart-empty">No results for the selected filters.</p>}</div>
    </div><div className="insight-panel status-panel"><h3>Delivery status <span>CURRENT SELECTION</span></h3>
      <div className="status-chart">{statuses.map((status,index)=>{const count=visible.filter(p=>p.status===status).length;return <div className="status-column" key={status}><div className="status-bar-track"><div style={{height:(summary.total?Math.max(3,count/summary.total*100):0)+'%',background:['#cee09d','#d5a2bc','#a9a0d4'][index]}}/></div><strong>{count}</strong><small>{status}</small></div>})}</div>
      <p>Average project completion <strong>{summary.progress}%</strong></p></div></div>
   </section>
  <section id="projects" className="projects"><div className="section-title"><div><span className="eyebrow">03 / WORKSPACE</span><h2>Project directory<span className="pink">.</span></h2></div><span className="counter">{visible.length} / {items.length} results</span></div>
  <div className="toolbar toolbar-v2">
   <label className="search">Search<input aria-label="Search projects" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Project, client, category..." /></label>
   <label className="filter">Status<select value={filter} onChange={e=>setFilter(e.target.value as 'All'|Status)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
   <label className="filter">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{allCategories.map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="filter">Sort by<select value={sort} onChange={e=>setSort(e.target.value as SortKey)}><option value="due">Due date</option><option value="name">Name</option><option value="budget">Budget</option><option value="progress">Progress</option></select></label>
   <label className="filter">Direction<select value={order} onChange={e=>setOrder(e.target.value as SortOrder)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label>
  </div>
  <div className="toolbar-actions"><span aria-live="polite">{summary.total} of {fullSummary.total} records selected · {currency(summary.budget)} illustrative budget</span><button type="button" onClick={()=>{setQuery('');setFilter('All');setCategory('All');setSort('due');setOrder('asc')}}>Clear filters</button><button type="button" onClick={exportVisible}>Export filtered CSV ↓</button></div>
  {error&&<p className="error" role="alert">{error}</p>}
  {loading?<p role="status">Loading projects…</p>:<div className="table-wrap" role="region" aria-label="Scrollable project records" tabIndex={0}><table><thead><tr><th>PROJECT / CLIENT</th><th>CATEGORY</th><th>STATUS</th><th>PROGRESS</th><th>BUDGET</th><th>ACTIONS</th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.client}</small></td><td>{p.category}</td><td><span className={'status '+p.status.toLowerCase().replaceAll(' ','-')}>{p.status}</span></td><td><div className="meter" role="progressbar" aria-label={p.name+' progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.progress}><span style={{width:p.progress+'%'}}/></div><small>{p.progress}%</small></td><td>{currency(p.budget)}</td><td><div className="actions"><button disabled={busy} type="button" onClick={()=>startEdit(p)}>Edit</button><button disabled={busy} type="button" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}</tbody></table>{visible.length===0&&<p className="empty">No matching projects. Try another filter or create a record.</p>}</div>}</section>
  <section id="about" className="about"><span className="eyebrow">04 / UNDER THE HOOD</span><h2>Functional code.<br/><em>Not a mockup.</em></h2><div><p>React 19 + TypeScript render and manage the interface. PHP 8 exposes CRUD endpoints; the Vite development server proxies API calls to a separate local PHP server.</p><p>All data is synthetic. In public demo mode, records live only in your browser and can be reset; no PHP endpoint is exposed. The separate PHP/SQLite API is a local engineering exercise without authentication and must not be deployed as a public writable service.</p></div></section><footer>© 2026 PULSE STUDIO — AN ORIGINAL ENGINEERING EXERCISE</footer></main>
 {open&&<div className="overlay" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-head"><div className="eyebrow">PROJECT EDITOR</div><h2 id="form-title">{editing?'Edit project':'Create project'}</h2><button type="button" aria-label="Close editor" onClick={()=>setOpen(false)}>✕</button></div><form onSubmit={submit}><div className="form-grid"><label>Project name<input required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Client name<input required minLength={2} maxLength={100} value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></label><label>Category<input required minLength={2} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Budget USD<input required type="number" min={0} max={10000000} value={form.budget} onChange={e=>setForm({...form,budget:Number(e.target.value)})}/></label><label>Progress (%)<input required type="number" min={0} max={100} value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/></label><label>Due date<input required type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></label></div><div className="modal-actions"><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Create project'}</button></div></form></div></div>}
 </div>
}
