// El contracte que s'envia al model. Es genera a partir de les constants del
// taller, de manera que si un dia el joc guanya una forma o una mida, el
// prompt es posa al dia tot sol i no pot quedar desfasat.
//
// Fitxer pur: ni DOM, ni Three.js, ni crides de xarxa.
import { SHAPES, SHAPE_NAMES, SHAPE_HINTS, UNIT, FLOOR_HEIGHT, TERRAIN_STEP } from './constants.js';
import { SIZES, footprint } from './format.js';

/**
 * Una línia per forma personal. El taller mesura la geometria abans d'enviar
 * res, de manera que el model sap com és de gran i, sobretot, si el punt
 * d'inserció és al centre o a la base: és l'error que més cara costa.
 */
const personalRow = note => {
  const size = note.size.map(value => value.toFixed(2)).join(' × ');
  const where = note.base === 'bottom' ? 'h és la BASE: la peça creix cap amunt'
    : note.base === 'centre' ? 'h és el centre, com les oficials'
      : `la base queda ${Math.abs(note.low).toFixed(2)} per ${note.low >= 0 ? 'damunt' : 'sota'} de h`;
  return `  ${note.id} (${note.label}) — forma personal; ${size} abans d'escalar; ${where}`;
};

const shapeTable = (extra, notes) => {
  const rows = SHAPES.map(id => `  ${id} (${SHAPE_NAMES[id] ?? id}) — ${SHAPE_HINTS[id] ?? ''}`);
  if (!extra.length) return rows.join('\n');
  rows.push('  --- formes personals ja instal·lades en aquesta còpia del joc ---');
  const byId = new Map(notes.map(note => [note.id, note]));
  for (const id of extra) {
    const note = byId.get(id);
    rows.push(note ? personalRow(note)
      : `  ${id} — forma personal; cap dins d'un cub unitat, com les altres`);
  }
  return rows.join('\n');
};

/** Com fer-les servir. Només surt si la còpia del joc en té cap. */
const personalNotes = extra => (extra.length ? `
## Les formes personals

Aquesta còpia del joc en té ${extra.length}, i són tan bones com les oficials.
El nom en diu la intenció: si n'hi ha una que ja és un marc buit, un arc obert,
un mur amb finestres o un recipient, fes-la servir en comptes d'imitar-la amb
quatre caixes. Queda més neta i gasta menys peces.

Si pel nom no saps què és una forma, no la facis servir: val més una caixa que
una sorpresa.

Mira't la línia del catàleg abans de col·locar-ne cap: moltes tenen la BASE a
Y=0 en comptes d'estar centrades, i per a aquestes h és la base i no el centre.
Les que fan de marc o de mur solen quedar bé amb la fondària baixada a 0.10-0.25
amb sz; escalar la peça escala també les vores i el forat.
` : '');

const plotTable = () => SIZES.map(s => {
  const halfU = (s.width * UNIT / 2).toFixed(3), halfV = (s.depth * UNIT / 2).toFixed(3);
  return `  sizes:[${s.size}] → ${s.label} cel·les → u de -${halfU} a ${halfU}, v de -${halfV} a ${halfV}`;
}).join('\n');

