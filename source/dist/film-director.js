import * as T from './vendor/three.module.js';
import {SHOTS,FILM_DURATION,PHOTO_TIME,SHOT_CAPTIONS} from './film-sequences.js?v=9';
export const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const gentle=t=>t-.08*Math.sin(t*2*Math.PI);
const easing={linear:t=>t,smooth,gentle};
function sample(keys,time,field='position',smoothCurve=false){
 if(time<=keys[0].time)return keys[0][field]?.slice?.()??keys[0][field];
 let i=keys.findIndex((k,j)=>j>0&&k.time>=time);if(i<0)i=keys.length-1;
 const a=keys[i-1],b=keys[i],u=T.MathUtils.clamp((time-a.time)/(b.time-a.time),0,1);
 if(typeof a[field]==='number')return T.MathUtils.lerp(a[field],b[field],u);
 if(!smoothCurve||keys.length<3)return a[field].map((n,j)=>T.MathUtils.lerp(n,b[field][j],u));
 // Time-aware cubic Hermite interpolation keeps the camera tangent continuous.
 const prev=keys[Math.max(0,i-2)],next=keys[Math.min(keys.length-1,i+1)],dt=b.time-a.time;
 return a[field].map((n,j)=>{const m0=(b[field][j]-prev[field][j])/(b.time-prev.time),m1=(next[field][j]-a[field][j])/(next.time-a.time);return(2*u**3-3*u*u+1)*n+(u**3-2*u*u+u)*dt*m0+(-2*u**3+3*u*u)*b[field][j]+(u**3-u*u)*dt*m1;});
}
const offset=(p,a,v)=>[p[0]+v[0]*Math.cos(a)+v[2]*Math.sin(a),p[1]+v[1],p[2]-v[0]*Math.sin(a)+v[2]*Math.cos(a)];
export function evaluateFilm(time,campus){
 const t=T.MathUtils.clamp(time,0,FILM_DURATION),shot=SHOTS.find(s=>t<s.startTime+s.duration-.00001)||SHOTS.at(-1),local=Math.min(t,PHOTO_TIME)-shot.startTime;
 const u=easing[shot.easing](T.MathUtils.clamp(local/shot.duration,0,1)),ct=u*shot.duration;
 let actor=null;
 if(shot.character){const c=shot.character,at=T.MathUtils.clamp(local,0,c.path.at(-1).time),position=sample(c.path,at,'position',c.smoothPath),before=sample(c.path,Math.max(0,at-.04),'position',c.smoothPath),after=sample(c.path,Math.min(c.path.at(-1).time,at+.04),'position',c.smoothPath);
  let dx=after[0]-before[0],dz=after[2]-before[2];if(Math.hypot(dx,dz)<1e-5){const last=c.path.at(-1).position,first=c.path[0].position;dx=(c.look||last)[0]-first[0];dz=(c.look||last)[2]-first[2];}
  let yaw=Math.atan2(-dx,-dz);if(c.faceYaw!==undefined){const w=c.turnStart===undefined?1:smooth((local-c.turnStart)/(c.turnDuration||1));yaw+=Math.atan2(Math.sin(c.faceYaw-yaw),Math.cos(c.faceYaw-yaw))*w;}if(c.entryYaw!==undefined)yaw=c.entryYaw+Math.atan2(Math.sin(yaw-c.entryYaw),Math.cos(yaw-c.entryYaw))*smooth(local/1.6);const travel=Math.hypot(after[0]-before[0],after[2]-before[2])/.08;
  position[1]+=campus.surfaceHeight(position[0],position[2])+.045;
  const rate=c.animRate??1,settled=c.settleAt!==undefined&&local>=c.settleAt;
  actor={position,yaw,state:settled||c.state==='Walk'&&travel<.05?'Idle':c.state,animTime:settled?2+local-c.settleAt:local*rate+(c.phase||0),speed:travel,photo:c.state==='Portrait'?smooth(local/1.15):0,blend:settled?{state:'Walk',time:c.settleAt*rate+(c.phase||0),weight:1-smooth((local-c.settleAt)/.4)}:null,visible:true};
 }
 let position,target,fov;
 if(shot.cameraFollow){const c=shot.cameraFollow;position=offset(actor.position,actor.yaw,c.offset);target=offset(actor.position,actor.yaw,c.target);fov=c.fov;}
 else{position=sample(shot.camera,ct,'position',shot.id==='scene03_flyThrough');target=sample(shot.camera,ct,'target',shot.id==='scene03_flyThrough');fov=sample(shot.camera,ct,'fov');}
 const caption=SHOT_CAPTIONS[shot.id]||null,captionOpacity=caption?Math.min(smooth(local/.4),smooth((shot.duration-local)/.4)):0;
 return {time:t,shot,local,position,target,fov,actor,caption,captionOpacity,photo:t>=PHOTO_TIME,photoProgress:smooth((t-PHOTO_TIME)/.45),flash:Math.max(0,1-Math.abs(t-PHOTO_TIME)/.09),fade:smooth((t-89.4)/.6)};
}
export function applyFilmFrame(frame,camera,student){camera.position.fromArray(frame.position);camera.fov=frame.fov;camera.near=frame.position[1]>60?4:frame.position[1]>18?1:.1;camera.lookAt(...frame.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);student.group.visible=!!frame.actor;if(frame.actor){student.group.position.fromArray(frame.actor.position);student.group.rotation.y=frame.actor.yaw;student.poseAt(frame.actor.animTime,frame.actor.state,frame.actor.photo,frame.actor.blend);}student.group.updateMatrixWorld(true);}
