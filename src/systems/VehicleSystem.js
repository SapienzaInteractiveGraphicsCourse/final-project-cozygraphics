import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { Vehicle } from "../classes/Vehicle.js";

let ctx=null;
let vehicleLoader=null;
const vehicleClock=new THREE.Clock();

export function initVehicleSystem(context){
  ctx=context;
  vehicleLoader=new GLTFLoader(ctx.loadingManager);
  loadStreetVehicles();
}

function setupCarTyreAnimation(car){
  const carMeshes=[];
  let tyreMesh=null;

  car.traverse((obj)=>{
    if(!obj.isMesh || !obj.geometry) return;
    carMeshes.push(obj);

    const n=(obj.name || "").toLowerCase();
    if(
      !tyreMesh &&
      (n.includes("tyres") || n.includes("tires") || n.includes("wheel"))
    ){
      tyreMesh=obj;
    }
  });

  if(!tyreMesh) return null;

  function cloneMeshForWheelAnimation(mesh){
    mesh.geometry=mesh.geometry.clone();

    if(Array.isArray(mesh.material)){
      mesh.material=mesh.material.map(material=>material.clone());
    }else{
      mesh.material=mesh.material.clone();
    }
  }

  function findConnectedComponents(geometry){
    const position=geometry.getAttribute("position");
    const index=geometry.getIndex();

    if(!position || !index) return [];

    const vertexCount=position.count;
    const parent=new Int32Array(vertexCount);
    const componentSize=new Int32Array(vertexCount);

    for(let i=0;i<vertexCount;i++){
      parent[i]=i;
      componentSize[i]=1;
    }

    function findRoot(value){
      let root=value;
      while(parent[root]!==root) root=parent[root];

      while(parent[value]!==value){
        const next=parent[value];
        parent[value]=root;
        value=next;
      }

      return root;
    }

    function unionVertices(a,b){
      let rootA=findRoot(a);
      let rootB=findRoot(b);
      if(rootA===rootB) return;

      if(componentSize[rootA]<componentSize[rootB]){
        const swap=rootA;
        rootA=rootB;
        rootB=swap;
      }

      parent[rootB]=rootA;
      componentSize[rootA]+=componentSize[rootB];
    }

    for(let i=0;i<index.count;i+=3){
      const a=index.getX(i);
      const b=index.getX(i+1);
      const c=index.getX(i+2);
      unionVertices(a,b);
      unionVertices(b,c);
      unionVertices(c,a);
    }

    const componentMap=new Map();

    for(let i=0;i<vertexCount;i++){
      const root=findRoot(i);

      if(!componentMap.has(root)){
        componentMap.set(root,{
          vertices:[],
          min:new THREE.Vector3(Infinity,Infinity,Infinity),
          max:new THREE.Vector3(-Infinity,-Infinity,-Infinity)
        });
      }

      const component=componentMap.get(root);
      component.vertices.push(i);

      const x=position.getX(i);
      const y=position.getY(i);
      const z=position.getZ(i);

      component.min.x=Math.min(component.min.x,x);
      component.min.y=Math.min(component.min.y,y);
      component.min.z=Math.min(component.min.z,z);
      component.max.x=Math.max(component.max.x,x);
      component.max.y=Math.max(component.max.y,y);
      component.max.z=Math.max(component.max.z,z);
    }

    return Array.from(componentMap.values()).map(component=>{
      component.size=new THREE.Vector3().subVectors(component.max,component.min);
      component.center=new THREE.Vector3()
        .addVectors(component.min,component.max)
        .multiplyScalar(.5);
      return component;
    });
  }

  const uniforms={uWheelAngle:{value:0}};

  function attachWheelShader(mesh,selectedComponents,cacheKey,centerResolver=null){
    if(!selectedComponents.length) return 0;

    const geometry=mesh.geometry;
    const position=geometry.getAttribute("position");
    const wheelCenterAttribute=new Float32Array(position.count*3);
    const wheelWeightAttribute=new Float32Array(position.count);

    for(const component of selectedComponents){
      const rotationCenter=centerResolver
        ? centerResolver(component)
        : component.center;

      for(const vertexIndex of component.vertices){
        const base=vertexIndex*3;
        wheelCenterAttribute[base]=rotationCenter.x;
        wheelCenterAttribute[base+1]=rotationCenter.y;
        wheelCenterAttribute[base+2]=rotationCenter.z;
        wheelWeightAttribute[vertexIndex]=1;
      }
    }

    geometry.setAttribute(
      "aWheelCenter",
      new THREE.BufferAttribute(wheelCenterAttribute,3)
    );
    geometry.setAttribute(
      "aWheelWeight",
      new THREE.BufferAttribute(wheelWeightAttribute,1)
    );

    const materials=Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    for(const material of materials){
      const previousCompile=material.onBeforeCompile;

      material.onBeforeCompile=(shader,renderer)=>{
        if(previousCompile) previousCompile(shader,renderer);
        Object.assign(shader.uniforms,uniforms);

        shader.vertexShader=shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
attribute vec3 aWheelCenter;
attribute float aWheelWeight;
uniform float uWheelAngle;`
          )
          .replace(
            "#include <beginnormal_vertex>",
            `vec3 objectNormal = vec3( normal );

if(aWheelWeight>.5){
  float wheelNormalCos=cos(uWheelAngle);
  float wheelNormalSin=sin(uWheelAngle);
  objectNormal.yz=mat2(
    wheelNormalCos,-wheelNormalSin,
    wheelNormalSin, wheelNormalCos
  )*objectNormal.yz;
}

#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
  if(aWheelWeight>.5){
    float wheelTangentCos=cos(uWheelAngle);
    float wheelTangentSin=sin(uWheelAngle);
    objectTangent.yz=mat2(
      wheelTangentCos,-wheelTangentSin,
      wheelTangentSin, wheelTangentCos
    )*objectTangent.yz;
  }
#endif`
          )
          .replace(
            "#include <begin_vertex>",
            `vec3 transformed=vec3(position);

if(aWheelWeight>.5){
  vec3 wheelLocal=transformed-aWheelCenter;
  float wheelCos=cos(uWheelAngle);
  float wheelSin=sin(uWheelAngle);
  wheelLocal.yz=mat2(
    wheelCos,-wheelSin,
    wheelSin, wheelCos
  )*wheelLocal.yz;
  transformed=wheelLocal+aWheelCenter;
}`
          );

        mesh.userData.wheelShader=shader;
      };

      material.customProgramCacheKey=()=>cacheKey;
      material.needsUpdate=true;
    }

    return selectedComponents.length;
  }

  cloneMeshForWheelAnimation(tyreMesh);
  const tyreComponents=findConnectedComponents(tyreMesh.geometry);
  const selectedTyreComponents=tyreComponents.filter(component=>{
    const size=component.size;
    return (
      component.vertices.length>100 &&
      size.y>size.x*1.8 &&
      size.z>size.x*1.8 &&
      Math.abs(size.y-size.z)<Math.max(size.y,size.z)*.18
    );
  });

  attachWheelShader(
    tyreMesh,
    selectedTyreComponents,
    "street-car-tyres-complete-v7"
  );

  const wheelCenters=[];
  for(const component of selectedTyreComponents){
    const alreadyPresent=wheelCenters.some(center=>(
      Math.abs(center.x-component.center.x)<2 &&
      Math.abs(center.y-component.center.y)<2 &&
      Math.abs(center.z-component.center.z)<2
    ));

    if(!alreadyPresent) wheelCenters.push(component.center.clone());
  }

  const animatedRimMeshes=[];

  function nearestWheelCenter(component){
    let nearest=wheelCenters[0];
    let bestDistance=Infinity;

    for(const center of wheelCenters){
      const dx=component.center.x-center.x;
      const dy=component.center.y-center.y;
      const dz=component.center.z-center.z;
      const distance=dx*dx+dy*dy+dz*dz;

      if(distance<bestDistance){
        bestDistance=distance;
        nearest=center;
      }
    }

    return nearest || component.center;
  }

  for(const mesh of carMeshes){
    if(mesh===tyreMesh) continue;

    const meshName=(mesh.name || "").toLowerCase();
    const isWheelMetalMesh=
      meshName.includes("color_m08") ||
      meshName.includes("color_m03") ||
      meshName.includes("color_m02");

    if(!isWheelMetalMesh) continue;

    cloneMeshForWheelAnimation(mesh);
    const components=findConnectedComponents(mesh.geometry);

    const selectedRimComponents=components.filter(component=>{
      const size=component.size;
      const center=nearestWheelCenter(component);

      const dx=Math.abs(component.center.x-center.x);
      const dy=component.center.y-center.y;
      const dz=component.center.z-center.z;
      const radialDistance=Math.hypot(dy,dz);

      const belongsToWheelArea=
        dx<26 &&
        radialDistance<39;

      const mainCircularPart=
        size.y>18 &&
        size.z>18 &&
        Math.abs(size.y-size.z)<Math.max(size.y,size.z)*.38 &&
        size.x<32;

      const centralHub=
        radialDistance<10 &&
        size.y<18 &&
        size.z<18 &&
        size.x<18;

      const wheelFastener=
        radialDistance<16 &&
        size.y<7 &&
        size.z<7 &&
        size.x<8;

      return (
        component.vertices.length>20 &&
        belongsToWheelArea &&
        (mainCircularPart || centralHub || wheelFastener)
      );
    });

    const attached=attachWheelShader(
      mesh,
      selectedRimComponents,
      `street-car-wheel-metal-${mesh.name}-v9`,
      nearestWheelCenter
    );

    if(attached>0){
      animatedRimMeshes.push({
        mesh,
        componentCount:attached
      });
    }
  }

  if(wheelCenters.length!==4){
    console.warn("Centri ruota rilevati:",wheelCenters.length);
  }

  car.updateMatrixWorld(true);

  const radii=selectedTyreComponents
    .map(component=>(component.size.y+component.size.z)*.25)
    .sort((a,b)=>a-b);

  const localWheelRadius=radii.length
    ? radii[Math.floor(radii.length/2)]
    : 1;

  const worldScale=new THREE.Vector3();
  tyreMesh.getWorldScale(worldScale);

  const worldWheelRadius=Math.max(
    localWheelRadius*Math.abs(worldScale.z),
    .05
  );

  return {
    mesh:tyreMesh,
    rimMeshes:animatedRimMeshes,
    uniforms,
    angle:0,
    worldWheelRadius,
    previousWorldPosition:null,
    wasVisible:false,
    detectedWheelComponents:selectedTyreComponents,
    wheelCenters
  };
}

