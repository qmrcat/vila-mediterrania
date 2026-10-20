/** Menu presentation only. No DOM, renderer or changes to saved identifiers. */
export function menuMetadata(value,label){
  if(value.menuAfter===undefined)return {};
  if(typeof value.menuAfter!=='string'||!value.menuAfter.trim()||value.menuAfter.length>120)throw new Error(`mods-personals: ${label}.menuAfter ha de ser un identificador no buit (màxim 120 caràcters).`);
  return {menuAfter:value.menuAfter.trim()};
}

export function validateMenuOrder(input){
  const record=(value,label)=>{
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`mods-personals: ${label} ha de ser un objecte.`);
  };
  record(input,'PERSONAL_MENU_ORDER');
  const output=Object.create(null);
  for(const [selector,rules] of Object.entries(input)){
    if(!/^[a-zA-Z][\w-]{0,79}$/.test(selector))throw new Error(`mods-personals: selector de menú no vàlid: ${selector}.`);
    record(rules,selector);const group=Object.create(null);
    for(const [id,value] of Object.entries(rules)){
      record(value,`${selector}.${id}`);
      const metadata=menuMetadata(value,`${selector}.${id}`);
      if(!id||id.length>120||!metadata.menuAfter)throw new Error(`mods-personals: falta l’identificador o menuAfter a ${selector}.${id}.`);
      group[id]=Object.freeze(metadata);
    }
    output[selector]=Object.freeze(group);
  }
  return Object.freeze(output);
}

/** Move entries after their reference, inheriting its group. Siblings keep their
 * original order. Cycles lose only their cyclic edges; all options remain visible. */
export function orderMenuEntries(entries,rules={},warn=()=>{}){
  const byId=new Map(entries.map(entry=>[entry.id,entry])),parents=new Map();
  for(const entry of entries){
    const after=rules[entry.id]?.menuAfter;
    if(after===undefined)continue;
    if(after===entry.id){warn(`«${entry.id}» no pot anar darrere seu.`);continue;}
    if(!byId.has(after)){warn(`No es troba «${after}», referència de «${entry.id}», en aquest menú.`);continue;}
    parents.set(entry.id,after);
  }
  const finished=new Set();
  for(const entry of entries){
    const path=[],seen=new Map();let id=entry.id;
    while(parents.has(id)&&!finished.has(id)){
      if(seen.has(id)){
        const cycle=path.slice(seen.get(id));
        for(const member of cycle)parents.delete(member);
        warn(`Ordre circular ignorat: ${cycle.join(' → ')}.`);break;
      }
      seen.set(id,path.length);path.push(id);id=parents.get(id);
    }
    for(const member of path)finished.add(member);
  }
  const children=new Map();
  for(const entry of entries)if(parents.has(entry.id)){
    const parent=parents.get(entry.id);
    if(!children.has(parent))children.set(parent,[]);
    children.get(parent).push(entry);
  }
  const ordered=[];
  for(const entry of entries)if(!parents.has(entry.id)){
    const stack=[entry];
    while(stack.length){
      const next=stack.pop();ordered.push({...next,group:entry.group});
      const descendants=children.get(next.id)??[];
      for(let i=descendants.length-1;i>=0;i--)stack.push(descendants[i]);
    }
  }
  return ordered;
}
