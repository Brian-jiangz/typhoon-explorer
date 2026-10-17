"""Independently re-read NOAA source profiles and check the packaged diagnostics."""
import argparse, ast, hashlib, json, re
from pathlib import Path
import numpy as np
import xarray as xr
from tcpyPI import pi
from tcpyPI.constants import EPS

root=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);cache=ap.parse_args().cache
manifest=json.loads((root/'assets/climate-manifest.json').read_text())
raw={}
for name,meta in manifest['sources'].items():
 path=cache/(name+'.nc');assert hashlib.sha256(path.read_bytes()).hexdigest()==meta['sha256'];raw[name]=xr.open_dataset(path,decode_times=False).load()
source=(root/'assets/climate-data.js').read_text();data=json.loads(source.split('root.TYPHOON_CLIMATE=',1)[1].rsplit(';})(',1)[0])
ny=len(data['lat']);nx=len(data['lon']);P=raw['air'].level.values.astype(float)
for point in manifest['spotChecks']:
 month=point['month']-1;lat=point['lat'];lon=point['lon'];i=data['lat'].index(lat);j=data['lon'].index(lon);idx=(month*ny+i)*nx+j
 # These four locations coincide with both native grids; no regridding required.
 SST=float(raw['sst'].sst.sel(lat=lat,lon=lon).values[month]);SLP=float(raw['slp'].slp.sel(lat=lat,lon=lon).values[month]);T=raw['air'].air.sel(lat=lat,lon=lon).values[month,:].astype(float)
 assert raw['air'].air.attrs['units']=='degC'
 R=[]
 for p,t in zip(P,T):
  if p in raw['rhum'].level.values:
   rh=float(raw['rhum'].rhum.sel(lat=lat,lon=lon,level=p).values[month]);e=rh*.01*6.112*np.exp(17.67*t/(243.5+t));R.append(1000*EPS*e/(p-e))
  else:R.append(0.)
 V,PMIN,flag,*_=pi(SST,SLP,P,T,np.array(R),CKCD=.9,ascent_flag=0,diss_flag=1,V_reduc=.8,ptop=50,miss_handle=1)
 assert flag==1;assert abs(V-data['fields']['pi'][idx])<.006;assert abs(PMIN-data['fields']['pmin'][idx])<.006;assert abs(SST-data['fields']['sst'][idx])<.006
 U=raw['uwnd'].uwnd.sel(lat=lat,lon=lon);W=raw['vwnd'].vwnd.sel(lat=lat,lon=lon)
 for field,variable in [('lowU',U),('lowV',W)]:assert abs(float(variable.sel(level=[850,700]).values[month,:].mean())-data['fields'][field][idx])<.006
 # Independent discrete pressure integral, not the builder's np.trapezoid call.
 levels=[850,700,600,500,400,300,250,200]
 for field,variable in [('steerU',U),('steerV',W)]:
  values=variable.sel(level=levels).values[month,:];average=sum((levels[k]-levels[k+1])*(values[k]+values[k+1])/2 for k in range(len(levels)-1))/650
  assert abs(average-data['fields'][field][idx])<.006
# Check the upstream package's documented standard sounding benchmark as well.
doc=pi.__doc__;section=doc.split('level_data = np.array(',1)[1].split('>>> P =',1)[0];lines=[line.replace('...', '').strip() for line in section.splitlines()];text='\n'.join(lines);arr=ast.literal_eval(text[text.index('['):text.rindex(']')+1]);arr=np.array(arr,dtype=float)
v,pmin,flag,*_=pi(30.,1010.,arr[:,0],arr[:,1],arr[:,2]);assert flag==1;assert abs(v-82.4845)<.001;assert abs(pmin-900.2039)<.001
print('PASS: six source hashes; native-grid SST and pressure/temperature units; independent humidity conversion and BE02 recomputation; shallow/deep steering integrals; upstream standard-sounding benchmark. Does not validate forecast skill.')
