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
assert(!c.at(70,150,8).valid);assert(!c.at(-20,40,8).valid);
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
const extended=m.createFormation({start:{lat:10,lon:170}});assert.equal(extended.maxHours,360);m.advanceFormation(extended,360);assert.equal(extended.history.at(-1).h,360);assert(extended.history.every(p=>Number.isFinite(p.v)&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)));const prefix=extended.history.slice();extended.maxHours+=120;m.advanceFormation(extended,480);assert.equal(extended.history.at(-1).h,480);assert.deepEqual(extended.history.slice(0,prefix.length),prefix);
// New basins use their own actual monthly fields and no default artificial ridge wind.
for(const [lat,lon,basin] of [[25,-85,'atlantic'],[20,-60,'atlantic'],[15,-120,'eastPacific'],[10,-95,'eastPacific'],[10,70,'indian']]){
 assert(m.validateGenesis({lat,lon}).valid);const run=m.createFormation({start:{lat,lon},initialWind:40});assert.equal(run.basin.id,basin);assert.equal(run.ridge.west,run.basin.ridge.west);assert(c.at(lat,lon,8).valid);assert(c.at(lat,lon,8).piValid);
 const flow=c.flowAt(lat,lon,8),motion=m.formationVelocity(lat,lon,run);near(motion.lon*Math.PI/180*6371000*Math.cos(lat*Math.PI/180)/3600,flow.u,1e-9);near(motion.lat*Math.PI/180*6371000/3600,flow.v,1e-9);
 assert.equal(run.history[0].stage.name,basin==='indian'?'热带气旋':'飓风');m.advanceFormation(run,24);assert.equal(run.history.at(-1).h,24);assert(run.history.every(point=>Number.isFinite(point.v+point.lat+point.lon)));
 const old=run.ridge;run.ridge=m.normalizeRidge({...old,west:old.west-3});assert.equal(run.ridge.west,old.west-3);const changed=m.formationVelocity(lat,lon,run);assert(Number.isFinite(changed.lat+changed.lon));
}
assert(!m.validateGenesis({lat:30,lon:-95}).valid);assert(!m.validateGenesis({lat:-15,lon:70}).valid);
assert.deepEqual(c.at(20,-60,8),c.at(20,300,8));assert.deepEqual(c.at(20,0,8),c.at(20,360,8));
for(const field of Object.keys(d.fields)){const n=d.lon.length,t=field.endsWith('BySst')?d.sstLevels.length:1;for(const row of [0,15,24])for(let k=0;k<t;k++)assert.equal(d.fields[field][(7*d.lat.length+row)*n*t+k],d.fields[field][((7*d.lat.length+row)*n+n-1)*t+k]);}
assert(Number.isFinite(c.flowAt(20,-.1,8).u));assert(Math.abs(c.flowAt(20,-.001,8).u-c.flowAt(20,.001,8).u)<.01);
// Missing coastal SST must not become an invisible wall when steering wind exists.
const realAt=c.at,realFlow=c.flowAt,thermalGap=m.createFormation({start:{lat:20,lon:140},initialWind:30});
c.at=()=>({valid:false,reason:'测试海温缺测'});m.advanceFormation(thermalGap,12);assert.equal(thermalGap.history.at(-1).h,12);assert(!thermalGap.stoppedReason);assert.equal(thermalGap.history.at(-1).v,30);assert(!thermalGap.history.at(-1).environment.valid);assert(Math.hypot(thermalGap.history.at(-1).lat-20,thermalGap.history.at(-1).lon-140)>0);c.at=realAt;
// Loss of steering still stops advection; no invented motion across a wind-data gap.
const windGap=m.createFormation({start:{lat:20,lon:140}});c.flowAt=()=>({valid:false,reason:'测试风场缺测'});m.advanceFormation(windGap,12);assert.equal(windGap.history.length,1);assert(windGap.stoppedReason.includes('风场缺测'));c.flowAt=realFlow;
const coastal=m.createFormation({start:{lat:15,lon:130}});coastal.maxHours=720;m.advanceFormation(coastal,720);assert.equal(coastal.history.at(-1).h,720);assert(!coastal.stoppedReason);assert(coastal.landfall);assert(coastal.history.some(p=>p.onLand&&p.lon<119&&p.lat>20));for(let i=1;i<coastal.history.length;i++)if(coastal.history[i].onLand)assert(coastal.history[i].v<=coastal.history[i-1].v);
// Screenshot regression: shifted ridge must not inject a false eastward difference wind.
const screenshot=m.createFormation({start:{lat:15.9,lon:136.6},ridge:{west:110,axis:34}}),snapshotFlow=m.formationFlow(16.1,142.8,screenshot,40);assert(snapshotFlow.u<0);m.advanceFormation(screenshot,69.75);assert(screenshot.history.at(-1).lon<136.6);assert(screenshot.history.at(-1).lat>15.9);
const motion=m.formationVelocity(16.1,142.8,screenshot),shared=m.formationFlow(16.1,142.8,screenshot);near(motion.lon*Math.PI/180*6371000*Math.cos(16.1*Math.PI/180)/3600,shared.u,1e-9);near(motion.lat*Math.PI/180*6371000/3600,shared.v,1e-9);
// A constant observed wind cannot reverse under any hypothetical ridge resampling.
const observed=c.flowAt;c.flowAt=()=>({valid:true,u:-4,v:1,lowU:-2,lowV:.5});for(const west of [110,125,140])for(const axis of [23,28,38]){screenshot.ridge=m.normalizeRidge({west,axis});const f=m.formationFlow(16,140,screenshot,40);near(f.u,-4,1e-9);near(f.v,1,1e-9);}c.flowAt=observed;
console.log('PASS: data hashes, source units and PI checkpoints; geographic/monthly background; date-line wrap; fixed-profile PI sensitivity; no out-of-range extrapolation; history and chunk invariance; gradual northern decay; dry/sheared/cold/zero-seed suppression; land decay; physical steering conversion; reference independence; wind-gap fail-closed; coastal thermal gaps continue advection without updating sea intensity; mainland crossing and land decay; Atlantic/Gulf/eastern Pacific/Indian Ocean sources, default wind identity, screenshot reversal regression, constant-wind preservation, shared motion/arrow flow, periodic seam and basin naming. Not a forecast-skill validation.');
