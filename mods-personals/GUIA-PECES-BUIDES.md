# Vuit peces buides per als mods personals

Compatibles amb l’API 1 i el registre de geometries personals de Vila Mediterrània v91 o posterior. Amb les 24 formes existents, el registre passa a tenir-ne 32. No cal canviar el nucli ni la versió del format de les viles.

## Instal·lació

1. Copia `peces-buides.js`, aquesta guia i `peces-buides-demo.html` dins de `mods-personals`.
2. A l’inici del teu `mods-personals/geometries.js`, afegeix:

```js
import {PECES_BUIDES} from './peces-buides.js';
```

3. Dins de l’objecte existent `PERSONAL_GEOMETRIES`, afegeix:

```js
...PECES_BUIDES,
```

Conserva totes les entrades existents, inclosa `...ISRAEL_FLAG_GEOMETRIES,`. No dupliquis la declaració de `PERSONAL_GEOMETRIES`. La importació i la incorporació amb els tres punts són totes dues necessàries.

El teu `mods-personals/renderers.js` ha de conservar la línia que ja exporta les formes:

```js
export {PERSONAL_GEOMETRIES} from './geometries.js';
```

Puja els fitxers nous i el `geometries.js` modificat al repositori. Després que es publiquin, recarrega el joc amb Ctrl + Majúscules + R. El ZIP no substitueix els registres dels teus altres mods.

## Peces i dimensions

Totes les formes tenen amplada 1, alçada 1 i fondària 1 abans d’escalar: X i Z van de −0,5 a 0,5; Y va de 0 a 1. El punt d’inserció és al centre de la base. Les cares interiors tenen gruix i normals pròpies: no cal un material transparent ni dibuixar les dues cares del mateix triangle.

| Identificador | Forma i obertura |
| --- | --- |
| `marcRectangularBuit` | Marc amb pas interior de 0,76 × 0,76; vores de 0,12. |
| `marcCircularBuit` | Marc circular al pla XY, amb diàmetre exterior 1 i interior 0,72. |
| `arcMigPuntBuit` | Portal de mig punt sense llindar; pas de 0,72 a la base. |
| `arcApuntatBuit` | Portal apuntat format per dos arcs de circumferència, sense llindar. |
| `tubBuit` | Tub vertical seguint Y; diàmetres exterior 1 i interior 0,72; obert als dos extrems. |
| `caixaOberta` | Recipient obert per dalt; parets i fons de 0,12; espai interior de 0,76 × 0,76. |
| `murFinestra` | Mur amb una finestra central de 0,60 × 0,54; ampit a Y = 0,24. |
| `murTresFinestres` | Mur amb tres finestres de 0,19 × 0,54; centres X = −0,30, 0 i 0,30; ampit a Y = 0,24. |

Redueix habitualment la fondària dels marcs i murs a 0,10–0,25 amb el paràmetre `sz`. Els tubs i les caixes acostumen a necessitar una fondària semblant a l’amplada. Escalar la peça també escala les vores i el forat. Per canviar-ne les proporcions interiors independentment, crea una variant de la funció de geometria amb un identificador diferent.

## Exemples amb `part()`

Signatura habitual:

```js
part(forma, color, x, yBase, z, amplada, alçada, fondària, girY, girX, girZ);
```

Les rotacions són opcionals i s’expressen en radians. Exemples independents, dins del renderitzador del teu edifici:

```js
// Marc rectangular de finestra.
part('marcRectangularBuit', '#e6d7bd', 0, .50, .45, .50, .65, .10);

// Òcul circular.
part('marcCircularBuit', '#e6d7bd', 0, 1.30, .45, .45, .45, .12);

// Portal de mig punt.
part('arcMigPuntBuit', '#c6b391', 0, 0, 0, .90, 1.30, .22);

// Portal apuntat.
part('arcApuntatBuit', '#c6b391', 0, 0, 0, .90, 1.50, .22);

// Paret cilíndrica d’un pou, sense fons.
part('tubBuit', '#b7a384', 0, 0, 0, .65, .45, .65);

// Jardinera rectangular, oberta per dalt i amb fons.
part('caixaOberta', '#bd7959', 0, 0, 0, .90, .25, .40);

// Mur amb una finestra real.
part('murFinestra', '#e2d4b8', 0, 0, 0, 1.10, 1.10, .20);

// Mur amb tres finestres reals.
part('murTresFinestres', '#e2d4b8', 0, 0, 0, 1.20, 1.10, .20);
```

Un marc buit no perfora una altra paret que estigui al darrere. Per veure a través d’una façana, utilitza el mur amb obertura o distribueix les altres parets al voltant del buit. Aquestes peces són geometries per programar mods: no afegeixen vuit eines al menú del joc ni canvien les regles d’ocupació o de selecció de cel·les.

Per a peces inclinades en un edifici que també gira, pots fer servir el helper `orientedPart()` que ja proporciona el joc.

## Mostra 3D

Amb el joc obert des d’un servidor local, visita `mods-personals/peces-buides-demo.html`. Després de pujar-lo a GitHub Pages, la ruta és:

https://qmrcat.github.io/vila-mediterrania/mods-personals/peces-buides-demo.html

Permet seleccionar cada peça, girar-la arrossegant, ajustar-ne la fondària i veure els triangles. Importa Three.js de la carpeta `vendor` del joc, sense afegir dependències ni carregar la vila.

## Comprovacions

El ZIP també inclou `tests/peces-buides.test.mjs`. Des de la carpeta del joc:

```sh
node --test tests/peces-buides.test.mjs
node mods-personals/check.mjs
node check-mods.mjs
```

Han passat 11 proves: continuïtat de les malles, orientació de les cares, dimensions, triangles, passos oberts, ampits, interiors, extrems del tub i fons de la caixa. S’ha inspeccionat també una previsualització estàtica de les geometries; la pàgina de mostra queda pendent de comprovació en un navegador real.
