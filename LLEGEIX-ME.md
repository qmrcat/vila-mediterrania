# Vila Mediterrània

Un prototip de construcció lliure, inspirat en Townscaper i en l’arquitectura de la Costa Brava i la Costa Daurada. No és una reproducció de Townscaper ni un mapa d’una localitat real.

## Posar-lo en marxa

1. Descomprimeix tot el ZIP en una carpeta.
2. Si tens Node.js instal·lat, fes doble clic a `Inicia-Windows.bat` (Windows). A macOS/Linux, executa `node server.mjs` des d’aquesta carpeta.
3. S’obrirà el navegador. Mantén oberta la finestra del servidor mentre jugues.

Alternativament, obre aquesta carpeta amb VS Code i executa `index.html` amb Live Server, o serveix la carpeta amb qualsevol servidor HTTP estàtic. No s’ha d’obrir `index.html` directament amb doble clic: els navegadors restringeixen els mòduls JavaScript sota `file://`.

No cal executar `npm install`, compilar ni configurar Vite. El joc no utilitza cap framework. Three.js 0.180.0 s’inclou a `vendor/`, amb la seva llicència MIT. Un cop descarregat i amb un servidor local, no necessita Internet, cap compte ni clau d’API. El navegador ha de tenir WebGL 2 disponible.

## Jugar

- **Casa (1):** crea una casa o afegeix-hi un pis (màxim 5). El color i l’acabat seleccionats s’apliquen a tota la casa. A l’alçada màxima, un color/acabat diferent la repinta sense afegir-hi pisos.
- **Terreny (2):** escull **Terra ferma**, **Terreny amb pendent**, **Platja**, **Carrer empedrat**, **Carrer de terra** o **Carrer asfaltat**. Terra ferma crea terra al mar o eleva una casella existent (nivells 0–4); sobre una platja, primer la converteix en terra ferma. Platja substitueix l’element anterior, abaixa la casella al nivell de la costa i dibuixa sorra inclinada. A la Costa Daurada, el pendent és més suau i s’allarga sota el mar; a la Costa Brava és més pronunciat i curt. Les caselles de platja adjacents comparteixen una malla contínua. La franja submarina s’estén només sobre caselles buides. Canviar de costa adapta automàticament el pendent de les platges. Un altre clic sobre una platja no l’eleva; Esborra la converteix en terra ferma i un segon clic la retira. Construir-hi o plantar-hi substitueix la platja per una base de terra ferma.
- **Plaça (3):** substitueix l’element per paviment. Uneix caselles per fer carrers. Una plaça a la casella central té una font.
- **Arbres (4):** tria Pi mediterrani, Margalló, Alzina, Plàtan d’ombra, Olivera, Parra o Avellaner al selector i clica per plantar. Clicant sobre un arbre existent pots canviar-ne l’espècie. Com les altres eines, substitueix l’element anterior. El margalló es representa com una mata baixa de diversos troncs i fulles en ventall; l’alzina amb capçada densa de verd fosc; el plàtan amb capçada ampla i escorça clara amb taques. Totes les espècies projecten ombra amb la llum del joc.
- **Escales (5):** posa una escala; torna-hi a clicar per girar-la en quatre direccions. Cada tram puja 0,42 unitats, equivalent a un nivell de terreny.
- **Esborra (E), clic dret o Supr:** assenyala una façana a l’alçada del pis concret que vols treure. El marc ressalta aquest pis. Si queden pisos a sobre, conserven l’alçada i s’hi generen suports. Clica el buit amb Casa per reconstruir-lo. Sobre una teulada se selecciona l’últim pis. Els suports automàtics desapareixen en reconstruir el buit o quan ja no hi ha pisos a sobre. En altres elements es manté l’esborrament de l’element i després del terreny.
- **Arrossegar:** gira la vista. **Majúscules + arrossegar** o botó central: desplaça la càmera. **Roda, + i −:** zoom. **0:** vista inicial.
- **Tàctil:** toca per construir; arrossega per girar; dos dits per desplaçar i fer zoom. Per esborrar, tria l’eina Esborra.
- **Teclat:** amb el llenç enfocat, les fletxes mouen la casella seleccionada en els eixos del terreny, Re Pàg / Av Pàg canvien el pis seleccionat, Retorn construeix i Supr esborra el pis seleccionat. **Ctrl+Z:** desfés. **Ctrl+Y** o **Ctrl+Majúscules+Z:** refés. Historial de fins a 60 canvis durant la sessió.

## Desar i recuperar

Cada canvi es desa al `localStorage` d’aquest navegador i d’aquest origen web. El desament no se sincronitza entre dispositius i pot desaparèixer si es netegen les dades del navegador. El servidor inclòs utilitza el port 3000 o el primer disponible a partir d’aquest: conserva la mateixa adreça per recuperar el desament local.

A **La meva vila → Desa una còpia (.json)** pots exportar la vila. Obre-la amb **Obre una vila…**. El format 66 guarda els edificis del jugador amb els seus dissenys, els ajuntaments, les esglésies, les cases amb pati, la mida de la quadrícula, els mercats, els negocis de planta baixa, els ponts, la costa, totes les construccions, els buits entre pisos cada espècie plantada i les caselles de platja. S’importen també fitxers dels formats 1–65, convertits automàticament; els pins existents continuen sent pins. El desament anterior es conserva separadament al navegador; la càmera, la llum i l’historial de desfer no es guarden al fitxer.

**Fes una fotografia** exporta una imatge PNG de la vista 3D sense els controls.

Els botons de costa canvien els materials del paisatge i el color inicial de les cases noves, conservant la vila construïda. Per generar un relleu propi de l’altra costa, tria-la i crea una vila nova. Hi ha tres punts de partida: poble, illa sense construir i mar obert.

## Fitxers i arquitectura

- `index.html`: interfície i ajuda en català.
- `style.css`: disseny adaptable a ordinador, tauleta i mòbil.
- `model.js`: estat, generació del paisatge, regles, validació del JSON i historial.
- `scene.js`: escena Three.js, geometria procedural instanciada, mar, llum, càmera i controls de punter.
- `app.js`: interacció de la interfície, importació/exportació i desament local.
- `vendor/`: Three.js inclòs localment; no hi ha CDN en temps d’execució.
- `server.mjs`: servidor HTTP local opcional, fet només amb mòduls estàndard de Node.js.

## Abast d’aquesta primera versió

Construcció sobre una quadrícula de 33 × 33, 49 × 49 o 65 × 65 caselles, pisos, terrats, teulades, persianes, balcons, pins, carrers, escales i costa estilitzada. Les façanes oculten finestres i portes quan hi ha terreny o cases veïnes a aquella alçada. El joc és creatiu, sense objectius, economia ni puntuacions.

La costa rocosa utilitza caselles i roques de geometria senzilla; les platges utilitzen una superfície contínua subdividida, amb pendent diferenciat i sorra visible sota l’aigua; no hi ha encara la malla irregular ni totes les transformacions arquitectòniques de Townscaper. Els buits d’un nivell generen arcades obertes sobre pilastres. Diversos nivells buits consecutius generen pilastres altes amb llindes. Els pisos de sobre conserven les seves coordenades i la teulada només baixa quan s’elimina el nivell superior. El comptador compta els pisos ocupats, no els buits. No hi ha càlcul estructural físic, personatges ni simulació de circulació. Les escales són elements visuals per connectar desnivells.

