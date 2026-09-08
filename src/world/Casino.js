import {
  CASINO_BUILDING_CONFIG,
  CASINO_FLOOR_CONFIG,
  CASINO_ROOM_STYLE,
  CASINO_FACADE_CONFIG,
  CASINO_DOOR_SEAL_CONFIG,
  CASINO_STALE_GEOMETRY_NAMES
} from "../config/casino.config.js";

export let CASINO_WORLD=null;
export let CASINO_FLOOR_TEXTURE=null;
export let CASINO_FLOOR_MATERIAL=null;
export let CASINO_FACADE_MATERIALS=null;
export let CASINO_LEFT_DOOR_X=null;

function makeMaterial(THREE,definition){
  return new THREE.MeshStandardMaterial({...definition});
}

function makeBox(ctx,name,w,h,d,x,y,z,color){
  const THREE=ctx.THREE;
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color})
  );
  mesh.name=name;
  mesh.position.set(x,y,z);
  ctx.scene.add(mesh);
  return mesh;
}

function makeTiledTexture(ctx,path,repeatX,repeatY){
  const THREE=ctx.THREE;
  const tex=ctx.textureLoader.load(path);
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeatX,repeatY);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(
    4,
    ctx.renderer.capabilities.getMaxAnisotropy()
  );
  return tex;
}

function roundedRectShape(THREE,width,height,radius){
  const r=Math.min(radius,width*.5,height*.5);
  const s=new THREE.Shape();

  s.moveTo(-width*.5+r,-height*.5);
  s.lineTo(width*.5-r,-height*.5);
  s.quadraticCurveTo(
    width*.5,-height*.5,
    width*.5,-height*.5+r
  );
  s.lineTo(width*.5,height*.5-r);
  s.quadraticCurveTo(
    width*.5,height*.5,
    width*.5-r,height*.5
  );
  s.lineTo(-width*.5+r,height*.5);
  s.quadraticCurveTo(
    -width*.5,height*.5,
    -width*.5,height*.5-r
  );
  s.lineTo(-width*.5,-height*.5+r);
  s.quadraticCurveTo(
    -width*.5,-height*.5,
    -width*.5+r,-height*.5
  );

  return s;
}

function makeRoundedPanel(
  ctx,
  name,
  w,
  h,
  depth,
  radius,
  x,
  y,
  z,
  material
){
  const THREE=ctx.THREE;
  const geometry=new THREE.ExtrudeGeometry(
    roundedRectShape(THREE,w,h,radius),
    {
      depth,
      bevelEnabled:false,
      curveSegments:14
    }
  );

  geometry.translate(0,0,-depth*.5);
  geometry.computeVertexNormals();

  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;
  mesh.position.set(x,y,z);
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  ctx.scene.add(mesh);

  return mesh;
}

function createFacadeMaterials(ctx){
  const THREE=ctx.THREE;
  const d=CASINO_FACADE_CONFIG.materials;

  return {
    casinoWall:makeMaterial(THREE,d.casinoWall),
    pubWall:makeMaterial(THREE,d.pubWall),
    darkStone:makeMaterial(THREE,d.darkStone),
    warmStone:makeMaterial(THREE,d.warmStone),
    brass:makeMaterial(THREE,d.brass),
    blackMetal:makeMaterial(THREE,d.blackMetal),
    casinoGlass:makeMaterial(THREE,d.casinoGlass),
    pubGlass:makeMaterial(THREE,d.pubGlass)
  };
}

