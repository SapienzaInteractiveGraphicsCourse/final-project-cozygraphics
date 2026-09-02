import * as THREE from "three";

/**
 * Car reppresentation
 */
export class Vehicle{
  constructor({
    root,
    direction,
    speed,
    progress,
    wheelAnimation=null,
    phase=0,
    laneOffset=0
  }){
    this.root=root;
    this.direction=direction;
    this.speed=speed;
    this.desiredSpeed=speed;
    this.currentSpeed=speed;
    this.progress=progress;
    this.extendedRouteInitialized=false;
    this.wheelAnimation=wheelAnimation;
    this.baseY=root?.position?.y ?? 0;
    this.phase=phase;
    this.laneOffset=laneOffset;
    this.smoothYaw=root?.rotation?.y ?? 0;
    this.smoothRoll=0;
    this.smoothPitch=0;
    this.previousTangent=null;
  }

  setCollisionProfile(profile){
    if(this.root){
      this.root.userData.collisionProfile=profile;
    }
  }

  setProgress(value){
    this.progress=THREE.MathUtils.euclideanModulo(value,1);
  }

  setSpeed(value){
    this.currentSpeed=Math.max(0,value);
  }

  setDesiredSpeed(value){
    this.desiredSpeed=Math.max(0,value);
  }

  updateWheelRotation(dt){
    if(!this.wheelAnimation || !this.root) return;

    const currentWorldPosition=new THREE.Vector3();
    this.root.getWorldPosition(currentWorldPosition);

    if(
      !this.wheelAnimation.wasVisible ||
      !this.wheelAnimation.previousWorldPosition
    ){
      this.wheelAnimation.previousWorldPosition=currentWorldPosition.clone();
      this.wheelAnimation.wasVisible=true;
      return;
    }

    const travelled=currentWorldPosition.distanceTo(
      this.wheelAnimation.previousWorldPosition
    );

    const teleportThreshold=Math.max(
      (this.currentSpeed ?? this.speed)*dt*4.0,
      2.0
    );

    if(travelled<=teleportThreshold){
      const signedDistance=travelled*this.direction;

      this.wheelAnimation.angle-=
        signedDistance/this.wheelAnimation.worldWheelRadius;

      if(Math.abs(this.wheelAnimation.angle)>Math.PI*200){
        this.wheelAnimation.angle%=Math.PI*2;
      }

      this.wheelAnimation.uniforms.uWheelAngle.value=
        this.wheelAnimation.angle;
    }

    this.wheelAnimation.previousWorldPosition.copy(currentWorldPosition);
  }

  keepStableHeight(){
    if(this.root){
      this.root.position.y=this.baseY;
    }
  }
}
