// PDF.js getTextContent uses `for await (const chunk of readableStream)`.
// The embedded WebKit browser may support getReader but not stream async iteration.
// Read the same public PDF.js text stream without requiring that browser feature.
export async function readPdfText(page:{streamTextContent:()=>ReadableStream<{items:any[]}>}){
  const reader=page.streamTextContent().getReader();
  const items:any[]=[];
  let completed=false;
  try{
    while(true){
      const chunk=await reader.read();
      if(chunk.done){completed=true;break}
      if(chunk.value?.items)items.push(...chunk.value.items);
    }
    return {items};
  }finally{
    try{if(!completed)await reader.cancel().catch(()=>{})}finally{reader.releaseLock()}
  }
}
