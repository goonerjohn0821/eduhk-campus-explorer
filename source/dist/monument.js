import * as T from './vendor/three.module.js';
import {MONUMENT,monumentPoint} from './layout.js?v=9';
import {GATE_GLYPHS} from './gate-glyphs.js?v=9';

// Pale granite name stone, raised lettering and brick planting bed from the
// supplied administrative-forecourt photographs. All lettering is real geometry.
export function createMonument(){
 const group=new T.Group();group.name='香港教育大學 · forecourt name stone';
 group.position.fromArray(monumentPoint(0,MONUMENT.base,0));group.rotation.y=MONUMENT.angle;
 const pickables=[],materials=new Map(),batches=new Map(),cube=new T.BoxGeometry(1,1,1);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.86}));return materials.get(c);};
 function mesh(g,c){const m=new T.Mesh(g,mat(c));m.castShadow=true;m.receiveShadow=true;m.userData.locationId='entrance';group.add(m);pickables.push(m);return m;}
 function box(x,y,z,w,h,d,c){if(!batches.has(c))batches.set(c,[]);batches.get(c).push([x,y,z,w,h,d]);}
 const stone='#c9c7b9',ink='#2e3933',green='#267354';
 box(0,.22,0,7.4,.44,2.8,'#b27655');box(0,.455,0,7.55,.075,2.93,'#c58a63');box(0,.50,0,7.04,.035,2.38,'#544e37');
 // Brick courses, staggered vertical joints and individual coping stones.
 for(const y of [.145,.29])for(const z of [-1.405,1.405])box(0,y,z,7.4,.016,.012,'#6f6452');
 for(let row=0;row<3;row++)for(let x=-3.65+(row%2)*.22;x<3.7;x+=.44)for(const z of [-1.41,1.41])box(x,.075+row*.145,z,.012,.135,.012,'#6f6452');
 for(let x=-3.72;x<3.8;x+=.44)for(const z of [-1.405,1.405])box(x,.496,z,.012,.01,.29,'#857052');
 for(const x of [-3.705,3.705])for(const y of [.145,.29])box(x,y,0,.012,.016,2.8,'#6f6452');
 for(const x of [-1.88,1.88]){box(x,.91,-.2,.25,.87,.34,stone);box(x,.51,-.2,.45,.10,.52,'#aaa998');}
 box(0,2.02,-.2,4.92,1.43,.25,stone);box(0,2.753,-.2,4.96,.035,.27,'#dfddd1');
 box(-2.466,2.02,-.2,.018,1.43,.25,'#a5a99b');
 const glyphCache=new Map();
 function glyph(ch,size){const k=ch+'|'+size;if(glyphCache.has(k))return glyphCache.get(k);const p=new T.ShapePath(),s=size/1000;for(const c of GATE_GLYPHS[ch].path){const a=c.slice(1).map(n=>n*s);if(c[0]==='M')p.moveTo(...a);else if(c[0]==='L')p.lineTo(...a);else if(c[0]==='C')p.bezierCurveTo(...a);else if(c[0]==='Q')p.quadraticCurveTo(...a);else if(c[0]==='Z')p.currentPath.closePath();}const g=new T.ExtrudeGeometry(p.toShapes(true),{depth:.013,bevelEnabled:false,curveSegments:5});glyphCache.set(k,g);return g;}
 function line(text,x,y,size,width){const natural=[...text].reduce((s,c)=>s+GATE_GLYPHS[c].width*size/1000,0),spacing=(width-natural)/(text.length-1);for(const ch of text){if(ch!==' '){const m=mesh(glyph(ch,size),ink);m.position.set(x,y,-.062);}x+=GATE_GLYPHS[ch].width*size/1000+spacing;}}
 line('香港教育大學',-.82,2.20,.34,2.72);
 box(.64,2.13,-.052,2.98,.018,.015,'#ce733d');
 line('The Education University',-.82,1.81,.234,3.03);line('of Hong Kong',-.82,1.52,.234,1.7);
 // Orange disc and the six green pages of the university emblem.
 const disc=mesh(new T.CylinderGeometry(.17,.17,.032,32),'#df813f');disc.rotation.x=Math.PI/2;disc.position.set(-1.79,2.42,-.043);
 for(let row=0;row<3;row++)for(const side of [-1,1]){const s=new T.Shape();s.moveTo(0,0);s.lineTo(side*.35,0);s.quadraticCurveTo(side*.43,.015,side*.43,.13);s.lineTo(side*.43,.25);s.quadraticCurveTo(side*.35,.17,side*.27,.175);s.lineTo(0,.175);s.closePath();const m=mesh(new T.ExtrudeGeometry(s,{depth:.023,bevelEnabled:false,curveSegments:6}),green);m.position.set(-1.60,1.52+row*.255,-.063);}
 box(-1.60,1.89,-.052,.035,.93,.025,green);
 // Low planted bands preserve visibility of the whole name stone.
 const leaves=new T.IcosahedronGeometry(1,1),plantColors=['#70813d','#8d9f43','#713f51','#a95c66'];
 for(let i=0;i<14;i++)for(let j=0;j<4;j++){const x=-3.35+i*.515,z=-1.0+j*.66;const m=mesh(leaves,plantColors[j]);m.scale.set(.33,.17+(i%3)*.035,.26);m.position.set(x,.68,z);}
 const matrix=new T.Matrix4();for(const [color,items]of batches){const m=new T.InstancedMesh(cube,mat(color),items.length);items.forEach(([x,y,z,w,h,d],i)=>{matrix.makeScale(w,h,d);matrix.setPosition(x,y,z);m.setMatrixAt(i,matrix);});m.castShadow=true;m.receiveShadow=true;m.userData.locationId='entrance';group.add(m);pickables.push(m);}
 const poly=[[-3.8,-1.5],[3.8,-1.5],[3.8,1.5],[-3.8,1.5]].map(([x,z])=>{const p=monumentPoint(x,0,z);return[p[0],p[2]];});
 return{group,pickables,poly};
}
