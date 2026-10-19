/* Shared teaching model: idealized quiz, monthly climate sandbox and retrospective weather case. */
(function(root){
 const keys=[{h:0,lat:10,lon:143,v:12,p:1004},{h:18,lat:12,lon:139,v:21,p:994},{h:36,lat:15,lon:135,v:35,p:974},{h:54,lat:18.5,lon:131,v:46,p:945},{h:72,lat:21,lon:126,v:55,p:925},{h:90,lat:23,lon:120.8,v:40,p:960},{h:102,lat:25,lon:118.5,v:24,p:987},{h:120,lat:28,lon:115,v:10,p:1005}];
 const stages=[{min:0,name:'热带扰动',level:'≤ 5 级',text:'风暴已明显减弱，环流和中心云团逐渐松散。'},{min:10.8,name:'热带低压',level:'6–7 级',text:'暖洋面上的扰动逐步组织，云团还没有清晰的风眼。'},{min:17.2,name:'热带风暴',level:'8–9 级',text:'环流逐渐组织，螺旋雨带开始围绕低压中心发展。'},{min:24.5,name:'强热带风暴',level:'10–11 级',text:'中心云团更密集，外围雨带向中心弯曲卷入。'},{min:32.7,name:'台风',level:'12–13 级',text:'成熟风暴可出现风眼，周围的眼墙集中了强风与强降水。'},{min:41.5,name:'强台风',level:'14–15 级',text:'螺旋云带与中心密集云区包围风眼，风暴进入强盛阶段。'},{min:51,name:'超强台风',level:'16 级及以上',text:'本情景达到最强阶段；随后接近陆地并逐渐减弱。'}];
 function reference(hour){const h=Math.max(0,Math.min(120,Number(hour)||0));let i=0;while(i<keys.length-2&&h>keys[i+1].h)i++;const a=keys[i],b=keys[i+1],t=(h-a.h)/(b.h-a.h);const s={h};for(const k of ['lat','lon','v','p'])s[k]=a[k]+(b[k]-a[k])*t;s.stage=stages.filter(x=>s.v>=x.min).at(-1);s.strength=Math.max(0,Math.min(1,(s.v-10)/45));return s}
 const defaults={sst:29,depth:70,humidity:75,shear:6,latitude:17,seed:65,cape:1500,outflow:75,land:0};
 const controls=[
 {id:'sst',name:'海面温度',unit:'℃',min:-2,max:34,step:.5,digits:1,why:'暖海面有利于热量与水汽供应；约 26.5℃ 是常用参考，并非所有风暴都遵循的硬阈值。',low:'海面偏冷，能量供应受限',high:'暖洋面支持热量与水汽供应'},
 {id:'depth',name:'暖水层厚度',unit:'m',min:5,max:150,step:5,why:'风暴会搅动上层海洋。较深的暖水层有助于减少冷水上翻带来的表层降温；这里不等同于实际海洋热含量。',low:'暖水层较薄，搅拌冷却更明显',high:'较深暖水层减少冷却限制'},
 {id:'humidity',name:'中层相对湿度',unit:'%',min:0,max:100,step:1,why:'潮湿的中层环境有利于持续对流；干空气卷入可增加蒸发冷却，破坏中心对流。',low:'干空气不利于中心对流维持',high:'湿润环境支持深对流'},
 {id:'shear',name:'垂直风切变',unit:'m/s',min:0,max:80,step:1,why:'表示 850–200 hPa 两层水平风矢量之差的大小。强切变会使涡旋倾斜，云团偏离低层中心。云系向东偏移仅为方向示意。',low:'强切变使云团偏移、组织受损',high:'弱切变有利于上下层对齐'},
 {id:'latitude',name:'生成纬度',unit:'°N',min:0,max:40,step:1,why:'纬度控制地球自转的偏向作用。接近赤道时通常不利于气旋组织；本演示用简化关系表示，不模拟罕见的近赤道生成。',low:'靠近赤道，偏向作用较弱',high:'离开赤道，有利于组织旋转'},
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
 function basinAt(lon,lat=20){
  lon=((Number(lon)+180)%360+360)%360-180;
  // A coarse isthmus divider selects a teaching basin, not an official warning area.
  const divider=[[-100,17],[-95,16],[-90,14],[-85,10],[-82,8],[-78,8],[-77,7]];let pacific=lon<-100;
  for(let i=0;i<divider.length-1;i++){const a=divider[i],b=divider[i+1];if(lon>=a[0]&&lon<b[0])pacific=lat<a[1]+(b[1]-a[1])*(lon-a[0])/(b[0]-a[0]);}
  if(pacific)return{id:'eastPacific',name:'中东部北太平洋',storm:'飓风',ridge:{west:-160,axis:28,offset:-285}};
  if(lon<20)return{id:'atlantic',name:'北大西洋',storm:'飓风',ridge:{west:-65,axis:28,offset:-190}};
  if(lon<100)return{id:'indian',name:'北印度洋',storm:'热带气旋',ridge:{west:55,axis:28,offset:-70}};
  return{id:'westPacific',name:'西北太平洋',storm:'台风',ridge:{...ridgeDefault}};
 }
 function normalizeRidge(input={}){const offset=Number.isFinite(Number(input.offset))?clamp(Number(input.offset),-360,360):0,west=Number(input.west??(ridgeDefault.west+offset)),axis=Number(input.axis??ridgeDefault.axis);return{west:clamp(Number.isFinite(west)?west:ridgeDefault.west+offset,110+offset,140+offset),axis:clamp(Number.isFinite(axis)?axis:ridgeDefault.axis,23,38),...(offset?{offset}:{})};}
 function ridgeGeometry(input={}){const r=normalizeRidge(input),east=170+(r.offset||0);return{...r,east,center:(east+r.west)/2,halfLon:(east-r.west)/2,halfLat:10};}
 function longitudeDifference(a,b){return((a-b+180)%360+360)%360-180;}
 function heightField(lat,lon,input={}){const r=ridgeGeometry(input),x=longitudeDifference(lon,r.center)/r.halfLon,y=(lat-r.axis)/r.halfLat;return 120*Math.exp(-.5*(x*x+y*y));}
 function ridgeWind(lat,lon,input={}){const r=ridgeGeometry(input),cosAxis=Math.cos(r.axis*DEG),cosLat=Math.max(.08,Math.cos(lat*DEG)),lx=EARTH_RADIUS*cosAxis*r.halfLon*DEG,ly=EARTH_RADIUS*r.halfLat*DEG,x=EARTH_RADIUS*cosAxis*longitudeDifference(lon,r.center)*DEG,y=EARTH_RADIUS*(lat-r.axis)*DEG,z=heightField(lat,lon,r),f=2*OMEGA*Math.sin(r.axis*DEG),q=GRAVITY*z/f;return{u:q*y/(ly*ly),v:-q*x/(lx*lx)*cosAxis/cosLat};}
 function steering(lat,lon,input={}){const w=ridgeWind(lat,lon,input);return{u:w.u-1.2,v:w.v+.9};}
 function angularVelocity(lat,lon,input={}){const w=steering(lat,lon,input);return{lon:w.u*3600/(EARTH_RADIUS*Math.max(.08,Math.cos(lat*DEG)))/DEG,lat:w.v*3600/EARTH_RADIUS/DEG};}
 function classifyTrack(points){const first=points[0],last=points.at(-1),minLon=Math.min(...points.map(p=>p.lon)),gain=last.lat-first.lat,eastTurn=last.lon-minLon;if(gain>7&&eastTurn>.75)return{id:'recurve',label:'北上后向东转弯',text:'这条示意路径先向西北，随后沿副高西侧北上，并逐渐转向东。'};if(gain>10&&first.lon-minLon<14)return{id:'north',label:'较早向北移动',text:'这次台风较早进入副高西侧的向北气流，西行距离较短。'};return{id:'west',label:'以西行或西北行为主',text:'这次路径在副高南侧的偏东气流中停留较久，整体继续向西或西北移动。'};}
 const landPolygons=(root.EARTH_LAND?.features||[]).flatMap(f=>{const g=f.geometry;if(!g)return[];const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];return polys.map(rings=>{const ring=rings[0],xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);return{rings,bbox:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};});});
 function inRing(lon,lat,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>lat)!==(b[1]>lat)&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
 function isLand(lat,lon){return landPolygons.some(p=>lon>=p.bbox[0]&&lon<=p.bbox[2]&&lat>=p.bbox[1]&&lat<=p.bbox[3]&&inRing(lon,lat,p.rings[0])&&!p.rings.slice(1).some(r=>inRing(lon,lat,r)));}
 function regionName(lat,lon){if(lon<0){if(lon>=-98&&lon<=-80&&lat>=25&&lat<=31)return'美国墨西哥湾沿岸附近';if(lon>=-85&&lon<=-66&&lat>=25)return'美国东海岸附近';if(lon>=-118&&lon<=-86&&lat>=14&&lat<30)return'墨西哥附近';if(lon>=-86&&lon<=-58&&lat>=10&&lat<25)return'加勒比海沿岸附近';return'美洲或大西洋沿岸附近';}if(lon<100)return'印度洋或邻近沿海';if(lat>=29&&lon>=128&&(lat<34.3||lon>=130))return'日本附近';if(lat>=21.7&&lat<=25.5&&lon>=119.8&&lon<=122.5)return'中国台湾省附近';if(lat<20.8&&lon>=117&&lon<=127)return'菲律宾附近';if(lat>=33&&lon>=124&&lon<130&&lat<=43)return'朝鲜半岛附近';if(lat>=29&&lon>=128)return'日本附近';if(lon<124&&lat>=20&&lat<24.5)return'华南沿海';if(lon>=116&&lon<124&&lat>=24.5&&lat<31)return'闽浙沿海';if(lon<124&&lat>=31)return'华东沿海';if(lon<111&&lat<24)return'中南半岛附近';return'其他沿海区域';}
 function trajectory(input={},env={},options={}){const ridge=normalizeRidge(input),e=normalize(env),points=[],requestedStep=clamp(Number(options.step)||.25,.0625,1),steps=Math.round(120/requestedStep),dt=120/steps;let lat=e.latitude,lon=138,landfall=null,landHours=0;
 for(let i=0;i<=steps;i++){const h=i*dt,onLand=isLand(lat,lon);if(!landfall&&onLand)landfall={h,lat,lon,region:regionName(lat,lon)};points.push({h,lat,lon,landHours,onLand});if(i===steps)break;
 const first=angularVelocity(lat,lon,ridge),midLat=lat+first.lat*dt/2,midLon=lon+first.lon*dt/2,next=angularVelocity(midLat,midLon,ridge);if(isLand(midLat,midLon))landHours+=dt;lat=clamp(lat+next.lat*dt,-80,80);lon=clamp(lon+next.lon*dt,90,180);}
 return{ridge,points,landfall,behavior:classifyTrack(points),step:dt,hasCoastline:landPolygons.length>0};}
 function positionAt(route,hour){const h=clamp(Number(hour)||0,0,120),step=route.step||.25,i=Math.min(route.points.length-2,Math.floor(h/step)),a=route.points[i],b=route.points[i+1],t=clamp((h-a.h)/(b.h-a.h));return{lat:a.lat+(b.lat-a.lat)*t,lon:a.lon+(b.lon-a.lon)*t,landHours:(a.landHours||0)+((b.landHours||0)-(a.landHours||0))*t};}
 // Incremental formation sandbox. No reference-intensity keyframes are used here.
 function validateGenesis(point){const lat=Number(point?.lat),value=Number(point?.lon);if(!Number.isFinite(lat)||!Number.isFinite(value))return{valid:false,message:'请先在地球的海面上点一下。'};const lon=((value+180)%360+360)%360-180;if(lat<0||lat>40)return{valid:false,message:'当前支持北半球海域，请选赤道至北纬 40°以内的海面。'};if(isLand(lat,lon))return{valid:false,message:'这里是陆地，请换到附近的海面。'};return{valid:true,point:{lat,lon}};}

 // Formation mode uses NOAA climatology and precomputed BE02 thermodynamics.
 // The finite-time growth/organization closure below remains uncalibrated.
 function formationEnvironment(lat,input={},options={}){
  const background=normalize(input),lon=options.lon??138,month=options.month??8,delta=options.adjustments||{sst:0,humidity:0,shear:0},base=options.weather?root.TyphoonWeather?.at(lat,lon,options.h??0):root.TyphoonClimate?.at(lat,lon,month);
  if(!base?.valid)return{...evaluate(background),support:0,valid:false,label:'热力资料暂缺',reason:base?.reason||'气候背景文件未加载。',pi:0,pmin:null,slp:1010,organizationTarget:0,intensityTarget:3,background,adjusted:Object.values(delta).some(x=>Math.abs(x)>.01)};
  const sst=clamp(base.sst+delta.sst,-2,34),humidity=clamp(base.humidity+delta.humidity,0,100),shear=Math.max(0,base.shear+delta.shear),climate=options.weather?root.TyphoonWeather.at(lat,lon,options.h??0,sst):root.TyphoonClimate.at(lat,lon,month,sst),local={...background,sst,humidity,shear,latitude:lat},diagnostic=evaluate(local);
  const potential=climate.piValid?Math.max(0,climate.pi):0,moisture=clamp((humidity-30)/40),shearEfficiency=Math.exp(-Math.pow(shear/18,2)),depthEfficiency=Math.pow(clamp(background.depth/70),.25),landEfficiency=Math.sqrt(1-background.land/100),genesisSpin=clamp(Math.sin(Math.abs(lat)*DEG)/Math.sin(8*DEG)),efficiency=moisture*shearEfficiency*depthEfficiency*landEfficiency,support=clamp(potential/75)*efficiency*genesisSpin;
  return{...diagnostic,env:local,background,climate,valid:true,pi:potential,piValid:climate.piValid,pmin:climate.pmin,slp:base.slp,outflow:base.outflow,support,organizationTarget:clamp(support/.4),intensityTarget:Math.max(3,potential*efficiency),adjusted:Object.values(delta).some(x=>Math.abs(x)>.01),label:support>=.7?'环境较有利':support>=.3?'发展受到限制':'热带发展条件较弱'};
 }
 function formationState(point,run){
  const evaluation=formationEnvironment(point.lat,run.environment,{lon:point.lon,month:run.month,adjustments:run.adjustments,weather:run.weather,h:point.h}),v=Math.max(0,point.v),stage=stages.filter(s=>v>=s.min).at(-1),text=point.onLand?'经过陆地，海洋供能减少，热带云系逐步衰减。':!evaluation.valid?'当地热力资料暂缺，按已有风场继续移动；海上强度暂不更新。':!evaluation.piValid?'热力计算不可用，不推算增强；这里只继续示意衰减。':point.trend<-.001?'当地热力条件、风差或干空气限制发展，系统正在逐渐减弱。':'云团根据当地热力条件、湿度和上下层风差逐步发展。';
  const ratio=evaluation.pi>0?clamp(v/evaluation.pi,0,1.3):0,p=evaluation.piValid&&evaluation.pmin!==null?evaluation.slp-(evaluation.slp-evaluation.pmin)*ratio*ratio:NaN;
  return{...point,v,p,strength:clamp((v-10)/45),organization:clamp(point.organization),shear:clamp(evaluation.env.shear/30),spin:clamp(Math.sin(Math.abs(point.lat)*DEG)/Math.sin(10*DEG)),stage:{...stage,...(v>=32.7&&run.basin.storm!=='台风'?{name:run.basin.storm}:{}),text},environment:evaluation};
 }
 function createFormation(options={}){
  const validated=validateGenesis(options.start||{lat:17,lon:138});if(!validated.valid)throw new RangeError(validated.message);
  const month=clamp(Math.round(Number(options.month)||8),1,12),base=options.weather?root.TyphoonWeather?.at(validated.point.lat,validated.point.lon,0):root.TyphoonClimate?.at(validated.point.lat,validated.point.lon,month),initial={...defaults,...(base?.valid?{sst:base.sst,humidity:base.humidity,shear:base.shear}:{}),...options.environment,latitude:validated.point.lat},environment=normalize(initial),basin=basinAt(validated.point.lon,validated.point.lat),ridge=normalizeRidge(options.ridge||basin.ridge),value=Number(options.initialWind??8),v=clamp(Number.isFinite(value)?value:8,3,75);
  const adjustments={sst:base?.valid?environment.sst-base.sst:0,humidity:base?.valid?environment.humidity-base.humidity:0,shear:base?.valid?environment.shear-base.shear:0},run={start:{...validated.point},environment,adjustments,month,ridge,basin,weather:!!options.weather,initialWind:v,seedCanDevelop:environment.seed>0,step:.25,maxHours:options.weather?root.TYPHOON_WEATHER.hours.at(-1):360,history:[],landfall:null};
  run.history.push(formationState({...validated.point,h:0,v,landHours:0,onLand:false,trend:0,organization:environment.seed>0?(.35+.35*clamp(environment.seed/100))*clamp(Math.sin(Math.abs(validated.point.lat)*DEG)/Math.sin(8*DEG)):0},run));return run;
 }
 function formationFlow(lat,lon,run,h=run.history?.at(-1)?.h??0){
  const sample=(lat,lon)=>run.weather?root.TyphoonWeather?.flowAt(lat,lon,h,run.windMethod||'point'):root.TyphoonClimate?.flowAt(lat,lon,run.month),base=sample(lat,lon);
  if(!base?.valid)return{valid:false,reason:base?.reason||'引导风背景缺测。'};
  if(run.weather)return{valid:true,u:base.u,v:base.v};
  const blend=flow=>({u:flow.u,v:flow.v}),actual=blend(base),control=ridgeGeometry(run.basin.ridge),modified=ridgeGeometry(run.ridge);
  if(modified.west===control.west&&modified.axis===control.axis)return{valid:true,...actual};
  // Resample the observed monthly wind pattern under a hypothetical ridge deformation.
  // The displayed ellipse still is not a diagnosed geopotential-height contour.
  const x=longitudeDifference(lon,modified.center)/modified.halfLon,y=(lat-modified.axis)/modified.halfLat,r=Math.hypot(x,y),t=clamp((2-r)),weight=t*t*(3-2*t);
  if(weight===0)return{valid:true,...actual};
  const sourceLat=lat-(modified.axis-control.axis),sourceLon=control.east+longitudeDifference(lon,modified.east)*control.halfLon/modified.halfLon,source=sample(sourceLat,sourceLon);
  if(!source.valid)return{valid:false,reason:'调整后的引导风采样位置超出资料范围。'};
  const mapped=blend(source);
  return{valid:true,u:actual.u+(mapped.u-actual.u)*weight,v:actual.v+(mapped.v-actual.v)*weight};
 }
 function formationVelocity(lat,lon,run,h=run.history?.at(-1)?.h??0){const flow=formationFlow(lat,lon,run,h);if(!flow.valid)return{lat:0,lon:0,valid:false,reason:flow.reason};return{valid:true,lon:flow.u*3600/(EARTH_RADIUS*Math.max(.08,Math.cos(lat*DEG)))/DEG,lat:flow.v*3600/EARTH_RADIUS/DEG};}
 function advanceFormation(run,targetHour){
  const target=clamp(Number(targetHour)||0,0,run.maxHours),dt=run.step;
  while(run.history.at(-1).h+dt<=target+1e-9){
   const s=run.history.at(-1),a=formationVelocity(s.lat,s.lon,run,s.h),midLat=clamp(s.lat+a.lat*dt/2,-80,80),midLon=s.lon+a.lon*dt/2,b=formationVelocity(midLat,midLon,run,s.h+dt/2),lat=clamp(s.lat+b.lat*dt,-80,80),lon=((s.lon+b.lon*dt+180)%360+360)%360-180,onLand=isLand(midLat,midLon),env=formationEnvironment(midLat,run.environment,{lon:midLon,month:run.month,adjustments:run.adjustments,weather:run.weather,h:s.h+dt/2});
   if(!a.valid||!b.valid){run.stoppedReason=a.reason||b.reason||'引导风资料不足，无法继续移动。';break;}
   const organizationGoal=onLand||!run.seedCanDevelop?0:env.organizationTarget,organization=!env.valid&&!onLand?s.organization:organizationGoal+(s.organization-organizationGoal)*Math.exp(-dt/(onLand?8:18)),equilibrium=onLand?3:Math.max(3,env.intensityTarget*organization),tau=onLand?12:equilibrium<s.v?18:36,v=!env.valid&&!onLand?s.v:equilibrium+(s.v-equilibrium)*Math.exp(-dt/tau),h=Number((s.h+dt).toFixed(8));
   if(onLand&&!run.landfall)run.landfall={h:s.h+dt/2,lat:midLat,lon:midLon,region:regionName(midLat,midLon)};
   run.history.push(formationState({h,lat,lon,v,landHours:s.landHours+(onLand?dt:0),onLand,trend:(v-s.v)/dt,organization},run));
  }return readFormation(run,target);
 }
 function readFormation(run,hour){
  const h=clamp(Number(hour)||0,0,run.history.at(-1).h),i=Math.min(run.history.length-1,Math.floor(h/run.step)),a=run.history[i],b=run.history[Math.min(i+1,run.history.length-1)];if(a===b)return a;
  const t=clamp((h-a.h)/(b.h-a.h)),point={h,onLand:t<.5?a.onLand:b.onLand};for(const key of ['lat','lon','v','landHours','trend','organization'])point[key]=a[key]+(b[key]-a[key])*t;return formationState(point,run);
 }
 root.TyphoonModel={keys,defaults,controls,normalize,evaluate,reference,sample,ridgeDefault,ridgePresets,normalizeRidge,basinAt,ridgeGeometry,heightField,ridgeWind,steering,angularVelocity,trajectory,positionAt,classifyTrack,isLand,regionName,formationEnvironment,validateGenesis,formationFlow,formationVelocity,createFormation,advanceFormation,readFormation};
})(typeof window==='undefined'?globalThis:window);
