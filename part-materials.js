/** A colour string keeps its historical behaviour; a descriptor adds transparency. */
export function partMaterialKey(value){
  if(typeof value==='string')return value;
  return '@'+JSON.stringify(normalizePartMaterial(value));
}
export function normalizePartMaterial(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Material de peça: cal un color o un objecte de material.');
  const allowed=new Set(['color','opacity','roughness','metalness','doubleSide']);
  for(const key of Object.keys(value))if(!allowed.has(key))throw new Error(`Material de peça: propietat desconeguda «${key}».`);
  if(typeof value.color!=='string'||!/^#[\da-f]{6}$/i.test(value.color))throw new Error('Material de peça: color ha de tenir format #rrggbb.');
  const result={color:value.color.toLowerCase(),opacity:value.opacity??1,roughness:value.roughness??.92,metalness:value.metalness??0,doubleSide:value.doubleSide??false};
  for(const key of ['opacity','roughness','metalness'])if(!Number.isFinite(result[key])||result[key]<0||result[key]>1)throw new Error(`Material de peça: ${key} ha de ser entre 0 i 1.`);
  if(typeof result.doubleSide!=='boolean')throw new Error('Material de peça: doubleSide ha de ser true o false.');
  return result;
}
export function createPartMaterial(THREE,value){
  if(typeof value==='string')return new THREE.MeshStandardMaterial({color:value,...(value==='#ffe9a0'?{emissive:'#ffce72',emissiveIntensity:.8}:{}),roughness:.92,metalness:0,side:['#789456','#607c43','#91a865'].includes(value)?THREE.DoubleSide:THREE.FrontSide});
  const {color,opacity,roughness,metalness,doubleSide}=normalizePartMaterial(value),transparent=opacity<1;
  return new THREE.MeshStandardMaterial({color,opacity,roughness,metalness,transparent,depthWrite:!transparent,side:doubleSide?THREE.DoubleSide:THREE.FrontSide});
}
/** Transparent pieces need individual sort positions; opaque pieces stay instanced. */
export function createPartMeshes(THREE,geometry,material,matrices){
  if(material.opacity===0)return [];
  if(material.transparent)return matrices.map(matrix=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.applyMatrix4(matrix);mesh.castShadow=false;mesh.receiveShadow=true;return mesh;
  });
  const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
  matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();return [mesh];
}
