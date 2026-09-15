# Mods personals — API 1

El joc integra els teus mods sense traslladar-los al nucli. El Molí de vent (`windmill`) del ZIP original continua actiu a **Edificis**, amb una cel·la i quatre orientacions. Es conserven íntegres els fitxers rebuts de `mods-personals/`.

## On treballar

- `mods-personals/catalog.js`: dades d’edificis, monuments, terrenys, arbres i negocis.
- `mods-personals/renderers.js`: registre de les funcions de geometria.
- `mods-personals/README.md`: signatures i exemples de contingut.
- `personal-content.js` i `personal-renderers.js`: adaptadors del nucli; no necessites modificar-los per afegir contingut.

Des de la carpeta del joc, amb Node.js:

```sh
node mods-personals/check.mjs
node check-mods.mjs
```

La primera ordre és la comprovació original del teu mod. La segona comprova també les col·lisions amb el joc, la col·locació, totes les mides i orientacions dels edificis, la geometria i la recuperació des del JSON. Cap de les ordres modifica els teus fitxers. Les comprovacions no substitueixen mirar que el model tingui l’aspecte desitjat i quedi dins de la mida i l’alçada declarades.

## Compatibilitat

- API pública dels mods: **1**. Es conserven totes les signatures del document original.
- Format de vila: **66**, el mateix de la versió 88. S’admeten també els formats anteriors.
- Dissenys de l’editor: **4**.
- Afegir un tipus amb aquestes regles no incrementa el format. El JSON desa els identificadors i les dades del joc, però **no incorpora el codi dels mods**. Per recuperar una vila amb mods, cal tenir-ne el catàleg i els renderitzadors corresponents.
- Els mods són mòduls JavaScript locals amb accés al mateix navegador que el joc: utilitza codi propi o de confiança.
- Si reemplaces el joc per una nova versió, conserva una còpia de la teva carpeta `mods-personals/` i restaura-la abans d’obrir les viles que la necessiten. Per compartir-les, facilita també aquesta carpeta.

## Millores d’integració

Els terrenys personals aprofiten els pendents, les baranes, els carrers i la clonació existents. Els arbres conserven el terra i el parterre. Els negocis utilitzen la façana genèrica, els rètols editables i els aparadors personals, també als edificis del jugador i a les plantes accessibles. Es preserven les rotacions de les peces emeses amb `face()`.

Els edificis i monuments poden oferir diverses mides; el selector conserva la mida escollida quan canvies l’orientació. Els identificadors que col·lideixin amb eines, arbres, terrenys o edificis oficials produeixen un missatge explícit.

Amb registres buits, el joc conserva les regles i la geometria oficials. El Teatre, el Cinema i la Biblioteca continuen sent contingut del nucli.


## Geometries personals — v91

Afegeix formes a **mods-personals/geometries.js**, reexportades des de **mods-personals/renderers.js** com a **PERSONAL_GEOMETRIES**. Cada funció rep `THREE` i retorna una `BufferGeometry` nova, creada una vegada i compartida per totes les instàncies. El fitxer inclou **cupulaPersonal** com a exemple. Consulta el tutorial complet de **mods-personals/README.md**.

Els mods antics sense aquesta exportació continuen funcionant. Es manté l’API 1 i el format 66. A partir d’aquesta versió, el comprovador original informa també del nombre de formes i valida les geometries registrades; el comprovador ampliat continua verificant-ne l’ús als renderitzadors.
