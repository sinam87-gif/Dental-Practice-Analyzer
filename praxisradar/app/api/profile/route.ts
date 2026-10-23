import {locate} from '../../../lib/web-search';import {validateProfile} from '../../../lib/profile';
import {getChatGPTUser} from '../../chatgpt-auth';import {getProfile,setProfile} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});return Response.json(await getProfile())}
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'Bitte anmelden'},{status:401});if(req.headers.get('origin')&&new URL(req.url).origin!==req.headers.get('origin'))return new Response('Origin abgelehnt',{status:403});try{const p=validateProfile(await req.json());if(p.latitude===null){const point=await locate(p.center);p.latitude=point.latitude;p.longitude=point.longitude}return Response.json(await setProfile(p))}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
