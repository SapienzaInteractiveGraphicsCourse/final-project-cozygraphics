import {ROAD_CONFIG} from "../config/road.config.js";

export function buildInfiniteRoadOptical(infiniteRoad){
  if(!infiniteRoad) return;
  infiniteRoad.built=true;
}

export function removeInfiniteRoadBlackBlockers(scene,lightCollision){
  if(!scene) return;

  const doomed=[];

  scene.traverse(object=>{
    const name=String(object?.name||"").toLowerCase();

    if(
      name.includes("infinite_road_limit")||
      name.includes("road_end_black")||
      name.includes("road_black_wall")||
      name.includes("infinite_black")||
      name.includes("road_void")||
      name.includes("black_road")
    ){
      doomed.push(object);
    }
  });

  for(const object of doomed){
    object.visible=false;
    object.parent?.remove(object);
  }

  if(lightCollision){
    lightCollision.static=lightCollision.static.filter(collider=>{
      const name=String(collider?.name||"").toLowerCase();
      return !name.includes("infinite_road_limit");
    });
  }
}

export function hideRoadsideGrassStrips(scene){
  if(!scene) return;

  scene.traverse(object=>{
    if(!object) return;

    const name=String(object.name||"").toLowerCase();

    const isGrass=
      name.includes("grass")||
      name.includes("green_strip");

    if(isGrass&&object.scale){
      object.scale.multiplyScalar(ROAD_CONFIG.roadsideGrassScale);
      object.updateMatrixWorld?.(true);
    }

    const isRoadsideStrip=
      name.includes("strip")||
      name.includes("roadside")||
      name.includes("sidewalk_edge")||
      name.includes("extension");

    const isGarden=name.includes("garden");

    if(isGrass&&isRoadsideStrip&&!isGarden){
      object.visible=false;
    }
  });
}
