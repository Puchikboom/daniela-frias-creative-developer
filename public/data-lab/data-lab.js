import {records,TYPES,STATUSES,filterRecords,summarize,toCSV} from './data-model.js';
const root=document.querySelector('#data-lab');
if(root){
 const $=id=>document.getElementById(id);
 const es=root.dataset.lang==='es';
 const labels=es?{empty:'No hay resultados con estos filtros.',project:'Proyecto',client:'Cliente',status:'Estado',hours:'Horas',progress:'Avance',exported:'CSV descargado',results:'resultados',active:'activos',total:'proyectos',done:'avance medio'}:{empty:'No records match these filters.',project:'Project',client:'Client',status:'Status',hours:'Hours',progress:'Progress',exported:'CSV downloaded',results:'results',active:'active',total:'projects',done:'average progress'};
 const search=$('dl-search'),type=$('dl-type'),status=$('dl-status'),sort=$('dl-sort'),tbody=$('dl-rows'),chart=$('dl-chart');
 const pageSize=6;let page=0;
 const state=()=>({query:search.value,type:type.value,status:status.value,sort:sort.value});
 function render(){
  const rows=filterRecords(records,state()),stats=summarize(rows);
  page=Math.min(page,Math.max(0,Math.ceil(rows.length/pageSize)-1));
  $('dl-results').textContent=rows.length+' '+labels.results;
  $('dl-total').textContent=String(stats.total).padStart(2,'0');
  $('dl-hours').textContent=new Intl.NumberFormat(es?'es-ES':'en-US').format(stats.hours);
  $('dl-progress').textContent=stats.completion+'%';
  $('dl-active').textContent=String(stats.active).padStart(2,'0');
  tbody.replaceChildren();
  for(const item of rows.slice(page*pageSize,(page+1)*pageSize)){
   const tr=document.createElement('tr');
   for(const value of [item.name,item.client,item.type,item.status,item.hours+' h',item.completion+'%']){
    const td=document.createElement('td');td.textContent=value;tr.append(td);
   }
   tbody.append(tr);
  }
  $('dl-empty').hidden=rows.length!==0;
  $('dl-empty').textContent=labels.empty;
  $('dl-page').textContent=(rows.length?page+1:0)+' / '+Math.max(1,Math.ceil(rows.length/pageSize));
  $('dl-prev').disabled=page===0;
  $('dl-next').disabled=(page+1)*pageSize>=rows.length;
  // Chart is derived directly from the filtered rows. No hardcoded visual statistics.
  chart.replaceChildren();
  const max=Math.max(1,...stats.categories.map(c=>c.value));
  for(const c of stats.categories){
   const item=document.createElement('div');item.className='dl-bar';
   const name=document.createElement('span');name.textContent=c.name;
   const track=document.createElement('div');track.className='dl-bar-track';
   const fill=document.createElement('span');fill.style.width=(100*c.value/max)+'%';track.append(fill);
   const value=document.createElement('strong');value.textContent=String(c.value);
   item.append(name,track,value);chart.append(item);
  }
 }
 for(const el of [search,type,status,sort])el.addEventListener(el===search?'input':'change',()=>{page=0;render()});
 $('dl-prev').addEventListener('click',()=>{if(page>0)page--;render()});
 $('dl-next').addEventListener('click',()=>{if((page+1)*pageSize<filterRecords(records,state()).length)page++;render()});
 $('dl-reset').addEventListener('click',()=>{search.value='';type.value='All';status.value='All';sort.value='name';page=0;render()});
 $('dl-export').addEventListener('click',()=>{
  const csv=toCSV(filterRecords(records,state()));
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='df-data-lab-fictional.csv';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$('dl-feedback').textContent=labels.exported;
 });
 render();
}
