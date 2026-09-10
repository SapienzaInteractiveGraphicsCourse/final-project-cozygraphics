export const ENVIRONMENT_MODULE_VERSION="2026-09-03-moon";

import * as THREE from "three";

export function createNightStars({
  scene,
  count=2800
}={}){
  if(!scene) return null;

  const positions=[];
  for(let i=0;i<count;i++){
    const radius=260+Math.random()*620;
    const theta=Math.random()*Math.PI*2;
    const y=55+Math.random()*330;
    positions.push(
      Math.cos(theta)*radius,
      y,
      Math.sin(theta)*radius
    );
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions,3)
  );

  const material=new THREE.PointsMaterial({
    color:0xffffff,
    size:.58,
    sizeAttenuation:true,
    transparent:true,
    opacity:.88,
    depthWrite:false
  });

  const stars=new THREE.Points(geometry,material);
  stars.name="night_star_field";
  scene.add(stars);
  return stars;
}

export function loadDistantMountains({
  scene,
  loadGLBFromCandidates,
  cloneMaterials,
  centerModelXZ
}={}){
  if(
    !scene ||
    typeof loadGLBFromCandidates!=="function" ||
    typeof cloneMaterials!=="function" ||
    typeof centerModelXZ!=="function"
  ){
    return;
  }

  loadGLBFromCandidates(
    ["./assets/models/mountains.glb"],
    (gltf,path)=>{
      const baseMountain=gltf.scene;
      baseMountain.name="mountain_template";

      cloneMaterials(baseMountain);

      baseMountain.traverse(obj=>{
        if(!obj.isMesh) return;

        obj.castShadow=false;
        obj.receiveShadow=false;
        obj.frustumCulled=true;

        const mats=
          Array.isArray(obj.material)
            ? obj.material
            : [obj.material];

        mats.forEach(mat=>{
          if(!mat) return;

          if("roughness" in mat){
            mat.roughness=
              Math.max(.86,mat.roughness??.86);
          }

          if("metalness" in mat){
            mat.metalness=
              Math.min(.04,mat.metalness??0);
          }

          mat.needsUpdate=true;
        });
      });

      centerModelXZ(baseMountain);
      baseMountain.updateMatrixWorld(true);

      const configs=[
        {
          name:"MONTAGNA LEFT",
          pair:"MONTAGNA",
          side:"LEFT",
          pos:[-555,-0.331,-185],
          rot:THREE.MathUtils.degToRad(-10.313),
          scale:25.003
        },
        {
          name:"MONTAGNETTA LEFT",
          pair:"MONTAGNETTA",
          side:"LEFT",
          pos:[-625,-1.937,-10],
          rot:THREE.MathUtils.degToRad(24.064),
          scale:21.344
        },
        {
          name:"MONTAGNA RIGHT",
          pair:"MONTAGNA",
          side:"RIGHT",
          pos:[355,-0.331,-185],
          rot:THREE.MathUtils.degToRad(10.313),
          scale:25.003
        },
        {
          name:"MONTAGNETTA RIGHT",
          pair:"MONTAGNETTA",
          side:"RIGHT",
          pos:[425,-1.937,-10],
          rot:THREE.MathUtils.degToRad(-24.064),
          scale:21.344
        }
      ];

      for(let i=0;i<configs.length;i++){
        const cfg=configs[i];
        const mountain=
          i===0
            ? baseMountain
            : baseMountain.clone(true);

        mountain.name=
          `mountain_${i+1}_${cfg.name
            .replace(/\s+/g,"_")
            .toLowerCase()}`;

        mountain.scale.setScalar(cfg.scale);
        mountain.position.set(...cfg.pos);
        mountain.rotation.set(0,cfg.rot,0);
        mountain.visible=true;

        mountain.traverse(obj=>{
          if(!obj?.isMesh) return;

          obj.visible=true;
          obj.frustumCulled=true;
          obj.castShadow=false;
          obj.receiveShadow=false;

          const sourceMats=
            Array.isArray(obj.material)
              ? obj.material
              : [obj.material];

          const tinted=
            sourceMats.map(sourceMat=>{
              if(!sourceMat) return sourceMat;

              const mat=sourceMat.clone();

              if(mat.color){
                mat.color.lerp(
                  new THREE.Color(0x27472b),
                  .24
                );
              }

              if(mat.emissive){
                mat.emissive.multiplyScalar(.15);
              }

              if("emissiveIntensity" in mat){
                mat.emissiveIntensity*=.20;
              }

              if("roughness" in mat){
                mat.roughness=
                  Math.max(
                    .82,
                    mat.roughness??.82
                  );
              }

              if("metalness" in mat){
                mat.metalness=
                  Math.min(
                    .03,
                    mat.metalness??0
                  );
              }

              mat.needsUpdate=true;
              return mat;
            });

          obj.material=
            Array.isArray(obj.material)
              ? tinted
              : tinted[0];
        });

        mountain.updateMatrixWorld(true);
        scene.add(mountain);
      }
    },
    error=>{
      console.error(
        "Errore caricando mountains.glb",
        error
      );
    }
  );
}

