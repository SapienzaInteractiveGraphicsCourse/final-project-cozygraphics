export const ROAD_CONFIG={
  roadsideGrassScale:0.60,

  uShape:{
    x:88,
    frontZ:35,
    backZ:-30,
    radius:30,
    arcK:0.5522847498
  },

  lane:{
    halfWidth:11,
    y:0.035,
    segments:260,
    tileSize:5
  },

  sidewalk:{
    shopInnerOffset:-11,
    shopOuterOffset:-19,
    shopY:0.058,

    gardenInnerOffset:11,
    gardenOuterOffset:24,
    gardenY:0.025,

    segments:260,
    tileSize:5
  },

  curb:{
    shopOffset:-11,
    gardenOffset:11,
    y:0.072,
    width:0.18,
    segments:640,
    color:0x8d8d88,
    roughness:0.9
  },

  outerLine:{
    color:0xf2f0e7,
    roughness:0.78,
    shopOffset:-10.55,
    beachOffset:10.55,
    y:0.079,
    width:0.22,
    segments:320
  },

  marking:{
    color:0xf2f0e7,
    roughness:0.78,
    dashCount:28,
    dashLengthT:0.0105,
    dashWidth:0.34,
    dashY:0.061,
    dashSegments:10
  },

  crosswalk:{
    centerX:0,
    stripeLength:14.4,
    stripeDepth:1.70,
    stripeGap:1.90,
    totalDepth:25.2,
    y:0.064,
    wornSeedBase:53
  },

  buildingSidewalks:{
    innerFrontZ:16,
    mainY:0.055,
    externalY:0.056,
    uInnerEdgeInset:19,
    curveInnerAdjustment:0.5,
    tileSize:5
  },

  extension:{
    length:400,
    roadWidth:22,
    shopSidewalkOffset:15,
    shopSidewalkWidth:8,
    shopPlazaWidth:50,
    gardenSidewalkOffset:17.5,
    gardenSidewalkWidth:13,
    innerLineOffset:10.55,
    outerLineOffset:10.55,
    lineWidth:0.22,
    roadY:0.037,
    sidewalkY:0.060,
    plazaY:0.057,
    lineY:0.081,
    dashStart:5,
    dashStep:10,
    dashWidth:0.34,
    dashLength:4.8,
    dashY:0.064
  },

  textures:{
    asphalt:"../assets/textures/asp.jpg"
  }
};
