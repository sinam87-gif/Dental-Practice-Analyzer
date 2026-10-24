import {SearchRepository,digest,type Task} from './repository';import {PublicAccess,DeferredAccess} from './access';import {sourceFor,platformSources} from './sources';import {extractListing,pageItems,prepareListing} from './extract';import {newScan,scanPart,SCAN_CHARS,STORE_CHARS,type ScanState,type ScanOutput} from './stream';
import {canonicalURL} from './robots';import {fetchPublicResource} from '../fetch-offer';import type {Job,PublicListing} from './types';
export type PlatformEnv={DB:D1Database,TEAM_EMAILS?:string,SEARCH_RUNNER?:{advance():Promise<{active:boolean,job?:Job}>}};
export function berlinTime(date:Date){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(date);return Object.fromEntries(parts.map(p=>[p.type,p.value]));}
async function geocode(repo:SearchRepository,l:PublicListing){const o=l.offer;if(o.city==='Unbekannt'||!o.city||/Niedersachsen|Bayern|Nordrhein-Westfalen|Deutschland|Rheinland-Pfalz/i.test(o.city))return;const query=(o.address?o.address+', ':'')+o.city;const key='geo:'+query.toLowerCase();let point=await repo.cached(key);if(!point){const until=await repo.throttle('photon.komoot.io',2);if(until)throw new DeferredAccess(until);const r=await fetchPublicResource('https://photon.komoot.io/api/?q='+encodeURIComponent(query+', Deutschland')+'&limit=3&lang=de',{maxBytes:40000,beforeRequest:()=>repo.budget.spend('network')});const data=JSON.parse(new TextDecoder().decode(r.bytes));const normalize=(s:string)=>s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/\p{Diacritic}/gu,'');const city=normalize(o.city.replace(/^(?:im )?(?:Raum|Nähe|Grossraum|Großraum)\s*/i,''));const feature=data.features?.find((f:any)=>f.properties?.countrycode==='DE'&&[f.properties.city,f.properties.name,f.properties.county].some((s:any)=>typeof s==='string'&&normalize(s).includes(city)));if(!feature)return;point={latitude:feature.geometry.coordinates[1],longitude:feature.geometry.coordinates[0],label:feature.properties.name};await repo.cache(key,point,30*86400000);}o.latitude=point.latitude;o.longitude=point.longitude;o.distanceApproximate=!o.address;}
export async function processNext(repo:SearchRepository,emails:string[]=[],fetchHTML?:(sourceId:string,url:string)=>Promise<{html:string,url:string}>){repo.budget.reset();const claim=await repo.claim();if(!claim){repo.budget.enforced=false;return {active:!!await repo.active()};}const {job,token}=claim;
 try{if(job.processed>=1000){job.limited=true;job.status='partial';job.finishedAt=new Date().toISOString();job.issues.push('Free-Laufbudget erreicht: maximal 1000 Arbeitsschritte. Offene Aufgaben wurden nicht als vollständig durchsucht gewertet.');await repo.digestDraft(job,emails);await repo.checkpoint(job,token);return {active:false,job};}const next=await repo.next(job.id);if(!next){if(await repo.pending(job.id)){await repo.checkpoint(job,token);return {active:true,job};}const failed=Object.values(job.sourceStatus).filter(s=>['failed','restricted','limited'].includes(s.status)).length;const succeeded=Object.values(job.sourceStatus).some(s=>s.status==='completed');job.status=failed||job.issues.length||job.limited?(succeeded||job.added||job.changed?'partial':'failed'):'completed';const counts=await repo.db.prepare("SELECT json_extract(payload,'$.type') AS kind,COUNT(*) AS n FROM platform_events WHERE json_extract(payload,'$.jobId')=? GROUP BY kind").bind(job.id).all();job.added=Number(counts.results.find((r:any)=>r.kind==='new')?.n||0);job.changed=Number(counts.results.find((r:any)=>r.kind==='changed')?.n||0);job.finishedAt=new Date().toISOString();await repo.digestDraft(job,emails);await repo.checkpoint(job,token);return {active:false,job};}
 const {id,task}=next,source=(await repo.sources()).find(s=>s.id===task.sourceId);if(!source)throw Error('Quelle nicht mehr vorhanden');try{
 if(source.mode!=='public')throw Error('Quelle ist nicht für automatische Abrufe freigegeben');
 const finish=async()=>{job.processed++;await repo.checkpoint(job,token,id);return {active:true,job};};
 const again=async()=>{job.processed++;await repo.checkpoint(job,token,id,Date.now()+1);return {active:true,job};};
 if(task.kind==='index'||task.kind==='detail'){
  const doc=fetchHTML?await fetchHTML(source.id,task.url):await new PublicAccess(repo,source).html(task.url);
  const key='page:'+await digest(task.url);
  const count=Math.ceil(doc.html.length/STORE_CHARS);if(count>22)throw Error('Dokument überschreitet das Free-Speicherbudget');
  const statements=[];for(let part=0;part<count;part++)statements.push(repo.db.prepare('INSERT INTO platform_cache(id,payload,expires_at,next_allowed_at) VALUES(?,?,?,0) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at').bind(key+':'+part,JSON.stringify({html:doc.html.slice(part*STORE_CHARS,(part+1)*STORE_CHARS)}),Date.now()+86400000));
  if(statements.length)await repo.db.batch(statements);
  const scanKey='scan:'+job.id+':'+id;await repo.cache(scanKey,{state:newScan(),length:doc.html.length,pageKey:key,pending:[],detail:task.kind==='detail',url:doc.url,items:0,seen:[]},86400000);
  await repo.enqueue(job.id,[{...task,kind:'scan',cacheKey:scanKey}]);return finish();
 }
 if(task.kind==='scan'){
  const meta=await repo.cached(task.cacheKey!);if(!meta)throw Error('Zwischenseite abgelaufen; neuen Suchlauf starten');
  if(meta.pending.length){const outputs:ScanOutput[]=meta.pending.splice(0,4),tasks:Task[]=[];for(const output of outputs){if(output.kind==='next'){if(task.page<3)tasks.push({sourceId:source.id,url:output.url,key:canonicalURL(output.url),kind:'index',page:task.page+1});else job.limited=true;}
   else if(output.kind==='card'){if(meta.items++<35){const key='fragment:'+await digest(source.id+task.url+meta.items);await repo.cache(key,{html:output.html},86400000);tasks.push({...task,kind:'card',key:task.key+':card:'+meta.items,html:undefined,cacheKey:key});}else job.limited=true;}
   else if(source.adapter==='links'){const canonical=canonicalURL(output.url);if((meta.seen||[]).includes(canonical))continue;if(meta.items++<35){(meta.seen??=[]).push(canonical);tasks.push({sourceId:source.id,url:output.url,key:new URL(output.url).pathname,title:output.title,kind:'detail',page:0});}else job.limited=true;}}
   await repo.enqueue(job.id,tasks);await repo.cache(task.cacheKey!,meta,86400000);return again();
  }
  if(meta.state.offset<meta.length){const part=await repo.cached(meta.pageKey+':'+Math.floor(meta.state.offset/STORE_CHARS));if(!part)throw Error('Öffentlicher Seitenabschnitt abgelaufen');const remaining=part.html.slice(meta.state.offset%STORE_CHARS,meta.state.offset%STORE_CHARS+SCAN_CHARS);const scanned=scanPart(source,meta.url,meta.state,remaining,meta.detail,meta.state.offset+remaining.length>=meta.length);meta.state=scanned.state;meta.pending=scanned.outputs;if(scanned.html)meta.result=scanned.html;if(meta.state.truncated)job.limited=true;await repo.cache(task.cacheKey!,meta,86400000);return again();}
  if(meta.detail){const key='compact:'+await digest(task.url);await repo.cache(key,{html:meta.result||''},86400000);await repo.enqueue(job.id,[{...task,kind:'extract',html:undefined,cacheKey:key}]);}
  else job.sourceStatus[source.id]={status:meta.items?'completed':'restricted',note:meta.items?meta.items+' öffentliche Kandidaten in kleinen Schritten gelesen':'Keine öffentlichen Einzelangebote erkannt; Quelle/Anmeldung prüfen'};
  await repo.cache(task.cacheKey!,{done:true,items:meta.items},86400000);return finish();
 }
 if(task.kind==='card'){
  const fragment=task.html?{html:task.html}:await repo.cached(task.cacheKey!);if(!fragment)throw Error('Inseratsabschnitt abgelaufen');const item=pageItems(source,fragment.html,task.url).items[0];if(item)await repo.enqueue(job.id,[{...task,...item,html:undefined,kind:'extract'}]);else job.skipped++;return finish();
 }
 if(task.kind==='extract'||task.kind==='inline'){
  const fragment=task.html?{html:task.html}:await repo.cached(task.cacheKey!);if(!fragment)throw Error('Inseratstext abgelaufen');const prepared=prepareListing(source,{url:task.url,key:task.key,title:task.title,city:task.city},fragment.html);if(!prepared){job.skipped++;return finish();}
  const key='prepared:'+await digest(source.id+task.url+task.key);await repo.cache(key,prepared,86400000);await repo.enqueue(job.id,[{...task,html:undefined,kind:'facts',cacheKey:key}]);return finish();
 }
 if(task.kind==='facts'){
  const prepared=await repo.cached(task.cacheKey!);if(!prepared)throw Error('Vorbereiteter Text abgelaufen');
  const listing=extractListing(source,{url:task.url,key:task.key,title:task.title,city:task.city},'',undefined,prepared);if(!listing){job.skipped++;return finish();}
  const key='listing:'+await digest(source.id+task.url+task.key);await repo.cache(key,listing,86400000);await repo.enqueue(job.id,[{...task,html:undefined,kind:fetchHTML?'persist':'geocode',cacheKey:key}]);return finish();
 }

 const listing:PublicListing=await repo.cached(task.cacheKey!);if(!listing)throw Error('Erkanntes Angebot abgelaufen');
 if(task.kind==='geocode'){
  try{await geocode(repo,listing)}catch(error){if(error instanceof DeferredAccess)throw error;const issue=source.name+': Standortbestimmung fehlgeschlagen; Angebot mit unbekannter Entfernung gespeichert';if(!job.issues.includes(issue))job.issues.push(issue);}
  await repo.cache(task.cacheKey!,listing,86400000);await repo.enqueue(job.id,[{...task,kind:'persist'}]);return finish();
 }
 if(task.kind!=='persist')throw Error('Unbekannter Suchschritt');
 const ingested=await repo.ingest(listing,await repo.preferences(),job.id);if(ingested.kind==='added')job.added++;else if(ingested.kind==='changed')job.changed++;else if(ingested.kind==='skipped')job.skipped++;else job.unchanged++;

 job.processed++;await repo.checkpoint(job,token,id);return {active:true,job};
 }catch(e){if(e instanceof DeferredAccess){await repo.checkpoint(job,token,id,e.until);return {active:true,job};}const message=source.name+': '+(e as Error).message;if(!job.issues.includes(message))job.issues.push(message);job.issues=job.issues.slice(-100);job.sourceStatus[source.id]={status:'failed',note:(e as Error).message};job.processed++;await repo.checkpoint(job,token,id);return {active:true,job};}
 }catch(e){job.issues.push('Arbeitsschritt abgebrochen: '+(e as Error).message);await repo.checkpoint(job,token);throw e;}finally{repo.budget.enforced=false;}
}
export async function advancePlatform(env:PlatformEnv){return processNext(new SearchRepository(env.DB),(env.TEAM_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean));}
export async function scheduledPlatform(env:PlatformEnv,date:Date){
 const repo=new SearchRepository(env.DB),time=berlinTime(date);
 if(time.hour==='09'&&time.minute==='00'){await repo.start('daily',date);return;}
 // One durable step per separate Cron event. No RPC chain or waitUntil CPU reset.
 if(await repo.active())await processNext(repo,(env.TEAM_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean));
}

export {platformSources};
