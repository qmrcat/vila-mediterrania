# Operacions booleanes i materials transparents · v97

Aquesta ampliació permet crear peces noves per programació als mods personals. Conserva l’API 1, les crides existents de `part()` i el format 66 de les viles. La transparència s’afegeix com un objecte opcional al lloc on abans passaves el color.

## Instal·lar l’actualització

Copia els fitxers del ZIP a la carpeta del joc v96, respectant les rutes, i puja’ls al repositori. La versió del joc passa a 97. Les carpetes de catàleg, renderitzadors i geometries dels teus mods no se substitueixen; el paquet només afegeix un fitxer d’exemples dins de `mods-personals`.

El paquet necessita la resta del joc existent. Després que GitHub Pages acabi de publicar, fes una recàrrega amb Ctrl + Majúscules + R.

## Crear una geometria amb un tall

Importa l’ajudant des del fitxer del teu mod:

```js
import {booleanGeometry, composeGeometry} from '../solid-geometry.js';
```

Exemple dins del teu registre `PERSONAL_GEOMETRIES`:

```js
cubAmbTunel(THREE) {
  const cub = new THREE.BoxGeometry(1, 1, 1);
  const tall = new THREE.CylinderGeometry(.23, .23, 1.6, 24);

  try {
    return booleanGeometry(THREE, 'subtract', cub, {
      geometry: tall,
      rotation: [Math.PI / 2, 0, 0], // El cilindre travessa el cub en Z.
      position: [0, 0, 0],
      scale: [1, 1, 1],
    }).translate(0, .5, 0); // Origen final al centre de la base.
  } finally {
    cub.dispose();
    tall.dispose();
  }
},
```

Des del renderitzador:

```js
part('cubAmbTunel', '#c6b391', 0, 0, 0, 1, 1, 1);
```

L’operació es calcula quan es crea la geometria compartida. No la cridis dins del renderitzador ni a cada fotograma.

## Operacions disponibles

```js
booleanGeometry(THREE, operacio, peçaA, peçaB);
```

| Operació | Àlies | Resultat |
| --- | --- | --- |
| `union` | `unio` | Uneix els volums de les dues peces. |
| `subtract` | `resta` | Elimina d’A el volum ocupat per B. |
| `intersect` | `interseccio` | Conserva el volum comú. |

Cada operand pot ser una `BufferGeometry` o un objecte `{geometry, position, rotation, scale}`. Les tres transformacions són opcionals, amb valors per defecte `[0,0,0]`, `[0,0,0]` i `[1,1,1]`. Les rotacions segueixen X, Y, Z i s’expressen en radians. Primer s’aplica l’escala, després la rotació i finalment la translació.

L’operació utilitza les coordenades dels operands, independentment de la cel·la de l’edifici. Pots construir les formes amb Three.js o reutilitzar les funcions de geometria dels teus mods, incloses les peces buides. La transparència no intervé en el càlcul del volum.

L’ajudant retorna una geometria nova: no modifica ni elimina els operands. Elimina amb `dispose()` les geometries temporals que hagis creat. No eliminis una geometria compartida que estigui utilitzant el joc.

## Encadenar diversos talls

```js
const resultat = composeGeometry(THREE, mur, [
  {operation: 'subtract', operand: {geometry: finestra, position: [-.3, 0, 0]}},
  {operation: 'subtract', operand: {geometry: finestra, position: [ .3, 0, 0]}},
  {operation: 'union', operand: cornisa},
]);
```

Les operacions s’apliquen en l’ordre escrit. Per foradar de costat a costat, fes que el volum de tall sobresurti de les dues cares. Per fer un nínxol, introdueix-lo només parcialment.

## Transparència i vidre

La crida tradicional continua igual:

```js
part('box', '#e6d7bd', 0, .5, 0, 1, 1, .2);
```

Per a una peça transparent, passa un objecte de material:

```js
part('box', {
  color: '#8bd5ec',
  opacity: .30,
  roughness: .12,
  metalness: 0,
  doubleSide: true,
}, 0, .5, 0, .45, .45, .025);
```

| Camp | Valors | Per defecte |
| --- | --- | --- |
| `color` | Color hexadecimal `#rrggbb`, obligatori. | — |
| `opacity` | De 0 (invisible) a 1 (opac). | `1` |
| `roughness` | De 0 (superfície polida) a 1 (rugosa). | `.92` |
| `metalness` | De 0 (no metàl·lic) a 1 (metàl·lic). | `0` |
| `doubleSide` | Dibuixa les dues cares de cada triangle. | `false` |

