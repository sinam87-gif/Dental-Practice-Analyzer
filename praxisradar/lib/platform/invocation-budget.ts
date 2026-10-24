/** Reserve six of the Free plan's 50 subrequests for authentication/runtime. */
export class InvocationBudget{
 calls=0;sql=0;network=0;enforced=false;settlement=false;
 reset(){this.calls=0;this.sql=0;this.network=0;this.enforced=true;}
 spend(kind:'sql'|'network',n=1){if(this.enforced&&this.calls+n>(this.settlement?44:42))throw Error('Free-Sicherheitsbudget dieses Arbeitsschritts erreicht');this.calls+=n;this[kind]+=n;}
}
export function budgetDatabase(db:D1Database,budget:InvocationBudget):D1Database{
 const raw=new WeakMap<object,D1PreparedStatement>();
 const wrap=(statement:D1PreparedStatement):D1PreparedStatement=>{const proxy=new Proxy(statement,{get(target,key){if(key==='bind')return(...args:unknown[])=>wrap(target.bind(...args));if(['first','all','run','raw'].includes(String(key)))return(...args:unknown[])=>{budget.spend('sql');return (target as any)[key](...args)};const value=(target as any)[key];return typeof value==='function'?value.bind(target):value;}});raw.set(proxy,statement);return proxy;};
 return new Proxy(db,{get(target,key){if(key==='prepare')return(query:string)=>wrap(target.prepare(query));if(key==='batch')return(list:D1PreparedStatement[])=>{budget.spend('sql',list.length);return target.batch(list.map(s=>raw.get(s)||s));};if(key==='exec')return()=>{throw Error('Unbegrenzte SQL-Ausführung in Suchschritten nicht erlaubt')};const value=(target as any)[key];return typeof value==='function'?value.bind(target):value;}});
}
