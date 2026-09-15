// Extended integration check. User-owned files are read, never modified.
try{
  const content=await import('./personal-content.js');
  await import('./personal-renderers.js');
  const m=await import('./model.js'),{createVillageGeometry}=await import('./scene.js');
  const verify=(world,label)=>{
    m.validateWorld(JSON.parse(JSON.stringify(world)));
    try{
      const g=createVillageGeometry(world);
      for(const mesh of g.children){
        if(mesh.isInstancedMesh){
          if(!Array.from(mesh.instanceMatrix.array).every(Number.isFinite))throw new Error('La geometria conté coordenades no finites.');
          mesh.dispose();
        }
      }
    }catch(error){throw new Error(`${label}: ${error.message}`);}
  };
  for(const [type,def] of Object.entries(content.PERSONAL_LANDMARKS))for(const size of def.sizes)for(let direction=0;direction<4;direction++){
    const w=m.createWorld('brava','empty'),l={type,size,direction,x:0,z:0};
    for(const p of m.landmarkCells(l))m.editWorld(w,p.x,p.z,'land');
    const r=m.editWorld(w,0,0,type,{civicSize:size,landmarkDirection:direction});if(!r.changed)throw new Error(`${type}: ${r.message}`);
    verify(w,type);
  }
  for(const type of [...Object.keys(content.PERSONAL_TERRAINS),...content.PERSONAL_TREES.map(t=>t.id)]){
    const w=m.createWorld('brava','empty');const r=m.editWorld(w,0,0,type);if(!r.changed)throw new Error(`${type}: ${r.message}`);verify(w,type);
  }
  for(const type of Object.keys(content.PERSONAL_BUSINESSES)){
    const w=m.createWorld('brava','empty');m.editWorld(w,0,0,'house');m.editWorld(w,0,1,'land');
    const r=m.editWorld(w,0,0,'business',{businessType:type,businessDirection:0,businessTerrace:false});if(!r.changed)throw new Error(`${type}: ${r.message}`);verify(w,type);
  }
  console.log(`Integració de mods correcta · API ${content.MOD_API_VERSION} · format de vila ${m.createWorld('brava','empty').version}`);
  console.log('Catàlegs, col·lisions, renderitzadors, col·locació i recuperació JSON verificats.');
}catch(error){console.error(`No s'han validat els mods: ${error.message}`);process.exitCode=1;}
