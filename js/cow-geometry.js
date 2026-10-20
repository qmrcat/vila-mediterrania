/** Stylised Bruna dels Pirineus: brown coat, robust body and pale-rimmed dark muzzle. */
export function renderCow(part,cow){
  const coat=['#92836c','#a2937b','#827560'][cow.coat],light='#c5b79b',dark='#423e35',horn='#ddd0af';
  part(cow,'sphere',coat,0,.295,0,.215,.215,.335);
  part(cow,'box',coat,0,.33,.115,.16,.17,.14);
  part(cow,'sphere',light,0,.235,.075,.13,.09,.18);
  part(cow,'box',coat,0,.347,.225,.105,.13,.13,-.20);
  part(cow,'sphere',light,0,.31,.287,.115,.079,.074);
  part(cow,'sphere',dark,0,.313,.315,.09,.055,.025);
  part(cow,'sphere',coat,0,.39,.19,.125,.073,.085);
  part(cow,'box',coat,0,.19,-.183,.022,.235,.024,-.10);
  part(cow,'sphere',dark,0,.067,-.197,.035,.063,.039);
  for(const side of [-1,1]){
    part(cow,'sphere',coat,side*.085,.38,.203,.092,.029,.05);
    part(cow,'sphere',dark,side*.055,.366,.25,.015,.015,.015);
    part(cow,'cylinder',horn,side*.065,.427,.18,.019,.067,.019,0,-side*.58);
    part(cow,'cylinder',dark,side*.083,.462,.18,.013,.026,.013,0,-side*.20);
    for(const end of [-1,1]){
      const leg=(side+1)+(end+1)/2;
      part(cow,'box',coat,side*.073,.115,end*.108,.038,.20,.04,0,0,leg);
      part(cow,'box',dark,side*.073,.022,end*.108,.045,.042,.05,0,0,leg);
    }
  }
}
