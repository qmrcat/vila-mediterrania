import {terrainY,terrainSurfaceY,randomAt} from './model.js';
/** Repeating rows join adjoining cells; every root rests on the actual slope. */
export function renderAgriculturalTerrain(t,add,surfaceBox,unit,exclude,branch){
  const ox=t.x*unit,oz=t.z*unit,soil=terrainY(t),wood='#806345',leaf='#567d42';
  const root=(u,v,r=.05)=>{
    const x=ox+u*unit,z=oz+v*unit;
    return exclude?.(x,z,r)?null:{x,z,y:terrainSurfaceY(t,u,v)+.014};
  };
  const emit=(p,shape,color,u,y,v,sx,sy,sz,a=0)=>add(shape,color,p.x+u,p.y+y,p.z+v,sx,sy,sz,a);
  const row=(u,width,color)=>{
    for(let j=-2;j<=2;j++){
      const p=root(u,j*.20,width*unit/2);if(!p)continue;
      surfaceBox(color,p.x,soil+.020,p.z,width*unit,.030,.20*unit);
    }
  };
  if(t.kind==='vineyard'){
    for(const u of [-.32,0,.32]){
      row(u,.18,'#987752');
      const posts=[];
      for(const v of [-.40,.40]){
        const p=root(u,v,.035);posts.push(p);
        if(p)emit(p,'box',wood,0,.20,0,.027,.40,.027);
      }
      if(posts.every(Boolean)&&!exclude?.(ox+u*unit,oz,.12))for(const h of [.21,.34]){
        const [a,b]=posts;branch('#8a8975',[a.x,a.y+h,a.z],[b.x,b.y+h,b.z],.009);
      }
      for(const v of [-.27,0,.27]){
        const p=root(u,v,.13);if(!p)continue;
        emit(p,'cylinder',wood,0,.12,0,.027,.24,.027);
        emit(p,'rock','#668647',0,.29,0,.21,.19,.27,randomAt(t.x,t.z,v+u)*3);
        for(const k of [-1,0,1])emit(p,'sphere','#665174',.075,.21-Math.abs(k)*.012,k*.034,.044,.052,.044);
      }
    }
  }else if(t.kind==='oliveGrove'||t.kind==='orchard'){
    const olive=t.kind==='oliveGrove';
    for(const u of [-.26,.26])for(const v of [-.26,.26]){
      const p=root(u,v,.24);if(!p)continue;
      emit(p,'cylinder',olive?'#81735a':wood,0,.19,0,.055,.38,.055);
      for(const side of [-1,1])branch(wood,[p.x,p.y+.24,p.z],[p.x+side*.10,p.y+.43,p.z],.028);
      emit(p,'rock',olive?'#8b9b70':leaf,0,.49,0,.40,.34,.40,u+v);
      emit(p,'rock',olive?'#a1ad82':'#709a50',-.07,.59,-.04,.27,.22,.29,u-v);
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2+.4;
        emit(p,'sphere',olive?'#485943':i%2?'#df9949':'#c95e43',Math.cos(a)*.15,.45+((i%2)*.05),Math.sin(a)*.15,olive?.028:.058,olive?.04:.058,olive?.028:.058);
      }
    }
  }else if(t.kind==='cereal'){
    for(const u of [-.36,-.12,.12,.36]){
      row(u,.11,'#ad9259');
      for(let j=-2;j<=2;j++){
        const v=j*.17,p=root(u,v,.055);if(!p)continue;
        const h=.22+randomAt(t.x+u,t.z+v,721)*.07;
        emit(p,'box','#b8a14b',0,h/2,0,.011,h,.011);
        emit(p,'box','#b2a154',.026,h*.5,0,.068,.013,.018,.4);
        emit(p,'sphere','#dfbe64',0,h+.023,0,.047,.105,.040);
        emit(p,'box','#edd27c',0,h+.085,0,.007,.05,.007);
      }
    }
  }else if(t.kind==='vegetableGarden'){
    for(let i=0;i<3;i++){
      const u=(i-1)*.31;row(u,.23,'#765939');
      for(const v of [-.32,-.10,.12,.34]){
        const p=root(u,v,.10);if(!p)continue;
        if(i===0){
          emit(p,'box',wood,0,.15,0,.013,.30,.013);
          emit(p,'rock','#5d883e',0,.14,0,.14,.22,.14);
          for(const side of [-1,1])emit(p,'sphere','#d45d42',side*.05,.16,side*.03,.043,.043,.043);
        }else if(i===1){
          emit(p,'sphere','#82a663',0,.06,0,.17,.11,.17);
          emit(p,'sphere','#a2ba7a',0,.085,0,.10,.085,.10);
        }else{
          emit(p,'sphere','#d28a42',0,.014,0,.042,.04,.042);
          for(let a=0;a<3;a++)emit(p,'box','#669447',0,.066,0,.025,.10,.07,a*Math.PI/3);
        }
      }
    }
  }
}
