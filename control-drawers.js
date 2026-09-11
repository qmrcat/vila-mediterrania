/** Independent drawers: only their handles capture swipes, never the game canvas. */
export function initControlDrawers(root=document,storage){
  const $=id=>root.querySelector('#'+id),game=$('game'),combined=$('interface-toggle');
  const mobile=globalThis.matchMedia('(max-width:740px), (pointer:coarse) and (max-height:500px)').matches;
  let state={palette:!mobile,tools:true};
  try{storage??=globalThis.localStorage;const saved=JSON.parse(storage.getItem('vila-mediterrania:control-drawers'));for(const name of ['palette','tools'])if(typeof saved?.[name]==='boolean')state[name]=saved[name];}catch{}
  const panels={palette:$('construction-palette'),tools:$('construction-tools')};
  const update=()=>{
    for(const name of ['palette','tools']){
      const visible=state[name],show=$(name+'-show'),hide=$(name+'-hide');
      panels[name].hidden=!visible;show.hidden=visible;
      show.setAttribute('aria-expanded',String(visible));hide.setAttribute('aria-expanded',String(visible));
      game.dataset[name+'Open']=String(visible);
    }
    const all=state.palette&&state.tools,label=all?'Amaga la paleta i la barra d’eines':'Mostra la paleta i la barra d’eines';
    combined.setAttribute('aria-pressed',String(all));combined.setAttribute('aria-label',label);combined.title=label;
  };
  const set=(name,visible)=>{
    const moveFocus=!visible&&panels[name].contains(root.activeElement);
    const openingFocus=visible&&root.activeElement===$(name+'-show');
    state[name]=visible;update();
    if(moveFocus)$(name+'-show').focus({preventScroll:true});
    if(openingFocus)$(name+'-hide').focus({preventScroll:true});
    try{storage.setItem('vila-mediterrania:control-drawers',JSON.stringify(state));}catch{}
  };
  for(const name of ['palette','tools'])for(const opening of [false,true]){
    const button=$(name+(opening?'-show':'-hide'));let start=null,ignoreClickUntil=0;
    button.addEventListener('click',()=>{if(performance.now()>ignoreClickUntil)set(name,opening);});
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};button.setPointerCapture(e.pointerId);
    });
    button.addEventListener('pointerup',e=>{
      if(!start||e.pointerId!==start.id)return;
      const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
      if(Math.hypot(dx,dy)>=15){e.preventDefault();ignoreClickUntil=performance.now()+500;}
      const distance=name==='palette'?dx:dy,other=name==='palette'?dy:dx;
      const direction=name==='palette'?(opening?1:-1):(opening?-1:1);
      if(distance*direction>=35&&Math.abs(distance)>Math.abs(other)*1.3){
        set(name,opening);
      }
    });
    for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,()=>{start=null;});
  }
  combined.addEventListener('click',()=>{const show=!(state.palette&&state.tools);set('palette',show);set('tools',show);});
  update();
  return {set,getState:()=>({...state})};
}