Motor 3D: [Three.js](https://threejs.org/docs/), llicència MIT a `vendor/THREE-LICENSE.txt`.

- `beach.js`: superfície contínua de platja, perfils de pendent per costa i colors de sorra seca, humida i submergida. Els pendents són estilitzats per al joc, no mesures topogràfiques reals.

## Teulada a una aigua

A **Casa → Acabat de la casa**, pots escollir **Teulada a dues aigües**, **Teulada a una aigua** o **Terrat amb barana**. La teulada a una aigua té una sola vessant de teula, amb el costat alt i els laterals tancats amb paret, ràfec i canaló al costat baix. S’aplica en construir o afegir un pis, igual que els altres acabats; a l’alçada màxima, canvia l’acabat sense afegir-ne cap. El tipus de teulada es conserva en desar, importar i desfer/refés.

### Orientació de la teulada a una aigua

Quan tries aquest acabat apareix **Inclinació cap a: Est / Nord / Oest / Sud**. La direcció indica el costat baix de la coberta i es manté fixa respecte de la vila quan gires la càmera. En construir, s’aplica l’orientació seleccionada. Per canviar una casa existent, marca **Només gira la teulada** i clica una casa amb aquest acabat: no s’hi afegeix cap pis ni se’n canvien el color o els buits. Desmarca l’opció per tornar a construir. La paret superior, la coberta, els remats i el canaló giren conjuntament. Les teulades de viles antigues mantenen l’orientació anterior (Est). L’orientació es guarda al JSON i a l’historial de desfer/refés.


### Gir de les teulades a dues aigües

A **Casa → Teulada a dues aigües → Una vessant cap a**, tria Est, Nord, Oest o Sud. L’altra vessant mira al costat oposat. Est/Oest comparteixen la carena nord-sud; Nord/Sud comparteixen la carena est-oest. Si hi ha xemeneia, gira amb la coberta. **Només gira la teulada** permet girar cases existents, tant a una com a dues aigües, sense canviar-ne el tipus, els pisos, els buits ni el color. Els terrats no giren. L’orientació es conserva en desar i desfer/refés, dins del format de dades actual.


## Ponts entre ribes o terrenys elevats

Tria **Pont (6)** i clica primer una casella de **terra ferma, carrer o plaça** sense cases ni arbres. Clica després l’altre extrem: han d’estar a la mateixa fila o columna, separats entre 2 i 16 caselles. Cal mar o terreny més baix al mig. La previsualització verda indica un traçat vàlid; la vermella s’acompanya del motiu pel qual no es pot construir.

El pont de pedra té baranes laterals i pilastres en els trams llargs. El pas connecta les alçades dels dos extrems, amb pendent si són diferents. Els accessos queden oberts a les places. No es permet travessar cases, arbres, terreny massa alt ni altres ponts. Els ponts poden passar sobre terra baixa o platja; els extrems han de recolzar sobre terra ferma, carrer o plaça.

**Cancel·la el pont**, **Esc** o clic dret durant la selecció cancel·len el primer extrem. Canviar d’eina, importar, començar una vila o desfer/refés també cancel·la la selecció pendent. Amb teclat, mou-te amb les fletxes i confirma cada extrem amb Retorn. Al mòbil toca els dos punts.

Amb **Esborra**, clic dret o Supr sobre el traçat, es retira el pont sencer i es conserva el terreny. Retira primer el pont per modificar els seus extrems o el seu corredor. Els ponts es desen automàticament, s’inclouen al JSON i admeten desfer/refés. El format actual importa també les viles antigues.


## Negocis a la planta baixa: bars

1. A **Casa → Acció a la casa**, tria **Negoci a la planta baixa**.
2. Tria **Bar** i la façana: **Sud, Est, Nord o Oest**. Les direccions són fixes respecte de la vila, independentment de la càmera.
3. Marca **Amb terrassa** si vols dues taules rodones i quatre cadires. Prepara una casella de **terra ferma, carrer o plaça lliure a la mateixa alçada**, just davant de la façana escollida.
4. Clica una casa existent. S’hi posa una porta vidrada, una finestra de servei, un rètol **BAR** i un tendal de ratlles verd i crema. No s’hi afegeix cap pis ni es canvien el color o la teulada.

Pots desmarcar **Amb terrassa** per posar només el bar. Si l’espai no és adequat o està ocupat per una altra terrassa, el joc t’indica què cal corregir i conserva la casa anterior. Per canviar l’orientació o la terrassa d’un bar existent, tria la configuració nova i torna a clicar la casa.

Per retirar el negoci, tria **Sense negoci (retira’l)** i clica la casa. Per continuar construint, torna a **Construir pisos i teulades**.

La planta baixa ha d’existir: si té un buit amb arcades, reconstrueix-la abans de posar-hi un bar. Si després esborres aquesta planta o substitueixes la casa, també es retira el negoci. Afegir o treure pisos superiors conserva el bar.

El mobiliari no flota ni travessa altres elements. Si després edites el terreny del davant, hi plantes un arbre, hi construeixes o hi poses un pont, la terrassa s’amaga automàticament quan deixa de ser viable; reapareix quan recuperes les condicions originals. El rètol i el tendal també s’amaguen si la façana queda obstruïda. La petició de terrassa continua desada.

Els bars i la seva orientació es guarden al navegador i al JSON, i funcionen amb desfer/refés. El format 13 importa els formats 1–12: conserva els bars existents i no afegeix negocis a les cases que no en tenien. Els negocis disponibles són **Bar**, **Fruiteria**, **Restaurant** i **Botiga de queviures**.


## Fruiteries amb prestatgeries

A **Casa → Negoci a la planta baixa → Fruiteria**, escull la façana i clica una casa existent. La planta baixa ha d’estar construïda. La porta queda al centre, amb una prestatgeria de fusta a cada costat: cadascuna té tres nivells de caixes amb fruita de colors. El rètol diu **FRUITERIA**.

Cal una casella de **terra ferma, carrer o plaça lliure al davant, a la mateixa alçada**, perquè les prestatgeries recolzin sobre terra. L’opció de terrassa amb taules apareix quan tries Bar o Restaurant. Les prestatgeries deixen lliure l’accés central i giren amb la façana. La seva zona no es pot compartir amb una altra fruiteria ni amb la terrassa d’un bar.

Clicant un negoci existent amb Fruiteria el substitueixes, mantenint els pisos, els buits, el color i la teulada. Per retirar-lo, tria **Sense negoci (retira’l)**. Si canvies o ocupes el terreny del davant, les prestatgeries s’amaguen quan no hi ha espai adequat i reapareixen quan el recuperes. La fruiteria es guarda al JSON i al navegador i admet desfer/refés.


## Punts cardinals

La brúixola de la part superior dreta mostra **Nord, Sud, Est i Oest**; el nord està ressaltat en vermell. Les direccions segueixen la rotació i la inclinació de la vista i coincideixen amb les orientacions de les teulades i les façanes dels negocis. Les etiquetes es mantenen dretes per facilitar-ne la lectura.

S’actualitza en arrossegar amb el ratolí o el dit, prémer el botó de gir, fer zoom, redimensionar la pantalla o tornar a la vista inicial. La brúixola queda fixa a la pantalla per continuar visible quan desplaces o apropes el mapa, i no intercepta els clics. Com els altres controls, no s’inclou a la fotografia exportada de la vila.


## Restaurants

A **Casa → Negoci a la planta baixa → Restaurant**, escull la façana i clica una casa existent. El restaurant té una porta central vidrada, una carta emmarcada al costat de l’entrada, el rètol **RESTAURANT** i un tendal granat i crema.

Amb **Amb terrassa** s’afegeixen dues taules amb estovalles, quatre cadires, plats, coberts i gots. Cal una casella lliure de terra ferma, carrer o plaça al davant, a la mateixa alçada. Pots desmarcar l’opció per obrir només el local. Les terrasses no es poden superposar a altres negocis ni a ponts. Si després ocupes o canvies l’alçada d’aquest espai, el mobiliari s’amaga fins que torni a ser adequat.

Pots transformar un bar o una fruiteria en restaurant, canviar-ne la façana o retirar-lo amb **Sense negoci (retira’l)**. Es conserven els pisos, els buits superiors, el color i la teulada. La planta baixa ha d’existir; esborrar-la també retira el negoci. El restaurant es desa al navegador i al JSON i admet desfer/refés.


## Botigues de queviures

A **Casa → Negoci a la planta baixa → Botiga de queviures**, escull la façana i clica una casa existent. La botiga té una porta central vidrada, el rètol **QUEVIURES** i dos aparadors amb prestatges de pots, llaunes, ampolles i pa.

La façana ha d’estar lliure. Els aparadors estan incorporats a la façana i no necessiten una zona de terrassa; l’opció **Amb terrassa** s’amaga per a aquest negoci. Pots transformar-hi un altre negoci, orientar-la en qualsevol dels quatre costats o retirar-la amb **Sense negoci (retira’l)**. Els pisos, els buits superiors, el color i la teulada es conserven.

Cal tenir la planta baixa construïda; esborrar-la també retira el negoci. Si després una construcció obstrueix la façana, l’aparador s’amaga fins que torna a estar lliure. La botiga es desa al navegador i al JSON i funciona amb desfer/refés.


## Mercat de la vila · edifici de 2 o 4 cel·les

Tria **Mercat (7)** i escull **Petit · 2 cel·les (1 × 2)** o **Gran · 4 cel·les (2 × 2)**. Escull també l’orientació de l’entrada principal: Sud, Est, Nord o Oest. En el mercat petit, girar l’entrada també gira la disposició 1 × 2 / 2 × 1.

Prepara totes les cel·les amb **terra ferma, carrer o plaça lliure a la mateixa alçada**. Mou el punter per veure el marc complet: verd quan s’hi pot construir i vermell quan no. Clica per col·locar-lo. La cel·la assenyalada és la cantonada de coordenades X/Z menors; guia’t pel marc per veure exactament l’espai ocupat. Al mòbil toca la cantonada; amb teclat, tria-la amb les fletxes i confirma amb Retorn.

El mercat és un edifici únic amb coberta de teula a dues aigües, arcades, pilars, quatre parades interiors i el rètol **MERCAT**. La mida gran té una nau més ampla. No es pot col·locar sobre mar, platja, desnivells, cases, arbres, ponts ni espais exteriors ocupats per altres negocis.

**Esborra**, clic dret o Supr sobre qualsevol de les seves cel·les retira el mercat sencer i conserva el terreny. Retira’l abans de canviar la seva mida, orientació o el terreny de sota. Es pot recuperar amb desfer/refés. Els mercats es guarden automàticament al navegador i al JSON; el format 12 importa les viles anteriors sense afegir-hi mercats.


## Escollir o ampliar la quadrícula

A **La meva vila → Comença una vila nova…**, escull **33 × 33**, **49 × 49** o **65 × 65** abans de triar poble, illa o mar obert. La mida determina l’espai disponible per construir. El poble o l’illa inicial mantenen la mida original, amb més mar al voltant.

Per conservar la vila i donar-li més espai, ves a **La meva vila → Amplia la quadrícula…**, tria una mida superior i prem **Amplia i conserva la vila**. Les construccions, les orientacions i les coordenades es conserven exactament. L’ampliació afegeix espai de mar als quatre costats. Es desa automàticament i es pot desfer/refés. No es permet reduir directament una vila existent; per començar de zero amb una mida més petita, crea una vila nova.

El menú indica la mida actual. La quadrícula visible, la selecció amb ratolí o teclat, el zoom, el desplaçament, les platges, els ponts, els mercats i els negocis respecten els nous límits. Pots allunyar més la vista en les mides grans. El format 13 guarda la mida també al JSON. Les viles dels formats 1–12 s’obren a 33 × 33 i després es poden ampliar.


La barra inferior d’eines és més baixa i té un fons semitransparent. Les icones i els noms mantenen l’opacitat completa, amb botons de com a mínim 44 píxels d’alçada per facilitar-ne l’ús tàctil.


## Cases amb pati · màxim dues plantes

A **Casa → Construir pisos i teulades → Tipus de casa**, tria **Casa amb pati**. El selector **On vols el pati?** demana obligatòriament **Al davant** o **Al darrere** abans de construir. Escull la façana principal (Sud, Est, Nord o Oest) i **1 planta · planta baixa** o **2 plantes · baixa i primer pis**. La façana segueix els punts cardinals encara que giris la vista. El pati del darrere queda al costat oposat de la façana principal.

El conjunt ocupa dues cel·les: una per a la casa i una per al pati. Clica la cel·la de la casa; el marc mostra les dues, verd si hi caben i vermell si hi ha un impediment. Cal terra ferma, carrer o plaça lliure a la mateixa alçada; les cel·les buides de mar es converteixen automàticament en terra a l’alçada de la parcel·la. El pati té paviment de rajoles, murets, testos i un banc. El pati del davant també té una portella orientada al carrer.

En aquest mode, clicar una casa aplica l’alçada escollida i la distribució del pati, així com el color i la teulada seleccionats. Pots afegir el pati a una casa d’una o dues plantes; si és més alta, primer n’has de retirar els pisos sobrants. Si hi ha un negoci, retira’l abans de canviar la distribució. Les cases amb pati continuen limitades a dues plantes quan utilitzes la construcció habitual. Admeten els tres tipus de coberta i el gir de teulada. Pots obrir negocis en una façana lliure que no doni al pati.

El pati queda reservat: no s’hi poden plantar arbres, construir cases, passar ponts ni posar mercats o terrasses. No es pot elevar la base de la casa independentment del pati. Canviar la posició del pati allibera l’anterior i conserva el seu terreny.

**Esborra sobre la casa** retira el pis assenyalat; si treus la planta baixa i queda la superior, apareixen els suports habituals. En retirar l’últim pis també es retira el pati. **Esborra sobre el pati** retira la casa i el pati sencers, conservant les dues bases de terreny. Tots aquests canvis es poden desfer i refer.

La distribució i les dues plantes es guarden al navegador i al JSON (format 14). Les viles anteriors es recuperen amb les construccions intactes.


## Església amb campanar

Tria **Església (8)** a la barra d’eines. Escull l’orientació de l’entrada principal: **Sud, Est, Nord o Oest**. La nau i el campanar giren junts. El conjunt ocupa **sis cel·les**, en una disposició **2 × 3** o **3 × 2** segons l’orientació.

Prepara totes les cel·les amb **terra ferma, carrer o plaça lliure a la mateixa alçada**. El marc de selecció mostra tota la parcel·la: verd si s’hi pot construir i vermell si falta terreny o hi ha algun impediment. La cel·la assenyalada és la cantonada de coordenades X/Z menors, igual que amb els mercats. No es pot construir sobre platges, mar, cases, arbres, desnivells, mercats, ponts, patis o terrasses de negocis.

L’edifici té una nau de pedra clara amb teulada a dues aigües, portal d’arc, graons, rosassa, finestres laterals i contraforts. El campanar quadrat té una galeria d’arcs oberts amb una campana de bronze, coberta de teula a quatre vessants i una creu. Els materials de pedra s’adapten a la costa escollida. És un edifici estilitzat per al joc, no una reproducció d’una església concreta.

La nau i el campanar es col·loquen i es retiren com un sol edifici; no s’hi afegeixen pisos. **Esborra**, clic dret o Supr sobre qualsevol de les sis cel·les retira l’església sencera, conservant el terreny. Per canviar la distribució, retira-la i torna-la a col·locar amb l’orientació nova. Es pot desfer i refer.

Les esglésies es guarden automàticament al navegador i al JSON (format 15). Les viles dels formats 1–14 conserven les construccions i s’obren sense afegir-hi esglésies.


## Música de fons

Obre **♫** a la part superior del joc. Pots **reproduir o pausar**, passar a la **següent pista** i ajustar el **volum**. Les pistes sonen per ordre de nom, una rere l’altra; després de l’última torna a començar la llista. Una pista que no es pugui reproduir se salta; si fallen totes, el reproductor s’atura.

Desmarca **Música activada** per desactivar-la. Es recorden l’activació, la pausa i el volum en aquest navegador, independentment de la vila oberta. **Pausa** conserva el punt de la pista durant la sessió. En reobrir el joc no es conserva el minut exacte, però sí la decisió de deixar-la pausada o desactivada. **Reprodueix** torna a activar-la. Tancar la finestra dels controls amb × deixa la música en l’estat actual.

### Carpeta del joc descarregat

1. Copia els àudios a la carpeta **music**, inclosa al ZIP. També pots fer-hi subcarpetes.
2. Inicia el joc amb **Inicia-Windows.bat** o **node server.mjs**.
3. El servidor detecta els fitxers automàticament; no cal editar cap llista. Si hi afegeixes pistes mentre jugues, prem **♫ → Carpeta del joc** per actualitzar-la.

S’accepten fitxers MP3, OGG, OGA, WAV, M4A, AAC, FLAC, OPUS i WEBM, segons els formats que pugui reproduir el navegador. Pots prefixar els noms amb 01-, 02-… per ordenar-los. El servidor transmet els àudios per fragments sense carregar-los sencers a la memòria.

### Escollir una carpeta del dispositiu

**♫ → Escull una carpeta…** permet reproduir fitxers locals tant al joc en línia com al descarregat. Els àudios no s’envien a cap servidor. Cal tornar a escollir la carpeta quan es recarrega o es reobre la pàgina, perquè el navegador no conserva l’accés als fitxers seleccionats. La decisió de tenir la música desactivada o pausada sí que es conserva.

### Live Server i allotjament estàtic

Amb altres servidors, afegeix els noms relatius dels àudios a **music/playlist.json**, per exemple:

```json
["01-mar.mp3", "02-vespre.ogg", "ambient/03-passeig.mp3"]
```

Els fitxers han de ser dins de **music**. Amb el servidor Node inclòs, la llista es genera automàticament i no cal modificar aquest JSON.

El navegador pot exigir una interacció abans de deixar sonar música: prem **Reprodueix** o fes clic al joc. No s’inclouen pistes d’àudio al ZIP; hi has d’afegir les teves.

Fitxers nous: `music.js` (reproductor), `local-server.mjs` (servei de fitxers i detecció d’àudios), `music/playlist.json` i `music/LLEGEIX-ME.txt`. Les preferències musicals no es barregen amb el fitxer JSON de la vila ni amb l’historial de construcció.


## Ajuntament de dues plantes amb senyera

Tria **Ajuntament (9)** i escull **Petit · 2 × 1 cel·les** o **Gran · 2 × 2 cel·les**. Les dues mides tenen **planta baixa i primer pis**, amb una façana de dues cel·les d’amplada. Pots orientar la façana i el balcó al **Sud, Est, Nord o Oest**; en la mida petita, el conjunt passa de 2 × 1 a 1 × 2 quan gira.

Prepara totes les cel·les amb **terra ferma, carrer o plaça lliure a la mateixa alçada**. El marc verd mostra la parcel·la disponible; el vermell indica que hi ha un impediment. Com en els mercats i les esglésies, la cel·la assenyalada és la cantonada de coordenades X/Z menors.

L’edifici té entrada central d’arc, finestres simètriques, rètol **AJUNTAMENT** i coberta de teula. Al **pis superior de la façana principal** hi ha un balcó amb barana i un pal vertical. La **senyera catalana** té quatre franges horitzontals vermelles sobre fons groc, visibles pels dos costats, i oneja suaument amb la vora del pal fixa. El balcó, el pal i la bandera giren conjuntament amb l’edifici. La bandera també surt a les fotografies del joc.

Si el sistema té activada la preferència de moviment reduït, la senyera es mostra plegada però estàtica, igual que la resta d’animacions ambientals del joc.

No s’hi poden afegir pisos ni substituir-ne cel·les individualment. **Esborra**, clic dret o Supr sobre qualsevol cel·la retira l’ajuntament sencer i conserva el terreny. Per canviar la mida o la façana, retira’l i torna’l a construir. Totes aquestes accions es poden desfer i refer.

Els ajuntaments es guarden al navegador i al JSON (format 16). Les viles anteriors conserven les cases, els patis, els mercats, les esglésies i la resta de construccions. Les preferències de música es mantenen separades i no canvien.


## Editor d’edificis del jugador

Obre **Els meus edificis (B) → Obre l’editor d’edificis** o **La meva vila → Editor d’edificis**. És una pàgina separada (`editor.html`) del mateix joc. La vila es desa abans de sortir-ne. La vista 3D i el joc comparteixen el mateix renderitzador dels dissenys.

### Dissenyar les tres plantes

1. Escriu un nom i escull l’amplada i la fondària, d’**1 a 3 cel·les** cadascuna.
2. A **Planta baixa**, selecciona una cel·la de la quadrícula. Tria **Murs** o **Arcades obertes amb pilastres**, el color i les obertures de davant, dreta, darrere i esquerra: mur, porta, finestres o balcó.
3. A **Planta del mig**, configura les cel·les de la mateixa manera. Pots escollir **Sense planta intermèdia** per abaixar aquella part de l’edifici. **Repeticions de la planta intermèdia** permet afegir entre 0 i 3 plantes sobre la baixa.
4. A **Terrat i teulada**, tria per a cada cel·la **Terrat amb barana**, **Teulada a una aigua** o **Teulada a dues aigües**, el color i l’orientació local de la coberta.
5. **Aplica a tota aquesta planta** copia la configuració de la cel·la seleccionada a la resta de la planta. La planta baixa sempre ocupa tota la parcel·la rectangular.

La quadrícula mostra el darrere a dalt i la façana principal a baix. Pots arrossegar la vista 3D per girar-la, fer zoom amb la roda o seleccionar una cel·la clicant l’edifici. Les obertures entre dues cel·les amb murs queden ocultes. Els balcons es veuen a les façanes exteriors; les arcades són buits reals amb suports. La coberta s’adapta a l’alçada de cada cel·la. És un editor modular, no un editor de malles 3D lliures.

### Desar al navegador i al disc

**Desa el disseny** el guarda al `localStorage` del navegador. Es poden tenir fins a **100 dissenys**. El selector **Els meus dissenys** permet tornar-los a obrir; **Nou** inicia un disseny i **Desa com a còpia** en crea un de diferent. **Elimina** retira el disseny de la col·lecció després de confirmar-ho. Els canvis pendents s’avisen abans de sortir o canviar de disseny.

**Exporta aquest JSON** baixa el disseny actual, encara que no s’hagi desat al navegador. **Exporta tota la col·lecció** baixa tots els dissenys desats. **Importa JSON…** admet aquests fitxers (màxim 2 MB), valida tota la col·lecció i afegeix còpies amb identificadors nous, sense sobreescriure els dissenys existents. Els fitxers de dissenys tenen el format `vila-buildings`, versió 2 (també es pot importar la versió 1); són diferents dels fitxers de vila.

El desament al navegador depèn del mateix origen (adreça, protocol i port). Per traslladar dissenys entre el joc en línia, el servidor local o un altre dispositiu, exporta’ls i importa’ls amb JSON. Si el navegador no permet desar o no queda espai, el missatge indica que no s’ha pogut completar el desament; encara pots exportar el disseny actual.

### Col·locar-los a la vila

Després de desar, prem **Torna a la vila**. S’obrirà l’eina **Els meus edificis (B)**, que agrupa tota la col·lecció dins d’una sola icona de la barra. Tria un disseny i la direcció de la façana principal: Sud, Est, Nord o Oest. Prepara tota la parcel·la amb **terra ferma, carrer o plaça lliure i anivellada**; el marc verd indica que es pot col·locar. S’admeten fins a 128 edificis del jugador en una vila.

Cada edifici es col·loca com un conjunt. Esborra sobre qualsevol de les seves cel·les retira el conjunt i conserva el terreny. Les accions admeten desfer i refer. Editar o eliminar el disseny de la col·lecció no modifica els edificis ja col·locats: cadascun conserva una còpia completa. Per aplicar-hi un disseny nou, retira l’edifici i torna’l a col·locar.

El JSON de la vila (format 27) inclou aquestes còpies completes, de manera que es pot obrir en un altre navegador sense importar la col·lecció de dissenys. Els dissenys inclosos a la vila no s’afegeixen automàticament al catàleg de l’editor. La importació de viles admet fitxers de fins a 8 MB; la importació de col·leccions de dissenys, fins a 2 MB.

Fitxers nous: `editor.html`, `editor.css`, `editor.js`, `designs.js` (format i col·lecció) i `custom-geometry.js` (geometria compartida). L’editor funciona amb el servidor inclòs, Live Server i l’allotjament del joc. Si no es pot iniciar WebGL 2, la quadrícula i l’exportació continuen disponibles sense la vista 3D.


## Noms dels rètols dels negocis — v22

A **Casa → Negoci a la planta baixa**, tria **Canvia només el rètol**, escriu el **Nom del rètol** i clica la casa amb el negoci que vols modificar. Funciona amb bars, fruiteries, restaurants i botigues de queviures. Cada establiment pot tenir un nom diferent. El tipus de negoci, la façana, la terrassa, les prestatgeries i els pisos es conserven.

També pots indicar el nom en crear o configurar el negoci. S’admeten fins a **24 caràcters**, amb lletres, accents, dièresi, ce trencada, punt volat, números, espais, apòstrofs i puntuació senzilla. Per exemple: **Bar Can Martí**, **Fruiteria L’Hort** o **Queviures l’Àvia**. El rètol es dibuixa en majúscules i s’ajusta a l’amplada disponible; els noms curts es veuen més grans.

Deixa el camp buit per recuperar el nom genèric (Bar, Fruiteria, Restaurant o Queviures). Els canvis admeten **Desfés / Refés** i es desen amb la vila al navegador i als fitxers JSON (format 18). Les viles anteriors continuen sent compatibles.


## Varietat de portals i finestres — v23

Les cases del joc combinen automàticament el **portal amb arcada clàssic**, portals amb arcada nous i portals **rectangulars d’una o dues fulles**. Poden quedar a l’**esquerra, al centre o a la dreta**, amb una o dues finestres rectangulars o amb arcada al costat. Les dues fulles es distingeixen per la junta central i dos tiradors. La combinació depèn de la posició de la casa i de la façana: es manté en girar la càmera, reconstruir la vista, desfer o tornar a obrir la vila.

A l’**editor**, selecciona una cel·la de la **planta baixa** o de la **planta del mig**. A la façana que vulguis modificar, tria **Portal configurable** i ajusta:

- **Forma del portal:** amb arcada, rectangular d’una fulla o rectangular de dues fulles.
- **Posició del portal:** esquerra, centre o dreta, mirant la façana des de fora.
- **Finestres al costat:** rectangulars, amb arcada o sense finestres.
- **Nombre de finestres:** una o dues. En un portal lateral, es col·loquen al costat oposat; amb el portal al centre, dues finestres el flanquegen i una sola queda a la dreta.

Cada façana, cel·la i planta pot tenir una combinació diferent. També hi ha **Finestres amb arc** per fer façanes sense porta. Es conserven les opcions **Porta d’arc clàssica**, finestres rectangulars, balcó i mur. A les cel·les d’arcades obertes es mantenen els suports, sense portals superposats. Les façanes dels negocis mantenen els seus rètols i aparadors.

Les viles es desen en el format **19** i els dissenys en la versió **2**. Es recuperen les viles i els dissenys anteriors, tant del navegador com del JSON. Les còpies d’edificis ja col·locades continuen sent independents de les modificacions del catàleg. El fitxer `entrances.js` comparteix la geometria dels nous portals entre el joc i l’editor.


## Quiosc de premsa — v24

A **Casa → Negoci a la planta baixa**, escull **Quiosc de premsa**, tria la façana (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. La façana ha d’estar lliure. El quiosc s’integra a l’edifici: té taulell d’atenció, tendal de ratlles, sis diaris exposats a l’esquerra, sis revistes de colors a la dreta i dos diaris plegats sobre el taulell. No necessita una casella de terrassa.

El rètol genèric és **PREMSA**. Pots escriure un altre nom al camp **Nom del rètol**, o fer servir **Canvia només el rètol** en un quiosc existent. La casa conserva els pisos, els buits, els colors i la teulada. **Sense negoci** retira el quiosc i recupera la façana residencial; totes aquestes accions es poden desfer i refer.

El quiosc i el nom es desen amb la vila al navegador i al JSON (format **20**). Les viles anteriors i els dissenys de l’editor continuen sent compatibles.


## Floristeria — v25

A **Casa → Negoci a la planta baixa**, escull **Floristeria**, tria una façana lliure (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. La botiga té una porta central de vidre, dos aparadors amb quatre prestatges i vuit testos de rams, flors roses, grogues, liles i vermelloses, fulles verdes i un tendal verd i crema. Els expositors són poc profunds i no necessiten una casella de terrassa.

El rètol genèric és **FLORISTERIA**. El camp **Nom del rètol** permet posar-hi, per exemple, **Flors de la Plaça**. També pots reanomenar una floristeria existent amb **Canvia només el rètol**. En afegir-la o substituir un altre negoci, es conserven els pisos, els buits, el color i la teulada de la casa. **Sense negoci** recupera la façana residencial.

Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **21**). Les viles anteriors i els dissenys de l’editor continuen sent compatibles.


## Farmàcia — v26

A **Casa → Negoci a la planta baixa**, escull **Farmàcia**, tria una façana lliure (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. Té una **creu verda**, porta de vidre de dues fulles, aparadors amb sis capses i sis flascons sobre prestatges, i acabats blancs i verds. No necessita una casella de terrassa.

El rètol genèric és **FARMÀCIA**. Pots personalitzar-lo al camp **Nom del rètol**, per exemple **Farmàcia de la Plaça**, o canviar-lo més endavant amb **Canvia només el rètol**. El nom s’ajusta a l’espai reservat al costat de la creu.

Es conserven els pisos, els buits, el color i la teulada de la casa. **Sense negoci** retira la farmàcia i recupera la façana residencial. Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **22**). Les viles anteriors i els dissenys de l’editor continuen sent compatibles.


## Peixateria — v27

A **Casa → Negoci a la planta baixa**, escull **Peixateria**, tria una façana lliure (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. Té porta central de vidre, dos aparadors amb **sis peixos sobre gel**, taulells enrajolats i un **tendal blau i blanc**. Els peixos tenen cos platejat, cua, aleta i ulls. No necessita una casella de terrassa.

El rètol genèric és **PEIXATERIA**. Pots personalitzar-lo al camp **Nom del rètol**, per exemple **Peixateria del Port**, o reanomenar-lo després amb **Canvia només el rètol**.

Es conserven els pisos, els buits, el color i la teulada de la casa. **Sense negoci** retira la peixateria i recupera la façana residencial. Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **23**). Les viles anteriors i els dissenys de l’editor continuen sent compatibles.


## Guingueta de platja — v28

La **Guingueta (G)** és una construcció independent d’una sola cel·la, disponible a la barra d’eines. **Només es pot col·locar sobre terreny de platja**: pinta primer una cel·la amb **Terreny → Platja**. Funciona a la Costa Brava i a la Costa Daurada, i conserva el pendent de la sorra.

Té plataforma de fusta sobre potes, barra oberta, dos tamborets, ampolles i gots, parets de fusta de tons marins i coberta a dues aigües de color canyís. Tot el conjunt ocupa una sola cel·la. Tria **Barra cap a** (Sud, Est, Nord o Oest), escriu opcionalment un **Nom del rètol** de fins a 24 caràcters i clica la platja. El marc verd indica que s’hi pot construir; el vermell indica que no.

Per canviar el nom o l’orientació, mantén l’eina Guingueta, ajusta els controls i torna a clicar-la. Deixa el nom buit per recuperar **GUINGUETA**. No s’hi poden afegir pisos ni negocis de casa. **Esborra**, clic dret o Supr retira la guingueta sencera i **conserva la platja**. Retira-la abans de transformar el terreny. No pot coincidir amb un pont.

Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **24**). Es conserven les viles anteriors i els dissenys de l’editor. La geometria és a `beach-bar.js`; la guingueta es desa com a element de la seva cel·la de platja.


## Fleca — v29

A **Casa → Negoci a la planta baixa**, escull **Fleca**, tria una façana lliure (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. Té porta central de vidre amb marc de fusta, dos aparadors amb **quatre pans rodons i sis barres de pa**, prestatges i un **tendal ocre i crema**. Els pans tenen talls a la crosta. No necessita una casella de terrassa.

El rètol genèric és **FLECA**. Pots personalitzar-lo al camp **Nom del rètol**, per exemple **Fleca de la Plaça**, o canviar-lo després amb **Canvia només el rètol**.

Es conserven els pisos, els buits, el color i la teulada de la casa. **Sense negoci** retira la fleca i recupera la façana residencial. Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **25**). Les viles anteriors, les guinguetes i els dissenys de l’editor continuen sent compatibles.


## Carnisseria — v30

A **Casa → Negoci a la planta baixa**, escull **Carnisseria**, tria una façana lliure (Sud, Est, Nord o Oest) i clica una casa amb la planta baixa construïda. Té porta central de vidre, **peces de carn en safates**, **embotits penjats**, un taulell enrajolat i un **tendal granat i crema**. Els aparadors queden a banda i banda de l’entrada i no necessiten una casella de terrassa.

El rètol genèric és **CARNISSERIA**. Pots personalitzar-lo al camp **Nom del rètol**, per exemple **Carnisseria de la Plaça**, o canviar-lo després amb **Canvia només el rètol**.

Es conserven els pisos, els buits, el color i la teulada de la casa. **Sense negoci** retira la carnisseria i recupera la façana residencial. Admet **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **26**). Les viles anteriors, les guinguetes i els dissenys de l’editor continuen sent compatibles.


