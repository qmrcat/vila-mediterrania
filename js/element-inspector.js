import {inspectElement} from './element-info.js';

export function createElementInspector(dialog,{allowJsonCopy=false,writeText=text=>navigator.clipboard.writeText(text)}={}){
  const $=id=>dialog.querySelector('#'+id),button=$('element-copy'),fallback=$('element-json'),status=$('element-copy-status');
  let current=null,revision=0;
  button.hidden=!allowJsonCopy;
  dialog.addEventListener('close',()=>{current=null;revision++;});
  button.addEventListener('click',async()=>{
    if(!allowJsonCopy||!current)return;
    const json=current.json,request=revision;button.disabled=true;status.textContent='Copiant…';
    try{
      await writeText(json);
      if(request===revision&&dialog.open)status.textContent='JSON copiat al porta-retalls.';
    }catch{
      if(request===revision&&dialog.open){
        fallback.hidden=false;fallback.value=json;fallback.focus();fallback.select();
        status.textContent='El navegador no ha permès copiar automàticament. El JSON està seleccionat: copia’l amb Ctrl+C o amb l’opció Copia del mòbil.';
      }
    }finally{if(request===revision)button.disabled=false;}
  });
  return {
    open(world,point){
      const info=inspectElement(world,point);if(!info){this.close();return;}
      current=info;revision++;button.disabled=false;fallback.hidden=true;fallback.value='';status.textContent='';
      $('element-category').textContent=info.category;$('element-title').textContent=info.name;
      $('element-description').textContent=info.description;$('element-description').hidden=!info.description;
      const facts=$('element-facts');facts.replaceChildren();
      for(const [label,value] of info.facts){
        const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;facts.append(dt,dd);
      }
      if(!dialog.open)dialog.showModal();
    },
    close(){if(dialog.open)dialog.close();},
  };
}
