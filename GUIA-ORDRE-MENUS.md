# Ordenar els mods amb menuAfter — v94

`menuAfter` indica l’identificador de l’opció darrere de la qual vols situar un element. Es configura a `mods-personals/catalog.js`, sense modificar els programes principals per cada mod nou. Canvia la presentació dels menús; no canvia els identificadors, les geometries, el comportament del contingut ni les viles desades. Es mantenen l’API de mods 1 i el format de vila 66.

## El Prat d’herbes

El catàleg inclòs en aquesta actualització ja conté aquesta propietat:

```js
export const PERSONAL_TERRAINS = {
  pratHerbes: {
    name: 'Prat d’herbes',
    menuAfter: 'meadow',
    color: '#86a967',
    height: .40,
    description: 'Herbes altes i baixes en verds variats, amb mates, espigues i flors escampades.',
  },
};
```

Apareix sota **Pradera amb flors**, fora del grup agrícola, tant a **Terreny** com a **Acabat del pendent**. Pots afegir només `menuAfter: 'meadow',` a la teva definició actual; conserva els altres terrenys que hagis creat.

## Propietat dins de cada mod

| Contingut | Lloc on s’afegeix `menuAfter` | Exemple de referència |
| --- | --- | --- |
| Terreny | Definició a `PERSONAL_TERRAINS` | `'meadow'`, `'rocky'`, `'vineyard'` |
| Arbre | Objecte amb `id` a `PERSONAL_TREES` | `'pine'`, `'olive'` |
| Negoci | Definició a `PERSONAL_BUSINESSES` | `'bar'`, `'bakery'`, `'bookshop'` |
| Edifici | Definició a `PERSONAL_LANDMARKS` | `'farmhouse'`, `'school'`, `'museum'` |
| Monument | Definició a `PERSONAL_LANDMARKS`, amb `category: 'monument'` | `'castle'` |

Per exemple, afegir `menuAfter: 'farmhouse',` al Molí de vent el situa darrere de la Masia, dins d’**Allotjaments i masies**. S’hereta la categoria de la referència, també quan la referència és un altre mod. Les categories que queden buides no apareixen.

Els monuments continuen a Monuments: han de referenciar un altre monument. Un arbre ha de referenciar un arbre, i un negoci, un negoci. `menuAfter` no converteix un tipus de contingut en un altre.

## Configuració comuna: ponts i qualsevol altre selector

Per ordenar opcions oficials, o selectors sense un registre de mods propi, afegeix aquesta **exportació opcional** a `mods-personals/catalog.js`. Si ja hi és, amplia l’objecte existent; no declaris dos cops la mateixa exportació.

```js
export const PERSONAL_MENU_ORDER = {
  // Pont de pedra primer, pont actual després.
  'bridge-type': {
    classic: { menuAfter: 'stone' },
  },

  // Acabats de les cases al joc.
  roof: {
    shed: { menuAfter: 'flat' },
  },

  // Cobertes a l’editor d’edificis.
  'roof-type': {
    shed: { menuAfter: 'flat' },
  },

  // Escales amb barana primer, sense barana després.
  'stairs-railing': {
    none: { menuAfter: 'iron' },
  },
};
```

La primera clau és l’`id` del selector HTML. A dins hi ha el `value` de l’opció que vols moure i el `menuAfter` de la referència. No s’utilitzen els noms visibles ni els textos traduïts. Per a valors numèrics, fes servir cadenes, per exemple `'2': { menuAfter: '4' }`.

La configuració comuna té prioritat sobre la propietat de la definició del mod, per aquell selector concret. Per exemple, pots donar un ordre diferent a `terrain-type` i a `slope-finish`. Sense regles, es conserva l’ordre habitual.

**Ponts:** aquesta ampliació permet ordenar `classic` i `stone`, i qualsevol opció que un sistema de ponts incorpori al selector. No afegeix un registre `PERSONAL_BRIDGES` ni geometries o mecàniques noves de ponts. Un `menuAfter` tampoc crea una opció que no existeix.

