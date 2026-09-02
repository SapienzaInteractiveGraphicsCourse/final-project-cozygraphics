import {
  GARDEN_DESIGN_AXIS,
  GARDEN_PAVEMENT_PERIMETER,
  STATIC_GARDEN_PALM_LAYOUT,
  MUSEUM_CLOTH_WORLD_VALUES,
  MUSEUM_ART_WORLD_VALUES,
  MUSEUM_PANEL_WORLD_VALUES,
  MUSEUM_ALIGNMENT,
  GARDEN_WIDTH_COMPRESSION,
  MUSEUM_CLOTH_PAIR_EDIT,
  MUSEUM_CLOTH_EDIT,
  GARDEN_FEATURE_ASSETS
} from "../config/garden.config.js";


// ============================================================
// GARDEN RUNTIME STATE — owned by Garden.js
// UI and collision systems in main receive aliases to these same objects.
// ============================================================
export let CEREMONY_GARDEN=null;
export let GARDEN_ALIGNMENT=null;
export let FLOWER_EXHIBITS=null;
export let GARDEN_OUTER_GREEN=null;
export let GARDEN_CONCRETE_STYLE=null;
export let GARDEN_SIDE_GRASS_FILL=null;
export let GARDEN_SEAM_FIX=null;
export let GARDEN_MUSEUM=null;
export let MUSEUM_PURPLE_CLOTH=null;
export let GARDEN_FEATURES=null;
export let TELESCOPE_MODE=null;
export let NEW_TELESCOPE=null;
export let GARDEN_BOUNDARY_FENCE=null;
export let GARDEN_WIDTH_RUNTIME=null;
export let GARDEN_FLOWER_ZONE_FENCES=null;
export let GARDEN_FLOWER_FENCE_EDIT=null;
export let GARDEN_REAL_FLOWERS=null;
export let GARDEN_TREE_DECOR=null;
export let GARDEN_EXHIBITION_LAMPS=null;

let flatGardenTexturePlane=null;
export let gardenFenceSource=null;

// Single source of truth for every Garden grass surface.
export let GARDEN_GRASS_COLOR=0x6F756F;
export let GARDEN_GRASS_BRIGHTNESS=.97;
export const GARDEN_GRASS_PLANE_SIZE={width:360,depth:260};
export const GARDEN_GRASS_WORLD_DENSITY={
  repeatXPerMeter:21/760,
  repeatZPerMeter:90/3400
};
export let GARDEN_GRASS_TEXTURE_SIZE=.16;


export const GARDEN_GRASS_SEAM_OVERLAP=.02;

function makeUniformGardenGrassTexture(__gardenCtx,width,depth){
  const source=__gardenCtx.outdoorGrassTexture;
  if(!source) return null;

  const tex=source.clone();
  tex.wrapS=__gardenCtx.THREE.RepeatWrapping;
  tex.wrapT=__gardenCtx.THREE.RepeatWrapping;
  const textureSize=Math.max(.10,GARDEN_GRASS_TEXTURE_SIZE);
  tex.repeat.set(
    Math.max(
      .01,
      Math.abs(width)*GARDEN_GRASS_WORLD_DENSITY.repeatXPerMeter/textureSize
    ),
    Math.max(
      .01,
      Math.abs(depth)*GARDEN_GRASS_WORLD_DENSITY.repeatZPerMeter/textureSize
    )
  );
  tex.needsUpdate=true;
  tex.userData={...(tex.userData||{}),uniformGardenGrass:true};
  return tex;
}

function makeUniformGardenGrassMaterial(__gardenCtx,width,depth){
  const THREE=__gardenCtx.THREE;
  const color=new THREE.Color(GARDEN_GRASS_COLOR)
    .multiplyScalar(GARDEN_GRASS_BRIGHTNESS);

  const mat=new THREE.MeshBasicMaterial({
    map:makeUniformGardenGrassTexture(__gardenCtx,width,depth),
    color,
    side:THREE.DoubleSide,
    fog:false,
    toneMapped:false
  });

  mat.name="uniform_garden_grass_material";
  mat.userData.uniformGardenGrass=true;
  return mat;
}


export function setGardenGrassColor(__gardenCtx, value, brightness=GARDEN_GRASS_BRIGHTNESS){
  let hex;

  if(typeof value==="string"){
    const clean=value.trim().replace(/^#/,"");
    if(!/^[0-9a-fA-F]{6}$/.test(clean)){
      return GARDEN_GRASS_COLOR;
    }
    hex=parseInt(clean,16);
  }else{
    hex=Number(value);
  }

  if(!Number.isFinite(hex)) return GARDEN_GRASS_COLOR;

  GARDEN_GRASS_COLOR=
    Math.max(0,Math.min(0xffffff,hex|0));

  GARDEN_GRASS_BRIGHTNESS=
    Math.max(.10,Math.min(1.80,Number(brightness)||1));

  const outdoorGrassTexture=__gardenCtx.outdoorGrassTexture;
  const THREE=__gardenCtx.THREE;

  const applyToMaterial=material=>{
    if(!material) return;

    const mats=
      Array.isArray(material)
        ? material
        : [material];

    for(const mat of mats){
      if(!mat) continue;

      if(outdoorGrassTexture && !mat.map){
        mat.map=outdoorGrassTexture;
      }

      if(mat.color){
        const c=new THREE.Color(GARDEN_GRASS_COLOR);
        c.multiplyScalar(GARDEN_GRASS_BRIGHTNESS);
        mat.color.copy(c);
      }

      if(mat.emissive){
        mat.emissive.setHex(0x000000);
      }

      if("emissiveIntensity" in mat){
        mat.emissiveIntensity=0;
      }

      mat.needsUpdate=true;
    }
  };

  if(flatGardenTexturePlane){
    applyToMaterial(flatGardenTexturePlane.material);
  }

  GARDEN_SIDE_GRASS_FILL?.group?.traverse?.(obj=>{
    if(obj?.isMesh) applyToMaterial(obj.material);
  });
  __gardenCtx.scene?.traverse?.(obj=>{
    if(!obj?.isMesh || !obj.material) return;
    for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])){
      const samePng=!!outdoorGrassTexture?.image && mat?.map?.image===outdoorGrassTexture.image;
      if(samePng || mat?.userData?.uniformGardenGrass) applyToMaterial(mat);
    }
  });

  return GARDEN_GRASS_COLOR;
}

export function setGardenGrassBrightness(__gardenCtx, brightness){
  return setGardenGrassColor(
    __gardenCtx,
    GARDEN_GRASS_COLOR,
    brightness
  );
}

export function getGardenGrassBrightness(){
  return GARDEN_GRASS_BRIGHTNESS;
}

export function getGardenGrassColorHex(){
  return `#${GARDEN_GRASS_COLOR
    .toString(16)
    .padStart(6,"0")
    .toUpperCase()}`;
}


export const GARDEN_FRONT_CONCRETE_STRIP={
  mesh:null,
  x:0.50,
  y:.060,
  z:59.80,
  width:84.30,
  depth:3.10,
  tileSize:5.00,
  rotationY:0
};

export function rebuildGardenFrontConcreteStrip(ctx){
  const {THREE,scene,unifiedSidewalkMat}=ctx;
  if(GARDEN_FRONT_CONCRETE_STRIP.mesh){
    const old=GARDEN_FRONT_CONCRETE_STRIP.mesh;
    old.parent?.remove(old);
    old.geometry?.dispose?.();
  }
  const width=Math.max(.10,GARDEN_FRONT_CONCRETE_STRIP.width);
  const depth=Math.max(.10,GARDEN_FRONT_CONCRETE_STRIP.depth);
  const geometry=new THREE.PlaneGeometry(width,depth);
  const pos=geometry.attributes.position;
  const uv=new Float32Array(pos.count*2);
  const tile=GARDEN_FRONT_CONCRETE_STRIP.tileSize;
  for(let i=0;i<pos.count;i++){
    uv[i*2]=(pos.getX(i)+width*.5)/tile;
    uv[i*2+1]=(pos.getY(i)+depth*.5)/tile;
  }
  geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  const mesh=new THREE.Mesh(geometry,unifiedSidewalkMat);
  mesh.name="garden_front_editable_concrete_strip";
  mesh.rotation.x=-Math.PI/2;
  mesh.rotation.z=THREE.MathUtils.degToRad(GARDEN_FRONT_CONCRETE_STRIP.rotationY);
  mesh.position.set(
    GARDEN_FRONT_CONCRETE_STRIP.x,
    GARDEN_FRONT_CONCRETE_STRIP.y,
    GARDEN_FRONT_CONCRETE_STRIP.z
  );
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  mesh.renderOrder=13;
  scene.add(mesh);
  GARDEN_FRONT_CONCRETE_STRIP.mesh=mesh;
  return mesh;
}

export function initGardenRuntimeState(THREE,scene){
  CEREMONY_GARDEN={
  group:new THREE.Group(),
  path:null,
  connector:null,
  branchPaths:[],
  pathBorders:[],
  plaza:null,
  plazaBorders:[],
  beds:[],
  plantGroups:[],
  pathData:{
    
    x:0.00,
    z:88.00,
    width:7.50,
    depth:62.00,
    yaw:0
  },
  plazaData:{
    x:0.00,
    z:126.00,
    width:30.00,
    depth:26.00,
    roundness:4.00,
    yaw:0
  },
  plazaCenter:new THREE.Vector3(0,.035,126.00),
  plazaRadius:18.0,
  viewActive:false,
  viewFrom:new THREE.Vector3(),
  viewTo:new THREE.Vector3(),
  viewStart:0,
  viewDuration:0
};
  GARDEN_ALIGNMENT={
  appliedAxisX:0
};
  FLOWER_EXHIBITS={
  roses:null,
  tulips:null
};
  GARDEN_OUTER_GREEN={
  left:null,
  right:null,
  back:null
};
  GARDEN_CONCRETE_STYLE={
  color:0xDEDDDA,
  material:null
};
  GARDEN_SIDE_GRASS_FILL={
  group:new THREE.Group()
};
  GARDEN_SEAM_FIX={
  group:new THREE.Group(),
  childPatchDone:false
};
  GARDEN_MUSEUM={
  group:new THREE.Group(),
  displayMaster:null,
  exhibits:[],
  editable:new Map()
};
  MUSEUM_PURPLE_CLOTH={
  material:new THREE.MeshStandardMaterial({
    color:0x241033,
    roughness:.90,
    metalness:0,
    side:THREE.DoubleSide
  })
};
  GARDEN_FEATURES={
  stone:null,
  stoneExhibitPanel:null,
  fountain:null,
  water:[],
  
  waterDefs:[
    {x:.600,y:1.670,z:113.194,inner:.500,outer:2.950,opacity:.600,wind:.024},
    {x:.600,y:3.735,z:113.194,inner:.300,outer:1.540,opacity:.580,wind:.008}
  ]
};
  TELESCOPE_MODE={
  root:null,
  active:false
};
  NEW_TELESCOPE={
  root:null,
  model:null,
  label:null,
  tripod:null,
  moveStep:.10,
  rotStep:1.0,
  scaleStep:.025,
  legHeight:3.300
};
  GARDEN_BOUNDARY_FENCE={
  group:null,
  offset:149.0,
  height:3.0,
  inward:.08,
    edit:{
    left:{x:-1.70,z:1.30,length:0.00},
    right:{x:1.70,z:1.30,length:0.00},
    back:{x:2.00,z:3.50,length:-0.30}
  }
};
  GARDEN_WIDTH_RUNTIME={
  roseLeftX:-23.100,
  roseRightX:23.700
};
  GARDEN_FLOWER_ZONE_FENCES={
  group:new THREE.Group(),
  height:1.52,
  postSize:.18,
  railThickness:.105,
  railY:[.40,.86,1.30],
  material:new THREE.MeshStandardMaterial({
    color:0x6a4529,
    roughness:.94,
    metalness:0
  }),
  postMaterial:new THREE.MeshStandardMaterial({
    color:0x4a3020,
    roughness:.96,
    metalness:0
  }),
  capMaterial:new THREE.MeshStandardMaterial({
    color:0x5b3b25,
    roughness:.94,
    metalness:0
  }),
  meshes:{tulips:{},roses:{}}
};
  GARDEN_FLOWER_FENCE_EDIT={
  tulips:{
    front:{x:-26.000,z:76.6890,length:12.0000},
    back:{x:0.20,z:2.50,length:3.00},
    left:{x:-1.40,z:2.60,length:0.00},
    right:{x:1.70,z:2.70,length:0.00}
  },
  roses:{
    front:{x:26.000,z:76.6890,length:12.0000},
    back:{x:26.000,z:88.1890,length:12.0000},
    left:{x:20.0000,z:82.4390,length:11.5000},
    right:{x:32.0000,z:82.4390,length:11.5000}
  }
};
  GARDEN_REAL_FLOWERS={
  group:new THREE.Group(),
  roseVariants:[]
};
  GARDEN_TREE_DECOR={
  group:new THREE.Group(),
  source:null,
  collisionTrees:[],
  treeCollisionInstances:[],
  instanceCount:0
};
  GARDEN_EXHIBITION_LAMPS={
  lamps:[null,null],
  step:.10
};

  GARDEN_SIDE_GRASS_FILL.group.name="garden_side_grass_fill";
  scene.add(GARDEN_SIDE_GRASS_FILL.group);

  GARDEN_SEAM_FIX.group.name="garden_seam_fixes";
  scene.add(GARDEN_SEAM_FIX.group);

  GARDEN_MUSEUM.group.name="garden_museum_display_cases";
  scene.add(GARDEN_MUSEUM.group);

  GARDEN_FLOWER_ZONE_FENCES.group.name="garden_flower_zone_fences";
  scene.add(GARDEN_FLOWER_ZONE_FENCES.group);

  GARDEN_REAL_FLOWERS.group.name="garden_real_flower_fields";
  scene.add(GARDEN_REAL_FLOWERS.group);

  GARDEN_TREE_DECOR.group.name="garden_fence_tree_backdrop";
  scene.add(GARDEN_TREE_DECOR.group);
return {
    GARDEN_FRONT_CONCRETE_STRIP,
    CEREMONY_GARDEN,
    GARDEN_ALIGNMENT,
    FLOWER_EXHIBITS,
    GARDEN_OUTER_GREEN,
    GARDEN_CONCRETE_STYLE,
    GARDEN_SIDE_GRASS_FILL,
    GARDEN_SEAM_FIX,
    GARDEN_MUSEUM,
    MUSEUM_PURPLE_CLOTH,
    GARDEN_FEATURES,
    TELESCOPE_MODE,
    NEW_TELESCOPE,
    GARDEN_BOUNDARY_FENCE,
    GARDEN_WIDTH_RUNTIME,
    GARDEN_FLOWER_ZONE_FENCES,
    GARDEN_FLOWER_FENCE_EDIT,
    GARDEN_REAL_FLOWERS,
    GARDEN_TREE_DECOR,
    GARDEN_EXHIBITION_LAMPS,
    gardenFenceSource
  };
}


export function initGardenFenceSource(createProceduralFenceSource){
  gardenFenceSource=createProceduralFenceSource();
  gardenFenceSource.name="garden_fence_source";
  gardenFenceSource.updateMatrixWorld(true);
  return gardenFenceSource;
}

// src/world/Garden.js
// Conservative Garden extraction (~2k lines).
// Only Garden creation/build helpers are here.
// All state, boot order, shared loaders and collisions remain in main.html.
//
// Functions receive a fresh main-context object at CALL TIME.
// No late Garden module initialization, no duplicated shared state.

export function getGardenEntranceAxisX(__gardenCtx){
  const GARDEN_ALIGNMENT=__gardenCtx.GARDEN_ALIGNMENT;
  const TASK_BOUNDARY=__gardenCtx.TASK_BOUNDARY;

  
  if(TASK_BOUNDARY?.gate && Number.isFinite(TASK_BOUNDARY.gate.position.x)){
    return TASK_BOUNDARY.gate.position.x;
  }
  return GARDEN_ALIGNMENT.appliedAxisX;

}

