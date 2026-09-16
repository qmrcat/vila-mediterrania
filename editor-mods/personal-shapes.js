// Formes personals (API 1, des de la v91). El joc registra geometries noves a
// mods-personals/geometries.js: funcions síncrones que reben THREE i tornen una
// BufferGeometry nova.
//
// Aquí hi ha unes quantes plantilles paramètriques. Cada plantilla té dues
// cares que han de coincidir sempre: build(), que la construeix perquè la vegis
// a l'editor, i code(), que escriu la funció que enganxaràs al joc. Hi ha una
// prova a check-formes.mjs que compara vèrtex a vèrtex que fan el mateix.
import { num } from './format.js';

export const SHAPES_KEY = 'vila-mediterrania-shapes-1';
export const SHAPE_ID_PATTERN = /^[a-z][A-Za-z0-9]{1,39}$/;

const clampInt = (value, min, max, fallback) =>
  Math.min(Math.max(Math.round(num(value, fallback)), min), max);
const clampNum = (value, min, max, fallback) =>
  Math.min(Math.max(num(value, fallback), min), max);

// El cos de la teula, escrit dues vegades a posta: una com a text, que és el
// que s'enganxa a geometries.js, i una com a funció, que és la que dibuixa la
// previsualització. check-formes.mjs compara vèrtex a vèrtex que coincideixen.
const TILE_BODY = `    const ends=[[-.5,1],[.5,estret]];
    const point=(end,i,inner)=>{
      const a=Math.PI*i/seg,r=(inner?.5-gruix:.5)*ends[end][1];
      return [Math.cos(a)*r,Math.sin(a)*r,ends[end][0]];
    };
    const quad=(a,b,c,d)=>{pos.push(...a,...b,...c,...a,...c,...d);};
    for(let i=0;i<seg;i++){
      // cara exterior i cara interior
      quad(point(0,i,0),point(0,i+1,0),point(1,i+1,0),point(1,i,0));
      quad(point(0,i,1),point(1,i,1),point(1,i+1,1),point(0,i+1,1));
      // les dues testes
      quad(point(0,i,0),point(0,i,1),point(0,i+1,1),point(0,i+1,0));
      quad(point(1,i,0),point(1,i+1,0),point(1,i+1,1),point(1,i,1));
    }
    // els dos cantells de sota
    quad(point(0,0,0),point(1,0,0),point(1,0,1),point(0,0,1));
    quad(point(0,seg,0),point(0,seg,1),point(1,seg,1),point(1,seg,0));
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geometry.computeVertexNormals();
    return geometry;
`;

