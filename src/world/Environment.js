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
