/** Static files plus automatic music-folder discovery; standard Node.js only. */
import {createReadStream} from 'node:fs';
import {readdir,realpath,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const audio=/\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.zip':'application/zip','.mp3':'audio/mpeg','.ogg':'audio/ogg','.oga':'audio/ogg','.opus':'audio/ogg','.wav':'audio/wav','.m4a':'audio/mp4','.aac':'audio/aac','.flac':'audio/flac','.webm':'audio/webm'};
async function musicFiles(folder,prefix=''){
  let entries;try{entries=await readdir(folder,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return [];throw error;}
  const files=[];
  for(const entry of entries){
    if(entry.isSymbolicLink())continue;
    const name=prefix+entry.name;
    if(entry.isDirectory())files.push(...await musicFiles(resolve(folder,entry.name),name+'/'));
    else if(entry.isFile()&&audio.test(entry.name))files.push(name);
  }
  return files.sort((a,b)=>a.localeCompare(b,'ca',{numeric:true}));
}
export function localHandler(directory){
  const canonicalRoot=realpath(directory);
  return async(req,res)=>{
    try{
      if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
      const root=await canonicalRoot,pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(pathname==='/music/playlist.json'){
        const folder=resolve(root,'music');
        try{if(await realpath(folder)!==folder){res.writeHead(403);res.end();return;}}catch(error){if(error.code!=='ENOENT')throw error;}
        const body=Buffer.from(JSON.stringify(await musicFiles(folder)));
        res.writeHead(200,{'Content-Type':types['.json'],'Content-Length':body.length,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);return;
      }
      const file=await realpath(resolve(root,'.'+(pathname==='/'?'/index.html':pathname)));
      if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
      const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end();return;}
      const headers={'Content-Type':types[extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
      let start=0,end=info.size-1,status=200;
      if(req.headers.range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if(!match||(!match[1]&&!match[2])||!info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
        if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;}
        else start=Math.max(0,info.size-Number(match[2]));
        if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
        status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
      if(req.method==='HEAD'||!info.size){res.end();return;}
      const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{if(!res.headersSent)res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Fitxer no trobat.');}
  };
}
