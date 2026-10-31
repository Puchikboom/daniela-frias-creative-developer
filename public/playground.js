(()=>{
'use strict';
const root=document.querySelector('.pg');if(!root)return;
const $=id=>document.getElementById(id);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=(el,type,fn,options)=>el?.addEventListener(type,fn,options);
const language=root.dataset.lang;

// 01 / kinetic type: damped springs, pointer field and keyboard-compatible controls.
{
 const stage=$('type-stage'),word=$('kinetic-word'),field=$('type-word'),speed=$('type-speed'),energy=$('type-energy');
 let chars=[],positions=[],pointer={x:-9999,y:-9999},raf=0,last=0;
 function rebuild(){const text=(field.value.trim().slice(0,10)||'MOTION').toUpperCase();word.replaceChildren();chars=[];positions=[];[...text].forEach(ch=>{const node=document.createElement('span');node.className='kinetic-char';node.textContent=ch===' '?'\u00a0':ch;word.append(node);chars.push(node);positions.push({x:0,y:0,vx:0,vy:0})});fit()}
 function fit(){const size=stage.clientWidth,actual=word.scrollWidth||size;word.style.setProperty('--word-scale',Math.min(1,(size*.91)/actual).toFixed(3))}
 function tick(ts){const dt=clamp((ts-last)/16.67||1,.4,2);last=ts;const r=stage.getBoundingClientRect(),amp=+energy.value/100*85,spring=.045+(+speed.value/100)*.14,friction=.66+(+speed.value/100)*.16;
 chars.forEach((node,i)=>{const rect=node.getBoundingClientRect(),cx=rect.left+rect.width/2-r.left,cy=rect.top+rect.height/2-r.top,dx=cx-pointer.x,dy=cy-pointer.y,dist=Math.hypot(dx,dy),influence=Math.max(0,1-dist/240);const targetX=influence?dx/(dist||1)*amp*influence:Math.sin(ts*.0008+i)*amp*.10;const targetY=influence?dy/(dist||1)*amp*influence:Math.cos(ts*.001+i)*amp*.12;let p=positions[i];p.vx=(p.vx+(targetX-p.x)*spring*dt)*friction;p.vy=(p.vy+(targetY-p.y)*spring*dt)*friction;p.x+=p.vx*dt;p.y+=p.vy*dt;node.style.transform=`translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) rotate(${(p.x*.14).toFixed(1)}deg)`});
 if(!reduced.matches)raf=requestAnimationFrame(tick);
 }
 function start(){cancelAnimationFrame(raf);chars.forEach(c=>c.style.transform='');if(!reduced.matches){last=0;raf=requestAnimationFrame(tick)}}
 on(stage,'pointermove',e=>{let b=stage.getBoundingClientRect();pointer={x:e.clientX-b.left,y:e.clientY-b.top}});on(stage,'pointerleave',()=>pointer={x:-9999,y:-9999});
 on(stage,'keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();pointer={x:stage.clientWidth/2+(e.key==='ArrowRight'?110:e.key==='ArrowLeft'?-110:0),y:stage.clientHeight/2+(e.key==='ArrowDown'?80:e.key==='ArrowUp'?-80:0)}}});
 on(field,'input',()=>{rebuild();start()});for(const [input,out] of [[speed,$('type-speed-out')],[energy,$('type-energy-out')]])on(input,'input',()=>out.textContent=input.value);
 on($('type-reset'),'click',()=>{field.value='MOTION';speed.value=45;energy.value=60;$('type-speed-out').textContent=45;$('type-energy-out').textContent=60;rebuild();start()});
 on(window,'resize',fit,{passive:true});on(reduced,'change',start);rebuild();start();
}

// 02 / generative force field: resolution-aware canvas and bounded particle population.
{
 const canvas=$('flow-canvas'),ctx=canvas.getContext('2d',{alpha:false});const density=$('density'),turb=$('turb'),mode=$('field-mode'),btn=$('field-toggle');
 let W=1,H=1,dpr=1,particles=[],active=!reduced.matches,raf=0,last=0;const pointer={x:-10000,y:-10000};
 function seed(n){particles=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,life:Math.random()*240,vel:1+Math.random()*1.5}))}
 function resize(){let r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#090b11';ctx.fillRect(0,0,W,H);seed(+density.value);if(!active)renderStill()}
 function renderStill(){ctx.fillStyle='#090b11';ctx.fillRect(0,0,W,H);ctx.fillStyle='#d8f279';for(const p of particles){ctx.beginPath();ctx.arc(p.x,p.y,1.4,0,Math.PI*2);ctx.fill()}}
 function frame(ts){if(!active)return;let delta=Math.min(33,ts-(last||ts));last=ts;
 ctx.fillStyle='rgba(9,11,17,.12)';ctx.fillRect(0,0,W,H);const turbulence=+turb.value/100,orbit=mode.value==='orbit',t=ts*.00025;
 for(const p of particles){let oldx=p.x,oldy=p.y,dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy),angle=orbit?Math.atan2(p.y-H/2,p.x-W/2)+Math.PI/2:Math.sin(p.y*.007+t*3)*2+Math.cos(p.x*.006-t*2)*1.5;
 angle+=Math.sin(p.x*.015+p.y*.012+t*3)*turbulence*2;
 let speed=(.45+turbulence*1.8)*p.vel*delta/16;
 let ax=0,ay=0;if(dist<150&&dist>1){ax=dx/dist*(150-dist)/150*2;ay=dy/dist*(150-dist)/150*2}
 p.x+=(Math.cos(angle)+ax)*speed;p.y+=(Math.sin(angle)+ay)*speed;
 p.life+=delta/16;if(p.x<-10||p.x>W+10||p.y<-10||p.y>H+10||p.life>330){p.x=Math.random()*W;p.y=Math.random()*H;p.life=0;continue}
 ctx.strokeStyle=(Math.floor(p.life)%3===0)?'rgba(225,175,225,.52)':'rgba(213,241,120,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(oldx,oldy);ctx.lineTo(p.x,p.y);ctx.stroke()
 }
 raf=requestAnimationFrame(frame)
 }
 const start=()=>{cancelAnimationFrame(raf);last=0;active=true;btn.textContent=btn.dataset.pause+' Ⅱ';raf=requestAnimationFrame(frame)};
 const stop=()=>{active=false;cancelAnimationFrame(raf);btn.textContent='▶ '+btn.dataset.resume;renderStill()};
 on(btn,'click',()=>active?stop():start());on(canvas,'pointermove',e=>{let b=canvas.getBoundingClientRect();pointer.x=e.clientX-b.left;pointer.y=e.clientY-b.top});on(canvas,'pointerleave',()=>{pointer.x=-10000;pointer.y=-10000});
 on(density,'input',()=>{$('density-out').textContent=density.value;seed(+density.value)});on(turb,'input',()=>{$('turb-out').textContent=turb.value});on(mode,'change',()=>{$('field-mode-label').textContent=mode.value.toUpperCase()});
 let ro=new ResizeObserver(resize);ro.observe(canvas);on(reduced,'change',()=>reduced.matches?stop():start());if(active)start();else stop();
 on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf)}else if(active){last=0;raf=requestAnimationFrame(frame)}});
}

