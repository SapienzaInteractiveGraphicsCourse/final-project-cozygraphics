import * as THREE from "three";

function fitModelToHeight(model, targetHeight = 1.7) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  if (size.y <= 0) {
    console.warn("Altezza modello non valida", size);
    return;
  }

  const scale = targetHeight / size.y;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
}

function putModelOnFloor(model, y = 0) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y += y - box.min.y;
  model.updateMatrixWorld(true);
}

function centerModelXZ(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.updateMatrixWorld(true);
}

function lerpAngle(a, b, t) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

function angleToTarget(fromGroup, targetGroup) {
  const dx = targetGroup.position.x - fromGroup.position.x;
  const dz = targetGroup.position.z - fromGroup.position.z;
  return Math.atan2(dx, dz);
}

export class Character {
  constructor(config, context) {
    this.context = context;

    this.id = config.id;
    this.name = config.name ?? config.id;
    this.file = config.file;
    this.role = config.role ?? "character";

    this.height = config.height ?? 4;
    this.speed = config.speed ?? 0;
    this.zone = config.zone ?? "world";
    this.style = config.style ?? "idle";
    this.dialogue = config.dialogue ?? "";

    this.root = new THREE.Group();
    this.root.position.set(config.position?.x ?? 0, 0, config.position?.z ?? 0);
    this.root.rotation.y = config.rotationY ?? Math.PI;

    this.context.scene.add(this.root);

    this.model = null;
    this.bones = [];
    this.meshes = [];
    this.rest = new Map();
    this.ready = false;

    this.state = "idle";
    this.timer = 0;
    this.originalRotationY = this.root.rotation.y;
  }

  setModel(model) {
    this.model = model;
    this.bones = [];
    this.meshes = [];
    this.rest.clear();

    model.traverse((obj) => {
      if (obj.isBone) this.bones.push(obj);

      if (obj.isMesh || obj.isSkinnedMesh) {
        this.meshes.push(obj);
        obj.castShadow = true;
        obj.frustumCulled = false;
      }
    });

    this.bones.forEach((bone) => {
      this.rest.set(bone, bone.rotation.clone());
    });

    centerModelXZ(model);
    fitModelToHeight(model, this.height);
    putModelOnFloor(model, 0);

    this.root.add(model);
    this.ready = true;
  }

  distanceTo(otherCharacter) {
    return this.root.position.distanceTo(otherCharacter.root.position);
  }

  lookAtCharacter(targetCharacter, lerp = 0.12) {
    const targetRotation = angleToTarget(this.root, targetCharacter.root);
    this.root.rotation.y = lerpAngle(this.root.rotation.y, targetRotation, lerp);
  }
}
