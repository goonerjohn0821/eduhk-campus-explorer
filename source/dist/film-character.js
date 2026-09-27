import * as T from './vendor/three.module.js';
// Film-only arm posing, on the same student rig used by interactive walking.
export function createPhotoPose(group,model){
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name]=o;});
 const pos=new T.Vector3(),end=new T.Vector3(),q=new T.Quaternion(),parentQ=new T.Quaternion(),currentQ=new T.Quaternion();
 function aim(bone,child,target){bone.getWorldPosition(pos);child.getWorldPosition(end);q.setFromUnitVectors(end.sub(pos).normalize(),target.clone().sub(pos).normalize());bone.getWorldQuaternion(currentQ);bone.parent.getWorldQuaternion(parentQ);bone.quaternion.copy(parentQ.invert().multiply(q).multiply(currentQ));group.updateMatrixWorld(true);}
 function arm(side,targetLocal,amount){const upper=bones['UpperArm'+side],lower=bones['LowerArm'+side],wrist=bones['Wrist'+side];if(!upper||!lower||!wrist)return;
  const originalUpper=upper.quaternion.clone(),originalLower=lower.quaternion.clone(),start=upper.getWorldPosition(new T.Vector3()),joint=lower.getWorldPosition(new T.Vector3()),hand=wrist.getWorldPosition(new T.Vector3()),target=group.localToWorld(new T.Vector3(...targetLocal));
  const a=start.distanceTo(joint),b=joint.distanceTo(hand),delta=target.clone().sub(start),d=T.MathUtils.clamp(delta.length(),Math.abs(a-b)+.001,a+b-.001),axis=delta.normalize(),along=(a*a-b*b+d*d)/(2*d);
  const pole=group.localToWorld(new T.Vector3(side==='R'?.38:-.38,1.03,-.18)).sub(start);pole.addScaledVector(axis,-pole.dot(axis)).normalize();const elbow=start.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along)));
  aim(upper,lower,elbow);aim(lower,wrist,target);const posedUpper=upper.quaternion.clone(),posedLower=lower.quaternion.clone();upper.quaternion.copy(originalUpper).slerp(posedUpper,amount);lower.quaternion.copy(originalLower).slerp(posedLower,amount);group.updateMatrixWorld(true);
 }
 return amount=>{group.updateMatrixWorld(true);if(amount<=0)return;
  // A relaxed portrait: right hand raised beside the face, left hand at the hip.
  // The student is the subject of the photograph and carries no camera or phone.
  arm('R',[.40,1.48,-.14],amount);arm('L',[-.26,1.02,.02],amount);
  const wrist=bones.WristR,middle=bones.Middle2R;
  if(wrist&&middle){const original=wrist.quaternion.clone(),target=group.localToWorld(new T.Vector3(.40,1.65,-.15));aim(wrist,middle,target);const posed=wrist.quaternion.clone();wrist.quaternion.copy(original).slerp(posed,amount);}
  group.updateMatrixWorld(true);
 };
}
