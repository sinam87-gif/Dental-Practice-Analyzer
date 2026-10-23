import {getChatGPTUser} from '../../chatgpt-auth';
import {read,save} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});try{return Response.json(await read())}catch{return Response.json({error:'Datenbank konnte nicht geladen werden'},{status:503})}}
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});if(req.headers.get('origin')&&new URL(req.url).origin!==req.headers.get('origin'))return new Response('Origin abgelehnt',{status:403});try{return Response.json(await save(await req.json()))}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
