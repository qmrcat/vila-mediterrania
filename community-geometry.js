import {businessSignPixels} from './business-signs.js';
export const COMMUNITY_TYPES=['theatre','cinema','library'];

/** Three public venues, in a 2 × 2 footprint; local +Z is the entrance. */
export function renderCommunityBuilding(l,part,unit){
  const theatre=l.type==='theatre',cinema=l.type==='cinema';
  const wall=theatre?'#d5b8a0':cinema?'#dfcdb0':'#d4dcc6';
  const trim='#ede1c5',dark='#354f52',wood='#806344',accent=theatre?'#8e4b4c':cinema?'#496f78':'#527766';
  const box=(color,x,y,z,sx,sy,sz)=>part('box',color,x,y,z,sx,sy,sz);
  const label=(text,y,z,width,bg=accent)=>{
    box(bg,0,y,z,width+.12,.22,.045);
    for(const p of businessSignPixels(text,width,.115))box('#fff0c8',p.x,y+p.y,z+.03,p.size,p.size,.012);
  };
  const poster=(x,z,color)=>{
    box(wood,x,.57,z,.32,.60,.04);box('#efdfb3',x,.57,z+.025,.275,.55,.015);
    part('sphere',color,x,.65,z+.04,.17,.21,.012);
    for(let i=0;i<3;i++)box(accent,x,.47-i*.055,z+.045,.18-i*.025,.015,.01);
  };
  const door=(x,width=.43)=>{
    box(trim,x,.46,.724,width+.075,.74,.032);box(dark,x,.445,.747,width,.67,.023);
    for(const side of [-1,1]){
      box('#7d9e9c',x+side*width/4,.54,.764,width/2-.035,.39,.014);
      box('#d7b363',x+side*.045,.37,.781,.014,.09,.014);
    }
    box(wood,x,.44,.774,.024,.68,.016);
  };
  box('#bdaf94',0,.045,0,unit*2-.045,.09,unit*2-.045);
  box(wall,0,1.06,-.20,2.22,1.94,1.82);
  for(const y of [.15,1.09,2.04])box(trim,0,y,-.20,2.30,.07,1.90);
  // Framed windows on both sides and at the back keep all orientations detailed.
  for(const side of [-1,1])for(const z of [-.74,.23])for(const y of [.55,1.55]){
    box(trim,side*1.125,y,z,.03,.52,.35);box(dark,side*1.146,y,z,.014,.43,.27);
    box('#8faeaa',side*1.157,y,z,.012,.40,.018);
  }
  for(const x of [-.72,0,.72]){
    box(trim,x,1.53,-1.123,.36,.55,.03);box(dark,x,1.53,-1.144,.28,.45,.014);
  }
  if(theatre){
    for(const x of [-.54,0,.54])door(x,.38);
    // A walkable portico: four columns supporting the balcony slab.
    for(const x of [-.95,-.33,.33,.95]){
      part('cylinder',trim,x,.58,1.08,.085,.84,.085);
      for(const y of [.17,.99])box(trim,x,y,1.08,.14,.085,.14);
    }
    box(trim,0,1.065,.98,2.19,.09,.54);
    for(let i=0;i<15;i++)box(dark,-1.01+i*2.02/14,1.26,1.21,.02,.32,.02);
    box(dark,0,1.43,1.21,2.06,.027,.03);
    for(const side of [-1,1])box(dark,side*1.03,1.43,.98,.026,.027,.47);
    for(const x of [-.65,0,.65]){
      part('arch',trim,x,1.22,.719,.40,.54,.032);
      part('arch',accent,x,1.25,.756,.31,.46,.022);
      box('#d4ae69',x,1.50,.783,.025,.41,.012);
    }
    poster(-.92,.735,'#975a55');poster(.92,.735,'#748963');
    label(l.signName??'TEATRE',1.93,.777,1.51);
    part('gable',wall,0,2.08,-.20,2.25,.85,1.87);
    const run=1.16,rise=.36,len=Math.hypot(run,rise),angle=Math.atan2(rise,run);
    for(const side of [-1,1])part('box','#b47c56',side*run/2,2.08+rise/2,-.20,len,.06,1.97,0,0,-side*angle);
    box('#cf9a6a',0,2.465,-.20,.07,.065,2.0);
  }else if(cinema){
    door(-.32,.49);door(.29,.49);
    poster(-.90,.744,'#568589');poster(.90,.744,'#af6650');
    // Central projecting ticket booth with a counter and a glazed hatch.
    box(accent,0,.36,.91,.27,.49,.30);box('#9cb6af',0,.61,1.067,.22,.25,.015);
    box(trim,0,.48,1.083,.30,.035,.06);
    box(accent,0,1.09,.98,2.26,.16,.53);box(trim,0,1.19,.98,2.30,.045,.55);
    for(let i=0;i<15;i++)part('sphere','#ffe6a2',-1.055+i*2.11/14,1.08,1.256,.048,.048,.025);
    label(l.signName??'CINEMA',1.50,.776,1.54);
    // Film strip motif above the marquee.
    box(dark,0,1.86,.727,1.77,.22,.025);
    for(let i=0;i<15;i++)for(const y of [1.78,1.94])box(trim,-.81+i*.116,y,.747,.055,.035,.012);
    for(const x of [-.50,0,.50])box('#859b91',x,1.86,.752,.29,.095,.016);
    box('#87796c',0,2.105,-.20,2.30,.09,1.90);
    for(const side of [-1,1])box(wall,side*1.11,2.21,-.20,.08,.17,1.9);
    for(const z of [-1.10,.70])box(wall,0,2.21,z,2.30,.17,.08);
  }else{
    door(0,.48);
    // Book spines sit in the dark window recesses, with slender glazing mullions.
    const books=['#a65b4f','#d5b465','#5c838b','#718655','#b78e77'];
    const bookWindow=(x,y,width)=>{
      box(trim,x,y,.729,width+.08,.64,.035);box(dark,x,y,.753,width,.56,.022);
      for(const row of [-1,1]){
        box(wood,x,y+row*.13-.10,.777,width,.025,.029);
        for(let i=0;i<6;i++){
          const h=.14+(i%3)*.025,u=x-width/2+.045+i*(width-.09)/5;
          box(books[(i+(row+1)*2)%books.length],u,y+row*.13-.086+h/2,.784,.045,h,.016);
        }
      }
      box('#b6ccc1',x,y,.803,.018,.56,.012);
    };
    for(const x of [-.75,.75])bookWindow(x,.56,.48);
    for(const x of [-.72,0,.72])bookWindow(x,1.53,.50);
    label(l.signName??'BIBLIOTECA',1.055,.790,1.64);
    box('#a8b09a',0,2.11,-.20,2.32,.09,1.94);
    for(const side of [-1,1])box(trim,side*1.12,2.215,-.20,.07,.16,1.94);
    for(const z of [-1.135,.735])box(trim,0,2.215,z,2.31,.16,.07);
    // A low roof lantern and benches by the entrance.
    box(trim,0,2.225,-.30,.90,.12,.68);box('#8da9a1',0,2.30,-.30,.81,.06,.59);
    for(const side of [-1,1]){
      box(wood,side*.77,.30,1.02,.63,.045,.22);box(wood,side*.77,.43,.94,.63,.22,.035);
      for(const dx of [-.22,.22])box(dark,side*.77+dx,.19,1.02,.035,.19,.15);
    }
  }
}
