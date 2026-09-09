/** Façade modules shared by ordinary houses and player designs. */
export const DOOR_TYPES=['arch','single','double'];
export const DOOR_POSITIONS=['left','center','right'];
export const WINDOW_TYPES=['rect','arch','none'];
export function validateEntrance(value){
 if(!value||value.type!=='entrance'||!DOOR_TYPES.includes(value.door)||!DOOR_POSITIONS.includes(value.position)||!WINDOW_TYPES.includes(value.windows)||![1,2].includes(value.count))throw new Error('El portal necessita una forma, una posició i unes finestres vàlides.');
 return {type:'entrance',door:value.door,position:value.position,windows:value.windows,count:value.count};
}
export const defaultEntrance=()=>({type:'entrance',door:'arch',position:'center',windows:'rect',count:2});
/** Coordinate-based variation stays identical across reloads, history and camera movement. */
export function residentialEntrance(x,z,d){
 const pick=(salt,n)=>{const v=Math.sin(x*127.1+z*311.7+(d*11+salt)*74.7)*43758.5453;return Math.floor((v-Math.floor(v))*n);};
 if(pick(83,4)===0)return null; // Keep the original arched entrance in the mix.
 return {type:'entrance',door:DOOR_TYPES[pick(97,3)],position:DOOR_POSITIONS[pick(109,3)],windows:WINDOW_TYPES[pick(127,2)],count:1+pick(139,2)};
}
export function entranceLayout(config){
 const x={left:-.32,center:0,right:.32}[config.position];
 const windows=config.windows==='none'?[]:config.position==='center'?(config.count===1?[.40]:[-.40,.40]):config.count===1?[-Math.sign(x)*.30]:[ -Math.sign(x)*.08,-Math.sign(x)*.39];
 return {door:x,windows};
}
/** face(shape,color,u,height,depth,width,height,depth) uses local façade coordinates. */
export function renderEntrance(config,face,{trim='#ded5bc',shutter='#447e87'}={}){
 const layout=entranceLayout(config),u=layout.door,double=config.door==='double',width=double?.40:.30;
 if(config.door==='arch'){
  face('arch',trim,u,.025,.642,.39,.55,.03);
  face('arch',shutter,u,.045,.68,.29,.47,.022);
 }else{
  face('box',trim,u,.345,.655,width+.09,.64,.045);
  face('box',shutter,u,.335,.686,width,.57,.025);
  if(double){
   face('box','#c6ceb7',u,.335,.704,.015,.57,.012);
   for(const side of [-1,1])face('box','#d3b470',u+side*.038,.30,.716,.018,.04,.013);
  }else face('box','#d3b470',u+width*.32,.30,.708,.018,.04,.015);
 }
 face('box',trim,u,.032,.725,width+.14,.064,.18);
 for(const x of layout.windows)renderEntranceWindow(config.windows,face,x,{trim,shutter});
 return layout;
}
export function renderEntranceWindow(type,face,u,{trim='#eee4d1',shutter='#447e87'}={}){
 if(type==='arch'){
  face('arch',trim,u,.32,.642,.25,.30,.03);
  face('arch',shutter,u,.34,.68,.18,.25,.022);
  face('box','#e1dac7',u,.467,.703,.014,.25,.012);
 }else{
  face('box',trim,u,.48,.65,.25,.34,.04);
  face('box',shutter,u,.48,.68,.18,.27,.025);
  face('box','#e1dac7',u,.48,.701,.014,.27,.012);
 }
 face('box',trim,u,.312,.70,.28,.035,.10);
}

/** A raised ground floor keeps its opening layout but replaces the unsupported door. */
export function renderRaisedEntrance(config,face,style={}){
 const entrance=config??defaultEntrance(),layout=entranceLayout(entrance);
 renderEntranceWindow(entrance.door==='arch'?'arch':'rect',face,layout.door,style);
 for(const u of layout.windows)renderEntranceWindow(entrance.windows,face,u,style);
}
