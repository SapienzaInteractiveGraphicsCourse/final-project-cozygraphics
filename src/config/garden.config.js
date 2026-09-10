// src/config/garden.config.js
// Garden configuration — STEP 1.
// Only configuration/data lives here. No scene objects, loaders or collisions.

export const GARDEN_DESIGN_AXIS = {
  x: 0,
  gateZ: 56.90,
  gateOpeningWidth: 14.40
};

export const GARDEN_PAVEMENT_PERIMETER = {
  xMin: -42.450,
  xMax: 48.450,
  zMin: 58.44,
  zMax: 128.53
};

export const DISPLAY_CASE_DARK_BASE = {
  height: 0.51,
  insetX: 0.04,
  insetZ: 0.04,
  color: 0x4a2d1f
};

export const STATIC_GARDEN_PALM_LAYOUT = [
  { x: -66.000, z: 70.000,  y: 0.025, rotY:  0.18, scale: 1.00 },
  { x:  72.000, z: 74.000,  y: 0.025, rotY: -0.22, scale: 1.00 },
  { x: -67.500, z: 101.000, y: 0.025, rotY:  0.42, scale: 1.00 },
  { x:  73.500, z: 108.000, y: 0.025, rotY: -0.38, scale: 1.00 },
  { x: -67.000, z: 139.000, y: 0.025, rotY:  0.12, scale: 1.00 },
  { x:  72.500, z: 143.000, y: 0.025, rotY: -0.16, scale: 1.00 }
];

// STEP 4 — additional static Garden configuration
export const GARDEN_WIDTH_COMPRESSION={
  oldLeft:-47.500,
  oldRight:53.500,
  newLeft:-42.450,
  newRight:48.450,
  centerX:3.000,
  factor:.90
};

export const MUSEUM_CLOTH_WORLD_VALUES={
  garden_abstract_1_display_case:{
    position:[-29.100,2.142,115.378],
    rotation:[0.0,0.0,0.0],
    scale:[0.600,0.550,0.600]
  },
  garden_abstract_2_display_case:{
    position:[-29.100,2.090,101.279],
    rotation:[0.0,0.0,0.0],
    scale:[0.600,0.577,0.600]
  },
  garden_meteorite_display_case:{
    position:[31.601,2.164,101.276],
    rotation:[0.0,0.0,0.0],
    scale:[0.600,0.495,0.600]
  }
};

export const MUSEUM_ART_WORLD_VALUES={
  garden_meteorite_display_case:{
    position:[31.586,2.453,101.290],
    rotation:[0.0,0.0,0.0],
    scale:[0.169,0.174,0.174]
  },
  garden_abstract_1_display_case:{
    position:[-29.100,2.252,115.338],
    rotation:[0.0,0.0,0.0],
    scale:[2.661,2.661,2.661]
  },
  garden_abstract_2_display_case:{
    position:[-29.100,2.611,101.307],
    rotation:[0.0,38.0,0.0],
    scale:[0.140,0.140,0.140]
  }
};

export const MUSEUM_PANEL_WORLD_VALUES={
  // APPROVED LEFT EXHIBITIONS
  abstract1:{position:[-28.750,0.120,118.428],rotation:[0.0,90.0,0.0]},
  abstract2:{position:[-28.750,0.120,104.328],rotation:[0.0,90.0,0.0]},

  // RIGHT SIDE UNCHANGED
  meteorite:{position:[30.600,0.120,104.228],rotation:[0.0,-90.0,0.0]},
  telescope:{position:[30.600,0.120,118.328],rotation:[0.0,-90.0,0.0]}
};

export const GARDEN_FEATURE_ASSETS={
  stone:[],
  fountain:[
    "./assets/models/fountain.glb",
    
    "./assets/models/fountain.glb",
    "./assets/models/fountain.glb"
  ]
};

export const MUSEUM_ALIGNMENT={
  step:.10,
  leftX:-29.100,
  rightX:31.600,
  leftCenterZ:108.328,
  rightCenterZ:108.328,
  spacingZ:14.100,
  caseY:1.730,
  sharedYaw:0
};

export const MUSEUM_CLOTH_PAIR_EDIT={
  step:.05,
  pos:{x:0,y:0,z:0},
  rot:{x:0,y:0,z:0},
  scale:{x:1,y:1,z:1}
};

export const MUSEUM_CLOTH_EDIT={
  step:.05,
  selected:"abstract2",
  all:{
    pos:{x:0,y:0,z:0},
    rot:{x:0,y:0,z:0},
    scale:{x:1,y:1,z:1}
  },
  items:{
    garden_abstract_1_display_case:{
      pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}
    },
    garden_abstract_2_display_case:{
      pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0},scale:{x:1,y:1.050,z:1}
    },
    garden_meteorite_display_case:{
      pos:{x:0,y:0,z:0},rot:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}
    }
  }
};

export const LEFT_PAIR_COORDINATED_EDITOR={
  step:.10
};
