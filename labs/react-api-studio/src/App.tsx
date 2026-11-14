import {useCallback,useEffect,useMemo,useRef,useState} from 'react';

type Status='idle'|'loading'|'success'|'error';
type Category='All'|'Product'|'Engineering'|'Creative';
type RecordItem={id:string;name:string;sector:Exclude<Category,'All'>;status:string;progress:number;score:number;owner:string;accent:string};
type ResponseBody={meta:{source:string;version:number};data:RecordItem[]};
const locale=new URLSearchParams(window.location.search).get('lang')==='es'?'es':'en';
const es=locale==='es';
const t=es?{
eyebrow:'06 / LABORATORIO DE PRODUCTO',heading:'Estados reales.',accent:'Interacciones cuidadas.',desc:'React y TypeScript con una solicitud de red real a un archivo JSON local. Explora cargas, errores simulados, reintentos, filtros y estados vacíos. Todos los datos son ficticios.',
network:'OBSERVADOR DE SOLICITUDES',source:'RECURSO DE PRUEBA',response:'RESPUESTA',fetch:'Consultar datos',retry:'Reintentar',cancel:'Cancelar',reset:'Restablecer',mode:'FORZAR ERROR DE PRUEBA',latency:'LATENCIA ADICIONAL',status:'ESTADO',duration:'DURACIÓN',items:'REGISTROS',filter:'CATEGORÍA',search:'BUSCAR',searchHint:'Buscar proyecto o responsable',all:'Todos',results:'RESULTADOS',idle:'Sin solicitud',loading:'Consultando archivo JSON local…',success:'Datos recibidos correctamente',error:'Error de prueba o de conexión',empty:'Sin resultados para estos filtros.',sourceNote:'Archivo local de solo lectura · Sin servidor privado ni información de clientes',simulated:'Se simula un error para demostrar recuperación de interfaz; el archivo se consulta mediante fetch real.',ready:'Preparado para iniciar una solicitud',views:'PROYECTOS',score:'CALIDAD MEDIA',progress:'AVANCE MEDIO',count:'ELEMENTOS',tip:'Activa el error de prueba, consulta y usa Reintentar para explorar la recuperación.',request:'SOLICITUD',panel:'EXPLORADOR',notice:'DEMO INDEPENDIENTE / DATOS SINTÉTICOS',details:'La latencia y el fallo son controles simulados. La descarga del archivo JSON se realiza mediante fetch real en el mismo dominio.',ms:'ms',clear:'Limpiar búsqueda'
}:{
eyebrow:'06 / PRODUCT ENGINEERING LAB',heading:'Real states.',accent:'Thoughtful interactions.',desc:'React and TypeScript with a real network request to a local JSON asset. Explore loading, simulated errors, retries, filtering and empty states. All records are fictional.',
network:'REQUEST OBSERVATORY',source:'TEST RESOURCE',response:'RESPONSE',fetch:'Fetch data',retry:'Retry request',cancel:'Cancel',reset:'Reset',mode:'SIMULATE REQUEST FAILURE',latency:'ADDITIONAL LATENCY',status:'STATE',duration:'DURATION',items:'RECORDS',filter:'CATEGORY',search:'SEARCH',searchHint:'Find a project or owner',all:'All',results:'RESULTS',idle:'No request',loading:'Fetching local JSON asset…',success:'Data received successfully',error:'Simulated or network error',empty:'No results for these filters.',sourceNote:'Read-only local asset · No private server or client data',simulated:'A failure is simulated to demonstrate UI recovery; the asset itself is retrieved using real fetch.',ready:'Ready to make a request',views:'PROJECTS',score:'AVERAGE QUALITY',progress:'AVERAGE PROGRESS',count:'RECORDS',tip:'Enable simulated failure, fetch, then retry to explore recovery behavior.',request:'REQUEST',panel:'RECORD EXPLORER',notice:'INDEPENDENT DEMO / SYNTHETIC DATA',details:'Latency and failure are simulated controls. The JSON asset is retrieved via a real same-origin fetch.',ms:'ms',clear:'Clear search'
};
const colors=['#d5e49c','#d09bb6','#aab1dc'];
function average(items:RecordItem[],key:'score'|'progress'){return items.length?Math.round(items.reduce((v,i)=>v+i[key],0)/items.length):0}
function safeRecord(x:unknown):x is RecordItem{
 if(!x||typeof x!=='object')return false;
 const r=x as Partial<RecordItem>;
 return typeof r.id==='string'&&typeof r.name==='string'&&['Product','Engineering','Creative'].includes(r.sector??'')&&typeof r.score==='number'&&typeof r.progress==='number'&&typeof r.owner==='string'&&typeof r.accent==='string';
}
async function loadCatalog(signal:AbortSignal):Promise<RecordItem[]>{
 const response=await fetch('./catalog.json',{signal,cache:'no-store'});
 if(!response.ok)throw new Error('HTTP '+response.status);
 const result:unknown=await response.json();
 if(!result||typeof result!=='object'||!Array.isArray((result as ResponseBody).data))throw new Error('Invalid catalog response');
 const items=(result as ResponseBody).data;
 if(!items.every(safeRecord))throw new Error('Invalid catalog records');
 return items;
}
function delay(ms:number,signal:AbortSignal):Promise<void>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
  const id=window.setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},ms);
  const abort=()=>{window.clearTimeout(id);reject(new DOMException('Aborted','AbortError'))};
  signal.addEventListener('abort',abort,{once:true});
 });
}
export default function App(){
 const [status,setStatus]=useState<Status>('idle');
 const [items,setItems]=useState<RecordItem[]>([]);
 const [category,setCategory]=useState<Category>('All');
 const [query,setQuery]=useState('');
 const [fault,setFault]=useState(false);
 const [latency,setLatency]=useState(650);
 const [duration,setDuration]=useState<number|null>(null);
 const [message,setMessage]=useState('');
 const [attempt,setAttempt]=useState(0);
 const abortRef=useRef<AbortController|null>(null);
 const numberRef=useRef(0);
 useEffect(()=>()=>abortRef.current?.abort(),[]);
 const execute=useCallback(async()=>{
  abortRef.current?.abort();
  const requestId=++numberRef.current;
  const controller=new AbortController();
  abortRef.current=controller;
  const start=performance.now();
  setStatus('loading');setMessage('');setAttempt(n=>n+1);setDuration(null);
  try{
   const data=await loadCatalog(controller.signal);
   await delay(latency,controller.signal);
   if(fault)throw new Error(es?'Fallo de prueba activado':'Simulated failure enabled');
   if(requestId!==numberRef.current)return;
   setItems(data);setStatus('success');setDuration(Math.round(performance.now()-start));
  }catch(error){
   if(controller.signal.aborted||requestId!==numberRef.current)return;
   setStatus('error');setItems([]);setDuration(Math.round(performance.now()-start));
   setMessage(error instanceof Error?error.message:'Unknown error');
  }
 },[fault,latency]);
 const cancel=()=>{numberRef.current++;abortRef.current?.abort();setStatus('idle');setDuration(null);setMessage('')};
 const reset=()=>{cancel();setItems([]);setQuery('');setCategory('All');setFault(false);setLatency(650);setAttempt(0)};
 const visible=useMemo(()=>items.filter(item=>(category==='All'||item.sector===category)&&[item.name,item.owner].join(' ').toLowerCase().includes(query.toLowerCase())),[items,category,query]);
 const avgScore=average(visible,'score');const avgProgress=average(visible,'progress');
 return <div className="studio">
 <div className="topline"><span>DF / PLAYGROUND / 006</span><span>{t.notice}</span><span>REACT · TYPESCRIPT · FETCH API</span></div>
 <header className="hero"><div className="eyebrow">{t.eyebrow}</div><h1>{t.heading}<br/><em>{t.accent}</em></h1><p>{t.desc}</p></header>
 <div className="workspace">
  <section className="control" aria-labelledby="control-title">
   <div className="section-top"><span>01 / {t.network}</span><span>CLIENT ↔ ASSET</span></div><h2 id="control-title">Request<br/><i>workbench.</i></h2>
   <div className="endpoint"><small>{t.source}</small><code>GET ./catalog.json</code><small>{t.sourceNote}</small></div>
   <label className="toggle"><input type="checkbox" checked={fault} onChange={e=>setFault(e.target.checked)}/><span>{t.mode}</span></label>
   <label className="latency">{t.latency} <strong>{latency} {t.ms}</strong><input type="range" min="0" max="2000" step="50" value={latency} onChange={e=>setLatency(Number(e.target.value))}/></label>
   <div className="buttons"><button className="go" type="button" disabled={status==='loading'} onClick={execute}>{status==='error'?t.retry:t.fetch} <span>↗</span></button><button type="button" disabled={status!=='loading'} onClick={cancel}>{t.cancel}</button><button type="button" onClick={reset}>{t.reset}</button></div>
   <div className="telemetry" role="status" aria-live="polite"><div><span>{t.status}</span><strong className={'indicator '+status}>{status.toUpperCase()}</strong></div><div><span>{t.duration}</span><strong>{duration===null?'—':duration+' ms'}</strong></div><div><span>{t.items}</span><strong>{items.length.toString().padStart(2,'0')}</strong></div></div>
   <p className="status-msg">{status==='idle'?t.ready:status==='loading'?t.loading:status==='success'?t.success:t.error}{message?' — '+message:''}</p>
   <p className="disclosure">{t.details}</p>
  </section>
  <section className="records" aria-labelledby="results-title">
   <div className="section-top"><span>02 / {t.panel}</span><span>JSON / {attempt.toString().padStart(3,'0')}</span></div>
   <div className="record-heading"><h2 id="results-title">Response<span>.</span></h2><span>{t.response} / {status.toUpperCase()}</span></div>
   <div className="metrics"><div><span>{t.views}</span><strong>{visible.length.toString().padStart(2,'0')}</strong></div><div><span>{t.score}</span><strong>{avgScore}%</strong></div><div><span>{t.progress}</span><strong>{avgProgress}%</strong></div></div>
   <div className="filters"><label>{t.filter}<select value={category} onChange={e=>setCategory(e.target.value as Category)}><option value="All">{t.all}</option><option>Product</option><option>Engineering</option><option>Creative</option></select></label><label>{t.search}<input type="search" value={query} placeholder={t.searchHint} onChange={e=>setQuery(e.target.value)}/></label></div>
   <div className="record-list" aria-live="polite" aria-busy={status==='loading'}>
   {status==='loading'?<div className="skeleton" role="status"><div/><div/><div/></div>:status==='error'?<div className="empty error-state"><strong>↗ 500 / {t.error}</strong><p>{t.simulated}</p><button type="button" onClick={execute}>{t.retry}</button></div>:visible.length===0?<div className="empty">{status==='idle'?t.tip:t.empty}</div>:visible.map((item,i)=><article className="record" key={item.id}><span className="record-icon" style={{background:item.accent}} aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div className="record-main"><div className="record-title"><strong>{item.name}</strong><span>{item.id}</span></div><p>{item.sector} / {item.owner} · {item.status}</p><div className="track" aria-label={item.progress+'%'}><div style={{width:item.progress+'%',background:colors[i%colors.length]}}/></div></div><strong className="score">{item.score}<small> / 100</small></strong></article>)}
   </div>
  </section>
 </div>
 <footer><span>DF © 2026 / REACT API STUDIO</span><span>{t.sourceNote}</span></footer>
 </div>
}