export function translateGardenContentX(__gardenCtx, delta){
  const CEREMONY_GARDEN=__gardenCtx.CEREMONY_GARDEN;
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const GARDEN_REAL_FLOWERS=__gardenCtx.GARDEN_REAL_FLOWERS;
  const GARDEN_TREE_DECOR=__gardenCtx.GARDEN_TREE_DECOR;
  const TELESCOPE_MODE=__gardenCtx.TELESCOPE_MODE;

  if(Math.abs(delta)<.000001) return;

  CEREMONY_GARDEN.group.position.x+=delta;
  CEREMONY_GARDEN.group.updateMatrixWorld(true);

  const independent=[
    FLOWER_EXHIBITS?.roses,
    FLOWER_EXHIBITS?.tulips,
    GARDEN_FEATURES?.fountain,
    GARDEN_FEATURES?.stone,
    GARDEN_FEATURES?.stoneExhibitPanel,
    TELESCOPE_MODE?.root
  ];

  for(const obj of independent){
    if(!obj) continue;
    obj.position.x+=delta;
    obj.updateMatrixWorld(true);
  }

  for(const def of GARDEN_FEATURES?.waterDefs || []){
    def.x+=delta;
  }
  for(const water of GARDEN_FEATURES?.water || []){
    water.position.x+=delta;
    water.updateMatrixWorld(true);
  }

  if(GARDEN_TREE_DECOR?.group){
    GARDEN_TREE_DECOR.group.position.x+=delta;
    GARDEN_TREE_DECOR.group.updateMatrixWorld(true);
  }

  if(typeof GARDEN_REAL_FLOWERS!=="undefined" && GARDEN_REAL_FLOWERS?.group){
    GARDEN_REAL_FLOWERS.group.position.x+=delta;
    GARDEN_REAL_FLOWERS.group.updateMatrixWorld(true);
  }

  CEREMONY_GARDEN.pathData.x+=delta;
  CEREMONY_GARDEN.plazaData.x+=delta;
  CEREMONY_GARDEN.plazaCenter.x+=delta;

}

export function syncGardenCenterAxis(__gardenCtx){
  const GARDEN_ALIGNMENT=__gardenCtx.GARDEN_ALIGNMENT;
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  const targetAxis=getGardenEntranceAxisX(__gardenCtx);
  const delta=targetAxis-GARDEN_ALIGNMENT.appliedAxisX;

  translateGardenContentX(__gardenCtx,delta);

  GARDEN_ALIGNMENT.appliedAxisX=targetAxis;
  GARDEN_DESIGN_AXIS.x=targetAxis;

  if(GARDEN_FEATURES?.fountain){
    GARDEN_FEATURES.fountain.position.x=targetAxis;
    GARDEN_FEATURES.fountain.updateMatrixWorld(true);
  }

  for(const def of GARDEN_FEATURES?.waterDefs || []){
    def.x=targetAxis;
  }
  for(const water of GARDEN_FEATURES?.water || []){
    water.position.x=targetAxis;
    water.updateMatrixWorld(true);
  }

  refreshGardenObjectCollisions();


}

export function makeGardenExhibitSign(__gardenCtx, kind,label,subtitle,x,z){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const THREE=__gardenCtx.THREE;
  const scene=__gardenCtx.scene;

  const group=new THREE.Group();
  group.name=`garden_${kind}_sign`;

  const woodMat=new THREE.MeshStandardMaterial({
    color:0x44352b,
    roughness:.88,
    metalness:.02
  });
  const boardMat=new THREE.MeshStandardMaterial({
    color:0x5d1830,
    roughness:.82,
    metalness:.03
  });

  const board=new THREE.Mesh(
    new THREE.BoxGeometry(4.2,1.30,.16),
    boardMat
  );
  board.name="board";
  board.position.set(0,2.05,0);
  group.add(board);

  const postL=new THREE.Mesh(
    new THREE.BoxGeometry(.16,2.15,.16),
    woodMat
  );
  postL.name="post_left";
  postL.position.set(-1.50,1.05,.05);
  group.add(postL);

  const postR=postL.clone();
  postR.name="post_right";
  postR.position.x=1.50;
  group.add(postR);

  const canvas=document.createElement("canvas");
  canvas.width=1024;
  canvas.height=330;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#5d1830";
  ctx.fillRect(0,0,1024,330);
  ctx.strokeStyle="#e0adbb";
  ctx.lineWidth=14;
  ctx.strokeRect(14,14,996,302);
  ctx.textAlign="center";
  ctx.fillStyle="#fff8ed";
  ctx.font="bold 72px Georgia";
  ctx.fillText(label,512,138);
  ctx.font="30px Arial";
  ctx.fillStyle="#e8dfcf";
  ctx.fillText(subtitle,512,218);

  const tex=new THREE.CanvasTexture(canvas);
  tex.generateMipmaps=false;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.colorSpace=THREE.SRGBColorSpace;

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(3.88,1.06),
    new THREE.MeshBasicMaterial({
      map:tex,
      side:THREE.DoubleSide,
      transparent:false
    })
  );
  face.name="face";
  face.position.set(0,2.05,.086);
  group.add(face);

  group.position.set(x,.02,z);
  group.rotation.y=0;
  scene.add(group);

  FLOWER_EXHIBITS[kind]=group;
  return group;

}

export function applyApprovedRoseSignPlacement(__gardenCtx){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const THREE=__gardenCtx.THREE;

  const right=FLOWER_EXHIBITS?.roses;
  if(right){
    right.position.set(21.600,-.180,79.800);
    right.rotation.set(
      0,
      THREE.MathUtils.degToRad(-90),
      0
    );
    right.scale.set(.88,.88,.88);
    right.updateMatrixWorld(true);
  }

  // Exact LEFT ROSE SIGN values requested.
  const left=FLOWER_EXHIBITS?.tulips;
  if(left){
    left.position.set(-20.240,-0.380,79.500);
    left.rotation.set(
      0,
      THREE.MathUtils.degToRad(90),
      0
    );
    left.scale.set(.756,.756,.756);
    left.updateMatrixWorld(true);
  }

}

export function removeRightRoseSignOnly(__gardenCtx){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;

  const right=FLOWER_EXHIBITS?.roses;
  if(right){
    right.visible=false;
    right.traverse?.(o=>{
      o.visible=false;
      if(o.isMesh) o.userData.noCollision=true;
    });
  }

}

// applyGardenConcreteColor stays in main.html (UI/panel ownership).

// initGardenConcreteColorEditor stays in main.html (UI/panel ownership).

export function buildGardenSideGrassFill(__gardenCtx){
  const GARDEN_SIDE_GRASS_FILL=__gardenCtx.GARDEN_SIDE_GRASS_FILL;
  const THREE=__gardenCtx.THREE;

  GARDEN_SIDE_GRASS_FILL.group.clear();

  const oldLeft=-47.500;
  const oldRight=53.500;
  const newLeft=-42.450;
  const newRight=48.450;
  const zMin=GARDEN_PAVEMENT_PERIMETER.zMin;
  const zMax=GARDEN_PAVEMENT_PERIMETER.zMax;
  const depth=zMax-zMin;
  const centerZ=(zMin+zMax)*.5;

  const leftW=newLeft-oldLeft;
  const rightW=oldRight-newRight;

  if(leftW>.001){
    const mesh=new THREE.Mesh(
      new THREE.PlaneGeometry(
        leftW+GARDEN_GRASS_SEAM_OVERLAP*2,
        depth+GARDEN_GRASS_SEAM_OVERLAP*2
      ),
      makeUniformGardenGrassMaterial(
        __gardenCtx,
        leftW+GARDEN_GRASS_SEAM_OVERLAP*2,
        depth+GARDEN_GRASS_SEAM_OVERLAP*2
      )
    );
    mesh.name="garden_grass_fill_left";
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set((oldLeft+newLeft)*.5,.018,centerZ);
    mesh.receiveShadow=true;
    mesh.castShadow=false;
    GARDEN_SIDE_GRASS_FILL.group.add(mesh);
  }

  if(rightW>.001){
    const mesh=new THREE.Mesh(
      new THREE.PlaneGeometry(
        rightW+GARDEN_GRASS_SEAM_OVERLAP*2,
        depth+GARDEN_GRASS_SEAM_OVERLAP*2
      ),
      makeUniformGardenGrassMaterial(
        __gardenCtx,
        rightW+GARDEN_GRASS_SEAM_OVERLAP*2,
        depth+GARDEN_GRASS_SEAM_OVERLAP*2
      )
    );
    mesh.name="garden_grass_fill_right";
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set((newRight+oldRight)*.5,.018,centerZ);
    mesh.receiveShadow=true;
    mesh.castShadow=false;
    GARDEN_SIDE_GRASS_FILL.group.add(mesh);
  }
}

export function rebuildGardenConcreteSkeletonFromPerimeter(__gardenCtx){
  const CEREMONY_GARDEN=__gardenCtx.CEREMONY_GARDEN;
  const GARDEN_CONCRETE_STYLE=__gardenCtx.GARDEN_CONCRETE_STYLE;
  const THREE=__gardenCtx.THREE;
  const mergeGeometries=__gardenCtx.mergeGeometries;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const unifiedSidewalkMat=__gardenCtx.unifiedSidewalkMat;

  const old=CEREMONY_GARDEN.group.getObjectByName(
    "garden_merged_concrete_skeleton_two_holes"
  );

  if(old){
    CEREMONY_GARDEN.group.remove(old);
    old.geometry?.dispose?.();
  }

  const concreteMatGarden=unifiedSidewalkMat.clone();
  concreteMatGarden.name="garden_perimeter_editor_concrete";
  concreteMatGarden.side=THREE.DoubleSide;
  concreteMatGarden.roughness=.90;
  concreteMatGarden.metalness=0;
  GARDEN_CONCRETE_STYLE.material=concreteMatGarden;
  concreteMatGarden.color.setHex(GARDEN_CONCRETE_STYLE.color);
  concreteMatGarden.polygonOffset=true;
  concreteMatGarden.polygonOffsetFactor=-1;
  concreteMatGarden.polygonOffsetUnits=-1;
  GARDEN_CONCRETE_STYLE.material=concreteMatGarden;
  concreteMatGarden.color.setHex(GARDEN_CONCRETE_STYLE.color);

  function addWorldUV(geo,tile=4){
    const p=geo.attributes.position;
    const uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){
      uv[i*2]=p.getX(i)/tile;
      uv[i*2+1]=p.getZ(i)/tile;
    }
    geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  }

  function makeRect(cx,cz,w,d){
    const geo=new THREE.PlaneGeometry(w,d,1,1);
    geo.rotateX(-Math.PI/2);
    geo.translate(cx,0,cz);
    addWorldUV(geo,4);
    return geo;
  }

  const xMin=GARDEN_PAVEMENT_PERIMETER.xMin;
  const xMax=GARDEN_PAVEMENT_PERIMETER.xMax;
  const zMin=GARDEN_PAVEMENT_PERIMETER.zMin;
  const zMax=GARDEN_PAVEMENT_PERIMETER.zMax;

  const lawnWidth=12.0000; // much smaller rose bed, same rose count
  const lawnDepth=11.5000; // much shallower rose bed, same rose count
  const lawnZ=82.4390;     // front edge stays near the original entrance side
  const lawnOffsetX=26.0;

  // Flower zones are front-anchored:
  // front edge stays at Z=81.1312, only the back edge is shortened.

  const holeZMin=lawnZ-lawnDepth*.5;
  const holeZMax=lawnZ+lawnDepth*.5;

  const leftHoleXMin=-lawnOffsetX-lawnWidth*.5;
  const leftHoleXMax=-lawnOffsetX+lawnWidth*.5;

  const rightHoleXMin=lawnOffsetX-lawnWidth*.5;
  const rightHoleXMax=lawnOffsetX+lawnWidth*.5;

  const safeXMin=Math.min(xMin,leftHoleXMin-1.0);
  const safeXMax=Math.max(xMax,rightHoleXMax+1.0);
  const safeZMax=Math.max(zMax,holeZMax+1.0);

  const pieces=[];

  pieces.push(
    makeRect(
      (safeXMin+safeXMax)*.5,
      (zMin+holeZMin)*.5,
      safeXMax-safeXMin,
      Math.max(.1,holeZMin-zMin)
    )
  );

  pieces.push(
    makeRect(
      (safeXMin+safeXMax)*.5,
      (holeZMax+safeZMax)*.5,
      safeXMax-safeXMin,
      Math.max(.1,safeZMax-holeZMax)
    )
  );

  pieces.push(
    makeRect(
      (safeXMin+leftHoleXMin)*.5,
      lawnZ,
      Math.max(.1,leftHoleXMin-safeXMin),
      lawnDepth
    )
  );

  pieces.push(
    makeRect(
      (leftHoleXMax+rightHoleXMin)*.5,
      lawnZ,
      rightHoleXMin-leftHoleXMax,
      lawnDepth
    )
  );

  pieces.push(
    makeRect(
      (rightHoleXMax+safeXMax)*.5,
      lawnZ,
      Math.max(.1,safeXMax-rightHoleXMax),
      lawnDepth
    )
  );

  const geo=mergeGeometries(pieces,false);
  pieces.forEach(g=>g.dispose?.());

  if(!geo){
    return;
  }

  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  const mesh=new THREE.Mesh(
    geo,
    concreteMatGarden
  );

  mesh.name="garden_merged_concrete_skeleton_two_holes";
  mesh.position.set(0,.085,0);
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  mesh.renderOrder=12;

  CEREMONY_GARDEN.group.add(mesh);

  CEREMONY_GARDEN.path=mesh;
  CEREMONY_GARDEN.plaza=mesh;
  CEREMONY_GARDEN.branchPaths=[
    mesh
  ];

  applyGardenConcreteColor(__gardenCtx);
  refreshGardenObjectCollisions();
  refreshGardenPerimeterEditor(__gardenCtx);

}

// refreshGardenPerimeterEditor stays in main.html (UI/panel ownership).

// initGardenPerimeterEditor stays in main.html (UI/panel ownership).