export function createMoon({THREE,scene}={}){
  if(!THREE || !scene) return null;

  const moonGroup=new THREE.Group();
  moonGroup.name='night_moon';
  const moonMat=new THREE.MeshStandardMaterial({
    color:0xf5f1df,
    emissive:0xd8def8,
    emissiveIntensity:1.15,
    roughness:.92,
    metalness:0
  });
  const moon=new THREE.Mesh(
    new THREE.SphereGeometry(18,24,16),
    moonMat
  );
  moon.position.set(0,205,-185);
  moonGroup.add(moon);
  const moonGlowMat=new THREE.SpriteMaterial({
    color:0xb9c8ff,
    transparent:true,
    opacity:.24,
    depthWrite:false
  });
  const moonGlow=new THREE.Sprite(moonGlowMat);
  moonGlow.scale.set(82,82,1);
  moonGlow.position.copy(moon.position);
  moonGroup.add(moonGlow);
  scene.add(moonGroup);
  return moonGroup;
}


export function buildWorldGrassFloor({
  scene,
  grassMaterial,
  grassTexture,
  previousMesh=null,
  width=760,
  depth=3400,
  position=[0,-.24,-750],
  color=0x77767B
}={}){
  if(!scene || !grassMaterial || !grassTexture) return null;

  if(previousMesh?.parent){
    previousMesh.parent.remove(previousMesh);
  }

  const geometry=new THREE.PlaneGeometry(width,depth);
  const material=grassMaterial.clone();

  material.map=grassTexture;
  material.color.setHex(color);
  material.fog=false;
  material.toneMapped=false;
  material.needsUpdate=true;

  const mesh=new THREE.Mesh(geometry,material);
  mesh.name="world_grass_png_floor";
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(...position);
  mesh.renderOrder=-30;
  mesh.receiveShadow=false;
  mesh.castShadow=false;

  scene.add(mesh);
  return mesh;
}

export function makeContinuousCurveWallSegment({
  scene,
  name,
  curve,
  offset,
  width,
  height,
  tStart,
  tEnd,
  segments=420,
  color=0x777b82,
  roughness=.88
}={}){
  if(!scene || !curve) return null;

  const positions=[];
  const indices=[];
  const half=width*.5;

  for(let i=0;i<=segments;i++){
    const t=THREE.MathUtils.lerp(
      tStart,
      tEnd,
      i/segments
    );

    const p=curve.getPoint(t);
    const tangent=curve.getTangent(t).normalize();

    const nx=-tangent.z;
    const nz=tangent.x;

    const innerX=p.x+nx*(offset-half);
    const innerZ=p.z+nz*(offset-half);
    const outerX=p.x+nx*(offset+half);
    const outerZ=p.z+nz*(offset+half);

    positions.push(
      innerX,.055,innerZ,
      outerX,.055,outerZ,
      innerX,height+.055,innerZ,
      outerX,height+.055,outerZ
    );

    if(i<segments){
      const a=i*4;
      const b=a+1;
      const c=a+2;
      const d=a+3;

      const na=a+4;
      const nb=b+4;
      const nc=c+4;
      const nd=d+4;

      indices.push(
        c,nc,d,
        nc,nd,d,
        a,b,na,
        na,b,nb,
        a,na,c,
        na,nc,c,
        b,d,nb,
        nb,d,nd
      );
    }
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions,3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material=new THREE.MeshStandardMaterial({
    color,
    roughness
  });

  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;
  mesh.castShadow=false;
  mesh.receiveShadow=true;

  scene.add(mesh);
  return mesh;
}


export function buildUnexploredMirageBoundary({
  scene,
  renderer,
  state,
  roadBuildRoadExtensions
}={}){
  if(
    !scene ||
    !renderer ||
    !state ||
    !roadBuildRoadExtensions
  ){
    return null;
  }

  state.approachGroup.clear();

  const roadExtension=roadBuildRoadExtensions();
  state.limitZ=roadExtension.limitZ;

  if(roadExtension.group){
    scene.remove(roadExtension.group);
    state.approachGroup.add(roadExtension.group);
  }

  renderer.clippingPlanes=[];
  renderer.localClippingEnabled=false;

  return roadExtension;
}

export function updateUnexploredMirageBoundary({
  player,
  activeWorldZone,
  state,
  previousPosition,
  showMessage
}={}){
  if(
    !player?.root ||
    activeWorldZone!=="outside" ||
    !state
  ){
    return;
  }

  const distance=
    player.root.position.z-
    state.limitZ;

  if(distance<state.triggerDistance){
    showMessage?.();
  }

  if(player.root.position.z<state.limitZ){
    player.root.position.copy(previousPosition);
    showMessage?.();
  }
}
