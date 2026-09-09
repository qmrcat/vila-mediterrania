import {businessSignPixels} from './business-signs.js';

/** Municipal services, in local coordinates with the entrance facing +Z. */
export function renderServiceBuilding(l,part,unit){
  const large=l.size===6,w=(large?3:2)*unit-.12,d=2*unit-.12;
  const box=(color,x,y,z,sx,sy,sz)=>part('box',color,x,y,z,sx,sy,sz);
  const sign=(text,x,y,z,width,bg='#477e70')=>{
    box(bg,x,y,z,width+.08,.19,.035);
    for(const p of businessSignPixels(text,width,.125))box('#fff5de',x+p.x,y+p.y,z+.023,p.size,p.size,.012);
  };
  box('#c6bca6',0,.04,0,w,.08,d);
  box('#a3a7a0',0,.087,0,w-.04,.014,d-.04);

  if(l.type==='fireStation'){
    const tower=-w/2+.36,front=.13;
    // Limewashed station, red lintel and a taller hose-drying tower.
    box('#e8deca',0,.73,-.52,w-.10,1.28,1.30);
    box('#b54f3e',0,1.32,-.52,w-.02,.10,1.38);
    box('#c98757',0,1.40,-.52,w,.06,1.40);
    box('#e8deca',tower,1.08,-.67,.57,1.96,.77);
    box('#c98757',tower,2.10,-.67,.65,.10,.85);
    for(const y of [1.55,1.83]){
      box('#416472',tower,y,-.272,.22,.17,.025);
      box('#eee4cf',tower,y,-.253,.022,.17,.014);
    }
    const bays=large?[.03,1.10]:[.39];
    for(const x of bays){
      box('#f5ead6',x,.55,front+.01,.89,.90,.06);
      box('#555f5d',x,.55,front+.05,.77,.79,.025);
      // Shutter slats and a band of glass distinguish the garage doors.
      for(let i=0;i<6;i++)box('#88918a',x,.22+i*.12,front+.068,.74,.017,.012);
      box('#557f8a',x,.75,front+.081,.63,.12,.018);
      box('#e9d7a8',x,.102,.61,.026,.014,.88);
    }
    sign('BOMBERS',large?.38:.32,1.16,front+.055,large?1.55:1.18,'#b54f3e');
    // Separate staff door beside the cotxeres.
    box('#f7eed9',tower,.47,front+.019,.35,.74,.04);
    box('#426a73',tower,.47,front+.046,.27,.66,.022);
    box('#dec28a',tower+.075,.44,front+.061,.025,.045,.013);
    for(const side of [-1,1])for(const z of [-.88,-.39]){
      box('#f4ead6',side*(w-.09)/2,.81,z,.028,.37,.31);
      box('#557f8a',side*(w-.04)/2,.81,z,.02,.28,.23);
    }
    function truck(x,z){
      box('#404e50',x,.23,z,.49,.12,.86);
      box('#c84838',x,.40,z-.16,.51,.28,.49);
      box('#dd5640',x,.43,z+.24,.51,.35,.33);
      box('#eef0d8',x,.42,z,.523,.055,.75);
      box('#507e8b',x,.50,z+.413,.41,.15,.015);
      for(const side of [-1,1]){
        box('#507e8b',x+side*.26,.51,z+.23,.014,.13,.21);
        box('#b9c2ba',x+side*.263,.39,z-.16,.014,.18,.35);
        for(const offset of [-.27,.27]){
          part('cylinder','#343f40',x+side*.254,.205,z+offset,.19,.075,.19,0,0,Math.PI/2);
          part('cylinder','#c7cabc',x+side*.296,.205,z+offset,.085,.012,.085,0,0,Math.PI/2);
        }
        box('#ffe4a0',x+side*.18,.32,z+.422,.075,.06,.016);
        box('#4284b6',x+side*.15,.635,z+.23,.09,.065,.08);
        box('#ced2c5',x+side*.14,.57,z-.17,.025,.035,.49);
      }
      for(let i=0;i<6;i++)box('#ced2c5',x,.57,z-.37+i*.077,.29,.025,.019);
      box('#b9c2ba',x,.255,z+.436,.54,.055,.035);
    }
    truck(bays[0],.65);
    if(large)truck(bays[1],.65);
    return;
  }

  // Fenced collection yard. A broad central gap remains free for the entrance.
  const half=w/2-.045,back=-d/2+.045,front=d/2-.045;
  for(const side of [-1,1]){
    box('#d6ccb5',side*half,.22,0,.055,.28,d-.07);
    for(const y of [.46,.65])box('#718b7b',side*half,y,0,.025,.025,d-.07);
    for(const z of [back,-.4,.4,front])box('#667e70',side*half,.43,z,.035,.68,.035);
    const length=half-.45;
    box('#d6ccb5',side*(half+.45)/2,.22,front,length,.28,.055);
    box('#718b7b',side*(half+.45)/2,.55,front,length,.025,.025);
    box('#667e70',side*.45,.44,front,.045,.70,.045);
  }
  box('#d6ccb5',0,.22,back,w-.04,.28,.055);
  for(const y of [.46,.65])box('#718b7b',0,y,back,w-.04,.025,.025);
  for(const x of [-.78,.78])box('#667e70',x,.77,back,.04,1.36,.04);
  sign('DEIXALLERIA',0,1.34,back+.025,1.70);
  // Four common fractions; the larger yard adds organics and metals.
  const fractions=[['PAPER','#5688af'],['ENVASOS','#d6b445'],['VIDRE','#5b9267'],['RESTA','#888f88'],['ORGÀNIC','#9d7751'],['METALL','#87a4a7']];
  const count=large?6:4,spacing=(w-.52)/count;
  for(let i=0;i<count;i++){
    const x=(i-(count-1)/2)*spacing,[label,color]=fractions[i];
    box(color,x,.36,back+.39,.40,.48,.47);
    box('#445a53',x,.61,back+.39,.43,.04,.49);
    box('#273e39',x,.636,back+.34,.22,.012,.09);
    for(const side of [-1,1])box('#40534e',x+side*.145,.125,back+.46,.065,.065,.10);
    sign(label,x,.38,back+.638,.32,color);
  }
  // Staff cabin by the entrance, with a tiled roof and glazed front.
  const cabin=-half+.36,z=.66;
  box('#e8deca',cabin,.51,z,.57,.84,.62);
  box('#c58a5d',cabin,.96,z,.65,.07,.70);
  box('#3e736e',cabin,.47,z+.322,.21,.69,.025);
  box('#649498',cabin+.165,.66,z+.329,.09,.22,.02);
  box('#649498',cabin+.294,.64,z,.022,.29,.33);
  // A timber skip; the larger yard also has a separate appliance collection bay.
  function skip(x,appliances){
    box('#547b69',x,.145,-.05,.51,.09,.50);
    for(const side of [-1,1])box('#547b69',x+side*.25,.25,-.05,.025,.24,.50);
    for(const side of [-1,1])box('#547b69',x,.25,-.05+side*.24,.51,.24,.025);
    if(appliances){
      box('#e6e3d5',x-.10,.41,-.06,.20,.47,.24);
      box('#c2c7bd',x-.10,.49,.066,.17,.012,.008);
      box('#e6e3d5',x+.13,.30,.015,.20,.25,.23);
      part('cylinder','#647a7a',x+.13,.31,.135,.125,.018,.125,0,Math.PI/2);
    }else for(let i=0;i<5;i++)box(i%2?'#b89360':'#c8a572',x+(i%2)*.035,.205+i*.035,-.08+(i%3)*.045,.40,.026,.065);
  }
  skip(-half+.34,false);
  if(large)skip(half-.34,true);
  // Painted guide marks lead into the uncluttered centre of the yard.
  for(const z of [.22,.48,.74,1.0])box('#eee4c8',0,.101,z,.045,.014,.12);
}
