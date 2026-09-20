/** Mod personal · API 1 · requereix geometries personals (v91+) i menuAfter (v94+). */
/** renderer(landmark, part, unit, helpers) — cap canvi al nucli. */
export function renderIsraelFlag(landmark,part){
  const pole=-.38;
  part('cylinder','#c8bda5',pole,.07,0,.36,.14,.36);
  part('cylinder','#e6decb',pole,.17,0,.24,.08,.24);
  part('cylinder','#9aa7a3',pole,1.47,0,.043,2.56,.043);
  part('sphere','#d5b775',pole,2.77,0,.075,.075,.075);
  part('cylinder','#e7dfc3',pole+.037,1.51,-.018,.008,2.38,.008);
  for(const y of [2.03,2.64])part('box','#d3d5bd',pole+.025,y,0,.052,.022,.026);
  part('box','#697c78',pole+.022,.60,.015,.025,.095,.035);
  part('israelFlagCloth','#ffffff',-.353,2,0,1,1,1);
  part('israelFlagEmblem','#0057b7',-.353,2,0,1,1,1);
}
