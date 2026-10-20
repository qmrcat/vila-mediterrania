/** Local façade coordinates: left and right are seen from outside the building. */
export const BALCONY_FACES={
  'balcony-single':'Balcó d’una porta',
  'balcony-left-window':'Balcó esquerre i finestra dreta',
  'window-left-balcony':'Finestra esquerra i balcó dret',
  'balcony-pair':'Dos balcons d’una porta',
};
export function upperFaceType(floor,roll){
  if(roll<=.57)return 'window';
  if(roll<=.67)return floor===1?'balcony':'window';
  return Object.keys(BALCONY_FACES)[Math.min(3,Math.floor((roll-.67)/.33*4))];
}
export function balconyLayout(type){
  if(type==='balcony-single')return [{u:0,balcony:true}];
  if(type==='balcony-left-window')return [{u:-.30,balcony:true},{u:.30,balcony:false}];
  if(type==='window-left-balcony')return [{u:-.30,balcony:false},{u:.30,balcony:true}];
  if(type==='balcony-pair')return [{u:-.30,balcony:true},{u:.30,balcony:true}];
  return [];
}
/** A single glazed door reaches its own slab; paired balconies have separate railings. */
export function renderBalconyFacade(type,face,{shutter='#447e87',trim='#eee5d2',opening=()=>{}}={}){
  const box=(color,u,y,depth,w,h,d)=>face('box',color,u,y,depth,w,h,d);
  for(const {u,balcony} of balconyLayout(type)){
    const center=balcony?.455:.47,height=balcony?.53:.35;
    box(trim,u,center,.649,.30,height+.07,.044);
    box('#3d6469',u,center,.68,.22,height,.025);
    box('#b1c5be',u,center+.035,.699,.22,.018,.012);
    // One door leaf, with the handle on its right; the adjacent window stays shorter.
    if(balcony)box('#c7ad70',u+.082,.395,.708,.018,.034,.012);
    else box('#b1c5be',u,center,.699,.016,height,.012);
    for(const side of [-1,1]){
      box(shutter,u+side*.195,center,.689,.074,height,.034);
      for(let i=0;i<4;i++)box('#366469',u+side*.195,center-height*.35+i*height*.22,.712,.060,.012,.012);
    }
    if(!balcony){
      box(trim,u,.27,.70,.36,.045,.14);opening(u,.295,.78,'window');continue;
    }
    box(trim,u,.14,.795,.46,.08,.37);
    box('#4d655f',u,.475,.965,.43,.035,.028);
    for(let i=-2;i<=2;i++)box('#4d655f',u+i*.10,.325,.965,.018,.30,.018);
    for(const side of [-1,1]){
      box('#4d655f',u+side*.21,.475,.81,.024,.035,.31);
      box('#4d655f',u+side*.21,.325,.68,.018,.30,.018);
    }
    opening(u,.49,.994,'balcony');
  }
}
