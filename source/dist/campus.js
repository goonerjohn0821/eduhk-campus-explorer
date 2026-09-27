import * as THREE from './vendor/three.module.js';
import {createSurfaceHeight} from './walk-surface.js?v=9';
import {createBusStation} from './bus-station.js?v=9';
import {createGate} from './gate.js?v=9';
import {createMonument} from './monument.js?v=9';
import {createTerrain} from './terrain.js?v=9';
import {mapPoint,mapPolygon,BOUNDARY,ACADEMIC,SPINES,FORESTS,PATHS,GATE,GATE_APPROACH,gatePoint,BUS_BOUNDARY,BUS} from './layout.js?v=9';
export {BOUNDARY} from './layout.js?v=9';
function landmark(id,code,name,en,p,spawn,look,roof,description){const [x,z]=mapPoint(p);return {id,code,name,en,x,z,y:6+roof,spawn:mapPoint(spawn),look:mapPoint(look),description};}
export const LANDMARKS=[
 {id:'overview',code:'',name:'校园全景',en:'Campus overview',icon:'orbit'},
 {...landmark('gate','门','校园大门','Main Entrance',GATE.centre,GATE.centre,GATE.centre,11.5,'大门横跨中央大道入口，正面朝向校外巴士站。浅色双柱、绿色立体桁架、中英文校名与中央岗亭按实景照片调整。'),spawn:gatePoint(-3.7,12),look:gatePoint(-3.7,-12)},
 landmark('bus','BUS','校外巴士站','Bus Terminus',BUS.centre,[231,974],BUS.vehicle,8,'大门外的狭长回车场设有分隔站台、候车棚和步行连接，停靠一辆免费素材制作的示意巴士。'),
 landmark('entrance','A','入口广场','Entrance Plaza',[421,973],[435,921],[423,972],23,'入口广场位于校园南端，曹贵子基金会大楼沿广场弧形边缘布置。'),
 landmark('library','C','图书馆与中央广场','Library & Central Plaza',[782,649],[786,732],[785,676],32,'中央大楼呈弧形，蒙民伟图书馆与中央广场位于两翼教学楼的转折处。'),
 landmark('academic','B · D','南翼与北翼教学楼','Academic Buildings',[985,770],[942,816],[962,761],29,'B1—B4 与 D1—D4 沿折线排列，条形教学楼与连接楼围合出连续庭院。'),
 landmark('garden','G','中央花园','Central Garden',[789,518],[773,568],[790,525],10,'中央花园位于柏立基堂与赛马会小学之间，以不规则绿地和弧形步道连接校园生活区。'),
 landmark('halls','H','三座学生宿舍','Student Halls',[515,671],[538,735],[519,673],45,'罗富国堂、葛量洪堂、柏立基堂沿主干道一侧依次排列，下部连续退台，上部形成较高楼体，背靠林木山坡。'),
 landmark('sports','E','文康与运动区','Amenities & Sports',[1433,859],[1481,942],[1435,857],28,'足球场、新教学大楼、游泳池与文康运动综合大楼，依次位于北翼教学楼的延伸方向。'),
 landmark('new','N','新教学大楼','New Academic Building',[1300,859],[1282,936],[1300,860],43,'八层新教学大楼位于足球场与泳池之间。模型结合官网新楼资料，示意屋顶篮球场与主体体量。')
];
export function groundHeight(){return 6;}
export function pointInPolygon(x,z,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function segmentDistance(x,z,a,b){const vx=b[0]-a[0],vz=b[1]-a[1],t=THREE.MathUtils.clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1),0,1);return Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);}
export function inCampus(x,z,margin=0){return [BOUNDARY,GATE_APPROACH,BUS_BOUNDARY].some(poly=>pointInPolygon(x,z,poly)&&(!margin||poly.every((p,i)=>segmentDistance(x,z,p,poly[(i+1)%poly.length])>margin)));}
export function createCampus(){
 const group=new THREE.Group();group.name='EdUHK campus traced from official plan';const colliders=[],footprints=[],pickables=[],paths=[],treeItems=[],batches=new Map(),materials={};
 const colors={concrete:'#e4dac4',slab:'#f3eddc',brick:'#dedbca',window:'#668b82',roof:'#ae8c8b',dark:'#36574b',paving:'#d7d5bb',road:'#a8aca1',grass:'#91aa73'};
 const cube=new THREE.BoxGeometry(1,1,1);let seed=149;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function mat(color){return materials[color]??=new THREE.MeshStandardMaterial({color,roughness:.86,metalness:color===colors.window?.16:0});}
 function box(x,y,z,w,h,d,color,rot=0){if(!batches.has(color))batches.set(color,[]);batches.get(color).push([x,y,z,w,h,d,rot]);}
 function rectPoints(cx,cz,w,d,rot=0){return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>[cx+x*Math.cos(rot)+z*Math.sin(rot),cz-x*Math.sin(rot)+z*Math.cos(rot)]);}
 function bbox(poly){return{minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),minZ:Math.min(...poly.map(p=>p[1])),maxZ:Math.max(...poly.map(p=>p[1]))};}
 function collider(poly,h=40){colliders.push({type:'polygon',poly,h,...bbox(poly)});}
 function shape(poly){const s=new THREE.Shape();poly.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();return s;}
 function prism(poly,base,h,color,id=null,solid=false){const geo=new THREE.ExtrudeGeometry(shape(poly),{depth:h,bevelEnabled:false,curveSegments:24});geo.rotateX(-Math.PI/2);geo.translate(0,base,0);const m=new THREE.Mesh(geo,mat(color));m.castShadow=h>1;m.receiveShadow=true;group.add(m);if(id){m.userData.locationId=id;pickables.push(m);}if(solid)collider(poly,base+h);return m;}
 function disk(x,z,r,y,color){const m=new THREE.Mesh(new THREE.CircleGeometry(r,64),mat(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
 function ring(x,z,inner,outer,y,color){const m=new THREE.Mesh(new THREE.RingGeometry(inner,outer,72),mat(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
 function line(a,b,y,color,width=.25,h=.12){box((a[0]+b[0])/2,y,(a[1]+b[1])/2,Math.hypot(b[0]-a[0],b[1]-a[1]),h,width,color,-Math.atan2(b[1]-a[1],b[0]-a[0]));}
 function edgeLines(poly,y,color,width=.28,h=.35){poly.forEach((a,i)=>line(a,poly[(i+1)%poly.length],y,color,width,h));}
 function block(poly,height,id,{floors=Math.round(height/3.8),glass=false,roof=true,solid=true,details=true,code,base=6}={}){
  prism(poly,base,height,glass?colors.window:colors.concrete,id,solid);footprints.push({poly,color:glass?'#839f96':'#bdbca4',code,id});
  if(!details)return;
  const centre=poly.reduce((p,v)=>[p[0]+v[0]/poly.length,p[1]+v[1]/poly.length],[0,0]);
  for(let f=0;f<floors;f++){
   const y=base+f*height/floors;edgeLines(poly,y+.3,colors.slab,.55,.36);
   for(let j=0;j<poly.length;j++){
    const a=poly[j],b=poly[(j+1)%poly.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<1.3)continue;
    const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len,angle=-Math.atan2(dz,dx),n=Math.max(1,Math.round(len/4.4)),gap=len/n;
    const winding=Math.sign(poly.reduce((sum,a,k)=>{const b=poly[(k+1)%poly.length];return sum+a[0]*b[1]-b[0]*a[1];},0));let nx=dz*winding,nz=-dx*winding;
    for(let k=0;k<n;k++){const s=(k+.5)*gap;box(a[0]+dx*s+nx*.04,y+height/floors*.53,a[1]+dz*s+nz*.04,gap*.79,height/floors*.69,.095,colors.window,angle);}
    if(f===0)for(let k=0;k<=n;k+=2){const s=k*gap;box(a[0]+dx*s+nx*.14,base+height/2,a[1]+dz*s+nz*.14,.24,height,.32,colors.brick,angle);}
   }
  }
  edgeLines(poly,base+height+.48,colors.slab,.32,.8);
  if(roof){const inset=poly.map(p=>[centre[0]+(p[0]-centre[0])*.97,centre[1]+(p[1]-centre[1])*.97]);prism(inset,base+height+.02,.18,colors.roof);const bounds=bbox(poly);if(bounds.maxX-bounds.minX>9&&bounds.maxZ-bounds.minZ>9)box(centre[0],base+1+height,centre[1],3,1.7,2.3,'#adb5a2');}
 }
 function rectBlock(px,py,pw,pd,angle,height,id,opts={}){const [x,z]=mapPoint([px,py]);const p=rectPoints(x,z,pw*.5,pd*.5,angle);block(p,height,id,opts);return p;}
 function ribbon(p,width,color,closed=false,y=6.10){const curve=new THREE.CatmullRomCurve3(p.map(v=>new THREE.Vector3(v[0],0,v[1])),closed,'centripetal');const pos=[],idx=[],samples=Math.max(30,p.length*14);
  for(let i=0;i<=samples;i++){const v=curve.getPoint(i/samples),t=curve.getTangent(i/samples),nx=-t.z,nz=t.x;for(const s of [-1,1])pos.push(v.x+nx*width*.5*s,y,v.z+nz*width*.5*s);if(i<samples){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const material=mat(color);material.side=THREE.DoubleSide;const m=new THREE.Mesh(g,material);m.receiveShadow=true;group.add(m);paths.push({curve,width});return curve;
 }
 group.add(createTerrain(BOUNDARY,[GATE_APPROACH,BUS_BOUNDARY]));
 prism(GATE_APPROACH,-5,11.07,colors.paving);
 const land=prism(BOUNDARY,-5,11,'#b1bd95');land.castShadow=true;prism(BOUNDARY,6,.05,'#a0b183');
 // The podium follows the kink in the main complex, not an oval island.
 prism(mapPolygon([[332,878],[436,780],[655,654],[714,620],[791,607],[889,650],[1147,758],[1480,777],[1545,955],[1551,981],[1380,956],[1240,922],[1025,850],[836,771],[805,778],[748,766],[538,910],[511,970],[478,998],[424,1000],[376,978]]),6.055,.035,'#d0d1bf');
 for(const entry of PATHS){const curve=ribbon(mapPolygon(entry.p),entry.w,entry.kind==='road'?colors.road:colors.paving);if(entry.kind==='road'){const count=Math.ceil(curve.getLength()/8);for(let i=0;i<count;i++){const p=curve.getPoint(i/count),t=curve.getTangent(i/count);box(p.x,6.13,p.z,.22,.02,2.4,'#e0e3cd',Math.atan2(t.x,t.z));}}}
 // A: one curved administrative volume and arrival plaza, directly south of B1.
 const [ax,az]=mapPoint([444,921]);disk(ax,az,37.5,6.15,'#d9d7c3');disk(ax,az,25.5,6.2,'#dfdfce');
 function arcPoly(cx,cz,inner,outer,a1,a2,steps=42){const p=[];for(let i=0;i<=steps;i++){const a=a1+(a2-a1)*i/steps;p.push([cx+Math.cos(a)*outer,cz+Math.sin(a)*outer]);}for(let i=steps;i>=0;i--){const a=a1+(a2-a1)*i/steps;p.push([cx+Math.cos(a)*inner,cz+Math.sin(a)*inner]);}return p;}
 for(let f=0;f<5;f++){const admin=arcPoly(ax,az,26,40,Math.PI*(.35+Math.max(0,f-1)*.07),Math.PI*.91,40);block(admin,3.7,'entrance',{base:6+f*3.7,floors:1,roof:false,solid:f===0,code:f===0?'A':undefined});edgeLines(admin,9.7+f*3.7,colors.slab,.5,.4);}
 // The short arc segments are below the generic facade-detail threshold.
 // Add the administrative building's inward-facing windows explicitly so the
 // name-stone portrait has the photographed glazed forecourt facade behind it.
 for(let f=0;f<5;f++){const a0=Math.PI*(.35+Math.max(0,f-1)*.07),a1=Math.PI*.91,count=16,step=(a1-a0)/count;for(let i=0;i<count;i++){const a=a0+(i+.5)*step;box(ax+Math.cos(a)*25.90,6+f*3.7+1.96,az+Math.sin(a)*25.90,26*step*.79,2.55,.15,colors.window,Math.PI/2-a);}}
 block(mapPolygon([[348,911],[382,896],[398,933],[363,949]]),25,'entrance',{floors:6});
 for(let i=0;i<4;i++)ring(ax,az,27+i*1.8,28+i*1.8,6.25+i*.06,'#bcbfae');
 // All eight fingers are explicitly traced, preserving orientation and spacing.
 for(const item of ACADEMIC){const poly=mapPolygon(item.p),c=poly.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]);const inset=poly.map(p=>[c[0]+(p[0]-c[0])*.84,c[1]+(p[1]-c[1])*.96]);block(inset,3.9,'academic',{floors:1,roof:false,glass:true});for(const p of poly)box(p[0],8,p[1],.65,4,.65,colors.slab);block(poly,11.7,'academic',{base:9.9,floors:3,code:item.code,roof:false});const eave=poly.map(p=>[c[0]+(p[0]-c[0])*1.055,c[1]+(p[1]-c[1])*1.025]);prism(eave,21.6,.5,colors.slab);prism(inset,22.1,.18,colors.roof);const a=poly[0],b=poly[3],yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);box(c[0],23.5,c[1],9.5,2.7,7.5,colors.roof,yaw);}
 for(const p of SPINES)block(mapPolygon(p),11.7,'academic',{floors:3});
 // Small stairs/lift enclosures and planted court islands between the fingers.
 const courts=[[519,847,.51],[590,807,.51],[661,767,.51],[923,758,-.42],[998,791,-.42],[1073,825,-.42]];
 for(const [u,v,angle] of courts){const [x,z]=mapPoint([u,v]);prism(rectPoints(x,z,8,8,angle),6.13,.12,'#b7c099');rectBlock(u+5,v+3,9,14,angle,4,'academic',{floors:1,roof:true});}
 // C: a substantial curved building with successively receding upper storeys.
 const [cx,cz]=mapPoint([786,728]);
 for(let f=0;f<7;f++){const inner=26+Math.max(0,f-2)*4.8,outer=57-Math.max(0,f-4)*.75,poly=arcPoly(cx,cz,inner,outer,-Math.PI*.84,-Math.PI*.15,56);block(poly,3.85,'library',{base:6+f*3.85,floors:1,roof:false,solid:f===0,code:f===0?'C':undefined});prism(arcPoly(cx,cz,inner-.4,outer+.4,-Math.PI*.84,-Math.PI*.15,56),9.6+f*3.85,.35,colors.slab);}
 prism(arcPoly(cx,cz,45.5,55.5,-Math.PI*.81,-Math.PI*.18,48),33.05,.25,colors.roof);
 disk(cx,cz,22,6.20,'#e1dfcc');ring(cx,cz,22,24.5,6.25,'#bdbda7');
 function beam(a,b,r,color=colors.slab){const d=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),6),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);}
 const pos=[],ix=[],N=48,R=10,capPoint=(a,r)=>new THREE.Vector3(cx+Math.cos(a)*24*r,22.4+5.3*(1-r*r),cz+Math.sin(a)*20*r);
 for(let j=0;j<=R;j++)for(let i=0;i<=N;i++)pos.push(...capPoint(i/N*Math.PI*2,j/R).toArray());for(let j=0;j<R;j++)for(let i=0;i<N;i++){const k=j*(N+1)+i;ix.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1);}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));cg.setIndex(ix);cg.computeVertexNormals();group.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:'#eeeede',roughness:.7,transparent:true,opacity:.73,side:THREE.DoubleSide,depthWrite:false})));
 for(let i=0;i<16;i++)for(let j=0;j<8;j++)beam(capPoint(i/16*Math.PI*2,j/8),capPoint(i/16*Math.PI*2,(j+1)/8),.095);
 for(let j=1;j<=6;j++)for(let i=0;i<48;i++)beam(capPoint(i/48*Math.PI*2,j/6),capPoint((i+1)/48*Math.PI*2,j/6),j===6?.22:.09);
 for(const a of [.10,.72,1.12,1.70].map(v=>v*Math.PI)){const foot=new THREE.Vector3(cx+Math.cos(a)*26.5,6.2,cz+Math.sin(a)*23.5);for(const da of [-.10,.10])beam(foot,capPoint(a+da,1),.27);colliders.push({type:'circle',x:foot.x,z:foot.z,r:.5});}
 // The three residential halls form a compact stepped strip behind B, not towers around a circle.
 function terraceHall(u,v,w,d,angle,id,baseH=23,rows=6){const [x,z]=mapPoint([u,v]),W=w*.5,D=d*.5,local=(a,b)=>[x+a*Math.cos(angle)+b*Math.sin(angle),z-a*Math.sin(angle)+b*Math.cos(angle)];
  if(u>1000){for(let i=0;i<4;i++){const p=local((i-1.5)*W/4,0),ww=W/4-1.1,dd=D*.72;block(rectPoints(...p,ww,dd,angle),12.4,id,{floors:4,roof:false});const shape=new THREE.Shape();shape.moveTo(-ww/2,0);shape.lineTo(ww/2,0);shape.lineTo(ww/2,1);shape.lineTo(0,3);shape.lineTo(-ww/2,1);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:dd,bevelEnabled:false});g.translate(0,0,-dd/2);const roof=new THREE.Mesh(g,mat(colors.roof));roof.position.set(p[0],18.4,p[1]);roof.rotation.y=angle;roof.castShadow=true;group.add(roof);}return;}
  const full=rectPoints(x,z,W,D,angle);prism(full,6,3.1,colors.concrete,id,true);footprints.push({poly:full,color:'#bdbca4',id});
  for(let f=0;f<11;f++){const front=D/2-Math.min(f,6)*4.55,back=-D/2,depth=front-back,mid=(front+back)/2,base=9.1+f*3.05;block(rectPoints(...local(0,mid),W,depth,angle),3.05,id,{base,floors:1,roof:false,solid:false});prism(rectPoints(...local(0,mid),W+.5,depth+.45,angle),base+2.9,.28,colors.slab);if(f<6){const p=local(0,front+.15);box(p[0],base+3.6,p[1],W,.8,.4,'#7a9b78',angle);}}
  for(const xx of [-W*.44,W*.03,W*.44]){const p=local(xx,-D*.31);box(p[0],26.7,p[1],4.1,35.2,10,colors.slab,angle);box(p[0],45.1,p[1],4.6,1.7,10.5,colors.slab,angle);}
 }
 terraceHall(386,743,139,105,.43,'halls',23.5);
 terraceHall(517,671,137,105,.50,'halls',24.5);
 terraceHall(645,593,134,105,.62,'halls',25);
 rectBlock(289,736,20,104,.38,11,'halls',{floors:3});rectBlock(307,682,61,14,.28,11,'halls',{floors:3});
 // Jockey Club Primary School opposite C, with a long classroom wing and court.
 block(mapPolygon([[829,582],[845,553],[964,602],[950,633]]),15,'academic',{floors:4,code:'Primary school'});
 block(mapPolygon([[847,552],[865,525],[929,551],[912,581]]),16,'academic',{floors:4});
 prism(mapPolygon([[889,499],[972,558],[951,596],[866,545]]),6.05,.16,'#b98676');
 // Central Garden is an irregular wedge with elongated curved paths.
 const greenPolys=FORESTS.map(mapPolygon);for(const poly of greenPolys)prism(poly,6.11,.10,'#94ad78');
 ribbon(mapPolygon([[731,553],[769,534],[816,533],[851,540],[826,561],[783,573],[745,567]]),2.5,'#d6d9be',true,6.29);
 ribbon(mapPolygon([[746,551],[789,548],[833,549]]),1.8,'#d6d9be',false,6.3);
 // Senior staff quarters and Jockey Club residences occupy the northern branch.
 terraceHall(1217,414,158,97,-.055,'halls',23,5);
 terraceHall(1213,528,170,100,-.16,'halls',22,5);
 terraceHall(1206,618,180,69,-.035,'halls',23,4);
 rectBlock(1305,438,18,110,0,12,'academic',{floors:3,code:'Early Childhood Learning Centre'});
 // Four tennis courts lie along the eastern edge of the residential branch.
 for(let i=0;i<4;i++){
  const [x,z]=mapPoint([1349,605+i*33]);const poly=rectPoints(x,z,29,14,0);prism(poly,6.12,.1,'#7f9c83');edgeLines(rectPoints(x,z,24,10,0),6.26,'#ecedd5',.12,.025);line([x,z-5],[x,z+5],6.28,'#ecedd5',.12,.025);box(x,6.8,z,.07,1.1,10,'#748578');
 }
 // Sports field: immediately beyond D4 and aligned with the main complex.
 const [fx,fz]=mapPoint([1202,851]),fangle=-.22,field=rectPoints(fx,fz,74,39,fangle);prism(rectPoints(fx,fz,80,46,fangle),6.1,.16,'#bdc3a7');prism(field,6.3,.06,'#739b59','sports');footprints.push({poly:field,color:'#88a56b',code:'Football field'});
 function fpoint(x,z){return [fx+x*Math.cos(fangle)+z*Math.sin(fangle),fz-x*Math.sin(fangle)+z*Math.cos(fangle)];}
 for(let i=0;i<10;i++){const p=fpoint(-33.3+i*7.4,0);box(p[0],6.38,p[1],7.4,.025,39,i%2?'#739b59':'#7fa65f',fangle);}
 const fieldRect=(x,z,w,d)=>edgeLines(rectPoints(...fpoint(x,z),w,d,fangle),6.43,'#edf1d4',.18,.025);
 fieldRect(0,0,71,36);line(fpoint(0,-18),fpoint(0,18),6.44,'#edf1d4',.18,.025);fieldRect(-29,0,13,23);fieldRect(29,0,13,23);ring(fx,fz,5.8,6,6.46,'#edf1d4');
 for(const x of [-35.5,35.5]){for(const z of [-3,3]){const p=fpoint(x,z);box(p[0],7.45,p[1],.14,2,.14,'#f2f0da');}line(fpoint(x,-3),fpoint(x,3),8.45,'#f2f0da',.14,.14);}
 // N sits between the field and pool. Official information specifies eight storeys.
 rectBlock(1300,856,49,122,-.21,30.4,'new',{floors:8,glass:true,code:'N'});
 const [nx,nz]=mapPoint([1300,856]);prism(rectPoints(nx,nz,22,49,-.21),36.9,.22,'#8a9d82');edgeLines(rectPoints(nx,nz,17,27,-.21),37.18,'#e9e8ce',.16,.03);line([nx-8,nz],[nx+8,nz],37.19,'#e9e8ce',.14,.03);edgeLines(rectPoints(nx,nz,23.5,59,-.21),38.5,'#82917d',.12,2.9);
 // E wraps around the outdoor swimming pool, rather than standing before the field.
 block(mapPolygon([[1408,782],[1479,795],[1466,885],[1390,870]]),10.6,'sports',{floors:2,code:'E'});
 block(mapPolygon([[1400,887],[1520,910],[1540,967],[1374,936],[1376,910]]),8.7,'sports',{floors:2});
 block(mapPolygon([[1342,772],[1405,785],[1399,809],[1337,796]]),7.2,'sports',{floors:2});
 block(mapPolygon([[1384,811],[1402,814],[1380,914],[1364,910]]),7.5,'sports',{floors:2});
 const pool=mapPolygon([[1342,813],[1380,822],[1358,915],[1322,906]]);prism(pool,6.28,.10,'#52aeb6','sports',true);footprints.push({poly:pool,color:'#73b3b5',code:'Swimming pool'});
 const water=mat('#52aeb6');water.roughness=.2;water.metalness=.22;
 for(let i=1;i<8;i++){const t=i/8,a=[pool[0][0]+(pool[1][0]-pool[0][0])*t,pool[0][1]+(pool[1][1]-pool[0][1])*t],b=[pool[3][0]+(pool[2][0]-pool[3][0])*t,pool[3][1]+(pool[2][1]-pool[3][1])*t];line(a,b,6.43,i%2?'#e1e8cd':'#317e87',.13,.025);}
 rectBlock(1562,858,36,26,.19,7,'sports',{floors:2});
 // Gate geometry, text and collision footprints share the traced orientation.
 const station=createBusStation();group.add(station.group);station.solids.forEach(poly=>collider(poly,12));pickables.push(...station.pickables);footprints.push(...station.footprints);
 const gate=createGate();group.add(gate.group);gate.solids.forEach(poly=>collider(poly,18));pickables.push(...gate.pickables);footprints.push(...gate.footprints);
 const monument=createMonument();group.add(monument.group);collider(monument.poly,9.0);pickables.push(...monument.pickables);footprints.push({poly:monument.poly,color:'#b27655',id:'entrance'});
 // Roads, courtyards and the traced garden control where planting is placed.
 const pathSamples=paths.map(p=>({width:p.width,p:p.curve.getPoints(200)}));
 function blocked(x,z,r=.5){
  if(!inCampus(x,z,r))return true;
  for(const o of colliders){if(o.type==='circle'){if(Math.hypot(x-o.x,z-o.z)<o.r+r)return true;continue;}
   if(x<o.minX-r||x>o.maxX+r||z<o.minZ-r||z>o.maxZ+r)continue;
   if(pointInPolygon(x,z,o.poly)||o.poly.some((a,i)=>segmentDistance(x,z,a,o.poly[(i+1)%o.poly.length])<r))return true;
  }return false;
 }
 function nearPath(x,z){return pathSamples.some(p=>p.p.some(v=>(x-v.x)**2+(z-v.z)**2<(p.width/2+1.7)**2));}
 const treeMatrices=[[],[],[]],trunks=[];
 function tree(x,z,size=.9){if(blocked(x,z,1))return;const h=(5.6+random()*3.4)*size,r=(2+random()*1.6)*size;trunks.push([x,6+h*.31,z,.28*size,h*.63,.28*size,0]);const color=Math.floor(random()*3);treeMatrices[color].push([x,6+h*.79,z,r,h*.37,r,random()*Math.PI]);treeMatrices[color].push([x+r*.38,6+h*.69,z-r*.28,r*.78,h*.32,r*.79,0]);treeItems.push({x,z,r});colliders.push({type:'circle',x,z,r:.35});}
 for(let n=0;n<4200&&treeItems.length<295;n++){const x=-350+random()*680,z=-205+random()*375;if(!greenPolys.some(p=>pointInPolygon(x,z,p))||nearPath(x,z))continue;tree(x,z,.7+random()*.4);}
 for(const [u,v] of [[533,836],[604,797],[675,757],[917,776],[993,809],[1067,842],[456,914],[459,938]]){const [x,z]=mapPoint([u,v]);tree(x,z,.62);}
 // Human-scale benches and lighting on the verified exterior walk network.
 const benches=[[742,580],[776,582],[818,573],[751,533],[833,529],[743,744],[825,741],[449,942],[1078,876],[1463,946]];
 for(const p of benches){const [x,z]=mapPoint(p);if(blocked(x,z,1))continue;box(x,6.65,z,2.5,.18,.7,'#ac8967');box(x,7,z-.35,2.5,.58,.12,'#ac8967');for(const k of [-.9,.9])box(x+k,6.3,z,.12,.6,.55,'#566b55');}
 const lampMaterial=new THREE.MeshStandardMaterial({color:'#fff5cb',emissive:'#ffc876',emissiveIntensity:.1,roughness:.6});
 for(const entry of paths.filter(p=>p.width>5)){const count=Math.floor(entry.curve.getLength()/20);for(let i=0;i<count;i++){const p=entry.curve.getPoint(i/count),t=entry.curve.getTangent(i/count),x=p.x-t.z*(entry.width/2+.7),z=p.z+t.x*(entry.width/2+.7);if(blocked(x,z,.3)||pointInPolygon(x,z,GATE_APPROACH))continue;box(x,8.3,z,.14,4.6,.14,'#546d59');const lamp=new THREE.Mesh(new THREE.BoxGeometry(.7,.22,.7),lampMaterial);lamp.position.set(x,10.65,z);group.add(lamp);}}
 // A few fan palms beside the two plazas.
 for(const p of [[736,757],[839,748],[478,929],[399,912]]){const [x,z]=mapPoint(p);if(blocked(x,z,.6))continue;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.25,7,8),mat('#94866b'));trunk.position.set(x,9.5,z);trunk.castShadow=true;group.add(trunk);for(let i=0;i<8;i++){const a=i/8*Math.PI*2,leaf=new THREE.Mesh(new THREE.ConeGeometry(.55,3.4,4),mat('#6d8952'));leaf.position.set(x+Math.cos(a)*1.3,13.2,z+Math.sin(a)*1.3);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(a),-.27,Math.sin(a)).normalize());group.add(leaf);}}
 function instances(geo,material,items){const m=new THREE.InstancedMesh(geo,material,items.length),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),s=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);items.forEach((a,i)=>{v.set(a[0],a[1],a[2]);s.set(a[3],a[4],a[5]);q.setFromAxisAngle(axis,a[6]);matrix.compose(v,q,s);m.setMatrixAt(i,matrix);});m.castShadow=true;m.receiveShadow=true;group.add(m);}
 for(const [color,items] of batches)instances(cube,mat(color),items);instances(new THREE.CylinderGeometry(.65,1,1,6),mat('#786c50'),trunks);['#4d7652','#608454','#3f694c'].forEach((c,i)=>instances(new THREE.IcosahedronGeometry(1,1),mat(c),treeMatrices[i]));
 group.updateMatrixWorld(true);
 function safeSpawn(x,z){if(!blocked(x,z,1.0))return[x,z];for(let radius=1;radius<30;radius++)for(let i=0;i<32;i++){const a=i/32*Math.PI*2,xx=x+Math.cos(a)*radius,zz=z+Math.sin(a)*radius;if(!blocked(xx,zz,1.0))return[xx,zz];}return mapPoint([786,732]);}
 return{group,colliders,footprints,pickables,paths,treeItems,blocked,safeSpawn,surfaceHeight:createSurfaceHeight(group),water,lampMaterial,materials,boundary:BOUNDARY,entranceBoundary:GATE_APPROACH,busBoundary:BUS_BOUNDARY,greenPolys,field};
}
