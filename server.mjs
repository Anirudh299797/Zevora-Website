import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.'),port=Number(process.env.PORT||3000);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.css':'text/css','.txt':'text/plain; charset=utf-8'};
const enabled=()=>Boolean(process.env.OPENAI_API_KEY)&&process.env.ENABLE_PUBLIC_GENERATION==='true';
const counters=new Map();
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
async function body(req,max=3_000_000){let chunks=[],n=0;for await(const c of req){n+=c.length;if(n>max)throw Error('Sketch exceeds 3 MB.');chunks.push(c)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/status'&&req.method==='GET')return json(res,200,{enabled:enabled()});
  if(url.pathname==='/api/render-sketch'&&req.method==='POST'){
   if(!enabled())return json(res,503,{error:'AI generation is not enabled yet. The site owner must set OPENAI_API_KEY and ENABLE_PUBLIC_GENERATION=true on the Render web service.'});
   const ip=req.socket.remoteAddress||'unknown',now=Date.now(),record=counters.get(ip)||{n:0,t:now};
   if(now-record.t>86400000){record.n=0;record.t=now}
   if(record.n>=3)return json(res,429,{error:'Daily concept limit reached. Try again tomorrow.'});
   const b=await body(req);
   if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.image||'')||b.image.length>2_800_000)return json(res,400,{error:'Please draw a smaller PNG sketch.'});
   const type=String(b.type||'ring').slice(0,50),metal=String(b.metal||'gold').slice(0,60),stone=String(b.stone||'diamond').slice(0,60),notes=String(b.notes||'').slice(0,1400);
   record.n++;counters.set(ip,record);
   const form=new FormData();form.append('model',process.env.IMAGE_MODEL||'gpt-image-1.5');
   form.append('quality','medium');form.append('size','1024x1024');
   form.append('prompt',`Convert the attached customer's jewellery sketch into a realistic high-end studio product visualisation of a ${type}. Metal: ${metal}. Gemstones: ${stone}. Customer's design notes: ${notes}. If a previous concept image is attached, refine that concept based on the notes while maintaining the original customer's sketch as the primary reference. Follow the drawn silhouette, stone count and arrangement as closely as possible. Render one jewellery object only on a warm neutral seamless background, plausible materials and lighting, sharp macro detail, no text, no logos, no hands, no people. Do not introduce extra gemstones or structural elements absent from the drawing. This is an artistic concept, not a technical manufacturing specification.`);
   form.append('image[]',new Blob([Buffer.from(b.image.split(',')[1],'base64')],{type:'image/png'}),'customer-sketch.png');
   if(b.reference&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.reference)&&b.reference.length<2_800_000){form.append('image[]',new Blob([Buffer.from(b.reference.split(',')[1],'base64')],{type:'image/png'}),'previous-concept.png')}
   const upstream=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form,signal:AbortSignal.timeout(180000)});
   const result=await upstream.json();
   if(!upstream.ok)return json(res,502,{error:'Image service could not complete the render. Please try again later.'});
   const image=result.data?.[0]?.b64_json;
   if(!image)return json(res,502,{error:'Image service returned no picture.'});
   return json(res,200,{image});
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
  let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';
  if(pathname.includes('..')||pathname.includes('\\')||pathname.startsWith('/.'))return json(res,403,{error:'Forbidden'});
  const file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+sep))return json(res,403,{error:'Forbidden'});
  if(['.mjs','.json','.yaml','.env','.py'].includes(extname(file)))return json(res,403,{error:'Forbidden'});
  const st=await stat(file).catch(()=>null);if(!st?.isFile())return json(res,404,{error:'Not found'});
  res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();res.end(await readFile(file));
 }catch(e){json(res,e instanceof SyntaxError?400:500,{error:e.message==='Sketch exceeds 3 MB.'?e.message:'Request failed. Please try again.'})}
});
server.listen(port,()=>console.log(`ZEVORA web service running on port ${port}`));
