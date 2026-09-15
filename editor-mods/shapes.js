// Rèplica exacta de l'objecte `geometries` de scene.js, perquè el que veus a
// l'editor sigui el que el joc dibuixarà. Si scene.js hi afegeix formes noves,
// afegeix-les també aquí amb la mateixa definició.
import * as THREE from '../vendor/three.module.min.js';
import { SHAPES } from './constants.js';

export * from './constants.js';

const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(.5, .5, 1, 12),
  cone: new THREE.ConeGeometry(.5, 1, 8),
  carrot: new THREE.ConeGeometry(.5, 1, 8).rotateZ(Math.PI),
  rock: new THREE.DodecahedronGeometry(.5, 0),
  sphere: new THREE.SphereGeometry(.5, 10, 6),
  ring: new THREE.TorusGeometry(.5, .06, 5, 24),
  churchCap: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4),
};

const arch = new THREE.Shape();
arch.moveTo(-.5, 0); arch.lineTo(.5, 0); arch.lineTo(.5, .65);
arch.absarc(0, .65, .5, 0, Math.PI, false); arch.lineTo(-.5, 0);
geometries.arch = new THREE.ExtrudeGeometry(arch, { depth: 1, bevelEnabled: false, curveSegments: 8 });

const gable = new THREE.Shape();
gable.moveTo(-.5, 0); gable.lineTo(.5, 0); gable.lineTo(0, .42); gable.closePath();
geometries.gable = new THREE.ExtrudeGeometry(gable, { depth: 1, bevelEnabled: false });
geometries.gable.translate(0, 0, -.5);

const shedWall = new THREE.Shape();
shedWall.moveTo(-.5, 0); shedWall.lineTo(.5, 0); shedWall.lineTo(.5, .07); shedWall.lineTo(-.5, .49); shedWall.closePath();
geometries.shedWall = new THREE.ExtrudeGeometry(shedWall, { depth: 1, bevelEnabled: false });
geometries.shedWall.translate(0, 0, -.5);

const arcade = new THREE.Shape();
arcade.moveTo(-.5, .42); arcade.lineTo(-.42, .42);
arcade.absarc(0, .42, .42, Math.PI, 0, true); arcade.lineTo(.5, .42);
arcade.lineTo(.5, .86); arcade.lineTo(-.5, .86); arcade.closePath();
geometries.arcade = new THREE.ExtrudeGeometry(arcade, { depth: 1, bevelEnabled: false, curveSegments: 16 });

const fanVertices = [];
for (let i = 0; i < 18; i++) {
  const edge = j => { const a = -1.15 + j / 18 * 2.3, r = j % 2 ? .69 : 1; return [Math.sin(a) * r, Math.cos(a) * r, j % 2 ? -.035 : .04]; };
  fanVertices.push(0, 0, 0, ...edge(i), ...edge(i + 1));
}
geometries.fan = new THREE.BufferGeometry();
geometries.fan.setAttribute('position', new THREE.Float32BufferAttribute(fanVertices, 3));
geometries.fan.computeVertexNormals();

// Aquestes quatre viuen en mòduls del joc. Si algun canvia de nom en una versió
// futura, l'editor continua obrint-se i la forma cau al cub.
const external = [
  ['ramp', '../slope-geometry.js', m => m.createSlopeWedge()],
  ['hotelStar', '../lodging-geometry.js', m => m.createHotelStarGeometry()],
  ['stoneBridgeArch', '../stone-bridge.js', m => m.createStoneArchGeometry()],
  ['wallGate', '../wall-geometry.js', m => m.createWallGateGeometry()],
  ['barberPoleRed', '../barber-pole.js', m => m.createBarberStripeGeometry(0)],
  ['barberPoleBlue', '../barber-pole.js', m => m.createBarberStripeGeometry(Math.PI)],
];

export const missingShapes = [];

export async function loadShapes() {
  for (const [name, path, build] of external) {
    try {
      geometries[name] = build(await import(path));
    } catch (err) {
      geometries[name] = geometries.box;
      missingShapes.push(name);
    }
  }
  return geometries;
}

export { geometries };
