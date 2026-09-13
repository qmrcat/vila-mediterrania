import {BALCONY_FACES} from './balcony-facades.js';
import {defaultEntrance} from './entrances.js';
import {newDesign,validateDesign,resizeDesign,loadDesigns,saveDesign,writeDesigns,importDesigns,catalogFile,DESIGN_KEY,designId} from './designs.js';
import {createWorld,editWorld,COLORS} from './model.js';
const $=id=>document.getElementById(id),labels={ground:'Planta baixa',middle:'Planta del mig',roof:'Terrat i teulada'},faceLabels=['Davant','Dreta','Darrere','Esquerra'];
let design=newDesign(),layer='ground',middleLevel=0,selected=0,dirty=false,library=[],viewer,timer;
const status=message=>{$('status').textContent=message;};
function storage(){return localStorage;}
function layerCells(){return layer==='middle'&&design.upperFloors?design.upperFloors[middleLevel]??design.middle:design[layer];}
function setLayer(cells){if(layer==='middle'&&design.upperFloors&&design.upperFloors.length)design.upperFloors[middleLevel]=cells;else design[layer]=cells;}
for(const field of ['wall-color','roof-color']){
  for(const {name,hex} of COLORS){
    const button=document.createElement('button'),sample=document.createElement('span'),label=document.createElement('span');
    button.type='button';button.dataset.color=hex;button.title=`${name} · ${hex}`;
    button.setAttribute('aria-label',`${name}: ${field==='wall-color'?'color dels murs':'color de la coberta'}`);
    sample.className='game-color-sample';sample.style.backgroundColor=hex;sample.setAttribute('aria-hidden','true');label.textContent=name;
    button.append(sample,label);
    button.addEventListener('click',()=>{if($(field).disabled)return;$(field).value=hex;readCell();});
    $(field+'-presets').append(button);
  }
}
function reloadLibrary(){
  try{library=loadDesigns(storage());}catch{library=[];status('No s’han pogut llegir els dissenys desats. Pots continuar editant i exportar un JSON.');}
  const select=$('saved-designs');select.replaceChildren(new Option('Disseny sense desar',''));
  for(const d of library)select.add(new Option(d.name,d.id));select.value=library.some(d=>d.id===design.id)?design.id:'';
  $('delete').disabled=!select.value;$('export-all').disabled=!library.length;
}
for(let d=0;d<4;d++){
  const wrapper=document.createElement('div'),label=document.createElement('label'),select=document.createElement('select');label.htmlFor='face-'+d;label.textContent=faceLabels[d];select.id=label.htmlFor;
  for(const [value,name] of [['blank','Mur sense obertura'],['door','Porta d’arc clàssica'],['entrance','Portal configurable'],['window','Finestres rectangulars'],['arched-window','Finestres amb arc'],['balcony','Balcó ample'],...Object.entries(BALCONY_FACES)])select.add(new Option(name,value));
  select.addEventListener('change',readCell);wrapper.append(label,select);wrapper.className='face-card';
  const details=document.createElement('div');details.id='entrance-'+d;details.hidden=true;
  for(const [key,title,options] of [
    ['door','Forma del portal',[['arch','Amb arcada'],['single','Rectangular · una fulla'],['double','Rectangular · dues fulles']]],
    ['position','Posició del portal',[['left','Esquerra'],['center','Centre'],['right','Dreta']]],
    ['windows','Finestres al costat',[['rect','Rectangulars'],['arch','Amb arcada'],['none','Sense finestres']]],
    ['count','Nombre de finestres',[['1','Una finestra'],['2','Dues finestres']]]
  ]){
    const label=document.createElement('label'),field=document.createElement('select');field.id=`entrance-${key}-${d}`;label.htmlFor=field.id;label.textContent=title;
    for(const [value,name] of options)field.add(new Option(name,value));
    field.addEventListener('change',readCell);details.append(label,field);
  }
  wrapper.append(details);$('faces').append(wrapper);
}
function renderFields(){
  middleLevel=Math.min(middleLevel,Math.max(0,design.middleCount-1));
  $('individual-floor-options').hidden=layer!=='middle'||!design.upperFloors?.length;
  $('middle-level').replaceChildren(...Array.from({length:design.middleCount},(_,i)=>new Option(`Planta ${i+1}`,String(i))));$('middle-level').value=String(middleLevel);
  $('cell-title').textContent=`${layer==='middle'&&design.upperFloors?'Planta '+(middleLevel+1):labels[layer]} · cel·la ${selected+1}`;
  $('floor-fields').hidden=layer==='roof';$('roof-fields').hidden=layer!=='roof';
  if(layer==='roof'){
    const cell=design.roof[selected];$('roof-type').value=cell.type;$('roof-color').value=cell.color;$('roof-turn').value=String(cell.direction);$('roof-turn').disabled=cell.type==='flat';$('roof-turn-label').textContent=cell.type==='attic'?'Terrat cap a':'Vessant o costat baix cap a';
  }else{
    const cell=layerCells()[selected];$('cell-style').querySelector('[value="empty"]').disabled=layer==='ground';$('cell-style').value=cell?.style??'empty';$('wall-color').value=cell?.color??'#f5eee0';$('wall-color').disabled=!cell;$('face-fields').hidden=!cell||cell.style==='arcade';
    for(let d=0;d<4;d++){
      const value=cell?.faces[d]??'window',entrance=typeof value==='object'?value:defaultEntrance();
      $('face-'+d).value=typeof value==='object'?'entrance':value;$('entrance-'+d).hidden=typeof value!=='object';
      for(const key of ['door','position','windows','count'])$(`entrance-${key}-${d}`).value=String(entrance[key]);
      $(`entrance-count-${d}`).disabled=entrance.windows==='none';
    }
  }
  for(const field of ['wall-color','roof-color'])for(const button of $(field+'-presets').children){
    button.disabled=$(field).disabled;
    button.setAttribute('aria-pressed',String(!button.disabled&&button.dataset.color===$(field).value.toLowerCase()));
  }
  for(const button of document.querySelectorAll('[data-layer]'))button.setAttribute('aria-pressed',String(button.dataset.layer===layer));
  $('plan-hint').textContent=layer==='middle'&&design.middleCount===0?'La planta intermèdia està desactivada. Augmenta les repeticions per veure-la a l’edifici.':'Selecciona una cel·la i canvia els seus elements als controls.';
}
function renderGrid(){
  const grid=$('plan');grid.style.gridTemplateColumns=`repeat(${design.width},86px)`;grid.replaceChildren();
  layerCells().forEach((cell,i)=>{
    const button=document.createElement('button'),sample=document.createElement('span'),text=document.createElement('span');sample.className='cell-sample';sample.style.backgroundColor=cell?.color??'#e2e6df';
    const name=!cell?'Sense planta':layer==='roof'?{tile:'Dues aigües',shed:'Una aigua',flat:'Terrat',attic:'Golfes i terrat'}[cell.type]:cell.style==='arcade'?'Arcades':'Murs';text.textContent=`${i+1} · ${name}`;
    button.setAttribute('aria-pressed',String(i===selected));button.setAttribute('aria-label',`${labels[layer]}, fila ${Math.floor(i/design.width)+1}, columna ${i%design.width+1}: ${name}`);
    button.append(sample,text);button.addEventListener('click',()=>{selected=i;renderFields();renderGrid();});grid.append(button);
  });
}
function renderPreview(){
  if(!viewer)return;const w=createWorld('brava','empty');for(let z=0;z<design.depth;z++)for(let x=0;x<design.width;x++)editWorld(w,x,z,'land');
  w.customBuildings.push({x:0,z:0,direction:0,design:structuredClone(design)});viewer.update(w);viewer.boats.visible=false;viewer.grid.visible=false;
}
function fit(){if(!viewer)return;viewer.target.set((design.width-1)*1.3/2,(1+design.middleCount)*.43,(design.depth-1)*1.3/2);viewer.scale=Math.max(5.5,design.width*1.3+3,design.depth*1.3+3);viewer.updateCamera();}
function changed(){dirty=true;status('Canvis sense desar.');renderFields();renderGrid();clearTimeout(timer);timer=setTimeout(renderPreview,90);}
function readCell(){
  if(layer==='roof')design.roof[selected]={type:$('roof-type').value,color:$('roof-color').value,direction:Number($('roof-turn').value)};
  else layerCells()[selected]=$('cell-style').value==='empty'&&layer==='middle'?null:{style:$('cell-style').value,color:$('wall-color').value,faces:faceLabels.map((_,d)=>$('face-'+d).value==='entrance'?{type:'entrance',door:$(`entrance-door-${d}`).value,position:$(`entrance-position-${d}`).value,windows:$(`entrance-windows-${d}`).value,count:Number($(`entrance-count-${d}`).value)}:$('face-'+d).value)};
  changed();
}
function fill(){
  $('middle-count-label').textContent=design.upperFloors?'Nombre de plantes intermèdies':'Repeticions de la planta intermèdia';
  const max=design.upperFloors?Math.max(3,design.middleCount):3;$('middle-count').replaceChildren(...Array.from({length:max+1},(_,i)=>new Option(i?`${i} plantes intermèdies`:'Cap · només planta baixa',String(i))));
  $('design-name').value=design.name;$('width').value=String(design.width);$('depth').value=String(design.depth);$('middle-count').value=String(design.middleCount);selected=Math.min(selected,design.ground.length-1);renderFields();renderGrid();renderPreview();fit();reloadLibrary();
}
function discard(){return !dirty||confirm('Hi ha canvis sense desar. Vols descartar-los?');}
function perform(action){try{action();}catch(error){status(error.message||'No s’ha pogut completar l’acció.');}}
function save(copy=false){
  perform(()=>{
    const candidate=validateDesign(copy?{...design,id:designId(),name:(design.name+' · còpia').slice(0,60)}:design);
    saveDesign(storage(),candidate);design=candidate;dirty=false;fill();status('Disseny desat. Ja és disponible a «Els meus edificis» del joc.');
  });
}
function download(designs,name){
  const blob=new Blob([JSON.stringify(catalogFile(designs),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
for(const button of document.querySelectorAll('[data-layer]'))button.addEventListener('click',()=>{layer=button.dataset.layer;renderFields();renderGrid();});
for(const id of ['cell-style','wall-color','roof-type','roof-color','roof-turn'])$(id).addEventListener('input',readCell);
$('design-name').addEventListener('input',()=>{design.name=$('design-name').value;dirty=true;status('Canvis sense desar.');});
for(const id of ['width','depth'])$(id).addEventListener('change',()=>perform(()=>{
  const width=Number($('width').value),depth=Number($('depth').value);
  if((width<design.width||depth<design.depth)&&!confirm('Les cel·les que quedin fora de la nova mida es retiraran del disseny. Vols continuar?')){fill();return;}
  design=resizeDesign(design,width,depth);selected=0;changed();fit();
}));
$('middle-level').addEventListener('change',()=>{middleLevel=Number($('middle-level').value);renderFields();renderGrid();});
$('middle-count').addEventListener('change',()=>{design.middleCount=Number($('middle-count').value);if(design.upperFloors)design.upperFloors=Array.from({length:design.middleCount},(_,i)=>design.upperFloors[i]??structuredClone(design.middle));changed();fit();});
$('apply-layer').addEventListener('click',()=>{setLayer(layerCells().map(()=>structuredClone(layerCells()[selected])));changed();});
$('save').addEventListener('click',()=>save());$('copy').addEventListener('click',()=>save(true));
$('new').addEventListener('click',()=>{if(!discard())return;design=newDesign();dirty=false;selected=0;fill();status('Disseny nou.');});
$('saved-designs').addEventListener('change',()=>{
  const id=$('saved-designs').value;if(!discard()){reloadLibrary();return;}
  design=id?structuredClone(library.find(d=>d.id===id)):newDesign();dirty=false;selected=0;fill();status(id?'Disseny carregat.':'Disseny nou.');
});
$('delete').addEventListener('click',()=>{
  if(!library.some(d=>d.id===design.id)||!confirm(`Vols eliminar «${design.name}» de la col·lecció? Les còpies col·locades a la vila es conservaran.`))return;
  perform(()=>{writeDesigns(storage(),loadDesigns(storage()).filter(d=>d.id!==design.id));design=newDesign();dirty=false;selected=0;fill();status('Disseny eliminat de la col·lecció.');});
});
$('export').addEventListener('click',()=>perform(()=>download([design],'edifici-mediterrani.json')));
$('export-all').addEventListener('click',()=>perform(()=>download(loadDesigns(storage()),'edificis-mediterranis.json')));
$('import').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    if(file.size>2_000_000)throw new Error('El fitxer supera el límit de 2 MB.');
    const data=JSON.parse(await file.text());const result=importDesigns(storage(),data);reloadLibrary();status(`${result.imported.length} dissenys importats com a còpies. Els pots obrir a «Els meus dissenys».`);
  }catch(error){status(error instanceof SyntaxError?'El fitxer no conté un JSON vàlid.':error.message);}finally{e.target.value='';}
});
$('return-game').addEventListener('click',e=>{if(!discard())e.preventDefault();else dirty=false;});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key===DESIGN_KEY)reloadLibrary();});
window.addEventListener('pagehide',()=>{clearTimeout(timer);viewer?.dispose();},{once:true});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
$('rotate').addEventListener('click',()=>viewer?.rotate());$('center').addEventListener('click',()=>{viewer?.home();fit();});
reloadLibrary();
const requested=new URLSearchParams(location.search).get('design'),saved=library.find(d=>d.id===requested);if(saved)design=structuredClone(saved);
fill();
try{
  const {VillageScene}=await import('./scene.js');
  viewer=new VillageScene($('preview'),{onClick:p=>{if(p.x>=0&&p.x<design.width&&p.z>=0&&p.z<design.depth){selected=p.z*design.width+p.x;renderFields();renderGrid();}},onHover:()=>{},onError:message=>{$('preview-error').hidden=false;$('preview-error').textContent=message;}});
  renderPreview();fit();
}catch{$('preview-error').hidden=false;$('preview-error').textContent='No s’ha pogut iniciar la vista 3D. Pots editar la quadrícula i desar o exportar el disseny; per veure’l cal WebGL 2.';}
