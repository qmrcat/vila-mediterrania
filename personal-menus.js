import {PERSONAL_TERRAINS,PERSONAL_TREES,PERSONAL_LANDMARKS,PERSONAL_BUSINESSES,PERSONAL_MENU_ORDER} from './personal-content.js?v=94';
import {orderMenuEntries} from './menu-order.js';

const rulesFor=definitions=>Object.fromEntries(Object.entries(definitions).filter(([,d])=>d.menuAfter!==undefined).map(([id,d])=>[id,{menuAfter:d.menuAfter}]));
const base={
  'terrain-type':rulesFor(PERSONAL_TERRAINS),
  'slope-finish':rulesFor(PERSONAL_TERRAINS),
  'tree-species':rulesFor(Object.fromEntries(PERSONAL_TREES.map(d=>[d.id,d]))),
  'business-type':rulesFor(PERSONAL_BUSINESSES),
  'building-type':rulesFor(Object.fromEntries(Object.entries(PERSONAL_LANDMARKS).filter(([,d])=>d.category!=='monument'))),
  'monument-type':rulesFor(Object.fromEntries(Object.entries(PERSONAL_LANDMARKS).filter(([,d])=>d.category==='monument'))),
};
export const MENU_RULES=Object.fromEntries([...new Set([...Object.keys(base),...Object.keys(PERSONAL_MENU_ORDER)])].map(id=>[id,{...base[id],...PERSONAL_MENU_ORDER[id]}]));

/** Reuse existing options (and their state/listeners), preserving selection.
 * An option leaving an optgroup follows its reference into the new group. */
export function orderSelect(select,rules){
  const entries=[];
  let buffer=[],start=null;
  const flush=boundary=>{
    const group={parent:select,start,boundary};
    entries.push(...buffer.map(option=>({id:option.value,option,group})));buffer=[];
  };
  for(const child of select.children){
    if(child.tagName==='OPTION')buffer.push(child);
    else if(child.tagName==='OPTGROUP'){
      flush(child);
      const group={parent:child,start:null,boundary:null};
      entries.push(...[...child.children].filter(n=>n.tagName==='OPTION').map(option=>({id:option.value,option,group})));
      start=child;
    }
  }
  flush(null);
  if(new Set(entries.map(e=>e.id)).size!==entries.length)return false;
  const ordered=orderMenuEntries(entries,rules),selected=select.value;
  let changed=false;
  const groups=new Map();
  for(const entry of ordered){if(!groups.has(entry.group))groups.set(entry.group,[]);groups.get(entry.group).push(entry.option);}
  for(const [{parent,start,boundary},options] of groups){
    const current=[];
    let node=start?start.nextElementSibling:parent.firstElementChild;
    while(node&&node!==boundary){if(node.tagName==='OPTION')current.push(node);node=node.nextElementSibling;}
    if(current.length===options.length&&current.every((option,i)=>option===options[i]))continue;
    for(const option of options)parent.insertBefore(option,boundary);
    changed=true;
  }
  select.value=selected;
  return changed;
}

export function initPersonalMenus(root=document,rules=MENU_RULES){
  const selects=[...root.querySelectorAll('select[id]')].filter(select=>Object.keys(rules[select.id]??{}).length&&select.id!=='building-type');
  if(!selects.length)return {dispose:()=>{}};
  const observer=new MutationObserver(records=>{
    observer.disconnect();
    const affected=new Set(records.map(r=>r.target.closest('select')).filter(Boolean));
    for(const select of affected)orderSelect(select,rules[select.id]);
    observe();
  });
  const observe=()=>{for(const select of selects)observer.observe(select,{childList:true,subtree:true});};
  for(const select of selects)orderSelect(select,rules[select.id]);
  observe();
  return {dispose:()=>observer.disconnect()};
}
