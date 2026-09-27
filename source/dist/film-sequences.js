import {mapPoint,gatePoint,monumentPoint as m,BUS,MONUMENT} from './layout.js?v=9';
const p=(u,v,h)=>{const [x,z]=mapPoint([u,v]);return[x,h,z];};
const g=(x,h,z)=>{const q=gatePoint(x,z);return[q[0],h,q[1]];};
export const vehiclePoint=(x,h,z)=>{const [cx,cz]=mapPoint(BUS.vehicle),a=BUS.angle;return[cx+x*Math.cos(a)+z*Math.sin(a),h,cz-x*Math.sin(a)+z*Math.cos(a)];};
const key=(time,position,target,fov=39)=>({time,position,target,fov});
const character=(path,state='Walk',extra={})=>({path,state,...extra});
export const FILM_DURATION=90;
export const PHOTO_TIME=86.7;
export const SHOTS=[
 {id:'scene01_busStop',act:1,title:'到达 · 下车',startTime:0,duration:5,easing:'smooth',camera:[key(0,vehiclePoint(9,8.1,-10),vehiclePoint(1.6,7.2,-3.5),43),key(5,vehiclePoint(8.2,8.1,-9),vehiclePoint(2.2,7.2,-3.5),43)],character:character([key(0,vehiclePoint(1.48,.47,-3.5)),key(1.1,vehiclePoint(2.55,0,-3.5)),key(4.1,vehiclePoint(3.5,0,-5.3)),key(5,vehiclePoint(3.5,0,-5.3))],'Walk',{heading:-BUS.angle,phase:0,stepDown:true})},
 {id:'scene02_gate',act:1,title:'入校 · 走近校门',startTime:5,duration:4.5,easing:'linear',camera:[key(0,g(-3.7,8.05,24),g(0,10.1,0),42),key(4.5,g(-3.7,8.3,14),g(0,10.1,-4),42)],character:character([key(0,g(-3.7,0,10)),key(4.5,g(-3.7,0,1))],'Walk',{phase:1.3,animRate:1})},
 {id:'scene03_flyThrough',act:1,title:'进入 · 沿中央大道飞行',startTime:9.5,duration:22.5,easing:'linear',camera:[key(0,g(-3.7,8.3,14),g(0,10.1,-4),42),key(3,p(351,831,19),p(444,785,19),46),key(7,p(441,788,35),p(600,704,27),49),key(12,p(553,727,54),p(760,625,32),50),key(17,p(664,660,62),p(882,666,34),50),key(20,p(733,616,64),p(1002,718,34),50),key(22.5,p(797,607,64),p(1105,780,30),50)],character:character([key(0,g(-3.7,0,1)),key(8,g(-3.7,0,-10))],'Walk',{phase:5.8,animRate:1})},
 {id:'scene04_overview',act:2,title:'全景 · 理解校园',startTime:32,duration:5,easing:'smooth',camera:[key(0,[-280,420,550],[-20,16,0],39),key(5,[-263,405,530],[-20,16,0],39)]},
 {id:'scene05_entrance',act:2,title:'节点 · 入口广场',startTime:37,duration:4.8,easing:'smooth',camera:[key(0,p(598,1066,71),p(444,921,13)),key(4.8,p(583,1053,71),p(444,921,13))]},
 {id:'scene06_halls',act:2,title:'节点 · 退台宿舍',startTime:41.8,duration:4.8,easing:'smooth',camera:[key(0,p(571,827,69),p(515,671,22)),key(4.8,p(588,819,69),p(528,671,22))]},
 {id:'scene07_library',act:2,title:'节点 · 图书馆与中央广场',startTime:46.6,duration:4.8,easing:'smooth',camera:[key(0,p(865,877,72),p(782,684,16)),key(4.8,p(851,861,72),p(782,684,16))]},
 {id:'scene08_academic',act:2,title:'节点 · 教学楼与庭院',startTime:51.4,duration:4.8,easing:'smooth',camera:[key(0,p(1106,1003,71),p(969,795,14)),key(4.8,p(1118,988,71),p(981,780,14))]},
 {id:'scene09_garden',act:2,title:'节点 · 中央花园',startTime:56.2,duration:4.8,easing:'smooth',camera:[key(0,p(885,607,54),p(793,541,8)),key(4.8,p(877,600,50),p(793,541,8))]},
 {id:'scene10_sports',act:2,title:'节点 · 文康与运动区',startTime:61,duration:5,easing:'smooth',camera:[key(0,p(1550,1190,123),p(1344,857,17)),key(5,p(1539,1173,123),p(1344,857,17))]},
 {id:'scene11_studentWalk',act:3,title:'体验 · 足球场旁步道',startTime:66,duration:6,easing:'linear',cameraFollow:{offset:[-2.6,2.35,5.5],target:[1.7,1.1,-3.5],fov:54},character:character([key(0,p(1196,908.6,0)),key(6,p(1175,901.4,0))],'Walk',{phase:5,animRate:1})},
 {id:'scene12_gardenWalk',act:3,title:'体验 · 绿意之间',startTime:72,duration:6,easing:'linear',cameraFollow:{offset:[3.5,2.1,4.4],target:[0,1.2,-2],fov:48},character:character([key(0,p(775.76,573.13,0)),key(2,p(784.27,572.92,0)),key(4,p(793.5,571.74,0)),key(6,p(803.03,569.66,0))],'Walk',{phase:3,animRate:1,smoothPath:true})},
 {id:'scene13_finalApproach',act:3,title:'体验 · 行政楼前的校名石牌',startTime:78,duration:6,easing:'smooth',camera:[key(0,m(-8.5,8.7,10.5),m(-7.5,7.8,0),52),key(6,m(-.7,8.2,10.4),m(-.55,7.65,.1),44)],character:character([key(0,m(-13.725,0,2.35)),key(5.2,m(-3.65,0,2.35)),key(6,m(-3.65,0,2.35))],'Walk',{phase:6,animRate:1,settleAt:5.2,turnStart:4.9,turnDuration:1.1,faceYaw:MONUMENT.angle+Math.PI})},
 {id:'scene14_photoEnding',act:3,title:'留念 · 与校名石牌合影',startTime:84,duration:6,easing:'smooth',camera:[key(0,m(-.7,8.2,10.4),m(-.55,7.65,.1),44),key(2.7,m(-.35,8.05,9.8),m(-.55,7.65,.1),44),key(6,m(-.35,8.05,9.8),m(-.55,7.65,.1),44)],character:character([key(0,m(-3.65,0,2.35)),key(6,m(-3.65,0,2.35))],'Portrait',{phase:2.8,faceYaw:MONUMENT.angle+Math.PI,look:m(-3.65,0,14)})}
];
export const SHOT_CAPTIONS={scene04_overview:['校园全景','CAMPUS OVERVIEW'],scene05_entrance:['入口广场与行政大楼','ENTRANCE PLAZA & ADMINISTRATION'],scene06_halls:['学生宿舍','STUDENT HALLS'],scene07_library:['图书馆与中央广场','LIBRARY & CENTRAL PLAZA'],scene08_academic:['教学楼与庭院','ACADEMIC BUILDINGS & COURTYARDS'],scene09_garden:['中央花园','CENTRAL GARDEN'],scene10_sports:['文康与运动区','AMENITIES & SPORTS']};
