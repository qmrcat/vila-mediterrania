import * as THREE from './vendor/three.module.min.js';
import {waveSenyera} from './senyera.js';

const GOLD=[248,204,50],RED=[207,48,56],BLUE=[36,98,167],WHITE=[255,255,255],BLACK=[0,0,0];
const textures=new Map(); // Three small shared patterns survive individual pole removal.
function star(cx,cy,r){
  return Array.from({length:10},(_,i)=>{
    const a=-Math.PI/2+i*Math.PI/5,size=r*(i%2?.382:1);
    return [cx+Math.cos(a)*size*2/3,cy+Math.sin(a)*size];
  });
}
function inside(x,y,polygon){
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
  }
  return hit;
}
const blackStar=star(.170,.505,.155),blueStar=star(.133,.5,.140);

/** Pattern coordinates: u from the hoist to the fly, v from top to bottom. */
export function poleFlagColor(type,u,v){
  if(type==='black'){
    // Reference: a narrow central white saltire, with a white star at the hoist.
    const saltire=Math.abs(u-(.306+.387*v))<.054||Math.abs(u-(.693-.387*v))<.054;
    return saltire||inside(u,v,blackStar)?WHITE:BLACK;
  }
  if(type==='estelada'&&u<.40*(1-Math.abs(v-.5)*2))return inside(u,v,blueStar)?WHITE:BLUE;
  return Math.min(8,Math.floor(v*9))%2?RED:GOLD;
}
function textureFor(type){
  if(textures.has(type))return textures.get(type);
  const width=384,height=256,data=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const color=poleFlagColor(type,(x+.5)/width,1-(y+.5)/height),offset=(y*width+x)*4;
    data.set([...color,255],offset);
  }
  const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
  texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;
  texture.needsUpdate=true;textures.set(type,texture);return texture;
}

/** One cloth mesh with the pattern visible from either side, including the star. */
export function createPoleFlag(type){
  const width=.93,height=.62,geometry=new THREE.PlaneGeometry(width,height,24,16);
  // Set exact hoist coordinates so the fixed column stays at x = 0.
  for(let row=0;row<=16;row++)for(let col=0;col<=24;col++)geometry.attributes.position.setXYZ(row*25+col,col*width/24,(16-row)*height/16,0);
  const rest=new Float32Array(geometry.attributes.position.array);
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  geometry.boundingBox=new THREE.Box3(new THREE.Vector3(-.001,-.01,-.065),new THREE.Vector3(width+.001,height+.01,.065));
  geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const material=new THREE.MeshStandardMaterial({map:textureFor(type),side:THREE.DoubleSide,roughness:.86});
  const mesh=new THREE.Mesh(geometry,material);mesh.name=`pal-${type}`;mesh.castShadow=true;mesh.receiveShadow=true;
  Object.assign(mesh.userData,{flagpole:true,type,ownsGeometry:true,ownsMaterial:true,rest,width});
  waveSenyera(mesh,0);return mesh;
}

export const POLE_FLAG_ORIGIN={u:-.353,y:2,z:0};
export function renderFlagpole(part){
  const u=-.38;
  part('cylinder','#c8bda5',u,.05,0,.38,.10,.38);
  part('cylinder','#e6decb',u,.14,0,.26,.12,.26);
  part('cylinder','#9aa7a3',u,1.43,0,.043,2.56,.043);
  part('sphere','#d5b775',u,2.75,0,.075,.075,.075);
  // Halyard and two attachment rings along the fixed edge of the cloth.
  part('cylinder','#e7dfc3',u+.037,1.51,-.008,.008,2.38,.008);
  for(const y of [2.02,2.60])part('box','#d3d5bd',u+.025,y,0,.052,.022,.026);
  part('box','#697c78',u+.022,.60,.015,.025,.095,.035);
}