function loadStreetVehicles(){
  vehicleLoader.load(
    "./assets/models/car.glb",
    (gltf)=>{
      const source=gltf.scene;

      function createStreetCar({
        name,
        startX,
        z,
        direction,
        speed,
        color,
        targetHeight,
        phase=0
      }){
        const car=source.clone(true);
        car.name=name;
        ctx.prepareStaticGLB(car);
        ctx.setCarBodyColor(car,color);

        ctx.fitModelToHeight(car,targetHeight);
        ctx.centerModelXZ(car);
        ctx.putModelOnFloor(car,.06);

        // Cache a neutral-orientation body profile once.
        car.updateMatrixWorld(true);
        const collisionBox=new THREE.Box3().setFromObject(car);
        const collisionSize=collisionBox.getSize(new THREE.Vector3());
        const longSize=Math.max(collisionSize.x,collisionSize.z);
        const shortSize=Math.min(collisionSize.x,collisionSize.z);

        car.userData.collisionProfile={
          length:THREE.MathUtils.clamp(longSize*.96,2.4,6.8),
          width:THREE.MathUtils.clamp(shortSize*.90,1.15,3.0),
          longAxisX:collisionSize.x>=collisionSize.z
        };

        // Collision editor offsets are LOCAL to the car collider.
        // All cars share these settings so one calibration fixes the whole traffic system.
        if(!window.CAR_COLLISION_EDIT){
          window.CAR_COLLISION_EDIT={
      offsetForward:9.00,
      offsetRight:3.80,
      lengthScale:2.05,
      widthScale:1.85,
      heightScale:1.50,
      roundness:0.55,
      yawOffsetDeg:0
    };
        }

        car.position.set(startX,.06,z);
        car.rotation.y=direction>0 ? Math.PI/2 : -Math.PI/2;
        ctx.scene.add(car);

        const wheelAnimation=setupCarTyreAnimation(car);

        const initialProgress=THREE.MathUtils.clamp((startX+70)/140,0,1);
        ctx.STREET_ASSETS.cars.push(
          new Vehicle({
            root:car,
            direction,
            speed,
            progress:
              direction>0
                ? initialProgress*.62
                : 1-initialProgress*.62,
            wheelAnimation,
            phase,
            laneOffset:z<41 ? -3.5 : 3.5
          })
        );
      }

      createStreetCar({
        name:"car_red_right",
        startX:-64,
        z:36,
        direction:1,
        speed:10.5,
        color:0xb51f24,
        targetHeight:4.2525,
        phase:.2
      });


      createStreetCar({
        name:"car_white_right",
        startX:-128,
        z:36,
        direction:1,
        speed:10.5,
        color:0xe5e5e5,
        targetHeight:4.2550,
        phase:0
      });

      // Traffic density reduced by 20% overall.
      // Base 2 cars + third car in 40% of sessions = 2.4 average cars vs 3.
      if(Math.random()<0.40){
        createStreetCar({
          name:"car_dark_left",
          startX:128,
          z:46,
          direction:-1,
          speed:10.2,
          color:0x2f3338,
          targetHeight:4.2500,
          phase:4.8
        });
      }
    },
    undefined,
    (error)=>console.error("Errore caricando car.glb",error)
  );



}

