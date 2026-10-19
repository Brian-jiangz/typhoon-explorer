"""Independent raw-source units, profile, integral and trajectory checks; requires cached inputs."""
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
import xarray as xr
from scipy.interpolate import RegularGridInterpolator
from tcpyPI import pi
from tcpyPI.constants import EPS
root=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);cache=ap.parse_args().cache
meta=json.loads((root/'assets/weather-manifest.json').read_text());source=(root/'assets/weather-doksuri.js').read_text();data=json.loads(source.split('root.TYPHOON_WEATHER=',1)[1].rsplit(';})(',1)[0]);assert hashlib.sha256(source.encode()).hexdigest()==meta['artifactSha256']
raw={}
for name,info in meta['sources'].items():
 if name=='jma':
  assert hashlib.sha256((cache/'bst_all.zip').read_bytes()).hexdigest()==info['archiveSha256'];assert hashlib.sha256((cache/'doksuri-jma.txt').read_bytes()).hexdigest()==info['extractedSha256'];continue
 path=cache/(name+'-doksuri.nc');assert hashlib.sha256(path.read_bytes()).hexdigest()==info['sha256'];raw[name]=xr.open_dataset(path).sortby('lat').load()
assert raw['air'].air.attrs['units']=='degK';assert raw['slp'].slp.attrs['units']=='Pascals';assert raw['hgt'].hgt.attrs['units']=='m';assert data['shape']==[41,19,25]
P=raw['air'].level.values.astype(float);levels=[850,700,600,500,400,300,250,200]
for point in meta['spotChecks']:
 h=point['hour'];lat=point['lat'];lon=point['lon'];timestamp=np.datetime64(data['startUTC'].removesuffix('Z'))+np.timedelta64(int(h),'h');i=data['lat'].index(lat);j=data['lon'].index(lon);index=(int(h/6)*19+i)*25+j
 T=raw['air'].air.sel(time=timestamp,lat=lat,lon=lon).values.astype(float)-273.15;slp=float(raw['slp'].slp.sel(time=timestamp,lat=lat,lon=lon))/100
 # Independent saturation-vapour formula and mixing-ratio conversion.
 R=[]
 for p,t in zip(P,T):
  rh=float(raw['rhum'].rhum.sel(time=timestamp,lat=lat,lon=lon,level=p)) if p in raw['rhum'].level else 0
  e=rh*.01*6.112*np.exp(17.67*t/(243.5+t));R.append(1000*EPS*e/(p-e))
 daily=raw['sst'].sst.sel(time=timestamp.astype('datetime64[D]'));valid=daily.notnull().astype(float);weight=float(valid.interp(lat=lat,lon=lon));assert weight>=.5;SST=float(daily.fillna(0).interp(lat=lat,lon=lon))/weight;assert abs(SST-data['fields']['sst'][index])<.006;v,pm,flag,*_=pi(SST,slp,P,T,np.array(R),CKCD=.9,ascent_flag=0,diss_flag=1,V_reduc=.8,ptop=50,miss_handle=1)
 assert flag==1;assert abs(v-data['fields']['pi'][index])<.006;assert abs(pm-data['fields']['pmin'][index])<.006;assert abs(slp-data['fields']['slp'][index])<.006
 for field,var in [('steerU','uwnd'),('steerV','vwnd')]:
  values=raw[var][var].sel(time=timestamp,lat=lat,lon=lon,level=levels).values
  value=sum((levels[k]-levels[k+1])*(values[k]+values[k+1])/2 for k in range(7))/650
  assert abs(value-data['fields'][field][index])<.006
# Integrate directly from original, unrounded NetCDF with SciPy interpolation.
times=(raw['uwnd'].time.values-np.datetime64('2023-07-21T00'))/np.timedelta64(1,'h');coords=(times,raw['uwnd'].lat.values,raw['uwnd'].lon.values);winds=[]
for var in ['uwnd','vwnd']:
 a=raw[var][var].sel(level=levels).values.astype(float);mean=sum((levels[k]-levels[k+1])*(a[:,k]+a[:,k+1])/2 for k in range(7))/650;winds.append(RegularGridInterpolator(coords,mean))
la,lo=13.8,133.;history={0:(la,lo)}
def vel(h,la,lo):return float(winds[1]((h,la,lo)))*3600/6371000*180/np.pi,float(winds[0]((h,la,lo)))*3600/6371000/np.cos(np.radians(la))*180/np.pi
for h in np.arange(0,228,.25):
 a,b=vel(h,la,lo);a,b=vel(h+.125,la+a*.125,lo+b*.125);la+=a*.25;lo+=b*.25;history[float(h+.25)]=(la,lo)
js="for(const f of ['assets/land.js','assets/weather-doksuri.js','weather.js','simulation.js'])require('./'+f);const d=global.TYPHOON_WEATHER,r=TyphoonModel.createFormation({start:d.reference[0],initialWind:d.reference[0].v,weather:true});TyphoonModel.advanceFormation(r,228);console.log(JSON.stringify(r.history.filter(x=>[24,72,120,168,228].includes(x.h)).map(x=>[x.h,x.lat,x.lon])));"
points=json.loads(subprocess.check_output(['node','-e',js],cwd=root,text=True))
for h,la,lo in points:
 a,b=history[h];km=111.2*np.hypot(la-a,(lo-b)*np.cos(np.radians(a)));assert km<1,(h,km)
# Reparse official fixed record positions and wind conversion independently.
records=(cache/'doksuri-jma.txt').read_text().splitlines()[1:];first=next(x for x in records if x.startswith('23072100'))
columns=first.split();assert abs(int(columns[3])/10-data['reference'][0]['lat'])<1e-10;assert abs(int(columns[4])/10-data['reference'][0]['lon'])<1e-10;assert abs(int(columns[6])*.514444-data['reference'][0]['v'])<1e-10
print('PASS: all source hashes; Kelvin/Pascal conversions; independent PI/profile and pressure-integral checks; SciPy trajectories from unrounded raw winds agree within 1 km at 24/72/120/168/228 h; official initial record and knot conversion. One case, not forecast validation.')
