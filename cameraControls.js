'use strict';

// VisionCamera 4.x physical-device identifiers. Only offer a lens that the
// discovered camera devices actually support.
const LENSES=['auto','ultra-wide-angle-camera','wide-angle-camera','telephoto-camera'];
function availableLenses(devices,facing) {
  const list=Array.isArray(devices)?devices:[];
  return LENSES.filter(lens=>lens==='auto'||list.some(device=>
    device&&device.position===facing&&Array.isArray(device.physicalDevices)&&
    device.physicalDevices.includes(lens)));
}
function clampZoom(value,device) {
  const min=Number.isFinite(device?.minZoom)?Math.max(0.1,device.minZoom):1;
  const max=Number.isFinite(device?.maxZoom)?Math.max(min,Math.min(8,device.maxZoom)):8;
  const requested=Number.isFinite(Number(value))?Number(value):1;
  return Math.min(max,Math.max(min,requested));
}
function nextCameraPrefs(previous,patch,devices) {
  const {cleanCameraPrefs}=require('./sessionStore');
  const candidate=cleanCameraPrefs({...previous,...patch});
  const supported=availableLenses(devices,candidate.facing);
  if (!supported.includes(candidate.lens)) candidate.lens='auto';
  return candidate;
}
module.exports={LENSES,availableLenses,clampZoom,nextCameraPrefs};
