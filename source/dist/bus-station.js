import * as T from './vendor/three.module.js';
import {BUS,BUS_BOUNDARY,busPoint,mapPoint} from './layout.js?v=9';
import {BUS_MESH} from './assets/bus-mesh.js';
export function createBusStation(){
 const group=new T.Group();group.name='Outside bus terminus';const solids=[],footprints=[],pickables=[];
 const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.78}));return mats.get(c);};
 function mesh(g,c,parent=group){const m=new T.Mesh(g,material(c));m.castShadow=true;m.receiveShadow=true;m.userData.locationId='bus';parent.add(m);pickables.push(m);return m;}
 function slab(poly,y,h,c){const s=new T.Shape();poly.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=mesh(g,c);m.position.y=y;return m;}
 function rect(x,z,w,d){return[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>busPoint(x+a,z+b));}
 function box(x,y,z,w,h,d,c){const m=mesh(new T.BoxGeometry(w,h,d),c),p=busPoint(x,z);m.position.set(p[0],y,p[1]);m.rotation.y=BUS.angle;return m;}
 slab(BUS_BOUNDARY,-5,11.08,'#a5aaa2');footprints.push({poly:BUS_BOUNDARY,color:'#a5aaa2',id:'bus'});
 // Parallel boarding islands follow the long axis of the mapped turnaround.
 for(const x of [-4.4,4.4]){
  const poly=rect(x,0,1.5,42);slab(poly,6.08,.13,'#e2dfca');footprints.push({poly,color:'#e2dfca',id:'bus'});
  for(const s of [-1,1])box(x+s*.8,6.105,0,.12,.015,42,'#e7c956');
  box(x,8.8,-4,2.1,.18,13,'#456e5d');
  for(const z of [-9.5,1.5]){box(x,7.5,z,.12,2.65,.12,'#53695d');solids.push(rect(x,z,.25,.25));}
  for(const z of [-7,-2]){
   box(x,6.65,z,.55,.12,2.2,'#aa9070');box(x+.23,6.95,z,.08,.55,2.2,'#aa9070');
   // The island top is 6.21; steel legs meet the underside of the seat at 6.59.
   for(const dz of [-.82,.82]){
    box(x,6.235,z+dz,.61,.05,.18,'#46594d');
    for(const dx of [-.19,.19])box(x+dx,6.41,z+dz,.065,.36,.10,'#46594d');
    box(x,6.57,z+dz,.49,.06,.10,'#46594d');
    box(x+.23,6.81,z+dz,.075,.72,.085,'#46594d');
   }
   box(x,6.40,z,.065,.075,1.74,'#46594d');
   solids.push(rect(x,z,.62,2.22));
  }
  box(x,7.25,-15,.08,2.2,.08,'#60695e');box(x,8.30,-15,.6,.75,.10,'#e6cf72');
 }
 // Broad planted island separates the outer loop from the boarding lanes.
 const island=rect(-12,2,4.3,33);slab(island,6.08,.18,'#d4d3b9');slab(rect(-12,2,3.5,31),6.26,.06,'#80926a');solids.push(island);footprints.push({poly:island,color:'#80926a',id:'bus'});
 for(const z of [-10,2,14]){box(-12,7.3,z,.2,2.1,.2,'#8c8168');const m=mesh(new T.IcosahedronGeometry(1.8,1),'#708b63'),p=busPoint(-12,z);m.position.set(p[0],9,p[1]);}
 for(const z of [-14,-5,4,13])box(.0,6.105,z,.14,.012,3,'#eee9d6');
 const bus=new T.Group(),bp=mapPoint(BUS.vehicle);bus.position.set(bp[0],6.10,bp[1]);bus.rotation.y=BUS.angle;bus.name='Quaternius CC0 bus';group.add(bus);
 const colors={Bottom:'#758e79',Bumper:'#c2c4b9',Details:'#323c38',Lights:'#f4df9d',Material:'#303835',Top:'#e3dfc4',Windows:'#35565b'};
 for(const [name,data]of Object.entries(BUS_MESH)){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));mesh(g,colors[name]||'#b9bcae',bus);}
 const a=BUS.angle,poly=[[-1.3,-5.8],[1.3,-5.8],[1.3,5.8],[-1.3,5.8]].map(([x,z])=>[bp[0]+x*Math.cos(a)+z*Math.sin(a),bp[1]-x*Math.sin(a)+z*Math.cos(a)]);solids.push(poly);footprints.push({poly,color:'#557764',id:'bus'});
 return{group,solids,footprints,pickables};
}
