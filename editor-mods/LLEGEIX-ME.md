# Taller de mods · Vila Mediterrània v91

Un editor visual per compondre edificis i monuments amb les mateixes primitives
que fa servir el joc, i treure'n el codi llest per a `mods-personals/`.

Escriu per a l'**API de mods 1** (`GUIA-MODS.md`), amb les geometries personals de la v91. No modifica cap fitxer del
joc ni de la teva carpeta `mods-personals/`: tu tries què hi enganxes.

## Instal·lació

1. Copia la carpeta `editor-mods/` dins de la carpeta principal del joc, al
   costat d'`index.html` i `scene.js`.
2. Arrenca el servidor de sempre: `node server.mjs` (o `Inicia-Windows.bat`).
3. Obre `/editor-mods/` amb l'adreça que et digui la terminal. **No obris el
   fitxer amb doble clic**: els mòduls JavaScript queden bloquejats sota
   `file://`.

A dalt a la dreta del títol veuràs l'API i la versió del joc detectades. Si hi
posa «joc no detectat», la carpeta no és al lloc correcte.

## Com es fa un mod

Cada peça és una crida `part(forma, color, u, h, v, sx, sy, sz, ry, rx, rz)`,
la mateixa que escriuries a mà dins d'un renderitzador:

- `u` va cap a l'est, `v` cap al sud, `h` és l'alçada sobre la base.
- L'edifici es dibuixa **sempre com si mirés al sud**; el joc ja el gira.
- Tot ha de cabre dins la parcel·la: 1,3 unitats per cel·la. Si declares
  diverses mides, la comprovació es fa contra **la més petita**.
- L'alçada declarada és el volum invisible que rep els clics. Deixa marcat
  *mesura-la sola* i l'editor la treu de la geometria real.
- L'editor llegeix `../model.js` i t'avisa si l'identificador ja és d'un
  element del joc o d'una eina reservada.

Les peces noves —afegides, duplicades o emmirallades— surten **a l'est de la
parcel·la**, on les veus, i les portes a lloc amb les fletxes; desmarca *Deixa
les peces noves fora de la parcel·la* per tenir el comportament d'abans. Cada
peça pot tenir un **nom**, que surt a la llista i com a comentari al codi
generat. El punt de la dreta de cada fila **l'amaga de la vista**: continua a la
llista, compta per a les mesures i s'exporta igualment.

Les seccions dels panells laterals es **pleguen** clicant-ne la capçalera, i
recorden com les has deixat.

Per treballar amb diverses peces alhora: Ctrl+clic afegeix o treu de la selecció i
Majúscules+clic a la llista n'agafa un tram. El panell **Biblioteca de peces** desa
grups amb nom (una galleda, una finestra) i els estampa dins de qualsevol mod. El panell
**Formes personals** llegeix les geometries que el joc té registrades i en genera de noves
a partir de plantilles (tub, prisma, escala), amb el fitxer `geometries.js` llest per instal·lar.

El panell **Genera des de fotografies** compon un primer esbós amb Claude o
OpenAI a partir de fotos d'un edifici real. Consulta `LLEGEIX-ME-IA.md`: cal
posar-hi una clau d'API.

El botó **Al terra** seu la selecció a la cota 0, i cada grup hi baixa sencer.
Si alguna peça queda sota terra, el terra de la vista es torna translúcid i
l'avís porta un botó **Selecciona-les**.

Amb dues peces o més seleccionades, el panell **Alinea i distribueix** de la
columna dreta iguala les cares en `u`, `h` o `v`, les centra, o les reparteix a
distàncies iguals. Cada grup hi compta com un sol bloc.

A la vista 3D, amb una sola peça seleccionada surten sis nanses daurades:
arrossega'n una per estirar o contreure la peça per aquella cara, o amb
Majúscules per créixer per les dues bandes alhora. Amb diverses peces
seleccionades, les nanses surten a la capsa que les envolta i escalen el
conjunt sencer sense canviar-ne les proporcions. Alt + botó dret arrossegant
una peça la mou pel pla de terra; mentre prems Majúscules, a mig arrossegament,
la puja i la baixa. Ctrl+C copia la selecció i Ctrl+V l'enganxa, també en
un altre mod o en una altra pestanya.

El taller recorda quin mod tenies obert i te'l torna a obrir la vegada
següent. Si l'has esborrat de la col·lecció, obre el primer de la llista.

Ctrl+A, o el botó **Selecciona-ho tot**, selecciona totes les peces visibles, i
Esc ho deixa tot sense seleccionar.

El botó **Escala**, sota les mides, passa el mod sencer d'una parcel·la a una
altra: de 2 × 2 a 3 × 3 multiplica peces i alçada per 1,50.

Al panell de la peça, **Copia les mides** i **Enganxa les mides** igualen les
tres mides d'una peça a una altra, o a tota la selecció.

