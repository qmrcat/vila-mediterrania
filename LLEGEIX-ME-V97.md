# Vila Mediterrània v97 — Operacions booleanes i transparències

Actualització per al joc v96. Copia el contingut a l’arrel del joc respectant totes les carpetes i puja’l al repositori.
No és el joc complet. La publicació a GitHub Pages es farà quan tu pugis els fitxers.
Inclou també la correcció anterior de personal-animations.js perquè utilitzi el mateix registre que les geometries.

No substitueix catalog.js, renderers.js, geometries.js ni config.js. Els teus registres i configuració es conserven.
Després de publicar, recarrega el joc amb Ctrl + Majúscules + R.

Novetats:
- Unió, resta i intersecció entre geometries, amb transformacions i diverses operacions encadenades.
- Materials amb opacitat, rugositat i metal·licitat a les crides part(), sense canviar les crides anteriors.
- Peça perforada i vidre amb materials independents.
- Taller booleans-demo.html per veure els operands, aplicar operacions, girar la vista i consultar el codi.

Consulta GUIA-BOOLEANS-I-MATERIALS.md: explica la instal·lació, les funcions, els límits i els exemples.
Els exemples de mods són opcionals: per registrar-los, importa BOOLEAN_EXAMPLES i afegeix ...BOOLEAN_EXAMPLES al teu PERSONAL_GEOMETRIES, tal com explica la guia.

S’han superat 32 proves combinades i els dos comprovadors de mods. La comprovació visual en un navegador real queda pendent.
La nova prova tests/solid-geometry.test.mjs inclou 9 casos i es pot executar amb node --test tests/solid-geometry.test.mjs.

El motor CSG s’inclou localment amb llicència MIT (vendor/csg.LICENSE.txt). No cal instal·lar paquets ni utilitzar un CDN.
