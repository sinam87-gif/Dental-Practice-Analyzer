import {runDailySearch} from '../../../lib/daily-search';
import {normalizeDailyRun} from '../../../lib/search-status';
import {env} from 'cloudflare:workers';
import {getSetting} from '../../../lib/store';
import {getChatGPTUser} from '../../chatgpt-auth';
import {getDiscovery,discoverSources,decideSource,seedSources,proposeSources} from '../../../lib/source-discovery';
export const dynamic='force-dynamic';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});return Response.json({...await getDiscovery(),schedule:{cloud:(env as unknown as {DEPLOYMENT_MODE?:string}).DEPLOYMENT_MODE==='cloudflare',lastRun:normalizeDailyRun(await getSetting('cloud-daily-search',null))}})}
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});if(req.headers.get('origin')&&new URL(req.url).origin!==req.headers.get('origin'))return Response.json({error:'Origin abgelehnt'},{status:403});try{const body:any=await req.json();if(body.action==='daily'){const lastRun=await runDailySearch();return Response.json({...await getDiscovery(),schedule:{cloud:(env as unknown as {DEPLOYMENT_MODE?:string}).DEPLOYMENT_MODE==='cloudflare',lastRun}})}if(body.action==='propose')return Response.json(await proposeSources(body.items));if(body.action==='seed')return Response.json({profile:await seedSources()});if(body.action==='discover')return Response.json(await discoverSources());if(['approve','reject'].includes(body.action)&&typeof body.id==='string')return Response.json(await decideSource(body.id,body.action));throw Error('Unbekannte Quellenaktion')}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
