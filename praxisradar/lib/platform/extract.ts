// DOM compatibility is used only by manual/legacy import and public-source test helpers.
// The automatic Worker imports facts.ts directly, without Cheerio or entity tables.
import {load} from 'cheerio/slim';
import {parseListingDocument,extractPreparedListing,type PageItem,type PreparedListing} from './facts';
import type {PublicListing,Source} from './types';
export {parseListingDocument,readCompactListingDocument,documentFromScan,cardItem} from './facts';
export type {PageItem,PreparedListing} from './facts';
export function publicText(html:string){const $=load(html);$('script,style,noscript,iframe,form,nav,footer,aside').remove();$('br').replaceWith('\n');$('p,div,li,tr,h1,h2,h3,h4,dt,dd').append('\n');return {text:($('main').length?$('main').text():$('body').length?$('body').text():$.root().text()).replace(/[ \t\u00a0]+/g,' ').replace(/\n\s*\n/g,'\n').trim().slice(0,80000),$};}
export function pageItems(source:Source,html:string,url:string):{items:PageItem[],next:string[]}{const $=load(html),items:PageItem[]=[];
 if(source.adapter==='dentoffert'){$('.card-listing[id]').each((_,el)=>{const card=$(el),id=card.attr('id')||'',title=card.find('h3').first().text().trim();if(!/^Biete\s+Praxis/i.test(title))return;items.push({url:new URL('/inserate/single/'+id.replace('listing-',''),url).href,key:id,html:$.html(el).slice(0,50000),title});});}
 else if(source.adapter==='rlp'){$('.kzv-colwrap[id]').each((_,el)=>{const node=$(el);if(!node.find('h1').toArray().some(h=>$(h).text().trim()==='Praxisdaten'))return;const id=node.attr('id')||'';if(items.some(x=>x.key===id)||node.find('.kzv-colwrap').length)return;const city=node.find('h1').first().text().trim();items.push({url:url+'#'+id,key:id,html:$.html(el).slice(0,50000),title:city?city+' · Praxisabgabe':undefined,city:city||undefined});});}
 if(!items.length&&source.adapter!=='rlp'){$('a[href]').each((_,el)=>{try{const target=new URL($(el).attr('href')!,url);if(target.hostname.replace(/^www\./,'')!==new URL(source.url).hostname.replace(/^www\./,''))return;if(!new RegExp(source.detailPattern,'i').test(target.pathname))return;if(/login|register|anmeld|securedl|captcha/i.test(target.href))return;const title=$(el).text().replace(/\s+/g,' ').trim();items.push({url:target.href,key:target.pathname,title});}catch{}});}
 const next:string[]=[];$('a[rel="next"],a').each((_,el)=>{const a=$(el);if(a.attr('rel')!=='next'&&!/^(?:Weiter|Nächste(?: Seite)?|Next|›|»)$/.test(a.text().trim()))return;try{const target=new URL(a.attr('href')!,url);if(target.hostname===new URL(url).hostname&&target.pathname===new URL(url).pathname)next.push(target.href)}catch{}});
 return {items:[...new Map(items.map(i=>[i.key,i])).values()],next:[...new Set(next)]};}
export function readListingDocument(source:Source,item:PageItem,html:string){
 const {text,$}=publicText(html);if(text.length<60||!/zahn(?:arzt|ärzt|medizin|heil)|dental|\bKFO\b|\bMKG\b/i.test(text))return null;
 const heading=$('h1,h2,h3').first().text().replace(/\s+/g,' ').trim();
 const email=$('a[href^="mailto:"]').first().attr('href')?.slice(7).split('?')[0]||text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0]||null;
 const phone=$('a[href^="tel:"]').first().attr('href')?.slice(4)||text.match(/(?:Telefon|Tel\.?|Mobil)\s*:?\s*([+\d][\d ()/.-]{6,30}\d)/i)?.[1]||null;
 const name=text.match(/(?:Kontaktperson|Ansprechpartner(?:in)?)\s*:\s*([^\n]{3,80})/i)?.[1]||null;
 return {text,heading,email,phone,name,dateAttribute:$('time[datetime]').first().attr('datetime')||null};
}
export function prepareListing(source:Source,item:PageItem,html:string){const document=readListingDocument(source,item,html);return document?parseListingDocument(item,document):null;}

export function extractListing(source:Source,item:PageItem,html:string,observedAt?:string,prepared?:PreparedListing):PublicListing|null{const document=prepared||prepareListing(source,item,html);return document?extractPreparedListing(source,item,document,observedAt):null;}
