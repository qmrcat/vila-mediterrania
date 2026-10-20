import {randomAt,terrainY} from './model.js';

/** Low instanced surfaces. All details stay inside their cell and below picking height. */
export function renderRoadSurface(tile,box,unit){
  const {kind}=tile,x=tile.x*unit,z=tile.z*unit,y=terrainY(tile);
  const base={cobble:'#908779',dirt:'#bd9866',asphalt:'#555b5e'}[kind];
  if(!base)return;
  // Matching full-cell bases make continuous streets, including corners and junctions.
  box(base,x,y+.018,z,unit,.014,unit);
  if(kind==='cobble'){
    const colors=['#bab09a','#b0a58f','#c7bca6','#a89f8e'],width=unit/4,depth=unit/6;
    for(let row=0;row<6;row++)for(let col=-1;col<4;col++){
      const left=Math.max(-unit/2,-unit/2+col*width+(row%2)*width/2);
      const right=Math.min(unit/2,-unit/2+(col+1)*width+(row%2)*width/2);
      if(right<=left)continue;
      const n=randomAt(tile.x*4+col,tile.z*6+row,32);
      box(colors[Math.floor(n*colors.length)],x+(left+right)/2,y+.032+n*.003,
        z-unit/2+(row+.5)*depth,right-left-.014,.016,depth-.017);
    }
  }else{
    const dirt=kind==='dirt',colors=dirt?['#aa875b','#d0ae7d','#c6a371']:['#62676a','#4d5356','#6c7071'];
    for(let i=0;i<(dirt?20:16);i++){
      const a=randomAt(tile.x,tile.z,80+i),b=randomAt(tile.x,tile.z,110+i);
      const size=dirt?.024+a*.036:.012+a*.015;
      box(colors[i%3],x+(a-.5)*(unit-.12),y+.028,z+(b-.5)*(unit-.12),size,.006,size*.7);
    }
  }
}
