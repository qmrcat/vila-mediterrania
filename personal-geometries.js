import * as personal from './mods-personals/renderers.js';

/** Optional addition to API 1. Older renderer registries have no geometry export. */
export function createPersonalGeometries(THREE,core,definitions=Object.hasOwn(personal,'PERSONAL_GEOMETRIES')?personal.PERSONAL_GEOMETRIES:{}){
  const fail=(id,message)=>new Error(`mods-personals: geometria «${id}»: ${message}`);
  if(!definitions||typeof definitions!=='object'||Array.isArray(definitions))throw fail('PERSONAL_GEOMETRIES','el registre ha de ser un objecte.');
  const result={},created=new Set();
  try{
    // Validate all names before running any factory.
    for(const [id,factory] of Object.entries(definitions)){
      if(!/^[a-z][A-Za-z0-9]{1,39}$/.test(id)||Object.hasOwn(Object.prototype,id))throw fail(id,'identificador no vàlid; utilitza de 2 a 40 lletres o números, començant amb minúscula.');
      if(Object.hasOwn(core,id))throw fail(id,'aquest nom ja és una forma del joc.');
      if(typeof factory!=='function'||factory.constructor?.name==='AsyncFunction')throw fail(id,'cal una funció síncrona que retorni una BufferGeometry.');
    }
    for(const [id,factory] of Object.entries(definitions)){
      let g;
      try{g=factory(THREE);}catch(error){throw fail(id,`la funció ha fallat: ${error.message}`);}
      if(!(g instanceof THREE.BufferGeometry)||g.isInstancedBufferGeometry)throw fail(id,'la funció ha de retornar una BufferGeometry de triangles, no una malla ni una promesa.');
      if(Object.values(core).includes(g))throw fail(id,'retorna una geometria nova; no reutilitzis ni modifiquis una forma oficial.');
      created.add(g);
      const p=g.getAttribute('position');
      if(!p||p.itemSize!==3||p.count<3||!Number.isInteger(p.count))throw fail(id,'falta un atribut position amb almenys tres vèrtexs de tres components.');
      const finite=(a,size)=>{
        if(!a||a.itemSize!==size||a.count!==p.count)return false;
        for(let i=0;i<a.count;i++)if(!Number.isFinite(a.getX(i))||!Number.isFinite(a.getY(i))||(size===3&&!Number.isFinite(a.getZ(i))))return false;
        return true;
      };
      if(!finite(p,3))throw fail(id,'position conté coordenades no finites.');
      const index=g.getIndex(),count=index?index.count:p.count;
      if(!Number.isInteger(count)||count<3||count%3)throw fail(id,'els triangles han de tenir tres índexs o vèrtexs cadascun.');
      if(index){
        if(index.itemSize!==1)throw fail(id,'els índexs han de tenir una sola component.');
        for(let i=0;i<index.count;i++){const n=index.getX(i);if(!Number.isInteger(n)||n<0||n>=p.count)throw fail(id,'hi ha un índex fora dels vèrtexs disponibles.');}
      }
      if(Object.keys(g.morphAttributes).length)throw fail(id,'les formes instanciades no admeten morphAttributes en aquesta API.');
      if(!g.getAttribute('normal'))g.computeVertexNormals();
      if(!finite(g.getAttribute('normal'),3))throw fail(id,'les normals no són vàlides.');
      if(g.getAttribute('uv')&&!finite(g.getAttribute('uv'),2))throw fail(id,'les coordenades UV no són vàlides.');
      g.computeBoundingBox();g.computeBoundingSphere();
      if(!Number.isFinite(g.boundingSphere.radius))throw fail(id,'els límits de la geometria no són finits.');
      result[id]=g;
    }
    return result;
  }catch(error){for(const g of created)g.dispose();throw error;}
}
