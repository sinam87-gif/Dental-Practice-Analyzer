import {offerName} from './offer-name';
import {blank,type Offer} from './model';
export type Finding={field:string,label:string,value:string,quote:string};
export type ImportResult={offer:Offer,findings:Finding[],warnings:string[],text:string,source:string};
export function germanNumber(s:string){let v=s.trim().replace(/\s|€|EUR/gi,'');const multi=/mio|million/i.test(v)?1e6:/tsd|tausend|t€|k\b/i.test(v)?1e3:1;v=v.replace(/mio\.?|million(?:en)?|tsd\.?|tausend|t€|k\b/gi,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,'');return Number(v)*multi}
const numberFormat=new Intl.NumberFormat('de-DE');
const labels:Record<string,string>={title:'Titel',city:'Ort / Region',address:'Adresse',rooms:'Vorhandene Behandlungsräume',distance:'Entfernung',price:'Kaufpreis',revenue:'Jahresumsatz',profit:'Jahresgewinn / EBITDA',investment:'Investitionsbedarf',practitioners:'Behandler',staying:'Verbleibende Behandler',lab:'Eigenlabor',reason:'Verkaufsgrund',kind:'Angebotsart',reference:'Inserat-Referenz',demand:'Patientennachfrage',competition:'Konkurrenz'};
export type ImportSection='identity'|'rooms'|'financial'|'team'|'business';
export function extractOffer(raw:string,source='Eingefügter Text',url='',options:{section?:ImportSection,previous?:ImportResult}={}):ImportResult {
const text=raw.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\r/g,'').trim().slice(0,160000),o=options.previous?{...options.previous.offer}:blank(),findings:Finding[]=options.previous?.findings.slice()||[],warnings:string[]=options.previous?.warnings.slice()||[];o.url=url;o.checkedAt=new Date().toISOString();
function set(field:string,value:any,quote:string){(o as any)[field]=value;const previous=findings.findIndex(f=>f.field===field);if(previous>=0)findings.splice(previous,1);findings.push({field,label:labels[field]||field,value:typeof value==='number'?numberFormat.format(value):String(value),quote:quote.trim().slice(0,400)})}
function first(field:string,re:RegExp,numeric=false){const m=text.match(re);if(m&&m[1]!==undefined){const v=numeric?germanNumber(m[1]):m[1].trim();if(v!==''&&(!numeric||Number.isFinite(v)))set(field,v,m[0])}}
if(!options.section||options.section==='identity'){
const title=text.split('\n').map(x=>x.trim()).find(x=>/zahnarzt|zahnärzt|dental|praxis/i.test(x)&&x.length>12&&x.length<180&&!/cookie|datenschutz|navigation|©|copyright|vertraulich|seite \d/i.test(x));o.title=title||'Importiertes Praxisangebot';if(title)set('title',title,title);
const references=[...text.matchAll(/(?:Objekt[ -]?(?:Nr\.?|nummer)|Inserat[ -]?(?:ID|Nr\.?)|Expose[ -]?(?:Nr\.?|nummer)|Exposé[ -]?(?:Nr\.?|nummer))\s*[:#.]?\s*([A-Z0-9][A-Z0-9_-]{2,40})/gi)].map(m=>m[1]);if(new Set(references).size>1){return {offer:{...blank(),title:'Mehrere Angebote im Dokument',kind:'Unbekannt',url},findings:[],warnings:['Mehrere Inserat-Referenzen erkannt. Bitte das einzelne Praxisangebot oder dessen Exposé importieren, damit Daten verschiedener Praxen nicht vermischt werden.'],text,source}}
first('reference',/(?:Expose[ -]?(?:Nr\.?|nummer)|Exposé[ -]?(?:Nr\.?|nummer)|Objekt[ -]?(?:Nr\.?|nummer)|Inserat[ -]?(?:ID|Nr\.?)|Referenz)\s*[:#.]?\s*([A-Z0-9][A-Z0-9_-]{2,40})/i);
const titleCity=title?.match(/(?:im Raum|in|Raum)\s+(.+?)(?:\s+zu\s+|\s+mit\s+|[:–—]|$)/i);if(titleCity)set('city',titleCity[1].trim(),title!);
if(!o.city)first('city',/(?:Standort|Ort|Stadt|Region|Lage)\s*[:]\s*([^\n|;]{2,80})/i);
if(!o.city){const cities=['Köln','Cologne','Bonn','Düsseldorf','Leverkusen','Bergisch Gladbach','Neuss','Solingen','Wuppertal','Waldbröl','Eschweiler','Aachen','Siegburg','Troisdorf','Bergheim','Hürth','Brühl','Frechen','Pulheim','Gummersbach','Düren','Bergneustadt','Mönchengladbach','Remscheid'];const headline=text.split('\n').slice(0,5).join(' ');const found=cities.filter(c=>new RegExp('\\b'+c+'\\b','i').test(headline));if(found.length===1)set('city',found[0],headline.slice(0,300));else warnings.push('Ort nicht eindeutig erkannt. Bitte ergänzen.');}
first('address',/(?:Adresse|Anschrift)\s*:\s*([^\n]{5,140})/i);
}
if(!options.section||options.section==='rooms'){
const roomMatches=[...text.matchAll(/(?:(?<![\d.,])([0-9]{1,2})[ \t]*(?:voll\s+ausgestattete[nr]?\s+|vorhandene[nr]?\s+)?(?:Behandlungs(?:zimmern?|räume|raeume|raum)(?:praxis)?|BHZ)\b|(?:Behandlungs(?:zimmer|räume|raeume)|BHZ)(?:\s*\(ist\))?\s*[:=]\s*([0-9]{1,2})(?![\d.,]))/gi)];
const existing=roomMatches.filter(m=>!/(?:auf|bis\s+zu|für|fuer|max\.?|geplant|erweiterbar|vorbereitet|potenzial|möglich|moeglich)\s*$/i.test(text.slice(Math.max(0,m.index!-45),m.index))&&!/^\s*(?:geplant|vorbereitet|möglich|moeglich|maximal)/i.test(text.slice(m.index!+m[0].length,m.index!+m[0].length+30)));
const primaryRooms=existing.some(m=>m[2])?existing.filter(m=>m[2]):existing;const counts=[...new Set(primaryRooms.map(m=>Number(m[1]||m[2])))];if(counts.length===1)set('rooms',counts[0],primaryRooms[0][0]);else if(counts.length>1)warnings.push('Widersprüchliche Raumanzahlen. Keine Raumanzahl übernommen.');else warnings.push('Anzahl vorhandener Behandlungsräume nicht sicher erkannt. Ausbauoptionen zählen nicht.');
}
if(!options.section||options.section==='financial'){
const amount='([0-9][0-9. ,]*(?:\\s*(?:Mio\\.?|Millionen?|Tsd\\.?|Tausend|k))?)';
for(const [field,aliases] of [['price','Kaufpreis|Angebotspreis|Preisvorstellung|Übernahmepreis'],['revenue','Jahresumsatz|Umsatz pro Jahr|Umsatz p\\.?a\\.?|Umsatzdurchschnitt'],['profit','bereinigtes EBITDA|Jahresüberschuss|Jahresgewinn|Gewinn pro Jahr|EBITDA'],['investment','Investitionsbedarf|Investitionsstau|Umbaukosten']] as const){first(field,new RegExp('(?:'+aliases+')\\s*(?:\\([^\\n)]{0,30}\\))?\\s*[:=]?\\s*(?:ca\\.?\\s*|rund\\s*)?(?:€\\s*|EUR\\s*)?'+amount+'\\s*(?:€|EUR|Euro)?','i'),true)}
}
if(!options.section||options.section==='team'){
first('practitioners',/(?:([0-9]{1,2})\s*(?:angestellte[nr]?\s+)?(?:Zahnärzt(?:e|innen)|Zahnärztinnen und Zahnärzte|Zahnaerzte|Behandler(?:innen)?)(?!\w)|(?:Behandler(?:innen)?|Zahnärzt(?:e|innen))\s*:\s*([0-9]{1,2}))/i,true);
// A label-first count uses the second capture group.
if(o.practitioners===null){const m=text.match(/(?:Behandler(?:innen)?|Zahnärzt(?:e|innen))\s*:\s*([0-9]{1,2})/i);if(m)set('practitioners',Number(m[1]),m[0])}
first('staying',/(?:([0-9]{1,2})\s*(?:Behandler(?:innen)?|Zahnärzt(?:e|innen))\s*(?:werden\s+)?(?:weiterarbeiten|bleiben|verbleiben)|(?:verbleibende Behandler|davon verbleibend)\s*:\s*([0-9]{1,2}))/i,true);
if(o.staying===null){const m=text.match(/(?:verbleibende Behandler|davon verbleibend)\s*:\s*([0-9]{1,2})/i);if(m)set('staying',Number(m[1]),m[0])}
if(o.staying!==null&&o.practitioners!==null&&o.staying>o.practitioners){o.staying=null;warnings.push('Widersprüchliche Behandlerzahlen. Verbleib bitte prüfen.');}
}
if(!options.section||options.section==='business'){
const labNo=text.match(/(?:kein(?:e[nrs]?)?\s+(?:Eigenlabor|Praxislabor|eigenes Labor)|(?:Eigenlabor|Praxislabor|Labor)\s*:?\s*(?:Nein|nicht vorhanden))/i),labYes=text.match(/(?:Eigenlabor|Praxislabor|eigenes Labor)(?:\s*:\s*(?:ja|vorhanden))?/i);if(labNo)set('lab','Nein',labNo[0]);else if(labYes){const context=text.slice(Math.max(0,labYes.index!-25),labYes.index!+labYes[0].length+50);if(/optional|möglich|moeglich|geplant|potenzial|nicht vorhanden/i.test(context))warnings.push('Eigenlabor nur als Option genannt; Status bleibt unbekannt.');else set('lab','Ja',context)}
first('reason',/(?:Verkaufsgrund|Abgabegrund|Grund der (?:Abgabe|Veräußerung))\s*:\s*([^\n.]{3,200})/i);if(!o.reason){const m=text.match(/(?:Abgabe|Verkauf|Übergabe|Praxisabgabe)\s+(?:erfolgt\s+)?aus\s+(Altersgründen|gesundheitlichen Gründen|familiären Gründen)/i);if(m)set('reason',m[1],m[0])}
if(/(?:Neugründungs(?:fläche|objekt)|Praxis\s+(?:zur|für)\s+Neugründung)/i.test(text))set('kind','Neugründung',text.match(/.{0,20}(?:Neugründungs(?:fläche|objekt)|Praxis\s+(?:zur|für)\s+Neugründung).{0,50}/i)![0]);else if(/Praxisanteil|Anteilsverkauf|Beteiligung/i.test(text))set('kind','Beteiligung',text.match(/.{0,20}(?:Praxisanteil|Anteilsverkauf|Beteiligung).{0,50}/i)![0]);else if(/Übernahme|Praxisverkauf|Praxisabgabe|Praxis.{0,40}(?:verkaufen|abzugeben)/i.test(text))set('kind','Übernahme','Als Übernahme / Praxisverkauf beschrieben');else{o.kind='Unbekannt';warnings.push('Angebotsart bitte bestätigen.');}
for(const [field,re] of [['demand',/(?:Patientenstamm|Patientennachfrage|Auslastung|Scheine pro Quartal|Warteliste)[^\n]{0,230}/i],['competition',/(?:Wettbewerb|Konkurrenz|Versorgungslage)[^\n]{0,230}/i]] as const){const m=text.match(re);if(m)set(field,'Laut Angebot, nicht unabhängig geprüft: '+m[0],m[0])}
const named=text.match(/(?:Praxisname|Name der Praxis)\s*:\s*([^\n]{3,140})/i);if(named)set('title',named[1].trim(),named[0]);
}
o.notes='Automatisch importiert aus: '+source+'\nAlle extrahierten Angaben vor Speicherung prüfen.\n\nBelege:\n'+findings.map(f=>f.label+': '+f.quote).join('\n');
warnings.push('Inseratsangaben sind ungeprüft. Verbleibsabsichten müssen bestätigt werden. Entfernung, Standortanalyse und Bewertungen werden nicht aus Ortsnamen erfunden.');if(!findings.length)warnings.unshift('Keine Praxisangaben sicher erkannt. Anderes Dokument oder lesbaren Text verwenden.');
o.title=offerName(o);return {offer:o,findings,warnings:[...new Set(warnings)],text,source};}
