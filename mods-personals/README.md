# Mods personals

Aquesta carpeta és l'espai reservat per al contingut de l'usuari. Els agents d'IA no l'han de modificar si l'usuari no ho demana explícitament.

## Contingut actiu

- `windmill`: Molí de vent d'una cel·la, definit a `catalog.js` i dibuixat per `windmill-geometry.js`.

## Funcionament

1. Declara el tipus a `catalog.js`.
2. Crea la seva geometria en un fitxer nou d'aquesta carpeta.
3. Importa la funció i registra-la a `renderers.js`.
4. Executa `node mods-personals/check.mjs`.
5. Obre el joc, col·loca l'element, desa una còpia JSON i torna-la a importar.

## Exemple: monument

A `PERSONAL_LANDMARKS` de `catalog.js`:

```js
export const PERSONAL_LANDMARKS={
  watchtower:{
    name:'Torre de guaita',
    category:'monument',
    sizes:[1],
    height:2.65,
    help:'Torre defensiva d’una cel·la. Tria l’orientació.'
  }
};
```

Crea `torre-guaita.js`:

```js
export function renderWatchtower(landmark,part,unit){
  part('box','#c4b89d',0,.05,0,unit*.8,.10,unit*.8);
  part('cylinder','#b3a68c',0,1.05,0,.78,2,.78);
  part('cone','#a66d4d',0,2.20,0,1.02,.42,1.02);
}
```

I registra'l a `renderers.js`:

```js
import {renderWatchtower} from './torre-guaita.js';
export const PERSONAL_LANDMARK_RENDERERS={watchtower:renderWatchtower};
```

## Exemple: terreny de lavanda

Al catàleg:

```js
export const PERSONAL_TERRAINS={
  lavender:{
    name:'Lavanda',color:'#9a8fa8',height:.40,
    description:'Fileres de mates liloses amb tiges florides.'
  }
};
```

Al fitxer `lavanda.js`:

```js
export function renderLavender(tile,{root,emit}){
  for(const u of [-.32,0,.32])for(let i=0;i<6;i++){
    const v=-.42+i*.17,p=root(u,v,.06);if(!p)continue;
    emit(p,'rock','#7f8f63',0,.055,0,.16,.11,.16);
    emit(p,'rock','#8d7fae',0,.125,0,.13,.12,.13);
  }
}
```

Registre corresponent:

```js
import {renderLavender} from './lavanda.js';
export const PERSONAL_TERRAIN_RENDERERS={lavender:renderLavender};
```

## Exemple: arbre

Al catàleg:

```js
export const PERSONAL_TREES=[{
  id:'carob',name:'Garrofer',scientific:'Ceratonia siliqua',height:2.4,
  description:'Capçada ampla i densa, amb un tronc gruixut.'
}];
```

El renderitzador rep coordenades mundials i les mateixes funcions agrupades del joc:

```js
export function renderCarob(tile,{x,y,z,seed,add,branch}){
  branch('#75654f',[x,y,z],[x,y+.95,z],.16);
  add('rock','#4f6b3f',x,y+1.45,z,1.15,.72,1.08,seed*6);
}
```

## Exemple: negoci

Un negoci neutre no necessita geometria d'aparador:

```js
export const PERSONAL_BUSINESSES={
  icecream:{
    name:'Gelateria',accent:'#c98aa0',frame:'#e6d8c2',awning:'#d9a3b4',
    description:'Gelateria amb aparadors clars.',door:0,neutral:true
  }
};
```

Si `neutral` és `false` o no existeix, registra també una funció a `PERSONAL_RETAIL_RENDERERS`. Es crida una vegada per cada aparador visible:

```js
export function renderIceCream({u,box}){
  box('#ead7bd',u,.18,.77,.30,.025,.12);
  for(const [offset,color] of [[-.08,'#d98c9f'],[0,'#efe0ae'],[.08,'#8fb58c']])
    box(color,u+offset,.24,.79,.065,.085,.06);
}
```

## Regles importants

- Els identificadors han de començar amb minúscula i només poden contenir lletres i números.
- No reutilitzis un identificador oficial.
- Les mides dels edificis segueixen `1`, `2`, `4`, `6`, `9` o `16` cel·les.
- Les geometries han d'utilitzar `part`, `add`, `face`, `box` o `branch`; evita crear malles individuals.
- Per a peces inclinades que giren amb un landmark, utilitza `orientedPart` del quart argument del renderitzador.
- Cada color nou crea un material: reutilitza una paleta petita.
- No eliminis un mod mentre una vila desada encara utilitzi els seus identificadors.
- Afegir contingut amb aquests registres no canvia el format de vila.


## Formes geomètriques pròpies (des de la v91)

`geometries.js` exporta **PERSONAL_GEOMETRIES**, un objecte de funcions síncrones. Cada funció rep el Three.js que ja utilitza el joc i retorna una `BufferGeometry` nova. `renderers.js` reexporta el registre:

```js
export {PERSONAL_GEOMETRIES} from './geometries.js';
```

El registre inclou una cúpula d’exemple, oberta per sota, de diàmetre 1 i alçada 1 amb la base a Y=0:

```js
export const PERSONAL_GEOMETRIES={
  cupulaPersonal(THREE){
    return new THREE.SphereGeometry(
      .5, 16, 8, 0, Math.PI*2, 0, Math.PI/2
    ).scale(1, 2, 1);
  },
};
```

Dins del renderitzador d’un edifici:

```js
part('cupulaPersonal', '#cbbd9d', 0, 2, 0, 1, .6, 1);
```

Això situa la base de la cúpula a l’alçada local 2, amb diàmetre 1 i alçada .6. El mateix nom es pot utilitzar amb `add()`, `face()` o `emit()` respectant les coordenades de cada funció. Si la peça ha d’inclinar-se i girar amb l’edifici, utilitza `orientedPart()`.

- Els noms han de ser únics, de 2 a 40 lletres o números, amb inicial minúscula. No reutilitzis cap de les 20 formes oficials.
- Les funcions es criden una vegada en carregar el motor, no per cada peça ni fotograma. Retorna geometria, **no** `Mesh`, materials, promeses ni funcions asíncrones.
- La geometria ha de descriure triangles amb `position` de tres components i coordenades finites. Si hi ha índexs, han de referenciar vèrtexs existents. El motor calcula les normals quan falten, i també els límits.
- El color es passa a `part()` o `add()`. Les formes utilitzen els materials i les instàncies del motor; aquesta API no afegeix materials propis, textures ni morph targets.
- La geometria queda compartida: no la modifiquis ni cridis `dispose()` des dels renderitzadors. Per variar les dimensions o l’orientació, utilitza els arguments de dibuix.
- Les formes no creen ocupacions ni volums de selecció nous: mantén-les dins de la mida i l’alçada declarades al catàleg.
- Després d’editar una forma, recarrega la pàgina. El JSON de la vila no conté aquest codi: conserva també `geometries.js` i els mòduls que importi.

Un mod antic sense l’exportació `PERSONAL_GEOMETRIES` funciona amb les 20 formes oficials, encara que no tingui `geometries.js`. Un registre buit també és vàlid. Si reexportes el registre, el fitxer ha d’existir; els errors de codi s’informen. L’API continua sent la **1**.

Comprova el registre amb `node mods-personals/check.mjs` i la integració real dels renderitzadors amb `node check-mods.mjs`. La cúpula d’exemple queda disponible per utilitzar-la; no modifica l’aspecte del molí ni afegeix automàticament un edifici.
