import {renderMeadowFlowers,MEADOW_GREEN} from './meadow.js';
import {createStoneArchGeometry,renderStoneBridge} from './stone-bridge.js';
import {createWallGateGeometry} from './wall-geometry.js';
import {FLOOR_HEIGHT,middleEntranceAccessible,businessOwner,businessY,sameBusiness} from './model.js';
import {renderLandmarks} from './landmark-geometry.js';
import {landmarkAt,landmarkCells,landmarkDimensions,landmarkHeight,checkLandmark} from './model.js';
import {createEntranceSupport,createEntranceSteps,renderEntranceSteps} from './entrance-access.js';
import {createSlopeWedge,slopeShearMatrix} from './slope-geometry.js';
import {renderRoadSurface} from './road-surfaces.js';
import {renderMediterraneanTree} from './mediterranean-trees.js';
import {renderBeachBars,BEACH_BAR_TOP} from './beach-bar.js';
import {checkBeachBar} from './model.js';
import {residentialEntrance,renderEntrance,renderRaisedEntrance,entranceLayout} from './entrances.js';
import {businessSignName,businessSignPixels} from './business-signs.js';
import {customAt,customCell,customCells,customDimensions,customFloors} from './designs.js';
import {renderCustomBuildings} from './custom-geometry.js';
import * as THREE from './vendor/three.module.min.js';
import {COLORS, DIRECTIONS, key, randomAt, terrainY, terrainBaseY, terrainSurfaceY, hasSlope, isFirmGround, LIMIT, worldLimit, TREE_SPECIES, isTree, isRoad, bridgeCells, bridgeHeight, bridgeAt, checkBridge, diningTerraces, businessFrontClear, businessSpaces, businessFront, marketAt, marketCells, marketDimensions, checkMarket} from './model.js';
import {createBeachMesh} from './beach.js';
import {createSenyera,waveSenyera} from './senyera.js';
import {patioCell,patioDirection,patioAt,checkPatioHouse,churchAt,churchCells,churchDimensions,churchTowerCell,checkChurch,townHallAt,townHallCells,townHallDimensions,checkTownHall,checkCustomBuilding} from './model.js';

export const UNIT=1.3, FLOOR=FLOOR_HEIGHT;
const UP=new THREE.Vector3(0,1,0);
const materials=new Map();
function material(color){
  if(!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,...(color==='#ffe9a0'?{emissive:'#ffce72',emissiveIntensity:.8}:{}),roughness:.92,metalness:0,side:['#789456','#607c43','#91a865'].includes(color)?THREE.DoubleSide:THREE.FrontSide}));
  return materials.get(color);
}
const geometries={
  box:new THREE.BoxGeometry(1,1,1),
  ramp:createSlopeWedge(),
  churchCap:new THREE.ConeGeometry(Math.SQRT1_2,1,4).rotateY(Math.PI/4),
  cylinder:new THREE.CylinderGeometry(.5,.5,1,12),
  cone:new THREE.ConeGeometry(.5,1,8),
  rock:new THREE.DodecahedronGeometry(.5,0),
  sphere:new THREE.SphereGeometry(.5,10,6),
  ring:new THREE.TorusGeometry(.5,.06,5,24),
};
geometries.stoneBridgeArch=createStoneArchGeometry();
geometries.wallGate=createWallGateGeometry();
geometries.wallGateTrim=createWallGateGeometry(true);
const arch=new THREE.Shape();arch.moveTo(-.5,0);arch.lineTo(.5,0);arch.lineTo(.5,.65);arch.absarc(0,.65,.5,0,Math.PI,false);arch.lineTo(-.5,0);
geometries.arch=new THREE.ExtrudeGeometry(arch,{depth:1,bevelEnabled:false,curveSegments:8});
const gable=new THREE.Shape();gable.moveTo(-.5,0);gable.lineTo(.5,0);gable.lineTo(0,.42);gable.closePath();
geometries.gable=new THREE.ExtrudeGeometry(gable,{depth:1,bevelEnabled:false});geometries.gable.translate(0,0,-.5);
const shedWall=new THREE.Shape();shedWall.moveTo(-.5,0);shedWall.lineTo(.5,0);shedWall.lineTo(.5,.07);shedWall.lineTo(-.5,.49);shedWall.closePath();
geometries.shedWall=new THREE.ExtrudeGeometry(shedWall,{depth:1,bevelEnabled:false});geometries.shedWall.translate(0,0,-.5);
// A concave spandrel, genuinely open beneath the curve (not a painted arch).
const arcade=new THREE.Shape();arcade.moveTo(-.5,.42);arcade.lineTo(-.42,.42);
arcade.absarc(0,.42,.42,Math.PI,0,true);arcade.lineTo(.5,.42);
arcade.lineTo(.5,.86);arcade.lineTo(-.5,.86);arcade.closePath();
geometries.arcade=new THREE.ExtrudeGeometry(arcade,{depth:1,bevelEnabled:false,curveSegments:16});
// Folded, split fan leaves for the low, clumping Mediterranean fan palm.
const fanVertices=[];
for(let i=0;i<18;i++){
  const edge=j=>{const a=-1.15+j/18*2.3,r=j%2?.69:1;return [Math.sin(a)*r,Math.cos(a)*r,j%2?-.035:.04];};
  fanVertices.push(0,0,0,...edge(i),...edge(i+1));
}
geometries.fan=new THREE.BufferGeometry();geometries.fan.setAttribute('position',new THREE.Float32BufferAttribute(fanVertices,3));geometries.fan.computeVertexNormals();

export function solidAtHeight(tile,height){
  if(!tile)return false;
  if(height<terrainY(tile))return true;
  const level=Math.floor((height-terrainY(tile))/FLOOR);
  return tile.kind==='house'&&tile.levels[level]===true;
}

/** Separate hit volumes for terrain, every floor (including openings), and roof. */
export function createPickingGeometry(world,pickingMaterial){
  const targets=[],transforms=[];const helper=new THREE.Object3D();
  const push=(t,level,bottom,height)=>{
    helper.position.set(t.x*UNIT,bottom+height/2,t.z*UNIT);helper.scale.set(UNIT,height,UNIT);helper.updateMatrix();
    targets.push({x:t.x,z:t.z,level});transforms.push(helper.matrix.clone());
  };
  for(const t of world.tiles){
    const base=terrainY(t);
    if(t.kind==='beach'){if(t.beachBar)push(t,null,.26,BEACH_BAR_TOP-.26);continue;}
    if(t.kind==='house'){
      push(t,null,0,base);
      for(let level=0;level<t.floors;level++)push(t,level,base+level*FLOOR,FLOOR);
      push(t,t.floors-1,base+t.floors*FLOOR,t.roof==='tile'?.46:t.roof==='shed'?.60:.56);
    }else {
      const treeBase=isTree(t.kind)&&t.kind!=='vine'?terrainSurfaceY(t):base;
      push(t,null,0,treeBase+(TREE_SPECIES.find(s=>s.id===t.kind)?.height??(t.kind==='stairs'?.44:.05)));
      if(hasSlope(t)&&isFirmGround(t.kind))transforms.at(-1).premultiply(slopeShearMatrix(t,UNIT));
    }
  }
  for(const l of world.landmarks??[]){
    const ground=world.tiles.find(t=>t.x===l.x&&t.z===l.z);
    for(const p of landmarkCells(l))push(p,null,terrainY(ground),landmarkHeight(l));
  }
  for(const m of world.markets??[]){
    const tile=world.tiles.find(t=>t.x===m.x&&t.z===m.z);
    for(const c of marketCells(m))push(c,null,terrainY(tile),1.70);
  }
  for(const c of world.churches??[]){
    const ground=world.tiles.find(t=>t.x===c.x&&t.z===c.z),tower=churchTowerCell(c);
    for(const p of churchCells(c))push(p,null,terrainY(ground),p.x===tower.x&&p.z===tower.z?4.16:2.52);
  }
  for(const h of world.townHalls??[]){
    const ground=world.tiles.find(t=>t.x===h.x&&t.z===h.z);
    for(const p of townHallCells(h))push(p,null,terrainY(ground),2.53);
  }
  for(const b of world.customBuildings??[]){
    const ground=world.tiles.find(t=>t.x===b.x&&t.z===b.z);
    for(let i=0;i<b.design.ground.length;i++)push(customCell(b,i),null,terrainY(ground),customFloors(b.design,i)*FLOOR+.62);
  }
  for(const t of world.tiles.filter(t=>t.patio))push(patioCell(t),null,terrainY(t),.42);
  for(const [id,owner] of diningTerraces(world)){
    const [x,z]=id.split(',').map(Number);push({x,z},null,businessY(owner),.40);
  }
  for(const owner of businessSpaces(world).values()){
    if(owner.business.type!=='greengrocer')continue;
    const d=owner.business.direction,[dx,dz]=DIRECTIONS[d];
    for(const u of [-.38,.38]){
      helper.position.set(owner.x*UNIT+dx*.81+dz*u,businessY(owner)+.32,owner.z*UNIT+dz*.81-dx*u);
      helper.scale.set(d%2?.24:.34,.56,d%2?.34:.24);helper.updateMatrix();
      targets.push({x:owner.x,z:owner.z,level:owner.businessFloor??0});transforms.push(helper.matrix.clone());
    }
  }
  for(const b of world.bridges??[]){
    const cells=bridgeCells(b),alongX=b.a.z===b.b.z;
    for(let i=1;i<cells.length-1;i++){
      const c=cells[i],h=bridgeHeight(world,b,i/(cells.length-1));
      helper.position.set(c.x*UNIT,h+.12,c.z*UNIT);helper.scale.set(alongX?UNIT:.88,.42,alongX?.88:UNIT);helper.updateMatrix();
      targets.push({...c,level:null});transforms.push(helper.matrix.clone());
    }
  }
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pickingMaterial,targets.length);
  transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  mesh.userData.targets=targets;return mesh;
}

