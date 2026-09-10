import {businessSignPixels} from './business-signs.js';

/** A full-width ground-floor arcade supports an equally wide usable balcony. */
export function renderParliament(l,part,unit){
  const stone='#cfb995',trim='#ecdfc3',glass='#486d72',metal='#4b5c50',width=4.9;
  const box=(color,x,y,z,sx,sy,sz,rx=0)=>part('box',color,x,y,z,sx,sy,sz,0,rx);
  const front=1.29,arcade=2.13,balconyDepth=1.10,balconyZ=1.82;
  box('#b6ab91',0,.045,0,4*unit-.12,.09,4*unit-.12);
  box('#d5cfb9',0,.10,0,4*unit-.15,.02,4*unit-.15);
  box(stone,0,1.49,-.55,width,2.72,3.68);
  for(const y of [.22,1.59,2.88])box(trim,0,y,-.55,width+.055,.075,3.73);
  // A continuous covered passage, with seven real openings and no solid infill.
  box(trim,0,.155,balconyZ,width,.07,balconyDepth);
  for(let i=0;i<7;i++){
    const x=(i-3)*.70;
    part('wallGate',stone,x,.18,arcade,.70,1.36/1.22,.19);
    part('wallGateTrim',trim,x,.18,arcade+.016,.70,1.36/1.22,.22);
  }
  // The slab is both the portico roof and the balcony floor, exactly as wide.
  box(trim,0,1.60,balconyZ,width,.13,balconyDepth);
  for(let i=0;i<3;i++)box(trim,0,.115+i*.025,2.46-i*.09,width,.05,.19);
  const window=(x,y,z)=>{
    part('arch',trim,x,y,z,.46,.70,.044);
    part('arch',glass,x,y+.035,z+.029,.35,.62,.026);
    box(trim,x,y+.30,z+.047,.018,.55,.015);
    box(trim,x,y-.015,z+.025,.50,.045,.10);
  };
  for(const x of [-2.10,-1.40,-.70,.70,1.40,2.10]){
    window(x,.45,front+.025);window(x,1.91,front+.025);
  }
  for(const [y,h] of [[.21,1.06],[1.69,1.03]]){
    part('arch',trim,0,y,front+.029,.72,h,.055);
    part('arch','#6e5942',0,y+.035,front+.065,.58,h-.075,.027);
    box('#c9ac6b',0,y+h*.43,front+.088,.022,h*.70,.018);
  }
  // Front and return balustrades leave the balcony connected to its central door.
  const railZ=balconyZ+balconyDepth/2-.045;
  for(let i=0;i<=40;i++)box(metal,-2.39+i*4.78/40,1.88,railZ,.024,.43,.024);
  box(metal,0,2.10,railZ,width,.045,.045);
  for(const side of [-1,1]){
    for(let i=0;i<9;i++)box(metal,side*2.42,1.88,front+.065+i*.117,.024,.43,.024);
    box(metal,side*2.42,2.10,balconyZ,.045,.045,balconyDepth-.04);
    for(const z of [-1.91,-1.04,-.17,.70])for(const y of [.83,2.21]){
      box(trim,side*2.47,y,z,.035,.68,.45);box(glass,side*2.495,y,z,.021,.56,.34);
      box(trim,side*2.51,y,z,.012,.55,.020);
    }
  }
  for(const x of [-2.05,-1.23,-.41,.41,1.23,2.05])for(const y of [.83,2.21]){
    box(trim,x,y,-2.408,.45,.68,.033);box(glass,x,y,-2.433,.34,.56,.021);
  }
  // Broad tiled roof; the porch remains visibly in front of the main building.
  const run=1.89,rise=.32,angle=Math.atan2(rise,run),length=Math.hypot(run,rise);
  for(const side of [-1,1]){
    box('#ac7352',0,3.075,-.55+side*run/2,4.98,.06,length,side*angle);
    for(let i=0;i<31;i++)box('#cc9867',-2.4+i*.16,3.110,-.55+side*run/2,.025,.017,length,side*angle);
  }
  part('cylinder','#bd875c',0,3.275,-.55,.07,5.0,.07,0,0,Math.PI/2);
  part('gable',trim,0,2.91,front+.05,1.45,.63,.16);
  box('#506457',0,1.60,2.39,1.47,.15,.028);
  for(const p of businessSignPixels(l.signName??'PARLAMENT',1.36,.105))box('#fff1d0',p.x,1.60+p.y,2.412,p.size,p.size,.012);
  // The mast is centred on the balcony's front edge, anchored to its floor.
  part('cylinder','#89958b',0,2.63,railZ,.034,1.94,.034);
  for(const y of [1.72,2.10])box('#89958b',0,y,railZ,.085,.04,.065);
  part('sphere','#d7b467',0,3.63,railZ,.068,.068,.068);
  return {type:'senyera',u:.021,y:2.91,v:railZ,scale:.94};
}
