/** Background audio stays separate from village data and undo history. */
export const MUSIC_KEY='vila-mediterrania:music:v1';
export const AUDIO_FILE=/\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
export function musicPreferences(storage){
  try{const p=JSON.parse(storage?.getItem(MUSIC_KEY)||'{}');return {enabled:p.enabled!==false,paused:p.paused===true,shuffle:p.shuffle===true,volume:Number.isFinite(p.volume)?Math.max(0,Math.min(1,p.volume)):.3};}
  catch{return {enabled:true,paused:false,shuffle:false,volume:.3};}
}
export function manifestTracks(entries){
  if(!Array.isArray(entries))return [];
  return entries.filter(p=>typeof p==='string'&&AUDIO_FILE.test(p)&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(s=>!s||s==='.'||s==='..')).map(p=>({name:p.split('/').at(-1),url:'./music/'+p.split('/').map(encodeURIComponent).join('/')}));
}
export class MusicPlayer{
  constructor({audio,storage,onChange=()=>{},revokeURL=()=>{},random=Math.random}){
    this.audio=audio;this.storage=storage;this.onChange=onChange;this.revokeURL=revokeURL;this.random=random;
    this.preferenceWarning=storage?'':'Aquest navegador no permet recordar les preferències.';
    this.preferences=musicPreferences(storage);this.audio.volume=this.preferences.volume;this.audio.preload='metadata';
    this.tracks=[];this.index=0;this.failed=new Set();this.shuffleQueue=[];this.generation=0;this.status='empty';this.message='Escull una carpeta amb música.';
    this.audio.addEventListener('ended',()=>{if(this.wantsPlay())this.next();});
    this.audio.addEventListener('error',()=>this.skipFailed());
    this.audio.addEventListener('playing',()=>{if(!this.wantsPlay()){this.audio.pause();return;}this.status='playing';this.message='Sonant';this.emit();});
  }
  wantsPlay(){return this.preferences.enabled&&!this.preferences.paused;}
  emit(){this.onChange(this);}
  save(){try{if(!this.storage)throw new Error('storage');this.storage.setItem(MUSIC_KEY,JSON.stringify(this.preferences));this.preferenceWarning='';}catch{this.preferenceWarning='No s’han pogut recordar les preferències en aquest navegador.';}this.emit();}
  setTracks(tracks){
    this.generation++;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();
    for(const t of this.tracks)if(t.temporary)this.revokeURL(t.url);
    this.tracks=tracks;this.index=0;this.failed.clear();this.shuffleQueue=[];this.status=tracks.length?'ready':'empty';
    this.message=tracks.length?'Música preparada.':'No s’han trobat àudios en aquesta carpeta.';
    if(tracks.length){
      if(this.preferences.shuffle){this.fillShuffleQueue();this.index=this.shuffleQueue.shift();}
      this.audio.src=tracks[this.index].url;if(this.wantsPlay())void this.play();
    }
    this.emit();
  }
  async play(){
    if(!this.wantsPlay()||!this.tracks.length||this.failed.size===this.tracks.length)return;
    const generation=++this.generation;this.status='loading';this.message='Carregant la pista…';this.emit();
    try{
      await this.audio.play();
      if(generation!==this.generation)return;
      if(!this.wantsPlay()){this.audio.pause();return;}
      this.status='playing';this.message='Sonant';this.emit();
    }catch(error){
      if(generation!==this.generation||!this.wantsPlay())return;
      if(error.name==='NotAllowedError'){this.status='blocked';this.message='Prem Reprodueix o fes clic al joc per començar.';this.emit();}
      else if(error.name!=='AbortError')this.skipFailed();
    }
  }
  resume(){if(this.status==='error')this.audio.load();this.preferences.enabled=true;this.preferences.paused=false;this.failed.clear();this.save();void this.play();}
  pause(){this.generation++;this.preferences.paused=true;this.audio.pause();this.status='paused';this.message='En pausa';this.save();}
  setEnabled(enabled){
    this.generation++;this.preferences.enabled=enabled;
    if(!enabled){this.audio.pause();this.status='off';this.message='Música desactivada';}
    else if(this.preferences.paused){this.status='paused';this.message='En pausa';}
    this.save();if(this.wantsPlay()){this.failed.clear();void this.play();}
  }
  setVolume(volume){if(!Number.isFinite(volume))return;this.preferences.volume=Math.max(0,Math.min(1,volume));this.audio.volume=this.preferences.volume;this.save();}
  fillShuffleQueue(exclude=-1,last=-1){
    // Fisher–Yates: consume the whole bag before creating another round.
    const queue=this.tracks.map((_,i)=>i).filter(i=>i!==exclude&&!this.failed.has(i));
    for(let i=queue.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
    // Never play the last track of a round immediately again, when alternatives exist.
    if(queue.length>1&&queue[0]===last){const j=1+Math.floor(this.random()*(queue.length-1));[queue[0],queue[j]]=[queue[j],queue[0]];}
    this.shuffleQueue=queue;
  }
  setShuffle(shuffle){
    shuffle=Boolean(shuffle);if(shuffle===this.preferences.shuffle)return;
    this.preferences.shuffle=shuffle;
    // Keep the current track playing; it is already part of this first round.
    if(shuffle)this.fillShuffleQueue(this.index);else this.shuffleQueue=[];
    this.save();
  }
  next(){
    if(!this.tracks.length||this.failed.size===this.tracks.length)return;
    this.generation++;this.audio.pause();
    if(this.preferences.shuffle){
      this.shuffleQueue=this.shuffleQueue.filter(i=>!this.failed.has(i));
      if(!this.shuffleQueue.length)this.fillShuffleQueue(-1,this.index);
      this.index=this.shuffleQueue.shift();
    }else{
      for(let n=0;n<this.tracks.length;n++){this.index=(this.index+1)%this.tracks.length;if(!this.failed.has(this.index))break;}
    }
    this.audio.src=this.tracks[this.index].url;
    if(this.wantsPlay())void this.play();else this.emit();
  }
  skipFailed(){
    if(!this.tracks.length||!this.wantsPlay()||this.failed.has(this.index))return;
    this.failed.add(this.index);
    if(this.failed.size===this.tracks.length){this.generation++;this.audio.pause();this.status='error';this.message='No s’ha pogut reproduir cap pista. Tria altres àudios o prem Reprodueix per tornar-ho a provar.';this.emit();return;}
    this.next();
  }
  unlock(){if(this.status==='blocked'&&this.wantsPlay())void this.play();}
  dispose(){this.generation++;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();for(const t of this.tracks)if(t.temporary)this.revokeURL(t.url);this.tracks=[];this.shuffleQueue=[];}
}

export function initMusic(){
  const $=id=>document.getElementById(id);let storage;try{storage=localStorage;}catch{}
  const audio=new Audio();let sourceGeneration=0;
  const player=new MusicPlayer({audio,storage,revokeURL:url=>URL.revokeObjectURL(url),onChange:p=>{
    const playing=p.preferences.enabled&&!p.preferences.paused&&['playing','loading'].includes(p.status);
    $('music-preferences-note').textContent=p.preferenceWarning||'Es recorden l’activació, la pausa, el volum i el mode aleatori en aquest navegador.';
    $('music-enabled').checked=p.preferences.enabled;
    $('music-shuffle').checked=p.preferences.shuffle;
    $('music-play').textContent=playing?'Pausa':'Reprodueix';$('music-play').disabled=!p.tracks.length;
    $('music-next').disabled=p.tracks.length<2;
    $('music-volume').value=String(Math.round(p.preferences.volume*100));$('music-volume-value').textContent=Math.round(p.preferences.volume*100)+'%';
    $('music-track').textContent=p.tracks.length?`${p.index+1} / ${p.tracks.length} · ${p.tracks[p.index].name}`:'Cap pista carregada';
    $('music-status').textContent=!p.preferences.enabled?'Música desactivada':p.preferences.paused?'En pausa':p.message;
    $('music-open').setAttribute('aria-label',!p.preferences.enabled?'Música desactivada: obre els controls':playing?'Música sonant: obre els controls':'Obre els controls de música');
    $('music-open').dataset.playing=String(playing);
  }});
  async function loadMusicFolder(){
    const generation=++sourceGeneration;$('music-source').textContent='Carregant la carpeta del joc…';
    try{
      const response=await fetch('./music/playlist.json',{cache:'no-store'});if(!response.ok)throw new Error('playlist');
      const tracks=manifestTracks(await response.json());if(generation!==sourceGeneration)return;
      $('music-source').textContent='Carpeta music del joc';player.setTracks(tracks);
    }catch{if(generation!==sourceGeneration)return;$('music-source').textContent='Carpeta del joc no disponible. Pots escollir una carpeta del dispositiu.';player.setTracks([]);}
  }
  $('music-open').addEventListener('click',()=>$('music-dialog').showModal());
  $('music-enabled').addEventListener('change',e=>player.setEnabled(e.target.checked));
  $('music-shuffle').addEventListener('change',e=>player.setShuffle(e.target.checked));
  $('music-play').addEventListener('click',()=>{if(player.wantsPlay()&&['playing','loading'].includes(player.status))player.pause();else player.resume();});
  $('music-next').addEventListener('click',()=>player.next());
  $('music-volume').addEventListener('input',e=>player.setVolume(Number(e.target.value)/100));
  $('music-choose').addEventListener('click',()=>$('music-folder').click());
  $('music-folder').addEventListener('change',e=>{
    const selected=[...e.target.files];if(!selected.length)return;sourceGeneration++;
    const files=selected.filter(f=>AUDIO_FILE.test(f.name)).sort((a,b)=>(a.webkitRelativePath||a.name).localeCompare(b.webkitRelativePath||b.name,'ca',{numeric:true}));
    const tracks=files.map(f=>({name:f.name,url:URL.createObjectURL(f),temporary:true}));
    $('music-source').textContent=((selected[0].webkitRelativePath||'').split('/')[0]||'Àudios del dispositiu')+' · torna a escollir la carpeta quan reobris el joc';
    player.setTracks(tracks);e.target.value='';
  });
  $('music-reload').addEventListener('click',loadMusicFolder);
  $('world').addEventListener('pointerdown',()=>player.unlock());$('world').addEventListener('keydown',()=>player.unlock());
  window.addEventListener('pagehide',()=>player.dispose(),{once:true});
  player.emit();void loadMusicFolder();return player;
}