## Olivera, parra i avellaner — v31

Obre **Arbres (4)** i escull una de les noves opcions a **Arbre o planta**:

- **Olivera:** tronc nuós, branques obertes, fullatge gris verdós i petites olives.
- **Parra:** emparrat de fusta de quatre potes, capçada de fulles i quatre raïms penjants. La part de sota queda oberta.
- **Avellaner:** diversos troncs, capçada verda arrodonida i grups d’avellanes.

Clica per plantar l’espècie seleccionada. Clica un arbre existent per substituir-lo; **Esborra** el retira i conserva el terreny. La forma es manté en tornar a obrir la vila. Les noves plantes projecten ombra i s’adapten a l’alçada de la cel·la igual que les espècies anteriors.

El selector conserva el pi, el margalló, l’alzina i el plàtan d’ombra. Les set opcions admeten **Desfés / Refés**, desament al navegador i exportació/importació de la vila amb JSON (format **27**). La geometria de les tres noves espècies és a `mediterranean-trees.js`.


## Carrers empedrats, de terra i asfaltats — v32

A **Terreny (2) → Tipus de terreny**, tria **Carrer empedrat**, **Carrer de terra** o **Carrer asfaltat** i clica les cel·les que vols convertir en carrer. L’empedrat té petites pedres de tons variats i juntes alternades; el de terra és ocre amb grava; l’asfaltat és gris fosc amb gra fi. Les cel·les adjacents formen superfícies contínues, també en revolts i cruïlles. No hi apareixen bancs ni fonts automàticament.

