# Biblioteca compartida d’edificis

Els dissenys públics són a `biblioteca/catalog.json`. El joc els llegeix des del mateix lloc web, també a `https://qmrcat.github.io/vila-mediterrania/`. No necessita servidor d’aplicacions, comptes dels jugadors ni credencials de GitHub al navegador. El catàleg inicial és buit: no publica automàticament els dissenys privats.

## Publicar els teus edificis

1. Obre l’editor d’edificis i crea un disseny, obre’n un de desat o importa el seu JSON. **Desa el disseny** el conserva al navegador.
2. Desplega **Biblioteca compartida · GitHub** i prem **Descarrega catàleg amb aquest disseny**. La primera vegada es llegeix el catàleg publicat; el disseny actual s’hi afegeix o actualitza sense perdre els altres. El fitxer descarregat es diu `catalog.json`.
3. Per afegir-ne més, obre cada disseny i repeteix el botó dins de la mateixa sessió. **L’última descàrrega conté tots els dissenys que has anat preparant.** El navegador pot afegir un número al nom: reanomena l’últim fitxer a `catalog.json` abans de pujar-lo.
4. A [la carpeta biblioteca del repositori](https://github.com/qmrcat/vila-mediterrania/tree/main/biblioteca), utilitza **Add file → Upload files** per substituir `catalog.json`. Revisa els canvis i confirma el commit a la branca que publica GitHub Pages (actualment `main`). No hi pugis un JSON de vila, un mod o el JSON d’un únic edifici com a substitut de tot el catàleg.
5. Espera que GitHub Pages hagi desplegat el canvi. Al joc, entra a **Els meus edificis → Biblioteca compartida → Actualitza la biblioteca**. Si encara veus la versió anterior, espera que acabi el desplegament i torna-ho a provar.

La descàrrega **no publica** res. Només es comparteix el que tu puges al repositori. Pots consultar els canvis i recuperar versions anteriors amb l’historial de GitHub.

## Continuar o modificar

- **Un altre dia, abans de publicar:** carrega l’últim `catalog.json` descarregat amb **Carrega un catàleg del disc…**. Això recupera també els dissenys encara no pujats; no els importa a la col·lecció privada ni els canvia l’identificador.
- **Modificar un edifici publicat:** prem **Carrega el catàleg publicat**, selecciona l’edifici i **Obre per modificar**. Edita’l i torna a descarregar el catàleg. Es conserva el seu `id`, de manera que substitueix el disseny anterior.
- **Crear una variant:** usa **Desa com a còpia** abans d’afegir-la al catàleg. Tindrà un identificador nou.
- **Recuperar la versió del servidor:** **Carrega el catàleg publicat** substitueix el catàleg de treball. Si hi ha preparacions de la sessió, l’editor demana confirmació; conserva primer la descàrrega pendent.
- **Retirar un edifici:** elimina el seu objecte de la llista `designs` de `catalog.json`, conserva un JSON vàlid i puja’l. Els edificis ja construïts a les viles es conserven.
- Si el repositori ha canviat des que vas preparar el fitxer, parteix del catàleg més recent abans de pujar-lo: una càrrega de fitxer a GitHub substitueix el catàleg sencer, no fa una fusió automàtica.

## Utilitzar la biblioteca al joc

A **Els meus edificis**, el selector **Col·lecció** separa **Els meus dissenys** (localStorage) i **Biblioteca compartida**. Pots construir directament amb un disseny compartit. **Desa una còpia al navegador** en crea una còpia independent que pots editar; no modifica l’original públic ni sobreescriu dissenys locals amb el mateix identificador.

La vila inclou una còpia completa dels edificis que hi col·loques. Una actualització o eliminació del catàleg públic no altera les viles existents. Si no es pot carregar el catàleg, el joc continua funcionant amb els dissenys locals i l’últim catàleg carregat en aquesta sessió.

## Format i comprovacions

S’utilitza el mateix format `vila-buildings` versió 4 de l’editor, amb un màxim de **100 dissenys** i **2 MB**. Els identificadors han de ser únics. Es comproven colors, cel·les, dimensions, plantes i façanes abans d’utilitzar o exportar les dades. No s’executa codi procedent del JSON. El catàleg correspon a l’editor d’edificis del joc; l’editor de mods de `editor-mods/` conserva el seu format i el seu funcionament.

```sh
node --test tests/shared-designs.test.mjs
node mods-personals/check.mjs
node check-mods.mjs
```

No canvien el format de les viles (66), els dissenys (4) ni l’API dels mods (1).
