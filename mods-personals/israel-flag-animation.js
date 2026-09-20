/** El dibuix i la tela es deformen junts; el costat del pal es manté fix. */
const restPositions=new WeakMap();
function waveIsraelFlag(geometry,seconds){
  const position=geometry.attributes.position;
  if(!restPositions.has(geometry))restPositions.set(geometry,new Float32Array(position.array));
  const rest=restPositions.get(geometry);
  for(let i=0;i<position.count;i++){
    const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],u=x/.91;
    const dz=.065*u*(Math.sin(u*Math.PI*2.2-seconds*2.2)-Math.sin(u*Math.PI*2.2))
      +.012*u*Math.sin(seconds*3.1)*Math.sin(u*Math.PI*3);
    const dy=.008*u*Math.sin(seconds*2.6)*Math.sin(u*Math.PI*2);
    position.setXYZ(i,x,y+dy,z+dz);
  }
}

export const ISRAEL_FLAG_ANIMATIONS={
  israelFlagCloth:{maxDisplacement:.16,update:waveIsraelFlag},
  israelFlagEmblem:{maxDisplacement:.16,update:waveIsraelFlag},
};
