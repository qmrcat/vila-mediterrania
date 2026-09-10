import {businessSignPixels} from './business-signs.js';

/** Civic buildings in local coordinates, rotated by the landmark renderer. */
export function renderCivicBuilding(l,part,unit){
  const hospital=l.type==='hospital',school=l.type==='school',large=l.size===6;
  const w=(large?3:2)*unit-.12,depth=(l.type==='police'?1:2)*unit-.12;
  const box=(color,u,h,v,sx,sy,sz,rx=0)=>part('box',color,u,h,v,sx,sy,sz,0,rx);
  const wall=hospital?'#eee9da':school?'#e0bc80':'#dddcd2',accent=hospital?'#488e8c':school?'#aa6546':'#365d85';
  const floors=hospital&&large?3:2,floor=.78,buildingDepth=school?1.50:depth-.37;
  const center=school?-.40:-.10,front=center+buildingDepth/2,back=center-buildingDepth/2,top=.10+floors*floor;
  box('#c9bda6',0,.04,0,w+.04,.08,depth+.04);
  box(school?'#dbcfae':'#e4ddc9',0,.087,0,w,.014,depth);
  box(wall,0,.10+floors*floor/2,center,w-.10,floors*floor,buildingDepth);
  for(let i=0;i<=floors;i++)box(i===0?accent:'#f3ecd9',0,.13+i*floor,center,w-.04,.07,buildingDepth+.035);
  const sign=(text,u,h,v,width)=>{
    box(accent,u,h,v,width+.12,.20,.035);
    for(const p of businessSignPixels(text,width))box('#fff6df',u+p.x,h+p.y,v+.023,p.size,p.size,.012);
  };
  const window=(u,h,v,normal=1)=>{
    box('#f4eddc',u,h,v,.39,.43,.045);box('#558a9b',u,h,v+normal*.025,.30,.34,.018);
    box('#d6e6df',u,h,v+normal*.038,.018,.34,.01);box('#d6e6df',u,h,v+normal*.038,.30,.018,.01);
  };
  const columns=large?6:4;
  for(let row=0;row<floors;row++){
    const y=.51+row*floor;
    for(let col=0;col<columns;col++){
      const u=(col-(columns-1)/2)*(w-.48)/columns;
      // Central entrance and its sign take the two middle bays downstairs.
      if(row!==0||Math.abs(u)>.45)window(u,y,front+.021);
      window(u,y,back-.042,-1);
    }
    for(const side of [-1,1])for(const v of [-.28,.28]){
      box('#f4eddc',side*(w-.10)/2,y,center+v,.038,.43,.34);
      box('#558a9b',side*((w-.10)/2+.026),y,center+v,.018,.33,.25);
      box('#d6e6df',side*((w-.10)/2+.039),y,center+v,.01,.33,.014);
    }
  }
  box('#f3ecda',0,.44,front+.04,.70,.69,.065);
  box('#3e6a7a',0,.42,front+.08,.58,.61,.025);
  box('#d9e1d5',0,.42,front+.10,.027,.60,.017);
  for(const side of [-1,1])box('#dfcf91',side*.053,.42,front+.115,.014,.12,.015);
  sign(l.signName??(hospital?'HOSPITAL':school?'ESCOLA':'POLICIA'),0,.91,front+.035,school?1.15:1.30);
  // Level threshold and shallow canopy remain within the reserved footprint.
  box('#eee6d4',0,.10,front+.13,.77,.04,.28);
  if(hospital){
    box(accent,0,.79,front+.17,.91,.055,.37);
    for(const side of [-1,1])box('#d9e4df',side*.41,.43,front+.29,.025,.70,.025);
    // Teal medical cross on the roof parapet, a separate identifiable silhouette.
    box('#ece8d9',0,top+.17,front-.18,.61,.38,.12);
    box(accent,0,top+.19,front-.11,.10,.27,.035);box(accent,0,top+.19,front-.11,.28,.10,.035);
    for(const side of [-1,1]){
      box('#d4d8cb',side*(w/2-.44),top+.14,center-.20,.40,.20,.43);
      for(let i=0;i<4;i++)box('#8da3a0',side*(w/2-.44),top+.246,center-.34+i*.085,.31,.012,.025);
    }
    if(large)sign('URGÈNCIES',-1.25,.91,front+.039,.76);
  }else if(school){
    // Two tiled roof planes, with a ridge along the building's long axis.
    const run=buildingDepth/2+.05,rise=.37,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
    for(const side of [-1,1]){
      box('#c88754',0,top+rise/2,center+side*run/2,w+.035,.06,length,side*angle);
      for(let i=0;i<Math.floor(w/.14);i++)box('#e4b57b',-w/2+.07+i*.14,top+rise/2+.034,center+side*run/2,.018,.017,length,side*angle);
    }
    part('cylinder','#ae6948',0,top+rise+.035,center,.075,w+.06,.075,0,0,Math.PI/2);
    // Enclosed front play yard: coloured hopscotch and a small basketball hoop.
    const yardZ=.90;
    for(const side of [-1,1]){
      box('#769187',side*(w/2-.035),.24,yardZ,.035,.28,.60);
      box('#769187',side*(w/4+.16),.24,depth/2-.025,w/2-.32,.28,.035);
    }
    for(let i=0;i<4;i++){
      const u=-w/2+.30+i*.20;box(['#c67f60','#8baa9c','#d6ae5f','#8faeba'][i],u,.102,yardZ,.17,.018,.24);
    }
    box('#587d79',w/2-.35,.53,.92,.035,.87,.035);
    box('#efe8d5',w/2-.35,.91,.92,.39,.27,.035);
    box('#b66d4d',w/2-.35,.83,1.02,.21,.018,.15);
    if(large){
      box('#9d7b53',.38,.23,.80,.66,.055,.18);
      for(const side of [-1,1])box('#587d79',.38+side*.24,.16,.80,.035,.13,.15);
      box('#9d7b53',.38,.34,.73,.66,.18,.025);
    }
  }else{
    // Blue-and-cream chequered band and a badge above the flat roof.
    for(let i=0;i<16;i++)box(i%2?accent:'#f3ecd9',-w/2+.12+i*(w-.24)/15,1.12,front+.033,(w-.24)/16,.08,.022);
    box(accent,0,top+.18,front-.08,.27,.33,.075);
    part('cone','#d7bd72',0,top+.11,front-.031,.17,.20,.023,0,0,Math.PI);
    box('#d7bd72',0,top+.235,front-.031,.17,.065,.023);
    part('cylinder','#4d6579',w/2-.25,top+.22,center-.22,.017,.44,.017);
  }
  if(!school){
    box('#d8d4c5',0,top+.035,center,w+.025,.07,buildingDepth+.10);
    for(const side of [-1,1]){
      box(wall,side*(w/2-.02),top+.11,center,.045,.15,buildingDepth+.09);
      box(wall,0,top+.11,center+side*(buildingDepth/2+.025),w,.15,.045);
    }
  }
}
