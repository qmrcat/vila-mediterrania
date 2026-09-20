/** Servidor local sense dependències. Executa: node server.mjs */
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {localHandler} from './local-server.mjs';
import {withAiProxy,availableProviders} from './ai-proxy.mjs';
import {spawn} from 'node:child_process';
const root=dirname(fileURLToPath(import.meta.url));
const server=createServer(withAiProxy(localHandler(root)));
let port=3000;
server.on('error',e=>{
  if(e.code==='EADDRINUSE'&&port<3020){port++;server.listen(port,'127.0.0.1');return;}
  console.error('No s’ha pogut iniciar el servidor:',e.message);process.exitCode=1;
});
server.on('listening',()=>{
  const url=`http://127.0.0.1:${server.address().port}/`;
  console.log(`\nVila Mediterrània\n\nObre ${url}\n\nDeixa aquesta finestra oberta mentre jugues. Prem Ctrl+C per tancar el servidor.\n`);
  const ai=availableProviders();
  console.log(ai.length?`Generador de mods amb IA: ${ai.join(' i ')}.\n`:'Generador de mods amb IA: sense clau. Posa ANTHROPIC_API_KEY o OPENAI_API_KEY abans d’arrencar.\n');
  const [command,args]=process.platform==='win32'?['cmd',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  const child=spawn(command,args,{stdio:'ignore',detached:true});child.on('error',()=>{});child.unref();
});
server.listen(port,'127.0.0.1');
