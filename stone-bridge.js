import {Shape,ExtrudeGeometry} from './vendor/three.module.min.js';
import {bridgeCells,bridgeHeight,terrainSurfaceY,key} from './model.js';

/** Spandrel with an open parabolic arch; local shear lets its top follow the deck. */
export function createStoneArchGeometry(){
  const s=new Shape();s.moveTo(-.5,0);s.quadraticCurveTo(0,1.6,.5,0);s.lineTo(.5,1);s.lineTo(-.5,1);s.closePath();
  const geometry=new ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:24});geometry.translate(0,0,-.5);return geometry;
}
export function renderStoneBridge(world,b,add,unit){
  const cells=bridgeCells(b),n=cells.length-1,dx=(b.b.x-b.a.x)/n,dz=(b.b.z-b.a.z)/n;
  const ya=bridgeHeight(world,b,0),yb=bridgeHeight(world,b,1),length=n*unit,slope=(yb-ya)/length,yaw=-Math.atan2(dz,dx);
  const map=new Map(world.tiles.map(t=>[key(t.x,t.z),t]));
  const stone='#b8ad96',trim='#d8ccb2',joint='#958a75';
  const part=(shape,color,u,y,side,sx,sy,sz,slanted=false)=>add(shape,color,b.a.x*unit+dx*u-dz*side,y,b.a.z*unit+dz*u+dx*side,sx,sy,sz,yaw,slanted?slope:0);
  const deck=u=>ya+slope*u;
  const box=(color,u,y,side,sx,sy,sz,tilted=false)=>part('box',color,u,y,side,sx,sy,sz,tilted);
  const groundAt=u=>{const x=b.a.x+dx*u/unit,z=b.a.z+dz*u/unit,t=map.get(key(Math.round(x),Math.round(z)));return t&&t.kind!=='beach'?terrainSurfaceY(t,x-t.x,z-t.z):-.55;};
  // Sheared masonry keeps both ends exactly level with their respective banks.
  box(joint,length/2,deck(length/2)-.09,0,length,.18,.92,true);
  box(trim,length/2,deck(length/2)+.004,0,length,.025,.94,true);
  for(const side of [-.435,.435]){
    box(stone,length/2,deck(length/2)+.17,side,length,.32,.13,true);
    box(trim,length/2,deck(length/2)+.345,side,length,.055,.17,true);
    const count=n*4;
    for(let i=0;i<count;i++)for(let row=0;row<2;row++){
      const u=(i+.5)*length/count;
      box((i+row)%3===0?'#c5b89e':stone,u,deck(u)+.08+row*.15,side+Math.sign(side)*.071,length/count-.018,.13,.013,true);
    }
  }
  for(let i=1;i<n*4;i++){const u=i*unit/4;box(joint,u,deck(u)+.018,0,.012,.007,.72,true);}
  const stations=[0];for(let i=2;i<n;i+=2)stations.push(i*unit);stations.push(length);
  const pierWidth=.36;
  for(const u of stations){
    const bottom=groundAt(u)-.04,top=deck(u)-.17,height=top-bottom;if(height<=0)continue;
    box(joint,u,bottom+height/2,0,pierWidth,height,.84);
    box(trim,u,bottom+.045,0,.48,.09,.94);
    const rows=Math.max(1,Math.ceil(height/.19));
    for(let i=0;i<rows;i++)for(const side of [-1,1]){
      const h=height/rows;box(i%2?stone:'#c1b499',u,bottom+(i+.5)*h,side*.426,pierWidth-.012,h-.012,.015);
    }
    box(trim,u,top-.035,0,.45,.08,.88);
  }
  for(let i=0;i<stations.length-1;i++){
    const left=stations[i]+pierWidth/2,right=stations[i+1]-pierWidth/2,span=right-left,mid=(left+right)/2;
    let ground=-.55;
    // Ignore the two banks, which form the abutments; respect all lower land below.
    for(let u=left;u<=right;u+=unit/4){if(u>unit/2&&u<length-unit/2)ground=Math.max(ground,groundAt(u));}
    const top=deck(mid)-.18,minTop=Math.min(deck(left),deck(right))-.18;
    const height=Math.max(.04,Math.min(.95,span*.48,minTop-ground-.015));
    part('stoneBridgeArch',stone,mid,top-height,0,span,height,.82,true);
    // Thin light stone archivolts on both faces, open below the same curve.
    for(const side of [-.42,.42])part('stoneBridgeArch',trim,mid,top-height,side,span,height,.024,true);
    // Radial joints follow the open curve without spanning the passage.
    for(let j=1;j<12;j++){
      const t=j/12,u=left+span*t,curve=3.2*t*(1-t),archY=top-height+height*curve+slope*(u-mid);
      for(const side of [-.437,.437])box(joint,u,archY+(1-curve)*height/2,side,.014,Math.max(.006,(1-curve)*height-.007),.008);
    }
  }
}
