/** Four distinct silhouettes; all sizes are measured above the local ground. */
export function renderNewMediterraneanTree(kind,x,y,z,seed,add,branch){
  const a=seed*Math.PI*2;
  if(kind==='mulberry'){
    // Taller clear trunk and raised, flatter shade canopy, still below one storey.
    branch('#92836b',[x,y,z],[x,y+.59,z],.11);
    for(let i=0;i<6;i++){
      const angle=a+i*Math.PI/3,u=Math.cos(angle),v=Math.sin(angle);
      branch('#92836b',[x,y+.49,z],[x+u*.32,y+.69,z+v*.32],.047);
      add('rock',['#759953','#86a75f','#638b4c'][i%3],x+u*.28,y+.72+(i%2)*.025,z+v*.28,.67,.20,.63,angle);
    }
    add('rock','#8daa66',x,y+.765,z,.81,.19,.79,a);
  }else if(kind==='ash'){
    branch('#918777',[x,y,z],[x,y+1.65,z],.13);
    for(let tier=0;tier<3;tier++)for(const side of [-1,1]){
      const angle=a+tier*.92,u=Math.cos(angle)*side,v=Math.sin(angle)*side,h=1.40+tier*.29;
      branch('#918777',[x,y+h-.53,z],[x+u*.40,y+h,z+v*.40],.055-tier*.009);
      add('rock',['#73935b','#89a36a','#638451'][tier],x+u*.37,y+h+.14,z+v*.37,.78,.69,.70,angle);
      add('rock','#9aaf7c',x+u*.53,y+h+.15,z+v*.53,.32,.24,.29,angle);
    }
    add('rock','#8ba573',x,y+2.30,z,.72,.64,.73,a);
  }else if(kind==='mimosa'){
    branch('#968469',[x,y,z],[x+.035,y+.84,z],.13);
    for(let i=0;i<7;i++){
      const angle=a+i*Math.PI*2/7,u=Math.cos(angle),v=Math.sin(angle),h=1.35+(i%3)*.19;
      branch('#968469',[x,y+.60,z],[x+u*.36,y+h,z+v*.36],.052);
      add('rock',['#8da99b','#a5b9ab','#7f9e91'][i%3],x+u*.35,y+h,z+v*.35,.73,.55,.69,angle);
      // Golden flower clusters over blue-green foliage.
      for(let flower=0;flower<5;flower++){
        const theta=angle+flower*1.2566;
        add('sphere',flower%2?'#f2cd55':'#e9bb38',x+u*.35+Math.cos(theta)*.25,y+h+.11+(flower%2)*.075,z+v*.35+Math.sin(theta)*.25,.10,.085,.10,theta);
      }
    }
    add('rock','#9fb7a6',x,y+1.91,z,.77,.52,.71,a);
    for(let i=0;i<5;i++){
      const angle=a+i*Math.PI*2/5;add('sphere','#f2cd55',x+Math.cos(angle)*.23,y+2.11,z+Math.sin(angle)*.23,.105,.087,.105);
    }
  }else if(kind==='cypress'){
    branch('#84745a',[x,y,z],[x,y+.93,z],.105);
    add('cone','#375d44',x,y+1.04,z,.65,1.40,.63,a);
    add('cone','#426b4b',x,y+1.70,z,.50,1.31,.48,a+.35);
    add('cone','#4e7450',x,y+2.28,z,.30,.96,.29,a);
    for(let i=0;i<8;i++){
      const angle=a+i*2.40,h=.76+i*.18,r=.19-i*.013;
      add('rock',i%2?'#31573f':'#547951',x+Math.cos(angle)*r,y+h,z+Math.sin(angle)*r,.17,.31,.16,angle);
    }
  }
}
