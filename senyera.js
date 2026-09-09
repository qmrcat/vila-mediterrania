import * as THREE from './vendor/three.module.min.js';

/** Nine equal horizontal bands: five gold and four red, visible on both sides. */
export function createSenyera(){
  const width=.62,height=.38,segments=16,positions=[],colors=[],indices=[];
  const gold=new THREE.Color('#f8cc32'),red=new THREE.Color('#cf3038');
  for(let band=0;band<9;band++){
    const offset=positions.length/3,color=band%2?red:gold;
    for(let row=0;row<2;row++)for(let col=0;col<=segments;col++){
      positions.push(col/segments*width,(band+row)/9*height,0);colors.push(color.r,color.g,color.b);
    }
    for(let col=0;col<segments;col++){
      const a=offset+col,b=a+1,c=a+segments+1,d=c+1;indices.push(a,b,d,a,d,c);
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  geometry.boundingBox=new THREE.Box3(new THREE.Vector3(-.001,-.01,-.065),new THREE.Vector3(width+.001,height+.01,.065));geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.86}));
  mesh.name='senyera';mesh.castShadow=true;mesh.receiveShadow=true;
  Object.assign(mesh.userData,{senyera:true,ownsGeometry:true,ownsMaterial:true,rest:new Float32Array(positions),width});
  waveSenyera(mesh,0);return mesh;
}
export function waveSenyera(mesh,time){
  const {rest,width}=mesh.userData,position=mesh.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const x=rest[i*3],y=rest[i*3+1],free=x/width;
    if(x===0){position.setXYZ(i,0,y,0);continue;}
    position.setXYZ(i,x,y+free*Math.sin(x*12-time*2.6)*.008,free*(Math.sin(x*10-time*2.3)*.045+Math.sin(x*18-time*3.7+y*6)*.015));
  }
  position.needsUpdate=true;mesh.geometry.computeVertexNormals();
}
