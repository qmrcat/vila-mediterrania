import {DIRECTIONS,key,terrainY,terrainSurfaceY,businessSpaces,patioCell,patioAt,bridgeAt,bridgeHeight,isFirmGround,marketAt,churchAt,townHallAt,randomAt,hasSlope,landmarkAt} from './model.js';
import {customAt} from './designs.js';

/** Resolve support at the actual doorway, including side doors on sloping streets. */
export function createEntranceSupport(world){
  const tiles=new Map(world.tiles.map(t=>[key(t.x,t.z),t]));
  const platforms=new Set(businessSpaces(world).keys());
  for(const t of world.tiles)if(t.patio){const p=patioCell(t);platforms.add(key(p.x,p.z));}
  return (house,d,u=0,width=.30)=>{
    const base=terrainY(house);
    // Keep the existing entrances along the lowest coastal level.
    if(base<=.26)return true;
    const [dx,dz]=DIRECTIONS[d],x=house.x+dx,z=house.z+dz,next=tiles.get(key(x,z));
    const bridge=bridgeAt(world,x,z);
    return [u-width/2,u,u+width/2].every(offset=>{
      const px=house.x+dx*.5+dz*offset/1.3,pz=house.z+dz*.5-dx*offset/1.3;
      let height=-Infinity;
      if(next&&next.kind!=='beach'){
        height=platforms.has(key(x,z))?terrainY(next):terrainSurfaceY(next,px-x,pz-z);
        if(next.kind==='stairs'){
          const [sx,sz]=DIRECTIONS[next.rotation],depth=((px-x)*sx+(pz-z)*sz)*1.3;
          const step=Math.max(0,Math.min(5,Math.floor((depth+.585+.1)/.195)));
          height=terrainY(next)+.085+step*.07;
        }
      }
      if(bridge){
        const bx=bridge.b.x-bridge.a.x,bz=bridge.b.z-bridge.a.z,length=Math.abs(bx)+Math.abs(bz);
        const along=((px-bridge.a.x)*bx+(pz-bridge.a.z)*bz)/(length*length);
        const across=Math.abs((px-bridge.a.x)*bz-(pz-bridge.a.z)*bx)/length*1.3;
        if(along>=0&&along<=1&&across<=.47)height=Math.max(height,bridgeHeight(world,bridge,along));
      }
      return Math.abs(height-base)<=.10;
    });
  };
}

/** Short door stairs belong only to sloping plots and can bridge at most one level. */
export function createEntranceSteps(world){
  const tiles=new Map(world.tiles.map(t=>[key(t.x,t.z),t])),spaces=businessSpaces(world),reserved=[],cache=new Map();
  function groundAt(x,z){
    const cx=Math.round(x/1.3),cz=Math.round(z/1.3),t=tiles.get(key(cx,cz));
    if(!t||!isFirmGround(t.kind)||spaces.has(key(cx,cz))||patioAt(world,cx,cz)||bridgeAt(world,cx,cz)||marketAt(world,cx,cz)||churchAt(world,cx,cz)||townHallAt(world,cx,cz)||landmarkAt(world,cx,cz)||customAt(world,cx,cz))return null;
    // Existing fountains and benches keep their space.
    if(t.kind==='plaza'&&((cx===0&&cz===0)||randomAt(cx,cz)>.9))return null;
    return terrainSurfaceY(t,x/1.3-cx,z/1.3-cz);
  }
  return (house,d,u=0,width=.46)=>{
    if(!hasSlope(house))return null;
    const id=`${house.x},${house.z},${d},${u},${width}`;
    if(cache.has(id))return cache.get(id);
    const base=terrainY(house),[dx,dz]=DIRECTIONS[d],start=.68,tread=.15;
    const point=(offset,depth)=>({x:house.x*1.3+dx*depth+dz*offset,z:house.z*1.3+dz*depth-dx*offset});
    const sample=(depth)=>[u-width/2,u,u+width/2].map(offset=>{const p=point(offset,depth);return groundAt(p.x,p.z);});
    // Also require a clear landing beyond the bottom step.
    for(let count=2;count<=5;count++){
      const end=start+count*tread,foot=sample(end+.08);
      if(foot.some(h=>h===null))continue;
      const rise=base-Math.min(...foot);
      if(rise<=.10||rise>.42+1e-6||Math.ceil(rise/.10)!==count)continue;
      const parts=[];let valid=true;
      for(let i=0;i<count;i++){
        const near=start+i*tread,far=near+tread,heights=[...sample(near),...sample(far)];
        const top=base+.025-i*rise/count;
        if(heights.some(h=>h===null)||base-Math.min(...heights)>.42+1e-6||(i===0&&Math.max(...heights)>top+.01)){valid=false;break;}
        // A sloping street may meet one side of a tread earlier; embed that side.
        if(Math.min(...heights)>=top-.005)continue;
        parts.push({u,depth:(near+far)/2,width,run:tread,bottom:Math.min(...heights)-.018,top});
      }
      if(!valid||!parts.length)continue;
      const corners=[point(u-width/2,start),point(u+width/2,start),point(u-width/2,end+.08),point(u+width/2,end+.08)];
      const bounds={minX:Math.min(...corners.map(p=>p.x)),maxX:Math.max(...corners.map(p=>p.x)),minZ:Math.min(...corners.map(p=>p.z)),maxZ:Math.max(...corners.map(p=>p.z))};
      if(reserved.some(b=>bounds.minX<b.maxX&&bounds.maxX>b.minX&&bounds.minZ<b.maxZ&&bounds.maxZ>b.minZ))continue;
      reserved.push(bounds);const plan={parts,bounds};cache.set(id,plan);return plan;
    }
    cache.set(id,null);return null;
  };
}

/** Heights are absolute so the same staircase works with houses and custom designs. */
export function renderEntranceSteps(plan,face){
  for(const p of plan.parts){
    const height=p.top-p.bottom;
    face('box','#b6a68a',p.u,p.bottom+height/2,p.depth,p.width,height,p.run+.003);
    face('box','#e2d4b8',p.u,p.top-.009,p.depth,p.width+.015,.018,p.run+.006);
  }
}
