import fs from 'node:fs';import * as T from '../dist/vendor/three.module.js';import {createCampus,pointInPolygon} from '../dist/campus.js';import {SHOTS} from '../dist/film-sequences.js';import {evaluateFilm} from '../dist/film-director.js';
const c=createCampus(),ray=new T.Raycaster(),camera=new T.PerspectiveCamera(),issues=[],counts={},velocities={};let end=0,previous;
for(const s of SHOTS){if(Math.abs(s.startTime-end)>1e-6)throw Error('Timeline gap: '+s.id);end=s.startTime+s.duration;}if(end!==90)throw Error('duration');
for(let i=0;i<2700;i++){
 const f=evaluateFilm(i/30,c),p=new T.Vector3(...f.position),target=new T.Vector3(...f.target);counts[f.shot.id]=(counts[f.shot.id]||0)+1;
 if(![...f.position,...f.target,f.fov].every(Number.isFinite))throw Error('nonfinite camera');
 if(previous?.shot.id===f.shot.id)velocities[f.shot.id]=Math.max(velocities[f.shot.id]||0,p.distanceTo(new T.Vector3(...previous.position))*30);
 for(const o of c.colliders)if(f.shot.id!=='scene03_flyThrough'&&o.poly&&p.y>6&&p.y<o.h-.1&&pointInPolygon(p.x,p.z,o.poly)){issues.push({time:f.time,kind:'camera in building',id:f.shot.id});break;}
 if(previous?.shot.id===f.shot.id){const from=new T.Vector3(...previous.position),delta=p.clone().sub(from);ray.set(from,delta.clone().normalize());ray.far=delta.length();if(ray.far>.0001&&ray.intersectObjects(c.pickables,false).length)issues.push({time:f.time,kind:'camera crosses geometry',id:f.shot.id});}
 if(f.actor&&f.shot.id!=='scene03_flyThrough'){const a=f.actor.position;if(!f.shot.character.stepDown&&c.blocked(a[0],a[2],.22))issues.push({time:f.time,kind:'actor blocked',id:f.shot.id});
  const chest=new T.Vector3(a[0],a[1]+1.2,a[2]),direction=chest.clone().sub(p),distance=direction.length();ray.set(p,direction.normalize());ray.far=distance-.3;const hit=ray.intersectObjects(c.pickables,false)[0];if(hit)issues.push({time:f.time,kind:'actor occluded',by:hit.object.userData.locationId,id:f.shot.id});
  camera.position.copy(p);camera.fov=f.fov;camera.aspect=16/9;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const q=chest.project(camera);if(Math.abs(q.x)>1||Math.abs(q.y)>1)issues.push({time:f.time,kind:'actor outside frame',id:f.shot.id});
 }previous=f;
}
const result={duration:end,frames:2700,counts,maxCameraMetresPerSecond:velocities,issues};fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2));console.log(JSON.stringify({frames:2700,shots:SHOTS.length,issues:issues.length,byKind:issues.reduce((a,v)=>(a[v.kind]=(a[v.kind]||0)+1,a),{})}));
