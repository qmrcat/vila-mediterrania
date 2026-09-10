import {renderNewMediterraneanTree} from './new-mediterranean-trees.js';
/** Coordinate-seeded tree details use the same instanced geometry as the village. */
export function renderMediterraneanTree(kind,x,y,z,seed,add,branch){
  if(['mulberry','ash','mimosa','cypress'].includes(kind)){renderNewMediterraneanTree(kind,x,y,z,seed,add,branch);return;}
  if(kind==='olive'){
    const bark='#8a7e69',a=seed*6.28,dx=Math.cos(a)*.12,dz=Math.sin(a)*.12;
    branch(bark,[x,y,z],[x+dx,y+.49,z+dz],.27);
    branch(bark,[x+dx,y+.49,z+dz],[x-dx*.4,y+.94,z-dz*.4],.20);
    add('rock','#a29680',x+dx,y+.40,z+dz,.32,.32,.28,a);
    add('rock','#716851',x-dx*.4,y+.79,z-dz*.4,.21,.23,.22,a);
    for(let i=0;i<5;i++){
      const angle=a+i*Math.PI*2/5,u=Math.cos(angle),v=Math.sin(angle),h=1.37+(i%2)*.17;
      branch(bark,[x-dx*.4,y+.79,z-dz*.4],[x+u*.38,y+h-.08,z+v*.38],.085);
      add('rock',['#899c7b','#adb89a','#9cab8b'][i%3],x+u*.37,y+h,z+v*.37,.92,.66,.88,angle);
      for(let fruit=0;fruit<2;fruit++)add('sphere',fruit?'#424e37':'#738555',x+u*(.58+fruit*.05),y+h-.18-fruit*.06,z+v*(.58+fruit*.05),.037,.059,.037,angle);
    }
    add('rock','#a2b194',x,y+1.74,z,1.02,.58,1.04,a);
  }else if(kind==='vine'){
    // Four posts and a lattice support a broad, walk-under climbing vine.
    for(const u of [-.48,.48])for(const v of [-.48,.48])add('box','#a08157',x+u,y+.71,z+v,.062,1.42,.062);
    for(const u of [-.49,.49])add('box','#b39769',x+u,y+1.42,z,.077,.077,1.17);
    for(let i=-2;i<=2;i++)add('box','#b39769',x,y+1.47,z+i*.24,1.18,.053,.049);
    const stemX=x-.43,stemZ=z-.42;
    branch('#79613f',[stemX,y,stemZ],[stemX+.08,y+.74,stemZ-.02],.062);
    branch('#79613f',[stemX+.08,y+.74,stemZ-.02],[stemX,y+1.46,stemZ+.08],.047);
    branch('#79613f',[stemX,y+1.46,stemZ+.08],[x+.38,y+1.5,z+.25],.028);
    for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++){
      const px=x+col*.36,pz=z+row*.36;
      add('rock',['#628449','#789953','#86a65d'][(row+col+5)%3],px,y+1.57+(col%2)*.035,pz,.54,.32,.53,seed*5+row+col);
    }
    for(const [u,v] of [[-.29,-.12],[.30,-.25],[-.11,.32],[.34,.29]]){
      add('box','#79613f',x+u,y+1.39,z+v,.014,.16,.014);
      for(let tier=0;tier<3;tier++){
        const count=3-tier;
        for(let fruit=0;fruit<count;fruit++){
          const angle=fruit*Math.PI*2/count+seed;
          add('sphere',tier%2?'#75668b':'#5e5078',x+u+Math.cos(angle)*(2-tier)*.023,y+1.33-tier*.049,z+v+Math.sin(angle)*(2-tier)*.023,.055,.060,.055);
        }
      }
    }
  }else if(kind==='hazel'){
    for(let i=0;i<6;i++){
      const angle=seed*5+i*Math.PI/3,u=Math.cos(angle),v=Math.sin(angle),h=1.28+(i%3)*.12;
      branch('#8b7052',[x+u*.055,y,z+v*.055],[x+u*.34,y+h,z+v*.34],.085);
      branch('#8b7052',[x+u*.17,y+.64,z+v*.17],[x+u*.50,y+1.05,z+v*.50],.035);
      add('rock',['#618643','#739650','#52773e'][i%3],x+u*.34,y+h,z+v*.34,.88,.80,.86,angle);
      if(i%2===0)for(let nut=0;nut<3;nut++){
        const px=x+u*.65+(nut-1)*.039,pz=z+v*.65;
        add('sphere','#75914e',px,y+1.21,pz,.084,.076,.070);
        add('sphere','#b2874d',px,y+1.175,pz,.049,.059,.047);
      }
    }
    add('rock','#7a9a53',x,y+1.73,z,.99,.66,.98,seed*4);
  }
}
