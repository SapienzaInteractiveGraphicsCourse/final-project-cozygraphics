export const CASINO_BUILDING_CONFIG={
  roadWidth:66,
  roadDepth:20,
  sidewalkWidth:66,
  sidewalkDepth:4.2,
  buildingWidth:76,
  buildingDepth:40,
  buildingHeight:9.2,
  roomWidth:31.5,
  roomDepth:38,
  roomHeight:8.4,
  wallThickness:.55,
  frontZ:3.0,
  backZ:-35.0,
  roomCenterZ:-16.0,
  leftRoomCenterX:-22.0,
  rightRoomCenterX:22.0,
  thirdRoomCenterX:22.0,
  doorWidth:6.65,
  doorHeight:6.32,
  doorThickness:.34,
  doorZ:3.36,
  leftDoorOffsetX:1.6
};

export const CASINO_FLOOR_CONFIG={
  texture:"./assets/textures/floor.png",
  repeatX:5.5,
  repeatZ:7.0,
  color:0x28496C,
  thresholdColor:0x284f78,
  roughness:.82,
  metalness:.01,
  y:.145,
  edit:{
    left:2.30,
    right:0.00,
    front:7.40,
    back:0.00
  },
  threshold:{
    name:"casino_blue_threshold",
    width:25.98,
    depth:.95,
    x:-23.20,
    y:.149,
    z:2.98
  }
};

export const CASINO_ROOM_STYLE={
  casinoColor:0x120018,
  pubColor:0x09090c,
  outerCornerColor:0x5b3f2e,
  outerCornerRadius:.58,
  slotSplitOffsetX:-11.0,
  slotLight:{
    name:"slot_small_room_light",
    color:0xffd8ff,
    intensity:1.1,
    distance:18,
    position:[-6.6,-0.04704246916615602,-19.25]
  }
};

export const CASINO_FACADE_CONFIG={
  topY:9.25,
  wallColor:0x120018,
  stoneColor:0x3b2442,
  trimColor:0x16091d,
  materials:{
    casinoWall:{color:0x120018,roughness:.96},
    pubWall:{color:0x09090c,roughness:.97},
    darkStone:{color:0x16091d,roughness:.94,metalness:.01},
    warmStone:{color:0x38203f,roughness:.94},
    brass:{color:0x321b39,roughness:.76,metalness:.08},
    blackMetal:{color:0x111216,roughness:.34,metalness:.68},
    casinoGlass:{
      color:0x24102f,
      emissive:0x5e1675,
      emissiveIntensity:.38,
      roughness:.18,
      metalness:.08,
      transparent:true,
      opacity:.88
    },
    pubGlass:{
      color:0x24160e,
      emissive:0x8a421c,
      emissiveIntensity:.22,
      roughness:.22,
      transparent:true,
      opacity:.90
    }
  }
};

export const CASINO_DOOR_SEAL_CONFIG={
  zOffset:-.08,
  sideWidth:.24,
  depth:.58,
  verticalExtra:.22,
  topHeight:.22
};

export const CASINO_STALE_GEOMETRY_NAMES=[
  "casino_inner_purple_wall_closure",
  "casino_inner_single_purple_wall",
  "casino_existing_wall_gap_fill"
];
