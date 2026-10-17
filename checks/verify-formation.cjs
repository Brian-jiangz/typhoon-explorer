'use strict';
const assert=require('node:assert/strict');
require('../assets/land.js');require('../simulation.js');
const m=globalThis.TyphoonModel;
assert(!m.validateGenesis({lat:30,lon:110}).valid);
assert(!m.validateGenesis({lat:-5,lon:140}).valid);
assert(!m.validateGenesis({lat:17,lon:90}).valid);
assert(m.validateGenesis({lat:17,lon:138}).valid);
assert.throws(()=>m.createFormation({start:{lat:30,lon:110}}),RangeError);
const a=m.createFormation(),b=m.createFormation();
assert.equal(a.history.length,1);assert.equal(a.history[0].v,8);
assert.equal(m.readFormation(a,120).h,0);assert.equal(a.history.length,1);
m.advanceFormation(a,120);for(let h=.1;h<120;h+=.37)m.advanceFormation(b,h);m.advanceFormation(b,120);
assert.deepEqual(a.history,b.history);assert.equal(a.history.length,481);
const length=a.history.length;m.readFormation(a,12.125);m.advanceFormation(a,5);assert.equal(a.history.length,length);
const ocean={lat:15,lon:160},warm=m.createFormation({start:ocean}),cool=m.createFormation({start:ocean,environment:{sst:24}}),dry=m.createFormation({start:ocean,environment:{humidity:35}}),shear=m.createFormation({start:ocean,environment:{shear:24}}),strong=m.createFormation({start:ocean,initialWind:14});
for(const r of [warm,cool,dry,shear,strong])m.advanceFormation(r,24);
assert(warm.history.at(-1).v>32.7);
for(const r of [cool,dry,shear]){assert(r.history.at(-1).v<8);assert(r.history.at(-1).v<warm.history.at(-1).v);}
assert(strong.history.at(-1).v>warm.history.at(-1).v);
assert.equal(warm.history[0].lat,15);assert.equal(warm.history[0].lon,160);
assert(a.history.some(p=>p.onLand));assert(a.landfall);
for(let i=1;i<a.history.length;i++){const p=a.history[i],prev=a.history[i-1];assert(Number.isFinite(p.lat+p.lon+p.v+p.p));if(p.onLand)assert(p.v<prev.v);assert(p.landHours>=prev.landHours);}
const oldKey=m.keys[2].v;m.keys[2].v=0;const independent=m.createFormation({start:ocean});m.advanceFormation(independent,24);assert.deepEqual(independent.history,warm.history);m.keys[2].v=oldKey;
// Northern-ocean conditions must differ from the tropical controls, and the
// displayed conditions must be the same ones used by the intensity update.
let last=m.formationEnvironment(24);
for(let latitude=24;latitude<=45;latitude+=.25){const e=m.formationEnvironment(latitude);assert(e.env.sst<=last.env.sst+1e-12);assert(e.env.shear>=last.env.shear-1e-12);assert.equal(e.support,m.evaluate(e.env).support);last=e;}
assert.equal(m.formationEnvironment(17).support,m.evaluate().support);
const northern=m.createFormation({start:{lat:38,lon:145},initialWind:20});m.advanceFormation(northern,12);assert(northern.history.at(-1).v<20);assert(northern.history[0].environment.env.sst<24);
// A real map coastline crossing in this illustrative route exits into the
// northern sea. The old uniform warm background revived this remnant there.
const remnant=m.createFormation({start:{lat:25,lon:125}});m.advanceFormation(remnant,120);
const exit=remnant.history.findIndex((p,i)=>i>0&&!p.onLand&&remnant.history[i-1].onLand);assert(exit>0);assert(remnant.history[exit].lat>35);
for(let i=exit+1;i<remnant.history.length;i++){const p=remnant.history[i];assert(p.v<=remnant.history[i-1].v+1e-12);assert(p.v<17.2);}
// This is an environment rule, not a blanket ban on northern coordinates:
// a system carried back over tropical water can regain support.
assert(m.formationEnvironment(20).support>m.formationEnvironment(38).support);
console.log('PASS: sea/domain validation, explicit seed/location, no future history, chunk-independent stepping, growth/decay, land decay, replay, reference independence, consistent local conditions, smooth northward cooling/shear and northern post-landfall decay. Heuristic consistency only.');
