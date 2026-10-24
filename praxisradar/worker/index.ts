import {handleTeamAuth,teamSessionRequest} from '../lib/team-auth';
import {authenticatedTeamRequest} from '../lib/access-auth';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async scheduled(controller:ScheduledController,env:Cloudflare.Env,ctx:ExecutionContext){
    if((env as unknown as {DEPLOYMENT_MODE?:string}).DEPLOYMENT_MODE!=='cloudflare')return;
    // The cron runs at 07:00 and 08:00 UTC; only 09:00 Europe/Berlin executes, including DST.
    if(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Europe/Berlin'}).format(new Date(controller.scheduledTime))!=='09')return;
    const {runDailySearch}=await import('../lib/daily-search');ctx.waitUntil(runDailySearch());
  },
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const deployment=env as unknown as {DEPLOYMENT_MODE?:string,TEAM_AUTH_MODE?:string,DB:D1Database,ACCESS_TEAM_DOMAIN?:string,ACCESS_AUD?:string,TEAM_EMAILS?:string};
    if(deployment.DEPLOYMENT_MODE==='cloudflare'){try{if(deployment.TEAM_AUTH_MODE==='password'){const auth=await handleTeamAuth(request,deployment);if(auth)return auth;if(!['GET','HEAD','OPTIONS'].includes(request.method)&&request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Origin abgelehnt',{status:403});const verified=await teamSessionRequest(request,deployment);if(!verified)return new Response(null,{status:303,headers:{Location:'/team/login','Cache-Control':'no-store'}});request=verified}else request=await authenticatedTeamRequest(request,deployment)}catch(e){return Response.json({error:(e as Error).message},{status:401,headers:{'Cache-Control':'no-store'}})}}
    const assets=(env as unknown as {ASSETS?:Fetcher}).ASSETS;
    if(assets&&['GET','HEAD'].includes(request.method)&&/\.(?:js|css|svg|png|jpe?g|ico|webp|wasm|gz|br|woff2?|ttf|map)$/.test(new URL(request.url).pathname))return assets.fetch(request);
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
