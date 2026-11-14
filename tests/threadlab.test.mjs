import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePreview,defaultConfiguration,sanitizeConfiguration,parseSharedConfiguration,shareConfiguration,FABRICS,COLORS,FITS} from '../public/threadlab/model.js';

test('each combination yields valid and predictable values',()=>{
 for(const fabric of FABRICS)for(const color of COLORS)for(const fit of FITS){
  const p=calculatePreview({fabric:fabric.id,color:color.id,fit:fit.id,monogram:'DF',showGrid:true});
  assert.equal(p.hex,color.hex);
  assert.equal(p.price,79+fabric.price);
  assert.equal(p.oversize,fit.width);
 }
});
test('rejects unexpected values, caps monograms and falls back safely',()=>{
 const x=sanitizeConfiguration({fabric:'evil',color:'invalid',fit:'none',monogram:'<script>hello',showGrid:'no'});
 assert.equal(x.fabric,'cotton');assert.equal(x.color,'ink');assert.equal(x.fit,'regular');
 assert.equal(x.monogram,'SCR');assert.equal(x.showGrid,true);
 assert.deepEqual(sanitizeConfiguration({}),defaultConfiguration);
});
test('share URL round trips to sanitized configuration',()=>{
 const c={fabric:'linen',color:'sage',fit:'oversized',monogram:'AB',showGrid:false};
 assert.deepEqual(parseSharedConfiguration('?'+shareConfiguration(c)),c);
});
test('empty monograms remain empty and URL is escaped',()=>{
 const c=sanitizeConfiguration({monogram:''});
 assert.equal(c.monogram,'');
 assert.equal(parseSharedConfiguration('?'+shareConfiguration(c)).monogram,'DF');
});
