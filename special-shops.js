import {businessSignName,businessSignPixels} from './business-signs.js';
export const SPECIAL_SHOPS={
  barber:{accent:'#704d43',frame:'#c4af8a',awning:'#927762',description:'Barberia amb miralls, cadires i pal de franges helicoidals vermelles, blanques i blaves.'},
  souvenir:{accent:'#aa7549',frame:'#d8c19a',awning:'#d0ae68',description:'Botiga de records catalans amb senyeres, barretines, porrons i ceràmica.'},
  vegetables:{accent:'#487c4b',frame:'#b8bc88',awning:'#83a66e',description:'Verduleria amb caixes d’enciams, pastanagues, albergínies i porros als aparadors.'},
  optician:{accent:'#387e89',frame:'#bdd1ce',awning:'#80b2b8',description:'Òptica amb ulleres exposades, miralls i un distintiu d’ulleres a la porta.'},
  bookshop:{accent:'#53697b',frame:'#c7b38e',awning:'#718b9c',description:'Llibreria amb prestatgeries de llibres de colors i exemplars exposats.'},
  patisserie:{accent:'#a9657c',frame:'#e2b9b6',awning:'#d19aaa',description:'Pastisseria amb pastissos, tartaletes i dolços als aparadors.'},
  hardware:{accent:'#546b5b',frame:'#b4b69a',awning:'#879b77',description:'Ferreteria amb eines penjades, pots de pintura i capses.'},
  hairdresser:{accent:'#785c87',frame:'#cebfd6',awning:'#a28bb1',description:'Perruqueria amb miralls, cadires, productes i un distintiu de tisores.'},
};

