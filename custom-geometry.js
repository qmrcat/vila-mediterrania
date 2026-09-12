import {designFloor} from './designs.js';
import {renderAtticRoof} from './attic-roof.js';
import {createEntranceSupport,createEntranceSteps,renderEntranceSteps} from './entrance-access.js';
import {terrainY,customBusinessOwner,businessFrontClear} from './model.js';
import {SPECIAL_SHOPS} from './special-shops.js';
import {renderEntrance,renderEntranceWindow,renderRaisedEntrance,entranceLayout} from './entrances.js';
import {customCell,customFloors} from './designs.js';
/** Shared by the game and the editor, so saved designs look the same in both. */
export function renderCustomBuildings(world,add,UNIT,FLOOR,entranceSteps=createEntranceSteps(world),renderBusiness=null){
  const entranceSupported=createEntranceSupport(world);
  for(const b of world.customBuildings??[]){
    const design=b.design,base=terrainY(world.tiles.find(t=>t.x===b.x&&t.z===b.z)),a=b.direction*Math.PI/2;
    for(let i=0;i<design.ground.length;i++){
      const p=customCell(b,i),x=p.x*UNIT,z=p.z*UNIT,floors=customFloors(design,i);
      const neighbours=[[0,1],[1,0],[0,-1],[-1,0]].map(([dx,dz])=>{
        const col=i%design.width+dx,row=Math.floor(i/design.width)+dz;return col<0||row<0||col>=design.width||row>=design.depth?-1:row*design.width+col;
      });
      const face=(shape,color,d,u,h,depth,sx,sy,sz)=>{const angle=a+d*Math.PI/2;add(shape,color,x+Math.cos(angle)*u+Math.sin(angle)*depth,base+h,z-Math.sin(angle)*u+Math.cos(angle)*depth,sx,sy,sz,angle);};
      for(let level=0;level<floors;level++){
        const source=designFloor(design,i,level),cell={...source,color:b.floorColors?.[level]??source.color},bottom=level*FLOOR;
        if(cell.style==='arcade'){
          for(const u of [-.535,.535])for(const v of [-.535,.535]){
            const c=Math.cos(a),s=Math.sin(a);add('box',cell.color,x+c*u+s*v,base+bottom+FLOOR/2,z-s*u+c*v,.18,FLOOR,.18,a);
          }
          for(let d=0;d<4;d++)face('arcade',cell.color,d,0,bottom,.49,1.255,1,.14);
        }else{
          add('box',cell.color,x,base+bottom+FLOOR/2,z,1.255,FLOOR,1.255,a);
          for(let d=0;d<4;d++){
            const next=neighbours[d];if(next>=0&&customFloors(design,next)>level&&designFloor(design,next,level).style==='solid')continue;
            const worldDirection=(d+b.direction)%4,entry=b.businesses?.find(e=>e.cell===i&&e.floor===level&&e.direction===worldDirection);
            const shop=entry?customBusinessOwner(world,b,entry):null;
            if(shop&&renderBusiness&&businessFrontClear(world,shop)){
              const doorU=SPECIAL_SHOPS[entry.type]?.door??(entry.type==='bar'?-.31:0);
              const supported=level>0||entranceSupported(shop,worldDirection,doorU);
              const steps=!supported?entranceSteps(shop,worldDirection,doorU,.46):null;
              if(supported||steps){
                if(steps)renderEntranceSteps(steps,(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,d,u,h-base,depth,sx,sy,sz));
                renderBusiness(shop,base+bottom);continue;
              }
            }
            const type=cell.faces[d];face('box','#e7dcc4',d,0,bottom+.035,.641,1.28,.065,.05);
            if(type==='blank')continue;
            const ground=world.tiles.find(t=>t.x===p.x&&t.z===p.z);
            const doorU=typeof type==='object'?entranceLayout(type).door:0;
            const needsAccess=level===0&&(type==='door'||typeof type==='object')&&!entranceSupported(ground,(d+b.direction)%4,doorU);
            const steps=needsAccess?entranceSteps(ground,(d+b.direction)%4,doorU,type?.door==='double'?.54:.46):null;
            if(steps)renderEntranceSteps(steps,(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,d,u,h-base,depth,sx,sy,sz));
            const unsupported=needsAccess&&!steps;
            if(unsupported){
              renderRaisedEntrance(typeof type==='object'?type:null,(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,d,u,bottom+h,depth,sx,sy,sz),{trim:'#ded0b5',shutter:'#466e68'});
            }else if(typeof type==='object'){
              renderEntrance(type,(shape,color,u,h,depth,sx,sy,sz)=>face(shape,color,d,u,bottom+h,depth,sx,sy,sz),{trim:'#ded0b5',shutter:'#466e68'});
            }else if(type==='arched-window'){
              for(const u of [-.30,.30])renderEntranceWindow('arch',(shape,color,x,h,depth,sx,sy,sz)=>face(shape,color,d,x,bottom+h,depth,sx,sy,sz),u);
            }else if(type==='door'){
              face('arch','#ded0b5',d,0,bottom+.035,.642,.42,.57,.03);face('arch','#466e68',d,0,bottom+.055,.68,.30,.48,.025);
            }else{
              const balcony=type==='balcony';
              for(const u of (balcony?[-.16,.16]:[-.30,.30])){
                face('box','#eee4d1',d,u,bottom+.44,.65,balcony?.28:.30,balcony?.57:.41,.04);
                face('box','#4f747b',d,u,bottom+.44,.679,.20,balcony?.48:.32,.026);
                face('box','#bed0c3',d,u,bottom+.44,.698,.017,balcony?.47:.31,.015);
              }
              if(balcony){
                face('box','#ece0c5',d,0,bottom+.145,.75,.95,.07,.25);
                face('box','#4c625a',d,0,bottom+.45,.855,.91,.025,.025);
                for(let rail=-3;rail<=3;rail++)face('box','#4c625a',d,rail*.13,bottom+.30,.855,.018,.30,.018);
              }
            }
          }
        }
      }
      const topColor=b.floorColors?.[floors-1]??designFloor(design,i,floors-1).color,roof=design.roof[i],top=base+floors*FLOOR,angle=a+roof.direction*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
      const rp=(shape,color,u,h,v,sx,sy,sz,tilt=0)=>add(shape,color,x+c*u+s*v,top+h,z-s*u+c*v,sx,sy,sz,angle,0,tilt);
      if(roof.type==='attic'){
        renderAtticRoof(rp,topColor,roof.color);
      }else if(roof.type==='flat'){
        rp('box',roof.color,0,.04,0,1.30,.08,1.30);
        for(let d=0;d<4;d++){
          const next=neighbours[d];if(next>=0&&customFloors(design,next)===floors&&design.roof[next].type==='flat')continue;
          face('box',topColor,d,0,floors*FLOOR+.20,.605,1.30,.29,.09);
        }
      }else if(roof.type==='shed'){
        rp('shedWall',topColor,0,0,0,1.255,1,1.255);
        const slope=Math.atan(.42/1.255),w=1.37/Math.cos(slope);
        rp('box',roof.color,0,.315,0,w,.065,1.37,-slope);
        for(let j=-4;j<=4;j++)rp('box',roof.color,0,.353,j*.146,w,.025,.024,-slope);
      }else{
        rp('gable',topColor,0,0,0,1.24,.88,1.24);const slope=Math.atan2(.39,.65);
        for(const side of [-1,1]){rp('box',roof.color,side*.335,.17,0,.81,.065,1.37,-side*slope);for(let j=-4;j<=4;j++)rp('box',roof.color,side*.335,.204,j*.146,.81,.022,.024,-side*slope);}
        rp('box',roof.color,0,.39,0,.10,.075,1.39);
      }
    }
  }
}
