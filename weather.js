/* Historical six-hour fields. No best-track positions are read by these samplers. */
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function grid(lat,lon,h){const d=root.TYPHOON_WEATHER;if(!d)return{valid:false,reason:'历史天气资料未加载。'};lon=((lon%360)+360)%360;if(!Number.isFinite(lat+lon+h)||h<d.hours[0]||h>d.hours.at(-1)||lat<d.lat[0]||lat>d.lat.at(-1)||lon<d.lon[0]||lon>d.lon.at(-1))return{valid:false,reason:'已到本例天气资料的时间或空间边界。'};
  const ny=d.lat.length,nx=d.lon.length,nt=d.sstLevels.length,y=clamp(Math.floor((lat-d.lat[0])/2.5),0,ny-2),x=clamp(Math.floor((lon-d.lon[0])/2.5),0,nx-2),t=clamp(Math.floor(h/6),0,d.hours.length-2),fy=(lat-d.lat[y])/2.5,fx=(lon-d.lon[x])/2.5,ft=(h-d.hours[t])/6;
  function sample(name,sstIndex=null){let value=0,weight=0;for(const [k,wk] of [[t,1-ft],[t+1,ft]])for(const [j,wj] of [[y,1-fy],[y+1,fy]])for(const [i,wi] of [[x,1-fx],[x+1,fx]]){const index=(k*ny+j)*nx+i,v=d.fields[name][sstIndex===null?index:index*nt+sstIndex],w=wk*wj*wi;if(v!==null&&Number.isFinite(v)){value+=v*w;weight+=w;}}return weight>=.5?value/weight:null;}
  return{valid:true,d,sample};
 }
 function at(lat,lon,h=0,sstOverride=null){const g=grid(lat,lon,h);if(!g.valid)return g;const s=g.sample,sst=s('sst'),humidity=s('humidity'),du=s('du'),dv=s('dv'),slp=s('slp');if([sst,humidity,du,dv,slp].some(x=>x===null))return{valid:false,reason:'附近海面热力资料不足，海上强度暂不更新。'};
  let pi=s('pi'),pmin=s('pmin');if(sstOverride!==null&&Math.abs(sstOverride-sst)>.001){if(sstOverride<6||sstOverride>34){pi=null;pmin=null;}else{const t=clamp(Math.floor((sstOverride-6)/2),0,g.d.sstLevels.length-2),f=(sstOverride-g.d.sstLevels[t])/2,lookup=name=>{const a=s(name,t),b=s(name,t+1);return a===null||b===null?null:a+(b-a)*f;};pi=lookup('piBySst');pmin=lookup('pminBySst');}}
  return{valid:true,sst,humidity,du,dv,shear:Math.hypot(du,dv),slp,pi,pmin,outflow:s('outflow'),piValid:pi!==null&&pmin!==null&&Number.isFinite(pi+pmin),period:'2023年7月21–31日',historical:true};
 }
 function flowAt(lat,lon,h=0,method='point'){const g=grid(lat,lon,h);if(!g.valid)return g;const u=g.sample(method==='annular'?'annularU':'steerU'),v=g.sample(method==='annular'?'annularV':'steerV');return u===null||v===null?{valid:false,reason:'本例引导风缺测。'}:{valid:true,u,v};}
 function contours(h,level=5880){const d=root.TYPHOON_WEATHER;if(!d||h<0||h>d.hours.at(-1))return[];const t=clamp(Math.floor(h/6),0,d.hours.length-2),f=(h-d.hours[t])/6,nx=d.lon.length,ny=d.lat.length,value=(y,x)=>{const a=d.fields.hgt500[(t*ny+y)*nx+x],b=d.fields.hgt500[((t+1)*ny+y)*nx+x];return a+(b-a)*f;},segments=[];
  for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const a=[d.lat[y],d.lon[x],value(y,x)],b=[d.lat[y],d.lon[x+1],value(y,x+1)],c=[d.lat[y+1],d.lon[x+1],value(y+1,x+1)],e=[d.lat[y+1],d.lon[x],value(y+1,x)];for(const tri of [[a,b,c],[a,c,e]]){const hits=[];for(let k=0;k<3;k++){const p=tri[k],q=tri[(k+1)%3];if((p[2]<level)!==(q[2]<level)){const r=(level-p[2])/(q[2]-p[2]);hits.push({lat:p[0]+(q[0]-p[0])*r,lon:p[1]+(q[1]-p[1])*r});}}if(hits.length===2)segments.push(hits);}}
  return segments;
 }
 root.TyphoonWeather={at,flowAt,contours};
})(typeof window==='undefined'?globalThis:window);
