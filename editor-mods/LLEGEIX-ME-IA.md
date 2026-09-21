# Generar mods des de fotografies

El taller pot enviar unes fotografies a un model d'IA i tornar-te un mod del joc.
Suporta **Claude** i **OpenAI**.

## Què n'has d'esperar

El volum general l'encerta: la planta, el nombre de plantes, el tipus de coberta,
si hi ha campanar o porxada. Les proporcions fines i la posició exacta de les
obertures, no sempre.

El resultat és **un primer esbós que després acabes a mà**, no un edifici
enllestit. Per això el mod entra directament a l'editor: el retoques amb les
eines de sempre i es pot desfer amb Ctrl+Z.

Té sentit perquè no li demanes que modeli en 3D lliure, sinó que escrigui en un
llenguatge molt petit —vint formes, una crida amb onze arguments, una cel·la
d'1,3— que s'assembla més a escriure codi que a esculpir.

## Instal·lació

Tres fitxers nous a l'arrel del joc i quatre a `editor-mods/`. Ja hi són si has
descomprimit el ZIP sencer.

A `server.mjs` hi ha dues línies noves: l'`import` de `ai-proxy.mjs` i
l'embolcall `withAiProxy(...)` del gestor.

## La clau de l'API

Hi ha dues maneres, i pots tenir-les totes dues alhora.

### Passarel·la al servidor — per a tu

La clau viu en una variable d'entorn i **no arriba mai al navegador**. És
l'opció recomanada per a la teva còpia del joc.

```sh
# Windows, PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-..."
node server.mjs

# macOS i Linux
ANTHROPIC_API_KEY="sk-ant-..." node server.mjs
```

També s'accepta `OPENAI_API_KEY`, i pots posar-hi totes dues. En arrencar, el
servidor et diu quines claus ha trobat. El panell ho detecta i amaga el camp de
la clau.

Per no haver d'escriure-la cada vegada, posa-la a `Inicia-Windows.bat`:

```bat
set ANTHROPIC_API_KEY=sk-ant-...
node server.mjs
```

### Clau al navegador — per als jugadors

Si el servidor no té clau, el panell demana la seva. Es desa al `localStorage`
d'aquell navegador i la crida va directament al proveïdor.

**Qualsevol que obri les eines de desenvolupament d'aquella pàgina la pot
llegir.** El panell ho avisa. Si l'has de fer servir, fes servir una clau amb
límit de despesa.

## Com s'utilitza

1. Obre `/editor-mods/` i ves al panell **Genera des de fotografies**.
2. Arrossega-hi entre una i quatre fotografies. Les millors són **façana,
   perfil i tres quarts**: amb una de sola, el model s'ha d'inventar el fons.
3. Escriu què és, en una línia. Ajuda molt: «ermita romànica d'una nau, campanar
   d'espadanya a ponent» dona molt millor resultat que no dir res.
4. Si vols, escriu una **indicació per a cada fotografia** al costat de la
   miniatura.
5. Tria la parcel·la i si va a Edificis o a Monuments.
6. **Genera el mod.**

## Indicacions per fotografia

Cada foto agafa un nom per ordre —façana principal, lateral, tres quarts,
detall— i té al costat un camp per dir-hi el que el model no pot veure:

- **Quina cara és**, quan la foto no ho deixa clar.
- **Què s'hi ha de mirar**: «el campanar surt del cos de la nau», «el portal és
  descentrat cap a la dreta».
- **Què no s'ha de tenir en compte**: «el rellotge no hi era originalment»,
  «la bastida és de les obres», «el cotxe tapa l'entrada».

La indicació s'envia **just abans de la seva imatge**, no barrejada amb la
resta: així el model sap de quina foto parles. Es torna a enviar a cada ronda
de correcció, i el contracte li diu que en faci cas per damunt del que
dedueixi de la imatge.

L'ordre importa: **la primera foto hauria de ser la façana**, perquè és la cara
que el joc dibuixa cap al sud.

## Les formes personals també hi compten

Al catàleg que s'envia al model no hi ha només les vint formes oficials: també
hi van les que el joc tingui registrades a `PERSONAL_GEOMETRIES`, amb el nom
desglossat, la mida mesurada i on tenen el punt d'inserció. Per exemple:

```
marcRectangularBuit (marc rectangular buit) — forma personal; 1.00 × 1.00 × 1.00
  abans d'escalar; h és la BASE: la peça creix cap amunt
```

