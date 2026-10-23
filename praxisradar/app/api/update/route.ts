// Only for this owner-private Site. Sites dispatch authenticates service access.
// Do not expose publicly or change the audience without adding writer authorization.
import {read,save,recordRun} from '../../../lib/store';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(await read())}
export async function POST(req:Request){try{const body:any=await req.json();if(body.action==='upsert')return Response.json(await save(body.offer,'search'));if(body.action==='run')return Response.json(await recordRun(body.run));return Response.json({error:'Unbekannte Aktion'},{status:400})}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