// 03 / vector poster tool: constructed SVG, no third-party image services.
{
 const art=$('poster-art'),text=$('poster-text'),palette=$('poster-palette'),layout=$('poster-layout');let variation=12;
 const themes={acid:['#d8f279','#201a25','#ac668e'],berry:['#eddfd7','#972f61','#e3a7be'],mono:['#f7f5ef','#171717','#777777'],plum:['#342139','#ecb3e9','#d8f279']};
 const escapeXml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
 function random(seed){let t=seed+0x6D2B79F5;return()=>{t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
 function draw(){const colors=themes[palette.value]||themes.acid,[bg,ink,accent]=colors,rand=random(variation),phrase=(text.value||'MAKE IT MOVE').toUpperCase().slice(0,28),words=phrase.trim().split(/\s+/),lines=[];let line='';for(const w of words){if((line+' '+w).length>11&&line){lines.push(line);line=w}else line+=(line?' ':'')+w}if(line)lines.push(line);const size=Math.min(124,Math.floor(490/Math.max(...lines.map(l=>l.length),5)*1.65));
 let shapes='';for(let i=0;i<10;i++){let x=Math.round(rand()*670-30),y=Math.round(rand()*820-30),r=35+rand()*100,rot=Math.round(rand()*180);if(layout.value==='orbit'){let ang=i/10*Math.PI*2;x=300+Math.cos(ang)*200;y=380+Math.sin(ang)*240}let shape=i%3===0?`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="none" stroke="${accent}" stroke-width="${(4+rand()*11).toFixed(1)}"/>`:`<rect x="${x}" y="${y}" width="${(r*.7).toFixed(1)}" height="${(r*1.4).toFixed(1)}" rx="${i%2?0:28}" transform="rotate(${rot} ${x} ${y})" fill="${accent}" opacity="${(.35+rand()*.65).toFixed(2)}"/>`;shapes+=shape}
 let main=lines.map((l,i)=>`<text x="${layout.value==='stack'?40:300}" y="${300+i*size*.95}" text-anchor="${layout.value==='stack'?'start':'middle'}" font-size="${size}" font-family="Arial, Helvetica, sans-serif" font-weight="900" letter-spacing="-5" fill="${ink}" ${layout.value==='diagonal'?`transform="rotate(-8 300 370)"`:''}>${escapeXml(l)}</text>`).join('');
 art.innerHTML=`<rect width="600" height="750" fill="${bg}"/>${shapes}<path d="M 35 55 H 565 M35 690 H565" fill="none" stroke="${ink}" stroke-width="2"/><text x="38" y="43" font-size="14" font-family="monospace" fill="${ink}">DF / GENERATIVE PRINT STUDIO</text>${main}<text x="38" y="721" font-size="14" font-family="monospace" fill="${ink}">ISSUE 00${variation%10}  /  BUILT WITH CODE</text><text x="565" y="721" text-anchor="end" font-size="14" font-family="monospace" fill="${ink}">© 2026</text>`;
 }
 on(text,'input',draw);on(palette,'change',draw);on(layout,'change',draw);on($('poster-random'),'click',()=>{variation++;draw()});on($('poster-export'),'click',()=>{const data=new XMLSerializer().serializeToString(art);const svg=`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">${art.innerHTML}</svg>`;const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='df-poster-'+variation+'.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)});draw();
}

// 04 / timeline: each glyph owns a WAAPI animation; scrub is time-based.
{
 const chars=Array.from(document.querySelectorAll('.pg-motion-object')),duration=$('motion-duration'),stagger=$('motion-stagger'),scrub=$('motion-scrub'),play=$('motion-play');let anim=[],tickRaf=0;
 function total(){return +duration.value+(chars.length-1)*+stagger.value}
 function generate(){anim.forEach(a=>a.cancel());anim=chars.map((c,i)=>{const a=c.animate([{opacity:0,transform:'translateY(120px) rotate(-18deg) scale(.7)',filter:'blur(8px)'},{opacity:1,transform:'translateY(-13px) rotate(4deg) scale(1.06)',filter:'blur(0px)',offset:.74},{opacity:1,transform:'translateY(0) rotate(0) scale(1)',filter:'blur(0px)'}],{duration:+duration.value,delay:i*(+stagger.value),easing:'cubic-bezier(.2,.9,.25,1)',fill:'both'});a.pause();return a});seek(+scrub.value)}
 function seek(percent){const t=total()*percent/100;anim.forEach(a=>a.currentTime=Math.max(0,Math.min(total(),t)));$('timeline-out').textContent=Math.round(percent)+'%'}
 function update(){cancelAnimationFrame(tickRaf);generate()}
 on(duration,'input',()=>{$('duration-out').textContent=duration.value+'ms';update()});on(stagger,'input',()=>{$('stagger-out').textContent=stagger.value+'ms';update()});
 on(scrub,'input',()=>{cancelAnimationFrame(tickRaf);anim.forEach(a=>a.pause());seek(+scrub.value)});
 on(play,'click',()=>{cancelAnimationFrame(tickRaf);if(reduced.matches){scrub.value=100;seek(100);return}scrub.value=0;seek(0);anim.forEach(a=>a.play());const start=performance.now();function tick(ts){let p=clamp((ts-start)/total()*100,0,100);scrub.value=String(p);$('timeline-out').textContent=Math.round(p)+'%';if(p<100)tickRaf=requestAnimationFrame(tick)}tickRaf=requestAnimationFrame(tick)});
 on($('motion-stop'),'click',()=>{cancelAnimationFrame(tickRaf);anim.forEach(a=>a.pause());scrub.value=0;seek(0)});
 on(reduced,'change',()=>{if(reduced.matches){cancelAnimationFrame(tickRaf);anim.forEach(a=>a.pause());scrub.value=100;seek(100)}});generate();if(reduced.matches){scrub.value=100;seek(100)}
}
})();
