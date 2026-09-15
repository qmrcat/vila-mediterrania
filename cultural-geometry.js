import {COMMUNITY_TYPES,renderCommunityBuilding} from './community-geometry.js';
import {businessSignPixels} from './business-signs.js';
export const CULTURAL_TYPES=['museum','monastery',...COMMUNITY_TYPES];

/** Compact Catalan-inspired stone architecture, with an open cloister rather than a solid block. */
export function renderCulturalBuilding(l,part,unit){
  if(COMMUNITY_TYPES.includes(l.type)){renderCommunityBuilding(l,part,unit);return;}
  const monastery=l.type==='monastery',w=(monastery?3:2)*unit-.12;
  const stone=monastery?'#c3b28e':'#d8c9ac',trim='#e7d9b9',shade='#a59577',glass='#557987',wood='#795d41';
  const box=(color,x,y,z,sx,sy,sz,rx=0,rz=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx,rz);
  const sign=(text,x,y,z,width)=>{
    box('#6b796d',x,y,z,width+.09,.17,.026);
    for(const p of businessSignPixels(text,width,.105))box('#fff1d0',x+p.x,y+p.y,z+.019,p.size,p.size,.010);
  };
  const roof=(x,z,width,depth,top,rise)=>{
    const run=depth/2+.045,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
    for(const side of [-1,1]){
      box('#ae7954',x,top+rise/2,z+side*run/2,width+.06,.055,length,side*angle);
      for(let i=0;i<Math.floor(width/.15);i++)box('#c89a6b',x-width/2+.075+i*.15,top+rise/2+.032,z+side*run/2,.022,.014,length,side*angle);
    }
    part('cylinder','#a97550',x,top+rise+.026,z,.062,width+.07,.062,0,0,Math.PI/2);
  };
  box('#b9aa8d',0,.04,0,w,.08,w);box('#ddd0af',0,.086,0,w-.04,.015,w-.04);
  if(!monastery){
    const front=.63,back=-1.05;
    box(stone,0,1.065,-.21,2.22,1.95,1.68);
    for(const y of [.14,1.16,2.045])box(trim,0,y,-.21,2.30,.065,1.74);
    // Tall glazed upper galleries, framed in carved stone.
    for(const z of [front+.023,back-.023])for(const x of [-.71,0,.71]){
      const side=z>0?1:-1;
      part('arch',trim,x,1.30,z,.37,.46,.026,side<0?Math.PI:0);
      part('arch',glass,x,1.33,z+side*.026,.28,.38,.022,side<0?Math.PI:0);
      box('#b9d0c9',x,1.55,z+side*.054,.016,.38,.010);
    }
    for(const side of [-1,1])for(const z of [-.67,.19]){
      box(trim,side*1.124,1.57,z,.025,.52,.39);
      box(glass,side*1.144,1.57,z,.018,.42,.30);
      box('#b9d0c9',side*1.159,1.57,z,.008,.40,.015);
    }
    part('arch',trim,0,.13,front+.025,.65,.65,.035);
    part('arch',wood,0,.155,front+.06,.51,.57,.026);
    box('#caa764',0,.46,front+.09,.021,.41,.018);
    // A shallow four-column portico and two broad steps.
    for(const x of [-.62,-.39,.39,.62]){
      part('cylinder',trim,x,.53,.91,.082,.75,.082);
      for(const y of [.16,.92])box(stone,x,y,.91,.14,.07,.14);
    }
    box(trim,0,.976,.85,1.46,.08,.43);sign(l.signName??'MUSEU',0,1.073,1.02,1.12);
    for(let i=0;i<2;i++)box(trim,0,.09+i*.035,1.14-i*.14,1.43-i*.09,.065+i*.035,.24);
    // Outdoor display plinths with an amphora and a stone sculpture.
    for(const x of [-.94,.94])box(shade,x,.23,.96,.22,.27,.23);
    part('sphere','#aa7752',-.94,.48,.96,.17,.27,.16);
    part('cylinder','#aa7752',-.94,.64,.96,.071,.09,.071);
    for(const side of [-1,1])part('ring','#aa7752',-.94+side*.072,.55,.96,.072,.106,.022);
    part('sphere','#cdc7b4',.94,.54,.96,.17,.22,.15);box('#cdc7b4',.94,.405,.96,.16,.10,.14);
    for(const side of [-1,1])part('gable',stone,side*1.115,2.04,-.21,1.68,.95,.032,Math.PI/2);
    roof(0,-.21,2.26,1.72,2.085,.37);return;
  }
  // Church along the west side: a long nave, stone buttresses and a rose window.
  const cx=-1.34,churchFront=1.51;
  box(stone,cx,.94,-.11,.88,1.70,3.24);
  for(const side of [-1,1])for(const z of [-1.39,-.66,.07,.80])box(shade,cx+side*.465,.64,z,.095,1.08,.14);
  // Roof ridge follows the long axis of the nave.
  const rise=.37,run=.49,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
  for(const side of [-1,1]){
    box('#ae7954',cx+side*run/2,1.83+rise/2,-.11,length,.055,3.33,0,-side*angle);
    for(let i=0;i<19;i++)box('#c89a6b',cx+side*run/2,1.83+rise/2+.033,-1.66+i*.17,length,.014,.022,0,-side*angle);
  }
  for(const z of [-1.73,churchFront])part('gable',stone,cx,1.79,z,.88,.97,.034);
  box('#a97550',cx,2.23,-.11,.073,.063,3.35);
  part('arch',trim,cx,.12,churchFront+.025,.63,.70,.028);
  part('arch',wood,cx,.15,churchFront+.054,.49,.59,.024);
  part('sphere',glass,cx,1.35,churchFront+.032,.30,.30,.020);
  part('ring',trim,cx,1.35,churchFront+.054,.34,.34,.026);
  for(let i=0;i<6;i++)part('box',trim,cx,1.35,churchFront+.070,.018,.29,.015,0,0,i*Math.PI/3);
  // Square bell tower, with paired arched belfry openings and a modest cross.
  const tz=-1.32;
  box(stone,cx,1.31,tz,.56,2.44,.56);
  for(const y of [1.88,2.58])box(trim,cx,y,tz,.62,.065,.62);
  for(let d=0;d<4;d++){
    const a=d*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    for(const u of [-.13,.13]){
      part('arch','#4f5146',cx+c*u+s*.286,2.055,tz-s*u+c*.286,.17,.36,.018,a);
      part('cone','#a99251',cx+c*u+s*.30,2.13,tz-s*u+c*.30,.092,.095,.068,a);
    }
  }
  box(shade,cx,2.665,tz,.65,.105,.65);
  box('#827c66',cx,2.895,tz,.035,.36,.035);box('#827c66',cx,2.94,tz,.18,.028,.035);
  // Outer enclosure around three sides of the cloister.
  box(stone,.59,.52,-1.70,2.22,.86,.18);
  box(stone,1.70,.52,0,.18,.86,3.40);
  const gateX=.59,gateWidth=.64,gateZ=1.70;
  for(const [x,width] of [[-.15,.84],[1.33,.84]])box(stone,x,.52,gateZ,width,.86,.18);
  part('wallGate',stone,gateX,.09,gateZ,gateWidth,.86/1.22,.18);
  part('wallGateTrim',trim,gateX,.09,gateZ,gateWidth,.86/1.22,.21);
  sign(l.signName??'MONESTIR',gateX,1.10,gateZ+.045,1.04);
  // Each gallery has genuine open arches facing the central garden.
  const gx=.59,halfX=.65,halfZ=.80;
  for(const side of [-1,1])for(let col=0;col<3;col++){
    const x=gx+(col-1)*.435,z=side*halfZ;
    part('wallGate',stone,x,.095,z,.435,.83/1.22,.12);
    part('wallGateTrim',trim,x,.095,z,.435,.83/1.22,.135);
  }
  for(const side of [-1,1])for(let col=0;col<4;col++){
    const x=gx+side*halfX,z=(col-1.5)*.40;
    part('wallGate',stone,x,.095,z,.40,.83/1.22,.12,Math.PI/2);
    part('wallGateTrim',trim,x,.095,z,.40,.83/1.22,.135,Math.PI/2);
  }
  // Covered galleries surround a roofless garden; no slab spans the courtyard.
  for(const side of [-1,1])roof(gx,side*1.25,2.20,.70,.96,.18);
  for(const [x,width] of [[-.33,.43],[1.48,.43]])roof(x,0,width,1.68,.96,.16);
  box('#829669',gx,.101,0,1.11,.02,1.39);
  box('#d3c29c',gx,.118,0,.20,.02,1.41);box('#d3c29c',gx,.119,0,1.12,.02,.19);
  // A hollow stone well with a dark water surface.
  part('cylinder',stone,gx,.165,0,.31,.13,.31);
  part('cylinder','#526e6b',gx,.237,0,.23,.009,.23);
  part('ring',trim,gx,.24,0,.31,.31,.19,0,Math.PI/2);
  for(const x of [-.40,.40])for(const z of [-.50,.50]){
    part('sphere','#607d4f',gx+x,.185,z,.18,.16,.18);
    part('sphere','#bda276',gx+x,.275,z,.063,.036,.065);
  }
}
