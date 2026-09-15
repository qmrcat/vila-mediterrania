/** Presentation groups only: no changes to building IDs or saved worlds. */
const CORE_GROUPS=[
  ['services','Institucions i serveis',['townhall','parliament','institution','hospital','police','fireStation','recycling','barracksSenyera','barracksEstelada']],
  ['culture','Cultura i educació',['school','theatre','cinema','library','museum']],
  ['religion','Religió i memòria',['church','hermitage','monastery','cemetery']],
  ['lodging','Allotjaments i masies',['hotel3','hotel5','hostal','pension','farmhouse']],
  ['leisure','Comerç i lleure',['market','beachbar','playground']],
  ['coast','Costa i banderes',['lighthouse','flagSenyera','flagEstelada','flagBlack']],
];
export function groupBuildings(tools,personalLandmarks={}){
  const used=new Set(),groups=[];
  const append=(id,name,ids)=>{
    const entries=ids.filter(type=>tools.has(type)&&!used.has(type)).map(type=>{used.add(type);return [type,tools.get(type)];});
    if(entries.length)groups.push({id,name,entries});
  };
  for(const [id,name,ids] of CORE_GROUPS)append(id,name,ids);
  append('personal','Mods personals',Object.keys(personalLandmarks));
  // Future official buildings stay visible until assigned to a specific group.
  append('other','Altres edificis',[...tools.keys()].filter(id=>id!=='building-sign'));
  append('signs','Rètols',['building-sign']);
  return groups;
}
