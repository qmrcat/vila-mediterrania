// Comprova dues coses de les formes personals que genera el taller:
//  1. que el codi exportat produeix exactament la mateixa geometria que la
//     previsualització de l'editor,
//  2. que el validador del joc (createPersonalGeometries) l'accepta.
//
// Ús:  node editor-mods/check-formes.mjs
import * as THREE from '../vendor/three.module.min.js';
import { createPersonalGeometries } from '../personal-geometries.js';
import { TEMPLATES, defaultParams, geometriesFile } from './personal-shapes.js';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cases = [
  { id: 'tubPrim', template: 'tub', params: { cares: 24, gruix: .12 } },
  { id: 'tubGruixut', template: 'tub', params: { cares: 8, gruix: .4 } },
  { id: 'prismaHexagonal', template: 'prisma', params: defaultParams('prisma') },
  { id: 'piramideOctogonal', template: 'prisma', params: { cares: 8, dalt: 0 } },
  { id: 'escalaCurta', template: 'escala', params: { graons: 3 } },
  { id: 'escalaLlarga', template: 'escala', params: { graons: 12 } },
  { id: 'teulaRomana', template: 'teula', params: defaultParams('teula') },
  { id: 'teulaGruixuda', template: 'teula', params: { cares: 6, gruix: .18, estret: 1 } },
];

const file = join(tmpdir(), `formes-${Date.now()}.mjs`);
writeFileSync(file, geometriesFile(cases));
const { PERSONAL_GEOMETRIES } = await import(`file://${file}`);
unlinkSync(file);

let worst = 0;
for (const item of cases) {
  const mine = TEMPLATES[item.template].build(THREE, item.params);
  const theirs = PERSONAL_GEOMETRIES[item.id](THREE);
  const a = mine.getAttribute('position'), b = theirs.getAttribute('position');
  if (a.count !== b.count) throw new Error(`${item.id}: ${a.count} vèrtexs contra ${b.count}`);
  for (let i = 0; i < a.count; i++)
    worst = Math.max(worst,
      Math.abs(a.getX(i) - b.getX(i)), Math.abs(a.getY(i) - b.getY(i)), Math.abs(a.getZ(i) - b.getZ(i)));
  mine.computeBoundingBox();
  const box = mine.boundingBox;
  console.log(`${item.id.padEnd(18)} ${String(a.count).padStart(5)} vèrtexs · `
    + `x ${box.min.x.toFixed(3)}…${box.max.x.toFixed(3)} · `
    + `y ${box.min.y.toFixed(3)}…${box.max.y.toFixed(3)} · `
    + `z ${box.min.z.toFixed(3)}…${box.max.z.toFixed(3)}`);
}
console.log(`\nDiferència màxima entre la previsualització i el codi exportat: ${worst}`);

// El validador del joc, amb les formes oficials com a referència de col·lisions.
const core = { box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.SphereGeometry(.5, 10, 6) };
const built = createPersonalGeometries(THREE, core, PERSONAL_GEOMETRIES);
console.log(`createPersonalGeometries n'accepta ${Object.keys(built).length} de ${cases.length}.`);
