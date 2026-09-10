# Configurar Vila Mediterrània

Edita **config.js**, al costat d’index.html, amb VS Code o un editor de text. Modifica els valors de l’objecte CONFIG, desa el fitxer i recarrega el joc amb **Ctrl+F5**. No cal compilar ni instal·lar paquets. Conserva les comes, les claus i els noms dels camps. Els comentaris del fitxer expliquen cada valor.

## Valors disponibles

| Camp | Valor inicial | Significat |
| --- | --- | --- |
| houses.maxFloors | 5 | Màxim de plantes de les cases habituals, planta baixa inclosa. |
| houses.maxPatioFloors | 2 | Màxim de plantes de les cases amb pati; no pot superar maxFloors. |
| terrain.maxElevation | 4 | Nivell màxim del terreny. Un pendent necessita un nivell superior lliure. |
| flags.housePercentage | 35 | Percentatge de cases amb obertures visibles que reben una bandera, de 0 a 100. |
| flags.esteladaPercentage | 50 | Percentatge d’estelades entre les banderes; les altres són senyeres. |
| flags.enabledByDefault | false | Activa la Diada en crear una vila nova si es posa true. |
| grid.sizes | [33, 49, 65] | Mides disponibles, nombres senars de 17 o més. |
| grid.defaultSize | 33 | Mida inicial, inclosa a grid.sizes. |
| bridges.minLength | 2 | Distància mínima entre extrems del pont; mínim 2. |
| bridges.maxLength | 16 | Distància màxima, igual o superior a minLength. |
| limits.objectsPerCategory | 128 | Màxim independent per a ponts, mercats, esglésies, ajuntaments, edificis del jugador i equipaments. Els equipaments comparteixen categoria. |
| limits.undoSteps | 60 | Nombre de canvis recuperables amb Desfés durant la sessió. |

## Exemple

Per permetre cases de vuit plantes, terreny de sis nivells i banderes a la meitat de les cases, modifica únicament aquests valors dins dels apartats corresponents:

```js
// A houses:
maxFloors: 8,
// A terrain:
maxElevation: 6,
// A flags:
housePercentage: 50,
```

Amb esteladaPercentage: 0 totes les banderes de la Diada són senyeres; amb 100 totes són estelades. Amb housePercentage: 0 no se’n col·loca cap, encara que el botó estigui activat. Els percentatges s’arrodoneixen a banderes senceres.

## Aplicació i viles desades

Els selectors, els missatges, la construcció i la validació de fitxers fan servir la mateixa configuració. El percentatge de banderes s’aplica en tornar a carregar la vila; la decisió d’activar o desactivar el botó es conserva en cada vila.

La configuració pertany a aquesta còpia del joc i no s’inclou dins del JSON d’una vila. Per moure una vila amb límits ampliats a una altra instal·lació, copia també config.js o posa-hi uns límits compatibles. Mantén a grid.sizes les mides de les viles que vulguis obrir.

Si abaixes un límit i el desament del navegador el supera, el joc s’atura amb un missatge i ofereix **Descarrega la vila desada**. El desament original es conserva. Restaura un límit compatible i prem **Torna-ho a provar**. Un JSON importat incompatible també es rebutja sense substituir la vila actual.

Aquesta configuració controla les regles generals indicades a la taula. Les proporcions dels models 3D, les plantes fixes dels equipaments —com l’ajuntament— i el format dels dissenys de l’editor mantenen les seves regles pròpies. Augmentar molt la quadrícula o les alçades comporta més feina per al renderitzador.

El format de vila és el **42**, compatible amb els formats **1–41** quan compleixen els límits configurats.
