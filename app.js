import {captureClone,pasteClone,cloneBounds,clonePlacement,captureAppearance,pasteAppearance,houseToDesign} from './cloning.js';
import {CONFIG} from './config.js';
import {initControlDrawers} from './control-drawers.js';
import {initVersionNotice} from './version-notice.js';
import {TerrainStroke} from './terrain-stroke.js';
import {SPECIAL_SHOPS} from './special-shops.js';
import {checkBeachBar,checkLandmark,LANDMARK_TYPES} from './model.js';
import {saveDesign,loadDesigns,DESIGN_KEY,customAt,customCells,customFloors} from './designs.js';
import {initMusic} from './music.js';
import {updateCompass} from './compass.js';
import {createWorld,validateWorld,editWorld,History,COLORS,worldLimit,expandWorld,GRID_SIZES,floorCount,TREE_SPECIES,bridgeEndpoint,checkBridge,addBridge,checkMarket,checkPatioHouse,checkChurch,checkTownHall,checkCustomBuilding} from './model.js';

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const STORAGE_KEY='vila-mediterrania:v56';
// New landmark types join the building selector without widening the toolbar.
const BUILDING_TOOLS=new Map([
  ['beachbar','Guingueta'],['market','Mercat'],['church','Església'],['townhall','Ajuntament'],
  ...Object.entries(LANDMARK_TYPES).filter(([,definition])=>definition.category!=='monument').map(([id,definition])=>[id,definition.name]),
  ['building-sign','Canviar un rètol existent'],
]);
const MONUMENT_TOOLS=new Map(Object.entries(LANDMARK_TYPES).filter(([,definition])=>definition.category==='monument').map(([id,definition])=>[id,definition.name]));
const LEGACY_STORAGE_KEYS=['vila-mediterrania:v55','vila-mediterrania:v54','vila-mediterrania:v53','vila-mediterrania:v52','vila-mediterrania:v51','vila-mediterrania:v50','vila-mediterrania:v49','vila-mediterrania:v48','vila-mediterrania:v47','vila-mediterrania:v46','vila-mediterrania:v45','vila-mediterrania:v44','vila-mediterrania:v43','vila-mediterrania:v42','vila-mediterrania:v41','vila-mediterrania:v40','vila-mediterrania:v39','vila-mediterrania:v38','vila-mediterrania:v37','vila-mediterrania:v36','vila-mediterrania:v35','vila-mediterrania:v34','vila-mediterrania:v33','vila-mediterrania:v32','vila-mediterrania:v31','vila-mediterrania:v30','vila-mediterrania:v29','vila-mediterrania:v28','vila-mediterrania:v27','vila-mediterrania:v26','vila-mediterrania:v25','vila-mediterrania:v24','vila-mediterrania:v23','vila-mediterrania:v22','vila-mediterrania:v21','vila-mediterrania:v20','vila-mediterrania:v19','vila-mediterrania:v18','vila-mediterrania:v17','vila-mediterrania:v16','vila-mediterrania:v15','vila-mediterrania:v14','vila-mediterrania:v13','vila-mediterrania:v12','vila-mediterrania:v11','vila-mediterrania:v10','vila-mediterrania:v9','vila-mediterrania:v8','vila-mediterrania:v7','vila-mediterrania:v6','vila-mediterrania:v5','vila-mediterrania:v4','vila-mediterrania:v3','vila-mediterrania:v2','vila-mediterrania:v1'];
let bridgeStart=null,designs=[];
let terrainStroke=null,controlDrawers;
let cloneStart=null,cloneClipboard=null,cloneStyle=null;
let world,scene,tool='house',treeSpecies='pine',terrainType='land',color=0,roof='tile',roofDirection=0,keyboardCell={x:0,z:0},toastTimer;
const history=new History();
if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))$('#download-code').hidden=true;
const instructions={
  clone:['Clona elements','Tria què vols copiar. La còpia és independent de l’original i es pot desfer.'],
  navigate:['Explora la vila','Arrossega per girar, Majúscules + arrossegar per desplaçar i roda per apropar. Al mòbil, arrossega o fes pinça amb dos dits. Els clics i els tocs no construeixen ni esborren res.'],
  parliament:['El Parlament','Palau de 4 × 4 cel·les, amb porxada de banda a banda, balcó de la mateixa amplada al damunt i el pal de la senyera al centre. Prepara tota la base lliure a la mateixa alçada.'],
  institution:['Edifici institucional','Model de 3 × 2 cel·les, amb dues plantes, pòrtic central, balcó i senyera. Canvia el rètol per dedicar-lo a una altra institució.'],
  barracksSenyera:['Caserna militar amb senyera','Recinte de 3 × 3 cel·les, amb allotjaments, pati obert i garita. La senyera oneja al costat de l’entrada. Tria l’orientació i prepara la base a la mateixa alçada.'],
  barracksEstelada:['Caserna militar amb estelada','Recinte de 3 × 3 cel·les, amb allotjaments, pati obert i garita. L’estelada oneja al costat de l’entrada. Tria l’orientació i prepara la base a la mateixa alçada.'],
  'building-sign':['Canviar el rètol d’un edifici','Escriu el nom i clica qualsevol cel·la de l’edifici. Deixa el camp buit per recuperar el rètol original.'],
  museum:['El museu de la vila','Ocupa 2 × 2 cel·les, amb entrada porticada, galeries i peces exposades al davant. Prepara tota la base a la mateixa alçada i escull l’entrada.'],
  monastery:['Un monestir català','Conjunt de 3 × 3 cel·les inspirat en Poblet, amb església, campanar i claustre obert amb jardí i pou. Prepara tota la base lliure a la mateixa alçada.'],
  hotel3:['Hotel de tres estrelles','Ocupa 2 × 2 cel·les: tres plantes amb balcons i un terrat amb pèrgola. Prepara tota la base a la mateixa alçada i escull l’entrada.'],
  hotel5:['Hotel de cinc estrelles','Ocupa 3 × 3 cel·les: quatre plantes, piscina, gandules, para-sols i jardí. Prepara tota la base lliure a la mateixa alçada.'],
  hostal:['L’hostal de la vila','Ocupa 2 × 1 cel·les: dues plantes, finestres amb porticons i teulada de teula. Escull l’orientació de l’entrada.'],
  pension:['Una pensió familiar','Ocupa una cel·la: dues plantes amb porticons, teulada de teula i flors a l’entrada.'],
  castle:['Un castell medieval català','Tria 2 × 2 o 3 × 3 cel·les i l’orientació del portal. Prepara tota la superfície lliure a la mateixa alçada.'],
  ...Object.fromEntries(Object.entries(LANDMARK_TYPES).filter(([,d])=>d.flag).map(([id,d])=>[id,[d.name,'Un pal amb bandera que oneja, sobre una cel·la de terra ferma. Tria cap on mira la bandera i clica per col·locar-lo.']])),
  fireStation:['L’estació de bombers','Tria 2 × 2 o 3 × 2 cel·les i l’orientació de les cotxeres. Prepara terra ferma lliure a la mateixa alçada.'],
  recycling:['La deixalleria municipal','Tria 2 × 2 o 3 × 2 cel·les i l’entrada del recinte, amb caseta i contenidors de recollida selectiva.'],
  cemetery:['El cementiri de la vila','Tria la mida i l’orientació de l’entrada. Murs de pedra, làpides i xiprers en un recinte amb camí central.'],
  ...Object.fromEntries([...MONUMENT_TOOLS].filter(([id])=>id!=='castle').map(([id,name])=>[id,[name,'Cada peça ocupa una cel·la. Tria l’orientació i uneix els extrems de les peces sobre terreny a la mateixa alçada.']])),
  hospital:['L’hospital de la vila','Tria un hospital de 2 × 2 o 3 × 2 cel·les i l’orientació de l’entrada.'],
  school:['L’escola del poble','Tria una escola de 2 × 2 o 3 × 2 cel·les, amb pati al davant.'],
  police:['La comissaria','Un edifici de 2 × 1 cel·les amb entrada i rètol de policia.'],
  lighthouse:['El far de la costa','Una torre blanca amb llanterna i galeria. Prepara una cel·la de terra ferma.'],
  playground:['Un lloc per jugar','Tria la mida i l’orientació. Prepara totes les cel·les lliures a la mateixa alçada.'],
  house:['Fem créixer el poble','Clica per afegir un pis. Clica un buit entre pisos per reconstruir-lo.'],
  land:['El terreny i els carrers','Tria terra ferma, platja o un acabat de carrer. Uneix caselles per dibuixar els carrers de la vila.'],
  plaza:['Un lloc per trobar-se','Uneix les places per crear carrers i passejos vora el mar.'],
  pine:['Una mica d’ombra','Tria una espècie i clica per plantar-la. Clica un altre arbre per substituir-lo.'],
  beachbar:['La guingueta de la platja','Tria el nom i l’orientació. Clica una cel·la de platja per posar-hi la guingueta.'],
  custom:['Els meus edificis','Tria un disseny desat i l’orientació de la façana.'],
  townhall:['L’ajuntament de la vila','Tria la mida i la façana. Dues plantes, balcó i senyera que oneja.'],
  church:['L’església del poble','Tria l’orientació de l’entrada. Prepara sis cel·les de terra ferma, carrer o plaça a la mateixa alçada.'],
  market:['El mercat de la vila','Tria la mida i la façana. Clica un espai de terra ferma, carrer o plaça a la mateixa alçada.'],
  bridge:['Unim les dues ribes',`Marca dos extrems de terra ferma, carrer o plaça, alineats i separats entre ${CONFIG.bridges.minLength} i ${CONFIG.bridges.maxLength} caselles.`],
  stairs:['Amunt i avall','Tria escales sense baranes o amb baranes de ferro. Clica una escala per canviar-ne el tipus; si ja és del tipus escollit, gira.'],
  erase:['Obre una arcada','Assenyala el pis que vols treure. Els de sobre es mantenen amb arcades o pilastres.'],
};
const icons={
  navigate:'<path d="m5 3 14 10-7 1-3 7-4-18Z"/>',
  monuments:'<path d="M2 22V5h4v4h4V5h4v4h4V5h4v17H2ZM9 22v-7a3 3 0 0 1 6 0v7M2 13h4M18 13h4"/>',
  buildings:'<path d="M2 22V8h8v14M10 22V2h12v20M1 22h22M5 11h2M5 15h2M13 6h2M18 6h2M13 10h2M18 10h2M13 14h2M18 14h2M14 22v-4h4v4"/>',
  hospital:'<path d="M4 22V6h16v16M2 22h20M9 22v-5h6v5M12 2v8M8 6h8M7 12h2M15 12h2"/>',
  school:'<path d="m2 8 10-6 10 6M4 8v14h16V8M2 22h20M10 22v-6h4v6M7 11h2M15 11h2"/>',
  police:'<path d="M4 22V9h16v13M2 22h20M9 22v-5h6v5M12 2l5 2v3c0 3-5 5-5 5S7 10 7 7V4Z"/>',
  lighthouse:'<path d="M7 21 9 9h6l2 12M6 21h12M7 9h10M9 9V5h6v4M8 5l4-3 4 3M3 5l-2-1M3 8l-2 1M21 5l2-1M21 8l2 1M9 14h6M11 21v-3h2v3"/>',
  playground:'<path d="M2 21 5 6l3 15M5 6h11l5 15M9 6v9h5V6M9 15h5M2 21h20M15 14l5 7"/>',
  house:'<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7M8 10h.01M16 10h.01"/>',
  land:'<path d="m3 14 9-5 9 5-9 5-9-5Zm0 3 9 5 9-5M8 11V6l4-3 4 3v5M12 3v6"/>',
  plaza:'<path d="m3 12 9-6 9 6-9 6-9-6Zm0 4 9 6 9-6M8 9l9 6M7 15l9-6"/>',
  pine:'<path d="M12 21v-8M8 21h8M8 14C1 14 3 8 7 8 6 2 16 1 17 7c6 0 6 7 0 7H8ZM12 17l4-5"/>',
  beachbar:'<path d="M2 9 12 3l10 6M4 9h16M5 9v12M19 9v12M5 15h14M8 18v3M16 18v3"/>',
  custom:'<path d="M3 21V8l7-5 7 5v4M6 21v-8h8M2 21h10M16 21l6-6-3-3-6 6-1 4 4-1Z"/>',
  townhall:'<path d="M3 21V9l9-5 9 5v12M2 21h20M7 11v3M17 11v3M9 21v-5h6v5M7 15h10M12 4V1l6 1-6 1"/>',
  church:'<path d="M4 21V10l6-4 6 4v11M2 21h20M8 21v-5h4v5M16 21V6h5v15M18.5 2v4M17 3.5h3M18 9h1M9 10h2"/>',
  market:'<path d="M2 10 12 3l10 7M4 10h16v11H4zM8 10v11M16 10v11M2 10h20M10 21v-6h4v6"/>',
  bridge:'<path d="M2 8h20M2 5v6M22 5v6M4 8v12M20 8v12M4 19a8 8 0 0 1 16 0M8 5v3M16 5v3"/>',
  clone:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  stairs:'<path d="M3 20h18M4 20v-5h5v-5h5V5h6v15M9 15v5M14 10v10"/>',
  erase:'<path d="m4 13 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3L12 21H9l-5-5a2 2 0 0 1 0-3Zm5-5 9 9M12 21h9"/>',
};
for(const el of $$('[data-icon]'))el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon]}</svg>`;
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3300);}
function failure(message){$('#loading').hidden=true;$('#failure').hidden=false;$('#failure-message').textContent=message;}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(world));$('#save-status').textContent='Vila desada en aquest navegador.';return true;}
  catch{$('#save-status').textContent='No s’ha pogut desar al navegador. Exporta una còpia .json per conservar la vila.';toast('No s’ha pogut desar. Utilitza «Desa una còpia».');return false;}
}
function refresh(save=true){
  cancelBridge();
  scene.update(world);
  $('#diada-toggle').setAttribute('aria-pressed',String(world.diada));
  $('#diada-toggle').title=world.diada?'Amaga les banderes de la Diada':'Mostra senyeres i estelades als balcons i finestres';
  if(scene.hovered)keyboardCell={...scene.hovered};
  const houses=world.tiles.filter(t=>t.kind==='house');$('#house-count').textContent=houses.length;$('#floor-count').textContent=houses.reduce((sum,t)=>sum+floorCount(t),0);
  $('#undo').disabled=!history.past.length;$('#redo').disabled=!history.future.length;
  for(const el of $$('[data-region]'))el.setAttribute('aria-pressed',String(el.dataset.region===world.region));
  $('#region-select').value=world.region;
  $('#coast-caption').textContent=world.region==='brava'?'Cales, pins i cases de calç':'Sorra daurada i tardes de marinada';
  $('#grid-size-status').textContent=`Quadrícula actual: ${world.gridSize} × ${world.gridSize}`;$('#expand-grid').disabled=world.gridSize===GRID_SIZES.at(-1);
  describeTerrain();previewMarket(scene.hovered);previewPatio(scene.hovered);previewChurch(scene.hovered);previewTownHall(scene.hovered);previewCustom(scene.hovered);previewBeachBar(scene.hovered);previewLandmark(scene.hovered);
  if(save)persist();
}
function cancelBridge(){bridgeStart=null;scene?.setBridgePreview(null);$('#bridge-cancel').disabled=true;$('#bridge-note').textContent=instructions.bridge[1];}
function previewBridge(cell){
  if(tool!=='bridge'||!bridgeStart)return;
  scene.setBridgePreview(bridgeStart,cell,$('#bridge-type').value);$('#bridge-note').textContent=checkBridge(world,bridgeStart,cell,$('#bridge-type').value).message;
}
function landmarkOptions(){return {type:tool,size:LANDMARK_TYPES[tool]?.sizes.length===1?LANDMARK_TYPES[tool].sizes[0]:Number($(tool==='castle'?'#castle-size':tool==='cemetery'?'#cemetery-size':tool==='playground'?'#playground-size':'#civic-size').value),direction:Number($(MONUMENT_TOOLS.has(tool)&&tool!=='castle'?'#monument-direction':'#landmark-direction').value)};}
function previewLandmark(cell){if(Object.hasOwn(LANDMARK_TYPES,tool)&&cell)$('#landmark-note').textContent=checkLandmark(world,{...landmarkOptions(),x:cell.x,z:cell.z}).message;}
function describeLandmark(){
  $('label[for="landmark-direction"]').textContent=LANDMARK_TYPES[tool]?.flag?'La bandera mira cap a':'Entrada cap a';
  $('#landmark-direction-options').hidden=MONUMENT_TOOLS.has(tool)&&tool!=='castle';
  $('#monument-direction-options').hidden=!MONUMENT_TOOLS.has(tool)||tool==='castle';
  $('#castle-size-options').hidden=tool!=='castle';
  $('#cemetery-size-options').hidden=tool!=='cemetery';
  $('#playground-size-options').hidden=tool!=='playground';
  $('#civic-size-options').hidden=!['hospital','school','fireStation','recycling'].includes(tool);
  scene?.setLandmarkOptions(Object.hasOwn(LANDMARK_TYPES,tool)?landmarkOptions():null);previewLandmark(scene?.hovered);
}
function beachBarOptions(){return {direction:Number($('#beachbar-direction').value),name:$('#beachbar-name').value};}
function previewBeachBar(cell){if(tool==='beachbar'&&cell)$('#beachbar-note').textContent=checkBeachBar(world,cell.x,cell.z,beachBarOptions()).message;}
function describeBeachBar(){scene?.setBeachBarOptions(tool==='beachbar'?beachBarOptions():null);previewBeachBar(scene?.hovered);}
function previewMarket(cell){
  if(tool!=='market'||!cell)return;
  $('#market-note').textContent=checkMarket(world,{x:cell.x,z:cell.z,size:Number($('#market-size').value),direction:Number($('#market-direction').value)}).message;
}
function describeMarket(){
  scene?.setMarketOptions(tool==='market'?{size:Number($('#market-size').value),direction:Number($('#market-direction').value)}:null);
  previewMarket(scene?.hovered);
}
function previewChurch(cell){
  if(tool!=='church'||!cell)return;
  $('#church-note').textContent=checkChurch(world,{x:cell.x,z:cell.z,direction:Number($('#church-direction').value)}).message;
}
function describeChurch(){
  scene?.setChurchOptions(tool==='church'?{direction:Number($('#church-direction').value)}:null);
  previewChurch(scene?.hovered);
}
function previewTownHall(cell){
  if(tool!=='townhall'||!cell)return;
  $('#townhall-note').textContent=checkTownHall(world,{x:cell.x,z:cell.z,size:Number($('#townhall-size').value),direction:Number($('#townhall-direction').value)}).message;
}
function describeTownHall(){
  scene?.setTownHallOptions(tool==='townhall'?{size:Number($('#townhall-size').value),direction:Number($('#townhall-direction').value)}:null);
  previewTownHall(scene?.hovered);
}
function selectedDesign(){return designs.find(d=>d.id===$('#custom-design').value);}
function previewCustom(cell){
  if(tool!=='custom')return;
  const design=selectedDesign();$('#custom-note').textContent=!design?'Crea un disseny a l’editor o importa-hi una col·lecció JSON.':cell?checkCustomBuilding(world,{x:cell.x,z:cell.z,direction:Number($('#custom-direction').value),design}).message:`${design.width} × ${design.depth} cel·les. Prepara terra ferma, carrer o plaça lliure a la mateixa alçada.`;
}
function describeCustom(){
  const design=selectedDesign();scene?.setCustomOptions(tool==='custom'&&design?{design,direction:Number($('#custom-direction').value)}:null);previewCustom(scene?.hovered);
}
function refreshDesigns(){
  const previous=$('#custom-design').value;let error='';
  try{designs=loadDesigns(localStorage);}catch{designs=[];error='No s’han pogut llegir els dissenys. Obre l’editor per gestionar-los.';}
  $('#custom-design').replaceChildren();for(const d of designs)$('#custom-design').add(new Option(d.name,d.id));
  if(!designs.length)$('#custom-design').add(new Option('Encara no tens dissenys',''));
  if(designs.some(d=>d.id===previous))$('#custom-design').value=previous;
  $('#custom-design').disabled=!designs.length;describeCustom();if(error)$('#custom-note').textContent=error;
}
function patioOptions(){return {patioPosition:$('#patio-position').value,patioDirection:Number($('#patio-direction').value),patioFloors:Number($('#patio-floors').value)};}
function patioMode(){return tool==='house'&&$('#house-action').value==='build'&&$('#house-type').value==='patio';}
function previewPatio(cell){
  if(!patioMode())return;
  $('#patio-note').textContent=cell?checkPatioHouse(world,cell.x,cell.z,patioOptions()).message:'Escull la posició del pati i clica la cel·la de la casa. El marc mostra les dues cel·les.';
}
function describePatio(){
  $('#patio-options').hidden=$('#house-type').value!=='patio';
  scene?.setPatioOptions(patioMode()&&!$('#roof-direction-only').checked?patioOptions():null);
  previewPatio(scene?.hovered);
}
function applyEdit(cell,erase=false){
  if(tool==='navigate')return;
  if(tool==='clone'){if(erase)resetClone();else applyClone(cell);return;}
  if(tool==='bridge'&&!erase){
    if(!bridgeStart){
      const tile=world.tiles.find(t=>t.x===cell.x&&t.z===cell.z);
      if(!bridgeEndpoint(tile)){toast('Tria terra ferma, carrer o plaça sense cases ni arbres per començar el pont.');return;}
      bridgeStart={x:cell.x,z:cell.z};$('#bridge-cancel').disabled=false;scene.setBridgePreview(bridgeStart,null,$('#bridge-type').value);$('#bridge-note').textContent='Inici marcat. Tria l’altra riba en la mateixa fila o columna. Esc o Cancel·la per tornar a començar.';return;
    }
    const before=structuredClone(world),result=addBridge(world,bridgeStart,cell,$('#bridge-type').value);
    toast(result.message);if(result.changed){history.push(before);refresh();}return;
  }
  if(erase&&bridgeStart){cancelBridge();toast('Pont cancel·lat.');return;}
  const before=structuredClone(world);const roofOnly=tool==='house'&&roof!=='flat'&&$('#roof-direction-only').checked;
  const selectedTool=tool==='house'&&$('#house-action').value==='business'?'business':tool==='house'&&$('#house-action').value==='paint'?'paint-floor':roofOnly?'roof-direction':patioMode()?'patio-house':tool==='pine'?treeSpecies:tool==='land'?terrainType:tool;
  if(!erase&&selectedTool==='custom'&&!selectedDesign()){toast('Obre l’editor i desa un disseny abans de col·locar-lo.');return;}
  const result=editWorld(world,cell.x,cell.z,erase?'erase':selectedTool,{stairRailing:$('#stairs-railing').value,buildingName:$('#building-sign-name').value,castleSize:Number($('#castle-size').value),cemeterySize:Number($('#cemetery-size').value),civicSize:Number($('#civic-size').value),landmarkDirection:landmarkOptions().direction,playgroundSize:Number($('#playground-size').value),slopeDirection:$('#slope-direction').value==='flat'?null:Number($('#slope-direction').value),slopeFinish:$('#slope-finish').value,...patioOptions(),customDesign:selectedDesign(),customDirection:Number($('#custom-direction').value),color,roof,roofDirection,beachBarDirection:Number($('#beachbar-direction').value),beachBarName:$('#beachbar-name').value,level:!erase&&selectedTool==='paint-floor'&&$('#paint-floor').value!=='pointed'?Number($('#paint-floor').value):cell.level??null,businessFloor:Number($('#business-floor').value),businessType:$('#business-type').value,businessName:$('#business-name').value,businessDirection:Number($('#business-direction').value),businessTerrace:$('#business-terrace').checked,townHallSize:Number($('#townhall-size').value),townHallDirection:Number($('#townhall-direction').value),churchDirection:Number($('#church-direction').value),marketSize:Number($('#market-size').value),marketDirection:Number($('#market-direction').value)});
  if(result.message)toast(result.message);
  if(result.changed){history.push(before);refresh();scene.setCursor(cell.x,cell.z,erase||tool==='erase',cell.level);keyboardCell={...scene.hovered};}
}
function resetClone(){
  cloneStart=null;cloneClipboard=null;cloneStyle=null;scene?.setClonePreview(null);
  const mode=$('#clone-mode').value;
  $('#clone-note').textContent=['houses','terrain'].includes(mode)?'Marca dues cantonades de la zona que vols copiar.':mode==='editor'?'Clica una casa per copiar-ne l’estructura, les façanes i la coberta a l’editor. El pati i els negocis es conserven al joc.':mode==='style'?'Clica la casa de la qual vols copiar portals, finestres, balcons, colors i coberta.':'Clica la casa que vols copiar.';
}
function previewClone(p){
  if(tool!=='clone'||!p)return;
  if(cloneStart)scene.setClonePreview(cloneBounds(cloneStart,p));
  else if(cloneClipboard){const valid=clonePlacement(world,cloneClipboard,p).valid;scene.setClonePreview({...p,width:cloneClipboard.width,depth:cloneClipboard.depth},valid);}
}
function applyClone(p){
  try{
    const mode=$('#clone-mode').value;
    if(mode==='editor'){
      const design=houseToDesign(world,p);
      if(!persist())return;
      saveDesign(localStorage,design);
      location.href='./editor.html?design='+encodeURIComponent(design.id);return;
    }
    if(mode==='style'&&!cloneStyle){cloneStyle=captureAppearance(world,p);$('#clone-note').textContent='Estètica copiada. Clica les cases de destinació; en conservaran l’alçada i els negocis.';return;}
    if(mode!=='style'&&!cloneClipboard){
      if(['houses','terrain'].includes(mode)&&!cloneStart){cloneStart={x:p.x,z:p.z};$('#clone-note').textContent='Primera cantonada marcada. Clica l’altra cantonada.';previewClone(p);return;}
      cloneClipboard=captureClone(world,mode,cloneStart??p,p);cloneStart=null;
      $('#clone-note').textContent=`Zona copiada: ${cloneClipboard.width} × ${cloneClipboard.depth}. Clica la cantonada nord-oest de destinació. Pots enganxar diverses còpies. Esc o «Nova selecció» per acabar.`;
      previewClone(p);return;
    }
    const before=structuredClone(world),result=mode==='style'?pasteAppearance(world,cloneStyle,p):pasteClone(world,cloneClipboard,p);
    if(result.changed){history.push(before);world=result.world;refresh();previewClone(p);}
    toast(result.message);
  }catch(error){toast(error.message);}
}
function selectTool(next){
  resetClone();
  scene?.endTerrainStroke();
  cancelBridge();
  tool=next==='buildings'?$('#building-type').value:next==='monuments'?$('#monument-type').value:next;
  if(scene){scene.navigationOnly=tool==='navigate';scene.canvas.dataset.navigation=String(scene.navigationOnly);}
  const buildingMode=BUILDING_TOOLS.has(tool),monumentMode=MONUMENT_TOOLS.has(tool);
  if(monumentMode)$('#monument-type').value=tool;
  $('#monument-options').hidden=!monumentMode;
  if(buildingMode)$('#building-type').value=tool;
  $('#building-options').hidden=!buildingMode;
  $('#building-sign-options').hidden=tool!=='building-sign';
  for(const b of $$('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===(buildingMode?'buildings':monumentMode?'monuments':tool)));
  $('#tool-heading').textContent=instructions[tool][0];$('#tool-description').textContent=instructions[tool][1];$('#house-options').hidden=tool!=='house';
  $('#tree-options').hidden=tool!=='pine';
  $('#terrain-options').hidden=tool!=='land';
  $('#bridge-options').hidden=tool!=='bridge';
  $('#stairs-options').hidden=tool!=='stairs';
  $('#clone-options').hidden=tool!=='clone';
  $('#market-options').hidden=tool!=='market';
  $('#church-options').hidden=tool!=='church';
  $('#townhall-options').hidden=tool!=='townhall';
  $('#custom-options').hidden=tool!=='custom';
  $('#beachbar-options').hidden=tool!=='beachbar';
  $('#landmark-options').hidden=!Object.hasOwn(LANDMARK_TYPES,tool);
  describeLandmark();
  describeBeachBar();
  describeCustom();
  describeTownHall();
  describeChurch();
  describeMarket();
  describeHouseAction();
  // Open only when the selected tool has its own option sections.
  if($('#construction-palette').hidden&&$('#construction-palette > [id$="-options"]:not([hidden])'))controlDrawers?.set('palette',true);
  if(scene){scene.eraseCursor=tool==='erase';if(scene.hovered)scene.setCursor(scene.hovered.x,scene.hovered.z,scene.eraseCursor,scene.hovered.level);}
}
function selectColor(index){color=index;$('#color-name').textContent=COLORS[index].name;for(const b of $$('.swatch'))b.setAttribute('aria-pressed',String(Number(b.dataset.color)===index));}
function describeHouseAction(){
  describePatio();
  const businessMode=$('#house-action').value==='business',paintMode=$('#house-action').value==='paint';
  $('#house-build-options').hidden=businessMode||paintMode;$('#business-options').hidden=!businessMode;$('#paint-options').hidden=!paintMode;$('#house-color-options').hidden=businessMode;
  const fruit=$('#business-type').value==='greengrocer',grocery=$('#business-type').value==='grocery',newsstand=$('#business-type').value==='newsstand',florist=$('#business-type').value==='florist',pharmacy=$('#business-type').value==='pharmacy',fishmonger=$('#business-type').value==='fishmonger',bakery=$('#business-type').value==='bakery',butcher=$('#business-type').value==='butcher';$('#business-terrace-option').hidden=!['bar','restaurant'].includes($('#business-type').value);
  const remove=$('#business-type').value==='none',rename=$('#business-type').value==='rename';$('#business-details').hidden=remove||rename;$('#business-name-option').hidden=remove;
  $('#business-note').textContent=SPECIAL_SHOPS[$('#business-type').value]?SPECIAL_SHOPS[$('#business-type').value].description+' Tria la planta i una façana accessible i clica la casa. No necessita casella de terrassa.':rename?'Tria la planta i la façana, escriu el nou nom i clica la casa. Es conserven el tipus, la façana, la terrassa i tots els pisos.':remove?'Tria la planta i la façana i clica una casa per retirar-ne el negoci i la terrassa. Els pisos i la teulada es conserven.':butcher?'Clica una casa existent. La carnisseria té peces de carn en safates, embotits penjats, porta central i tendal granat i crema. Tria una façana lliure; no necessita cap casella de terrassa.':bakery?'Clica una casa existent. La fleca té pans rodons i barres als aparadors, porta central i tendal ocre i crema. Tria una façana lliure; no necessita cap casella de terrassa.':fishmonger?'Clica una casa existent. La peixateria té peix exposat sobre gel, porta central i tendal blau i blanc. Tria una façana lliure; no necessita cap casella de terrassa.':pharmacy?'Clica una casa existent. La farmàcia té una creu verda, porta de vidre i aparadors amb capses i flascons. Tria una façana lliure; no necessita cap casella de terrassa.':florist?'Clica una casa existent. La floristeria té una porta central, aparadors amb rams i flors de colors i un tendal. Tria una façana lliure; no necessita cap casella de terrassa.':newsstand?'Clica una casa existent. El quiosc té diaris i revistes exposats, taulell i tendal. Tria una façana lliure; no necessita cap casella de terrassa.':grocery?'Clica una casa existent. La botiga de queviures té una porta central i aparadors amb pots, llaunes, ampolles i pa. Tria una façana lliure; no necessita espai de terrassa.':fruit?'Clica una casa existent. La fruiteria té prestatgeries de fruita a banda i banda de la porta. Cal terra ferma, carrer o plaça lliure al davant, a la mateixa alçada.':$('#business-type').value==='restaurant'?'Clica una casa existent. El restaurant té rètol, tendal i carta a la façana. Amb terrassa hi afegeixes dues taules parades i quatre cadires; cal terra ferma, carrer o plaça al davant i a la mateixa alçada.':'Clica una casa existent. La terrassa posa dues taules i quatre cadires a la casella del davant: cal terra ferma, carrer o plaça lliure a la mateixa alçada. Les direccions són fixes encara que giris la vista.';
  $('#business-note').textContent=$('#business-note').textContent.replace(/una casa existent|una casa|la casa/g,text=>text==='la casa'?'la casa o l’edifici del jugador':'una casa o un edifici del jugador');
  if(tool==='house')$('#tool-description').textContent=paintMode?'Escull el color i clica la planta que vols pintar, en una casa o un edifici del jugador.':businessMode?(rename?'Escriu un nom i clica una casa amb negoci per canviar-ne el rètol.':'Tria la planta i la façana; clica una casa o un edifici del jugador.'):roof!=='flat'&&$('#roof-direction-only').checked?'Clica una casa amb teulada a una o dues aigües, o golfes i terrat, per aplicar-hi l’orientació escollida.':patioMode()?`Tria la posició del pati, la façana i d’1 a ${CONFIG.houses.maxPatioFloors} plantes. Clica la casa per construir o aplicar els canvis.`:instructions.house[1];
}
function describeRoof(){
  $('#roof-direction-options').hidden=roof==='flat';
  if(roof==='flat')$('#roof-direction-only').checked=false;
  $('#roof-direction-label').textContent=roof==='attic'?'Terrat cap a':roof==='tile'?'Una vessant cap a':'Inclinació cap a';
  $('#roof-direction-note').textContent=roof==='attic'?'Les golfes queden a la meitat oposada del terrat. Les direccions són fixes encara que giris la vista.':roof==='tile'?'L’altra vessant mira al costat oposat. Est/Oest i Nord/Sud comparteixen l’eix de la carena. Les direccions són fixes encara que giris la vista.':'Indica el costat baix. Les direccions són fixes encara que giris la vista.';
  describeHouseAction();
}
describeRoof();
function describeTree(){const species=TREE_SPECIES.find(s=>s.id===treeSpecies);$('#tree-note').textContent=(species.scientific?species.scientific+' · ':'')+species.description+' Conserva la pradera, la roca o el carrer on el plantes, amb un parterre al tronc. Sobre terra ferma no porta parterre.';}
function describeTerrain(){
  $('#slope-options').hidden=terrainType!=='slope';
  if(terrainType==='slope'){$('#terrain-note').textContent=$('#slope-direction').value==='flat'?'Retira el pendent i deixa el terreny al nivell inferior. Els elements es conserven.':'Puja un nivell cap al costat escollit. Clica al nivell inferior (0–3). Els carrers segueixen el pendent; els edificis recolzen sobre fonaments horitzontals al nivell superior.';return;}

  if(terrainType==='rocky'){$('#terrain-note').textContent='Pedra grisa amb afloraments irregulars. Conserva l’alçada i el pendent; permet construir-hi, plantar-hi i pavimentar. Terra ferma permet elevar-lo; esborrar retira l’acabat rocós.';return;}
  if(terrainType==='meadow'){$('#terrain-note').textContent='Pradera verda amb floretes blanques, grogues i rosades. Clica per cobrir el terreny conservant-ne l’alçada i el pendent. Terra ferma permet elevar-lo; esborrar retira la pradera.';return;}
  const roads={cobble:'Empedrat de pedra amb juntes i tons variats.',dirt:'Terra ocre amb grava fina.',asphalt:'Asfalt gris fosc amb un acabat granulat.'};
  if(roads[terrainType]){$('#terrain-note').textContent=roads[terrainType]+' Clica per pavimentar sense canviar l’alçada. Terra ferma permet elevar-lo; esborrar retira el paviment.';return;}
  $('#terrain-note').textContent=terrainType==='land'?'Clica per crear terra o elevar-la. Sobre una platja, torna a crear terra ferma.':world?.region==='daurada'?'Sorra amb pendent suau i una entrada llarga sota l’aigua. Uneix caselles per ampliar la platja.':'Sorra de cala amb més pendent i una entrada més curta sota l’aigua. Uneix caselles per ampliar-la.';
}
for(const species of TREE_SPECIES){const option=document.createElement('option');option.value=species.id;option.textContent=species.name;$('#tree-species').append(option);}
describeTree();
for(const [index,c] of COLORS.entries()){
  const b=document.createElement('button');b.className='swatch';b.dataset.color=index;b.style.setProperty('--swatch',c.hex);b.setAttribute('aria-label',c.name);b.title=c.name;b.setAttribute('aria-pressed',String(index===0));b.addEventListener('click',()=>selectColor(index));$('.swatches').append(b);
}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function exportVillage(){download(new Blob([JSON.stringify(world,null,2)],{type:'application/json'}),`vila-${world.region==='brava'?'costa-brava':'costa-daurada'}.json`);toast('Còpia de la vila preparada.');closeMenu();}
function closeMenu(){$('#village-menu').hidden=true;$('#file-menu').setAttribute('aria-expanded','false');}
function undo(){const previous=history.undo(world);if(previous){world=previous;refresh();toast('Canvi desfet.');}}
function changeRegion(region){
  if(world.region===region||!['brava','daurada'].includes(region))return;
  scene.endTerrainStroke();history.push(world);world.region=region;selectColor(region==='brava'?0:1);refresh();
  toast(region==='brava'?'Costa Brava: roca, calç i pins.':'Costa Daurada: sorra i colors càlids.');
}
function redo(){const next=history.redo(world);if(next){world=next;refresh();toast('Canvi refet.');}}
function openDialog(selector){closeMenu();$(selector).showModal();}

async function init(){
  $('#house-type option[value="standard"]').textContent=`Casa habitual · fins a ${CONFIG.houses.maxFloors} plantes`;
  $('#house-type option[value="patio"]').textContent=`Casa amb pati · màxim ${CONFIG.houses.maxPatioFloors} plantes`;
  $('#patio-floors').replaceChildren(...Array.from({length:CONFIG.houses.maxPatioFloors},(_,i)=>new Option(`${i+1} ${i===0?'planta':'plantes'}`,i+1)));
  $('#business-floor').replaceChildren(...Array.from({length:Math.max(3,CONFIG.houses.maxFloors-1)},(_,i)=>new Option(i===0?'Planta baixa':`Planta ${i+1} · accés des de terreny elevat`,i)));
  $('#paint-floor').append(...Array.from({length:Math.max(4,CONFIG.houses.maxFloors)},(_,i)=>new Option(i===0?'Planta baixa':`Planta ${i+1}`,i)));
  for(const id of ['new-grid-size','expand-grid-size'])$('#'+id).replaceChildren(...GRID_SIZES.map(size=>new Option(`${size} × ${size}`,size)));
  $('#new-grid-size').value=String(CONFIG.grid.defaultSize);
  $('#bridge-note').textContent=instructions.bridge[1];
  for(const el of $$('[data-config-text]')){
    const labels={house:`màxim ${CONFIG.houses.maxFloors} plantes`,patio:`d’1 a ${CONFIG.houses.maxPatioFloors} plantes`,grid:GRID_SIZES.map(n=>`${n} × ${n}`).join(', '),bridge:`entre ${CONFIG.bridges.minLength} i ${CONFIG.bridges.maxLength} caselles`};
    el.textContent=labels[el.dataset.configText];
  }
  $('#monument-type').replaceChildren(...[...MONUMENT_TOOLS].map(([id,name])=>new Option(name,id)));
  $('#monument-type').addEventListener('change',e=>selectTool(e.target.value));
  $('#building-type').replaceChildren(...[...BUILDING_TOOLS].map(([id,name])=>new Option(name,id)));
  $('#building-type').addEventListener('change',e=>selectTool(e.target.value));
  let storageWarning='',stored=null;
  try{stored=[STORAGE_KEY,...LEGACY_STORAGE_KEYS].map(key=>localStorage.getItem(key)).find(value=>value!==null);world=stored?validateWorld(JSON.parse(stored)):createWorld();}
  catch(error){
    if(stored!==null){
      failure(`No s’ha pogut obrir la vila desada: ${error.message} Revisa config.js i torna-ho a provar. Pots descarregar el desament original; no s’ha modificat.`);
      $('#recover-save').hidden=false;
      $('#recover-save').addEventListener('click',()=>download(new Blob([stored],{type:'application/json'}),'vila-mediterrania-recuperada.json'));
      return;
    }
    world=createWorld();storageWarning='No s’ha pogut llegir el desament del navegador.';
  }
  const {VillageScene}=await import('./scene.js');
  scene=new VillageScene($('#world'),{onClick:applyEdit,
    onTerrainStrokeStart:()=>{
      if(tool!=='land'||$$('dialog').some(d=>d.open))return false;
      terrainStroke=new TerrainStroke(world,terrainType,{color,roof,slopeDirection:$('#slope-direction').value==='flat'?null:Number($('#slope-direction').value),slopeFinish:$('#slope-finish').value},history);
      return true;
    },
    onTerrainStrokeMove:p=>{if(terrainStroke?.visit(p))refresh();},
    onTerrainStrokeEnd:()=>{terrainStroke=null;},
    onHover:p=>{keyboardCell=p;previewClone(p);previewBridge(p);previewMarket(p);previewPatio(p);previewChurch(p);previewTownHall(p);previewCustom(p);previewBeachBar(p);previewLandmark(p);},onError:failure,onCameraChange:({theta,phi})=>updateCompass($('#compass'),theta,phi)});
  refreshDesigns();
  for(const id of ['custom-design','custom-direction'])$('#'+id).addEventListener('change',describeCustom);
  for(const link of $$('a[href="./editor.html"]'))link.addEventListener('click',persist);
  window.addEventListener('storage',e=>{if(e.key===DESIGN_KEY)refreshDesigns();});
  window.addEventListener('focus',refreshDesigns);
  $('#game-version-label').textContent='Versió '+$('meta[name="game-version"]').content;
  $('#clone-mode').addEventListener('change',resetClone);$('#clone-reset').addEventListener('click',resetClone);
  initMusic();
  controlDrawers=initControlDrawers();
  initVersionNotice({currentVersion:Number($('meta[name="game-version"]').content),beforeReload:()=>{scene.endTerrainStroke();return persist();}});
  refresh(false);scene.setLight(Number($('#light').value));$('#loading').hidden=true;
  if(storageWarning)toast(storageWarning);
  for(const b of $$('[data-tool]'))b.addEventListener('click',()=>selectTool(b.dataset.tool));
  for(const b of $$('[data-region]'))b.addEventListener('click',()=>changeRegion(b.dataset.region));
  $('#region-select').addEventListener('change',e=>changeRegion(e.target.value));
  $('#house-action').addEventListener('change',describeHouseAction);
  $('#house-type').addEventListener('change',()=>{$('#roof-direction-only').checked=false;describeHouseAction();});
  for(const id of ['patio-position','patio-direction','patio-floors'])$('#'+id).addEventListener('change',describePatio);
  $('#business-type').addEventListener('change',describeHouseAction);
  $('#roof').addEventListener('change',e=>{roof=e.target.value;describeRoof();});
  $('#roof-direction').addEventListener('change',e=>{roofDirection=Number(e.target.value);});
  $('#roof-direction-only').addEventListener('change',describeHouseAction);
  for(const id of ['castle-size','playground-size','cemetery-size','civic-size','landmark-direction','monument-direction'])$('#'+id).addEventListener('change',describeLandmark);
  for(const id of ['townhall-size','townhall-direction'])$('#'+id).addEventListener('change',describeTownHall);
  $('#beachbar-direction').addEventListener('change',describeBeachBar);
  $('#beachbar-name').addEventListener('input',describeBeachBar);
  $('#church-direction').addEventListener('change',describeChurch);
  $('#market-size').addEventListener('change',describeMarket);
  $('#market-direction').addEventListener('change',describeMarket);
  $('#bridge-type').addEventListener('change',()=>{if(bridgeStart)previewBridge(scene.hovered);});
  $('#bridge-cancel').addEventListener('click',cancelBridge);
  $('#tree-species').addEventListener('change',e=>{treeSpecies=e.target.value;describeTree();});
  $('#slope-direction').addEventListener('change',describeTerrain);
  $('#slope-finish').addEventListener('change',describeTerrain);
  $('#terrain-type').addEventListener('change',e=>{terrainType=e.target.value;describeTerrain();});
  $('#light').addEventListener('input',e=>{const v=Number(e.target.value);scene.setLight(v);$('#light-name').textContent=v<25?'Matí':v<60?'Migdia':v<85?'Tarda':'Capvespre';});
  $('#diada-toggle').addEventListener('click',()=>{history.push(world);world.diada=!world.diada;refresh();toast(world.diada?'Banderes de la Diada activades.':'Banderes de la Diada desactivades.');});
  $('#grid').addEventListener('click',()=>{scene.grid.visible=!scene.grid.visible;$('#grid').setAttribute('aria-pressed',String(scene.grid.visible));});
  $('#zoom-in').addEventListener('click',()=>scene.zoom(.83));$('#zoom-out').addEventListener('click',()=>scene.zoom(1.2));$('#rotate').addEventListener('click',()=>scene.rotate());$('#home-view').addEventListener('click',()=>scene.home());
  $('#undo').addEventListener('click',undo);$('#redo').addEventListener('click',redo);
  $('#help').addEventListener('click',()=>openDialog('#help-dialog'));
  for(const b of $$('.close-dialog,.close-help'))b.addEventListener('click',()=>b.closest('dialog').close());
  for(const dialog of $$('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  $('#file-menu').addEventListener('click',()=>{const show=$('#village-menu').hidden;$('#village-menu').hidden=!show;$('#file-menu').setAttribute('aria-expanded',String(show));});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#village-menu,#file-menu'))closeMenu();});
  $('#export').addEventListener('click',exportVillage);$('#save-before-new').addEventListener('click',exportVillage);
  $('#import').addEventListener('click',()=>{$('#file-input').click();closeMenu();});
  $('#file-input').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>8_000_000)throw new Error('El fitxer és massa gran (màxim 8 MB).');const loaded=validateWorld(JSON.parse(await file.text()));history.push(world);world=loaded;refresh();scene.home();toast('Vila recuperada. Ja pots continuar construint.');}
    catch(error){toast(error instanceof SyntaxError?'El fitxer no conté un JSON vàlid.':error.message);}finally{e.target.value='';}
  });
  $('#photo').addEventListener('click',async()=>{closeMenu();try{download(await scene.photograph(),'vila-mediterrania.png');toast('Fotografia preparada.');}catch(error){toast(error.message);}});
  $('#new-village').addEventListener('click',()=>{$('#new-grid-size').value=String(world.gridSize);openDialog('#new-dialog');});
  $('#expand-grid').addEventListener('click',()=>{
    const choices=GRID_SIZES.filter(size=>size>world.gridSize);if(!choices.length)return;
    for(const option of $('#expand-grid-size').options)option.disabled=Number(option.value)<=world.gridSize;
    $('#expand-grid-size').value=String(choices[0]);$('#expand-grid-current').textContent=`La vila ocupa una quadrícula de ${world.gridSize} × ${world.gridSize} cel·les.`;openDialog('#expand-grid-dialog');
  });
  $('#apply-grid-expansion').addEventListener('click',()=>{
    const before=structuredClone(world),result=expandWorld(world,Number($('#expand-grid-size').value));
    if(result.changed){history.push(before);refresh();$('#expand-grid-dialog').close();}toast(result.message);
  });
  for(const b of $$('[data-preset]'))b.addEventListener('click',()=>{history.push(world);world=createWorld(world.region,b.dataset.preset,Number($('#new-grid-size').value));refresh();scene.home({wholeGrid:b.dataset.preset==='coast80'});$('#new-dialog').close();toast(b.dataset.preset==='coast80'?'Costa creada: terra a l’oest i mar a l’est.':'Un nou racó de mar per imaginar.');});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){resetClone();cancelBridge();closeMenu();return;}
    if(['Enter',' '].includes(e.key)&&e.target.closest('button,a'))return;
    if($$('dialog').some(d=>d.open)||e.target.matches('input,select,textarea'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();exportVillage();return;}
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const shortcuts={'n':'navigate','1':'house','2':'land','3':'plaza','4':'pine','5':'stairs','6':'bridge','7':'market','8':'church','9':'townhall','b':'custom','g':'beachbar','f':'lighthouse','p':'playground','e':'erase'};
    if(shortcuts[e.key.toLowerCase()]){selectTool(shortcuts[e.key.toLowerCase()]);return;}
    if(e.key==='?'){openDialog('#help-dialog');return;}
    if(e.key==='0'){scene.home();return;}
    if(e.key==='+'||e.key==='='){scene.zoom(.87);return;}if(e.key==='-'){scene.zoom(1.15);return;}
    if(e.target!==$('#world'))return;
    if(e.key.startsWith('Arrow')){
      e.preventDefault();const dirs={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};const d=dirs[e.key];
      if(d){keyboardCell.x=Math.max(-worldLimit(world),Math.min(worldLimit(world),keyboardCell.x+d[0]));keyboardCell.z=Math.max(-worldLimit(world),Math.min(worldLimit(world),keyboardCell.z+d[1]));scene.setCursor(keyboardCell.x,keyboardCell.z,tool==='erase');keyboardCell={...scene.hovered};previewBridge(keyboardCell);previewMarket(keyboardCell);previewPatio(keyboardCell);previewChurch(keyboardCell);previewTownHall(keyboardCell);previewCustom(keyboardCell);previewBeachBar(keyboardCell);previewLandmark(keyboardCell);}
    }
    if(e.key==='PageUp'||e.key==='PageDown'){
      e.preventDefault();const t=world.tiles.find(t=>t.x===keyboardCell.x&&t.z===keyboardCell.z);
      const custom=customAt(world,keyboardCell.x,keyboardCell.z);
      if(custom){
        const index=customCells(custom).findIndex(p=>p.x===keyboardCell.x&&p.z===keyboardCell.z),floors=customFloors(custom.design,index);
        const level=Math.max(0,Math.min(floors-1,(keyboardCell.level??floors-1)+(e.key==='PageUp'?1:-1)));
        scene.setCursor(keyboardCell.x,keyboardCell.z,tool==='erase',level);keyboardCell={...scene.hovered};toast(`Planta ${level+1} de ${floors}`);
      }else if(t?.kind==='house'){
        const level=Math.max(0,Math.min(t.floors-1,(keyboardCell.level??t.floors-1)+(e.key==='PageUp'?1:-1)));
        scene.setCursor(t.x,t.z,tool==='erase',level);keyboardCell={...scene.hovered};
        toast(`Pis ${level+1} de ${t.floors}${t.levels[level]?'':' · buit amb suports'}`);
      }
    }
    if(e.key==='Enter'||e.key===' '){e.preventDefault();applyEdit(keyboardCell);}
    if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();applyEdit(keyboardCell,true);}
  });
  window.addEventListener('pagehide',()=>scene.dispose(),{once:true});
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  if(new URLSearchParams(location.search).get('tool')==='custom')selectTool('custom');
}
init().catch(error=>{console.error(error);failure('Cal un navegador amb WebGL 2 i l’acceleració gràfica activada. Si has descarregat el joc, executa Inicia-Windows.bat o obre’l amb un servidor local. Detall: '+error.message);});
