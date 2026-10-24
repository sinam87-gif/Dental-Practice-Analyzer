export function robotsRule(text:string,url:string,agent='PraxisRadarBot'):{allowed:boolean,delay:number}{
 const groups:{agents:string[],rules:{allow:boolean,path:string}[],delay:number}[]=[];let current:{agents:string[],rules:{allow:boolean,path:string}[],delay:number}|undefined,hasRules=false;
 for(const raw of text.split(/\r?\n/)){const line=raw.replace(/#.*$/,'').trim(),i=line.indexOf(':');if(i<0)continue;const key=line.slice(0,i).trim().toLowerCase(),value=line.slice(i+1).trim();if(key==='user-agent'){if(!current||hasRules){current={agents:[],rules:[],delay:1};groups.push(current);hasRules=false;}current.agents.push(value.toLowerCase());}else if(current){if(key==='allow'||key==='disallow'){hasRules=true;if(value)current.rules.push({allow:key==='allow',path:value});}if(key==='crawl-delay'&&Number.isFinite(Number(value)))current.delay=Math.max(1,Math.min(Number(value),3600));}}
 const exact=groups.filter(g=>g.agents.some(a=>a!=='*'&&agent.toLowerCase().includes(a))),selected=exact.length?exact:groups.filter(g=>g.agents.includes('*'));const path=new URL(url).pathname+new URL(url).search;
 let best:{allow:boolean,length:number}|undefined;for(const group of selected)for(const rule of group.rules){const end=rule.path.endsWith('$'),pattern=rule.path.replace(/\$$/,'').split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');if(new RegExp('^'+pattern+(end?'$':'')).test(path)){const length=rule.path.replace(/[*$]/g,'').length;if(!best||length>best.length||length===best.length&&rule.allow)best={allow:rule.allow,length};}}
 return {allowed:best?.allow??true,delay:Math.max(1,...selected.map(g=>g.delay))};
}
export function restrictedContent(html:string){
 if(/(?:cf-chl-|challenge-platform|verify you are human|bestätigen.{0,30}(?:mensch|human))/i.test(html))return true;
 // Contact-form spam protection does not restrict reading public listings.
 // Forms are never submitted; standalone challenges still stop the crawler.
 const publicPage=html.replace(/<form\b[\s\S]*?<\/form\s*>/gi,'').replace(/<script\b[\s\S]*?<\/script\s*>/gi,'');
 return /(?:g-recaptcha|hcaptcha|captcha-container)/i.test(publicPage);
}
export function canonicalURL(raw:string){const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)throw Error('Nur öffentliche HTTPS-Links');u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(?:fbclid|gclid|session|token|auth|sid)$/i.test(key))u.searchParams.delete(key);u.hostname=u.hostname.toLowerCase();u.searchParams.sort();return u.href.replace(/\/$/,'');}
