# Instruccions per als agents d'IA

## Propietat del codi

- `mods-personals/**` és l'espai de modificacions de l'usuari.
- No modifiquis, moguis ni eliminis fitxers de `mods-personals/**` si l'usuari no ho demana explícitament.
- Les funcionalitats del nucli han de continuar funcionant amb els registres personals buits o plens.
- Abans d'editar un fitxer que ja té canvis de l'usuari, revisa `git diff` i conserva qualsevol canvi no relacionat.

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

Consulta `MODIFICACIONS-PER-A-LA-IA.md` abans d'una refactorització que afecti aquests fitxers.
