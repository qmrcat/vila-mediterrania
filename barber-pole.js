import {BufferGeometry,Float32BufferAttribute} from './vendor/three.module.min.js';

/** A ribbon wound around an upright unit cylinder; white gaps separate red and blue. */
export function createBarberStripeGeometry(phase){
  const positions=[],indices=[],rows=48,columns=8;
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    const y=row/rows-.5,angle=phase+row/rows*Math.PI*2.5+(col/columns-.5)*Math.PI/2;
    positions.push(Math.cos(angle)*.51,y,Math.sin(angle)*.51);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}
