import {useEffect,useMemo,useState,type FormEvent} from 'react';
import type {Project, Draft, Status} from './types';
import {demoRequest,resetDemo} from './demoApi';

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
 const [filter,setFilter]=useState('All');
 const [form,setForm]=useState<Draft>(blank);
 const [editing,setEditing]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const reset=async()=>{resetDemo();setQuery('');setFilter('All');setError('');await refresh()};
 const refresh=async()=>{const result=await request<{data:Project[]}>('GET');setItems(result.data)};
 useEffect(()=>{refresh().catch(e=>setError(String(e))).finally(()=>setLoading(false))},[]);
 const visible=useMemo(()=>items.filter(p=>(filter==='All'||p.status===filter)&&[p.name,p.client,p.category].join(' ').toLowerCase().includes(query.toLowerCase())),[items,filter,query]);
 const active=items.filter(p=>p.status==='In progress').length;
 const completed=items.filter(p=>p.status==='Completed').length;
 const budget=items.reduce((s,p)=>s+p.budget,0);
 const progress=items.length?Math.round(items.reduce((s,p)=>s+p.progress,0)/items.length):0;
 function startCreate(){setForm({...blank});setEditing(null);setOpen(true);setError('')}
 function startEdit(p:Project){const {id:_id,createdAt:_createdAt,...values}=p;setForm(values);setEditing(p.id);setOpen(true);setError('')}
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{
   await request(editing?'PUT':'POST',editing?{...form,id:editing}:form);
   await refresh();setOpen(false);setEditing(null);
 }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 async function remove(p:Project){if(!window.confirm('Delete '+p.name+'?'))return;setBusy(true);setError('');try{await request('DELETE',{id:p.id});await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <div className="app">
  <aside className="sidebar"><div className="brand">P<span>///</span> STUDIO</div><div className="sidebar-label">ENGINEERING LAB / 01</div><nav aria-label="Dashboard"><a className="nav-selected" href="#overview">01 <span>Overview</span></a><a href="#projects">02 <span>Projects</span></a><a href="#about">03 <span>About this demo</span></a></nav><div className="side-bottom"><span className="live-dot"/> {isDemo?'BROWSER-ONLY DEMO':'LOCAL API MODE'}<br/><small>All names and records are fictional</small></div></aside>
  <main id="overview"><div className="eyebrow">INDEPENDENT PORTFOLIO PROJECT — REACT / TYPESCRIPT / PHP {isDemo?'· SAFE BROWSER DEMO':''}</div><header className="top"><div><h1>Studio <em>operations.</em></h1><p>A small but real frontend ↔ backend workflow.</p></div><div className="top-actions">{isDemo&&<button className="reset-button" type="button" onClick={reset}>Reset demo data</button>}<button type="button" className="primary" onClick={startCreate}>+ New project</button></div></header>
  <div className="stats"><section><span>TOTAL PROJECTS</span><strong>{items.length.toString().padStart(2,'0')}</strong><small>All workspace records</small></section><section><span>ACTIVE WORK</span><strong>{active.toString().padStart(2,'0')}</strong><small>In progress</small></section><section><span>TOTAL DEMO BUDGET</span><strong>{currency(budget)}</strong><small>Illustrative, not revenue</small></section><section><span>AVERAGE PROGRESS</span><strong>{progress}%</strong><small>{completed} completed</small></section></div>
  <section id="projects" className="projects"><div className="section-title"><div><span className="eyebrow">01 / WORKSPACE</span><h2>Project directory<span className="pink">.</span></h2></div><span className="counter">{visible.length} / {items.length} results</span></div>
  <div className="toolbar"><label className="search">Search<input aria-label="Search projects" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Project, client, category..." /></label><label className="filter">Status<select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div>
  {error&&<p className="error" role="alert">{error}</p>}
  {loading?<p role="status">Loading projects…</p>:<div className="table-wrap"><table><thead><tr><th>PROJECT / CLIENT</th><th>CATEGORY</th><th>STATUS</th><th>PROGRESS</th><th>BUDGET</th><th>ACTIONS</th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.client}</small></td><td>{p.category}</td><td><span className={'status '+p.status.toLowerCase().replaceAll(' ','-')}>{p.status}</span></td><td><div className="meter"><span style={{width:p.progress+'%'}}/></div><small>{p.progress}%</small></td><td>{currency(p.budget)}</td><td><div className="actions"><button disabled={busy} type="button" onClick={()=>startEdit(p)}>Edit</button><button disabled={busy} type="button" onClick={()=>remove(p)}>Delete</button></div></td></tr>)}</tbody></table>{visible.length===0&&<p className="empty">No matching projects. Try another filter or create a record.</p>}</div>}</section>
  <section id="about" className="about"><span className="eyebrow">02 / UNDER THE HOOD</span><h2>Functional code.<br/><em>Not a mockup.</em></h2><div><p>React 19 + TypeScript render and manage the interface. PHP 8 exposes CRUD endpoints; the Vite development server proxies API calls to a separate local PHP server.</p><p>All data is synthetic. In public demo mode, records live only in your browser and can be reset; no PHP endpoint is exposed. The separate PHP/SQLite API is a local engineering exercise without authentication and must not be deployed as a public writable service.</p></div></section><footer>© 2026 PULSE STUDIO — AN ORIGINAL ENGINEERING EXERCISE</footer></main>
 {open&&<div className="overlay" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-head"><div className="eyebrow">PROJECT EDITOR</div><h2 id="form-title">{editing?'Edit project':'Create project'}</h2><button type="button" aria-label="Close editor" onClick={()=>setOpen(false)}>✕</button></div><form onSubmit={submit}><div className="form-grid"><label>Project name<input required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Client name<input required minLength={2} maxLength={100} value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></label><label>Category<input required minLength={2} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Budget USD<input required type="number" min={0} max={10000000} value={form.budget} onChange={e=>setForm({...form,budget:Number(e.target.value)})}/></label><label>Progress (%)<input required type="number" min={0} max={100} value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}/></label><label>Due date<input required type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></label></div><div className="modal-actions"><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Create project'}</button></div></form></div></div>}
 </div>
}