export function buildCeremonyGarden(__gardenCtx){
  const CEREMONY_GARDEN=__gardenCtx.CEREMONY_GARDEN;
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const GARDEN_CONCRETE_STYLE=__gardenCtx.GARDEN_CONCRETE_STYLE;
  const GARDEN_OUTER_GREEN=__gardenCtx.GARDEN_OUTER_GREEN;
  const THREE=__gardenCtx.THREE;
  const centerOriginalRoseFencesInsideBeds=__gardenCtx.centerOriginalRoseFencesInsideBeds;
  const lcBuildGardenFlowerZoneFences=__gardenCtx.lcBuildGardenFlowerZoneFences;
  const mergeGeometries=__gardenCtx.mergeGeometries;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const unifiedSidewalkMat=__gardenCtx.unifiedSidewalkMat;

  CEREMONY_GARDEN.group.clear();
  CEREMONY_GARDEN.path=null;
  CEREMONY_GARDEN.connector=null;
  CEREMONY_GARDEN.branchPaths=[];
  CEREMONY_GARDEN.pathBorders=[];
  CEREMONY_GARDEN.plaza=null;
  CEREMONY_GARDEN.plazaBorders=[];
  CEREMONY_GARDEN.beds=[];
  CEREMONY_GARDEN.plantGroups=[];

  GARDEN_OUTER_GREEN.left=null;
  GARDEN_OUTER_GREEN.right=null;
  GARDEN_OUTER_GREEN.back=null;

  for(const key of ["roses","tulips"]){
    const old=FLOWER_EXHIBITS[key];
    if(old?.parent) old.parent.remove(old);
    FLOWER_EXHIBITS[key]=null;
  }

  const AXIS=0;

  const concreteMatGarden=unifiedSidewalkMat.clone();
  concreteMatGarden.name="garden_single_concrete_with_true_holes";
  concreteMatGarden.side=THREE.DoubleSide;
  concreteMatGarden.roughness=.90;
  concreteMatGarden.metalness=0;
  concreteMatGarden.polygonOffset=true;
  concreteMatGarden.polygonOffsetFactor=-1;
  concreteMatGarden.polygonOffsetUnits=-1;
  GARDEN_CONCRETE_STYLE.material=concreteMatGarden;
  concreteMatGarden.color.setHex(GARDEN_CONCRETE_STYLE.color);




  function addWorldUV(geo,tile=4){
    const p=geo.attributes.position;
    const uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){
      uv[i*2]=p.getX(i)/tile;
      uv[i*2+1]=p.getZ(i)/tile;
    }
    geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  }

  function makeConcreteRectGeometry(cx,cz,w,d){
    const geo=new THREE.PlaneGeometry(w,d,1,1);
    geo.rotateX(-Math.PI/2);
    geo.translate(cx,0,cz);
    addWorldUV(geo,4);
    return geo;
  }

  const xMin=GARDEN_PAVEMENT_PERIMETER.xMin;
  const xMax=GARDEN_PAVEMENT_PERIMETER.xMax;
  const zMin=GARDEN_PAVEMENT_PERIMETER.zMin;
  const zMax=GARDEN_PAVEMENT_PERIMETER.zMax;

  const lawnWidth=12.0000; // much smaller rose bed, same rose count
  const lawnDepth=11.5000; // much shallower rose bed, same rose count
  const lawnZ=82.4390;     // front edge stays near the original entrance side
  const lawnOffsetX=26.0;

  const holeZMin=lawnZ-lawnDepth*.5;   
  const holeZMax=lawnZ+lawnDepth*.5;   

  const leftHoleXMin=-lawnOffsetX-lawnWidth*.5; 
  const leftHoleXMax=-lawnOffsetX+lawnWidth*.5; 

  const rightHoleXMin=lawnOffsetX-lawnWidth*.5; 
  const rightHoleXMax=lawnOffsetX+lawnWidth*.5; 

  const pieces=[];

  pieces.push(
    makeConcreteRectGeometry(
      (xMin+xMax)*.5,
      (zMin+holeZMin)*.5,
      xMax-xMin,
      holeZMin-zMin
    )
  );

  pieces.push(
    makeConcreteRectGeometry(
      (xMin+xMax)*.5,
      (holeZMax+zMax)*.5,
      xMax-xMin,
      zMax-holeZMax
    )
  );

  pieces.push(
    makeConcreteRectGeometry(
      (xMin+leftHoleXMin)*.5,
      lawnZ,
      leftHoleXMin-xMin,
      lawnDepth
    )
  );

  pieces.push(
    makeConcreteRectGeometry(
      (leftHoleXMax+rightHoleXMin)*.5,
      lawnZ,
      rightHoleXMin-leftHoleXMax,
      lawnDepth
    )
  );

  pieces.push(
    makeConcreteRectGeometry(
      (rightHoleXMax+xMax)*.5,
      lawnZ,
      xMax-rightHoleXMax,
      lawnDepth
    )
  );

  const pavementGeo=mergeGeometries(pieces,false);

  for(const g of pieces){
    g.dispose?.();
  }

  if(!pavementGeo){
    throw new Error("Garden concrete merge failed");
  }

  pavementGeo.computeBoundingBox();
  pavementGeo.computeBoundingSphere();

  const pavement=new THREE.Mesh(
    pavementGeo,
    concreteMatGarden
  );

  pavement.name="garden_merged_concrete_skeleton_two_holes";
  pavement.position.set(AXIS,.085,0);
  pavement.castShadow=false;
  pavement.receiveShadow=true;
  pavement.frustumCulled=true;
  pavement.renderOrder=12;

  CEREMONY_GARDEN.group.add(pavement);

  CEREMONY_GARDEN.path=pavement;
  CEREMONY_GARDEN.plaza=pavement;
  CEREMONY_GARDEN.branchPaths.push(pavement);


  // Real GLB flower fields replace the procedural flower populations.

  {
    const sign=makeGardenExhibitSign(__gardenCtx,
      "tulips",
      "ROSES",
      "Night Rose Garden",
      -16.900,
      79.144
    );

    sign.position.y=.020;
    sign.rotation.set(
      0,
      THREE.MathUtils.degToRad(90),
      0
    );
    sign.scale.set(1,1,1);

    const board=sign.getObjectByName("board");
    if(board){
      board.position.set(0,2.050,.100);
    }

    const face=sign.getObjectByName("face");
    if(face){
      face.position.set(0,2.050,.186);
    }

    const postRight=sign.getObjectByName("post_right");
    if(postRight){
      postRight.position.set(1.500,1.050,.050);
    }

    sign.updateMatrixWorld(true);
  }

  {
    const sign=makeGardenExhibitSign(__gardenCtx,
      "roses",
      "ROSES",
      "Night Rose Garden",
      18.000,
      80.504
    );

    sign.position.y=-.180;
    sign.rotation.set(
      THREE.MathUtils.degToRad(2.0),
      THREE.MathUtils.degToRad(-90),
      0
    );
    sign.scale.set(1,1,1);

    const board=sign.getObjectByName("board");
    if(board){
      board.position.set(0,2.050,0);
    }

    const postLeft=sign.getObjectByName("post_left");
    if(postLeft){
      postLeft.position.set(-1.500,1.050,-.050);
    }

    const postRight=sign.getObjectByName("post_right");
    if(postRight){
      postRight.position.set(1.600,1.050,-.050);
    }

    sign.updateMatrixWorld(true);
  }

  CEREMONY_GARDEN.pathData.x=AXIS;
  CEREMONY_GARDEN.pathData.z=(zMin+zMax)*.5;
  CEREMONY_GARDEN.pathData.width=xMax-xMin;
  CEREMONY_GARDEN.pathData.depth=zMax-zMin;
  CEREMONY_GARDEN.pathData.yaw=0;

  CEREMONY_GARDEN.plazaData.x=AXIS;
  CEREMONY_GARDEN.plazaData.z=113.194;
  CEREMONY_GARDEN.plazaCenter.set(AXIS,.035,113.194);
  CEREMONY_GARDEN.plazaRadius=16;

  CEREMONY_GARDEN.group.traverse(o=>{
    if(o?.isMesh){
      o.castShadow=false;
      o.frustumCulled=true;
    }
  });

  applyApprovedRoseSignPlacement(__gardenCtx);
  removeRightRoseSignOnly(__gardenCtx);
  buildGardenFlowerZoneFences(__gardenCtx);
  centerOriginalRoseFencesInsideBeds();
  lcBuildGardenFlowerZoneFences();
  refreshGardenObjectCollisions();


}

export function prepareMuseumRoot(__gardenCtx, root){

  root.traverse(o=>{
    if(!o?.isMesh) return;
    o.castShadow=false;
    o.receiveShadow=true;
    o.frustumCulled=true;
  });
  return root;

}

export function normalizeMuseumModel(__gardenCtx, root,target){
  const THREE=__gardenCtx.THREE;

  root.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(root);
  if(box.isEmpty()) return root;
  const size=box.getSize(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z,.001);
  root.scale.multiplyScalar(target/maxDim);
  root.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(root);
  const center=box.getCenter(new THREE.Vector3());
  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=box.min.y;
  root.updateMatrixWorld(true);
  return root;

}

export function createMuseumLabel(__gardenCtx, title,subtitle){
  const THREE=__gardenCtx.THREE;

  const root=new THREE.Group();
  root.name="museum_separate_exhibition_panel";

  // ------------------------------------------------------------
  // MATERIALS
  // ------------------------------------------------------------
  const frameMat=new THREE.MeshStandardMaterial({
    color:0x3b3028,
    roughness:.68,
    metalness:.16
  });

  const metalMat=new THREE.MeshStandardMaterial({
    color:0x2f3135,
    roughness:.46,
    metalness:.65
  });

  const paperMat=new THREE.MeshStandardMaterial({
    color:0xe6e1da,
    roughness:.96,
    metalness:0,
    side:THREE.DoubleSide
  });

  // ============================================================
  // PIECE 1 · BOARD / POSTER
  // Completely independent from stem and base.
  // ============================================================

  const boardPiece=new THREE.Group();
  boardPiece.name="panel_piece_board";
  boardPiece.position.set(0.000,1.830,0.050);
  boardPiece.rotation.set(0,0,0);
  boardPiece.scale.set(0.685,0.809,0.847);

  const boardFrame=new THREE.Mesh(
    new THREE.BoxGeometry(3.10,1.46,.10),
    frameMat
  );
  boardFrame.name="panel_board_frame";
  boardPiece.add(boardFrame);

  const whiteSheet=new THREE.Mesh(
    new THREE.PlaneGeometry(2.88,1.25),
    paperMat
  );
  whiteSheet.name="panel_board_white_sheet";
  whiteSheet.position.z=.056;
  boardPiece.add(whiteSheet);

  const canvas=document.createElement("canvas");
  canvas.width=1200;
  canvas.height=520;

  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,1200,520);

  ctx.strokeStyle="#d8d2ca";
  ctx.lineWidth=8;
  ctx.strokeRect(18,18,1164,484);

  ctx.textAlign="center";

  ctx.fillStyle="#85715f";
  ctx.font="600 24px Arial";
  ctx.fillText("Garden Collection",600,82);

  ctx.fillStyle="#171717";
  ctx.font="bold 68px Georgia";
  ctx.fillText(title,600,212);

  ctx.fillStyle="#494949";
  ctx.font="31px Arial";
  ctx.fillText(subtitle,600,285);

  ctx.strokeStyle="#d9d9d9";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(165,330);
  ctx.lineTo(1035,330);
  ctx.stroke();

  ctx.fillStyle="#707070";
  ctx.font="22px Arial";
  ctx.fillText("PRIVATE NIGHT EXHIBITION · CASINO GARDEN",600,393);

  const posterTexture=new THREE.CanvasTexture(canvas);
  posterTexture.generateMipmaps=false;
  posterTexture.minFilter=THREE.LinearFilter;
  posterTexture.magFilter=THREE.LinearFilter;
  posterTexture.colorSpace=THREE.SRGBColorSpace;
  posterTexture.needsUpdate=true;

  const printedPoster=new THREE.Mesh(
    new THREE.PlaneGeometry(2.84,1.21),
    new THREE.MeshStandardMaterial({
      map:posterTexture,
      color:0xe6e1da,
      roughness:.94,
      metalness:0,
      side:THREE.DoubleSide
    })
  );
  printedPoster.name="panel_board_print";
  printedPoster.position.z=.061;
  boardPiece.add(printedPoster);

  root.add(boardPiece);

  // ============================================================
  // PIECE 2 · STEM
  // A completely separate object.
  // ============================================================

  const stemPiece=new THREE.Mesh(
    new THREE.BoxGeometry(.10,1.18,.10),
    metalMat.clone()
  );
  stemPiece.name="panel_piece_stem";
  stemPiece.position.set(0.000,0.630,0.020);
  stemPiece.rotation.set(0,0,0);
  stemPiece.scale.set(1.000,1.000,1.000);
  root.add(stemPiece);

  // ============================================================
  // PIECE 3 · BASE
  // A completely separate object.
  // ============================================================

  const basePiece=new THREE.Mesh(
    new THREE.BoxGeometry(1.90,.08,.64),
    metalMat.clone()
  );
  basePiece.name="panel_piece_base";
  basePiece.position.set(0.000,0.040,0.000);
  basePiece.rotation.set(0,0,0);
  basePiece.scale.set(1.000,1.000,1.000);
  root.add(basePiece);

  root.traverse(o=>{
    if(!o?.isMesh) return;
    o.castShadow=false;
    o.receiveShadow=true;
  });

  return root;

}

export function buildMuseumExhibit(__gardenCtx, displaySource,artSource,{name,caseHeight=4.25,title,subtitle}){
  const GARDEN_MUSEUM=__gardenCtx.GARDEN_MUSEUM;
  const THREE=__gardenCtx.THREE;
  const applyDisplayCaseWoodColor=__gardenCtx.applyDisplayCaseWoodColor;
  const applyMuseumGermanAlignment=__gardenCtx.applyMuseumGermanAlignment;
  const ensureDisplayCaseWoodenLegs=__gardenCtx.ensureDisplayCaseWoodenLegs;
  const fitArtworkIntoCase=__gardenCtx.fitArtworkIntoCase;

  const g=new THREE.Group();
  g.name=name;
  g.position.set(0,0,0);
  g.rotation.set(0,0,0);
  g.scale.set(1,1,1);

  const ABSOLUTE_LAYOUT={
    garden_abstract_1_display_case:{
      casePos:[-29.100,1.220,115.378],
      caseRot:[0,0,0]
    },
    garden_abstract_2_display_case:{
      casePos:[-29.100,1.220,101.278],
      caseRot:[0,0,0]
    },
    garden_meteorite_display_case:{
      // Same row as Abstract 2: the row nearest the rose fences.
      casePos:[31.600,1.220,101.278],
      caseRot:[0,0,0]
    }
  };

  const cfg=ABSOLUTE_LAYOUT[name];
  if(!cfg) throw new Error(`Missing absolute museum layout for ${name}`);

  const display=displaySource.clone(true);
  display.name=`${name}_case`;
  prepareMuseumRoot(__gardenCtx,display);
  normalizeMuseumModel(__gardenCtx,display,caseHeight);
  display.position.set(...cfg.casePos);
  display.rotation.set(
    THREE.MathUtils.degToRad(cfg.caseRot[0]),
    THREE.MathUtils.degToRad(cfg.caseRot[1]),
    THREE.MathUtils.degToRad(cfg.caseRot[2])
  );
  display.scale.set(1.668,1.668,1.668);
  g.add(display);

  const art=artSource.clone(true);
  art.name=`${name}_art`;
  prepareMuseumRoot(__gardenCtx,art);
  g.add(art);

  g.updateMatrixWorld(true);
  fitArtworkIntoCase(art,display);

  const label=createMuseumLabel(__gardenCtx,title,subtitle);
  label.name=`${name}_label`;

  const isRight=name==="garden_meteorite_display_case";
  label.position.set(
    display.position.x+(isRight?-3.15:3.15),
    .020,
    display.position.z+1.75
  );
  label.rotation.set(0,0,0);
  label.scale.setScalar(.90);
  g.add(label);

  g.updateMatrixWorld(true);
  GARDEN_MUSEUM.group.add(g);
  GARDEN_MUSEUM.exhibits.push(g);
  GARDEN_MUSEUM.editable.set(`${name}:case`,display);
  GARDEN_MUSEUM.editable.set(`${name}:art`,art);
  GARDEN_MUSEUM.editable.set(`${name}:label`,label);
  queueMicrotask(()=>ensureDisplayCaseWoodenLegs(display));
  queueMicrotask(()=>refreshAllMuseumPurpleCloths(__gardenCtx));
  queueMicrotask(()=>applyDisplayCaseWoodColor());

  if(typeof applyMuseumGermanAlignment==="function"){
    applyMuseumGermanAlignment(false);
  }

  return g;

}

export function loadGardenMuseumExhibits(__gardenCtx){
  const GARDEN_MUSEUM=__gardenCtx.GARDEN_MUSEUM;
  const applyMuseumGermanAlignment=__gardenCtx.applyMuseumGermanAlignment;
  const loadGLBFromCandidates=__gardenCtx.loadGLBFromCandidates;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const removeDisplayCaseRedCloth=__gardenCtx.removeDisplayCaseRedCloth;
  const scene=__gardenCtx.scene;

  GARDEN_MUSEUM.group.clear();
  GARDEN_MUSEUM.exhibits.length=0;
  GARDEN_MUSEUM.editable.clear();

  loadGLBFromCandidates(
    ["../assets/models/display_case.glb","./display_case.glb","display_case.glb"],
    displayGltf=>{
      const displaySource=prepareMuseumRoot(__gardenCtx,displayGltf.scene);
      removeDisplayCaseRedCloth(displaySource);
      const jobs=[
        {
          files:["../assets/models/meteorite.glb","./meteorite.glb","meteorite.glb"],
          cfg:{name:"garden_meteorite_display_case",x:40.200,z:128.178,yaw:0,caseHeight:3.85,title:"METEORITE RECREATION",subtitle:"A RECREATION OF A METEORITE"}
        },
        {
          files:["../assets/models/sculture1.glb","./sculture1.glb","sculture1.glb"],
          cfg:{name:"garden_abstract_1_display_case",x:-39.000,z:128.178,yaw:0,caseHeight:4.25,title:"AMAZON-INSPIRED SCULPTURE",subtitle:"A SCULPTURE INSPIRED BY THE AMAZONS"}
        },
        {
          files:["../assets/models/sculture2.glb","./sculture2.glb","sculture2.glb"],
          cfg:{name:"garden_abstract_2_display_case",x:-30.000,z:128.178,yaw:0,caseHeight:4.25,title:"RUSSIAN SCULPTURE · 1970",subtitle:"AN ARTWORK CREATED IN RUSSIA IN 1970"}
        }
      ];
      jobs.forEach(job=>{
        loadGLBFromCandidates(job.files,gltf=>{
          buildMuseumExhibit(__gardenCtx,displaySource,gltf.scene,job.cfg);
          applyMuseumGermanAlignment(true);
          enforceCenteredMuseumCasesAndBases(__gardenCtx);
          refreshGardenObjectCollisions();
        });
      });
    }
  );

}

export function buildMuseumPurpleClothGeometry(__gardenCtx, width,depth){
  const THREE=__gardenCtx.THREE;

  const geo=new THREE.BoxGeometry(
    Math.max(.20,width),
    .18,
    Math.max(.20,depth),
    18,
    2,
    18
  );

  const pos=geo.attributes.position;

  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i);
    const y=pos.getY(i);
    const z=pos.getZ(i);

    if(Math.abs(y)>.055){
      const nx=x/Math.max(width*.5,.001);
      const nz=z/Math.max(depth*.5,.001);
      const edge=Math.max(Math.abs(nx),Math.abs(nz));

      const wave=
        Math.sin(nx*5.1+nz*2.4)*.024+
        Math.cos(nz*5.7-nx*1.9)*.017;

      pos.setY(
        i,
        y+wave*(.28+.72*Math.min(edge,1))
      );
    }
  }

  pos.needsUpdate=true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  return geo;

}

