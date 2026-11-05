import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { loadTs } from './test-ts-loader.mjs';

const components = [
  ['street_number','8','8'], ['route','Raleigh Grove','Raleigh Grove'], ['locality','Essendon North','Essendon North'],
  ['administrative_area_level_1','Victoria','VIC'], ['postal_code','3041','3041'], ['country','Australia','AU'],
].map(([type,longText,shortText]) => ({ types:[type],longText,shortText }));

test('Google suggestions are completed with suburb, state and postcode from structured place details', async () => {
  const calls=[];
  const { getAddressSuggestions } = loadTs('lib/addressSuggestions.ts', {}, { fetch: async (url, options) => {
    calls.push({url:String(url),options});
    if (String(url).includes('places:autocomplete')) return Response.json({suggestions:[{placePrediction:{placeId:'raleigh-house',text:{text:'8 Raleigh Grove, Essendon North VIC, Australia'}}}]});
    assert.match(String(url), /places\/raleigh-house/);
    assert.equal(options.headers['X-Goog-FieldMask'],'addressComponents');
    return Response.json({addressComponents:components});
  } });
  const result=await getAddressSuggestions('8 Raleigh','test-key');
  assert.deepEqual(Array.from(result.predictions),['8 Raleigh Grove, Essendon North VIC 3041']);
  assert.equal(result.attribution,'Google');
  assert.equal(calls.length,2);
  await getAddressSuggestions('8 Raleigh Gr','test-key');
  assert.equal(calls.length,3,'cache completed property details across typing requests');
});

test('legacy Google suggestions also use complete details and preserve a typed unit', async () => {
  const { getAddressSuggestions } = loadTs('lib/addressSuggestions.ts', {}, { fetch: async url => {
    if(String(url).includes('places:autocomplete')) return Response.json({}, {status:403});
    if(String(url).includes('/place/autocomplete/')) return Response.json({status:'OK',predictions:[{place_id:'legacy-house',description:'8 Raleigh Grove, Essendon North VIC, Australia'}]});
    assert.match(String(url),/\/place\/details\//);
    return Response.json({result:{address_components:components.map(c=>({types:c.types,long_name:c.longText,short_name:c.shortText}))}});
  } });
  const result=await getAddressSuggestions('Unit 4, 8 Raleigh','test-key');
  assert.deepEqual(Array.from(result.predictions),['4/8 Raleigh Grove, Essendon North VIC 3041']);
});

test('incomplete fallback results are omitted and district is used instead of Melbourne', async () => {
  const { getAddressSuggestions } = loadTs('lib/addressSuggestions.ts', {}, { fetch: async () => Response.json({features:[
    {properties:{housenumber:'8',street:'Raleigh Grove',district:'Essendon North',city:'Melbourne',state:'Victoria',postcode:'3041'}},
    {properties:{housenumber:'8',street:'Raleigh Grove',district:'Essendon North',city:'Melbourne',state:'Victoria'}},
    {properties:{housenumber:'8',street:'Raleigh Grove',city:'Melbourne',state:'Victoria',postcode:'3041'}},
  ]}) });
  const result=await getAddressSuggestions('8 Raleigh');
  assert.deepEqual(Array.from(result.predictions),['8 Raleigh Grove, Essendon North, Victoria, 3041']);
});

test('provider failures return an explicit manual-entry message without inventing an address', async () => {
  const { getAddressSuggestions } = loadTs('lib/addressSuggestions.ts', {}, { fetch: async () => { throw new Error('Provider unavailable'); } });
  const result=await getAddressSuggestions('8 Raleigh','test-key');
  assert.equal(result.predictions.length,0);
  assert.equal(result.unavailable,true);
  assert.match(result.message,/temporarily unavailable/);
  assert.match(result.message,/suburb, state and postcode/);
});

test('customer form ignores stale responses and selection retains the entire postal address', async () => {
  const source=readFileSync('components/home/QuoteFormV2.tsx','utf8');
  const tree=ts.createSourceFile('form.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const handlers=[];
  const visit=node=>{if(ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>['fetchSuggestions','onAddress','pickSuggestion'].includes(d.name.getText(tree)))) handlers.push(node.getText(tree));ts.forEachChild(node,visit);};visit(tree);
  const compiled=ts.transpileModule(handlers.join('\n')+'\nmodule.exports={fetchSuggestions,onAddress,pickSuggestion};',{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
  const state={suggestions:[],data:{address:''}}, requests=[], module={exports:{}};
  vm.runInNewContext(compiled,{module,useCallback:callback=>callback,suggestionRequest:{current:0},debounceRef:{current:null},errors:{},
    setSuggestions:value=>{state.suggestions=value;},setSuggestOpen(){},setSuggestionLoading(){},setSuggestionMessage(){},setSuggestionAttribution(){},setActiveSuggest(){},setErrors(){},setData:update=>{state.data=update(state.data);},
    setTimeout:()=>1,clearTimeout(){},fetch:()=>new Promise(resolve=>requests.push(resolve)),
  });
  const old=module.exports.fetchSuggestions('8 Raleigh');
  module.exports.onAddress('12 Smith');
  const latest=module.exports.fetchSuggestions('12 Smith');
  const full='12 Smith Street, Richmond VIC 3121';
  requests[1]({ok:true,json:async()=>({predictions:[full]})});await latest;
  requests[0]({ok:true,json:async()=>({predictions:['8 Raleigh Grove, Essendon North VIC 3041']})});await old;
  assert.deepEqual(Array.from(state.suggestions),[full]);
  const late=module.exports.fetchSuggestions('12 Smith');
  module.exports.pickSuggestion(full);
  requests[2]({ok:true,json:async()=>({predictions:['Stale result']})});await late;
  assert.equal(state.data.address,full);
  assert.equal(state.suggestions.length,0);
});
