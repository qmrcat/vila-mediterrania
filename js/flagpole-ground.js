import {LANDMARK_TYPES,terrainSurfaceY,terrainY,isRoad} from './model.js';
export const POLE_OFFSET=-.38;
export const POLE_RADIUS=.19;
export const isFlagpole=landmark=>!!LANDMARK_TYPES[landmark?.type]?.flag;
export function polePosition(landmark,unit=1.3){
  const angle=landmark.direction*Math.PI/2;
  return {x:landmark.x*unit+Math.cos(angle)*POLE_OFFSET,z:landmark.z*unit-Math.sin(angle)*POLE_OFFSET};
}
/** Keep the shaft vertical; place its small foot at the actual point on the terrain. */
export function poleGroundY(tile,landmark,unit=1.3){
  const p=polePosition(landmark,unit);
  // Plazas already have a horizontal paved foundation; roads follow the slope.
  if(tile.kind==='plaza')return terrainY(tile)+.045;
  return terrainSurfaceY(tile,p.x/unit-tile.x,p.z/unit-tile.z)+(isRoad(tile.kind)?.043:.015);
}
export function poleExclusion(landmark,unit=1.3){
  const p=polePosition(landmark,unit);
  return (x,z,radius=0)=>Math.hypot(x-p.x,z-p.z)<POLE_RADIUS+radius+.015;
}