export function createMuseumPurpleCloth(__gardenCtx, name){
  const MUSEUM_PURPLE_CLOTH=__gardenCtx.MUSEUM_PURPLE_CLOTH;
  const THREE=__gardenCtx.THREE;

  const cloth=new THREE.Mesh(
    buildMuseumPurpleClothGeometry(__gardenCtx,3.25,3.25),
    MUSEUM_PURPLE_CLOTH.material
  );

  cloth.name=name;
  cloth.castShadow=false;
  cloth.receiveShadow=true;
  cloth.userData.clothWidth=3.25;
  cloth.userData.clothDepth=3.25;

  return cloth;

}

export function ensureMuseumPurpleCloth(__gardenCtx, prefix){
  const MUSEUM_PURPLE_CLOTH=__gardenCtx.MUSEUM_PURPLE_CLOTH;
  const THREE=__gardenCtx.THREE;
  const museumPart=__gardenCtx.museumPart;
  const scene=__gardenCtx.scene;

  const caseObj=museumPart(prefix,"case");
  const art=museumPart(prefix,"art");
  if(!caseObj || !art) return null;

  const exhibit=caseObj.parent;
  if(!exhibit) return null;

  let cloth=exhibit.getObjectByName(`${prefix}_purple_cloth`);

  if(!cloth){
    cloth=createMuseumPurpleCloth(__gardenCtx,`${prefix}_purple_cloth`);
    exhibit.add(cloth);
  }

  cloth.material=MUSEUM_PURPLE_CLOTH.material;
  cloth.material.color.setHex(0x241033);
  cloth.material.needsUpdate=true;

  exhibit.updateMatrixWorld(true);
  art.updateMatrixWorld(true);

  const artBox=new THREE.Box3().setFromObject(art);

  const worldPoint=new THREE.Vector3(
    (artBox.min.x+artBox.max.x)*.5,
    artBox.min.y+.085,
    (artBox.min.z+artBox.max.z)*.5
  );

  exhibit.worldToLocal(worldPoint);

  cloth.position.copy(worldPoint);

  const isCoordinatedPair=
    prefix==="garden_abstract_1_display_case" ||
    prefix==="garden_abstract_2_display_case";

  if(isCoordinatedPair){
    // Both abstract cloth nodes first receive the same symmetric base transform.
    cloth.position.x+=MUSEUM_CLOTH_PAIR_EDIT.pos.x;
    cloth.position.y+=MUSEUM_CLOTH_PAIR_EDIT.pos.y;
    cloth.position.z+=MUSEUM_CLOTH_PAIR_EDIT.pos.z;

    cloth.rotation.set(
      THREE.MathUtils.degToRad(MUSEUM_CLOTH_PAIR_EDIT.rot.x),
      caseObj.rotation.y+THREE.MathUtils.degToRad(MUSEUM_CLOTH_PAIR_EDIT.rot.y),
      THREE.MathUtils.degToRad(MUSEUM_CLOTH_PAIR_EDIT.rot.z)
    );

    cloth.scale.set(
      MUSEUM_CLOTH_PAIR_EDIT.scale.x,
      MUSEUM_CLOTH_PAIR_EDIT.scale.y,
      MUSEUM_CLOTH_PAIR_EDIT.scale.z
    );
  }else{
    cloth.rotation.set(0,caseObj.rotation.y,0);
    cloth.scale.set(1,1,1);
  }

  // Then apply the common ALL layer and finally the selected cloth's own layer.
  const all=MUSEUM_CLOTH_EDIT.all;
  const own=MUSEUM_CLOTH_EDIT.items[prefix] || {
    pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}
  };

  cloth.position.x+=all.pos.x+own.pos.x;
  cloth.position.y+=all.pos.y+own.pos.y;
  cloth.position.z+=all.pos.z+own.pos.z;

  cloth.rotation.x+=THREE.MathUtils.degToRad(all.rot.x+own.rot.x);
  cloth.rotation.y+=THREE.MathUtils.degToRad(all.rot.y+own.rot.y);
  cloth.rotation.z+=THREE.MathUtils.degToRad(all.rot.z+own.rot.z);

  cloth.scale.x*=all.scale.x*own.scale.x;
  cloth.scale.y*=all.scale.y*own.scale.y;
  cloth.scale.z*=all.scale.z*own.scale.z;

  // Lock the final cloth transform to the requested ABSOLUTE / WORLD values.
  const worldCfg=MUSEUM_CLOTH_WORLD_VALUES[prefix];
  if(worldCfg){
    scene.updateMatrixWorld(true);
    cloth.parent?.updateMatrixWorld(true);

    const wp=new THREE.Vector3(...worldCfg.position);
    if(cloth.parent) cloth.position.copy(cloth.parent.worldToLocal(wp.clone()));
    else cloth.position.copy(wp);

    const we=new THREE.Euler(
      THREE.MathUtils.degToRad(worldCfg.rotation[0]),
      THREE.MathUtils.degToRad(worldCfg.rotation[1]),
      THREE.MathUtils.degToRad(worldCfg.rotation[2]),
      "XYZ"
    );
    const wq=new THREE.Quaternion().setFromEuler(we);
    if(cloth.parent){
      const pq=new THREE.Quaternion();
      cloth.parent.getWorldQuaternion(pq);
      cloth.quaternion.copy(pq.invert().multiply(wq));
    }else{
      cloth.quaternion.copy(wq);
    }

    if(cloth.parent){
      const ps=new THREE.Vector3();
      cloth.parent.getWorldScale(ps);
      cloth.scale.set(
        worldCfg.scale[0]/Math.max(1e-8,Math.abs(ps.x)),
        worldCfg.scale[1]/Math.max(1e-8,Math.abs(ps.y)),
        worldCfg.scale[2]/Math.max(1e-8,Math.abs(ps.z))
      );
    }else{
      cloth.scale.set(...worldCfg.scale);
    }
  }

  cloth.updateMatrix();
  cloth.updateMatrixWorld(true);

  return cloth;

}

export function refreshAllMuseumPurpleCloths(__gardenCtx){

  ensureMuseumPurpleCloth(__gardenCtx,"garden_abstract_1_display_case");
  ensureMuseumPurpleCloth(__gardenCtx,"garden_abstract_2_display_case");
  ensureMuseumPurpleCloth(__gardenCtx,"garden_meteorite_display_case");

}

export function placeMuseumLabel(__gardenCtx, prefix){
  const museumPrefixParts=__gardenCtx.museumPrefixParts;

  const {caseObj,label}=museumPrefixParts(prefix);
  if(!caseObj || !label) return;
  const isRight=prefix==="garden_meteorite_display_case";
  label.position.set(
    caseObj.position.x+(isRight?-3.15:3.15),
    .020,
    caseObj.position.z+1.75
  );
  label.rotation.set(0,0,0);
  label.scale.setScalar(.90);
  label.updateMatrixWorld(true);

}

export function applyMuseumArtworkWorldValues(__gardenCtx, prefix){
  const THREE=__gardenCtx.THREE;
  const museumPart=__gardenCtx.museumPart;
  const scene=__gardenCtx.scene;

  const art=museumPart(prefix,"art");
  const cfg=MUSEUM_ART_WORLD_VALUES[prefix];
  if(!art || !cfg) return;

  scene.updateMatrixWorld(true);
  art.parent?.updateMatrixWorld(true);

  // Position: requested ABSOLUTE/WORLD -> local coordinates of the artwork parent.
  const worldPos=new THREE.Vector3(...cfg.position);
  if(art.parent){
    art.position.copy(art.parent.worldToLocal(worldPos.clone()));
  }else{
    art.position.copy(worldPos);
  }

  // Rotation: requested ABSOLUTE/WORLD rotation -> local quaternion.
  const worldEuler=new THREE.Euler(
    THREE.MathUtils.degToRad(cfg.rotation[0]),
    THREE.MathUtils.degToRad(cfg.rotation[1]),
    THREE.MathUtils.degToRad(cfg.rotation[2]),
    "XYZ"
  );
  const worldQ=new THREE.Quaternion().setFromEuler(worldEuler);

  if(art.parent){
    const parentQ=new THREE.Quaternion();
    art.parent.getWorldQuaternion(parentQ);
    art.quaternion.copy(parentQ.invert().multiply(worldQ));
  }else{
    art.quaternion.copy(worldQ);
  }

  // Scale: requested ABSOLUTE/WORLD scale -> local scale.
  if(art.parent){
    const parentScale=new THREE.Vector3();
    art.parent.getWorldScale(parentScale);
    art.scale.set(
      cfg.scale[0]/Math.max(1e-8,Math.abs(parentScale.x)),
      cfg.scale[1]/Math.max(1e-8,Math.abs(parentScale.y)),
      cfg.scale[2]/Math.max(1e-8,Math.abs(parentScale.z))
    );
  }else{
    art.scale.set(...cfg.scale);
  }

  art.updateMatrix();
  art.updateMatrixWorld(true);

}

export function refitMuseumArtwork(__gardenCtx, prefix){
  const fitArtworkIntoCase=__gardenCtx.fitArtworkIntoCase;
  const museumPrefixParts=__gardenCtx.museumPrefixParts;

  const {caseObj,art}=museumPrefixParts(prefix);
  if(!caseObj || !art) return;

  // Keep the original fit calculation, then lock the artwork to the
  // explicitly requested absolute/world transform.
  art.rotation.set(0,0,0);
  fitArtworkIntoCase(art,caseObj);
  applyMuseumArtworkWorldValues(__gardenCtx,prefix);

}

export function placeTelescopeLabel(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const THREE=__gardenCtx.THREE;
  const scene=__gardenCtx.scene;

  if(typeof NEW_TELESCOPE==="undefined") return;
  const label=NEW_TELESCOPE.label;
  if(!label) return;

  const cfg=MUSEUM_PANEL_WORLD_VALUES?.telescope;
  if(!cfg) return;

  scene.updateMatrixWorld(true);

  label.position.set(...cfg.position);
  label.rotation.set(
    THREE.MathUtils.degToRad(cfg.rotation[0]),
    THREE.MathUtils.degToRad(cfg.rotation[1]),
    THREE.MathUtils.degToRad(cfg.rotation[2])
  );
  label.scale.set(1,1,1);
  label.updateMatrix();
  label.updateMatrixWorld(true);

}

export function enforceCenteredMuseumCasesAndBases(__gardenCtx){
  const ensureDisplayCaseWoodenLegs=__gardenCtx.ensureDisplayCaseWoodenLegs;
  const museumPart=__gardenCtx.museumPart;

  const a1=museumPart("garden_abstract_1_display_case","case");
  const a2=museumPart("garden_abstract_2_display_case","case");
  const met=museumPart("garden_meteorite_display_case","case");

  if(a1) a1.position.x=-29.100;
  if(a2) a2.position.x=-29.100;
  if(met) met.position.x=31.600;

  for(const o of [a1,a2,met]){
    if(!o) continue;
    o.updateMatrix();
    o.updateMatrixWorld(true);
    ensureDisplayCaseWoodenLegs(o);
  }

}

export function buildGardenBoundaryFence(__gardenCtx){
  const GARDEN_BOUNDARY_FENCE=__gardenCtx.GARDEN_BOUNDARY_FENCE;
  const THREE=__gardenCtx.THREE;
  const gardenFenceSource=__gardenCtx.gardenFenceSource;
  const lcBuildGardenBoundaryFence=__gardenCtx.lcBuildGardenBoundaryFence;
  const maxPerfBuildInstancedGLB=__gardenCtx.maxPerfBuildInstancedGLB;
  const maxPerfRootLocalBounds=__gardenCtx.maxPerfRootLocalBounds;
  const scene=__gardenCtx.scene;

  if(!gardenFenceSource) return;

  const old=
    scene.getObjectByName(
      "garden_boundary_fence_side_only"
    );

  if(old) scene.remove(old);

  gardenFenceSource.updateMatrixWorld(true);

  const localBox=
    maxPerfRootLocalBounds(gardenFenceSource);

  const ss=
    localBox.getSize(new THREE.Vector3());

  if(ss.x<=0 || ss.y<=0 || ss.z<=0) return;

  const targetHeight=3.0;
  const uniform=targetHeight/ss.y;

  const pieceLength=
    Math.max(.35,ss.z*uniform);

  const step=
    Math.max(.35,pieceLength*.94);

  const inward=
    Number.isFinite(GARDEN_BOUNDARY_FENCE.inward)
      ? GARDEN_BOUNDARY_FENCE.inward
      : .08;
  const gardenMinX=-71.0+inward;
  const gardenMaxX=71.0-inward;

  const gardenFarZ=161.012-inward;
  const gardenNearZ=56.900+inward;

  const matrices=[];
  const colliders=[];

  function createPieceAt(
    x,z,yaw,label,index
  ){
    
    const y=
      .025-
      localBox.min.y*uniform;

    const position=
      new THREE.Vector3(x,y,z);

    const quaternion=
      new THREE.Quaternion()
        .setFromEuler(
          new THREE.Euler(0,yaw,0)
        );

    const scale=
      new THREE.Vector3(
        uniform,
        uniform,
        uniform
      );

    matrices.push(
      new THREE.Matrix4().compose(
        position,
        quaternion,
        scale
      )
    );

    // Collider dimensions remain in the fence piece LOCAL axes.
    // yaw rotates the collider exactly once. This fixes the front/back row
    // being effectively rotated like the side rows.
    const localSizeX=ss.x*uniform;
    const localSizeZ=ss.z*uniform;

    colliders.push({
      name:`garden_fence_${label}_${index}`,
      x,
      z,
      halfX:Math.max(.08,localSizeX*.43),
      halfZ:Math.max(.08,localSizeZ*.43),
      yaw
    });
  }

  function addLineTrimmed(
    x1,z1,x2,z2,label,
    trimStartPieces=0,
    trimEndPieces=0
  ){
    const dx=x2-x1;
    const dz=z2-z1;
    const len=Math.hypot(dx,dz);
    if(len<=.01) return;

    const ux=dx/len;
    const uz=dz/len;
    const yaw=Math.atan2(ux,uz);

    const count=Math.floor(len/step);

    const startIndex=
      Math.max(0,trimStartPieces);

    const endIndex=
      Math.max(
        startIndex,
        count-trimEndPieces
      );

    for(
      let i=startIndex;
      i<=endIndex;
      i++
    ){
      const d=Math.min(len,i*step);

      createPieceAt(
        x1+ux*d,
        z1+uz*d,
        yaw,
        label,
        i
      );
    }
  }

  const edit=GARDEN_BOUNDARY_FENCE.edit||{};
  const leftEdit=edit.left||{x:0,z:0,length:0};
  const rightEdit=edit.right||{x:0,z:0,length:0};
  const backEdit=edit.back||{x:0,z:0,length:0};

  // LEFT / RIGHT: X moves the whole side laterally, Z moves it
  // forward/backward, LENGTH extends/reduces the near end.
  const leftFarZ=gardenFarZ+leftEdit.z;
  const leftNearZ=gardenNearZ+leftEdit.z-leftEdit.length;
  const rightFarZ=gardenFarZ+rightEdit.z;
  const rightNearZ=gardenNearZ+rightEdit.z-rightEdit.length;

  addLineTrimmed(
    gardenMinX+leftEdit.x,leftFarZ,
    gardenMinX+leftEdit.x,leftNearZ,
    "left_side",
    0,0
  );

  addLineTrimmed(
    gardenMaxX+rightEdit.x,rightFarZ,
    gardenMaxX+rightEdit.x,rightNearZ,
    "right_side",
    0,0
  );

  // BACK: X/Z move the whole back fence. LENGTH expands/contracts it
  // symmetrically, so its centre stays aligned while tuning.
  const backHalfExtra=backEdit.length*.5;
  addLineTrimmed(
    gardenMinX-step*.35+backEdit.x-backHalfExtra,
    gardenFarZ+backEdit.z,
    gardenMaxX+step*.35+backEdit.x+backHalfExtra,
    gardenFarZ+backEdit.z,
    "far_join",
    0,0
  );

  const group=
    maxPerfBuildInstancedGLB(
      gardenFenceSource,
      matrices,
      "garden_boundary_fence_side_only"
    );

  group.userData.instanceColliders=
    colliders;

  scene.add(group);

  GARDEN_BOUNDARY_FENCE.group=group;
  GARDEN_BOUNDARY_FENCE.height=targetHeight;

  if(
    typeof lcBuildGardenBoundaryFence==="function"
  ){
    lcBuildGardenBoundaryFence();
  }

}

