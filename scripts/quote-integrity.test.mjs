import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './test-ts-loader.mjs';
const { changesAcceptedQuote } = loadTs('lib/quoteIntegrity.ts');
const { preferredCustomerQuote, customerQuoteLead } = loadTs('lib/customerQuoteSelection.ts');
const { computeQuoteTotals } = loadTs('lib/quotePdf.ts');
const accepted = { _id:'lead~original',state:'accepted',values:{quoteAmount:3130,quoteItems:[{price:3130,qty:1}],quoteAcceptedAt:'accepted',quoteSignedAt:'signed',quoteSignature:'signature'} };
const draft = { _id:'lead~draft',state:'draft',values:{quoteAmount:0,quoteItems:[]} };

test('the accepted quote opens by default even when a newer empty draft exists',()=>{
  assert.equal(preferredCustomerQuote([accepted,draft])._id,accepted._id);
  assert.equal(preferredCustomerQuote([accepted,draft],draft._id)._id,accepted._id);
  const view=customerQuoteLead({id:'lead',name:'Customer',...accepted.values},draft);
  assert.equal(view.quoteAmount,0);
  assert.equal(view.quoteSignature,undefined);
  assert.equal(view.quoteSignedAt,undefined);
  assert.equal(view.name,'Customer');
});

test('accepted totals, items and signatures cannot be cleared while invoices and bookings remain editable',()=>{
  for(const patch of [{quoteAmount:0},{quoteItems:[]},{quoteAcceptedAt:''},{quoteSignature:''}])assert.equal(changesAcceptedQuote(accepted.values,patch),true);
  assert.equal(changesAcceptedQuote(accepted.values,{quoteAmount:3130}),false);
  assert.equal(changesAcceptedQuote(accepted.values,{invoiceAmount:1000,jobAt:'2026-10-20T10:00'}),false);
  assert.equal(changesAcceptedQuote(draft.values,{quoteAmount:500}),false);
});

test('legacy quotes with an amount and no line items never calculate as zero',()=>{
  for(const mode of ['exclusive','inclusive','none'])assert.equal(computeQuoteTotals([],mode,10,3130).total,3130);
});

test('the submission write boundary rejects zeroing an accepted quote and guards acceptance races',async()=>{
  let writes=[];
  let current={ quoteAmount:3130,quoteAcceptedAt:'accepted',quoteSignedAt:'signed',quoteSignature:'signature' };
  const col={findOne:async()=>current,updateOne:async(filter,patch)=>{writes.push({filter,patch});return{matchedCount:1};}};
  const {updateSubmission}=loadTs('lib/submissions.ts',{'@/lib/mongodb':{getDb:async()=>({collection:()=>col})},'@/lib/users':{}});
  const id='507f1f77bcf86cd799439011';
  assert.equal(await updateSubmission(id,{quoteAmount:0}),false);
  assert.equal(writes.length,0);
  assert.equal(await updateSubmission(id,{invoiceAmount:500}),true);
  assert.equal(writes[0].patch.$set.quoteAmount,undefined);
  writes=[];current={quoteAmount:100};
  assert.equal(await updateSubmission(id,{quoteAmount:200}),true);
  assert.equal(writes[0].filter.quoteSignedAt.$exists,false);
  assert.equal(writes[0].filter.quoteAcceptedAt.$exists,false);
});

test('sending an invoice saves its own amount and never overwrites the accepted quote',async()=>{
  const writes=[], emails=[], pdfInputs=[];
  const lead={id:'lead',jobNo:'JOBNO-1',email:'customer@example.com',quoteAmount:3130,quoteSignedAt:'signed',quoteSignature:'signature'};
  const {POST}=loadTs('app/api/admin/invoice/send/route.ts',{
    '@/lib/submissions':{getSubmission:async()=>lead,updateSubmission:async(_id,patch)=>{writes.push(patch);return true;},appendActivity:async()=>{}},
    '@/lib/adminAuth':{verifyRequestSession:async()=>({username:'manager'})},
    '@/lib/email':{isEmailConfigured:()=>true,wrapEmailHtml:x=>x,getEmailLogoUrl:async()=>'',sendEmail:async x=>emails.push(x)},
    '@/lib/quotePdf':{buildQuotePdfBase64:async input=>{pdfInputs.push(input);return '';}},
    '@/lib/automations':{invoiceTrackingPixel:()=>''},
    '@/lib/quickbooks':{isQboConfigured:()=>false},
  });
  const response=await POST({json:async()=>({id:'lead',price:1500,gst:10})});
  assert.equal(response.status,200);
  assert.equal(writes[0].invoiceAmount,1500);
  assert.equal(writes[0].quoteAmount,undefined);
  assert.equal(writes[0].quoteSignature,undefined);
  const invalid=await POST({json:async()=>({id:'lead'})});
  assert.equal(invalid.status,400);
  assert.equal(emails.length,1);
  assert.match(emails[0].html, /Account Number: <b>669909988<\/b>/);
  assert.equal(pdfInputs[0].accountNumber,"669909988");
});


test('invoice account defaults cover missing and blank values while preserving overrides', () => {
  const { invoiceAccountNumber } = loadTs('lib/invoicePayment.ts');
  for (const value of [undefined, null, '', '   ']) {
    assert.equal(invoiceAccountNumber(value), '669909988');
  }
  assert.equal(invoiceAccountNumber('669 909 988'), '669909988');
  assert.equal(invoiceAccountNumber('123 456'), '123456');
});
