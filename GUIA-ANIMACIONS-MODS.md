# Animacions de geometries personals · v96

Extensió opcional de l’API 1. Les signatures dels renderitzadors, les geometries estàtiques i el format 66 de les viles continuen igual.

## Registre

A `mods-personals/renderers.js` pots exportar un objecte `PERSONAL_GEOMETRY_ANIMATIONS`. Cada clau ha de coincidir amb una forma de `PERSONAL_GEOMETRIES`; no es poden animar formes oficials mitjançant aquest registre.

```js
export const PERSONAL_GEOMETRY_ANIMATIONS={
  formaPersonal: {
    maxDisplacement: 0.16,
    update(geometry, seconds) {
      // Modifica geometry.attributes.position a partir d’una còpia immutable
      // de les posicions originals. seconds és el temps absolut en segons.
    },
  },
};
```

`update` ha de ser síncron. No canviïs el nombre de vèrtexs, els índexs o la topologia, no substitueixis la geometria i no cridis `dispose()`. El nucli actualitza les normals i marca les posicions per enviar-les a la GPU. Les coordenades han de romandre finites.

`maxDisplacement` és el màxim desplaçament de qualsevol vèrtex respecte de la geometria original, en les unitats locals de la forma. El nucli amplia els límits amb aquest marge perquè no desapareguin parts animades en girar la càmera. L’animació ha de respectar el límit declarat i l’alçada/superfície declarades de l’element.

Cada forma es comparteix entre totes les seves instàncies: s’actualitza una vegada per fotograma, només si existeix a la vila. Les còpies que utilitzen la mateixa forma tenen una animació sincronitzada. La tela i el dibuix poden compartir una funció per moure’s junts.

No creïs cap `requestAnimationFrame` ni temporitzador dins del mod. El joc crida el registre al seu bucle de dibuix i omet l’animació amb moviment reduït o amb la pàgina amagada. En reconstruir la vila es reutilitzen les formes compartides; el mod ha de conservar una referència immutable de les posicions inicials, per exemple en un `WeakMap`.

## Bandera d’Israel

`mods-personals/israel-flag-animation.js` proporciona `ISRAEL_FLAG_ANIMATIONS`. La funció de deformació manté l’extrem del pal fix i aplica el mateix moviment a les franges, l’estrella i la tela. No modifica el JSON de la vila ni els renderitzadors del mod anterior.

Si no tens altres animacions, afegeix a `mods-personals/renderers.js`:

```js
export {ISRAEL_FLAG_ANIMATIONS as PERSONAL_GEOMETRY_ANIMATIONS} from './israel-flag-animation.js';
```

Si ja tens el registre, combina les entrades:

```js
import {ISRAEL_FLAG_ANIMATIONS} from './israel-flag-animation.js';

export const PERSONAL_GEOMETRY_ANIMATIONS={
  ...ISRAEL_FLAG_ANIMATIONS,
  // Conserva aquí les altres animacions personals.
};
```

## Verificació

```sh
node --test tests/personal-animations.test.mjs tests/element-inspector.test.mjs
node mods-personals/check.mjs
node check-mods.mjs
```

Les proves cobreixen moviment, fixació al pal, límits, normals, retorn a la posició original, geometries compartides, reconstrucció de la vila i moviment reduït, juntament amb la inspecció d’elements de v95. Queda pendent la comprovació visual en un navegador real.
