import CSG from './vendor/csg.module.js';

const MAX_INPUT_TRIANGLES=4000,MAX_POLYGONS=60000;
const fail=message=>new Error(`Geometria booleana: ${message}`);
const operations={union:'union',subtract:'subtract',intersect:'intersect',unio:'union',resta:'subtract',interseccio:'intersect'};
function vector(value,fallback,label){
  if(value===undefined)return fallback;
  if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw fail(`${label} ha de contenir tres nombres finits.`);
  return value;
}
function solidFrom(THREE,input){
  const spec=input?.isBufferGeometry?{geometry:input}:input,geometry=spec?.geometry;
  if(!geometry?.isBufferGeometry||geometry.isInstancedBufferGeometry)throw fail('cal una BufferGeometry o {geometry, position, rotation, scale}.');
  if(Object.keys(geometry.morphAttributes).length)throw fail('aplica les deformacions abans de fer l’operació.');
  const position=vector(spec.position,[0,0,0],'position'),rotation=vector(spec.rotation,[0,0,0],'rotation'),scale=vector(spec.scale,[1,1,1],'scale');
  if(scale.some(n=>Math.abs(n)<1e-8))throw fail('cap component de scale pot ser zero o gairebé zero.');
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
  const mirrored=matrix.determinant()<0,normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),index=geometry.getIndex(),count=index?index.count:p?.count;
  if(!p||p.itemSize!==3||!count||count%3||count/3>MAX_INPUT_TRIANGLES)throw fail(`calen triangles vàlids; màxim ${MAX_INPUT_TRIANGLES} triangles per operand.`);
  if(n&&(n.itemSize!==3||n.count!==p.count))throw fail('les normals no coincideixen amb els vèrtexs.');
  const polygons=[];
  for(let i=0;i<count;i+=3){
    const ids=(mirrored?[0,2,1]:[0,1,2]).map(j=>index?index.getX(i+j):i+j);
    if(ids.some(id=>!Number.isInteger(id)||id<0||id>=p.count))throw fail('índex de vèrtex invàlid.');
    const points=ids.map(id=>new THREE.Vector3().fromBufferAttribute(p,id).applyMatrix4(matrix));
    if(points.some(v=>![v.x,v.y,v.z].every(Number.isFinite)))throw fail('coordenades no finites.');
    const face=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0]));
    if(face.lengthSq()<1e-16)continue; // Triangles degenerats als pols d’esferes/conus.
    face.normalize();
    polygons.push(new CSG.Polygon(points.map((point,j)=>{
      const normal=n?new THREE.Vector3().fromBufferAttribute(n,ids[j]).applyMatrix3(normalMatrix).normalize():face;
      if(![normal.x,normal.y,normal.z].every(Number.isFinite))throw fail('normals no finites.');
      return new CSG.Vertex([point.x,point.y,point.z],normal.lengthSq()?[normal.x,normal.y,normal.z]:[face.x,face.y,face.z]);
    })));
  }
  if(!polygons.length)throw fail('l’operand no conté superfícies vàlides.');
  return CSG.fromPolygons(polygons);
}
function geometryFrom(THREE,solid){
  const positions=[],normals=[];
  for(const polygon of solid.toPolygons())for(let i=2;i<polygon.vertices.length;i++){
    const vertices=[polygon.vertices[0],polygon.vertices[i-1],polygon.vertices[i]];
    const points=vertices.map(v=>new THREE.Vector3(v.pos.x,v.pos.y,v.pos.z));
    const area=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0])).lengthSq();
    if(area<1e-16)continue;
    for(const v of vertices){
      positions.push(v.pos.x,v.pos.y,v.pos.z);
      const normal=new THREE.Vector3(v.normal.x,v.normal.y,v.normal.z).normalize();
      normals.push(normal.x,normal.y,normal.z);
    }
  }
  if(!positions.length)throw fail('el resultat és buit: les peces no s’intersequen o s’ha eliminat tot el volum.');
  if(!positions.every(Number.isFinite)||!normals.every(Number.isFinite))throw fail('el resultat conté dades no finites.');
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

/** Run once inside a PERSONAL_GEOMETRIES factory, never inside part() or a frame. */
export function composeGeometry(THREE,base,steps=[]){
  if(!Array.isArray(steps)||steps.length>16)throw fail('steps ha de ser una llista de fins a 16 operacions.');
  for(const step of steps)if(!step||!Object.hasOwn(operations,step.operation))throw fail('operació desconeguda; utilitza union, subtract o intersect.');
  try{
    let solid=solidFrom(THREE,base);
    for(const step of steps){
      const other=solidFrom(THREE,step.operand),method=operations[step.operation];
      // BSP on empty solids needs explicit set identities.
      if(!solid.polygons.length){if(method==='union')solid=other;}
      else solid=solid[method](other);
      if(solid.polygons.length>MAX_POLYGONS)throw fail('resultat massa complex; redueix els segments o divideix el model.');
    }
    return geometryFrom(THREE,solid);
  }catch(error){
    if(error instanceof RangeError)throw fail('s’ha superat la complexitat del càlcul; redueix els segments de les peces.');
    throw error;
  }
}
export function booleanGeometry(THREE,operation,a,b){return composeGeometry(THREE,a,[{operation,operand:b}]);}
