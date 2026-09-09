import {businessSignPixels} from './business-signs.js';

/** A walled Mediterranean cemetery with a clear central entrance and path. */
export function renderCemetery(l,part,unit){
  const large=l.size===4,w=unit*2-.10,depth=(large?2:1)*unit-.10;
  const hw=w/2,hd=depth/2,stone='#bdb6a2',cap='#e0d8c3',iron='#50645b';
  const box=(color,x,y,z,sx,sy,sz)=>part('box',color,x,y,z,sx,sy,sz);
  box('#b5ac93',0,.035,0,w,.07,depth);
  box('#a5ae8a',0,.077,0,w-.06,.014,depth-.06);
  box('#d4cab2',0,.090,0,.43,.016,depth-.035);
  const pathSteps=large?11:5;
  for(let i=0;i<pathSteps;i++)box('#e1d7c1',0,.102,-hd+.12+i*(depth-.24)/(pathSteps-1),.38,.018,.17);
  // Low perimeter walls leave the entrance and the central path open.
  for(const side of [-1,1]){
    box(stone,side*(hw-.045),.27,0,.09,.38,depth);
    box(cap,side*(hw-.045),.475,0,.11,.045,depth);
    box(stone,side*(hw+.30)/2,.27,hd-.045,hw-.30,.38,.09);
    box(cap,side*(hw+.30)/2,.475,hd-.045,hw-.30,.045,.11);
  }
  box(stone,0,.27,-hd+.045,w,.38,.09);box(cap,0,.475,-hd+.045,w,.045,.11);
  // Gateposts, iron lintel and name plate. No door or bar spans the passage below.
  for(const side of [-1,1]){
    box(stone,side*.30,.48,hd-.065,.13,.80,.14);box(cap,side*.30,.90,hd-.065,.17,.055,.18);
    part('sphere',cap,side*.30,.959,hd-.065,.10,.085,.10);
    for(let i=0;i<4;i++)box(iron,side*(.40+i*.105),.61,hd-.045,.014,.24,.018);
    box(iron,side*.56,.74,hd-.045,.34,.023,.025);
  }
  box(iron,0,.80,hd-.065,.58,.034,.032);
  box(iron,0,.877,hd-.066,.47,.13,.025);
  for(const p of businessSignPixels('CEMENTIRI',.43,.086))box('#e7dcc0',p.x,.877+p.y,hd-.044,p.size,p.size,.008);
  function grave(x,z,index){
    box('#aaa594',x,.107,z,.23,.035,.39);
    box('#e0ddcd',x,.13,z,.19,.022,.35);
    part('arch',index%2?'#d9d4c3':'#c5c2b2',x,.141,z-.175,.17,.205,.041);
    box('#888b7b',x,.26,z-.129,.016,.103,.009);box('#888b7b',x,.285,z-.129,.077,.015,.009);
    for(let i=0;i<2;i++)box('#999b8c',x,.196-i*.018,z-.129,.077-i*.016,.006,.009);
    // A small, restrained bouquet at the foot of each headstone.
    part('cylinder','#a37c59',x+.057,.172,z-.070,.048,.068,.046);
    for(const offset of [-.015,.015])part('sphere',index%2?'#cb99a1':'#eee6cd',x+.057+offset,.214,z-.070,.031,.031,.026);
  }
  let index=0;
  for(const z of large?[-.47,.42]:[.025])for(const x of [-.82,-.46,.46,.82])grave(x,z,index++);
  function cypress(x,z){
    part('cylinder','#857356',x,.31,z,.07,.46,.07);
    part('sphere','#426d4c',x,.75,z,.24,.98,.24);
    part('cone','#4a7650',x,1.17,z,.235,.91,.235);
    part('sphere','#527d52',x-.023,.92,z+.014,.19,.56,.18);
  }
  for(const side of [-1,1])cypress(side*(hw-.20),-hd+.23);
  if(large){
    // An additional bank of eight niches against the rear wall.
    box('#c9c0aa',0,.43,-hd+.17,1.50,.68,.22);
    box(cap,0,.792,-hd+.17,1.56,.05,.25);
    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const x=(col-1.5)*.355,y=.265+row*.31;
      box('#aaa797',x,y,-hd+.293,.303,.265,.025);
      box('#e0daca',x,y,-hd+.312,.26,.226,.014);
      box('#8e9586',x,y+.02,-hd+.324,.012,.084,.009);box('#8e9586',x,y+.045,-hd+.324,.069,.012,.009);
      box('#9a9e91',x,y-.05,-hd+.324,.091,.007,.009);
    }
  }
}
