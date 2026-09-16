# Actualització v94 — menuAfter al nucli

Aquest ZIP actualitza la v93: no és el joc complet. S’ha contrastat el nucli amb el repositori qmrcat/vila-mediterrania, commit e5edfea8a749452dd4f2b2254c375c9d42a72bd6, i s’ha utilitzat el catàleg personal actual amb el Molí de vent i el Prat d’herbes.

## Instal·lació

1. Descomprimeix el contingut del ZIP a l’arrel del projecte, al mateix nivell que index.html, conservant l’estructura de carpetes.
2. Substitueix els fitxers del nucli inclosos. A mods-personals/catalog.js l’únic canvi és afegir menuAfter:'meadow' al Prat d’herbes. Si el teu catàleg local té més modificacions, conserva’l i afegeix-hi només aquesta propietat.
3. Si utilitzaves el script provisional ui-terrenys.js, retira la seva importació de mods-personals/renderers.js. Conserva totes les importacions i els registres de geometria dels teus mods.
4. Revisa els canvis i puja’ls al repositori. Espera el desplegament de GitHub Pages i actualitza el joc i l’editor (Ctrl+F5 si cal). La versió al menú serà 94.

La versió no s’ha pujat ni desplegat des d’aquesta sessió. Cal incorporar els fitxers a GitHub.

## Ús

Prat d’herbes ja té menuAfter:'meadow' i apareix després de Pradera amb flors, també als pendents.

Els terrenys, arbres, negocis, edificis i monuments personals admeten menuAfter dins de la seva definició. Els edificis hereten la categoria de l’edifici de referència.

Per als ponts i la resta de selectors, pots exportar PERSONAL_MENU_ORDER des de mods-personals/catalog.js. També funciona als selectors de l’editor d’edificis. La guia GUIA-ORDRE-MENUS.md inclou la sintaxi, exemples i els identificadors. Ordenar ponts no afegeix una API de ponts personals ni una geometria nova.

Es conserven les versions dels formats de viles i dissenys i l’API dels mods. No s’inclouen ni se substitueixen les geometries personals, config.js, music/, editor-mods/ o biblioteca/catalog.json.

## Verificació

Han passat les 13 proves noves d’ordenació, les comprovacions dels mods actuals i la sintaxi JavaScript. També s’han executat les proves disponibles de la biblioteca compartida en l’entorn local. Les proves de menús comproven ordenació, herència de grup, cadenes, cicles, compatibilitat dels quatre registres, opcions afegides tard i conservació de la selecció. No s’ha fet una prova visual al navegador ni un desplegament.

    node --test tests/menu-order.test.mjs
    node mods-personals/check.mjs
    node check-mods.mjs
