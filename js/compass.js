/** Directions in the village: north = -Z, east = +X. Screen Y points down. */
export const CARDINALS=[
  {id:'north',name:'Nord',dx:0,dz:-1},
  {id:'east',name:'Est',dx:1,dz:0},
  {id:'south',name:'Sud',dx:0,dz:1},
  {id:'west',name:'Oest',dx:-1,dz:0},
];
export function compassDirections(theta,phi){
  return CARDINALS.map(point=>{
    const x=Math.cos(theta)*point.dx-Math.sin(theta)*point.dz;
    const y=Math.cos(phi)*(Math.sin(theta)*point.dx+Math.cos(theta)*point.dz);
    const length=Math.hypot(x,y)||1;
    return {...point,x:x/length,y:y/length};
  });
}
export function updateCompass(root,theta,phi){
  for(const {id,x,y} of compassDirections(theta,phi)){
    const label=root.querySelector(`[data-cardinal="${id}"]`);
    label.setAttribute('x',64+x*45);label.setAttribute('y',64+y*45);
    const arm=root.querySelector(`[data-compass-arm="${id}"]`);
    arm.setAttribute('x2',64+x*31);arm.setAttribute('y2',64+y*31);
  }
}
