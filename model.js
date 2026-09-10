import {CONFIG} from './config.js';
import {normalizeBusinessName,BUSINESS_NAMES} from './business-signs.js';
import {validateDesign,customCells,customAt} from './designs.js';
/** Estat del joc independent del renderitzador. Cap dependència externa. */
export const LIMIT = (CONFIG.grid.defaultSize-1)/2;
export const GRID_SIZES = [...CONFIG.grid.sizes].sort((a,b)=>a-b);
export const worldLimit = world => ((world?.gridSize??CONFIG.grid.defaultSize)-1)/2;
export function expandWorld(world,gridSize){
  if(!GRID_SIZES.includes(gridSize))return {changed:false,message:'Tria una mida de quadrícula vàlida.'};
  if(gridSize<=world.gridSize)return {changed:false,message:'Tria una quadrícula més gran que l’actual.'};
  world.gridSize=gridSize;return {changed:true,message:`Quadrícula ampliada a ${gridSize} × ${gridSize}. La vila es conserva.`};
}
export const ROAD_TYPES = ['cobble','dirt','asphalt'];
export const isRoad = kind => ROAD_TYPES.includes(kind);
export const isFirmGround = kind => kind==='land'||kind==='meadow'||kind==='plaza'||isRoad(kind);
export const MAX_FLOORS = CONFIG.houses.maxFloors;
export const MAX_TERRAIN_LEVEL = CONFIG.terrain.maxElevation;
export const MAX_PATIO_FLOORS = CONFIG.houses.maxPatioFloors;
export const FLOOR_HEIGHT = .86;
export const BUSINESS_TYPES = Object.keys(BUSINESS_NAMES);
export const TREE_SPECIES = [
  {id:'pine',name:'Pi mediterrani',height:1.9,description:'Capçada en para-sol i tronc esvelt.'},
  {id:'palm',name:'Margalló',scientific:'Chamaerops humilis',height:1.55,description:'Mata baixa amb diversos troncs i fulles en ventall.'},
  {id:'oak',name:'Alzina',scientific:'Quercus ilex',height:2.25,description:'Capçada arrodonida i densa, de verd fosc.'},
  {id:'plane',name:'Plàtan d’ombra',scientific:'Platanus × hispanica',height:3,description:'Capçada ampla i tronc clar amb taques.'},
  {id:'olive',name:'Olivera',scientific:'Olea europaea',height:2.15,description:'Tronc nuós, fullatge gris verdós i petites olives.'},
  {id:'vine',name:'Parra',scientific:'Vitis vinifera',height:1.85,description:'Emparrat de fusta cobert de fulles, amb raïms penjants.'},
  {id:'hazel',name:'Avellaner',scientific:'Corylus avellana',height:2.2,description:'Diversos troncs, capçada arrodonida i grups d’avellanes.'},
];
export const isTree = kind => TREE_SPECIES.some(s=>s.id===kind);
export const COLORS = [
  {name:'Calç',hex:'#f5eee0'}, {name:'Sorra',hex:'#e7ca92'},
  {name:'Terracota',hex:'#db947b'}, {name:'Blau marí',hex:'#84adb6'},
  {name:'Oliva',hex:'#aabb97'}, {name:'Rosa',hex:'#e5b6aa'},
];
export const key = (x,z) => `${x},${z}`;
export const randomAt = (x,z,s=0) => { const n=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453; return n-Math.floor(n); };
export const hasSlope = tile => tile?.slopeDirection!==undefined;
export const groundLevel = tile => tile.elevation+(hasSlope(tile)?1:0);
export const terrainBaseY = tile => .25+tile.elevation*.42;
// Buildings rest horizontally at the upper edge; the terrain itself is a plane.
export const terrainY = tile => .25+groundLevel(tile)*.42;
export function terrainSurfaceY(tile,u=0,v=0){
  if(!hasSlope(tile))return terrainBaseY(tile);
  const [dx,dz]=DIRECTIONS[tile.slopeDirection];
  return terrainBaseY(tile)+.42*(.5+Math.max(-.5,Math.min(.5,u*dx+v*dz)));
}
export const DIRECTIONS = [[0,1],[1,0],[0,-1],[-1,0]];
// Index 0 is the lowest level. False entries are openings; floors is the height.
export const floorCount = tile => tile.levels.filter(Boolean).length;
export function createWorld(region='brava',preset='village',gridSize=CONFIG.grid.defaultSize) {
  if(!GRID_SIZES.includes(gridSize))throw new Error('Mida de quadrícula no vàlida.');
  const world={version:41,diada:CONFIG.flags.enabledByDefault,gridSize,region,tiles:[],bridges:[],markets:[],churches:[],townHalls:[],customBuildings:[],landmarks:[]};
  if(preset==='empty') return world;
  if(preset==='coast80'){
    const limit=worldLimit(world),target=Math.round(gridSize*gridSize*.80);
    const baseWidth=Math.floor(target/gridSize),extra=target%gridSize;
    const extraStart=Math.floor((gridSize-extra)/2),amplitude=gridSize>=49?2:1;
    // Paired offsets preserve the exact cell budget while making a gently curved coast.
    const offsets=Array(gridSize).fill(0);
    for(let row=0;row<limit;row++){
      offsets[row]=Math.round(amplitude*Math.sin(2*Math.PI*row/(gridSize-1)));
      offsets[gridSize-1-row]=-offsets[row];
    }
    const sandWidth=region==='daurada'?2:1;
    for(let row=0;row<gridSize;row++){
      const width=baseWidth+offsets[row]+(row>=extraStart&&row<extraStart+extra?1:0);
      for(let col=0;col<width;col++)world.tiles.push({
        x:col-limit,z:row-limit,elevation:0,kind:col>=width-sandWidth?'beach':'land',
        floors:0,levels:[],color:0,roof:'tile',roofDirection:0,rotation:0,business:null,
      });
    }
    return world;
  }
  for(let x=-7;x<=7;x++) for(let z=-6;z<=5;z++) {
    const n=randomAt(x,z,1);
    const distance=(x+.8)**2/39+(z+.45)**2/22;
    // A small inlet gives the initial island a harbour-like outline.
    if(distance>1+(n-.5)*.17 || (x>2&&z>1&&((x-4)**2+(z-3)**2)<8)) continue;
    const elevation=Math.min(MAX_TERRAIN_LEVEL,region==='brava' ? Math.max(0,Math.min(3,Math.floor((-z+1)/2.6))) : Math.max(0,Math.min(1,Math.floor((-z+1)/4))));
    const tile={x,z,elevation,kind:'land',floors:0,color:0,roof:'tile',roofDirection:0,rotation:0,business:null};
    if(preset==='village') {
      if((z===0||x===0)&&distance<.85) tile.kind='plaza';
      else if(distance<.68 && n>.25 && z!==-4) {
        tile.kind='house';tile.floors=Math.min(MAX_FLOORS,1+Math.floor(randomAt(x,z,3)*2.7));
        tile.color=region==='brava'?(n>.82?2:0):[1,2,5,0][Math.floor(n*4)];
        tile.roof=randomAt(x,z,8)>.78?'flat':'tile';
      } else if(n>.70 && z<2) tile.kind='pine';
      if(x===0&&(z===-1||z===-3)){tile.kind='stairs';tile.rotation=2;}
    }
    tile.levels=Array(tile.floors).fill(true);
    world.tiles.push(tile);
  }
  return world;
}
export function validateWorld(input) {
  const gridSize=input?.version<13?33:input?.gridSize;
  if(!GRID_SIZES.includes(gridSize))throw new Error('Mida de quadrícula no vàlida.');
  const limit=(gridSize-1)/2;
  if(!input||![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41].includes(input.version)||!['brava','daurada'].includes(input.region)||!Array.isArray(input.tiles)||input.tiles.length>gridSize**2) throw new Error('Aquest fitxer no és una vila compatible (formats 1–41).');
  const diada=input.version<40?false:input.diada;
  if(typeof diada!=='boolean')throw new Error('L’opció de banderes de la Diada no és vàlida.');
  const seen=new Set();
  const tiles=input.tiles.map(t=>{
    if(t?.floors>MAX_FLOORS)throw new Error(`La vila té una casa de ${t.floors} plantes; config.js permet ${MAX_FLOORS} (houses.maxFloors).`);
    if(t?.elevation>MAX_TERRAIN_LEVEL)throw new Error(`La vila té terreny de nivell ${t.elevation}; config.js permet ${MAX_TERRAIN_LEVEL} (terrain.maxElevation).`);
    if(!t||!Number.isInteger(t.x)||!Number.isInteger(t.z)||Math.abs(t.x)>limit||Math.abs(t.z)>limit||!Number.isInteger(t.elevation)||t.elevation<0||t.elevation>MAX_TERRAIN_LEVEL||(!['land','meadow','beach','house','plaza','stairs'].includes(t.kind)&&!isTree(t.kind)&&!isRoad(t.kind))||!Number.isInteger(t.floors)||t.floors<0||t.floors>MAX_FLOORS||!Number.isInteger(t.color)||t.color<0||t.color>=COLORS.length||!['tile','shed','flat'].includes(t.roof)||!Number.isInteger(t.rotation)||t.rotation<0||t.rotation>3||(t.kind==='house'&&t.floors<1)||(t.kind!=='house'&&t.floors!==0)) throw new Error('El fitxer conté una casella amb dades no vàlides.');
    const k=key(t.x,t.z);if(seen.has(k))throw new Error('El fitxer conté caselles repetides.');seen.add(k);
    if(t.kind==='beach'&&t.elevation!==0)throw new Error('Les platges han d’estar al nivell de la costa.');
    const slopeDirection=input.version<29?undefined:t.slopeDirection;
    if(slopeDirection!==undefined&&(!Number.isInteger(slopeDirection)||slopeDirection<0||slopeDirection>3||t.elevation>=MAX_TERRAIN_LEVEL||t.kind==='beach'))throw new Error('El pendent ha de pujar un nivell, tenir una orientació vàlida i estar sobre terra ferma.');
    const roofDirection=input.version<6?0:t.roofDirection;
    if(!Number.isInteger(roofDirection)||roofDirection<0||roofDirection>3)throw new Error('L’orientació de la teulada no és vàlida.');
    const levels=input.version===1?Array(t.floors).fill(true):t.levels;
    if(!Array.isArray(levels)||levels.length!==t.floors||Array.from(levels).some(v=>typeof v!=='boolean')||(levels.length&&!levels.at(-1)))throw new Error('La distribució dels pisos no és vàlida.');
    const business=input.version<8?null:t.business;
    if(business!==null&&(!business||!BUSINESS_TYPES.includes(business.type)||!Number.isInteger(business.direction)||business.direction<0||business.direction>3||typeof business.terrace!=='boolean'||(!['bar','restaurant'].includes(business.type)&&business.terrace)||t.kind!=='house'||!levels[0]))throw new Error('El negoci de la planta baixa no és vàlid.');
    const upperBusinesses=input.version<31?[]:normalizeUpperBusinesses(t,levels);
    const beachBar=input.version<24?undefined:t.beachBar;
    if(beachBar!==undefined&&(t.kind!=='beach'||t.elevation!==0))throw new Error('Les guinguetes només es poden posar a la platja.');
    const beachBarData=beachBar===undefined?undefined:normalizeBeachBar(beachBar);
    const patio=input.version<14?null:t.patio;
    if(patio!=null&&(t.kind!=='house'||t.floors>MAX_PATIO_FLOORS||!['front','back'].includes(patio.position)||!Number.isInteger(patio.direction)||patio.direction<0||patio.direction>3))throw new Error(`La casa amb pati ha de tenir d’1 a ${MAX_PATIO_FLOORS} plantes i una posició i orientació vàlides.`);
    return {...(upperBusinesses.length?{upperBusinesses}:{}),...(slopeDirection!==undefined?{slopeDirection}:{}),...(beachBarData?{beachBar:beachBarData}:{}),...(patio!=null?{patio:{position:patio.position,direction:patio.direction}}:{}),business:business===null?null:{type:business.type,direction:business.direction,terrace:business.terrace,...(business.name!==undefined&&normalizeBusinessName(business.name)?{name:normalizeBusinessName(business.name)}:{})},x:t.x,z:t.z,elevation:t.elevation,kind:t.kind,floors:t.floors,levels:[...levels],color:t.color,roof:t.roof,roofDirection,rotation:t.rotation};
  });
  const world={version:41,diada,gridSize,region:input.region,tiles,bridges:[],markets:[],churches:[],townHalls:[],customBuildings:[],landmarks:[]};
  const bridges=input.version<7?[]:input.bridges;
  if(!Array.isArray(bridges)||bridges.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista de ponts no és vàlida.');
  for(const b of bridges){
    const result=checkBridge(world,b?.a,b?.b,b?.type??'classic');
    if(!result.valid)throw new Error('Pont no vàlid: '+result.message);
    addBridge(world,b.a,b.b,b.type??'classic');
  }
  const markets=input.version<12?[]:input.markets;
  if(!Array.isArray(markets)||markets.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista de mercats no és vàlida.');
  for(const m of markets){
    const result=checkMarket(world,m);
    if(!result.valid)throw new Error('Mercat no vàlid: '+result.message);
    world.markets.push({x:m.x,z:m.z,size:m.size,direction:m.direction});
  }
  const churches=input.version<15?[]:input.churches;
  if(!Array.isArray(churches)||churches.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista d’esglésies no és vàlida.');
  for(const c of churches){
    const result=checkChurch(world,c);
    if(!result.valid)throw new Error('Església no vàlida: '+result.message);
    world.churches.push({x:c.x,z:c.z,direction:c.direction});
  }
  const townHalls=input.version<16?[]:input.townHalls;
  if(!Array.isArray(townHalls)||townHalls.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista d’ajuntaments no és vàlida.');
  for(const h of townHalls){
    const result=checkTownHall(world,h);
    if(!result.valid)throw new Error('Ajuntament no vàlid: '+result.message);
    world.townHalls.push({x:h.x,z:h.z,size:h.size,direction:h.direction});
  }
  const customs=input.version<17?[]:input.customBuildings;
  if(!Array.isArray(customs)||customs.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista d’edificis del jugador no és vàlida.');
  for(const b of customs){
    const design=validateDesign(b?.design),candidate={x:b.x,z:b.z,direction:b.direction,design},result=checkCustomBuilding(world,candidate);
    if(!result.valid)throw new Error('Edifici del jugador no vàlid: '+result.message);
    world.customBuildings.push(candidate);
  }
  const landmarks=input.version<30?[]:input.landmarks;
  if(!Array.isArray(landmarks)||landmarks.length>CONFIG.limits.objectsPerCategory)throw new Error('La llista d’edificis i equipaments no és vàlida.');
  for(const l of landmarks){
    const result=checkLandmark(world,l);if(!result.valid)throw new Error('Far o parc infantil no vàlid: '+result.message);
    world.landmarks.push({type:l.type,x:l.x,z:l.z,size:l.size,direction:l.direction});
  }
  for(const t of tiles.filter(t=>t.patio)){
    const result=checkPatioHouse(world,t.x,t.z,{patioPosition:t.patio.position,patioDirection:t.patio.direction,patioFloors:t.floors});
    const p=patioCell(t),ground=tiles.find(c=>c.x===p.x&&c.z===p.z);
    if(!result.valid||!ground)throw new Error('Pati no vàlid: '+(result.message||'Falta el terreny.'));
  }
  return world;
}

/** A beach bar occupies its beach tile without changing the sand profile. */
export function normalizeBeachBar(value){
  if(!value||!Number.isInteger(value.direction)||value.direction<0||value.direction>3)throw new Error('Tria una orientació vàlida per a la guingueta.');
  const name=normalizeBusinessName(value.name===undefined?'':value.name);
  return {direction:value.direction,...(name?{name}:{})};
}
export function checkBeachBar(world,x,z,options={direction:0}){
  let data;try{data=normalizeBeachBar(options);}catch(error){return {valid:false,message:error.message};}
  const t=world.tiles.find(t=>t.x===x&&t.z===z);
  if(!t||t.kind!=='beach'||t.elevation!==0)return {valid:false,message:'La guingueta només es pot posar en una cel·la de platja. Pinta primer la sorra amb Terreny → Platja.'};
  if(bridgeAt(world,x,z)||marketAt(world,x,z)||churchAt(world,x,z)||townHallAt(world,x,z)||(landmarkAt(world,x,z)||customAt(world,x,z))||patioAt(world,x,z))return {valid:false,message:'Aquest espai ja està ocupat. Tria una altra cel·la de platja.'};
  return {valid:true,data,message:t.beachBar?'Clica per aplicar el nom i l’orientació a aquesta guingueta.':'Platja disponible. Clica per construir la guingueta.'};
}

/** A courtyard reserves the neighbouring cell relative to the main entrance. */
export const patioDirection=t=>(t.patio.direction+(t.patio.position==='back'?2:0))%4;
export function patioCell(t){const [dx,dz]=DIRECTIONS[patioDirection(t)];return {x:t.x+dx,z:t.z+dz};}
export const patioAt=(world,x,z)=>world.tiles.find(t=>{if(!t.patio)return false;const p=patioCell(t);return p.x===x&&p.z===z;});
export function checkPatioHouse(world,x,z,{patioPosition,patioDirection:direction=0,patioFloors=1}={}){
  if(!['front','back'].includes(patioPosition))return {valid:false,message:'Escull si vols el pati al davant o al darrere.'};
  if(!Number.isInteger(direction)||direction<0||direction>3||(!Number.isInteger(patioFloors)||patioFloors<1||patioFloors>MAX_PATIO_FLOORS))return {valid:false,message:`Tria una orientació vàlida i d’1 a ${MAX_PATIO_FLOORS} plantes.`};
  const house=world.tiles.find(t=>t.x===x&&t.z===z),candidate={x,z,patio:{position:patioPosition,direction}},p=patioCell(candidate),spaces=businessSpaces(world);
  for(const c of [{x,z},p]){
    if(!Number.isInteger(c.x)||!Number.isInteger(c.z)||Math.abs(c.x)>worldLimit(world)||Math.abs(c.z)>worldLimit(world))return {valid:false,message:'La casa i el pati han de quedar dins la quadrícula.'};
    const owner=patioAt(world,c.x,c.z);
    if((owner&&owner!==house)||(landmarkAt(world,c.x,c.z)||customAt(world,c.x,c.z))||townHallAt(world,c.x,c.z)||churchAt(world,c.x,c.z)||marketAt(world,c.x,c.z)||bridgeAt(world,c.x,c.z)||spaces.has(key(c.x,c.z)))return {valid:false,message:'La casa o el pati coincideixen amb un altre pati, mercat, pont o terrassa.'};
    const t=world.tiles.find(t=>t.x===c.x&&t.z===c.z);
    if(t&&!isFirmGround(t.kind)&&!(t===house&&t.kind==='house'))return {valid:false,message:'Cal terra ferma, carrer o plaça lliure per al pati i la casa.'};
  }
  if(house?.kind==='house'&&house.floors>MAX_PATIO_FLOORS)return {valid:false,message:`Aquesta casa supera les ${MAX_PATIO_FLOORS} plantes permeses amb pati. Retira primer els pisos sobrants.`};
  const ground=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
  if(house&&ground&&groundLevel(house)!==groundLevel(ground))return {valid:false,message:'La casa i el pati necessiten terreny a la mateixa alçada.'};
  return {valid:true,message:'Espai disponible per a la casa i el pati. Clica la cel·la de la casa.'};
}

/** Bridges occupy a straight corridor; heights follow their two banks. */
export const bridgeEndpoint = t => !!t && isFirmGround(t.kind);
export function bridgeCells(b){
  const n=Math.abs(b.b.x-b.a.x)+Math.abs(b.b.z-b.a.z),dx=Math.sign(b.b.x-b.a.x),dz=Math.sign(b.b.z-b.a.z);
  return Array.from({length:n+1},(_,i)=>({x:b.a.x+dx*i,z:b.a.z+dz*i}));
}
export const bridgeAt = (world,x,z) => (world.bridges??[]).find(b=>bridgeCells(b).some(c=>c.x===x&&c.z===z));
export function bridgeHeight(world,b,t){
  const a=world.tiles.find(c=>c.x===b.a.x&&c.z===b.a.z),end=world.tiles.find(c=>c.x===b.b.x&&c.z===b.b.z);
  const dx=Math.sign(b.b.x-b.a.x),dz=Math.sign(b.b.z-b.a.z);
  return terrainSurfaceY(a,dx*.5,dz*.5)*(1-t)+terrainSurfaceY(end,-dx*.5,-dz*.5)*t+.055;
}
export function checkBridge(world,a,b,type='classic'){
  if(!['classic','stone'].includes(type))return {valid:false,message:'Tria un tipus de pont vàlid.'};
  const validPoint=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z)&&Math.abs(p.x)<=worldLimit(world)&&Math.abs(p.z)<=worldLimit(world);
  if(!validPoint(a)||!validPoint(b))return {valid:false,message:'Tria dos punts dins la zona de construcció.'};
  const tile=p=>world.tiles.find(t=>t.x===p.x&&t.z===p.z);
  if(!bridgeEndpoint(tile(a))||!bridgeEndpoint(tile(b)))return {valid:false,message:'Els dos extrems han de ser terra ferma, carrer o plaça, sense cases ni arbres.'};
  if(a.x!==b.x&&a.z!==b.z)return {valid:false,message:'Alinea els extrems en la mateixa fila o columna.'};
  const n=Math.abs(b.x-a.x)+Math.abs(b.z-a.z);
  if(n<CONFIG.bridges.minLength||n>CONFIG.bridges.maxLength)return {valid:false,message:`Separa els extrems entre ${CONFIG.bridges.minLength} i ${CONFIG.bridges.maxLength} caselles.`};
  const bridge={a,b},cells=bridgeCells(bridge);
  for(let i=0;i<cells.length;i++){
    const c=cells[i];
    if((landmarkAt(world,c.x,c.z)||customAt(world,c.x,c.z)))return {valid:false,message:'El traçat passa per una construcció.'};
    if(townHallAt(world,c.x,c.z))return {valid:false,message:'El traçat passa per un ajuntament.'};
    if(churchAt(world,c.x,c.z))return {valid:false,message:'El traçat passa per una església.'};
    if(patioAt(world,c.x,c.z))return {valid:false,message:'El traçat passa per un pati.'};
    if(marketAt(world,c.x,c.z))return {valid:false,message:'El traçat passa per un mercat.'};
    if(bridgeAt(world,c.x,c.z))return {valid:false,message:'Aquest traçat coincideix amb un altre pont.'};
    if(i===0||i===n)continue;
    const t=tile(c);
    if(t?.beachBar)return {valid:false,message:'El traçat passa per una guingueta.'};
    if(t&&((!['land','meadow','beach'].includes(t.kind)&&!isRoad(t.kind))||(t.kind!=='beach'&&terrainY(t)+.22>Math.min(bridgeHeight(world,bridge,(i-.5)/n),bridgeHeight(world,bridge,(i+.5)/n)))))return {valid:false,message:'El pont necessita espai lliure: hi ha terreny massa alt o un element al mig.'};
  }
  if((world.bridges??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} ponts.`};
  return {valid:true,message:`${type==='stone'?'Pont de pedra amb arcades':'Pont'} de ${n} caselles. Clica per unir els dos extrems.`};
}
export function addBridge(world,a,b,type='classic'){
  const result=checkBridge(world,a,b,type);if(!result.valid)return {changed:false,message:result.message};
  world.bridges.push({a:{x:a.x,z:a.z},b:{x:b.x,z:b.z},...(type==='stone'?{type}: {})});
  return {changed:true,message:'Pont construït. Pots marcar l’inici d’un altre pont.'};
}

/** Business fronts use DIRECTIONS: south, east, north, west. */
// Intermediate entrances touch actual ground along the whole doorway edge.
// Terrain rises .42 per step, storeys .86: allow the .04 seam after two floors.
export function middleEntranceAccessible(world,t,floor,direction){
  if(t?.kind!=='house'||!Number.isInteger(floor)||floor<1||floor>=t.floors-1||!t.levels[floor]||!Number.isInteger(direction)||direction<0||direction>3)return false;
  const [dx,dz]=DIRECTIONS[direction],x=t.x+dx,z=t.z+dz;
  const next=world.tiles.find(c=>c.x===x&&c.z===z);
  if(!next||!isFirmGround(next.kind)||landmarkAt(world,x,z)||customAt(world,x,z)||townHallAt(world,x,z)||churchAt(world,x,z)||marketAt(world,x,z)||patioAt(world,x,z)||bridgeAt(world,x,z))return false;
  const y=terrainY(t)+floor*FLOOR_HEIGHT;
  return [-.45,0,.45].every(u=>Math.abs(terrainSurfaceY(next,-dx*.5+dz*u,-dz*.5-dx*u)-y)<=.06);
}
export const businessY=t=>terrainY(t)+(t.businessFloor??0)*FLOOR_HEIGHT;
export const businessOwner=(t,b)=>({...t,business:b,businessFloor:b.floor});
export const sameBusiness=(a,b)=>!!a&&!!b&&a.x===b.x&&a.z===b.z&&(a.businessFloor??0)===(b.businessFloor??0)&&a.business?.direction===b.business?.direction;
export function businessOwners(t){return [t,...(t.upperBusinesses??[]).map(b=>businessOwner(t,b))];}
function normalizeUpperBusinesses(t,levels){
  if(t.upperBusinesses===undefined)return [];
  if(!Array.isArray(t.upperBusinesses)||t.upperBusinesses.length>12)throw new Error('La llista de negocis dels pisos no és vàlida.');
  const seen=new Set();
  return t.upperBusinesses.map(b=>{
    if(!b||t.kind!=='house'||!Number.isInteger(b.floor)||b.floor<1||b.floor>=t.floors-1||!levels[b.floor]||!BUSINESS_TYPES.includes(b.type)||!Number.isInteger(b.direction)||b.direction<0||b.direction>3||typeof b.terrace!=='boolean'||(b.terrace&&!['bar','restaurant'].includes(b.type)))throw new Error('El negoci ha d’ocupar una planta intermèdia i una façana vàlides.');
    const id=b.floor+','+b.direction;if(seen.has(id))throw new Error('Hi ha dos negocis a la mateixa planta i façana.');seen.add(id);
    const name=normalizeBusinessName(b.name??'');return {floor:b.floor,type:b.type,direction:b.direction,terrace:b.terrace,...(name?{name}:{})};
  });
}
function pruneUpperBusinesses(t){
  const remaining=(t.upperBusinesses??[]).filter(b=>b.floor<t.floors-1&&t.levels[b.floor]);
  if(remaining.length)t.upperBusinesses=remaining;else delete t.upperBusinesses;
}
export function businessFront(t){
  const [dx,dz]=DIRECTIONS[t.business.direction];return {x:t.x+dx,z:t.z+dz};
}
export function businessFrontClear(world,t){
  if(t.businessFloor)return BUSINESS_TYPES.includes(t.business?.type)&&middleEntranceAccessible(world,t,t.businessFloor,t.business.direction);
  if(t.kind!=='house'||!t.levels[0]||!BUSINESS_TYPES.includes(t.business?.type))return false;
  const p=businessFront(t);if(Math.abs(p.x)>worldLimit(world)||Math.abs(p.z)>worldLimit(world))return false;
  const next=world.tiles.find(c=>c.x===p.x&&c.z===p.z);
  return !next?.beachBar&&!(landmarkAt(world,p.x,p.z)||customAt(world,p.x,p.z))&&!townHallAt(world,p.x,p.z)&&!churchAt(world,p.x,p.z)&&!patioAt(world,p.x,p.z)&&!marketAt(world,p.x,p.z)&&!bridgeAt(world,p.x,p.z)&&(!next||next.kind==='beach'||(isFirmGround(next.kind)&&groundLevel(next)<=groundLevel(t)));
}
function terraceGround(world,t){
  if(!businessFrontClear(world,t))return false;
  const p=businessFront(t),next=world.tiles.find(c=>c.x===p.x&&c.z===p.z);
  return !!next&&isFirmGround(next.kind)&&(t.businessFloor?!hasSlope(next)&&Math.abs(terrainY(next)-businessY(t))<=.06:groundLevel(next)===groundLevel(t));
}
export const barFrontClear=businessFrontClear;
export function businessSpaces(world){
  const result=new Map();
  // Stable ownership also makes conflicting imported requests render without overlaps.
  for(const t of [...world.tiles].sort((a,b)=>a.x-b.x||a.z-b.z).flatMap(businessOwners)){
    if((t.business?.terrace||t.business?.type==='greengrocer')&&terraceGround(world,t)){
      const p=businessFront(t),id=key(p.x,p.z);if(!result.has(id))result.set(id,t);
    }
  }
  return result;
}
export const diningTerraces=world=>new Map([...businessSpaces(world)].filter(([,t])=>['bar','restaurant'].includes(t.business.type)));
export const barTerraces=world=>new Map([...businessSpaces(world)].filter(([,t])=>t.business.type==='bar'));
export function editBusiness(world,t,type,direction,terrace,name,floor=0){
  if(!Number.isInteger(floor)||floor<0||(floor>0&&floor>=MAX_FLOORS-1))return {changed:false,message:'Tria una planta vàlida.'};
  if(floor>0){
    if(t?.kind!=='house')return {changed:false,message:'Clica una casa existent.'};
    const existing=t.upperBusinesses?.find(b=>b.floor===floor&&b.direction===direction);
    if(!['none','rename'].includes(type)&&!middleEntranceAccessible(world,t,floor,direction))return {changed:false,message:'Cal una planta intermèdia ocupada amb terra ferma a la mateixa alçada, just davant de la façana escollida.'};
    const proxy={...t,business:existing??null,businessFloor:floor};
    const result=editBusiness(world,proxy,type,direction,terrace,name);
    if(result.changed){
      const remaining=(t.upperBusinesses??[]).filter(b=>b!==existing);
      if(proxy.business)remaining.push({floor,...proxy.business});
      if(remaining.length)t.upperBusinesses=remaining;else delete t.upperBusinesses;
    }
    return result;
  }
  if(t?.kind!=='house')return {changed:false,message:'Clica una casa existent per editar-ne el negoci, sense afegir pisos.'};
  if(type==='none'){
    if(!t.business)return {changed:false,message:'Aquesta casa no té cap negoci.'};
    t.business=null;return {changed:true,message:'Negoci retirat. La casa i els pisos es conserven.'};
  }
  let normalized;
  try{normalized=normalizeBusinessName(name===undefined?(t.business?.name??''):name);}catch(error){return {changed:false,message:error.message};}
  if(type==='rename'){
    if(!t.business)return {changed:false,message:'Clica una casa amb un negoci existent per canviar-ne el rètol.'};
    if((t.business.name??'')===normalized)return {changed:false,message:'El rètol ja té aquest nom.'};
    if(normalized)t.business.name=normalized;else delete t.business.name;
    return {changed:true,message:normalized?`Rètol canviat: ${normalized}.`:'Rètol genèric restaurat.'};
  }
  if(!BUSINESS_TYPES.includes(type)||!Number.isInteger(direction)||direction<0||direction>3||typeof terrace!=='boolean')return {changed:false,message:'Tria un negoci i una façana vàlids.'};
  if(!t.levels[t.businessFloor??0])return {changed:false,message:'Reconstrueix la planta baixa abans d’obrir-hi un negoci.'};
  if(!['bar','restaurant'].includes(type))terrace=false;
  const candidate={...t,business:{type,direction,terrace,...(normalized?{name:normalized}:{})}};
  if(!businessFrontClear(world,candidate))return {changed:false,message:'La façana està obstruïda. Tria un altre costat de la casa.'};
  if(terrace||type==='greengrocer'){
    if(!terraceGround(world,candidate))return {changed:false,message:type==='greengrocer'?'Les prestatgeries necessiten terra ferma, carrer o plaça lliure al davant, a la mateixa alçada. Prepara aquesta casella o tria una altra façana.':'La terrassa necessita una casella de terra ferma, carrer o plaça al davant i a la mateixa alçada. Prepara-la o desmarca «Amb terrassa».'};
    const p=businessFront(candidate),owner=businessSpaces(world).get(key(p.x,p.z));
    if(owner&&!sameBusiness(owner,{...t,business:candidate.business}))return {changed:false,message:'Aquest espai ja pertany a un altre negoci. Tria una altra façana.'};
  }
  if(t.business?.type===type&&t.business.direction===direction&&t.business.terrace===terrace&&(t.business.name??'')===normalized)return {changed:false,message:'El negoci ja té aquesta configuració.'};
  t.business=candidate.business;
  if(['bookshop','patisserie','hardware','hairdresser','barber','souvenir','vegetables','optician'].includes(type))return {changed:true,message:`${BUSINESS_NAMES[type]}: negoci obert amb rètol i aparadors.`};
  return {changed:true,message:type==='butcher'?'Carnisseria oberta amb peces de carn i embotits als aparadors.':type==='bakery'?'Fleca oberta amb pans rodons i barres als aparadors.':type==='fishmonger'?'Peixateria oberta amb peix sobre gel i aparadors a banda i banda de la porta.':type==='pharmacy'?'Farmàcia oberta amb creu verda i aparadors de productes.':type==='florist'?'Floristeria oberta amb rams, flors i aparadors a banda i banda de la porta.':type==='newsstand'?'Quiosc de premsa obert amb diaris, revistes i taulell d’atenció.':type==='grocery'?'Botiga de queviures oberta amb aparadors de productes.':type==='restaurant'?(terrace?'Restaurant obert amb dues taules parades i quatre cadires.':'Restaurant obert, sense terrassa.'):type==='greengrocer'?'Fruiteria oberta amb prestatgeries a banda i banda de la porta.':terrace?'Bar obert amb dues taules i quatre cadires.':'Bar obert, sense terrassa.'};
}

/** A market is one building anchored at the minimum X/Z corner of its footprint. */
export const marketDimensions=m=>({width:m.size===4||m.direction%2===1?2:1,depth:m.size===4||m.direction%2===0?2:1});
export function marketCells(m){
  const {width,depth}=marketDimensions(m);
  return Array.from({length:width*depth},(_,i)=>({x:m.x+i%width,z:m.z+Math.floor(i/width)}));
}
export const marketAt=(world,x,z)=>(world.markets??[]).find(m=>marketCells(m).some(c=>c.x===x&&c.z===z));
export function checkMarket(world,m){
  if(!m||!Number.isInteger(m.x)||!Number.isInteger(m.z)||![2,4].includes(m.size)||!Number.isInteger(m.direction)||m.direction<0||m.direction>3)return {valid:false,message:'Tria una mida i una orientació vàlides.'};
  const spaces=businessSpaces(world);let elevation=null;
  for(const c of marketCells(m)){
    if(Math.abs(c.x)>worldLimit(world)||Math.abs(c.z)>worldLimit(world))return {valid:false,message:'Tot el mercat ha de quedar dins la zona de construcció.'};
    if((landmarkAt(world,c.x,c.z)||customAt(world,c.x,c.z))||townHallAt(world,c.x,c.z)||churchAt(world,c.x,c.z)||patioAt(world,c.x,c.z)||marketAt(world,c.x,c.z)||bridgeAt(world,c.x,c.z)||spaces.has(key(c.x,c.z)))return {valid:false,message:'Aquest espai està ocupat per una església, un pati, un mercat, un pont o un altre negoci.'};
    const t=world.tiles.find(t=>t.x===c.x&&t.z===c.z);
    if(!t||!isFirmGround(t.kind))return {valid:false,message:'Prepara totes les cel·les amb terra ferma, carrer o plaça, sense cases ni arbres.'};
    if(elevation!==null&&groundLevel(t)!==elevation)return {valid:false,message:'Totes les cel·les del mercat han d’estar a la mateixa alçada.'};
    elevation=groundLevel(t);
  }
  if((world.markets??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} mercats.`};
  return {valid:true,message:`Espai lliure per al mercat de ${m.size} cel·les. Clica per construir-lo.`};
}

/** Churches reserve a rotated 2 × 3 rectangle, anchored at minimum X/Z. */
export const churchDimensions=c=>({width:c.direction%2?3:2,depth:c.direction%2?2:3});
export function churchCells(c){const {width,depth}=churchDimensions(c);return Array.from({length:width*depth},(_,i)=>({x:c.x+i%width,z:c.z+Math.floor(i/width)}));}
export const churchAt=(world,x,z)=>(world.churches??[]).find(c=>churchCells(c).some(p=>p.x===x&&p.z===z));
export function churchTowerCell(c){
  const {width,depth}=churchDimensions(c),[dx,dz]=DIRECTIONS[c.direction];
  return {x:Math.round(c.x+(width-1)/2+dz*.5+dx),z:Math.round(c.z+(depth-1)/2-dx*.5+dz)};
}
export function checkChurch(world,c){
  if(!c||!Number.isInteger(c.x)||!Number.isInteger(c.z)||!Number.isInteger(c.direction)||c.direction<0||c.direction>3)return {valid:false,message:'Tria una orientació vàlida per a l’entrada.'};
  const spaces=businessSpaces(world);let elevation=null;
  for(const p of churchCells(c)){
    if(Math.abs(p.x)>worldLimit(world)||Math.abs(p.z)>worldLimit(world))return {valid:false,message:'Les sis cel·les de l’església han de quedar dins la quadrícula.'};
    if((landmarkAt(world,p.x,p.z)||customAt(world,p.x,p.z))||townHallAt(world,p.x,p.z)||churchAt(world,p.x,p.z)||marketAt(world,p.x,p.z)||patioAt(world,p.x,p.z)||bridgeAt(world,p.x,p.z)||spaces.has(key(p.x,p.z)))return {valid:false,message:'Aquest espai està ocupat per una construcció, un pati, un pont o una terrassa.'};
    const ground=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
    if(!ground||!isFirmGround(ground.kind))return {valid:false,message:'Prepara sis cel·les de terra ferma, carrer o plaça lliures (2 × 3).'};
    if(elevation!==null&&elevation!==groundLevel(ground))return {valid:false,message:'Tot el terreny de l’església ha d’estar a la mateixa alçada.'};
    elevation=groundLevel(ground);
  }
  if((world.churches??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} esglésies.`};
  return {valid:true,message:'Espai lliure per a l’església amb campanar. Clica per construir-la.'};
}

/** Two storeys, with a two-cell-wide façade and either one or two cells of depth. */
export const townHallDimensions=h=>({width:h.direction%2?h.size/2:2,depth:h.direction%2?2:h.size/2});
export function townHallCells(h){const {width,depth}=townHallDimensions(h);return Array.from({length:width*depth},(_,i)=>({x:h.x+i%width,z:h.z+Math.floor(i/width)}));}
export const townHallAt=(world,x,z)=>(world.townHalls??[]).find(h=>townHallCells(h).some(p=>p.x===x&&p.z===z));
export function checkTownHall(world,h){
  if(!h||!Number.isInteger(h.x)||!Number.isInteger(h.z)||![2,4].includes(h.size)||!Number.isInteger(h.direction)||h.direction<0||h.direction>3)return {valid:false,message:'Tria una mida i una orientació vàlides per a l’ajuntament.'};
  const spaces=businessSpaces(world);let elevation=null;
  for(const p of townHallCells(h)){
    if(Math.abs(p.x)>worldLimit(world)||Math.abs(p.z)>worldLimit(world))return {valid:false,message:'Tot l’ajuntament ha de quedar dins la quadrícula.'};
    if((landmarkAt(world,p.x,p.z)||customAt(world,p.x,p.z))||townHallAt(world,p.x,p.z)||churchAt(world,p.x,p.z)||marketAt(world,p.x,p.z)||patioAt(world,p.x,p.z)||bridgeAt(world,p.x,p.z)||spaces.has(key(p.x,p.z)))return {valid:false,message:'Aquest espai està ocupat per una construcció, un pati, un pont o una terrassa.'};
    const ground=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
    if(!ground||!isFirmGround(ground.kind))return {valid:false,message:`Prepara ${h.size} cel·les de terra ferma, carrer o plaça lliures.`};
    if(elevation!==null&&elevation!==groundLevel(ground))return {valid:false,message:'Tot el terreny de l’ajuntament ha d’estar a la mateixa alçada.'};
    elevation=groundLevel(ground);
  }
  if((world.townHalls??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} ajuntaments.`};
  return {valid:true,message:`Espai lliure per a l’ajuntament de ${h.size===2?'2 × 1':'2 × 2'} i dues plantes. Clica per construir-lo.`};
}

export function checkCustomBuilding(world,b){
  try{validateDesign(b?.design);}catch(error){return {valid:false,message:error.message};}
  if(!Number.isInteger(b.x)||!Number.isInteger(b.z)||!Number.isInteger(b.direction)||b.direction<0||b.direction>3)return {valid:false,message:'Tria una posició i una orientació vàlides.'};
  const spaces=businessSpaces(world);let elevation=null;
  for(const p of customCells(b)){
    if(Math.abs(p.x)>worldLimit(world)||Math.abs(p.z)>worldLimit(world))return {valid:false,message:'Tot l’edifici ha de quedar dins la quadrícula.'};
    if((landmarkAt(world,p.x,p.z)||customAt(world,p.x,p.z))||townHallAt(world,p.x,p.z)||churchAt(world,p.x,p.z)||marketAt(world,p.x,p.z)||patioAt(world,p.x,p.z)||bridgeAt(world,p.x,p.z)||spaces.has(key(p.x,p.z)))return {valid:false,message:'Aquest espai està ocupat per una construcció, un pati, un pont o una terrassa.'};
    const ground=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
    if(!ground||!isFirmGround(ground.kind))return {valid:false,message:'Prepara totes les cel·les amb terra ferma, carrer o plaça lliure.'};
    if(elevation!==null&&elevation!==groundLevel(ground))return {valid:false,message:'L’edifici necessita terreny a la mateixa alçada.'};
    elevation=groundLevel(ground);
  }
  if((world.customBuildings??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} edificis del jugador.`};
  return {valid:true,message:`Espai lliure per a «${b.design.name}». Clica per col·locar-lo.`};
}

/** Fixed footprint amenities, removable as a whole while preserving their terrain. */
export const LANDMARK_TYPES={
  flagSenyera:{name:'Pal amb senyera',sizes:[1],height:2.82,flag:'senyera'},
  flagEstelada:{name:'Pal amb estelada',sizes:[1],height:2.82,flag:'estelada'},
  flagBlack:{name:'Pal amb bandera negra',sizes:[1],height:2.82,flag:'black'},
  fireStation:{name:'Estació de bombers',sizes:[4,6],height:2.18},
  recycling:{name:'Deixalleria',sizes:[4,6],height:1.48},
  cemetery:{name:'Cementiri',sizes:[2,4],height:1.65},
  wall:{name:'Mur de pedra',sizes:[1],height:1.50,category:'monument'},
  wallTower:{name:'Mur amb torre central',sizes:[1],height:2.24,category:'monument'},
  wallCorner:{name:'Mur en angle de 90°',sizes:[1],height:1.50,category:'monument'},
  wallCornerTower:{name:'Cantonada amb torre',sizes:[1],height:2.24,category:'monument'},
  wallGate:{name:'Mur amb portal',sizes:[1],height:1.50,category:'monument'},
  lighthouse:{name:'Far',sizes:[1],height:3.72},
  playground:{name:'Parc infantil',sizes:[2,4],height:1.30},
  hospital:{name:'Hospital',sizes:[4,6],height:2.88},
  school:{name:'Escola',sizes:[4,6],height:2.28},
  police:{name:'Comissaria',sizes:[2],height:2.12},
};
export function landmarkDimensions(l){
  const width=l.size===1?1:l.size===6?3:2,depth=l.size/width;
  return l.direction%2?{width:depth,depth:width}:{width,depth};
}
export function landmarkCells(l){const {width,depth}=landmarkDimensions(l);return Array.from({length:width*depth},(_,i)=>({x:l.x+i%width,z:l.z+Math.floor(i/width)}));}
export const landmarkAt=(world,x,z)=>(world.landmarks??[]).find(l=>landmarkCells(l).some(p=>p.x===x&&p.z===z));
export const landmarkHeight=l=>LANDMARK_TYPES[l.type]?.height??0;
export function checkLandmark(world,l){
  if(!l||!Object.hasOwn(LANDMARK_TYPES,l.type)||!Number.isInteger(l.x)||!Number.isInteger(l.z)||!Number.isInteger(l.direction)||l.direction<0||l.direction>3||!LANDMARK_TYPES[l.type].sizes.includes(l.size))return {valid:false,message:'Tria una mida i una orientació vàlides.'};
  const spaces=businessSpaces(world);let elevation=null;
  for(const p of landmarkCells(l)){
    if(Math.abs(p.x)>worldLimit(world)||Math.abs(p.z)>worldLimit(world))return {valid:false,message:'Tot el conjunt ha de quedar dins la quadrícula.'};
    if(landmarkAt(world,p.x,p.z)||customAt(world,p.x,p.z)||townHallAt(world,p.x,p.z)||churchAt(world,p.x,p.z)||marketAt(world,p.x,p.z)||patioAt(world,p.x,p.z)||bridgeAt(world,p.x,p.z)||spaces.has(key(p.x,p.z)))return {valid:false,message:'Aquest espai està ocupat per una construcció, un pati, un pont o una terrassa.'};
    const t=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
    if(!t||!isFirmGround(t.kind))return {valid:false,message:'Prepara terra ferma, carrer o plaça lliure, sense cases ni arbres.'};
    if(elevation!==null&&elevation!==groundLevel(t))return {valid:false,message:'Totes les bases del conjunt han d’estar a la mateixa alçada.'};
    elevation=groundLevel(t);
  }
  if((world.landmarks??[]).length>=CONFIG.limits.objectsPerCategory)return {valid:false,message:`Has arribat al màxim de ${CONFIG.limits.objectsPerCategory} edificis i equipaments.`};
  const {width,depth}=landmarkDimensions(l);
  return {valid:true,message:`${LANDMARK_TYPES[l.type].name}: espai lliure de ${width} × ${depth} cel·les. Clica per construir.`};
}

export function editWorld(world,x,z,tool,{landmarkDirection=0,civicSize=4,cemeterySize=2,playgroundSize=2,slopeDirection=0,slopeFinish='keep',color=0,roof='tile',roofDirection=0,level=null,beachBarDirection=0,beachBarName=undefined,businessFloor=0,businessType='bar',businessName=undefined,businessDirection=0,businessTerrace=true,marketSize=2,marketDirection=0,patioPosition=null,patioDirection=0,patioFloors=1,churchDirection=0,townHallSize=2,townHallDirection=0,customDesign=null,customDirection=0}={}) {
  if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>worldLimit(world)||Math.abs(z)>worldLimit(world))return {changed:false,message:'Has arribat al límit de la zona de construcció.'};
  let t=world.tiles.find(t=>t.x===x&&t.z===z);
  const landmark=landmarkAt(world,x,z);
  if(landmark){
    if(tool==='erase'){world.landmarks.splice(world.landmarks.indexOf(landmark),1);return {changed:true,message:'Conjunt retirat sencer. El terreny es conserva.'};}
    return {changed:false,message:'Retira primer l’edifici o equipament per modificar aquest espai.'};
  }
  if(Object.hasOwn(LANDMARK_TYPES,tool)){
    const l={type:tool,x,z,size:LANDMARK_TYPES[tool].sizes.length===1?LANDMARK_TYPES[tool].sizes[0]:tool==='cemetery'?cemeterySize:tool==='playground'?playgroundSize:civicSize,direction:landmarkDirection},result=checkLandmark(world,l);
    if(!result.valid)return {changed:false,message:result.message};
    (world.landmarks??=[]).push(l);return {changed:true,message:`${LANDMARK_TYPES[tool].name}: construcció acabada.`};
  }
  if(tool==='beachbar'){
    const result=checkBeachBar(world,x,z,{direction:beachBarDirection,name:beachBarName===undefined?(t?.beachBar?.name??''):beachBarName});
    if(!result.valid)return {changed:false,message:result.message};
    if(JSON.stringify(t.beachBar)===JSON.stringify(result.data))return {changed:false,message:'La guingueta ja té aquest nom i aquesta orientació.'};
    const existing=!!t.beachBar;t.beachBar=result.data;return {changed:true,message:existing?'Guingueta actualitzada.':'Guingueta construïda a la platja.'};
  }
  if(t?.beachBar){
    if(tool==='erase'){delete t.beachBar;return {changed:true,message:'Guingueta retirada. La platja es conserva.'};}
    return {changed:false,message:'Retira primer la guingueta per modificar aquesta cel·la de platja.'};
  }

  if(!Number.isInteger(roofDirection)||roofDirection<0||roofDirection>3)return {changed:false,message:'Tria una de les quatre orientacions.'};
  const custom=customAt(world,x,z);
  if(custom){
    if(tool==='erase'){world.customBuildings.splice(world.customBuildings.indexOf(custom),1);return {changed:true,message:'Edifici retirat. El disseny i el terreny es conserven.'};}
    return {changed:false,message:'Retira primer l’edifici del jugador per modificar aquest espai.'};
  }
  if(tool==='custom'){
    const b={x,z,direction:customDirection,design:customDesign},result=checkCustomBuilding(world,b);
    if(!result.valid)return {changed:false,message:result.message};
    world.customBuildings.push({...b,design:validateDesign(customDesign)});return {changed:true,message:'Edifici del jugador col·locat.'};
  }
  const townHall=townHallAt(world,x,z);
  if(townHall){
    if(tool==='erase'){world.townHalls.splice(world.townHalls.indexOf(townHall),1);return {changed:true,message:'Ajuntament retirat sencer. El terreny es conserva.'};}
    return {changed:false,message:'L’ajuntament té dues plantes fixes. Retira’l abans de modificar les seves cel·les.'};
  }
  if(tool==='townhall'){
    const h={x,z,size:townHallSize,direction:townHallDirection},result=checkTownHall(world,h);
    if(!result.valid)return {changed:false,message:result.message};
    world.townHalls.push(h);return {changed:true,message:'Ajuntament de dues plantes construït, amb balcó i senyera.'};
  }
  const church=churchAt(world,x,z);
  if(church){
    if(tool==='erase'){world.churches.splice(world.churches.indexOf(church),1);return {changed:true,message:'Església i campanar retirats. El terreny es conserva.'};}
    return {changed:false,message:'Retira primer l’església per modificar les seves cel·les.'};
  }
  if(tool==='church'){
    const c={x,z,direction:churchDirection},result=checkChurch(world,c);
    if(!result.valid)return {changed:false,message:result.message};
    world.churches.push(c);return {changed:true,message:'Església amb campanar construïda.'};
  }
  const patioOwner=patioAt(world,x,z);
  if(patioOwner){
    if(tool==='erase'){
      patioOwner.kind='land';patioOwner.floors=0;patioOwner.levels=[];patioOwner.business=null;delete patioOwner.patio;
      return {changed:true,message:'Casa i pati retirats. El terreny es conserva.'};
    }
    return {changed:false,message:'Aquesta cel·la és un pati. Clica la casa per editar-la; Esborra sobre el pati retira el conjunt.'};
  }
  if(tool==='patio-house'){
    const result=checkPatioHouse(world,x,z,{patioPosition,patioDirection,patioFloors});
    if(!result.valid)return {changed:false,message:result.message};
    if(t?.business||t?.upperBusinesses?.length)return {changed:false,message:'Retira primer el negoci per canviar la distribució de la casa i el pati.'};
    const patio={position:patioPosition,direction:patioDirection},p=patioCell({x,z,patio});
    let ground=world.tiles.find(c=>c.x===p.x&&c.z===p.z);
    const makeTile=(x,z,elevation)=>({x,z,elevation,kind:'land',floors:0,levels:[],color,roof,roofDirection,rotation:0,business:null});
    if(!t){t=makeTile(x,z,ground?groundLevel(ground):0);world.tiles.push(t);}
    if(!ground){ground=makeTile(p.x,p.z,groundLevel(t));world.tiles.push(ground);}
    const next={...t,kind:'house',floors:patioFloors,levels:Array(patioFloors).fill(true),color,roof,roofDirection,patio};
    if(JSON.stringify(t)===JSON.stringify(next))return {changed:false,message:'La casa ja té aquesta configuració.'};
    Object.assign(t,next);return {changed:true,message:`Casa de ${patioFloors} plantes amb pati al ${patioPosition==='front'?'davant':'darrere'}. Màxim de ${MAX_PATIO_FLOORS} plantes.`};
  }
  const market=marketAt(world,x,z);
  if(market){
    if(tool==='erase'){world.markets.splice(world.markets.indexOf(market),1);return {changed:true,message:'Mercat retirat sencer. El terreny es conserva.'};}
    return {changed:false,message:'Retira primer el mercat per modificar les seves cel·les.'};
  }
  if(tool==='market'){
    const m={x,z,size:marketSize,direction:marketDirection},result=checkMarket(world,m);
    if(!result.valid)return {changed:false,message:result.message};
    world.markets.push(m);return {changed:true,message:`Mercat de ${marketSize} cel·les construït.`};
  }
  if(tool==='business')return editBusiness(world,t,businessType,businessDirection,businessTerrace,businessName,businessFloor);
  if(tool==='roof-direction'){
    if(t?.kind!=='house'||!['shed','tile'].includes(t.roof))return {changed:false,message:'Clica una casa amb teulada a una o dues aigües.'};
    if(t.roofDirection===roofDirection)return {changed:false,message:'La teulada ja té aquesta orientació.'};
    t.roofDirection=roofDirection;return {changed:true,message:'Orientació canviada. Els pisos es mantenen.'};
  }
  const bridge=bridgeAt(world,x,z);
  if(bridge){
    if(tool==='erase'){world.bridges.splice(world.bridges.indexOf(bridge),1);return {changed:true,message:'Pont retirat. El terreny es conserva.'};}
    return {changed:false,message:'Retira primer el pont per modificar aquest tram o els seus extrems.'};
  }
  if(tool==='erase') {
    if(!t)return {changed:false};
    if(t.kind==='house'){
      const selected=level===null?t.floors-1:level;
      if(!Number.isInteger(selected)||selected<0||selected>=t.floors)return {changed:false};
      if(!t.levels[selected])return {changed:false,message:'Aquest pis ja és buit. Les pilastres sostenen els pisos superiors.'};
      t.levels[selected]=false;if(selected===0)t.business=null;
      // Removing a middle level never shifts the occupied levels above it.
      while(t.levels.length&&!t.levels.at(-1))t.levels.pop();
      t.floors=t.levels.length;pruneUpperBusinesses(t);
      if(!t.floors){t.kind='land';delete t.patio;}
    }
    else if(t.kind!=='land'){t.kind='land';t.floors=0;t.levels=[];}
    else if(hasSlope(t))delete t.slopeDirection;
    else if(t.elevation>0)t.elevation--;
    else world.tiles.splice(world.tiles.indexOf(t),1);
    return {changed:true};
  }
  if(tool==='slope'){
    if(slopeDirection!==null&&(!Number.isInteger(slopeDirection)||slopeDirection<0||slopeDirection>3))return {changed:false,message:'Tria cap on puja el pendent.'};
    if(!['keep','land','meadow',...ROAD_TYPES].includes(slopeFinish))return {changed:false,message:'Tria un acabat vàlid.'};
    if(t?.patio)return {changed:false,message:'Retira primer la casa amb pati per modificar-ne el terreny.'};
    if(slopeDirection!==null&&t?.elevation>=MAX_TERRAIN_LEVEL)return {changed:false,message:`El pendent necessita un nivell superior lliure. Comença entre els nivells 0 i ${MAX_TERRAIN_LEVEL-1}.`};
    if(slopeDirection===null&&!hasSlope(t))return {changed:false,message:'Aquest terreny ja és pla.'};
    if(!t){t={x,z,elevation:0,kind:'land',floors:0,levels:[],color,roof,roofDirection:0,rotation:0,business:null};world.tiles.push(t);}
    const before=JSON.stringify(t);
    if(slopeDirection===null)delete t.slopeDirection;else t.slopeDirection=slopeDirection;
    if(t.kind==='beach')t.kind='land';
    if(isFirmGround(t.kind)&&slopeFinish!=='keep')t.kind=slopeFinish;
    return {changed:JSON.stringify(t)!==before,message:slopeDirection===null?'Terreny aplanat al nivell inferior.':'Pendent aplicat. Pots pavimentar-hi, plantar-hi o construir-hi.'};
  }
  if(!['house','land','meadow','beach','plaza','stairs'].includes(tool)&&!isTree(tool)&&!isRoad(tool))return {changed:false};
  if(!t){t={x,z,elevation:0,kind:'land',floors:0,levels:[],color,roof,roofDirection:0,rotation:0,business:null};world.tiles.push(t);if(tool==='land')return {changed:true};}
  if(tool==='beach'){
    if(t.kind==='beach')return {changed:false};
    t.kind='beach';delete t.slopeDirection;delete t.patio;t.business=null;delete t.upperBusinesses;t.elevation=0;t.floors=0;t.levels=[];return {changed:true};
  }
  if(tool==='land') {
    if(t.patio)return {changed:false,message:'La casa i el pati han de mantenir la mateixa alçada de terreny. Retira el conjunt abans de modificar-ne la base.'};
    if(t.kind==='beach'){t.kind='land';return {changed:true};}
    if(groundLevel(t)>=MAX_TERRAIN_LEVEL)return {changed:false,message:'El terreny ja té l’alçada màxima.'};
    t.elevation++;return {changed:true};
  }
  if(tool==='house') {
    if(t.kind==='house'&&Number.isInteger(level)&&level>=0&&level<t.floors&&!t.levels[level]){
      t.levels[level]=true;return {changed:true,message:'Pis reconstruït. S’han retirat els suports d’aquest buit.'};
    }
    if(t.kind==='house'&&t.floors>=(t.patio?MAX_PATIO_FLOORS:MAX_FLOORS)) {
      if(t.color!==color||t.roof!==roof||t.roofDirection!==roofDirection){t.color=color;t.roof=roof;t.roofDirection=roofDirection;return {changed:true};}
      return {changed:false,message:t.patio?`Les cases amb pati tenen un màxim de ${MAX_PATIO_FLOORS} plantes.`:`Màxim de ${MAX_FLOORS} pisos. Tria un altre color o acabat per canviar-ne l’aspecte.`};
    }
    if(t.kind!=='house')t.levels=[];
    t.levels.push(true);t.floors=t.levels.length;t.kind='house';t.color=color;t.roof=roof;t.roofDirection=roofDirection;
  } else if(tool==='stairs') {
    delete t.patio;
    t.rotation=t.kind==='stairs'?(t.rotation+1)%4:0;t.kind='stairs';t.business=null;delete t.upperBusinesses;t.floors=0;t.levels=[];
  } else {
    delete t.patio;
    if(t.kind===tool)return {changed:false};
    t.kind=tool;t.business=null;delete t.upperBusinesses;t.floors=0;t.levels=[];
  }
  return {changed:true};
}
export class History {
  constructor(limit=CONFIG.limits.undoSteps){this.limit=limit;this.past=[];this.future=[];}
  push(world){this.past.push(JSON.stringify(world));if(this.past.length>this.limit)this.past.shift();this.future=[];}
  undo(world){if(!this.past.length)return null;this.future.push(JSON.stringify(world));return JSON.parse(this.past.pop());}
  redo(world){if(!this.future.length)return null;this.past.push(JSON.stringify(world));return JSON.parse(this.future.pop());}
}
