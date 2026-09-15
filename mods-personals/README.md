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
