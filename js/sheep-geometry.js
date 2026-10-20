/** Compact woolly silhouette, drooping tail and short face, distinct from goats. */
export function renderSheep(part,sheep){
  const wool=['#f1ecdc','#e6dfcc','#ede7d7'][sheep.coat],face=sheep.coat===1?'#75685a':'#baad92',hoof='#60594d';
  part(sheep,'sphere',wool,0,.235,0,.20,.21,.29);
  for(const x of [-.052,.052])for(const z of [-.085,0,.085]){
    part(sheep,'sphere',wool,x,.278,z,.12,.14,.13);
    part(sheep,'sphere',wool,x*1.32,.218,z,.10,.12,.13);
  }
  part(sheep,'sphere',face,0,.26,.177,.088,.10,.13);
  part(sheep,'sphere',wool,0,.304,.145,.11,.075,.10);
  part(sheep,'box',hoof,0,.239,.238,.057,.027,.020);
  part(sheep,'sphere',wool,0,.165,-.153,.055,.11,.059);
  for(const side of [-1,1]){
    part(sheep,'sphere',face,side*.066,.276,.165,.075,.024,.038);
    part(sheep,'sphere','#34312b',side*.044,.278,.20,.014,.014,.014);
    for(const end of [-1,1]){
      const leg=(side+1)+(end+1)/2;
      part(sheep,'box',face,side*.06,.087,end*.082,.03,.14,.03,0,0,leg);
      part(sheep,'box',hoof,side*.06,.019,end*.082,.034,.034,.043,0,0,leg);
    }
  }
}
