import {COOP} from './poultry-geometry.js';
import {randomAt,terrainSurfaceY,key,DIRECTIONS,businessSpaces,landmarkCells,marketCells,churchCells,townHallCells,bridgeCells,patioCell} from './model.js';
import {customCells} from './designs.js';

/** Seeded corner positions keep shrubs varied and leave open grazing paths. */
export function pastureShrubs(t){
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]],start=Math.floor(randomAt(t.x,t.z,910)*4);
  return Array.from({length:2+Math.floor(randomAt(t.x,t.z,911)*2)},(_,i)=>{
    const [a,b]=corners[(start+i)%4];
    return {u:a*(.34+randomAt(t.x,t.z,912+i)*.045),v:b*(.34+randomAt(t.x,t.z,922+i)*.045),size:.14+randomAt(t.x,t.z,932+i)*.04};
  });
}
/** Small straw bale in an outer corner, clear of the initial grazing positions. */
export function pastureBales(t){
  return [{u:(randomAt(t.x,t.z,1220)>.5?1:-1)*(.37+randomAt(t.x,t.z,1221)*.02),v:.37+randomAt(t.x,t.z,1222)*.02}];
}
export function pastureGraph(world,kind='goatPasture'){
  const blocked=new Set(businessSpaces(world).keys());
  for(const [items,cells] of [[world.landmarks,landmarkCells],[world.markets,marketCells],[world.churches,churchCells],[world.townHalls,townHallCells],[world.customBuildings,customCells],[world.bridges,bridgeCells]])for(const b of items??[])for(const p of cells(b))blocked.add(key(p.x,p.z));
  for(const t of world.tiles)if(t.patio){const p=patioCell(t);blocked.add(key(p.x,p.z));}
  const graph=new Map(world.tiles.filter(t=>t.kind===kind&&!blocked.has(key(t.x,t.z))).sort((a,b)=>a.x-b.x||a.z-b.z).map(t=>[key(t.x,t.z),{tile:t,neighbours:[],shrubs:kind==='poultryYard'?[COOP]:kind==='goatPasture'?pastureShrubs(t):kind==='cowPasture'?pastureBales(t).map(b=>({...b,clearance:.35})):[]}]));
  for(const node of graph.values()){
    node.obstacles=[];
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      if(!['cowPasture','poultryYard'].includes(kind)&&(dx||dz))continue;
      const near=graph.get(key(node.tile.x+dx,node.tile.z+dz));
      for(const obstacle of near?.shrubs??[])node.obstacles.push({x:near.tile.x+obstacle.u,z:near.tile.z+obstacle.v,clearance:obstacle.clearance??.21});
    }
  }
  for(const node of graph.values())for(const [dx,dz] of DIRECTIONS){
    const other=graph.get(key(node.tile.x+dx,node.tile.z+dz));if(!other)continue;
    // Require the entire narrow crossing corridor to meet; cliffs are not passages.
    if([-.20,0,.20].every(s=>Math.abs(terrainSurfaceY(node.tile,dx*.5+dz*s,dz*.5+dx*s)-terrainSurfaceY(other.tile,-dx*.5+dz*s,-dz*.5+dx*s))<.001))node.neighbours.push(other);
  }
  return graph;
}
export function createGrazingHerd(world,kind='goatPasture'){
  const graph=pastureGraph(world,kind),seen=new Set(),goats=[];
  for(const node of graph.values()){
    if(seen.has(node))continue;
    const patch=[],queue=[node];seen.add(node);
    for(let i=0;i<queue.length;i++){const n=queue[i];patch.push(n);for(const next of n.neighbours)if(!seen.has(next)){seen.add(next);queue.push(next);}}
    const {x,z}=node.tile,poultry=kind==='poultryYard',hens=4+Math.floor(randomAt(x,z,951)*2),geese=1+Math.floor(randomAt(x,z,952)*2),count=poultry?hens+geese:2+Math.floor(randomAt(x,z,950)*2),flock=[];
    for(let i=0;i<count;i++){
      let seed=Math.floor(randomAt(x,z,960+i)*4294967296)>>>0;
      const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const start=patch[i%patch.length],offset=(poultry?[[-.26,.20],[0,.25],[.26,.25],[.27,.01],[.27,-.25],[.03,-.25],[.02,0]]:[[-.21,-.12],[.21,-.12],[0,.21]])[i];
      const goat={species:poultry?(i<hens?'hen':'goose'):kind,flock,node:start,rand,x:start.tile.x+offset[0],z:start.tile.z+offset[1],y:0,angle:rand()*Math.PI*2,phase:rand()*Math.PI*2,coat:i%3,rest:.5+rand()*2,moving:false,target:null};goats.push(goat);flock.push(goat);
    }
  }
  function ground(g){
    const t=graph.get(key(Math.round(g.x),Math.round(g.z)))?.tile??g.node.tile;
    g.y=terrainSurfaceY(t,g.x-t.x,g.z-t.z);
  }
  for(const g of goats)ground(g);
  return {animals:goats,goats,graph,update(dt){
    // A resumed tab must not fast-forward a herd through an unbounded time gap.
    dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
    for(const g of goats){
      if(g.rest>0){g.rest-=dt;g.moving=false;continue;}
      if(!g.target){
        const choices=[g.node,...g.node.neighbours],next=choices[Math.floor(g.rand()*choices.length)];
        g.target={node:next,x:next.tile.x+(g.rand()-.5)*.46,z:next.tile.z+(g.rand()-.5)*.46};
      }
      const dx=g.target.x-g.x,dz=g.target.z-g.z,distance=Math.hypot(dx,dz),step=(kind==='cowPasture'?.12:.15)*dt;
      const travel=distance?Math.min(1,step/distance):0,nx=g.x+dx*travel,nz=g.z+dz*travel,node=graph.get(key(Math.round(nx),Math.round(nz)));
      const shrubBlocked=node&&node.obstacles.some(s=>Math.hypot(nx-s.x,nz-s.z)<s.clearance);
      const animalBlocked=g.flock.some(other=>other!==g&&Math.hypot(nx-other.x,nz-other.z)<(kind==='poultryYard'?(g.species==='goose'||other.species==='goose'?.18:.14):kind==='cowPasture'?.34:.24));
      if(!node||shrubBlocked||animalBlocked){g.node=graph.get(key(Math.round(g.x),Math.round(g.z)));g.target=null;g.rest=.3+g.rand();g.moving=false;continue;}
      g.moving=distance>step;
      if(g.moving){g.x=nx;g.z=nz;g.angle=Math.atan2(dx,dz);g.phase+=dt*8;}
      else {g.x=g.target.x;g.z=g.target.z;g.node=g.target.node;g.target=null;g.rest=1+g.rand()*3;}
      ground(g);
    }
  }};
}