function createCasinoFloor(ctx){
  const THREE=ctx.THREE;
  const cfg=CASINO_BUILDING_CONFIG;
  const floorCfg=CASINO_FLOOR_CONFIG;

  const texture=makeTiledTexture(
    ctx,
    floorCfg.texture,
    floorCfg.repeatX,
    floorCfg.repeatZ
  );

  const material=new THREE.MeshStandardMaterial({
    map:texture,
    color:floorCfg.color,
    roughness:floorCfg.roughness,
    metalness:floorCfg.metalness,
    side:THREE.DoubleSide
  });

  const floorEdit={
    ...floorCfg.edit,
    floorMesh:null,
    thresholdMeshes:[]
  };

  const margin=.22;
  const baseWidth=cfg.roomWidth-margin*2;
  const baseDepth=cfg.roomDepth-margin*2;

  const width=Math.max(
    .5,
    baseWidth+floorEdit.left+floorEdit.right
  );

  const depth=Math.max(
    .5,
    baseDepth+floorEdit.front+floorEdit.back
  );

  const centerX=
    cfg.leftRoomCenterX+
    (floorEdit.right-floorEdit.left)*.5;

  const centerZ=
    cfg.roomCenterZ+
    (floorEdit.back-floorEdit.front)*.5;

  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(width,depth),
    material
  );

  floor.name="casino_floor_floor_png";
  floor.rotation.x=-Math.PI/2;
  floor.position.set(
    centerX,
    floorCfg.y,
    centerZ
  );
  floor.receiveShadow=true;
  floor.castShadow=false;
  ctx.scene.add(floor);
  floorEdit.floorMesh=floor;

  const thresholdCfg=floorCfg.threshold;
  const thresholdTexture=texture.clone();
  thresholdTexture.needsUpdate=true;
  thresholdTexture.wrapS=THREE.RepeatWrapping;
  thresholdTexture.wrapT=THREE.RepeatWrapping;

  const mainW=cfg.roomWidth-.45*2;
  const mainD=cfg.roomDepth-.45*2;

  thresholdTexture.repeat.set(
    thresholdCfg.width*(floorCfg.repeatX/mainW),
    thresholdCfg.depth*(floorCfg.repeatZ/mainD)
  );

  const thresholdMaterial=
    new THREE.MeshStandardMaterial({
      map:thresholdTexture,
      color:floorCfg.thresholdColor,
      roughness:floorCfg.roughness,
      metalness:floorCfg.metalness,
      side:THREE.DoubleSide
    });

  const threshold=new THREE.Mesh(
    new THREE.PlaneGeometry(
      thresholdCfg.width,
      thresholdCfg.depth
    ),
    thresholdMaterial
  );

  threshold.name=thresholdCfg.name;
  threshold.rotation.x=-Math.PI/2;
  threshold.position.set(
    thresholdCfg.x,
    thresholdCfg.y,
    thresholdCfg.z
  );
  threshold.receiveShadow=true;
  threshold.castShadow=false;
  ctx.scene.add(threshold);
  floorEdit.thresholdMeshes.push(threshold);

  return {
    texture,
    material,
    floorEdit
  };
}

function buildRoomShell(ctx,roomName,centerX,color){
  const cfg=CASINO_BUILDING_CONFIG;
  const halfW=cfg.roomWidth/2;
  const h=cfg.roomHeight;
  const d=cfg.roomDepth;
  const z=cfg.roomCenterZ;

  makeBox(
    ctx,
    `${roomName}_back_wall`,
    cfg.roomWidth,
    h,
    cfg.wallThickness,
    centerX,
    h/2,
    cfg.backZ,
    color
  );

  makeBox(
    ctx,
    `${roomName}_left_wall`,
    cfg.wallThickness,
    h,
    d,
    centerX-halfW,
    h/2,
    z,
    color
  );

  makeBox(
    ctx,
    `${roomName}_right_wall`,
    cfg.wallThickness,
    h,
    d,
    centerX+halfW,
    h/2,
    z,
    color
  );
}

function makeRoundedOuterCorner(ctx,name,x,z){
  const THREE=ctx.THREE;
  const cfg=CASINO_BUILDING_CONFIG;
  const style=CASINO_ROOM_STYLE;

  const material=new THREE.MeshStandardMaterial({
    color:style.outerCornerColor,
    roughness:.92,
    metalness:0
  });

  const mesh=new THREE.Mesh(
    new THREE.CylinderGeometry(
      style.outerCornerRadius,
      style.outerCornerRadius,
      cfg.roomHeight,
      20
    ),
    material
  );

  mesh.name=name;
  mesh.position.set(
    x,
    cfg.roomHeight/2,
    z
  );
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  ctx.scene.add(mesh);

  return mesh;
}

