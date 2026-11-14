import test from 'node:test';
import assert from 'node:assert/strict';
import {records,filterRecords,summarize,toCSV} from '../public/data-lab/data-model.js';
test('search, status and category filters compose without mutating source',()=>{
 const copy=records.slice();
 const filtered=filterRecords(records,{query:'northstar',status:'Active',type:'Product'});
 assert.equal(filtered.length,2);
 assert.deepEqual(records,copy);
});
test('sorting is deterministic and descending numerical sort works',()=>{
 const rows=filterRecords(records,{sort:'hours'});
 assert.ok(rows[0].hours>=rows[1].hours);
 assert.equal(rows.length,12);
});
test('summary comes from filtered rows, with empty-safe average',()=>{
 const completed=filterRecords(records,{status:'Done'});
 const summary=summarize(completed);
 assert.equal(summary.total,4);
 assert.equal(summary.completion,100);
 assert.equal(summary.active,0);
 assert.deepEqual(summarize([]).categories.map(x=>x.value),[0,0,0,0]);
});
test('CSV escapes content safely including spreadsheet formulas',()=>{
 const csv=toCSV([{id:'1',name:'=1+2',client:'Acme "Inc"',type:'Brand',status:'Done',hours:2,completion:100}]);
 assert.ok(csv.includes('"\'=1+2"'));
 assert.ok(csv.includes('"Acme ""Inc"""'));
});
