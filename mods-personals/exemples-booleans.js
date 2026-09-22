import {booleanGeometry,composeGeometry} from '../solid-geometry.js';

export const BOOLEAN_EXAMPLES={
  csgCubForadat(THREE){
    const cube=new THREE.BoxGeometry(1,1,1),drill=new THREE.CylinderGeometry(.23,.23,1.6,24);
    try{return booleanGeometry(THREE,'subtract',cube,{geometry:drill,rotation:[Math.PI/2,0,0]}).translate(0,.5,0);}
    finally{cube.dispose();drill.dispose();}
  },
  csgUnio(THREE){
    const cube=new THREE.BoxGeometry(.70,.70,.70),sphere=new THREE.SphereGeometry(.38,16,12);
    try{return booleanGeometry(THREE,'union',cube,{geometry:sphere,position:[.18,.18,0]}).translate(0,.35,0);}
    finally{cube.dispose();sphere.dispose();}
  },
  csgInterseccio(THREE){
    const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(.65,20,12);
    try{return booleanGeometry(THREE,'intersect',cube,sphere).translate(0,.5,0);}
    finally{cube.dispose();sphere.dispose();}
  },
  csgTresForats(THREE){
    const wall=new THREE.BoxGeometry(1,1,.25),drill=new THREE.CylinderGeometry(.11,.11,.70,20);
    try{return composeGeometry(THREE,wall,[-.30,0,.30].map(x=>({operation:'subtract',operand:{geometry:drill,rotation:[Math.PI/2,0,0],position:[x,.06,0]}}))).translate(0,.5,0);}
    finally{wall.dispose();drill.dispose();}
  },
};

/** Optional 1-cell landmark example; see GUIA-BOOLEANS-I-MATERIALS.md. */
export function renderBooleanWorkshop(landmark,part){
  part('csgCubForadat','#d1ba91',0,0,0,1,1,.6);
  // Independent glass pane in the opening; it keeps its own material.
  part('box',{color:'#8bd5ec',opacity:.30,roughness:.12,doubleSide:true},0,.5,0,.45,.45,.025);
}
