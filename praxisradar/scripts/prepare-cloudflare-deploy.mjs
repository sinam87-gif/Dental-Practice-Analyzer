// Generates configuration only. Never uploads code or changes remote resources.
import fs from 'node:fs/promises';
const privatePath=process.argv[2];
const settings=privatePath?JSON.parse(await fs.readFile(privatePath,'utf8')):{accountId:process.env.CLOUDFLARE_ACCOUNT_ID,databaseId:process.env.PRAXIS_DATABASE_ID,emails:(process.env.PRAXIS_TEAM_EMAILS||'').split(',').map(s=>s.trim()).filter(Boolean),authMode:'password'};
if(!/^[a-f0-9]{32}$/i.test(settings.accountId||''))throw Error('Gueltige CLOUDFLARE_ACCOUNT_ID erforderlich');
if(!/^[a-f0-9-]{36}$/i.test(settings.databaseId||'')||settings.databaseId==='00000000-0000-4000-8000-000000000000')throw Error('Bestehende PRAXIS_DATABASE_ID erforderlich; kein Platzhalter');
if(!Array.isArray(settings.emails)||settings.emails.length!==3||new Set(settings.emails.map(e=>String(e).toLowerCase())).size!==3||settings.emails.some(e=>!/^\S+@\S+\.\S+$/.test(e)))throw Error('Genau drei unterschiedliche Teamadressen erforderlich');
if(settings.authMode&&settings.authMode!=='password')throw Error('Diese Freigabe verwendet die bestehende private Teamanmeldung');
if(settings.bucketName)throw Error('Diese Freigabe verwendet D1-Dateiablage; kein R2-Abonnement vorgesehen');
const config=JSON.parse(await fs.readFile('dist/server/wrangler.json','utf8'));
Object.assign(config,{name:'praxis-search-app',account_id:settings.accountId,workers_dev:true,preview_urls:false,d1_databases:[{binding:'DB',database_name:'praxis-search-app',database_id:settings.databaseId}],r2_buckets:[],triggers:{crons:['0 7,8 * * *']},vars:{...config.vars,DEPLOYMENT_MODE:'cloudflare',TEAM_AUTH_MODE:'password',ACCESS_TEAM_DOMAIN:'',ACCESS_AUD:'',TEAM_EMAILS:settings.emails.join(',')},assets:{...config.assets,binding:'ASSETS',run_worker_first:true},observability:{enabled:true}});
delete config.legacy_env;
await fs.writeFile('dist/server/cloudflare.wrangler.json',JSON.stringify(config,null,2),{mode:0o600});
await fs.chmod('dist/server/cloudflare.wrangler.json',0o600);
console.log('Private Build-Konfiguration erzeugt; KEIN Deployment ausgefuehrt.');
