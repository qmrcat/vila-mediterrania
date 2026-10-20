import {randomAt,terrainSurfaceY} from './model.js';
export const ROCKY_SURFACE='#a9a79b';
export const ROCKY_SOIL='#8e9088';
export const ROCKY_STONES=['#b9b7aa','#999d97','#c8c2ae','#a6aa9f'];

/** Low exposed outcrops, reproducible per cell and embedded in the local slope. */
export function renderRockyTerrain(t,add,unit,exclude=null){
  for(let i=0;i<9;i++){
    const u=(i%3-1)*.31+(randomAt(t.x,t.z,521+i)-.5)*.07;
    const v=(Math.floor(i/3)-1)*.31+(randomAt(t.x,t.z,541+i)-.5)*.07;
    const size=.24+randomAt(t.x,t.z,561+i)*.10;
    if(exclude?.((t.x+u)*unit,(t.z+v)*unit,size/2))continue;
    const height=.12+randomAt(t.x,t.z,581+i)*.08;
    const color=ROCKY_STONES[Math.floor(randomAt(t.x,t.z,601+i)*ROCKY_STONES.length)];
    add('rock',color,(t.x+u)*unit,terrainSurfaceY(t,u,v)+.012,(t.z+v)*unit,size,height,size*.86,randomAt(t.x,t.z,621+i)*Math.PI*2);
  }
}
