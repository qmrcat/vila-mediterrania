import {renderCastle} from './castle-geometry.js';
import {createSenyera} from './senyera.js';
import {createPoleFlag,renderFlagpole,POLE_FLAG_ORIGIN} from './flagpoles.js';
import {renderServiceBuilding} from './service-buildings.js';
import {renderCemetery} from './cemetery-geometry.js';
import {renderWall} from './wall-geometry.js';
import {Euler,Quaternion,Vector3} from './vendor/three.module.min.js';
import {renderCivicBuilding} from './civic-geometry.js';
import {LANDMARK_TYPES,landmarkDimensions,terrainY} from './model.js';

/** Instanced playground equipment and a Mediterranean lighthouse. */
export function renderLandmarks(world,add,unit,flags=[]){
  for(const l of world.landmarks??[]){
    const {width,depth}=landmarkDimensions(l),base=terrainY(world.tiles.find(t=>t.x===l.x&&t.z===l.z));
    const x=(l.x+(width-1)/2)*unit,z=(l.z+(depth-1)/2)*unit,a=l.direction*Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    const part=(shape,color,u,h,v,sx,sy,sz,ry=0,rx=0,rz=0)=>add(shape,color,x+c*u+s*v,base+h,z-s*u+c*v,sx,sy,sz,a+ry,rx,rz);
    const box=(color,u,h,v,sx,sy,sz,rx=0,rz=0)=>part('box',color,u,h,v,sx,sy,sz,0,rx,rz);
    // A cylinder joining any two points, expressed in the landmark's local frame.
    const beam=(color,p,q,r=.03)=>{
      const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],len=Math.hypot(dx,dy,dz);
      // Vertical tilt is around Z; yaw places it in the required horizontal direction.
      part('cylinder',color,(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,r,len,r,-Math.atan2(dz,dx),0,-Math.atan2(Math.hypot(dx,dz),dy));
    };
    if(LANDMARK_TYPES[l.type]?.flag){
      renderFlagpole(part);
      const flag=createPoleFlag(LANDMARK_TYPES[l.type].flag),p=POLE_FLAG_ORIGIN;
      flag.position.set(x+c*p.u+s*p.z,base+p.y,z-s*p.u+c*p.z);flag.rotation.y=a;
      flag.userData.landmark={...l};flags.push(flag);continue;
    }
    if(l.type==='castle'){
      const p=renderCastle(l,part,unit),flag=createSenyera();
      flag.position.set(x+c*p.u+s*p.v,base+p.y,z-s*p.u+c*p.v);flag.rotation.y=a;
      flag.userData.castle=true;flags.push(flag);continue;
    }
    if(l.type==='cemetery'){renderCemetery(l,part,unit);continue;}
    if(LANDMARK_TYPES[l.type]?.category==='monument'){renderWall(l,part,unit);continue;}
    if(['hospital','school','police','fireStation','recycling'].includes(l.type)){
      // Rotate local roof slopes with the building (world yaw precedes local tilt).
      const yaw=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),a),q=new Quaternion(),e=new Euler();
      const civicPart=(shape,color,u,h,v,sx,sy,sz,ry=0,rx=0,rz=0)=>{
        q.setFromEuler(e.set(rx,ry,rz)).premultiply(yaw);e.setFromQuaternion(q);
        add(shape,color,x+c*u+s*v,base+h,z-s*u+c*v,sx,sy,sz,e.y,e.x,e.z);
      };
      if(['fireStation','recycling'].includes(l.type))renderServiceBuilding(l,civicPart,unit);
      else renderCivicBuilding(l,civicPart,unit);
      continue;
    }
    if(l.type==='lighthouse'){
      part('cylinder','#c7baa2',0,.07,0,1.16,.14,1.16);
      part('cylinder','#f2eadb',0,1.37,0,.72,2.48,.72);
      part('cylinder','#d9cfbb',0,.22,0,.86,.22,.86);
      for(const h of [.88,1.87])part('cylinder','#b95b49',0,h,0,.735,.24,.735);
      // Narrow windows on three sides; an entrance on the selected fourth side.
      for(const yaw of [Math.PI/2,Math.PI,Math.PI*1.5])for(const h of [1.26,2.24]){
        part('box','#d2c7b3',Math.sin(yaw)*.362,h,Math.cos(yaw)*.362,.16,.32,.025,yaw);
        part('box','#476978',Math.sin(yaw)*.381,h,Math.cos(yaw)*.381,.105,.245,.025,yaw);
      }
      box('#d8c7a8',0,.41,.366,.29,.54,.035);box('#376778',0,.40,.392,.21,.45,.032);
      box('#e5d7bb',0,.155,.46,.36,.075,.23);box('#d7b867',.065,.39,.414,.02,.045,.015);
      part('cylinder','#efe5ce',0,2.66,0,1.02,.14,1.02);
      for(let i=0;i<16;i++){
        const theta=i*Math.PI/8,u=Math.sin(theta)*.47,v=Math.cos(theta)*.47;
        part('cylinder','#45636a',u,2.83,v,.022,.28,.022);
        const next=(i+1)*Math.PI/8;beam('#45636a',[u,2.97,v],[Math.sin(next)*.47,2.97,Math.cos(next)*.47],.024);
      }
      part('cylinder','#365c67',0,2.81,0,.59,.16,.59);
      part('sphere','#ffe9a0',0,3.08,0,.31,.38,.31);
      for(let i=0;i<8;i++){
        const theta=i*Math.PI/4;part('cylinder','#365c67',Math.sin(theta)*.255,3.10,Math.cos(theta)*.255,.024,.45,.024);
      }
      part('cylinder','#365c67',0,3.34,0,.63,.075,.63);
      part('cone','#b15e4d',0,3.50,0,.78,.28,.78);
      part('cylinder','#45636a',0,3.65,0,.026,.12,.026);
      continue;
    }
    const large=l.size===4,halfW=unit-.045,halfD=unit*(large?1:.5)-.045;
    box('#cbbda1',0,.027,0,halfW*2,.054,halfD*2);
    box('#8caa84',0,.062,0,halfW*2-.06,.022,halfD*2-.06);
    // Low timber perimeter, with an opening facing the chosen entrance direction.
    for(const side of [-1,1]){
      box('#b6a077',side*halfW,.18,0,.035,.08,halfD*2);
      for(const v of [-halfD,0,halfD])box('#917a54',side*halfW,.16,v,.045,.26,.045);
      box('#b6a077',side*(halfW+.24)/2,.18,halfD,halfW-.24,.08,.035);
      box('#917a54',side*.24,.16,halfD,.045,.26,.045);
    }
    box('#b6a077',0,.18,-halfD,halfW*2,.08,.035);
    function swings(u,v){
      const span=large?.82:.62;
      box('#89b7ba',u,.083,v,span+.12,.02,.72);
      for(const side of [-1,1])for(const front of [-1,1])beam('#98734b',[u+side*span/2,.09,v+front*.27],[u+side*span/2,1.16,v],.045);
      beam('#98734b',[u-span/2-.04,1.16,v],[u+span/2+.04,1.16,v],.07);
      for(const offset of (large?[-.19,.19]:[0])){
        for(const side of [-1,1])beam('#5b6b68',[u+offset+side*.105,1.13,v],[u+offset+side*.105,.37,v],.013);
        box('#dba255',u+offset,.36,v,.27,.045,.16);
      }
    }
    function slide(u,v){
      box('#d4b480',u,.084,v+.10,.50,.024,.93);
      for(const side of [-1,1])for(const front of [-1,1])box('#497f80',u+side*.145,.37,v-.23+front*.14,.035,.58,.035);
      box('#dba255',u,.68,v-.23,.36,.065,.36);
      for(const side of [-1,1]){
        box('#497f80',u+side*.17,.84,v-.23,.025,.28,.30);
        beam('#497f80',[u+side*.13,.10,v-.43],[u+side*.13,.67,v-.36],.023);
      }
      for(let i=0;i<5;i++)box('#dba255',u,.17+i*.105,v-.42+i*.013,.26,.025,.07);
      const start=[u,.68,v-.07],end=[u,.13,v+.45],length=Math.hypot(.55,.52),tilt=Math.atan2(.55,.52);
      box('#cf7252',u,(start[1]+end[1])/2,(start[2]+end[2])/2,.28,.035,length,tilt);
      for(const side of [-1,1])box('#e3a06a',u+side*.155,.45,v+.19,.025,.095,length,tilt);
    }
    function sandbox(u,v){
      const size=large?.84:.62;
      box('#edd298',u,.10,v,size,.04,size);
      for(const side of [-1,1]){
        box('#aa8051',u+side*size/2,.13,v,.065,.115,size+.06);
        box('#aa8051',u,.13,v+side*size/2,size+.06,.115,.065);
      }
      part('cone','#dfbd7e',u+.10,.19,v-.07,.21,.14,.21);
      part('cylinder','#d7815b',u-.17,.18,v+.15,.11,.12,.11);
      box('#548d9b',u+.19,.14,v+.13,.045,.018,.17);
    }
    swings(large?-.68:-.81,large?-.62:0);
    slide(large?.52:-.03,large?-.55:0);
    sandbox(large?-.62:.80,large?.65:0);
    if(large){
      // A seesaw and a bench add a fourth activity and a place to sit.
      part('cone','#497f80',.62,.25,.68,.28,.34,.28);
      box('#dba255',.62,.38,.68,.89,.05,.14,0,.13);
      for(const side of [-1,1]){
        box('#cf7252',.62+side*.35,.39+side*.045,.68,.24,.055,.23);
        beam('#497f80',[.62+side*.26,.39+side*.035,.68],[.62+side*.26,.56+side*.035,.68],.025);
      }
      box('#ab8659',0,.25,-1.07,.59,.045,.20);
      for(const side of [-1,1])box('#5d7568',side*.22,.16,-1.07,.035,.16,.15);
    }
  }
}