Les mesures surten de mesurar la geometria en obrir el taller, no de cap llista
escrita a mà: registra una forma nova i el prompt la porta tot sol la propera
vegada que recarreguis.

El prompt també explica al model que les faci servir quan el nom digui
clarament què són —un marc buit, un arc obert, un mur amb finestres— en comptes
d'imitar-les amb quatre caixes, i que no toqui les que no entengui. Com que
moltes peces personals tenen la base a Y=0 i no estan centrades, se li recorda
que per a aquelles `h` és la base.

## Veure què s'envia

El botó **Mira què s'enviarà** obre el prompt sencer abans de gastar cap crida:
les regles del joc, l'exemple treballat, el teu encàrrec i cada fotografia amb
la seva indicació i el seu pes. El pots copiar o baixar.

No és una aproximació: el text surt de les mateixes funcions que munten la
petició de debò, de manera que no poden divergir. Els dos primers torns van
marcats com a *exemple fix*: són sempre els mateixos i no depenen del que hagis
escrit.

Serveix per entendre per què ha sortit el que ha sortit, i per portar-te el
prompt a claude.ai o ChatGPT si prefereixes fer-ho a mà.

Les fotografies es redueixen a 1024 px abans d'enviar-les: no cal que les
encongeixis tu.

## El cicle de correcció

És el que de debò apuja la qualitat, i funciona així:

1. El model rep el contracte del joc i les fotografies, i torna un JSON.
2. El taller el valida amb `validateMod()` i el mesura.
3. **Es renderitza l'esbós des del sud, l'est i zenital** i se li tornen
   aquestes tres imatges al costat de les fotografies: «compara-ho i
   corregeix».
4. Es repeteix.

Amb **dues rondes** el resultat és clarament millor que amb cap, a canvi de
trigar més i de fer el triple de crides. Pots baixar-ho a una o a cap al
desplegable **Correccions**.

Si el model torna un JSON trencat, el taller li diu exactament què falla i li
demana que ho repeteixi; això no gasta cap de les rondes de correcció.

## Seguretat

- **Mai no s'executa el codi que torna el model.** Torna dades, i passen per
  `validateMod()`, la mateixa frontera que fa servir la importació de fitxers.
  Una forma que no existeixi, un color mal escrit o una mida impossible es
  rebutgen amb un missatge.
- La passarel·la només deixa passar les dues adreces conegudes, limita el cos a
  24 MB i no escriu mai la clau enlloc.
- El servidor del joc només escolta a `127.0.0.1`: això no obre res cap enfora.

## Cost

Una generació amb dues rondes són tres crides. La primera porta les
fotografies, i les de correcció hi afegeixen les tres vistes. Parlem de cèntims
per mod, però el consum surt al panell quan acaba per si el vols vigilar.

Per estalviar: baixa les correccions a una ronda, o fes servir els models més
barats (Sonnet 5, GPT-5.6 Terra) per a les proves i el bo per a la definitiva.

## Quan no funciona

| Què veus | Què passa |
| --- | --- |
| «La passarel·la no respon» | El joc no corre amb `node server.mjs`, o falta `ai-proxy.mjs`. |
| «Sense clau al servidor» | No has posat la variable d'entorn abans d'arrencar. |
| «La clau no és vàlida» | Clau mal copiada o caducada. |
| «La resposta s'ha tallat» | L'edifici és massa complex. Demana'n un de més senzill. |
| El mod surt de la cel·la | Ha passat les rondes sense arreglar-ho. Ajusta-ho tu a l'editor. |
| Surt molt genèric | Falten fotografies o falta la descripció. |
| S'inventa un detall que no hi és | Digue-l'hi a la indicació d'aquella foto. |
| Confon quina cara és quina | Posa el nom de la cara a la indicació. |

## Fitxers

| Fitxer | Què fa |
| --- | --- |
| `ai-contract.js` | Genera el prompt amb les regles del joc, a partir de les constants |
| | `previewPrompt()` de `ai-generate.js` és el que ensenya el botó de previsualització |
| `ai-providers.js` | Adaptadors de Claude i OpenAI, i el lector del JSON |
| `ai-generate.js` | El cicle: crida, valida, renderitza, corregeix |
| `ai-panel.js` | El panell del taller |
| `../ai-proxy.mjs` | La passarel·la del servidor |

El contracte es construeix a partir de `constants.js` i `format.js`, de manera
que si el joc guanya una forma o una mida nova, el prompt es posa al dia tot
sol. Les formes personals que tinguis instal·lades també hi surten.
