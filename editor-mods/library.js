// Biblioteca de peces reutilitzables. Una peça de biblioteca és un grup de
// peces amb nom que s'estampa dins de qualsevol mod: en inserir-la es
// converteix en peces normals i editables, perquè el joc només entén part().
//
// Fitxer pur: ni DOM ni Three.js. Els girs es componen a mà amb quaternions
// per no dependre de la llibreria.
import { newPart, num } from './format.js';
import { SHAPES } from './constants.js';

export const LIBRARY_KEY = 'vila-mediterrania-blocks-1';
export const BLOCK_FORMAT = 'vila-block';

export const blockId = name => {
  const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/)
    .map((word, i) => (i ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase())).join('');
  return /^[a-z]/.test(clean) ? clean.slice(0, 40) : `bloc${clean}`.slice(0, 40);
};

export function validateBlock(input) {
  if (!input || typeof input !== 'object') throw new Error('Això no és una peça de biblioteca.');
  if (!Array.isArray(input.parts) || !input.parts.length) throw new Error('La peça no té cap element.');
  if (input.parts.length > 400) throw new Error('Una peça de biblioteca no pot passar de 400 elements.');
  const parts = input.parts.map(p => {
    if (!SHAPES.includes(p?.shape)) throw new Error(`La forma «${p?.shape}» no existeix al joc.`);
    if (!/^#[0-9a-fA-F]{6}$/.test(String(p.color))) throw new Error('Els colors han de ser hexadecimals de sis xifres.');
    return newPart({
      shape: p.shape, color: String(p.color).toLowerCase(),
      u: num(p.u), h: num(p.h), v: num(p.v),
      sx: num(p.sx, 1), sy: num(p.sy, 1), sz: num(p.sz, 1),
      ry: num(p.ry), rx: num(p.rx), rz: num(p.rz),
    });
  });
  const name = String(input.name ?? 'Peça').slice(0, 40);
  return { format: BLOCK_FORMAT, id: String(input.id ?? blockId(name)), name, parts };
}

export const uniqueBlockName = (blocks, name) => {
  let candidate = name, n = 2;
  while (blocks.some(b => b.name === candidate)) candidate = `${name} ${n++}`;
  return candidate;
};

export function loadLibrary(storage) {
  try {
    const raw = storage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(validateBlock) : [];
  } catch { return []; }
}

export const saveLibrary = (storage, blocks) =>
  storage.setItem(LIBRARY_KEY, JSON.stringify(blocks.map(validateBlock)));

// ——— transformacions de grup ———

/** Base aproximada d'una peça: prou bona per assentar un bloc al terra. */
const floorOf = part => part.h - Math.abs(part.sy) / 2;

/** Centra el grup en planta i li posa la base a zero. */
export function normalizeParts(parts) {
  const midU = parts.reduce((sum, p) => sum + p.u, 0) / parts.length;
  const midV = parts.reduce((sum, p) => sum + p.v, 0) / parts.length;
  const base = Math.min(...parts.map(floorOf));
  return parts.map(p => ({ ...p, u: p.u - midU, v: p.v - midV, h: p.h - base }));
}

export const offsetParts = (parts, du, dh, dv) =>
  parts.map(p => ({ ...p, u: p.u + du, h: p.h + dh, v: p.v + dv }));

// Euler XYZ → quaternion, la mateixa convenció que fa servir el joc.
function quatFromEuler(rx, ry, rz) {
  const c1 = Math.cos(rx / 2), s1 = Math.sin(rx / 2);
  const c2 = Math.cos(ry / 2), s2 = Math.sin(ry / 2);
  const c3 = Math.cos(rz / 2), s3 = Math.sin(rz / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 + s1 * s2 * c3,
    w: c1 * c2 * c3 - s1 * s2 * s3,
  };
}

const multiply = (a, b) => ({
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
});

function eulerFromQuat(q) {
  const { x, y, z, w } = q;
  const m11 = 1 - 2 * (y * y + z * z), m12 = 2 * (x * y - w * z), m13 = 2 * (x * z + w * y);
  const m22 = 1 - 2 * (x * x + z * z), m23 = 2 * (y * z - w * x);
  const m32 = 2 * (y * z + w * x), m33 = 1 - 2 * (x * x + y * y);
  const clamped = Math.min(Math.max(m13, -1), 1);
  const ry = Math.asin(clamped);
  if (Math.abs(m13) < 0.9999999) return { rx: Math.atan2(-m23, m33), ry, rz: Math.atan2(-m12, m11) };
  return { rx: Math.atan2(m32, m22), ry, rz: 0 };
}

/**
 * Gira un grup de peces al voltant del seu centre en planta, en quarts de volta.
 * Composa el gir amb la inclinació de cada peça, com fa orientedPart al joc.
 */
export function rotateParts(parts, quarterTurns) {
  const turns = ((Math.round(quarterTurns) % 4) + 4) % 4;
  if (!turns || !parts.length) return parts.map(p => ({ ...p }));
  const angle = turns * Math.PI / 2;
  const cos = Math.round(Math.cos(angle)), sin = Math.round(Math.sin(angle));
  const midU = parts.reduce((sum, p) => sum + p.u, 0) / parts.length;
  const midV = parts.reduce((sum, p) => sum + p.v, 0) / parts.length;
  const yaw = quatFromEuler(0, angle, 0);
  return parts.map(p => {
    const u = p.u - midU, v = p.v - midV;
    const spun = eulerFromQuat(multiply(yaw, quatFromEuler(p.rx, p.ry, p.rz)));
    return {
      ...p,
      u: midU + u * cos + v * sin,
      v: midV - u * sin + v * cos,
      rx: spun.rx, ry: spun.ry, rz: spun.rz,
    };
  });
}

// ——— peces d'exemple ———

/** Cilindre buit fet de cares planes: la manera controlable de fer-ne un. */
export function hollowCylinder({ faces = 12, radius = .32, height = .5, thickness = .06, color = '#cbbd9d' } = {}) {
  const parts = [];
  const side = 2 * radius * Math.tan(Math.PI / faces) * 1.04;
  for (let i = 0; i < faces; i++) {
    const angle = i * 2 * Math.PI / faces;
    parts.push(newPart({
      shape: 'box', color,
      u: Math.sin(angle) * radius, h: height / 2, v: Math.cos(angle) * radius,
      sx: side, sy: height, sz: thickness, ry: angle,
    }));
  }
  return parts;
}

export const starterBlocks = () => [
  {
    format: BLOCK_FORMAT, id: 'galleda', name: 'Galleda',
    parts: [
      // La paret: una anella estirada per l'eix és un cilindre buit d'una peça.
      newPart({ shape: 'ring', color: '#8a6a44', u: 0, h: .108, v: 0, sx: .29, sy: .29, sz: 1.8, rx: Math.PI / 2 }),
      newPart({ shape: 'cylinder', color: '#6f5236', u: 0, h: .015, v: 0, sx: .28, sy: .03, sz: .28 }),
      newPart({ shape: 'ring', color: '#8d8069', u: 0, h: .25, v: 0, sx: .30, sy: .30, sz: .5 }),
    ],
  },
  {
    format: BLOCK_FORMAT, id: 'cilindreBuit', name: 'Cilindre buit · 12 cares',
    parts: hollowCylinder(),
  },
  {
    format: BLOCK_FORMAT, id: 'finestraAmbAmpit', name: 'Finestra amb ampit',
    parts: [
      newPart({ shape: 'box', color: '#41595e', u: 0, h: .15, v: 0, sx: .22, sy: .26, sz: .03 }),
      newPart({ shape: 'box', color: '#c9b48f', u: 0, h: 0, v: .01, sx: .28, sy: .04, sz: .05 }),
      newPart({ shape: 'box', color: '#d8cba9', u: 0, h: .30, v: .005, sx: .26, sy: .04, sz: .04 }),
    ],
  },
  {
    format: BLOCK_FORMAT, id: 'portaAmbLlinda', name: 'Porta amb llinda',
    parts: [
      newPart({ shape: 'box', color: '#6f5236', u: 0, h: .26, v: 0, sx: .30, sy: .52, sz: .03 }),
      newPart({ shape: 'box', color: '#d8cba9', u: 0, h: .55, v: .005, sx: .38, sy: .06, sz: .04 }),
    ],
  },
].map(validateBlock);
