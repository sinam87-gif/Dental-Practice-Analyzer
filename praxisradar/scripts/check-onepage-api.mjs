import assert from 'node:assert/strict';
const base=process.env.PRAXIS_TEST_BASE_URL;
if(!base||new URL(base).hostname!=='127.0.0.1')throw Error('PRAXIS_TEST_BASE_URL muss auf eine isolierte lokale Testinstanz zeigen');
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'}),cookie=login.headers.get('set-cookie').split(';')[0];
async function call(path,method='GET',data){const r=await fetch(base+path,{method,headers:{cookie,Origin:base,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const j=await r.json();assert(r.ok,JSON.stringify(j));return j;}
const before=await call('/api/offers'),p=before.profile,id='qa-onepage-test-'+crypto.randomUUID();let created=false;
try{
 await call('/api/profile','POST',{...p,radius:66,minRooms:8});
 assert.equal((await call('/api/offers')).profile.radius,66);
 await call('/api/profile','POST',p);
 const o={id,title:'QA Eingangsangebot',city:'Köln',rooms:8,distance:20};
 await call('/api/update','POST',{action:'upsert',offer:o});created=true;
 let row=(await call('/api/offers')).offers.find(x=>x.id===id);assert.equal(row.stage,'inbox');
 await call('/api/offers','PATCH',{id,stage:'accepted'});
 await call('/api/offers','PATCH',{id,stage:'accepted',title:'QA Umbenannt'});
 row=(await call('/api/offers')).offers.find(x=>x.id===id);assert.equal(row.title,'QA Umbenannt');
 await call('/api/offers','PATCH',{id,stage:'deleted'});
 assert.equal((await call('/api/offers')).offers.find(x=>x.id===id).stage,'deleted');
 await call('/api/offers','PATCH',{id,stage:'accepted'});
 assert.equal((await call('/api/offers')).offers.find(x=>x.id===id).stage,'accepted');
 console.log('PASS: Profil speichern/wiederherstellen, Eingang, Annehmen, Umbenennen, reversibles Löschen und Wiederherstellen; eigene eindeutige Testkennung');
}finally{
 await call('/api/profile','POST',p);
 if(created)await call('/api/offers','PATCH',{id,stage:'deleted'});
}
