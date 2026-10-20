"""Build an original Asian typhoon teaching diagram from local Natural Earth land."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parts = []
def add(s):
    parts.append(s)
def text(x, y, value, size=18, fill='#294956', extra=''):
    add(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" {extra}>{escape(value)}</text>')
def xy(lon, lat):
    return 50+(lon-100)*18.5, 165+(46-lat)*18.5
def land():
    for feature in json.loads((ROOT/'assets/land.geojson').read_text())['features']:
        geo=feature['geometry']
        polygons=geo['coordinates'] if geo['type']=='MultiPolygon' else [geo['coordinates']]
        for rings in polygons:
            if not any(98<=p[0]<=156 and 0<=p[1]<=48 for ring in rings for p in ring):
                continue
            d=' '.join('M'+'L'.join(f'{xy(*p)[0]:.2f},{xy(*p)[1]:.2f}' for p in ring)+'Z' for ring in rings)
            add(f'<path d="{d}"/>')

add('''<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1120" viewBox="0 0 1100 1120" role="img" aria-labelledby="title desc">
<title id="title">亚洲台风路径与副热带高压示意图</title>
<desc id="desc">真实亚洲海岸线上的虚构教学路径：从菲律宾以东洋面生成，向西北移动并增强，在中国东南沿海登陆，进入内陆后通常逐渐减弱。东侧示意副高的北半球顺时针环流。路径和副高均非历史实况，不显示虚构日期、风速或降雨观测值。</desc>
<defs>
 <linearGradient id="sea" x2="0" y2="1"><stop stop-color="#dfedf1"/><stop offset="1" stop-color="#c6e4ee"/></linearGradient>
 <marker id="goldArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#b78c36"/></marker>
 <marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#dc626a"/></marker>
 <clipPath id="mapClip"><rect x="30" y="145" width="1040" height="820" rx="14"/></clipPath>
 <symbol id="storm" viewBox="-25 -25 50 50"><path d="M-3-4C-17-16-22 2-12 12C-23 6-24-8-14-17C-6-24 8-17 9-7C23-3 19 17 7 20C19 10 12-2 4-1Z" fill="currentColor"/><circle r="7" fill="none" stroke="currentColor" stroke-width="4"/></symbol>
</defs>
<g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif">
<rect width="1100" height="1120" rx="18" fill="#f5f7f3"/>
<rect x="32" y="32" width="5" height="80" rx="2" fill="#dc626a"/>
''')
text(53,58,'西北太平洋 · 亚洲',15,'#64808b', 'letter-spacing="3"')
text(50,102,'一场台风，怎样走向陆地？',36,'#203d48','font-weight="700"')
text(1043,59,'路径与引导气流',16,'#64808b','text-anchor="end"')
text(1043,91,'教学示意 · 非实际个例',16,'#9b5860','text-anchor="end"')
add('<g clip-path="url(#mapClip)"><rect x="30" y="145" width="1040" height="820" fill="url(#sea)"/>')
add('<g stroke="#8db7c5" stroke-width="1" opacity=".28">')
for lon in range(100,156,10):
    x,_=xy(lon,0);add(f'<path d="M{x} 145V965"/>')
for lat in range(5,47,10):
    _,y=xy(100,lat);add(f'<path d="M30 {y}H1070"/>')
add('</g><g fill="#d5dbcd" stroke="#92a8a0" stroke-width="1.3" stroke-linejoin="round" fill-rule="evenodd">')
land();add('</g>')
for lon in [110,120,130,140,150]:
    x,_=xy(lon,0);text(x,944,f'{lon}°E',12,'#7295a1','text-anchor="middle"')
for lat in [10,20,30,40]:
    _,y=xy(100,lat);text(1048,y-5,f'{lat}°N',12,'#7295a1','text-anchor="end"')
for lon,lat,name,size in [(110,36,'中国',30),(104,23,'越南',17),(120.6,15,'菲律宾',19),(134,37,'日本',18),(126.4,39,'朝鲜半岛',16),(113,16,'南 海',18),(144,14,'西 北 太 平 洋',21)]:
    x,y=xy(lon,lat);text(x,y,name,size,'#536e70','text-anchor="middle"')
x,y=xy(121,23.7)
text(x+18,y+8,'中国台湾省',17,'#375963')
add(f'<path d="M{x+12} {y+3}l-13 0" stroke="#58777e" fill="none"/>')
# The subtropical ridge and all arrows below are conceptual, not reanalysis contours.
add('''<ellipse cx="835" cy="392" rx="195" ry="112" fill="#eac56c" fill-opacity=".22" stroke="#c59e4e" stroke-width="2" stroke-dasharray="8 8"/>
<ellipse cx="835" cy="392" rx="140" ry="72" fill="none" stroke="#c59e4e" stroke-opacity=".45"/>
<g fill="none" stroke="#b78c36" stroke-width="5" stroke-linecap="round" marker-end="url(#goldArrow)">
<path d="M715 301Q894 239 994 341"/><path d="M1009 409Q997 526 769 531Q692 533 621 505"/><path d="M630 450Q597 377 665 326"/>
</g>''')
text(835,380,'H',46,'#a57c29','font-weight="700" text-anchor="middle"')
text(835,415,'副热带高压',23,'#8f702f','font-weight="600" text-anchor="middle"')
text(835,443,'位置、形状与气流均为示意',13,'#9b8355','text-anchor="middle"')
text(805,564,'沿副高南侧、西侧移动',17,'#96722e','text-anchor="middle"')
route='M790 813C741 794 672 759 605 720S514 684 480 674S423 663 399 615C385 586 398 565 411 544S386 499 365 461'
add(f'<path d="{route}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".8"/><path id="teachingTrack" d="{route}" fill="none" stroke="#dc626a" stroke-width="6" stroke-linecap="round" marker-end="url(#routeArrow)"/>')
# Landfall warning marker does not claim a quantitative rainfall footprint.
add('<circle cx="413.4" cy="537.6" r="25" fill="none" stroke="#dc626a" stroke-width="2" stroke-dasharray="4 4"/>')
stages=[(790,813,1,770,875,'洋面生成','已有热带扰动，在有利环境中发展'),(605,720,2,671,693,'向西北移动、增强','暖海水等条件有利时可增强'),(399,615,3,577,609,'接近陆地','沿海风雨风险逐渐增大'),(413.4,537.6,4,100,514,'在大陆沿海登陆','中心从海上进入陆地'),(365,461,5,83,389,'进入内陆，通常减弱','海洋热量和水汽供给减少')]
for x,y,n,lx,ly,title,subtitle in stages:
    if n in [3,4,5]:
        end_x = lx-10 if n==3 else lx+270
        add(f'<path d="M{x} {y}L{end_x} {ly+10}" fill="none" stroke="#637e86" stroke-width="1.5"/>')
    if n<4:
        add(f'<use href="#storm" x="{x-23}" y="{y-23}" width="46" height="46" style="color:#425c68"/>')
    else:
        add(f'<circle cx="{x}" cy="{y}" r="9" fill="#dc626a" stroke="white" stroke-width="3"/>')
    # Numbered labels stay distinct from the cyclone symbols and can be read on a projector.
    add(f'<rect x="{lx-10}" y="{ly-27}" width="280" height="75" rx="9" fill="#f8fbf8" fill-opacity=".94"/>')
    add(f'<circle cx="{lx+4}" cy="{ly-6}" r="12" fill="#dc626a"/>')
    text(lx+4,ly-1,str(n),14,'white','text-anchor="middle" font-weight="700"')
    text(lx+25,ly,title,21,'#294956','font-weight="650"')
    # Last stage of the long label uses smaller text so it remains inside the card.
    text(lx+3,ly+28,subtitle,13 if n==1 else 14,'#617a83')
# A separate inset explains the mechanism without mixing in Sandy's blocking/cold-air event.
add('''<rect x="61" y="682" width="305" height="223" rx="12" fill="#f7faf7" stroke="#a9bcc0"/>
<ellipse cx="256" cy="787" rx="68" ry="40" fill="#eac56c" fill-opacity=".3" stroke="#c59e4e"/>
<path d="M285 842Q176 867 159 800Q148 759 185 742" fill="none" stroke="#b78c36" stroke-width="4" marker-end="url(#goldArrow)"/>
''')
text(81,714,'副高怎样“引路”？',19,'#294956','font-weight="650"')
text(256,795,'H',29,'#a57c29','text-anchor="middle" font-weight="700"')
text(84,875,'北半球副高周围为顺时针环流',14,'#617a83')
add('</g>')
add('<path d="M51 1000H99" stroke="#dc626a" stroke-width="6" stroke-linecap="round"/>')
text(114,1006,'台风路径',17)
add('<path d="M272 1000H320" stroke="#b78c36" stroke-width="4" marker-end="url(#goldArrow)"/>')
text(336,1006,'引导气流',17)
add('<use href="#storm" x="511" y="980" width="38" height="38" style="color:#425c68"/>')
text(563,1006,'热带气旋中心',17)
text(51,1054,'也可能不登陆：副高东退等环流变化，可使台风在海上转向。',19,'#294956','font-weight="600"')
text(51,1085,'路径由多种环流共同影响；减弱后仍可能带来强降雨。海岸线：Natural Earth；机制依据：香港天文台。',14,'#70848a')
add('</g></svg>')
target=ROOT/'assets/typhoon-diagram.svg'
target.write_text('\n'.join(parts)+'\n')
print(f'Built {target.name}: {target.stat().st_size:,} bytes')
