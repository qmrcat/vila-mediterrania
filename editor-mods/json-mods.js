// Camí B · converteix les dades de json-mods-data.js en renderitzadors
// personals. Copia aquest fitxer i json-mods-data.js dins de mods-personals/
// i registra JSON_LANDMARK_RENDERERS a renderers.js.
//
// No importa Three.js: el gir de les peces inclinades el resol orientedPart,
// que el joc passa com a quart argument del renderitzador.
import { JSON_MODS } from './json-mods-data.js';

// Des de la v97, part() accepta un objecte de material al lloc del color. Les
// peces que no en porten continuen passant el color sol, com sempre.
const MATERIAL_KEYS = ['opacity', 'roughness', 'metalness', 'doubleSide'];

const paint = p => {
  const extra = Object.fromEntries(MATERIAL_KEYS
    .filter(key => p[key] !== undefined)
    .map(key => [key, p[key]]));
  return Object.keys(extra).length ? { color: p.color, ...extra } : p.color;
};

const build = parts => (landmark, part, unit, { orientedPart }) => {
  for (const p of parts) {
    const ry = p.ry ?? 0, rx = p.rx ?? 0, rz = p.rz ?? 0;
    const colour = paint(p);
    if (rx || rz) orientedPart(p.shape, colour, p.u, p.h, p.v, p.sx, p.sy, p.sz, ry, rx, rz);
    else part(p.shape, colour, p.u, p.h, p.v, p.sx, p.sy, p.sz, ry);
  }
};

export const JSON_LANDMARK_RENDERERS = Object.fromEntries(
  JSON_MODS.map(mod => [mod.id, build(mod.parts)]));