Els objectes transparents no projecten ombres opaques i s’ordenen individualment segons la càmera. Les peces opaques continuen agrupades en instàncies. La transparència és de barreja de color, sense refracció física; moltes superfícies transparents interpenetrades poden mostrar limitacions d’ordenació i costen més de dibuixar.

Fer una peça transparent no la converteix automàticament en un tallador. Per a una finestra amb vidre, fes primer la resta sobre el mur i després dibuixa el vidre amb una segona crida a `part()`. Així el mur i el vidre conserven materials diferents. Un resultat booleà és una única forma, a la qual `part()` assigna un material.

## Registrar els quatre exemples inclosos

A `mods-personals/geometries.js`, afegeix:

```js
import {BOOLEAN_EXAMPLES} from './exemples-booleans.js';
```

I dins de l’objecte existent `PERSONAL_GEOMETRIES`, sense eliminar les altres entrades:

```js
...BOOLEAN_EXAMPLES,
```

Disposaràs de `csgCubForadat`, `csgUnio`, `csgInterseccio` i `csgTresForats`. El registre continua exportant-se des de `renderers.js` amb la línia habitual. Els exemples són opcionals; el nucli també funciona amb els registres personals buits.

Per veure una peça perforada amb vidre dins de la vila, pots registrar també aquest edifici opcional a `PERSONAL_LANDMARKS`, dins de `catalog.js`:

```js
tallerBoolea: {
  name: 'Mostra de peça perforada amb vidre',
  sizes: [1],
  height: 1.1,
  help: 'Una peça perforada amb un vidre transparent. Ocupa una cel·la.',
},
```

A `renderers.js`, importa i registra el renderitzador:

```js
import {renderBooleanWorkshop} from './exemples-booleans.js';

// Dins de PERSONAL_LANDMARK_RENDERERS:
tallerBoolea: renderBooleanWorkshop,
```

Cal registrar també `BOOLEAN_EXAMPLES` perquè l’edifici trobi la seva forma. Apareixerà a Edificis → Mods personals.

## Taller interactiu

Obre `booleans-demo.html` des del servidor del joc. Una vegada publicat, serà a:

https://qmrcat.github.io/vila-mediterrania/booleans-demo.html

Permet triar dues formes, desplaçar el volum auxiliar, aplicar les tres operacions, ajustar l’opacitat i girar la vista. El volum auxiliar es pot mostrar semitransparent. També mostra el codi de l’exemple actual per copiar-lo a un mod. No canvia la vila ni exporta automàticament el resultat a l’editor.

## Condicions i límits

- Utilitza superfícies tancades, amb cares orientades cap a fora i sense auto-interseccions. Un tub amb parets de gruix real pot servir; una superfície sense gruix no defineix un volum. El sistema no repara automàticament malles mal formades.
- Evita detalls minúsculs o superfícies gairebé coincidents; el càlcul utilitza toleràncies numèriques. Fes servir un nombre moderat de segments a esferes i cilindres.
- Límit de 4.000 triangles per operand, 16 operacions per composició i 60.000 polígons intermedis. Són proteccions de complexitat, no una garantia de temps de càlcul per a qualsevol malla.
- Un resultat final buit produeix un missatge explícit, perquè no es pot registrar com una forma dibuixable. Un resultat intermedi buit es pot tornar a omplir amb una unió.
- El resultat conserva posicions i normals; no conserva UV, colors per vèrtex ni grups de materials dels operands.
- Les operacions només modifiquen l’aspecte geomètric: l’ocupació de cel·les, la selecció i les regles de construcció continuen sent les del joc.
- El desament de la vila conserva els identificadors dels mods, no el codi de les formes. Cal compartir els fitxers dels mods per recuperar-los en un altre dispositiu.

## Implementació i comprovació

Motor CSG local d’Evan Wallace, amb llicència MIT, incorporat a `vendor/csg.module.js`. Font: https://github.com/evanw/csg.js, blob `17b7a2f15ab99dab891b4acd34bd2870e94eeaf0`. L’únic canvi al motor és declarar i exportar `CSG` com a mòdul ES. La llicència completa és a `vendor/csg.LICENSE.txt`. El joc no necessita cap CDN ni instal·lació de paquets.

```sh
node --test tests/solid-geometry.test.mjs
node mods-personals/check.mjs
node check-mods.mjs
```

Han passat 32 proves combinades amb la inspecció d’elements, les peces buides i les animacions: volums d’unió/resta/intersecció, forats reals, transformacions, originals intactes, validació, materials, integració amb registres buits i edificis amb diversos vidres. Queda pendent la comprovació visual en un navegador real.
