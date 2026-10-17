/* Deterministic illustration; no observed or forecast data. Shared with non-browser checks. */
(function(root){
 const keys=[{h:0,lat:10,lon:143,v:12,p:1004},{h:18,lat:12,lon:139,v:21,p:994},{h:36,lat:15,lon:135,v:35,p:974},{h:54,lat:18.5,lon:131,v:46,p:945},{h:72,lat:21,lon:126,v:55,p:925},{h:90,lat:23,lon:120.8,v:40,p:960},{h:102,lat:25,lon:118.5,v:24,p:987},{h:120,lat:28,lon:115,v:10,p:1005}];
 const stages=[{min:0,name:'热带扰动',level:'≤ 5 级',text:'风暴已明显减弱，环流和中心云团逐渐松散。'},{min:10.8,name:'热带低压',level:'6–7 级',text:'暖洋面上的扰动逐步组织，云团还没有清晰的风眼。'},{min:17.2,name:'热带风暴',level:'8–9 级',text:'环流逐渐组织，螺旋雨带开始围绕低压中心发展。'},{min:24.5,name:'强热带风暴',level:'10–11 级',text:'中心云团更密集，外围雨带向中心弯曲卷入。'},{min:32.7,name:'台风',level:'12–13 级',text:'成熟风暴可出现风眼，周围的眼墙集中了强风与强降水。'},{min:41.5,name:'强台风',level:'14–15 级',text:'螺旋云带与中心密集云区包围风眼，风暴进入强盛阶段。'},{min:51,name:'超强台风',level:'16 级及以上',text:'本情景达到最强阶段；随后接近陆地并逐渐减弱。'}];
 function reference(hour){const h=Math.max(0,Math.min(120,Number(hour)||0));let i=0;while(i<keys.length-2&&h>keys[i+1].h)i++;const a=keys[i],b=keys[i+1],t=(h-a.h)/(b.h-a.h);const s={h};for(const k of ['lat','lon','v','p'])s[k]=a[k]+(b[k]-a[k])*t;s.stage=stages.filter(x=>s.v>=x.min).at(-1);s.strength=Math.max(0,Math.min(1,(s.v-10)/45));return s}
 const defaults={sst:29,depth:70,humidity:75,shear:6,latitude:17,seed:65,cape:1500,outflow:75,land:0};
 const controls=[
 {id:'sst',name:'海面温度',unit:'℃',min:22,max:32,step:.5,digits:1,why:'暖海面有利于热量与水汽供应；约 26.5℃ 是常用参考，并非所有风暴都遵循的硬阈值。',low:'海面偏冷，能量供应受限',high:'暖洋面支持热量与水汽供应'},
 {id:'depth',name:'暖水层厚度',unit:'m',min:5,max:150,step:5,why:'风暴会搅动上层海洋。较深的暖水层有助于减少冷水上翻带来的表层降温；这里不等同于实际海洋热含量。',low:'暖水层较薄，搅拌冷却更明显',high:'较深暖水层减少冷却限制'},
 {id:'humidity',name:'中层相对湿度',unit:'%',min:30,max:95,step:1,why:'潮湿的中层环境有利于持续对流；干空气卷入可增加蒸发冷却，破坏中心对流。',low:'干空气不利于中心对流维持',high:'湿润环境支持深对流'},
 {id:'shear',name:'垂直风切变',unit:'m/s',min:0,max:35,step:1,why:'表示 850–200 hPa 两层水平风矢量之差的大小。强切变会使涡旋倾斜，云团偏离低层中心。云系向东偏移仅为方向示意。',low:'强切变使云团偏移、组织受损',high:'弱切变有利于上下层对齐'},
 {id:'latitude',name:'生成纬度',unit:'°N',min:0,max:25,step:1,why:'纬度控制地球自转的偏向作用。接近赤道时通常不利于气旋组织；本演示用简化关系表示，不模拟罕见的近赤道生成。',low:'靠近赤道，偏向作用较弱',high:'离开赤道，有利于组织旋转'},
 {id:'seed',name:'初始扰动',unit:'/100',min:0,max:100,step:5,why:'代表已有低层涡旋和雷暴扰动的组织程度，是无量纲教学量。好环境仍需要初始扰动来组织发展。',low:'初始扰动不足，难以组织',high:'已有扰动为发展提供起点'},
 {id:'cape',name:'对流有效位能',unit:'J/kg',min:0,max:3000,step:100,why:'CAPE 表示背景大气可供浮力对流使用的能量。本演示只用来表达对流潜能，不能据其大小直接判断真实台风强度。',low:'对流潜能较弱',high:'背景大气支持对流发展'},
 {id:'outflow',name:'高层流出条件',unit:'/100',min:0,max:100,step:5,why:'表示高空排出空气的有利程度，是无量纲教学量。良好的流出有助于维持低层辐合与深对流。',low:'高层排气受限',high:'高层流出有利'},
 {id:'land',name:'陆地接触程度',unit:'%',min:0,max:100,step:5,why:'教学参数：接触陆地增加摩擦、削弱海洋供热供湿。该值由你设置，与地图海岸线不自动关联；不表示实际登陆面积比例。',low:'陆地接触削弱海洋供能',high:'海面供能保持'}
 ];
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 function normalize(env={}){const e={};for(const c of controls){const value=Number(env[c.id]??defaults[c.id]);e[c.id]=Number.isFinite(value)?clamp(value,c.min,c.max):defaults[c.id];}return e;}
 function evaluate(input={}){const e=normalize(input);const f={sst:clamp((e.sst-24)/5),depth:clamp(e.depth/70),humidity:clamp((e.humidity-35)/40),shear:clamp((24-e.shear)/18),latitude:clamp(Math.sin(e.latitude*Math.PI/180)/Math.sin(10*Math.PI/180)),seed:clamp(e.seed/65),cape:clamp(e.cape/1500),outflow:clamp(e.outflow/75),land:1-e.land/100};
 const weights={sst:.8,depth:.3,humidity:.5,shear:.75,latitude:1,seed:.65,cape:.4,outflow:.35,land:.7};let support=1;for(const c of controls)support*=Math.pow(f[c.id],weights[c.id]);
 const factors=controls.map(c=>({...c,value:e[c.id],effect:f[c.id],message:f[c.id]<.65?c.low:c.high}));const limiting=factors.filter(x=>x.effect<.85).sort((a,b)=>a.effect-b.effect);
 return{env:e,support,factors,limiting,label:support>=.7?'有利于组织发展':support>=.3?'发展受到限制':'难以维持组织'};}
 function sample(hour,input={},route=null){const s=reference(hour),evaluation=evaluate(input),e=evaluation.env;s.lat+=e.latitude-defaults.latitude;if(route){const pos=positionAt(route,s.h);s.lat=pos.lat;s.lon=pos.lon;}s.referenceWind=s.v;s.v=3+(s.v-3)*evaluation.support;s.p=1010-(1010-s.p)*Math.pow(evaluation.support,1.4);if(route){const decay=Math.exp(-positionAt(route,s.h).landHours/18);s.v=3+(s.v-3)*decay;s.p=1010-(1010-s.p)*decay;}s.strength=clamp((s.v-10)/45);s.organization=evaluation.support;s.shear=clamp(e.shear/30);s.spin=clamp(Math.sin(s.lat*Math.PI/180)/Math.sin(10*Math.PI/180));s.stage=stages.filter(x=>s.v>=x.min).at(-1);s.environment=evaluation;if(s.v<10.8)s.stage={...s.stage,text:hour<24?'扰动尚未形成稳定气旋环流。':'当前条件下，示意云系组织较弱。'};return s;}
 // Idealized fixed-f geostrophic steering from an analytic height anomaly.
 // Wind is in m/s. Parameters are illustrative, not fitted to observed tracks.
 const EARTH_RADIUS=6371000,DEG=Math.PI/180,GRAVITY=9.80665,OMEGA=7.2921159e-5;
 const ridgeDefault={west:125,axis:28};
 const ridgePresets={west:{west:110},middle:{west:125},east:{west:140}};
 function normalizeRidge(input={}){const west=Number(input.west??ridgeDefault.west),axis=Number(input.axis??ridgeDefault.axis);return{west:clamp(Number.isFinite(west)?west:ridgeDefault.west,110,140),axis:clamp(Number.isFinite(axis)?axis:ridgeDefault.axis,23,38)};}
 function ridgeGeometry(input={}){const r=normalizeRidge(input);return{...r,east:170,center:(170+r.west)/2,halfLon:(170-r.west)/2,halfLat:10};}
 function heightField(lat,lon,input={}){const r=ridgeGeometry(input),x=(lon-r.center)/r.halfLon,y=(lat-r.axis)/r.halfLat;return 120*Math.exp(-.5*(x*x+y*y));}
 function ridgeWind(lat,lon,input={}){const r=ridgeGeometry(input),cosAxis=Math.cos(r.axis*DEG),cosLat=Math.max(.08,Math.cos(lat*DEG)),lx=EARTH_RADIUS*cosAxis*r.halfLon*DEG,ly=EARTH_RADIUS*r.halfLat*DEG,x=EARTH_RADIUS*cosAxis*(lon-r.center)*DEG,y=EARTH_RADIUS*(lat-r.axis)*DEG,z=heightField(lat,lon,r),f=2*OMEGA*Math.sin(r.axis*DEG),q=GRAVITY*z/f;return{u:q*y/(ly*ly),v:-q*x/(lx*lx)*cosAxis/cosLat};}
 function steering(lat,lon,input={}){const w=ridgeWind(lat,lon,input);return{u:w.u-1.2,v:w.v+.9};}
 function angularVelocity(lat,lon,input={}){const w=steering(lat,lon,input);return{lon:w.u*3600/(EARTH_RADIUS*Math.max(.08,Math.cos(lat*DEG)))/DEG,lat:w.v*3600/EARTH_RADIUS/DEG};}
 function classifyTrack(points){const first=points[0],last=points.at(-1),minLon=Math.min(...points.map(p=>p.lon)),gain=last.lat-first.lat,eastTurn=last.lon-minLon;if(gain>7&&eastTurn>.75)return{id:'recurve',label:'北上后向东转弯',text:'这条示意路径先向西北，随后沿副高西侧北上，并逐渐转向东。'};if(gain>10&&first.lon-minLon<14)return{id:'north',label:'较早向北移动',text:'这次台风较早进入副高西侧的向北气流，西行距离较短。'};return{id:'west',label:'以西行或西北行为主',text:'这次路径在副高南侧的偏东气流中停留较久，整体继续向西或西北移动。'};}
 const landPolygons=(root.EARTH_LAND?.features||[]).flatMap(f=>{const g=f.geometry;if(!g)return[];const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];return polys.map(rings=>{const ring=rings[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);return{rings,bbox:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};});});
 function inRing(lon,lat,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>lat)!==(b[1]>lat)&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
 function isLand(lat,lon){return landPolygons.some(p=>lon>=p.bbox[0]&&lon<=p.bbox[2]&&lat>=p.bbox[1]&&lat<=p.bbox[3]&&inRing(lon,lat,p.rings[0])&&!p.rings.slice(1).some(r=>inRing(lon,lat,r)));}
 function regionName(lat,lon){if(lat>=29&&lon>=128&&(lat<34.3||lon>=130))return'日本附近';if(lat>=21.7&&lat<=25.5&&lon>=119.8&&lon<=122.5)return'台湾附近';if(lat<20.8&&lon>=117&&lon<=127)return'菲律宾附近';if(lat>=33&&lon>=124&&lon<130&&lat<=43)return'朝鲜半岛附近';if(lat>=29&&lon>=128)return'日本附近';if(lon<124&&lat>=20&&lat<24.5)return'华南沿海';if(lon>=116&&lon<124&&lat>=24.5&&lat<31)return'闽浙沿海';if(lon<124&&lat>=31)return'华东沿海';if(lon<111&&lat<24)return'中南半岛附近';return'其他沿海区域';}
 function trajectory(input={},env={},options={}){const ridge=normalizeRidge(input),e=normalize(env),points=[],requestedStep=clamp(Number(options.step)||.25,.0625,1),steps=Math.round(120/requestedStep),dt=120/steps;let lat=e.latitude,lon=138,landfall=null,landHours=0;
 for(let i=0;i<=steps;i++){const h=i*dt,onLand=isLand(lat,lon);if(!landfall&&onLand)landfall={h,lat,lon,region:regionName(lat,lon)};points.push({h,lat,lon,landHours,onLand});if(i===steps)break;
 const first=angularVelocity(lat,lon,ridge),midLat=lat+first.lat*dt/2,midLon=lon+first.lon*dt/2,next=angularVelocity(midLat,midLon,ridge);if(isLand(midLat,midLon))landHours+=dt;lat=clamp(lat+next.lat*dt,-80,80);lon=clamp(lon+next.lon*dt,90,180);}
 return{ridge,points,landfall,behavior:classifyTrack(points),step:dt,hasCoastline:landPolygons.length>0};}
 function positionAt(route,hour){const h=clamp(Number(hour)||0,0,120),step=route.step||.25,i=Math.min(route.points.length-2,Math.floor(h/step)),a=route.points[i],b=route.points[i+1],t=clamp((h-a.h)/(b.h-a.h));return{lat:a.lat+(b.lat-a.lat)*t,lon:a.lon+(b.lon-a.lon)*t,landHours:(a.landHours||0)+((b.landHours||0)-(a.landHours||0))*t};}
 root.TyphoonModel={keys,defaults,controls,normalize,evaluate,reference,sample,ridgeDefault,ridgePresets,normalizeRidge,ridgeGeometry,heightField,ridgeWind,steering,angularVelocity,trajectory,positionAt,classifyTrack,isLand,regionName};
})(typeof window==='undefined'?globalThis:window);
