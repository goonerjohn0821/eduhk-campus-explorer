import * as THREE from './vendor/three.module.js';

// Sample the rendered paving, including raised plazas, kerbs and platforms.
// Cache only surfaces near ground level; roofs and furniture cannot lift walkers.
export function createSurfaceHeight(group,base=6){
 const surfaces=[],bounds=new THREE.Box3(),instance=new THREE.Matrix4(),world=new THREE.Matrix4();
 function collect(geometry,matrix,material){
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  bounds.copy(geometry.boundingBox).applyMatrix4(matrix);
  if(bounds.max.y<base||bounds.max.y>base+.55)return;
  const mesh=new THREE.Mesh(geometry,material);mesh.matrixAutoUpdate=false;mesh.matrixWorld.copy(matrix);
  surfaces.push({mesh,bounds:bounds.clone()});
 }
 group.updateMatrixWorld(true);
 group.traverse(o=>{
  if(!o.isMesh)return;
  if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);world.multiplyMatrices(o.matrixWorld,instance);collect(o.geometry,world,o.material);}}
  else collect(o.geometry,o.matrixWorld,o.material);
 });
 const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,.7),hits=[];
 return function surfaceHeight(x,z){
  let height=base;ray.ray.origin.set(x,base+.6,z);
  for(const {mesh,bounds}of surfaces){
   if(x<bounds.min.x||x>bounds.max.x||z<bounds.min.z||z>bounds.max.z||bounds.max.y<=height)continue;
   hits.length=0;ray.intersectObject(mesh,false,hits);
   for(const hit of hits)height=Math.max(height,hit.point.y);
  }
  return height;
 };
}
