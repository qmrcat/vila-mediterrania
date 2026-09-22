// Constants del joc i catàleg de formes. Aquest fitxer no importa Three.js, cosa
// que permet provar el format i els exportadors fora del navegador.
export const UNIT = 1.3;
export const FLOOR_HEIGHT = 0.86;
export const TERRAIN_STEP = 0.42;

export const SHAPES = [
  'box', 'cylinder', 'cone', 'sphere', 'rock', 'ring', 'ramp', 'arch', 'gable',
  'shedWall', 'arcade', 'fan', 'carrot', 'churchCap', 'hotelStar',
  'stoneBridgeArch', 'wallGate', 'wallGateTrim', 'barberPoleRed', 'barberPoleBlue',
];

// Nom en català de cada forma, per al desplegable. La clau continua sent
// l'identificador anglès, que és el que va al codi generat.
export const SHAPE_NAMES = {
  box: 'cub',
  cylinder: 'cilindre',
  cone: 'con',
  sphere: 'esfera',
  rock: 'roca',
  ring: 'anella',
  ramp: 'rampa',
  arch: 'arc',
  gable: 'frontó',
  shedWall: 'paret a una aigua',
  arcade: 'arcada',
  fan: 'ventall',
  carrot: 'con invertit',
  churchCap: 'piràmide',
  hotelStar: 'estrella',
  stoneBridgeArch: 'arcada de pont',
  wallGate: 'portal de muralla',
  wallGateTrim: 'marc del portal',
  barberPoleRed: 'franja vermella',
  barberPoleBlue: 'franja blava',
};

// Pistes curtes per al desplegable: què és cada forma i com s'orienta.
export const SHAPE_HINTS = {
  box: 'Cub d’1 × 1 × 1, centrat. La base de gairebé tot.',
  cylinder: 'Cilindre vertical de 12 cares fixes; sy és l’alçada, sx i sz el diàmetre. Per a més cares, fes-te’n un de personal amb la plantilla Prisma.',
  cone: 'Con vertical amb la punta amunt, de 8 cares fixes. Amb la plantilla Prisma i el radi superior a 0 en pots fer un de les cares que vulguis.',
  carrot: 'Con amb la punta avall.',
  sphere: 'Esfera de poca resolució, 10 × 6, fixa: és així a posta perquè el poble sembli fet de la mateixa pasta.',
  rock: 'Dodecàedre. Escalat i girat a l’atzar fa fullatge i pedra.',
  ring: 'Tor prim: anelles, cèrcols, baranes rodones.',
  ramp: 'Falca del pendent del terreny.',
  arch: 'Arc de mig punt extrudit cap a +Z; sz és el gruix.',
  gable: 'Frontó triangular d’alçada .42 dins la unitat.',
  shedWall: 'Paret de teulada a una aigua.',
  arcade: 'Timpà amb el buit de l’arc realment obert.',
  fan: 'Fulla de ventall del margalló. Superfície plana.',
  churchCap: 'Piràmide de base quadrada per a coronaments.',
  hotelStar: 'Estrella plana dels rètols d’hotel.',
  stoneBridgeArch: 'Arcada del pont de pedra.',
  wallGate: 'Portal obert de les muralles.',
  wallGateTrim: 'La motllura que emmarca el portal de muralla.',
  barberPoleRed: 'Franja helicoidal vermella del barber pole.',
  barberPoleBlue: 'Franja helicoidal blava del barber pole.',
};
