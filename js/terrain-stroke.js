import {editWorld,worldLimit,key} from './model.js';

// Fill gaps between pointer samples, visiting each cell once for the whole drag.
function* lineCells(a,b){
  let {x,z}=a;
  const dx=Math.abs(b.x-x),dz=Math.abs(b.z-z),sx=Math.sign(b.x-x),sz=Math.sign(b.z-z);
  let error=dx-dz;
  for(;;){
    yield {x,z};if(x===b.x&&z===b.z)return;
    const twice=2*error;
    if(twice>-dz){error-=dz;x+=sx;}
    if(twice<dx){error+=dx;z+=sz;}
  }
}

export class TerrainStroke{
  constructor(world,kind,options,history){
    this.world=world;this.kind=kind;this.options=structuredClone(options);
    this.history=history;this.before=structuredClone(world);this.recorded=false;
    this.visited=new Set();this.previous=null;
  }
  visit(point){
    const limit=worldLimit(this.world);
    if(!point||!Number.isInteger(point.x)||!Number.isInteger(point.z)||Math.abs(point.x)>limit||Math.abs(point.z)>limit){this.previous=null;return false;}
    let changed=false;
    for(const cell of lineCells(this.previous??point,point)){
      const id=key(cell.x,cell.z);if(this.visited.has(id))continue;
      this.visited.add(id);
      if(editWorld(this.world,cell.x,cell.z,this.kind,this.options).changed){
        if(!this.recorded){this.history.push(this.before);this.recorded=true;this.before=null;}
        changed=true;
      }
    }
    this.previous={x:point.x,z:point.z};return changed;
  }
}