Canviar d’acabat conserva l’alçada del terreny. Un segon clic amb el mateix acabat no l’eleva. **Terra ferma** permet elevar un carrer conservant-ne el paviment; **Esborra** retira primer el paviment i deixa terra ferma a la mateixa alçada. Com la plaça i la platja, aquestes eines substitueixen cases o arbres existents; **Desfés** permet recuperar-los.

Els carrers admeten cases, edificis grans, patis i les terrasses dels negocis, amb les mateixes condicions d’alçada i espai lliure que la terra ferma. També poden ser els extrems d’un pont o passar per sota d’un pont prou elevat. Les construccions que reserven diverses cel·les i les guinguetes mantenen la protecció del seu terreny. La guingueta continua requerint platja.

S’inclouen al desament automàtic i a l’exportació/importació JSON (**format 28**), amb recuperació dels desaments anteriors. La geometria dels paviments és a `road-surfaces.js`.


## Terreny amb pendent — v33

A **Terreny (2) → Tipus de terreny → Terreny amb pendent**, escull cap on **puja**: Sud, Est, Nord o Oest. Les direccions coincideixen amb la brúixola encara que giris la vista. Pots conservar l’acabat actual o escollir **Terra ferma**, **Carrer empedrat**, **Carrer de terra** o **Carrer asfaltat**.

El pendent ocupa una cel·la i puja exactament un nivell (0,42 unitats del joc) entre els dos costats oposats. La cel·la conserva el seu nivell inferior, que ha de ser entre 0 i 3. Per exemple, per connectar una zona de nivell 0 amb una de nivell 1 situada al nord, aplica un pendent que pugi cap al **Nord** en una cel·la de nivell 0, al costat de la zona alta. Per fer una pujada més llarga, prepara cel·les consecutives als nivells 0, 1, 2… i aplica-hi pendents en la mateixa direcció. **Terra ferma** eleva tot el pendent un nivell, conservant-lo, fins al nivell superior màxim 4.

Pots canviar l’acabat d’un pendent amb les eines habituals de carrer: les pedres, la terra i l’asfalt segueixen la inclinació. Un altre clic amb el mateix pendent i acabat no l’eleva. El pendent és una propietat del terreny: també es conserva quan construeixes una casa, plantes un arbre o hi poses un altre element. Aplicar el pendent a una casa conserva els pisos, els buits, el color i la teulada.

Les cases i altres construccions es mantenen verticals sobre **fonaments horitzontals al nivell superior**. Els arbres arrelen a mitja vessant; la parra amb emparrat disposa d’una base horitzontal per sostenir els pilars. Places, escales i terrasses també disposen de base horitzontal. Els mercats, esglésies, ajuntaments, edificis de l’editor i cases amb pati admeten pendents, amb totes les bases de la parcel·la a la mateixa alçada superior; es poden combinar amb terra plana a aquesta alçada. Es mantenen les proteccions de les construccions que ocupen diverses cel·les. Les guinguetes continuen sent exclusives de la platja.

Els ponts es poden recolzar en un pendent i adapten la seva alçada al costat de connexió. Cal mantenir espai lliure sota el pont. Retira el pont abans de modificar el pendent dels extrems o del traçat.

**Sense pendent · aplana** retira la inclinació i baixa el terreny al nivell inferior, conservant els elements. **Esborra** primer retira l’element o paviment; sobre un pendent de terra ferma, retira només el pendent. Convertir-lo en **Platja** elimina el pendent i abaixa la cel·la al nivell de costa.

Tot admet **Desfés / Refés**, desament automàtic i exportació/importació JSON (**format 29**); els formats 1–28 continuen sent compatibles. La geometria és a `slope-geometry.js`.


## Portes i testos sobre desnivells — v34

Les façanes de planta baixa situades en terreny elevat comproven l’alçada del terreny just davant de la porta. Si no hi ha accés a una alçada compatible ni espai per a unes escales automàtiques, **el portal es transforma visualment en una finestra** i es retiren els testos que quedarien suspesos. Es conserva la posició del portal i les finestres laterals. Cada façana es resol per separat: una casa pot conservar la porta al costat del carrer i tenir finestres sobre el desnivell de l’altre costat.

La comprovació té en compte el costat alt o baix dels pendents, la posició de les portes laterals, les escales, les bases dels patis i terrasses i els ponts que arriben realment a l’entrada. Els testos dels balcons, que disposen de suport, es conserven. Les entrades del nivell més baix de costa mantenen el comportament anterior.

El canvi és automàtic i visual: no modifica la vila desada ni els dissenys de l’editor. Si després s’afegeix terreny d’accés, reapareixen la porta original i els testos amb suport. També s’aplica als portals de planta baixa dels edificis del jugador; la previsualització plana de l’editor conserva els elements escollits. Una façana comercial elevada sense accés queda amagada fins que recupera un accés adequat, conservant el negoci desat.


## Escales automàtiques a les portes — v35

Quan una porta dona a un carrer o terreny més baix, **es conserva la porta i s’hi afegeix una escala de pedra** per arribar fins a terra. L’escala s’alinea amb el portal, sigui central o lateral, i adapta el nombre de graons al desnivell. També funciona si el carrer és inclinat, empedrat, de terra o asfaltat. Des de la v36 només s’aplica a cases sobre terreny amb pendent, amb un salt màxim d’un nivell i fins a cinc graons.

Les escales apareixen automàticament a les cases i als portals de planta baixa dels edificis del jugador. No ocupen espais amb arbres, cases, mercats, altres edificis, patis, terrasses, ponts o altres escales automàtiques. Si no hi ha prou terreny lliure, o la façana dona al mar o al buit, es manté la finestra. Els testos sense suport continuen amagats.

No cal reconstruir les cases ni tornar a importar els dissenys. Les escales es recalculen en canviar el terreny, en desfer/refés i en obrir la vila; quan el carrer arriba a l’alçada de la porta, desapareixen. Formen part de l’adaptació visual de la façana i no es desen com un element independent. El format JSON continua sent el 29.


## Escales curtes només en terreny amb pendent — v36

Les escales automàtiques només apareixen quan **la casa està construïda sobre una cel·la de terreny amb pendent** i cal salvar **com a màxim un nivell** fins al carrer o terreny lliure del davant. Tenen entre dos i cinc graons i no s’allarguen per baixar grans murs de contenció.

Si la casa està sobre terreny pla elevat i la porta no té accés directe, o el salt supera un nivell encara que la casa sigui sobre un pendent, el portal es representa com una **finestra**. Les portes que ja tenen accés a la seva alçada es conserven. La mateixa norma s’aplica als portals dels edificis del jugador.

Les escales llargues de les viles anteriors desapareixen automàticament en obrir-les. No cal reconstruir les cases. Els testos sense suport continuen amagats. El format de desament continua sent el 29.


## Far i parc infantil — v37

**Far (F)** afegeix una torre blanca amb franges vermelles, porta orientable, finestres, galeria amb barana i llanterna lluminosa sota una coberta vermella. Ocupa **una cel·la** de terra ferma, carrer o plaça lliure. Prepara el terreny i tria **Entrada cap a** abans de col·locar-lo, per exemple en un promontori o al final d’un moll.

**Parc infantil (P)** té dues mides: **Petit · 2 × 1** i **Gran · 2 × 2**. El petit inclou un gronxador, un tobogan amb escala i un sorral amb petites joguines. El gran té dos gronxadors, tobogan, sorral, balancí i banc. Els dos tenen paviment de colors i una tanca baixa amb obertura d’entrada. Tria Sud, Est, Nord o Oest per girar tot el conjunt. A Est/Oest, el parc petit ocupa 1 × 2 cel·les sobre la quadrícula.

Prepara totes les cel·les amb **terra ferma, carrer o plaça a la mateixa alçada**. També es poden usar pendents amb les bases superiors anivellades: el conjunt recolza sobre fonaments horitzontals. El marc verd indica que hi cap; el vermell mostra que falta terreny o hi ha un obstacle. No es poden superposar a cases, arbres, altres edificis, patis, ponts ni terrasses.

**Esborra**, clic dret o Supr sobre qualsevol cel·la retira el far o parc sencer i conserva el terreny. Retira’l primer si vols canviar-ne la mida, orientació o terreny de sota. Tots dos admeten **Desfés / Refés**, desament automàtic i exportació/importació JSON (**format 30**), amb compatibilitat amb les viles anteriors. La geometria és a `landmark-geometry.js`.


## Entrades i negocis als pisos — v38

Quan una façana d’una **planta intermèdia ocupada** toca terra ferma o un carrer a la mateixa alçada, hi apareix una **porta automàtica**. La resta de façanes conserven les finestres i els balcons. No s’aplica a l’última planta ni als buits entre pisos i no genera escales llargues.

A **Casa → Posar o editar un negoci**, tria el negoci, la **planta** i la **façana** (nord, sud, est o oest), i clica la casa. «Segon pis (tercera planta)» correspon a la planta baixa més dos pisos. Cada façana accessible pot tenir el seu propi negoci i rètol; el negoci de la planta baixa es conserva.

Els bars i restaurants poden tenir terrassa i la fruiteria pot tenir prestatgeries al davant, sobre una casella plana i lliure a aquella alçada. Per canviar el rètol o retirar un negoci, selecciona la seva planta i façana. En retirar-lo, torna la porta automàtica.

Si modifiques el terreny i deixa d’arribar a la porta, el negoci queda ocult fins que restaures l’accés. Si esborres la planta del negoci, o es converteix en l’última planta en retirar els pisos superiors, el negoci d’aquella planta es retira. Pots recuperar-lo amb **Desfés**.

Desament automàtic, exportació/importació JSON en **format 31** i Desfés/Refés. Compatible amb viles dels formats 1–30.


