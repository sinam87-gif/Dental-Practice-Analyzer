// The Codex heartbeat runs this local writer. No credentials are saved in files.
const base='http://127.0.0.1:5173';
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual',signal:AbortSignal.timeout(15000)});
const cookie=login.headers.get('set-cookie')?.split(';')[0];if(!cookie)throw Error('Lokale Anmeldung nicht verfügbar. Keine Suche ausgeführt.');
async function call(path,action){const r=await fetch(base+path,{method:action?'POST':'GET',headers:{cookie,'Content-Type':'application/json'},body:action?JSON.stringify({action}):undefined,signal:AbortSignal.timeout(300000)});const j=await r.json();if(!r.ok)throw Error(j.error||'Suche fehlgeschlagen');return j}
const before=await call('/api/sources'),today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'});let discovery=before;
if(!before.lastRun||new Date(before.lastRun).toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'})!==today||before.lastStatus==='failed')discovery=await call('/api/sources','discover');
let offers,error;try{const data=await call('/api/offers');const last=data.runs[0];if(!last||new Date(last.createdAt).toLocaleDateString('en-CA',{timeZone:'Europe/Berlin'})!==today||last.status==='failed')offers=await call('/api/search','search')}catch(e){error=e.message}
console.log(JSON.stringify({newSourceCandidates:discovery.candidates.filter(c=>c.status==='pending'&&!before.candidates.some(b=>b.id===c.id)).length,pendingSources:discovery.candidates.filter(c=>c.status==='pending').length,sourceSummary:discovery.summary,sourceStatus:discovery.lastStatus,offers:offers?{added:offers.added,updated:offers.updated,summary:offers.run.summary}:null,offerError:error,approvalRequired:true},null,2));
if(discovery.lastStatus==='failed'||error)process.exitCode=1;
