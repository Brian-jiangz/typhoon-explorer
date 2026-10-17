"""Build a small offline monthly background and BE02 PI lookup from NOAA data.
Usage: PYTHONPATH=<temporary tcpypi installation> python scripts/build-climate.py --cache <download directory>
Dependencies: numpy, xarray, netCDF4, tcpypi==1.4. Raw inputs remain in --cache.
"""
import argparse, hashlib, importlib.metadata, json, platform, subprocess
from pathlib import Path
import numpy as np
import xarray as xr
from tcpyPI import pi
from tcpyPI.utilities import es_cc, rv

ROOT=Path(__file__).resolve().parents[1]
SOURCES={name:'https://downloads.psl.noaa.gov/Datasets/'+path for name,path in {
 'sst':'noaa.ersst.v5/sst.mon.ltm.1991-2020.nc',
 **{name:'ncep.reanalysis.derived/pressure/'+name+'.mon.ltm.1991-2020.nc' for name in ['air','rhum','uwnd','vwnd']},
 'slp':'ncep.reanalysis.derived/surface/slp.mon.ltm.1991-2020.nc'}.items()}

def clean(a):
 return [None if not np.isfinite(v) else round(float(v),2) for v in np.asarray(a).ravel()]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);args=ap.parse_args();args.cache.mkdir(parents=True,exist_ok=True)
 manifest={}; ds={}
 for name,url in SOURCES.items():
  path=args.cache/(name+'.nc')
  if not path.exists():subprocess.run(['curl','-fLsS','--max-time','900',url,'-o',str(path)],check=True)
  manifest[name]={'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size}
  ds[name]=xr.open_dataset(path,decode_times=False).sortby('lat').load()
  manifest[name]['units']=ds[name][name].attrs['units']
  assert ds[name].time.size==12
  assert ds[name].time.attrs['climo_period']=='1991/01/01 - 2020/12/31'
 lats=np.arange(0,60.01,2.5);lons=np.arange(90,200.01,2.5);shape=(12,len(lats),len(lons));temps=np.arange(6,34.01,2)
 fields={k:np.full(shape,np.nan) for k in ['sst','humidity','du','dv','slp','pi','pmin','outflow','steerU','steerV','lowU','lowV']}
 lookups={k:np.full(shape+(len(temps),),np.nan) for k in ['piBySst','pminBySst']}
 pressure=ds['air'].level.values.astype(float)
 assert np.all(np.diff(pressure)<0),pressure
 rh_levels=ds['rhum'].level.values
 status={}; validated=[]
 for m in range(12):
  for i,lat in enumerate(lats):
   for j,lon in enumerate(lons):
    levels=np.array([850,700,600,500,400,300,250,200])
    u=ds['uwnd'].uwnd.sel(lat=lat,lon=lon);v=ds['vwnd'].vwnd.sel(lat=lat,lon=lon)
    fields['steerU'][m,i,j]=-np.trapezoid(u.sel(level=levels).values[m,:],levels)/650
    fields['steerV'][m,i,j]=-np.trapezoid(v.sel(level=levels).values[m,:],levels)/650
    fields['lowU'][m,i,j]=float(u.sel(level=[850,700]).values[m,:].mean())
    fields['lowV'][m,i,j]=float(v.sel(level=[850,700]).values[m,:].mean())
    # Mask-aware bilinear SST: only the four native ERSST grid corners participate.
    sla=ds['sst'].lat.values;slo=ds['sst'].lon.values
    a=np.searchsorted(sla,lat,side='right')-1;b=np.searchsorted(slo,lon,side='right')-1
    fy=(lat-sla[a])/(sla[a+1]-sla[a]);fx=(lon-slo[b])/(slo[b+1]-slo[b]);total=0;weight=0
    for dy,wy in [(0,1-fy),(1,fy)]:
     for dx,wx in [(0,1-fx),(1,fx)]:
      v=float(ds['sst'].sst.values[m,a+dy,b+dx]);w=wy*wx
      if np.isfinite(v):total+=v*w;weight+=w
    if weight<.5:continue
    sst=total/weight
    # NCEP coordinates are sampled without horizontal regridding.
    air_units=ds['air'].air.attrs['units'];assert air_units in ['degC','K']
    air=ds['air'].air.sel(lat=lat,lon=lon).values[m,:].astype(float)-(273.15 if air_units=='K' else 0)
    humidity=ds['rhum'].rhum.sel(lat=lat,lon=lon).values[m,:].astype(float)
    mixing=np.zeros_like(pressure)
    for k,p in enumerate(pressure):
     where=np.where(rh_levels==p)[0]
     # pyPI explicitly permits zero mixing ratio above the humidity sounding.
     if len(where):mixing[k]=1000*rv(es_cc(air[k])*np.clip(humidity[where[0]],0,100)/100,p)
    slp=float(ds['slp'].slp.sel(lat=lat,lon=lon).values[m])
    u=ds['uwnd'].uwnd.sel(lat=lat,lon=lon);v=ds['vwnd'].vwnd.sel(lat=lat,lon=lon)
    du=float((u.sel(level=200)-u.sel(level=850)).values[m]);dv=float((v.sel(level=200)-v.sel(level=850)).values[m])
    base=pi(sst,slp,pressure,air,mixing,CKCD=.9,V_reduc=.8,ascent_flag=0,diss_flag=1,ptop=50,miss_handle=1)
    status[str(base[2])]=status.get(str(base[2]),0)+1
    for k,value in {'sst':sst,'humidity':humidity[np.where(rh_levels==700)[0][0]],'du':du,'dv':dv,'slp':slp}.items():fields[k][m,i,j]=value
    if base[2]==1 and np.all(np.isfinite(base[:2])):
     fields['pi'][m,i,j]=base[0];fields['pmin'][m,i,j]=base[1];fields['outflow'][m,i,j]=base[3]
    for k,t in enumerate(temps):
     out=pi(float(t),slp,pressure,air,mixing,CKCD=.9,V_reduc=.8,ascent_flag=0,diss_flag=1,ptop=50,miss_handle=1)
     if out[2]==1 and np.all(np.isfinite(out[:2])):
      lookups['piBySst'][m,i,j,k]=out[0];lookups['pminBySst'][m,i,j,k]=out[1]
    if (m,lat,lon) in [(0,20,140),(7,20,140),(0,40,150),(7,40,150)]:
     validated.append({'month':m+1,'lat':lat,'lon':lon,'sst':sst,'humidity':fields['humidity'][m,i,j],'shear':float(np.hypot(du,dv)),'pi':float(base[0]) if np.isfinite(base[0]) else None,'pmin':float(base[1]) if np.isfinite(base[1]) else None,'flag':int(base[2])})
  print('Computed month',m+1,flush=True)
 meta={'version':'noaa-1991-2020-pi-v1','period':'1991–2020','lat':clean(lats),'lon':clean(lons),'sstLevels':clean(temps),'shape':list(shape),'fieldOrder':'month,lat,lon; SST lookup adds final SST dimension','sources':manifest,'piMethod':'tcpyPI 1.4; BE02; CKCD=0.9; V_reduc=0.8; reversible; dissipative heating; ptop=50 hPa','humidity':'700 hPa RH (%)','shear':'interpolate monthly mean u200-u850 and v200-v850, then vector magnitude; NOT mean instantaneous shear','profileHumidity':'NCEP RH converted with tcpyPI es_cc/rv at available pressure levels; missing upper levels above 300 hPa assigned zero as permitted by pyPI','statistic':'PI of monthly climatological profiles; NOT climatological mean of instantaneous PI','sstInterpolation':'four native ERSST corners with finite-weight renormalization; minimum finite weight 0.5','piStatusCounts':status,'python':platform.python_version(),'packages':{p:importlib.metadata.version(p) for p in ['numpy','xarray','netCDF4','tcpypi']},'spotChecks':validated}
 data={**meta,'fields':{k:clean(a) for k,a in {**fields,**lookups}.items()}}
 text='/* NOAA monthly background; see climate-manifest.json and SOURCES.md. */\n(function(root){root.TYPHOON_CLIMATE='+json.dumps(data,separators=(',',':'),allow_nan=False)+';})(typeof window===\'undefined\'?globalThis:window);\n'
 (ROOT/'assets/climate-data.js').write_text(text)
 meta['artifactSha256']=hashlib.sha256(text.encode()).hexdigest();meta['artifactBytes']=len(text.encode());(ROOT/'assets/climate-manifest.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False,allow_nan=False)+'\n')
 print('PI status counts',status,'bytes',len(text.encode()),flush=True)
 for point in validated:print(point,flush=True)

if __name__=='__main__':main()