/** Les regles del joc. Va com a system prompt. */
export function systemPrompt({ personalShapes = [], shapeNotes = [] } = {}) {
  return `Ets un modelador del joc Vila Mediterrània, un constructor de viles inspirat en
Townscaper i en l'arquitectura de la Costa Brava i la Costa Daurada. Component
edificis i monuments a partir de formes primitives instanciades.

NO modeles malles lliures. No hi ha vèrtexs ni corbes. Cada peça és una de les
formes del catàleg, col·locada, escalada i girada. Aquesta limitació és el que
fa que tot el poble sembli fet de la mateixa pasta: respecta-la.

## La crida de dibuix

  part(forma, color, u, h, v, sx, sy, sz, ry, rx, rz)

- u va cap a l'EST, v cap al SUD, h és l'alçada des de la base del terreny.
- sx, sy, sz són la mida en unitats de món.
- ry, rx, rz són els girs EN RADIANS.

REGLA QUE MÉS S'EQUIVOCA: h, u i v són el CENTRE de la peça, no la seva base ni
la seva cantonada. Un pilar de 0.66 d'alt que ha de seure a terra va a h=0.33,
i ocupa de 0 a 0.66. Una paret de 1.04 d'alt damunt d'un sòcol de 0.08 va a
h = 0.08 + 1.04/2 = 0.60.
L'única excepció són les formes personals que es declarin amb la base a Y=0;
si n'hi ha cap al catàleg, s'indica a la seva línia.

## Unitats

  cel·la           ${UNIT}      amplada d'una cel·la de la quadrícula
  pis              ${FLOOR_HEIGHT}     alçada d'una planta de les cases del joc
  nivell de terra  ${TERRAIN_STEP}     desnivell entre dos nivells de terreny

Un edifici de dues plantes fa uns 1.7-2.0 d'alt amb la teulada. Un monument
d'una cel·la rarament passa de 3.

## Orientació

Dibuixa SEMPRE com si l'edifici mirés al SUD: la façana principal, la porta i
l'entrada van a v POSITIU. El joc ja gira l'edifici sencer quan el jugador tria
una altra orientació; no ho compensis tu.

## La parcel·la

Tot ha de cabre dins de la parcel·la. Si declares diverses mides, la comprovació
es fa contra la MÉS PETITA.

${plotTable()}

Deixa un marge: un sòcol que arriba a 1.24 dins d'una cel·la d'1.3 queda bé; un
que arriba a 1.30 frega la casa del costat.

## Catàleg de formes

${shapeTable(personalShapes, shapeNotes)}

Notes de les formes que costen més:
- gable és un triangle que mira a +Z. Per fer el frontó d'una teulada a dues
  aigües orientada est-oest, gira'l ry = ±PI/2.
- arch i arcade s'extrudeixen cap a +Z: sz és el gruix.
- cylinder és sempre vertical: sy és l'alçada, sx i sz el diàmetre.
- ring és un tor dret com una roda; per posar-lo pla, rx = PI/2. Estirat per
  l'eix (sz gran) fa una paret cilíndrica buida d'una sola peça.
- rock és un dodecàedre: escalat i girat desigual fa pedra i fullatge.
${personalNotes(personalShapes)}
## Girs

- Un gir només en ry és un gir normal.
- Un gir en rx o rz TOMBA la peça (vessants de teulada, rampes, pals inclinats).
  Declara'l igualment a rx/rz: el taller ja sap que aquestes peces s'han
  d'emetre amb orientedPart perquè no quedin torçades en girar l'edifici.

Per a un vessant de teulada, el pendent i la llargada surten d'un triangle: si
el vessant cobreix B en horitzontal i puja A, llavors rx = atan(A/B) i la
llargada de la llosa és sqrt(A² + B²). No allarguis la llosa "perquè arribi
més lluny": el que passa és que se surt de la cel·la.

## Colors

Cada color nou crea un material al joc. Fes servir entre 6 i 12 colors per
edifici, mai més de 14. Reaprofita els tons en comptes de matisar-los.

Paleta mediterrània que lliga amb la resta del poble:
  parets         #f2eee3 #ece0c4 #d4cab3 #cbbd9d
  pedra i sòcols #bdae92 #b6aa91 #b5a88d
  teula          #b87850 #b2603f #a2553d
  fusta          #72563b #6f5236 #8a6a44
  obertures      #41595e #45636a #1c565b
  vegetació      #567043 #4f6b3f #6f8a5a

Si l'edifici de la fotografia té un color propi i característic, fes-lo servir,
però mantén-lo dins d'aquesta lluminositat: el joc és clar i assolellat.

Al lloc del color hi pots posar un material, i això només val la pena per als
VIDRES: {"color":"#8bd5ec","opacity":0.3,"roughness":0.12,"doubleSide":true}.
opacity, roughness i metalness van de 0 a 1. Fes-ho servir amb comptagotes, en
una o dues peces com a molt: la resta de l'edifici ha d'anar amb el color sol.
Un vidre NO és un forat: no retalla la paret de sota, només es veu translúcid.

## Com treballar

1. Mira les fotografies i decideix el VOLUM: quantes plantes, quina planta té
   l'edifici, quin tipus de coberta, quins elements el fan reconeixible.
   Cada imatge porta el seu nom a sobre, i algunes poden portar una indicació
   escrita per qui les ha fetes: quina cara és, què s'hi ha de mirar o què no
   s'ha de tenir en compte. Fes-ne cas per damunt del que dedueixis de la
   imatge: és informació que tu no pots veure.
2. Construeix de baix a dalt: sòcol, cos, ràfec, coberta, remats.
3. Posa les obertures ENGANXADES a la cara de la paret, no encastades. Si la
   paret acaba a v = 0.58, la porta va a v = 0.585 amb sz = 0.03.
4. Simplifica. Un edifici de 15 a 40 peces es llegeix millor, a la distància
   del joc, que un de 200. Escull els tres o quatre trets que el fan
   reconeixible i deixa la resta.

## El que has de tornar

NOMÉS un objecte JSON, sense text abans ni després, sense tanques de codi:

{
  "format": "vila-mod",
  "version": 2,
  "requiresModApi": 1,
  "id": "identificadorCamelCase",
  "name": "Nom en català",
  "category": "building" o "monument",
  "sizes": [1],
  "height": 1.91,
  "help": "Una frase en català dient on es pot col·locar.",
  "parts": [
    {"shape":"box","color":"#bdae92","u":0,"h":0.04,"v":0,
     "sx":1.24,"sy":0.08,"sz":1.24,"ry":0,"rx":0,"rz":0}
  ]
}

- id: comença per minúscula, només lletres i xifres, de 2 a 40 caràcters.
- category: "monument" per a torres, fites, creus, obeliscos, muralles i
  elements sense interior; "building" per a la resta.
- height: l'alçada real de la peça més alta. Calcula-la, no l'inventis.
- Tots els camps de cada peça són obligatoris, també els girs a 0.`;
}

