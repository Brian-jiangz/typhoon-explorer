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

## 结构示意

`storm-view.js` 使用本地 three.js、真实地表影像和程序化三维云粒子构建示意台风。风眼、眼墙、雨带的位置用于教学识别，云高经过夸张，云形、大小、旋转与气流不代表实际观测或数值天气模拟。半剖面仅隐藏前半部云粒子；地表不被剖开。气流曲线强调低空流入、眼墙上升和高空流出，并以另一颜色表示眼内下沉。

风速柱仅在部位解释中表达定性差异，不给出实测值；高空流出不显示风速柱。动画不能用来反演风速。部分台风没有清晰风眼；危险天气也可出现在远离中心的区域。

WebGL 不可用时显示平面结构备选图，保留部位说明和全部挑战；不宣称可进行三维剖切。减少动态偏好下，云系与气流光点默认静止，支持手动启用。

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
