/** Compact yard shelter leaves the cell centre and crossing paths open. */
export const COOP={u:-.29,v:-.29,clearance:.30};
export function renderPoultry(part,bird){
  const goose=bird.species==='goose',feathers=goose?'#eeeade':['#ae7447','#eee1c7','#765341'][bird.coat],orange='#d8a14b';
  const bodyY=goose?.125:.105;
  part(bird,'sphere',feathers,0,bodyY,0,goose?.10:.085,goose?.12:.095,goose?.19:.12);
  for(const side of [-1,1])part(bird,'sphere',goose?'#d7d7c9':feathers,side*(goose?.044:.037),bodyY,-.014,.026,goose?.073:.06,goose?.125:.09);
  part(bird,'box',feathers,0,bodyY+.025,goose?-.094:-.064,.042,.055,.062,-.5);
  if(goose){
    part(bird,'cylinder',feathers,0,.21,.071,.032,.17,.032,-.12);
    part(bird,'sphere',feathers,0,.297,.083,.053,.057,.061);
    part(bird,'box',orange,0,.292,.129,.028,.022,.046);
  }else{
    part(bird,'sphere',feathers,0,.154,.045,.042,.073,.043);
    part(bird,'sphere',feathers,0,.19,.06,.054,.055,.052);
    part(bird,'box',orange,0,.184,.093,.024,.019,.028);
    for(const z of [.042,.06,.078])part(bird,'sphere','#b94f40',0,.221,z,.014,.025,.017);
    part(bird,'sphere','#b94f40',0,.161,.079,.018,.028,.020);
  }
  const eyeY=goose?.303:.196,eyeZ=goose?.101:.073;
  for(const side of [-1,1]){
    part(bird,'sphere','#302f29',side*(goose?.025:.024),eyeY,eyeZ,.009,.009,.009);
    const leg=side<0?0:1;
    part(bird,'box',orange,side*.022,.037,0,.010,.065,.010,0,0,leg);
    part(bird,'box',orange,side*.022,.009,.014,goose?.033:.025,.015,goose?.040:.031,0,0,leg);
  }
}
export function renderCoop(p,add){
  const box=(color,x,y,z,w,h,d,rx=0,rz=0)=>add('box',color,p.x+x,p.y+y,p.z+z,w,h,d,0,rx,rz);
  for(const x of [-.135,.135])for(const z of [-.12,.12])box('#785a3a',x,.061,z,.035,.122,.035);
  box('#b48a56',0,.105,0,.34,.035,.30);
  box('#ac8050',0,.225,0,.31,.22,.27);
  for(let i=-3;i<=3;i++)for(const z of [-.139,.139])box(i%2?'#c39b67':'#937049',i*.043,.224,z,.009,.20,.010);
  box('#d0b182',0,.178,.147,.119,.132,.020);
  box('#433f31',0,.175,.162,.082,.11,.016);
  box('#c8a677',0,.074,.205,.098,.018,.14,.52);
  for(let i=0;i<4;i++)box('#8f714b',0,.045+i*.017,.252-i*.027,.097,.013,.012);
  box('#bfa170',.174,.19,.01,.058,.089,.15);
  box('#765641',.178,.243,.01,.080,.019,.18);
  for(const side of [-1,1])box('#786849',side*.086,.365,0,.205,.030,.34,0,-side*.40);
  box('#9b8458',0,.403,0,.042,.027,.355);
}