export function applyGardenWidthCompression(__gardenCtx){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const GARDEN_WIDTH_RUNTIME=__gardenCtx.GARDEN_WIDTH_RUNTIME;
  const THREE=__gardenCtx.THREE;
  const applyMuseumGermanAlignment=__gardenCtx.applyMuseumGermanAlignment;
  const compressGardenX=__gardenCtx.compressGardenX;
  const garden=__gardenCtx.garden;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  // ROSE GARDENS: translate centres only, no scaling.
  const oldRoseLeft=-26.000;
  const oldRoseRight=26.000;
  const newRoseLeft=compressGardenX(oldRoseLeft);
  const newRoseRight=compressGardenX(oldRoseRight);

  // Roses themselves are generated from lawnOffsetX.
  // Fence coordinates are rebuilt from these exact translated centres below.
  if(typeof GARDEN_WIDTH_RUNTIME!=="undefined"){
    GARDEN_WIDTH_RUNTIME.roseLeftX=newRoseLeft;
    GARDEN_WIDTH_RUNTIME.roseRightX=newRoseRight;
  }

  // Rose sign (left only) follows its garden by pure X translation.
  const roseSign=FLOWER_EXHIBITS?.tulips;
  if(roseSign){
    // APPROVED ABSOLUTE rose-sign transform.
    // Do not run this through garden-width compression again.
    roseSign.position.set(-20.240,-0.380,79.500);
    roseSign.rotation.set(0,THREE.MathUtils.degToRad(90),0);
    roseSign.scale.set(.756,.756,.756);
    roseSign.updateMatrixWorld(true);
  }

  // EXHIBITS: pure X translation only.
  if(typeof MUSEUM_ALIGNMENT!=="undefined"){
    MUSEUM_ALIGNMENT.leftX=compressGardenX(-37.000);
    MUSEUM_ALIGNMENT.rightX=compressGardenX(37.000);
    applyMuseumGermanAlignment(false);
  }

  // Fountain remains on its existing central axis unless it is off-centre.
  // We only compress X; Z/depth is never touched.
  if(GARDEN_FEATURES?.fountain){
    GARDEN_FEATURES.fountain.position.x=
      compressGardenX(GARDEN_FEATURES.fountain.position.x);
    GARDEN_FEATURES.fountain.updateMatrixWorld(true);
  }

  refreshGardenObjectCollisions();

}

export function applyIndependentRoseFenceTransforms(__gardenCtx){
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const refreshIndependentRoseFenceEditors=__gardenCtx.refreshIndependentRoseFenceEditors;

  buildGardenFlowerZoneFences(__gardenCtx);
  refreshGardenObjectCollisions();
  refreshIndependentRoseFenceEditors();

}

export function buildGardenFlowerZoneFences(__gardenCtx){
  const GARDEN_FLOWER_FENCE_EDIT=__gardenCtx.GARDEN_FLOWER_FENCE_EDIT;
  const GARDEN_FLOWER_ZONE_FENCES=__gardenCtx.GARDEN_FLOWER_ZONE_FENCES;
  const GARDEN_WIDTH_RUNTIME=__gardenCtx.GARDEN_WIDTH_RUNTIME;
  const THREE=__gardenCtx.THREE;
  const flowerFenceIsHorizontal=__gardenCtx.flowerFenceIsHorizontal;
  const flowerFenceSegmentEnds=__gardenCtx.flowerFenceSegmentEnds;
  const lcBuildGardenFlowerZoneFences=__gardenCtx.lcBuildGardenFlowerZoneFences;
  const refreshGardenFlowerFenceEditor=__gardenCtx.refreshGardenFlowerFenceEditor;
  const refreshIndependentRoseFenceEditors=__gardenCtx.refreshIndependentRoseFenceEditors;
  const roseFenceEditorState=__gardenCtx.roseFenceEditorState;

  const group=GARDEN_FLOWER_ZONE_FENCES.group;
  if(!group) return;

  while(group.children.length){
    const child=group.children[group.children.length-1];
    group.remove(child);
    child.geometry?.dispose?.();
  }

  const BED={
    width:12.0000,
    depth:11.5000,
    z:82.4390,
    leftX:GARDEN_WIDTH_RUNTIME.roseLeftX,
    rightX:GARDEN_WIDTH_RUNTIME.roseRightX
  };

  // Keep the approved whole-group transform.
  group.position.set(0.000,-0.300,82.539);
  group.rotation.set(0,0,0);
  group.scale.set(0.977,1.000,0.971);

  function writeRect(target,cx,cz,w,d){
    const localZ=cz-BED.z;

    target.front.x=cx;
    target.front.z=localZ-d*.5;
    target.front.length=w;

    target.back.x=cx;
    target.back.z=localZ+d*.5;
    target.back.length=w;

    target.left.x=cx-w*.5;
    target.left.z=localZ;
    target.left.length=d;

    target.right.x=cx+w*.5;
    target.right.z=localZ;
    target.right.length=d;
  }

  // Start from current independent LEFT / RIGHT editor state.
  const leftState=roseFenceEditorState("left");
  const rightState=roseFenceEditorState("right");

  writeRect(
    GARDEN_FLOWER_FENCE_EDIT.tulips,
    BED.leftX+leftState.x,
    BED.z+leftState.z,
    BED.width*leftState.scaleX,
    BED.depth*leftState.scaleZ
  );

  writeRect(
    GARDEN_FLOWER_FENCE_EDIT.roses,
    BED.rightX+rightState.x,
    BED.z+rightState.z,
    BED.width*rightState.scaleX,
    BED.depth*rightState.scaleZ
  );

  const railGeo=new THREE.BoxGeometry(1,1,1);
  const postGeo=new THREE.BoxGeometry(1,1,1);
  const capGeo=new THREE.ConeGeometry(.155,.16,4);
  capGeo.rotateY(Math.PI/4);

  const railMatrices=[];
  const postMatrices=[];
  const capMatrices=[];
  const postSeen=new Set();

  const q=new THREE.Quaternion();
  const m=new THREE.Matrix4();
  const s=new THREE.Vector3();

  function addPost(x,z,verticalOffset){
    const key=`${x.toFixed(4)}|${z.toFixed(4)}|${verticalOffset.toFixed(4)}`;
    if(postSeen.has(key)) return;
    postSeen.add(key);

    const h=GARDEN_FLOWER_ZONE_FENCES.height;

    postMatrices.push(
      m.clone().compose(
        new THREE.Vector3(x,.09+verticalOffset+h*.5,z),
        q,
        s.set(
          GARDEN_FLOWER_ZONE_FENCES.postSize,
          h,
          GARDEN_FLOWER_ZONE_FENCES.postSize
        )
      )
    );

    capMatrices.push(
      m.clone().compose(
        new THREE.Vector3(x,.09+verticalOffset+h+.06,z),
        q,
        s.set(1,1,1)
      )
    );
  }

  for(const garden of ["tulips","roses"]){
    const editorState=roseFenceEditorState(
      garden==="tulips" ? "left" : "right"
    );

    for(const side of ["front","back","left","right"]){
      const d=GARDEN_FLOWER_FENCE_EDIT[garden][side];
      const horizontal=flowerFenceIsHorizontal(side);
      const ends=flowerFenceSegmentEnds(side,d);

      const intervals=Math.max(2,Math.ceil(d.length/4.0));

      for(let i=0;i<=intervals;i++){
        const t=i/intervals;
        addPost(
          THREE.MathUtils.lerp(ends.a.x,ends.b.x,t),
          THREE.MathUtils.lerp(ends.a.z,ends.b.z,t),
          editorState.y
        );
      }

      for(const y of GARDEN_FLOWER_ZONE_FENCES.railY){
        railMatrices.push(
          m.clone().compose(
            new THREE.Vector3(
              d.x,
              .09+editorState.y+y,
              d.z
            ),
            q,
            s.set(
              horizontal
                ? d.length+.20
                : GARDEN_FLOWER_ZONE_FENCES.railThickness,
              GARDEN_FLOWER_ZONE_FENCES.railThickness,
              horizontal
                ? GARDEN_FLOWER_ZONE_FENCES.railThickness
                : d.length+.20
            )
          )
        );
      }
    }
  }

  function addBatch(geo,mat,matrices,name){
    const inst=new THREE.InstancedMesh(geo,mat,matrices.length);
    inst.name=name;
    inst.castShadow=false;
    inst.receiveShadow=true;
    inst.frustumCulled=true;
    inst.matrixAutoUpdate=false;

    matrices.forEach((mx,i)=>inst.setMatrixAt(i,mx));
    inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    inst.instanceMatrix.needsUpdate=true;
    inst.computeBoundingSphere();
    inst.computeBoundingBox?.();

    group.add(inst);
  }

  addBatch(
    railGeo,
    GARDEN_FLOWER_ZONE_FENCES.material,
    railMatrices,
    "rose_fence_shared_rails"
  );
  addBatch(
    postGeo,
    GARDEN_FLOWER_ZONE_FENCES.postMaterial,
    postMatrices,
    "rose_fence_shared_posts"
  );
  addBatch(
    capGeo,
    GARDEN_FLOWER_ZONE_FENCES.capMaterial,
    capMatrices,
    "rose_fence_shared_caps"
  );

  group.updateMatrixWorld(true);

  lcBuildGardenFlowerZoneFences();
  refreshGardenFlowerFenceEditor?.();
  refreshIndependentRoseFenceEditors?.();

}

export function positionGardenPalmsOutsidePavement(__gardenCtx){
  const COASTAL_ASSETS=__gardenCtx.COASTAL_ASSETS;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  const palms=(COASTAL_ASSETS?.palms || []).filter(
    palm=>palm && palm.parent
  );

  for(let i=0;i<palms.length;i++){
    const palm=palms[i];
    const slot=STATIC_GARDEN_PALM_LAYOUT[
      i%STATIC_GARDEN_PALM_LAYOUT.length
    ];

    // FIXED absolute coordinates. No concrete calculation, no random movement.
    palm.position.set(slot.x,slot.y,slot.z);
    palm.rotation.y=slot.rotY;

    if(!palm.userData.staticPalmBaseScale){
      palm.userData.staticPalmBaseScale=palm.scale.clone();
    }

    const base=palm.userData.staticPalmBaseScale;
    palm.scale.set(
      base.x*slot.scale,
      base.y*slot.scale,
      base.z*slot.scale
    );

    palm.updateMatrixWorld(true);
  }

  refreshGardenObjectCollisions();

}

export function buildGardenFenceTreeBackdrop(__gardenCtx, source){
  const GARDEN_TREE_DECOR=__gardenCtx.GARDEN_TREE_DECOR;
  const THREE=__gardenCtx.THREE;
  const cloneMaterials=__gardenCtx.cloneMaterials;
  const garden=__gardenCtx.garden;
  const gardenTreeTint=__gardenCtx.gardenTreeTint;
  const maxPerfBuildInstancedGLB=__gardenCtx.maxPerfBuildInstancedGLB;
  const maxPerfFreeze=__gardenCtx.maxPerfFreeze;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  if(!source) return;

  GARDEN_TREE_DECOR.group.clear();
  GARDEN_TREE_DECOR.collisionTrees.length=0;
  GARDEN_TREE_DECOR.treeCollisionInstances.length=0;
  GARDEN_TREE_DECOR.instanceCount=0;

  source.updateMatrixWorld(true);
  const srcBox=new THREE.Box3().setFromObject(source);
  const srcSize=srcBox.getSize(new THREE.Vector3());
  if(srcSize.y<=.001) return;

  // Dark night palette: still 3 distinct variants, but all are darker.
  // [leaves, bark, branches]
  const variants=[
    [0x17361d,0x352419,0x291c16],
    [0x1d4223,0x422b1d,0x332219],
    [0x28512c,0x39271d,0x2e2018]
  ].map((colors,index)=>{
    const root=source.clone(true);
    cloneMaterials(root);
    gardenTreeTint(root,colors[0],colors[1],colors[2]);
    root.name=`garden_tree_variant_${index}`;
    return root;
  });

  const matricesByVariant=[[],[],[]];

  const STATIC_GARDEN_TREE_LAYOUT=[
    // FENCE CHECKED FIRST:
    // LEFT X=-71.000 | RIGHT X=71.000 | FRONT Z=56.900 | BACK Z=161.012
    // Exactly 3 trees remain clearly INSIDE. Every other tree is moved well AFTER the fence,
    // with extra clearance so large crowns/branches do not visually enter the fenced garden.
    [1,-100.000000000,0.050518145,67.000000000,22.507660894,5.569429386,22.863517800,28.134576117,20.972913764],
    [0,-105.000000000,0.032938517,71.650000000,21.110777631,1.224960796,20.124941354,26.388472039,17.747487068],
    [0,-110.000000000,0.040964017,76.300000000,15.586544318,6.199192603,12.182195975,19.483180398,14.981860885],
    [1,-100.000000000,0.030474800,80.950000000,12.832970174,3.236797968,11.034599475,16.041212718,13.135559831],
    [0,-105.000000000,0.046672534,85.600000000,20.403882621,0.533687358,17.622596779,25.504853275,18.972333981],
    [2,-110.000000000,0.037894676,90.250000000,16.064629476,3.779392121,16.379777866,20.080786845,14.518425230],
    [1,-100.000000000,0.040935958,94.900000000,17.459740191,1.578325851,14.025583025,21.824675239,15.210297461],
    [0,100.000000000,0.029379639,69.000000000,21.215779906,2.268055987,20.480604252,26.519724882,19.568046600],
    [0,105.000000000,0.056082185,73.650000000,18.802302902,2.289611007,19.595581674,23.502878627,16.851435997],
    [0,110.000000000,0.042599101,78.300000000,15.356153880,5.857358080,12.901805481,19.195192350,14.976718669],
    [1,100.000000000,0.051111093,82.950000000,21.169176415,4.521847818,18.164899567,26.461470519,21.255222008],
    [2,105.000000000,0.035639418,87.600000000,18.648121622,2.950156208,18.980067120,23.310152028,16.051219609],
    [1,110.000000000,0.034739658,92.250000000,17.322698786,1.185063017,13.779232332,21.653373482,16.047116396],
    [1,-105.000000000,0.030602927,99.550000000,16.089667490,3.618763994,16.663823794,20.112084363,14.723398973],
    [2,-110.000000000,0.041620048,104.200000000,12.713442195,0.730552134,10.003702379,15.891802745,10.755589918],
    [0,-100.000000000,0.049199716,108.850000000,23.608374397,5.979094779,22.035326085,29.510467997,23.733804072],
    [1,-82.000000000,0.056424145,190.000000000,15.935354203,6.114613984,16.710891484,19.919192754,13.857513568],
    [0,-63.800000000,0.054383526,190.000000000,15.678285223,1.140869949,13.720982088,19.597856530,15.363974506],
    [2,-45.600000000,0.028507718,190.000000000,20.328084199,5.931387817,22.532166444,25.410105248,19.945063693],
    [0,-27.400000000,0.029428291,190.000000000,26.122611845,1.939310006,22.816940587,32.653264807,23.011553121],
    [1,-9.200000000,0.037927557,190.000000000,22.558800935,2.678301518,21.886945608,28.198501169,19.207954190],
    [2,9.000000000,0.026495995,190.000000000,18.045095819,1.466199612,20.171552358,22.556369773,16.862780356],
    [0,100.000000000,0.040138605,96.900000000,22.015965470,1.288764149,19.843002535,27.519956838,22.006293239],
    [2,105.000000000,0.046970187,101.550000000,17.994665694,4.000832551,14.778621983,22.493332118,15.708294587],
    [2,110.000000000,0.036717739,106.200000000,25.876978992,0.711182995,28.734081456,32.346223740,25.478079617],
    [1,100.000000000,0.049497212,110.850000000,18.369109951,2.934097899,16.915195881,22.961387438,15.733307731],
    [1,-53.000000000,0.032086425,94.000000000,12.825429699,0.145703191,11.175286206,16.031787125,11.687744542],
    [0,105.000000000,0.042039788,115.500000000,14.484830655,2.168547817,11.670666240,18.106038319,12.119570580],
    [2,-105.000000000,0.028966187,113.500000000,18.063019672,0.713042166,15.563536028,22.578774590,17.070101100],
    [1,53.000000000,0.043530934,112.000000000,12.127668760,1.356926775,11.048818625,15.159585950,11.864870298],
    [2,-53.000000000,0.035138350,132.000000000,19.271941326,4.994938681,15.812948830,24.089926658,17.519109669],
    [0,110.000000000,0.039168549,120.150000000,13.320091534,5.222790688,10.803686918,16.650114419,11.191584877],
    [1,-110.000000000,0.038707486,118.150000000,14.813525919,1.819415127,14.158423223,18.516907399,14.853335620],
    [0,100.000000000,0.025804181,124.800000000,13.647731611,1.746013634,12.049107168,17.059664514,12.311514466],
    [0,-100.000000000,0.059675553,122.800000000,14.370768318,1.804473495,12.958657005,17.963460398,12.521136859],
    [1,27.200000000,0.053584465,190.000000000,18.936588597,2.358026364,16.067069343,23.670735746,16.086072784],
    [0,45.400000000,0.036745773,190.000000000,14.914622071,0.103149183,12.091179307,18.643277589,12.349934609],
    [0,63.600000000,0.059203618,190.000000000,12.452734694,3.724676958,12.040869996,15.565918368,10.275479177],
    [1,81.800000000,0.057564448,190.000000000,18.045424083,0.746931449,15.111999601,22.556780105,17.031974253],
    [2,-105.000000000,0.039459026,127.450000000,16.605000000,0.400000000,14.003550000,20.756250000,15.540397293],
    [2,105.000000000,0.050153543,129.450000000,14.985000000,1.600000000,11.813175000,18.731250000,14.852884143],
    [1,-110.000000000,0.047868330,132.100000000,18.435600000,2.700000000,17.237286000,23.044500000,15.259201656],
    [0,110.000000000,0.037821067,134.100000000,17.415000000,4.100000000,15.165562500,21.768750000,16.799795474],
    [0,-100.000000000,0.043402195,136.750000000,14.580000000,5.000000000,11.761200000,18.225000000,12.554173523],
    [1,100.000000000,0.027955476,138.750000000,16.200000000,0.900000000,13.365000000,20.250000000,14.506283053],
    [2,105.000000000,0.040467355,143.400000000,17.010000000,1.350000000,14.345100000,21.262500000,15.665286241],
    [0,110.000000000,0.057453856,148.050000000,15.584400000,4.450000000,12.571416000,19.480500000,13.139097660]
  ];

  // Static tree matrix: no runtime random generation.
  // The 47 entries above are the exact accepted layout from the approved version,
  // with the single problematic casino-side tree already omitted.
  for(const [variant,x,y,z,targetH,rotY,sxN,syN,szN] of STATIC_GARDEN_TREE_LAYOUT){
    const position=new THREE.Vector3(x,y,z);
    const quaternion=new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0,rotY,0)
    );

    const scale=new THREE.Vector3(
      sxN/srcSize.y,
      syN/srcSize.y,
      szN/srcSize.y
    );

    const matrix=new THREE.Matrix4().compose(position,quaternion,scale);
    matricesByVariant[variant].push(matrix);

    GARDEN_TREE_DECOR.instanceCount++;

    const trunkRadius=THREE.MathUtils.clamp(
      Math.min(srcSize.x*scale.x,srcSize.z*scale.z)*.14,
      .30,
      1.05
    );

    GARDEN_TREE_DECOR.treeCollisionInstances.push({
      matrix:matrix.clone(),
      radius:trunkRadius,
      yMin:.025,
      yMax:.025+targetH*1.25
    });
  }

  for(let i=0;i<variants.length;i++){
    const matrices=matricesByVariant[i];
    if(!matrices.length) continue;

    const group=maxPerfBuildInstancedGLB(
      variants[i],
      matrices,
      `garden_instanced_tree_variant_${i}`
    );

    maxPerfFreeze(group);
    GARDEN_TREE_DECOR.group.add(group);
  }

  GARDEN_TREE_DECOR.group.updateMatrixWorld(true);
  refreshGardenObjectCollisions();
}

