import test from 'node:test';
import assert from 'node:assert/strict';
import {MusicPlayer,musicPreferences,MUSIC_KEY} from '../music.js';

class FakeAudio extends EventTarget{
  constructor(){super();this.src='';this.currentTime=0;this.playCalls=0;this.paused=true;}
  pause(){this.paused=true;}
  play(){this.playCalls++;this.paused=false;return Promise.resolve();}
  load(){}
  removeAttribute(name){if(name==='src')this.src='';}
}
function storage(value={}){
  const values=new Map([[MUSIC_KEY,JSON.stringify(value)]]);
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
}
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
function setup(count=5,preferences={shuffle:true},random=seeded(1)){
  const audio=new FakeAudio(),saved=storage(preferences),player=new MusicPlayer({audio,storage:saved,random});
  player.setTracks(Array.from({length:count},(_,i)=>({name:`Pista ${i}`,url:`./music/${i}.mp3`})));
  return {player,audio,saved};
}

test('automatic playback visits every track once per round without consecutive repeats across rounds',()=>{
  const firstTracks=new Set();
  for(let seed=1;seed<=30;seed++){
    const {player,audio}=setup(7,{shuffle:true},seeded(seed));
    firstTracks.add(player.index);let last=-1;
    for(let round=0;round<12;round++){
      const seen=new Set();
      for(let n=0;n<7;n++){
        assert(!seen.has(player.index));assert.notEqual(player.index,last);
        seen.add(player.index);last=player.index;audio.dispatchEvent(new Event('ended'));
      }
      assert.equal(seen.size,7);
    }
  }
  assert(firstTracks.size>1,'the first track is also shuffled');
});

test('a round boundary avoids an immediate repeat even with a deliberately unlucky random source',()=>{
  const {player}=setup(3, {shuffle:true},()=>.999);
  player.next();player.next();assert.equal(player.index,2);
  player.random=()=>.4; // Fisher–Yates puts the previous last track first.
  player.next();assert.notEqual(player.index,2);
  const nextRound=[player.index];player.next();nextRound.push(player.index);player.next();nextRound.push(player.index);
  assert.equal(new Set(nextRound).size,3);
});

test('enabling shuffle mid-track keeps playback and excludes the current track until all others have passed',()=>{
  const {player,audio,saved}=setup(5,{shuffle:false});player.next();
  const current=player.index,src=audio.src,calls=audio.playCalls;audio.currentTime=42;
  player.setShuffle(true);assert.equal(audio.src,src);assert.equal(audio.currentTime,42);assert.equal(audio.playCalls,calls);
  const seen=new Set([current]);
  for(let n=0;n<4;n++){player.next();assert(!seen.has(player.index));seen.add(player.index);}
  assert.equal(seen.size,5);assert.equal(musicPreferences(saved).shuffle,true);
  const restored=new MusicPlayer({audio:new FakeAudio(),storage:saved});assert.equal(restored.preferences.shuffle,true);
});

test('pause, disable and resume preserve the remaining queue; manual Next uses the same round',()=>{
  const {player,audio}=setup(5),seen=new Set([player.index]);
  player.next();seen.add(player.index);const queue=[...player.shuffleQueue],current=player.index;
  player.pause();audio.dispatchEvent(new Event('ended'));assert.equal(player.index,current);
  player.resume();player.setEnabled(false);player.setEnabled(true);
  assert.deepEqual(player.shuffleQueue,queue);
  for(let n=0;n<3;n++){player.next();assert(!seen.has(player.index));seen.add(player.index);}
  assert.equal(seen.size,5);
});

test('turning shuffle off restores list order from the current track and persists the preference',()=>{
  const {player,saved}=setup();const current=player.index;
  player.setShuffle(false);assert.equal(player.index,current);player.next();assert.equal(player.index,(current+1)%5);
  assert.equal(musicPreferences(saved).shuffle,false);
  assert.equal(musicPreferences(storage({enabled:false,paused:true,volume:.7})).shuffle,false);
  assert.deepEqual(musicPreferences({getItem:()=>'{broken'}),{enabled:true,paused:false,shuffle:false,volume:.3});
});

test('empty and single-track lists work in both modes',()=>{
  for(const shuffle of [false,true]){
    const empty=setup(0,{shuffle});empty.player.next();assert.equal(empty.audio.src,'');
    const single=setup(1,{shuffle});
    for(let i=0;i<5;i++){single.audio.dispatchEvent(new Event('ended'));assert.equal(single.player.index,0);assert.equal(single.audio.src,'./music/0.mp3');}
  }
});

test('unplayable tracks are skipped and an entirely failed playlist stops without looping',()=>{
  const {player,audio}=setup(4),bad=player.index;audio.dispatchEvent(new Event('error'));
  const good=new Set();
  for(let i=0;i<3;i++){assert.notEqual(player.index,bad);good.add(player.index);audio.dispatchEvent(new Event('ended'));}
  assert.equal(good.size,3);
  for(let i=0;i<3;i++)audio.dispatchEvent(new Event('error'));
  assert.equal(player.status,'error');assert.equal(player.failed.size,4);
  const calls=audio.playCalls;player.next();assert.equal(audio.playCalls,calls);
  player.resume();assert.equal(player.failed.size,0);assert.equal(audio.playCalls,calls+1);
});

test('changing folders discards the old queue and revokes local audio URLs',()=>{
  const {player}=setup(8);const revoked=[];player.revokeURL=url=>revoked.push(url);
  player.setTracks([{name:'Local',url:'blob:local',temporary:true}]);
  player.setTracks([{name:'A',url:'a.mp3'},{name:'B',url:'b.mp3'}]);
  assert.deepEqual(revoked,['blob:local']);const first=player.index;player.next();assert.notEqual(player.index,first);
  assert(player.shuffleQueue.every(i=>i<2));player.dispose();assert.deepEqual(player.shuffleQueue,[]);
});
