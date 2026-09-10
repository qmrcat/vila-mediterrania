import * as THREE from './vendor/three.module.min.js';
import {businessSignPixels} from './business-signs.js';
export const LODGING_TYPES=['hotel3','hotel5','hostal','pension'];
export function createHotelStarGeometry(){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const a=Math.PI/2+i*Math.PI/5,r=i%2?.20:.5,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
  }
  shape.closePath();return new THREE.ShapeGeometry(shape);
}

/** Local coordinates; the landmark renderer rotates architecture and its whole garden. */
export function renderLodging(l,part,unit){
  const luxury=l.type==='hotel5',hotel=luxury||l.type==='hotel3',small=l.type==='pension';
  const width=(luxury?3:small?1:2)*unit-.12,depth=(luxury?3:hotel?2:1)*unit-.12;
  const floors=luxury?4:hotel?3:2,storey=.74,base=.12,top=base+floors*storey;
  const bw=width-.16,bd=luxury?1.40:hotel?1.73:.89,cz=luxury?-1.03:hotel?-.24:-.05;
  const front=cz+bd/2,back=cz-bd/2,door=luxury?.67:0;
  const wall=luxury?'#f0e9d8':hotel?'#e4d0a9':small?'#d9aa89':'#e6c198';
  const accent=luxury?'#497f7d':hotel?'#5d8599':small?'#617d68':'#9c6650';
  const box=(color,x,y,z,sx,sy,sz,rx=0,rz=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx,rz);
  box('#c8bca2',0,.035,0,width+.04,.07,depth+.04);
  box('#e6dcc4',0,.079,0,width,.018,depth);
  box(wall,0,base+floors*storey/2,cz,bw,floors*storey,bd);
  for(let floor=0;floor<=floors;floor++)box('#f4ecda',0,base+floor*storey,cz,bw+.04,.055,bd+.045);
  const columns=luxury?6:small?2:4;
  function window(x,y,z,sign=1,balcony=false){
    const w=small?.27:.34;
    box('#f4ecda',x,y,z,w,.41,.035);box('#577f8c',x,y,z+sign*.025,w-.07,.33,.018);
    box('#c6ded7',x,y,z+sign*.038,.014,.32,.009);
    if(balcony){
      box('#eae3d1',x,y-.24,z+sign*.10,w+.10,.045,.22);
      box(accent,x,y-.02,z+sign*.20,w+.09,.024,.021);
      for(const dx of [-1,0,1])box(accent,x+dx*(w+.07)/2,y-.12,z+sign*.20,.015,.21,.019);
      for(const dx of [-1,1])box(accent,x+dx*(w+.07)/2,y-.02,z+sign*.10,.017,.024,.21);
    }else if(!hotel){
      for(const dx of [-1,1])box(accent,x+dx*(w/2+.05),y,z+sign*.034,.085,.33,.025);
    }
  }
  for(let floor=0;floor<floors;floor++){
    const y=base+.40+floor*storey;
    for(let col=0;col<columns;col++){
      const x=(col-(columns-1)/2)*(bw-.30)/columns;
      if(floor>0||Math.abs(x-door)>.43)window(x,y,front+.02,1,floor>0&&hotel);
      window(x,y,back-.026,-1,false);
    }
    for(const side of [-1,1])for(let col=0;col<(hotel?2:1);col++){
      const z=cz+(hotel?(col-.5)*.58:0);
      box('#f4ecda',side*(bw/2+.015),y,z,.025,.40,.30);
      box('#577f8c',side*(bw/2+.034),y,z,.016,.31,.23);
      box('#c6ded7',side*(bw/2+.044),y,z,.009,.31,.014);
    }
  }
  box('#f2e7d2',door,.44,front+.04,small?.44:.61,.64,.06);
  box(accent,door,.43,front+.081,small?.34:.50,.56,.018);
  box('#b9d8d1',door,.43,front+.096,.016,.54,.01);
  for(const sign of [-1,1])box('#d6b46b',door+sign*.046,.42,front+.11,.012,.09,.014);
  box('#ece2cb',door,.12,front+.12,small?.49:.68,.04,.23);
  const label=l.signName??(hotel?'HOTEL':small?'PENSIÓ':'HOSTAL'),signWidth=small?.78:1.12;
  box(accent,door,.84,front+.053,signWidth+.08,.19,.034);
  for(const p of businessSignPixels(label,signWidth,.115))box('#fff3d5',door+p.x,.84+p.y,front+.076,p.size,p.size,.01);
  if(hotel){
    const stars=luxury?5:3;
    for(let i=0;i<stars;i++)part('hotelStar','#dfb654',door+(i-(stars-1)/2)*.15,.976,front+.038,.115,.115,1);
    // Reception canopy below the sign, projecting toward the entrance path.
    box(accent,door,.717,front+.18,.82,.045,.38);
    box('#ede5d2',0,top+.035,cz,bw+.06,.07,bd+.06);
    for(const sign of [-1,1]){
      box(wall,0,top+.16,cz+sign*(bd/2-.015),bw+.04,.25,.065);
      box('#f6eddb',0,top+.295,cz+sign*(bd/2-.015),bw+.065,.03,.095);
      box(wall,sign*(bw/2-.015),top+.16,cz,.065,.25,bd);
    }
    if(!luxury){
      // A shaded roof terrace and planters distinguish the smaller hotel.
      for(const x of [-.48,.48])for(const z of [cz-.40,cz+.40])box('#a68c5e',x,top+.25,z,.035,.43,.035);
      for(let i=0;i<6;i++)box('#bea16c',-.53+i*.212,top+.48,cz,.045,.045,.92);
      for(const x of [-.86,.86]){box('#b87956',x,.20,.99,.22,.22,.24);part('sphere','#6b8c54',x,.38,.99,.30,.23,.30);}
    }
  }else{
    const run=bd/2+.07,rise=small?.31:.36,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
    for(const side of [-1,1]){
      box('#bc7a52',0,top+rise/2,cz+side*run/2,bw+.12,.055,length,side*angle);
      for(let i=0;i<Math.floor(bw/.12);i++)box('#dca574',-bw/2+.06+i*.12,top+rise/2+.035,cz+side*run/2,.022,.015,length,side*angle);
    }
    part('cylinder','#b6724d',0,top+rise+.025,cz,.068,bw+.13,.068,0,0,Math.PI/2);
    box(wall,bw/2-.20,top+.38,cz-.10,.13,.38,.14);box('#b6724d',bw/2-.20,top+.585,cz-.10,.19,.045,.20);
    // Small flowers at the entrance without blocking the doorstep.
    for(const x of [-1,1]){
      const u=x*(small?.40:.86);part('cylinder','#ae7150',u,.18,front+.12,.15,.19,.15);
      part('sphere','#668655',u,.29,front+.12,.18,.13,.18);
      for(const dx of [-.04,.035])part('sphere',small?'#c57c99':'#d8b557',u+dx,.35,front+.12,.065,.055,.065);
    }
  }
  if(!luxury)return;
  // Open garden in front of the hotel; a clear path runs beside the pool to reception.
  box('#89aa71',0,.094,.79,width-.10,.028,2.10);
  box('#e7dcc2',.67,.116,.78,.49,.025,2.12);
  const px=-.67,pz=.79,pw=1.36,pd=1.36;
  box('#e5e4cf',px,.111,pz,pw+.20,.035,pd+.20);
  box('#448d9c',px,.127,pz,pw,.025,pd);
  box('#69bdc4',px,.144,pz,pw-.055,.012,pd-.055);
  for(const side of [-1,1]){
    box('#f4ebd4',px+side*(pw/2+.05),.158,pz,.10,.06,pd+.20);
    box('#f4ebd4',px,.158,pz+side*(pd/2+.05),pw,.06,.10);
  }
  for(let i=0;i<3;i++)box('#a4d9d5',px-.32+i*.29,.153,pz-.30+i*.28,.36,.003,.021);
  // Stainless ladder on the near edge.
  for(const dx of [-.09,.09])part('cylinder','#c2d0c8',px+dx,.23,pz+pd/2,.018,.23,.018);
  for(const y of [.15,.22,.29])box('#c2d0c8',px,y,pz+pd/2,.20,.015,.022);
  for(const z of [.32,1.03]){
    box('#b8a682',1.34,.17,z,.30,.09,.52);
    box('#eee7d3',1.34,.235,z,.29,.055,.49);
    box('#eee7d3',1.34,.34,z-.23,.29,.23,.04);
    part('cylinder','#8c7955',1.68,.43,z-.16,.024,.66,.024);
    part('cone','#ead49c',1.68,.81,z-.16,.36,.20,.36);
  }
  // Low hedges, flowering shrubs and two Mediterranean garden trees.
  for(const side of [-1,1])for(let i=0;i<5;i++)part('sphere','#618653',side*(width/2-.12),.24,.06+i*.35,.20,.26,.33);
  for(const x of [-1.44,1.35]){
    part('cylinder','#92734e',x,.42,1.65,.046,.65,.046);
    part('sphere','#64834f',x,.87,1.65,.42,.42,.40);
    part('sphere','#7c975f',x-.09,.99,1.63,.28,.24,.28);
  }
  for(let i=0;i<5;i++){
    const x=-1.19+i*.30;part('sphere','#6d8e54',x,.19,1.73,.24,.18,.20);
    part('sphere',i%2?'#d8b765':'#bf839d',x,.28,1.73,.11,.065,.11);
  }
}
