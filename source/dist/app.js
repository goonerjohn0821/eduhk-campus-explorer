import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createCampus, LANDMARKS, groundHeight } from './campus.js?v=9';
import { createStudent } from './student.js?v=9';
import { StudentWalker } from './walking.js?v=9';
import {SOURCES,GATE} from './layout.js?v=9';
const $=id=>document.getElementById(id);
const icons={
 campus:'<path d="M3 21h18M5 18V9l5-3v12m3 0V3l7 4v11M7 11v1m0 3v1m9-9v1m0 3v1m0 3v1"/>',
 pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.7 8.7a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 1.8-2.3 3.3M12 16h.01"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15"/>',
 arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',home:'<path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7"/>',tag:'<path d="M4 4h8l9 9-8 8-9-9Z"/><circle cx="8.5" cy="8.5" r="1"/>',
 orbit:'<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(60 12 12)"/><circle cx="12" cy="12" r="1"/>',
 walk:'<circle cx="14" cy="4" r="2"/><path d="m10 22 3-7-3-4m5 11-1-5-3-3 1-7 4 5h4M5 13l2-5 5-1"/>',mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]??icons.campus}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

const viewport=$('viewport'), explorer=$('explorer'), coarse=matchMedia('(pointer:coarse)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
let width=viewport.clientWidth,height=viewport.clientHeight;
let mode='orbit',selected='overview',showLabels=true,dusk=false,frame=0,yaw=0,pitch=0,runTouch=false,toastTimer,transition=null,contextLost=false;
const keys=new Set(), joystick={x:0,y:0}, forward=new THREE.Vector3(),projected=new THREE.Vector3();
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.5:2));renderer.setSize(width,height);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.domElement.setAttribute('aria-hidden','true');viewport.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#d7e3d9');scene.fog=new THREE.Fog('#d7e3d9',1250,2200);
const camera=new THREE.PerspectiveCamera(39,width/height,.15,2800);
const hemi=new THREE.HemisphereLight('#e8f5ed','#919474',2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff1d2',3.1);sun.position.set(-280,450,240);sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(sun.shadow.camera,{left:-380,right:380,top:410,bottom:-410,near:1,far:1150});sun.shadow.bias=-.00035;sun.shadow.normalBias=.35;scene.add(sun);
const fill=new THREE.DirectionalLight('#cbe5db',.6);fill.position.set(200,150,-250);scene.add(fill);
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(12000,12000),new THREE.MeshStandardMaterial({color:'#d7e3d9',roughness:1}));backdrop.rotation.x=-Math.PI/2;backdrop.position.y=-32;backdrop.receiveShadow=true;scene.add(backdrop);
const campus=createCampus();scene.add(campus.group);
const student=createStudent();scene.add(student.group);const walker=new StudentWalker(campus,camera,student);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=!reduced;orbit.dampingFactor=.08;orbit.minDistance=12;orbit.maxDistance=1550;orbit.maxPolarAngle=Math.PI/2-.065;orbit.minPolarAngle=.001;orbit.panSpeed=.75;orbit.rotateSpeed=.6;orbit.zoomSpeed=.85;orbit.screenSpacePanning=false;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function cameraOffset(){if(mode==='orbit'&&width>800)camera.setViewOffset(width,height,-Math.min(145,width*.105),0,width,height);else camera.clearViewOffset();camera.updateProjectionMatrix();}
function overviewState(){const scale=width<600?1.52:width<850?1.22:1;return {position:new THREE.Vector3(-320*scale,560*scale,665*scale),target:new THREE.Vector3(-18,24,-20)};}
const initial=overviewState();camera.position.copy(initial.position);orbit.target.copy(initial.target);cameraOffset();orbit.update();
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function closePlaces(){$('sidebar').classList.remove('open');$('places-toggle').setAttribute('aria-expanded','false');}
function cancelTransition(){if(transition){const old=transition;transition=null;old.resolve({completed:false});}}
function flyTo(position,target){cancelTransition();return new Promise(resolve=>{if(reduced){camera.position.copy(position);orbit.target.copy(target);orbit.update();resolve({completed:true});return;}transition={start:performance.now(),duration:1100,fromPosition:camera.position.clone(),toPosition:position,fromTarget:orbit.target.clone(),toTarget:target,resolve};});}
orbit.addEventListener('start',cancelTransition);
function setSelected(id){selected=id;document.querySelectorAll('.location-btn').forEach(el=>{const active=el.dataset.id===id;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'true':'false');});document.querySelectorAll('.map-marker').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));}
function setMode(next){
 if(next===mode)return;if(next==='walk'&&!student.loaded){toast(student.error?'人物加载失败，请刷新页面重试。':'人物正在准备，请稍后进入漫游。');return;}cancelTransition();keys.clear();joystick.x=joystick.y=0;resetJoystick();
 if(next==='walk'){
  mode='walk';orbit.enabled=false;cameraOffset();
  const lm=LANDMARKS.find(l=>l.id===selected&&l.spawn)||LANDMARKS[1];
  camera.fov=55;camera.updateProjectionMatrix();walker.enter(lm);
  scene.fog.near=420;scene.fog.far=1150;closePlaces();toast(coarse?'摇杆操控学生，拖动场景转动跟随镜头':'W A S D 操控学生 · 拖动转动镜头 · Shift 奔跑 · V 切换视角');
 }else{
  if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();mode='orbit';orbit.enabled=true;cameraOffset();
  const target=walker.position.clone();target.y=groundHeight(target.x,target.z)+7;walker.leave();camera.fov=39;camera.updateProjectionMatrix();
  camera.position.copy(target).add(new THREE.Vector3(-80,90,110));orbit.target.copy(target);orbit.update();scene.fog.near=1250;scene.fog.far=2200;
 }
 explorer.classList.toggle('walking',mode==='walk');$('walk-ui').hidden=mode!=='walk';$('detail').hidden=true;
 $('orbit-mode').classList.toggle('active',mode==='orbit');$('orbit-mode').setAttribute('aria-pressed',String(mode==='orbit'));
 $('walk-mode').classList.toggle('active',mode==='walk');$('walk-mode').setAttribute('aria-pressed',String(mode==='walk'));
 $('zoom-in').disabled=false;$('zoom-out').disabled=false;
 $('controls-hint').innerHTML=mode==='walk'?(coarse?'<span>摇杆移动</span><i></i><span>拖动环顾</span><i></i><span>快走可切换</span>':'<span>W A S D 行走</span><i></i><span>拖动转镜头</span><i></i><span>Shift 奔跑 · V 视角</span>'):(coarse?'<span>单指旋转</span><i></i><span>双指缩放 / 平移</span>':'<span>拖动旋转</span><i></i><span>滚轮缩放</span><i></i><span>右键平移</span>');
 $('map-legend-text').textContent=mode==='walk'?'你在这里':'当前视角';viewport.focus({preventScroll:true});
}
async function focusLocation(id){
 const lm=LANDMARKS.find(l=>l.id===id);if(!lm)throw new Error('未知的校园地点');
 if(mode==='walk')setMode('orbit');setSelected(id);closePlaces();
 if(id==='overview'){ $('detail').hidden=true;const s=overviewState();await flyTo(s.position,s.target); }
 else{$('detail-code').textContent=lm.code+' / '+lm.en.toUpperCase();$('detail-title').textContent=lm.name;$('detail-description').textContent=lm.description;$('detail').hidden=false;
  const scale=width<800?1.24:1,target=new THREE.Vector3(lm.x,groundHeight(lm.x,lm.z)+(id==='gate'?4.9:7),lm.z),offset=(id==='gate'?new THREE.Vector3(Math.sin(GATE.angle)*28,2.0,Math.cos(GATE.angle)*28):new THREE.Vector3(-72,68,90)).multiplyScalar(scale);
  if(id==='bus')offset.set(-48*scale,44*scale,55*scale);if(id==='sports')offset.multiplyScalar(1.35);if(id==='halls')offset.multiplyScalar(1.4);await flyTo(target.clone().add(offset),target);
 }
 return {location:id,mode};
}
$('locations').innerHTML=LANDMARKS.map(l=>`<button class="location-btn${l.id==='overview'?' active':''}" data-id="${l.id}"${l.id==='overview'?' aria-current="true"':''}><span class="location-icon">${l.icon?icon(l.icon):l.code}</span><span class="location-label"><strong>${l.name}</strong><small>${l.en}</small></span><span class="location-arrow">${icon('arrow')}</span></button>`).join('');
$('locations').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>focusLocation(b.dataset.id)));
const markers=LANDMARKS.filter(l=>l.id!=='overview').map(l=>{const button=document.createElement('button');button.className='map-marker';button.dataset.id=l.id;button.innerHTML=`<span>${l.code}</span>${l.name}`;button.setAttribute('aria-label',`靠近${l.name}`);button.addEventListener('click',()=>focusLocation(l.id));$('markers').appendChild(button);return{...l,button,position:new THREE.Vector3(l.x,l.y,l.z)};});
$('orbit-mode').onclick=()=>setMode('orbit');$('walk-mode').onclick=()=>setMode('walk');$('walk-here').onclick=()=>setMode('walk');$('reset').onclick=()=>focusLocation('overview');
$('close-detail').onclick=()=>{$('detail').hidden=true;viewport.focus({preventScroll:true});};
$('places-toggle').onclick=()=>{const open=$('sidebar').classList.toggle('open');$('places-toggle').setAttribute('aria-expanded',String(open));};$('close-places').onclick=closePlaces;
$('labels').onclick=()=>{showLabels=!showLabels;$('labels').setAttribute('aria-pressed',String(showLabels));};
$('help').onclick=()=>{keys.clear();walker.stop();if(document.pointerLockElement)document.exitPointerLock();$('help-dialog').showModal();};
$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)e.target.close();}});
function zoom(factor){if(mode==='walk'){walker.zoom(factor);return;}cancelTransition();const offset=camera.position.clone().sub(orbit.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,orbit.minDistance,orbit.maxDistance));camera.position.copy(orbit.target).add(offset);orbit.update();}
$('zoom-in').onclick=()=>zoom(.78);$('zoom-out').onclick=()=>zoom(1.28);
$('compass').onclick=()=>{if(mode==='walk'){walker.yaw=-Math.PI/4;}else{const offset=camera.position.clone().sub(orbit.target);const v=new THREE.Vector3(-.45,.73,.73).normalize().multiplyScalar(offset.length());flyTo(orbit.target.clone().add(v),orbit.target.clone());}};
function setLighting(value){dusk=value;explorer.classList.toggle('dusk',dusk);$('lighting-text').textContent=dusk?'黄昏':'日光';$('lighting').setAttribute('aria-label',dusk?'切换到日光':'切换到黄昏');scene.background.set(dusk?'#9faeaf':'#d7e3d9');scene.fog.color.copy(scene.background);backdrop.material.color.copy(scene.background);sun.color.set(dusk?'#ffb980':'#fff1d2');sun.intensity=dusk?2.2:3.1;sun.position.set(dusk?-420:-280,dusk?175:450,240);hemi.intensity=dusk?1.15:2.1;hemi.color.set(dusk?'#c5c9ec':'#e8f5ed');campus.lampMaterial.emissiveIntensity=dusk?2:.1;campus.materials['#668b82'].emissive.set(dusk?'#ba7836':'#000000');campus.materials['#668b82'].emissiveIntensity=dusk?.45:0;}
$('lighting').onclick=()=>setLighting(!dusk);