export function updateVehicles(){
  if(!ctx.STREET_ASSETS.cars.length) return;

  const dt=Math.min(vehicleClock.getDelta(),.05);
  const now=performance.now()*.0032;

  const mainRoadLength=ctx.uRoadCurve.getLength();

  // Only 150m logical approach per side.
  // The visible world ends at 100m; cars are respawned exactly at that line.
  const extensionLength=450;
  const visibleSpawnDistance=100;

  const totalRoadLength=
    mainRoadLength+
    extensionLength*2;

  const mainStart=
    extensionLength/totalRoadLength;

  const mainSpan=
    mainRoadLength/totalRoadLength;

  const p0=ctx.uRoadCurve.getPointAt(0);
  const t0=ctx.uRoadCurve.getTangentAt(0).normalize();

  const p1=ctx.uRoadCurve.getPointAt(1);
  const t1=ctx.uRoadCurve.getTangentAt(1).normalize();

  const routeAtProgress=(progress)=>{
    const pNorm=
      THREE.MathUtils.euclideanModulo(progress,1);

    const distance=
      pNorm*totalRoadLength;

    if(distance<extensionLength){
      const local=
        distance-extensionLength;

      return {
        point:p0.clone().addScaledVector(t0,local),
        tangent:t0.clone(),
        region:"left_extension"
      };
    }

    if(distance<extensionLength+mainRoadLength){
      const d=
        distance-extensionLength;

      const t=
        THREE.MathUtils.clamp(
          d/mainRoadLength,
          0,
          1
        );

      return {
        point:ctx.uRoadCurve.getPointAt(t),
        tangent:
          ctx.uRoadCurve.getTangentAt(t).normalize(),
        region:"main"
      };
    }

    const local=
      distance-
      (extensionLength+mainRoadLength);

    return {
      point:p1.clone().addScaledVector(t1,local),
      tangent:t1.clone(),
      region:"right_extension"
    };
  };

  function routeProgressAtDistance(distance){
    return THREE.MathUtils.euclideanModulo(
      distance,
      totalRoadLength
    )/totalRoadLength;
  }

  function isSpawnProgressSafe(
    candidate,
    car,
    minGapMeters=24
  ){
    for(const other of ctx.STREET_ASSETS.cars){
      if(
        other===car ||
        !other.extendedRouteInitialized
      ) continue;

      if(
        Math.abs(
          other.laneOffset-car.laneOffset
        )>.6
      ) continue;

      let diff=
        Math.abs(other.progress-candidate);

      diff=Math.min(diff,1-diff);

      if(
        diff*totalRoadLength<
        minGapMeters
      ) return false;
    }

    return true;
  }

  function respawnAtVisibleLine(car){
    // Behind the veil does not exist anymore.
    // Cars start exactly from the visible 100m limit.
    const enteringFromLeft=
      car.direction>0;

    let distance;

    if(enteringFromLeft){
      distance=
        extensionLength-
        visibleSpawnDistance;
    }else{
      distance=
        extensionLength+
        mainRoadLength+
        visibleSpawnDistance;
    }

    let candidate=
      routeProgressAtDistance(distance);

    // If another car is too close, move this spawn slightly inward
    // in 8m increments, never behind the veil.
    const step=
      8/totalRoadLength;

    for(
      let tries=0;
      tries<8 &&
      !isSpawnProgressSafe(candidate,car,34);
      tries++
    ){
      candidate=
        THREE.MathUtils.euclideanModulo(
          candidate+
          car.direction*step,
          1
        );
    }

    car.progress=candidate;
  }

  for(const car of ctx.STREET_ASSETS.cars){
    if(!car.extendedRouteInitialized){
      // Keep initial cars on the existing main U.
      car.progress=
        mainStart+
        THREE.MathUtils.clamp(
          car.progress,
          0,
          1
        )*mainSpan;

      car.extendedRouteInitialized=true;
    }

    let targetSpeed=
      car.desiredSpeed ?? car.speed;

    // Enter curves a little more calmly.
    // Uses the previous smoothed curvature so braking is gradual rather than reactive.
    const curveAmount=
      THREE.MathUtils.clamp(
        Math.abs(car.smoothCurvature || 0)/.20,
        0,
        1
      );

    targetSpeed*=
      THREE.MathUtils.lerp(
        1.0,
        .88,
        curveAmount
      );

    let nearestGap=Infinity;
    let leaderSpeed=targetSpeed;
    let leader=null;

    for(const other of ctx.STREET_ASSETS.cars){
      if(other===car) continue;
      if(other.direction!==car.direction) continue;

      if(
        Math.abs(
          other.laneOffset-car.laneOffset
        )>.6
      ) continue;

      let gap=
        (other.progress-car.progress)*
        car.direction;

      if(gap<0) gap+=1;

      if(gap>0 && gap<nearestGap){
        nearestGap=gap;
        leaderSpeed=
          other.currentSpeed ??
          other.speed;
        leader=other;
      }
    }

    const gapMeters=
      nearestGap*
      totalRoadLength;

    // Slightly more generous following distance.
    // Cars begin slowing earlier and keep a larger visual gap.
    if(gapMeters<46){
      const factor=
        THREE.MathUtils.clamp(
          (gapMeters-22)/24,
          0,
          1
        );

      targetSpeed=
        Math.min(
          targetSpeed,
          THREE.MathUtils.lerp(
            Math.max(
              0,
              leaderSpeed*.55
            ),
            targetSpeed,
            factor
          )
        );
    }

    if(gapMeters<21.0){
      targetSpeed=0;
    }

    if(
      ctx.getPlayer()?.root &&
      ctx.getActiveWorldZone()==="outside"
    ){
      const carPos=car.root.position;
      const playerPos=ctx.getPlayer().root.position;

      const distanceToPlayer=
        Math.hypot(
          carPos.x-playerPos.x,
          carPos.z-playerPos.z
        );

      if(ctx.isPlayerOnCrosswalk()){
        if(distanceToPlayer<8.5){
          targetSpeed=0;
        }else if(distanceToPlayer<18){
          targetSpeed=
            Math.min(
              targetSpeed,
              4.5
            );
        }
      }else if(ctx.isPlayerNearRoad()){
        if(distanceToPlayer<8){
          targetSpeed=
            Math.min(
              targetSpeed,
              7.5
            );
        }else if(distanceToPlayer<14){
          targetSpeed=
            Math.min(
              targetSpeed,
              9.0
            );
        }
      }
    }

    const accel=
      targetSpeed<
      (car.currentSpeed??car.speed)
        ?7.2
        :2.2;

    car.currentSpeed=
      THREE.MathUtils.lerp(
        car.currentSpeed??car.speed,
        targetSpeed,
        Math.min(1,dt*accel)
      );

    let nextProgress=
      car.progress+
      car.direction*
      (car.currentSpeed/totalRoadLength)*
      dt;

    const wrapped=
      nextProgress>=1 ||
      nextProgress<0;

    nextProgress=
      THREE.MathUtils.euclideanModulo(
        nextProgress,
        1
      );

    if(
      leader &&
      nearestGap<Infinity
    ){
      const safeGap=
        20.0/totalRoadLength;

      let projectedGap=
        (leader.progress-nextProgress)*
        car.direction;

      if(projectedGap<0){
        projectedGap+=1;
      }

      if(projectedGap<safeGap){
        const safeProgress=
          THREE.MathUtils.euclideanModulo(
            leader.progress-
            car.direction*safeGap,
            1
          );

        // Only correct meaningful overlap. Tiny corrections every frame were
        // producing stop-line jitter when cars queued behind each other.
        const correction=
          Math.abs(projectedGap-safeGap);

        if(correction>0.00018){
          nextProgress=safeProgress;
        }

        car.currentSpeed=
          Math.min(
            car.currentSpeed,
            leaderSpeed
          );
      }
    }

    car.progress=nextProgress;

    if(wrapped){
      respawnAtVisibleLine(car);
    }

    const route=
      routeAtProgress(car.progress);

    const p=route.point;
    const tangent=route.tangent;

    const nx=-tangent.z;
    const nz=tangent.x;

    car.root.position.x=
      p.x+
      nx*car.laneOffset;

    car.root.position.z=
      p.z+
      nz*car.laneOffset;

    const targetYaw=
      Math.atan2(
        tangent.x,
        tangent.z
      )+
      (car.direction<0?Math.PI:0);

    let yawDelta=
      targetYaw-
      car.smoothYaw;

    yawDelta=
      Math.atan2(
        Math.sin(yawDelta),
        Math.cos(yawDelta)
      );

    // Softer, slower and frame-rate independent steering.
    // The car follows the road tangent progressively instead of snapping into the curve.
    const yawFollow=
      1-Math.exp(-dt*3.25);

    car.smoothYaw+=
      yawDelta*
      yawFollow;

    car.root.rotation.y=
      car.smoothYaw;

    let curvature=0;

    if(car.previousTangent){
      const previousAngle=Math.atan2(
        car.previousTangent.x,
        car.previousTangent.z
      );
      const currentAngle=Math.atan2(
        tangent.x,
        tangent.z
      );

      const angleDelta=Math.atan2(
        Math.sin(currentAngle-previousAngle),
        Math.cos(currentAngle-previousAngle)
      );

      // Do NOT divide by frame dt: that was amplifying tiny timing changes
      // into visible chassis shaking.
      curvature=THREE.MathUtils.clamp(
        angleDelta*4.25,
        -.20,
        .20
      );
    }

    car.previousTangent=tangent.clone();

    if(!Number.isFinite(car.smoothCurvature)){
      car.smoothCurvature=0;
    }

    car.smoothCurvature=
      THREE.MathUtils.lerp(
        car.smoothCurvature,
        curvature,
        1-Math.exp(-dt*2.8)
      );

    const targetRoll=
      -car.smoothCurvature*
      .014*
      (car.direction>0?1:-1);

    const targetPitch=0;

    car.smoothRoll=
      THREE.MathUtils.lerp(
        car.smoothRoll,
        targetRoll,
        1-Math.exp(-dt*2.6)
      );

    car.smoothPitch=
      THREE.MathUtils.lerp(
        car.smoothPitch,
        targetPitch,
        1-Math.exp(-dt*2.8)
      );

    car.root.rotation.z=
      car.smoothRoll;

    car.root.rotation.x=
      car.smoothPitch;

    car.root.visible=true;

    car.updateWheelRotation(dt);

    // Stable chassis height.
    car.keepStableHeight();
  }
}
