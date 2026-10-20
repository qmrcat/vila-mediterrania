# Actualització v95 → v96: bandera que oneja

1. Copia els fitxers del ZIP a la carpeta del joc, conservant les rutes.
2. Afegeix aquesta línia a mods-personals/renderers.js, una sola vegada:

```js
export {ISRAEL_FLAG_ANIMATIONS as PERSONAL_GEOMETRY_ANIMATIONS} from './israel-flag-animation.js';
```

Si ja tens PERSONAL_GEOMETRY_ANIMATIONS, combina les entrades tal com explica GUIA-ANIMACIONS-MODS.md.
El ZIP no substitueix els teus registres catalog.js, renderers.js ni geometries.js.
Conserva les entrades del mod d’Israel anterior i dels teus altres mods.
Si encara no havies instal·lat el mod, segueix mods-personals/INSTAL-LACIO-BANDERA-ISRAEL.md.

3. Puja els fitxers del paquet i el teu renderers.js modificat al repositori.
4. Actualitza la pàgina; si conserva fitxers antics, fes una recàrrega sense memòria cau.

La bandera oneja automàticament, també als pals ja desats; no cal tornar-los a posar.
El moviment reduït del dispositiu la manté quieta, com les altres banderes del joc.
No cal modificar config.js. Les viles i les dades dels mods es conserven.

És un paquet d’actualització que necessita la resta del joc v95. No està publicat a GitHub Pages fins que el pugis.
Verificat: 12 proves automatitzades i els dos comprovadors de mods. Sense comprovació visual en un navegador real.
