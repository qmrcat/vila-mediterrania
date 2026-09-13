import {DIRECTIONS,terrainSurfaceY,terrainY,landmarkAt,marketAt,churchAt,townHallAt,patioAt,businessSpaces} from './model.js';
import {customAt} from './designs.js';
import {createBeachField} from './beach.js';
export function renderTerrainRailings(world,add,branch,unit){
  const tiles=world.tiles.filter(t=>t.terrainRailing);if(!tiles.length)return;
  const beach=tiles.some(t=>t.kind==='beach')?createBeachField(world):null,seen=new Set(),posts=new Set(),spaces=businessSpaces(world);
  for(const t of tiles){
    const {material,sides}=t.terrainRailing,stone=material==='stone',wood=material==='wood',color=stone?'#c1b599':wood?'#92704a':'#4c615a',thickness=stone?.095:wood?.045:.022;
    const raised=t.kind==='house'||t.kind==='plaza'||t.kind==='stairs'||landmarkAt(world,t.x,t.z)||marketAt(world,t.x,t.z)||churchAt(world,t.x,t.z)||townHallAt(world,t.x,t.z)||customAt(world,t.x,t.z)||patioAt(world,t.x,t.z)||spaces.has(`${t.x},${t.z}`);
    for(const d of sides){
      const [dx,dz]=DIRECTIONS[d],point=u=>{
        const a=dx*.5+dz*u,b=dz*.5-dx*u,x=(t.x+a)*unit,z=(t.z+b)*unit;
        return [x,(beach&&t.kind==='beach'?beach.heightAt(x,z):raised?terrainY(t):terrainSurfaceY(t,a,b))+.018,z];
      };
      const a=point(-.5),b=point(.5),id=JSON.stringify([a,b].sort((p,q)=>p[0]-q[0]||p[2]-q[2]));
      if(seen.has(id))continue;seen.add(id);
      const n=stone?4:wood?2:4;
      for(let i=0;i<=n;i++){
        const p=point(i/n-.5),pid=JSON.stringify(p);if(posts.has(pid))continue;posts.add(pid);
        const w=stone?.11:wood?.065:.031;
        add('box',color,p[0],p[1]+.17,p[2],w,.34,w);
        if(stone)add('box','#ddd0b4',p[0],p[1]+.35,p[2],.14,.04,.14);
      }
      for(const h of (stone?[.07,.32]:wood?[.12,.30]:[.09,.32])){
        // Subdivision also follows the curved surface at beach edges.
        for(let i=0;i<8;i++){
          const p=point(i/8-.5),q=point((i+1)/8-.5);p[1]+=h;q[1]+=h;branch(color,p,q,thickness);
        }
      }
    }
  }
}
