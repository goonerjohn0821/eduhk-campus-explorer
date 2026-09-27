import * as THREE from './vendor/three.module.js';
import {GATE,gatePoint} from './layout.js?v=9';
import {GATE_GLYPHS} from './gate-glyphs.js?v=9';

// Entrance geometry follows the supplied plan and frontal photograph.
// Local +Z is the outside/bus-station side; local -Z enters Central Avenue.
export function createGate(){
 const group=new THREE.Group();group.name='Main gate · outside faces Lo Ping Road';
 const [x,z]=gatePoint(0,0);group.position.set(x,6,z);group.rotation.y=GATE.angle;
 const solids=[],footprints=[],pickables=[],batches=new Map(),materials=new Map();
 const green='#286747',cream='#e8e3ce',joint='#c9c8b6',glass='#4b7371',yellow='#e5b837';
 const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.78}));return materials.get(color);};
 const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,12),q=new THREE.Quaternion(),matrix=new THREE.Matrix4();
 function instance(type,color,pos,size,rotation=new THREE.Quaternion()){
  const key=type+'|'+color;if(!batches.has(key))batches.set(key,{type,color,matrices:[]});matrix.compose(pos,rotation,size);batches.get(key).matrices.push(matrix.clone());
 }
 function box(x,y,z,w,h,d,color){instance('box',color,new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d));}
 function tube(a,b,r,color=green){const d=new THREE.Vector3().subVectors(b,a),length=d.length();q.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());instance('cylinder',color,a.clone().add(b).multiplyScalar(.5),new THREE.Vector3(r,length,r),q);}
 const v=(x,y,z)=>new THREE.Vector3(x,y,z);
 function solidRect(x,z,w,d){const poly=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>gatePoint(x+a,z+b));solids.push(poly);footprints.push({poly,color:'#b9bca8',id:'gate'});}
 function addMesh(geometry,color){const m=new THREE.Mesh(geometry,material(color));m.castShadow=true;m.receiveShadow=true;m.userData.locationId='gate';group.add(m);pickables.push(m);return m;}
 // Short approach, sidewalks and the divided entrance roadway.
 box(0,.075,9.5,21.9,.02,46.8,'#d6d5bd');box(0,.111,10.4,14.2,.025,44.8,'#a8aca1');
 for(const side of [-1,1]){box(side*7.23,.18,11.1,.22,.20,43.5,cream);box(side*6.75,.134,14,.14,.012,36,'#f4f2de');}
 box(0,.23,2.1,2.55,.23,8.8,'#d8d6bc');solidRect(0,2.1,2.55,8.8);
 for(const side of [-1,1]){
  box(side*1.5,.14,2.1,.16,.015,9.6,'#f4f2de');
  for(let i=0;i<6;i++)box(side*.76,.143,6.7+i*.95,1.1,.015,.11,'#f4f2de');
 }
 // Cream masonry piers with tile joints and three stacked open crown cells.
 for(const side of [-1,1]){
  const px=side*8.3;box(px,3.4,0,2.25,6.8,2.8,cream);solidRect(px,0,2.25,2.8);
  box(px,6.82,0,2.4,.16,2.96,'#efead6');
  for(let j=1;j<24;j++){const y=j*6.8/24;for(const zz of [-1.407,1.407])box(px,y,zz,2.24,.015,.01,joint);for(const xx of [-1.132,1.132])box(px+xx,y,0,.01,.015,2.8,joint);}
  for(let j=1;j<6;j++)for(const zz of [-1.409,1.409])box(px-1.125+j*.375,3.4,zz,.012,6.79,.012,joint);
  for(const dx of [-1.12,1.12])for(const dz of [-1.32,1.32])box(px+dx,8.40,dz,.17,3.0,.17,green);
  for(let j=0;j<4;j++){const y=6.95+j*.98;for(const zz of [-1.32,1.32])box(px,y,zz,2.40,.17,.17,green);for(const xx of [-1.12,1.12])box(px+xx,y,0,.17,.17,2.80,green);}
  // A smaller internal vertical frame adds the visible depth of the crown.
  for(const xx of [-.53,.53])box(px+xx,8.4,0,.12,2.75,.12,green);
  for(let j=0;j<3;j++)box(px,7.2+j*.98,0,1.2,.12,.12,green);
 }
 // A deep three-dimensional steel space frame, not a flat strip of crosses.
 const nx=8,nz=3,dx=16.6/nx,dz=6.3/nz,top=6.04,low=4.82;
 for(let i=0;i<=nx;i++)tube(v(-8.3+i*dx,top,-3.15),v(-8.3+i*dx,top,3.15),.065);
 for(let j=0;j<=nz;j++)tube(v(-8.3,top,-3.15+j*dz),v(8.3,top,-3.15+j*dz),.065);
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
  const cx=-8.3+(i+.5)*dx,cz=-3.15+(j+.5)*dz,bottom=v(cx,low,cz);
  for(const a of [-.5,.5])for(const b of [-.5,.5])tube(bottom,v(cx+a*dx,top,cz+b*dz),.055);
  if(i<nx-1)tube(bottom,v(cx+dx,low,cz),.055);
  if(j<nz-1)tube(bottom,v(cx,low,cz+dz),.055);
 }
 for(const side of [-1,1])for(const end of [-1,1])tube(v(side*8.15,4.62,end*.8),v(side*8.15,top,end*3.15),.09);
 for(const side of [-1,1])box(0,6.25,side*3.24,18.35,.5,.16,green);

 // Solid lettering remains sharp at close range and does not depend on fonts
 // installed in the viewer's browser. Both faces are readable, never mirrored.
 const geometries=new Map();
 function glyph(ch,size){const key=ch+'|'+size;if(geometries.has(key))return geometries.get(key);const p=new THREE.ShapePath(),k=size/1000;
  for(const c of GATE_GLYPHS[ch].path){const a=c.slice(1).map(n=>n*k);if(c[0]==='M')p.moveTo(...a);else if(c[0]==='L')p.lineTo(...a);else if(c[0]==='C')p.bezierCurveTo(...a);else if(c[0]==='Q')p.quadraticCurveTo(...a);else if(c[0]==='Z')p.currentPath.closePath();}
  const g=new THREE.ExtrudeGeometry(p.toShapes(true),{depth:.018,bevelEnabled:false,curveSegments:5});geometries.set(key,g);return g;
 }
 function textLine(parent,text,x,y,size,width){const natural=[...text].reduce((s,ch)=>s+GATE_GLYPHS[ch].width*size/1000,0),spacing=(width-natural)/Math.max(1,text.length-1);let cursor=x;
  for(const ch of text){if(ch!==' '){const m=new THREE.Mesh(glyph(ch,size),material('#f4efd9'));m.position.set(cursor,y,0);m.userData.locationId='gate';parent.add(m);pickables.push(m);}cursor+=GATE_GLYPHS[ch].width*size/1000+spacing;}
 }
 for(const side of [-1,1]){const sign=new THREE.Group();sign.position.z=side*3.33;sign.rotation.y=side===1?0:Math.PI;group.add(sign);textLine(sign,'香港教育大學',-6.5,6.06,.46,4.75);textLine(sign,'The Education University of Hong Kong',-.65,6.12,.35,8.1);}
 // Raised green insignia with its orange disc, visible on the outer pier faces.
 for(const side of [-1,1]){
  const cx=side*8.3;box(cx,3.45,1.46,.09,1.28,.10,green);
  for(let i=0;i<3;i++)for(const direction of [-1,1]){
   const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(direction*.54,0);sh.quadraticCurveTo(direction*.7,.02,direction*.69,.21);sh.lineTo(direction*.69,.34);sh.quadraticCurveTo(direction*.55,.22,direction*.45,.23);sh.lineTo(0,.23);sh.closePath();
   const m=addMesh(new THREE.ExtrudeGeometry(sh,{depth:.07,bevelEnabled:false,curveSegments:5}),green);m.position.set(cx,2.96+i*.32,1.44);
  }
  const sun=addMesh(new THREE.CylinderGeometry(.205,.205,.085,24),'#d36d28');sun.rotation.x=Math.PI/2;sun.position.set(cx-.12,4.25,1.52);
  box(cx,1.84,1.45,1.20,.60,.07,'#365f80');const plaque=new THREE.Group();plaque.position.set(cx-.49,1.79,1.51);group.add(plaque);textLine(plaque,'私家路',0,0,.24,.96);textLine(plaque,'Private Road',0,.28,.115,.96);
 }
 // Rounded central guard booth, island bollards and raised barrier arms.
 instance('cylinder',cream,v(0,1.58,.5),v(1.01,3.08,1.32));
 instance('cylinder',glass,v(0,1.42,.5),v(1.025,1.12,1.34));
 box(0,2.95,.5,2.12,.22,2.85,cream);solidRect(0,.5,2.10,2.75);
 for(const side of [-1,1])for(const zz of [-.42,1.42])box(side*.76,1.42,zz,.07,1.18,.07,'#dedccd');
 for(const xx of [-1.13,1.13])for(const zz of [3.4,-2.1]){
  instance('cylinder','#343e36',v(xx,.64,zz),v(.13,1.24,.13));for(const yy of [.25,.66,1.07])instance('cylinder',yellow,v(xx,yy,zz),v(.134,.19,.134));solidRect(xx,zz,.28,.28);
 }
 for(const side of [-1,1]){box(side*1.5,.66,.7,.38,1.25,.45,yellow);box(side*1.5,2.44,.7,.13,2.3,.14,yellow);for(let i=0;i<4;i++)box(side*1.5,1.52+i*.57,.781,.134,.21,.018,'#303c34');}
 // Small road arrows lead the eye through the entrance.
 for(const lane of [-4,4]){const shape=new THREE.Shape();shape.moveTo(-.16,-1.8);shape.lineTo(.16,-1.8);shape.lineTo(.16,.4);shape.lineTo(.8,.4);shape.lineTo(0,1.5);shape.lineTo(-.8,.4);shape.lineTo(-.16,.4);shape.closePath();const m=addMesh(new THREE.ShapeGeometry(shape),'#f4f2de');m.rotation.x=-Math.PI/2;m.position.set(lane,.139,17);if(lane>0)m.rotation.z=Math.PI;}
 for(const {type,color,matrices} of batches.values()){const m=new THREE.InstancedMesh(type==='box'?cube:cylinder,material(color),matrices.length);matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=true;m.receiveShadow=true;m.userData.locationId='gate';group.add(m);pickables.push(m);}
 return{group,solids,footprints,pickables};
}
