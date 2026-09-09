import {Shape,ExtrudeGeometry} from './vendor/three.module.min.js';

/** The portal's outline follows the opening, leaving no face across the passage. */
export function createWallGateGeometry(trim=false){
  const shape=new Shape();
  if(trim){
    shape.moveTo(-.31,0);shape.lineTo(-.31,.62);shape.absarc(0,.62,.31,Math.PI,0,true);shape.lineTo(.31,0);
  }else{
    shape.moveTo(-.5,0);shape.lineTo(-.5,1.22);shape.lineTo(.5,1.22);shape.lineTo(.5,0);
  }
  shape.lineTo(.25,0);shape.lineTo(.25,.62);shape.absarc(0,.62,.25,0,Math.PI,false);shape.lineTo(-.25,0);shape.closePath();
  const geometry=new ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:20});geometry.translate(0,0,-.5);return geometry;
}

export function renderWall(l,part,unit){
  const stone='#b5ab94',trim='#d3c7ac',mortar='#918975',dark='#4d5148';
  const corner=l.type==='wallCorner'||l.type==='wallCornerTower',tower=l.type==='wallTower'||l.type==='wallCornerTower',gate=l.type==='wallGate';
  const box=(color,u,y,v,sx,sy,sz,ry=0)=>part('box',color,u,y,v,sx,sy,sz,ry);
  const segment=(u,v,length,yaw=0)=>{
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const piece=(color,x,y,z,sx,sy,sz)=>box(color,u+c*x+s*z,y,v-s*x+c*z,sx,sy,sz,yaw);
    if(!gate)piece(mortar,0,.61,0,length,1.22,.28);
    // Shallow individual stone faces, with staggered joints and restrained variation.
    const columns=Math.max(2,Math.round(length/.23)),bw=length/columns;
    for(let row=0;row<7;row++)for(let col=0;col<=columns;col++){
      const left=Math.max(-length/2,-length/2+(col-(row%2?.5:0))*bw),right=Math.min(length/2,left+bw-(col===0&&row%2?bw/2:0));
      if(right-left<.025)continue;
      const x=(left+right)/2,y=.09+row*.17;
      if(gate&&Math.abs(x)-(right-left)/2<.41&&y-.076<.97)continue;
      for(const side of [-1,1])piece([stone,'#bfb39c','#ada38d'][(row*3+col)%3],x,y,side*.144,right-left-.012,.154,.018);
    }
    if(!gate)piece(trim,0,.06,0,length,.12,.31);
    piece(trim,0,1.225,0,length,.07,.33);
    const count=Math.max(2,Math.round(length/.32));
    for(let i=0;i<count;i++)piece(stone,-length/2+(i+.5)*length/count,1.395,0,.17,.21,.32);
  };
  if(gate){part('wallGate',stone,0,0,0,unit,1,.28);part('wallGateTrim',trim,0,0,0,unit,1,.32);}
  if(corner){
    // Arms meet at the cell centre and reach precisely to the south/east edges.
    segment(unit/4-.07,0,unit/2+.14);segment(0,unit/4-.07,unit/2+.14,-Math.PI/2);
  }else segment(0,0,unit);
  if(!tower)return;
  // Square central tower also caps the inside joint of the corner variant.
  box(mortar,0,.96,0,.64,1.92,.64);
  box(trim,0,.07,0,.72,.14,.72);
  for(let row=0;row<10;row++)for(let face=0;face<4;face++){
    const a=face*Math.PI/2,c=Math.cos(a),s=Math.sin(a),y=.21+row*.17;
    for(let col=0;col<3;col++){
      const u=(col-1)*.208;
      box((row+col)%3===0?'#bfb39c':stone,c*u+s*.328,y,-s*u+c*.328,.194,.154,.019,a);
    }
  }
  for(const y of [.77,1.56])for(let face=0;face<4;face++){
    const a=face*Math.PI/2,s=Math.sin(a),c=Math.cos(a);
    box(trim,s*.345,y,c*.345,.15,.36,.026,a);
    box(dark,s*.361,y,c*.361,.055,.27,.013,a);
  }
  box(trim,0,1.96,0,.74,.09,.74);
  box('#827f6f',0,2.012,0,.48,.012,.48);
  for(const side of [-1,1]){
    box(stone,side*.29,2.07,0,.12,.15,.70);box(stone,0,2.07,side*.29,.70,.15,.12);
    for(const x of [-.27,0,.27])box(trim,x,2.18,side*.29,.14,.12,.14);
    box(trim,side*.29,2.18,0,.14,.12,.14);
  }
}