function makeRoomFacade(
  ctx,
  roomName,
  centerX,
  color,
  doorOffsetX,
  material
){
  const THREE=ctx.THREE;
  const cfg=CASINO_BUILDING_CONFIG;

  const roomW=cfg.roomWidth;
  const doorW=cfg.doorWidth;
  const doorH=cfg.doorHeight;
  const doorCenterX=centerX+doorOffsetX;
  const roomLeft=centerX-roomW/2;
  const roomRight=centerX+roomW/2;

  const leftW=
    (doorCenterX-doorW/2)-roomLeft;

  const rightW=
    roomRight-(doorCenterX+doorW/2);

  const z=cfg.frontZ;
  const h=cfg.roomHeight;

  makeBox(
    ctx,
    `${roomName}_front_wall_left_of_door`,
    leftW,
    h,
    .72,
    roomLeft+leftW/2,
    h/2,
    z,
    color
  );

  makeBox(
    ctx,
    `${roomName}_front_wall_right_of_door`,
    rightW,
    h,
    .72,
    doorCenterX+doorW/2+rightW/2,
    h/2,
    z,
    color
  );

  makeBox(
    ctx,
    `${roomName}_front_wall_above_door`,
    doorW,
    h-doorH,
    .72,
    doorCenterX,
    doorH+(h-doorH)/2,
    z,
    color
  );

  for(const sx of [-1,1]){
    const px=
      centerX+
      sx*(roomW/2-.28);

    const corner=new THREE.Mesh(
      new THREE.CylinderGeometry(
        .42,
        .42,
        h-.35,
        24
      ),
      material
    );

    corner.name=
      `${roomName}_${sx<0?"left":"right"}_rounded_front_corner`;

    corner.position.set(
      px,
      (h-.35)/2,
      z+.22
    );

    corner.castShadow=false;
    corner.receiveShadow=true;
    ctx.scene.add(corner);
  }
}

function addDoorGapSeals(
  ctx,
  prefix,
  centerX,
  wallColor
){
  const cfg=CASINO_BUILDING_CONFIG;
  const seal=CASINO_DOOR_SEAL_CONFIG;
  const z=cfg.doorZ+seal.zOffset;

  makeBox(
    ctx,
    `${prefix}_seal_left`,
    seal.sideWidth,
    cfg.doorHeight+seal.verticalExtra,
    seal.depth,
    centerX-cfg.doorWidth*.5+seal.sideWidth*.5,
    cfg.doorHeight*.5,
    z,
    wallColor
  );

  makeBox(
    ctx,
    `${prefix}_seal_right`,
    seal.sideWidth,
    cfg.doorHeight+seal.verticalExtra,
    seal.depth,
    centerX+cfg.doorWidth*.5-seal.sideWidth*.5,
    cfg.doorHeight*.5,
    z,
    wallColor
  );

  makeBox(
    ctx,
    `${prefix}_seal_top`,
    cfg.doorWidth,
    seal.topHeight,
    seal.depth,
    centerX,
    cfg.doorHeight-seal.topHeight*.5,
    z,
    wallColor
  );
}

function buildFacadeDecoration(ctx,materials){
  const THREE=ctx.THREE;
  const cfg=CASINO_BUILDING_CONFIG;
  const facade=CASINO_FACADE_CONFIG;
  const halfW=cfg.roomWidth/2;

  const innerLeft=
    cfg.leftRoomCenterX+halfW;

  const innerRight=
    cfg.rightRoomCenterX-halfW;

  const centerGapWidth=
    Math.max(.1,innerRight-innerLeft);

  makeBox(
    ctx,
    "central_facade_body",
    centerGapWidth,
    cfg.roomHeight,
    .76,
    0,
    cfg.roomHeight/2,
    cfg.frontZ-.03,
    facade.wallColor
  );

  for(const side of [
    {
      key:"casino",
      centerX:cfg.leftRoomCenterX,
      material:materials.casinoWall
    },
    {
      key:"pub",
      centerX:cfg.rightRoomCenterX,
      material:materials.pubWall
    }
  ]){
    makeRoundedPanel(
      ctx,
      `${side.key}_facade_cornice_shadow`,
      cfg.roomWidth+.55,
      .26,
      1.14,
      .08,
      side.centerX,
      facade.topY+.18,
      cfg.frontZ+.20,
      side.material
    );

    makeRoundedPanel(
      ctx,
      `${side.key}_facade_main_cornice`,
      cfg.roomWidth+.28,
      .48,
      .92,
      .08,
      side.centerX,
      facade.topY-.18,
      cfg.frontZ+.15,
      side.material
    );

    makeRoundedPanel(
      ctx,
      `${side.key}_facade_cornice_lower_band`,
      cfg.roomWidth,
      .20,
      .70,
      .06,
      side.centerX,
      facade.topY-.52,
      cfg.frontZ+.10,
      side.material
    );
  }

  for(const [name,x,material] of [
    [
      "casino_inner_pilaster",
      innerLeft,
      materials.casinoWall
    ],
    [
      "pub_inner_pilaster",
      innerRight,
      materials.pubWall
    ],
    [
      "casino_outer_pilaster",
      cfg.leftRoomCenterX-halfW,
      materials.casinoWall
    ],
    [
      "pub_outer_pilaster",
      cfg.rightRoomCenterX+halfW,
      materials.pubWall
    ]
  ]){
    const shaft=new THREE.Mesh(
      new THREE.CylinderGeometry(
        .42,
        .42,
        cfg.roomHeight-.35,
        22
      ),
      material
    );

    shaft.name=name;
    shaft.position.set(
      x,
      (cfg.roomHeight-.35)/2,
      cfg.frontZ+.23
    );
    shaft.castShadow=false;
    shaft.receiveShadow=true;
    ctx.scene.add(shaft);

    makeRoundedPanel(
      ctx,
      `${name}_cap`,
      1.10,
      .38,
      .94,
      .15,
      x,
      cfg.roomHeight-.25,
      cfg.frontZ+.27,
      material
    );

    makeRoundedPanel(
      ctx,
      `${name}_base`,
      .94,
      .48,
      .88,
      .14,
      x,
      .24,
      cfg.frontZ+.26,
      material
    );
  }
}

