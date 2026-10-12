'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSessionStore,normalizeDocument,cleanCameraPrefs}=require('../sessionStore');
const {availableLenses,clampZoom,nextCameraPrefs}=require('../cameraControls');

const KEY='spinecare.local.v1';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function mockStorage(initial=null) {
  let raw=initial;
  const writes=[];
  return {
    getItem:async()=>{await pause(2);return raw},
    setItem:async(_key,value)=>{await pause(4);raw=value;writes.push(JSON.parse(value))},
    contents:()=>raw,
    writes
  };
}
const sample=(id)=>({id,date:new Date(1791760000000+Number(id)).toISOString(),
  durationSeconds:51,sets:2,exerciseIds:['neck-placeholder'],
  poseTrace:[{t:0,points:[{i:11,x:0.42,y:0.38,v:1},{i:12,x:0.59,y:0.38,v:1}]}],
  poseView:0,cameraPrefs:{facing:'front',orientation:'portrait',lens:'auto',zoom:1}});

test('multiple fast session saves and a concurrent language update never overwrite history',async()=>{
  const adapter=mockStorage();const store=createSessionStore(adapter,KEY);
  await store.load();
  const p1=store.appendSession(sample(1));
  const p2=store.update({lang:'ro',cameraPrefs:cleanCameraPrefs({orientation:'landscape',zoom:2})});
  const p3=store.appendSession(sample(2));
  await Promise.all([p1,p2,p3]);
  const reopened=createSessionStore(adapter,KEY);
  const doc=await reopened.load();
  assert.deepEqual(doc.history.map(h=>h.id),['2','1']);
  assert.equal(doc.history[0].poseTrace[0].points.length,2);
  assert.equal(doc.lang,'ro');
  assert.equal(doc.cameraPrefs.orientation,'landscape');
  assert.equal(doc.cameraPrefs.zoom,2);
  assert.equal(adapter.writes.length,3);
});
test('saved session is confirmed only after the underlying write settles',async()=>{
  let unblock;
  const adapter={getItem:async()=>null,setItem:()=>new Promise(resolve=>{unblock=resolve})};
  const store=createSessionStore(adapter,KEY);await store.load();
  let committed=false;
  const saved=store.appendSession(sample(3)).then(()=>{committed=true});
  await pause(5);assert.equal(committed,false);
  assert.equal(store.get().history[0].id,'3');
  unblock();await saved;assert.equal(committed,true);
});
test('failed write rejects and next queued update can recover persisted snapshot',async()=>{
  let fail=true,raw=null;
  const adapter={getItem:async()=>raw,setItem:async(k,v)=>{if(fail){fail=false;throw Error('storage quota exceeded')}raw=v}};
  const store=createSessionStore(adapter,KEY);await store.load();
  await assert.rejects(store.appendSession(sample(4)),/storage quota/);
  await store.update({lang:'ro'});
  const reopened=createSessionStore(adapter,KEY);const d=await reopened.load();
  assert.equal(d.history[0].id,'4');assert.equal(d.lang,'ro');
});

test('retrying a session with the same ID replaces the earlier pending entry instead of duplicating it',async()=>{
  let failed=true,raw=null;
  const backend={getItem:async()=>raw,setItem:async(k,v)=>{if(failed){failed=false;throw Error('temporary failure')}raw=v}};
  const store=createSessionStore(backend,KEY);await store.load();
  await assert.rejects(store.appendSession(sample(10)),/temporary failure/);
  await store.appendSession({...sample(10),sets:4});
  const loaded=await createSessionStore(backend,KEY).load();
  assert.equal(loaded.history.length,1);
  assert.equal(loaded.history[0].id,'10');
  assert.equal(loaded.history[0].sets,4);
});

test('saved legacy sessions without traces remain reviewable',async()=>{
  const adapter=mockStorage(JSON.stringify({plan:[],history:[{id:'legacy',date:'2026-10-11T10:00:00Z',durationSeconds:14,sets:1}]}));
  const store=createSessionStore(adapter,KEY);const doc=await store.load();
  assert.equal(doc.history.length,1);assert.deepEqual(doc.history[0].poseTrace,[]);
  await store.appendSession(sample(5));
  const loaded=await createSessionStore(adapter,KEY).load();
  assert.equal(loaded.history.length,2);
});
test('draft capture survives restart, then completion clears draft and preserves landmarks',async()=>{
  const adapter=mockStorage();const store=createSessionStore(adapter,KEY);await store.load();
  await store.update({draftSession:{startedAt:1791760000000,selected:'neck-placeholder',
    exerciseIds:['neck-placeholder'],sets:1,poseTrace:sample(6).poseTrace}});
  const reopened=createSessionStore(adapter,KEY);
  const draft=(await reopened.load()).draftSession;
  assert.equal(draft.poseTrace[0].points.length,2);
  await reopened.appendSession({...sample(6),poseTrace:draft.poseTrace});
  const final=await createSessionStore(adapter,KEY).load();
  assert.equal(final.draftSession,null);
  assert.equal(final.history[0].poseTrace[0].points.length,2);
});
test('clear all progress saves empty history while leaving exercise plan and preferences',async()=>{
  const adapter=mockStorage();const store=createSessionStore(adapter,KEY);await store.load();
  await store.update({plan:['neck-placeholder'],cameraPrefs:cleanCameraPrefs({orientation:'landscape'})});
  await store.appendSession(sample(7));await store.appendCheckin({id:'check',date:'2026-10-11T10:00:00Z',score:3,phase:'after'});
  await store.clearHistory();const d=await createSessionStore(adapter,KEY).load();
  assert.equal(d.history.length,0);assert.equal(d.checkins.length,0);
  assert.deepEqual(d.plan,['neck-placeholder']);assert.equal(d.cameraPrefs.orientation,'landscape');
});
test('malformed landmark samples are filtered safely for review',()=>{
  const doc=normalizeDocument({history:[{...sample(9),
    poseTrace:[{t:2,points:[{i:11,x:-1,y:0.3},{i:12,x:0.5,y:0.5,v:1}]}]}]});
  assert.equal(doc.history[0].poseTrace[0].points.length,1);
});
test('available lenses are device-dependent and zoom is clamped to hardware capabilities',()=>{
  const devices=[{position:'front',physicalDevices:['wide-angle-camera']},
    {position:'back',physicalDevices:['wide-angle-camera','ultra-wide-angle-camera'],minZoom:0.5,maxZoom:4},
    {position:'back',physicalDevices:['telephoto-camera'],minZoom:1,maxZoom:8}];
  assert.deepEqual(availableLenses(devices,'front'),['auto','wide-angle-camera']);
  assert.deepEqual(availableLenses(devices,'back'),['auto','ultra-wide-angle-camera','wide-angle-camera','telephoto-camera']);
  assert.equal(clampZoom(6,{minZoom:0.5,maxZoom:4}),4);
  assert.equal(clampZoom(.3,{minZoom:0.5,maxZoom:4}),.5);
  assert.equal(nextCameraPrefs({facing:'back',lens:'telephoto-camera',zoom:2},
    {facing:'front'},devices).lens,'auto');
});
