# Mod personal: pal amb bandera d’Israel

Per a Vila Mediterrània v96 o posterior, API de mods 1.

Ocupa 1 × 1 cel·la i ofereix les quatre orientacions. La bandera té fons blanc, dues franges blaves i una estrella de David formada per dos triangles buits. El dibuix es veu per les dues cares. La tela oneja i el costat del pal es manté fix. Si el dispositiu té activat el moviment reduït, la bandera queda quieta.

## Instal·lació

Copia aquests quatre fitxers dins de la carpeta `mods-personals` del joc:

- `israel-flag-definition.js`
- `israel-flag.js`
- `israel-flag-geometries.js`
- `israel-flag-animation.js`

Fes les incorporacions següents als registres existents. Afegeix les línies indicades conservant totes les entrades dels altres mods; no dupliquis les declaracions `export const`.

### 1. Catàleg: `mods-personals/catalog.js`

Afegeix aquesta importació a l’inici:

```js
import {ISRAEL_FLAG_DEFINITION} from './israel-flag-definition.js';
```

Dins de l’objecte existent `PERSONAL_LANDMARKS`, afegeix:

```js
flagIsrael: ISRAEL_FLAG_DEFINITION,
```

### 2. Renderitzador: `mods-personals/renderers.js`

Afegeix aquesta importació a l’inici:

```js
import {renderIsraelFlag} from './israel-flag.js';
```

Dins de l’objecte existent `PERSONAL_LANDMARK_RENDERERS`, afegeix:

```js
flagIsrael: renderIsraelFlag,
```

### 3. Formes: `mods-personals/geometries.js`

Afegeix aquesta importació a l’inici:

```js
import {ISRAEL_FLAG_GEOMETRIES} from './israel-flag-geometries.js';
```

Dins de l’objecte existent `PERSONAL_GEOMETRIES`, afegeix:

```js
...ISRAEL_FLAG_GEOMETRIES,
```

El teu `renderers.js` ja ha de tenir aquesta reexportació de formes. Conserva-la; si no existeix, afegeix-la una sola vegada:

```js
export {PERSONAL_GEOMETRIES} from './geometries.js';
```

### 4. Animació: `mods-personals/renderers.js`

Afegeix, si encara no tens un registre d’animacions:

```js
export {ISRAEL_FLAG_ANIMATIONS as PERSONAL_GEOMETRY_ANIMATIONS} from './israel-flag-animation.js';
```

Si ja tens `PERSONAL_GEOMETRY_ANIMATIONS`, importa `ISRAEL_FLAG_ANIMATIONS` i afegeix `...ISRAEL_FLAG_ANIMATIONS,` dins de l’objecte existent, conservant les altres entrades.

## Utilització

Actualitza la pàgina després de pujar els fitxers i els registres modificats al repositori. El trobaràs a **Edificis → Costa i banderes → Pal amb bandera d’Israel**, després del pal amb la bandera negra, gràcies a `menuAfter: 'flagBlack'`.

Tria l’orientació i clica una cel·la de terreny lliure. Segueix les regles dels edificis personals: conserva l’alçada del terreny i, sobre un pendent, el joc crea una base anivellada. També segueix les regles habituals de reserva de la cel·la i les seves decoracions. No incorpora el tractament especial del terreny dels pals oficials.

Amb Navega a la v95, la fitxa mostra el nom d’aquest mod i permet copiar-ne el JSON si tens l’opció activada. L’identificador desat és `flagIsrael`. Per compartir o recuperar una vila que en contingui, conserva també aquest mod.

Cal instal·lar primer el nucli v96 del paquet d’actualització. Després, aquest mod no necessita més canvis al nucli. No cal canviar `config.js` ni els desaments.

## Comprovacions

Des de la carpeta del joc:

```sh
node mods-personals/check.mjs
node check-mods.mjs
```

Comprovat amb els mods existents: registre de formes, geometria, quatre orientacions, alçades, pendents, ordre del menú, esborrament i recuperació JSON. No s’ha fet comprovació visual en un navegador real.

Per retirar el mod, elimina primer els pals de les viles que vulguis conservar; després retira les incorporacions dels registres i els quatre fitxers.
