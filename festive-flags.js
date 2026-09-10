import {CONFIG} from './config.js';
import * as THREE from './vendor/three.module.min.js';

// Integer hashing avoids changes when rebuilding the scene or reordering JSON tiles.
function rank(x,z,salt=0){
  let n=Math.imul(x,73856093)^Math.imul(z,19349663)^Math.imul(salt+1,83492791);
  n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);
  return (n^(n>>>16))>>>0;
}

/** One flag per house, on the configured percentage of houses with an exposed residential opening. */
export function chooseFestiveFlags(candidates){
  const houses=new Map();
  for(const p of candidates){
    const key=`${p.x},${p.z}`,previous=houses.get(key);
    const score=q=>(q.mount==='balcony'?100:0)+(q.floor>0?10:0);
    if(!previous||score(p)>score(previous)||score(p)===score(previous)&&rank(p.x,p.z,p.direction*19+p.floor*5+p.u*1000)>rank(previous.x,previous.z,previous.direction*19+previous.floor*5+previous.u*1000))houses.set(key,p);
  }
  return [...houses.values()].sort((a,b)=>rank(a.x,a.z)-rank(b.x,b.z)||a.x-b.x||a.z-b.z)
    .slice(0,Math.round(houses.size*CONFIG.flags.housePercentage/100)).map((p,i)=>({...p,type:Math.floor((i+1)*CONFIG.flags.esteladaPercentage/100)>Math.floor(i*CONFIG.flags.esteladaPercentage/100)?'estelada':'senyera'}));
}

/** Cloth hangs from its top edge. All coloured pieces share the same deformation. */
export function createFestiveFlag({type='senyera',mount='window',x=0,z=0}){
  const width=mount==='balcony'?.60:.30,height=width*2/3;
  const positions=[],colors=[],gold=new THREE.Color('#f8cc32'),red=new THREE.Color('#cf3038');
  const vertex=(p,color)=>{positions.push(...p);colors.push(color.r,color.g,color.b);};
  function triangle(a,b,c,color,subdivisions=0){
    if(!subdivisions){vertex(a,color);vertex(b,color);vertex(c,color);return;}
    const mid=(p,q)=>p.map((v,i)=>(v+q[i])/2),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
    triangle(a,ab,ca,color,subdivisions-1);triangle(ab,b,bc,color,subdivisions-1);
    triangle(ca,bc,c,color,subdivisions-1);triangle(ab,bc,ca,color,subdivisions-1);
  }
  for(let band=0;band<9;band++)for(let col=0;col<16;col++){
    const left=-width/2+col*width/16,right=left+width/16,top=-band*height/9,bottom=top-height/9,color=band%2?red:gold;
    triangle([left,top,0],[left,bottom,0],[right,bottom,0],color);
    triangle([left,top,0],[right,bottom,0],[right,top,0],color);
  }
  if(type==='estelada'){
    const left=-width/2,blue=new THREE.Color('#2462a7'),white=new THREE.Color('#fffdf0');
    triangle([left,0,.002],[left,-height,.002],[left+width*.40,-height/2,.002],blue,4);
    const center=[left+width*.133,-height/2,.004],points=[];
    for(let i=0;i<10;i++){
      const angle=Math.PI/2+i*Math.PI/5,radius=width*(i%2?.040:.093);
      points.push([center[0]+Math.cos(angle)*radius,center[1]+Math.sin(angle)*radius,.004]);
    }
    for(let i=0;i<10;i++)triangle(center,points[i],points[(i+1)%10],white,2);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  geometry.boundingBox=new THREE.Box3(new THREE.Vector3(-width/2-.001,-height-.006,-.001),new THREE.Vector3(width/2+.001,.006,.045));
  geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.86}));
  mesh.name=`diada-${type}`;mesh.castShadow=true;mesh.receiveShadow=true;
  Object.assign(mesh.userData,{festiveFlag:true,type,mount,ownsGeometry:true,ownsMaterial:true,rest:new Float32Array(positions),width,height,phase:rank(x,z,97)/0xffffffff*Math.PI*2});
  waveFestiveFlag(mesh,0);return mesh;
}

export function waveFestiveFlag(mesh,time){
  const {rest,height,phase}=mesh.userData,position=mesh.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],free=-y/height;
    position.setXYZ(i,x,y+free*Math.sin(x*16-time*1.8+phase)*.003,z+free*(.022+.012*Math.sin(x*17+y*12-time*2+phase)));
  }
  position.needsUpdate=true;mesh.geometry.computeVertexNormals();
}
