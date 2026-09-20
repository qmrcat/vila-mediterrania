# Consulta d’elements amb Navega · Versió 95

Selecciona **Navega** (fletxa, drecera N) i clica o toca un element de la vila. La fitxa mostra el nom, el tipus i les característiques disponibles: espècie de l’arbre, terreny, plantes, negocis, orientació o superfície.

Arrossegar continua movent la càmera; fer pinça continua ajustant la vista. Navega no construeix ni esborra. Amb teclat, selecciona una casella amb les fletxes i prem Retorn. Tanca la fitxa amb la creu, Esc o un clic fora.

## Activar la còpia del JSON

A `config.js`, canvia només aquesta opció:

```js
inspection: {
  allowJsonCopy: true,
},
```

Per defecte és `false`: es pot consultar la fitxa, però no apareix el botó **Copia el JSON**. Desa el fitxer i actualitza la pàgina després de modificar-lo.

La còpia conté les dades desades de l’element seleccionat, inclosa la seva posició. Una casa inclou els seus pisos i negocis; un edifici de diverses cel·les es copia sencer; un pont inclou els dos extrems. Els noms dels continguts personals provenen dels registres dels mods.

Aquest JSON és útil per consultar dades o preparar mods. No és una exportació de tota la vila ni un fitxer directament importable a l’editor. Tampoc inclou el codi del mod o la geometria 3D. Els animals i altres decoracions automàtiques formen part del seu terreny o edifici, sense una fitxa independent.

Si el navegador denega la còpia automàtica, apareix el JSON seleccionat per copiar-lo manualment amb Ctrl+C o l’opció Copia del mòbil.

## Actualització des de la versió 94

Puja els fitxers del paquet a l’arrel del repositori, respectant la carpeta `tests`. El paquet conté els fitxers modificats i nous; necessita la resta del joc existent. Si has ajustat `config.js` després de la versió 94, conserva els teus valors i incorpora la secció `inspection` i la seva comprovació de tipus.

No cal modificar els mods personals ni els desaments de les viles.

## Verificació

Les proves `node --test tests/element-inspector.test.mjs` comproven la identificació, el JSON, els elements de diverses cel·les, la selecció dels ponts, els gestos de navegació i la còpia amb alternativa manual. També s’han executat els dos comprovadors de mods. No s’ha fet una comprovació visual en un navegador real.
