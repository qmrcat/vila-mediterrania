import {randomAt,terrainSurfaceY} from './model.js';
export const MEADOW_GREEN='#81a96b';
export const MEADOW_PETALS=['#fff5dc','#f1d166','#db91ab'];

/** Small, repeatable wildflowers: upright stems follow the local terrain surface. */
export function renderMeadowFlowers(t,add,unit){
  for(let i=0;i<9;i++){
    if(randomAt(t.x,t.z,301+i)<.24)continue;
    const u=((i%3)-1)*.32+(randomAt(t.x,t.z,321+i)-.5)*.20;
    const v=(Math.floor(i/3)-1)*.32+(randomAt(t.x,t.z,341+i)-.5)*.20;
    const x=(t.x+u)*unit,z=(t.z+v)*unit,base=terrainSurfaceY(t,u,v)+.012;
    const height=.035+randomAt(t.x,t.z,361+i)*.04,angle=randomAt(t.x,t.z,381+i)*Math.PI*2;
    const color=MEADOW_PETALS[Math.floor(randomAt(t.x,t.z,401+i)*MEADOW_PETALS.length)];
    add('box','#537e48',x,base+height/2,z,.007,height,.007);
    add('box','#6a9859',x+.008,base+height*.40,z,.029,.007,.012,angle);
    for(let p=0;p<4;p++){
      const a=angle+p*Math.PI/2;
      add('box',color,x+Math.cos(a)*.017,base+height,z+Math.sin(a)*.017,.026,.010,.023,a);
    }
    add('box','#c7a245',x,base+height+.006,z,.015,.009,.015,angle);
  }
}
