// Reuse one formatter per isolate; never infer DST from a fixed UTC offset.
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
export function berlinTime(date:Date){return Object.fromEntries(formatter.formatToParts(date).map(part=>[part.type,part.value]));}
export function berlinDay(date:Date){const p=berlinTime(date);return p.year+'-'+p.month+'-'+p.day;}