Dreceres: fletxes mouen la selecció en `u` i `v`, Re Pàg i Av Pàg en `h`
(amb Majúscules, passos de 0,005), Q i E giren 15° al voltant de l’eix vertical
(amb Majúscules, 1°; un grup gira sencer al voltant del seu centre), Supr
l’esborra, Ctrl+G agrupa la selecció i Ctrl+Maj+G la desagrupa (clicar una
peça d’un grup el tria sencer; Alt+clic tria només la peça), Ctrl+Z desfà i
Ctrl+S desa.
A la vista 3D, arrossega per girar la càmera, Majúscules + arrossegar per
desplaçar-la i roda per apropar.

## Camí A · un renderitzador escrit

És el camí del `windmill` que ja porta el joc.

1. A **Exporta → El renderitzador**, prem **Baixa el fitxer** i desa'l a
   `mods-personals/` (per exemple `watchtower-geometry.js`).
2. A **Exporta → Els registres de mods-personals**, enganxa l'entrada dins de
   `PERSONAL_LANDMARKS` de `catalog.js` i les dues línies de `renderers.js`.
3. Comprova-ho i recarrega amb Ctrl+F5:

```sh
node mods-personals/check.mjs
node check-mods.mjs
node editor-mods/check-formes.mjs
```

Si el mod té peces inclinades, el renderitzador generat les emet amb
`orientedPart`, el quart argument que passa el joc. Sense això, les vessants
queden torçades quan el jugador gira l'edifici.

Amb més d'una mida, el renderitzador rep `landmark.size`: la geometria surt
igual per a totes, i decideixes tu si la fas créixer.

## Camí B · dades i renderitzador genèric

Per tenir-ne uns quants alhora sense escriure un fitxer per mod.

1. Copia `json-mods.js` i `json-mods-data.js` d'aquesta carpeta a
   `mods-personals/`.
2. Connecta'ls **una sola vegada** amb els retalls d'**Exporta → Com connectar
   el runtime JSON**: un `import` i un spread a `catalog.js`, i un altre a
   `renderers.js`.
3. A partir d'aquí, per a cada mod nou només has d'exportar *El JSON del mod* i
   enganxar-lo dins de l'array `JSON_MODS`.

`json-mods-data.js` són dades pures i no importa res, així que `catalog.js`
continua complint la seva regla de no importar Three.js ni cap renderitzador.

## Abans de donar-ho per bo

- Passa `node check-mods.mjs`: col·loca el mod en les quatre orientacions i en
  totes les mides declarades, en construeix la geometria i recupera el JSON.
- Prova'l també al joc sobre terreny elevat i amb pendent, no només al nivell 0.
- Esborra'l i mira que el terreny es conservi; comprova Desfés i Refés.

Cap comprovació substitueix mirar que el model tingui l'aspecte que vols i que
quedi dins de la mida i l'alçada declarades.

## El que has de saber

- **El JSON d'una vila no inclou el codi dels mods.** Una vila amb mods només
  s'obre en una còpia del joc que tingui el catàleg i els renderitzadors. Si la
  comparteixes, comparteix també `mods-personals/`.
- Si actualitzes el joc, conserva una còpia de `mods-personals/` i restaura-la
  abans d'obrir les viles que la necessiten.
- Els mods comparteixen el límit de `limits.objectsPerCategory` de `config.js`
  amb la resta d'edificis i equipaments.
- Els identificadors han de començar per minúscula, tenir entre 2 i 40
  caràcters i només lletres i xifres. No en reutilitzis cap d'oficial.
- Cada parella forma:color obre un lot instanciat i cada color nou crea un
  material. Reaprofita els tons de les paletes que ja hi ha al joc.
- El taller no toca terrenys, arbres ni negocis personals. Per a aquests,
  segueix els exemples de `mods-personals/README.md`.

## Fitxers

| Fitxer | Què fa |
| --- | --- |
| `index.html`, `style.css`, `editor.js` | La interfície del taller |
| `constants.js` | Unitats del joc i catàleg de formes |
| `shapes.js` | Rèplica de l'objecte `geometries` de `scene.js` |
| `viewport.js` | Vista 3D, guies de parcel·la i selecció |
| `format.js` | Format del mod, validació i col·lecció |
| `library.js` | Biblioteca de peces reutilitzables i girs de grup |
| `ai-*.js`, `../ai-proxy.mjs` | Generador de mods des de fotografies · vegeu `LLEGEIX-ME-IA.md` |
| `personal-shapes.js` | Plantilles de formes personals i generació de `geometries.js` |
| `check-formes.mjs` | Comprova que el codi generat i la vista 3D coincideixen |
| `exporters.js` | Generació del renderitzador, del JSON i dels registres |
| `starters.js` | La torre de guaita i l'obelisc, com a exemples |
| `json-mods.js`, `json-mods-data.js` | El camí B, per copiar a `mods-personals/` |
