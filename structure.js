'use strict';
(()=>{
const $=id=>document.getElementById(id),parts=LearningModel.parts;
let part='wall',currentView='orbit',flow=false;
const partButtons=[...document.querySelectorAll('[data-part]')],viewButtons=[...document.querySelectorAll('[data-view]')];
function setView(view){view=view==='cut'?'cut':'orbit';currentView=view;StormView.setView(view);viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));if(view==='cut')setFlow(true);}
function setFlow(value){flow=value;StormView.setFlow(value);$('flowToggle').setAttribute('aria-pressed',String(value));$('flowToggle').textContent=value?'收起气流示意':'空气怎么走 ↗';}
function selectPart(id){const p=parts.find(x=>x.id===id);if(!p)return;part=id;StormView.select(id);$('partNumber').textContent=p.number+' / 04';$('partTitle').innerHTML=p.title;$('partText').textContent=p.text;$('partMood').textContent=p.mood;$('partTakeaway').textContent=p.takeaway;$('partAction').textContent=p.action;partButtons.forEach(b=>{const selected=b.dataset.part===id;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});$('partContent').setAttribute('aria-label',p.name);document.querySelectorAll('.wind-indicator i').forEach((bar,i)=>bar.classList.toggle('on',i<p.wind));document.querySelector('.wind-indicator').hidden=id==='outflow';$('partAction').hidden=!StormView.ready;if(id==='outflow')setFlow(true);}
partButtons.forEach((button,i)=>{button.onclick=()=>selectPart(button.dataset.part);button.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%parts.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+parts.length-1)%parts.length;if(e.key==='Home')next=0;if(e.key==='End')next=parts.length-1;if(next!==undefined){e.preventDefault();selectPart(parts[next].id);partButtons[next].focus();}});});
viewButtons.forEach(button=>button.onclick=()=>setView(button.dataset.view));$('partAction').onclick=()=>{const p=parts.find(x=>x.id===part);if(p.view==='flow'){setView('cut');setFlow(true);}else setView(p.view);};$('flowToggle').onclick=()=>setFlow(!flow);$('motionToggle').setAttribute('aria-pressed',String(StormView.paused));$('motionToggle').textContent=StormView.paused?'播放云系':'暂停云系';$('motionToggle').onclick=()=>{StormView.setPaused(!StormView.paused);$('motionToggle').setAttribute('aria-pressed',String(StormView.paused));$('motionToggle').textContent=StormView.paused?'播放云系':'暂停云系';};
StormView.onPart=id=>selectPart(id);
$('stormScene').hidden=!StormView.ready;$('stormFallback').hidden=StormView.ready;
if(!StormView.ready){for(const button of viewButtons)button.disabled=true;$('flowToggle').disabled=true;$('motionToggle').disabled=true;$('motionToggle').textContent='简化视图';$('sceneHint').textContent='三维视图未能启动，仍可选择部位阅读说明。';}
StormView.setQuiz(false);StormView.setVisible(true);setView('orbit');setFlow(false);selectPart(part);
})();