/** Un exemple complet comentat, com a torn d'assistent. */
export function workedExample(mod) {
  return `Aquest és un exemple del format i del nivell de detall que espero, una casa
de poble d'una cel·la i 1.91 d'alt, feta amb 16 peces:

${JSON.stringify({ ...mod, parts: mod.parts }, null, 1)}

Fixa-t'hi: el sòcol arriba a 1.24 i no a 1.3; les parets seuen damunt del
sòcol; les obertures són a v = 0.585, just davant de la paret que acaba a
0.58; els dos vessants de la teulada tenen rx oposats; i la xemeneia, que és
la peça més alta, marca l'alçada declarada.`;
}

/** L'encàrrec concret que acompanya les fotografies. */
export function taskPrompt({ brief, sizes, category, id, name }) {
  const plots = sizes.map(size => `${footprint(size).label} cel·les`).join(' o ');
  return [
    'Mira aquestes fotografies i component-ne la versió del joc.',
    brief?.trim() ? `\nEl que en sé: ${brief.trim()}` : '',
    `\nRequisits:`,
    `- Parcel·la: ${plots} (sizes: [${sizes.join(', ')}]).`,
    `- Eina: ${category === 'monument' ? 'Monuments' : 'Edificis'}.`,
    id ? `- Fes servir l'identificador "${id}".` : '',
    name ? `- Fes servir el nom "${name}".` : '',
    `\nTorna només el JSON.`,
  ].filter(Boolean).join('\n');
}

/** La petició de correcció, amb els avisos i les vistes renderitzades. */
export function fixPrompt({ notes, bounds, mod }) {
  const problems = notes.filter(note => note.level !== 'info');
  const lines = [
    'Cada imatge porta el seu nom a sobre. Les que diuen «El teu model» són el que',
    'has fet, renderitzat amb el motor del joc des del sud, des de l\'est i des de dalt.',
    '',
    'Compara-les amb les fotografies i corregeix el que no encaixi: proporcions,',
    'nombre de plantes, posició de les obertures, forma de la coberta.',
    'Si alguna fotografia porta una indicació escrita, fes-ne cas: és el que',
    'l\'autor sap de l\'edifici i tu no pots veure.',
  ];
  if (bounds) lines.push('',
    `Mesures del teu model: ocupa u de ${bounds.minU.toFixed(3)} a ${bounds.maxU.toFixed(3)},`,
    `v de ${bounds.minV.toFixed(3)} a ${bounds.maxV.toFixed(3)}, i arriba a ${bounds.maxH.toFixed(3)} d'alt.`);
  if (problems.length) lines.push('', 'Problemes que has de resoldre sí o sí:',
    ...problems.map(note => `- ${note.text}`));
  if (mod) lines.push('', `Peces actuals: ${mod.parts.length}. Colors: ${new Set(mod.parts.map(p => p.color)).size}.`);
  lines.push('', 'Torna el JSON sencer corregit, no només les peces que canvies.');
  return lines.join('\n');
}
