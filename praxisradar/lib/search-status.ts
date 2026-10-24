export type SearchStatus='running'|'completed'|'partial'|'failed'|'unknown';
export type DailyRun={status?:string,finishedAt?:string,issues?:string[],discovery?:{lastStatus?:string},offers?:{run?:{status?:string}}};
// Also interpret older records whose overall status incorrectly says completed.
// This function never changes stored data or starts a search.
export function dailySearchStatus(run:DailyRun):SearchStatus{
 if(run.status==='running'&&!run.finishedAt)return 'running';
 const stages=[run.discovery?.lastStatus,run.offers?.run?.status];
 if(run.status==='failed'||run.issues?.length||stages.includes('failed'))return 'failed';
 if(run.status==='partial'||stages.includes('partial'))return 'partial';
 if(stages.every(s=>s==='completed'))return 'completed';
 return 'unknown';
}
export function normalizeDailyRun<T extends DailyRun>(run:T|null):(T&{status:SearchStatus})|null{
 return run?{...run,status:dailySearchStatus(run)}:null;
}
export function searchStatusLabel(status?:string){
 switch(status){case 'completed':return 'Abgeschlossen';case 'partial':return 'Teilweise erfolgreich';case 'failed':return 'Mit Fehlern';case 'running':return 'Läuft';default:return 'Status unvollständig';}
}
