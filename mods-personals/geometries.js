/**
 * Formes personals: id: (THREE) => BufferGeometry.
 * Es creen una sola vegada i es comparteixen entre totes les instàncies.
 * No cridis dispose() ni modifiquis la geometria des dels renderitzadors.
 */
import {PECES_BUIDES} from './peces-buides.js';
import {ISRAEL_FLAG_GEOMETRIES} from './israel-flag-geometries.js';

export const PERSONAL_GEOMETRIES={

  // Cúpula oberta per sota: diàmetre 1, alçada 1, base a Y=0.
  // Exemple d’ús: part('cupulaPersonal', '#cbbd9d', 0, 2, 0, 1, .6, 1);
  cupulaPersonal(THREE){
    return new THREE.SphereGeometry(.5,16,8,0,Math.PI*2,0,Math.PI/2).scale(1,2,1);
  },
  // Teula romana de 16 cares, gruix 0.07, extrem estret al 76 %.
  // Amplada 1 en X, llargada 1 en Z, alçada .5 en Y, base a Y=0.
  teulaRomana(THREE){
    const seg=16,gruix=0.05,estret=0.76,pos=[];
    const ends=[[-.5,1],[.5,estret]];
    const point=(end,i,inner)=>{
      const a=Math.PI*i/seg,r=(inner?.5-gruix:.5)*ends[end][1];
      return [Math.cos(a)*r,Math.sin(a)*r,ends[end][0]];
    };
    const quad=(a,b,c,d)=>{pos.push(...a,...b,...c,...a,...c,...d);};
    for(let i=0;i<seg;i++){
      // cara exterior i cara interior
      quad(point(0,i,0),point(0,i+1,0),point(1,i+1,0),point(1,i,0));
      quad(point(0,i,1),point(1,i,1),point(1,i+1,1),point(0,i+1,1));
      // les dues testes
      quad(point(0,i,0),point(0,i,1),point(0,i+1,1),point(0,i+1,0));
      quad(point(1,i,0),point(1,i+1,0),point(1,i+1,1),point(1,i,1));
    }
    // els dos cantells de sota
    quad(point(0,0,0),point(1,0,0),point(1,0,1),point(0,0,1));
    quad(point(0,seg,0),point(0,seg,1),point(1,seg,1),point(1,seg,0));
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geometry.computeVertexNormals();
    return geometry;
  },
  ...ISRAEL_FLAG_GEOMETRIES,
  ...PECES_BUIDES,
};