### Selectors habituals

| Selector | Contingut / exemples de valors |
| --- | --- |
| `terrain-type` | `land`, `meadow`, `rocky`, `slope`, `beach`, `cobble`, `dirt`, `asphalt`, conreus i mods |
| `slope-finish` | `keep`, `land`, `meadow`, `rocky`, `cobble`, `dirt`, `asphalt`, conreus i mods |
| `tree-species` | Identificadors dels arbres oficials i personals |
| `business-type` | Identificadors dels negocis oficials i personals |
| `building-type` | Identificadors dels edificis; hereta la categoria de la referència |
| `building-category` | `services`, `culture`, `religion`, `lodging`, `leisure`, `coast`, `personal`, `other`, `signs`, si tenen contingut |
| `monument-type` | Identificadors dels monuments oficials i personals |
| `bridge-type` | `classic`, `stone` |
| `roof` / `roof-type` | `tile`, `shed`, `flat`, `attic` (joc / editor) |
| `stairs-railing` | `none`, `iron` |
| `terrain-railing-material` | `iron`, `wood`, `stone`, `none` |
| `terrain-railing-sides` | `N`, `S`, `E`, `O`, `NO`, `NE`, `ES`, `SO`, `NS`, `EO` |
| `house-action` | `build`, `business`, `paint` |
| `house-type` | `standard`, `patio` |
| `region-select` | `brava`, `daurada` |
| `custom-source` | `local`, `shared` |
| `custom-design` / `saved-designs` | Identificadors dels dissenys (joc / editor) |

També s’aplica als altres selectors amb `id` presents al joc i a l’editor d’edificis: mides, orientacions, plantes, clonació, etc. Si el joc reconstrueix les seves opcions, l’ordre es torna a aplicar. L’editor de mods independent de `editor-mods/` conserva el seu funcionament propi.

Per consultar els identificadors d’un selector, pots executar a la consola del navegador, per exemple:

```js
[...document.getElementById('bridge-type').options]
  .map(op => ({ id: op.value, nom: op.textContent }));
```

## Cadenes, conflictes i selecció

- Pots posar un mod darrere d’un altre mod, encara que estigui declarat abans al fitxer.
- Si diversos elements referencien la mateixa opció, mantenen el seu ordre relatiu original. Per forçar-ne l’ordre exacte, encadena’ls: B darrere d’A, C darrere de B.
- Una referència absent es deixa sense aplicar. Si l’opció arriba més tard a un selector observat, es torna a intentar.
- Una referència a si mateix o un cercle A → B → A s’ignora. Totes les opcions continuen disponibles.
- El canvi d’ordre conserva el valor seleccionat; no canvia automàticament l’eina, la coberta o el terreny actius.
- `menuAfter` ha de ser un text no buit. Una estructura de configuració incorrecta es comunica com els altres errors del catàleg.

## Retirar el script provisional

Si vas afegir `import './ui-terrenys.js';` a `mods-personals/renderers.js`, retira aquesta línia: el nucli ja aplica l’ordre. No cal eliminar les importacions de les geometries dels teus mods. El fitxer provisional es pot conservar sense importar-lo.

## Afegir nous selectors al programa

El motor és genèric. `initPersonalMenus(root, rules)` de `personal-menus.js` descobreix els selectors amb `id` presents en inicialitzar la pàgina i observa les reconstruccions de les seves opcions. Per a una pantalla nova, inicialitza’l després de crear els selectors i crida `dispose()` en tancar-la. `orderMenuEntries()` és independent del DOM i permet integrar altres menús o categories. Això prepara l’ordre dels futurs selectors sense afegir nous tipus de contingut al model.

## Comprovació

```sh
node --test tests/menu-order.test.mjs
node mods-personals/check.mjs
node check-mods.mjs
```
