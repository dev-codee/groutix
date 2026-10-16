import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';
import * as planner from './lib/lead-merge-plan.mjs';
const primaryId = '111111111111111111111111', duplicateId = '222222222222222222222222';
const clone = value => EJSON.parse(EJSON.stringify(value));
const same = (a,b) => String(a) === String(b);
function matches(doc, query) { return Object.entries(query).every(([k,v]) => k === '$or' ? v.some(q => matches(doc,q)) : v?.$in ? v.$in.some(x => same(doc[k],x)) : same(doc[k],v)); }
function fixture() {
  const shared = { name:'Customer',email:'c@example.com',phone:'123',address:'1 Street',service:'Regrouting',status:'Job Booked',type:'lead' };
  return {
    submissions: [{...shared,_id:new ObjectId(primaryId),jobNo:'Job-1',quoteAmount:1200,activity:[{action:'Quote signed'}]},
      {...shared,_id:new ObjectId(duplicateId),jobNo:'Job-2',source:'Dispatch board',jobAt:'2026-10-19T08:00',activity:[{action:'Job booked'}]}],
    bookings:[{_id:new ObjectId('333333333333333333333333'),leadId:primaryId,type:'job',date:'2026-10-18',time:'15:00',reference:'Job-1'},
      {_id:new ObjectId('444444444444444444444444'),leadId:duplicateId,type:'job',date:'2026-10-19',time:'08:00',reference:'Job-2'}],
    customer_quotes:[{_id:`${duplicateId}~original`,leadId:duplicateId,state:'draft',values:{quoteItems:[]}}],lead_merge_backups:[],
  };
}
const source = ts.transpileModule(readFileSync('scripts/repair-dispatch-duplicate.mjs','utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true} }).outputText;
async function run(state, action, { failDelete=false, fingerprint }={}) {
  const messages=[];
  const db = {listCollections:()=>({toArray:async()=>Object.keys(state).map(name=>({name}))}),collection:name=>({
    findOne:async q=>clone(state[name].find(d=>matches(d,q))||null),
    find:q=>({sort(){return this;},toArray:async()=>clone(state[name].filter(d=>matches(d,q)))}),
    insertOne:async d=>{state[name].push(clone(d));return {};},
    insertMany:async docs=>{state[name].push(...clone(docs));},
    updateOne:async(q,u)=>{const d=state[name].find(d=>matches(d,q));if(!d)return{matchedCount:0};if(u.$set)Object.assign(d,clone(u.$set));if(u.$push)for(const[k,v]of Object.entries(u.$push))d[k]=[...(d[k]||[]),...clone(v.$each)];if(u.$addToSet)for(const[k,v]of Object.entries(u.$addToSet))d[k]=[...new Set([...(d[k]||[]),v])];return{matchedCount:1};},
    updateMany:async(q,u)=>{for(const d of state[name].filter(d=>matches(d,q)))Object.assign(d,clone(u.$set));},
    deleteMany:async q=>{state[name]=state[name].filter(d=>!matches(d,q));},
    deleteOne:async q=>{if(failDelete)throw new Error('Injected write failure');const n=state[name].length;state[name]=state[name].filter(d=>!matches(d,q));return{deletedCount:n-state[name].length};},
    replaceOne:async(q,d)=>{const i=state[name].findIndex(d=>matches(d,q));if(i>=0)state[name][i]=clone(d);},
  })};
  class MongoClient {async connect(){} db(){return db;} async close(){} startSession(){return{async withTransaction(fn){const before=clone(state);try{await fn();}catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);throw e;}},async endSession(){}};} }
  const process={cwd:()=>'.',argv:['node','script',primaryId,duplicateId,action,...(fingerprint?[fingerprint]:[])],env:{MONGODB_URI:'fake'},exitCode:0};
  await vm.runInNewContext(`(async()=>{${source}\n})()`, {exports:{},process,console:{log:s=>messages.push(s),error:s=>messages.push(s)},require:name=>name==='mongodb'?{MongoClient,ObjectId}:name==='@next/env'?{loadEnvConfig(){}}:planner,Date});
  return {exitCode:process.exitCode,messages};
}
function reviewed(state){return planner.buildMergePlan(state.submissions[0],state.submissions[1],state.bookings,state.customer_quotes).fingerprint;}
test('transaction preserves customer data, archives originals, verifies and can restore exactly',async()=>{
  const state=fixture(), before=clone(state);
  assert.equal((await run(state,'apply',{fingerprint:reviewed(state)})).exitCode,0);
  assert.equal(state.submissions.length,1);
  assert.equal(state.submissions[0].quoteAmount,1200);
  assert.equal(state.submissions[0].activity.length,3);
  assert.equal(state.bookings.every(b=>b.leadId===primaryId),true);
  assert.equal(state.lead_merge_backups.length,1);
  assert.equal((await run(state,'verify')).exitCode,0);
  assert.equal((await run(state,'rollback')).exitCode,0);
  for(const name of ['submissions','bookings','customer_quotes'])assert.deepEqual(state[name],before[name]);
});
test('a failed write rolls back the entire repair',async()=>{
  const state=fixture(), before=clone(state);
  assert.equal((await run(state,'apply',{fingerprint:reviewed(state),failDelete:true})).exitCode,1);
  assert.deepEqual(state,before);
});
test('stale reviews and rollback after subsequent customer edits fail closed',async()=>{
  const state=fixture();
  assert.equal((await run(state,'apply',{fingerprint:'stale'})).exitCode,1);
  assert.equal(state.submissions.length,2);
  assert.equal((await run(state,'apply',{fingerprint:reviewed(state)})).exitCode,0);
  state.submissions[0].notes='New staff note';
  assert.equal((await run(state,'rollback')).exitCode,1);
  assert.equal(state.submissions[0].notes,'New staff note');
  assert.equal(state.submissions.length,1);
});
