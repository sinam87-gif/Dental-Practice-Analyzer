export type CountFact={value:number|null,quote:string|null};
const words:Record<string,number>={null:0,kein:0,keine:0,keinen:0,ein:1,eine:1,einen:1,einem:1,eins:1,zwei:2,drei:3,vier:4,fünf:5,fuenf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwölf:12,zwoelf:12,dreizehn:13,vierzehn:14,fünfzehn:15,sechzehn:16,siebzehn:17,achtzehn:18,neunzehn:19,zwanzig:20};
const n='(?:\\d{1,2}|'+Object.keys(words).join('|')+')';
const number=(s:string)=>/^\d+$/.test(s)?Number(s):words[s.toLocaleLowerCase('de-DE')];
const rangeBefore=new RegExp(n+'\\s*(?:-|–|—|bis)\\s*$','i');
const future=/(?:geplant|potenzial|erweiterbar|erweiterung|bis zu|auf|für|zusätzlich|weitere)\s*(?::|von)?\s*$/i;
function unique(matches:{value:number,quote:string}[]):CountFact{const values=[...new Set(matches.map(m=>m.value))];return values.length===1?{value:values[0],quote:matches[0].quote}:{value:null,quote:null};}
export function roomCount(text:string):CountFact{
 const label='(?:Behandlungs(?:zimmer(?:n)?|räume|raeume|raum)|Beh\\.\\s*[-–]?\\s*Zimmer|BHZ|BZ)';
 const adjective='(?:(?:modern(?:e|en)?|ausgestattete[nr]?|digitalisierte[nr]?|vorhandene[nr]?|voll|hell(?:e|en)?)\\s+)';
 const re=new RegExp('\\b('+n+')\\s+(?:'+adjective+'){0,5}'+label+'\\b|\\b'+label+'\\s*[:=]\\s*('+n+')\\b','gi'),facts=[];
 for(const m of text.matchAll(re)){const before=text.slice(Math.max(0,m.index!-70),m.index),after=text.slice(m.index!+m[0].length,m.index!+m[0].length+40);if(future.test(before)||rangeBefore.test(before)||/^\s*(?:geplant|möglich|vorbereitet|vorgesehen)/i.test(after))continue;const value=number(m[1]||m[2]);if(value>=1&&value<=50)facts.push({value,quote:m[0]});}
 return unique(facts);
}
export function employedCount(text:string):CountFact{
 const dentist='(?:Zahnärzt(?:e|en|innen|in)|Zahnaerzt(?:e|en)|Zahnarzt|Zahnärztinnen\\s+und\\s+Zahnärzte)';
 const re=new RegExp('\\b('+n+')\\s+(?:fest\\s+)?angestellte(?:n|r)?\\s+'+dentist+'\\b|\\bangestellte(?:n)?\\s+'+dentist+'\\s*[:=]\\s*('+n+')\\b','gi'),facts=[];
 for(const m of text.matchAll(re)){const before=text.slice(Math.max(0,m.index!-70),m.index),after=text.slice(m.index!+m[0].length,m.index!+m[0].length+50);if(/(?:gesucht|suchen|einstellen|geplant|stellenangebot|gewünscht|sollen|für|bis zu)[^.!?\n]{0,25}$/i.test(before)||/^\s*(?:gesucht|einstellen|geplant|vorgesehen)/i.test(after)||rangeBefore.test(before))continue;const value=number(m[1]||m[2]);if(value>=0&&value<=50)facts.push({value,quote:m[0]});}
 return unique(facts);
}
