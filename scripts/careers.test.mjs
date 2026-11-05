import test from 'node:test';
import assert from 'node:assert/strict';
import { Binary } from 'mongodb';
import { loadTs } from './test-ts-loader.mjs';

const { validateCareerInput, ROLE_SKILLS } = loadTs('lib/careers.ts', {}, { URL });
const valid = {
  role: 'inspector', fullName: ' Test Applicant ', email: 'TEST@example.com', phone: '0412 345 678', suburb: 'Richmond', postcode: '3121',
  experience: '3–5 years', workRights: 'Unrestricted Australian work rights', engagement: 'Employee', startAvailability: 'Within 2 weeks',
  licence: 'Yes', vehicle: 'Own reliable vehicle', whiteCard: 'Current White Card', coverage: 'Melbourne', skills: [ROLE_SKILLS.inspector[0]], days: ['Monday'],
  summary: 'I assess wet areas, document issues and prepare repair quotes.', consent: true,
};
test('application validation normalises data and accepts both roles and new entrants', () => {
  const data = validateCareerInput(valid);
  assert.equal(data.fullName, 'Test Applicant'); assert.equal(data.email, 'test@example.com');
  assert.equal(validateCareerInput({ ...valid, role: 'technician', skills: [], experience: 'New to the industry' }).role, 'technician');
});
test('application rejects invalid choices, missing consent and unsafe portfolio URLs', () => {
  for (const patch of [{role: 'manager'}, {skills: ROLE_SKILLS.technician}, {days: []}, {consent: false}, {postcode: 'abc'}, {email: 'no'}, {phone:'bad'}, {summary:'short'}, {portfolio:'javascript:alert(1)'}, {experience:'expert'}, {qualifications:'x'.repeat(2001)}]) assert.throws(() => validateCareerInput({...valid,...patch}));
});
const response = { json: (body, init) => Response.json(body, init) };
const globals = { Request, Response, File, FormData, URL, URLSearchParams, Uint8Array };
function publicRoute(db) {
  return loadTs('app/api/careers/route.ts', { 'next/server': {NextResponse: response}, '@/lib/rateLimit': {rateLimit:()=>true}, '@/lib/mongodb': {getDb: async()=>db} }, globals);
}
function request(data = valid, resume) {
  const form = new FormData(); form.set('application', JSON.stringify(data)); if(resume) form.set('resume', resume);
  return new Request('http://localhost/api/careers', {method:'POST',body:form});
}
test('submission is persisted before success, including private PDF bytes', async () => {
  const old = process.env.TURNSTILE_SECRET_KEY; delete process.env.TURNSTILE_SECRET_KEY;
  try {
    let stored;
    const route=publicRoute({collection:()=>({insertOne:async value=>{stored=value;}})});
    const result=await route.POST(request(valid,new File(['%PDF-1.7\nexample'],'resume.pdf',{type:'application/pdf'})));
    assert.equal(result.status,201); assert.equal(stored.status,'new'); assert.equal(stored.resumeData instanceof Binary,true); assert.equal(stored.consentVersion,'careers-v1'); assert.ok((await result.json()).id);
  } finally { if(old!==undefined) process.env.TURNSTILE_SECRET_KEY=old; }
});
test('invalid PDFs are rejected and storage failure never reports success', async () => {
  const old = process.env.TURNSTILE_SECRET_KEY; delete process.env.TURNSTILE_SECRET_KEY;
  try {
    const route=publicRoute({collection:()=>({insertOne:async()=>{throw Error('offline');}})});
    assert.equal((await route.POST(request(valid,new File(['not a pdf'],'resume.pdf',{type:'application/pdf'})))).status,400);
    assert.equal((await route.POST(request())).status,503);
  } finally { if(old!==undefined) process.env.TURNSTILE_SECRET_KEY=old; }
});
test('application APIs deny operational staff, including resume downloads', async () => {
  for(const [path,method] of [['app/api/admin/applications/route.ts','GET'],['app/api/admin/applications/[id]/route.ts','PATCH'],['app/api/admin/applications/[id]/resume/route.ts','GET']]) {
    const route=loadTs(path,{'next/server':{NextResponse:response},'@/lib/adminAuth':{verifyRequestSession:async()=>({role:'technician'})},'@/lib/mongodb':{getDb:()=>{throw Error('must not access database');}}},globals);
    assert.equal((await route[method]({}, {params:Promise.resolve({id:'test'})})).status,403);
  }
  const {canAccessApi}=loadTs('lib/roles.ts');
  assert.equal(canAccessApi('intake','/api/admin/applications/test/resume'),false);
  assert.equal(canAccessApi('manager','/api/admin/applications'),true);
});
test('manager review updates only status, notes and audit metadata',async()=>{
  let update;
  const route=loadTs('app/api/admin/applications/[id]/route.ts',{'next/server':{NextResponse:response},'@/lib/adminAuth':{verifyRequestSession:async()=>({role:'manager',username:'hiring'})},'@/lib/mongodb':{getDb:async()=>({collection:()=>({updateOne:async(filter,change)=>{update={filter,change};return {matchedCount:1};}})})}},globals);
  const result=await route.PATCH({json:async()=>({status:'shortlisted',notes:' Call tomorrow ',email:'override@example.com'})},{params:Promise.resolve({id:'candidate'})});
  assert.equal(result.status,200); assert.equal(update.filter.id,'candidate'); assert.equal(update.change.$set.notes,'Call tomorrow');assert.equal(update.change.$set.updatedBy,'hiring');assert.equal(update.change.$set.email,undefined);
});
test('configured CAPTCHA must pass before any application is stored', async () => {
  const old=process.env.TURNSTILE_SECRET_KEY; process.env.TURNSTILE_SECRET_KEY='test-secret';
  try {
    const route=loadTs('app/api/careers/route.ts',{'next/server':{NextResponse:response},'@/lib/rateLimit':{rateLimit:()=>true},'@/lib/mongodb':{getDb:()=>{throw Error('must not persist');}}},{...globals,fetch:async()=>Response.json({success:false})});
    assert.equal((await route.POST(request())).status,400);
  } finally { if(old===undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY=old; }
});
test('résumé download returns original bytes as a private attachment',async()=>{
  const bytes=Buffer.from('%PDF-1.7\nprivate resume');
  const {NextResponse}=await import('next/server.js');
  const route=loadTs('app/api/admin/applications/[id]/resume/route.ts',{'next/server':{NextResponse},'@/lib/adminAuth':{verifyRequestSession:async()=>({role:'manager'})},'@/lib/mongodb':{getDb:async()=>({collection:()=>({findOne:async()=>({resumeData:new Binary(bytes),resumeName:'résumé.pdf'})})})}},globals);
  const result=await route.GET({}, {params:Promise.resolve({id:'candidate'})});
  assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'private, no-store');assert.match(result.headers.get('content-disposition'),/^attachment;/);assert.equal(Buffer.from(await result.arrayBuffer()).equals(bytes),true);
});
test('manager listing uses escaped search, pagination, and excludes résumé contents',async()=>{
  let captured,skip;
  const collection={find:(filter,options)=>{captured={filter,options};return {sort(){return this;},skip(value){skip=value;return this;},limit(){return this;},toArray:async()=>[]};},countDocuments:async()=>0,aggregate:()=>({toArray:async()=>[]})};
  const route=loadTs('app/api/admin/applications/route.ts',{'next/server':{NextResponse:response},'@/lib/adminAuth':{verifyRequestSession:async()=>({role:'manager'})},'@/lib/mongodb':{getDb:async()=>({collection:()=>collection})}},globals);
  const result=await route.GET({nextUrl:new URL('http://localhost/api/admin/applications?role=technician&status=new&search=a.b&page=2')});
  assert.equal(result.status,200);assert.equal(skip,25);assert.equal(captured.options.projection.resumeData,0);assert.equal(captured.filter.role,'technician');assert.equal(captured.filter.$or[0].fullName.$regex,'a\\.b');
});
