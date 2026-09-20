import {TREE_SPECIES,LANDMARK_TYPES,landmarkAt,landmarkCells,marketAt,marketCells,churchAt,churchCells,townHallAt,townHallCells,bridgeAt,bridgeCells,patioAt,hasSlope,diningTerraces} from './model.js';
import {customAt,customCells,customFloors} from './designs.js';
import {AGRICULTURAL_TERRAINS} from './agricultural-types.js';
import {BUSINESS_NAMES} from './business-signs.js';

const groundNames={land:'Terra ferma',meadow:'Pradera amb flors',rocky:'Terreny rocós',beach:'Platja',cobble:'Carrer empedrat',dirt:'Carrer de terra',asphalt:'Carrer asfaltat',plaza:'Plaça',stairs:'Escales'};
const roofNames={tile:'Dues aigües',shed:'Una aigua',flat:'Terrat',attic:'Golfes i terrat'};
const collections=['tiles','landmarks','markets','churches','townHalls','customBuildings','bridges'];
const directions=['Sud','Est','Nord','Oest'];

/** Return a detached snapshot of one saved element; never mutate the world.
 * Raycast source takes priority over cell ownership (e.g. ground under a bridge). */
export function inspectElement(world,point){
  if(!point)return null;
  let collection,element;
  if(point.entity){
    const {collection:c,index}=point.entity;
    if(!collections.includes(c)||!Number.isInteger(index)||index<0)return null;
    collection=c;element=world[c]?.[index];
  }else{
    const {x,z}=point;
    for(const [c,find] of [['landmarks',landmarkAt],['customBuildings',customAt],['markets',marketAt],['churches',churchAt],['townHalls',townHallAt],['bridges',bridgeAt]]){
      const found=find(world,x,z);if(found){collection=c;element=found;break;}
    }
    if(!element){
      const owner=patioAt(world,x,z)??diningTerraces(world).get(`${x},${z}`);
      const custom=owner&&customAt(world,owner.x,owner.z);
      if(custom){collection='customBuildings';element=custom;}
      else {collection='tiles';element=world.tiles.find(t=>t.x===(owner?.x??x)&&t.z===(owner?.z??z));}
    }
  }
  if(!element)return null;
  let name,category,description='',cells=[],businesses=[];
  const facts=[],add=(label,value)=>{if(value!==undefined&&value!==null&&value!=='')facts.push([label,String(value)]);};
  if(collection==='tiles'){
    const tree=TREE_SPECIES.find(s=>s.id===element.kind),crop=AGRICULTURAL_TERRAINS[element.kind];
    name=tree?.name??crop?.name??groundNames[element.kind]??element.kind;
    category=tree?'Arbre':crop?'Terreny agrícola':'Terreny';
    description=tree?.description??crop?.description??'';
    if(tree?.scientific)add('Nom científic',tree.scientific);
    if(tree)add('Terreny de base',groundNames[element.treeGround]??AGRICULTURAL_TERRAINS[element.treeGround]?.name??'Terra ferma');
    if(element.kind==='house'){
      name=element.patio?'Casa amb pati':'Casa';category='Casa';
      add('Plantes construïdes',element.levels.filter(Boolean).length);add('Coberta',roofNames[element.roof]);
      businesses=[...(element.business?[{...element.business,floor:0}]:[]),...(element.upperBusinesses??[])];
      if(element.patio)add('Pati',element.patio.position==='front'?'Davant':'Darrere');
    }
    if(element.beachBar){name=element.beachBar.name||'Guingueta';category='Guingueta';}
    if(hasSlope(element))add('Pendent cap a',directions[element.slopeDirection]);
    if(element.kind==='stairs')add('Baranes',element.stairRailing==='iron'?'Ferro':'Sense baranes');
    if(element.terrainRailing)add('Barana del terreny',{iron:'Ferro',wood:'Fusta',stone:'Pedra'}[element.terrainRailing.material]);
    add('Nivell del terreny',element.elevation??0);
  }else if(collection==='landmarks'){
    const def=LANDMARK_TYPES[element.type];name=element.signName||def?.name||element.type;
    category=def?.category==='monument'?'Monument':'Edifici';description=def?.help??'';
    if(element.signName)add('Tipus',def?.name??element.type);
    cells=landmarkCells(element);
  }else if(collection==='customBuildings'){
    name=element.design.name;category='Edifici del jugador';cells=customCells(element);
    add('Plantes màximes',Math.max(...element.design.ground.map((_,i)=>customFloors(element.design,i))));
    businesses=element.businesses??[];
  }else if(collection==='bridges'){
    name=element.type==='stone'?'Pont de pedra amb arcades':'Pont';category='Pont';cells=bridgeCells(element);
    add('Extrem inicial',`(${element.a.x}, ${element.a.z})`);add('Extrem final',`(${element.b.x}, ${element.b.z})`);
  }else{
    const info={markets:['Mercat',marketCells],churches:['Església',churchCells],townHalls:['Ajuntament',townHallCells]}[collection];
    name=element.signName||info[0];category=info[0];cells=info[1](element);
  }
  const level=Number.isInteger(point.level)?point.level:null;
  if(level!==null&&(element.kind==='house'||collection==='customBuildings'))add('Planta assenyalada',level===0?'Planta baixa':`Planta ${level+1}`);
  for(const business of businesses.filter(b=>level===null||b.floor===level)){
    const type=BUSINESS_NAMES[business.type]??business.type;
    add('Negoci',business.name?`${type} · ${business.name}`:type);
  }
  if(cells.length)add('Superfície',`${new Set(cells.map(p=>p.x)).size} × ${new Set(cells.map(p=>p.z)).size} cel·les`);
  if(element.x!==undefined)add('Posició',`(${element.x}, ${element.z})`);
  if(element.direction!==undefined)add('Orientació',directions[element.direction]);
  return {name,category,description,facts,collection,json:JSON.stringify(element,null,2)};
}
