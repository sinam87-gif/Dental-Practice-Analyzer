import {berlinTime} from './time';
export {berlinTime} from './time';
import {CACHE_TTL,MAX_JOB_STEPS_PER_DAY,SearchRateLimit} from './limits';
import {SearchRepository,digest,type Task} from './repository';import {PublicAccess,DeferredAccess} from './access';import {sourceFor,platformSources} from './sources';import {extractPreparedListing,cardItem,readCompactListingDocument,parseListingDocument,documentFromScan} from './facts';import {newScan,scanPart,SCAN_CHARS,STORE_CHARS,type ScanState,type ScanOutput} from './stream';
import {canonicalURL} from './robots';import {fetchPublicResource} from '../public-resource';import type {Job,PublicListing} from './types';
export type PlatformEnv={DB:D1Database,TEAM_EMAILS?:string,PLATFORM_SEARCH_ENABLED?:string,SEARCH_RUNNER?:{advance():Promise<{active:boolean,job?:Job}>}};
async function geocode(repo:SearchRepository,l:PublicListing){const o=l.offer;if(o.city==='Unbekannt'||!o.city||/Niedersachsen|Bayern|Nordrhein-Westfalen|Deutschland|Rheinland-Pfalz/i.test(o.city))return;const query=(o.address?o.address+', ':'')+o.city;const key='geo:'+query.toLowerCase();let point=await repo.cached(key);if(!point){const until=await repo.throttle('photon.komoot.io',2);if(until)throw new DeferredAccess(until);const r=await fetchPublicResource('https://photon.komoot.io/api/?q='+encodeURIComponent(query+', Deutschland')+'&limit=3&lang=de',{maxBytes:40000,beforeRequest:()=>repo.budget.spend('network')});const data=JSON.parse(new TextDecoder().decode(r.bytes));const normalize=(s:string)=>s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/\p{Diacritic}/gu,'');const city=normalize(o.city.replace(/^(?:im )?(?:Raum|Nähe|Grossraum|Großraum)\s*/i,''));const feature=data.features?.find((f:any)=>f.properties?.countrycode==='DE'&&[f.properties.city,f.properties.name,f.properties.county].some((s:any)=>typeof s==='string'&&normalize(s).includes(city)));if(!feature)return;point={latitude:feature.geometry.coordinates[1],longitude:feature.geometry.coordinates[0],label:feature.properties.name};await repo.cache(key,point,30*86400000);}o.latitude=point.latitude;o.longitude=point.longitude;o.distanceApproximate=!o.address;}
export async function processNext(repo:SearchRepository,emails:string[]=[],fetchHTML?:(sourceId:string,url:string)=>Promise<{html:string,url:string}>,clock=new Date()){repo.budget.reset();const claim=await repo.claim(clock.getTime());if(!claim){repo.budget.enforced=false;return {active:!!await repo.active()};}const {job,token}=claim;
 try{const day=clock.toISOString().slice(0,10);if(job.budgetDay!==day){if(job.pendingUsage){await repo.settleUsage(job.pendingUsage);delete job.pendingUsage;}job.windowSteps=job.budgetDay?0:job.processed;job.budgetDay=day;job.resumeAt=0;}
 if(job.processed>=7000||clock.getTime()-Date.parse(job.startedAt)>=7*86400000){job.limited=true;job.status='partial';job.finishedAt=clock.toISOString();job.issues.push('Maximale Laufdauer erreicht; offene Aufgaben bleiben für die Aufbewahrungsfrist gespeichert.');await repo.checkpoint(job,token);return {active:false,job};}
 const next=await repo.next(job.id);if(!next){if(await repo.pending(job.id)){await repo.checkpoint(job,token);return {active:true,job};}const failed=Object.values(job.sourceStatus).filter(s=>['failed','restricted','limited'].includes(s.status)).length;const succeeded=Object.values(job.sourceStatus).some(s=>s.status==='completed');job.status=failed||job.issues.length||job.limited?(succeeded||job.added||job.changed?'partial':'failed'):'completed';const counts=await repo.db.prepare("SELECT json_extract(payload,'$.type') AS kind,COUNT(*) AS n FROM platform_events WHERE json_extract(payload,'$.jobId')=? GROUP BY kind").bind(job.id).all();job.added=Number(counts.results.find((r:any)=>r.kind==='new')?.n||0);job.changed=Number(counts.results.find((r:any)=>r.kind==='changed')?.n||0);job.finishedAt=new Date().toISOString();await repo.digestDraft(job,emails);await repo.checkpoint(job,token);return {active:false,job};}
 const allowed=await repo.reserveStep(clock,job.pendingUsage);delete job.pendingUsage;
 if((job.windowSteps||0)>=MAX_JOB_STEPS_PER_DAY||!allowed){
  job.resumeAt=Date.parse(day+'T00:00:00Z')+86400000;const issue='Tagesbudget erreicht; Fortsetzung nach '+new Date(job.resumeAt).toISOString();if(!job.issues.includes(issue))job.issues.push(issue);await repo.checkpoint(job,token);return {active:true,job};}
 const {id,task}=next,source=(await repo.sources()).find(s=>s.id===task.sourceId);if(!source)throw Error('Quelle nicht mehr vorhanden');try{
 if(source.mode!=='public')throw Error('Quelle ist nicht für automatische Abrufe freigegeben');
 const finish=async()=>{job.processed++;job.windowSteps=(job.windowSteps||0)+1;await repo.checkpoint(job,token,id);return {active:true,job};};
 const again=async()=>{job.processed++;job.windowSteps=(job.windowSteps||0)+1;await repo.checkpoint(job,token,id,Date.now()+1);return {active:true,job};};
 if(task.kind==='index'||task.kind==='detail'){
  const doc=fetchHTML?await fetchHTML(source.id,task.url):await new PublicAccess(repo,source).html(task.url);
  // Persist public HTML as text, not a large JSON document. D1 returns only the next slice.
  const key='raw-page:'+await digest(task.url);await repo.rawPage(key,doc.html,CACHE_TTL);
  const scanKey='scan:'+job.id+':'+id;await repo.cache(scanKey,{state:newScan(),length:doc.html.length,pageKey:key,raw:true,cursor:0,pending:[],detail:task.kind==='detail',url:doc.url,items:0,seen:[]},CACHE_TTL);
  await repo.enqueue(job.id,[{...task,kind:'scan',cacheKey:scanKey,observedAt:clock.toISOString()}]);return finish();
 }
 if(task.kind==='scan'){
  const meta=await repo.cached(task.cacheKey!);if(!meta)throw Error('Zwischenseite abgelaufen; neuen Suchlauf starten');
  if(meta.pending.length){const outputs:ScanOutput[]=meta.pending.splice(0,4),tasks:Task[]=[];for(const output of outputs){if(output.kind==='next'){if(task.page<3)tasks.push({sourceId:source.id,url:output.url,key:canonicalURL(output.url),kind:'index',page:task.page+1});else job.limited=true;}
   else if(output.kind==='card'){if(meta.items++<35){const key='fragment:'+await digest(source.id+task.url+meta.items);await repo.cache(key,{html:output.html},CACHE_TTL);tasks.push({...task,kind:'card',key:task.key+':card:'+meta.items,html:undefined,cacheKey:key});}else job.limited=true;}
   else if(source.adapter==='links'){const canonical=canonicalURL(output.url);if((meta.seen||[]).includes(canonical))continue;if(meta.items++<35){(meta.seen??=[]).push(canonical);tasks.push({sourceId:source.id,url:output.url,key:new URL(output.url).pathname,title:output.title,kind:'detail',page:0});}else job.limited=true;}}
   await repo.enqueue(job.id,tasks);await repo.cache(task.cacheKey!,meta,CACHE_TTL);return again();
  }
  if(meta.state.offset<meta.length){let remaining:string;
   if(meta.raw){const part=await repo.rawPart(meta.pageKey,meta.cursor||0,SCAN_CHARS);if(!part)throw Error('Öffentlicher Seitenabschnitt abgelaufen');remaining=part.slice(0,SCAN_CHARS);if(/[\uD800-\uDBFF]$/.test(remaining))remaining=remaining.slice(0,-1);meta.cursor=(meta.cursor||0)+remaining.length-(remaining.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)||[]).length;}
   else {const part=await repo.cached(meta.pageKey+':'+Math.floor(meta.state.offset/STORE_CHARS));if(!part)throw Error('Öffentlicher Seitenabschnitt abgelaufen');remaining=part.html.slice(meta.state.offset%STORE_CHARS,meta.state.offset%STORE_CHARS+SCAN_CHARS);}
   const scanned=scanPart(source,meta.url,meta.state,remaining,meta.detail,meta.state.offset+remaining.length>=meta.length,false);meta.state=scanned.state;meta.pending=scanned.outputs;if(scanned.html)meta.result=scanned.html;if(meta.state.truncated)job.limited=true;await repo.cache(task.cacheKey!,meta,CACHE_TTL);return again();}

  if(meta.detail){const prepared=documentFromScan(source,{url:task.url,key:task.key,title:task.title,city:task.city},meta.state);if(prepared){const key='prepared:'+await digest(source.id+task.url+task.key);await repo.cache(key,prepared,CACHE_TTL);await repo.enqueue(job.id,[{...task,kind:'parse',html:undefined,cacheKey:key}]);}else job.skipped++;}
  else job.sourceStatus[source.id]={status:meta.items?'completed':'restricted',note:meta.items?meta.items+' öffentliche Kandidaten in kleinen Schritten gelesen':'Keine öffentlichen Einzelangebote erkannt; Quelle/Anmeldung prüfen'};
  await repo.cache(task.cacheKey!,{done:true,items:meta.items},CACHE_TTL);return finish();
 }
 if(task.kind==='card'){
  const fragment=task.html?{html:task.html}:await repo.cached(task.cacheKey!);if(!fragment)throw Error('Inseratsabschnitt abgelaufen');const item=cardItem(source,fragment.html,task.url);if(item)await repo.enqueue(job.id,[{...task,...item,html:undefined,kind:'extract'}]);else job.skipped++;return finish();
 }
 if(task.kind==='extract'||task.kind==='inline'){
  const fragment=task.html?{html:task.html}:await repo.cached(task.cacheKey!);if(!fragment)throw Error('Inseratstext abgelaufen');const prepared=readCompactListingDocument(source,{url:task.url,key:task.key,title:task.title,city:task.city},fragment.html);if(!prepared){job.skipped++;return finish();}if(prepared.truncated)job.limited=true;
  const key='prepared:'+await digest(source.id+task.url+task.key);await repo.cache(key,prepared,CACHE_TTL);await repo.enqueue(job.id,[{...task,html:undefined,kind:'parse',cacheKey:key}]);return finish();
 }
 if(task.kind==='parse'){const document=await repo.cached(task.cacheKey!);if(!document)throw Error('Bereinigter Text abgelaufen');const sections=['identity','rooms','financial','team','business'] as const,step=document.parseStep||0;if(step>=sections.length){await repo.enqueue(job.id,[{...task,kind:'facts'}]);return finish();}await repo.cache(task.cacheKey!,{...parseListingDocument({url:task.url,key:task.key,title:task.title,city:task.city},document,sections[step]),parseStep:step+1},CACHE_TTL);if(step+1<sections.length)return again();await repo.enqueue(job.id,[{...task,kind:'facts'}]);return finish();}
 if(task.kind==='facts'){
  const prepared=await repo.cached(task.cacheKey!);if(!prepared)throw Error('Vorbereiteter Text abgelaufen');
  const listing=extractPreparedListing(source,{url:task.url,key:task.key,title:task.title,city:task.city},prepared,task.observedAt);if(!listing){job.skipped++;return finish();}
  const key='listing:'+await digest(source.id+task.url+task.key);await repo.cache(key,listing,CACHE_TTL);await repo.enqueue(job.id,[{...task,html:undefined,kind:fetchHTML?'match':'geocode',cacheKey:key}]);return finish();
 }

 const listing:PublicListing=await repo.cached(task.cacheKey!);if(!listing)throw Error('Erkanntes Angebot abgelaufen');
 if(task.kind==='geocode'){
  try{await geocode(repo,listing)}catch(error){if(error instanceof DeferredAccess)throw error;const issue=source.name+': Standortbestimmung fehlgeschlagen; Angebot mit unbekannter Entfernung gespeichert';if(!job.issues.includes(issue))job.issues.push(issue);}
  await repo.cache(task.cacheKey!,listing,CACHE_TTL);await repo.enqueue(job.id,[{...task,kind:'match'}]);return finish();
 }
 if(task.kind==='match'){
  const cursorKey='match:'+job.id+':'+id,progress=await repo.cached(cursorKey)||{after:''};
  if(!progress.after){const known:any=await repo.db.prepare("SELECT listing_id AS id FROM platform_aliases WHERE alias=? UNION ALL SELECT id FROM offers WHERE json_extract(payload,'$.url')=? LIMIT 1").bind('item:'+listing.sourceId+':'+listing.externalKey,listing.offer.url!).first();if(known){await repo.enqueue(job.id,[{...task,kind:'persist',existingId:known.id}]);return finish();}}

  const rows=await repo.db.prepare("SELECT id,json_extract(payload,'$.url') AS url FROM offers WHERE id>? ORDER BY id LIMIT 20").bind(progress.after).all();
  const identity=(raw:string)=>canonicalURL(raw)+(new URL(raw).hash||'');const target=identity(listing.offer.url!);const found=rows.results.find((r:any)=>{try{return identity(r.url)===target}catch{return false}});
  if(!found&&rows.results.length===20){await repo.cache(cursorKey,{after:rows.results.at(-1)!.id},CACHE_TTL);return again();}
  await repo.enqueue(job.id,[{...task,kind:'persist',existingId:found?.id as string|undefined}]);return finish();
 }
 if(task.kind!=='persist')throw Error('Unbekannter Suchschritt');
 const ingested=await repo.ingest(listing,await repo.preferences(),job.id,{id:task.existingId});if(ingested.kind==='added')job.added++;else if(ingested.kind==='changed')job.changed++;else if(ingested.kind==='skipped')job.skipped++;else job.unchanged++;

 job.processed++;job.windowSteps=(job.windowSteps||0)+1;await repo.checkpoint(job,token,id);return {active:true,job};
 }catch(e){if(e instanceof DeferredAccess){await repo.checkpoint(job,token,id,e.until);return {active:true,job};}const message=source.name+': '+(e as Error).message;if(!job.issues.includes(message))job.issues.push(message);job.issues=job.issues.slice(-100);job.sourceStatus[source.id]={status:'failed',note:(e as Error).message};job.processed++;job.windowSteps=(job.windowSteps||0)+1;await repo.checkpoint(job,token,id);return {active:true,job};}
 }catch(e){job.issues.push('Arbeitsschritt abgebrochen: '+(e as Error).message);await repo.checkpoint(job,token);throw e;}finally{repo.budget.enforced=false;}
}
export async function advancePlatform(env:PlatformEnv){if(env.PLATFORM_SEARCH_ENABLED!=='true')throw new SearchRateLimit('Automatische Suche ist serverseitig pausiert',300);const repo=new SearchRepository(env.DB);await repo.gateAdvance();return processNext(repo,(env.TEAM_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean));}
export async function scheduledPlatform(env:PlatformEnv,date:Date){
 if(env.PLATFORM_SEARCH_ENABLED!=='true')return;
 const repo=new SearchRepository(env.DB),time=berlinTime(date);
 // Catch up on the first available tick after 09:00; DST is handled by Europe/Berlin.
 // A manual job is finished first; the daily job starts on the following available tick.
 if(Number(time.hour)>=9)await repo.requestDaily(date);
 if(!await repo.active()){const queued=await repo.nextDaily();if(queued){const daily=await repo.start('daily',date,queued.day);if(daily.id==='daily_'+queued.day)await repo.associateDaily(queued.day,daily.id);return;}}
 // Bounded technical housekeeping has its own invocation, never a long search callback.
 if(Number(time.minute)%5===0){await repo.maintenance(date);return;}
 if(await repo.active())await processNext(repo,(env.TEAM_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean),undefined,date);
}

export {platformSources};
