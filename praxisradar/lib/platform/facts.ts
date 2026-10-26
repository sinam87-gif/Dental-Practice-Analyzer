import {newScan,scanPart,SCAN_CHARS,MAX_CARD_CHARS,type ScanState} from './stream';
import {roomCount,employedCount} from './counts';
import {germanNumber,extractOffer,type ImportSection,type ImportResult} from '../import-offer';
import type {PublicListing,Source,Evidence} from './types';
export type PageItem={url:string,key:string,html?:string,title?:string,city?:string};
export type ListingDocument={text:string,heading:string,email:string|null,phone:string|null,name:string|null,dateAttribute:string|null,truncated?:boolean};
export type PreparedListing=ListingDocument&{parsed:ImportResult};
function dateValue(text:string):string|null{const m=text.match(/(?:Veröffentlicht(?: am)?|Inseratsdatum|Angebotsdatum|Eingestellt(?: am)?)\s*[:\n]?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i);if(!m)return null;const iso=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');const date=new Date(iso+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().startsWith(iso)&&date.getTime()<=Date.now()+86400000?iso:null;}
export function parseListingDocument(item:PageItem,document:ListingDocument&{parsed?:ImportResult},section?:ImportSection){if(document.parsed?.offer.title==='Mehrere Angebote im Dokument')return {...document,parsed:document.parsed};const parsed=extractOffer(document.text,item.url,item.url,{section,previous:document.parsed});return {...document,parsed:section?{...parsed,text:'',source:'',warnings:[]}:parsed};}
/** The automatic pipeline never builds a DOM for a complete card or page. */
export function readCompactListingDocument(source:Source,item:PageItem,html:string){
 if(html.length>MAX_CARD_CHARS)throw Error('Inseratsabschnitt überschreitet das Parserbudget');
 let state=newScan();for(let offset=0;offset<html.length;offset+=SCAN_CHARS){state=scanPart(source,item.url,state,html.slice(offset,offset+SCAN_CHARS),true,offset+SCAN_CHARS>=html.length,false).state;}
 return documentFromScan(source,item,state);
}
export function documentFromScan(source:Source,item:PageItem,state:ScanState){
 const text=decodeText(state.text).replace(/[ \t\u00a0]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 if(text.length<60||!/zahn(?:arzt|ärzt|medizin|heil)|dental|\bKFO\b|\bMKG\b/i.test(text))return null;
 const email=text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0]||null;
 const phone=text.match(/(?:Telefon|Tel\.?|Mobil)\s*:?\s*([+\d][\d ()/.-]{6,30}\d)/i)?.[1]||null;
 const name=text.match(/(?:Kontaktperson|Ansprechpartner(?:in)?)\s*:\s*([^\n]{3,80})/i)?.[1]||null;
 return {text,heading:decodeText(state.heading).replace(/\s+/g,' ').trim(),email,phone,name,dateAttribute:state.dateAttribute||null,truncated:state.truncated};
}
const decodeText=(value:string)=>value.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos|nbsp|auml|ouml|uuml|Auml|Ouml|Uuml|szlig|euro|ndash|mdash|thinsp|ensp|emsp);/g,(all,name)=>{if(name[0]==='#'){const n=name[1]==='x'?parseInt(name.slice(2),16):Number(name.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):all;}return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß',euro:'€',ndash:'–',mdash:'—',thinsp:' ',ensp:' ',emsp:' '} as Record<string,string>)[name]||all;});
const simpleText=(value:string)=>decodeText(value.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
export function cardItem(source:Source,html:string,url:string):PageItem|null{
 const root=html.match(/^\s*<div\b[^>]{0,4096}>/i)?.[0],id=root?.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];if(!id)return null;
 if(source.adapter==='dentoffert'){const title=simpleText(html.match(/<h3\b[^>]*>([\s\S]{0,2000}?)<\/h3>/i)?.[1]||'');if(!/^listing-\d+$/.test(id)||!/^Biete\s+Praxis/i.test(title))return null;return {url:new URL('/inserate/single/'+id.replace('listing-',''),url).href,key:id,title};}
 if(source.adapter==='rlp'){const headings=[...html.matchAll(/<h1\b[^>]*>([\s\S]{0,2000}?)<\/h1>/gi)].map(m=>simpleText(m[1]));if(!headings.includes('Praxisdaten'))return null;const city=headings[0];return {url:url+'#'+id,key:id,city:city||undefined,title:city?city+' · Praxisabgabe':undefined};}
 return null;
}
export function extractPreparedListing(source:Source,item:PageItem,document:PreparedListing,observedAt=new Date().toISOString()):PublicListing|null{
 const {text,parsed,heading,email,phone,name}=document;const sold=/\b(?:bereits verkauft|Status\s*:\s*verkauft|nicht mehr verfügbar)\b/i.test(text);
 if(!/übernahm|übernehm|verkauf|praxisabgab|nachfolg|abzugeben|miteinstieg|beteiligung/i.test(text+' '+(source.adapter==='rlp'?'Praxisabgabe':'')))return null;
 if(/^\s*Suche\s+(?:eine?\s+)?Praxis/i.test(item.title||''))return null;const o=parsed.offer;if(o.title==='Mehrere Angebote im Dokument'||o.kind==='Neugründung'||/reine?\s+(?:Praxis)?räume|nur\s+(?:Praxis)?räume|Neugründungsfläche/i.test(text))return null;
 o.title=(item.title||heading||o.title||'Zahnarztpraxis · '+source.name).slice(0,300);o.city=item.city||o.city||'Unbekannt';o.url=item.url;o.kind=/beteiligung|miteinstieg|praxisanteil/i.test(text)?'Beteiligung':'Übernahme';o.stage='inbox';o.checkedAt=observedAt;

 const evidence:Evidence[]=parsed.findings.map(f=>({field:f.field,value:(o as any)[f.field],quote:f.quote.slice(0,240),url:item.url,observedAt})).filter(e=>e.value!==null&&e.value!==undefined);

 const amount='(-?[0-9][0-9.,]*(?:\\s*(?:Mio\\.?|Millionen?|Tsd\\.?|Tausend|k))?)';
 for(const [field,label] of [['price','Kaufpreis|Preisvorstellung|Übernahmepreis|Preis'],['revenue','Jahresumsatz|Umsatz'],['profit','Jahresgewinn|Jahresüberschuss|Gewinn|EBITDA']] as const){
  const patterns=[new RegExp('(?:'+label+')\\b\\s*[:=]?\\s*(?:ca\\.?\\s*)?(?:€\\s*)?'+amount,'gi'),new RegExp(amount+'[ \t]*(?:€|EUR)?[ \t]*(?:'+label+')\\b','gi')];
  const matches=patterns.flatMap(re=>[...text.matchAll(re)]).filter(m=>!/(?:Potenzial|geplant|erwartet|möglich)\s*$/i.test(text.slice(Math.max(0,m.index!-35),m.index)));
  const values=[...new Set(matches.map(m=>(m[1].startsWith('-')?-1:1)*germanNumber(m[1].replace(/^-/,''))).filter(v=>Number.isFinite(v)&&(field==='profit'||v>=0)))];
  if(matches.length){(o as any)[field]=values.length===1?values[0]:null;for(let i=evidence.length-1;i>=0;i--)if(evidence[i].field===field)evidence.splice(i,1);if(values.length===1)evidence.push({field,value:values[0],quote:matches[0][0],url:item.url,observedAt});}
 }
 const one=(field:string,re:RegExp)=>{const m=text.match(re);if(!m)return null;const value=Number(m[1]||m[2]);evidence.push({field,value,quote:m[0].slice(0,240),url:item.url,observedAt});return value;};
 // An employed dentist count is NOT the total practitioner count.
 const room=roomCount(text);o.rooms=room.value;for(let i=evidence.length-1;i>=0;i--)if(evidence[i].field==='rooms')evidence.splice(i,1);if(room.value!==null)evidence.push({field:'rooms',value:room.value,quote:room.quote!,url:item.url,observedAt});
 const employeeFact=employedCount(text),employed=employeeFact.value;if(employed!==null)evidence.push({field:'employedDentists',value:employed,quote:employeeFact.quote!,url:item.url,observedAt});
 const total=text.match(/(?:insgesamt|gesamt)\s*:?\s*(\d{1,2})\s*(?:Zahnärzte|Behandler)(?!\w)|(?:Behandler(?:zahl)?|Zahnärzte gesamt)\s*:\s*(\d{1,2})/i);if(total){o.practitioners=Number(total[1]||total[2]);evidence.push({field:'practitioners',value:o.practitioners,quote:total[0],url:item.url,observedAt});}else if(employed!==null)o.practitioners=null;
 if(o.practitioners===null&&/Einbehandlerpraxis/i.test(text))o.practitioners=1;
 const closed=/Praxis[^.!?\n]{0,100}(?:ist|wurde)[^.!?\n]{0,60}geschlossen|Betrieb[^.!?\n]{0,100}(?:ist|wurde)[^.!?\n]{0,60}eingestellt|(?:krankheitsbedingt|vorübergehend)\s+geschlossen/i.test(text);
 const running=closed?false:/laufende[rn]?\s+(?:Betrieb|Praxis)|laufenden Betrieb|etablierte[nr]?\s+(?:Zahnarzt)?praxis|langjährig.{0,30}(?:Praxis|Patientenstamm)|umsatzstark|gewinnstark/i.test(text)?true:/Betrieb.{0,20}eingestellt|Praxis.{0,20}geschlossen/i.test(text)?false:null;
 if(running!==null)evidence.push({field:'running',value:running,quote:text.match(/.{0,35}(?:laufend|etabliert|langjährig|umsatzstark|gewinnstark|eingestellt|geschlossen).{0,90}/i)?.[0]||'',url:item.url,observedAt});
 const labeledReference=text.match(/\b(?:Inserat(?:snummer|-Nr\.?)?|Chiffre|Angebotsnummer|Referenz(?:nummer)?|Objekt(?:nummer|-Nr\.?))\s*[:#]?\s*([A-Z0-9][A-Z0-9_-]{1,35})\b/i)?.[1];const reference=labeledReference&&/\d/.test(labeledReference)?labeledReference:text.match(/\(#\s*(\d{2,12})\)/)?.[1];delete o.reference;for(let i=evidence.length-1;i>=0;i--)if(evidence[i].field==='reference')evidence.splice(i,1);if(reference&&/\d/.test(reference)){o.reference=reference;evidence.push({field:'reference',value:reference,quote:reference,url:item.url,observedAt});}
 let publishedAt=dateValue(text);if(!publishedAt){const date=document.dateAttribute;if(date&&/^\d{4}-\d{2}-\d{2}/.test(date)&&Number.isFinite(Date.parse(date))&&Date.parse(date)<=Date.now()+86400000)publishedAt=date.slice(0,10);}
 if(publishedAt)evidence.push({field:'publishedAt',value:publishedAt,quote:publishedAt,url:item.url,observedAt});for(const [field,value] of Object.entries({email,phone,name}))if(value)evidence.push({field:'contact.'+field,value,quote:value,url:item.url,observedAt});
 o.notes='Öffentliches Inserat, automatisch erkannt; Angaben ungeprüft. Quelle: '+source.name+'. Fehlende Angaben bleiben unbekannt.';return {offer:o,sourceId:source.id,externalKey:item.key,sourceURLs:[item.url],publishedAt,contact:{name,email,phone},employees:one('employees',/(\d{1,3})\s+(?:Mitarbeiter(?:innen)?|Beschäftigte)/i),employedDentists:employed,multiPractitioner:/Mehrbehandler|Gemeinschaftspraxis/i.test(text)?true:o.practitioners!==null?o.practitioners>=2:employed!==null&&employed>=2?true:null,running,evidence:evidence.filter(e=>e.field!=='practitioners'||o.practitioners!==null),verifiedAt:observedAt,publicationUnknown:publishedAt===null,availability:sold?'sold':'available'};
}
