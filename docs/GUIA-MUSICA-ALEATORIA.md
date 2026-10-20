# Reproducció aleatòria · versió 99

Obre els controls de música amb el botó ♫ i marca **Reproducció aleatòria**.

- La llista es barreja i cada pista passa una vegada abans de començar una ronda nova.
- A cada ronda es torna a barrejar l’ordre. Si hi ha dues pistes reproduïbles o més, l’última d’una ronda no és la primera de la següent.
- Activar el mode mentre sona una pista la deixa continuar i barreja les altres. Desactivar-lo recupera l’ordre de la llista a partir de la pista actual.
- Pausar, reprendre o desactivar temporalment la música conserva la cua.
- **Següent pista** avança dins de la mateixa cua. La pista que saltes compta com a passada encara que no l’hagis escoltada sencera.
- Els fitxers que donen error se salten; si fallen tots, la reproducció s’atura amb un avís.
- Es recorda la preferència al navegador, juntament amb l’activació, la pausa i el volum. En reobrir el joc o carregar una altra carpeta comença una ronda nova.

Funciona tant amb `music/playlist.json` com amb una carpeta triada al dispositiu. Les carpetes del dispositiu s’han de tornar a seleccionar quan es reobre el joc, com abans.

## Instal·lació sobre la versió 98

Substitueix a l’arrel del repositori aquests quatre fitxers del ZIP:

1. `music.js`
2. `app.js`
3. `index.html`
4. `version.json`

Es poden afegir també aquesta guia i `tests/music.test.mjs`. Després de publicar-se a GitHub Pages, recarrega amb Ctrl+F5. A «La meva vila» apareixerà **Versió 99**.

No cal canviar `config.js`, els àudios ni els mods personals. El paquet és una actualització incremental sobre la versió 98.

## Comprovacions

`node --test tests/music.test.mjs` comprova les rondes sense repeticions, el canvi de mode durant una pista, les preferències, pausa i represa, el botó Següent, llistes buides o amb una sola pista, fitxers erronis i canvi de carpeta. Les proves utilitzen un reproductor simulat; no substitueixen una escolta real al navegador.
