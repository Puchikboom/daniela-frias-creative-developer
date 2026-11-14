// ThreadLab Interactive — pure original garment configuration model.
// All choices are fictional. The visualizer is 2D SVG, not 3D rendering.
export const FABRICS=Object.freeze([
 {id:'cotton',en:'Cotton twill',es:'Sarga de algodón',pattern:'plain',detail:'240 GSM',price:0},
 {id:'canvas',en:'Structured canvas',es:'Lona estructurada',pattern:'cross',detail:'320 GSM',price:18},
 {id:'linen',en:'Textured linen',es:'Lino texturizado',pattern:'lines',detail:'190 GSM',price:24},
]);
export const COLORS=Object.freeze([
 {id:'ink',en:'Deep ink',es:'Tinta profunda',hex:'#29212D'},
 {id:'berry',en:'Dusty berry',es:'Baya ahumada',hex:'#A65F7C'},
 {id:'sage',en:'Soft sage',es:'Salvia suave',hex:'#9CB7A2'},
 {id:'cream',en:'Warm cream',es:'Crema cálida',hex:'#E4D9C8'},
 {id:'cobalt',en:'Electric blue',es:'Azul eléctrico',hex:'#5879D1'}
]);
export const FITS=Object.freeze([
 {id:'regular',en:'Regular',es:'Regular',width:0},
 {id:'relaxed',en:'Relaxed',es:'Holgado',width:13},
 {id:'oversized',en:'Oversized',es:'Amplio',width:25}
]);
export const defaultConfiguration=Object.freeze({fabric:'cotton',color:'ink',fit:'regular',monogram:'DF',showGrid:true});
export function sanitizeConfiguration(input){
 const data=input&&typeof input==='object'?input:{};
 const allowed=(choices,key,fallback)=>choices.some(x=>x.id===data[key])?data[key]:fallback;
 const monogram=typeof data.monogram==='string'?data.monogram.replace(/[^\p{L}0-9]/gu,'').slice(0,3).toUpperCase():defaultConfiguration.monogram;
 return {fabric:allowed(FABRICS,'fabric','cotton'),color:allowed(COLORS,'color','ink'),fit:allowed(FITS,'fit','regular'),monogram,showGrid:typeof data.showGrid==='boolean'?data.showGrid:true};
}
export function calculatePreview(input){
 const c=sanitizeConfiguration(input);
 const fabric=FABRICS.find(x=>x.id===c.fabric);
 const color=COLORS.find(x=>x.id===c.color);
 const fit=FITS.find(x=>x.id===c.fit);
 return {...c,fabricName:fabric.en,colorName:color.en,fitName:fit.en,hex:color.hex,pattern:fabric.pattern,gsm:fabric.detail,price:79+fabric.price,oversize:fit.width};
}
export function shareConfiguration(input){
 const c=sanitizeConfiguration(input);
 const params=new URLSearchParams();
 params.set('fabric',c.fabric);params.set('color',c.color);params.set('fit',c.fit);
 params.set('mark',c.monogram);
 params.set('grid',c.showGrid?'1':'0');
 return params.toString();
}
export function parseSharedConfiguration(search){
 const q=new URLSearchParams(search.startsWith('?')?search.slice(1):search);
 return sanitizeConfiguration({fabric:q.get('fabric'),color:q.get('color'),fit:q.get('fit'),monogram:q.get('mark')??defaultConfiguration.monogram,showGrid:q.get('grid')==='0'?false:true});
}
