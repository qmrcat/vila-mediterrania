import {renderPoultry} from './poultry-geometry.js';
import {renderCow} from './cow-geometry.js';
import {renderSheep} from './sheep-geometry.js';
import * as THREE from './vendor/three.module.min.js';
import {createGrazingHerd} from './goat-pasture.js';

/** Shared instance batches keep moving herds inexpensive even on a large map. */
export const createGoatGeometry=(world,unit,geometries,material)=>createGrazingGeometry(world,unit,geometries,material,'goatPasture');
export const createSheepGeometry=(world,unit,geometries,material)=>createGrazingGeometry(world,unit,geometries,material,'sheepPasture');
export const createCowGeometry=(world,unit,geometries,material)=>createGrazingGeometry(world,unit,geometries,material,'cowPasture');
export const createPoultryGeometry=(world,unit,geometries,material)=>createGrazingGeometry(world,unit,geometries,material,'poultryYard');
function createGrazingGeometry(world,unit,geometries,material,kind){
  const herd=createGrazingHerd(world,kind),batches=new Map(),helper=new THREE.Object3D();
  const part=(goat,shape,color,x,y,z,sx,sy,sz,rx=0,rz=0,leg=-1)=>{
    const id=shape+color;if(!batches.has(id))batches.set(id,{shape,color,parts:[]});
    batches.get(id).parts.push({goat,x,y,z,sx,sy,sz,rx,rz,leg});
  };
  for(const g of herd.animals){
    if(kind==='poultryYard'){renderPoultry(part,g);continue;}
    if(kind==='cowPasture'){renderCow(part,g);continue;}
    if(kind==='sheepPasture'){renderSheep(part,g);continue;}
    const coat=['#eee5cf','#a6805b','#e3d7bf'][g.coat],dark='#594e43';
    part(g,'sphere',coat,0,.205,0,.13,.15,.27);
    part(g,'box',coat,0,.255,.095,.075,.13,.075,-.3);
    part(g,'box',coat,0,.318,.155,.085,.08,.115,-.12);
    part(g,'box',dark,0,.302,.217,.067,.043,.025);
    part(g,'box',coat,0,.255,.207,.022,.075,.026,.2); // beard
    part(g,'box',coat,0,.265,-.145,.028,.085,.027,-.55); // short upright tail
    for(const side of [-1,1]){
      part(g,'box',coat,side*.063,.323,.145,.07,.022,.038,0,side*.2);
      part(g,'sphere','#302f29',side*.045,.331,.18,.015,.015,.015);
      part(g,'cylinder','#a99778',side*.027,.388,.139,.017,.09,.017,-.35);
      for(const end of [-1,1]){
        const leg=(side+1)+(end+1)/2;
        part(g,'box',coat,side*.045,.085,end*.089,.026,.14,.026,0,0,leg);
        part(g,'box',dark,side*.045,.018,end*.089,.03,.032,.04,0,0,leg);
      }
    }
  }
  const meshes=[];
  for(const batch of batches.values()){
    batch.mesh=new THREE.InstancedMesh(geometries[batch.shape],material(batch.color),batch.parts.length);
    batch.mesh.name=kind==='poultryYard'?'grazing-poultry':kind==='cowPasture'?'grazing-cows':kind==='sheepPasture'?'grazing-sheep':'grazing-goats';batch.mesh.castShadow=true;batch.mesh.receiveShadow=true;
    batch.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);meshes.push(batch.mesh);
  }
  function matrices(){
    for(const {mesh,parts} of batches.values()){
      parts.forEach((p,i)=>{
        const g=p.goat,c=Math.cos(g.angle),s=Math.sin(g.angle),swing=p.leg<0||!g.moving?0:Math.sin(g.phase+(p.leg===0||p.leg===3?0:Math.PI))*.022;
        helper.position.set((g.x*unit)+c*p.x+s*(p.z+swing),g.y+p.y,(g.z*unit)-s*p.x+c*(p.z+swing));
        helper.rotation.set(p.rx,g.angle,p.rz,'YXZ');helper.scale.set(p.sx,p.sy,p.sz);helper.updateMatrix();mesh.setMatrixAt(i,helper.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();
    }
  }
  matrices();return {meshes,herd,update(dt){herd.update(dt);matrices();}};
}
