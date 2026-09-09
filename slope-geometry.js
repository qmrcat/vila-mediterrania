import * as THREE from './vendor/three.module.min.js';
import {DIRECTIONS} from './model.js';

/** Unit wedge: low edge at -Z, high edge at +Z; rotate using DIRECTIONS. */
export function createSlopeWedge(){
  const geometry=new THREE.BoxGeometry(1,1,1),positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)positions.setY(i,positions.getY(i)>0?positions.getZ(i)+.5:-.025);
  positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

/** Shear a horizontal surface authored at terrainY onto the actual ground plane. */
export function slopeShearMatrix(tile,unit){
  const [dx,dz]=DIRECTIONS[tile.slopeDirection],ax=dx*.42/unit,az=dz*.42/unit;
  return new THREE.Matrix4().set(1,0,0,0, ax,1,az,-.21-ax*tile.x*unit-az*tile.z*unit, 0,0,1,0, 0,0,0,1);
}
