# Actualització v92 — biblioteca compartida

Aquest ZIP conté només l’actualització, no el joc complet.
Està preparada sobre el repositori qmrcat/vila-mediterrania, versió 91,
commit ecc06b27535387ce75a44081e1a4b215685f640c.

## Aplicar-la una vegada

1. Parteix de la teva còpia completa i actualitzada del repositori. Conserva els canvis locals pendents abans de substituir fitxers.
2. Descomprimeix el contingut d’aquest ZIP a l’arrel del projecte, al mateix nivell que index.html. Combina les carpetes existents i substitueix els fitxers inclosos. No publiquis el ZIP ni una carpeta addicional que el contingui.
3. Revisa els canvis amb GitHub Desktop o Git. No s’inclouen ni es modifiquen config.js, mods-personals/, editor-mods/ ni music/.
4. Fes el commit i puja els canvis a GitHub. Si treballes en una branca, integra-la a main perquè es publiqui a GitHub Pages.
5. Espera que acabi el desplegament i actualitza la pàgina del joc. A «La meva vila» apareixerà la versió 92.

No s’ha escrit res a GitHub des d’aquesta sessió: la integració ha retornat un error 403 en intentar crear la branca. No s’ha creat cap pull request ni s’ha desplegat la versió.

## Compartir els teus edificis

1. Crea o obre un disseny a l’editor d’edificis.
2. Desplega «Biblioteca compartida · GitHub» i prem «Descarrega catàleg amb aquest disseny».
3. Puja el catalog.json resultant a biblioteca/catalog.json al repositori.
4. Quan GitHub Pages hagi publicat el canvi, els jugadors el trobaran a «Els meus edificis → Biblioteca compartida».

Pots repetir l’exportació amb diversos dissenys en la mateixa sessió: l’últim fitxer descarregat els inclou tots. Per continuar un altre dia amb un catàleg encara no pujat, carrega primer aquell fitxer amb «Carrega un catàleg del disc…».

La guia completa és a biblioteca/README.md. El catàleg inclòs comença buit: no publica cap dels teus dissenys privats.

## Verificació feta

- 13 proves de càrrega, publicació, còpies privades, errors, límits i recuperació de viles: correctes.
- Compatibilitat dels mods personals i integració de geometries: correcta.
- Sintaxi JavaScript i correspondència dels controls HTML: correctes.
- No s’ha fet una prova visual al navegador ni un desplegament a GitHub Pages.

Amb Node.js, pots repetir les proves:

    node --test tests/shared-designs.test.mjs
    node mods-personals/check.mjs
    node check-mods.mjs
