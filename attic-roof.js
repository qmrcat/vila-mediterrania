/** Half-width attic and open terrace. Local +X is the terrace side. */
export const ATTIC_ROOF_HEIGHT=.84;
export function renderAtticRoof(part,wall,tiles){
  const iron='#3c5553',trim='#eee4ce';
  part('box',trim,0,.04,0,1.30,.08,1.30);
  // Closed attic occupies exactly the rear half of the roof plan.
  part('box',wall,-.3125,.32,0,.625,.48,1.25);
  part('gable',wall,-.3125,.56,0,.625,.52,1.25);
  const slope=Math.atan2(.2184,.3125);
  for(const side of [-1,1]){
    part('box',tiles,-.3125+side*.165,.668,0,.41,.045,1.30,-side*slope);
    for(let j=-4;j<=4;j++)part('box',tiles,-.3125+side*.165,.697,j*.145,.41,.015,.018,-side*slope);
  }
  part('box',tiles,-.3125,.792,0,.065,.035,1.32);
  // Door from the attic onto the terrace, with a pale stone frame.
  part('box',trim,.009,.29,0,.028,.42,.25);
  part('box','#447e87',.026,.28,0,.018,.38,.20);
  part('box','#cfad65',.039,.27,.065,.012,.022,.012);
  for(const v of [-.633,.633]){
    part('box',trim,-.32,.36,v,.24,.23,.025);
    part('box','#447e87',-.32,.36,v*1.017,.19,.18,.018);
  }
  // Iron railing follows the three exposed terrace edges.
  for(let j=-4;j<=4;j++)part('box',iron,.605,.235,j*.148,.02,.31,.02);
  part('box',iron,.605,.40,0,.035,.035,1.23);
  for(const v of [-.605,.605]){
    for(const u of [.10,.27,.44])part('box',iron,u,.235,v,.02,.31,.02);
    part('box',iron,.305,.40,v,.61,.035,.035);
  }
  // Two T-shaped posts with two taut clotheslines and pegged laundry.
  for(const v of [-.43,.43]){
    part('box',iron,.38,.38,v,.025,.60,.025);
    part('box',iron,.38,.68,v,.32,.024,.024);
  }
  for(const u of [.25,.51])part('box','#d6d0bd',u,.682,0,.009,.009,.86);
  for(const [u,v,color,width,height] of [[.25,-.22,'#f5eee0',.20,.24],[.25,.15,'#84adb6',.16,.19],[.51,-.12,'#e5b6aa',.18,.21],[.51,.22,'#e7ca92',.14,.17]]){
    part('box',color,u,.678-height/2,v,.012,height,width);
    for(const edge of [-1,1])part('box','#b79666',u,.686,v+edge*width*.34,.021,.028,.018);
  }
}
