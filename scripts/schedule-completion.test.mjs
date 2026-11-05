import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './test-ts-loader.mjs';

const { ScheduleBookingBadge } = loadTs('components/admin/ScheduleBookingBadge.tsx');
const { withScheduleVisitStatuses } = loadTs('lib/scheduleVisitStatus.ts');
const badge = (type, status) => renderToStaticMarkup(React.createElement(ScheduleBookingBadge, {type,status}));

test('completed visits have an explicit green badge and check icon', () => {
  for (const [type,status,label] of [['inspection','Inspection Completed','Inspection'],['job','Job Done','Job']]) {
    const html=badge(type,status);
    assert.match(html,new RegExp(`${label} completed`));assert.match(html,/bg-emerald-100/);assert.match(html,/<svg/);
  }
  for (const [type,status] of [['inspection','Inspection Booked'],['job','Job In Progress'],['inspection','Job Done'],['job','Inspection Completed']]) assert.doesNotMatch(badge(type,status),/completed|<svg/);
});

test('schedule API preserves visit status separately from the customer workflow',async()=>{
  const appointments = [
    {leadId:'customer',bookingId:'inspection',type:'inspection',date:'2026-11-05',time:'09:00',bookingStart:'2026-11-05T09:00',status:'Inspection Completed',name:'Jane'},
    {leadId:'customer',bookingId:'first-job',type:'job',date:'2026-11-05',time:'11:00',status:'Job Done',name:'Jane'},
    {leadId:'customer',bookingId:'return-job',type:'job',date:'2026-11-06',time:'11:00',status:'Job Booked',name:'Jane'},
  ];
  const {GET}=loadTs('app/api/admin/bookings/route.ts',{
    'next/server':{NextResponse:{json:body=>body}},
    '@/lib/adminAuth':{SESSION_COOKIE:'session',verifySession:async()=>({username:'admin'})},
    '@/lib/bookings':{listAppointmentsBetween:async()=>appointments},
    '@/lib/submissions':{getSubmission:async()=>({name:'Jane',status:'Invoice Sent'})},
    '@/lib/scheduleRoutesServer':{getScheduleRouteOrders:async()=>({})},
  });
  const {bookings}=await GET({cookies:{get:()=>({value:'token'})}});
  for(const visit of appointments) {
    const entry=bookings.find(row=>row.bookingId===visit.bookingId);
    assert.equal(entry.status,visit.status);assert.equal(entry.customer.status,'Invoice Sent');
  }
  assert.equal(bookings.find(row=>row.bookingId==='inspection').bookingStart,'2026-11-05T09:00');
});

const entries=[
  {id:'inspection',leadId:'customer',bookingId:'inspection',type:'inspection',date:'2026-11-05',time:'09:00',status:'Inspection Booked'},
  {id:'first-job',leadId:'customer',bookingId:'first-job',type:'job',date:'2026-11-05',time:'11:00',status:'Job Booked'},
  {id:'return-job',leadId:'customer',bookingId:'return-job',type:'job',date:'2026-11-05',time:'11:00',status:'Job Booked'},
];
const lead={id:'customer',createdAt:'',status:'Invoice Sent',bookings:[
  {bookingId:'inspection',type:'inspection',date:'2026-11-05',time:'09:00',status:'Inspection Completed'},
  {bookingId:'first-job',type:'job',date:'2026-11-05',time:'11:00',status:'Job Done'},
  {bookingId:'return-job',type:'job',date:'2026-11-05',time:'11:00',status:'Job Booked'},
]};
test('CRM saves update only the matching visit and preserve an unsaved route order',()=>{
  const ordered=[entries[2],entries[0],entries[1]];
  const updated=withScheduleVisitStatuses(ordered,[lead]);
  assert.equal(updated.map(e=>e.id).join(','),'return-job,inspection,first-job');
  assert.equal(updated[0].status,'Job Booked');assert.equal(updated[1].status,'Inspection Completed');assert.equal(updated[2].status,'Job Done');
  assert.equal(entries[0].status,'Inspection Booked','display updates must not mutate loaded bookings');
  const reopened={...lead,bookings:lead.bookings.map(b=>b.bookingId==='first-job'?{...b,status:'Job In Progress'}:b)};
  assert.equal(withScheduleVisitStatuses(updated,[reopened])[2].status,'Job In Progress');
});
test('multi-day visits resolve completion by original booking identity, not segment date',()=>{
  const multi={...entries[1],bookingStart:'2026-11-05T11:00',date:'2026-11-06',time:'08:00'};
  assert.equal(withScheduleVisitStatuses([multi],[lead])[0].status,'Job Done');
});
test('missing or ambiguous live records retain the status supplied by the schedule API',()=>{
  const stored={...entries[1],bookingId:'unknown',status:'Job Done'};
  assert.equal(withScheduleVisitStatuses([stored],[lead])[0].status,'Job Done');
  assert.equal(withScheduleVisitStatuses([stored],[])[0].status,'Job Done');
  const legacy={...entries[1],bookingId:undefined};
  assert.equal(withScheduleVisitStatuses([legacy],[lead])[0].status,'Job Booked');
});
test('legacy primary bookings use the existing per-phase completion resolution',()=>{
  const legacy={id:'customer',createdAt:'',status:'Completed',inspectionAt:'2026-11-05T09:00',jobAt:'2026-11-05T11:00'};
  const updated=withScheduleVisitStatuses(entries.slice(0,2),[legacy]);
  assert.equal(updated[0].status,'Inspection Completed');assert.equal(updated[1].status,'Job Done');
});
test('a completed primary visit never marks a different crew at the same time completed',()=>{
  const legacy={id:'customer',createdAt:'',status:'Completed',jobAt:'2026-11-05T11:00',technicianId:'primary-crew'};
  const extra={...entries[1],technicianId:'return-crew'};
  assert.equal(withScheduleVisitStatuses([extra],[legacy])[0].status,'Job Booked');
});
