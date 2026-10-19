/* Shared content and pure challenge rules. No observed storm data. */
(function(root){
 const parts=[
 {id:'eye',number:'01',name:'风眼',title:'风暴中心，<br>却常常比较平静。',text:'这片较少云的中心，就是风眼。空气在这里下沉，风通常比四周小；并不是每场台风都有清晰的风眼。',mood:'中心较平静',wind:1,takeaway:'风眼经过时，风可能暂时减弱。另一侧眼墙还会带来危险风雨，别急着外出。',action:'转个角度看风眼 ↗',view:'orbit'},
 {id:'wall',number:'02',name:'眼墙',title:'最猛烈的风雨，<br>藏在这一圈。',text:'风眼外紧挨着的一圈高耸云墙，叫眼墙。空气猛烈上升，强风和强降雨往往集中在这里。',mood:'近中心风雨最强',wind:5,takeaway:'看台风时，别只盯着中心的小圆洞；包围它的这圈云墙更值得注意。',action:'剖开眼墙看看 ↗',view:'cut'},
 {id:'band',number:'03',name:'雨带',title:'雨一阵接一阵，<br>是云带在经过。',text:'一条条弯曲的云带向外伸展，像风暴的手臂。雨带经过时，风雨可能突然增强；两条雨带之间又会暂时减弱。',mood:'外围风雨起伏',wind:3,takeaway:'离风眼很远，也可能遭遇暴雨。台风的影响范围不只在中心附近。',action:'转个角度看雨带 ↗',view:'orbit'},
 {id:'outflow',number:'04',name:'高空流出',title:'空气升上去，<br>还要有地方流走。',text:'近海面的空气向中心汇入，在眼墙附近上升，再从高空向外流出。打开气流示意，跟着光点看一遍。',mood:'高空向外流出',wind:0,takeaway:'台风是立体的环流。下方流入、眼墙上升、高空流出，并不只是平面上的转圈。',action:'跟着空气走一遍 ↗',view:'flow'}
 ];
 const tasks=[
 {id:'wall',scene:'storm',title:'找到风雨<br>最猛的那一圈。',intro:'看左边的台风，点一个编号。你觉得，近中心的强风和暴雨通常集中在哪里？',success:'你找到了眼墙。',explanation:'风眼常较平静，紧挨着它的眼墙才是近中心风雨最猛烈的区域。',retry:'再看看中心外面的一圈。'},
 {id:'steer',scene:'map',title:'让这场台风，<br>继续向西推进。',intro:'左右拖动副高西端，或用下面的按钮伸缩。南北位置保持不变，看它能否让路径以西行或西北行为主。',success:'这次路径以西行或西北行为主。',explanation:'在这个简化情景里，副高向西伸展，台风也被引向更偏西的海域。真实路径还会受其他天气系统影响。',retry:'再往西挪一挪副高试试。'},
 {id:'calm',scene:'home',title:'风突然停了，<br>现在能出门吗？',intro:'窗外风雨刚刚减弱，天空也亮了一些。家里人说：“是不是已经过去了？”你会怎么做？',choices:[{id:'stay',label:'继续留在安全室内，关注官方消息'},{id:'outside',label:'趁风停了，去海边看看'}],success:'留在安全地点，判断得对。',explanation:'这可能是风眼经过时的暂时平静。另一侧眼墙到来后，强风会再次增强，还可能改变方向。',retry:'短暂平静，还不能证明危险结束。'},
 {id:'prepare',scene:'home',title:'台风到来前，<br>帮家里做点准备。',intro:'从下面选出三件合适的准备。每选一件，左边的家也会跟着改变。',choices:[{id:'plant',label:'提前把阳台花盆收进室内'},{id:'supplies',label:'准备饮用水、手电等必要用品'},{id:'phone',label:'查看官方预警和当地避险安排'},{id:'waves',label:'去海边找个位置拍巨浪'},{id:'window',label:'站在窗边，随时观察风势'}],success:'这个家，准备得更稳妥了。',explanation:'提前收好易坠物、准备必要用品，并按当地官方指引避险。风雨到来后，远离窗户和危险海岸。',retry:'先避开海边和窗边，再看看还缺什么准备。'}
 ];
 function validateTask(index,selection,route){const id=tasks[index]?.id;if(id==='wall')return selection==='wall';if(id==='steer')return route?.behavior?.id==='west';if(id==='calm')return selection==='stay';if(id==='prepare'){const set=new Set(selection||[]);return set.size===3&&['plant','supplies','phone'].every(x=>set.has(x));}return false;}
 root.LearningModel={parts,tasks,validateTask};
})(typeof window==='undefined'?globalThis:window);
