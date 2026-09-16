/**
 * Prat d'herbes · terreny personal per a Vila Mediterrània (API de mods 1).
 *
 * Com el prat del joc, però amb més varietat: mates d'herba creuades en vuit
 * verds diferents, tiges altes amb espiga, matolls baixos i unes quantes flors.
 *
 * El renderitzador rep el conjunt d'eines del joc. Aquí només se'n fan servir
 * dues:
 *   root(u, v, radi) → el punt d'arrelament sobre el pendent real de la cel·la,
 *                      o null si aquell tros està ocupat per una altra cosa.
 *   emit(p, forma, color, u, h, v, sx, sy, sz, gir) → una peça relativa a l'arrel.
 *
 * Tot és determinista: la mateixa cel·la té sempre les mateixes herbes, i dues
 * cel·les veïnes en tenen de diferents. No cal desar res al JSON de la vila.
 */

// Del verd fosc de la ufana al verd clar de l'herba nova, amb un to grisenc.
const GRASS = ['#5d7f49', '#6b8f52', '#79a05b', '#87ad66', '#95b972', '#a3c47f', '#b0cd88', '#6e8b62'];
const SEEDS = ['#c3c98c', '#b9c47a', '#d3cd96'];
const PETALS = ['#fff5dc', '#f1d166', '#db91ab', '#cfdcea'];

/** Soroll estable per cel·la: no depèn de cap import del joc. */
const rnd = (t, seed) => {
  const n = Math.sin((t.x + 13.37) * 127.1 + (t.z + 7.71) * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

const pick = (list, value) => list[Math.min(Math.floor(value * list.length), list.length - 1)];

export function renderGrassland(t, { root, emit }) {
  // Mates d'herba: dues caixes creuades, com les pastures del joc, però amb
  // alçada i to independents a cada mata i a cada creuament.
  for (let i = 0; i < 16; i++) {
    const u = (rnd(t, 610 + i) - .5) * .90;
    const v = (rnd(t, 640 + i) - .5) * .90;
    const p = root(u, v, .030);
    if (!p) continue;
    const height = .028 + rnd(t, 670 + i) * .048;
    const angle = rnd(t, 700 + i) * Math.PI;
    emit(p, 'box', pick(GRASS, rnd(t, 730 + i)), 0, height / 2, 0, .011, height, .052, angle);
    emit(p, 'box', pick(GRASS, rnd(t, 760 + i)), 0, height * .44, 0, .011, height * .88, .045, angle + Math.PI / 2);
  }

  // Tiges altes amb l'espiga a dalt: són les que trenquen la planor.
  for (let i = 0; i < 5; i++) {
    const u = (rnd(t, 790 + i) - .5) * .84;
    const v = (rnd(t, 810 + i) - .5) * .84;
    const p = root(u, v, .025);
    if (!p) continue;
    const height = .11 + rnd(t, 830 + i) * .07;
    const angle = rnd(t, 850 + i) * Math.PI;
    emit(p, 'box', pick(GRASS, rnd(t, 870 + i)), 0, height / 2, 0, .008, height, .008, angle);
    // Unes espigues punxegudes i unes altres de plomall cap avall.
    emit(p, i % 2 ? 'cone' : 'carrot', pick(SEEDS, rnd(t, 890 + i)),
      0, height + .012, 0, .022, .046, .022, angle);
  }

  // Matolls baixos, per fer taques de color més fosc.
  for (let i = 0; i < 4; i++) {
    const u = (rnd(t, 910 + i) - .5) * .76;
    const v = (rnd(t, 930 + i) - .5) * .76;
    const p = root(u, v, .080);
    if (!p) continue;
    const size = .13 + rnd(t, 950 + i) * .09;
    emit(p, 'rock', pick(GRASS, rnd(t, 970 + i) * .5), 0, .042, 0, size, .075, size, rnd(t, 990 + i) * 6);
    emit(p, 'rock', pick(GRASS, .5 + rnd(t, 1010 + i) * .5), -.018, .068, .012, size * .62, .05, size * .62, rnd(t, 1030 + i) * 6);
  }

  // Unes poques flors, amb el mateix gest que les del prat del joc.
  for (let i = 0; i < 3; i++) {
    const u = (rnd(t, 1050 + i) - .5) * .80;
    const v = (rnd(t, 1070 + i) - .5) * .80;
    const p = root(u, v, .045);
    if (!p) continue;
    const height = .045 + rnd(t, 1090 + i) * .035;
    const angle = rnd(t, 1110 + i) * Math.PI * 2;
    const petal = pick(PETALS, rnd(t, 1130 + i));
    emit(p, 'box', '#537e48', 0, height / 2, 0, .007, height, .007);
    emit(p, 'box', '#6a9859', .008, height * .40, 0, .029, .007, .012, angle);
    for (let leaf = 0; leaf < 4; leaf++) {
      const a = angle + leaf * Math.PI / 2;
      emit(p, 'box', petal, Math.cos(a) * .017, height, Math.sin(a) * .017, .026, .010, .023, a);
    }
    emit(p, 'box', '#c7a245', 0, height + .006, 0, .015, .009, .015, angle);
  }
}
