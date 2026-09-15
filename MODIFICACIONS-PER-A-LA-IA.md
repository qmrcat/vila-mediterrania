# Integració al joc v89

Es conserva l’API 1. El nucli actual utilitza el format de vila 66 i inclou el Teatre, el Cinema i la Biblioteca. El catàleg rebut té un Molí de vent actiu; els altres registres estan buits. Consulta `GUIA-MODS.md` i executa també `node check-mods.mjs`. El text següent documenta la implementació original aportada per l’usuari.

# Capa de modificacions personals — informació per a la IA

Aquest projecte separa el nucli generat o mantingut per IA del contingut creat per l'usuari. L'objectiu és reduir conflictes: el nucli ofereix una API estable i l'usuari treballa normalment només dins de `mods-personals/`.

## Contracte

- API actual: `MOD_API_VERSION = 1`.
- Catàleg de l'usuari: `mods-personals/catalog.js`.
- Geometria de l'usuari: `mods-personals/renderers.js` i els mòduls que aquest importi.
- Adaptador i validació de dades: `personal-content.js`.
- Adaptador i validació de geometria: `personal-renderers.js`.
- Amb els quatre registres buits, el comportament ha de ser exactament el del joc oficial.
- Els tipus personals utilitzen els formats de desament ja existents. Afegir contingut no incrementa el format de vila, però una vila que l'utilitzi necessita conservar el mod per poder-se importar.

## Modificacions fetes al codi existent

### `model.js`

- `TREE_SPECIES` es construeix combinant `CORE_TREE_SPECIES` i `PERSONAL_TREES`.
- `LANDMARK_TYPES` es construeix combinant `CORE_LANDMARK_TYPES` i `PERSONAL_LANDMARKS`.
- Es detecten identificadors repetits i conflictes entre arbres i terrenys.
- No importa cap renderitzador personal: el model continua independent de Three.js.

### `agricultural-types.js`

- Combina `CORE_AGRICULTURAL_TERRAINS` amb `PERSONAL_TERRAINS`.
- Rebutja col·lisions amb terrenys agrícoles i tipus bàsics oficials.
- Això fa que validació, selectors, pendents, clonació i desament reconeguin automàticament els terrenys personals.

### `business-signs.js` i `special-shops.js`

- `BUSINESS_NAMES` incorpora el nom dels negocis personals.
- `SPECIAL_SHOPS` incorpora el seu estil de façana.
- La validació del món accepta aquests negocis perquè `BUSINESS_TYPES` deriva de `BUSINESS_NAMES`.

### `app.js`

- Afegeix els negocis personals abans de les opcions «Canvia només el rètol» i «Sense negoci».
- Genera les instruccions dels edificis i monuments personals des de `name` i `help`.
- Els edificis, monuments, arbres i terrenys personals ja entren als selectors dinàmics existents.

### Renderització

- `landmark-geometry.js` busca primer `PERSONAL_LANDMARK_RENDERERS[type]`.
- `agricultural-terrain.js` busca primer `PERSONAL_TERRAIN_RENDERERS[kind]`.
- `scene.js` crida `PERSONAL_TREE_RENDERERS[kind]` després de dibuixar el parterre i abans dels arbres oficials.
- `retail-displays.js` crida `PERSONAL_RETAIL_RENDERERS[type]` abans dels aparadors oficials.

## Signatures públiques de l'API 1

```js
landmarkRenderer(landmark, part, unit, {box, beam, orientedPart})

terrainRenderer(tile, {
  add, surfaceBox, unit, exclude, branch,
  root, emit, row, soil, ox, oz
})

treeRenderer(tile, {
  x, y, z, seed, unit, add, branch, randomAt
})

retailRenderer({type, side, u, face, box})
```

`part()` i `face()` conserven la signatura de dibuix instanciat existent:

```js
part(shape,color,u,h,v,sx,sy,sz,ry=0,rx=0,rz=0)
```

Per a teulades o peces inclinades que també han de girar amb l'edifici, cal emprar `orientedPart()` amb la mateixa signatura.

