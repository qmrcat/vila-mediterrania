import * as THREE from './vendor/three.module.min.js';
import {key,DIRECTIONS,worldLimit} from './model.js';

const UNIT=1.3, HALF=UNIT/2, STEPS=8;
export const BEACH_PROFILES={
  daurada:{drySlope:.11,wetSlope:.18,reach:2.6,color:'#ead09a'},
  brava:{drySlope:.32,wetSlope:.44,reach:1.15,color:'#d6bb8b'},
};
const rectangleDistance=(x,z,cx,cz)=>Math.hypot(Math.max(0,Math.abs(x-cx)-HALF),Math.max(0,Math.abs(z-cz)-HALF));
function edgeDistance(x,z,t,d){
  const [dx,dz]=DIRECTIONS[d],cx=t.x*UNIT+dx*HALF,cz=t.z*UNIT+dz*HALF;
  return d%2?Math.hypot(x-cx,Math.max(0,Math.abs(z-cz)-HALF)):Math.hypot(z-cz,Math.max(0,Math.abs(x-cx)-HALF));
}

/** One continuous height field across all painted sand cells and their sea apron. */
export function createBeachField(world){
  const map=new Map(world.tiles.map(t=>[key(t.x,t.z),t]));
  const beaches=world.tiles.filter(t=>t.kind==='beach'),profile=BEACH_PROFILES[world.region];
  const cells=new Map(),edges=new Map(),radius=Math.ceil(profile.reach/UNIT)+1;
  for(const t of beaches){
    edges.set(key(t.x,t.z),DIRECTIONS.map(([dx,dz])=>map.get(key(t.x+dx,t.z+dz))));
    for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
      const x=t.x+dx,z=t.z+dz,other=map.get(key(x,z));
      if(Math.abs(x)>worldLimit(world)||Math.abs(z)>worldLimit(world)||(other&&other.kind!=='beach'))continue;
      if(rectangleDistance(x*UNIT,z*UNIT,t.x*UNIT,t.z*UNIT)>profile.reach+HALF)continue;
      cells.set(key(x,z),{x,z});
    }
  }
  function heightAt(x,z){
    const cx=Math.round(x/UNIT),cz=Math.round(z/UNIT);
    let sandDistance=Infinity,seaDistance=Infinity,landDistance=Infinity;
    // Local lookup bounds the work even when the entire map has been painted.
    for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
      const k=key(cx+dx,cz+dz),neighbours=edges.get(k);if(!neighbours)continue;
      const t=map.get(k);sandDistance=Math.min(sandDistance,rectangleDistance(x,z,t.x*UNIT,t.z*UNIT));
      for(let d=0;d<4;d++){
        if(!neighbours[d])seaDistance=Math.min(seaDistance,edgeDistance(x,z,t,d));
        else if(neighbours[d].kind!=='beach')landDistance=Math.min(landDistance,edgeDistance(x,z,t,d));
      }
    }
    const inside=sandDistance<1e-7;
    const h=inside?Math.min(.25,.035+seaDistance*profile.drySlope):Math.max(-.65,.035-sandDistance*profile.wetSlope);
    // Meet the foot of solid terrain smoothly, without raising beaches to cliff tops.
    const inland=.25*Math.exp(-landDistance/.45)*Math.exp(-sandDistance/.4);
    return Math.max(h,inland>0?inland-Math.max(0,sandDistance)*profile.wetSlope:-Infinity);
  }
  return {cells,heightAt,profile,beaches};
}

export function createBeachMesh(world){
  const field=createBeachField(world);if(!field.beaches.length)return null;
  const positions=[],colors=[],indices=[],vertices=new Map();
  const dry=new THREE.Color(field.profile.color),wet=new THREE.Color('#b5a782'),deep=new THREE.Color('#51aebc');
  function vertex(ix,iz){
    const k=key(ix,iz);if(vertices.has(k))return vertices.get(k);
    const x=(ix/STEPS-.5)*UNIT,z=(iz/STEPS-.5)*UNIT,y=field.heightAt(x,z);
    const color=dry.clone().lerp(wet,THREE.MathUtils.clamp((.12-y)/.15,0,1));
    if(y<-.045)color.lerp(deep,THREE.MathUtils.clamp((-y-.045)/.43,0,1));
    const index=positions.length/3;positions.push(x,y,z);colors.push(color.r,color.g,color.b);vertices.set(k,index);return index;
  }
  for(const {x,z} of field.cells.values()){
    for(let u=0;u<STEPS;u++)for(let v=0;v<STEPS;v++){
      const ix=x*STEPS+u,iz=z*STEPS+v;
      const a=vertex(ix,iz),b=vertex(ix+1,iz),c=vertex(ix,iz+1),d=vertex(ix+1,iz+1);
      indices.push(a,c,b,b,c,d);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  mesh.name='beach';mesh.receiveShadow=true;mesh.castShadow=true;
  mesh.userData={ownsGeometry:true,ownsMaterial:true,field};return mesh;
}
