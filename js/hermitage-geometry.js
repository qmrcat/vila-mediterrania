/** Small Romanesque chapel: a stone nave, rounded apse and open bell gable. */
export function renderHermitage(l,part,unit){
  const long=l.size===2,w=long?.90:.82,front=long?.98:.40,back=long?-.80:-.27,depth=front-back,zc=(front+back)/2,top=long?.99:.87,rise=.24;
  const wall='#b9ae94',stone='#a5997f',trim='#d8cbb0',roof='#ab7653',wood='#6b533a',dark='#484b40';
  const box=(color,x,y,z,sx,sy,sz,rx=0,rz=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx,rz);
  box('#c7baa0',0,.035,0,unit-.035,.07,l.size*unit-.035);
  const radius=long?.32:.27,apseTop=top*.80;
  part('cylinder',wall,0,(apseTop+.07)/2,back,radius*2,apseTop-.07,radius*2);
  part('cone',roof,0,apseTop+.105,back,radius*2+.065,.21,radius*2+.065);
  // Pilaster strips and horizontal stone courses articulate the curved rear wall.
  for(let i=0;i<=6;i++){
    const a=-Math.PI/2+i*Math.PI/6,x=Math.sin(a)*radius,z=back-Math.cos(a)*radius;
    part('box',trim,x,apseTop*.5,z,.038,apseTop-.14,.025,Math.PI-a);
  }
  for(let row=0;row<4;row++)for(let i=0;i<8;i++){
    const a=-Math.PI/2+i*Math.PI/7;
    part('box',row%2?stone:trim,Math.sin(a)*radius,.16+row*.14,back-Math.cos(a)*radius,.08,.035,.018,Math.PI-a);
  }
  box(wall,0,(top+.07)/2,zc,w,top-.07,depth);
  for(let row=0;row<Math.floor(top/.13);row++){
    for(const side of [-1,1])for(let i=0;i<Math.floor(depth/.16);i++)box(row%2?stone:'#c8bca1',side*(w/2+.006),.14+row*.13,back+.08+i*.16,.018,.055,.10);
    for(let i=-2;i<=2;i++)box(row%2?stone:'#c8bca1',i*.15+(row%2)*.015,.14+row*.13,front+.006,.10,.053,.018);
  }
  // Arched wooden portal with concentric carved stone surround.
  part('arch',trim,0,.08,front+.018,.35,.47,.030);
  part('arch',stone,0,.085,front+.05,.285,.42,.020);
  part('arch',wood,0,.09,front+.074,.23,.38,.016);
  for(const y of [.20,.34])box('#3e443c',0,y,front+.095,.20,.018,.010);
  box(trim,0,.07,front+.092,.43,.07,.12);
  part('arch',trim,0,top-.20,front+.02,.12,.16,.025);
  part('arch',dark,0,top-.183,front+.05,.070,.12,.017);
  for(const side of [-1,1])for(let i=0;i<(long?3:1);i++){
    const z=back+depth*(i+1)/(long?4:2),yaw=side*Math.PI/2;
    part('arch',trim,side*(w/2+.015),.42,z,.13,.23,.025,yaw);
    part('arch',dark,side*(w/2+.044),.442,z,.075,.18,.018,yaw);
  }
  part('gable',wall,0,top,zc,w,rise/.42,depth);
  const run=w/2+.055,slope=Math.atan2(rise,run),length=Math.hypot(run,rise);
  for(const side of [-1,1]){
    box(roof,side*run/2,top+rise/2,zc,length,.042,depth+.085,0,-side*slope);
    for(let i=0;i<Math.ceil(depth/.12);i++)box('#c5956c',side*run/2,top+rise/2+.027,back+.01+i*.12,length,.013,.018,0,-side*slope);
  }
  box('#c28c62',0,top+rise+.016,zc,.065,.042,depth+.10);
  // Actual openings above the roof, with bronze bells suspended inside them.
  const bellBase=top+.20,bellZ=front-.055,bellWidth=long?.56:.38,bellHeight=long?.36:.32;
  box(trim,0,bellBase-.035,bellZ,bellWidth+.06,.075,.15);
  for(const x of long?[-.14,.14]:[0]){
    const span=long?.28:.38;
    part('wallGate',wall,x,bellBase,bellZ,span,bellHeight,.115);
    box(wood,x,bellBase+.20,bellZ,span*.52,.022,.095);
    part('cylinder','#a58c50',x,bellBase+.132,bellZ,.065,.09,.065);
    part('cone','#a58c50',x,bellBase+.099,bellZ,.099,.078,.099);
    part('sphere','#574d36',x,bellBase+.058,bellZ,.024,.034,.024);
  }
  const crown=bellBase+1.22*bellHeight;
  part('gable',trim,0,crown,bellZ,bellWidth+.065,.24,.14);
  box(trim,0,crown+.13,bellZ,.027,.16,.03);
  box(trim,0,crown+.159,bellZ,.105,.024,.03);
}
