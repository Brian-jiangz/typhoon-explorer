/* Offline NOAA climatology sampling. No latitude-only thermal penalty. */
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function sampler(lat,lon,month=8){
  lon=((lon%360)+360)%360;
  const d=root.TYPHOON_CLIMATE;
  if(!d)return{valid:false,reason:'气候背景文件未加载，不能计算增强。'};
  if(!Number.isFinite(lat+lon)||lat<d.lat[0]||lat>d.lat.at(-1)||lon<d.lon[0]||lon>d.lon.at(-1))return{valid:false,reason:'已离开背景数据范围，不能继续推算热带增强。'};
  const m=clamp(Math.round(Number(month)||8),1,12)-1,ny=d.lat.length,nx=d.lon.length,nt=d.sstLevels.length;
  const y=clamp(Math.floor((lat-d.lat[0])/2.5),0,ny-2),x=clamp(Math.floor((lon-d.lon[0])/2.5),0,nx-2),fy=(lat-d.lat[y])/2.5,fx=(lon-d.lon[x])/2.5;
  const corners=[[y,x,(1-fy)*(1-fx)],[y,x+1,(1-fy)*fx],[y+1,x,fy*(1-fx)],[y+1,x+1,fy*fx]];
  function sample(name,t=null){let sum=0,weight=0;for(const [j,i,w] of corners){const cell=(m*ny+j)*nx+i,value=d.fields[name][t===null?cell:cell*nt+t];if(value!==null&&Number.isFinite(value)){sum+=w*value;weight+=w;}}return weight>=.5?sum/weight:null;}
  return{valid:true,sample,month:m+1,data:d};
 }
 function at(lat,lon,month=8,sstOverride=null){const grid=sampler(lat,lon,month);if(!grid.valid)return grid;const {sample,data:d}=grid,nt=d.sstLevels.length;
  const sst=sample('sst'),humidity=sample('humidity'),du=sample('du'),dv=sample('dv'),slp=sample('slp');
  if([sst,humidity,du,dv,slp].some(x=>x===null))return{valid:false,reason:'附近海面缺少足够背景格点，不能计算增强。'};
  let pi=sample('pi'),pmin=sample('pmin'),outflow=sample('outflow');
  const requested=sstOverride===null?sst:Number(sstOverride);
  if(Math.abs(requested-sst)>.001){
   if(requested<d.sstLevels[0]||requested>d.sstLevels.at(-1)){pi=null;pmin=null;}
   else{let t=clamp(Math.floor((requested-d.sstLevels[0])/2),0,nt-2),f=(requested-d.sstLevels[t])/2;const interpolate=name=>{const a=sample(name,t),b=sample(name,t+1);return a===null||b===null?null:a+(b-a)*f;};pi=interpolate('piBySst');pmin=interpolate('pminBySst');}
  }
  return{valid:true,month:grid.month,sst,humidity,du,dv,shear:Math.hypot(du,dv),slp,pi,pmin,outflow,piValid:pi!==null&&pmin!==null&&Number.isFinite(pi+pmin),period:d.period,modifiedSst:Math.abs(requested-sst)>.001};
 }
 function flowAt(lat,lon,month=8){const grid=sampler(lat,lon,month);if(!grid.valid)return grid;const u=grid.sample('steerU'),v=grid.sample('steerV'),lowU=grid.sample('lowU'),lowV=grid.sample('lowV');return [u,v,lowU,lowV].some(x=>x===null)?{valid:false,reason:'引导风背景缺测。'}:{valid:true,u,v,lowU,lowV};}
 root.TyphoonClimate={at,flowAt};
})(typeof window==='undefined'?globalThis:window);
