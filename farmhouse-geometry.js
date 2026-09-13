import {businessSignPixels} from './business-signs.js';

/** Stone farmhouse: compact, longitudinal or broad with an entrance porch. */
export function renderFarmhouse(l,part,unit){
  const large=l.size===4,long=l.size===2,w=large?2.06:1.04,depth=large?1.82:long?2.26:1.04;
  const zc=large?-.22:0,front=zc+depth/2,back=zc-depth/2,top=large?1.76:1.56,rise=large?.44:.34;
  const wall='#c9b995',stone='#b6a482',trim='#e4d5b5',wood='#72563b',glass='#526c66',tiles='#b87850';
  const box=(color,x,y,z,sx,sy,sz,rx=0,rz=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx,rz);
  box('#c1b291',0,.035,0,(large?2:1)*unit-.03,.07,(l.size===1?1:2)*unit-.03);
  box(wall,0,(top+.07)/2,zc,w,top-.07,depth);
  // Irregular masonry courses, with carved corner blocks.
  for(let row=0;row<Math.floor(top/.16);row++){
    const y=.14+row*.16,color=row%3===0?'#d6c7a8':stone;
    for(let i=0;i<Math.floor(w/.23);i++){
      const x=-w/2+.13+i*.23+(row%2)*.035;if(x>w/2-.09)continue;
      for(const z of [front+.004,back-.004])box(color,x,y,z,.15+(i%2)*.035,.067,.016);
    }
    for(let i=0;i<Math.floor(depth/.25);i++)for(const side of [-1,1])box(color,side*(w/2+.004),y,back+.13+i*.25,.016,.067,.16);
    for(const side of [-1,1])for(const z of [front+.012,back-.012])box(trim,side*(w/2-.045),y,z,.10,.12,.032);
  }
  const window=(x,y,z,side=1,width=.23)=>{
    box(trim,x,y,z,width+.075,.36,.025);
    box(glass,x,y,z+side*.020,width,.29,.023);
    for(const hand of [-1,1])box(wood,x+hand*(width/2+.035),y,z+side*.034,.068,.31,.028);
    box(trim,x,y-.185,z+side*.045,width+.12,.045,.11);
    box('#ac9874',x,y,z+side*.036,.016,.28,.014);
  };
  for(const x of large?[-.63,0,.63]:[0])window(x,large?1.34:1.19,front+.028);
  for(const x of large?[-.6,.6]:[0])window(x,1.14,back-.028,-1);
  for(const side of [-1,1])for(let i=0;i<(long?3:large?2:1);i++){
    const z=back+depth*(i+1)/((long?3:large?2:1)+1);
    for(const y of [.48,1.16]){
      box(trim,side*(w/2+.025),y,z,.025,.34,.25);
      box(wood,side*(w/2+.046),y,z,.023,.27,.19);
      box(trim,side*(w/2+.048),y-.18,z,.095,.045,.30);
    }
  }
  // Closed arched timber door, with individually expressed voussoirs.
  const doorWidth=large?.51:.36,doorHeight=large?.69:.61;
  part('arch',trim,0,.08,front+.029,doorWidth+.12,doorHeight+.07,.036);
  part('arch',wood,0,.10,front+.055,doorWidth,doorHeight,.028);
  const radius=(doorWidth+.055)/2,center=.10+doorHeight-doorWidth/2;
  for(let i=0;i<=8;i++){
    const a=i*Math.PI/8;box(i%2?trim:'#d8c39d',Math.cos(a)*radius,center+Math.sin(a)*radius,front+.079,.074,.065,.039,0,a-Math.PI/2);
  }
  box('#b9a37b',0,.33,front+.078,.013,.46,.012);
  for(const x of [-doorWidth*.25,doorWidth*.25])for(const y of [.25,.45])box('#4b5147',x,y,front+.083,doorWidth*.39,.022,.017);
  box(trim,0,.085,front+.055,doorWidth+.20,.07,.12);
  if(l.signName){
    const labelWidth=large?.67:.48,labelY=large?1.08:.86;
    box('#ece2c9',0,labelY,front+.033,labelWidth+.06,.14,.026);
    for(const p of businessSignPixels(l.signName,labelWidth,.08))box('#48665b',p.x,labelY+p.y,front+.053,p.size,p.size,.012);
  }
  // Gables close the roof, with a small attic opening on the principal front.
  part('gable',wall,0,top,zc,w,rise/.42,depth);
  part('arch',trim,0,top+.055,front+.015,.17,.16,.025);
  part('arch',wood,0,top+.064,front+.033,.12,.125,.017);
  const run=w/2+.065,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
  for(const side of [-1,1]){
    box(tiles,side*run/2,top+rise/2,zc,length,.055,depth+.12,0,-side*angle);
    const count=Math.ceil(depth/.13);
    for(let i=0;i<count;i++)box('#d69c6b',side*run/2,top+rise/2+.034,back+.04+i*.13,length,.017,.021,0,-side*angle);
  }
  box('#cd9162',0,top+rise+.018,zc,.075,.055,depth+.14);
  const chimneyX=-w*.28,chimneyZ=back+depth*.32,chimneyBottom=top+rise*.38;
  box('#e4d8bd',chimneyX,chimneyBottom+.21,chimneyZ,.13,.42,.15);
  box('#9a6548',chimneyX,chimneyBottom+.435,chimneyZ,.19,.055,.21);
  if(large){
    // Open porch leaves a straight passage from the front edge to the door.
    box(trim,0,.075,1.01,1.83,.08,.43);
    for(const x of [-.76,.76]){
      box(stone,x,.48,1.055,.13,.78,.13);
      box(trim,x,.11,1.055,.20,.11,.20);
    }
    box(wood,0,.89,1.055,1.82,.09,.14);
    box(tiles,0,.985,.94,1.92,.055,.55,.16);
    for(let i=-6;i<=6;i++)box('#d69c6b',i*.14,1.018,.94,.025,.017,.55,.16);
    box(wood,-.82,.23,.92,.26,.09,.27);
    part('cylinder',wood,.95,.21,.98,.20,.31,.20);
    for(const y of [.13,.29])part('cylinder','#4b5147',.95,y,.98,.207,.024,.207);
  }
}
