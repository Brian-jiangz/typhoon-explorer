'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
require('../assets/land.js');require('../assets/climate-data.js');require('../climate.js');require('../simulation.js');
const m=globalThis.TyphoonModel,c=globalThis.TyphoonClimate,d=globalThis.TYPHOON_CLIMATE,manifest=require('../assets/climate-manifest.json');
const near=(a,b,t=.02)=>assert(Math.abs(a-b)<t,`${a} vs ${b}`);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(require.resolve('../assets/climate-data.js'))).digest('hex'),manifest.artifactSha256);
assert.equal(manifest.period,'1991–2020');assert.equal(manifest.sources.air.units,'degC');
assert.equal(d.shape[0],12);for(const field of ['sst','humidity','du','dv','slp','pi','pmin','outflow','steerU','steerV','lowU','lowV'])assert.equal(d.fields[field].length,d.shape.reduce((a,b)=>a*b));
// Fixed source-profile/PI checkpoints generated independently by the Python tool.
for(const p of manifest.spotChecks){const v=c.at(p.lat,p.lon,p.month);assert(v.valid&&v.piValid);near(v.sst,p.sst);near(v.shear,p.shear);near(v.humidity,p.humidity);near(v.pi,p.pi);near(v.pmin,p.pmin);}
const tropical=c.at(20,140,8),north=c.at(40,150,8),winter=c.at(40,150,1);
assert(tropical.sst>north.sst);assert(tropical.pi>north.pi);assert(north.sst>winter.sst);assert(winter.shear>north.shear);
assert(!c.at(70,150,8).valid);assert(!c.at(20,40,8).valid);
assert.deepEqual(c.at(40,190,8),c.at(40,-170,8));
const cool=c.at(20,140,8,28),warm=c.at(20,140,8,32);assert(cool.piValid&&warm.piValid);assert(warm.pi>cool.pi);assert(warm.pmin<cool.pmin);
assert(!c.at(20,140,8,35).piValid); // no extrapolation beyond the PI temperature lookup
assert(!m.validateGenesis({lat:30,lon:110}).valid);assert.throws(()=>m.createFormation({start:{lat:30,lon:110}}),RangeError);
const a=m.createFormation({start:{lat:20,lon:140}}),b=m.createFormation({start:{lat:20,lon:140}});
assert.equal(a.history.length,1);assert.equal(m.readFormation(a,120).h,0);assert.equal(a.history.length,1);
assert.equal(a.adjustments.sst,0);assert.equal(a.adjustments.humidity,0);assert.equal(a.adjustments.shear,0);
m.advanceFormation(a,120);for(let h=.1;h<120;h+=.37)m.advanceFormation(b,h);m.advanceFormation(b,120);assert.deepEqual(a.history,b.history);assert.equal(a.history.length,481);
const count=a.history.length;m.readFormation(a,12.125);m.advanceFormation(a,5);assert.equal(a.history.length,count);
assert(a.history.at(-1).v>a.initialWind);assert.equal(a.history[0].v,8);
const strong=m.createFormation({start:{lat:40,lon:150},month:8,initialWind:50});m.advanceFormation(strong,48);
assert(strong.history[1].v<50&&strong.history[1].v>49);assert(strong.history[96].v<20);assert(strong.history.at(-1).v<10);
for(let i=1;i<strong.history.length;i++)assert(strong.history[i].v<=strong.history[i-1].v);
for(const environment of [{humidity:30},{shear:40},{sst:20},{seed:0}]){const run=m.createFormation({start:{lat:20,lon:140},environment});m.advanceFormation(run,48);assert(run.history.at(-1).v<8,JSON.stringify(environment));}
const equator=m.createFormation({start:{lat:0,lon:160}});m.advanceFormation(equator,24);assert(equator.history.at(-1).v<=8);
const land=m.createFormation({start:{lat:22,lon:120},initialWind:40});m.advanceFormation(land,120);assert(land.landfall);assert(land.history.at(-1).landHours>0);
for(let i=1;i<land.history.length;i++)if(land.history[i].onLand)assert(land.history[i].v<=land.history[i-1].v);
// Actual SI wind-to-angle conversion, with intensity-dependent steering depth.
for(const initialWind of [8,50]){const run=m.createFormation({start:{lat:20,lon:140},initialWind}),velocity=m.formationVelocity(20,140,run),flow=c.flowAt(20,140,8),deep=initialWind===50;near(velocity.lon*Math.PI/180*6371000*Math.cos(20*Math.PI/180)/3600,deep?flow.u:flow.lowU,1e-10);near(velocity.lat*Math.PI/180*6371000/3600,deep?flow.v:flow.lowV,1e-10);}
const fine=m.createFormation({start:{lat:20,lon:140}}),coarse=m.createFormation({start:{lat:20,lon:140}});fine.step=.125;m.advanceFormation(fine,48);m.advanceFormation(coarse,48);const fineEnd=fine.history.at(-1),coarseEnd=coarse.history.at(-1);assert(Math.hypot(fineEnd.lat-coarseEnd.lat,fineEnd.lon-coarseEnd.lon)<.005);assert(Math.abs(fineEnd.v-coarseEnd.v)<.05);
const old=m.keys[2].v;m.keys[2].v=0;const independent=m.createFormation({start:{lat:20,lon:140}});m.advanceFormation(independent,120);assert.deepEqual(independent.history,a.history);m.keys[2].v=old;
const saved=globalThis.TYPHOON_CLIMATE;delete globalThis.TYPHOON_CLIMATE;const missing=m.createFormation();m.advanceFormation(missing,48);assert.equal(missing.history.length,1);assert(missing.stoppedReason);globalThis.TYPHOON_CLIMATE=saved;
console.log('PASS: data hashes, source units and PI checkpoints; geographic/monthly background; date-line wrap; fixed-profile PI sensitivity; no out-of-range extrapolation; history and chunk invariance; gradual northern decay; dry/sheared/cold/zero-seed suppression; land decay; physical steering conversion; reference independence; missing-data fail-closed. Not a forecast-skill validation.');
