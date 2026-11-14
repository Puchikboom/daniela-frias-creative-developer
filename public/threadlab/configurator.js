import {COLORS,FABRICS,FITS,defaultConfiguration,sanitizeConfiguration,calculatePreview,parseSharedConfiguration,shareConfiguration} from './model.js';

const root=document.querySelector('.tl');
if(root){
 const es=root.dataset.lang==='es';
 const $=id=>document.getElementById(id);
 const configKey='threadlab-independent-config-v1';
 const controls={fabric:[...document.querySelectorAll('input[name="fabric"]')],color:[...document.querySelectorAll('input[name="color"]')],fit:[...document.querySelectorAll('input[name="fit"]')],monogram:$('tl-monogram'),grid:$('tl-grid')};
 const present=(arr,id)=>arr.find(x=>x.id===id)?.[es?'es':'en']||id;
 let current={...defaultConfiguration};
 try {
  const stored=localStorage.getItem(configKey);
  if(stored)current=sanitizeConfiguration(JSON.parse(stored));
 } catch {/* Private browsing may disable storage. */}
 if(location.search)current=parseSharedConfiguration(location.search);
 const pathFor=(width)=> {
  const l=200-width,r=400+width,shoulderL=215-width*.5,shoulderR=385+width*.5;
  const sleeveL=96-width*.65,sleeveR=504+width*.65;
  return `M${shoulderL} 115L252 97Q300 132 348 97L${shoulderR} 115L${455+width*.6} 161L${sleeveR} 268L${425+width*.5} 298L${r} 254L${r} 542L${l} 542L${l} 254L${175-width*.5} 298L${sleeveL} 268L${145-width*.6} 161Z`;
 };
 function draw(){
  const p=calculatePreview(current);
  const path=pathFor(p.oversize);
  $('tl-body').setAttribute('d',path);
  $('tl-body').setAttribute('fill',p.hex);
  $('tl-texture').setAttribute('d',path);
  $('tl-texture').setAttribute('fill',`url(#tl-${p.pattern==='cross'?'cross':p.pattern==='lines'?'lines':'grain'})`);
  $('tl-shirt-mark').textContent=p.monogram;
  $('tl-shirt-mark').setAttribute('fill',p.color==='cream'?'#211c25':'#f7f0e8');
  $('tl-seams').setAttribute('d',`M${200-p.oversize} 250V542M${400+p.oversize} 250V542M${215-p.oversize*.5} 115L${200-p.oversize} 250M${385+p.oversize*.5} 115L${400+p.oversize} 250M${200-p.oversize} 527H${400+p.oversize}`);
  $('tl-tech-grid').style.display=p.showGrid?'':'none';
  $('tl-material').textContent=`${present(FABRICS,p.fabric)} · ${p.gsm}`;
  $('tl-price').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(p.price);
  $('tl-garment').setAttribute('aria-label',(es?'Prenda personalizada: ':'Customized garment: ')+[present(COLORS,p.color),present(FABRICS,p.fabric),present(FITS,p.fit)].join(', '));
 }
 function showControls(){
  for(const name of ['fabric','color','fit'])for(const el of controls[name])el.checked=el.value===current[name];
  controls.monogram.value=current.monogram;
  controls.grid.checked=current.showGrid;
 }
 function persist(){
  try{localStorage.setItem(configKey,JSON.stringify(current))}catch{}
 }
 function update(){
  current=sanitizeConfiguration({
   fabric:controls.fabric.find(x=>x.checked)?.value,
   color:controls.color.find(x=>x.checked)?.value,
   fit:controls.fit.find(x=>x.checked)?.value,
   monogram:controls.monogram.value,
   showGrid:controls.grid.checked
  });
  showControls();
  draw();
  persist();
 }
 for(const group of [controls.fabric,controls.color,controls.fit])for(const el of group)el.addEventListener('change',update);
 controls.monogram.addEventListener('input',update);
 controls.grid.addEventListener('change',update);
 $('tl-reset').addEventListener('click',()=>{
  current={...defaultConfiguration};showControls();update();
  $('tl-feedback').textContent=es?'Diseño restablecido':'Design reset';
 });
 $('tl-share').addEventListener('click',async()=>{
  const link=new URL(window.location.href);
  link.search=shareConfiguration(current);
  let copied=false;
  try{await navigator.clipboard.writeText(link.href);copied=true}catch{
   try{history.replaceState(null,'',link.href)}catch{}
  }
  $('tl-feedback').textContent=copied?(es?'Enlace copiado':'Link copied'):(es?'La configuración aparece ahora en la dirección del navegador':'The configuration is now in your browser address bar');
 });
 $('tl-export').addEventListener('click',()=>{
  const original=$('tl-garment');
  const copy=original.cloneNode(true);
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
  copy.setAttribute('width','900');copy.setAttribute('height','960');
  // Original vector content only; do not attach remote assets or scripts.
  const serialized=new XMLSerializer().serializeToString(copy);
  const blob=new Blob([serialized],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download='threadlab-design.svg';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('tl-feedback').textContent=es?'SVG exportado':'SVG exported';
 });
 showControls();draw();
}
