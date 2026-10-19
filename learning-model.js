/* Shared content and pure challenge rules. No observed storm data. */
(function(root){
 const parts=[
 {id:'eye',number:'01',name:'风眼',title:'风暴中心，<br>却常常比较平静。',text:'这片较少云的中心，就是风眼。空气在这里下沉，风通常比四周小；并不是每场台风都有清晰的风眼。',mood:'中心较平静',wind:1,takeaway:'风眼经过时，风可能暂时减弱。另一侧眼墙还会带来危险风雨，别急着外出。',action:'转个角度看风眼 ↗',view:'orbit'},
 {id:'wall',number:'02',name:'眼墙',title:'近中心的强风，<br>常集中在这里。',text:'风眼外紧挨着的一圈高耸云墙，叫眼墙。成熟台风的近地面最大风速通常位于眼墙附近。这里也常有强降水，但最大瞬时雨强和最大累计雨量并不一定出现在这里。',mood:'近中心强风集中区',wind:5,takeaway:'最大风速与最大降雨的位置不必重合；外围雨带也可能产生极端降水。',action:'剖开眼墙看看 ↗',view:'cut'},
 {id:'band',number:'03',name:'雨带',title:'雨一阵接一阵，<br>是云带在经过。',text:'一条条弯曲的云带向外伸展，像风暴的手臂。雨带经过时，风雨可能突然增强；两条雨带之间又会暂时减弱。',mood:'外围风雨起伏',wind:3,takeaway:'雨带反复经过、水汽辐合或地形抬升都可能增强降水。瞬时雨强与累计雨量的最大值，都不一定在眼墙附近。',action:'转个角度看雨带 ↗',view:'orbit'},
 {id:'outflow',number:'04',name:'高空流出',title:'空气升上去，<br>还要有地方流走。',text:'近海面的空气向中心汇入，在眼墙附近上升，再从高空向外流出。打开气流示意，跟着光点看一遍。',mood:'高空向外流出',wind:0,takeaway:'台风是立体的环流。下方流入、眼墙上升、高空流出，并不只是平面上的转圈。',action:'跟着空气走一遍 ↗',view:'flow'}
 ];
 const tasks=[
 {id:'wall',scene:'storm',title:'找到近中心<br>风速最大的那一圈。',intro:'对于具有清晰眼墙的成熟台风，近地面最大风速通常位于哪个区域？',success:'你找到了眼墙。',explanation:'具有清晰眼墙的成熟台风，近地面最大风速通常位于眼墙附近。眼墙也常有强降水，但最大瞬时雨强和最大累计雨量均不一定出现在这里。',retry:'再看看中心外面的一圈。'},
 {id:'steer',scene:'map',title:'让这场台风，<br>继续向西推进。',intro:'左右拖动副高西端，或用下面的按钮伸缩。南北位置保持不变，看它能否让路径以西行或西北行为主。',success:'这次路径以西行或西北行为主。',explanation:'在这个简化情景里，副高向西伸展，台风也被引向更偏西的海域。真实路径还会受其他天气系统影响。',retry:'再往西挪一挪副高试试。'},
 {id:'calm',scene:'home',title:'风突然停了，<br>现在能出门吗？',intro:'窗外风雨刚刚减弱，天空也亮了一些。家里人说：“是不是已经过去了？”你会怎么做？',choices:[{id:'stay',label:'继续留在安全室内，关注官方消息'},{id:'outside',label:'趁风停了，去海边看看'}],success:'留在安全地点，判断得对。',explanation:'这可能是风眼经过时的暂时平静。另一侧眼墙到来后，强风会再次增强，还可能改变方向。',retry:'短暂平静，还不能证明危险结束。'},
 {id:'prepare',scene:'home',title:'台风到来前，<br>帮家里做点准备。',intro:'从下面选出三件合适的准备。每选一件，左边的家也会跟着改变。',choices:[{id:'plant',label:'提前把阳台花盆收进室内'},{id:'supplies',label:'准备饮用水、手电等必要用品'},{id:'phone',label:'查看官方预警和当地避险安排'},{id:'waves',label:'去海边找个位置拍巨浪'},{id:'window',label:'站在窗边，随时观察风势'}],success:'这个家，准备得更稳妥了。',explanation:'提前收好易坠物、准备必要用品，并按当地官方指引避险。风雨到来后，远离窗户和危险海岸。',retry:'先避开海边和窗边，再看看还缺什么准备。'}
 ];
 // Normalize the original interactive missions into the same question schema.
 tasks[0].type='choice';tasks[0].topic='台风结构';tasks[0].answer='wall';tasks[0].choices=parts.slice(0,3).map(p=>({id:p.id,label:p.number+' 号 · '+p.name}));
 tasks[1].type='steer';tasks[1].topic='副高与路径';
 tasks[2].type='choice';tasks[2].topic='避险常识';tasks[2].answer='stay';
 tasks[3].type='multi';tasks[3].topic='避险常识';tasks[3].answers=['plant','supplies','phone'];
 function question(id,topic,title,labels,answer,explanation){return{id,type:'choice',topic,scene:topic==='避险常识'?'home':'storm',title,intro:'选择一个最合适的答案。示意画面只提供背景，判断以题目条件为准。',choices:labels.map((label,i)=>({id:String(i),label})),answer:String(answer),success:'判断正确。',explanation,retry:'这次判断还不对，再想一想。'};}
 tasks.push(
 question("eye-calm","台风结构","风眼里的空气，通常怎样运动？",["猛烈上升", "以下沉为主", "完全静止"],1,"成熟台风的风眼通常以下沉气流为主，云量较少；风眼不是完全无风，也不是所有台风都有清晰风眼。"),
 question("rain-bands","台风结构","离台风中心很远，还可能出现极端降水吗？",["不会，暴雨只在风眼旁", "只要看不见风眼就安全", "会，外围雨带也可能产生极端降水"],2,"瞬时雨强表示某一时刻的降雨强度，累计雨量表示一段时间内的降雨总量。外围雨带反复经过、水汽辐合及地形抬升可增强降水；台风移动缓慢可能使降雨持续更久。最大瞬时雨强和最大累计雨量都不一定在眼墙附近，不能只凭距中心远近判断暴雨风险。"),
 question("outflow","台风结构","眼墙里的空气升到高空后，通常流向哪里？",["从高空向外围流出", "全部留在风眼内", "直接变成海水"],0,"典型台风环流包括低层向中心流入、眼墙附近上升，以及高空向外围流出。"),
 question("nh-spin","台风结构","从上方看，北半球台风的近地面环流通常怎样旋转？",["顺时针", "逆时针", "不旋转"],1,"北半球台风的近地面气旋环流通常逆时针旋转，并伴随向中心的流入；高空流出不能简单照搬这个方向。"),
 question("warm-water","形成条件","其他条件相近，哪种海洋环境更有利于台风发展？",["大片寒冷海水", "只有一小块热水", "范围较广、较深的暖海水"],2,"较广且有一定深度的暖海水能持续提供热量和水汽；是否增强还取决于风切变、湿度和原有扰动等条件。"),
 question("water-depth","形成条件","表面水温相同，较深的暖水层有什么作用？",["减少搅拌后冷水使表面降温的限制", "保证台风一定成为超强台风", "决定台风一定向西走"],0,"台风强风会搅动上层海洋。较深的暖水层可减轻混合冷却的影响，但不保证台风一定增强。"),
 question("shear","形成条件","高低空的风差很大，通常会怎样影响台风？",["一定让台风更强", "容易使涡旋倾斜，限制组织发展", "让海温自动升高"],1,"较强的垂直风切变通常不利于台风对流和环流维持对齐；影响还取决于风切变方向、风暴结构等条件。"),
 question("humidity","形成条件","中层空气明显变干，通常更可能怎样？",["保证台风迅速增强", "对台风完全没有影响", "干空气卷入可能抑制对流"],2,"干空气卷入可通过蒸发冷却等过程干扰中心对流，潮湿环境通常更有利于对流持续。"),
 question("equator","形成条件","为什么台风通常很少在赤道附近生成？",["地球自转的偏向作用较弱", "赤道海水一定很冷", "赤道上空没有空气"],0,"赤道附近科里奥利作用很弱，通常不利于组织成旋转气旋；这是一般规律，不表示罕见近赤道气旋绝不可能出现。"),
 question("seed","形成条件","海水够暖，就一定会生成台风吗？",["一定会，每片暖海都必有台风", "不一定，还需要扰动及合适的大气条件", "只要没有云就会生成"],1,"暖海水只是有利条件之一，还需要已有扰动、湿度、较弱风切变等配合；有利环境不等于必然生成。"),
 question("latitude-cooling","登陆与减弱","台风北上进入较冷海域，通常会怎样？",["一定在高纬度再次加强", "低温能无限补充能量", "海洋供能减少，热带气旋通常逐渐减弱"],2,"较冷海域一般不利于维持热带气旋强度；实际变化还受大气环境影响，有些系统会温带转化，不能只凭纬度判定。"),
 question("land-weakening","登陆与减弱","台风登陆后，为什么通常会减弱？",["海洋热量和水汽供应减少，陆面摩擦影响增加", "大陆一定完全没有水汽", "登陆瞬间所有风雨都会消失"],0,"登陆通常削弱海洋供能，并增加陆面摩擦等影响。减弱需要时间，登陆后仍可能有大风和强降雨。"),
 question("land-rain","登陆与减弱","台风登陆、风速减小后，还需要防范什么？",["什么都不用防范", "持续降雨、洪涝及地质灾害", "只要不在海边就绝对安全"],1,"风速减弱并不代表降雨和次生灾害已经结束，应继续关注当地气象、水文和地质灾害预警。"),
 question("steering","副高与路径","台风往哪里移动，主要需要看什么？",["只看风眼的直径", "只看当天的海温", "周围大尺度引导气流等环境"],2,"台风移动与环境引导气流密切相关，副高、槽等天气系统都可影响路径；海温主要影响能量供应，不能单独决定方向。"),
 question("no-guaranteed-landfall","副高与路径","在海上形成的台风，最后一定会登陆吗？",["不一定，有的转向或在海上减弱消散", "一定会登陆最近的大陆", "一定会登陆中国大陆"],0,"有的台风登陆，有的转向外海或在海上减弱。真实天气决定演变，不应为了演示而强制每场台风登陆。"),
 question("translation","副高与路径","“最大风速”和“台风移动速度”是一回事吗？",["是一回事，数值必须相同", "不是，前者描述风强，后者描述中心移动", "最大风速只代表雨量"],1,"最大风速描述台风风场的强度，移动速度描述中心位置变化；强台风也可能移动缓慢。"),
 question("hurricane-name","台风与飓风","美国大西洋沿岸的飓风，和西北太平洋的台风是什么关系？",["完全无关的天气系统", "飓风是台风登陆后的新名字", "属于同类热带气旋，称呼因海域而异"],2,"达到相应强度的热带气旋，在西北太平洋称台风，在北大西洋和中东部北太平洋称飓风。"),
 question("surge","避险常识","台风临近海岸时，风暴潮主要指什么？",["强风等使沿岸海水异常增高", "风眼里的一阵小雨", "所有海水正常的日常涨落"],0,"风暴潮是风暴造成的异常海水增高；叠加天文潮和波浪会加重沿海淹没危险，应按官方安排避险。"),
 question("flood-road","避险常识","前方道路被积水淹没、深浅不明，应该怎样做？",["加速冲过去", "避开积水路段，按官方指引改道", "跟着前车就一定安全"],1,"不要步行或驾车穿越深浅不明的洪水、积水路段，水深、流速及路面状况可能无法判断。"),
 question("official-warning","避险常识","官方已要求你所在区域转移避险，应该怎样做？",["等风雨最强时再决定", "只看窗外现在有没有下雨", "按当地安排及时转移到指定安全地点"],2,"预警和转移安排会考虑即将到来的风险，不能用眼前短暂无雨否定危险；应按当地官方指引及时行动。"),
 question("forecast-uncertainty","副高与路径","只看一条预测路径线，能确定哪里一定安全？",["不能，还要关注影响范围、预警及路径变化", "能，线外一律没有风雨", "能，只有中心经过才有危险"],0,"预测路径存在不确定性，风雨和沿海灾害可出现在路径线之外。应结合官方预警与风雨影响范围判断。"),
 );
 function validateTask(task,selection,route){const q=typeof task==='number'?tasks[task]:typeof task==='string'?tasks.find(t=>t.id===task):task;if(!q)return false;if(q.type==='steer')return route?.behavior?.id==='west';if(q.type==='multi'){const set=new Set(selection||[]);return set.size===q.answers.length&&q.answers.every(x=>set.has(x));}return selection===q.answer;}
 function drawTasks(count=5,random=Math.random,previous=[]){const pool=tasks.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}const chosen=pool.slice(0,Math.max(0,Math.min(tasks.length,count)));if(chosen.length>0&&chosen.length<pool.length&&chosen.length===previous.length&&chosen.every(q=>previous.some(p=>p.id===q.id)))chosen[chosen.length-1]=pool[chosen.length];return chosen;}
 root.LearningModel={parts,tasks,validateTask,drawTasks};
})(typeof window==='undefined'?globalThis:window);