// ============================================================
// Garden creation/load helpers — STEP 3
// ============================================================

export function normalizeGardenFeature(__gardenCtx, root,targetMax){
  const THREE=__gardenCtx.THREE;
  const centerModelXZ=__gardenCtx.centerModelXZ;
  const cloneMaterials=__gardenCtx.cloneMaterials;
  const putModelOnFloor=__gardenCtx.putModelOnFloor;

  cloneMaterials(root);
  centerModelXZ(root);
  putModelOnFloor(root,0);
  root.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(root);
  const sz=b.getSize(new THREE.Vector3());
  const maxDim=Math.max(sz.x,sz.y,sz.z,.001);
  root.scale.multiplyScalar(targetMax/maxDim);
  root.updateMatrixWorld(true);
  putModelOnFloor(root,.03);
  root.traverse(o=>{
    if(o.isMesh){
      o.castShadow=false;
      o.receiveShadow=true;
      o.frustumCulled=true;
    }
  });

}

export function rebuildGardenWaterRings(__gardenCtx){
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const THREE=__gardenCtx.THREE;
  const createRealisticWaterMaterial=__gardenCtx.createRealisticWaterMaterial;
  const scene=__gardenCtx.scene;

  
  for(const old of GARDEN_FEATURES.water){
    if(old?.parent) old.parent.remove(old);
    old?.geometry?.dispose?.();
    old?.material?.dispose?.();
  }
  GARDEN_FEATURES.water.length=0;

  GARDEN_FEATURES.waterDefs.forEach((def,i)=>{
    const inner=Math.max(0,Math.min(def.inner,def.outer-.02));
    const outer=Math.max(inner+.02,def.outer);

    const geo=inner<=.001
      ? new THREE.CircleGeometry(outer,128)
      : new THREE.RingGeometry(inner,outer,160);

    const p=geo.attributes.position;
    geo.userData.baseXY=[];
    for(let v=0;v<p.count;v++){
      geo.userData.baseXY.push(p.getX(v),p.getY(v));
    }
    p.setUsage(THREE.DynamicDrawUsage);

    const mesh=new THREE.Mesh(geo,createRealisticWaterMaterial(def.opacity));
    mesh.name=`garden_fountain_water_ring_${i+1}`;
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set(def.x,def.y,def.z);
    mesh.renderOrder=35+i;
    mesh.userData.waterRingIndex=i;
    scene.add(mesh);
    GARDEN_FEATURES.water.push(mesh);
  });

}

export function updateGardenFountainWater(__gardenCtx){
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const THREE=__gardenCtx.THREE;
  const activeWorldZone=__gardenCtx.activeWorldZone;
  const player=__gardenCtx.player;

  if(!player?.root) return;

  if(activeWorldZone!=="outside") return;

  const fountain=GARDEN_FEATURES?.fountain;
  if(fountain){
    const dx=player.root.position.x-fountain.position.x;
    const dz=player.root.position.z-fountain.position.z;
    if(dx*dx+dz*dz>55*55) return;
  }

  const t=performance.now()*.001;

  GARDEN_FEATURES.water.forEach((mesh,i)=>{
    const def=GARDEN_FEATURES.waterDefs[i];
    if(!mesh || !def) return;

    mesh.position.set(def.x,def.y,def.z);

    const p=mesh.geometry?.attributes?.position;
    const base=mesh.geometry?.userData?.baseXY;
    if(p && base){
      const amp=def.wind ?? .012;
      for(let v=0;v<p.count;v++){
        const x=base[v*2];
        const y=base[v*2+1];
        const wave=
          Math.sin(x*2.7+t*(1.15+i*.13)+i*.7)*amp+
          Math.cos(y*3.4-t*(.86+i*.08))*amp*.55;
        p.setZ(v,wave);
      }
      p.needsUpdate=true;
    }

    mesh.material.opacity=THREE.MathUtils.clamp(
      def.opacity+Math.sin(t*.65+i*1.3)*.018,
      .08,.92
    );
  });

}

export function createTallTelescopeTripod(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const THREE=__gardenCtx.THREE;
  const makeCylinderBetween=__gardenCtx.makeCylinderBetween;

  const g=new THREE.Group();
  g.name="telescope_tall_tripod";

  const legMat=new THREE.MeshStandardMaterial({
    color:0x202328,
    roughness:.72,
    metalness:.55
  });
  const footMat=new THREE.MeshStandardMaterial({
    color:0x111318,
    roughness:.82,
    metalness:.38
  });

  const topY=NEW_TELESCOPE.legHeight;
  const topRadius=.48;
  const footRadius=2.25;

  for(let i=0;i<3;i++){
    const a=(i/3)*Math.PI*2-Math.PI/2;
    const top=new THREE.Vector3(
      Math.cos(a)*topRadius,
      topY,
      Math.sin(a)*topRadius
    );
    const foot=new THREE.Vector3(
      Math.cos(a)*footRadius,
      .10,
      Math.sin(a)*footRadius
    );

    const leg=makeCylinderBetween(top,foot,.115,legMat);
    leg.name=`telescope_tripod_leg_${i+1}`;
    g.add(leg);

    const pad=new THREE.Mesh(
      new THREE.CylinderGeometry(.24,.28,.14,12),
      footMat
    );
    pad.name=`telescope_tripod_foot_${i+1}`;
    pad.position.copy(foot);
    pad.position.y=.07;
    g.add(pad);
  }

  const hub=new THREE.Mesh(
    new THREE.CylinderGeometry(.62,.72,.32,16),
    legMat
  );
  hub.name="telescope_tripod_hub";
  hub.position.y=topY+.08;
  g.add(hub);

  return g;

}

export function prepareNewTelescopeModel(__gardenCtx, model){
  const THREE=__gardenCtx.THREE;
  const centerModelXZ=__gardenCtx.centerModelXZ;
  const cloneMaterials=__gardenCtx.cloneMaterials;
  const putModelOnFloor=__gardenCtx.putModelOnFloor;

  cloneMaterials(model);
  centerModelXZ(model);
  putModelOnFloor(model,0);

  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z,.001);

  model.scale.multiplyScalar(5.20/maxDim);
  model.updateMatrixWorld(true);
  putModelOnFloor(model,0);

  model.traverse(o=>{
    if(!o?.isMesh) return;
    o.castShadow=false;
    o.receiveShadow=true;
    o.frustumCulled=true;
  });

}

export function gardenTreeTint(__gardenCtx, root,leafHex,barkHex,branchHex){

  root.traverse(obj=>{
    if(!obj?.isMesh || !obj.material) return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const cloned=mats.map(src=>{
      const mat=src?.clone?.() || src;
      if(!mat) return mat;
      const n=String(mat.name||"").toLowerCase();
      if(mat.color){
        if(n.includes("leaf")) mat.color.setHex(leafHex);
        else if(n.includes("bark")) mat.color.setHex(barkHex);
        else if(n.includes("branch")) mat.color.setHex(branchHex);
      }
      if(mat.emissive) mat.emissive.setHex(0x000000);
      if("emissiveIntensity" in mat) mat.emissiveIntensity=0;
      mat.roughness=Math.max(.82,mat.roughness??.90);
      mat.metalness=0;
      mat.needsUpdate=true;
      return mat;
    });
    obj.material=Array.isArray(obj.material)?cloned:cloned[0];
    obj.castShadow=false;
    obj.receiveShadow=true;
    obj.frustumCulled=true;
  });

}

export function prepareGardenFlowerSource(__gardenCtx, source,name){
  const THREE=__gardenCtx.THREE;
  const cloneMaterials=__gardenCtx.cloneMaterials;

  const wrapper=new THREE.Group();
  const child=source.clone(true);
  cloneMaterials(child);
  wrapper.add(child);
  child.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(child);
  if(box.isEmpty()) return null;
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  child.position.x-=center.x;
  child.position.z-=center.z;
  child.position.y-=box.min.y;
  child.updateMatrixWorld(true);
  wrapper.userData.sourceHeight=Math.max(.001,size.y);
  wrapper.userData.sourceWidth=Math.max(.001,size.x);
  wrapper.userData.sourceDepth=Math.max(.001,size.z);
  wrapper.traverse(obj=>{
    if(!obj?.isMesh) return;
    obj.castShadow=false;
    obj.receiveShadow=true;
    obj.frustumCulled=true;
  });
  return wrapper;

}

export function buildRealGardenFlowerFields(__gardenCtx){
  const GARDEN_REAL_FLOWERS=__gardenCtx.GARDEN_REAL_FLOWERS;
  const GARDEN_WIDTH_RUNTIME=__gardenCtx.GARDEN_WIDTH_RUNTIME;
  const LEFT_ROSE_GROUP_MIRROR=__gardenCtx.LEFT_ROSE_GROUP_MIRROR;
  const RIGHT_ROSE_GROUP_EDITOR=__gardenCtx.RIGHT_ROSE_GROUP_EDITOR;
  const THREE=__gardenCtx.THREE;
  const maxPerfBuildInstancedGLB=__gardenCtx.maxPerfBuildInstancedGLB;
  const refreshRightRoseGroupEditor=__gardenCtx.refreshRightRoseGroupEditor;

  if(GARDEN_REAL_FLOWERS.roseVariants.filter(Boolean).length<4) return;

  GARDEN_REAL_FLOWERS.group.clear();

  const lawnLeftX=GARDEN_WIDTH_RUNTIME.roseLeftX;
  const lawnRightX=GARDEN_WIDTH_RUNTIME.roseRightX;
  const lawnZ=82.4390;

  const rnd=(()=>{
    let value=73021>>>0;
    return ()=>{
      value=(value*1664525+1013904223)>>>0;
      return value/4294967296;
    };
  })();

  const countPerGarden=28;
  const clusterCenters=[
    {x:-2.55,z:-2.05,r:1.45},
    {x: 0.00,z:-2.20,r:1.35},
    {x: 2.45,z:-.55,r:1.40},
    {x:-1.70,z: 1.45,r:1.45},
    {x: 1.30,z: 2.00,r:1.45}
  ];

  const layout=[];

  for(let i=0;i<countPerGarden;i++){
    const ci=i%clusterCenters.length;
    const c=clusterCenters[ci];
    const ring=Math.floor(i/clusterCenters.length);
    const angle=(i*2.399963229728653)+(ci*.58)+(rnd()-.5)*.30;
    const radius=.18+ring*.21+rnd()*.15;
    const localX=c.x+Math.cos(angle)*Math.min(c.r,radius);
    const localZ=c.z+Math.sin(angle)*Math.min(c.r,radius*.90);
    const r=rnd();
    const variant=r<.40?0:r<.67?1:r<.88?2:3;

    layout.push({
      x:localX,
      z:localZ,
      variant,
      yaw:rnd()*Math.PI*2,
      h:1.10+rnd()*.56,
      sx:.86+rnd()*.28,
      sz:.86+rnd()*.28
    });
  }

  const sets=[[],[],[],[]];

  const sides=[
    {
      centerX:lawnLeftX,
      state:LEFT_ROSE_GROUP_MIRROR
    },
    {
      centerX:lawnRightX,
      state:RIGHT_ROSE_GROUP_EDITOR
    }
  ];

  for(const side of sides){
    const rg=side.state;

    for(const item of layout){
      const source=GARDEN_REAL_FLOWERS.roseVariants[item.variant];
      const sourceH=source.userData.sourceHeight||1;
      const sy=item.h/sourceH;

      sets[item.variant].push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(
            side.centerX+rg.x+item.x*rg.scaleX,
            .105+rg.y,
            lawnZ+rg.z+item.z*rg.scaleZ
          ),
          new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0,item.yaw,0)
          ),
          new THREE.Vector3(
            sy*item.sx*rg.scaleX,
            sy*rg.scaleY,
            sy*item.sz*rg.scaleZ
          )
        )
      );
    }
  }

  for(let variant=0;variant<4;variant++){
    const source=GARDEN_REAL_FLOWERS.roseVariants[variant];
    const matrices=sets[variant];
    if(!source || !matrices.length) continue;

    const batch=maxPerfBuildInstancedGLB(
      source,
      matrices,
      `garden_real_roses_variant_${variant}`
    );

    if(batch) GARDEN_REAL_FLOWERS.group.add(batch);
  }

  GARDEN_REAL_FLOWERS.group.updateMatrixWorld(true);
  refreshRightRoseGroupEditor?.();

}

export function loadRealGardenFlowers(__gardenCtx){
  const GARDEN_REAL_FLOWERS=__gardenCtx.GARDEN_REAL_FLOWERS;
  const loadGLBFromCandidates=__gardenCtx.loadGLBFromCandidates;
  const scene=__gardenCtx.scene;

  const roseFiles=["roses_full.glb","roses_light.glb","roses_medium.glb","roses_sparse.glb"];
  GARDEN_REAL_FLOWERS.roseVariants.length=0;
  roseFiles.forEach((file,index)=>{
    loadGLBFromCandidates(
      [`../assets/models/${file}`,`./assets/models/${file}`,`./${file}`,file],
      gltf=>{
        GARDEN_REAL_FLOWERS.roseVariants[index]=
          prepareGardenFlowerSource(__gardenCtx,gltf.scene,`roses_variant_${index}`);
        buildRealGardenFlowerFields(__gardenCtx);
      }
    );
  });

}

