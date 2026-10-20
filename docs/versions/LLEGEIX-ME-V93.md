# v93 — Orientació de les façanes a l’editor

Aquest és un paquet d’actualització per a la v92, no el joc complet.
Els fitxers originals de l’editor i de versió s’han contrastat amb el repositori qmrcat/vila-mediterrania, commit 339f62c7380006ae1a505e2dd8a861f08ab7572f.

## Instal·lació

Descomprimeix els cinc fitxers del projecte a l’arrel de la teva còpia del joc, al mateix nivell que index.html, i substitueix els existents. Puja els canvis al repositori i espera el desplegament de GitHub Pages. Després actualitza la pàgina de l’editor; si encara es veu l’anterior, fes Ctrl+F5.

El paquet conserva la biblioteca compartida de la v92. No inclou ni substitueix biblioteca/catalog.json, config.js, els dissenys del navegador o els mods.

## Novetat

A la cantonada superior dreta de la vista 3D apareix un indicador amb els noms complets de les façanes: Davant, Dreta, Darrere i Esquerra. Davant, la façana principal, queda ressaltada.

Les indicacions segueixen l’orientació de la càmera en arrossegar, prémer Gira o Centra. Les etiquetes continuen representant els mateixos costats de l’edifici: no canvien de nom en girar. L’indicador s’adapta a la pantalla mòbil i no captura els gestos del ratolí o del dit. No es desa dins del disseny ni modifica l’edifici.

## Comprovacions

Sintaxi JavaScript correcta, controls HTML sense identificadors repetits, compatibilitat dels mods correcta i correspondència matemàtica de les etiquetes amb la projecció de Three.js comprovada en 96 combinacions de façana i angle de càmera. No s’ha fet una prova visual al navegador.

La versió no s’ha pujat ni desplegat automàticament: cal incorporar aquests fitxers al teu repositori.
