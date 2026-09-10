import {businessSignPixels} from './business-signs.js';
import {renderParliament} from './parliament-geometry.js';

export const INSTITUTIONAL_TYPES=['parliament','institution','barracksSenyera','barracksEstelada'];

/** Local +Z is the entrance. Returns the mount of the permanent waving flag. */
export function renderInstitution(l,part,unit){
  if(l.type==='parliament')return renderParliament(l,part,unit);
  const parliament=l.type==='institution',w=3*unit-.12,d=(parliament?2:3)*unit-.12;
  const stone=parliament?'#cfb995':'#c4bda1',trim='#e9dcc0',glass='#486d72',wood='#6e5942';
  const box=(color,x,y,z,sx,sy,sz,rx=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx);
  const sign=(text,x,y,z,width)=>{
    box('#506457',x,y,z,width+.10,.20,.035);
    for(const p of businessSignPixels(text,width,.125))box('#fff1d0',x+p.x,y+p.y,z+.025,p.size,p.size,.012);
  };
  const roof=(x,z,width,depth,y,rise)=>{
    const run=depth/2+.035,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
    for(const side of [-1,1]){
      box('#ac7352',x,y+rise/2,z+side*run/2,width+.07,.06,length,side*angle);
      for(let i=0;i<Math.floor(width/.16);i++)box('#cc9867',x-width/2+.08+i*.16,y+rise/2+.034,z+side*run/2,.025,.018,length,side*angle);
    }
    part('cylinder','#bd875c',x,y+rise+.035,z,.07,width+.08,.07,0,0,Math.PI/2);
  };
  const window=(x,y,z,arched=false)=>{
    if(arched){part('arch',trim,x,y-.25,z,.36,.53,.045);part('arch',glass,x,y-.22,z+.027,.27,.45,.025);}
    else {box(trim,x,y,z,.35,.48,.045);box(glass,x,y,z+.027,.26,.38,.025);}
    box(trim,x,y,z+.045,.018,.38,.013);box(trim,x,y-.26,z+.028,.39,.05,.09);
  };
  box('#b6ab91',0,.04,0,w,.08,d);box('#d5cfb9',0,.087,0,w-.03,.014,d-.03);
  if(parliament){
    // Symmetrical stone palace, two floors, central portico and balcony.
    box(stone,0,1.09,-.20,3.42,1.98,1.72);
    for(const y of [.18,1.13,2.08])box(trim,0,y,-.20,3.52,.075,1.80);
    roof(0,-.20,3.50,1.82,2.13,.28);
    for(const x of [-1.33,-.88,.88,1.33])for(const y of [.60,1.62])window(x,y,.681,y>1);
    for(const x of [-1.32,-.66,0,.66,1.32])for(const y of [.61,1.62]){
      box(trim,x,y,-1.083,.34,.49,.035);box(glass,x,y,-1.107,.25,.39,.02);
    }
    for(const side of [-1,1])for(const z of [-.72,.25])for(const y of [.61,1.62]){
      box(trim,side*1.727,y,z,.035,.49,.34);box(glass,side*1.752,y,z,.02,.39,.25);
    }
    part('arch',trim,0,.16,.687,.71,.80,.07);part('arch',wood,0,.18,.735,.57,.74,.04);
    box('#c9ac6b',0,.52,.76,.022,.59,.019);
    for(const x of [-.61,-.36,.36,.61]){
      part('cylinder',trim,x,.65,.97,.085,.98,.085);
      for(const y of [.19,1.14])box(stone,x,y,.97,.15,.07,.15);
    }
    box(trim,0,1.23,.86,1.46,.14,.43);
    for(let i=0;i<3;i++)box(trim,0,.105+i*.036,1.13-i*.07,1.49-i*.10,.065,.20);
    for(const x of [-.24,.24])window(x,1.70,.70,true);
    box(trim,0,1.42,.90,1.29,.07,.39);
    for(let i=-5;i<=5;i++)box('#4b5c50',i*.112,1.65,1.078,.022,.40,.022);
    box('#4b5c50',0,1.86,1.078,1.22,.035,.035);
    sign(l.signName??'INSTITUCIÓ',0,1.23,1.091,1.25);
    part('gable',trim,0,2.12,.70,1.38,.64,.16);
    part('cylinder','#89958b',-.47,2.19,.95,.030,1.01,.030);
    for(const y of [1.75,2.04])box('#89958b',-.47,y,.83,.045,.05,.25);
    part('sphere','#d7b467',-.47,2.72,.95,.062,.062,.062);
    return {type:'senyera',u:-.45,y:2.23,v:.95,scale:.67};
  }
  // Barracks: rear accommodation, side wings and a paved open muster courtyard.
  box(stone,0,1.03,-1.16,3.42,1.88,1.12);
  for(const y of [.17,1.04,1.97])box(trim,0,y,-1.16,3.49,.065,1.18);
  roof(0,-1.16,3.48,1.18,2.01,.25);
  for(const x of [-1.30,-.84,-.38,.38,.84,1.30])for(const y of [.59,1.50])window(x,y,-.575);
  box(trim,0,.49,-.578,.43,.79,.055);box(wood,0,.48,-.539,.33,.69,.026);
  for(const side of [-1,1]){
    box('#b5b69b',side*1.42,.66,.10,.54,1.12,1.33);roof(side*1.42,.10,.60,1.40,1.24,.17);
    window(side*1.42,.68,.789);
    box(stone,side*1.82,.27,.07,.065,.35,3.48);
    for(const z of [-1.52,-.72,.08,.88,1.64])box('#62705a',side*1.82,.63,z,.035,.77,.035);
    for(const y of [.55,.90])box('#62705a',side*1.82,y,.07,.027,.025,3.48);
    box(stone,side*1.18,.29,1.76,1.31,.40,.12);
    for(let i=0;i<8;i++)box('#62705a',side*(.61+i*.16),.67,1.76,.027,.47,.027);
    box('#62705a',side*1.18,.91,1.76,1.33,.025,.035);
    box(trim,side*.52,.65,1.76,.14,1.10,.19);
  }
  box('#bac0ae',0,.101,.30,2.10,.015,1.71);
  for(const x of [-.75,-.25,.25,.75])box('#e7debf',x,.113,.43,.026,.009,.91);
  box('#d8cbb0',-1.25,.64,1.31,.64,1.08,.62);roof(-1.25,1.31,.69,.66,1.22,.16);
  box(glass,-1.25,.82,1.633,.44,.33,.023);box(wood,-1.25,.32,1.631,.30,.40,.022);
  sign(l.signName??'CASERNA',0,1.23,1.77,1.12);
  part('cylinder',trim,.73,.14,1.39,.29,.10,.29);
  part('cylinder','#919b90',.73,1.41,1.39,.038,2.46,.038);
  part('sphere','#d7b467',.73,2.67,1.39,.066,.066,.066);
  return {type:l.type==='barracksEstelada'?'estelada':'senyera',u:.754,y:2.02,v:1.39,scale:.82};
}
