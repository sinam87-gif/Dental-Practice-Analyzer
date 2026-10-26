/** Five of the Free plan's 50 subrequests remain for auth/runtime and settlement. */
export class InvocationBudget{
 calls=0;sql=0;network=0;rowsRead=0;rowsWritten=0;usageAvailable=false;enforced=false;settlement=false;
 reset(){this.calls=0;this.sql=0;this.network=0;this.rowsRead=0;this.rowsWritten=0;this.usageAvailable=false;this.enforced=true;}
 observe(result:any){const meta=result?.meta;if(typeof meta?.rows_read==='number'&&typeof meta?.rows_written==='number'){this.usageAvailable=true;this.rowsRead+=meta.rows_read;this.rowsWritten+=meta.rows_written;}}
 spend(kind:'sql'|'network',n=1){if(this.enforced&&this.calls+n>(this.settlement?45:42))throw Error('Free-Sicherheitsbudget dieses Arbeitsschritts erreicht');this.calls+=n;this[kind]+=n;}
}
// Prototype methods avoid allocating Proxy handlers and closures for every bound query.
class MeteredStatement{
 constructor(readonly statement:D1PreparedStatement,private budget:InvocationBudget){}
 bind(...values:unknown[]){return new MeteredStatement(this.statement.bind(...values),this.budget);}
 async first(column?:string){this.budget.spend('sql');const result=await this.statement.all();this.budget.observe(result);const row=result.results[0];return column?(row as any)?.[column]??null:row??null;}
 async all(){this.budget.spend('sql');const result=await this.statement.all();this.budget.observe(result);return result;}
 async run(){this.budget.spend('sql');const result=await this.statement.run();this.budget.observe(result);return result;}
 async raw(...args:any[]){this.budget.spend('sql');return (this.statement.raw as any)(...args);}
}
export function budgetDatabase(db:D1Database,budget:InvocationBudget):D1Database{
 return new Proxy(db,{get(target,key){
  if(key==='prepare')return(query:string)=>new MeteredStatement(target.prepare(query),budget) as unknown as D1PreparedStatement;
  if(key==='batch')return async(list:D1PreparedStatement[])=>{budget.spend('sql',list.length);const results=await target.batch(list.map(s=>(s as unknown) instanceof MeteredStatement?(s as unknown as MeteredStatement).statement:s));for(const result of results)budget.observe(result);return results;};
  if(key==='exec')return()=>{throw Error('Unbegrenzte SQL-Ausführung in Suchschritten nicht erlaubt')};
  const value=(target as any)[key];return typeof value==='function'?value.bind(target):value;
 }});
}
