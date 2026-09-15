/**
 * Formes personals: id: (THREE) => BufferGeometry.
 * Es creen una sola vegada i es comparteixen entre totes les instàncies.
 * No cridis dispose() ni modifiquis la geometria des dels renderitzadors.
 */
export const PERSONAL_GEOMETRIES={
  // Cúpula oberta per sota: diàmetre 1, alçada 1, base a Y=0.
  // Exemple d’ús: part('cupulaPersonal', '#cbbd9d', 0, 2, 0, 1, .6, 1);
  cupulaPersonal(THREE){
    return new THREE.SphereGeometry(.5,16,8,0,Math.PI*2,0,Math.PI/2).scale(1,2,1);
  },
};
