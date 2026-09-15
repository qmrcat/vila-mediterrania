/** Molí de vent d'una cel·la, construït només amb formes instanciades. */
export function renderWindmill(landmark,part,unit){
  const stone='#cbbd9d',trim='#e4d5b5',wood='#72563b',tiles='#b87850';
  const box=(color,u,h,v,sx,sy,sz,ry=0,rx=0,rz=0)=>part('box',color,u,h,v,sx,sy,sz,ry,rx,rz);

  // Base, torre cilíndrica i filades de pedra lleugerament alternades.
  box('#c1b291',0,.035,0,unit-.03,.07,unit-.03);
  part('cylinder',stone,0,1.05,0,.86,2.10,.86);
  for(let row=0;row<12;row++){
    const y=.16+row*.16;
    for(let i=0;i<10;i++){
      const angle=i*Math.PI/5+(row%2)*.31;
      // La cara ampla segueix la tangent de la torre; el gruix queda radial.
      box(row%3?stone:trim,Math.sin(angle)*.432,y,Math.cos(angle)*.432,.17,.038,.012,angle);
    }
  }

  // Coberta, portal i mecanisme frontal, encaixat a la torre sota el ràfec.
  part('cone',tiles,0,2.30,0,1.06,.52,1.06);
  // Arc exterior de pedra i porta lleugerament avançada perquè el marc sigui visible.
  part('arch',trim,0,.08,.438,.46,.68,.028); // motllura de la porta
  part('arch',wood,0,.10,.458,.34,.58,.022); // porta de fusta
  // part('arch',trim,0,.08,.438,.46,.68,.028); // motllura de la porta
  // part('arch',wood,0,.10,.458,.34,.58,.022); // porta de fusta
  // L'eix uneix la torre amb unes pales avançades, sense travessar la teulada.
  const axleY=1.83,bladeZ=.64;
  part('cylinder',trim,0,axleY,.53,.15,.22,.15,0,Math.PI/2);
  for(let blade=0;blade<4;blade++){
    const angle=blade*Math.PI/2;
    box(wood,Math.cos(angle)*.26,axleY+Math.sin(angle)*.26,bladeZ,.48,.08,.04,0,0,angle);
  }
}
