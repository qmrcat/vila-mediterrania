import {terrainY,terrainSurfaceY,treeGroundY,hasSlope} from './model.js';

export function treeBed(t,unit){
  return {x:t.x*unit+(t.kind==='vine'?-.43:0),z:t.z*unit+(t.kind==='vine'?-.42:0),half:t.kind==='vine'?.16:.34};
}
export function treeBedExclusion(t,unit){
  const p=treeBed(t,unit);
  return (x,z,radius=0)=>Math.abs(x-p.x)<p.half+radius+.025&&Math.abs(z-p.z)<p.half+radius+.025;
}
export function renderTreeBed(t,surfaceBox,add,unit){
  if(!t.treeGround)return;
  const {x,z,half}=treeBed(t,unit),y=terrainY(t),edge=.045;
  // Low soil and stone edging follow the ground plane, even on ramps.
  surfaceBox('#79684e',x,y+.056,z,half*2-.025,.030,half*2-.025);
  for(const side of [-1,1]){
    surfaceBox('#c9bea5',x+side*(half-edge/2),y+.065,z,edge,.13,half*2);
    surfaceBox('#c9bea5',x,y+.065,z+side*(half-edge/2),half*2-edge*2,.13,edge);
  }
  if(t.kind==='vine'&&hasSlope(t)){
    // Keep the pergola level with individual feet, exposing the original slope.
    const top=treeGroundY(t);
    for(const u of [-.48,.48])for(const v of [-.48,.48]){
      const base=terrainSurfaceY(t,u/unit,v/unit)-.02;
      if(top>base)add('box','#b2a58c',t.x*unit+u,(top+base)/2,t.z*unit+v,.10,top-base,.10);
    }
    const base=terrainSurfaceY(t,(x-t.x*unit)/unit,(z-t.z*unit)/unit)+.05;
    if(top>base)add('cylinder','#79613f',x,(top+base)/2,z,.062,top-base,.062);
  }
}
