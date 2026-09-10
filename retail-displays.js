/** Products inside shallow display bays; usable on any accessible storey. */
export function renderRetailDisplay(type,side,u,face){
  if(!['charcuterie','clothing','bank','shoeshop','toyshop'].includes(type))return false;
  const box=(color,x,y,z,sx,sy,sz)=>face('box',color,x,y,z,sx,sy,sz);
  if(type==='toyshop'){
    for(const h of [.16,.37])box('#c8ab78',u,h,.76,.31,.020,.13);
    if(side===0){
      for(const y of [.235,.445]){
        face('sphere','#b78b5b',u,y,.786,.115,.104,.057);
        face('sphere','#c99f70',u,y+.073,.786,.093,.084,.063);
        for(const sign of [-1,1]){
          face('sphere','#b78b5b',u+sign*.047,y+.111,.782,.037,.037,.028);
          face('sphere','#b78b5b',u+sign*.067,y+.017,.786,.043,.055,.041);
          face('sphere','#a87950',u+sign*.035,y-.045,.797,.043,.034,.035);
          face('sphere','#354649',u+sign*.018,y+.081,.818,.008,.009,.007);
        }
        face('sphere','#ebcaa0',u,y+.058,.820,.040,.027,.015);
        box('#537e98',u,y+.034,.821,.05,.013,.009);
      }
    }else{
      // A locomotive and carriage on a short track.
      box('#74624f',u,.186,.781,.29,.015,.07);
      for(const [offset,color] of [[-.08,'#c65b50'],[.07,'#638e9f']]){
        box(color,u+offset,.235,.793,.12,.064,.048);
        for(const sign of [-1,1])face('sphere','#3d515a',u+offset+sign*.038,.202,.823,.032,.032,.017);
      }
      box('#c65b50',u-.11,.291,.791,.055,.055,.048);
      box('#efd49a',u-.11,.293,.820,.026,.028,.008);
      box('#405d6b',u-.035,.282,.79,.020,.053,.020);
      for(let row=0;row<3;row++)for(let col=0;col<3-row;col++){
        box(['#d6b151','#6f9b81','#bc6560'][(row+col)%3],u+(col-(2-row)/2)*.073,.410+row*.060,.79,.064,.054,.058);
      }
    }
  }else if(type==='charcuterie'){
    if(side===0){
      box('#97774d',u,.55,.770,.29,.023,.055);
      for(const offset of [-.092,0,.092]){
        box('#d5b88b',u+offset,.516,.78,.008,.047,.008);
        for(let link=0;link<3;link++){
          const y=.475-link*.087;
          face('sphere',offset===0?'#873f35':'#a16349',u+offset,y,.788,.047,.072,.043);
          box('#d2bca0',u+offset,y-.041,.788,.008,.014,.008);
        }
      }
      box('#c4aa79',u,.171,.767,.30,.025,.13);
      for(const offset of [-.08,.08]){
        face('sphere','#81452f',u+offset,.227,.78,.099,.067,.067);
        box('#d9bd89',u+offset,.222,.818,.056,.031,.013);
      }
    }else{
      for(let tier=0;tier<2;tier++){
        const y=.18+tier*.205;box('#c4aa79',u,y-.024,.767,.31,.025,.13);
        for(const offset of [-.077,.077]){
          face('cylinder','#cda05e',u+offset,y+.018,.78,.118,.057,.096);
          face('cylinder','#f0d184',u+offset,y+.049,.78,.110,.013,.088);
          for(const ox of [-.023,.019])face('sphere','#b78a48',u+offset+ox,y+.058,.787,.018,.006,.014);
        }
      }
    }
  }else if(type==='clothing'){
    if(side===0){
      box('#b6a386',u,.138,.775,.22,.035,.11);
      box('#a6a092',u,.207,.773,.019,.11,.019);
      face('cone','#558f9b',u,.285,.778,.205,.15,.09);
      box('#558f9b',u,.390,.780,.109,.14,.051);
      for(const s of [-1,1])box('#558f9b',u+s*.070,.411,.778,.039,.098,.045);
      box('#eddac0',u,.483,.78,.036,.033,.035);
      face('sphere','#eddac0',u,.529,.780,.063,.063,.058);
      box('#e4be81',u,.348,.814,.114,.018,.012);
    }else{
      box('#b9aa93',u,.529,.76,.29,.015,.055);
      for(const offset of [-.073,.073]){
        const color=offset<0?'#bd7892':'#d4ae65';
        box('#d6c9b0',u+offset,.503,.767,.008,.037,.01);
        box(color,u+offset,.416,.788,.095,.14,.03);
        for(const s of [-1,1])box(color,u+offset+s*.058,.459,.788,.030,.055,.035);
        box('#f1e2c9',u+offset,.477,.809,.033,.012,.008);
      }
      for(let tier=0;tier<2;tier++){
        const y=.17+tier*.091;box('#b6a084',u,y,.762,.31,.019,.13);
        for(const offset of [-.075,.075])for(let i=0;i<2;i++)box(['#6a899b','#bf9297','#d2bc8d'][(tier+i+side)%3],u+offset,y+.021+i*.019,.788,.117,.017,.070);
      }
    }
  }else if(type==='bank'){
    if(side===0){
      // Window with a bank emblem above a desk and computer.
      box('#e4e2d1',u,.436,.744,.26,.233,.019);
      for(const offset of [-.071,0,.071])box('#537b8b',u+offset,.435,.761,.027,.109,.014);
      for(const y of [.371,.498])box('#537b8b',u,y,.761,.216,.024,.014);
      box('#bda77f',u,.249,.79,.28,.028,.11);
      for(const s of [-1,1])box('#677773',u+s*.109,.189,.79,.018,.094,.018);
      box('#535f61',u,.295,.775,.017,.068,.025);
      box('#365563',u,.324,.78,.14,.076,.016);
      box('#8ab9be',u,.326,.791,.113,.049,.009);
    }else{
      // ATM integrated into the right-hand bay, with screen, keypad and cash slot.
      box('#9aabae',u,.351,.758,.278,.423,.118);
      box('#d5ded7',u,.361,.823,.233,.365,.018);
      box('#273d51',u,.468,.837,.173,.103,.014);
      box('#78b6b6',u,.472,.847,.140,.068,.008);
      for(let row=0;row<3;row++)for(let col=0;col<3;col++)box('#4b6470',u+(col-1)*.032,.368-row*.028,.840,.022,.017,.014);
      box('#4f976e',u+.071,.373,.842,.021,.05,.013);
      box('#314c56',u,.216,.842,.162,.020,.018);
      box('#587d80',u,.256,.842,.104,.014,.018);
      box('#f0c878',u+.052,.552,.837,.070,.015,.012);
    }
  }else{
    for(let tier=0;tier<3;tier++){
      const y=.17+tier*.139;box('#c0a37c',u,y,.758,.31,.020,.13);
      for(const offset of [-.077,.077]){
        const x=u+offset,color=['#9a633f','#596a80','#b16765'][(tier+side)%3];
        box('#594b40',x,y+.019,.790,.104,.019,.052);
        face('sphere',color,x+.018,y+.045,.790,.077,.052,.051);
        box(color,x-.023,y+.047,.79,.042,.052,.048);
        if(side===1&&tier===2)box(color,x-.025,y+.082,.79,.046,.083,.048);
        else box('#e4cda6',x-.006,y+.072,.803,.023,.008,.017);
      }
    }
  }
  return true;
}
