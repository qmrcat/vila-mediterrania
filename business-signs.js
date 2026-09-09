/** Shared, DOM-free lettering for business façades. Catalan accents stay visible. */
export const BUSINESS_NAMES={bar:'Bar',greengrocer:'Fruiteria',restaurant:'Restaurant',grocery:'Queviures',newsstand:'Premsa',florist:'Floristeria',pharmacy:'Farmàcia',fishmonger:'Peixateria',bakery:'Fleca',butcher:'Carnisseria',bookshop:'Llibreria',patisserie:'Pastisseria',hardware:'Ferreteria',hairdresser:'Perruqueria',barber:'Barberia',souvenir:'Records',vegetables:'Verduleria',optician:'Òptica'};
export const MAX_BUSINESS_NAME=24;
const FONT={
 A:'010/101/111/101/101',B:'110/101/110/101/110',C:'111/100/100/100/111',D:'110/101/101/101/110',E:'111/100/110/100/111',F:'111/100/110/100/100',
 G:'111/100/101/101/111',H:'101/101/111/101/101',I:'111/010/010/010/111',J:'001/001/001/101/111',K:'101/101/110/101/101',L:'100/100/100/100/111',
 M:'101/111/111/101/101',N:'101/111/111/111/101',O:'111/101/101/101/111',P:'110/101/110/100/100',Q:'111/101/101/111/001',R:'110/101/110/101/101',
 S:'111/100/111/001/111',T:'111/010/010/010/010',U:'101/101/101/101/111',V:'101/101/101/101/010',W:'101/101/111/111/101',X:'101/101/010/101/101',Y:'101/101/010/010/010',Z:'111/001/010/100/111',
 '0':'111/101/101/101/111','1':'010/110/010/010/111','2':'110/001/010/100/111','3':'110/001/010/001/110','4':'101/101/111/001/001','5':'111/100/110/001/110','6':'011/100/111/101/111','7':'111/001/010/010/010','8':'111/101/111/101/111','9':'111/101/111/001/110',
 ' ':'000/000/000/000/000',"'":'010/010/000/000/000','’':'010/010/000/000/000','·':'000/000/010/000/000','-':'000/000/111/000/000','.':'000/000/000/000/010',',':'000/000/000/010/100',':':'000/010/000/010/000','!':'010/010/010/000/010','?':'110/001/010/000/010','&':'010/101/010/101/011','/':'001/001/010/100/100','(':'001/010/010/010/001',')':'100/010/010/010/100'
};
const MARKS={'\u0300':[[0,0],[1,1]],'\u0301':[[2,0],[1,1]],'\u0302':[[1,0],[0,1],[2,1]],'\u0303':[[0,0],[1,0],[1,1],[2,1]],'\u0308':[[0,0],[2,0]],'\u030a':[[1,0],[0,1],[2,1]],'\u0327':[[1,7],[0,8]]};
export function normalizeBusinessName(value){
 if(typeof value!=='string')throw new Error('El nom del rètol ha de ser un text.');
 const name=value.normalize('NFC').trim().replace(/ +/g,' ');
 if([...name].length>MAX_BUSINESS_NAME)throw new Error('El rètol pot tenir com a màxim 24 caràcters.');
 for(const letter of name.toUpperCase()){
  const [base,...marks]=[...letter.normalize('NFD')];
  if(!FONT[base]||marks.some(mark=>!MARKS[mark]))throw new Error('Fes servir lletres, accents, números, espais o puntuació senzilla al rètol.');
 }
 return name;
}
export const businessSignName=business=>business.name||BUSINESS_NAMES[business.type];
/** Centered pixel coordinates, sized to fit the whole sign in any orientation. */
export function businessSignPixels(text,width=.98,height=.125){
 const name=normalizeBusinessName(text).toUpperCase(),pixels=[];
 [...name].forEach((letter,i)=>{
  const [base,...marks]=[...letter.normalize('NFD')];
  FONT[base].split('/').forEach((row,y)=>[...row].forEach((value,x)=>{if(value==='1')pixels.push({x:i*4+x,y:y+2});}));
  for(const mark of marks)for(const [x,y] of MARKS[mark])pixels.push({x:i*4+x,y});
 });
 if(!pixels.length)return [];
 const minY=Math.min(...pixels.map(p=>p.y)),maxY=Math.max(...pixels.map(p=>p.y));
 const columns=name.length*4-1,rows=maxY-minY+1,step=Math.min(.025,width/columns,height/rows);
 return pixels.map(p=>({x:(p.x-(columns-1)/2)*step,y:((minY+maxY)/2-p.y)*step,size:step*.87}));
}
