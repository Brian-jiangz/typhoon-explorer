# 台风结构与知识挑战：科学依据与实现说明

2026-10-19

## 内容依据

- NOAA JetStream，Tropical Cyclone Structure：风眼、眼墙、螺旋雨带和立体环流；风眼过境的暂时平静不代表危险解除。
  https://www.noaa.gov/jetstream/tropical/tropical-cyclone-introduction/tropical-cyclone-structure
- NOAA Ocean Service，What is the difference between a hurricane and a typhoon?：热带气旋的主要组成。
  https://oceanservice.noaa.gov/facts/cyclone.html
- 美国国家气象局，Actions to Take When a Tropical Storm or Hurricane Threatens：留在安全地点、远离窗户、准备必要用品、关注官方指引。
  https://www.weather.gov/safety/hurricane-action
- 香港天文台，Weather Systems Mix and Match – Tropical Cyclone Track：副高周围的引导气流及路径变化概念。
  https://www.hko.gov.hk/en/education/tropical-cyclone/tracking/00707-Weather-Systems-Mix-and-Match-Tropical-Cyclone-Track.html

避险内容为普遍性科普，实际行动以所在地官方预警、转移和避险安排为准。页面不按台风等级自动推断停课或危险解除。

- [Met Office 热带气旋结构说明](https://www.metoffice.gov.uk/research/weather/tropical-cyclones/facts)：高耸对流云墙、高空外流云层及眼内下沉。

## 结构示意

`storm-view.js` 使用本地 three.js、真实地表影像和程序化三维云粒子构建示意台风。按参考图的结构概念重做高耸、向外倾斜的眼墙，高空环状云盾和四组起伏的螺旋雨带。未复制参考图的图像资产。云粒子、封闭的眼墙/云盾/雨带几何均在同一三维空间中，垂直尺度经过夸张，不能从图上量取实际云高、水平尺度、风速或雨强。

默认先显示剖开视角和气流。剖面切面随相机方位变化；所有云体使用同一半空间裁切。截面由这些云体网格的三角形与切面求交、连接闭合轮廓并填充，保留贯通的风眼，不另画一张与三维体无关的截面图。提供立体看、剖开看、拖动/键盘旋转、滚轮/双指缩放及视角复位。没有新增俯视模式。地球和海面不作物理剖切。

气流分四种颜色：红色为近海面向内流入，金色为眼墙附近上升，蓝色为高空向外流出，紫色为眼内下沉。北半球低层流入采用逆时针向内旋入，高空流出曲线示意相反方向的反气旋性外流。立体视角显示三维螺旋流线，剖面视角使用沿截面的流入、上升、流出与下沉示意，箭头和运动光点来自同一曲线。并非所有真实台风都具有这些理想结构，流线、云形及云盾范围不是实况诊断；高空流出也不表示每一处都严格遵循同一旋转模式。暂停动画与减少动态偏好同时作用于云系和气流，默认动画速度不代表实际空气移动速度。

风速柱仅在部位解释中表达定性差异，不给出实测值；高空流出不显示风速柱。动画不能用来反演风速。部分台风没有清晰风眼；危险天气也可出现在远离中心的区域。

WebGL 不可用时显示中文静态剖面备选图，保留部位说明和全部挑战；不宣称可进行三维剖切。减少动态偏好下，云系与气流光点默认静止，支持手动启用。

## 25题题库与随机五题

1. 找出眼墙：图上编号或部位选择按钮均可回答。
2. 保持脊线纬度不变，向西伸展副高，使路径以西行或西北行为主：复用地球页同一 `TyphoonModel.trajectory` 和 Natural Earth 海岸线，按模型轨迹的移动行为判断，触岸地区不作为答题条件。箭头与路径使用同一引导气流，未另设固定答案路径。
3. 风雨暂时减弱后是否外出：保留安全地点并关注官方信息为合适选择。
4. 准备三件事：提前收好花盆、准备必要用品、查看官方预警与当地避险安排。画面随选择改变。

以上四道交互题保留在完整25题题库中，不再固定每轮必出。其余题目涵盖风眼下沉、雨带、高空流出、北半球旋转、暖海水、暖水层厚度、风切变、中层湿度、赤道附近生成限制、已有扰动、高纬较冷海域、登陆衰减、登陆后降雨、大尺度引导、不一定登陆、移速与风速区别、台风/飓风名称、风暴潮、涉水风险、官方转移指引及路径不确定性。

打开页面时采用 Fisher–Yates 洗牌，从25道题中抽取5道，轮内不重复。点击“刷新抽题”或完成后的重新抽题按钮，立即清空本轮选择、完成标记及提示，重新抽取；允许部分题目与前一轮重合，但避免五道题集合完全相同。单选、多选和副高操作题按题目类型判分，不依赖题目位于第几道。完成页只回顾本轮实际抽到的五道题。

可以重试，无倒计时、专家职称或排名。进度仅保存在当前页面内存中，栏目导航不会重新抽题，浏览器刷新会重新开始随机一轮。

新增内容依据：

- [NOAA：热带气旋形成条件及影响](https://www.noaa.gov/education/resource-collections/weather-atmosphere/hurricanes)。
- [NOAA Ocean Service：暖海水和风切变](https://oceanservice.noaa.gov/facts/how-hurricanes-form.html)。暖海水与26.5℃是常见参考条件，不作为保证生成或增强的硬开关。
- [NOAA 海上气象指南：暖水层、形成与生命周期](https://www.nhc.noaa.gov/marinersguide.pdf)。
- [NOAA：风暴危险与风暴潮](https://www.noaa.gov/explainers/explainer-understanding-hurricane-hazards)。
- [NWS：不要穿越洪水、积水道路](https://www.weather.gov/safety/flood-turn-around-dont-drown)。
- 原有结构与安全依据同上。不得把沙盘路径、移动速度或副高单个位置作为真实预报；题目采用“通常”“其他条件相近”等条件限定，保留海上转向、减弱及温带转化等实际可能性。

地表、海岸线、three.js 许可和简化路径模型详见 SOURCES.md。原始二维知识页仅在本地备份，不随站点发布。

## 降水表述修订

2026年10月19日根据科学审阅意见修订第1题、第6题和结构页的眼墙、雨带说明。第1题仅考查具有清晰眼墙的成熟台风的近地面最大风速位置，不把最大风速与最强降水合并为同一结论。第6题区分瞬时降雨强度与累计降雨量，并说明外围雨带、对流单体反复经过、水汽辐合、地形抬升和降雨持续时间的作用。两种降水指标的最大值都不必位于眼墙附近。

参考：Lamers et al. (2023), Forecasting tropical cyclone rainfall and flooding hazards and impacts, Tropical Cyclone Research and Review 12, 100–112，[DOI](https://doi.org/10.1016/j.tcrr.2023.06.005)，[NOAA公开全文](https://repository.library.noaa.gov/view/noaa/63565/noaa_63565_DS1.pdf)。该综述讨论移动速度、地形、水汽、切变及其他天气系统对降水分布的影响，并强调降水不能由最大风速单独判断。本次未将尚未核实的具体站点累计雨量数值加入题库。

## 亚洲台风路径示意图

2026年10月20日新增独立的 `diagram.html`，主导航顺序为地球模拟、台风结构、台风示意图、知识挑战。保留原有三维结构页与25题随机挑战。

`assets/typhoon-diagram.svg` 为原创中文矢量信息图，由 `scripts/build-diagram.py` 从本地 Natural Earth 1:110m 海岸线绘制。参考用户所给桑迪图片的路径叙事方式，将背景改为亚洲与西北太平洋，不复制原图的底图、图形、品牌、文字与数据。

海岸线是真实地理数据；红色轨迹、阶段位置、副高轮廓和引导箭头是虚构的定性教学示意，不对应杜苏芮、桑迪或任何历史个例，不使用日期、风速、雨量、降雪范围或实况气压等未经观测支撑的数值。副高以北半球顺时针环流示意，说明台风沿其南侧向西、西侧向北移动的一种可能情况。未把副高单一位置当作路径唯一决定因素，也未暗示所有台风均登陆。

机制依据为[香港天文台《天气系统配对——热带气旋路径》](https://www.hko.gov.hk/en/education/tropical-cyclone/tracking/00707-Weather-Systems-Mix-and-Match-Tropical-Cyclone-Track.html)：副高、西风槽与季风槽及其相互作用都会影响路径；副高偏东时可能海上转向，向西伸展时可能向南海方向移动。这些为概念模型，不能用于预报。登陆后通常衰减的解释采用 NOAA JetStream 的热带气旋形成与衰减机制；减弱不等于降雨危险结束。

登陆衰减依据：[NOAA AOML 热带气旋常见问题 C2](https://www.aoml.noaa.gov/hrd/tcfaq/C2.html?print=yes)。热量和水汽的海洋供给减少是主要原因，不将地表摩擦单独视为台风衰亡的决定因素。
