import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';
import { randomUUID } from 'node:crypto';

function fixture() {
  const lead={id:'507f1f77bcf86cd799439011',status:'Inspection En Route',name:'Jane',phone:'0412345678',email:'jane@example.test',address:'10 Main Street, Richmond VIC 3121'};
  const sent={sms:[],email:[],messages:[],activities:[]};
  const store=new Map();
  let sms={ok:true,body:'Actual formatted SMS'};let emailError;
  let release;
  let emailGate=Promise.resolve();
  const {POST}=loadTs('app/api/admin/on-the-way/route.ts',{
    'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status||200})}},
    '@/lib/adminAuth':{verifyRequestSession:async()=>({username:'inspector'})},
    '@/lib/submissions':{getSubmission:async()=>lead,appendActivity:async(_,activity)=>sent.activities.push(activity)},
    '@/lib/customerTrackingServer':{startCustomerTracking:async()=> 'https://groutix.com/track/test',stopCustomerTracking:async()=>{}},
    '@/lib/visitEta':{calculateVisitEta:async()=>({text:'15–25 mins',minutes:25,source:'distance_estimate',reason:'Distance estimate; no live traffic.',nextStep:''})},
    '@/lib/sms':{sendSms:async args=>{sent.sms.push(args);return sms;}},
    '@/lib/email':{isEmailConfigured:()=>true,getEmailLogoUrl:async()=>'',wrapEmailHtml:html=>html,sendEmail:async args=>{sent.email.push(args);await emailGate;if(emailError) throw emailError;}},
    '@/lib/mongodb':{getDb:async()=>({collection:()=>({updateOne:async(_,update)=>{sent.messages.push(...update.$addToSet.messages.$each);return {matchedCount:1};}})})},
    '@/lib/notificationAttempts':{
      claimNotificationAttempt:async(id,identity)=>{
        if(!store.has(id)) store.set(id,{identity,processing:false});
        const entry=store.get(id);if(entry.identity!==identity) throw Error('scope mismatch');
        if(entry.processing) return {claimed:false,attempt:structuredClone(entry)};
        entry.processing=true;return {claimed:true,attempt:structuredClone(entry)};
      },
      saveNotificationAttempt:async(id,report,processing)=>store.set(id,{...store.get(id),report:structuredClone(report),processing}),
    },
  });
  const requestId=randomUUID();
  return {lead,sent,store,requestId,setSms:value=>{sms=value;},setEmailError:value=>{emailError=value;},
    holdEmail:()=>{emailGate=new Promise(resolve=>{release=resolve;});},releaseEmail:()=>release(),
    post:(extra={})=>POST({json:async()=>({leadId:lead.id,eventType:'en_route',lat:null,lng:null,requestId,...extra})})};
}
test('HTTP success from a provider call is not enough: failed SMS never appears as sent',async()=>{
  const f=fixture();f.setSms({ok:false,error:'INSUFFICIENT_CREDIT'});
  const result=await f.post();
  assert.equal(result.body.report.channels.sms.status,'failed');assert.match(result.body.report.channels.sms.nextStep,/Top up/);
  assert.equal(result.body.report.channels.email.status,'accepted');
  assert.equal(f.sent.messages.length,1);assert.equal(f.sent.messages[0].channel,'email');
});
test('retry sends only the failed channel and repeated successful requests send nothing',async()=>{
  const f=fixture();f.setSms({ok:false,error:'INVALID_RECIPIENT'});
  await f.post(); f.setSms({ok:true,body:'SMS accepted'});
  const retried=await f.post();
  assert.equal(retried.body.report.channels.sms.status,'accepted');assert.equal(f.sent.sms.length,2);assert.equal(f.sent.email.length,1);
  await f.post();assert.equal(f.sent.sms.length,2);assert.equal(f.sent.email.length,1);
  assert.equal(f.sent.messages.length,2);
});
test('missing contacts and configuration return actionable failures without fictitious conversation entries',async()=>{
  const f=fixture();delete f.lead.phone;delete f.lead.email;
  const result=await f.post();assert.equal(result.body.ok,false);
  assert.match(result.body.report.channels.sms.nextStep,/Add/);assert.equal(f.sent.messages.length,0);
  f.lead.phone='0412345678';f.setSms({ok:false,skipped:true});
  const retry=await f.post();assert.match(retry.body.report.channels.sms.reason,/not configured/);
});
test('SMTP authentication failures explain the fix and accepted SMS is not resent',async()=>{
  const f=fixture();f.setEmailError({code:'EAUTH',responseCode:535});
  const result=await f.post();assert.match(result.body.report.channels.email.nextStep,/credentials/);
  assert.equal(f.sent.email[0].attempts,1);assert.equal(f.sent.email[0].requireAcceptance,true);
  f.setEmailError(undefined);await f.post();assert.equal(f.sent.sms.length,1);assert.equal(f.sent.email.length,2);
});
test('ambiguous transport failures are never automatically resent',async()=>{
  const f=fixture();f.setSms({ok:false,error:'send_failed',uncertain:true});f.setEmailError({code:'ETIMEDOUT'});
  const result=await f.post();
  assert.equal(result.body.report.channels.sms.status,'unknown');assert.equal(result.body.report.channels.email.status,'unknown');
  await f.post();assert.equal(f.sent.sms.length,1);assert.equal(f.sent.email.length,1);assert.equal(f.sent.messages.length,0);
});
test('concurrent and lost-response retries cannot duplicate the original notification',async()=>{
  const f=fixture();f.holdEmail();const pending=f.post();await new Promise(setImmediate);
  const second=await f.post();assert.equal(second.status,202);assert.equal(second.body.processing,true);
  f.releaseEmail();await pending;await f.post();assert.equal(f.sent.sms.length,1);assert.equal(f.sent.email.length,1);
});
test('checking ETA does not send messages again and uses no Google API',async()=>{
  const f=fixture();await f.post();const result=await f.post({etaOnly:true});
  assert.equal(result.body.report.eta.source,'distance_estimate');assert.equal(f.sent.sms.length,1);assert.equal(f.sent.email.length,1);
  assert.match(f.sent.sms[0].body,/no live traffic/);
});