No s'han de crear `THREE.Mesh` individuals dins d'aquests renderitzadors. Cal emetre formes mitjançant les funcions rebudes perquè continuïn agrupades en instàncies.

## Com modificar el nucli sense trencar els mods

1. Executa `node mods-personals/check.mjs` abans i després del canvi.
2. Conserva les exportacions i signatures anteriors.
3. Si canvies una signatura, incrementa `MOD_API_VERSION` i admet temporalment la versió anterior o proporciona una migració.
4. No moguis la geometria personal cap al nucli.
5. No converteixis `personal-content.js` en un mòdul dependent de l'escena.
6. Prova una vila sense mods i una vila que contingui almenys un tipus personal.

## Límits de la capa

Els mods actuals poden afegir aparença i tipus que reutilitzen les regles existents. Una mecànica nova —ocupació irregular, una eina completament diferent, un camp nou dins de `tile` o un sistema de moviment— encara necessita canvis al nucli i, si altera el JSON, una migració del format de vila.

# Ampliació d'informació

He implementat una capa de modificacions personals separada del nucli del joc.

  ### Com afegir contingut

  Treballaràs principalment aquí:

  - Catàleg personal (/C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/mods-personals/catalog.js:1)
  - Registre de renderitzadors (/C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/mods-personals/renderers.js:1)
  - Guia amb exemples (/C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/mods-personals/README.md:1)

  El procés és:

  1. Declarar l’edifici, terreny, arbre o negoci a catalog.js.
  2. Crear-ne la geometria en un fitxer nou dins de mods-personals/.
  3. Registrar la funció a renderers.js.
  4. Executar:

  node mods-personals/check.mjs

  Els registres estan buits inicialment, per tant el comportament actual del joc no canvia.

  ### Modificacions fetes al programa actual

  - model.js: combina landmarks i arbres oficials amb els personals.
  - agricultural-types.js: incorpora terrenys personals.
  - business-signs.js i special-shops.js: incorporen negocis personals.
  - app.js: genera selectors, ajuda i mides dels elements personals.
  - landmark-geometry.js: delega edificis i monuments personals.
  - agricultural-terrain.js: delega terrenys personals.
  - scene.js: delega arbres personals.
  - retail-displays.js: delega aparadors personals.
  - personal-content.js: valida catàlegs, identificadors, colors, mides i col·lisions.
  - personal-renderers.js: comprova que cada definició tingui el renderitzador corresponent.

  L’API pública queda identificada com a MOD_API_VERSION = 1. Afegir contingut amb aquesta API no modifica el format 66 de les viles.

  ### Informació per passar a la IA

  He preparat aquest document específic:

  /C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/MODIFICACIONS-PER-A-LA-IA.md:1

  Explica:

  - Tots els fitxers modificats.
  - Les signatures que la IA ha de conservar.
  - Els punts d’integració.
  - Com ampliar el nucli sense trencar els teus mods.
  - Quins canvis requeririen una migració.

  També he creat /C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/AGENTS.md:1, que indica automàticament als
  agents d’IA que no han de tocar mods-personals/** sense una petició teva explícita.

  El manual general (/C:/Users/jmira/Documents/Projectes/JavaScript-projectes/vila-mediterrania/MANUAL-AMPLIAR-EL-JOC.html) també està
  adaptat al nou sistema.

  ### Verificació

  He comprovat:

  - Sintaxi de tots els mòduls JavaScript.
  - Validació dels registres buits.
  - Integració temporal real d’un edifici, un terreny, un arbre i un negoci personals.
  - Col·locació i recuperació des del JSON.
  - Renderització dels elements personals.
  - Compatibilitat dels registres oficials.
  - Enllaços i estructura HTML del manual.

  No he incrementat la versió del joc ni regenerat el ZIP, perquè aquesta és una infraestructura interna sense contingut personal activat.
  El fitxer modificat prèviament music/Aigua i sol.mp3 no l’he tocat.