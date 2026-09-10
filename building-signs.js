import {normalizeBusinessName} from './business-signs.js';
/** Buildings with an existing main sign; secondary labels keep their meaning. */
export const SIGNED_LANDMARKS=['hospital','school','police','fireStation','recycling','cemetery','hotel3','hotel5','hostal','pension','museum','monastery'];
export function normalizeBuildingSign(value){
  if(value===undefined)return {};
  const signName=normalizeBusinessName(value);
  return signName?{signName}:{};
}
