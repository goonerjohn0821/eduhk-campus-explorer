import * as T from './vendor/three.module.js';import {vehiclePoint} from './film-sequences.js?v=9';import {BUS} from './layout.js?v=9';
export function createFilmProps(){const group=new T.Group();group.name='Bus boarding doorway';group.position.fromArray(vehiclePoint(0,6.10,0));group.rotation.y=BUS.angle;
 function box(x,y,z,w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 box(1.262,1.43,-3.5,.025,2.14,1.12,'#243c37');
 for(const z of [-4.08,-2.92])box(1.29,1.45,z,.1,2.22,.055,'#c4cbbb');
 box(1.45,.38,-3.5,.38,.12,1.12,'#849184');box(1.75,.23,-3.5,.35,.12,1.12,'#aab2a0');
 for(const z of [-4.06,-2.94]){const panel=box(1.53,1.49,z,.035,2.12,.5,'#516c61');panel.rotation.y=z<-3.5?-.85:.85;}
 return group;}
