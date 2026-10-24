import type {Source} from './types';
export const SCAN_CHARS=4096,STORE_CHARS=32768,MAX_FACT_CHARS=16000,MAX_CARD_CHARS=24000;
type Frame={tag:string,ignored:boolean};
type Capture={depth:number,html:string,nested:boolean,truncated:boolean};
export type ScanState={offset:number,pending:string,raw:string,frames:Frame[],captures:Capture[],link:{href:string,rel:string,text:string}|null,text:string,heading:string,headingDepth:number,main:boolean,truncated:boolean};
export type ScanOutput={kind:'card',html:string}|{kind:'link'|'next',url:string,title:string};
export const newScan=():ScanState=>({offset:0,pending:'',raw:'',frames:[],captures:[],link:null,text:'',heading:'',headingDepth:0,main:false,truncated:false});
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const ignored=new Set(['head','nav','footer','aside','form','iframe','noscript','svg']);
const blocks=new Set(['p','div','li','tr','h1','h2','h3','h4','dt','dd','section','article','br']);
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function attr(tag:string,key:string){const m=tag.match(new RegExp('\\b'+key+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return (m?.[1]??m?.[2]??m?.[3]??'').replace(/&amp;/gi,'&');}
function tagEnd(s:string,start:number){let quote='';for(let i=start+1;i<s.length;i++){const c=s[i];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='>')return i;}return -1;}
/** Bounded lexical pass: at most SCAN_CHARS new characters, no DOM of a whole page.
 * Persistent state makes tag/comment/script boundaries survive invocations.
 * HTML fragments are subsequently validated by the existing source adapter. */
export function scanPart(source:Source,url:string,state:ScanState,part:string,detail:boolean,final=false){
 if(part.length>SCAN_CHARS)throw Error('Parser-Arbeitsschritt zu groß');
 const outputs:ScanOutput[]=[],s=state.pending+part;state.pending='';state.offset+=part.length;let pos=0;
 const isIgnored=()=>state.frames.at(-1)?.ignored??false;
 const add=(value:string)=>{if(isIgnored())return;for(const c of state.captures){if(c.html.length+value.length>MAX_CARD_CHARS)c.truncated=true;c.html=(c.html+value).slice(0,MAX_CARD_CHARS);}};
 const text=(value:string)=>{if(isIgnored())return;add(value);if(state.link)state.link.text=(state.link.text+value).slice(0,600);if(detail&&(!state.main||state.frames.some(f=>f.tag==='main'))){if(state.text.length+value.length>MAX_FACT_CHARS)state.truncated=true;state.text=(state.text+value).slice(0,MAX_FACT_CHARS);if(state.headingDepth)state.heading=(state.heading+value).slice(0,500);}};
 const endLink=()=>{const a=state.link;state.link=null;if(!a)return;try{const u=new URL(a.href,url),base=new URL(source.url),title=a.text.replace(/\s+/g,' ').trim();if(u.protocol!=='https:'||u.hostname.replace(/^www\./,'')!==base.hostname.replace(/^www\./,''))return;if(a.rel.split(/\s+/).includes('next')||/^(?:Weiter|Nächste(?: Seite)?|Next|›|»)$/.test(title)){if(u.pathname===new URL(url).pathname)outputs.push({kind:'next',url:u.href,title});}if(new RegExp(source.detailPattern,'i').test(u.pathname)&&!/login|register|anmeld|securedl|captcha/i.test(u.href))outputs.push({kind:'link',url:u.href,title});}catch{}};
 while(pos<s.length){
  if(state.raw){const close=state.raw==='!--'?'-->':'</'+state.raw;const at=s.toLowerCase().indexOf(close,pos);if(at<0){state.pending=s.slice(Math.max(pos,s.length-32));break;}if(state.raw==='!--'){pos=at+3;state.raw='';continue;}const end=s.indexOf('>',at);if(end<0){state.pending=s.slice(at);break;}pos=end+1;state.raw='';continue;}
  const at=s.indexOf('<',pos);if(at<0){text(s.slice(pos));break;}if(at>pos)text(s.slice(pos,at));pos=at;
  if(s.startsWith('<!--',pos)){state.raw='!--';pos+=4;continue;}
  const end=tagEnd(s,pos);if(end<0){state.pending=s.slice(pos);if(state.pending.length>4096){state.pending='';state.truncated=true;}break;}
  const token=s.slice(pos,end+1);pos=end+1;const match=token.match(/^<\/?([a-z][\w:-]*)\b/i);if(!match)continue;const tag=match[1].toLowerCase(),closing=token.startsWith('</');
  if(!closing&&(tag==='script'||tag==='style')){state.raw=tag;continue;}
  if(closing){add(token);if(tag==='a')endLink();const depth=state.frames.map(f=>f.tag).lastIndexOf(tag);if(depth>=0){state.frames.splice(depth);if(state.headingDepth>depth)state.headingDepth=0;while(state.captures.length&&state.captures.at(-1)!.depth>depth){const c=state.captures.pop()!;if(!c.nested){if(c.truncated)state.truncated=true;else outputs.push({kind:'card',html:c.html});}}}
   if(detail&&blocks.has(tag))text('\n');continue;}
  const skip=isIgnored()||(ignored.has(tag)&&!(!detail&&['nav','footer'].includes(tag)));if(tag==='main'&&detail&&!state.main){state.main=true;state.text='';state.heading='';}
  if(!skip&&!detail&&tag==='div'){
   const cls=attr(token,'class'),id=attr(token,'id'),card=source.adapter==='dentoffert'&&/\bcard-listing\b/.test(cls)&&/^listing-\d+$/.test(id)||source.adapter==='rlp'&&/\bkzv-colwrap\b/.test(cls)&&!!id;
   if(card){for(const c of state.captures)c.nested=true;state.captures.push({depth:state.frames.length+1,html:'',nested:false,truncated:false});}
  }
  if(!skip){add(token);if(tag==='a'){
    if(detail){const href=attr(token,'href');if(/^(?:mailto:|tel:)/i.test(href)&&!state.text.includes(href)){state.text=(state.text+'\n'+(/mailto:/i.test(href)?'E-Mail: ':'Telefon: ')+href.replace(/^(?:mailto:|tel:)/i,'').split('?')[0]+'\n').slice(0,MAX_FACT_CHARS);}}
    else{if(state.link)endLink();state.link={href:attr(token,'href'),rel:attr(token,'rel'),text:''};}}
   if(detail&&blocks.has(tag))text('\n');
   if(detail&&!state.heading&&(tag==='h1'||tag==='h2'))state.headingDepth=state.frames.length+1;
  }
  if(!voids.has(tag)&&!token.endsWith('/>')){if(state.frames.length>=128)throw Error('HTML-Verschachtelung zu tief');state.frames.push({tag,ignored:skip});}
 }
 if(final){if(state.pending&&!state.raw&&!state.pending.startsWith('<'))text(state.pending);state.pending='';if(state.link)endLink();}
 return {state,outputs,html:detail&&final?'<main><h1>'+escape(state.heading)+'</h1><p>'+state.text+'</p></main>':undefined};
}