function toggleView(){walker.setView(walker.view==='third'?'first':'third');$('avatar-view').querySelector('span:last-child').textContent=walker.view==='third'?'第三人称 · V':'第一人称 · V';}
$('avatar-view').onclick=toggleView;
$('plan-view').onclick=()=>{if(mode==='walk')setMode('orbit');setSelected('overview');$('detail').hidden=true;flyTo(new THREE.Vector3(-18,930,1),new THREE.Vector3(-18,6,0));};
$('source-official').href=SOURCES.official;$('source-satellite').href=SOURCES.satellite;$('source-plan').href=SOURCES.plan;
renderer.domElement.addEventListener('wheel',e=>{if(mode==='walk'){e.preventDefault();walker.zoom(Math.exp(e.deltaY*.001));}},{passive:false});

// Picking is shared by architectural volumes and their floating labels.
let press=null,lastUnlock=0;
renderer.domElement.addEventListener('pointerdown',e=>{viewport.focus({preventScroll:true});press={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.pointerId};if(mode==='walk'&&!document.pointerLockElement)renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{
 if(mode!=='walk')return;
 let dx=0,dy=0;
 if(document.pointerLockElement===renderer.domElement){dx=e.movementX;dy=e.movementY;}
 else if(press&&press.id===e.pointerId){dx=e.clientX-press.lastX;dy=e.clientY-press.lastY;press.lastX=e.clientX;press.lastY=e.clientY;}
 else return;
 walker.look(dx,dy);
});
renderer.domElement.addEventListener('pointerup',e=>{
 const p=press;press=null;if(!p||mode!=='orbit'||e.button!==0||Math.hypot(e.clientX-p.x,e.clientY-p.y)>5)return;
 const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects(campus.pickables,false)[0];if(hit?.object.userData.locationId)focusLocation(hit.object.userData.locationId);
});
renderer.domElement.addEventListener('pointercancel',()=>press=null);
$('lock-mouse').onclick=async()=>{if(document.pointerLockElement){document.exitPointerLock();return;}try{if(!renderer.domElement.requestPointerLock)throw new Error('unsupported');await renderer.domElement.requestPointerLock();}catch{toast('当前环境不支持锁定鼠标，可按住鼠标拖动环顾。');}};
document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===renderer.domElement;if(!locked){keys.clear();lastUnlock=performance.now();}$('lock-mouse').querySelector('span:last-child').textContent=locked?'Esc 释放鼠标':'锁定鼠标视角';});
document.addEventListener('pointerlockerror',()=>toast('可按住鼠标拖动环顾，并用 W A S D 移动。'));
window.addEventListener('keydown',e=>{
 if($('help-dialog').open||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 if(e.code==='Escape'){if(mode==='walk'&&!document.pointerLockElement&&performance.now()-lastUnlock>250)setMode('orbit');closePlaces();return;}
 if(e.code==='KeyV'&&mode==='walk'&&!e.repeat){toggleView();e.preventDefault();return;}
 if(e.code==='KeyW'&&mode==='orbit'&&!e.repeat){setMode('walk');keys.add('KeyW');e.preventDefault();return;}
 if(mode==='walk'&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
});window.addEventListener('keyup',e=>keys.delete(e.code));
function clearInputs(){keys.clear();walker.stop();press=null;resetJoystick();}window.addEventListener('blur',clearInputs);document.addEventListener('visibilitychange',clearInputs);
let stickPointer=null;
function resetJoystick(){joystick.x=joystick.y=0;$('joystick-knob').style.transform='translate(0,0)';stickPointer=null;}
function updateJoystick(e){const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,length=Math.hypot(dx,dy),m=Math.min(1,36/(length||1));joystick.x=dx*m/36;joystick.y=dy*m/36;$('joystick-knob').style.transform=`translate(${dx*m}px,${dy*m}px)`;}
$('joystick').addEventListener('pointerdown',e=>{stickPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);updateJoystick(e);});$('joystick').addEventListener('pointermove',e=>{if(stickPointer===e.pointerId)updateJoystick(e);});$('joystick').addEventListener('pointerup',resetJoystick);$('joystick').addEventListener('pointercancel',resetJoystick);
$('run-touch').onclick=()=>{runTouch=!runTouch;$('run-touch').setAttribute('aria-pressed',String(runTouch));$('run-touch').textContent=runTouch?'慢走':'快走';};
function moveWalk(dt){
 if($('help-dialog').open){walker.step(dt,{});return;}
 const k=(...names)=>names.some(n=>keys.has(n))?1:0;
 walker.step(dt,{front:k('KeyW','ArrowUp')-k('KeyS','ArrowDown')-joystick.y,right:k('KeyD','ArrowRight')-k('KeyA','ArrowLeft')+joystick.x,run:keys.has('ShiftLeft')||keys.has('ShiftRight')||runTouch});
}
function updateMarkers(){
 const occupied=[];const sorted=[...markers].sort((a,b)=>(a.id===selected?-1:b.id===selected?1:camera.position.distanceToSquared(a.position)-camera.position.distanceToSquared(b.position)));
 for(const m of sorted){
  projected.copy(m.position).project(camera);const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
  let visible=showLabels&&projected.z>-1&&projected.z<1&&x>35&&x<width-75&&y>25&&y<height-125;
  if(mode==='walk'&&camera.position.distanceTo(m.position)>180)visible=false;
  if(width>800&&mode==='orbit'&&x<310)visible=false;
  if(width<800&&y<143&&x<200)visible=false;
  const rw=m.button.offsetWidth||118;
  if(visible&&occupied.some(r=>Math.abs(x-r.x)<(rw+r.w)/2+5&&Math.abs(y-r.y)<38))visible=false;
  m.button.style.visibility=visible?'visible':'hidden';
  if(visible){m.button.style.transform=`translate(${x-rw/2}px,${y-34}px)`;occupied.push({x,y,w:rw});}
 }
}
const map=$('minimap'),ctx=map.getContext('2d'),mapScale=.40,toMap=(x,z)=>[164+x*mapScale,140+z*mapScale];
const baseMap=document.createElement('canvas');baseMap.width=320;baseMap.height=280;const bctx=baseMap.getContext('2d');
function mapPoly(poly,color){bctx.beginPath();poly.forEach((p,i)=>{const q=toMap(...p);i?bctx.lineTo(...q):bctx.moveTo(...q);});bctx.closePath();bctx.fillStyle=color;bctx.fill();}
function drawBaseMap(){
 bctx.clearRect(0,0,320,280);mapPoly(campus.boundary,'#e4eadb');mapPoly(campus.entranceBoundary,'#e4eadb');mapPoly(campus.busBoundary,'#d9dfcf');campus.greenPolys.forEach(p=>mapPoly(p,'#c4d2ae'));
 for(const {curve,width:w} of campus.paths){const p=curve.getPoints(100);bctx.beginPath();p.forEach((v,i)=>{const q=toMap(v.x,v.z);i?bctx.lineTo(...q):bctx.moveTo(...q);});bctx.strokeStyle=w>5?'#bcc7b3':'#f3f4e5';bctx.lineWidth=w*mapScale;bctx.stroke();}
 for(const f of campus.footprints)mapPoly(f.poly,f.color);
 bctx.fillStyle='#71936c';for(const t of campus.treeItems){const p=toMap(t.x,t.z);bctx.beginPath();bctx.arc(...p,.8,0,Math.PI*2);bctx.fill();}
 bctx.fillStyle='#77936c';bctx.font='15px sans-serif';bctx.fillText('N',283,23);bctx.beginPath();bctx.moveTo(277,40);bctx.lineTo(292,25);bctx.lineTo(286,44);bctx.fill();
}drawBaseMap();
function updateMap(){
 ctx.clearRect(0,0,320,280);ctx.drawImage(baseMap,0,0);const current=mode==='walk'?walker.position:camera.position;let [x,z]=toMap(current.x,current.z);x=THREE.MathUtils.clamp(x,23,298);z=THREE.MathUtils.clamp(z,18,262);
 camera.getWorldDirection(forward);const angle=Math.atan2(forward.z,forward.x);ctx.save();ctx.translate(x,z);ctx.rotate(angle);ctx.fillStyle='#46805c25';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,35,-.45,.45);ctx.closePath();ctx.fill();ctx.restore();
 ctx.beginPath();ctx.arc(x,z,5,0,Math.PI*2);ctx.fillStyle='#2a6847';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fcfdf0';ctx.stroke();
 $('compass-needle').style.transform=`rotate(${45-Math.atan2(forward.x,-forward.z)*180/Math.PI}deg)`;
}
const resizeObserver=new ResizeObserver(()=>{width=viewport.clientWidth;height=viewport.clientHeight;if(!width||!height)return;camera.aspect=width/height;cameraOffset();renderer.setSize(width,height);});resizeObserver.observe(viewport);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('error-message').textContent='图形连接已中断，请点击重新加载恢复校园场景。';$('error-panel').hidden=false;});
let previous=performance.now(),firstRender=true;
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.045);previous=now;if(contextLost||document.hidden)return;
 if(transition){const t=THREE.MathUtils.clamp((now-transition.start)/transition.duration,0,1),e=t*t*(3-2*t);camera.position.lerpVectors(transition.fromPosition,transition.toPosition,e);orbit.target.lerpVectors(transition.fromTarget,transition.toTarget,e);if(t===1){const done=transition;transition=null;done.resolve({completed:true});}}
 if(mode==='orbit'){
  orbit.update();const old=orbit.target.clone();orbit.target.x=THREE.MathUtils.clamp(orbit.target.x,-420,350);orbit.target.z=THREE.MathUtils.clamp(orbit.target.z,-230,225);orbit.target.y=THREE.MathUtils.clamp(orbit.target.y,6,55);camera.position.add(orbit.target.clone().sub(old));
  camera.position.y=Math.max(camera.position.y,groundHeight(camera.position.x,camera.position.z)+2);
 }else moveWalk(dt);
 renderer.render(scene,camera);if(frame++%3===0){updateMarkers();updateMap();}
 if(firstRender){firstRender=false;$('loader').hidden=true;}
}
// Await compilation so a visible scene, rather than an empty canvas, is handed over.
if(renderer.compileAsync)await renderer.compileAsync(scene,camera);
requestAnimationFrame(animate);
if(coarse)$('controls-hint').innerHTML='<span>单指旋转</span><i></i><span>双指缩放 / 平移</span>';
// Same actions as the visible controls; optional in browsers with WebMCP support.
const modelContext=document.modelContext,lifecycle=new AbortController();
if(modelContext?.registerTool){
 const definitions=[
  {name:'focus_campus_landmark',title:'定位校园地标',description:'Move the view to a campus landmark. The model is schematic, not a surveyed navigation map.',inputSchema:{type:'object',properties:{location:{type:'string',enum:LANDMARKS.map(l=>l.id)}},required:['location'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||!LANDMARKS.some(l=>l.id===input.location))throw new Error('Unknown location');return await focusLocation(input.location);}},
  {name:'set_campus_exploration_mode',title:'切换校园探索模式',description:'Switch between orbit exploration and student-controlled walking with a following camera at the selected landmark.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['orbit','walk']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{if(!input||!['orbit','walk'].includes(input.mode))throw new Error('Unknown exploration mode');setMode(input.mode);return{mode,location:selected};}}
 ];for(const tool of definitions){try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
window.addEventListener('pagehide',()=>{lifecycle.abort();clearInputs();});