## Hospital, escola i comissaria — v39

Tres eines noves a la barra:

- **Hospital**: petit de **2 × 2** cel·les, amb dues plantes, o gran de **3 × 2**, amb tres plantes. Façana clara, finestres blaves, entrada coberta, rètol i creu sanitària de color turquesa. El gran també té rètol d’urgències.
- **Escola**: petita de **2 × 2** o gran de **3 × 2** cel·les. Dues plantes, façana ocre, teulada de teula i pati al davant amb joc de colors i cistella; la gran hi afegeix un banc.
- **Comissaria**: **2 × 1** cel·les, dues plantes, rètol de policia, franja de quadres blaus i distintiu sobre la façana.

Selecciona l’eina, la mida (hospital o escola) i l’orientació de l’entrada. Prepara totes les cel·les sobre terra ferma, carrer o plaça lliure i a la mateixa alçada. La selecció mostra tota la superfície; en girar els edificis rectangulars, també es gira la superfície que ocupen.

L’esborrador retira l’edifici sencer des de qualsevol de les seves cel·les i conserva el terreny. No es poden superposar amb altres construccions, ponts, patis ni terrasses. Compatibles amb Desfés/Refés, desament automàtic i JSON **format 32**. Es continuen obrint les viles dels formats 1–31.


## Barra d’eines agrupada — v40

La barra té una única opció **Edificis** per a **Guingueta, Mercat, Església, Ajuntament, Hospital, Escola, Comissaria, Far i Parc infantil**. Prem **Edificis** i tria el tipus al desplegable del panell d’opcions. A sota apareixen la mida, l’orientació i les altres opcions que corresponguin.

Quan tornes a Edificis es recupera l’últim tipus seleccionat durant la sessió. Els accessos directes existents (G, 7, 8, 9, F i P) també obren el tipus corresponent dins del grup. **Casa** i **Els meus edificis**, per als dissenys de l’editor, mantenen el seu botó propi. Els nous equipaments del catàleg s’afegiran al desplegable sense ampliar la barra.

Es conserven totes les construccions i les viles desades, sense canviar el format JSON 32.


## Monuments: muralles — v41

Nova opció **Monuments** a la barra d’eines, separada de Casa i Edificis. Tria una peça al desplegable **Muralles**:

- **Mur de pedra** recte, amb blocs i merlets.
- **Mur amb torre central**, amb torre quadrada, espitlleres i terrat emmerletat.
- **Mur en angle de 90°**, per fer una cantonada.
- **Cantonada amb torre**, amb la torre a la unió dels dos braços.
- **Mur amb portal**, amb una arcada oberta que travessa el mur.

Cada peça ocupa **una cel·la** i té **quatre orientacions**. Els murs rectes uneixen est-oest a 0°/180° i nord-sud a 90°/270°. Les cantonades uneixen sud-est (0°), nord-est (90°), nord-oest (180°) o sud-oest (270°). Les direccions són les de la brúixola del mapa, encara que giris la càmera. El pas del portal és perpendicular al mur.

Prepara terra ferma, carrer o plaça lliure. Col·loca les peces en cel·les adjacents a la mateixa alçada i orienta els seus extrems perquè es trobin. Les peces arriben fins a la vora de la cel·la; les cantonades permeten tancar recintes. No s’ajusten automàticament a diferències d’alçada entre cel·les.

L’esborrador retira una peça i conserva el terreny i les peces veïnes. Cada peça es guarda amb la seva orientació i funciona amb Desfés/Refés. JSON **format 33**, compatible amb les viles dels formats 1–32. El límit conjunt d’edificis, equipaments i monuments és de 128 peces.


## Nova vila: costa 80% terra / 20% mar — v42

A **La meva vila → Comença una vila nova…** tens l’opció **Costa · 80% terra i 20% mar**. Tria primer la mida de la quadrícula (33 × 33, 49 × 49 o 65 × 65).

La terra ocupa aproximadament el **80% de les cel·les**, inclosa la platja, des del límit **oest** fins a una línia de costa suaument irregular. El **20% restant és mar a l’est**. La proporció s’arrodoneix a la cel·la més propera i es calcula dins la quadrícula construïble; el mar de fons continua més enllà del mapa.

Tot el terreny és lliure i pla, sense edificis ni arbres. La Costa Daurada té una franja de platja més ampla i suau; la Costa Brava, una franja més estreta i inclinada. La vista inicial s’allunya per mostrar la quadrícula sencera, amb l’oest a l’esquerra i l’est a la dreta.

Es mantenen les altres opcions de nova vila. La costa es desa al navegador i al JSON com qualsevol altra vila; el format 33 no canvia. Pots recuperar la vila anterior amb **Desfés**.


## Pont de pedra amb arcades — v43

A l’eina **Pont**, tria **Pont de pedra amb arcades** al selector **Tipus de pont**. L’opció **Pont actual** conserva el model anterior.

Marca la primera riba i després la segona, en la mateixa fila o columna i separades entre 2 i 16 cel·les. Els extrems han de ser terra ferma, carrer o plaça lliure, però **poden estar a alçades diferents**. El pas i els parapets s’inclinen entre les dues alçades, també quan un extrem és en un pendent.

El pont nou té paviment i parapets de pedra, pilars verticals amb bases amples i **arcades obertes entre els pilars**. Les arcades s’adapten al pendent i a l’espai disponible sota el pas. Cal deixar lliure el traçat; es permet terreny més baix a sota si hi ha prou separació.

Pots canviar el tipus de pont mentre marques els extrems. Es conserva la selecció del tipus per construir el següent pont. L’esborrador retira el pont sencer sense tocar les ribes; funciona amb Desfés/Refés.

El JSON **format 34** desa el tipus del pont. Les viles dels formats 1–33 continuen sent compatibles i els ponts anteriors conserven el model original.


## Pradera amb flors — v44

A **Terreny → Pradera amb flors** pots cobrir cel·les amb una superfície verda semblant a la gespa, amb floretes blanques, grogues i rosades disseminades. Les cel·les adjacents formen una superfície contínua; les flors mantenen la seva distribució en desar i tornar a obrir la vila.

La pradera conserva **l’alçada i el pendent** del terreny. També és un acabat disponible dins de **Terreny amb pendent → Acabat del terreny**. Les tiges queden dretes i recolzen sobre la superfície inclinada.

Funciona com a terra ferma per construir-hi i per als extrems dels ponts. Les flors s’amaguen als espais ocupats per edificis, terrasses i ponts. L’eina Terra ferma permet elevar-la; l’esborrador retira l’acabat verd i conserva la base i el pendent.

Compatible amb Desfés/Refés, desament automàtic i exportació/importació. El JSON **format 35** conserva la pradera; s’obren també les viles dels formats 1–34.


## Llibreria, pastisseria, ferreteria i perruqueria — v45

Quatre negocis nous a **Casa → Posar o editar un negoci**:

- **Llibreria:** rètol blau, prestatgeries de llibres de colors i llibres exposats amb la coberta a la vista.
- **Pastisseria:** tendal rosat, pastissos de diversos pisos, tartaletes i dolços als aparadors. La **Fleca** continua disponible com a negoci independent.
- **Ferreteria:** façana verda, panell amb martells i serra, pots de pintura i capses.
- **Perruqueria:** façana lila, miralls, cadires amb reposabraços, productes i distintiu de tisores a la porta.

Tria la planta, l’orientació i, si vols, el nom del rètol; clica una casa existent. Funcionen a la planta baixa i a les plantes intermèdies que tinguin terreny a la mateixa alçada davant de la façana. No ocupen una casella de terrassa.

Els rètols es poden canviar amb **Canvia només el rètol**. Els negocis es poden substituir o retirar i funcionen amb Desfés/Refés, desament automàtic i exportació/importació. El JSON **format 36** conserva els quatre nous tipus i continua obrint viles dels formats 1–35.


## Barberia, records catalans, verduleria i òptica — v46

A **Casa → Posar o editar un negoci** tens quatre opcions més:

- **Barberia:** aparadors amb miralls i cadires, i un **barber pole** a la façana. És un pal cilíndric blanc amb franges helicoidals vermelles i blaves i remats metàl·lics. La Perruqueria es manté com a negoci independent.
- **Records (souvenirs):** senyeres amb les quatre barres, figures amb barretina, porrons i peces de ceràmica als aparadors.
- **Verduleria:** caixes d’enciams, pastanagues, albergínies i porros. La Fruiteria continua disponible.
- **Òptica:** ulleres de diferents muntures exposades en prestatgeries i distintiu d’ulleres a la porta.

Tria la planta i la façana, escriu un nom de rètol opcional i clica la casa. Es poden posar a la planta baixa o a una planta intermèdia accessible des del terreny de davant. No necessiten cap cel·la de terrassa.

Tots quatre admeten canvi de rètol, substitució i retirada, Desfés/Refés i desament automàtic. El JSON **format 37** conserva els nous tipus; continua obrint les viles dels formats 1–36.


## Cementiri — v47

A **Edificis → Cementiri** pots escollir dues mides:

- **Petit · 2 × 1 cel·les:** quatre tombes, làpides, petites flors i dos xiprers.
- **Gran · 2 × 2 cel·les:** vuit tombes, dos xiprers i un conjunt de vuit nínxols al fons.

Tots dos tenen murs baixos de pedra, portal d’entrada amb rètol i camí central. Tria l’orientació de l’entrada: nord, sud, est o oest. En girar el petit, també gira la superfície que ocupa.

Prepara totes les cel·les amb terra ferma, pradera, carrer o plaça lliure i a la mateixa alçada. La selecció mostra tota la superfície. L’esborrador retira el cementiri sencer des de qualsevol cel·la i conserva el terreny.

Compatible amb Desfés/Refés i desament automàtic. El JSON **format 38** conserva els cementiris i obre les viles dels formats 1–37.


## Estació de bombers i deixalleria — v48

A **Edificis** trobaràs **Estació de bombers** i **Deixalleria**. Tots dos tenen dues mides: **2 × 2** i **3 × 2 cel·les**, amb l’entrada orientable cap al nord, sud, est o oest.

- **Estació de bombers:** façana de calç, rètol BOMBERS, cotxeres, torre per assecar mànegues i camió vermell amb escala i llums blaus. La mida gran té dues cotxeres i dos camions.
- **Deixalleria:** recinte tancat amb entrada central oberta, caseta de control, contenidors de paper, envasos, vidre i resta, i espai per a fusta. La mida gran afegeix orgànica, metall i recollida d’electrodomèstics.

Prepara totes les cel·les lliures amb terra ferma, pradera, carrer o plaça a la mateixa alçada. També admeten terreny elevat o amb pendent quan totes les bases de construcció coincideixen. En girar l’edifici gran, la superfície passa de 3 × 2 a 2 × 3. L’esborrador retira tot l’edifici des de qualsevol cel·la i conserva el terreny.

El desament automàtic, Desfés/Refés i els fitxers JSON conserven els dos edificis. El **format 39** obre també viles dels formats **1–38** i recupera el desament anterior del navegador.

Aquesta distribució inclou el joc complet i l’editor, amb tots els edificis, negocis, monuments, ponts i terrenys anteriors.


## Banderes de la Diada — v49

Prem **Banderes de la Diada**, sota **Mostra la quadrícula**, per posar o treure banderes a les cases. El botó queda ressaltat quan l’opció està activada. No depèn de la data: el pots utilitzar quan vulguis.

- Es decora aproximadament el **35 % de les cases amb balcons o finestres exposats**: una bandera per casa, repartint senyeres i estelades blaves amb estrella blanca. En viles molt petites, el nombre s’arrodoneix a banderes senceres.
- Es prioritzen els balcons; quan no n’hi ha, les banderes pengen dels ampits. S’eviten els portals, els aparadors, els pisos buits, les façanes tapades i les torretes de flors.
- La tria es manté en girar la càmera, activar i desactivar el botó, o recuperar la mateixa vila. Construir o eliminar cases pot ajustar el repartiment per mantenir la proporció.
- La roba es mou suaument amb el vent, ancorada per la vora superior. Si tens activada la reducció de moviment al sistema, no s’anima.
- Les banderes permanents dels ajuntaments continuen al seu lloc encara que apaguis l’opció de la Diada.

L’opció es desa amb la vila, tant al navegador com al JSON, i és compatible amb **Desfés/Refés**. Les viles noves i les dels formats antics comencen amb les banderes de la Diada desactivades. El **format 40** obre també els formats **1–39**.

El ZIP inclou el joc complet i l’editor, amb tots els edificis, negocis, monuments, ponts i terrenys de les versions anteriors.


## Configuració centralitzada — v50

Els límits editables són a **config.js**: plantes de les cases i de les cases amb pati, nivells del terreny, percentatge de cases amb banderes, proporció d’estelades, Diada inicial, mides de quadrícula, longitud dels ponts, elements per categoria i passos de Desfés.

Edita el fitxer, desa’l i recarrega amb **Ctrl+F5**. Els controls, les regles de construcció i la importació es mantenen sincronitzats. Consulta **CONFIGURACIO.md** per veure tots els camps i un exemple. Els valors inicials mantenen el comportament de la v49.