/** Shallow shop façades, shared by ground floors and accessible upper floors. */
export function renderSpecialShop(business,face){
  const style=SPECIAL_SHOPS[business.type];
  const box=(color,u,h,v,sx,sy,sz)=>face('box',color,u,h,v,sx,sy,sz);
  box(style.frame,0,.30,.654,1.10,.58,.04);
  box(style.accent,0,.29,.683,.35,.54,.028);
  box('#94b3b1',0,.35,.706,.26,.35,.019);
  box('#ecdfb7',.108,.28,.725,.022,.055,.013);
  box('#eee4d1',0,.026,.74,.39,.052,.18);
  box(style.accent,0,.765,.684,1.10,.17,.045);
  for(const p of businessSignPixels(businessSignName(business),1.02))box('#fff3dc',p.x,.765+p.y,.713,p.size,p.size,.011);
  for(let i=0;i<10;i++){
    const color=i%2?'#f1e7d5':style.awning,u=(i-4.5)*.112;
    box(color,u,.65,.825,.113,.035,.32);box(color,u,.608,.98,.113,.06,.018);
  }
  for(const [side,u] of [[0,-.39],[1,.39]]){
    box('#394f52',u,.35,.685,.31,.46,.028);
    for(const ox of [-.164,.164])box(style.frame,u+ox,.35,.720,.024,.48,.05);
    box(style.accent,u,.102,.746,.32,.10,.12);
    if(business.type==='bookshop'){
      for(let tier=0;tier<3;tier++){
        const h=.16+tier*.143;box('#b99b70',u,h,.752,.32,.018,.12);
        if(side===0||tier===0){
          for(let col=0;col<5;col++){
            const x=u+(col-2)*.056,height=.076+((col+tier)%3)*.011;
            box(['#c37953','#6c96ad','#b99b49','#8c719f','#7c9667'][(col+tier+side)%5],x,h+.010+height/2,.765,.043,height,.060);
            box('#e9d8aa',x,h+.026,.799,.027,.006,.008);
          }
        }else{
          for(const offset of [-.075,.075]){
            box('#ece2c6',u+offset,h+.052,.762,.12,.09,.025);
            box(tier===1?'#b97152':'#5d8399',u+offset,h+.052,.782,.113,.09,.013);
            box('#e5d5a9',u+offset,h+.069,.792,.074,.012,.006);
            box('#e5d5a9',u+offset,h+.037,.792,.050,.006,.006);
          }
        }
      }
    }else if(business.type==='patisserie'){
      for(let tier=0;tier<2;tier++){
        const h=.18+tier*.21;box('#cbbda9',u,h-.017,.756,.32,.026,.13);
        for(const offset of [-.077,.077]){
          const x=u+offset;face('cylinder','#f5e6ce',x,h,.770,.138,.014,.115);
          face('cylinder',side?'#bf815f':'#d9b082',x,h+.039,.77,.107,.068,.089);
          face('cylinder',side?'#7d5149':'#f3d6b9',x,h+.074,.77,.112,.018,.094);
          if(tier===1&&!side){face('cylinder','#efd3b2',x,h+.098,.77,.069,.033,.063);face('sphere','#b65364',x,h+.126,.77,.027,.023,.025);}
          else for(const ox of [-.025,0,.025])face('sphere',side?'#efc98c':'#b65364',x+ox,h+.092,.78,.024,.022,.024);
        }
      }
    }else if(business.type==='hardware'){
      if(side===0){
        box('#baaa84',u,.37,.735,.30,.40,.025);
        for(let r=0;r<5;r++)for(let c=0;c<5;c++)box('#817957',u+(c-2)*.054,.22+r*.072,.752,.009,.009,.007);
        for(const offset of [-.095,0,.095]){
          box('#9b7151',u+offset,.38,.78,.021,.18,.017);
          box('#aab6b5',u+offset,.47,.785,.076,.035,.024);
        }
        box('#b7c1bd',u,.255,.785,.24,.034,.018);
        for(let tooth=0;tooth<8;tooth++)box('#b7c1bd',u-.105+tooth*.03,.232,.785,.014,.022,.018);
        box('#886448',u+.115,.26,.794,.025,.067,.025);
      }else{
        for(let tier=0;tier<3;tier++){
          const h=.16+tier*.14;box('#a5a592',u,h,.75,.32,.02,.12);
          for(const offset of [-.077,.077]){
            if(tier<2){face('cylinder','#c4c9bf',u+offset,h+.049,.77,.100,.083,.085);face('cylinder','#8c9b98',u+offset,h+.093,.77,.105,.010,.09);box(tier?'#b98c52':'#6f9487',u+offset,h+.052,.816,.079,.032,.008);}
            else {box('#ae8759',u+offset,h+.054,.769,.115,.083,.07);box('#ead6ad',u+offset,h+.054,.809,.062,.020,.009);}
          }
        }
      }
    }else if(business.type==='souvenir'){
      for(const h of [.16,.365])box('#b09162',u,h,.75,.32,.020,.13);
      if(side===0){
        // A miniature senyera: exactly four red stripes on a yellow field.
        box('#e1bb4d',u,.463,.753,.26,.15,.018);
        for(let stripe=0;stripe<4;stripe++)box('#bd4b40',u,.413+stripe*.033,.767,.26,.016,.008);
        for(const offset of [-.074,.074]){
          face('sphere','#deb58b',u+offset,.270,.785,.043,.043,.037);
          box('#d8d0b7',u+offset,.227,.779,.042,.047,.032);
          face('sphere','#b94442',u+offset-.005,.294,.786,.060,.035,.038);
          box('#4a4c46',u+offset,.278,.803,.049,.009,.009);
          box('#403f3b',u+offset,.190,.780,.046,.025,.031);
        }
      }else{
        for(const offset of [-.075,.075]){
          // Glass porrò, with a neck and projecting thin spout.
          face('cone','#91b8a5',u+offset,.226,.774,.086,.106,.073);
          face('cylinder','#8baf9f',u+offset,.289,.774,.025,.060,.024);
          for(let step=0;step<4;step++)box('#91b8a5',u+offset+.035+step*.007,.237+step*.012,.78,.012,.02,.012);
          face('cylinder','#b78d5a',u+offset,.322,.774,.028,.012,.025);
          face('ring','#e6d7b4',u+offset,.441,.772,.108,.108,.025);
          face('sphere','#6591ac',u+offset,.441,.782,.075,.075,.014);
          box('#efd89e',u+offset,.441,.794,.039,.039,.005);
        }
      }
    }else if(business.type==='vegetables'){
      for(let tier=0;tier<3;tier++){
        const h=.16+tier*.142;box('#a98a58',u,h,.759,.32,.032,.13);
        for(const end of [-1,1])box('#c5a16b',u+end*.154,h+.031,.77,.020,.052,.12);
        box('#c5a16b',u,h+.010,.826,.32,.028,.016);
        for(const offset of [-.077,.077]){
          const x=u+offset;
          if((tier+side)%4===0){for(const ox of [-.024,0,.024])face('sphere',ox===0?'#90b55f':'#6c9b4f',x+ox,h+.063,.783,.052,.063,.045);}
          else if((tier+side)%4===1){for(const ox of [-.022,.022]){face('carrot','#df9947',x+ox,h+.052,.779,.037,.077,.035);box('#639452',x+ox,h+.099,.78,.022,.027,.017);}}
          else if((tier+side)%4===2){face('sphere','#735579',x,h+.058,.784,.047,.089,.041);box('#689154',x,h+.103,.784,.033,.019,.026);}
          else {for(const ox of [-.024,0,.024]){box('#e0dbc0',x+ox,h+.038,.78,.017,.046,.022);box('#60924e',x+ox,h+.081,.78,.022,.048,.022);}}
        }
      }
    }else if(business.type==='optician'){
      for(let tier=0;tier<3;tier++){
        const h=.185+tier*.139;box('#b7c6bd',u,h-.029,.759,.32,.015,.12);
        for(const offset of [-.075,.075]){
          const x=u+offset,color=tier===0?'#6c5446':tier===1?'#384c64':'#b99a61';
          box('#dfddc8',x,h-.012,.77,.103,.022,.048);
          for(const eye of [-1,1])face('ring',color,x+eye*.026,h+.020,.799,.047,.038,.009);
          box(color,x,h+.023,.799,.013,.009,.009);
          for(const edge of [-1,1])box(color,x+edge*.053,h+.021,.781,.010,.01,.043);
        }
      }
    }else{
      // The mirror and hydraulic chair are visible from the street through each bay.
      box('#cfc1d9',u,.405,.732,.258,.31,.031);
      box('#b7d4d8',u,.410,.753,.209,.255,.014);
      box('#edf4ed',u-.061,.424,.763,.013,.19,.005);
      box('#b7bcc0',u,.137,.789,.18,.035,.12);
      face('cylinder','#929da4',u,.201,.789,.030,.12,.030);
      box(business.type==='barber'?'#884f47':'#745581',u,.27,.797,.19,.055,.12);
      box(business.type==='barber'?'#884f47':'#745581',u,.334,.838,.19,.14,.026);
      for(const offset of [-.112,.112]){box('#a6b3b6',u+offset,.284,.795,.014,.096,.020);box(business.type==='barber'?'#884f47':'#745581',u+offset,.334,.795,.033,.027,.116);}
      box('#a394ac',u,.556,.745,.30,.018,.08);
      for(let i=0;i<3;i++){box(['#91b5ba','#d2a9b8','#b4c18e'][i],u+(i-1)*.077,.580,.758,.045,.038,.034);box('#e0d9cb',u+(i-1)*.077,.603,.758,.026,.009,.026);}
    }
  }
  if(business.type==='barber'){
    // A real cylindrical barber pole, with two helical coloured ribbons.
    box('#655f53',.554,.268,.762,.043,.026,.14);box('#655f53',.554,.54,.762,.043,.026,.14);
    face('cylinder','#f4eee0',.554,.402,.831,.095,.26,.095);
    face('barberPoleRed','#bb4545',.554,.402,.831,.095,.26,.095);
    face('barberPoleBlue','#426f9e',.554,.402,.831,.095,.26,.095);
    for(const h of [.262,.542])face('cylinder','#aaa694',.554,h,.831,.116,.026,.116);
    face('sphere','#e4ddc7',.554,.573,.831,.067,.049,.067);
  }
  if(business.type==='optician'){
    for(const side of [-1,1])face('ring','#f4e4b9',side*.055,.425,.732,.093,.071,.010);
    box('#f4e4b9',0,.433,.732,.026,.010,.010);
  }
  if(business.type==='hairdresser'){
    for(const side of [-1,1]){
      face('ring','#f4e2ad',side*.040,.365,.733,.050,.061,.009);
      for(let i=0;i<5;i++)box('#f4e2ad',side*(.033-i*.013),.403+i*.015,.734,.016,.023,.009);
    }
  }
}
