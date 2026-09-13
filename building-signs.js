import {normalizeBusinessName} from './business-signs.js';
/** Buildings with an existing main sign; secondary labels keep their meaning. */
export const SIGNED_LANDMARKS=['farmhouse','hospital','school','police','fireStation','recycling','cemetery','hotel3','hotel5','hostal','pension','museum','monastery','parliament','institution','barracksSenyera','barracksEstelada'];
export function normalizeBuildingSign(value){
  if(value===undefined)return {};
  const signName=normalizeBusinessName(value);
  return signName?{signName}:{};
}
