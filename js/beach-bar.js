import {businessSignPixels} from './business-signs.js';
export const BEACH_BAR_DECK=.30,BEACH_BAR_TOP=1.70;
/** A single-cell, freestanding beach kiosk on short piles. */
export function renderBeachBars(world,add,UNIT){
  for(const t of world.tiles){
    if(!t.beachBar)continue;
    const a=t.beachBar.direction*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const part=(shape,color,u,h,v,sx,sy,sz,tilt=0)=>add(shape,color,t.x*UNIT+c*u+s*v,h,t.z*UNIT-s*u+c*v,sx,sy,sz,a,0,tilt);
    for(const u of [-.48,.48])for(const v of [-.48,.48])part('cylinder','#927353',u,.16,v,.085,.32,.085);
    part('box','#ac8256',0,BEACH_BAR_DECK,0,1.20,.08,1.20);
    for(let board=-4;board<=4;board++)part('box',board%2?'#c69c68':'#d2ad79',board*.13,.345,0,.12,.015,1.19);
    part('box','#5f9290',0,.71,-.45,1.05,.73,.085);
    for(const u of [-.49,.49]){
      part('box','#79a6a0',u,.65,-.19,.08,.61,.47);
      for(const v of [-.45,.24])part('box','#94754d',u,.88,v,.065,1.08,.065);
    }
    part('box','#82aaa0',0,.56,.17,.96,.42,.09);
    for(let board=-3;board<=3;board++)part('box','#a9c5b5',board*.135,.56,.22,.085,.39,.018);
    part('box','#825d3c',0,.80,.19,1.08,.065,.26);
    // Two stools remain within the same beach cell.
    for(const u of [-.31,.31]){
      part('cylinder','#705943',u,.46,.46,.055,.25,.055);
      part('cylinder','#d2aa6b',u,.59,.46,.235,.065,.235);
      part('box','#705943',u,.37,.46,.16,.035,.16);
    }
    part('box','#ccdfce',0,.97,-.385,.78,.035,.14);
    for(let i=-2;i<=2;i++){
      part('cylinder',i%2?'#6e985b':'#bb904d',i*.14,1.025,-.38,.050,.09,.045);
      part('cylinder','#e9dec2',i*.14,1.078,-.38,.023,.023,.023);
    }
    for(const u of [-.22,.08]){
      part('cylinder','#f8edce',u,.862,.19,.066,.059,.066);
      part('cylinder','#cfac63',u,.894,.19,.051,.006,.051);
    }
    part('box','#376d71',0,1.24,.286,1.03,.155,.055);
    for(const p of businessSignPixels(t.beachBar.name||'Guingueta',.95,.11))part('box','#fff0c7',p.x,1.24+p.y,.319,p.size,p.size,.012);
    // Reed-coloured pitched roof with exposed battens.
    part('gable','#c0aa6e',0,1.42,0,1.22,.50,1.20);
    const slope=Math.atan2(.21,.61);
    for(const side of [-1,1]){
      part('box','#d1ba79',side*.305,1.525,0,.67,.05,1.22,-side*slope);
      for(let reed=-5;reed<=5;reed++)part('box',reed%2?'#bca269':'#ddc58b',side*.305,1.553,reed*.112,.67,.025,.028,-side*slope);
    }
    part('box','#ad935b',0,1.65,0,.06,.05,1.23);
  }
}
