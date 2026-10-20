# Cilindres més arrodonits · versió 98

La peça `cylinder` passa de 12 cares fixes a 32 per defecte. El canvi afecta tant les peces del joc com els mods que criden `part('cylinder', ...)`; no cal modificar aquestes crides ni les viles desades.

## Canviar el detall

A `config.js`, dins de `CONFIG`, trobaràs:

```js
geometry: {
  cylinderSegments: 32,
},
```

Pots posar-hi qualsevol nombre enter entre 3 i 256. Per exemple, 64 dona un contorn més fi; 128 o 256 afegeixen més detall i més triangles. El valor 12 recupera el contorn anterior. És un ajust global i requereix recarregar la pàgina després de desar-lo.

Si conserves un `config.js` antic sense aquesta secció, el joc utilitza 32 cares. Si afegeixes la secció manualment, posa-la dins de `CONFIG`, abans que es congeli l’objecte.

## Geometries personals

Les geometries creades directament per un mod mantenen el seu propi nombre de cares. En aquest exemple, el quart paràmetre indica 64 cares:

```js
new THREE.CylinderGeometry(0.5, 0.5, 1, 64)
```

Si vols que una geometria personal segueixi el mateix ajust global, des d’un fitxer dins de `mods-personals` pots fer:

```js
import {CONFIG} from '../config.js';

export const PERSONAL_GEOMETRIES = {
  elMeuCilindre: THREE => new THREE.CylinderGeometry(
    0.5, 0.5, 1, CONFIG.geometry?.cylinderSegments ?? 32
  ),
};
```

Integra l’entrada al teu registre existent. El canvi del cilindre oficial no altera els cons, els tubs buits, els marcs ni les altres formes personals.

## Instal·lació sobre la versió 97

Puja a l’arrel del repositori `scene.js`, `app.js`, `index.html` i `version.json`. Actualitza també `config.js`, o afegeix-hi la secció `geometry` conservant les teves preferències. El fitxer inclòs conserva els valors del repositori consultat, inclosa l’opció de copiar JSON activada.

Després que GitHub Pages publiqui els canvis, recarrega amb Ctrl+F5. A «La meva vila» ha d’aparèixer «Versió 98». Aquesta actualització és incremental: necessita els fitxers de la versió 97 ja instal·lats.

Comprovacions fetes: geometria real del joc amb 3, 32, 64, 128 i 256 cares; dimensions i dades de la vila conservades; validació dels valors incorrectes; comprovadors de mods. No s’ha fet una prova visual al navegador.