Si una configuració més restrictiva impedeix recuperar la vila del navegador, s’ofereix descarregar el desament original sense modificar-lo. Restaura uns límits compatibles per continuar. El JSON de les viles continua en format 40; config.js és global per a la còpia del joc.


## Pals de bandera — v51

A **Edificis** trobaràs tres opcions noves:

- **Pal amb senyera:** fons groc amb quatre barres vermelles.
- **Pal amb estelada:** senyera amb triangle blau i estrella blanca de cinc puntes.
- **Pal amb bandera negra:** fons negre, aspa blanca central i estrella blanca al costat de l’asta, seguint la imatge de referència.

Cada pal ocupa **una cel·la** i té peu de pedra, asta metàl·lica, corda i bandera que oneja. Tria **La bandera mira cap a** per orientar la cara de la bandera al nord, sud, est o oest. El dibuix es veu també pel revers.

Col·loca’l sobre terra ferma, pradera, carrer o plaça lliure. També admet terreny elevat o amb pendent, amb el peu recolzat horitzontalment. La bandera i el pal es mantenen dins de la cel·la reservada.

Són elements permanents: **el botó Banderes de la Diada no els amaga**, i els percentatges de banderes de config.js només afecten les cases. Els pals comparteixen el límit d’equipaments de limits.objectsPerCategory.

Pots desfer, refer o esborrar el conjunt conservant el terreny. Es desen al navegador i al **JSON format 41**, que també obre els formats **1–40** quan compleixen els límits configurats. Si tens activada la reducció de moviment al sistema, les banderes es mantenen quietes.

Aquest ZIP conté el joc complet, l’editor i config.js amb totes les funcionalitats anteriors.


## Castell medieval català — v52

A **Monuments → Castell medieval català** pots escollir **Petit · 2 × 2 cel·les** o **Gran · 3 × 3 cel·les**. Tria **Entrada cap a** per orientar el portal al nord, sud, est o oest.

Tots dos castells tenen murs de pedra amb carreus, merlets, quatre torres cantoneres amb espitlleres, una torre de l’homenatge més alta, portal amb arc i pati interior descobert. El castell gran té un pati més ampli amb un pou i un banc de pedra. Una senyera oneja sobre la torre de l’homenatge; es manté encara que desactivis les banderes de la Diada.

Prepara les quatre o nou cel·les de terra ferma, pradera, carrer o plaça, lliures i a la mateixa alçada. També es pot construir sobre terreny elevat i pendents amb totes les bases coincidents. La selecció ressalta el conjunt sencer. Esborrar des de qualsevol cel·la retira el castell i conserva el terreny.

Compatible amb **Desfés/Refés**, desament automàtic i **JSON format 42**, amb importació dels formats **1–41** segons els límits de config.js. Les muralles individuals continuen disponibles dins de Monuments.

Aquest ZIP inclou el joc complet, l’editor, config.js i totes les funcions anteriors.


## Mostrar o amagar els panells — v53

Al costat del botó de música **♫** hi ha un botó amb la icona de panells. Prem-lo per **amagar la paleta i la barra d’eines**; torna’l a prémer per mostrar-les. El botó continua accessible quan els panells estan amagats. Les opcions de construcció seleccionades es conserven.

Els dos panells es mostren **per defecte en obrir o recarregar el joc**. Aquesta visibilitat és de la sessió i no modifica el JSON de la vila ni ocupa passos de Desfés.

El compàs és més petit —112 píxels en la vista habitual d’ordinador i 88 en la vista habitual de mòbil— i manté els punts cardinals sincronitzats amb la rotació del mapa. A les pantalles estretes, els controls superiors es reparteixen en files per evitar que se superposin.

El ZIP continua incloent el joc complet, l’editor, config.js i totes les construccions. El format de les viles es manté en **42**.


## Xarcuteria, roba, banc i sabateria — v54

A **Casa → Posar o editar un negoci** trobaràs quatre opcions noves:

- **Xarcuteria:** fuets i embotits curats penjats, peces d’embotit i formatges als aparadors, amb tendal en tons càlids.
- **Botiga de roba:** maniquí amb vestit, peces de roba penjades i roba plegada a les prestatgeries.
- **Banc:** façana blava, porta central, finestra d’oficina amb escriptori i ordinador, i caixer automàtic amb pantalla, teclat i ranures al costat dret.
- **Sabateria:** prestatgeries amb sabates de diferents colors i botes.

Tria el negoci, la planta i l’orientació de la façana, i clica una casa. Aquests quatre negocis **no necessiten terrassa ni una cel·la addicional**. Es poden posar a la planta baixa o en una planta intermèdia amb terreny elevat accessible a la mateixa alçada. Les façanes tapades no mostren l’aparador.

Pots posar-hi un nom propi, canviar el tipus de negoci o retirar-lo conservant els pisos, el color i la teulada. També funcionen Desfés/Refés i el desament automàtic. El **JSON format 43** conserva els quatre negocis i obre les viles dels formats **1–42** segons els límits configurats.

Aquest ZIP és el joc complet, amb editor, config.js, castells, pals de bandera, botó per mostrar o amagar els panells i totes les funcions anteriors.


## Comerços neutres i jogueteria — v55

A **Casa → Posar o editar un negoci** hi ha tres comerços neutres: porta al centre amb dos aparadors, porta a l’esquerra amb un aparador ampli a la dreta, i porta a la dreta amb un aparador ampli a l’esquerra. Esquerra i dreta es miren des del carrer. Tots tres tenen els aparadors buits i el rètol **Comerç**, editable.

La **Jogueteria** té ossets, un trenet i blocs de construcció de colors. Els quatre negocis permeten orientar la façana als quatre costats, desfer i refer, canviar el rètol i posar-los als pisos intermedis amb accés des del terreny. Les escales curtes en desnivells s’alineen amb la porta escollida.

El **JSON format 44** conserva aquestes variants i importa els formats **1–43** segons els límits configurats.


## Negocis als edificis del jugador i colors per planta — v56

### Negocis als edificis dissenyats

Selecciona **Casa → Posar o editar un negoci**, tria el negoci, la planta i l’orientació de la façana, i clica la cel·la de l’edifici del jugador. Admet tots els negocis, els rètols personalitzats i les terrasses de bars i restaurants. La fruiteria manté les prestatgeries exteriors. Cal una façana exterior amb murs sòlids; les arcades obertes i les parets interiors no admeten negocis.

A més de la planta baixa, pots ocupar plantes intermèdies si hi ha terreny a la mateixa alçada davant de la façana. Cada combinació de cel·la, planta i orientació pot tenir un negoci independent. Per canviar el rètol o retirar-lo, escull la mateixa planta i façana. Els canvis afecten l’edifici col·locat, no la plantilla desada al catàleg.

### Colors per planta

A **Casa → Pintar una planta**, escull un color i assenyala la planta que vols pintar. També pots seleccionar explícitament la planta al desplegable. Funciona en cases habituals, cases amb pati i edificis del jugador; en aquests últims pinta tot el nivell de l’edifici, encara que ocupi diverses cel·les. Les altres plantes conserven el seu color.

En construir una casa, els pisos nous utilitzen el color seleccionat i conserven els colors dels pisos anteriors. Pintar no afegeix pisos ni canvia teulades o negocis. Re Pàg i Av Pàg seleccionen plantes amb el teclat, també als edificis del jugador.

Els colors i els negocis es conserven amb **Desfés/Refés**, el desament automàtic i l’exportació/importació de la vila. El **format 45** importa els formats **1–44**.


## Terreny rocós — v57

A **Terreny → Terreny rocós** pots posar una superfície de pedra grisa amb afloraments irregulars. També està disponible com a acabat de **Terreny amb pendent**. Conserva l’alçada i la inclinació existents, i les roques segueixen el pendent. A tocar del mar forma una costa de roca tant a la Costa Brava com a la Costa Daurada.

Funciona com a terra ferma: pots elevar-lo amb **Terra ferma**, construir-hi, plantar-hi, pavimentar-hi o utilitzar-lo com a riba d’un pont. Els afloraments es retiren sota els edificis, les terrasses i els ponts perquè no travessin els elements. **Esborra** retira primer l’acabat rocós, conservant la base de terra.

Es conserva amb Desfés/Refés i el desament automàtic o JSON. El **format 46** importa els formats **1–45**.


## Pals de bandera adaptats al terreny — v58

Els tres pals de bandera conserven l’acabat de la casella: empedrat, terra, asfalt, pradera, roca o plaça. Als pendents, el pal es manté vertical i el petit pedestal recolza a l’alçada real del punt on es col·loca, sense aplanar tota la casella. Les floretes i roques es mantenen al voltant, deixant lliure únicament el pedestal.

S’aplica també als pals de les viles que ja tenies desades. El format de vila continua sent el **46**.


## Hotels, hostal i pensió — v59

Dins d’**Edificis** trobaràs quatre allotjaments:

- **Hotel de 3 estrelles:** 2 × 2 cel·les, tres plantes amb balcons i terrat amb pèrgola. Rètol HOTEL amb tres estrelles.
- **Hotel de 5 estrelles:** 3 × 3 cel·les, quatre plantes amb balcons, piscina amb escala, gandules, para-sols i jardí amb arbres, flors i camí fins a recepció. Rètol HOTEL amb cinc estrelles.
- **Hostal:** 2 × 1 cel·les, dues plantes amb porticons, teulada de teula i flors.
- **Pensió:** una cel·la, dues plantes i façana familiar amb porticons i rètol PENSIÓ.

Prepara totes les cel·les amb terra ferma o un acabat compatible, lliures i a la mateixa alçada. Tria l’orientació de l’entrada (sud, est, nord o oest). El conjunt, inclòs el jardí, gira amb l’edifici. **Esborra** sobre qualsevol de les seves cel·les retira tot l’allotjament i conserva el terreny.

Admeten Desfés/Refés, desament automàtic i exportació/importació JSON. El **format 47** importa els formats **1–46**.


## Museu i monestir — v60

Dins d’**Edificis** trobaràs:

- **Museu:** 2 × 2 cel·les, dues plantes, entrada porticada amb quatre columnes, rètol MUSEU, galeries amb finestres i dues peces exposades al davant.
- **Monestir:** 3 × 3 cel·les, una interpretació estilitzada inspirada en Poblet, amb església de pedra, rosassa, campanar i claustre obert. Les galeries tenen arcades obertes i envolten un jardí amb camins i pou.

Tria l’orientació de l’entrada i prepara totes les cel·les lliures a la mateixa alçada. **Esborra** sobre qualsevol cel·la retira tot el conjunt i conserva el terreny. Admeten Desfés/Refés, desament automàtic i exportació/importació. El **format 48** importa els formats **1–47**.


## Rètols dels edificis — v61

Ves a **Edificis → Canviar un rètol existent**, escriu el nom (màxim 24 caràcters, amb accents) i clica qualsevol cel·la de l’edifici. Deixa el camp buit i torna-hi a clicar per recuperar el rètol original.

Funciona amb els hotels, hostals, pensions, museus, monestirs, hospitals, escoles, comissaries, estacions de bombers, deixalleries, cementiris, mercats, ajuntaments i guinguetes. Cada edifici conserva el seu nom independentment dels altres. Canvia el rètol principal; les estrelles dels hotels i les indicacions secundàries, com URGÈNCIES o les etiquetes dels contenidors, es mantenen. Els elements sense rètol no es modifiquen.

Els noms es conserven amb Desfés/Refés, desament automàtic i exportació/importació de la vila. El **format 49** importa els formats **1–48**.


## Morera, freixe, mimosa i xiprer — v62

Dins d’**Arbres** hi ha quatre espècies noves:

- **Morera (Morus alba):** baixa i de capçada ampla, sense superar l’alçada d’un pis (0,86 unitats del joc des del terreny).
- **Freixe (Fraxinus):** tronc esvelt, branques obertes i capçada verda.
- **Mimosa (Acacia baileyana):** fullatge gris verdós i grups de flors grogues.
- **Xiprer (Cupressus sempervirens):** alt, estret i acabat en punta, de verd fosc.

Escull l’espècie i clica per plantar-la o substituir un arbre existent. S’adapten a l’alçada real dels terrenys elevats i dels pendents. Es conserven amb Desfés/Refés, el desament automàtic i l’exportació/importació. El **format 50** importa els formats **1–49**.

## Moreres més altes — v63

Les moreres tenen el tronc més llarg i la capçada més elevada i plana, mantenint l’amplada per fer ombra i el límit d’un pis. El canvi també s’aplica automàticament a les moreres que ja tens plantades. Es manté el format de vila 50.


## Pintar terrenys sense clics repetits — v64

Amb **Terreny** seleccionat, mantén **Alt** i arrossega el ratolí amb el **botó esquerre premut**. Es pinta el tipus de terreny escollit al llarg de la passada, incloent-hi les caselles intermèdies si mous el ratolí de pressa. Cada casella es modifica una sola vegada per passada: tornar-hi a passar no torna a elevar-la. Per pujar un altre nivell, inicia una passada nova.