export function applyGardenStaticPalmLayout(__gardenCtx){
  const positionGardenPalmsOutsidePavement=__gardenCtx.positionGardenPalmsOutsidePavement;
  const refreshGardenPalmEditor=__gardenCtx.refreshGardenPalmEditor;

  positionGardenPalmsOutsidePavement();
  refreshGardenPalmEditor();

}

export function tintPalm(__gardenCtx, model,type,index){

  const leafColors=type==='date'
    ? [0x3f7136,0x4b7f3c,0x365f31]
    : [0x357a3d,0x438a48,0x2f6837];
  const trunkColors=[0x775034,0x865a38,0x69442d];
  model.traverse((obj)=>{
    if(!obj.isMesh || !obj.material) return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    mats.forEach((mat)=>{
      const key=`${obj.name||''} ${mat.name||''}`.toLowerCase();
      if(mat.color){
        if(/leaf|leaves|frond|foliage/.test(key)) mat.color.setHex(leafColors[index%leafColors.length]);
        else mat.color.setHex(trunkColors[index%trunkColors.length]);
      }
      mat.roughness=.90;
      mat.metalness=0;
      mat.needsUpdate=true;
    });
  });

}

export function loadPalm(__gardenCtx, path,{name,type,x,z,height,rotation=0,index=0}){

  // Palms are intentionally disabled for the current Garden design.
  // Do not load the GLB at all: zero scene objects, zero collisions,
  // zero material/shadow work and no cleanup pass required later.
  return null;

}


// ============================================================
// Garden dismantle STEP 5 — larger Garden-only batch
// ============================================================

// rebuildFlatGardenTexturePlane remains in main (reassigns main-owned runtime state).

export function compressGardenX(__gardenCtx, x){

  return GARDEN_WIDTH_COMPRESSION.centerX+
    (x-GARDEN_WIDTH_COMPRESSION.centerX)*GARDEN_WIDTH_COMPRESSION.factor;
}

export function centerOriginalRoseFencesInsideBeds(__gardenCtx){
  const GARDEN_FLOWER_ZONE_FENCES=__gardenCtx.GARDEN_FLOWER_ZONE_FENCES;
  const lcBuildGardenFlowerZoneFences=__gardenCtx.lcBuildGardenFlowerZoneFences;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  const group=GARDEN_FLOWER_ZONE_FENCES?.group;
  if(!group) return;

  // APPROVED ROSE-FENCE TRANSFORM
  group.position.set(0.000,-0.300,82.539);
  group.rotation.set(0,0,0);
  group.scale.set(0.977,1.000,0.971);
  group.updateMatrixWorld(true);

  if(typeof lcBuildGardenFlowerZoneFences==="function"){
    lcBuildGardenFlowerZoneFences();
  }
  if(typeof refreshGardenObjectCollisions==="function"){
    refreshGardenObjectCollisions();
  }
}

export function flowerFenceIsHorizontal(__gardenCtx, side){

  return side==="front" || side==="back";
}

export function flowerFenceSegmentEnds(__gardenCtx, side,data){

  const horizontal=flowerFenceIsHorizontal(__gardenCtx,side);
  const half=Math.max(.15,data.length*.5);
  if(horizontal){
    return {a:{x:data.x-half,z:data.z},b:{x:data.x+half,z:data.z}};
  }
  return {a:{x:data.x,z:data.z-half},b:{x:data.x,z:data.z+half}};
}

export function getRoseSignGroup(__gardenCtx){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;

  return FLOWER_EXHIBITS?.tulips||null;
}

// createEditableGardenLamp stays in main; it is nested in shared lamp loader flow.

export function museumLeftNearZ(__gardenCtx){
  return MUSEUM_ALIGNMENT.leftCenterZ-MUSEUM_ALIGNMENT.spacingZ*.5;
}

export function museumLeftFarZ(__gardenCtx){
  return MUSEUM_ALIGNMENT.leftCenterZ+MUSEUM_ALIGNMENT.spacingZ*.5;
}

export function museumRightNearZ(__gardenCtx){
  return MUSEUM_ALIGNMENT.rightCenterZ-MUSEUM_ALIGNMENT.spacingZ*.5;
}

export function museumRightFarZ(__gardenCtx){
  return MUSEUM_ALIGNMENT.rightCenterZ+MUSEUM_ALIGNMENT.spacingZ*.5;
}

export function museumPart(__gardenCtx, prefix,part){
  const GARDEN_MUSEUM=__gardenCtx.GARDEN_MUSEUM;

  return GARDEN_MUSEUM?.editable?.get(`${prefix}:${part}`)||null;
}

export function museumPrefixParts(__gardenCtx, prefix){

  return {
    caseObj:museumPart(__gardenCtx,prefix,"case"),
    art:museumPart(__gardenCtx,prefix,"art"),
    label:museumPart(__gardenCtx,prefix,"label")
  };
}

export function applyMuseumPanelInitialWorldValues(__gardenCtx){
  const THREE=__gardenCtx.THREE;
  const getMuseumPanelEditorTargets=__gardenCtx.getMuseumPanelEditorTargets;
  const scene=__gardenCtx.scene;

  const targets=getMuseumPanelEditorTargets();
  scene.updateMatrixWorld(true);

  for(const [id,label,panel] of targets){
    const cfg=MUSEUM_PANEL_WORLD_VALUES[id];
    if(!panel || !cfg) continue;

    panel.parent?.updateMatrixWorld(true);

    const wp=new THREE.Vector3(...cfg.position);
    if(panel.parent){
      panel.position.copy(panel.parent.worldToLocal(wp.clone()));
    }else{
      panel.position.copy(wp);
    }

    const e=new THREE.Euler(
      THREE.MathUtils.degToRad(cfg.rotation[0]),
      THREE.MathUtils.degToRad(cfg.rotation[1]),
      THREE.MathUtils.degToRad(cfg.rotation[2]),
      "XYZ"
    );
    const wq=new THREE.Quaternion().setFromEuler(e);

    if(panel.parent){
      const pq=new THREE.Quaternion();
      panel.parent.getWorldQuaternion(pq);
      panel.quaternion.copy(pq.invert().multiply(wq));
    }else{
      panel.quaternion.copy(wq);
    }

    panel.updateMatrix();
    panel.updateMatrixWorld(true);
  }
}

export function applyMuseumGermanAlignment(__gardenCtx, refresh=true){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const THREE=__gardenCtx.THREE;
  const enforceCenteredMuseumCasesAndBases=__gardenCtx.enforceCenteredMuseumCasesAndBases;
  const ensureDisplayCaseWoodenLegs=__gardenCtx.ensureDisplayCaseWoodenLegs;
  const lockLeftExhibitContentsToCases=__gardenCtx.lockLeftExhibitContentsToCases;
  const placeMuseumLabel=__gardenCtx.placeMuseumLabel;
  const placeTelescopeLabel=__gardenCtx.placeTelescopeLabel;
  const refitMuseumArtwork=__gardenCtx.refitMuseumArtwork;
  const refreshAllMuseumPurpleCloths=__gardenCtx.refreshAllMuseumPurpleCloths;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const refreshMuseumAlignmentEditor=__gardenCtx.refreshMuseumAlignmentEditor;
  const refreshTelescopeGLBEditor=__gardenCtx.refreshTelescopeGLBEditor;

  const a1=museumPart(__gardenCtx,"garden_abstract_1_display_case","case");
  const a2=museumPart(__gardenCtx,"garden_abstract_2_display_case","case");
  const met=museumPart(__gardenCtx,"garden_meteorite_display_case","case");
  const yaw=THREE.MathUtils.degToRad(MUSEUM_ALIGNMENT.sharedYaw);

  if(a1){
    a1.position.set(MUSEUM_ALIGNMENT.leftX,MUSEUM_ALIGNMENT.caseY,museumLeftFarZ(__gardenCtx));
    a1.rotation.set(0,yaw,0);
    refitMuseumArtwork("garden_abstract_1_display_case");
    placeMuseumLabel("garden_abstract_1_display_case");
  }
  if(a2){
    a2.position.set(MUSEUM_ALIGNMENT.leftX,MUSEUM_ALIGNMENT.caseY,museumLeftNearZ(__gardenCtx));
    a2.rotation.set(0,yaw,0);
    refitMuseumArtwork("garden_abstract_2_display_case");
    placeMuseumLabel("garden_abstract_2_display_case");
  }
  if(met){
    met.position.set(MUSEUM_ALIGNMENT.rightX,MUSEUM_ALIGNMENT.caseY,museumRightNearZ(__gardenCtx));
    met.rotation.set(0,yaw,0);
    refitMuseumArtwork("garden_meteorite_display_case");
    placeMuseumLabel("garden_meteorite_display_case");
  }
  if(typeof NEW_TELESCOPE!=="undefined" && NEW_TELESCOPE.root){
    NEW_TELESCOPE.root.position.x=MUSEUM_ALIGNMENT.rightX;
    NEW_TELESCOPE.root.position.z=museumRightFarZ(__gardenCtx);
    NEW_TELESCOPE.root.updateMatrixWorld(true);
    placeTelescopeLabel();
  }

  if(a1) ensureDisplayCaseWoodenLegs(a1);
  if(a2) ensureDisplayCaseWoodenLegs(a2);
  if(met) ensureDisplayCaseWoodenLegs(met);

  // Explicitly keep the actual display_case.glb instances and their
  // continuous dark supports at the same centered X translation.
  enforceCenteredMuseumCasesAndBases();

  refreshAllMuseumPurpleCloths();
  lockLeftExhibitContentsToCases();

  // Keep the approved exhibition-panel world placement even when the
  // coordinated museum alignment routine refreshes other exhibit objects.
  if(typeof applyMuseumPanelInitialWorldValues==="function"){
    applyMuseumPanelInitialWorldValues(__gardenCtx);
  }

  if(refresh){
    refreshGardenObjectCollisions();
    refreshMuseumAlignmentEditor();
    refreshTelescopeGLBEditor();
  }
}

// ============================================================
// FINAL GARDEN EXTRACTION — STEP 1 OF 2
// More Garden-only logic moved from main; UI/collisions stay in main.
// ============================================================

export function applyApprovedGardenGateLeafTransforms(__gardenCtx){
  const GATE_PART_EDITORS=__gardenCtx.GATE_PART_EDITORS;
  const THREE=__gardenCtx.THREE;
  const refreshGardenGateLeafCollisions=__gardenCtx.refreshGardenGateLeafCollisions;

  const left=GATE_PART_EDITORS?.leftLeaf || GATE_PART_EDITORS?.gateLeft || GATE_PART_EDITORS?.left;
  const right=GATE_PART_EDITORS?.rightLeaf || GATE_PART_EDITORS?.gateRight || GATE_PART_EDITORS?.right;

  if(left){
    left.visible=true;
    left.position.set(2.950,0.000,-2.950);
    left.rotation.set(
      0,
      THREE.MathUtils.degToRad(-90.0),
      0
    );
    left.updateMatrix();
    left.updateMatrixWorld(true);
  }

  if(right){
    right.visible=true;
    right.position.set(-3.300,0.000,-7.000);
    right.rotation.set(
      0,
      THREE.MathUtils.degToRad(90.0),
      0
    );
    right.updateMatrix();
    right.updateMatrixWorld(true);
  }

  if(typeof refreshGardenGateLeafCollisions==="function"){
    refreshGardenGateLeafCollisions();
  }

}

export function resolveGardenGateLeafs(__gardenCtx){
  const GATE_PART_EDITORS=__gardenCtx.GATE_PART_EDITORS;
  const TASK_BOUNDARY=__gardenCtx.TASK_BOUNDARY;
  const THREE=__gardenCtx.THREE;
  const refreshGardenGateLeafCollisions=__gardenCtx.refreshGardenGateLeafCollisions;
  const refreshGateLeafEditor=__gardenCtx.refreshGateLeafEditor;

  const gate=TASK_BOUNDARY?.gate;
  if(!gate) return;

  GATE_PART_EDITORS.right=
    gate.getObjectByName("Right_0") || null;

  GATE_PART_EDITORS.left=
    gate.getObjectByName("Left_1") || null;

  if(GATE_PART_EDITORS.left){
    const o=GATE_PART_EDITORS.left;
    o.visible=true;
    o.position.set(1.45,0,-1.85);
    o.rotation.set(0,0,0);
    o.updateMatrixWorld(true);
  }

  if(GATE_PART_EDITORS.right){
    const o=GATE_PART_EDITORS.right;
    o.visible=true;
    o.position.set(-2.350,0,-6.650);
    o.rotation.set(0,0,0);
    o.updateMatrixWorld(true);
  }

  refreshGardenGateLeafCollisions();
  refreshGateLeafEditor("left");
  refreshGateLeafEditor("right");

}

// formatGardenCollider stays in main: collision-related helper.

export function museumClothEditLayer(__gardenCtx){
  const museumClothPrefixFromEditorId=__gardenCtx.museumClothPrefixFromEditorId;

  if(MUSEUM_CLOTH_EDIT.selected==="all") return MUSEUM_CLOTH_EDIT.all;
  const prefix=museumClothPrefixFromEditorId(MUSEUM_CLOTH_EDIT.selected);
  return prefix ? MUSEUM_CLOTH_EDIT.items[prefix] : MUSEUM_CLOTH_EDIT.all;

}

export function getSingleRoseSign(__gardenCtx){
  const FLOWER_EXHIBITS=__gardenCtx.FLOWER_EXHIBITS;
  const garden=__gardenCtx.garden;

  // The former left/tulip slot is now the LEFT rose-garden sign.
  return FLOWER_EXHIBITS?.tulips||null;

}

export function commitTelescopeGLBTransform(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const placeTelescopeLabel=__gardenCtx.placeTelescopeLabel;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const refreshMuseumAlignmentEditor=__gardenCtx.refreshMuseumAlignmentEditor;
  const refreshTelescopeGLBEditor=__gardenCtx.refreshTelescopeGLBEditor;

  const o=NEW_TELESCOPE.root;
  if(!o) return;
  o.updateMatrixWorld(true);
  placeTelescopeLabel();
  refreshGardenObjectCollisions();
  refreshTelescopeGLBEditor();
  refreshMuseumAlignmentEditor();

}

export function createTelescopeObservationStars(__gardenCtx){
  const TELESCOPE_OBSERVATION=__gardenCtx.TELESCOPE_OBSERVATION;
  const THREE=__gardenCtx.THREE;
  const scene=__gardenCtx.scene;

  if(TELESCOPE_OBSERVATION.stars) return;

  const count=1150;
  const positions=new Float32Array(count*3);
  let seed=912367>>>0;
  const rnd=()=>{
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296;
  };

  for(let i=0;i<count;i++){
    const u=rnd()*2-1;
    const a=rnd()*Math.PI*2;
    const r=850+rnd()*80;
    const s=Math.sqrt(Math.max(0,1-u*u));

    positions[i*3+0]=Math.cos(a)*s*r;
    positions[i*3+1]=u*r;
    positions[i*3+2]=Math.sin(a)*s*r;
  }

  const geo=new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(positions,3)
  );

  const mat=new THREE.PointsMaterial({
    color:0xffffff,
    size:1.55,
    sizeAttenuation:true,
    transparent:true,
    opacity:.95,
    depthWrite:false,
    fog:false
  });

  const stars=new THREE.Points(geo,mat);
  stars.name="telescope_observation_star_sphere";
  stars.frustumCulled=false;
  stars.visible=false;
  scene.add(stars);

  TELESCOPE_OBSERVATION.stars=stars;

}

export function enterTelescopeMode(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const TELESCOPE_MODE=__gardenCtx.TELESCOPE_MODE;
  const TELESCOPE_OBSERVATION=__gardenCtx.TELESCOPE_OBSERVATION;
  const camera=__gardenCtx.camera;
  const initTelescopeObservationUI=__gardenCtx.initTelescopeObservationUI;

  const tel=NEW_TELESCOPE?.root;
  if(!tel || TELESCOPE_MODE.active) return;

  createTelescopeObservationStars(__gardenCtx);
  initTelescopeObservationUI();

  TELESCOPE_MODE.active=true;
  TELESCOPE_OBSERVATION.yawOffset=0;
  TELESCOPE_OBSERVATION.oldFov=camera.fov;

  camera.fov=22;
  camera.updateProjectionMatrix();

  if(TELESCOPE_OBSERVATION.stars){
    TELESCOPE_OBSERVATION.stars.visible=true;
  }
  if(TELESCOPE_OBSERVATION.vignette){
    TELESCOPE_OBSERVATION.vignette.style.display="block";
  }
  if(TELESCOPE_OBSERVATION.prompt){
    TELESCOPE_OBSERVATION.prompt.textContent="← → · MUOVI VISTA   ·   E / ESC · ESCI";
    TELESCOPE_OBSERVATION.prompt.style.display="block";
  }

  updateTelescopeView(__gardenCtx,0);

}

