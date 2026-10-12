'use strict';

// Shared by the React Native app and Node tests. Serialized document updates
// prevent an older settings/check-in write from overwriting a saved session.
const MAX_HISTORY = 100;
const MAX_TRACE = 180;

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function cleanCameraPrefs(value) {
  const source = isObject(value) ? value : {};
  const facing = ['front','back'].includes(source.facing) ? source.facing : 'front';
  const orientation = ['portrait','landscape'].includes(source.orientation) ? source.orientation : 'portrait';
  const lens = ['auto','wide-angle-camera','ultra-wide-angle-camera','telephoto-camera'].includes(source.lens) ? source.lens : 'auto';
  const zoom = Number.isFinite(Number(source.zoom)) ? Math.min(8, Math.max(0.5, Number(source.zoom))) : 1;
  return {facing,orientation,lens,zoom};
}
function safeTrace(frames) {
  if (!Array.isArray(frames)) return [];
  return frames.slice(0, MAX_TRACE).filter(isObject).map(frame=>({
    t: Math.max(0, Number.isFinite(Number(frame.t)) ? Number(frame.t) : 0),
    points: (Array.isArray(frame.points) ? frame.points : []).filter(p=>
      isObject(p)&&Number.isInteger(p.i)&&p.i>=0&&p.i<=32&&
      Number.isFinite(p.x)&&Number.isFinite(p.y)&&
      p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1
    ).slice(0,33).map(p=>({i:p.i,x:p.x,y:p.y,v:Number.isFinite(p.v)?p.v:1}))
  }));
}
function normalizeSession(item) {
  if (!isObject(item) || !item.id || !item.date) return null;
  return {...item,id:String(item.id),date:String(item.date),
    durationSeconds:Math.max(0,Math.floor(Number(item.durationSeconds)||0)),
    sets:Math.max(0,Math.floor(Number(item.sets)||0)),
    poseTrace:safeTrace(item.poseTrace),
    exerciseIds:Array.isArray(item.exerciseIds)?item.exerciseIds.filter(x=>typeof x==='string'):[]};
}
function initialDocument() {
  return {plan:[],history:[],checkins:[],customExercises:[],settings:{},
    cameraPrefs:cleanCameraPrefs(null),draftSession:null,lang:'en'};
}
function normalizeDocument(value) {
  const doc=isObject(value)?value:{};
  const validHistory=(Array.isArray(doc.history)?doc.history:[])
    .map(normalizeSession).filter(Boolean).slice(0,MAX_HISTORY);
  const d=isObject(doc.draftSession)?doc.draftSession:null;
  const draft=d&&Number.isFinite(Number(d.startedAt))&&Number(d.startedAt)>0
    ? {...d,startedAt:Number(d.startedAt),sets:Math.max(0,Math.floor(Number(d.sets)||0)),
      exerciseIds:Array.isArray(d.exerciseIds)?d.exerciseIds.filter(x=>typeof x==='string'):[],
      poseTrace:safeTrace(d.poseTrace)}:null;
  return {plan:Array.isArray(doc.plan)?doc.plan.filter(x=>typeof x==='string'):[],
    history:validHistory,
    checkins:Array.isArray(doc.checkins)?doc.checkins.filter(isObject).slice(0,MAX_HISTORY):[],
    customExercises:Array.isArray(doc.customExercises)?doc.customExercises.filter(isObject):[],
    settings:isObject(doc.settings)?doc.settings:{},
    cameraPrefs:cleanCameraPrefs(doc.cameraPrefs),draftSession:draft,
    lang:doc.lang==='ro'?'ro':'en'};
}
function createSessionStore(storage,key) {
  if (!storage || typeof storage.getItem!=='function' || typeof storage.setItem!=='function')
    throw new Error('Session storage must support getItem/setItem');
  let doc=initialDocument();
  let ready=false;
  let chain=Promise.resolve();
  const get=()=>JSON.parse(JSON.stringify(doc));
  async function load() {
    if (ready) return get();
    const raw=await storage.getItem(key);
    doc=normalizeDocument(raw?JSON.parse(raw):null);
    ready=true;
    return get();
  }
  function update(patch) {
    if (!ready) return Promise.reject(new Error('Session storage not ready'));
    if (!isObject(patch)) return Promise.reject(new Error('Invalid storage patch'));
    doc=normalizeDocument({...doc,...patch});
    // Snapshot at call time; writes happen one at a time in the same order.
    const payload=JSON.stringify(doc);
    chain=chain.catch(()=>{}).then(()=>storage.setItem(key,payload));
    return chain.then(get);
  }
  function appendSession(session) {
    const valid=normalizeSession(session);
    if (!valid) return Promise.reject(new Error('Invalid session'));
    return update({history:[valid,...doc.history].slice(0,MAX_HISTORY),draftSession:null});
  }
  function appendCheckin(checkin) {
    if (!isObject(checkin)) return Promise.reject(new Error('Invalid check-in'));
    return update({checkins:[checkin,...doc.checkins].slice(0,MAX_HISTORY)});
  }
  function clearHistory() {return update({history:[],checkins:[],draftSession:null});}
  return {load,get,update,appendSession,appendCheckin,clearHistory,flush:()=>chain,
    isReady:()=>ready};
}
module.exports={createSessionStore,initialDocument,normalizeDocument,normalizeSession,cleanCameraPrefs,safeTrace};
