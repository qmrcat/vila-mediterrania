// Dos exemples trets de mods-personals/README.md, per veure de seguida com una
// crida part() es converteix en una fila de la llista.
import { newMod, newPart } from './format.js';

function collect(draw) {
  const parts = [];
  const part = (shape, color, u, h, v, sx, sy, sz, ry = 0, rx = 0, rz = 0) =>
    parts.push(newPart({ shape, color, u, h, v, sx, sy, sz, ry, rx, rz }));
  draw(part);
  return parts;
}

const watchtower = collect(part => {
  const unit = 1.3;
  part('box', '#c4b89d', 0, .05, 0, unit * .8, .10, unit * .8);
  part('cylinder', '#b3a68c', 0, 1.05, 0, .78, 2, .78);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    part('box', '#c4b89d', Math.sin(angle) * .39, 2.02, Math.cos(angle) * .39, .16, .12, .05, angle);
  }
  part('arch', '#7a6247', 0, .10, .38, .30, .52, .03);
  part('cone', '#a66d4d', 0, 2.20, 0, 1.02, .42, 1.02);
});

const obelisk = collect(part => {
  part('box', '#c9bea5', 0, .06, 0, 1.3 * .72, .12, 1.3 * .72);
  part('box', '#b6aa91', 0, .22, 0, .58, .22, .58);
  part('box', '#d4cab3', 0, 1.12, 0, .28, 1.65, .28);
  part('cone', '#c2b69d', 0, 2.00, 0, .34, .25, .34, Math.PI / 4);
});

export const starterMods = () => [
  newMod({
    id: 'watchtower', name: 'Torre de guaita', category: 'monument', sizes: [1], previewSize: 1,
    height: 2.41, autoHeight: true,
    help: 'Torre defensiva d’una cel·la, sobre terra ferma lliure i anivellada. Tria l’orientació.',
    parts: watchtower,
  }),
  newMod({
    id: 'obelisk', name: 'Obelisc', category: 'monument', sizes: [1], previewSize: 1,
    height: 2.13, autoHeight: true,
    help: 'Una cel·la lliure i anivellada de terra ferma, carrer o plaça.',
    parts: obelisk,
  }),
];