function tileGeometry(THREE, seg, gruix, estret) {
  const pos = [];
  const ends = [[-.5, 1], [.5, estret]];
  const point = (end, i, inner) => {
    const a = Math.PI * i / seg, r = (inner ? .5 - gruix : .5) * ends[end][1];
    return [Math.cos(a) * r, Math.sin(a) * r, ends[end][0]];
  };
  const quad = (a, b, c, d) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); };
  for (let i = 0; i < seg; i++) {
    quad(point(0, i, 0), point(0, i + 1, 0), point(1, i + 1, 0), point(1, i, 0));
    quad(point(0, i, 1), point(1, i, 1), point(1, i + 1, 1), point(0, i + 1, 1));
    quad(point(0, i, 0), point(0, i, 1), point(0, i + 1, 1), point(0, i + 1, 0));
    quad(point(1, i, 0), point(1, i + 1, 0), point(1, i + 1, 1), point(1, i, 1));
  }
  quad(point(0, 0, 0), point(1, 0, 0), point(1, 0, 1), point(0, 0, 1));
  quad(point(0, seg, 0), point(0, seg, 1), point(1, seg, 1), point(1, seg, 0));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export const TEMPLATES = {
  tub: {
    name: 'Tub · cilindre buit',
    note: 'Diàmetre exterior 1, alçada 1, centrat. Escala’l amb sx, sy i sz.',
    fields: [
      { key: 'cares', label: 'Cares', min: 6, max: 64, step: 1, value: 24 },
      { key: 'gruix', label: 'Gruix de paret', min: .02, max: .45, step: .01, value: .12 },
    ],
    clean: params => ({
      cares: clampInt(params.cares, 6, 64, 24),
      gruix: clampNum(params.gruix, .02, .45, .12),
    }),
    build(THREE, params) {
      const { cares, gruix } = this.clean(params);
      const shape = new THREE.Shape();
      shape.absarc(0, 0, .5, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, .5 - gruix, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: cares })
        .translate(0, 0, -.5).rotateX(-Math.PI / 2);
    },
    code(id, params) {
      const { cares, gruix } = this.clean(params);
      return `  // Tub de ${cares} cares, paret de ${gruix}. Diàmetre 1, alçada 1, centrat.\n` +
        `  ${id}(THREE){\n` +
        `    const shape=new THREE.Shape();\n` +
        `    shape.absarc(0,0,.5,0,Math.PI*2,false);\n` +
        `    const hole=new THREE.Path();\n` +
        `    hole.absarc(0,0,${.5 - gruix},0,Math.PI*2,true);\n` +
        `    shape.holes.push(hole);\n` +
        `    return new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,curveSegments:${cares}})\n` +
        `      .translate(0,0,-.5).rotateX(-Math.PI/2);\n` +
        `  },`;
    },
  },

  prisma: {
    name: 'Prisma · piràmide de N cares',
    note: 'Amb el radi superior a 0 surt una piràmide; a 1, un prisma recte.',
    fields: [
      { key: 'cares', label: 'Cares', min: 3, max: 64, step: 1, value: 6 },
      { key: 'dalt', label: 'Radi superior', min: 0, max: 1, step: .05, value: 1 },
    ],
    clean: params => ({
      cares: clampInt(params.cares, 3, 64, 6),
      dalt: clampNum(params.dalt, 0, 1, 1),
    }),
    build(THREE, params) {
      const { cares, dalt } = this.clean(params);
      return new THREE.CylinderGeometry(.5 * dalt, .5, 1, cares, 1, false);
    },
    code(id, params) {
      const { cares, dalt } = this.clean(params);
      return `  // Prisma de ${cares} cares amb el radi superior al ${Math.round(dalt * 100)} %.\n` +
        `  ${id}(THREE){\n` +
        `    return new THREE.CylinderGeometry(${.5 * dalt},.5,1,${cares},1,false);\n` +
        `  },`;
    },
  },

  teula: {
    name: 'Teula romana · corba',
    note: 'Amplada 1 en X, llargada 1 en Z, alçada 0,5 en Y i base a Y=0. L’extrem estret mira a +Z.',
    fields: [
      { key: 'cares', label: 'Cares de l’arc', min: 4, max: 24, step: 1, value: 10 },
      { key: 'gruix', label: 'Gruix', min: .04, max: .2, step: .01, value: .1 },
      { key: 'estret', label: 'Estretiment', min: .6, max: 1, step: .02, value: .84 },
    ],
    clean: params => ({
      cares: clampInt(params.cares, 4, 24, 10),
      gruix: clampNum(params.gruix, .04, .2, .1),
      estret: clampNum(params.estret, .6, 1, .84),
    }),
    build(THREE, params) {
      const { cares, gruix, estret } = this.clean(params);
      return tileGeometry(THREE, cares, gruix, estret);
    },
    code(id, params) {
      const { cares, gruix, estret } = this.clean(params);
      return `  // Teula romana de ${cares} cares, gruix ${gruix}, extrem estret al ${Math.round(estret * 100)} %.\n` +
        `  // Amplada 1 en X, llargada 1 en Z, alçada .5 en Y, base a Y=0.\n` +
        `  ${id}(THREE){\n` +
        `    const seg=${cares},gruix=${gruix},estret=${estret},pos=[];\n` +
        `${TILE_BODY}` +
        `  },`;
    },
  },

  escala: {
    name: 'Escala · graons',
    note: 'Puja cap a +X dins d’un cub d’1 × 1 × 1. L’amplada va per sz.',
    fields: [{ key: 'graons', label: 'Graons', min: 2, max: 24, step: 1, value: 4 }],
    clean: params => ({ graons: clampInt(params.graons, 2, 24, 4) }),
    build(THREE, params) {
      const { graons } = this.clean(params);
      const shape = new THREE.Shape();
      shape.moveTo(-.5, -.5);
      for (let i = 1; i <= graons; i++) {
        const y = -.5 + i / graons;
        shape.lineTo(-.5 + (i - 1) / graons, y);
        shape.lineTo(-.5 + i / graons, y);
      }
      shape.lineTo(.5, -.5);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false }).translate(0, 0, -.5);
    },
    code(id, params) {
      const { graons } = this.clean(params);
      return `  // Escala de ${graons} graons dins d'un cub unitat, pujant cap a +X.\n` +
        `  ${id}(THREE){\n` +
        `    const steps=${graons},shape=new THREE.Shape();\n` +
        `    shape.moveTo(-.5,-.5);\n` +
        `    for(let i=1;i<=steps;i++){\n` +
        `      const y=-.5+i/steps;\n` +
        `      shape.lineTo(-.5+(i-1)/steps,y);\n` +
        `      shape.lineTo(-.5+i/steps,y);\n` +
        `    }\n` +
        `    shape.lineTo(.5,-.5);shape.closePath();\n` +
        `    return new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false}).translate(0,0,-.5);\n` +
        `  },`;
    },
  },
};

export const defaultParams = template =>
  Object.fromEntries(TEMPLATES[template].fields.map(field => [field.key, field.value]));

/** Si no tens cap forma pròpia, el taller arrenca amb la teula. */
export const starterDrafts = () => [
  { id: 'teulaRomana', template: 'teula', params: defaultParams('teula') },
].map(validateDraft);

export function validateDraft(input) {
  if (!input || typeof input !== 'object') throw new Error('Això no és una forma personal.');
  const id = String(input.id ?? '');
  if (!SHAPE_ID_PATTERN.test(id)) throw new Error('El nom de la forma ha de començar per minúscula, tenir entre 2 i 40 caràcters i només lletres i xifres.');
  if (!Object.hasOwn(TEMPLATES, input.template)) throw new Error(`La plantilla «${input.template}» no existeix.`);
  return { id, template: input.template, params: TEMPLATES[input.template].clean(input.params ?? {}) };
}

export function loadDrafts(storage) {
  try {
    const raw = storage.getItem(SHAPES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(validateDraft) : [];
  } catch { return []; }
}

export const saveDrafts = (storage, drafts) =>
  storage.setItem(SHAPES_KEY, JSON.stringify(drafts.map(validateDraft)));

/** El fitxer mods-personals/geometries.js sencer. */
export function geometriesFile(drafts) {
  const body = drafts.map(draft => TEMPLATES[draft.template].code(draft.id, draft.params)).join('\n');
  return `/**\n * Formes personals: id: (THREE) => BufferGeometry.\n` +
    ` * Es creen una sola vegada i es comparteixen entre totes les instàncies.\n` +
    ` * No cridis dispose() ni modifiquis la geometria des dels renderitzadors.\n */\n` +
    `export const PERSONAL_GEOMETRIES={\n${body}\n};\n`;
}
