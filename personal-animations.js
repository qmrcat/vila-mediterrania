import * as personal from './mods-personals/renderers.js?v=96';

/** Optional API 1 extension. Only personal geometries may be animated. */
export function createPersonalAnimations(THREE,geometries,personalIds,definitions=personal.PERSONAL_GEOMETRY_ANIMATIONS===undefined?{}:personal.PERSONAL_GEOMETRY_ANIMATIONS){
  const fail=message=>new Error(`mods-personals: animacions: ${message}`);
  if(!definitions||typeof definitions!=='object'||Array.isArray(definitions))throw fail('cal un registre d’objectes.');
  const allowed=new Set(personalIds),animations=new Map();
  // Validate the entire registry before changing shared geometry buffers.
  for(const [id,definition] of Object.entries(definitions)){
    if(!allowed.has(id)||!Object.hasOwn(geometries,id))throw fail(`«${id}» no és una geometria personal registrada.`);
    if(!definition||typeof definition.update!=='function'||definition.update.constructor?.name==='AsyncFunction')throw fail(`«${id}» necessita update(geometry, seconds) síncron.`);
    if(!Number.isFinite(definition.maxDisplacement)||definition.maxDisplacement<0)throw fail(`«${id}» necessita maxDisplacement finit i no negatiu.`);
  }
  for(const [id,definition] of Object.entries(definitions)){
    const geometry=geometries[id];
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    geometry.computeBoundingBox();
    geometry.boundingBox.expandByScalar(definition.maxDisplacement);
    geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());
    animations.set(id,{geometry,update:definition.update});
  }
  return {
    has:id=>animations.has(id),
    update(seconds,ids){
      if(!Number.isFinite(seconds))return;
      // One update per shared shape, even when many instances use it.
      for(const id of new Set(ids)){
        const animation=animations.get(id);if(!animation)continue;
        animation.update(animation.geometry,seconds);
        animation.geometry.attributes.position.needsUpdate=true;
        animation.geometry.computeVertexNormals();
      }
    },
  };
}
