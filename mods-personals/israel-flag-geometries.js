/** Tela i dibuix comparteixen la mateixa superfície corbada. Sense textures externes. */
const WIDTH=.91,HEIGHT=WIDTH*8/11;
function surface(x,y,offset){
  const u=x/WIDTH;
  return [x,y-.018*u*u,.065*u*Math.sin(u*Math.PI*2.2)+offset];
}
function makeGeometry(THREE,draw){
  const positions=[];
  const quad=(a,b,c,d,offset)=>{
    for(const side of [-1,1]){
      const p=[a,b,c,d].map(([x,y])=>surface(x,y,side*offset));
      for(const i of side===1?[0,1,2,0,2,3]:[2,1,0,3,2,0])positions.push(...p[i]);
    }
  };
  draw(quad);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
}
function rectangle(quad,x0,y0,x1,y1,offset){
  for(let i=0;i<48;i++){
    const a=x0+(x1-x0)*i/48,b=x0+(x1-x0)*(i+1)/48;
    quad([a,y0],[b,y0],[b,y1],[a,y1],offset);
  }
}
function line(quad,a,b,width){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const nx=-dy/length*width/2,ny=dx/length*width/2;
  for(let i=0;i<24;i++){
    const p=[a[0]+dx*i/24,a[1]+dy*i/24],q=[a[0]+dx*(i+1)/24,a[1]+dy*(i+1)/24];
    quad([p[0]+nx,p[1]+ny],[p[0]-nx,p[1]-ny],[q[0]-nx,q[1]-ny],[q[0]+nx,q[1]+ny],.009);
  }
}

export const ISRAEL_FLAG_GEOMETRIES={
  israelFlagCloth:THREE=>makeGeometry(THREE,quad=>rectangle(quad,0,0,WIDTH,HEIGHT,.003)),
  israelFlagEmblem:THREE=>makeGeometry(THREE,quad=>{
    rectangle(quad,0,HEIGHT*.125,WIDTH,HEIGHT*.25,.009);
    rectangle(quad,0,HEIGHT*.75,WIDTH,HEIGHT*.875,.009);
    // Dos triangles equilàters buits, un cap amunt i l’altre cap avall.
    const radius=HEIGHT*.235;
    for(const rotation of [Math.PI/2,-Math.PI/2]){
      const points=Array.from({length:3},(_,i)=>{
        const angle=rotation+i*Math.PI*2/3;
        return [WIDTH/2+Math.cos(angle)*radius,HEIGHT/2+Math.sin(angle)*radius];
      });
      for(let i=0;i<3;i++)line(quad,points[i],points[(i+1)%3],.021);
    }
  }),
};