export function buildCasinoGeometry(ctx){
  const cfg=CASINO_BUILDING_CONFIG;
  const style=CASINO_ROOM_STYLE;

  const materials=createFacadeMaterials(ctx);
  const floor=createCasinoFloor(ctx);

  buildRoomShell(
    ctx,
    "left_room",
    cfg.leftRoomCenterX,
    style.casinoColor
  );

  buildRoomShell(
    ctx,
    "right_room",
    cfg.rightRoomCenterX,
    style.pubColor
  );

  for(const staleName of CASINO_STALE_GEOMETRY_NAMES){
    const stale=ctx.scene.getObjectByName(staleName);
    if(stale) ctx.scene.remove(stale);
  }

  const outerX=
    cfg.rightRoomCenterX+
    cfg.roomWidth/2;

  makeRoundedOuterCorner(
    ctx,
    "left_shop_outer_front_round_corner",
    -outerX,
    cfg.frontZ
  );

  makeRoundedOuterCorner(
    ctx,
    "left_shop_outer_back_round_corner",
    -outerX,
    cfg.backZ
  );

  makeRoundedOuterCorner(
    ctx,
    "right_shop_outer_front_round_corner",
    outerX,
    cfg.frontZ
  );

  makeRoundedOuterCorner(
    ctx,
    "right_shop_outer_back_round_corner",
    outerX,
    cfg.backZ
  );

  const slotSplitX=
    cfg.leftRoomCenterX+
    style.slotSplitOffsetX;

  makeBox(
    ctx,
    "slot_split_wall",
    cfg.wallThickness,
    cfg.roomHeight,
    cfg.frontZ-cfg.backZ,
    slotSplitX,
    cfg.roomHeight*.5,
    (cfg.frontZ+cfg.backZ)*.5,
    style.casinoColor
  );

  ctx.createPointLight(
    ctx.scene,
    style.slotLight
  );

  makeRoomFacade(
    ctx,
    "left_room",
    cfg.leftRoomCenterX,
    style.casinoColor,
    cfg.leftDoorOffsetX,
    materials.casinoWall
  );

  makeRoomFacade(
    ctx,
    "right_room",
    cfg.rightRoomCenterX,
    style.pubColor,
    0,
    materials.pubWall
  );

  const leftDoorX=
    cfg.leftRoomCenterX+
    cfg.leftDoorOffsetX;

  addDoorGapSeals(
    ctx,
    "casino_door",
    leftDoorX,
    style.casinoColor
  );

  addDoorGapSeals(
    ctx,
    "pub_door",
    cfg.rightRoomCenterX,
    style.pubColor
  );

  buildFacadeDecoration(ctx,materials);

  CASINO_FLOOR_TEXTURE=floor.texture;
  CASINO_FLOOR_MATERIAL=floor.material;
  CASINO_FACADE_MATERIALS=materials;
  CASINO_LEFT_DOOR_X=leftDoorX;

  CASINO_WORLD={
    floorTexture:floor.texture,
    floorMaterial:floor.material,
    floorEdit:floor.floorEdit,
    facadeMaterials:materials,
    leftDoorX
  };

  return CASINO_WORLD;
}
