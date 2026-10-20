# Instruccions per als agents d'IA

## Propietat del codi

- `mods-personals/**` és l'espai de modificacions de l'usuari.
- No modifiquis, moguis ni eliminis fitxers de `mods-personals/**` si l'usuari no ho demana explícitament.
- Les funcionalitats del nucli han de continuar funcionant amb els registres personals buits o plens.
- Abans d'editar un fitxer que ja té canvis de l'usuari, revisa `git diff` i conserva qualsevol canvi no relacionat.

## Estructura

- El codi del joc és a `js/`; els fitxers citats en aquestes instruccions sense carpeta hi són. Els estils són a `css/`, les guies a `docs/` i els scripts de Node a `eines/`.
- `config.js` es queda a l’arrel: l’edita l’usuari.
- `scene.js`, `solid-geometry.js`, `personal-content.js` i `personal-renderers.js` de l’arrel són reexportacions de `js/` per als mods (API 1): no les esborris ni hi afegeixis codi. El nucli ha d’importar directament de `js/`.
- `check-mods.mjs` es queda a l’arrel perquè les guies dels mods el criden així.

## Versions de publicació

- No posis `?v=` als imports ni als `<script>`/`<link>` a mà: els genera `node eines/actualitza-versio.mjs` a l’import map de `index.html`, `editor.html` i `editor-mods/index.html`.
- Després de canviar qualsevol `.js` o `.css`, executa `node eines/actualitza-versio.mjs`; per a una versió nova, `node eines/actualitza-versio.mjs <número>`. `tests/versions.test.mjs` falla si no està al dia.

## Contracte estable de mods

- La versió pública actual és `MOD_API_VERSION = 1`, definida a `personal-content.js`.
- Conserva les exportacions de `mods-personals/catalog.js` i `mods-personals/renderers.js`.
- No canviïs les signatures dels renderitzadors personals sense incrementar l'API i preparar compatibilitat o una migració documentada.
- `personal-content.js` ha de continuar sense dependències de Three.js ni del DOM.
- `model.js` i els altres mòduls de dades no han d'importar `personal-renderers.js`.
- No incorporis identificadors personals al codi oficial ni els reanomenis.
- Si afegeixes un registre oficial nou, mantén les comprovacions de col·lisió amb els registres personals.

## Punts d'integració que cal preservar

- `model.js`: combina edificis singulars i arbres personals amb els oficials.
- `agricultural-types.js`: combina terrenys personals amb els oficials.
- `business-signs.js` i `special-shops.js`: combinen negocis personals amb els oficials.
- `app.js`: genera ajuda per als edificis personals i afegeix els negocis personals al selector.
- `landmark-geometry.js`, `agricultural-terrain.js`, `scene.js` i `retail-displays.js`: deleguen primer als renderitzadors personals corresponents.

Consulta `docs/MODIFICACIONS-PER-A-LA-IA.md` abans d'una refactorització que afecti aquests fitxers.

## Geometries opcionals — API 1, v91

- `mods-personals/renderers.js` pot exportar `PERSONAL_GEOMETRIES`, normalment reexportant `mods-personals/geometries.js`.
- Sense aquesta exportació, el mod antic segueix sent vàlid; no imposis una importació directa del fitxer opcional des del nucli.
- `personal-geometries.js` valida les funcions síncrones `(THREE) => BufferGeometry`, els noms i les dades, i `scene.js` integra el resultat després de les formes oficials.
- Les geometries es creen una vegada i són compartides; no les eliminis en reconstruir una vila.
- `model.js` i `personal-content.js` no han d’importar aquest adaptador ni el registre de geometries.
