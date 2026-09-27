import * as THREE from './vendor/three.module.js';
import {createPhotoPose} from './film-character.js?v=9';
import {GLTFLoader} from './vendor/GLTFLoader.js';
// Quaternius Casual_Hoodie, CC0. Embedded locally; only campus locomotion clips.
export function createStudent({data}={}){
 const group=new THREE.Group();group.name='Campus student · Quaternius';group.visible=false;
 const api={group,height:1.78,loaded:false,error:null,update,poseAt};let photoPose,mixer,actions={},state='Idle';
 const loader=new GLTFLoader();
 api.ready=(data?loader.parseAsync(data,''):loader.loadAsync(new URL('./assets/student.glb',import.meta.url).href)).then(gltf=>{
  const model=gltf.scene;model.name='Hoodie student';model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.roughness=.85;if(m.name==='Purple')m.color.set('#416955');if(m.name==='LightBlue')m.color.set('#344854');}}});
  group.add(model);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),scale=api.height/(bounds.max.y-bounds.min.y);model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;
  mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
  for(const name of ['Idle','Walk','Run'])if(!actions[name])throw Error('Missing locomotion animation: '+name);
  actions.Idle.play();mixer.update(0);photoPose=createPhotoPose(group,model);api.loaded=true;return true;
 }).catch(error=>{api.error=error;return false;});
 function update(dt,speed=0){if(!api.loaded)return;const next=speed<.12?'Idle':speed>4?'Run':'Walk';if(next!==state){actions[next].reset().play();actions[state].crossFadeTo(actions[next],.22,true);state=next;}actions[state].setEffectiveTimeScale(state==='Idle'?1:THREE.MathUtils.clamp(speed/(state==='Run'?5.8:2.6),.45,1.35));mixer.update(dt);}
 function poseAt(time,pose='Idle',photo=0,blend=null){
  if(!api.loaded)return;
  for(const action of Object.values(actions)){action.stop();action.reset();}
  const action=actions[pose==='Walk'?'Walk':'Idle'];action.play();action.setEffectiveWeight(1-(blend?.weight||0));action.time=Math.max(0,time)%action.getClip().duration;
  if(blend?.weight>0){const from=actions[blend.state];from.play();from.setEffectiveWeight(blend.weight);from.time=Math.max(0,blend.time)%from.getClip().duration;}mixer.update(0);
  photoPose(photo);
 }
 return api;
}
