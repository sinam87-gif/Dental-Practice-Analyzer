import {haversine} from '../profile';import type {PublicListing,Scoring,SearchPreferences} from './types';
export function scoreListing(l:PublicListing,p:SearchPreferences,now=Date.now()):Scoring{const o=l.offer,d=o.latitude!=null&&o.longitude!=null?Math.round(haversine(p.latitude,p.longitude,o.latitude,o.longitude)*10)/10:null;const reasons:Scoring['reasons']=[],unknown:string[]=[];let coverage=0;
 function add(criterion:string,max:number,value:number|null,reason:string){reasons.push({criterion,max,points:value??0,reason});if(value===null)unknown.push(criterion+' unbekannt');else coverage+=max;}
 add('Standort',20,d===null?null:d<=p.radius?20:0,d===null?'Kein belegbarer Standort; nicht als innerhalb des Radius gewertet':d<=p.radius?d+' km innerhalb von '+p.radius+' km':d+' km außerhalb des Suchradius');
 add('Behandlungszimmer',25,o.rooms===null?null:o.rooms>=p.preferredRooms?25:Math.round(12*o.rooms/p.preferredRooms),o.rooms===null?'Nicht veröffentlicht':o.rooms>=p.preferredRooms?'Bevorzugte Größe erreicht':o.rooms+' vorhandene Zimmer; weniger als bevorzugt, kein Ausschluss');
 const multi=l.multiPractitioner===true||o.practitioners!==null&&o.practitioners>=2;
 add('Mehrbehandlerpraxis',13,l.multiPractitioner===null&&o.practitioners===null?null:multi?13:0,multi?'Mehrbehandlerstatus belegt; Gesamtzahl '+(o.practitioners??'unbekannt'):(o.practitioners===null?'Nicht veröffentlicht':o.practitioners+' Behandler'));
 add('Angestellte Zahnärzte',12,l.employedDentists===null?null:l.employedDentists>=1?12:0,(l.employedDentists??'Unbekannt')+' angestellte Zahnärzte; Verbleib '+(o.staying??'unbekannt'));
 add('Laufender Betrieb',15,l.running===null?null:l.running?15:0,l.running===null?'Betriebsstatus unbekannt':l.running?'Laufende etablierte Praxis belegt':'Kein laufender Betrieb belegt');
 add('Gewinnangabe',7,o.profit===null?null:o.profit>0?7:0,o.profit===null?'Gewinn nicht veröffentlicht':'Veröffentlichte Gewinnangabe; keine geprüfte Wertermittlung');
 add('Umsatzangabe',3,o.revenue===null?null:o.revenue>0?3:0,o.revenue===null?'Umsatz nicht veröffentlicht':'Veröffentlichte Umsatzangabe; keine Prüfung der Abschlüsse');
 const age=l.publishedAt?(now-Date.parse(l.publishedAt))/86400000:null;add('Inseratsdatum',5,age===null?null:age>=0&&age<=90?5:0,l.publishedAt??'Angebotsdatum unbekannt; Erstsichtung ist kein Inseratsdatum');
 const points=reasons.reduce((s,r)=>s+r.points,0);const attractive=points>=p.outsideScore&&o.rooms!==null&&o.rooms>=p.preferredRooms&&multi&&(l.employedDentists??0)>=1&&l.running===true&&(o.profit??0)>0;
 const bucket:Scoring['bucket']=d===null?'unverified':d<=p.radius?'nearby':p.includeOutside&&attractive?'outside':'other';return {points,coverage,bucket,reasons,unknown,distance:d,eligible:l.availability!=='sold'&&o.kind!=='Neugründung'&&(bucket==='nearby'&&points>=p.minScore||bucket==='outside')};
}
