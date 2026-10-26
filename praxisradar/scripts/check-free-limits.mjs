import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const toolRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=toolRequire('esbuild');
const result=await build({entryPoints:['lib/platform/engine.ts'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',metafile:true,logLevel:'silent'});
const inputs=Object.keys(result.metafile.inputs);assert(!inputs.some(p=>/(?:^|\/)(?:cheerio|htmlparser2|parse5|entities)(?:@|\/)/.test(p)),'Automatic Worker must not load DOM/entity-library import graphs');
const bytes=result.outputFiles[0].contents.length;assert(bytes<150*1024,'Automatic core exceeds the 150 KiB startup budget');
console.log('PASS: automatic Worker has no DOM import graph; core bundle '+bytes+' bytes < 150 KiB (size check, not a CPU-time guarantee)');

if(fs.existsSync('dist/client')){let count=0,max=0;const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(entry.isFile()){count++;max=Math.max(max,fs.statSync(p).size);}}};walk('dist/client');assert(count<=20000,'Free static asset count exceeded');assert(max<=25*1024*1024,'Free static asset size exceeded');console.log('PASS: built static assets '+count+' <= 20000; largest '+max+' bytes <= 25 MiB');}