export function updateTelescopeView(__gardenCtx, dt){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const TELESCOPE_OBSERVATION=__gardenCtx.TELESCOPE_OBSERVATION;
  const THREE=__gardenCtx.THREE;
  const camera=__gardenCtx.camera;
  const keys=__gardenCtx.keys;

  const tel=NEW_TELESCOPE?.root;
  if(!tel) return false;

  tel.updateMatrixWorld(true);

  const q=new THREE.Quaternion();
  tel.getWorldQuaternion(q);

  // Slightly higher optical direction than before.
  const baseForward=new THREE.Vector3(
    0,
    .46+TELESCOPE_OBSERVATION.pitchOffset,
    -1
  ).normalize();

  const leftHeld=!!keys["arrowleft"];
  const rightHeld=!!keys["arrowright"];

  if(leftHeld || rightHeld){
    const dir=(rightHeld?1:0)-(leftHeld?1:0);
    TELESCOPE_OBSERVATION.yawOffset+=
      dir*TELESCOPE_OBSERVATION.panSpeed*(dt||.016);
  }

  const yawQ=new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0,1,0),
    TELESCOPE_OBSERVATION.yawOffset
  );

  const forward=TELESCOPE_OBSERVATION.forward
    .copy(baseForward)
    .applyQuaternion(q)
    .applyQuaternion(yawQ)
    .normalize();

  const eye=TELESCOPE_OBSERVATION.eye;
  tel.getWorldPosition(eye);
  eye.y+=NEW_TELESCOPE.legHeight+.82;
  eye.addScaledVector(forward,-.42);

  camera.position.copy(eye);

  const target=TELESCOPE_OBSERVATION.target
    .copy(eye)
    .addScaledVector(forward,900);

  camera.up.copy(TELESCOPE_OBSERVATION.up);
  camera.lookAt(target);

  if(TELESCOPE_OBSERVATION.stars){
    TELESCOPE_OBSERVATION.stars.visible=true;
  }

  return true;

}

export function updateTelescopeInteractionPrompt(__gardenCtx){
  const TELESCOPE_MODE=__gardenCtx.TELESCOPE_MODE;
  const TELESCOPE_OBSERVATION=__gardenCtx.TELESCOPE_OBSERVATION;
  const initTelescopeObservationUI=__gardenCtx.initTelescopeObservationUI;
  const isPlayerNearTelescope=__gardenCtx.isPlayerNearTelescope;

  initTelescopeObservationUI();

  if(TELESCOPE_MODE.active) return;

  const near=isPlayerNearTelescope();
  TELESCOPE_OBSERVATION.prompt.style.display=near?"block":"none";
  if(near){
    TELESCOPE_OBSERVATION.prompt.textContent="E · GUARDA NEL TELESCOPIO";
  }

}

export function gardenExhibitionLampTargets(__gardenCtx, selection="both"){
  const GARDEN_EXHIBITION_LAMPS=__gardenCtx.GARDEN_EXHIBITION_LAMPS;

  if(selection==="lamp1"){
    return GARDEN_EXHIBITION_LAMPS.lamps[0] ? [GARDEN_EXHIBITION_LAMPS.lamps[0]] : [];
  }
  if(selection==="lamp2"){
    return GARDEN_EXHIBITION_LAMPS.lamps[1] ? [GARDEN_EXHIBITION_LAMPS.lamps[1]] : [];
  }
  return GARDEN_EXHIBITION_LAMPS.lamps.filter(Boolean);

}

export function moveGardenExhibitionLamps(__gardenCtx, selection,axis,delta){
  const refreshGardenExhibitionLampEditor=__gardenCtx.refreshGardenExhibitionLampEditor;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;

  for(const lamp of gardenExhibitionLampTargets(__gardenCtx,selection)){
    lamp.position[axis]+=delta;
    lamp.updateMatrix();
    lamp.updateMatrixWorld(true);
  }

  if(typeof refreshFixedLightSources==="function"){
    refreshFixedLightSources();
  }

  if(typeof refreshGardenObjectCollisions==="function"){
    refreshGardenObjectCollisions();
  }

  refreshGardenExhibitionLampEditor();

}

// createEditableGardenLamp stays in main: it depends on local lamp-loader state.


// The two exhibition lamps belong to the Garden.
// main loads Lampione.glb once and passes the source mesh here.
// Garden.js creates ONLY the Garden lamp models; lighting stays in main.html.
export function createGardenExhibitionLamp(__gardenCtx, source, index,x,z){
  const THREE=__gardenCtx.THREE;
  const GARDEN_EXHIBITION_LAMPS=__gardenCtx.GARDEN_EXHIBITION_LAMPS;
  const centerModelXZ=__gardenCtx.centerModelXZ;
  const fitModelToHeight=__gardenCtx.fitModelToHeight;
  const prepareStaticGLB=__gardenCtx.prepareStaticGLB;
  const putModelOnFloor=__gardenCtx.putModelOnFloor;
  const refreshGardenExhibitionLampEditor=__gardenCtx.refreshGardenExhibitionLampEditor;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const scene=__gardenCtx.scene;

      const lamp=source.clone(true);
      lamp.name=`garden_exhibition_lamp_${index+1}`;
      prepareStaticGLB(lamp);

      const height=7.8;
      fitModelToHeight(lamp,height);
      centerModelXZ(lamp);
      putModelOnFloor(lamp,0);

      lamp.position.set(x,0,z);
      lamp.rotation.y=0;
      scene.add(lamp);

      lamp.updateMatrixWorld(true);
      const groundBox=new THREE.Box3().setFromObject(lamp);
      lamp.position.y-=groundBox.min.y;
      lamp.updateMatrixWorld(true);

      GARDEN_EXHIBITION_LAMPS.lamps[index]=lamp;
      refreshGardenExhibitionLampEditor();

      if(typeof refreshGardenObjectCollisions==="function"){
        refreshGardenObjectCollisions();
      }

      return lamp;
    
}

// ============================================================
// FINAL GARDEN EXTRACTION — STEP 2 OF 2
// Remaining non-UI/non-collision Garden loaders/runtime helpers.
// ============================================================

export function loadGardenGate(__gardenCtx){
  const TASK_BOUNDARY=__gardenCtx.TASK_BOUNDARY;
  const buildCeremonialGatePosts=__gardenCtx.buildCeremonialGatePosts;
  const centerModelXZ=__gardenCtx.centerModelXZ;
  const cloneMaterials=__gardenCtx.cloneMaterials;
  const loadGLBFromCandidates=__gardenCtx.loadGLBFromCandidates;
  const prepareStaticGLB=__gardenCtx.prepareStaticGLB;
  const refreshGardenGateEditor=__gardenCtx.refreshGardenGateEditor;
  const refreshGardenGateLeafCollisions=__gardenCtx.refreshGardenGateLeafCollisions;
  const resolveNearGateBarricades=__gardenCtx.resolveNearGateBarricades;
  const scene=__gardenCtx.scene;
  loadGLBFromCandidates(
    ["../assets/models/doorGarden.glb","./doorGarden(1).glb"],
    (gltf,path)=>{
      const gate=gltf.scene;
      gate.name="garden_task_gate";

      cloneMaterials(gate);
      prepareStaticGLB(gate);
      centerModelXZ(gate);
      gate.updateMatrixWorld(true);
scene.add(gate);

      TASK_BOUNDARY.gate=gate;

      gate.position.set(0.60,0.03,57.60);
      gate.scale.set(2.066,2.566,1.216);
      gate.rotation.set(0,0,0);

      syncGardenCenterAxis(__gardenCtx);

      gate.traverse(o=>{
        if(o.name==="garden_door_hinge_75deg"){
          o.rotation.set(0,0,0);
        }
      });

      gate.updateMatrixWorld(true);

      gate.userData.openDoorPivot=null;
      gate.userData.openAngleDeg=0;

      TASK_BOUNDARY.gateReady=true;
      buildCeremonialGatePosts();

      resolveGardenGateLeafs(__gardenCtx);
      applyApprovedGardenGateLeafTransforms(__gardenCtx);
      setTimeout(resolveNearGateBarricades,200);
      refreshGardenGateEditor();

      refreshGardenGateLeafCollisions();

    },
    err=>console.error("doorGarden.glb load error",err)
  );

}

export function loadGardenTelescopeModel(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const TELESCOPE_MODE=__gardenCtx.TELESCOPE_MODE;
  const THREE=__gardenCtx.THREE;
  const handleGardenTelescopeLoadError=__gardenCtx.handleGardenTelescopeLoadError;
  const loadGLBFromCandidates=__gardenCtx.loadGLBFromCandidates;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const refreshMuseumAlignmentEditor=__gardenCtx.refreshMuseumAlignmentEditor;
  const refreshMuseumPanelEditor=__gardenCtx.refreshMuseumPanelEditor;
  const refreshTelescopeGLBEditor=__gardenCtx.refreshTelescopeGLBEditor;
  const scene=__gardenCtx.scene;

  if(NEW_TELESCOPE.root?.parent){
    NEW_TELESCOPE.root.parent.remove(NEW_TELESCOPE.root);
  }
  if(NEW_TELESCOPE.label?.parent){
    NEW_TELESCOPE.label.parent.remove(NEW_TELESCOPE.label);
  }

  loadGLBFromCandidates(
    ["../assets/models/telescope.glb"],
    (gltf,path)=>{
      const model=gltf.scene;
      model.name="garden_telescope_model";
      prepareNewTelescopeModel(__gardenCtx,model);

      const root=new THREE.Group();
      root.name="garden_telescope_glb";

      const tripod=createTallTelescopeTripod(__gardenCtx);
      root.add(tripod);

      model.position.y=NEW_TELESCOPE.legHeight+.28;
      root.add(model);

      root.position.set(31.600,-0.170,115.378);
      root.rotation.set(0,THREE.MathUtils.degToRad(134.0),0);
      root.scale.set(0.5729,0.5729,0.5729);

      scene.add(root);

      const label=createMuseumLabel(__gardenCtx,
        "TELESCOPE",
        "It is possible to look at the stars"
      );
      label.name="garden_telescope_label";
      scene.add(label);

      NEW_TELESCOPE.root=root;
      NEW_TELESCOPE.model=model;
      NEW_TELESCOPE.tripod=tripod;
      NEW_TELESCOPE.label=label;
      TELESCOPE_MODE.root=root;

      root.updateMatrixWorld(true);
      placeTelescopeLabel(__gardenCtx);

      if(typeof applyMuseumPanelInitialWorldValues==="function"){
        applyMuseumPanelInitialWorldValues(__gardenCtx);
      }
      if(typeof refreshMuseumPanelEditor==="function"){
        refreshMuseumPanelEditor();
      }

      refreshGardenObjectCollisions();
      refreshTelescopeGLBEditor();
      refreshMuseumAlignmentEditor();
    },
    err=>handleGardenTelescopeLoadError(err)
  );

}

export function rebuildTallTelescopeTripod(__gardenCtx){
  const NEW_TELESCOPE=__gardenCtx.NEW_TELESCOPE;
  const root=NEW_TELESCOPE.root;
  const old=NEW_TELESCOPE.tripod;
  const model=NEW_TELESCOPE.model;
  if(!root || !model) return;

  if(old?.parent) old.parent.remove(old);

  const tripod=createTallTelescopeTripod(__gardenCtx);
  root.add(tripod);
  NEW_TELESCOPE.tripod=tripod;

  model.position.y=NEW_TELESCOPE.legHeight+.28;
  root.updateMatrixWorld(true);

  commitTelescopeGLBTransform(__gardenCtx);

}

export function loadGardenFeatureModels(__gardenCtx){
  const GARDEN_FEATURES=__gardenCtx.GARDEN_FEATURES;
  const THREE=__gardenCtx.THREE;
  const handleGardenFeatureLoadError=__gardenCtx.handleGardenFeatureLoadError;
  const loadGLBFromCandidates=__gardenCtx.loadGLBFromCandidates;
  const loader=__gardenCtx.loader;
  const refreshGardenFeatureEditor=__gardenCtx.refreshGardenFeatureEditor;
  const refreshGardenObjectCollisions=__gardenCtx.refreshGardenObjectCollisions;
  const scene=__gardenCtx.scene;
  if(GARDEN_FEATURES.stone?.parent){
    GARDEN_FEATURES.stone.parent.remove(GARDEN_FEATURES.stone);
    GARDEN_FEATURES.stone=null;
  }
  if(GARDEN_FEATURES.fountain?.parent){
    GARDEN_FEATURES.fountain.parent.remove(GARDEN_FEATURES.fountain);
    GARDEN_FEATURES.fountain=null;
  }

  
  // empty stone asset loader removed


  loadGLBFromCandidates(
    GARDEN_FEATURE_ASSETS.fountain,
    (gltf,path)=>{
    const root=gltf.scene;
    root.name="garden_fountain_glb";
    normalizeGardenFeature(__gardenCtx,root,5.8);

    root.position.set(0.600,0.030,113.194);
    root.rotation.set(0,THREE.MathUtils.degToRad(-28.00),0);
    root.scale.setScalar(3.0092);
    root.updateMatrixWorld(true);
    scene.add(root);
    root.position.set(.600,.030,113.194);
    root.rotation.set(0,THREE.MathUtils.degToRad(-28),0);
    root.scale.setScalar(3.6502);
    root.updateMatrixWorld(true);
    GARDEN_FEATURES.fountain=root;
    syncGardenCenterAxis(__gardenCtx);
    refreshGardenObjectCollisions();

    rebuildGardenWaterRings(__gardenCtx);
    if(typeof refreshGardenFeatureEditor==="function") refreshGardenFeatureEditor();
  },e=>handleGardenFeatureLoadError(e));

}


export function setGardenGrassTextureSize(__gardenCtx, value){
  const next=Math.max(.10,Math.min(4.00,Number(value)||1));
  GARDEN_GRASS_TEXTURE_SIZE=next;

  rebuildFlatGardenTexturePlane(__gardenCtx);
  buildGardenSideGrassFill(__gardenCtx);
  setGardenGrassColor(
    __gardenCtx,
    GARDEN_GRASS_COLOR,
    GARDEN_GRASS_BRIGHTNESS
  );

  return GARDEN_GRASS_TEXTURE_SIZE;
}

export function getGardenGrassTextureSize(){
  return GARDEN_GRASS_TEXTURE_SIZE;
}

export function getGardenGrassSeamOverlap(){
  return GARDEN_GRASS_SEAM_OVERLAP;
}

export function setGardenGrassPlaneSize(__gardenCtx, width,depth){
  const w=Math.max(20,Number(width)||GARDEN_GRASS_PLANE_SIZE.width);
  const d=Math.max(20,Number(depth)||GARDEN_GRASS_PLANE_SIZE.depth);

  GARDEN_GRASS_PLANE_SIZE.width=w;
  GARDEN_GRASS_PLANE_SIZE.depth=d;

  rebuildFlatGardenTexturePlane(__gardenCtx);

  return {
    width:GARDEN_GRASS_PLANE_SIZE.width,
    depth:GARDEN_GRASS_PLANE_SIZE.depth
  };
}

export function getGardenGrassPlaneSize(){
  return {
    width:GARDEN_GRASS_PLANE_SIZE.width,
    depth:GARDEN_GRASS_PLANE_SIZE.depth
  };
}

export function rebuildFlatGardenTexturePlane(__gardenCtx){
  const THREE=__gardenCtx.THREE;
  const outdoorGrassTexture=__gardenCtx.outdoorGrassTexture;
  const scene=__gardenCtx.scene;

  if(flatGardenTexturePlane?.parent){
    flatGardenTexturePlane.parent.remove(flatGardenTexturePlane);
  }

  const grassWidth=
    GARDEN_GRASS_PLANE_SIZE.width+
    GARDEN_GRASS_SEAM_OVERLAP*2;
  const grassDepth=
    GARDEN_GRASS_PLANE_SIZE.depth+
    GARDEN_GRASS_SEAM_OVERLAP*2;

  const geo=new THREE.PlaneGeometry(
    grassWidth,
    grassDepth
  );
  const mat=makeUniformGardenGrassMaterial(
    __gardenCtx,
    grassWidth,
    grassDepth
  );

  flatGardenTexturePlane=new THREE.Mesh(geo,mat);
  flatGardenTexturePlane.name="flat_garden_grass_png_plane";
  flatGardenTexturePlane.rotation.x=-Math.PI/2;
  flatGardenTexturePlane.position.set(0,.024,95);
  flatGardenTexturePlane.renderOrder=2;
  scene.add(flatGardenTexturePlane);

}