function etaFixture(destination,fetch=()=>{throw Error('No routing server configured; no fetch expected');}) {
  return loadTs('lib/visitEta.ts',{'./mapGeocode':{geocodeMapAddress:async()=>destination}},{fetch,URL});
}
test('ETA works with OpenStreetMap and GPS with no API keys or Google requests',async()=>{
  const old=process.env.ROUTING_OSRM_URL;delete process.env.ROUTING_OSRM_URL;
  try {const eta=etaFixture({lat:-37.82,lng:145,approximate:false});const result=await eta.calculateVisitEta(-37.8,144.95,'Full address');
    assert.equal(result.source,'distance_estimate');assert.match(result.text,/mins/);assert.match(result.reason,/live traffic/);
  } finally {if(old!==undefined)process.env.ROUTING_OSRM_URL=old;}
});
test('GPS permission errors, missing addresses and lookup failures give specific fixes',async()=>{
  const eta=etaFixture(null);
  assert.match((await eta.calculateVisitEta(null,null,'address','denied')).reason,/denied/);
  assert.match((await eta.calculateVisitEta(null,null,'address','timeout')).reason,/timed out/);
  assert.match((await eta.calculateVisitEta(-37.8,145,'')).nextStep,/full customer street address/);
  const failure=await eta.calculateVisitEta(-37.8,145,'Unknown address');assert.equal(failure.text,null);assert.match(failure.reason,/OpenStreetMap/);
});
test('optional OSRM routes are road estimates without live traffic; failure falls back clearly',async()=>{
  const old=process.env.ROUTING_OSRM_URL;process.env.ROUTING_OSRM_URL='https://routing.example.test';
  try {
    const routes=etaFixture({lat:-37.82,lng:145,approximate:false},async url=>{assert.match(String(url),/^https:\/\/routing.example.test\/route\/v1\/driving\//);return {ok:true,json:async()=>({code:'Ok',routes:[{duration:900}]})};});
    assert.equal((await routes.calculateVisitEta(-37.8,144.95,'address')).source,'osrm');
    const fallback=etaFixture({lat:-37.82,lng:145},async()=>{throw Error('offline');});
    const result=await fallback.calculateVisitEta(-37.8,144.95,'address');assert.equal(result.source,'distance_estimate');assert.match(result.reason,/routing is unavailable/);
  } finally {if(old===undefined)delete process.env.ROUTING_OSRM_URL;else process.env.ROUTING_OSRM_URL=old;}
});
test('a persistent attempt lock is acquired atomically before any provider request',async()=>{
  let record;let locked=false;
  const {claimNotificationAttempt,saveNotificationAttempt}=loadTs('lib/notificationAttempts.ts',{'./mongodb':{getDb:async()=>({collection:()=>({
    insertOne:async value=>{if(record)throw {code:11000};record=value;},findOne:async()=>record,
    findOneAndUpdate:async()=>{if(locked)return null;locked=true;return {...record,processing:true};},
    updateOne:async(_,update)=>{record={...record,...update.$set};locked=record.processing;return {matchedCount:1};},
  })})}});
  assert.equal((await claimNotificationAttempt('id','scope')).claimed,true);
  assert.equal((await claimNotificationAttempt('id','scope')).claimed,false);
  await saveNotificationAttempt('id',{channels:{}},false);
  assert.equal((await claimNotificationAttempt('id','scope')).claimed,true);
  await assert.rejects(claimNotificationAttempt('id','different scope'));
});

test('the browser waits for confirmation without GPS and keeps network failure details available for retry',async()=>{
  const cells=[];let cursor=0;const busy=[],results=[],requests=[];
  const useState=initial=>{const index=cursor++;if(!(index in cells))cells[index]=initial;return [cells[index],value=>{cells[index]=typeof value==='function'?value(cells[index]):value;}];};
  const hooks={useState,useRef:initial=>useState({current:initial})[0],useCallback:fn=>fn,useEffect:()=>{}};
  const {VisitNotificationDialog}=loadTs('components/admin/VisitNotificationDialog.tsx',{react:hooks},{navigator:{},fetch:async(url,options)=>{requests.push(JSON.parse(options.body));throw new TypeError('network failure');}});
  const render=()=>{cursor=0;return VisitNotificationDialog({lead:{id:'customer',name:'Jane'},eventType:'en_route',requestId:'test-attempt-123456',onResult:value=>results.push(value),onBusy:value=>busy.push(value),onClose:()=>{}});};
  const nodes=root=>{if(Array.isArray(root))return root.flatMap(nodes);if(!root||typeof root!=='object')return [];return [root,...nodes(root.props?.children)];};
  const text=root=>Array.isArray(root)?root.map(text).join(' '):root&&typeof root==='object'?text(root.props?.children):typeof root==='string'?root:'';
  const button=nodes(render()).find(node=>node.type==='button'&&text(node.props.children)==='Retry failed channels');
  button.props.onClick();await new Promise(setImmediate);
  assert.equal(requests[0].locationIssue,'unsupported');assert.equal(requests[0].lat,null);assert.equal(results.length,0);
  assert.equal(busy.join(','),'true,false');assert.match(text(render()),/Check your internet connection/);
  assert.ok(nodes(render()).some(node=>node.props?.role==='alert'));
});
