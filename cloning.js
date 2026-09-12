import {validateWorld,worldLimit,isFirmGround,isTree,patioAt,patioCell,marketAt,churchAt,townHallAt,landmarkAt,bridgeAt,businessSpaces,COLORS,randomAt} from './model.js';
import {customAt,customCells,newDesign,validateDesign,designFloor} from './designs.js';
import {residentialEntrance} from './entrances.js';

export const cloneBounds=(a,b=a)=>({x:Math.min(a.x,b.x),z:Math.min(a.z,b.z),width:Math.abs(a.x-b.x)+1,depth:Math.abs(a.z-b.z)+1});
const inside=(p,r)=>p.x>=r.x&&p.z>=r.z&&p.x<r.x+r.width&&p.z<r.z+r.depth;
const at=(w,p)=>w.tiles.find(t=>t.x===p.x&&t.z===p.z);
const appearance=t=>structuredClone(t.appearance??{x:t.x,z:t.z});
const occupied=(w,p)=>marketAt(w,p.x,p.z)||churchAt(w,p.x,p.z)||townHallAt(w,p.x,p.z)||landmarkAt(w,p.x,p.z)||customAt(w,p.x,p.z)||patioAt(w,p.x,p.z)||bridgeAt(w,p.x,p.z);
function groundCopy(t){
  const kind=isTree(t.kind)?t.treeGround??'land':t.kind==='house'?'land':t.kind;
  return {x:t.x,z:t.z,kind,elevation:t.elevation,floors:0,levels:[],color:0,roof:'tile',roofDirection:0,rotation:t.rotation??0,business:null,...(t.slopeDirection!==undefined?{slopeDirection:t.slopeDirection}:{}),...(kind==='stairs'&&t.stairRailing?{stairRailing:t.stairRailing}:{})};
}
/** Immutable clipboard, independent of later changes to the source village. */
export function captureClone(world,mode,a,b=a){
  const bounds=cloneBounds(a,b),tiles=new Map(),buildings=[];
  const put=t=>tiles.set(`${t.x},${t.z}`,structuredClone(t));
  if(mode==='terrain'){
    for(const t of world.tiles.filter(t=>inside(t,bounds)))put(groundCopy(t));
  }else{
    let chosen=world.tiles.filter(t=>t.kind==='house'&&inside(t,bounds));
    let custom=world.customBuildings.filter(c=>customCells(c).some(p=>inside(p,bounds)));
    if(mode==='house'){
      const owner=patioAt(world,a.x,a.z);if(owner)chosen=[owner];
      const c=customAt(world,a.x,a.z);if(c)custom=[c];
    }
    for(const c of custom){
      if(mode!=='house'&&!customCells(c).every(p=>inside(p,bounds)))throw new Error('Inclou tot l’edifici del jugador dins de la selecció.');
      buildings.push(structuredClone(c));for(const p of customCells(c))put(at(world,p));
    }
    for(const t of chosen){
      put({...t,appearance:appearance(t)});
      if(t.patio){const p=at(world,patioCell(t));if(p)put(p);}
    }
    const owners=new Set([...chosen,...custom.flatMap(customCells)].map(p=>`${p.x},${p.z}`));
    for(const [key,owner] of businessSpaces(world))if(owners.has(`${owner.x},${owner.z}`)){
      const [x,z]=key.split(',').map(Number),t=at(world,{x,z});if(t)put(t);
    }
  }
  if(!tiles.size)throw new Error(mode==='terrain'?'No hi ha terreny dins de la selecció.':'Selecciona una casa o un grup de cases.');
  const values=[...tiles.values()],x=Math.min(...values.map(t=>t.x)),z=Math.min(...values.map(t=>t.z));
  const width=Math.max(...values.map(t=>t.x))-x+1,depth=Math.max(...values.map(t=>t.z))-z+1;
  return {mode,x,z,width,depth,tiles:values,customBuildings:buildings};
}
export function clonePlacement(world,clip,p){
  const dx=p.x-clip.x,dz=p.z-clip.z,limit=worldLimit(world),spaces=businessSpaces(world);
  for(const source of clip.tiles){
    const target={x:source.x+dx,z:source.z+dz},existing=at(world,target);
    if(Math.abs(target.x)>limit||Math.abs(target.z)>limit)return {valid:false,message:'La còpia ha de quedar dins de la quadrícula.'};
    if(occupied(world,target)||spaces.has(`${target.x},${target.z}`)||existing&&(!isFirmGround(existing.kind)&&!['beach','stairs'].includes(existing.kind)||existing.beachBar))return {valid:false,message:'Cal espai lliure: la còpia no substitueix cases, arbres, ponts ni altres construccions.'};
  }
  return {valid:true,dx,dz};
}
export function pasteClone(world,clip,p){
  const check=clonePlacement(world,clip,p);if(!check.valid)return {changed:false,message:check.message};
  const next=structuredClone(world),{dx,dz}=check;
  for(const source of clip.tiles){
    const tile={...structuredClone(source),x:source.x+dx,z:source.z+dz},index=next.tiles.findIndex(t=>t.x===tile.x&&t.z===tile.z);
    if(index<0)next.tiles.push(tile);else next.tiles[index]=tile;
  }
  next.customBuildings.push(...clip.customBuildings.map(c=>({...structuredClone(c),x:c.x+dx,z:c.z+dz})));
  try{return {changed:true,world:validateWorld(next),message:'Còpia col·locada. Pots enganxar-la de nou o prémer Esc per acabar.'};}
  catch(error){return {changed:false,message:'No es pot col·locar aquí: '+error.message};}
}
export function captureAppearance(world,p){
  const t=at(world,p);if(t?.kind!=='house')throw new Error('Tria una casa de l’eina Casa per copiar-ne l’estètica.');
  return {appearance:appearance(t),color:t.color,colors:Array.from({length:t.floors},(_,i)=>t.floorColors?.[i]??t.color),roof:t.roof,roofDirection:t.roofDirection};
}
export function pasteAppearance(world,style,p){
  const t=at(world,p);if(t?.kind!=='house')return {changed:false,message:'Aplica l’estètica a una casa de l’eina Casa.'};
  const next=structuredClone(world),target=at(next,p);
  Object.assign(target,{appearance:structuredClone(style.appearance),color:style.color,roof:style.roof,roofDirection:style.roofDirection,floorColors:Array.from({length:t.floors},(_,i)=>style.colors[Math.min(i,style.colors.length-1)])});
  if(JSON.stringify(t)===JSON.stringify(target))return {changed:false,message:'Aquesta casa ja té l’estètica escollida.'};
  return {changed:true,world:validateWorld(next),message:'Estètica aplicada. L’alçada, els buits i els negocis es conserven.'};
}
/** Convert the architectural elements into editable cells, one layer per actual floor. */
export function houseToDesign(world,p){
  const custom=customAt(world,p.x,p.z);
  if(custom){
    const d=structuredClone(custom.design);d.id=newDesign().id;d.name=(d.name+' · còpia').slice(0,60);
    d.ground=d.ground.map(c=>({...c,color:custom.floorColors?.[0]??c.color}));
    if(d.middleCount)d.upperFloors=Array.from({length:d.middleCount},(_,i)=>d.ground.map((_,j)=>{if(!custom.design.upperFloors&&!custom.design.middle[j]||custom.design.upperFloors&&custom.design.upperFloors[i][j]===null)return null;const cell=designFloor(custom.design,j,i+1);return {...structuredClone(cell),color:custom.floorColors?.[i+1]??cell.color};}));
    return validateDesign(d);
  }
  const t=at(world,p);if(t?.kind!=='house')throw new Error('Selecciona una casa per crear-ne un disseny editable.');
  const seed=appearance(t),d=newDesign();d.name='Casa clonada';d.middleCount=t.floors-1;
  const cell=level=>({color:COLORS[t.floorColors?.[level]??t.color].hex,style:t.levels[level]?'solid':'arcade',faces:Array.from({length:4},(_,side)=>level===0?residentialEntrance(seed.x,seed.z,side)??'door':level===1&&randomAt(seed.x,seed.z,side+6)>.57?'balcony':'window')});
  d.ground=[cell(0)];d.middle=[cell(Math.min(1,t.floors-1))];
  d.upperFloors=Array.from({length:d.middleCount},(_,i)=>[cell(i+1)]);
  d.roof=[{type:t.roof,color:t.roof==='flat'?'#eee4ce':randomAt(seed.x,seed.z)>.5?'#bf7957':'#c9825c',direction:t.roofDirection}];
  return validateDesign(d);
}