/** All repeating architecture is instanced, so windows do not each cost a draw call. */
export function createVillageGeometry(world){
  const batches=new Map(),flags=[];
  const helper=new THREE.Object3D();
  const map=new Map(world.tiles.map(t=>[key(t.x,t.z),t]));
  for(const m of world.markets??[])for(const c of marketCells(m)){
    const t=map.get(key(c.x,c.z));map.set(key(c.x,c.z),{...t,kind:'house',floors:2,levels:[true,true]});
  }
  for(const c of world.churches??[])for(const p of churchCells(c)){
    const t=map.get(key(p.x,p.z)),tower=churchTowerCell(c),floors=p.x===tower.x&&p.z===tower.z?5:3;
    map.set(key(p.x,p.z),{...t,kind:'house',floors,levels:Array(floors).fill(true)});
  }
  for(const h of world.townHalls??[])for(const p of townHallCells(h)){
    const t=map.get(key(p.x,p.z));map.set(key(p.x,p.z),{...t,kind:'house',floors:2,levels:[true,true]});
  }
  for(const b of world.customBuildings??[])for(let i=0;i<b.design.ground.length;i++){
    const p=customCell(b,i),t=map.get(key(p.x,p.z)),floors=customFloors(b.design,i);map.set(key(p.x,p.z),{...t,kind:'house',floors,levels:Array.from({length:floors},(_,level)=>(level===0?b.design.ground[i]:b.design.middle[i]).style==='solid')});
  }
  const terraces=diningTerraces(world),spaces=businessSpaces(world),entranceSupported=createEntranceSupport(world),entranceSteps=createEntranceSteps(world);
  const patios=new Map(world.tiles.filter(t=>t.patio).map(t=>{const p=patioCell(t);return [key(p.x,p.z),t];}));
  const isBrava=world.region==='brava';
  function add(shape,color,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0){
    const id=`${shape}:${color}`;
    if(!batches.has(id))batches.set(id,{shape,color,matrices:[]});
    helper.position.set(x,y,z);helper.rotation.set(rx,ry,rz);helper.scale.set(sx,sy,sz);helper.updateMatrix();
    batches.get(id).matrices.push(helper.matrix.clone());
  }
  function box(color,x,y,z,sx,sy,sz,ry=0,rx=0,rz=0){add('box',color,x,y,z,sx,sy,sz,ry,rx,rz);}
  function shopSign(t,d,y,color,depth,width,offset=0){
    for(const p of businessSignPixels(businessSignName(t.business),width))face('box',color,t,d,p.x+offset,y+.765+p.y,depth,p.size,p.size,.011);
  }
  function face(shape,color,t,d,u,v,depth,sx,sy,sz){const a=d*Math.PI/2;add(shape,color,t.x*UNIT+Math.cos(a)*u+Math.sin(a)*depth,v,t.z*UNIT-Math.sin(a)*u+Math.cos(a)*depth,sx,sy,sz,a);}
  function pine(x,y,z,seed=0){
    const h=1.12+seed*.35;
    add('cylinder','#80654a',x,y+h*.5,z,.105,h,.105,.16);
    add('cylinder','#80654a',x+.12,y+h*.8,z,.06,.58,.06,0,0,-.55);
    add('rock','#52754f',x,y+h+.07,z,1.35,.57,1.18,seed*6);
    add('rock','#638759',x-.3,y+h+.09,z+.12,.95,.51,.94,seed*3);
    add('rock','#76965f',x+.24,y+h+.22,z-.11,.83,.42,.83,seed*4);
  }
  function branch(color,a,b,width){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start),length=dir.length();
    const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,dir.normalize()));
    const mid=start.add(end).multiplyScalar(.5);
    add('cylinder',color,mid.x,mid.y,mid.z,width,length,width,rotation.y,rotation.x,rotation.z);
  }
  function palm(x,y,z,seed){
    for(let stem=0;stem<3;stem++){
      const a=stem*2.4+seed*2,ox=x+Math.sin(a)*.19,oz=z+Math.cos(a)*.19,h=[.63,.38,.27][stem];
      add('cylinder','#94714d',ox,y+h/2,oz,.16,h,.16);
      for(let r=0;r<4;r++)add('cylinder','#75573d',ox,y+h*(r+.5)/4,oz,.18,.037,.18);
      for(let leaf=0;leaf<8;leaf++){
        const angle=leaf*Math.PI/4+stem*.47+seed,s=stem===0?.61:.46;
        const px=ox+Math.sin(angle)*.20,py=y+h+.10,pz=oz+Math.cos(angle)*.20;
        branch('#607c43',[ox,y+h,oz],[px,py,pz],.026);
        const orientation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(UP,angle).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.78+(leaf%3)*.2)));
        add('fan',['#789456','#607c43','#91a865'][leaf%3],px,py,pz,s,s,s,orientation.y,orientation.x,orientation.z);
      }
    }
  }
  function oak(x,y,z,seed){
    branch('#74644e',[x,y,z],[x+.04,y+1.1,z],.22);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5+seed,dx=Math.sin(a),dz=Math.cos(a);
      branch('#74644e',[x,y+.65,z],[x+dx*.40,y+1.3,z+dz*.40],.09);
      add('rock',['#415f3c','#4d6b43','#5a774b'][i%3],x+dx*.35,y+1.37+(i%2)*.11,z+dz*.35,1.05,.96,1.03,a);
    }
    add('rock','#526f43',x,y+1.64,z,1.16,.82,1.1,seed*4);
  }
  function plane(x,y,z,seed){
    branch('#d6cfb4',[x,y,z],[x,y+1.50,z],.21);
    for(let i=0;i<9;i++){
      const a=i*2.4+seed,dy=.15+i*.14;
      add('rock',i%2?'#a0a38b':'#eee5c7',x+Math.sin(a)*.092,y+dy,z+Math.cos(a)*.092,.08,.17,.07,a);
    }
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5+seed,dx=Math.sin(a),dz=Math.cos(a);
      branch('#c9c5ab',[x,y+1.13,z],[x+dx*.56,y+1.86,z+dz*.56],.085);
      add('rock',['#85a451','#73964b','#99b65e'][i%3],x+dx*.48,y+1.96+(i%2)*.12,z+dz*.48,1.27,1.02,1.22,a);
    }
    add('rock','#91ad56',x,y+2.30,z,1.13,.81,1.09,seed*3);
  }
  function pot(t,d,u,y){
    face('cylinder','#b76549',t,d,u,y+.09,.71,.15,.18,.15);
    face('rock','#657d48',t,d,u,y+.21,.71,.24,.17,.20);
    face('sphere','#ce5287',t,d,u-.05,y+.27,.74,.10,.10,.1);
    face('sphere','#e87b9c',t,d,u+.055,y+.23,.76,.095,.095,.1);
  }
  function barFacade(t,d,y){
    // Glazed door and serving window replace the residential ground-floor details.
    face('box','#dac6a4',t,d,0,y+.30,.654,1.05,.57,.035);
    face('box','#254f55',t,d,-.31,y+.28,.682,.27,.50,.026);
    face('box','#3f777b',t,d,.19,y+.35,.682,.58,.32,.028);
    face('box','#bfa67b',t,d,-.31,y+.28,.704,.019,.49,.018);
    face('box','#eee0bd',t,d,-.21,y+.24,.711,.025,.055,.016);
    face('box','#9b7046',t,d,.19,y+.18,.75,.64,.065,.19);
    face('box','#efe1c5',t,d,-.31,y+.022,.75,.34,.045,.19);
    face('box','#315f55',t,d,0,y+.765,.683,t.business.name?1.10:.60,.17,.045);
    // Small extruded letter strokes keep the sign independent of fonts or textures.
    shopSign(t,d,y,'#fff0c9',.712,t.business.name?1:.50);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f4e5bf':'#438778';
      face('box',color,t,d,u,y+.655,.88,.113,.04,.49);
      face('box',color,t,d,u,y+.607,1.12,.113,.075,.035);
    }
    for(const u of [-.49,.49])face('box','#6d775e',t,d,u,y+.595,.72,.025,.12,.13);
  }
  function fruitFacade(t,d,y){
    face('box','#ddcba9',t,d,0,y+.30,.652,1.08,.58,.04);
    face('box','#467363',t,d,0,y+.29,.681,.35,.54,.024);
    face('box','#72a6a0',t,d,0,y+.34,.70,.27,.39,.019);
    face('box','#d6b86e',t,d,.11,y+.27,.719,.024,.06,.015);
    face('box','#f1e6cf',t,d,0,y+.025,.735,.38,.05,.18);
    for(const u of [-.38,.38])face('box','#7baba1',t,d,u,y+.39,.682,.30,.32,.025);
    face('box','#486e3b',t,d,0,y+.765,.68,1.06,.17,.045);
    shopSign(t,d,y,'#fff5c8',.71,.98);
    const front=businessFront(t);if(!sameBusiness(spaces.get(key(front.x,front.z)),t))return;
    // Two independent three-tier racks leave a clear central doorway.
    for(const [side,u] of [[0,-.38],[1,.38]]){
      for(const ox of [-.15,.15])for(const depth of [.71,.91])face('box','#805d38',t,d,u+ox,y+.32,depth,.025,.54,.025);
      for(let tier=0;tier<3;tier++){
        const h=.13+tier*.16;
        face('box','#b28a51',t,d,u,y+h,.81,.32,.026,.23);
        face('box','#946637',t,d,u,y+h+.032,.928,.32,.055,.025);
        face('box','#946637',t,d,u,y+h+.032,.70,.32,.055,.025);
        for(const ox of [-.148,.148])face('box','#946637',t,d,u+ox,y+h+.032,.815,.024,.055,.22);
        const colors=['#dd533d','#f3a12c','#8fbc48','#eacb49','#bb5355','#74a557'];
        for(let row=0;row<2;row++)for(let col=-1;col<=1;col++){
          const px=u+col*.079,depth=.766+row*.075;
          face('sphere',colors[side*3+tier],t,d,px,y+h+.060,depth,.064,.064,.064);
          if(col===0)face('sphere','#4b7b37',t,d,px+.011,y+h+.093,depth,.031,.012,.018);
        }
      }
    }
  }
  function groceryFacade(t,d,y){
    face('box','#c7b491',t,d,0,y+.30,.653,1.09,.58,.036);
    face('box','#435d4a',t,d,0,y+.29,.679,.35,.54,.028);
    face('box','#77a2a0',t,d,0,y+.35,.700,.27,.36,.018);
    face('box','#d9be75',t,d,.11,y+.28,.718,.024,.058,.014);
    face('box','#eaddc2',t,d,0,y+.025,.74,.38,.05,.19);
    face('box','#a47b43',t,d,0,y+.765,.683,1.08,.17,.043);
    shopSign(t,d,y,'#fff2cc',.710,1);
    // Shallow display windows, framed into the façade rather than occupying the street.
    for(const [side,u] of [[0,-.38],[1,.38]]){
      face('box','#365762',t,d,u,y+.35,.683,.32,.45,.028);
      for(const ox of [-.164,.164])face('box','#b79a68',t,d,u+ox,y+.35,.727,.025,.47,.055);
      for(let tier=0;tier<3;tier++){
        const h=.15+tier*.145;
        face('box','#c2a777',t,d,u,y+h,.72,.32,.022,.10);
        for(let col=-1;col<=1;col++){
          const px=u+col*.092;
          if(side===0){
            const color=['#d99b43','#b65342','#7f9b58'][tier];
            face('cylinder',color,t,d,px,y+h+.047,.726,.059,.075,.046);
            face('cylinder','#d3c4a1',t,d,px,y+h+.088,.726,.062,.012,.049);
            face('box','#eee1b7',t,d,px,y+h+.046,.752,.044,.023,.008);
          }else if(tier<2){
            face('cylinder',tier===0?'#4f7848':'#886443',t,d,px,y+h+.044,.726,.044,.07,.041);
            face('cylinder','#557050',t,d,px,y+h+.09,.726,.020,.029,.020);
            face('box','#efdfaf',t,d,px,y+h+.043,.751,.031,.029,.008);
          }else{
            face('sphere','#d69a55',t,d,px,y+h+.043,.728,.070,.055,.053);
            for(const ox of [-.013,.013])face('box','#f1cf86',t,d,px+ox,y+h+.065,.744,.007,.016,.015);
          }
        }
      }
    }
  }
  function butcherFacade(t,d,y){
    face('box','#e8dfcc',t,d,0,y+.30,.654,1.10,.58,.04);
    face('box','#814d45',t,d,0,y+.29,.683,.35,.54,.028);
    face('box','#92aba8',t,d,0,y+.35,.706,.26,.35,.019);
    face('box','#ddd5b9',t,d,.108,y+.28,.725,.022,.055,.013);
    face('box','#ece7d7',t,d,0,y+.026,.74,.39,.052,.18);
    face('box','#813f42',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#fff3d8',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f1e6ce':'#a75e59';
      face('box',color,t,d,u,y+.650,.825,.113,.035,.32);
      face('box',color,t,d,u,y+.608,.98,.113,.060,.018);
    }
    for(const [side,u] of [[0,-.39],[1,.39]]){
      face('box','#536d6b',t,d,u,y+.35,.685,.31,.46,.028);
      for(const ox of [-.164,.164])face('box','#d1c6b1',t,d,u+ox,y+.35,.721,.024,.48,.05);
      face('box','#dbd9cb',t,d,u,y+.105,.752,.32,.13,.13);
      for(let tile=-1;tile<=1;tile++)face('box','#f3eee0',t,d,u+tile*.101,y+.105,.824,.092,.105,.014);
      if(side===0){
        for(let tier=0;tier<2;tier++){
          const h=.215+tier*.195;
          face('box','#bec9c3',t,d,u,y+h-.055,.759,.32,.025,.12);
          for(const offset of [-.074,.074]){
            const px=u+offset;
            face('box','#f4e9d7',t,d,px,y+h,.770,.128,.089,.027);
            face('sphere','#bc706b',t,d,px,y+h,.793,.102,.064,.031);
            face('sphere','#e3a49a',t,d,px,y+h,.811,.075,.041,.012);
            face('sphere','#f2ddc4',t,d,px+.018,y+h,.820,.019,.019,.008);
          }
        }
      }else{
        face('box','#aeb7b2',t,d,u,y+.565,.738,.30,.018,.024);
        for(let col=-1;col<=1;col++){
          const px=u+col*.092;
          face('box','#e0cfac',t,d,px,y+.545,.758,.010,.038,.010);
          face('sphere','#985c49',t,d,px,y+.449,.767,.052,.170,.050);
          for(const h of [.411,.461,.498])face('box','#d3b089',t,d,px,y+h,.795,.044,.008,.008);
        }
        face('box','#bec9c3',t,d,u,y+.174,.759,.32,.025,.12);
        face('box','#f4e9d7',t,d,u,y+.227,.772,.28,.081,.027);
        for(let col=-1;col<=1;col++)face('sphere','#c18a79',t,d,u+col*.081,y+.228,.801,.068,.033,.025);
      }
    }
  }
  function bakeryFacade(t,d,y){
    face('box','#dbbd89',t,d,0,y+.30,.654,1.10,.58,.04);
    face('box','#79543b',t,d,0,y+.29,.683,.35,.54,.028);
    face('box','#92aaa0',t,d,0,y+.35,.706,.26,.35,.019);
    face('box','#e9ce8e',t,d,.108,y+.28,.725,.022,.055,.013);
    face('box','#eaddbf',t,d,0,y+.026,.74,.39,.052,.18);
    face('box','#805838',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#fff1cd',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f5e8c9':'#c4934e';
      face('box',color,t,d,u,y+.650,.825,.113,.035,.32);
      face('box',color,t,d,u,y+.608,.98,.113,.060,.018);
    }
    for(const [side,u] of [[0,-.39],[1,.39]]){
      face('box','#554d3b',t,d,u,y+.35,.685,.31,.46,.028);
      for(const ox of [-.164,.164])face('box','#b08d5b',t,d,u+ox,y+.35,.721,.024,.48,.05);
      for(let tier=0;tier<2;tier++){
        const h=.145+tier*.225;
        face('box','#c5a477',t,d,u,y+h,.746,.32,.023,.12);
        if(side===0){
          for(const offset of [-.073,.073]){
            const px=u+offset;
            face('sphere','#d5a05d',t,d,px,y+h+.051,.758,.125,.092,.079);
            face('box','#f5d798',t,d,px,y+h+.061,.798,.070,.009,.009);
            face('box','#f5d798',t,d,px,y+h+.061,.798,.010,.047,.009);
          }
        }else{
          for(let col=-1;col<=1;col++){
            const px=u+col*.092;
            face('sphere','#c98c45',t,d,px,y+h+.105,.758,.059,.177,.057);
            for(let cut=-1;cut<=1;cut++)face('box','#f3d49a',t,d,px,y+h+.105+cut*.040,.790,.040,.010,.009);
          }
        }
      }
    }
  }
  function fishmongerFacade(t,d,y){
    face('box','#e1ede7',t,d,0,y+.30,.654,1.10,.58,.04);
    face('box','#3e7689',t,d,0,y+.29,.683,.35,.54,.028);
    face('box','#91bac2',t,d,0,y+.35,.706,.27,.36,.019);
    face('box','#e7e9d5',t,d,.108,y+.28,.725,.022,.055,.013);
    face('box','#ece9d7',t,d,0,y+.026,.74,.39,.052,.18);
    face('box','#326d84',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#f6f3df',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f1eddb':'#6c9cad';
      face('box',color,t,d,u,y+.650,.825,.113,.035,.32);
      face('box',color,t,d,u,y+.608,.98,.113,.060,.018);
    }
    for(const [side,u] of [[0,-.39],[1,.39]]){
      face('box','#487d8b',t,d,u,y+.36,.685,.32,.45,.028);
      for(const ox of [-.165,.165])face('box','#cfddd5',t,d,u+ox,y+.35,.722,.024,.48,.05);
      face('box','#7f9fa9',t,d,u,y+.11,.75,.33,.16,.14);
      for(let tile=0;tile<3;tile++)face('box','#dce8e2',t,d,u+(tile-1)*.105,y+.11,.827,.093,.125,.012);
      // Raised ice beds keep the fish visible through the shopfront.
      face('box','#a7b8bc',t,d,u,y+.33,.754,.33,.29,.075);
      face('box','#f0f8f4',t,d,u,y+.335,.799,.294,.255,.025);
      for(let row=0;row<4;row++)for(let col=0;col<3;col++){
        face('sphere','#d7ecea',t,d,u+(col-1)*.086,y+.24+row*.061,.816,.038,.027,.020);
      }
      for(let row=0;row<3;row++){
        const px=u+(row%2?.031:-.024),h=.255+row*.079,sign=(side+row)%2?1:-1,color=row%2?'#b4c8c8':'#8daeb8';
        face('sphere',color,t,d,px,y+h,.827,.132,.043,.030);
        for(const v of [-1,1])face('sphere',color,t,d,px-sign*.077,y+h+v*.012,.827,.044,.027,.021);
        face('sphere','#517887',t,d,px-sign*.007,y+h+.023,.827,.044,.021,.016);
        face('box','#dbe4dc',t,d,px+sign*.030,y+h,.846,.009,.030,.008);
        face('sphere','#243e4a',t,d,px+sign*.047,y+h+.006,.846,.010,.010,.006);
      }
      face('box','#d6e2dc',t,d,u,y+.189,.797,.35,.023,.13);
    }
  }
  function pharmacyFacade(t,d,y){
    face('box','#dfe8db',t,d,0,y+.31,.654,1.10,.60,.042);
    face('box','#4b836c',t,d,0,y+.30,.683,.37,.55,.030);
    for(const u of [-.078,.078])face('box','#92beb6',t,d,u,y+.35,.707,.137,.39,.020);
    face('box','#e1e9dc',t,d,0,y+.35,.723,.015,.40,.012);
    for(const u of [-.033,.033])face('box','#d2dbc9',t,d,u,y+.28,.738,.014,.075,.014);
    face('box','#ebe9d6',t,d,0,y+.027,.74,.42,.054,.18);
    face('box','#faf5e6',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#2e7455',.713,.81,.08);
    // Green cross at the left of the name, sized to stay inside the signboard.
    face('box','#247447',t,d,-.455,y+.765,.718,.150,.057,.014);
    face('box','#247447',t,d,-.455,y+.765,.718,.057,.150,.014);
    face('box','#39b86a',t,d,-.455,y+.765,.730,.130,.041,.012);
    face('box','#39b86a',t,d,-.455,y+.765,.730,.041,.130,.012);
    face('box','#5d9573',t,d,0,y+.64,.714,1.10,.038,.10);
    for(const [side,u] of [[0,-.39],[1,.39]]){
      face('box','#547a78',t,d,u,y+.35,.685,.30,.46,.026);
      for(const ox of [-.157,.157])face('box','#edf0dc',t,d,u+ox,y+.35,.724,.022,.48,.05);
      for(let tier=0;tier<3;tier++){
        const h=.14+tier*.15;
        face('box','#b4cdbb',t,d,u,y+h,.746,.31,.020,.11);
        for(let col=0;col<2;col++){
          const px=u+(col-.5)*.14;
          if(side===0){
            face('box','#f2f1e3',t,d,px,y+h+.056,.748,.105,.097,.05);
            face('box',['#64a98b','#7198bb','#ceaa74'][tier],t,d,px,y+h+.070,.779,.106,.030,.009);
            face('box','#779084',t,d,px,y+h+.032,.779,.064,.009,.009);
          }else{
            face('cylinder',tier===1?'#7eaaab':'#ab8257',t,d,px,y+h+.044,.748,.068,.073,.060);
            face('cylinder','#e2e7d5',t,d,px,y+h+.088,.748,.058,.020,.053);
            face('box','#f5f1db',t,d,px,y+h+.047,.782,.050,.031,.008);
            face('box','#64a98b',t,d,px,y+h+.047,.789,.031,.009,.006);
          }
        }
      }
    }
  }
  function floristFacade(t,d,y){
    face('box','#8aab8c',t,d,0,y+.30,.654,1.09,.58,.04);
    face('box','#3e6759',t,d,0,y+.29,.683,.35,.55,.028);
    face('box','#8bb9b0',t,d,0,y+.35,.706,.26,.36,.019);
    face('box','#e9dba9',t,d,.105,y+.28,.726,.023,.055,.014);
    face('box','#e9dfc6',t,d,0,y+.026,.739,.39,.052,.18);
    face('box','#496c50',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#fff0db',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f5e9cf':'#96b19a';
      face('box',color,t,d,u,y+.650,.825,.113,.035,.32);
      face('box',color,t,d,u,y+.608,.98,.113,.060,.018);
    }
    const petals=['#e887a6','#f2ce65','#ae91c6','#e27366'];
    for(const [side,u] of [[0,-.38],[1,.38]]){
      face('box','#2f5750',t,d,u,y+.35,.687,.33,.47,.028);
      for(const ox of [-.17,.17])face('box','#b9c7a2',t,d,u+ox,y+.35,.722,.022,.49,.054);
      for(let tier=0;tier<2;tier++){
        const h=.13+tier*.235;
        face('box','#b6a886',t,d,u,y+h,.753,.34,.026,.14);
        for(let col=0;col<2;col++){
          const px=u+(col-.5)*.15;
          face('cylinder','#b87d62',t,d,px,y+h+.047,.763,.083,.075,.079);
          face('cylinder','#d8a184',t,d,px,y+h+.083,.763,.094,.014,.089);
          for(let stem=0;stem<3;stem++){
            const fx=px+(stem-1)*.030,fh=h+.142+(stem===1?.025:0),color=petals[(side*2+tier+col)%petals.length];
            face('box','#567d45',t,d,fx,y+(h+.08+fh)/2,.771,.009,fh-h-.08,.009);
            face('sphere','#769659',t,d,fx+(stem%2?.016:-.016),y+fh-.025,.774,.037,.017,.018);
            for(let petal=0;petal<5;petal++){
              const angle=petal*Math.PI*2/5;
              face('sphere',color,t,d,fx+Math.cos(angle)*.017,y+fh+Math.sin(angle)*.017,.792,.025,.025,.018);
            }
            face('sphere','#f9dfa0',t,d,fx,y+fh,.805,.018,.018,.012);
          }
        }
      }
    }
  }
  function newsstandFacade(t,d,y){
    // A shallow street-facing kiosk: papers and magazines flank the service hatch.
    face('box','#36566a',t,d,0,y+.31,.657,1.09,.59,.042);
    face('box','#203d48',t,d,0,y+.40,.688,.40,.32,.024);
    face('box','#83a5a0',t,d,0,y+.46,.703,.32,.17,.013);
    for(const u of [-.216,.216])face('box','#d9ba70',t,d,u,y+.36,.709,.025,.43,.043);
    face('box','#ba965c',t,d,0,y+.225,.777,.49,.047,.20);
    face('box','#567487',t,d,0,y+.115,.695,.42,.20,.025);
    face('box','#304c62',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#fff3b5',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const color=stripe%2?'#f3e8c7':'#d2ad58',u=(stripe-4.5)*.112;
      face('box',color,t,d,u,y+.653,.825,.113,.037,.32);
      face('box',color,t,d,u,y+.610,.98,.113,.065,.018);
    }
    for(const u of [-.38,.38]){
      face('box','#243b47',t,d,u,y+.35,.705,.30,.49,.036);
      for(let tier=0;tier<3;tier++){
        const h=.18+tier*.15;
        face('box','#85949b',t,d,u,y+h-.061,.752,.31,.021,.12);
        for(let col=0;col<2;col++){
          const px=u+(col-.5)*.134;
          if(u<0){
            face('box','#f3efdd',t,d,px,y+h,.759,.116,.115,.025);
            face('box','#374650',t,d,px,y+h+.038,.778,.094,.015,.009);
            face('box','#89979a',t,d,px-.023,y+h+.008,.778,.04,.029,.009);
            for(let row=0;row<3;row++)face('box','#687276',t,d,px,y+h-.016-row*.012,.778,.091,.004,.009);
          }else{
            const color=['#cf6455','#559ca4','#dda34d','#8a7fac','#729457','#d5839d'][tier*2+col];
            face('box',color,t,d,px,y+h,.759,.116,.115,.025);
            face('box','#fff6df',t,d,px,y+h+.038,.778,.091,.014,.009);
            face('box','#e4d4aa',t,d,px,y+h-.003,.778,.064,.041,.009);
            face('box','#fff6df',t,d,px,y+h-.038,.778,.072,.007,.009);
          }
        }
      }
    }
    // Two folded newspapers resting on the counter.
    for(const u of [-.11,.055]){
      face('box','#f3efdd',t,d,u,y+.26,.78,.13,.026,.11);
      face('box','#687276',t,d,u,y+.275,.78,.09,.003,.025);
    }
  }
  function restaurantFacade(t,d,y){
    face('box','#d5c0a0',t,d,0,y+.30,.654,1.07,.57,.04);
    face('box','#693e38',t,d,0,y+.29,.682,.42,.54,.026);
    for(const u of [-.095,.095])face('box','#568888',t,d,u,y+.34,.703,.16,.39,.018);
    face('box','#d6b56b',t,d,0,y+.29,.72,.023,.50,.017);
    face('box','#f0ddbe',t,d,0,y+.025,.75,.47,.05,.20);
    face('box','#63958b',t,d,.39,y+.35,.69,.25,.36,.028);
    // Framed menu beside the door, with chalk-like lines.
    face('box','#a4784d',t,d,-.39,y+.32,.705,.24,.34,.035);
    face('box','#304d44',t,d,-.39,y+.32,.728,.195,.29,.016);
    for(let row=0;row<5;row++)face('box','#e4ddbe',t,d,-.39,y+.42-row*.047,.740,row===0?.14:.11,.011,.009);
    face('box','#7d3f3c',t,d,0,y+.765,.684,1.10,.17,.045);
    shopSign(t,d,y,'#ffefc0',.713,1.02);
    for(let stripe=0;stripe<10;stripe++){
      const u=(stripe-4.5)*.112,color=stripe%2?'#f0dfbb':'#9a5350';
      face('box',color,t,d,u,y+.655,.88,.113,.04,.49);
      face('box',color,t,d,u,y+.607,1.12,.113,.075,.035);
    }
  }
  function barTerrace(t){
    const d=t.business.direction,y=businessY(t)+.05,restaurant=t.business.type==='restaurant';
    face('box','#d6c3a3',t,d,0,y-.025,1.3,1.1,.04,1.12);
    for(const u of [-.31,.31]){
      if(restaurant){
        face('box','#f8f0df',t,d,u,y+.255,1.32,.35,.045,.37);
        for(const side of [-1,1]){
          face('box','#9b5049',t,d,u,y+.282,1.32+side*.09,.24,.008,.11);
          face('cylinder','#fffaf0',t,d,u,y+.292,1.32+side*.09,.082,.014,.082);
          face('cylinder','#d0ae69',t,d,u,y+.301,1.32+side*.09,.037,.007,.037);
          for(const offset of [-.065,.065])face('box','#a4afb0',t,d,u+offset,y+.294,1.32+side*.09,.010,.010,.071);
          face('cylinder','#b1d3cd',t,d,u+.105*side,y+.310,1.32,.027,.045,.027);
        }
      }else face('cylinder','#b97b4b',t,d,u,y+.255,1.32,.32,.045,.32);
      face('cylinder','#455f58',t,d,u,y+.12,1.32,.032,.24,.032);
      face('cylinder','#455f58',t,d,u,y+.018,1.32,.18,.035,.18);
      if(!restaurant){face('cylinder','#fff6df',t,d,u+.055,y+.295,1.32,.035,.034,.035);face('cylinder','#623f2b',t,d,u+.055,y+.313,1.32,.024,.006,.024);}
      for(const side of [-1,1]){
        const depth=1.32+side*.32;
        face('box','#ad8052',t,d,u,y+.135,depth,.18,.027,.18);
        face('box','#ad8052',t,d,u,y+.245,depth+side*.085,.18,.16,.027);
        for(const ox of [-.068,.068])for(const oz of [-.068,.068])face('box','#455f58',t,d,u+ox,y+.064,depth+oz,.018,.128,.018);
      }
    }
  }
  for(const owner of terraces.values())barTerrace(owner);
  for(const t of world.tiles){
    if(t.kind==='beach')continue;
    const x=t.x*UNIT,z=t.z*UNIT,y=terrainY(t),n=randomAt(t.x,t.z);
    const neighbours=DIRECTIONS.map(([dx,dz])=>map.get(key(t.x+dx,t.z+dz)));
    const coast=neighbours.some(t=>!t);
    const sand=!isBrava&&coast&&t.kind==='land'&&!hasSlope(t);
    const low=terrainBaseY(t),sloping=hasSlope(t),soil=isBrava?'#a9a18a':'#c9b386';
    const shear=sloping?slopeShearMatrix(t,UNIT):null;
    const surfaceBox=(color,...args)=>{box(color,...args);if(shear)batches.get(`box:${color}`).matrices.at(-1).premultiply(shear);};
    box(soil,x,low/2-.09,z,UNIT+.008,low+.18,UNIT+.008);
    if(sloping){
      add('ramp',soil,x,low,z,UNIT,.42,UNIT,t.slopeDirection*Math.PI/2);
      surfaceBox(t.kind==='meadow'?MEADOW_GREEN:isTree(t.kind)?'#b7b38e':'#d6cfb4',x,y+.002,z,UNIT,.014,UNIT);
    }else box(t.kind==='meadow'?MEADOW_GREEN:sand?'#ead39b':(isTree(t.kind)?'#b7b38e':'#d6cfb4'),x,y-.035,z,UNIT+.01,.09,UNIT+.01);
    const reserved=landmarkAt(world,t.x,t.z)||customAt(world,t.x,t.z)||townHallAt(world,t.x,t.z)||churchAt(world,t.x,t.z)||marketAt(world,t.x,t.z)||patios.has(key(t.x,t.z));
    // Retaining foundations keep architecture and terrace furniture upright.
    if(sloping&&(reserved||['house','plaza','stairs','vine'].includes(t.kind)||spaces.has(key(t.x,t.z)))){
      const width=reserved?UNIT:t.kind==='house'?1.20:1.28;
      box('#b2a58c',x,low+.21,z,width,.42,width);
    }
    if(t.kind==='meadow'&&sloping&&(reserved||spaces.has(key(t.x,t.z))))box(MEADOW_GREEN,x,y+.009,z,UNIT,.018,UNIT);
    if(reserved)continue;
    if(t.kind==='meadow'&&!spaces.has(key(t.x,t.z))&&!bridgeAt(world,t.x,t.z))renderMeadowFlowers(t,add,UNIT);
    if(coast&&!sloping)for(let d=0;d<4;d++)if(!neighbours[d]){
      const [dx,dz]=DIRECTIONS[d];
      if(isBrava){
        for(let j=0;j<3;j++){
          const k=randomAt(t.x+j,t.z,d+2),shift=(j-1)*.42;
          const rx=x+dx*.63+dz*shift,rz=z+dz*.63-dx*shift;
          add('rock',j%2?'#a8a493':'#b7b09b',rx,y*.32-.05,rz,.5+k*.35,y*.9+.30,.48+k*.3,k*4,.14,k*.2);
        }
      }else{
        box('#ead39b',x+dx*.62,y*.5-.035,z+dz*.62, d%2?.4:1.3,Math.max(.15,y*.55),d%2?1.3:.4);
      }
      const bridgeExit=(world.bridges??[]).some(b=>[b.a,b.b].some((p,i)=>p.x===t.x&&p.z===t.z&&Math.sign([b.b,b.a][i].x-p.x)===dx&&Math.sign([b.b,b.a][i].z-p.z)===dz));
      if(t.kind==='plaza'&&!bridgeExit){
        face('box','#eee3c8',t,d,0,y+.14,.61,1.24,.28,.11);
        face('box','#f7efd8',t,d,0,y+.30,.61,1.29,.05,.15);
      }
    }
    if(isRoad(t.kind))renderRoadSurface(t,surfaceBox,UNIT);
    // A subtle paving pattern joins neighbouring squares into streets and plazas.
    if(t.kind==='plaza'||t.kind==='stairs'){
      box('#e6dcc4',x,y+.014,z,1.27,.035,1.27);
      for(let p=-1;p<=1;p++)for(let q=-1;q<=1;q++)box((p+q)%2?'#dbd1b9':'#e0d6bd',x+p*.41,y+.036,z+q*.41,.39,.014,.39);
      if(t.kind==='plaza'&&!spaces.has(key(t.x,t.z))&&!bridgeAt(world,t.x,t.z)&&t.x===0&&t.z===0){
        add('cylinder','#c2b99e',x,y+.14,z,.75,.25,.75);
        add('cylinder','#699fa1',x,y+.27,z,.59,.02,.59);
        add('cylinder','#e5dcc4',x,y+.46,z,.15,.44,.15);
        add('sphere','#e5dcc4',x,y+.68,z,.24,.24,.24);
      }else if(t.kind==='plaza'&&!spaces.has(key(t.x,t.z))&&!bridgeAt(world,t.x,t.z)&&n>.9){
        box('#8d6f4e',x,y+.27,z,.63,.07,.23);
        box('#8d6f4e',x,y+.46,z-.08,.63,.25,.06);
        box('#52645a',x-.23,y+.12,z,.05,.25,.15);box('#52645a',x+.23,y+.12,z,.05,.25,.15);
      }
    }
    if(t.kind==='stairs'){
      for(let step=0;step<6;step++)face('box','#f2e7ce',t,t.rotation,0,y+.045+step*.035,(step-2.5)*.195,1.15,.08+step*.07,.20);
    }
    const treeY=t.kind==='vine'?y:terrainSurfaceY(t);
    if(t.kind==='pine')pine(x,treeY,z,n);
    if(t.kind==='palm')palm(x,treeY,z,n);
    if(t.kind==='oak')oak(x,treeY,z,n);
    if(t.kind==='plane')plane(x,treeY,z,n);
    if(['olive','vine','hazel'].includes(t.kind))renderMediterraneanTree(t.kind,x,treeY,z,n,add,branch);
    if(t.kind==='land'&&sand&&n>.91&&!spaces.has(key(t.x,t.z))){
      add('cylinder','#8c7757',x,y+.44,z,.035,.87,.035);
      add('cone','#e5aa68',x,y+.92,z,.95,.28,.95,n*3);
      box('#f3ece0',x-.24,y+.025,z+.22,.26,.025,.65,n);
    }
    if(t.kind!=='house')continue;
    const wall=COLORS[t.color].hex,shutter=t.color===3?'#e7e4d3':(n>.62?'#577e6c':'#447e87');
    const total=t.floors*FLOOR,top=y+total,entrances=Array.from({length:4},(_,d)=>residentialEntrance(t.x,t.z,d));
    // Continuous empty levels share tall supports and have no intervening slabs.
    for(let level=0;level<t.floors;level++){
      if(t.levels[level])continue;
      const first=level;while(level+1<t.floors&&!t.levels[level+1])level++;
      const count=level-first+1,bottom=y+first*FLOOR,height=count*FLOOR;
      for(const dx of [-.535,.535])for(const dz of [-.535,.535]){
        box(wall,x+dx,bottom+height/2,z+dz,.185,height,.185);
        box('#e5dac3',x+dx,bottom+.045,z+dz,.23,.09,.23);
        box('#eee4d0',x+dx,bottom+height-.07,z+dz,.24,.14,.24);
      }
      for(let d=0;d<4;d++){
        const next=neighbours[d];
        if(solidAtHeight(next,bottom+height-.20))continue;
        if(count===1)face('arcade',wall,t,d,0,bottom,.49,1.255,1,.14);
        else face('box',wall,t,d,0,bottom+height-.09,.56,1.255,.18,.14);
      }
    }
    for(let floor=0;floor<t.floors;floor++){
      if(!t.levels[floor])continue;
      const bottom=y+floor*FLOOR;
      box(wall,x,bottom+FLOOR/2,z,1.255,FLOOR,1.255);
      for(let d=0;d<4;d++){
        const next=neighbours[d];
        if(solidAtHeight(next,bottom+.22)&&solidAtHeight(next,bottom+.7))continue;
        face('box','#ede5d3',t,d,0,bottom+.035,.641,1.29,.07,.055);
        const doorU=entrances[d]?entranceLayout(entrances[d]).door:0;
        const accessU=t.business?.direction===d?(t.business.type==='bar'?-.31:0):doorU;
        const supported=entranceSupported(t,d,accessU);
        const hasDoor=!t.patio||d===t.patio.direction||d===patioDirection(t);
        const steps=floor===0&&hasDoor&&!supported?entranceSteps(t,d,accessU,entrances[d]?.door==='double'?.54:.46):null;
        const accessible=supported||!!steps;
        if(steps)renderEntranceSteps(steps,(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,t,d,u,h,depth,sx,sy,sz));
        const middleAccess=middleEntranceAccessible(world,t,floor,d);
        const upper=t.upperBusinesses?.find(b=>b.floor===floor&&b.direction===d);
        const shop=floor===0?(t.business?.direction===d?t:null):upper?businessOwner(t,upper):null;
        if(shop&&businessFrontClear(world,shop)&&(floor>0||accessible)){if(shop.business.type==='greengrocer')fruitFacade(shop,d,bottom);else if(shop.business.type==='grocery')groceryFacade(shop,d,bottom);else if(shop.business.type==='butcher')butcherFacade(shop,d,bottom);else if(shop.business.type==='bakery')bakeryFacade(shop,d,bottom);else if(shop.business.type==='fishmonger')fishmongerFacade(shop,d,bottom);else if(shop.business.type==='pharmacy')pharmacyFacade(shop,d,bottom);else if(shop.business.type==='florist')floristFacade(shop,d,bottom);else if(shop.business.type==='newsstand')newsstandFacade(shop,d,bottom);else if(shop.business.type==='restaurant')restaurantFacade(shop,d,bottom);else barFacade(shop,d,bottom);continue;}
        if(floor===0&&!accessible){
          renderRaisedEntrance(entrances[d],(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,t,d,u,bottom+h,depth,sx,sy,sz),{shutter});
        }else if(floor===0&&t.patio&&d!==t.patio.direction&&d!==patioDirection(t)){
          for(const u of [-.29,.29]){
            face('box','#eee4d1',t,d,u,bottom+.47,.64,.31,.37,.045);
            face('box',shutter,t,d,u,bottom+.47,.67,.24,.29,.025);
            face('box','#e1dac7',t,d,u,bottom+.47,.69,.018,.29,.014);
          }
        }else if((floor===0||middleAccess)&&entrances[d]){
          renderEntrance(entrances[d],(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,t,d,u,bottom+h,depth,sx,sy,sz),{shutter});
        }else if(floor===0||middleAccess){
          face('arch','#ded5bc',t,d,0,bottom+.025,.642,.36,.53,.025);
          face('arch',shutter,t,d,0,bottom+.035,.67,.28,.46,.022);
          face('box','#d6c9aa',t,d,0,bottom+.035,.73,.42,.06,.18);
          for(const u of [-.4,.4]){
            face('box','#eee4d1',t,d,u,bottom+.48,.64,.23,.32,.045);
            face('box',shutter,t,d,u,bottom+.48,.67,.17,.25,.025);
            face('box','#e1dac7',t,d,u,bottom+.48,.69,.015,.26,.014);
          }
        }else{
          const balcony=(floor===1&&randomAt(t.x,t.z,d+6)>.57);
          for(const u of [-.29,.29]){
            face('box','#eee5d2',t,d,u,bottom+.43,.64,.29,.48,.04);
            face('box','#3d6469',t,d,u,bottom+.44,.669,.20,.37,.025);
            face('box','#b1c5be',t,d,u,bottom+.44,.686,.016,.35,.012);
            face('box','#b1c5be',t,d,u,bottom+.44,.686,.20,.018,.012);
            for(const side of [-1,1]){
              face('box',shutter,t,d,u+side*.15,bottom+.44,.69,.10,.39,.035);
              for(let s=0;s<4;s++)face('box','#366469',t,d,u+side*.15,bottom+.33+s*.065,.712,.08,.01,.012);
            }
            if(!balcony)face('box','#f6ecda',t,d,u,bottom+.195,.69,.36,.05,.14);
          }
          if(balcony){
            face('box','#eee6d2',t,d,0,bottom+.14,.8,1.08,.08,.38);
            face('box','#4d655f',t,d,0,bottom+.47,.98,1.03,.035,.03);
            for(let b=-3;b<=3;b++)face('box','#4d655f',t,d,b*.15,bottom+.32,.98,.018,.30,.018);
            for(const u of [-.50,.50])face('box','#4d655f',t,d,u,bottom+.47,.8,.03,.035,.37);
            pot(t,d,.37,bottom+.20);
          }
        }
        const potU=entrances[d]?.position==='right'?-.47:.47;
        if(floor===0&&accessible&&entranceSupported(t,d,potU,.24)&&randomAt(t.x,t.z,d+33)>.65)pot(t,d,potU,bottom);
      }
    }
    const direction=t.roofDirection*Math.PI/2,c=Math.cos(direction),s=Math.sin(direction);
    const roofPart=(shape,color,u,h,v,sx,sy,sz,tilt=0)=>add(shape,color,x+c*u+s*v,top+h,z-s*u+c*v,sx,sy,sz,direction,0,tilt);
    if(t.roof==='shed'){
      // One sloping plane, with a closed wedge of wall underneath on all sides.
      roofPart('shedWall',wall,0,0,0,1.255,1,1.255);
      const angle=Math.atan(.42/1.255),width=1.39/Math.cos(angle),roofColor=n>.5?'#bf7957':'#c9825c';
      roofPart('box',roofColor,0,.315,0,width,.065,1.39,-angle);
      for(let line=-4;line<=4;line++)roofPart('box','#d4966d',0,.354,line*.146,width,.025,.024,-angle);
      roofPart('box','#cb8d62',-.68,.56,0,.085,.055,1.42);
      roofPart('box','#8b806c',.70,.075,0,.065,.06,1.43);
    }else if(t.roof==='flat'){
      box('#eee4ce',x,top+.03,z,1.31,.085,1.31);
      for(let d=0;d<4;d++){
        const next=neighbours[d];
        if(next?.kind==='house'&&Math.abs(terrainY(next)+next.floors*FLOOR-top)<.02)continue;
        face('box',wall,t,d,0,top+.16,.61,1.3,.25,.09);
      }
      if(n>.5){
        box('#cda979',x,top+.28,z,.65,.025,.65);
        for(const ox of [-.29,.29])for(const oz of [-.29,.29])box('#af9165',x+ox,top+.25,z+oz,.027,.5,.027);
        for(let j=-2;j<=2;j++)box('#b6996a',x+j*.13,top+.51,z,.045,.025,.7);
      }
    }else{
      roofPart('gable',wall,0,0,0,1.24,.88,1.24);
      const angle=Math.atan2(.39,.65),roofColor=n>.5?'#bf7957':'#c9825c';
      for(const side of [-1,1]){
        roofPart('box',roofColor,side*.335,.17,0,.81,.065,1.37,-side*angle);
        for(let line=-4;line<=4;line++)roofPart('box','#d4966d',side*.335,.203,line*.146,.81,.027,.024,-side*angle);
      }
      roofPart('box','#d49a72',0,.39,0,.10,.075,1.39);
      if(n>.55){roofPart('box','#ebe2cf',.3,.49,-.28,.18,.51,.18);roofPart('box','#ba7858',.3,.77,-.28,.25,.065,.25);}
    }
  }
  for(const t of world.tiles.filter(t=>t.patio)){
    const p=patioCell(t),d=patioDirection(t),y=terrainY(t),wall=COLORS[t.color].hex;
    // Open courtyard: three low enclosing walls, with a street gate at the front.
    face('box','#dfb78c',p,d,0,y+.035,0,1.27,.07,1.27);
    for(let u=-2;u<=2;u++)for(let v=-2;v<=2;v++)face('box',(u+v)%2?'#d3a47d':'#e7c29b',p,d,u*.24,y+.076,v*.24,.225,.018,.225);
    for(const u of [-.60,.60]){
      face('box',wall,p,d,u,y+.22,0,.10,.32,1.25);
      face('box','#e7d3b1',p,d,u,y+.395,0,.13,.045,1.27);
    }
    if(t.patio.position==='front'){
      for(const u of [-.43,.43]){
        face('box',wall,p,d,u,y+.22,.60,.34,.32,.10);
        face('box','#e7d3b1',p,d,u,y+.395,.60,.37,.045,.13);
      }
      for(const u of [-.22,.22])face('box','#46695f',p,d,u,y+.24,.60,.035,.34,.035);
      for(let i=-2;i<=2;i++)face('box','#46695f',p,d,i*.083,y+.23,.60,.018,.28,.022);
      face('box','#46695f',p,d,0,y+.38,.60,.46,.027,.03);
    }else{
      face('box',wall,p,d,0,y+.22,.60,1.25,.32,.10);
      face('box','#e7d3b1',p,d,0,y+.395,.60,1.27,.045,.13);
    }
    for(const u of [-.42,.42]){
      face('cylinder','#b86b4b',p,d,u,y+.16,.36,.20,.19,.20);
      face('rock','#68824d',p,d,u,y+.30,.36,.29,.20,.27);
      face('sphere','#d97486',p,d,u-.04,y+.39,.38,.10,.08,.10);
    }
    face('box','#a58055',p,d,-.40,y+.24,-.18,.23,.055,.48);
    for(const v of [-.35,0])face('box','#88734f',p,d,-.40,y+.15,v,.15,.15,.04);
  }
  for(const b of world.bridges??[]){
    if(b.type==='stone'){
      renderStoneBridge(world,b,(shape,color,x,y,z,sx,sy,sz,yaw,slope=0)=>{
        add(shape,color,x,y,z,sx,sy,sz,yaw);
        if(slope){const shear=new THREE.Matrix4().set(1,0,0,0,slope*sx/sy,1,0,0,0,0,1,0,0,0,0,1);batches.get(`${shape}:${color}`).matrices.at(-1).multiply(shear);}
      },UNIT);continue;
    }
    const cells=bridgeCells(b),n=cells.length-1,dx=(b.b.x-b.a.x)/n,dz=(b.b.z-b.a.z)/n;
    const ya=bridgeHeight(world,b,0),yb=bridgeHeight(world,b,1),length=n*UNIT;
    const yaw=-Math.atan2(dz,dx),slope=Math.atan2(yb-ya,length),slopedLength=Math.hypot(length,yb-ya);
    const part=(color,t,h,side,sx,sy,sz,tilt=0)=>box(color,(b.a.x+dx*n*t)*UNIT-dz*side,ya+(yb-ya)*t+h,(b.a.z+dz*n*t)*UNIT+dx*side,sx,sy,sz,yaw,0,tilt);
    part('#c2b394',.5,-.075,0,slopedLength+.05,.15,.90,slope);
    part('#e7dcc3',.5,-.008,0,slopedLength+.07,.045,.94,slope);
    for(const side of [-.43,.43]){
      part('#cbbd9f',.5,.16,side,slopedLength+.05,.30,.105,slope);
      part('#eee4cc',.5,.325,side,slopedLength+.10,.05,.15,slope);
      for(let i=0;i<=n*2;i++)part('#b7a689',i/(n*2),.13,side,.035,.25,.113);
    }
    // Pillars are spaced out so the sea or the lower ground remains open beneath.
    for(let i=2;i<n;i+=3){
      const c=cells[i],ground=map.get(key(c.x,c.z)),bottom=ground&&ground.kind!=='beach'?terrainBaseY(ground):-.17;
      const top=bridgeHeight(world,b,i/n)-.13,h=top-bottom;
      if(h>0){box('#b7a68a',c.x*UNIT,bottom+h/2,c.z*UNIT,.26,h,.76,yaw);box('#cebea0',c.x*UNIT,top-.025,c.z*UNIT,.38,.09,.84,yaw);}
    }
  }
  for(const m of world.markets??[]){
    const {width,depth}=marketDimensions(m),cx=(m.x+(width-1)/2)*UNIT,cz=(m.z+(depth-1)/2)*UNIT;
    const ground=world.tiles.find(t=>t.x===m.x&&t.z===m.z),y=terrainY(ground),w=(m.size===4?2:1)*UNIT-.12,len=2*UNIT-.12,a=m.direction*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const part=(shape,color,u,h,v,sx,sy,sz,turn=0,tilt=0)=>add(shape,color,cx+c*u+s*v,y+h,cz-s*u+c*v,sx,sy,sz,a+turn,0,tilt);
    part('box','#eadbc0',0,.035,0,w,.07,len);
    for(const u of [-w/2+.07,w/2-.07])for(const v of [-len/2+.07,0,len/2-.07]){
      part('box','#c8af84',u,.60,v,.12,1.15,.12);
      part('box','#eee0c2',u,.10,v,.19,.13,.19);
    }
    for(const v of [-len/2+.025,len/2-.12])part('arcade','#e3cba1',0,.05,v,w,1.27,.095);
    for(const u of [-w/2+.02,w/2-.11])for(const v of [-.61,.61])part('arcade','#e3cba1',u,.05,v,1.17,1.27,.09,Math.PI/2);
    // Four stocked counters, with a clear central aisle and entrances at both ends.
    for(const [side,u] of [[0,-w/2+.26],[1,w/2-.26]])for(const v of [-.57,.57]){
      part('box','#ad7a49',u,.24,v,.28,.37,.53);
      part('box','#d9b077',u,.44,v,.34,.055,.60);
      for(let i=-1;i<=1;i++)for(const offset of [-.07,.07])part('sphere',side?'#e3b965':v<0?'#d45e42':'#89a54b',u+offset,.515,v+i*.16,.074,.075,.09);
      part('box','#f2e5c7',u,.32,v+.273,.14,.075,.015);
    }
    for(const v of [-.8,.8])part('box','#53776a',0,1.15,v,w,.065,.065);
    part('gable','#e3cba1',0,1.18,0,w,1,len);
    const angle=Math.atan2(.42,w/2),slopeWidth=Math.hypot(w/2,.42)+.025;
    for(const side of [-1,1]){
      part('box','#bf7957',side*w/4,1.39,0,slopeWidth,.065,len+.045,0,-side*angle);
      for(let j=-7;j<=7;j++)part('box','#d59770',side*w/4,1.425,j*.16,slopeWidth,.023,.024,0,-side*angle);
    }
    part('box','#d8a477',0,1.625,0,.095,.065,len+.06);
    part('box','#386d60',0,1.035,len/2-.01,Math.min(w-.08,.95),.17,.045);
    const glyphs={M:'101111111101101',E:'111100110100111',R:'110101110101101',C:'111100100100111',A:'010101111101101',T:'111010010010010'};
    [...'MERCAT'].forEach((letter,l)=>{for(let r=0;r<5;r++)for(let col=0;col<3;col++)if(glyphs[letter][r*3+col]==='1')part('box','#fff0c9',(l-2.5)*.105+(col-1)*.025,1.086-r*.025,len/2+.018,.023,.023,.01);});
  }
  for(const church of world.churches??[]){
    const {width,depth}=churchDimensions(church),cx=(church.x+(width-1)/2)*UNIT,cz=(church.z+(depth-1)/2)*UNIT;
    const ground=world.tiles.find(t=>t.x===church.x&&t.z===church.z),y=terrainY(ground),a=church.direction*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const part=(shape,color,u,h,v,sx,sy,sz,turn=0,tilt=0)=>add(shape,color,cx+c*u+s*v,y+h,cz-s*u+c*v,sx,sy,sz,a+turn,0,tilt);
    const stone=isBrava?'#d7c7a6':'#dfc18f',trim='#eee0c2',roofColor='#b97653';
    const nave=-.30,w=1.75,len=3.58,front=len/2;
    part('box','#c6b18b',0,.045,0,2.55,.09,3.85);
    part('box',stone,nave,1.02,0,w,1.94,len);
    part('box',trim,nave,.15,0,w+.07,.16,len+.05);
    part('box',trim,nave,1.96,0,w+.09,.10,len+.06);
    // Tiled nave roof, matching the village's gabled roofs.
    part('gable',stone,nave,2.01,0,w,1,len);
    const slope=Math.atan2(.42,w/2),slopeWidth=Math.hypot(w/2,.42)+.055;
    for(const side of [-1,1]){
      part('box',roofColor,nave+side*w/4,2.22,0,slopeWidth,.07,len+.12,0,-side*slope);
      for(let line=-11;line<=11;line++)part('box','#d49a70',nave+side*w/4,2.258,line*.16,slopeWidth,.022,.025,0,-side*slope);
    }
    part('box','#d69f77',nave,2.45,0,.095,.075,len+.15);
    // Recessed arched portal, shallow steps and a stone rose window.
    part('arch',trim,nave,.12,front+.015,.69,.94,.055);
    part('arch','#70563c',nave,.15,front+.075,.51,.78,.025);
    part('box','#a18454',nave,.49,front+.105,.024,.65,.014);
    for(const u of [-.10,.10])part('sphere','#d1b370',nave+u,.47,front+.12,.045,.045,.018);
    for(let step=0;step<2;step++)part('box',trim,nave,.045+step*.045,front+.06-step*.045,.90-step*.06,.045,.18);
    part('sphere','#547b7a',nave,1.59,front+.028,.46,.46,.035);
    part('ring',trim,nave,1.59,front+.063,.49,.49,.38);
    for(let spoke=0;spoke<6;spoke++)part('box',trim,nave,1.59,front+.084,.022,.40,.017,0,spoke*Math.PI/3);
    part('sphere','#dcbf74',nave,1.59,front+.095,.10,.10,.022);
    // Buttresses and tall side windows remain inside the reserved rectangle.
    for(const side of [-1,1]){
      const u=nave+side*w/2;
      for(const v of [-1.32,-.28,.76]){
        if(side===1&&v>.5)continue;
        part('box',trim,u+side*.035,.64,v,.13,1.17,.17);
        part('box','#bcaa89',u+side*.035,1.27,v,.15,.09,.20);
      }
      for(const v of [-.88,.27]){
        part('arch',trim,u+side*.015,.88,v,.30,.64,.028,side*Math.PI/2);
        part('arch','#617c77',u+side*.048,.91,v,.20,.52,.018,side*Math.PI/2);
      }
    }
    // Square stone tower and a genuinely open belfry, with a bronze bell inside.
    const tu=.84,tv=1.36,tw=.76;
    part('box',stone,tu,1.35,tv,tw,2.60,tw);
    for(const h of [.16,1.34,2.54])part('box',trim,tu,h,tv,tw+.07,.09,tw+.07);
    for(const du of [-.32,.32])for(const dv of [-.32,.32])part('box',trim,tu+du,2.95,tv+dv,.12,.76,.12);
    for(let d=0;d<4;d++){
      const angle=d*Math.PI/2;
      part('arcade',stone,tu+Math.sin(angle)*.28,2.62,tv+Math.cos(angle)*.28,.76,.80,.10,angle);
    }
    part('box','#796347',tu,3.22,tv,.075,.10,.54);
    part('cylinder','#9d743b',tu,3.075,tv,.052,.23,.052);
    part('cone','#bf9349',tu,2.955,tv,.30,.27,.30);
    part('cylinder','#cda75a',tu,2.83,tv,.32,.055,.32);
    part('sphere','#79522d',tu,2.78,tv,.075,.095,.075);
    part('box',trim,tu,3.34,tv,.88,.12,.88);
    part('churchCap',roofColor,tu,3.61,tv,.91,.44,.91);
    part('box','#566359',tu,3.96,tv,.04,.34,.04);
    part('box','#566359',tu,4.015,tv,.21,.04,.04);
  }
  for(const hall of world.townHalls??[]){
    const {width,depth}=townHallDimensions(hall),cx=(hall.x+(width-1)/2)*UNIT,cz=(hall.z+(depth-1)/2)*UNIT;
    const ground=world.tiles.find(t=>t.x===hall.x&&t.z===hall.z),y=terrainY(ground),a=hall.direction*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const part=(shape,color,u,h,v,sx,sy,sz,turn=0,tilt=0)=>add(shape,color,cx+c*u+s*v,y+h,cz-s*u+c*v,sx,sy,sz,a+turn,0,tilt);
    const w=2.42,len=hall.size/2*UNIT-.48,front=len/2,wall=isBrava?'#eee4ce':'#e7c896',stone='#c4ae88',trim='#f5ead3',shutter='#466c61';
    part('box',stone,0,.04,0,2.55,.08,hall.size/2*UNIT-.04);
    part('box',wall,0,.08+FLOOR,0,w,2*FLOOR,len);
    for(const h of [.15,.08+FLOOR,1.82])part('box',trim,0,h,0,w+.06,.075,len+.035);
    for(const u of [-1.13,1.13])part('box',stone,u,.96,front+.015,.11,1.69,.045);
    // One central doorway below, balcony doors above, and symmetrical windows.
    part('arch',stone,0,.10,front+.028,.48,.59,.04);
    part('arch',shutter,0,.13,front+.073,.34,.48,.017);
    part('box',trim,0,.085,front+.09,.57,.065,.15);
    for(const floor of [0,1])for(const u of [-.76,.76]){
      const h=.08+floor*FLOOR+.44;
      part('box',trim,u,h,front+.025,.36,.47,.045);
      part('box','#4d7278',u,h,front+.056,.25,.35,.024);
      part('box','#c2d0c2',u,h,front+.073,.019,.35,.012);
      for(const side of [-1,1])part('box',shutter,u+side*.18,h,front+.062,.085,.37,.033);
      part('box',stone,u,h-.25,front+.07,.43,.055,.12);
    }
    part('box',trim,0,1.31,front+.025,.68,.63,.045);
    for(const u of [-.145,.145])part('box','#42686e',u,1.32,front+.06,.245,.53,.025);
    part('box',stone,0,1.32,front+.08,.035,.56,.022);
    // Upper-floor balcony stays within the selected footprint, including the pole.
    part('box',trim,0,1.00,front+.10,1.20,.075,.22);
    for(const u of [-.45,.45])part('box',stone,u,.94,front+.07,.12,.16,.13);
    part('box','#495e58',0,1.34,front+.195,1.16,.035,.025);
    for(let i=-5;i<=5;i++)part('box','#495e58',i*.106,1.18,front+.195,.018,.31,.018);
    for(const u of [-.565,.565])part('box','#495e58',u,1.34,front+.10,.025,.035,.20);
    // A small AJUNTAMENT plaque above the entrance, made of solid letter strokes.
    part('box','#536b61',0,.78,front+.045,1.06,.14,.032);
    const glyphs={A:'010101111101101',J:'001001001101111',U:'101101101101111',N:'101111111111101',T:'111010010010010',M:'101111111101101',E:'111100110100111'};
    [...'AJUNTAMENT'].forEach((letter,l)=>{for(let r=0;r<5;r++)for(let col=0;col<3;col++)if(glyphs[letter][r*3+col]==='1')part('box','#f7e8c3',(l-4.5)*.091+(col-1)*.020,.82-r*.02,front+.066,.018,.018,.01);});
    // Side and rear windows; both sizes have exactly the same two storeys.
    for(const floor of [0,1]){
      const h=.08+floor*FLOOR+.45;
      for(const u of [-.7,0,.7]){
        part('box',trim,u,h,-front-.015,.34,.43,.04);part('box',shutter,u,h,-front-.042,.24,.33,.022);
      }
      for(const side of [-1,1])for(const v of (hall.size===4?[-.55,.55]:[0])){
        part('box',trim,side*(w/2+.015),h,v,.04,.43,.34);part('box',shutter,side*(w/2+.042),h,v,.022,.33,.24);
      }
    }
    part('gable',wall,0,1.86,0,w,.8,len);
    const slope=Math.atan2(.336,w/2),slopeWidth=Math.hypot(w/2,.336)+.045;
    for(const side of [-1,1]){
      part('box','#bf7957',side*w/4,2.028,0,slopeWidth,.06,len+.12,0,-side*slope);
      const lines=hall.size===4?6:2;for(let j=-lines;j<=lines;j++)part('box','#d69b73',side*w/4,2.062,j*.15,slopeWidth,.024,.022,0,-side*slope);
    }
    part('box','#d69f79',0,2.22,0,.09,.07,len+.14);
    part('cylinder','#777d71',-.32,1.73,front+.13,.028,1.48,.028);
    part('sphere','#d2b675',-.32,2.49,front+.13,.057,.057,.057);
    const flag=createSenyera();flag.position.set(cx+c*(-.32)+s*(front+.13),y+2.08,cz-s*(-.32)+c*(front+.13));flag.rotation.y=a;flags.push(flag);
  }
  renderLandmarks(world,add,UNIT);
  renderBeachBars(world,add,UNIT);
  renderCustomBuildings(world,add,UNIT,FLOOR,entranceSteps);
  const group=new THREE.Group();group.name='village';group.userData.flags=flags;for(const flag of flags)group.add(flag);
  for(const {shape,color,matrices} of batches.values()){
    const mesh=new THREE.InstancedMesh(geometries[shape],material(color),matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
  }
  const beach=createBeachMesh(world);if(beach)group.add(beach);
  return group;
}

export class VillageScene{
  constructor(canvas,{onClick,onHover,onError,onCameraChange=()=>{}}){
    this.canvas=canvas;this.onClick=onClick;this.onHover=onHover;this.onError=onError;this.onCameraChange=onCameraChange;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#79c3cb');
    this.scene.fog=new THREE.Fog('#79c3cb',65,135);
    this.camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,180);
    this.target=new THREE.Vector3(0,.7,0);this.theta=.72;this.phi=.92;this.scale=17.3;
    this.hemisphere=new THREE.HemisphereLight('#d6f2f3','#aaa081',2.7);this.scene.add(this.hemisphere);
    this.sun=new THREE.DirectionalLight('#fff2d2',3.2);this.sun.position.set(-13,23,13);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:75});this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.045;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const seaMaterial=new THREE.MeshPhongMaterial({color:'#51aebc',shininess:55,specular:'#75b9bd'});
    this.time={value:0};
    seaMaterial.onBeforeCompile=shader=>{
      shader.uniforms.uTime=this.time;
      shader.vertexShader='varying vec3 vSea;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSea=position;');
      shader.fragmentShader='uniform float uTime; varying vec3 vSea;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float wave=sin(vSea.x*2.2 + sin(vSea.y*.7+uTime*.28)*1.4 + uTime*.32)*sin(vSea.y*3.8-uTime*.25);
        float gleam=smoothstep(.86,1.0,wave);
        float depth=smoothstep(2.0,21.0,length(vSea.xy));
        diffuseColor.rgb=mix(diffuseColor.rgb*1.19,diffuseColor.rgb*.88,depth);
        diffuseColor.rgb+=gleam*.065;
      `);
    };
    this.sea=new THREE.Mesh(new THREE.PlaneGeometry(300,300),seaMaterial);this.sea.rotation.x=-Math.PI/2;this.sea.position.y=-.045;this.sea.receiveShadow=true;this.scene.add(this.sea);
    this.grid=new THREE.GridHelper((LIMIT*2+1)*UNIT,LIMIT*2+1,'#c9f6f0','#c9f6f0');this.grid.position.y=.006;this.grid.material.transparent=true;this.grid.material.opacity=.15;this.grid.material.depthWrite=false;this.grid.visible=false;this.scene.add(this.grid);
    this.cursor=new THREE.Group();
    const selection=new THREE.Mesh(new THREE.BoxGeometry(UNIT*.98,.025,UNIT*.98),new THREE.MeshBasicMaterial({color:'#faffdf',transparent:true,opacity:.33,depthWrite:false}));
    this.cursor.add(selection);
    const frame=new THREE.LineSegments(new THREE.EdgesGeometry(selection.geometry),new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.9,depthTest:false}));frame.renderOrder=10;this.cursor.add(frame);this.cursor.visible=false;this.scene.add(this.cursor);
    this.bridgePreview=new THREE.Group();this.bridgePreview.visible=false;
    this.bridgeGhost=new THREE.Mesh(new THREE.BoxGeometry(1,.08,.9),new THREE.MeshBasicMaterial({color:'#76e3b0',transparent:true,opacity:.6,depthWrite:false}));
    this.bridgeAnchor=new THREE.Mesh(new THREE.BoxGeometry(1.1,.07,1.1),new THREE.MeshBasicMaterial({color:'#fff2a2',transparent:true,opacity:.8,depthTest:false}));
    this.bridgeAnchor.renderOrder=11;this.bridgePreview.add(this.bridgeGhost,this.bridgeAnchor);this.scene.add(this.bridgePreview);
    this.pickingMaterial=new THREE.MeshBasicMaterial({visible:false});this.raycaster=new THREE.Raycaster();this.mouse=new THREE.Vector2();this.waterPlane=new THREE.Plane(UP,0);
    this.boats=new THREE.Group();this.scene.add(this.boats);this.makeBoats();
    this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.abort=new AbortController();this.installPointerControls();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.onError('El navegador ha perdut el context gràfic. La vila es conserva en aquest navegador. Recarrega la pàgina per continuar.');},{signal:this.abort.signal});
    this.resize();this.frame(0);
  }
  makeBoats(){
    for(let i=0;i<3;i++){
      const boat=new THREE.Group();
      const hull=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material(i===1?'#cb8064':'#f4ebd9'));hull.scale.set(.20,.11,.53);boat.add(hull);
      const inside=new THREE.Mesh(new THREE.BoxGeometry(.24,.035,.64),material('#b59972'));inside.position.y=.1;boat.add(inside);
      const seat=new THREE.Mesh(new THREE.BoxGeometry(.32,.04,.08),material('#f3e9d7'));seat.position.y=.14;boat.add(seat);
      boat.position.set(4+i*1.8,.035,4.0+(i%2)*1.2);boat.rotation.y=.25+i*.9;boat.userData.originY=.035;boat.children.forEach(m=>m.castShadow=true);this.boats.add(boat);
    }
  }
  update(world){
    this.world=world;
    const limit=worldLimit(world);
    if(this.gridLimit!==limit){
      const visible=this.grid.visible;this.scene.remove(this.grid);this.grid.geometry.dispose();this.grid.material.dispose();
      this.grid=new THREE.GridHelper((limit*2+1)*UNIT,limit*2+1,'#c9f6f0','#c9f6f0');this.grid.position.y=.006;this.grid.material.transparent=true;this.grid.material.opacity=.15;this.grid.material.depthWrite=false;this.grid.visible=visible;this.scene.add(this.grid);this.gridLimit=limit;
      const reach=(limit+1)*UNIT+4;Object.assign(this.sun.shadow.camera,{left:-reach,right:reach,top:reach,bottom:-reach,far:reach*5});this.sun.shadow.camera.updateProjectionMatrix();
      this.scale=Math.min(this.scale,Math.max(46,(limit*2+1)*UNIT*1.5));
      const panLimit=limit*UNIT+3;this.target.x=THREE.MathUtils.clamp(this.target.x,-panLimit,panLimit);this.target.z=THREE.MathUtils.clamp(this.target.z,-panLimit,panLimit);this.updateCamera();
    }
    this.tileMap=new Map(world.tiles.map(t=>[key(t.x,t.z),t]));
    if(this.village){this.scene.remove(this.village);this.village.children.forEach(m=>{m.dispose?.();if(m.userData.ownsGeometry)m.geometry.dispose();if(m.userData.ownsMaterial)m.material.dispose();});}
    this.village=createVillageGeometry(world);this.scene.add(this.village);
    this.beachMesh=this.village.getObjectByName('beach');
    const translucent=!!this.beachMesh;
    if(this.sea.material.transparent!==translucent)this.sea.material.needsUpdate=true;
    this.sea.material.transparent=translucent;this.sea.material.opacity=translucent?.77:1;this.sea.material.depthWrite=!translucent;
    if(this.pickMesh){this.scene.remove(this.pickMesh);this.pickMesh.geometry.dispose();this.pickMesh.dispose();}
    this.pickMesh=createPickingGeometry(world,this.pickingMaterial);this.scene.add(this.pickMesh);
    this.boats.visible=world.tiles.length>0;
    for(const boat of this.boats.children){const b=boat.position;boat.visible=!this.tileMap.has(key(Math.round(b.x/UNIT),Math.round(b.z/UNIT)))&&!bridgeAt(world,Math.round(b.x/UNIT),Math.round(b.z/UNIT));}
    if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setBridgePreview(start,end,type='classic'){
    this.bridgePreview.visible=!!start;if(!start)return;
    const a=this.tileMap.get(key(start.x,start.z));if(!a){this.bridgePreview.visible=false;return;}
    const b=end&&this.tileMap.get(key(end.x,end.z));
    this.bridgeAnchor.position.set(start.x*UNIT,terrainY(a)+.10,start.z*UNIT);
    this.bridgeGhost.visible=!!end&&(end.x!==start.x||end.z!==start.z);if(!this.bridgeGhost.visible)return;
    const candidate={a:start,b:end},p=new THREE.Vector3(start.x*UNIT,b?bridgeHeight(this.world,candidate,0):terrainY(a)+.055,start.z*UNIT),q=new THREE.Vector3(end.x*UNIT,b?bridgeHeight(this.world,candidate,1):terrainY(a)+.055,end.z*UNIT),delta=q.clone().sub(p);
    this.bridgeGhost.position.copy(p.add(q).multiplyScalar(.5));this.bridgeGhost.scale.x=delta.length();
    this.bridgeGhost.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),delta.normalize());
    this.bridgeGhost.material.color.set(checkBridge(this.world,start,end,type).valid?'#76e3b0':'#f28e75');
  }
  setLandmarkOptions(options){
    this.landmarkOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setBeachBarOptions(options){
    this.beachBarOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setMarketOptions(options){
    this.marketOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setCustomOptions(options){
    this.customOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setTownHallOptions(options){
    this.townHallOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setChurchOptions(options){
    this.churchOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setPatioOptions(options){
    this.patioOptions=options;if(this.hovered)this.setCursor(this.hovered.x,this.hovered.z,this.eraseCursor,this.hovered.level);
  }
  setLight(value){
    const t=value/100;this.sun.color.set(t>.58?'#ffd2a0':'#fff1d4');
    this.sun.position.set(-16+t*28,25-t*14,14);this.sun.intensity=3.15-t*.65;
    this.hemisphere.intensity=2.6-t*.75;this.renderer.toneMappingExposure=1.2;
  }
  resize(){
    const {width,height}=this.canvas.getBoundingClientRect();if(!width||!height)return;
    this.width=width;this.height=height;this.renderer.setSize(width,height,false);this.updateCamera();
  }
  updateCamera(){
    const aspect=(this.width||1)/(this.height||1);const view=this.scale*(aspect<1?1.12:1);
    this.camera.left=-view*aspect/2;this.camera.right=view*aspect/2;this.camera.top=view/2;this.camera.bottom=-view/2;
    // On phones show the full island, with room for the lower tool dock.
    if(aspect<.85){const s=.85/aspect;this.camera.left*=s;this.camera.right*=s;this.camera.top*=s;this.camera.bottom*=s;}
    const distance=38+Math.max(0,worldLimit(this.world)-16)*UNIT*3;
    this.camera.far=Math.max(180,distance*3);
    if(this.scene?.fog){this.scene.fog.near=distance+27;this.scene.fog.far=distance+97;}
    this.camera.position.set(this.target.x+Math.sin(this.theta)*Math.sin(this.phi)*distance,this.target.y+Math.cos(this.phi)*distance,this.target.z+Math.cos(this.theta)*Math.sin(this.phi)*distance);
    this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    this.onCameraChange({theta:this.theta,phi:this.phi});
  }
  zoom(factor){this.scale=THREE.MathUtils.clamp(this.scale*factor,5,Math.max(46,(worldLimit(this.world)*2+1)*UNIT*1.5));this.updateCamera();}
  rotate(){this.theta+=Math.PI/4;this.updateCamera();}
  home({wholeGrid=false}={}){this.theta=wholeGrid?0:.72;this.phi=.92;this.scale=wholeGrid?this.world.gridSize*UNIT*1.15:17.3;this.target.set(0,.7,0);this.updateCamera();}
  pick(clientX,clientY){
    const rect=this.canvas.getBoundingClientRect();this.mouse.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const hits=[];
    if(this.pickMesh){
      this.pickMesh.updateMatrixWorld();hits.push(...this.raycaster.intersectObject(this.pickMesh,false));
    }
    if(this.beachMesh){this.beachMesh.updateMatrixWorld();hits.push(...this.raycaster.intersectObject(this.beachMesh,false).filter(hit=>hit.point.y>=-.045));}
    hits.sort((a,b)=>a.distance-b.distance);
    if(hits.length){
      const hit=hits[0];
      if(hit.object===this.beachMesh)return {x:Math.max(-worldLimit(this.world),Math.min(worldLimit(this.world),Math.round(hit.point.x/UNIT))),z:Math.max(-worldLimit(this.world),Math.min(worldLimit(this.world),Math.round(hit.point.z/UNIT))),level:null};
      const target=this.pickMesh.userData.targets[hit.instanceId];if(target)return {...target};
    }
    const point=this.raycaster.ray.intersectPlane(this.waterPlane,new THREE.Vector3());
    if(!point)return null;const x=Math.round(point.x/UNIT),z=Math.round(point.z/UNIT);
    return Math.abs(x)<=worldLimit(this.world)&&Math.abs(z)<=worldLimit(this.world)?{x,z}:null;
  }
  setCursor(x,z,erase=false,level=null){
    const limit=worldLimit(this.world);x=THREE.MathUtils.clamp(x,-limit,limit);z=THREE.MathUtils.clamp(z,-limit,limit);
    this.eraseCursor=erase;
    const t=this.tileMap?.get(key(x,z));
    this.cursor.matrixAutoUpdate=true;this.cursor.scale.set(1,1,1);
    const landmark=(this.landmarkOptions&&!erase)?{x,z,...this.landmarkOptions}:landmarkAt(this.world,x,z);
    if(landmark){
      const {width,depth}=landmarkDimensions(landmark),ground=this.tileMap.get(key(landmark.x,landmark.z));
      const valid=!this.landmarkOptions||erase||checkLandmark(this.world,landmark).valid;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);this.cursor.position.set((landmark.x+(width-1)/2)*UNIT,(ground?terrainY(ground):0)+.11,(landmark.z+(depth-1)/2)*UNIT);
      this.cursor.children[0].material.opacity=.30;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    if(this.beachBarOptions&&!erase||t?.beachBar){
      const valid=!this.beachBarOptions||checkBeachBar(this.world,x,z,this.beachBarOptions).valid;
      this.hovered={x,z,level:null};this.cursor.position.set(x*UNIT,t?.beachBar?BEACH_BAR_TOP+.03:.36,z*UNIT);
      this.cursor.children[0].material.opacity=.30;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }

    const custom=this.customOptions&&!erase?{x,z,...this.customOptions}:customAt(this.world,x,z);
    if(custom){
      const {width,depth}=customDimensions(custom),base=this.tileMap.get(key(custom.x,custom.z)),valid=!this.customOptions||erase||checkCustomBuilding(this.world,custom).valid;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);this.cursor.position.set((custom.x+(width-1)/2)*UNIT,(base?terrainY(base):0)+.12,(custom.z+(depth-1)/2)*UNIT);
      this.cursor.children[0].material.opacity=.30;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    const townHall=this.townHallOptions&&!erase?{x,z,...this.townHallOptions}:townHallAt(this.world,x,z);
    if(townHall){
      const {width,depth}=townHallDimensions(townHall),base=this.tileMap.get(key(townHall.x,townHall.z));
      const valid=!this.townHallOptions||erase||checkTownHall(this.world,townHall).valid;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);
      this.cursor.position.set((townHall.x+(width-1)/2)*UNIT,(base?terrainY(base):0)+.12,(townHall.z+(depth-1)/2)*UNIT);
      this.cursor.children[0].material.opacity=.30;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    const church=this.churchOptions&&!erase?{x,z,...this.churchOptions}:churchAt(this.world,x,z);
    if(church){
      const {width,depth}=churchDimensions(church),base=this.tileMap.get(key(church.x,church.z));
      const valid=!this.churchOptions||erase||checkChurch(this.world,church).valid;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);
      this.cursor.position.set((church.x+(width-1)/2)*UNIT,(base?terrainY(base):0)+.12,(church.z+(depth-1)/2)*UNIT);
      this.cursor.children[0].material.opacity=.30;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    const patioOwner=patioAt(this.world,x,z);
    if((this.patioOptions&&!erase)||patioOwner){
      const placing=!!this.patioOptions&&!erase&&!patioOwner;
      const house=patioOwner??{x,z,patio:{position:this.patioOptions.patioPosition,direction:this.patioOptions.patioDirection}};
      const p=patioCell(house),width=1+Math.abs(p.x-house.x),depth=1+Math.abs(p.z-house.z),base=this.tileMap.get(key(house.x,house.z))??this.tileMap.get(key(p.x,p.z));
      const valid=placing?checkPatioHouse(this.world,x,z,this.patioOptions).valid:!this.patioOptions||erase;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);
      this.cursor.position.set((house.x+p.x)*UNIT/2,(base?terrainY(base):.25)+.10,(house.z+p.z)*UNIT/2);
      this.cursor.children[0].material.opacity=.3;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    const market=this.marketOptions?{x,z,...this.marketOptions}:marketAt(this.world,x,z);
    if(market){
      const {width,depth}=marketDimensions(market),base=this.tileMap.get(key(market.x,market.z));
      const valid=!this.marketOptions||checkMarket(this.world,market).valid;
      this.hovered={x,z,level:null};this.cursor.scale.set(width,1,depth);
      this.cursor.position.set((market.x+(width-1)/2)*UNIT,(base?terrainY(base):0)+(this.marketOptions?.size ? .09 : 1.73),(market.z+(depth-1)/2)*UNIT);
      this.cursor.children[0].material.opacity=.3;this.cursor.children[0].material.color.set(erase||!valid?'#ff8d73':'#9de6bd');this.cursor.visible=true;return;
    }
    const selected=t?.kind==='house'?(Number.isInteger(level)?Math.max(0,Math.min(t.floors-1,level)):t.floors-1):null;
    this.hovered={x,z,level:selected};
    const bridge=bridgeAt(this.world,x,z);
    const bridgeT=bridge?(Math.abs(x-bridge.a.x)+Math.abs(z-bridge.a.z))/(Math.abs(bridge.b.x-bridge.a.x)+Math.abs(bridge.b.z-bridge.a.z)):0;
    const y=bridge?bridgeHeight(this.world,bridge,bridgeT)+.04:t?.kind==='beach'&&this.beachMesh?this.beachMesh.userData.field.heightAt(x*UNIT,z*UNIT):(t?terrainY(t)+(t.kind==='house'?t.floors*FLOOR+(t.roof==='tile'?.4:.3):t.kind==='stairs'?.46:.06):.015);
    this.cursor.scale.y=selected===null?1:FLOOR/.025;
    this.cursor.position.set(x*UNIT,selected===null?y+.025:terrainY(t)+(selected+.5)*FLOOR,z*UNIT);this.cursor.visible=true;
    if(hasSlope(t)&&isFirmGround(t.kind)&&!bridge&&!businessSpaces(this.world).has(key(x,z))){this.cursor.updateMatrix();this.cursor.matrix.premultiply(slopeShearMatrix(t,UNIT));this.cursor.matrixAutoUpdate=false;}
    this.cursor.children[0].material.opacity=selected===null?.33:.13;
    this.cursor.children[0].material.color.set(erase?'#ff8d73':'#faffdf');
  }
  installPointerControls(){
    const signal=this.abort.signal,canvas=this.canvas;this.pointers=new Map();let gesture=null;
    const pinchInfo=()=>{const p=[...this.pointers.values()];if(p.length<2)return null;return {distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};};
    const pan=(dx,dy)=>{const f=this.scale/Math.max(this.height,1);this.target.x-=dx*Math.cos(this.theta)*f;this.target.z+=dx*Math.sin(this.theta)*f;this.target.x-=dy*Math.sin(this.theta)*f;this.target.z-=dy*Math.cos(this.theta)*f;this.target.x=THREE.MathUtils.clamp(this.target.x,-worldLimit(this.world)*UNIT-3,worldLimit(this.world)*UNIT+3);this.target.z=THREE.MathUtils.clamp(this.target.z,-worldLimit(this.world)*UNIT-3,worldLimit(this.world)*UNIT+3);};
    canvas.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
    canvas.addEventListener('pointerdown',e=>{
      if(![0,1,2].includes(e.button))return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size===1)gesture={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,button:e.button,multi:false};
      else {gesture.multi=true;gesture.moved=true;gesture.pinch=pinchInfo();}
    },{signal});
    canvas.addEventListener('pointermove',e=>{
      const point=this.pick(e.clientX,e.clientY);if(point){this.onHover(point);this.setCursor(point.x,point.z,this.eraseCursor,point.level);}else this.cursor.visible=false;
      if(!this.pointers.has(e.pointerId)||!gesture)return;
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size>1){
        const p=pinchInfo(),old=gesture.pinch;if(p&&old){if(p.distance>0)this.zoom(old.distance/p.distance);pan(p.x-old.x,p.y-old.y);this.updateCamera();}gesture.pinch=p;return;
      }
      if(gesture.multi)return;
      if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>6)gesture.moved=true;
      if(gesture.moved){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
        if(e.shiftKey||gesture.button===1||gesture.button===2)pan(dx,dy);
        else{this.theta-=dx*.006;this.phi=THREE.MathUtils.clamp(this.phi-dy*.004,.32,1.35);}
        this.updateCamera();this.cursor.visible=false;
      }
      gesture.x=e.clientX;gesture.y=e.clientY;
    },{signal});
    const finish=(e,cancelled=false)=>{
      if(!this.pointers.has(e.pointerId))return;
      if(!cancelled&&gesture&&!gesture.moved&&!gesture.multi&&gesture.button!==1){const p=this.pick(e.clientX,e.clientY);if(p)this.onClick(p,gesture.button===2);}
      this.pointers.delete(e.pointerId);if(!this.pointers.size)gesture=null;
    };
    canvas.addEventListener('pointerup',e=>finish(e),{signal});canvas.addEventListener('pointercancel',e=>finish(e,true),{signal});canvas.addEventListener('lostpointercapture',e=>finish(e,true),{signal});
    canvas.addEventListener('pointerleave',()=>{if(!this.pointers.size)this.cursor.visible=false;},{signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY,-150,150)*.0015));},{passive:false,signal});
  }
  frame(time){
    this.animation=requestAnimationFrame(t=>this.frame(t));
    if(document.hidden)return;
    if(!this.reducedMotion){this.time.value=time/1000;for(const flag of this.village?.userData.flags??[])waveSenyera(flag,this.time.value);this.boats.children.forEach((b,i)=>{b.position.y=.05+Math.sin(time*.0013+i)*.025;b.rotation.z=Math.sin(time*.001+i)*.035;});}
    this.renderer.render(this.scene,this.camera);
  }
  async photograph(){
    const previewVisible=this.bridgePreview.visible;this.bridgePreview.visible=false;
    const visible=this.cursor.visible;this.cursor.visible=false;const grid=this.grid.visible;this.grid.visible=false;
    this.renderer.render(this.scene,this.camera);
    const blob=await new Promise(resolve=>this.canvas.toBlob(resolve,'image/png'));
    this.cursor.visible=visible;this.bridgePreview.visible=previewVisible;this.grid.visible=grid;if(!blob)throw new Error('No s’ha pogut crear la fotografia.');return blob;
  }
  dispose(){this.bridgePreview.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});cancelAnimationFrame(this.animation);this.abort.abort();this.resizeObserver.disconnect();this.renderer.dispose();}
}
