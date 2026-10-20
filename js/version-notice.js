/** Checks this server only; never interrupts play or reloads without a click. */
export function initVersionNotice({currentVersion,beforeReload,root=document,host=window,fetcher=globalThis.fetch}){
  const $=id=>root.querySelector('#'+id),notice=$('update-notice'),message=$('update-message'),menu=$('update-menu');
  let latest=currentVersion,dismissed=0,busy=false,lastCheck=-Infinity,disposed=false;
  const show=()=>{
    message.textContent='Hi ha una versió nova del joc. Actualitza la pàgina per carregar les novetats. La vila es desarà abans de continuar.';
    notice.hidden=false;
  };
  const check=async()=>{
    if(disposed||busy||root.visibilityState==='hidden'||Date.now()-lastCheck<30_000)return;
    busy=true;lastCheck=Date.now();
    try{
      const url=new URL('./version.json',host.location.href);url.searchParams.set('_',String(lastCheck));
      const response=await fetcher(url,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
      if(!response.ok)return;
      const data=await response.json(),version=data?.version;
      if(disposed||!Number.isSafeInteger(version)||version<=currentVersion||version<latest)return;
      latest=version;menu.hidden=false;
      if(version>dismissed&&notice.hidden)show();
    }catch{/* Offline, expired session or invalid response: keep the game running. */}
    finally{busy=false;}
  };
  const reload=()=>{
    if(latest<=currentVersion)return;
    try{
      if(beforeReload()!==true)throw new Error('save');
      const url=new URL(host.location.href);url.searchParams.set('v',String(latest));
      host.location.replace(url.href);
    }catch{
      notice.hidden=false;
      message.textContent='No s’ha pogut desar la vila. Ves a «La meva vila → Desa una còpia (.json)» abans d’actualitzar la pàgina.';
    }
  };
  const later=()=>{dismissed=latest;notice.hidden=true;if(notice.contains(root.activeElement))root.querySelector('#world').focus({preventScroll:true});};
  $('update-now').addEventListener('click',reload);
  $('update-later').addEventListener('click',later);
  menu.addEventListener('click',reload);
  root.addEventListener('visibilitychange',check);
  host.addEventListener('focus',check);host.addEventListener('online',check);
  const timer=host.setInterval(check,60_000);
  void check();
  return {check,dispose(){disposed=true;host.clearInterval(timer);root.removeEventListener('visibilitychange',check);host.removeEventListener('focus',check);host.removeEventListener('online',check);$('update-now').removeEventListener('click',reload);$('update-later').removeEventListener('click',later);menu.removeEventListener('click',reload);}};
}