Funciona amb terra ferma, platja, pradera, terreny rocós, pendents (amb la direcció i l’acabat seleccionats) i carrers empedrats, de terra i asfaltats. S’apliquen les mateixes regles i proteccions que amb un clic. Deixar anar Alt o el botó atura la passada. **Desfés/Refés** actua sobre tota la passada. El desament és automàtic. Majúscules + arrossegar continua desplaçant la vista. Es manté el format de vila 50.


## Parlament i casernes militars — v65

Dins d’**Edificis** hi ha tres opcions noves:

- **Parlament:** 3 × 2 cel·les, amb dues plantes de pedra, entrada porticada, balcó i senyera que oneja a la façana.
- **Caserna militar amb senyera:** 3 × 3 cel·les, amb allotjaments de dues plantes, ales laterals, pati obert, tanca i garita. La senyera oneja al costat de l’entrada.
- **Caserna militar amb estelada:** el mateix recinte amb estelada a l’entrada.

Tria l’orientació de l’entrada i prepara tota la base sobre terra ferma lliure a la mateixa alçada. Les banderes d’aquests edificis són permanents, independents del botó de banderes de les cases. Pots canviar el rètol amb **Edificis → Canviar un rètol existent**. Esborrar qualsevol cel·la retira tot l’edifici i conserva el terreny. Desfés/Refés i els desaments conserven la versió de bandera escollida. El **format 51** importa els formats **1–50**.


## Parlament de 4 × 4 i edifici institucional — v66

**Edificis → Parlament** ara ocupa **4 × 4 cel·les**. La planta baixa té una porxada amb set arcades obertes de banda a banda de la façana. Al damunt hi ha un balcó de la mateixa amplada, amb barana frontal i lateral, porta central i el pal de la senyera al centre.

El model anterior de **3 × 2** continua disponible a **Edificis → Edifici institucional**, amb rètol editable per dedicar-lo a altres institucions. En recuperar una vila anterior, els parlaments petits es conserven en el mateix lloc com a edificis institucionals: mantenen la mida, l’orientació, la bandera i el rètol. No s’amplien damunt de les construccions veïnes. Per col·locar el Parlament nou, prepara 16 cel·les lliures a la mateixa alçada.

Tots dos admeten les quatre orientacions, rètols editables, Desfés/Refés i desament automàtic. El **format 52** importa els formats **1–51**.


## Controls adaptats a PC i mòbil — v67

- **La meva vila** inclou la regió (Costa Brava o Costa Daurada), la quadrícula i les banderes de la Diada. Al mòbil s’obre amb la icona de poble i desapareix el selector de regió de la capçalera.
- A la dreta, els controls de càmera, Desfés/Refés i les estadístiques formen una columna, en aquest ordre, sota el compàs. Si la pantalla és molt baixa, la columna es pot desplaçar verticalment.
- Les **opcions de construcció** estan incrustades al marge esquerre. Amaga-les amb la capçalera o lliscant-hi cap a l’esquerra; recupera-les amb la pestanya Opcions o lliscant-hi cap a la dreta.
- Les **eines** estan incrustades al marge inferior. Amaga-les amb la capçalera o lliscant-hi cap avall; recupera-les amb la pestanya Eines o lliscant-hi cap amunt. La fila d’eines es desplaça horitzontalment quan no hi caben totes.
- Els panells es controlen per separat i es recorda la visibilitat en aquest navegador. La primera vegada, al mòbil les opcions comencen plegades per deixar espai al mapa. El botó al costat de la música continua mostrant o amagant tots dos panells.
- Al mòbil, el compàs és més petit i mostra **N, S, E i O**, que continuen seguint el gir del mapa.

Els gestos per obrir o tancar panells es fan sobre les seves capçaleres i pestanyes; arrossegar el mapa continua movent la càmera. Es manté el format de vila 52.


## Arbres sobre el terreny existent — v68

Plantar un arbre conserva la **pradera**, el **terreny rocós** o el **carrer empedrat, de terra o asfaltat** de la casella. Un petit parterre de terra amb vorada de pedra envolta el tronc. Sobre **terra ferma** no es posa parterre. Funciona amb totes les espècies, inclosa la parra, que té el parterre al peu de la tija.

El terreny i la vorada segueixen els pendents. En terrenys inclinats, la pèrgola de la parra té peus individuals perquè es continuï veient el paviment. Canviar d’espècie conserva l’acabat; esborrar l’arbre retira també el parterre i recupera el terreny de sota, a la mateixa alçada.

Es conserva amb Desfés/Refés, desament automàtic i JSON. Els arbres de viles anteriors sense informació del terreny continuen sobre terra ferma. El **format 53** importa els formats **1–52**.


## Navegar sense construir — v69

La primera opció de les eines és **Navega**, amb una icona de fletxa i la drecera **N**. Mentre està seleccionada, els clics esquerre i dret, els tocs al mòbil i les tecles Retorn, Espai, Supr i Retrocés no insereixen ni eliminen elements. El marc de construcció queda ocult.

Es mantenen els gestos de càmera: arrossegar per girar, Majúscules + arrossegar per desplaçar, roda per apropar i pinça amb dos dits al mòbil. Tria una altra eina per tornar a construir o esborrar. Es manté el format de vila 53.

## v70 · Obertura automàtica de les opcions

Seleccionar una eina amb opcions obre el panell esquerre si està amagat, tant al PC com al mòbil i també amb les dreceres de teclat. Tornar a prémer la mateixa eina també el recupera. Navega, Plaça, Escales i Esborra no canvien la visibilitat del panell. Es conserven totes les funcions de la v69 i el format de vila 53.

## v71 · Llum del dia i avís de noves versions

«Llum del dia» és ara a «La meva vila», tant al PC com al mòbil, independentment dels panells de construcció.

El joc comprova la versió en obrir-lo, cada minut mentre és visible i en tornar a la pestanya (amb un mínim de 30 segons entre comprovacions). Si hi ha una versió superior al mateix servidor, mostra «Actualitza ara» i «Més tard». L’actualització desa primer la vila i recarrega la pàgina; si no pot desar-la, s’atura i demana exportar una còpia JSON. «Més tard» amaga l’avís per a aquella versió durant la sessió, però manté l’opció d’actualitzar a «La meva vila». No hi ha recàrregues automàtiques. Sense connexió, el joc continua funcionant.

Cal carregar aquesta versió una primera vegada per rebre els avisos futurs. Una còpia local comprova el seu servidor local: només detecta novetats quan s’hi substitueixen els fitxers; no consulta la publicació d’Internet.

Per publicar una actualització, incrementa el número de `version.json` i el valor de la metaetiqueta `game-version` a `index.html` al mateix número, i actualitza el paràmetre `v` dels recursos d’entrada. Publica tots els fitxers conjuntament. `_headers` demana revalidar els recursos al servidor Sites; el servidor local ja ho fa. El format de vila continua sent el 53 i es conserven totes les funcions de la v70.

## v72 · Ordre de les eines

Navega, Terreny, Casa, Edificis, Monuments, Arbres, Plaça, Escales, Ponts, Els meus edificis i Esborra. Les dreceres de teclat es mantenen. Inclou totes les funcions de la v71; format de vila 53.

## v73 · Colors del joc a l’editor

Els selectors de color dels murs i de la coberta incorporen sis botons: Calç, Sorra, Terracota, Blau marí, Oliva i Rosa. Els botons apliquen el color a la cel·la seleccionada i actualitzen el selector i la vista prèvia. El selector lliure continua disponible. «Aplica a tota aquesta planta» permet estendre el color i els altres elements de la cel·la. Els botons dels murs es desactiven a les cel·les sense planta intermèdia. Inclou totes les funcions de la v72; format de vila 53.

## v74 · Escales amb ferro, golfes i versió visible

Les escales de l’eina Escales incorporen baranes de ferro als dos costats: muntants a cada graó i passamans inclinats. Els accessos queden oberts i les baranes giren amb l’escala. També apareixen a les escales de les viles existents.

A Casa → Acabat de la casa pots escollir «Golfes i mig terrat amb estenedor». Una meitat té golfes amb teulada de teula, finestres i una porta al terrat; l’altra és un terrat obert amb barana de ferro i un estenedor de dos fils amb roba i pinces. «Terrat cap a» permet escollir Est, Nord, Oest o Sud. «Només gira la teulada» aplica aquesta orientació sense afegir pisos. També és disponible a l’editor, amb els colors del disseny.

«La meva vila» mostra el número de versió del joc, vinculat a la mateixa versió que comprova l’avís d’actualitzacions. Aquesta versió manté totes les funcions de la v73. El format de vila és el 54, amb lectura dels formats 1–53; les golfes no afegeixen una planta habitable al recompte. Els dissenys mantenen el format 2 amb el nou tipus de coberta `attic`.

## v75 · Escales amb baranes o sense

A Escales, tria «Sense baranes» (opció inicial) o «Amb baranes de ferro». Canviar el tipus d’una escala existent en conserva l’orientació. Clicar amb el mateix tipus la gira. Les escales dels fitxers de la v74 (format 54) conserven el ferro; les dels formats anteriors recuperen l’aspecte sense baranes. El tipus es desa al JSON i admet desfer i refer. Inclou totes les funcions de la v74; format de vila 55.

## v76 · Clonar cases, terrenys i estètica

La nova eina **Clona** ofereix cinc accions:

- **Una casa:** clica una casa normal o un edifici del jugador i després el lloc on vols la còpia. Inclou el conjunt de la casa amb pati, els negocis i la base de les terrasses quan n’hi ha.
- **Un grup de cases:** marca dues cantonades i enganxa el conjunt. Els edificis del jugador han de quedar sencers dins de la selecció. La base i l’alçada dels terrenys copiats es conserven.
- **Un grup de terrenys:** marca dues cantonades. Copia el terreny, el pendent, l’alçada i l’acabat que consta a la casella, sense les cases ni els arbres. Sota una casa normal el terreny es desa com a terra ferma; el joc no conserva l’acabat anterior a la construcció. Les caselles de mar no substitueixen el destí.
- **Només l’estètica:** copia d’una casa normal els portals, finestres, balcons, colors per planta i coberta. Aplica-ho a altres cases normals sense canviar-ne l’alçada, els buits o els negocis. Si la destinació té més plantes, les plantes addicionals prenen l’últim color de la casa d’origen. Les façanes continuen adaptant-se als veïns i a l’accés des del terreny.
- **Una casa a l’editor:** crea un disseny independent a la col·lecció i l’obre a l’editor. Les plantes tenen controls individuals per conservar-ne els colors i les obertures. Els pisos buits es representen amb arcades. La conversió utilitza els elements editables de l’editor; no és una còpia de la malla 3D. El pati, els negocis i la decoració exterior de la casa continuen al joc i no s’incorporen al disseny arquitectònic. Un edifici del jugador reutilitza el seu disseny com a còpia nova.

La cantonada nord-oest del conjunt copiat és l’ancoratge de destinació. El marc verd indica una zona seleccionada o un destí lliure; el vermell indica un destí ocupat o fora del mapa. Es pot enganxar diverses vegades. **Esc**, clic dret o **Nova selecció** permeten tornar a triar l’origen. Les còpies són independents i no alteren l’original. No se substitueixen construccions existents. Si una còpia no compleix les regles de la vila, no es col·loca cap fragment. **Desfés** retira la còpia sencera.

El format de vila és el **56** i el dels dissenys és el **3**, amb importació dels formats anteriors. L’estètica de les cases clonades es conserva en desar i recuperar la vila, independentment de la ubicació. Aquesta versió inclou totes les funcions de la v75.

## v77 · Terrenys agrícoles

A **Terreny → Terrenys agrícoles** hi ha cinc acabats nous:

- **Vinya:** fileres de ceps amb fulles, raïms i pals amb fils.
- **Oliverar:** petites oliveres ordenades, amb capçades de verd grisós i olives.
- **Cereals:** fileres d’espigues daurades.
- **Fruiters:** arbres amb fruita vermella i taronja.
- **Horta:** bancals amb tomaqueres, cols i pastanagues.

Cada acabat ocupa una cel·la; ajunta’n diverses per formar un camp. Conserva el nivell i el pendent existents. També es pot escollir com a acabat del terreny amb pendent, pintar mantenint Alt i arrossegant, i copiar amb Clona. Terra ferma l’eleva; Esborra retira el conreu i deixa terra ferma. Es pot construir i pavimentar com als altres terrenys. Els conreus es retiren de l’espai reservat als edificis, ponts i terrasses. Si plantes un arbre de l’eina Arbres, se’n conserva el terreny agrícola al voltant del parterre, i es recupera en retirar l’arbre.

Les plantes i els arbres dels conreus són decoració del terreny: no es compten ni s’esborren individualment com els arbres de l’eina Arbres. Es guarden al navegador i al JSON. El format de vila és el **57**, compatible amb els formats anteriors; es mantenen totes les funcions de la v76, inclosa l’eina Clona. Els dissenys continuen en format 3.


## Masia catalana — v78

A **Edificis → Masia catalana**, escull una de les tres mides:

