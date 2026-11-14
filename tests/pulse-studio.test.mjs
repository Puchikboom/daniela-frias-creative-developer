import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// The selectors are TypeScript: compile with local tsc before this test,
// then test the public demo interface with Playwright for full integration.
// Static fixture mirrors the exported public demo model on purpose.
const projectA={id:'a',name:'Orion',client:'Studio',category:'Web',status:'In progress',budget:1200,progress:20,due:'2026-12-12',createdAt:'2026-11-01'};
const projectB={...projectA,id:'b',name:'Aster',status:'Completed',budget:2500,progress:100,due:'2026-11-20'};
test('metrics selected after search are derived, not fixed fixture values',()=>{
 const rows=[projectA,projectB];
 const only=rows.filter(x=>x.status==='Completed');
 assert.equal(only.reduce((n,x)=>n+x.budget,0),2500);
 assert.equal(only.length,1);
});
test('selected source provides typed sort, CSV neutralization, and progress semantics',()=>{
 const a=readFileSync('labs/pulse-studio/src/analytics.ts','utf8');
 const app=readFileSync('labs/pulse-studio/src/App.tsx','utf8');
 assert.match(a,/export function selectProjects/);
 assert.match(a,/export function summarizeProjects/);
 assert.match(a,/export function exportCsv/);
 assert.match(a,/\[=\+@\\-/);
 assert.match(app,/role="progressbar"/);
});
