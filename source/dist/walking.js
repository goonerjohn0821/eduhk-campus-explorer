import * as THREE from './vendor/three.module.js';
// A 4.5 cm allowance covers the lowest foot position in the walk animation.
const FOOT_CLEARANCE=.045;
export class StudentWalker {
 constructor(campus,camera,student){this.campus=campus;this.camera=camera;this.student=student;this.position=new THREE.Vector3();this.velocity=new THREE.Vector2();this.yaw=0;this.pitch=.28;this.distance=5.2;this.view='third';this.active=false;this.ray=new THREE.Raycaster();this.target=new THREE.Vector3();this.desired=new THREE.Vector3();this.direction=new THREE.Vector3();}
 enter(landmark){const [x,z]=this.campus.safeSpawn(...landmark.spawn);this.position.set(x,this.campus.surfaceHeight(x,z)+FOOT_CLEARANCE,z);this.yaw=Math.atan2(x-landmark.look[0],z-landmark.look[1]);this.pitch=this.view==='third'?.28:0;this.velocity.set(0,0);this.active=true;this.student.group.position.copy(this.position);this.student.group.rotation.y=this.yaw;this.student.group.visible=this.view==='third';this.updateCamera(1,true);}
 leave(){this.active=false;this.student.group.visible=false;this.stop();}
 stop(){this.velocity.set(0,0);}
 look(dx,dy){this.yaw-=dx*.003;this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.003,this.view==='third'?-.08:-1.25,this.view==='third'?1.2:1.25);}
 setView(view){this.view=view;this.pitch=view==='third'?.28:0;this.updateCamera(1,true);}
 zoom(factor){this.distance=THREE.MathUtils.clamp(this.distance*factor,2.5,10);}
 updateCamera(dt,snap=false){
  if(!this.active)return;
  if(this.view==='first'){this.camera.position.copy(this.position).add(new THREE.Vector3(0,1.69,0));this.camera.rotation.set(-this.pitch,this.yaw,0,'YXZ');this.student.group.visible=false;return;}
  this.target.copy(this.position).add(new THREE.Vector3(0,1.16,0));const horizontal=this.distance*Math.cos(this.pitch);
  this.desired.set(this.target.x+Math.sin(this.yaw)*horizontal,this.target.y+Math.sin(this.pitch)*this.distance,this.target.z+Math.cos(this.yaw)*horizontal);
  this.direction.subVectors(this.desired,this.target);const fullLength=this.direction.length();this.direction.normalize();this.ray.set(this.target,this.direction);this.ray.far=fullLength+.25;
  const hit=this.ray.intersectObjects(this.campus.pickables,false)[0];let boom=fullLength;
  if(hit)boom=Math.max(.35,hit.distance-.35);
  this.desired.copy(this.target).addScaledVector(this.direction,boom);this.desired.y=Math.max(this.campus.surfaceHeight(this.desired.x,this.desired.z)+.4,this.desired.y);
  // Immediate obstacle correction prevents a smoothed camera crossing a wall.
  const t=snap||hit?1:1-Math.exp(-14*dt);this.camera.position.lerp(this.desired,t);this.camera.lookAt(this.target);this.student.group.visible=boom>1.1;
 }
 step(dt,{front=0,right=0,run=false}={}){
  if(!this.active)return;
  const len=Math.hypot(front,right);if(len>1){front/=len;right/=len;}
  const speed=run?5.8:2.6,tx=(-Math.sin(this.yaw)*front+Math.cos(this.yaw)*right)*speed,tz=(-Math.cos(this.yaw)*front-Math.sin(this.yaw)*right)*speed;
  const blend=1-Math.exp(-16*dt);this.velocity.x+=(tx-this.velocity.x)*blend;this.velocity.y+=(tz-this.velocity.y)*blend;
  const dx=this.velocity.x*dt,dz=this.velocity.y*dt,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18)),previous=this.position.clone();
  for(let i=0;i<steps;i++){
   const nx=this.position.x+dx/steps,nz=this.position.z+dz/steps;
   if(!this.campus.blocked(nx,this.position.z,.34))this.position.x=nx;
   if(!this.campus.blocked(this.position.x,nz,.34))this.position.z=nz;
  }
  this.position.y=this.campus.surfaceHeight(this.position.x,this.position.z)+FOOT_CLEARANCE;const moved=Math.hypot(this.position.x-previous.x,this.position.z-previous.z),actualSpeed=moved/Math.max(dt,.001);
  if(moved>.0001){const desired=Math.atan2(previous.x-this.position.x,previous.z-this.position.z),current=this.student.group.rotation.y,difference=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));this.student.group.rotation.y+=difference*(1-Math.exp(-13*dt));}
  this.student.group.position.copy(this.position);this.student.update(dt,actualSpeed);this.updateCamera(dt);
 }
}
