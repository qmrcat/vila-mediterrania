/** An enclosed stone castle, with a real open portal and an open-air courtyard. */
export function renderCastle(l,part,unit){
  const large=l.size===9,w=(large?3:2)*unit-.12,edge=w/2-.14;
  const stone='#b8aa8d',light='#d5c7a7',mortar='#928973',dark='#444a40';
  const wallTop=large?1.56:1.38,towerTop=large?2.04:1.84,keepTop=large?2.45:2.05;
  const box=(color,u,y,v,sx,sy,sz,yaw=0)=>part('box',color,u,y,v,sx,sy,sz,yaw);
  box('#bbae90',0,.04,0,w,.08,w);
  box('#d1c3a2',0,.089,0,w-.06,.018,w-.06);
  // Flagstones inside the bailey; the strip under the portal is kept level.
  for(let u=-edge+.38;u<edge-.22;u+=.30)for(let v=-edge+.38;v<edge-.15;v+=.30)
    box('#ddd0ae',u,.103,v,.275,.012,.275);

  function wall(u,v,length,yaw=0){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const piece=(color,x,y,z,sx,sy,sz)=>box(color,u+c*x+s*z,y,v-s*x+c*z,sx,sy,sz,yaw);
    piece(mortar,0,(wallTop+.10)/2,0,length,wallTop-.10,.26);
    const columns=Math.max(1,Math.ceil(length/.29)),step=length/columns,rows=Math.ceil((wallTop-.12)/.19),rise=(wallTop-.12)/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<=columns;col++){
      const left=Math.max(-length/2,-length/2+(col-(row%2?.5:0))*step),right=Math.min(length/2,-length/2+(col+1-(row%2?.5:0))*step);
      if(right-left<.025)continue;
      for(const side of [-1,1])piece((col+row)%3?stone:'#c2b496',(left+right)/2,.12+(row+.5)*rise,side*.135,right-left-.014,rise-.014,.016);
    }
    piece(light,0,wallTop+.025,0,length+.02,.07,.32);
    const count=Math.max(1,Math.round(length/.32));
    for(let i=0;i<count;i++)piece(stone,-length/2+(i+.5)*length/count,wallTop+.16,0,Math.min(.18,step*.7),.23,.29);
  }
  wall(0,-edge,2*edge);wall(-edge,0,2*edge,Math.PI/2);wall(edge,0,2*edge,Math.PI/2);
  const gateWidth=1.30,wing=edge-gateWidth/2;
  for(const side of [-1,1])wall(side*(edge+gateWidth/2)/2,edge,wing);
  // Reuse the masonry arch mesh: its centre is empty all the way through.
  part('wallGate',stone,0,.10,edge,gateWidth,(wallTop-.10)/1.22,.26);
  part('wallGateTrim',light,0,.10,edge,gateWidth,(wallTop-.10)/1.22,.295);
  box(light,0,wallTop+.025,edge,gateWidth,.07,.32);
  for(const u of [-.48,-.16,.16,.48])box(stone,u,wallTop+.16,edge,.17,.23,.29);
  box('#e1d4b4',0,.106,edge-.03,.69,.032,.44);
  // A raised grille at the crown leaves the lower entrance entirely open.
  for(const u of [-.20,-.10,0,.10,.20])box('#626453',u,wallTop-.20,edge+.015,.017,.20,.022);

  function tower(u,v,width,top){
    box(stone,u,(top+.10)/2,v,width,top-.10,width);
    box(light,u,.16,v,width+.035,.12,width+.035);
    for(let row=1;row<Math.floor(top/.25);row++){
      const y=.12+row*.25;
      for(const side of [-1,1]){
        box(mortar,u,y,v+side*(width/2+.003),width,.011,.009);
        box(mortar,u+side*(width/2+.003),y,v,.009,.011,width);
        const offset=(row%2?.15:-.15)*width;
        box(mortar,u+offset,y+.11,v+side*(width/2+.007),.012,.21,.01);
        box(mortar,u+side*(width/2+.007),y+.11,v+offset,.01,.21,.012);
      }
    }
    // Narrow arrow slits on all four sides.
    for(const side of [-1,1]){
      box(dark,u,top-.51,v+side*(width/2+.008),.035,.26,.013);
      box(dark,u+side*(width/2+.008),top-.51,v,.013,.26,.035);
    }
    box(light,u,top+.025,v,width+.07,.09,width+.07);
    box('#9e967f',u,top+.077,v,width-.07,.014,width-.07);
    for(const side of [-1,1]){
      for(const offset of [-1,0,1])box(stone,u+offset*(width/2-.065),top+.19,v+side*(width/2-.035),.13,.24,.14);
      box(stone,u+side*(width/2-.035),top+.19,v,.14,.24,.14);
    }
  }
  const towerWidth=large?.62:.50,towerCenter=edge+.125-towerWidth/2;
  for(const x of [-1,1])for(const z of [-1,1])tower(x*towerCenter,z*towerCenter,towerWidth,towerTop);
  // A taller keep inside the enclosure, offset so the route from the gate is clear.
  const ku=large?-.48:-.28,kv=large?-.71:-.37,keepWidth=large?.98:.72;
  tower(ku,kv,keepWidth,keepTop);
  const front=kv+keepWidth/2;
  part('arch',light,ku,.11,front+.009,.34,.51,.025);
  part('arch','#705b3f',ku,.13,front+.037,.25,.44,.018);
  for(const offset of [-.18,.18]){
    part('arch',light,ku+offset,keepTop-.92,front+.012,.17,.29,.028);
    part('arch',dark,ku+offset,keepTop-.90,front+.040,.10,.24,.015);
  }
  if(large){
    // The larger courtyard contains a well and a stone bench.
    part('cylinder','#b4a587',.76,.22,.18,.48,.25,.48);
    part('cylinder','#536b68',.76,.352,.18,.31,.018,.31);
    for(const side of [-1,1])box(light,.76+side*.20,.60,.18,.065,.55,.065);
    box('#806c49',.76,.89,.18,.55,.08,.09);
    part('cylinder','#8d7960',.76,.62,.18,.012,.43,.012);
    box(light,.90,.26,-.73,.65,.09,.22);
    for(const side of [-1,1])box(stone,.90+side*.23,.17,-.73,.12,.14,.18);
  }
  // Senyera above the keep; returned attachment uses the same local frame.
  box('#7d7969',ku-.17,keepTop+.47,kv,.025,.90,.025);
  part('sphere','#d0b472',ku-.17,keepTop+.94,kv,.045,.045,.045);
  return {u:ku-.17,y:keepTop+.52,v:kv};
}
