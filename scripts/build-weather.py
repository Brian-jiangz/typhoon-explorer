"""Package one historical 6-hour weather case, without fitting winds to best track.
PYTHONPATH=<tcpypi runtime> python scripts/build-weather.py --cache <raw cache>
Raw data: NCEP/NCAR R1 6-hourly pressure/surface, daily NOAA OISST, JMA best track.
"""
import argparse,hashlib,io,json,zipfile
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlencode
import requests,numpy as np,xarray as xr
from tcpyPI import pi
from tcpyPI.utilities import es_cc,rv
ROOT=Path(__file__).resolve().parents[1]
PARAMS=dict(north=45,south=0,west=100,east=160,time_start='2023-07-20T00:00:00Z',time_end='2023-07-31T00:00:00Z',accept='netcdf4')
JMA='https://www.jma.go.jp/jma/jma-eng/jma-center/rsmc-hp-pub-eg/Besttracks/bst_all.zip'
def clean(a):return [None if not np.isfinite(v) else round(float(v),2) for v in np.asarray(a).ravel()]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);cache=ap.parse_args().cache;cache.mkdir(parents=True,exist_ok=True)
 sources={};ds={}
 for name in ['uwnd','vwnd','hgt','air','rhum','slp','sst']:
  folder='ncep.reanalysis/pressure' if name not in ['slp','sst'] else 'ncep.reanalysis/surface' if name=='slp' else 'noaa.oisst.v2.highres'
  filename=name+'.2023.nc' if name!='sst' else 'sst.day.mean.2023.nc'
  query={**PARAMS,'var':name,**({'horizStride':10} if name=='sst' else {})};url='https://psl.noaa.gov/thredds/ncss/grid/Datasets/'+folder+'/'+filename+'?'+urlencode(query)
  path=cache/(name+'-doksuri.nc')
  if not path.exists():r=requests.get(url,timeout=180);r.raise_for_status();path.write_bytes(r.content)
  ds[name]=xr.open_dataset(path).sortby('lat').load();sources[name]={'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,'units':ds[name][name].attrs['units']}
 path=cache/'bst_all.zip'
 if not path.exists():r=requests.get(JMA,timeout=120);r.raise_for_status();path.write_bytes(r.content)
 archive=zipfile.ZipFile(io.BytesIO(path.read_bytes()));lines=archive.read('bst_all.txt').decode('ascii').splitlines();i=next(i for i,l in enumerate(lines) if l.startswith('66666 2305'));n=int(lines[i].split()[2]);jma='\n'.join(lines[i:i+n+1])+'\n';(cache/'doksuri-jma.txt').write_text(jma)
 sources['jma']={'url':JMA,'archiveSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'extractedSha256':hashlib.sha256(jma.encode()).hexdigest(),'storm':'2305 DOKSURI','revision':lines[i].split()[-1]}
 origin=np.datetime64('2023-07-21T00:00:00');times=((ds['uwnd'].time.values-origin)/np.timedelta64(1,'h')).astype(float);use=times>=0;hours=times[use];lats=ds['uwnd'].lat.values;lons=ds['uwnd'].lon.values;P=ds['air'].level.values.astype(float);rhlev=ds['rhum'].level.values;temps=np.arange(6,34.01,2);shape=(len(hours),len(lats),len(lons))
 fields={k:np.full(shape,np.nan) for k in ['sst','humidity','du','dv','slp','pi','pmin','outflow','steerU','steerV','hgt500','u500','v500','annularU','annularV']};lookup={k:np.full(shape+(len(temps),),np.nan) for k in ['piBySst','pminBySst']}
 arrays={k:d[k].values for k,d in ds.items()};levels=np.array([850,700,600,500,400,300,250,200]);idx=np.array([np.where(P==k)[0][0] for k in levels]);k850=np.where(P==850)[0][0];k200=np.where(P==200)[0][0];k500=np.where(P==500)[0][0]
 assert sources['air']['units']=='degK';assert sources['slp']['units']=='Pascals';assert sources['hgt']['units']=='m'
 status={};checks=[]
 for t,raw_t in enumerate(np.where(use)[0]):
  timestamp=ds['air'].time.values[raw_t];day=np.datetime64(timestamp,'D');sst_t=int(np.where(ds['sst'].time.values.astype('datetime64[D]')==day)[0][0])
  U=arrays['uwnd'][raw_t];V=arrays['vwnd'][raw_t]
  for i,lat in enumerate(lats):
   for j,lon in enumerate(lons):
    fields['steerU'][t,i,j]=-np.trapezoid(U[idx,i,j],levels)/650;fields['steerV'][t,i,j]=-np.trapezoid(V[idx,i,j],levels)/650
    fields['hgt500'][t,i,j]=arrays['hgt'][raw_t,k500,i,j];fields['u500'][t,i,j]=U[k500,i,j];fields['v500'][t,i,j]=V[k500,i,j]
    sla=ds['sst'].lat.values;slo=ds['sst'].lon.values;a=np.searchsorted(sla,lat,side='right')-1;b=np.searchsorted(slo,lon,side='right')-1
    if a<0 or b<0 or a>=len(sla)-1 or b>=len(slo)-1:continue
    fy=(lat-sla[a])/(sla[a+1]-sla[a]);fx=(lon-slo[b])/(slo[b+1]-slo[b]);total=0;weight=0
    for dy,wy in [(0,1-fy),(1,fy)]:
     for dx,wx in [(0,1-fx),(1,fx)]:
      v=float(arrays['sst'][sst_t,a+dy,b+dx]);w=wy*wx
      if np.isfinite(v):total+=v*w;weight+=w
    if weight<.5:continue
    SST=total/weight;SLP=float(arrays['slp'][raw_t,i,j])/100;T=arrays['air'][raw_t,:,i,j].astype(float)-273.15;RH=arrays['rhum'][raw_t,:,i,j];R=np.zeros_like(P)
    for k,p in enumerate(P):
     if p in rhlev:R[k]=1000*rv(es_cc(T[k])*np.clip(RH[np.where(rhlev==p)[0][0]],0,100)/100,p)
    result=pi(SST,SLP,P,T,R,CKCD=.9,V_reduc=.8,ascent_flag=0,diss_flag=1,ptop=50,miss_handle=1);status[str(result[2])]=status.get(str(result[2]),0)+1
    for k,v in {'sst':SST,'slp':SLP,'humidity':RH[np.where(rhlev==700)[0][0]],'du':U[k200,i,j]-U[k850,i,j],'dv':V[k200,i,j]-V[k850,i,j]}.items():fields[k][t,i,j]=v
    if result[2]==1:
     for k,v in zip(['pi','pmin','outflow'],[result[0],result[1],result[3]]):fields[k][t,i,j]=v
    for k,sst in enumerate(temps):
     out=pi(float(sst),SLP,P,T,R,CKCD=.9,V_reduc=.8,ascent_flag=0,diss_flag=1,ptop=50,miss_handle=1)
     if out[2]==1:lookup['piBySst'][t,i,j,k]=out[0];lookup['pminBySst'][t,i,j,k]=out[1]
    if (int(hours[t]),lat,lon) in [(0,15,135),(72,20,125),(168,25,120)]:checks.append({'hour':float(hours[t]),'lat':float(lat),'lon':float(lon),'sst':float(SST),'slp':SLP,'temperature850C':float(T[k850]),'pi':float(result[0]),'pmin':float(result[1]),'flag':int(result[2])})
  print('Computed weather hour',hours[t],flush=True)
 # Sensitivity only: 300–800 km area-weighted annular wind, fixed before trajectory comparison.
 Y,X=np.meshgrid(lats,lons,indexing='ij');y=np.radians(Y.ravel());x=np.radians(X.ravel());dist=6371*2*np.arcsin(np.sqrt(np.sin((y[:,None]-y[None,:])/2)**2+np.cos(y[:,None])*np.cos(y[None,:])*np.sin((x[:,None]-x[None,:])/2)**2));w=((dist>=300)&(dist<=800))*np.cos(y)[None,:];w/=w.sum(axis=1)[:,None]
 for target,source in [('annularU','steerU'),('annularV','steerV')]:fields[target]=(fields[source].reshape(len(hours),-1)@w.T).reshape(shape)
 reference=[]
 for line in jma.splitlines()[1:]:
  a=line.split();time=np.datetime64(datetime.strptime(a[0],'%y%m%d%H').isoformat());h=float((time-origin)/np.timedelta64(1,'h'))
  if h<0:continue
  reference.append({'h':h,'lat':int(a[3])*.1,'lon':int(a[4])*.1,'p':int(a[5]),'v':int(a[6])*.514444 if int(a[6]) else None,'grade':int(a[2])})
 meta={'id':'doksuri2023','name':'杜苏芮 2023','startUTC':'2023-07-21T00:00:00Z','hours':clean(hours),'lat':clean(lats),'lon':clean(lons),'sstLevels':clean(temps),'shape':list(shape),'sources':sources,'piMethod':'BE02/tcpyPI 1.4; CKCD=.9; V_reduc=.8; reversible; dissipative; ptop=50 hPa','sstMethod':'NOAA daily OISST subset at 2.5-degree stride; mask-aware bilinear interpolation; daily value assigned to six-hour snapshots for its UTC day; browser linearly interpolates snapshots in time','windMethod':'6-hour NCEP/NCAR R1; 850–200 hPa pressure-weighted local wind; no track nudging, no speed multiplier, no beta drift','reference':reference,'cmaLandfall':{'UTC':'2023-07-28T01:55:00Z','place':'福建晋江','url':'https://www.cma.gov.cn/ztbd/2023zt/2023tf/20230725/2018070910/202307/t20230728_5680547.html'},'spotChecks':checks,'piStatusCounts':status}
 artifact={**meta,'fields':{k:clean(v) for k,v in {**fields,**lookup}.items()}}
 text='/* Historical weather and independent best track. See weather-manifest.json. */\n(function(root){root.TYPHOON_WEATHER='+json.dumps(artifact,separators=(',',':'),allow_nan=False)+';})(typeof window===\'undefined\'?globalThis:window);\n';(ROOT/'assets/weather-doksuri.js').write_text(text)
 meta['artifactSha256']=hashlib.sha256(text.encode()).hexdigest();meta['artifactBytes']=len(text.encode());(ROOT/'assets/weather-manifest.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False,allow_nan=False)+'\n');print('DONE',len(text),checks,flush=True)
if __name__=='__main__':main()