- **1 × 1:** masia compacta de pedra, amb planta baixa, pis i golfes.
- **1 × 2:** masia allargada, amb finestres als laterals.
- **2 × 2:** masia gran, amb porxada de teula davant de l’entrada.

Totes tenen portal adovellat, porticons de fusta, teulada a dues aigües i xemeneia. La façana es pot orientar als quatre punts cardinals; girar la masia allargada també gira la seva ocupació. El marc de construcció mostra l’espai necessari.

Cal tenir totes les cel·les lliures i a la mateixa alçada. Es poden col·locar sobre terrenys agrícoles, que es conserven a sota. **Edificis → Canviar un rètol existent** permet posar nom a la masia. Esborra sobre qualsevol cel·la retira tot l’edifici i conserva el terreny; Desfés permet recuperar-lo.

Es mantenen totes les funcions de la v77. Format de vila **58**, amb importació dels formats 1–57, i dissenys de l’editor en format **3**.


## Balcons individuals i masies sense rètol — v79

Les masies ja no tenen placa ni text «MASIA» per defecte. Es conserven els noms personalitzats: es pot afegir un nom des d’**Edificis → Canviar un rètol existent** i deixar-lo buit per retirar la placa.

Les façanes dels pisos de les cases incorporen quatre composicions noves:

- **Balcó d’una porta:** un balcó individual centrat.
- **Balcó esquerre i finestra dreta.**
- **Finestra esquerra i balcó dret.**
- **Dos balcons d’una porta:** dues plataformes separades amb baranes pròpies.

Esquerra i dreta s’entenen mirant la façana des de fora. Els nous balcons tenen una porta alta d’una sola fulla i baranes de ferro; la finestra del costat conserva l’ampit. Es mantenen el balcó ample i les finestres existents.

A les cases del joc, les composicions varien automàticament per façana i pis i es conserven en desar, recarregar o clonar l’estètica. A l’editor, es poden escollir i combinar al selector de cada façana. Clonar una casa cap a l’editor conserva aquestes composicions en les plantes editables. Els accessos i negocis que donen a terreny de la mateixa alçada continuen tenint prioritat sobre les composicions dels pisos.

Format de vila **59**, compatible amb els formats 1–58. Dissenys i col·leccions de l’editor en format **4**, amb lectura dels formats 1–3. Es mantenen totes les funcions de la v78.


## Pastura de cabres — v80

A **Terreny → Terrenys agrícoles → Pastura de cabres** trobaràs un terreny d’herba amb petits arbustos i un ramat animat.

- Cada zona de pastura connectada té **dues o tres cabres**. Afegir-hi cel·les amplia l’espai disponible per al ramat.
- Les cabres caminen, mouen les potes i fan pauses. Poden passar entre cel·les adjacents, mantenint-se dins de la pastura i evitant els arbustos i les altres cabres del ramat.
- Els arbustos tenen posicions variades dins de cada cel·la. Aquesta variació és estable: es conserva en recarregar la vila.
- El terreny conserva l’alçada i el pendent. Les cabres només travessen vores que coincideixen en alçada; un salt de terreny separa les pastures.
- Els edificis, patis, ponts i terrasses ocupats queden fora de la zona de pastura. Plantar un arbre en una cel·la conserva l’herba però retira aquella cel·la del recorregut de les cabres; esborrar l’arbre la recupera.
- Funciona amb pintura de terreny amb Alt, clonació, desfer i importació/exportació JSON. Les posicions instantànies de les cabres no es guarden: reprenen el passeig en obrir la vila. Es respecta la preferència de moviment reduït del dispositiu.

Es mantenen totes les funcions de la v79. Format de vila **60**, compatible amb els formats 1–59; dissenys de l’editor en format **4**.


## Pastura d’ovelles — v81

A **Terreny → Terrenys agrícoles → Pastura d’ovelles**, col·loca una pastura d’herba tendra, verda i baixa, amb petits brins en posicions variades.

Cada zona de pastura d’ovelles connectada té **dues o tres ovelles**, amb cos arrodonit de llana, cara curta i cua baixa. Caminen amb moviment de potes, fan pauses i es mouen entre les cel·les adjacents del mateix tipus. Les ovelles es mantenen a les pastures d’ovelles i les cabres a les de cabres.

Com amb les cabres, les vores han de coincidir en alçada per poder passar-hi. Edificis, ponts, patis i terrasses ocupats interrompen el recorregut. Es conserven el suport de pendents, la pintura amb Alt, la clonació de terrenys, desfer i la importació/exportació JSON. Les posicions instantànies dels animals no es guarden; reprenen el passeig en obrir la vila. Es respecta la preferència de moviment reduït del dispositiu.

Es mantenen totes les funcions de la v80. Format de vila **61**, compatible amb els formats 1–60; dissenys de l’editor en format **4**.


## Pastura de vaques Bruna dels Pirineus — v82

A **Terreny → Terrenys agrícoles → Pastura de vaques · Bruna dels Pirineus**, col·loca una pastura d’herba tendra com la de les ovelles, amb petites bales rectangulars de palla als marges. La posició de les bales varia entre cel·les i es conserva en recarregar.

Cada zona de pastura de vaques connectada té **dues o tres vaques**. El model estilitzat té cos robust, pelatge bru de diferents tonalitats, morro fosc amb contorn clar, banyes clares amb puntes fosques i cua llarga. Referència de la capa bruna: [Federació de la Raça Bruna dels Pirineus](https://www.brunadelspirineus.org/raca-bruna).

Les vaques caminen amb moviment de potes, fan pauses i passen entre pastures de vaques adjacents. Esquiven les bales, incloses les de les cel·les veïnes, i mantenen separació respecte de les altres vaques. Les pastures d’ovelles i de cabres conserven els seus ramats propis.

Es mantenen les regles d’accés: vores a la mateixa alçada, edificis i espais ocupats fora del recorregut. Admet pintura amb Alt, clonació de terreny, desfer, desament i importació/exportació JSON. Les posicions instantànies dels animals no es guarden; reprenen el passeig en obrir la vila. Es respecta la preferència de moviment reduït del dispositiu.

Es mantenen totes les funcions de la v81. Format de vila **62**, compatible amb els formats 1–61; dissenys de l’editor en format **4**.


## Activar o aturar els ramats — v83

A **La meva vila → Moviment dels ramats**, pots activar o aturar alhora les cabres, ovelles i vaques. El botó indica si el moviment està activat o aturat. Aturar-lo manté els animals visibles al punt on són; tornar-lo a activar reprèn el passeig.

La preferència es desa en aquest navegador i es conserva en recarregar, importar una vila o començar-ne una de nova. És una preferència del navegador, independent del JSON de la vila. Si encara no l’has escollida, el moviment està activat tret que el dispositiu tingui activada la preferència de moviment reduït; el botó permet canviar-ho explícitament.

Aquesta opció controla només els ramats. Les banderes i les barques mantenen el seu funcionament. Es mantenen totes les funcions de la v82; format de vila **62** i dissenys **4**.


## Gallines i oques; carpeta de descàrregues — v84

A **Terreny → Terrenys agrícoles → Gallines i oques**, col·loca un terreny de terra trepitjada, palla disseminada i petits flocs d’herba. Cada cel·la incorpora un galliner de fusta amb rampa d’entrada, teulada i ponedor lateral.

Cada zona connectada té **quatre o cinc gallines i una o dues oques**. Les gallines tenen plomes de colors variats i cresta vermella; les oques són blanques, de coll llarg i bec ataronjat. Comparteixen el recorregut i poden passar entre els terrenys de gallines i oques adjacents, evitant els galliners i les altres aus. Es conserven les regles d’alçada, obstacles i zones separades dels altres ramats.

**La meva vila → Moviment dels ramats** també activa o atura gallines i oques, i recorda la preferència. El terreny admet pendents, pintura amb Alt, clonació, desfer i desament JSON. Les posicions instantànies dels animals no es guarden.

El botó **Descarrega el joc i el codi** apunta ara a **descarregues/vila-mediterrania-v84-gallines-oques.zip**. També hi ha una còpia amb el nom estable **descarregues/vila-mediterrania.zip** al servidor. Els ZIP no s’inclouen dins d’altres ZIP. En una instal·lació pròpia, posa el ZIP descarregable en aquesta subcarpeta.

Es mantenen totes les funcions de la v83. Format de vila **63**, compatible amb els formats 1–62; dissenys de l’editor en format **4**.


## Ermita romànica catalana — v85

A **Edificis → Ermita romànica**, escull **1 × 1** o **1 × 2 cel·les** i l’orientació de l’entrada. La mida allargada gira la seva ocupació amb la façana.

Les dues variants tenen una nau de pedra, absis arrodonit, finestres estretes amb arc, portal de mig punt i teulada a dues aigües. La petita té una espadanya amb una campana; l’allargada en té dues. Els arcs del campanar són oberts i les campanes són visibles a dins.

Cal preparar tot l’espai lliure a la mateixa alçada. Es conserva el terreny de sota, inclosos els terrenys agrícoles. Esborrar sobre qualsevol cel·la retira l’ermita sencera; Desfés la recupera. S’inclou al desament del navegador i al JSON de la vila.

El ZIP complet és a **descarregues/vila-mediterrania-v85-ermita-romanica.zip**. Es mantenen totes les funcions de la v84. Format de vila **64**, compatible amb els formats 1–63; dissenys de l’editor en format **4**.


## Baranes als terrenys — v86

A **Terreny → Baranes de terreny**, escull **Ferro**, **Fusta** o **Pedra**, i el costat: **Nord**, **Sud**, **Est**, **Oest**, **Nord + Oest**, **Nord + Est**, **Est + Sud** o **Sud + Oest**. Les direccions corresponen al compàs, encara que giris la càmera.

Clica una cel·la existent per aplicar-hi la configuració seleccionada. Substitueix totes les baranes anteriors de la cel·la; **Sense baranes · retirar-les** les elimina. També funciona amb **Alt + arrossegar**, amb una sola operació de desfer per passada. El terreny i les construccions es conserven.

Les baranes segueixen les vores, l’alçada i els pendents del terreny, incloses les platges. Els trams compartits a la mateixa alçada no es dupliquen. Es desen al JSON, es recuperen amb Desfés i es copien amb la clonació de terrenys. Les cabres, ovelles, vaques, gallines i oques no travessen els costats tancats.

El ZIP complet és a **descarregues/vila-mediterrania-v86-baranes-terreny.zip**. Es mantenen totes les funcions de la v85. Format de vila **65**, compatible amb els formats 1–64; dissenys de l’editor en format **4**.


## Baranes en costats oposats — v87

A **Terreny → Baranes de terreny → Costats de la cel·la** s’afegeixen **Nord + Sud** i **Est + Oest**. Es poden utilitzar amb ferro, fusta o pedra, també en terrenys amb pendent. Es mantenen les vuit opcions anteriors i el desament, la clonació i el desfer.

El ZIP complet és a **descarregues/vila-mediterrania-v87-baranes-oposades.zip**. Format de vila **65**; dissenys de l’editor **4**.


## Teatre, Cinema i Biblioteca — v88

Tres nous equipaments dins d’**Edificis**, cadascun de **2 × 2 cel·les**, amb entrada orientable als quatre costats:

- **Teatre**: façana clàssica, porxada de columnes, balcó amb barana de ferro, cartells d’espectacles i teulada de teula.
- **Cinema**: marquesina amb bombetes decoratives, taquilla central, cartelleres i un fris de pel·lícula.
- **Biblioteca**: finestrals amb prestatgeries i llibres de colors, bancs a l’entrada i una claraboia al terrat.

Prepara les quatre cel·les lliures a la mateixa alçada. El conjunt respecta l’elevació del terreny i es retira sencer en esborrar qualsevol cel·la, conservant el terra. S’inclou al desament, l’exportació JSON i l’historial. A **Edificis → Canviar un rètol existent**, escriu el nom i clica l’edifici; un nom buit recupera el rètol original.

El ZIP complet és a **descarregues/vila-mediterrania-v88-teatre-cinema-biblioteca.zip**. Inclou totes les funcions de la v87. Format de vila **66**, compatible amb els formats 1–65; dissenys de l’editor **4**.


## Integració dels mods personals — v89

La capa de mods de l’usuari queda unificada amb la versió 88. Es conserva íntegra la carpeta **mods-personals/**, inclòs el **Molí de vent** actiu a **Edificis**, d’una cel·la i orientable. El Teatre, el Cinema i la Biblioteca continuen disponibles.

Es completen les connexions dels terrenys i negocis personals, es reforcen les comprovacions d’identificadors, es conserven les rotacions de les peces dels aparadors i es corregeix el selector de mides perquè mantingui la selecció. Consulta **GUIA-MODS.md**; a més del comprovador original, pots executar **node check-mods.mjs** per comprovar la integració real sense modificar el contingut personal.

API dels mods **1**, format de vila **66** i dissenys de l’editor **4**. El JSON no inclou el codi dels mods: conserva’n els fitxers per importar les viles que els utilitzen. El ZIP complet és **descarregues/vila-mediterrania-v89-mods-personals.zip**.
