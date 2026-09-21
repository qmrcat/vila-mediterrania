/** Peces buides · API 1. X: amplada, Y: alçada, Z: fondària.
 * Totes ocupen X/Z [-.5,.5], Y [0,1]; es poden escalar amb part(). */
function polygon(THREE,points,Path=THREE.Shape){
  const path=new Path();path.moveTo(...points[0]);
  for(const point of points.slice(1))path.lineTo(...point);
  path.closePath();return path;
}
function rectangle(THREE,x0,y0,x1,y1,Path=THREE.Shape){
  return polygon(THREE,[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],Path);
}
function extrude(THREE,shape){
  return new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:32,steps:1}).translate(0,0,-.5);
}
function wall(THREE,centres,width){
  // Retícula compartida: evita unions en T entre finestres amb ampits alineats.
  const xs=[-.5,...centres.flatMap(x=>[x-width/2,x+width/2]),.5],ys=[0,.24,.78,1];
  const solid=(i,j)=>i>=0&&i<xs.length-1&&j>=0&&j<3&&!(j===1&&i%2===1);
  const positions=[],quad=(a,b,c,d)=>positions.push(...a,...b,...c,...a,...c,...d);
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<3;j++)if(solid(i,j)){
    const x0=xs[i],x1=xs[i+1],y0=ys[j],y1=ys[j+1];
    quad([x0,y0,.5],[x1,y0,.5],[x1,y1,.5],[x0,y1,.5]);
    quad([x1,y0,-.5],[x0,y0,-.5],[x0,y1,-.5],[x1,y1,-.5]);
    if(!solid(i-1,j))quad([x0,y0,-.5],[x0,y0,.5],[x0,y1,.5],[x0,y1,-.5]);
    if(!solid(i+1,j))quad([x1,y0,.5],[x1,y0,-.5],[x1,y1,-.5],[x1,y1,.5]);
    if(!solid(i,j-1))quad([x0,y0,-.5],[x1,y0,-.5],[x1,y0,.5],[x0,y0,.5]);
    if(!solid(i,j+1))quad([x0,y1,.5],[x1,y1,.5],[x1,y1,-.5],[x0,y1,-.5]);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  return geometry;
}
function roundArch(radius,spring,segments=32){
  return Array.from({length:segments+1},(_,i)=>{
    const a=Math.PI-i*Math.PI/segments;
    return [Math.cos(a)*radius,spring+Math.sin(a)*radius];
  });
}
function pointedArch(radius,spring,segments=32){
  // Dos arcs de circumferència de radi 2r, amb centres a les impostes oposades.
  const left=Array.from({length:segments+1},(_,i)=>{
    const a=Math.PI-i*Math.PI/3/segments;
    return [radius+2*radius*Math.cos(a),spring+2*radius*Math.sin(a)];
  });
  return [...left,...left.slice(0,-1).reverse().map(([x,y])=>[-x,y])];
}
function openArch(THREE,pointed){
  const outer=.5,inner=.36,spring=pointed?1-Math.sqrt(3)*outer:.5;
  const curve=pointed?pointedArch:roundArch;
  // Un únic contorn còncau: el buit arriba fins a baix, sense llindar.
  return extrude(THREE,polygon(THREE,[[-outer,0],...curve(outer,spring),[outer,0],[inner,0],...curve(inner,spring).reverse(),[-inner,0]]));
}
function openBox(THREE){
  const p=[],quad=(a,b,c,d)=>p.push(...a,...b,...c,...a,...c,...d);
  const ring=(r,y)=>[[-r,y,-r],[-r,y,r],[r,y,r],[r,y,-r]];
  const bottom=ring(.5,0),top=ring(.5,1),floor=ring(.38,.12),rim=ring(.38,1);
  for(let i=0;i<4;i++){
    const j=(i+1)%4;
    quad(bottom[i],bottom[j],top[j],top[i]); // Cara exterior.
    quad(floor[j],floor[i],rim[i],rim[j]); // Cara interior.
    quad(top[i],top[j],rim[j],rim[i]); // Cantell superior.
  }
  quad(bottom[3],bottom[2],bottom[1],bottom[0]);
  quad(...floor);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.computeVertexNormals();
  return geometry;
}

export const PECES_BUIDES={
  marcRectangularBuit(THREE){
    const shape=rectangle(THREE,-.5,0,.5,1);
    shape.holes.push(rectangle(THREE,-.38,.12,.38,.88,THREE.Path));
    return extrude(THREE,shape);
  },
  marcCircularBuit(THREE){
    const shape=new THREE.Shape();shape.absarc(0,.5,.5,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,.5,.36,0,Math.PI*2,true);shape.holes.push(hole);
    return extrude(THREE,shape);
  },
  arcMigPuntBuit:THREE=>openArch(THREE,false),
  arcApuntatBuit:THREE=>openArch(THREE,true),
  tubBuit(THREE){
    const shape=new THREE.Shape();shape.absarc(0,0,.5,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,.36,0,Math.PI*2,true);shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:32,steps:1}).rotateX(-Math.PI/2);
  },
  caixaOberta:openBox,
  murFinestra:THREE=>wall(THREE,[0],.60),
  murTresFinestres:THREE=>wall(THREE,[-.30,0,.30],.19),
};
