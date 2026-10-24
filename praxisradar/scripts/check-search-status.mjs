import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const statusModule=url(compile('lib/search-status.ts'));
const {dailySearchStatus,normalizeDailyRun,searchStatusLabel}=await import(statusModule);
const legacy={status:'completed',finishedAt:'2026-10-23T20:00:00Z',discovery:{lastStatus:'completed'},offers:{run:{status:'partial',summary:'Zugriffsluecken'}}};
const original=JSON.stringify(legacy);assert.equal(normalizeDailyRun(legacy).status,'partial');assert.equal(JSON.stringify(legacy),original);assert.equal(normalizeDailyRun(null),null);
for(const d of ['completed','partial','failed'])for(const o of ['completed','partial','failed']){
 const expected=[d,o].includes('failed')?'failed':[d,o].includes('partial')?'partial':'completed';
 assert.equal(dailySearchStatus({finishedAt:'now',discovery:{lastStatus:d},offers:{run:{status:o}}}),expected);
}
assert.equal(dailySearchStatus({status:'running'}),'running');assert.equal(dailySearchStatus({status:'completed'}),'unknown');assert.equal(dailySearchStatus({...legacy,issues:['Netzfehler']}),'failed');
assert.equal(searchStatusLabel('partial'),'Teilweise erfolgreich');assert.equal(searchStatusLabel(undefined),'Status unvollständig');
const fixture=url(`let state;export function setState(s){state=s}export function getState(){return state}export async function getSetting(){return state.previous||{}}export async function putSetting(k,v){state.saved.push(structuredClone(v))}export async function discoverSources(){state.calls.push('discovery');if(state.discoveryError)throw Error('Discovery error');return state.discovery}export async function searchInternet(){state.calls.push('offers');if(state.offersError)throw Error('Offers error');return state.offers}`);
const mock=await import(fixture);
let source=compile('lib/daily-search.ts');for(const name of ['source-discovery','web-search','store'])source=source.replaceAll("'./"+name+"'",JSON.stringify(fixture));source=source.replaceAll("'./search-status'",JSON.stringify(statusModule));const {runDailySearch}=await import(url(source));
const day=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'});
for(const d of ['completed','partial','failed'])for(const o of ['completed','partial','failed']){
 const state={calls:[],saved:[],discovery:{lastStatus:d},offers:{run:{status:o}}};mock.setState(state);const result=await runDailySearch();
 assert.deepEqual(state.calls,['discovery','offers']);assert.equal(state.saved.length,2);assert.equal(state.saved[0].status,'running');assert.equal(state.saved[1].status,d==='failed'||o==='failed'?'failed':d==='partial'||o==='partial'?'partial':'completed');assert.equal(result.status,state.saved[1].status);
}
for(const status of ['completed','partial']){const state={calls:[],saved:[],previous:{...legacy,day,status}};mock.setState(state);assert.equal((await runDailySearch()).status,'partial');assert.deepEqual(state.calls,[]);assert.deepEqual(state.saved,[]);}
for(const field of ['discoveryError','offersError']){const state={calls:[],saved:[],[field]:true,discovery:{lastStatus:'completed'},offers:{run:{status:'completed'}}};mock.setState(state);assert.equal((await runDailySearch()).status,'failed');assert.deepEqual(state.calls,['discovery','offers']);}
const ui=fs.readFileSync('app/components/SourceDiscovery.tsx','utf8');assert(ui.includes('normalizeDailyRun(j.schedule.lastRun)'));assert(ui.includes('searchStatusLabel(schedule.lastRun.status)'));assert(ui.includes('Details zum Serverlauf'));
console.log('PASS: Statusmatrix, alte irrefuehrende Datensaetze ohne Mutation, Teilerfolge/Fehler, unveraenderte Suchaufrufe und Tagesduplikatschutz, korrekte UI-Statusanzeige');
