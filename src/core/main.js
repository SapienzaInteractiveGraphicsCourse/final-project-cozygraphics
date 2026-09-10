import { clearPlayerControlledMovementKeys } from "./inputFallback.js";
import "../ui/runtime/playerPositionHud.js";
import "../ui/runtime/clawMachineTuner.js";
import "../ui/runtime/startupDecor.js";
import "../ui/runtime/hideDebugPanels.js";
import { uiNode, uiEditorButton } from "../ui/dom.js";
import { lerpAngle, normalizeAngle } from "../utils/angles.js";
import { collectGLBStrings } from "../utils/glb.js";

/* ===== module ===== */










import {
  initRoadCore as roadInitCore,
  buildRoadMarkings as roadBuildRoadMarkings,
  buildInfiniteRoadOptical as roadBuildInfiniteRoadOptical,
  removeInfiniteRoadBlackBlockers as roadRemoveInfiniteRoadBlackBlockers,
  hideRoadsideGrassStrips as roadHideRoadsideGrassStrips,
  crosswalkOffsets as roadCrosswalkOffsets,
  buildRoadExtensions as roadBuildRoadExtensions,
  buildBuildingConnectedSidewalks as roadBuildBuildingConnectedSidewalks,
  buildOuterContinuousRoadLines as roadBuildOuterContinuousRoadLines
} from "../world/Road.js";
import * as RoadBuilders from "../world/Road.js";
import * as CasinoBuilders from "../world/Casino.js";
import * as ClawMachineBuilders from "../world/ClawMachine.js";
import {
  createGlobalLights,
  createFixedLightPool,
  refreshFixedLightSources,
  updateFixedLightPool,
  addLampGlow,
  createPointLight,
  createZeroPointLightPair,
  refreshPerformanceLightCache,
  createCameraFillLight,
  updateCameraFillLight,
  createLightingTuningController,
  disableOldLocalLightsKeepMoon,
  createProceduralGardenTreeShadowSystem,
  createPlayerGardenBlobShadowSystem
} from "../systems/LightingSystem.js";
import {
  drawMinimap as renderMinimap
} from "../ui/Minimap.js";
import { mergeGeometries } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js";

import * as THREE from "three";

const PROJECT_ROOT_URL=new URL("./",document.baseURI);

THREE.DefaultLoadingManager.setURLModifier((url)=>{
  try{
    const raw=String(url||"");

    const relativeAssetMatch=raw.match(
      /^(?:(?:\.\.\/)+|\.\/|\/)?assets\/(.+)$/
    );

    if(relativeAssetMatch){
      return new URL(
        `assets/${relativeAssetMatch[1]}`,
        PROJECT_ROOT_URL
      ).href;
    }

    if(/^https?:\/\//i.test(raw)){
      const parsed=new URL(raw);

      if(
        parsed.origin===location.origin &&
        parsed.pathname.startsWith("/assets/")
      ){
        return new URL(
          `assets/${parsed.pathname.slice("/assets/".length)}${parsed.search}${parsed.hash}`,
          PROJECT_ROOT_URL
        ).href;
      }
    }
  }catch(error){
    console.warn("Asset URL resolver:",error);
  }

  return url;
});

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { Player } from "../classes/Player.js";
import { NPC } from "../classes/NPC.js";
import { CHARACTER_CONFIGS,
  NPC_ORDER } from "../config/characters.config.js";
import {
  GARDEN_DESIGN_AXIS,
  GARDEN_PAVEMENT_PERIMETER,
  STATIC_GARDEN_PALM_LAYOUT,
  GARDEN_FEATURE_ASSETS,
} from "../config/garden.config.js";
import {
  CASINO_BUILDING_CONFIG,
  CASINO_MODEL_CONFIG
} from "../config/casino.config.js";
import * as GardenBuilders from "../world/Garden.js";
import * as MuseumBuilders from "../world/Museum.js";
import * as EnvironmentBuilders from "../world/Environment.js";
import * as TelescopeSystem from "../world/Telescope.js";
import {
  createCollisionState,
  GARDEN_COLLISION_EDITOR_REGISTRY,
  DEFINITIVE_GARDEN_TREE_COLLISIONS,
  makeBoxCollider,
  makeCylinderCollider,
  getColliderBounds,
  addObjectBoxCollider,
  circleBoxOverlap,
  circleRoundedBoxOverlap,
  playerCylinderVsStaticCollider,
  rememberGardenCollision,
  removeGardenCollisionPrefix,
  addGardenCylinderCollision,
  addGardenBoxCollision,
  addGardenPanelCollision,
  buildEditableFenceCollisions,
  syncCharacterCollisions,
  syncCarCollisions,
  dynamicCollisionBlockedAt,
  updateDynamicCarCollisions,
  buildBarricadeCollisions,
  rebuildShopFrontLampCollisionData,
  rebuildDefinitiveGardenTreeCollisionData,
  refreshGardenGatewayPostCollisionData,
  buildGardenBoundaryFenceCollisions,
  buildGardenFlowerFenceCollisions,
  rebuildPlayerCylinderCollision,
  ensurePlayerCylinderCollision,
  staticCollisionBlockedAt,
  collisionBlockedAt,
  resolvePlayerCollisionMovement,
  removeObjectCollision,
  rebuildGardenGateLeafCollisionData,
  buildImportantGardenPropCollisions,
  syncDynamicDoorCollisions,
  solveCharacterFloorContact,
  makeEllipseCollider,
  buildCoreArchitectureCollisions,
  rebuildArchitecturalDoorCollisionData,
  rebuildCasinoEditableColliderData,
  PLAYER_CYLINDER_COLLIDER,
  GARDEN_GATE_COLLISION_FIXED,
  CASINO_WALL_COLLIDER_EDIT,
  CASINO_COLLIDER_EDIT,
  CAR_COLLISION_EDIT
} from "../systems/CollisionSystem.js?v=pass8";

function drawMinimap(){
  renderMinimap({
    minimapCtx,
    minimap,
    player,
    camera,
    uRoadCurve,
    crosswalkOffsets,
    CROSSWALK,
    GARDEN_TREE_DECOR:
      typeof GARDEN_TREE_DECOR!=="undefined"?GARDEN_TREE_DECOR:null,
    GARDEN_DESIGN_AXIS:
      typeof GARDEN_DESIGN_AXIS!=="undefined"?GARDEN_DESIGN_AXIS:null,
    GARDEN_FEATURES:
      typeof GARDEN_FEATURES!=="undefined"?GARDEN_FEATURES:null,
    GAME_SETTINGS,
    QUEST,
    questGetPolice:
      typeof questGetPolice==="function"?questGetPolice:null,
    COLLECTIBLES:
      typeof COLLECTIBLES!=="undefined"?COLLECTIBLES:null,
    STOREKEEPER_FINAL:
      typeof STOREKEEPER_FINAL!=="undefined"?STOREKEEPER_FINAL:null,
    SCENE_ENV_CONFIG,
    currentZoneLabel,
    getPlayerMapZone,
    npcs:
      typeof npcs!=="undefined"?npcs:null,
    TASK_BOUNDARY:
      typeof TASK_BOUNDARY!=="undefined"?TASK_BOUNDARY:null,
    GATE_PART_EDITORS:
      typeof GATE_PART_EDITORS!=="undefined"?GATE_PART_EDITORS:null,
    COASTAL_ASSETS:
      typeof COASTAL_ASSETS!=="undefined"?COASTAL_ASSETS:null
  });
}
let initVehicleSystem=null;
let updateVehicles=null;
let VEHICLE_SYSTEM_LOADED=false;
try{
  const vehicleModule=await import("../systems/VehicleSystem.js");
  if(
    typeof vehicleModule.initVehicleSystem!=="function" ||
    typeof vehicleModule.updateVehicles!=="function"
  ){
    throw new Error(
      "VehicleSystem.js caricato, ma mancano initVehicleSystem() o updateVehicles()."
    );
  }
  initVehicleSystem=vehicleModule.initVehicleSystem;
  updateVehicles=vehicleModule.updateVehicles;
  VEHICLE_SYSTEM_LOADED=true;
}catch(error){
}
let editableFenceSystem=null;
let editableTikiBar=null;
let editableMan=null;
let editableWoman=null;
let editableBaristaWoman=null;
const ui=null;
const dialogue=document.getElementById("dialogue");
const dialogueName=document.getElementById("dialogueName");
const dialogueBody=document.getElementById("dialogueBody");
const dialogueActionHint=document.getElementById("dialogueActionHint");
const sceneFade=document.getElementById("sceneFade");
const zoneTitle=document.getElementById("zoneTitle");
const minimap=document.getElementById("minimap");
const minimapCtx=minimap.getContext("2d");
const currentZoneLabel=document.getElementById("currentZone");
const doorPrompt=document.getElementById("doorPrompt");
const slotPrompt=document.getElementById("slotPrompt");
const pickupPrompt=document.getElementById("pickupPrompt");
const inventoryOverlay=document.getElementById("inventoryOverlay");
const inventoryGrid=document.getElementById("inventoryGrid");
const loadingScreen=document.getElementById("loadingScreen");
const loadingBar=document.getElementById("loadingBar");
const loadingText=document.getElementById("loadingText");
const loadingPercent=document.getElementById("loadingPercent");
const scene=new THREE.Scene();
const LIGHTING_GLOBAL=createGlobalLights(scene);
const moonLight=LIGHTING_GLOBAL.moonLight;
moonLight.castShadow=true;
const ambientFill=LIGHTING_GLOBAL.ambientFill;
const skyFill=LIGHTING_GLOBAL.skyFill;
const FIXED_LIGHT_POOL=createFixedLightPool(scene,{
  count:3,
  color:0xffe2b8,
  distance:18,
  decay:2,
  sourceRefreshStep:3.0,
  updateStep:.25,
  outsideMaxDistance:58
});
const CAMERA_FILL_LIGHT=createCameraFillLight(scene);
const COASTAL_ASSETS={
  palms:[]
};
const EVENT_GIRL={
  root:null,
  bones:{},
  rest:new Map(),
  ready:false,
  phase:0,
  direction:1,
  t:.39,
  minT:.34,
  maxT:.66,
  speed:.014,
  sidewalkOffset:15.1,
  baseY:.070,
  heightMatched:false
};
function syncGirlHeightToPlayer(){
  if(
    !EVENT_GIRL.ready ||
    !EVENT_GIRL.root ||
    !player?.model ||
    !player?.ready
  ){
    return false;
  }
  const girl=EVENT_GIRL.root;
  player.model.updateMatrixWorld(true);
  girl.updateMatrixWorld(true);
  const playerBox=
    new THREE.Box3().setFromObject(player.model);
  const girlBox=
    new THREE.Box3().setFromObject(girl);
  const playerHeight=
    playerBox.getSize(new THREE.Vector3()).y;
  const girlHeight=
    girlBox.getSize(new THREE.Vector3()).y;
  if(
    !Number.isFinite(playerHeight) ||
    !Number.isFinite(girlHeight) ||
    playerHeight<=.01 ||
    girlHeight<=.01
  ){
    return false;
  }
  const ratio=playerHeight/girlHeight;
  girl.scale.multiplyScalar(ratio);
  girl.updateMatrixWorld(true);
  const finalBox=
    new THREE.Box3().setFromObject(girl);
  girl.position.y+=
    EVENT_GIRL.baseY-
    finalBox.min.y;
  EVENT_GIRL.heightMatched=true;
  return true;
}
const GARDEN_RUNTIME=GardenBuilders.initGardenRuntimeState(
  THREE,
  scene
);
const CEREMONY_GARDEN=GARDEN_RUNTIME.CEREMONY_GARDEN;
const GARDEN_ALIGNMENT=GARDEN_RUNTIME.GARDEN_ALIGNMENT;
const FLOWER_EXHIBITS=GARDEN_RUNTIME.FLOWER_EXHIBITS;
const GARDEN_OUTER_GREEN=GARDEN_RUNTIME.GARDEN_OUTER_GREEN;
const GARDEN_CONCRETE_STYLE=GARDEN_RUNTIME.GARDEN_CONCRETE_STYLE;
const GARDEN_SIDE_GRASS_FILL=GARDEN_RUNTIME.GARDEN_SIDE_GRASS_FILL;
const GARDEN_SEAM_FIX=GARDEN_RUNTIME.GARDEN_SEAM_FIX;
const GARDEN_MUSEUM=GARDEN_RUNTIME.GARDEN_MUSEUM;
const MUSEUM_PURPLE_CLOTH=GARDEN_RUNTIME.MUSEUM_PURPLE_CLOTH;
const GARDEN_FEATURES=GARDEN_RUNTIME.GARDEN_FEATURES;
const TELESCOPE_MODE=GARDEN_RUNTIME.TELESCOPE_MODE;
const NEW_TELESCOPE=GARDEN_RUNTIME.NEW_TELESCOPE;
const GARDEN_BOUNDARY_FENCE=GARDEN_RUNTIME.GARDEN_BOUNDARY_FENCE;
const GARDEN_WIDTH_RUNTIME=GARDEN_RUNTIME.GARDEN_WIDTH_RUNTIME;
const GARDEN_FLOWER_ZONE_FENCES=GARDEN_RUNTIME.GARDEN_FLOWER_ZONE_FENCES;
const GARDEN_FLOWER_FENCE_EDIT=GARDEN_RUNTIME.GARDEN_FLOWER_FENCE_EDIT;
const GARDEN_REAL_FLOWERS=GARDEN_RUNTIME.GARDEN_REAL_FLOWERS;
const GARDEN_TREE_DECOR=GARDEN_RUNTIME.GARDEN_TREE_DECOR;
const GARDEN_EXHIBITION_LAMPS=GARDEN_RUNTIME.GARDEN_EXHIBITION_LAMPS;
const GARDEN_FRONT_CONCRETE_STRIP=GARDEN_RUNTIME.GARDEN_FRONT_CONCRETE_STRIP || GardenBuilders.GARDEN_FRONT_CONCRETE_STRIP;
CEREMONY_GARDEN.group.name="ceremony_garden_decor";
scene.add(CEREMONY_GARDEN.group);

function handleGardenFeatureLoadError(err){
  console.error("fountain.glb load error",err);
}
function getGardenBuilderContext(){
  return {
    get CEREMONY_GARDEN(){ return CEREMONY_GARDEN; },
    get COASTAL_ASSETS(){ return COASTAL_ASSETS; },
    get FLOWER_EXHIBITS(){ return FLOWER_EXHIBITS; },
    get GARDEN_ALIGNMENT(){ return GARDEN_ALIGNMENT; },
    get GARDEN_BOUNDARY_FENCE(){ return GARDEN_BOUNDARY_FENCE; },
    get GARDEN_CONCRETE_STYLE(){ return GARDEN_CONCRETE_STYLE; },
    get GARDEN_FEATURES(){ return GARDEN_FEATURES; },
    get GARDEN_FLOWER_FENCE_EDIT(){ return GARDEN_FLOWER_FENCE_EDIT; },
    get GARDEN_FLOWER_ZONE_FENCES(){ return GARDEN_FLOWER_ZONE_FENCES; },
    get GARDEN_MUSEUM(){ return GARDEN_MUSEUM; },
    get GARDEN_OUTER_GREEN(){ return GARDEN_OUTER_GREEN; },
    get GARDEN_PAVEMENT_EDITOR(){ return GARDEN_PAVEMENT_EDITOR; },
    get GARDEN_REAL_FLOWERS(){ return GARDEN_REAL_FLOWERS; },
    get GARDEN_SIDE_GRASS_FILL(){ return GARDEN_SIDE_GRASS_FILL; },
    get GARDEN_TREE_DECOR(){ return GARDEN_TREE_DECOR; },
    get GARDEN_WIDTH_RUNTIME(){ return GARDEN_WIDTH_RUNTIME; },
    get MUSEUM_PURPLE_CLOTH(){ return MUSEUM_PURPLE_CLOTH; },
    get NEW_TELESCOPE(){ return NEW_TELESCOPE; },
    get TASK_BOUNDARY(){ return TASK_BOUNDARY; },
    get TELESCOPE_MODE(){ return TELESCOPE_MODE; },
    get THREE(){ return THREE; },
    get applyMuseumGermanAlignment(){ return applyMuseumGermanAlignment; },
    get centerOriginalRoseFencesInsideBeds(){ return centerOriginalRoseFencesInsideBeds; },
    get cloneMaterials(){ return cloneMaterials; },
    get compressGardenX(){ return (...args)=>gardenBuild("compressGardenX",...args); },
    get flowerFenceIsHorizontal(){ return flowerFenceIsHorizontal; },
    get flowerFenceSegmentEnds(){ return flowerFenceSegmentEnds; },
    get garden(){ return garden; },
    get gardenFenceSource(){ return GardenBuilders.gardenFenceSource; },
    get gardenTreeTint(){ return (...args)=>gardenBuild("gardenTreeTint",...args); },
    get lcBuildGardenBoundaryFence(){ return lcBuildGardenBoundaryFence; },
    get lcBuildGardenFlowerZoneFences(){ return lcBuildGardenFlowerZoneFences; },
    get loadGLBFromCandidates(){ return loadGLBFromCandidates; },
    get maxPerfBuildInstancedGLB(){ return maxPerfBuildInstancedGLB; },
    get maxPerfFreeze(){ return maxPerfFreeze; },
    get maxPerfRootLocalBounds(){ return maxPerfRootLocalBounds; },
    get mergeGeometries(){ return mergeGeometries; },
    get museumPart(){ return museumPart; },
    get museumPrefixParts(){ return museumPrefixParts; },
    get refreshGardenFlowerFenceEditor(){ return refreshGardenFlowerFenceEditor; },
    get refreshGardenObjectCollisions(){ return refreshGardenObjectCollisions; },
    get refreshIndependentRoseFenceEditors(){ return refreshIndependentRoseFenceEditors; },
    get roseFenceEditorState(){ return roseFenceEditorState; },
    get scene(){ return scene; },
    get CEREMONIAL_GATE_POSTS(){ return CEREMONIAL_GATE_POSTS; },
    get refreshCeremonialGatePostEditors(){ return refreshCeremonialGatePostEditors; },
    get uiEditorButton(){ return uiEditorButton; },
    get uiNode(){ return uiNode; },
    get unifiedSidewalkMat(){ return unifiedSidewalkMat; },
    get refreshGardenPerimeterEditor(){ return refreshGardenPerimeterEditor; },
    get LEFT_ROSE_GROUP_MIRROR(){ return LEFT_ROSE_GROUP_MIRROR; },
    get RIGHT_ROSE_GROUP_EDITOR(){ return RIGHT_ROSE_GROUP_EDITOR; },
    get activeWorldZone(){ return activeWorldZone; },
    get centerModelXZ(){ return centerModelXZ; },
    get makeCylinderBetween(){ return makeCylinderBetween; },
    get player(){ return player; },
    get positionGardenPalmsOutsidePavement(){ return (...args)=>gardenBuild("positionGardenPalmsOutsidePavement",...args); },
    get putModelOnFloor(){ return putModelOnFloor; },
    get refreshGardenPalmEditor(){ return refreshGardenPalmEditor; },
    get refreshRightRoseGroupEditor(){ return refreshRightRoseGroupEditor; },
    get fitModelToHeight(){ return fitModelToHeight; },
    get GARDEN_EXHIBITION_LAMPS(){ return GARDEN_EXHIBITION_LAMPS; },
    get addLampGlow(){ return addLampGlow; },
    get enforceCenteredMuseumCasesAndBases(){ return enforceCenteredMuseumCasesAndBases; },
    get getMuseumPanelEditorTargets(){ return getMuseumPanelEditorTargets; },
    get grassMat(){ return grassMat; },
    get outdoorGrassTexture(){ return outdoorGrassTexture; },
    get placeMuseumLabel(){ return placeMuseumLabel; },
    get placeTelescopeLabel(){ return placeTelescopeLabel; },
    get prepareStaticGLB(){ return prepareStaticGLB; },
    get refitMuseumArtwork(){ return refitMuseumArtwork; },
    get refreshAllMuseumPurpleCloths(){ return refreshAllMuseumPurpleCloths; },
    get refreshFixedLightSources(){ return refreshFixedLightSources; },
    get refreshGardenExhibitionLampEditor(){ return refreshGardenExhibitionLampEditor; },
    get refreshMuseumAlignmentEditor(){ return refreshMuseumAlignmentEditor; },
    get refreshTelescopeGLBEditor(){ return ()=>{}; },
    get GATE_PART_EDITORS(){ return GATE_PART_EDITORS; },
    get TELESCOPE_OBSERVATION(){ return TELESCOPE_OBSERVATION; },
    get camera(){ return camera; },
    get initTelescopeObservationUI(){ return initTelescopeObservationUI; },
    get isPlayerNearTelescope(){ return isPlayerNearTelescope; },
    get keys(){ return keys; },
    get museumClothPrefixFromEditorId(){ return museumClothPrefixFromEditorId; },
    get refreshGardenGateLeafCollisions(){ return refreshGardenGateLeafCollisions; },
    get applyApprovedGardenGateLeafTransforms(){ return (...args)=>gardenBuild("applyApprovedGardenGateLeafTransforms",...args); },
    get applyMuseumPanelInitialWorldValues(){ return applyMuseumPanelInitialWorldValues; },
    get commitTelescopeGLBTransform(){ return commitTelescopeGLBTransform; },
    get createMuseumLabel(){ return createMuseumLabel; },
    get createTallTelescopeTripod(){ return createTallTelescopeTripod; },
    get handleGardenFeatureLoadError(){ return handleGardenFeatureLoadError; },
    get handleGardenTelescopeLoadError(){ return err=>console.error("telescope.glb load error",err); },
    get loader(){ return loader; },
    get normalizeGardenFeature(){ return (...args)=>gardenBuild("normalizeGardenFeature",...args); },
    get prepareNewTelescopeModel(){ return prepareNewTelescopeModel; },
    get rebuildGardenWaterRings(){ return (...args)=>gardenBuild("rebuildGardenWaterRings",...args); },
    get refreshGardenGateEditor(){ return ()=>{}; },
    get refreshMuseumPanelEditor(){ return refreshMuseumPanelEditor; },
    get resolveGardenGateLeafs(){ return (...args)=>gardenBuild("resolveGardenGateLeafs",...args); },
    get resolveNearGateBarricades(){ return resolveNearGateBarricades; },
    get syncGardenCenterAxis(){ return (...args)=>gardenBuild("syncGardenCenterAxis",...args); }
};
}

const TELESCOPE_OBSERVATION=TelescopeSystem.observation;

function createTelescopeObservationStars(...args){
  return TelescopeSystem.createObservationStars(...args);
}
function initTelescopeObservationUI(){
  return TelescopeSystem.initUI();
}
function isPlayerNearTelescope(){
  return TelescopeSystem.isNear();
}
function enterTelescopeMode(...args){
  return TelescopeSystem.enter(...args);
}
function exitTelescopeMode(){
  return TelescopeSystem.exit();
}
function updateTelescopeView(...args){
  return TelescopeSystem.updateView(...args);
}
function updateTelescopeInteractionPrompt(){
  return TelescopeSystem.updatePrompt();
}
function telescopeForceMoonInvisible(){
  return TelescopeSystem.forceMoonInvisible();
}

TelescopeSystem.init({
  getGardenContext:()=>getGardenBuilderContext(),
  getMode:()=>TELESCOPE_MODE,
  getScene:()=>scene,
  getCamera:()=>camera,
  getPlayer:()=>player,
  getTelescopeRoot:()=>NEW_TELESCOPE?.root,
  getKeys:()=>keys,
  setCleanCameraReady:value=>{ cleanCameraReady=value; }
});

function getRoadBuilderContext(){
  return {
    get INFINITE_ROAD(){ return INFINITE_ROAD; },
    get LIGHT_COLLISION(){ return typeof LIGHT_COLLISION!=="undefined" ? LIGHT_COLLISION : null; },
    get scene(){ return scene; },
    get player(){ return player; },
    get CROSSWALK(){ return CROSSWALK; },
    get cloneMaterials(){ return cloneMaterials; },
    get roadBuildInfiniteRoadOptical(){ return roadBuildInfiniteRoadOptical; },
    get roadRemoveInfiniteRoadBlackBlockers(){ return roadRemoveInfiniteRoadBlackBlockers; },
    get roadHideRoadsideGrassStrips(){ return roadHideRoadsideGrassStrips; }
  };
}
function setCarBodyColor(...args){
  return RoadBuilders.setCarBodyColor(getRoadBuilderContext(),...args);
}
function isPlayerNearRoad(){
  return RoadBuilders.isPlayerNearRoad(getRoadBuilderContext());
}

const gardenBuild=(name,...args)=>GardenBuilders[name](getGardenBuilderContext(),...args);

function applyGardenConcreteColor(...args){
  return GardenBuilders.applyGardenConcreteColor(getGardenBuilderContext(),...args);
}
Object.assign(GARDEN_PAVEMENT_PERIMETER,{
  xMin:-42.68,
  xMax:48.22,
  zMin:59.93,
  zMax:127.63
});
const GARDEN_PAVEMENT_EDITOR={
  step:.01,
  height:0,
  appliedHeight:0
};

function refreshGardenPerimeterEditor(){
  const read=document.getElementById("gardenPerimeterRead");
  if(!read) return;
  const p=GARDEN_PAVEMENT_PERIMETER;
  const centerX=(p.xMin+p.xMax)*.5;
  const centerZ=(p.zMin+p.zMax)*.5;
  read.textContent=
    `GARDEN FLOOR\n`+
    `centerX=${centerX.toFixed(2)}  centerZ=${centerZ.toFixed(2)}\n`+
    `left=${p.xMin.toFixed(2)}  right=${p.xMax.toFixed(2)}\n`+
    `front=${p.zMin.toFixed(2)}  back=${p.zMax.toFixed(2)}\n\n`+
    `width=${(p.xMax-p.xMin).toFixed(2)}\n`+
    `depth=${(p.zMax-p.zMin).toFixed(2)}\n`+
    `height=${GARDEN_PAVEMENT_EDITOR.height.toFixed(3)}\n`+
    `step=${GARDEN_PAVEMENT_EDITOR.step.toFixed(2)}`;
  const heightInput=document.getElementById("gardenPerimeterHeight");
  if(heightInput && document.activeElement!==heightInput){
    heightInput.value=GARDEN_PAVEMENT_EDITOR.height.toFixed(3);
  }
}

const REFERENCE_LINE={
  center:new THREE.Vector3(-38.5,.12,19.5),
  length:82,
  yaw:0
};
const QUEST={
  stage:"talk_police",
  dialogueActive:false,
  dialogueLines:[],
  dialogueIndex:0,
  dialogueSpeaker:"POLICE",
  dialogueDone:null
};
const QUEST_TASKS={
  talk_police:"Talk to the Police",
  search_clues:"Investigate the Casino",
  return_wallet:"Bring the wallet to the Police",
  find_suspicious:"Go to the garden and investigate",
  call_security:"Call Security with the radio",
  arrest_in_progress:"Police arrest in progress",
  game_complete:"MYSTERY SOLVED"
};
const TASK_BOUNDARY={
  marginBeforeCorner:7.0,
  gate:null,
  gateReady:false,
  lastWarning:0
};
function getTaskBoundaryMessage(){
  const task=(QUEST_TASKS[QUEST.stage] || "current task").trim();
  return `Go back · complete the current task first: ${task}`;
}
function showAttentionWarning(message,duration=1900){
  const now=performance.now();
  if(now-TASK_BOUNDARY.lastWarning<350) return;

  TASK_BOUNDARY.lastWarning=now;

  const box=document.getElementById("taskBoundaryWarning");
  if(!box) return;

  const msg=box.querySelector(".msg");
  if(msg) msg.textContent=message;

  box.classList.add("show");

  clearTimeout(showAttentionWarning._t);
  clearTimeout(showTaskBoundaryWarning._t);

  showAttentionWarning._t=setTimeout(()=>{
    box.classList.remove("show");
  },duration);
}

function showTaskBoundaryWarning(){
  showAttentionWarning(
    getTaskBoundaryMessage(),
    1650
  );
}
const TASK_REFERENCE_LIMITS={
  left:null,
  right:null
};

function isInsideGardenTaskBoundaryExclusion(x,z){
  const p=GARDEN_PAVEMENT_PERIMETER;

  return (
    x>=p.xMin &&
    x<=p.xMax &&
    z>=p.zMin &&
    z<=p.zMax
  );
}
function rebuildTaskReferenceLimitsFromMaster(){
  const center=new THREE.Vector2(
    REFERENCE_LINE.center.x,
    REFERENCE_LINE.center.z
  );
  const half=REFERENCE_LINE.length*.5;
  const a=new THREE.Vector2(
    center.x,
    center.y-half
  );
  const b=new THREE.Vector2(
    center.x,
    center.y+half
  );
  TASK_REFERENCE_LIMITS.left={
    a:a.clone(),
    b:b.clone(),
    center:center.clone()
  };
  const ma=new THREE.Vector2(
    -a.x,
    a.y
  );
  const mb=new THREE.Vector2(
    -b.x,
    b.y
  );
  TASK_REFERENCE_LIMITS.right={
    a:ma,
    b:mb,
    center:ma.clone().add(mb).multiplyScalar(.5)
  };
  rebuildTaskBarrierDebugLines();
}
const TASK_BARRIER_DEBUG={
  group:new THREE.Group(),
  material:new THREE.MeshBasicMaterial({
    color:0xff0000,
    transparent:true,
    opacity:.72,
    depthTest:false,
    depthWrite:false,
    side:THREE.DoubleSide
  })
};
TASK_BARRIER_DEBUG.group.name="task_barrier_debug_lines";
scene.add(TASK_BARRIER_DEBUG.group);
function rebuildTaskBarrierDebugLines(){
  TASK_BARRIER_DEBUG.group.clear();
}
let taskBarrierTurnTarget=null;
function orientPlayerBackFromBarrier(def){
  if(!player?.root || !def?.center) return;
  taskBarrierTurnTarget =
    def.center.x<0
      ? Math.PI/2
      : -Math.PI/2;
}
function updateTaskBarrierSmoothTurn(dt){
  if(
    taskBarrierTurnTarget===null ||
    !player?.root
  ) return;
  let current=player.root.rotation.y;
  let delta=
    THREE.MathUtils.euclideanModulo(
      taskBarrierTurnTarget-current+Math.PI,
      Math.PI*2
    )-Math.PI;
  const maxStep=Math.max(.01,dt*3.0);
  if(Math.abs(delta)<=maxStep){
    player.root.rotation.y=taskBarrierTurnTarget;
    taskBarrierTurnTarget=null;
  }else{
    player.root.rotation.y += Math.sign(delta)*maxStep;
  }
}
function enforceExactReferenceTaskLimits(previousPosition){
  if(!player?.root || activeWorldZone!=="outside") return;
  const current=player.root.position;
  function intersectsBarrier(def){
    if(!def?.a || !def?.b) return false;
    const px=previousPosition.x;
    const pz=previousPosition.z;
    const cx=current.x;
    const cz=current.z;
    const barrierX=def.a.x;
    const crossedX=
      (px<=barrierX && cx>barrierX) ||
      (px>=barrierX && cx<barrierX);
    const isLeft=barrierX<0;
    const movingForbidden=
      isLeft
        ? cx<px
        : cx>px;
    const beyondNow=
      isLeft
        ? cx<barrierX
        : cx>barrierX;
    if(!crossedX && !(movingForbidden && beyondNow)){
      return false;
    }
    let crossingZ=cz;
    const dx=cx-px;
    if(Math.abs(dx)>.00001){
      const t=(barrierX-px)/dx;
      crossingZ=
        pz+
        (cz-pz)*
        THREE.MathUtils.clamp(t,0,1);
    }
    const minZ=
      Math.min(def.a.y,def.b.y)-.65;
    const maxZ=
      Math.max(def.a.y,def.b.y)+.65;

    if(
      isInsideGardenTaskBoundaryExclusion(
        barrierX,
        crossingZ
      )
    ){
      return false;
    }

    return (
      crossingZ>=minZ &&
      crossingZ<=maxZ
    );
  }
  let hitDef=null;
  if(intersectsBarrier(TASK_REFERENCE_LIMITS.left)){
    hitDef=TASK_REFERENCE_LIMITS.left;
  }else if(intersectsBarrier(TASK_REFERENCE_LIMITS.right)){
    hitDef=TASK_REFERENCE_LIMITS.right;
  }
  if(hitDef){
    player.root.position.copy(previousPosition);
    orientPlayerBackFromBarrier(hitDef);
    showTaskBoundaryWarning();
  }
}
const GATE_PART_EDITORS={
  left:null,
  right:null,
  barricadeLeft:null,
  barricadeRight:null
};

function refreshGardenGateLeafCollisions(){
  rebuildGardenGateLeafCollisionData({
    THREE,
    state:LIGHT_COLLISION,
    taskGate:TASK_BOUNDARY?.gate,
    gateParts:GATE_PART_EDITORS,
    tuning:GARDEN_GATE_COLLISION_FIXED,
    makeBox:lcMakeBox
  });

  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
  }
}
const CEREMONIAL_GATE_POSTS={
  left:null,
  right:null,
  step:.10,
  rotStep:1.0,
  scaleStep:.025,
  bottomBase:{
    width:1.000,
    height:.280,
    depth:.875,
    y:.140
  }
};

function refreshCeremonialGatePostEditors(){
  for(const side of ["left","right"]){
    const read=document.getElementById(`ceremonialGatePost${side}Read`);
    if(!read) continue;
    const o=CEREMONIAL_GATE_POSTS[side];
    if(!o){
      read.textContent=`${side.toUpperCase()} GATE POST loading...`;
      continue;
    }
    const d=v=>THREE.MathUtils.radToDeg(v);
    read.textContent=
      `${side.toUpperCase()} GATE POST\n`+
      `POSITION X ${o.position.x.toFixed(3)} Y ${o.position.y.toFixed(3)} Z ${o.position.z.toFixed(3)}\n`+
      `ROT Y ${d(o.rotation.y).toFixed(1)}°\n`+
      `SCALE X ${o.scale.x.toFixed(3)} Y ${o.scale.y.toFixed(3)} Z ${o.scale.z.toFixed(3)}`;
  }
}
function findBarricadeByName(name){
  let found=null;
  scene.traverse(o=>{
    if(found || !o) return;
    if(o.name===name) found=o;
  });
  return found;
}
function buildStaticGateBarricades(){
  let left=
    findBarricadeByName("beach_barricade_segment_78");
  let right=
    findBarricadeByName("beach_barricade_segment_91");
  if(!left || !right){
    const source=RoadBuilders.createProceduralBarricadeSource({
      THREE,
      material:BARRICADE_CONCRETE_MATERIAL
    });
    const masters=new THREE.Group();
    masters.name="beach_barricade_glb_curve";
    left=source.clone(true);
    left.name="beach_barricade_segment_78";
    right=source.clone(true);
    right.name="beach_barricade_segment_91";
    masters.add(left,right);
    scene.add(masters);
    COASTAL_ASSETS.barricades=masters;
  }
  if(!left || !right || typeof uRoadCurve==="undefined"){
    return;
  }
  left.position.set(-6.216,-.095,59.930);
  left.scale.set(1.9138,4.8544,1.9200);
  left.rotation.set(0,0,0);
  right.position.set(8.266,-.045,59.930);
  right.scale.set(1.9138,4.8544,1.9200);
  right.rotation.set(0,0,0);
  left.updateMatrixWorld(true);
  right.updateMatrixWorld(true);
  const previous=
    scene.getObjectByName("static_gate_barricades_curve");
  if(previous){
    scene.remove(previous);
  }
  function nearestCurveT(position){
    let bestT=0;
    let bestD=Infinity;
    for(let i=0;i<=450;i++){
      const t=i/450;
      const p=uRoadCurve.getPointAt(t);
      const dx=p.x-position.x;
      const dz=p.z-position.z;
      const d=dx*dx+dz*dz;
      if(d<bestD){
        bestD=d;
        bestT=t;
      }
    }
    return bestT;
  }
  function realSegmentLength(source){
    source.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(source);
    const size=box.getSize(new THREE.Vector3());
    return Math.max(size.x,size.z);
  }
  function masterCurveData(source){
    const world=new THREE.Vector3();
    source.getWorldPosition(world);
    const t=nearestCurveT(world);
    const point=uRoadCurve.getPointAt(t);
    const tangent=uRoadCurve.getTangentAt(t).normalize();
    const nx=-tangent.z;
    const nz=tangent.x;
    const dx=world.x-point.x;
    const dz=world.z-point.z;
    return {
      t,
      point,
      tangent,
      signedOffset:dx*nx+dz*nz
    };
  }
  const allMatrices=[];
  const allColliders=[];
  const sourceLocalBox=
    maxPerfRootLocalBounds(left);
  const sourceLocalSize=
    sourceLocalBox.getSize(new THREE.Vector3());
  function addFixedSide(source,direction,label,count){
    const master=masterCurveData(source);
    const curveLength=uRoadCurve.getLength();
    const sourceLength=realSegmentLength(source);
    const straightStepWorld=sourceLength*.93;
    const curveStepWorld=sourceLength*.48;
    let t=master.t;
    let previousTangent=
      uRoadCurve.getTangentAt(t).normalize();
    for(let i=1;i<=count*2;i++){
      const probeT=THREE.MathUtils.clamp(
        t+
        direction*
        (straightStepWorld/curveLength),
        0,
        1
      );
      const probeTangent=
        uRoadCurve.getTangentAt(probeT).normalize();
      const dot=THREE.MathUtils.clamp(
        previousTangent.dot(probeTangent),
        -1,
        1
      );
      const angle=Math.acos(dot);
      const curveFactor=THREE.MathUtils.clamp(
        (
          angle-
          THREE.MathUtils.degToRad(.7)
        )/
        THREE.MathUtils.degToRad(4.5),
        0,
        1
      );
      const stepWorld=THREE.MathUtils.lerp(
        straightStepWorld,
        curveStepWorld,
        curveFactor
      );
      t+=direction*(stepWorld/curveLength);
      if(t<=0 || t>=1){
        break;
      }
      const point=uRoadCurve.getPointAt(t);
      const tangent=uRoadCurve.getTangentAt(t).normalize();
      const nx=-tangent.z;
      const nz=tangent.x;
      const curvePresence=THREE.MathUtils.lerp(
        1.0,
        1.16,
        curveFactor
      );
      const position=new THREE.Vector3(
        point.x+nx*master.signedOffset,
        source.position.y,
        point.z+nz*master.signedOffset
      );
      const yaw=
        Math.atan2(tangent.x,tangent.z)-
        Math.PI/2;
      const quaternion=
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0,yaw,0)
        );
      const scale=source.scale.clone();
      scale.x*=curvePresence;
      scale.z*=curvePresence;
      allMatrices.push(
        new THREE.Matrix4().compose(
          position,
          quaternion,
          scale
        )
      );
      allColliders.push({
        name:`static_barricade_${label}_${i}`,
        x:position.x,
        z:position.z,
        halfX:Math.max(
          .08,
          sourceLocalSize.x*
          Math.abs(scale.x)*
          .5*.91
        ),
        halfZ:Math.max(
          .08,
          sourceLocalSize.z*
          Math.abs(scale.z)*
          .5*.91
        ),
        minY:
          position.y+
          sourceLocalBox.min.y*
          scale.y,
        maxY:
          position.y+
          sourceLocalBox.max.y*
          scale.y,
        yaw
      });
      previousTangent=tangent;
    }
  }
  addFixedSide(left,-1,"left",72);
  addFixedSide(right,1,"right",72);
  const group=maxPerfBuildInstancedGLB(
    left,
    allMatrices,
    "static_gate_barricades_curve"
  );
  group.userData.instanceColliders=allColliders;
  scene.add(group);
  GATE_PART_EDITORS.barricadeLeft=left;
  GATE_PART_EDITORS.barricadeRight=right;
  refreshNearBarricadeEditor("left");
  refreshNearBarricadeEditor("right");
  if(typeof lcBuildBarricadeFromVisual==="function"){
    lcBuildBarricadeFromVisual();
  }
}
function resolveNearGateBarricades(){
  const left=
    findBarricadeByName("beach_barricade_segment_78");
  const right=
    findBarricadeByName("beach_barricade_segment_91");
  if(!left || !right){
    return;
  }
  GATE_PART_EDITORS.barricadeLeft=left;
  GATE_PART_EDITORS.barricadeRight=right;
  refreshNearBarricadeEditor("left");
  refreshNearBarricadeEditor("right");
}
function refreshNearBarricadeEditor(which){
  const obj=
    which==="left"
      ?GATE_PART_EDITORS.barricadeLeft
      :GATE_PART_EDITORS.barricadeRight;
  const el=document.getElementById(
    which==="left"
      ?"nearBarricadeLeftReadout"
      :"nearBarricadeRightReadout"
  );
  if(!el) return;
  if(!obj){
    el.textContent="Barricade not resolved";
    return;
  }
  el.textContent=
    `name=${obj.name} | `+
    `pos=(${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed(3)}, ${obj.position.z.toFixed(3)}) | `+
    `scale=(${obj.scale.x.toFixed(4)}, ${obj.scale.y.toFixed(4)}, ${obj.scale.z.toFixed(4)}) | `+
    `yaw=${THREE.MathUtils.radToDeg(obj.rotation.y).toFixed(1)}°`;
}

const taskText=document.getElementById("taskText");
const clueToast=document.getElementById("clueToast");
const clueToastBody=document.getElementById("clueToastBody");
const questBlueExclamation=document.getElementById("questBlueExclamation");
const DISCOVERY_EVENTS={
  walletSeen:false,
  storekeeperSeen:false,
  storekeeperDialogueStarted:false
};
function showBlueExclamation(duration=850){
  if(!questBlueExclamation) return;
  questBlueExclamation.classList.add("show");
  clearTimeout(showBlueExclamation._timer);
  showBlueExclamation._timer=setTimeout(
    ()=>questBlueExclamation.classList.remove("show"),
    duration
  );
}
function updateWalletDiscoveryEvent(){
  if(DISCOVERY_EVENTS.walletSeen) return;
  if(QUEST.stage!=="search_clues") return;
  if(!COLLECTIBLES?.wallet || !player?.root) return;
  const d=player.root.position.distanceTo(COLLECTIBLES.wallet.position);
  if(d>2.15) return;
  DISCOVERY_EVENTS.walletSeen=true;
  showBlueExclamation(900);
  setTimeout(()=>{
    questShowClue(
      "What's this? It looks like a wallet. It could contain important information.",
      4300
    );
  },380);
}
function getEditableThief(){
  return globalThis.npcs?.find?.(n=>n?.name==="toxicMan") || null;
}

const THIEF_DISCOVERY_TURN={
  active:false,
  speed:THREE.MathUtils.degToRad(72)
};

const THIEF_DISCOVERY_ROOT_LOCK={
  captured:false,
  position:new THREE.Vector3()
};

const THIEF_TALK_ROOT_LOCK={
  active:false,
  position:new THREE.Vector3(),
  yaw:0
};

function updateThiefDiscoveryTurn(dt){
  if(!THIEF_DISCOVERY_TURN.active) return;

  const toxic=getEditableThief();
  if(!toxic?.root || !player?.root || toxic.root.visible===false) return;

  toxic.state="idle";
  toxic.timer=0;

  if(!toxic.__thiefDiscoveryTurnStart){
    toxic.__thiefDiscoveryTurnStart=performance.now();
  }

  if(!THIEF_DISCOVERY_ROOT_LOCK.captured){
    THIEF_DISCOVERY_ROOT_LOCK.captured=true;
    THIEF_DISCOVERY_ROOT_LOCK.position.copy(toxic.root.position);
  }

  toxic.root.position.copy(THIEF_DISCOVERY_ROOT_LOCK.position);

  const stillTurning=turnNpcTowardPlayerWithSteps(
    toxic,
    THIEF_POSE_TRANSITION_SPEED.turn
  );

  const b=getBones(toxic);

  if(stillTurning){
    const elapsed=(performance.now()-toxic.__thiefDiscoveryTurnStart)/1000;

    const totalTurnWindow=5.8;
    const p=THREE.MathUtils.clamp(elapsed/totalTurnWindow,0,1);

    const idle=THIEF_UNDISCOVERED_POSE_A;

    const pose={
      ...idle,
      hips:{...idle.hips},
      spine2:{...idle.spine2},
      leftUpLeg:{...idle.leftUpLeg},
      rightUpLeg:{...idle.rightUpLeg},
      leftKnee:{...idle.leftKnee},
      rightKnee:{...idle.rightKnee},
      leftFoot:{...idle.leftFoot},
      rightFoot:{...idle.rightFoot},
      leftToe:{...idle.leftToe},
      rightToe:{...idle.rightToe}
    };

    if(p>.28 && p<.72){
      const local=(p-.28)/.44;

      const envelope=Math.sin(local*Math.PI);

      const phase=local*Math.PI*4;

      const leftLift=Math.max(0,Math.sin(phase))*envelope;
      const rightLift=Math.max(0,Math.sin(phase+Math.PI))*envelope;

      pose.leftUpLeg.x+=leftLift*.040;
      pose.rightUpLeg.x+=rightLift*.034;

      pose.leftKnee.x+=leftLift*.060;
      pose.rightKnee.x+=rightLift*.052;

      pose.leftFoot.x-=leftLift*.014;
      pose.rightFoot.x-=rightLift*.012;

      pose.leftToe.x+=leftLift*.006;
      pose.rightToe.x+=rightLift*.005;

      pose.hips.z+=(leftLift-rightLift)*.010;
      pose.spine2.z+=(rightLift-leftLift)*.007;
    }

    applyThiefEditorBodyPose(
      toxic,
      b,
      pose,
      .032
    );

    animateThiefEditorFingers(
      toxic,
      pose.fingerCurl ?? .14,
      .030
    );

    toxic.root.position.copy(THIEF_DISCOVERY_ROOT_LOCK.position);
    toxic.root.updateMatrixWorld(true);
    return;
  }

  toxic.__thiefDiscoveryTurnStart=0;
  toxic.root.position.copy(THIEF_DISCOVERY_ROOT_LOCK.position);

  THIEF_TALK_ROOT_LOCK.active=true;
  THIEF_TALK_ROOT_LOCK.position.copy(toxic.root.position);
  THIEF_TALK_ROOT_LOCK.yaw=toxic.root.rotation.y;

  toxic.root.position.copy(THIEF_TALK_ROOT_LOCK.position);
  toxic.root.rotation.y=THIEF_TALK_ROOT_LOCK.yaw;

  animateThiefTalkPose(toxic);

  toxic.root.position.copy(THIEF_TALK_ROOT_LOCK.position);
  toxic.root.rotation.y=THIEF_TALK_ROOT_LOCK.yaw;
  toxic.root.updateMatrixWorld(true);

  toxic.toxicFixedRotationY=THIEF_TALK_ROOT_LOCK.yaw;
  captureNpcConversationFinalPose(toxic);

  THIEF_DISCOVERY_TURN.active=false;
  THIEF_DISCOVERY_ROOT_LOCK.captured=false;

  if(
    STOREKEEPER_FINAL.thiefDialoguePending &&
    !STOREKEEPER_FINAL.thiefDialogueDone
  ){
    STOREKEEPER_FINAL.thiefDialoguePending=false;

    setTimeout(()=>{
      if(
        QUEST.stage==="find_suspicious" &&
        !STOREKEEPER_FINAL.finishing &&
        !STOREKEEPER_FINAL.thiefDialogueDone &&
        !QUEST.dialogueActive
      ){
        talkToStorekeeperFinal();
      }
    },180);
  }
}
function beginThiefDiscovery(){
  if(QUEST.stage!=="find_suspicious") return;
  if(STOREKEEPER_FINAL.completed || STOREKEEPER_FINAL.finishing) return;
  if(DISCOVERY_EVENTS.storekeeperDialogueStarted) return;

  const toxic=getEditableThief();
  if(!toxic?.root?.visible || !player?.root) return;

  DISCOVERY_EVENTS.storekeeperSeen=true;
  DISCOVERY_EVENTS.storekeeperDialogueStarted=true;
  STOREKEEPER_FINAL.thiefDialoguePending=true;

  toxic.state="idle";
  toxic.timer=0;

  NPC_CONVERSATION_FINAL_LATCH.delete(toxic);
  NPC_TALK_TURN_STEP_STATE.delete(toxic);
  ensureNpcConversationOriginalYaw(toxic);

  THIEF_DISCOVERY_TURN.active=true;

  showBlueExclamation(900);
}

function updateStorekeeperDiscoveryEvent(){
  if(QUEST.stage!=="find_suspicious") return;
  if(STOREKEEPER_FINAL.completed || STOREKEEPER_FINAL.finishing) return;

  const toxic=getEditableThief();
  if(!toxic?.root?.visible || !player?.root) return;

  const d=player.root.position.distanceTo(toxic.root.position);
  if(d>3.25) return;

  beginThiefDiscovery();
}
function questSetStage(stage){
  QUEST.stage=stage;
  if(taskText) taskText.textContent=QUEST_TASKS[stage] || stage;
}
function questShowClue(text,duration=3300){
  if(!clueToast || !clueToastBody) return;
  clueToastBody.textContent=text;
  clueToast.classList.add("show");
  clearTimeout(questShowClue._timer);
  questShowClue._timer=setTimeout(()=>clueToast.classList.remove("show"),duration);
}
function questRenderDialogueLine(){
  if(!QUEST.dialogueActive) return;
  if(dialogue) dialogue.classList.remove("warningMode");
  if(dialogueName) dialogueName.textContent=QUEST.dialogueSpeaker;
  if(dialogueBody) dialogueBody.textContent=QUEST.dialogueLines[QUEST.dialogueIndex] || "";
  if(dialogue) dialogue.style.display="block";
  if(dialogueActionHint){
    const isLast=QUEST.dialogueIndex>=QUEST.dialogueLines.length-1;
    dialogueActionHint.textContent=isLast ? "E · CONCLUDE" : "E · CONTINUE";
  }
}
function clearPlayerMovementKeysInternal(){
  if(typeof keys!=="undefined" && keys){
    for(const k of [
      "w","a","s","d",
      "arrowup","arrowdown","arrowleft","arrowright"
    ]){
      keys[k]=false;
    }
  }
}


window.clearPlayerControlledMovementKeys=clearPlayerMovementKeysInternal;

function setDialogueMovementLock(active){
  if(active){
    gameplayInputEnabled=false;
    window.clearPlayerControlledMovementKeys();
    for(const k of ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"]){
      if(keys) keys[k]=false;
    }
  }else{
    if(!QUEST.dialogueActive && !GLOBAL_DIALOGUE_LOCK.active){
      gameplayInputEnabled=true;
    }
  }
}
function questStartDialogue(speaker,lines,onDone=null){
  DIALOGUE_E_LOCK=false;
  setDialogueMovementLock(true);
  QUEST.dialogueActive=true;
  QUEST.dialogueSpeaker=speaker;
  QUEST.dialogueLines=Array.isArray(lines)?lines:[String(lines)];
  QUEST.dialogueIndex=0;
  QUEST.dialogueDone=onDone;
  questRenderDialogueLine();
}
function questAdvanceDialogue(){
  if(!QUEST.dialogueActive) return false;
  const isLast=
    QUEST.dialogueIndex >= QUEST.dialogueLines.length-1;

  if(
    isLast &&
    String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" &&
    STOREKEEPER_FINAL?.policeSummoned &&
    FINAL_SECURITY_DIALOGUE_FACING.active &&
    FINAL_SECURITY_DIALOGUE_FACING.mode==="player" &&
    !FINAL_SECURITY_DIALOGUE_FACING.returnComplete
  ){
    FINAL_SECURITY_DIALOGUE_FACING.pendingConclude=true;
    if(dialogueActionHint){
      dialogueActionHint.textContent="RETURNING...";
    }
    return true;
  }

  if(!isLast){
    QUEST.dialogueIndex++;

    if(
      String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" &&
      STOREKEEPER_FINAL?.policeSummoned
    ){
      if(QUEST.dialogueIndex===2){

        setFinalSecurityDialogueFacing("thief");
      }else if(QUEST.dialogueIndex===4){

        setFinalSecurityDialogueFacing("player");
      }
    }

    questRenderDialogueLine();
    return true;
  }
  QUEST.dialogueActive=false;
  if(dialogue) dialogue.style.display="none";
  const security=questGetPolice();
  if(security && security.state==="talk"){
    captureNpcConversationFinalPose(security);
    security.state="idle";
    security.timer=0;
    startSecurityPostTalkArms(security);
  }

  const talkedChild=globalThis.npcs?.find?.(
    n=>n?.name==="child" && n?.state==="talk"
  );
  if(talkedChild){
    captureNpcConversationFinalPose(talkedChild);
    talkedChild.state="idle";
    talkedChild.timer=0;
    startChildPostTalkArms(talkedChild);
  }

  const toxic=globalThis.npcs?.find?.(n=>n?.name==="toxicMan");
  if(toxic && toxic.state==="talk"){
    captureNpcConversationFinalPose(toxic);
    toxic.state="idle";
    toxic.timer=0;
  }
  if(FINAL_ARREST_FLOW.active){
    completeFinalArrestSequence();
    return true;
  }
  const done=QUEST.dialogueDone;
  QUEST.dialogueDone=null;
  if(typeof done==="function"){
    try{
      done();
    }catch(err){
    }
  }
  setDialogueMovementLock(false);
  return true;
}


const CHILD_POST_TALK_ARMS={
  active:false,
  startTime:0,
  duration:1900,
  child:null,
  bones:null,
  rest:new Map(),
  variant:0
};

function startChildPostTalkArms(child){
  if(!child?.root) return;

  const bones={};
  child.root.traverse(o=>{
    if(!o?.isBone) return;
    const n=String(o.name||"").toLowerCase();
    if(!bones.leftArm && (n.includes("leftarm") || n.includes("upperarm_l"))) bones.leftArm=o;
    if(!bones.rightArm && (n.includes("rightarm") || n.includes("upperarm_r"))) bones.rightArm=o;
    if(!bones.leftForeArm && (n.includes("leftforearm") || n.includes("lowerarm_l"))) bones.leftForeArm=o;
    if(!bones.rightForeArm && (n.includes("rightforearm") || n.includes("lowerarm_r"))) bones.rightForeArm=o;
    if(!bones.leftHand && (n.includes("lefthand") || n.includes("hand_l"))) bones.leftHand=o;
    if(!bones.rightHand && (n.includes("righthand") || n.includes("hand_r"))) bones.rightHand=o;
  });

  const rest=new Map();
  for(const bone of Object.values(bones)){
    if(bone) rest.set(bone,bone.quaternion.clone());
  }

  CHILD_POST_TALK_ARMS.child=child;
  CHILD_POST_TALK_ARMS.bones=bones;
  CHILD_POST_TALK_ARMS.rest=rest;
  CHILD_POST_TALK_ARMS.startTime=performance.now();
  CHILD_POST_TALK_ARMS.variant=Math.floor(Math.random()*3);
  CHILD_POST_TALK_ARMS.active=true;
}

function updateChildPostTalkArms(){
  const g=CHILD_POST_TALK_ARMS;
  if(!g.active || !g.child?.root || !g.bones) return;

  const u=THREE.MathUtils.clamp(
    (performance.now()-g.startTime)/g.duration,
    0,1
  );

  const envelope=Math.sin(Math.PI*u);
  const soft=envelope*envelope;
  const D=THREE.MathUtils.degToRad;

  const handWindow=THREE.MathUtils.smoothstep(u,.25,.43) *
                   (1-THREE.MathUtils.smoothstep(u,.72,.92));
  const handPulse=Math.sin(u*Math.PI*2)*handWindow;

  const apply=(bone,x=0,y=0,z=0)=>{
    if(!bone || !g.rest.has(bone)) return;
    const delta=new THREE.Quaternion().setFromEuler(
      new THREE.Euler(D(x),D(y),D(z),"XYZ")
    );
    bone.quaternion.copy(g.rest.get(bone)).multiply(delta);
  };


  let leftOpen=-2.8;
  let rightOpen=2.8;
  if(g.variant===1) leftOpen=-4.5;
  if(g.variant===2) rightOpen=4.5;

  apply(g.bones.leftArm,-1.4*soft,0,leftOpen*soft);
  apply(g.bones.rightArm,-1.4*soft,0,rightOpen*soft);
  apply(g.bones.leftForeArm,-1.2*soft,0,-.4*soft);
  apply(g.bones.rightForeArm,-1.2*soft,0,.4*soft);

  apply(g.bones.leftHand,-.7*soft,.35*handPulse,-1.4*handPulse);
  apply(g.bones.rightHand,-.7*soft,-.35*handPulse,1.4*handPulse);

  if(u>=1){
    for(const [bone,q] of g.rest) bone.quaternion.copy(q);
    g.active=false;
    g.child=null;
    g.bones=null;
    g.rest.clear();
  }
}

const SECURITY_POST_TALK_ARMS={
  active:false,
  startTime:0,
  duration:2200,
  security:null,
  bones:null,
  rest:new Map(),
  variant:0
};

function startSecurityPostTalkArms(security){
  if(!security?.root) return;

  const bones={};
  security.root.traverse(o=>{
    if(!o?.isBone) return;
    const n=String(o.name||"").toLowerCase();
    if(!bones.leftArm && (n.includes("leftarm") || n.includes("upperarm_l"))) bones.leftArm=o;
    if(!bones.rightArm && (n.includes("rightarm") || n.includes("upperarm_r"))) bones.rightArm=o;
    if(!bones.leftForeArm && (n.includes("leftforearm") || n.includes("lowerarm_l"))) bones.leftForeArm=o;
    if(!bones.rightForeArm && (n.includes("rightforearm") || n.includes("lowerarm_r"))) bones.rightForeArm=o;
    if(!bones.leftHand && (n.includes("lefthand") || n.includes("hand_l"))) bones.leftHand=o;
    if(!bones.rightHand && (n.includes("righthand") || n.includes("hand_r"))) bones.rightHand=o;
  });

  const rest=new Map();
  for(const bone of Object.values(bones)){
    if(bone) rest.set(bone,bone.quaternion.clone());
  }

  SECURITY_POST_TALK_ARMS.security=security;
  SECURITY_POST_TALK_ARMS.bones=bones;
  SECURITY_POST_TALK_ARMS.rest=rest;
  SECURITY_POST_TALK_ARMS.startTime=performance.now();


  SECURITY_POST_TALK_ARMS.variant=Math.floor(Math.random()*3);
  SECURITY_POST_TALK_ARMS.active=true;
}

function updateSecurityPostTalkArms(){
  const g=SECURITY_POST_TALK_ARMS;
  if(!g.active || !g.security?.root || !g.bones) return;

  const u=THREE.MathUtils.clamp(
    (performance.now()-g.startTime)/g.duration,
    0,1
  );


  const envelope=Math.sin(Math.PI*u);
  const soft=envelope*envelope;
  const D=THREE.MathUtils.degToRad;


  const handWindow=THREE.MathUtils.smoothstep(u,.22,.42) *
                   (1-THREE.MathUtils.smoothstep(u,.70,.92));
  const handPulse=Math.sin(u*Math.PI*2.0)*handWindow;

  const apply=(bone,x=0,y=0,z=0)=>{
    if(!bone || !g.rest.has(bone)) return;
    const base=g.rest.get(bone);
    const delta=new THREE.Quaternion().setFromEuler(
      new THREE.Euler(D(x),D(y),D(z),"XYZ")
    );
    bone.quaternion.copy(base).multiply(delta);
  };


  let leftOpen=-2.4;
  let rightOpen=2.4;
  let armLift=-1.6;


  if(g.variant===1) leftOpen=-4.2;
  if(g.variant===2) rightOpen=4.2;

  apply(g.bones.leftArm,armLift*soft,0,leftOpen*soft);
  apply(g.bones.rightArm,armLift*soft,0,rightOpen*soft);

  apply(g.bones.leftForeArm,-1.4*soft,0,-.5*soft);
  apply(g.bones.rightForeArm,-1.4*soft,0,.5*soft);


  const leftHandExtra=(g.variant===1 ? -2.4 : -.9)*handPulse;
  const rightHandExtra=(g.variant===2 ? 2.4 : .9)*handPulse;

  apply(
    g.bones.leftHand,
    -1.0*soft,
    .5*handPulse,
    leftHandExtra
  );
  apply(
    g.bones.rightHand,
    -1.0*soft,
    -.5*handPulse,
    rightHandExtra
  );

  if(u>=1){
    for(const [bone,q] of g.rest) bone.quaternion.copy(q);
    g.active=false;
    g.security=null;
    g.bones=null;
    g.rest.clear();
  }
}

function questGetPolice(){
  if(typeof npcs==="undefined") return null;
  return npcs.find(n=>n?.name==="securityMan") || null;
}
function questTalkToPolice(){
  const security=questGetPolice();

  if(QUEST.stage==="game_complete"){
    SECURITY_POST_CASE_HOME_LOCK=false;
  }

  if(security){
    NPC_CONVERSATION_FINAL_LATCH.delete(security);
    NPC_TALK_TURN_STEP_STATE.delete(security);
    ensureNpcConversationOriginalYaw(security);
    security.state="talk";
    security.timer=0;
  }
  if(QUEST.stage==="talk_police"){
    questStartDialogue("POLICE",[
      "We've had a string of thefts over the last few days. The jewelry store next to the Casino was hit hardest — cash, rings, necklaces and other valuables disappeared.",
      "The jewelry store is closed while we investigate. Nobody identified the thief, but there was suspicious movement around the Casino shortly before the latest robbery.",
      "I need another pair of eyes. Start with the Casino beside the jewelry store and look for anything that doesn't belong. Bring every useful clue back to me."
    ],()=>{
      questSetStage("search_clues");
      if(COLLECTIBLES?.wallet){
        COLLECTIBLES.wallet.visible=true;
      }
      questShowClue("Investigation started · investigate the Casino.");
    });
    return;
  }
  if(QUEST.stage==="search_clues"){
    questStartDialogue("POLICE",[
      "Keep investigating the Casino beside the closed jewelry store. Whoever robbed it may have left something behind."
    ]);
    return;
  }
  if(QUEST.stage==="return_wallet"){
    questStartDialogue("POLICE",[
      "Oh, you found a wallet. Let me take a look.",
      "There's a photo and an ID in here... I think I've seen someone who looks like this.",
      "I saw a person matching this photo heading toward the garden.",
      "Take this police radio. If you find something, call me. I'll stay here until I hear from you."
    ],()=>{
      POLICE_RADIO.owned=true;
      POLICE_RADIO.callReady=false;
      addInventoryItem({
        id:"police_radio",
        name:"Police Radio",
        kind:"radio",
        description:"A police walkie-talkie. Use it when you have something important to report."
      });
      questSetStage("find_suspicious");
      questShowClue("Police Radio received · investigate the garden.");
    });
    return;
  }
  if(QUEST.stage==="find_suspicious"){
    questStartDialogue("POLICE",[
      "Check the garden. The person I saw headed that way."
    ]);
    return;
  }
  if(QUEST.stage==="game_complete"){
    questStartDialogue("SECURITY",[
      "Thanks for your help. We got him because of you."
    ]);
  }
}
questSetStage("talk_police");
let loadingDisplayedPct=0;
const START_GATE={accepted:false};
const START_PLAYER_PREVIEW={
  renderer:null,
  scene:null,
  camera:null,
  root:null,
  mixer:null,
  raf:0,
  clock:new THREE.Clock(),
  loaded:false
};

function disposeStartPlayerPreview(){
  if(START_PLAYER_PREVIEW.raf){
    cancelAnimationFrame(START_PLAYER_PREVIEW.raf);
    START_PLAYER_PREVIEW.raf=0;
  }
  START_PLAYER_PREVIEW.mixer?.stopAllAction?.();
}

function refreshStartSummary(){
  const difficulty=String(GAME_SETTINGS?.difficulty||"easy");
  const dRead=document.getElementById("startDifficultyRead");
  if(dRead){
    dRead.textContent=
      difficulty==="intermediate"
        ?"Intermediate"
        :difficulty==="hard"
          ?"Hard"
          :"Easy";
  }
  const outfit=document.getElementById("startOutfit");
  const outfitRead=document.getElementById("startOutfitRead");
  if(outfitRead && outfit){
    outfitRead.textContent=
      outfit.selectedOptions?.[0]?.textContent ||
      "Original Outfit";
  }
}
function initGameStartScreen(){
  if(initGameStartScreen.done) return;
  initGameStartScreen.done=true;
  document.body.classList.remove("game-ready");
  document.body.classList.add("start-menu-active");
  loadingScreen?.classList.add("hidden");
  document.querySelectorAll("[data-start-difficulty]").forEach(btn=>{
    btn.onclick=()=>{
      document
        .querySelectorAll("[data-start-difficulty]")
        .forEach(x=>x.classList.remove("selected"));
      btn.classList.add("selected");
      const value=btn.dataset.startDifficulty||"easy";
      GAME_SETTINGS.difficulty=value;
      if(setDifficulty) setDifficulty.value=value;
      applyDifficultyGuidance();
      refreshStartSummary();
    };
  });
  const outfit=document.getElementById("startOutfit");
  outfit?.addEventListener("change",()=>{
    GAME_SETTINGS.outfit=outfit.value;
    if(setOutfit) setOutfit.value=outfit.value;
    applyStartPreviewOutfit();
    applyPlayerOutfitPreset();
    refreshStartSummary();
  });
  refreshStartSummary();
  const play=document.getElementById("startPlay");
  if(play){
    play.onclick=()=>{
      if(START_GATE.accepted) return;
      START_GATE.accepted=true;
      disposeStartPlayerPreview();
      document.body.classList.remove("start-menu-active");
      document.body.classList.add("loading-active");
      document
        .getElementById("gameStartScreen")
        ?.classList.add("hidden");
      loadingScreen?.classList.remove("hidden");
      setLoadingProgress(0,"Loading assets");
      if(moduleInitializationComplete){
        finishSceneLoading();
      }
    };
  }
}
const GAME_SETTINGS={
  cameraZoom:1.0,
  cameraHeightOffset:0,
  cameraLookOffset:0,
  cameraFov:60,
  outfit:"original",
  difficulty:"easy"
};
const settingsToggle=document.getElementById("settingsToggle");
const settingsPanel=document.getElementById("settingsPanel");
const setCamZoom=document.getElementById("setCamZoom");
const setCamHeight=document.getElementById("setCamHeight");
const setCamLook=document.getElementById("setCamLook");
const setCamFov=document.getElementById("setCamFov");
const setOutfit=document.getElementById("setOutfit");
const setDifficulty=document.getElementById("setDifficulty");
const settingsBackdrop=document.getElementById("settingsBackdrop");
const settingsClose=document.getElementById("settingsClose");
function setSettingsOpen(open){
  settingsPanel?.classList.toggle("open",!!open);
  settingsBackdrop?.classList.toggle("open",!!open);
  if(open){
    for(const k of Object.keys(keys)) keys[k]=false;
  }
}
settingsToggle?.addEventListener("click",e=>{
  e.stopPropagation();
  setSettingsOpen(!settingsPanel?.classList.contains("open"));
});
settingsClose?.addEventListener("click",()=>setSettingsOpen(false));
settingsBackdrop?.addEventListener("click",()=>setSettingsOpen(false));
settingsPanel?.addEventListener("pointerdown",e=>e.stopPropagation());
settingsPanel?.addEventListener("click",e=>e.stopPropagation());
function applyDifficultyGuidance(){
  const d=String(GAME_SETTINGS.difficulty||"easy").toLowerCase();
  const taskBanner=document.getElementById("taskBanner");
  if(taskBanner){
    taskBanner.style.display=d==="hard" ? "none" : "block";
  }
}
function updateSettingReadouts(){
  const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  put("setCamZoomVal",GAME_SETTINGS.cameraZoom.toFixed(2)+"×");
  put("setCamHeightVal",GAME_SETTINGS.cameraHeightOffset.toFixed(2));
  put("setCamLookVal",GAME_SETTINGS.cameraLookOffset.toFixed(2));
  put("setCamFovVal",Math.round(GAME_SETTINGS.cameraFov)+"°");
}
function applyOutfitPresetToRoot(root,preset=GAME_SETTINGS.outfit){
  if(!root) return;
  const palettes={
    forest:{
      jeans:0x35537a,
      shoes:0xd7d3c7,
      top1:0x41684b,
      top2:0x587b5c,
      accessory:0x9c866e
    },
    burgundy:{
      jeans:0x34383e,
      shoes:0x25272a,
      top1:0x713848,
      top2:0x8f4b5c,
      accessory:0xa08d87
    },
    mono:{
      jeans:0x25282d,
      shoes:0xf0eee8,
      top1:0xeeeeea,
      top2:0x35373b,
      accessory:0x9ea2a6
    }
  };
  const palette=palettes[preset] || null;
  root.traverse(obj=>{
    if(!obj?.isMesh || !obj.material) return;
    const materials=Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    for(const mat of materials){
      if(!mat?.color) continue;
      const n=String(mat.name||"").toLowerCase();
      if(
        n.includes("hands") ||
        n.includes("head") ||
        n.includes("hair") ||
        n.includes("eyes") ||
        n.includes("lashes") ||
        n.includes("brows") ||
        n.includes("teeth") ||
        n.includes("skin")
      ){
        continue;
      }
      let garment=null;
      if(n.includes("jeans")) garment="jeans";
      else if(n.includes("shoes")) garment="shoes";
      else if(n.includes("top1")) garment="top1";
      else if(n.includes("top2")) garment="top2";
      else if(n.includes("acc")) garment="accessory";
      else continue;
      if(!mat.userData.settingsOriginalColor){
        mat.userData.settingsOriginalColor=mat.color.getHex();
      }
      if(!mat.userData.settingsOriginalOnBeforeCompile){
        mat.userData.settingsOriginalOnBeforeCompile=mat.onBeforeCompile;
      }
      if(preset==="original" || !palette){
        mat.color.setHex(mat.userData.settingsOriginalColor);
        mat.onBeforeCompile=
          mat.userData.settingsOriginalOnBeforeCompile || (()=>{});
        mat.customProgramCacheKey=
          ()=>`player_outfit_original_${garment}`;
        mat.needsUpdate=true;
        continue;
      }
      const target=new THREE.Color(palette[garment]);
      mat.color.setHex(0xffffff);
      mat.onBeforeCompile=(shader)=>{
        shader.uniforms.outfitTint={
          value:target.clone()
        };
        shader.fragmentShader=
          `uniform vec3 outfitTint;\n`+
          shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace(
          "#include <map_fragment>",
          `#include <map_fragment>
#ifdef USE_MAP
  float outfitLum=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));
  float outfitDetail=clamp(outfitLum*1.20+0.18,0.16,1.10);
  diffuseColor.rgb=outfitTint*outfitDetail;
#endif`
        );
      };
      mat.customProgramCacheKey=
        ()=>`player_outfit_${preset}_${garment}`;
      mat.needsUpdate=true;
    }
  });
}
function applyPlayerOutfitPreset(){
  applyOutfitPresetToRoot(player?.root,GAME_SETTINGS.outfit);
}
function applyStartPreviewOutfit(){
  applyOutfitPresetToRoot(
    START_PLAYER_PREVIEW?.root,
    GAME_SETTINGS.outfit
  );
}
for(const [el,key,parser] of [
  [setCamZoom,"cameraZoom",Number],
  [setCamHeight,"cameraHeightOffset",Number],
  [setCamLook,"cameraLookOffset",Number],
  [setCamFov,"cameraFov",Number]
]){
  el?.addEventListener("input",()=>{
    GAME_SETTINGS[key]=parser(el.value);
    updateSettingReadouts();
    refreshStartSummary();
  });
}
setOutfit?.addEventListener("change",()=>{
  GAME_SETTINGS.outfit=setOutfit.value;
  applyPlayerOutfitPreset();
  applyStartPreviewOutfit();
  const startOutfit=document.getElementById("startOutfit");
  if(startOutfit && startOutfit.value!==GAME_SETTINGS.outfit){
    startOutfit.value=GAME_SETTINGS.outfit;
  }
  refreshStartSummary();
});
setDifficulty?.addEventListener("change",()=>{
  GAME_SETTINGS.difficulty=setDifficulty.value;
  applyDifficultyGuidance();
  refreshStartSummary();
});
updateSettingReadouts();
applyDifficultyGuidance();
initGameStartScreen();

const LIGHT_COLLISION=createCollisionState();

const COLLISION_DEBUG={
  enabled:false,
  group:new THREE.Group(),
  staticMeshes:[],
  dynamicMeshes:new Map(),
  playerMeshes:[],
  colors:{
    player:0x00ff88,
    fence:0xff4fd8,
    door:0x4da6ff,
    wall:0xff5b5b,
    slot:0x9d6bff,
    car:0xffff55,
    npc:0x55e0ff,
    road:0xffffff,
    other:0xb7c4d6
  }
};
COLLISION_DEBUG.group.name="collision_debug_group";
COLLISION_DEBUG.group.visible=false;
scene.add(COLLISION_DEBUG.group);

const collisionDebugToggle=document.getElementById("collisionDebugToggle");
collisionDebugToggle?.addEventListener("click",()=>{
  COLLISION_DEBUG.enabled=!COLLISION_DEBUG.enabled;
  COLLISION_DEBUG.group.visible=COLLISION_DEBUG.enabled;
  collisionDebugToggle.classList.toggle("active",COLLISION_DEBUG.enabled);
  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
});
function collisionDebugColorFor(name=""){
  const n=String(name).toLowerCase();
  if(n.includes("fence") || n.includes("barric")) return COLLISION_DEBUG.colors.fence;
  if(n.includes("door")) return COLLISION_DEBUG.colors.door;
  if(n.includes("wall") || n.includes("facade") || n.includes("shop")) return COLLISION_DEBUG.colors.wall;
  if(n.includes("slot")) return COLLISION_DEBUG.colors.slot;
  if(n.includes("road")) return COLLISION_DEBUG.colors.road;
  return COLLISION_DEBUG.colors.other;
}
function makeDebugBoxMesh(hx,hz,height,color){
  const geo=new THREE.BoxGeometry(Math.max(.02,hx*2),Math.max(.08,height),Math.max(.02,hz*2));
  const mat=new THREE.MeshBasicMaterial({
    color,
    transparent:true,
    opacity:.24,
    depthWrite:false,
    wireframe:false
  });
  const mesh=new THREE.Mesh(geo,mat);
  const edges=new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({
      color,
      transparent:true,
      opacity:.95
    })
  );
  mesh.add(edges);
  mesh.renderOrder=999;
  return mesh;
}
function clearCollisionDebugStatic(){
  for(const mesh of COLLISION_DEBUG.staticMeshes){
    COLLISION_DEBUG.group.remove(mesh);
    mesh.traverse(o=>{
      if(o.geometry) o.geometry.dispose?.();
      if(o.material) o.material.dispose?.();
    });
  }
  COLLISION_DEBUG.staticMeshes.length=0;
}
function rebuildCollisionDebugStatic(){
  clearCollisionDebugStatic();
  for(const box of LIGHT_COLLISION.static){
    const yMin=Number.isFinite(box.yMin)?box.yMin:0;
    const yMax=Number.isFinite(box.yMax)?box.yMax:2;
    const h=Math.max(.12,yMax-yMin);
    const color=collisionDebugColorFor(box.name);
    let mesh;
    if(box.type==="ellipse"){
      const geo=new THREE.CylinderGeometry(
        1,
        1,
        h,
        64,
        1,
        false
      );
      geo.scale(
        Math.max(.04,box.majorRadius||box.hx||1),
        1,
        Math.max(.04,box.minorRadius||box.hz||1)
      );

      const mat=new THREE.MeshBasicMaterial({
        color,
        transparent:true,
        opacity:.22,
        depthWrite:false
      });

      mesh=new THREE.Mesh(geo,mat);
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({
            color,
            transparent:true,
            opacity:.95
          })
        )
      );
    }else if(box.type==="cylinder"){
      const geo=new THREE.CylinderGeometry(
        Math.max(.04,box.radius||box.hx),
        Math.max(.04,box.radius||box.hx),
        h,
        64,
        1,
        false
      );
      const mat=new THREE.MeshBasicMaterial({
        color,
        transparent:true,
        opacity:.22,
        depthWrite:false
      });
      mesh=new THREE.Mesh(geo,mat);
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({
            color,
            transparent:true,
            opacity:.95
          })
        )
      );
    }else{
      mesh=makeDebugBoxMesh(box.hx,box.hz,h,color);
    }
    mesh.name=`debug_${box.name||"static"}`;
    mesh.position.set(box.cx,yMin+h*.5,box.cz);
    mesh.rotation.y=box.yaw||0;
    COLLISION_DEBUG.group.add(mesh);
    COLLISION_DEBUG.staticMeshes.push(mesh);
  }
}
function rebuildCollisionDebugPlayer(){
  for(const mesh of COLLISION_DEBUG.playerMeshes){
    COLLISION_DEBUG.group.remove(mesh);
    mesh.traverse?.(o=>{
      o.geometry?.dispose?.();
      if(o.material){
        if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose?.());
        else o.material.dispose?.();
      }
    });
  }
  COLLISION_DEBUG.playerMeshes.length=0;
  rebuildPlayerCollisionBlocks();
  if(!PLAYER_CYLINDER_COLLIDER.ready || !player?.root) return;
  const c=PLAYER_CYLINDER_COLLIDER;
  const color=COLLISION_DEBUG.colors.player;
  const geo=new THREE.CylinderGeometry(
    c.radius,
    c.radius,
    c.height,
    32,
    1,
    false
  );
  const mat=new THREE.MeshBasicMaterial({
    color,
    transparent:true,
    opacity:.22,
    depthWrite:false
  });
  const mesh=new THREE.Mesh(geo,mat);
  mesh.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({
        color,
        transparent:true,
        opacity:.98
      })
    )
  );
  mesh.name="debug_player_cylinder";
  COLLISION_DEBUG.group.add(mesh);
  COLLISION_DEBUG.playerMeshes.push(mesh);
  updateCollisionDebugPlayer();
}
function updateCollisionDebugPlayer(){
  if(!COLLISION_DEBUG.enabled || !player?.root) return;
  rebuildPlayerCollisionBlocks();
  const mesh=COLLISION_DEBUG.playerMeshes[0];
  if(!mesh || !PLAYER_CYLINDER_COLLIDER.ready) return;
  const c=PLAYER_CYLINDER_COLLIDER;
  mesh.position.set(
    player.root.position.x+c.offsetX,
    player.root.position.y+c.offsetY+c.bottomY+c.height*.5,
    player.root.position.z+c.offsetZ
  );
  mesh.rotation.set(0,0,0);
}
function updateCollisionDebugDynamic(){
  if(!COLLISION_DEBUG.enabled) return;
  const activeNames=new Set();
  for(const dyn of LIGHT_COLLISION.dynamic){
    if(!dyn?.active) continue;
    activeNames.add(dyn.name);
    let mesh=COLLISION_DEBUG.dynamicMeshes.get(dyn.name);
    if(dyn.car){
      const fullLength=Math.max(.02,(dyn.hx||.5)*2);
      const fullWidth=Math.max(.02,(dyn.hz||.5)*2);
      const height=Math.max(.02,dyn.height||1.5);
      const roundness=THREE.MathUtils.clamp(dyn.roundness||0,0,.98);
      const signature=
        `${fullLength.toFixed(3)}|${fullWidth.toFixed(3)}|`+
        `${height.toFixed(3)}|${roundness.toFixed(3)}`;
      if(!mesh || mesh.userData.roundedSignature!==signature){
        if(mesh){
          COLLISION_DEBUG.group.remove(mesh);
          mesh.traverse?.(o=>{
            o.geometry?.dispose?.();
            if(o.material){
              if(Array.isArray(o.material)){
                o.material.forEach(m=>m.dispose?.());
              }else{
                o.material.dispose?.();
              }
            }
          });
        }
        const color=COLLISION_DEBUG.colors.car;
        const group=new THREE.Group();
        const radius=
          Math.min(fullLength,fullWidth)*.5*roundness;
        const shape=new THREE.Shape();
        if(radius<=.001){
          shape.moveTo(-fullLength*.5,-fullWidth*.5);
          shape.lineTo(fullLength*.5,-fullWidth*.5);
          shape.lineTo(fullLength*.5,fullWidth*.5);
          shape.lineTo(-fullLength*.5,fullWidth*.5);
          shape.closePath();
        }else{
          const x0=-fullLength*.5;
          const x1= fullLength*.5;
          const z0=-fullWidth*.5;
          const z1= fullWidth*.5;
          shape.moveTo(x0+radius,z0);
          shape.lineTo(x1-radius,z0);
          shape.quadraticCurveTo(x1,z0,x1,z0+radius);
          shape.lineTo(x1,z1-radius);
          shape.quadraticCurveTo(x1,z1,x1-radius,z1);
          shape.lineTo(x0+radius,z1);
          shape.quadraticCurveTo(x0,z1,x0,z1-radius);
          shape.lineTo(x0,z0+radius);
          shape.quadraticCurveTo(x0,z0,x0+radius,z0);
          shape.closePath();
        }
        const geo=new THREE.ExtrudeGeometry(shape,{
          depth:height,
          bevelEnabled:false,
          curveSegments:8
        });
        geo.rotateX(Math.PI/2);
        geo.translate(0,height*.5,0);
        const mat=new THREE.MeshBasicMaterial({
          color,
          transparent:true,
          opacity:.22,
          depthWrite:false
        });
        const body=new THREE.Mesh(geo,mat);
        group.add(body);
        const edges=new THREE.LineSegments(
          new THREE.EdgesGeometry(geo,15),
          new THREE.LineBasicMaterial({
            color,
            transparent:true,
            opacity:.95
          })
        );
        group.add(edges);
        mesh=group;
        mesh.name=`debug_dynamic_${dyn.name}`;
        mesh.userData.roundedSignature=signature;
        COLLISION_DEBUG.group.add(mesh);
        COLLISION_DEBUG.dynamicMeshes.set(dyn.name,mesh);
      }
    }else if(!mesh){
      const color=COLLISION_DEBUG.colors.npc;
      const r=dyn.radius||.42;
      const geo=new THREE.CylinderGeometry(r,r,1.955,16);
      const mat=new THREE.MeshBasicMaterial({
        color,
        transparent:true,
        opacity:.22,
        depthWrite:false
      });
      mesh=new THREE.Mesh(geo,mat);
      const edges=new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color,
          transparent:true,
          opacity:.95
        })
      );
      mesh.add(edges);
      mesh.name=`debug_dynamic_${dyn.name}`;
      COLLISION_DEBUG.group.add(mesh);
      COLLISION_DEBUG.dynamicMeshes.set(dyn.name,mesh);
    }
    mesh.visible=true;
    mesh.position.set(
      dyn.x,
      player?.root?.position?.y+0.05 || .05,
      dyn.z
    );
    mesh.rotation.y=dyn.yaw||0;
    mesh.updateMatrixWorld(true);
  }
  for(const [name,mesh] of COLLISION_DEBUG.dynamicMeshes){
    if(!activeNames.has(name)) mesh.visible=false;
  }
}

const lcMakeBox=(...args)=>makeBoxCollider(LIGHT_COLLISION,...args);
const lcMakeCylinder=(...args)=>makeCylinderCollider(LIGHT_COLLISION,...args);
const lcMakeEllipse=(...args)=>makeEllipseCollider(LIGHT_COLLISION,...args);
const lcBounds=(obj)=>getColliderBounds(THREE,obj);
const lcAddObjectBox=(obj,options)=>addObjectBoxCollider(
  THREE,
  LIGHT_COLLISION,
  obj,
  options
);
const lcCircleBoxOverlap=(...args)=>circleBoxOverlap(THREE,...args);
const lcPlayerCylinderVsStaticCollider=(...args)=>
  playerCylinderVsStaticCollider(THREE,...args);

function rebuildPlayerCollisionBlocks(){
  return rebuildPlayerCylinderCollision({
    THREE,
    state:LIGHT_COLLISION,
    player,
    playerCollider:PLAYER_CYLINDER_COLLIDER
  });
}
function buildPlayerCompoundCollider(){
  return ensurePlayerCylinderCollision({
    rebuildPlayer:rebuildPlayerCollisionBlocks,
    playerCollider:PLAYER_CYLINDER_COLLIDER
  });
}

function lcCompoundStaticBlockedAt(x,z,playerY){
  return staticCollisionBlockedAt({
    state:LIGHT_COLLISION,
    playerCollider:PLAYER_CYLINDER_COLLIDER,
    x,z,playerY,
    ensurePlayer:buildPlayerCompoundCollider,
    playerVsStatic:lcPlayerCylinderVsStaticCollider
  });
}
function lcIsBlockedAt(x,z,playerY){
  return collisionBlockedAt({
    state:LIGHT_COLLISION,
    x,z,playerY,
    staticBlockedAt:lcCompoundStaticBlockedAt,
    dynamicBlockedAt:lcDynamicBlockedAt
  });
}
function lcResolveMovement(previousPosition){
  return resolvePlayerCollisionMovement({
    state:LIGHT_COLLISION,
    player,
    previousPosition,
    isBlockedAt:lcIsBlockedAt
  });
}
function lcBuildFence(){
  return buildEditableFenceCollisions({
    state:LIGHT_COLLISION,
    editableFenceSystem,
    bounds:lcBounds,
    makeBox:lcMakeBox
  });
}

const PERMANENT_CHARACTER_COLLISION_TRANSFORMS=new WeakMap();

function getPermanentCharacterCollisionTransform(character){
  const root=character?.root;
  if(!root) return null;

  let fixed=PERMANENT_CHARACTER_COLLISION_TRANSFORMS.get(character);

  if(!fixed){
    fixed={
      position:root.position.clone(),
      quaternion:root.quaternion.clone(),
      scale:root.scale.clone()
    };

    PERMANENT_CHARACTER_COLLISION_TRANSFORMS.set(character,fixed);
  }

  return fixed;
}

function buildCharacterCollisionsAtPermanentTransforms(characters,callback){
  const visuals=[];

  for(const character of characters){
    const root=character?.root;
    const fixed=getPermanentCharacterCollisionTransform(character);
    if(!root || !fixed) continue;

    visuals.push({
      root,
      position:root.position.clone(),
      quaternion:root.quaternion.clone(),
      scale:root.scale.clone()
    });


    root.position.copy(fixed.position);
    root.quaternion.copy(fixed.quaternion);
    root.scale.copy(fixed.scale);
    root.updateMatrixWorld(true);
  }

  let result;

  try{
    result=callback();
  }finally{

    for(const snap of visuals){
      snap.root.position.copy(snap.position);
      snap.root.quaternion.copy(snap.quaternion);
      snap.root.scale.copy(snap.scale);
      snap.root.updateMatrixWorld(true);
    }
  }

  return result;
}

function lcSyncAllCharacters(){
  const characterList=
    typeof npcs==="undefined"
      ? []
      : npcs.filter(npc=>npc?.root);

  const collisionCharacters=[...characterList];

  if(typeof EVENT_GIRL!=="undefined" && EVENT_GIRL?.root){
    collisionCharacters.push(EVENT_GIRL);
  }

  return buildCharacterCollisionsAtPermanentTransforms(
    collisionCharacters,
    ()=>syncCharacterCollisions({
      THREE,
      state:LIGHT_COLLISION,
      npcs:characterList,
      eventGirl:
        typeof EVENT_GIRL!=="undefined"
          ? EVENT_GIRL
          : null,
      bounds:lcBounds
    })
  );
}
function lcSyncCars(){
  return syncCarCollisions({
    THREE,
    state:LIGHT_COLLISION,
    cars:STREET_ASSETS?.cars || [],
    crosswalk:CROSSWALK,
    carCollisionEdit:CAR_COLLISION_EDIT
  });
}
let LC_DOOR_CACHE=null;

function lcGetDoors(){
  const doors=[
    scene.getObjectByName("doorCasino_model"),
    scene.getObjectByName("doorPub_model")
  ].filter(Boolean);

  if(doors.length){
    LC_DOOR_CACHE=doors;
  }

  return doors.length
    ? doors
    : (LC_DOOR_CACHE || []);
}

function rebuildArchitecturalDoorColliders(){
  rebuildArchitecturalDoorCollisionData({
    state:LIGHT_COLLISION,
    config:SCENE_ENV_CONFIG,
    makeBox:lcMakeBox
  });
  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
}

function lcSyncShopDoors(){
  return syncDynamicDoorCollisions({
    THREE,
    state:LIGHT_COLLISION,
    doors:lcGetDoors(),
    bounds:lcBounds
  });
}
const lcCircleRoundedBoxOverlap=(...args)=>
  circleRoundedBoxOverlap(THREE,...args);

function lcDynamicBlockedAt(x,z,playerY){
  return dynamicCollisionBlockedAt({
    state:LIGHT_COLLISION,
    x,
    z,
    circleBox:lcCircleBoxOverlap,
    circleRoundedBox:lcCircleRoundedBoxOverlap
  });
}
function lcUpdateDynamicCars(dt){
  return updateDynamicCarCollisions({
    state:LIGHT_COLLISION,
    dt,
    syncCars:lcSyncCars
  });
}
function lcAddCoreArchitecture(){
  buildCoreArchitectureCollisions({
    state:LIGHT_COLLISION,
    scene,
    config:SCENE_ENV_CONFIG,
    bounds:lcBounds,
    makeBox:lcMakeBox,
    addObjectBox:lcAddObjectBox,
    skipExteriorNames:[
      "casino_poker_table",
      "casino_reception",
      "casino_receptionist_girl",
      "casino_claw_machine_complete",
      "casino_jukebox",
      "casino_tv_sony",
      "casino_tv_sony_2",
      "casino_boy",
      "casino_child"
    ]
  });
}

function lcBuildSlotColliders(){
  LIGHT_COLLISION.static=LIGHT_COLLISION.static.filter(
    b=>!String(b.name).startsWith("slot_machine_")
  );
}

function lcAddImportantProps(){
  buildImportantGardenPropCollisions({
    THREE,
    state:LIGHT_COLLISION,
    gardenFeatures:GARDEN_FEATURES,
    gardenMuseum:GARDEN_MUSEUM,
    newTelescope:
      typeof NEW_TELESCOPE==="undefined"
        ? null
        : NEW_TELESCOPE,
    telescopeMode:TELESCOPE_MODE,
    palms:COASTAL_ASSETS?.palms || [],
    outsideLamps:STREET_ASSETS?.shortLamps || [],
    insideLamps:GARDEN_EXHIBITION_LAMPS?.lamps || [],
    removePrefix:(prefix)=>removeGardenCollisionPrefix(
      LIGHT_COLLISION,
      GARDEN_COLLISION_EDITOR_REGISTRY,
      prefix
    ),
    bounds:lcBounds,
    makeBox:lcMakeBox,
    makeCylinder:lcMakeCylinder,
    addBox:(obj,name,options={})=>addGardenBoxCollision(
      THREE,
      LIGHT_COLLISION,
      GARDEN_COLLISION_EDITOR_REGISTRY,
      obj,
      name,
      options
    ),
    addCylinder:(obj,name,options={})=>addGardenCylinderCollision(
      THREE,
      LIGHT_COLLISION,
      GARDEN_COLLISION_EDITOR_REGISTRY,
      obj,
      name,
      options
    ),
    addPanelBox:(obj,name,label)=>addGardenPanelCollision(
      THREE,
      LIGHT_COLLISION,
      GARDEN_COLLISION_EDITOR_REGISTRY,
      obj,
      name,
      label
    ),
    remember:(collider,meta={})=>rememberGardenCollision(
      GARDEN_COLLISION_EDITOR_REGISTRY,
      collider,
      meta
    ),
    rebuildTrees:rebuildDefinitiveGardenTreeCollisions,
    rebuildTreeShadows:rebuildProceduralGardenTreeShadows
  });

  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
  }

}

const PROCEDURAL_GARDEN_TREE_SHADOWS=
  createProceduralGardenTreeShadowSystem(
    scene,
    DEFINITIVE_GARDEN_TREE_COLLISIONS,
    {
      offsetX:-0.60,
      offsetZ:2.58,
      opacity:.46
    }
  );

function rebuildProceduralGardenTreeShadows(){
  return PROCEDURAL_GARDEN_TREE_SHADOWS.rebuild();
}

function rebuildShopFrontLampCollisions(){
  rebuildShopFrontLampCollisionData({
    THREE,
    state:LIGHT_COLLISION,
    registry:GARDEN_COLLISION_EDITOR_REGISTRY,
    scene,
    makeCylinder:lcMakeCylinder,
    remember:(collider,meta={})=>rememberGardenCollision(
      GARDEN_COLLISION_EDITOR_REGISTRY,
      collider,
      meta
    )
  });

  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
}

function rebuildDefinitiveGardenTreeCollisions(){
  rebuildDefinitiveGardenTreeCollisionData({
    state:LIGHT_COLLISION,
    registry:GARDEN_COLLISION_EDITOR_REGISTRY,
    treeCollisions:DEFINITIVE_GARDEN_TREE_COLLISIONS,
    makeCylinder:lcMakeCylinder
  });

  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
}


function refreshGardenGatewayPostCollisions(){
  refreshGardenGatewayPostCollisionData({
    THREE,
    state:LIGHT_COLLISION,
    gatePosts:CEREMONIAL_GATE_POSTS,
    makeBox:lcMakeBox
  });

  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
  }
}

function refreshGardenObjectCollisions(){
  if(!LIGHT_COLLISION?.built) return;
  lcAddImportantProps();
  refreshGardenGatewayPostCollisions();
  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
}
function lcBuildBarricadeFromVisual(){
  buildBarricadeCollisions({
    THREE,
    state:LIGHT_COLLISION,
    originalBarricades:COASTAL_ASSETS?.barricades,
    largeBarricadeGroup:
      scene.getObjectByName(
        "static_gate_barricades_curve"
      ),
    bounds:lcBounds,
    makeBox:lcMakeBox
  });

  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
  }
}
function lcBuildAll(){
  if(LIGHT_COLLISION.built) return;
  lcBuildFence();
  lcBuildGardenBoundaryFence();
  lcAddCoreArchitecture();
  lcAddImportantProps();
  lcBuildSlotColliders();
  lcBuildBarricadeFromVisual();
LIGHT_COLLISION.built=true;
  lcSyncAllCharacters();
  lcSyncCars();
  lcSyncShopDoors();
  rebuildArchitecturalDoorColliders();
}

scene.background=new THREE.Color(0x02030b);
scene.fog=new THREE.FogExp2(0x07101f,0.00072);
EnvironmentBuilders.createNightStars({
  scene
});
if(typeof EnvironmentBuilders.createMoon!=="function"){
  throw new Error(
    "Environment.js is outdated: missing export createMoon(). Replace it with the supplied Environment_FIXED.txt renamed to Environment.js."
  );
}
EnvironmentBuilders.createMoon({THREE,scene});
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,2000);
const CAMERA_ZONE_SETTINGS={
  outside:{distance:11.9,height:7.15,lookAhead:1.8},
  leftRoom:{distance:6.8,height:4.9,lookAhead:1.3},
  rightRoom:{distance:6.8,height:4.9,lookAhead:1.3},
  thirdRoom:{distance:6.8,height:4.9,lookAhead:1.3}
};
const renderer=new THREE.WebGLRenderer({
  antialias:true,
  powerPreference:"high-performance"
});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;
renderer.shadowMap.needsUpdate=false;
document.body.appendChild(renderer.domElement);

const MAX_PERF={
  interaction:0,fx:0,water:0,cars:0,girl:0,collision:0,visibility:0,npc:0,lights:0,
  questPresence:0,editorUi:0,
  farDecor:[],
  interactionStep:1/12,
  fxStep:1/20,
  waterStep:1/24,
  carsStep:1/30,
  girlStep:1/30,
  collisionStep:1/24,
  visibilityStep:.45,
  npcStep:1/24,
  lightsStep:2,
  questPresenceStep:1/10,
  editorUiStep:1/5
};
function maxPerfCacheFarDecor(){
  MAX_PERF.farDecor.length=0;
  scene.traverse(o=>{
    if(o?.name==="distant_mountains_glb") MAX_PERF.farDecor.push(o);
  });
}
function maxPerfRootLocalMeshDescriptors(root){
  root.updateMatrixWorld(true);
  const rootInv=
    root.matrixWorld.clone().invert();
  const descriptors=[];
  root.traverse(obj=>{
    if(!obj?.isMesh || obj.isSkinnedMesh) return;
    const relative=
      rootInv.clone().multiply(obj.matrixWorld);
    descriptors.push({
      geometry:obj.geometry,
      material:obj.material,
      relative,
      name:obj.name||"mesh"
    });
  });
  return descriptors;
}
function maxPerfRootLocalBounds(root){
  root.updateMatrixWorld(true);
  const rootInv=
    root.matrixWorld.clone().invert();
  const result=new THREE.Box3();
  result.makeEmpty();
  root.traverse(obj=>{
    if(!obj?.isMesh || !obj.geometry) return;
    if(!obj.geometry.boundingBox){
      obj.geometry.computeBoundingBox();
    }
    if(!obj.geometry.boundingBox) return;
    const rel=
      rootInv.clone().multiply(obj.matrixWorld);
    const b=
      obj.geometry.boundingBox
        .clone()
        .applyMatrix4(rel);
    result.union(b);
  });
  return result;
}
function maxPerfBuildInstancedGLB(
  sourceRoot,
  rootMatrices,
  name
){
  const group=new THREE.Group();
  group.name=name;
  const descriptors=
    maxPerfRootLocalMeshDescriptors(sourceRoot);
  for(let m=0;m<descriptors.length;m++){
    const d=descriptors[m];
    let instanceGeometry=d.geometry;
    const hasMorphTargets=
      instanceGeometry?.morphAttributes &&
      Object.values(instanceGeometry.morphAttributes)
        .some(arr=>Array.isArray(arr) && arr.length>0);
    if(hasMorphTargets){
      instanceGeometry=instanceGeometry.clone();
      instanceGeometry.morphAttributes={};
      instanceGeometry.morphTargetsRelative=false;
    }
    const inst=new THREE.InstancedMesh(
      instanceGeometry,
      d.material,
      rootMatrices.length
    );
    inst.name=`${name}_mesh_${m}_${d.name}`;
    inst.castShadow=false;
    inst.receiveShadow=true;
    inst.frustumCulled=true;
    inst.matrixAutoUpdate=false;
    inst.morphTargetInfluences=undefined;
    const finalMatrix=new THREE.Matrix4();
    for(let i=0;i<rootMatrices.length;i++){
      finalMatrix
        .copy(rootMatrices[i])
        .multiply(d.relative);
      inst.setMatrixAt(i,finalMatrix);
    }
    inst.instanceMatrix.setUsage(
      THREE.StaticDrawUsage
    );
    inst.instanceMatrix.needsUpdate=true;
    inst.computeBoundingSphere();
    inst.computeBoundingBox();
    group.add(inst);
  }
  group.userData.instanceCount=rootMatrices.length;
  group.userData.instancedSource=sourceRoot.name||"source";
  return group;
}
function maxPerfFreeze(root){
  if(!root) return;
  root.traverse(o=>{
    if(!o || o.isBone || o.isSkinnedMesh) return;
    o.updateMatrix();
    o.matrixAutoUpdate=false;
    if(o.isMesh){
      o.castShadow=false;
      o.frustumCulled=true;
    }
  });
}
const loadingManager=new THREE.LoadingManager();
let sceneBooted=false;

let gameplayInputEnabled=false;
let mainAnimationStarted=false;
const STARTUP_STABILIZATION_MS=2000;
let moduleInitializationComplete=false;
let loadingCompletedBeforeModuleInit=false;
loadingManager.onStart=(url,itemsLoaded,itemsTotal)=>{
  if(START_GATE.accepted && loadingScreen){
    loadingScreen.classList.remove("hidden");
  }
};
function setLoadingProgress(pct,status){
  const safe=Math.max(0,Math.min(100,Math.round(pct)));
  loadingDisplayedPct=Math.max(loadingDisplayedPct,safe);
  if(loadingBar) loadingBar.style.width=loadingDisplayedPct+"%";
  if(loadingPercent) loadingPercent.textContent=`${Math.round(Number(loadingDisplayedPct)||0)}%`;
  if(loadingText && status) loadingText.textContent=status;
}
loadingManager.onProgress=(url,itemsLoaded,itemsTotal)=>{
  const assetPct=itemsTotal>0 ? (itemsLoaded/itemsTotal)*25 : 0;
  setLoadingProgress(assetPct,"Loading assets");
};
loadingManager.onError=(url)=>{
  if(loadingText) loadingText.textContent="Loading remaining assets";
};
async function warmUpPlayerBehindLoading(done){
  setLoadingProgress(25,"Compiling graphics");
  try{
    renderer.compile(scene,camera);
  }catch(e){
  }
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const root=player?.root;
  const originalPlayerPos=root?.position?.clone?.() || null;
  const originalPlayerRot=root?.rotation?.y ?? 0;
  const originalCamPos=camera.position.clone();
  const originalCamQuat=camera.quaternion.clone();
  function updateWarmWorld(){
    try{
      if(typeof updateStreetCar==="function") updateStreetCar();if(typeof updateSlidingDoors==="function") updateSlidingDoors();
      if(typeof updatePerformanceVisibility==="function") updatePerformanceVisibility();
      updateTikiVisibilityCulling();
      if(typeof npcs!=="undefined"){
        for(const npc of npcs){
          if(!npc?.ready) continue;
          try{
            if(typeof updateNPC==="function") updateNPC(npc);
          }catch(e){}
        }
      }
    }catch(e){}
  }
  const views=[];
  const addView=(px,py,pz,lx,ly,lz)=>{
    views.push({
      pos:new THREE.Vector3(px,py,pz),
      look:new THREE.Vector3(lx,ly,lz)
    });
  };
  for(const x of [-70,-45,-20,0,20,45,70]){
    addView(x,6.5,18, x*.35,2.5,-12);
    addView(x,10.5,34, x*.25,3,-10);
  }
  for(const z of [5,-5,-15,-25]){
    addView(-62,5.5,z+8,-88,1,z-8);
    addView(-96,7,z,-72,2,z+6);
  }
  for(const z of [5,-5,-15,-25]){
    addView(62,5.5,z+8,88,1,z-8);
    addView(96,7,z,72,2,z+6);
  }
  for(const x of [-32,-22,-12]){
    addView(x,5.5,-5,-22,2,-20);
    addView(x,7.5,-28,-22,2,-10);
  }
  for(const x of [12,22,32]){
    addView(x,5.5,-5,22,2,-20);
    addView(x,7.5,-28,22,2,-10);
  }
  for(const x of [-50,-20,10,40,70]){
    addView(x,8,58,x*.65,1,78);
    addView(x,10,82,x*.55,-.5,105);
  }
  for(const x of [-60,-20,20,60,100]){
    addView(x,12,110,x*.4,-1,150);
    addView(x,16,145,x*.2,-1,185);
  }
  addView(110,18,35,250,8,-80);
  addView(155,16,-20,260,7,-105);
  addView(210,22,15,330,10,-120);
  addView(120,10,-70,160,1,-95);
  addView(0,42,15,0,0,60);
  addView(0,55,90,0,-1,130);
  addView(80,50,10,40,0,70);
  addView(-80,50,10,-40,0,70);
  let viewIndex=0;
  let viewFrame=0;
  const framesPerView=2;
  const totalViewFrames=views.length*framesPerView;
  function renderFullSceneViews(){
    const view=views[viewIndex];
    camera.position.copy(view.pos);
    camera.lookAt(view.look);
    updateWarmWorld();
  updateTaskBarrierSmoothTurn(1/60);
  updateCameraFillLight(CAMERA_FILL_LIGHT,camera,player);
  updateSecurityPostTalkArms();
  updateChildPostTalkArms();

  renderer.render(scene,camera);
    viewFrame++;
    const doneFrames=viewIndex*framesPerView+viewFrame;
    const pct=25+Math.round((doneFrames/totalViewFrames)*55);
    setLoadingProgress(pct,"Rendering world");
    if(viewFrame<framesPerView){
      requestAnimationFrame(renderFullSceneViews);
      return;
    }
    viewFrame=0;
    viewIndex++;
    if(viewIndex<views.length){
      requestAnimationFrame(renderFullSceneViews);
      return;
    }
    startMovementWarmup();
  }
  function startMovementWarmup(){
    if(!root || !originalPlayerPos){
      finishWarmup();
      return;
    }
    const sideFrames=10;
    const squareSize=3.0;
    const totalFrames=sideFrames*4;
    let frame=0;
    const p0=originalPlayerPos.clone();
    const p1=p0.clone().add(new THREE.Vector3(squareSize,0,0));
    const p2=p1.clone().add(new THREE.Vector3(0,0,squareSize));
    const p3=p2.clone().add(new THREE.Vector3(-squareSize,0,0));
    const p4=p0.clone();
    const corners=[p0,p1,p2,p3,p4];
    function lerpAngleLocal(a,b,t){
      const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
      return a+delta*t;
    }
    function movementStep(){
      const side=Math.min(3,Math.floor(frame/sideFrames));
      const localFrame=frame-side*sideFrames;
      const t=Math.min(1,localFrame/(sideFrames-1));
      const eased=t*t*(3-2*t);
      const a=corners[side];
      const b=corners[side+1];
      root.position.lerpVectors(a,b,eased);
      const dx=b.x-a.x;
      const dz=b.z-a.z;
      root.rotation.y=lerpAngleLocal(root.rotation.y,Math.atan2(dx,dz),.25);
      try{
        if(typeof animatePlayerWalk==="function") animatePlayerWalk(player);
      }catch(e){}
      updateWarmWorld();
      try{
        if(typeof updateCleanPlayerCamera==="function") updateCleanPlayerCamera();
      }catch(e){}
      renderer.render(scene,camera);
      frame++;
      const pct=80+Math.round((frame/totalFrames)*15);
      setLoadingProgress(pct,"Warming up gameplay");
      if(frame<totalFrames){
        requestAnimationFrame(movementStep);
      }else{
        root.position.copy(originalPlayerPos);
        root.rotation.y=originalPlayerRot;
        startRapidTurnWarmup();
      }
    }
    requestAnimationFrame(movementStep);
  }
  function startRapidTurnWarmup(){
    if(!root || !originalPlayerPos){
      finishWarmup();
      return;
    }
    const turnTargets=[];
    const fullTurns=3;
    const stepsPerTurn=16;
    for(let lap=0;lap<fullTurns;lap++){
      for(let i=0;i<stepsPerTurn;i++){
        const dir=(lap%2===0 ? 1 : -1);
        turnTargets.push(
          originalPlayerRot+
          dir*(i/stepsPerTurn)*Math.PI*2
        );
      }
    }
    turnTargets.push(
      originalPlayerRot,
      originalPlayerRot+Math.PI,
      originalPlayerRot,
      originalPlayerRot+Math.PI*.5,
      originalPlayerRot-Math.PI*.5,
      originalPlayerRot+Math.PI*.75,
      originalPlayerRot-Math.PI*.75,
      originalPlayerRot+Math.PI*.25,
      originalPlayerRot-Math.PI*.25,
      originalPlayerRot
    );
    const framesPerTurn=8;
    const totalTurnFrames=turnTargets.length*framesPerTurn;
    let targetIndex=0;
    let localFrame=0;
    let renderedFrames=0;
    const warmMoveRadius=.45;
    try{
      renderer.compile(scene,camera);
    }catch(e){}
    function rapidTurnStep(){
      const target=turnTargets[targetIndex];
      const delta=Math.atan2(
        Math.sin(target-root.rotation.y),
        Math.cos(target-root.rotation.y)
      );
      root.rotation.y+=delta*.82;
      const phase=(renderedFrames/Math.max(1,totalTurnFrames))*Math.PI*8;
      root.position.set(
        originalPlayerPos.x+Math.cos(phase)*warmMoveRadius,
        originalPlayerPos.y,
        originalPlayerPos.z+Math.sin(phase)*warmMoveRadius
      );
      try{
        if(typeof animatePlayerWalk==="function"){
          animatePlayerWalk(player);
        }
      }catch(e){}
      updateWarmWorld();
      try{
        if(typeof updateCleanPlayerCamera==="function"){
          updateCleanPlayerCamera();
        }
      }catch(e){}
      scene.updateMatrixWorld(true);
      renderer.render(scene,camera);
      if((renderedFrames%4)===0){
        renderer.render(scene,camera);
      }
      renderedFrames++;
      localFrame++;
      const pct=95+Math.min(
        4,
        Math.round((renderedFrames/totalTurnFrames)*4)
      );
      setLoadingProgress(pct,"Deep warming player turns");
      if(localFrame>=framesPerTurn){
        localFrame=0;
        targetIndex++;
      }
      if(targetIndex<turnTargets.length){
        requestAnimationFrame(rapidTurnStep);
        return;
      }
      root.position.copy(originalPlayerPos);
      root.rotation.y=originalPlayerRot;
      try{
        if(typeof animateIdle==="function"){
          animateIdle(player);
        }
      }catch(e){}
      try{
        renderer.compile(scene,camera);
        scene.updateMatrixWorld(true);
        renderer.render(scene,camera);
        renderer.render(scene,camera);
      }catch(e){}
      finishWarmup();
    }
    requestAnimationFrame(rapidTurnStep);
  }
  function prepareStaticGardenShadowCasters(){
    const gardenBounds={
      xMin:-46,
      xMax:52,
      zMin:57,
      zMax:132
    };

    scene.updateMatrixWorld(true);

    const worldPos=new THREE.Vector3();

    scene.traverse(obj=>{
      if(!obj?.isMesh) return;
      if(obj.isSkinnedMesh) return;

      obj.getWorldPosition(worldPos);

      if(
        worldPos.x<gardenBounds.xMin ||
        worldPos.x>gardenBounds.xMax ||
        worldPos.z<gardenBounds.zMin ||
        worldPos.z>gardenBounds.zMax
      ){
        return;
      }

      const token=String(obj.name||"").toLowerCase();

      if(
        /player|npc_|car_|vehicle|water|glow|sprite|star|moon/.test(token)
      ){
        return;
      }

      const isGardenLampOrExhibitSign=
        /lamp|lampione|exhibition_lamp|sign|label|plaque|panel|exhibit/.test(token);

      const materials=
        Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

      const opaque=materials.some(material=>{
        if(!material) return false;
        if(material.transparent && Number(material.opacity)<.95) return false;
        return true;
      });

      if(!opaque && !isGardenLampOrExhibitSign) return;

      obj.castShadow=true;
      obj.receiveShadow=true;
    });

    if(GARDEN_FRONT_CONCRETE_STRIP?.mesh){
      GARDEN_FRONT_CONCRETE_STRIP.mesh.castShadow=false;
      GARDEN_FRONT_CONCRETE_STRIP.mesh.receiveShadow=true;
    }

    for(const lamp of GARDEN_EXHIBITION_LAMPS?.lamps || []){
      if(!lamp) continue;
      lamp.traverse?.(obj=>{
        if(!obj?.isMesh) return;
        obj.castShadow=true;
        obj.receiveShadow=true;
      });
      lamp.updateMatrixWorld?.(true);
    }

    CEREMONY_GARDEN.group?.traverse?.(obj=>{
      if(!obj?.isMesh) return;
      const token=(
        String(obj.name||"")+" "+
        String(obj.parent?.name||"")+" "+
        String(obj.material?.name||"")
      ).toLowerCase();
      if(
        !/sign|label|plaque|panel|exhibit|info|explanation|description/.test(token)
      ){
        return;
      }
      obj.castShadow=true;
      obj.receiveShadow=true;
      obj.updateMatrixWorld?.(true);
    });

    scene.traverse(obj=>{
      if(!obj?.isMesh) return;
      const token=(
        String(obj.name||"")+" "+
        String(obj.parent?.name||"")+" "+
        String(obj.material?.name||"")
      ).toLowerCase();
      if(
        !/barricade|barrier|barricata/.test(token)
      ){
        return;
      }
      const worldPosition=new THREE.Vector3();
      obj.getWorldPosition(worldPosition);
      if(
        worldPosition.x<-46 ||
        worldPosition.x>52 ||
        worldPosition.z<56 ||
        worldPosition.z>132
      ){
        return;
      }
      obj.castShadow=true;
      obj.receiveShadow=true;
      obj.updateMatrixWorld?.(true);
    });

    const gateBarricades=
      scene.getObjectByName("static_gate_barricades_curve");

    gateBarricades?.traverse?.(obj=>{
      if(!obj?.isMesh && !obj?.isInstancedMesh) return;
      obj.castShadow=true;
      obj.receiveShadow=true;
      obj.frustumCulled=true;
      obj.updateMatrixWorld?.(true);
    });

    for(const name of [
      "beach_barricade_segment_78",
      "beach_barricade_segment_91"
    ]){
      const barricade=scene.getObjectByName(name);
      barricade?.traverse?.(obj=>{
        if(!obj?.isMesh) return;
        obj.castShadow=true;
        obj.receiveShadow=true;
        obj.updateMatrixWorld?.(true);
      });
    }

    moonLight.castShadow=true;

    if(moonLight.shadow){
      moonLight.shadow.mapSize.set(2048,2048);
      moonLight.shadow.bias=-0.00035;
      moonLight.shadow.normalBias=.02;

      const shadowCamera=moonLight.shadow.camera;
      if(shadowCamera){
        shadowCamera.left=-150;
        shadowCamera.right=150;
        shadowCamera.top=150;
        shadowCamera.bottom=-150;
        shadowCamera.near=.5;
        shadowCamera.far=650;
        shadowCamera.updateProjectionMatrix?.();
      }
    }
  }

  function bakeStaticGardenShadows(){
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.autoUpdate=false;

    prepareStaticGardenShadowCasters();

    scene.updateMatrixWorld(true);

    renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);

    renderer.shadowMap.needsUpdate=false;
    renderer.shadowMap.autoUpdate=false;
  }

  function finishWarmup(){
    camera.position.copy(originalCamPos);
    camera.quaternion.copy(originalCamQuat);
    let settle=0;
    const settleFrames=6;
    function settleStep(){
      updateWarmWorld();
      if(root && originalPlayerPos){
        root.position.copy(originalPlayerPos);
        root.rotation.y=originalPlayerRot;
      }
      try{
        if(typeof updateCleanPlayerCamera==="function") updateCleanPlayerCamera();
      }catch(e){}
      renderer.render(scene,camera);
      settle++;
      const pct=95+Math.round((settle/settleFrames)*5);
      setLoadingProgress(pct,"Finalizing");
      if(settle<settleFrames){
        requestAnimationFrame(settleStep);
      }else{
        setLoadingProgress(99,"Stabilizing");
        scene.updateMatrixWorld(true);
        try{
          renderer.compile(scene,camera);
        }catch(e){}
        renderer.render(scene,camera);
        setTimeout(()=>{
          scene.updateMatrixWorld(true);
          bakeStaticGardenShadows();
          scene.updateMatrixWorld(true);
          renderer.shadowMap.needsUpdate=true;
          renderer.render(scene,camera);
          renderer.shadowMap.needsUpdate=false;
          renderer.shadowMap.autoUpdate=false;
          setLoadingProgress(100,"Ready");
          done();
        },STARTUP_STABILIZATION_MS);
      }
    }
    requestAnimationFrame(settleStep);
  }
  requestAnimationFrame(renderFullSceneViews);
}
function finishSceneLoading(){
  if(!START_GATE.accepted) return;
  if(!moduleInitializationComplete) {
    loadingCompletedBeforeModuleInit=true;
    return;
  }
  if(sceneBooted) return;
  sceneBooted=true;
  setTimeout(()=>{
    if(!scene.getObjectByName("static_gate_barricades_curve")){
      buildStaticGateBarricades();
    }
  },1000);
  gardenBuild("buildCeremonyGarden");
  gardenBuild("syncGardenCenterAxis");
  gardenBuild("loadGardenFeatureModels");
  gardenBuild("loadGardenMuseumExhibits");
  gardenBuild("loadGardenTelescopeModel");
  createTelescopeObservationStars();
  initTelescopeObservationUI();

  gardenBuild("buildGardenSideGrassFill");
  gardenBuild("applyGardenWidthCompression");
  applyIndependentRoseFenceTransforms();
  setTimeout(()=>gardenBuild("positionGardenPalmsOutsidePavement"),1200);
  setTimeout(()=>gardenBuild("positionGardenPalmsOutsidePavement"),3000);

RoadBuilders.mainHideRoadsideGrassStrips(getRoadBuilderContext());
  rebuildTaskReferenceLimitsFromMaster();

  if(typeof lcBuildAll==="function"){
    lcBuildAll();
  }

  rebuildDefinitiveGardenTreeCollisions();
  rebuildProceduralGardenTreeShadows();

  if(typeof buildGardenBoundaryFence==="function") gardenBuild("buildGardenBoundaryFence");
  setTimeout(removeMusicBoyCompletely,1200);
  RoadBuilders.mainRemoveInfiniteRoadBlackBlockers(getRoadBuilderContext());
  WORLD_GRASS_FLOOR.mesh=EnvironmentBuilders.buildWorldGrassFloor({
      scene,
      grassMaterial:grassMat,
      grassTexture:outdoorGrassTexture,
      previousMesh:WORLD_GRASS_FLOOR.mesh
    });
  if(!INFINITE_ROAD.built) RoadBuilders.mainBuildInfiniteRoadOptical(getRoadBuilderContext());
  optimizeStaticGroundSurfaces();
GardenBuilders.setGardenGrassTextureSize(getGardenBuilderContext(),.16);
  GardenBuilders.setGardenGrassColor(getGardenBuilderContext(),"#77767B",1.00);
  applyFixedGrassPngStyle();
  freezePerformanceStaticWorld();
disableOldLocalLightsKeepMoon(scene);
  setLoadingProgress(25,"Preparing world");
  warmUpPlayerBehindLoading(()=>{
    try{
      if(typeof refreshPerformanceLightCache==="function") refreshPerformanceLightCache(scene,PERF_RUNTIME,FIXED_LIGHT_POOL);
      if(typeof updatePerformanceVisibility==="function") updatePerformanceVisibility();
    }catch(e){}
    captureGameStartReturnPoint();
    gameplayInputEnabled=false;
    for(const k of Object.keys(keys)) keys[k]=false;
    if(!mainAnimationStarted){
      mainAnimationStarted=true;
      animate();
    }

    let hiddenLiveFrames=0;
    const HIDDEN_LIVE_FRAMES=40;
    const hiddenWarmRoot=player?.root || null;
    const hiddenWarmStartYaw=hiddenWarmRoot?.rotation?.y ?? 0;
    const hiddenWarmStartPos=hiddenWarmRoot?.position?.clone?.() || null;

    const hiddenYawTargets=[
      hiddenWarmStartYaw,
      hiddenWarmStartYaw+Math.PI*.5,
      hiddenWarmStartYaw-Math.PI*.5,
      hiddenWarmStartYaw+Math.PI,
      hiddenWarmStartYaw
    ];

    const finishHiddenLiveStart=()=>{
      hiddenLiveFrames++;
      for(const k of Object.keys(keys)) keys[k]=false;

      if(hiddenWarmRoot){
        const segmentCount=hiddenYawTargets.length-1;
        const normalized=Math.min(
          .999999,
          hiddenLiveFrames/Math.max(1,HIDDEN_LIVE_FRAMES)
        );
        const scaled=normalized*segmentCount;
        const segment=Math.min(segmentCount-1,Math.floor(scaled));
        const localT=scaled-segment;
        const eased=localT*localT*(3-2*localT);
        const from=hiddenYawTargets[segment];
        const to=hiddenYawTargets[segment+1];
        const delta=Math.atan2(
          Math.sin(to-from),
          Math.cos(to-from)
        );

        hiddenWarmRoot.rotation.y=from+delta*eased;

        if(hiddenWarmStartPos){
          hiddenWarmRoot.position.copy(hiddenWarmStartPos);
        }

        try{
          if(typeof updatePerformanceVisibility==="function"){
            updatePerformanceVisibility();
          }
          if(typeof optimizeFarWorldProps==="function"){
            optimizeFarWorldProps();
          }
          if(typeof updateTikiVisibilityCulling==="function"){
            updateTikiVisibilityCulling();
          }
          if(typeof refreshPerformanceLightCache==="function" && (hiddenLiveFrames%8)===0){
            refreshPerformanceLightCache(scene,PERF_RUNTIME,FIXED_LIGHT_POOL);
          }
          if(typeof updateFixedLightPool==="function"){
            updateFixedLightPool(player,FIXED_LIGHT_POOL);
          }
          if(typeof updateCleanPlayerCamera==="function"){
            updateCleanPlayerCamera();
          }
          if(typeof updatePlayerGardenBlobShadow==="function"){
            updatePlayerGardenBlobShadow(1/60);
          }
          scene.updateMatrixWorld(true);
          renderer.render(scene,camera);
        }catch(e){}
      }

      if(hiddenLiveFrames<HIDDEN_LIVE_FRAMES){
        requestAnimationFrame(finishHiddenLiveStart);
        return;
      }

      if(hiddenWarmRoot){
        hiddenWarmRoot.rotation.y=hiddenWarmStartYaw;
        if(hiddenWarmStartPos){
          hiddenWarmRoot.position.copy(hiddenWarmStartPos);
        }
      }

      try{
        if(typeof updateCleanPlayerCamera==="function"){
          updateCleanPlayerCamera();
        }
        scene.updateMatrixWorld(true);
        renderer.render(scene,camera);
      }catch(e){}

      applyPointLightTuning();

      gameplayInputEnabled=true;
      for(const k of Object.keys(keys)) keys[k]=false;
      if(loadingScreen) loadingScreen.classList.add("hidden");
      document.body.classList.remove("loading-active");
      document.body.classList.add("game-ready");
    };
    requestAnimationFrame(finishHiddenLiveStart);
  });
}
loadingManager.onLoad=()=>{
  if(!moduleInitializationComplete){
    loadingCompletedBeforeModuleInit=true;
    return;
  }
  finishSceneLoading();
};
const textureLoader=new THREE.TextureLoader(loadingManager);
const loader=new GLTFLoader(loadingManager);
function ensureDisplayCaseWoodenLegs(...args){ return MuseumBuilders.ensureDisplayCaseWoodenLegs(getGardenBuilderContext(),...args); }
function applyDisplayCaseWoodColor(...args){ return MuseumBuilders.applyDisplayCaseWoodColor(getGardenBuilderContext(),...args); }
function createMuseumLabel(...args){ return MuseumBuilders.createMuseumLabel(getGardenBuilderContext(),...args); }
function removeDisplayCaseRedCloth(...args){ return MuseumBuilders.removeDisplayCaseRedCloth(getGardenBuilderContext(),...args); }
function fitArtworkIntoCase(...args){ return MuseumBuilders.fitArtworkIntoCase(getGardenBuilderContext(),...args); }
function refreshAllMuseumPurpleCloths(...args){ return MuseumBuilders.refreshAllMuseumPurpleCloths(getGardenBuilderContext(),...args); }
function museumClothPrefixFromEditorId(id){ return MuseumBuilders.museumClothPrefixFromEditorId(id); }
function museumPart(...args){ return MuseumBuilders.museumPart(getGardenBuilderContext(),...args); }
function museumPrefixParts(...args){ return MuseumBuilders.museumPrefixParts(getGardenBuilderContext(),...args); }
function placeMuseumLabel(...args){ return MuseumBuilders.placeMuseumLabel(getGardenBuilderContext(),...args); }
function refitMuseumArtwork(...args){ return MuseumBuilders.refitMuseumArtwork(getGardenBuilderContext(),...args); }
function placeTelescopeLabel(...args){ return GardenBuilders.placeTelescopeLabel(getGardenBuilderContext(),...args); }
function enforceCenteredMuseumCasesAndBases(...args){ return MuseumBuilders.enforceCenteredMuseumCasesAndBases(getGardenBuilderContext(),...args); }
function lockLeftExhibitContentsToCases(...args){ return MuseumBuilders.lockLeftExhibitContentsToCases(getGardenBuilderContext(),...args); }
function applyMuseumGermanAlignment(...args){ return MuseumBuilders.applyMuseumGermanAlignment(getGardenBuilderContext(),...args); }
function refreshMuseumAlignmentEditor(){ return MuseumBuilders.refreshMuseumAlignmentEditor(getGardenBuilderContext()); }
const MUSEUM_PANEL_EDITOR=MuseumBuilders.MUSEUM_PANEL_EDITOR;
function getMuseumPanelEditorTargets(){ return MuseumBuilders.getMuseumPanelEditorTargets(getGardenBuilderContext()); }
function getMuseumPanelEditorObjects(){ return MuseumBuilders.getMuseumPanelEditorObjects(getGardenBuilderContext()); }
function applyMuseumPanelInitialWorldValues(...args){ return MuseumBuilders.applyMuseumPanelInitialWorldValues(getGardenBuilderContext(),...args); }
function museumPanelPart(panel,element){ return MuseumBuilders.museumPanelPart(panel,element); }
function refreshMuseumPanelEditor(){ return MuseumBuilders.refreshMuseumPanelEditor(getGardenBuilderContext()); }

function makeCylinderBetween(a,b,radius,material){
  const mid=a.clone().add(b).multiplyScalar(.5);
  const len=a.distanceTo(b);
  const geo=new THREE.CylinderGeometry(radius,radius*.88,len,10,1,false);
  const mesh=new THREE.Mesh(geo,material);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0,1,0),
    b.clone().sub(a).normalize()
  );
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  return mesh;
}
function createTallTelescopeTripod(...args){
  return GardenBuilders.createTallTelescopeTripod(getGardenBuilderContext(),...args);
}
function prepareNewTelescopeModel(...args){
  return GardenBuilders.prepareNewTelescopeModel(getGardenBuilderContext(),...args);
}

function commitTelescopeGLBTransform(...args){
  return GardenBuilders.commitTelescopeGLBTransform(getGardenBuilderContext(),...args);
}
function rebuildTallTelescopeTripod(...args){
  return GardenBuilders.rebuildTallTelescopeTripod(getGardenBuilderContext(),...args);
}

window.addEventListener("keydown",ev=>{
  const isE=
    ev.code==="KeyE" ||
    String(ev.key||"").toLowerCase()==="e";
  const isEsc=ev.code==="Escape";
  if(TELESCOPE_MODE.active && (isE || isEsc)){
    ev.preventDefault();
    ev.stopPropagation();
    exitTelescopeMode();
    return;
  }
  if(
    isE &&
    !QUEST.dialogueActive &&
    !GLOBAL_DIALOGUE_LOCK.active &&
    isPlayerNearTelescope()
  ){
    ev.preventDefault();
    ev.stopPropagation();
    enterTelescopeMode();
  }
},true);


const keys={};
const INVENTORY={
  open:false,
  items:[]
};

const CLAW_PLAY_COST_CENTS=50;
const PLAYER_MONEY={
  cashDollars:150,
  coinCents:200
};

const CASINO_CLAW_PAYMENT={
  message:"",
  messageUntil:0
};

function renderInventoryMoney(){
  const cash=document.getElementById("inventoryCashValue");
  const coins=document.getElementById("inventoryCoinValue");
  if(cash) cash.textContent="$"+Math.max(0,Math.floor(PLAYER_MONEY.cashDollars));
  if(coins) coins.textContent=Math.max(0,Math.floor(PLAYER_MONEY.coinCents))+"¢";
}

function canAffordCasinoClaw(){
  return PLAYER_MONEY.coinCents>=CLAW_PLAY_COST_CENTS;
}

function spendCasinoClawCost(){
  if(!canAffordCasinoClaw()) return false;
  PLAYER_MONEY.coinCents-=CLAW_PLAY_COST_CENTS;
  renderInventoryMoney();
  return true;
}

function setCasinoClawPaymentMessage(message,duration=1500){
  CASINO_CLAW_PAYMENT.message=String(message||"");
  CASINO_CLAW_PAYMENT.messageUntil=performance.now()+duration;
}

const COLLECTIBLES={
  wallet:null
};
let lastE=false;
let collectibleTarget=null;
let currentTarget=null;
let slotInteractionTarget=null;
let activeWorldZone="outside";
const LIVE_CAMERA_TUNING={
  leftRoom:{
    distance:4.350,
    height:4.900,
    lookHeight:2.150,
    sideOffset:0.000,
    fov:60.00
  }
};
function getLiveCameraTuning(){
  if(!LIVE_CAMERA_TUNING[activeWorldZone]){
    const base=CAMERA_ZONE_SETTINGS[activeWorldZone] || CAMERA_ZONE_SETTINGS.outside;
    let distance;
    let height;
    let lookHeight;
    let sideOffset=CLEAN_CAMERA_CONFIG.sideOffset;
    if(activeWorldZone==="outside"){
      distance=CLEAN_CAMERA_CONFIG.distance;
      height=CLEAN_CAMERA_CONFIG.height;
      lookHeight=CLEAN_CAMERA_CONFIG.lookHeight;
    }else{
      distance=base.distance;
      height=base.height;
      lookHeight=2.15;
    }
    LIVE_CAMERA_TUNING[activeWorldZone]={
      distance:Number(distance),
      height:Number(height),
      lookHeight:Number(lookHeight),
      sideOffset:Number(sideOffset),
      fov:Number(camera.fov)
    };
  }
  return LIVE_CAMERA_TUNING[activeWorldZone];
}
function refreshLiveCameraEditor(){
  const t=getLiveCameraTuning();
  const put=(id,v,d=2)=>{const el=document.getElementById(id);if(el)el.textContent=Number(v).toFixed(d);};
  put("cameraEditDistance",t.distance);
  put("cameraEditHeight",t.height);
  put("cameraEditLookHeight",t.lookHeight);
  put("cameraEditSideOffset",t.sideOffset);
  put("cameraEditFov",t.fov,0);
}
function clampLiveCameraValue(key,v){
  if(key==="distance") return THREE.MathUtils.clamp(v,0.5,25);
  if(key==="height") return THREE.MathUtils.clamp(v,0.5,15);
  if(key==="lookHeight") return THREE.MathUtils.clamp(v,-2,10);
  if(key==="sideOffset") return THREE.MathUtils.clamp(v,-10,10);
  if(key==="fov") return THREE.MathUtils.clamp(v,25,100);
  return v;
}
document.querySelectorAll(".cameraEditBtn").forEach(btn=>{
  btn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    const key=btn.dataset.cameraKey;
    const delta=Number(btn.dataset.cameraDelta||0);
    if(!key || !Number.isFinite(delta)) return;
    const tuning=getLiveCameraTuning();
    tuning[key]=clampLiveCameraValue(
      key,
      Number(tuning[key]||0)+delta
    );
    if(key==="fov"){
      camera.fov=tuning.fov;
      camera.updateProjectionMatrix();
    }
    updateCleanPlayerCamera();
    refreshLiveCameraEditor();
  });
});

let pendingDoorTransition=null;
let frameDt=0;
const PERF_RUNTIME={
  editorAccumulator:0,
  editorStep:0.20,
  lastFrame:performance.now(),
  npcAccumulator:0,
  tikiAnimAccumulator:0,
  tikiAnimStep:1/30,
  minimapAccumulator:0,
  visibilityAccumulator:0,
  lightCacheRefreshAccumulator:0,
  pointLights:[],
  npcStep:1/30,
  minimapStep:1/8,
  visibilityStep:.25,
  lightRefreshStep:2.0
};
function makeInventoryThumb(kind){
  const c=document.createElement('canvas');
  c.width=300;
  c.height=190;
  const ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,0,300,190);
  g.addColorStop(0,'#111827');
  g.addColorStop(1,'#070b12');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,300,190);
  const rr=(x,y,w,h,r)=>{
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
  };
  if(kind==='wallet'){
    ctx.save();
    ctx.translate(150,95);
    ctx.rotate(-.10);
    ctx.fillStyle='rgba(0,0,0,.34)';
    rr(-78,-43,166,98,13);
    ctx.fill();
    const leather=ctx.createLinearGradient(-80,-50,85,50);
    leather.addColorStop(0,'#81502f');
    leather.addColorStop(.48,'#603722');
    leather.addColorStop(1,'#3c2017');
    ctx.fillStyle=leather;
    rr(-84,-51,168,102,13);
    ctx.fill();
    ctx.strokeStyle='#c58d5d';
    ctx.lineWidth=3;
    ctx.setLineDash([6,5]);
    rr(-75,-42,150,84,10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(25,12,8,.55)';
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.moveTo(0,-48);
    ctx.lineTo(0,48);
    ctx.stroke();
    ctx.fillStyle='#ded8c7';
    rr(18,-30,50,42,5);
    ctx.fill();
    ctx.fillStyle='#9fadb9';
    ctx.fillRect(25,-22,16,18);
    ctx.fillStyle='#4a4d52';
    ctx.fillRect(45,-22,16,4);
    ctx.fillRect(45,-14,14,3);
    ctx.fillStyle='#c49a61';
    rr(55,22,25,17,4);
    ctx.fill();
    ctx.restore();
  }else if(kind==='radio'){
    ctx.save();
    ctx.translate(150,99);
    ctx.rotate(-.055);


    ctx.fillStyle='rgba(0,0,0,.42)';
    rr(-53,-59,116,135,18);
    ctx.fill();


    ctx.strokeStyle='#111820';
    ctx.lineWidth=12;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(-31,-58);
    ctx.lineTo(-22,-105);
    ctx.stroke();

    ctx.strokeStyle='#39444e';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(-22,-105);
    ctx.lineTo(-19,-121);
    ctx.stroke();


    const body=ctx.createLinearGradient(-50,-60,55,72);
    body.addColorStop(0,'#36414b');
    body.addColorStop(.48,'#202830');
    body.addColorStop(1,'#11171d');
    ctx.fillStyle=body;
    rr(-58,-67,116,140,16);
    ctx.fill();

    ctx.strokeStyle='#59646d';
    ctx.lineWidth=3;
    rr(-55,-64,110,134,14);
    ctx.stroke();


    ctx.fillStyle='#0b1015';
    rr(5,-76,22,14,5);
    ctx.fill();
    rr(33,-74,16,12,4);
    ctx.fill();


    ctx.fillStyle='#071218';
    rr(-37,-48,74,29,5);
    ctx.fill();
    ctx.fillStyle='#7fd5af';
    ctx.globalAlpha=.88;
    ctx.fillRect(-28,-40,35,5);
    ctx.fillRect(-28,-31,20,4);
    ctx.fillRect(18,-40,10,13);
    ctx.globalAlpha=1;


    ctx.fillStyle='#0b1116';
    rr(-38,-9,76,47,6);
    ctx.fill();
    ctx.strokeStyle='#48535c';
    ctx.lineWidth=2;
    for(let y=-1;y<=29;y+=7){
      ctx.beginPath();
      ctx.moveTo(-29,y);
      ctx.lineTo(29,y);
      ctx.stroke();
    }


    ctx.fillStyle='#151d24';
    rr(-65,-24,9,39,4);
    ctx.fill();

    ctx.fillStyle='#b94a43';
    rr(-21,48,42,11,4);
    ctx.fill();


    ctx.fillStyle='#dbe7ef';
    ctx.globalAlpha=.72;
    ctx.font='bold 8px Arial';
    ctx.textAlign='center';
    ctx.fillText('POLICE',0,68);
    ctx.globalAlpha=1;

    ctx.restore();
  }else{
    ctx.save();
    ctx.translate(150,95);
    ctx.fillStyle='#e8dfc8';
    rr(-68,-42,136,84,8);
    ctx.fill();
    ctx.strokeStyle='#8b7c63';
    ctx.lineWidth=2;
    rr(-68,-42,136,84,8);
    ctx.stroke();
    ctx.fillStyle='#332f29';
    ctx.font='bold 24px Georgia';
    ctx.fillText('CLUE',-38,-5);
    ctx.restore();
  }
  return c;
}
function renderInventory(){
  renderInventoryMoney();
  if(!inventoryGrid) return;
  inventoryGrid.replaceChildren();
  if(INVENTORY.items.length===0){
    const empty=document.createElement('div');
    empty.className='inventoryEmpty';
    empty.textContent='No items collected';
    inventoryGrid.appendChild(empty);
    return;
  }
  for(const item of INVENTORY.items){
    const card=document.createElement('div');
    card.className='inventoryItem';
    const thumb=document.createElement('div');
    thumb.className='inventoryThumb';
    thumb.appendChild(makeInventoryThumb(item.kind));
    const name=document.createElement('div');
    name.className='inventoryName';
    name.textContent=item.name;
    card.appendChild(thumb);
    card.appendChild(name);
    inventoryGrid.appendChild(card);
  }
}
function setInventoryOpen(open){
  INVENTORY.open=!!open;
  if(inventoryOverlay){
    inventoryOverlay.classList.toggle('open',INVENTORY.open);
  }
  if(INVENTORY.open){
    for(const k of Object.keys(keys)) keys[k]=false;
    renderInventory();
  }
}
function addInventoryItem(item){
  if(INVENTORY.items.some(x=>x.id===item.id)) return;
  INVENTORY.items.push(item);
  renderInventory();
}
let lastInventoryX=false;
editableTikiBar=null;
function updateTikiVisibilityCulling(){
  if(!player?.root) return;
  const px=player.root.position.x;
  const pz=player.root.position.z;
  const items=[
    editableTikiBar,
    editableMan,
    editableWoman,
    editableBaristaWoman
  ];
  for(const obj of items){
    if(!obj) continue;
    const dx=obj.position.x-px;
    const dz=obj.position.z-pz;
    const d2=dx*dx+dz*dz;
    obj.visible=d2<140*140;
  }
}
function updateInventoryToggle(){
  const xDown=!!keys['x'];
  if(xDown && !lastInventoryX){
    setInventoryOpen(!INVENTORY.open);
  }
  lastInventoryX=xDown;
}


const PLAYER_HAND_TUNING_DEFAULTS=Object.freeze({
  walkWristFlexDeg:1.85,
  walkWristYawDeg:1.20,
  walkWristRollDeg:.80,
  walkShoulderCounter:.045,
  walkForeTwist:.085,
  walkWristSwing:.115,
  walkWristRollRaw:.055,
  walkExtraFlex:.026,
  walkExtraTwist:.018,
  walkFingerCurl:0.28,

  turnWristFlexDeg:1.65,
  turnWristYawDeg:1.15,
  turnWristRollDeg:.78,
  turnForeYawDeg:.36,
  turnArmFollowDeg:.50,
  turnShoulderFollowDeg:.10,
  turnHandFollowFlex:.026,
  turnHandFollowTwist:.018,
  turnFingerCurl:0.0,
  comboFingerCurl:0.0,
  comboFingerCurlLeft:0.0,
  comboFingerCurlRight:0.0,
  walkFingerCurlLeft:1.0,
  walkFingerCurlRight:1.0,
  turnFingerCurlLeft:0.0,
  turnFingerCurlRight:0.0
});
const PLAYER_HAND_TUNING =
  window.PLAYER_HAND_TUNING ||
  (window.PLAYER_HAND_TUNING={...PLAYER_HAND_TUNING_DEFAULTS});

const PLAYER_TURN_TUNING_DEFAULTS=Object.freeze({
  soloTurnSpeedDeg:72,
  soloTurnAheadDeg:66,
  soloSnapThresholdDeg:0.25,
  pivotOffset:0.105,
  pivotMaxYawDeg:143,
  pivotForwardStep:0.042,
  pivotBodyComp:0.012,
  soloMixerScale:0.72,
  handoffSpeed:14.1,
  handoffFrameMin:0.108,
  handoffFrameMax:0.45,
  handoffLerpBase:0.47,
  handoffLerpExtra:0.64,
  comboDelayMs:65,
  releaseMaxMs:30,
  releaseArcPhase:0.26,
  releaseMinPhase:0.05,
  forwardSteerAheadDeg:46,
  forwardSnapThresholdDeg:.42,
  forwardTurnLerpMin:.013,
  forwardTurnLerpMax:.041,
  forwardFullStrengthDeg:75,
  forwardBodyTarget:.20,
  forwardBodyLerp:.035
});
const PLAYER_TURN_TUNING={...PLAYER_TURN_TUNING_DEFAULTS};

const AD_CURRENT_DEFAULTS=Object.freeze({
  targetScale:.82,rootLerpMin:.032,rootLerpMax:.066,snapDeg:.35,
  fullStrengthDeg:90,bodyResponseLerp:.048,pivotMotion:.26,
  walkCycleScale:1,legMotionScale:1,footMotionScale:1,
  bodyWalkScale:1,baseArmAnimationScale:1,turnArmOverlayScale:.22
});
const AD_CURRENT={...AD_CURRENT_DEFAULTS};
let AD_CURRENT_FRAME_ACTIVE=false;




addEventListener("keydown",e=>{
  const key=e.key.toLowerCase();
  if(!gameplayInputEnabled) return;
  keys[key]=true;
});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
const SCENE_ENV_CONFIG={
  ...CASINO_BUILDING_CONFIG
};


const OUTSIDE_SHOP_PURPLE_BACKDROPS={
  group:null,
  basePositions:{},
  tuning:{
    casino:{x:0,y:0,z:.49},
    jewelry:{x:0,y:0,z:.33},
    intersection:{x:0,y:0,z:.49}
  }
};

function buildOutsideShopPurpleBackdrops(){
  OUTSIDE_SHOP_PURPLE_BACKDROPS.group?.removeFromParent?.();

  const group=new THREE.Group();
  group.name="outside_shop_child_wall_color_backdrops";


  const purpleMat=childExtraDenseWallMaterial();

  const roomWidth=Math.max(
    4.0,
    Number(SCENE_ENV_CONFIG.roomWidth)||6.0
  );

  const frontZ=Number(SCENE_ENV_CONFIG.frontZ);
  const backZ=Number(SCENE_ENV_CONFIG.backZ);
  const facadeZ=Math.max(frontZ,backZ);

  const height=7.2;
  const thickness=.10;

  const addBackdrop=(key,name,x,width)=>{
    const mesh=new THREE.Mesh(
      new THREE.BoxGeometry(width,height,thickness),
      purpleMat.clone()
    );

    mesh.name=name;

    const base=new THREE.Vector3(
      x,
      height*.5-.05,
      facadeZ-.22
    );

    OUTSIDE_SHOP_PURPLE_BACKDROPS.basePositions[key]=base.clone();

    const tune=OUTSIDE_SHOP_PURPLE_BACKDROPS.tuning[key];

    mesh.position.set(
      base.x+tune.x,
      base.y+tune.y,
      base.z+tune.z
    );

    mesh.castShadow=false;
    mesh.receiveShadow=false;
    group.add(mesh);
  };

  const casinoX=Number(SCENE_ENV_CONFIG.leftRoomCenterX)||0;
  const jewelryX=Number(SCENE_ENV_CONFIG.rightRoomCenterX)||0;
  const intersectionX=(casinoX+jewelryX)*.5;


  addBackdrop(
    "casino",
    "wall_color_backdrop_casino",
    casinoX,
    roomWidth*.96
  );


  addBackdrop(
    "jewelry",
    "wall_color_backdrop_jewelry",
    jewelryX,
    roomWidth*.96
  );


  addBackdrop(
    "intersection",
    "wall_color_backdrop_intersection",
    intersectionX,
    Math.max(1.4,Math.abs(jewelryX-casinoX)-roomWidth*.76)
  );

  scene.add(group);
  OUTSIDE_SHOP_PURPLE_BACKDROPS.group=group;
  updateCasinoFacadeBackdropVisibility();
}




function updateCasinoFacadeBackdropVisibility(){
  const group=OUTSIDE_SHOP_PURPLE_BACKDROPS.group;
  if(!group) return;

  const casinoBackdrop=group.getObjectByName(
    "wall_color_backdrop_casino"
  );

  if(casinoBackdrop){


    casinoBackdrop.visible=activeWorldZone!=="leftRoom";
  }
}


queueMicrotask(buildOutsideShopPurpleBackdrops);
setTimeout(buildOutsideShopPurpleBackdrops,1200);
setTimeout(buildOutsideShopPurpleBackdrops,3200);


const CASINO_JEWELRY_DENSE_DIVIDER={
  group:null,
  internal:null,
  exterior:null,
  baseInternal:null,
  baseExterior:null
};

const OCCLUDER_TUNING={
  internal:{x:0,y:0,z:0},
  exterior:{x:0,y:0,z:0}
};

function findDenseWallSourceMaterial(kind){
  let best=null;

  scene.traverse(obj=>{
    if(best || !obj?.isMesh || !obj.material) return;

    const mats=Array.isArray(obj.material)
      ? obj.material
      : [obj.material];

    for(const mat of mats){
      if(!mat) continue;

      const n=(
        String(obj.name||"")+" "+
        String(mat.name||"")
      ).toLowerCase();

      if(
        n.includes("door") ||
        n.includes("glass") ||
        n.includes("window")
      ){
        continue;
      }

      const wallLike=
        n.includes("wall") ||
        n.includes("partition") ||
        n.includes("facade") ||
        n.includes("façade") ||
        n.includes("interior") ||
        n.includes("exterior");

      if(!wallLike) continue;

      if(
        kind==="exterior" &&
        !(
          n.includes("facade") ||
          n.includes("façade") ||
          n.includes("exterior") ||
          n.includes("front")
        )
      ){
        continue;
      }

      best=mat;
      break;
    }
  });

  return best;
}

function makeDenseWallMaterial(kind){
  const source=findDenseWallSourceMaterial(kind);

  if(source){
    const mat=source.clone();
    mat.transparent=false;
    mat.opacity=1;
    mat.depthWrite=true;
    mat.depthTest=true;
    mat.side=THREE.DoubleSide;
    mat.needsUpdate=true;
    return mat;
  }

  return new THREE.MeshStandardMaterial({
    color:0x262b32,
    roughness:.9,
    metalness:0,
    transparent:false,
    opacity:1,
    side:THREE.DoubleSide,
    depthWrite:true,
    depthTest:true
  });
}

function buildCasinoJewelryDenseDivider(){
  CASINO_JEWELRY_DENSE_DIVIDER.group?.removeFromParent();

  const group=new THREE.Group();
  group.name="casino_dense_wall_backing";

  const casinoCenterX=SCENE_ENV_CONFIG.leftRoomCenterX;
  const otherCenterX=SCENE_ENV_CONFIG.rightRoomCenterX;
  const boundaryX=(casinoCenterX+otherCenterX)*0.5;

  const zMin=Math.min(SCENE_ENV_CONFIG.frontZ,SCENE_ENV_CONFIG.backZ);
  const zMax=Math.max(SCENE_ENV_CONFIG.frontZ,SCENE_ENV_CONFIG.backZ);
  const centerZ=(zMin+zMax)*0.5;
  const depth=(zMax-zMin)+1.2;

  const internalGroup=new THREE.Group();
  internalGroup.name="dense_internal_wall_group";
  const internalMat=makeDenseWallMaterial("internal");

  for(let i=0;i<3;i++){
    const wall=new THREE.Mesh(
      new THREE.BoxGeometry(.18,8.5,depth),
      internalMat.clone()
    );
    wall.name=`dense_internal_wall_${i+1}`;
    wall.position.set((i-1)*.16,4.15,0);
    wall.receiveShadow=true;
    internalGroup.add(wall);
  }

  internalGroup.position.set(
    boundaryX+.14,
    0,
    centerZ
  );
  group.add(internalGroup);

  const exteriorGroup=new THREE.Group();
  exteriorGroup.name="dense_exterior_wall_group";
  const exteriorMat=makeDenseWallMaterial("exterior");

  for(let i=0;i<3;i++){
    const wall=new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.max(4.0,SCENE_ENV_CONFIG.roomWidth*.97),
        8.5,
        .18
      ),
      exteriorMat.clone()
    );
    wall.name=`dense_exterior_wall_${i+1}`;
    wall.position.set(0,4.15,(i-1)*.16);
    wall.receiveShadow=true;
    exteriorGroup.add(wall);
  }

  exteriorGroup.position.set(
    otherCenterX,
    0,
    SCENE_ENV_CONFIG.backZ-.16
  );
  group.add(exteriorGroup);

  scene.add(group);

  CASINO_JEWELRY_DENSE_DIVIDER.group=group;
  CASINO_JEWELRY_DENSE_DIVIDER.internal=internalGroup;
  CASINO_JEWELRY_DENSE_DIVIDER.exterior=exteriorGroup;
  CASINO_JEWELRY_DENSE_DIVIDER.baseInternal=
    internalGroup.position.clone();
  CASINO_JEWELRY_DENSE_DIVIDER.baseExterior=
    exteriorGroup.position.clone();

  applyOccluderTuning();
}

function applyOccluderTuning(){
  const d=CASINO_JEWELRY_DENSE_DIVIDER;

  if(d.internal && d.baseInternal){
    const v=OCCLUDER_TUNING.internal;
    d.internal.position.set(
      d.baseInternal.x+v.x,
      d.baseInternal.y+v.y,
      d.baseInternal.z+v.z
    );
    d.internal.updateMatrixWorld(true);
  }

  if(d.exterior && d.baseExterior){
    const v=OCCLUDER_TUNING.exterior;
    d.exterior.position.set(
      d.baseExterior.x+v.x,
      d.baseExterior.y+v.y,
      d.baseExterior.z+v.z
    );
    d.exterior.updateMatrixWorld(true);
  }
}

function getCasinoBuilderContext(){
  return {
    get THREE(){ return THREE; },
    get scene(){ return scene; },
    get textureLoader(){ return textureLoader; },
    get renderer(){ return renderer; },
    get createPointLight(){ return createPointLight; }
  };
}

const CASINO_WORLD_GEOMETRY=
  CasinoBuilders.buildCasinoGeometry(
    getCasinoBuilderContext()
  );


const WALL_FULL_OCCLUSION={
  applied:new WeakSet()
};

function isWallOcclusionTarget(obj,mat){
  const n=String(obj?.name||"").toLowerCase();
  const mn=String(mat?.name||"").toLowerCase();
  const fullName=n+" "+mn;


  if(
    fullName.includes("door") ||
    fullName.includes("glass") ||
    fullName.includes("window") ||
    fullName.includes("screen") ||
    fullName.includes("tv")
  ){
    return false;
  }

  return (
    fullName.includes("wall") ||
    fullName.includes("facade") ||
    fullName.includes("façade") ||
    fullName.includes("partition") ||
    fullName.includes("interior") ||
    fullName.includes("exterior") ||
    fullName.includes("storefront") ||
    fullName.includes("shopfront") ||
    fullName.includes("shop_front") ||
    fullName.includes("store_front") ||
    fullName.includes("casino_front") ||
    fullName.includes("casino facade") ||
    fullName.includes("casino_facade")
  );
}

function enforceFullWallOcclusion(){
  scene.traverse(obj=>{
    if(!obj?.isMesh || !obj.material) return;

    const mats=Array.isArray(obj.material)
      ? obj.material
      : [obj.material];

    let changed=false;
    const next=[];

    for(const sourceMat of mats){
      if(!sourceMat){
        next.push(sourceMat);
        continue;
      }

      if(!isWallOcclusionTarget(obj,sourceMat)){
        next.push(sourceMat);
        continue;
      }


      const mat=WALL_FULL_OCCLUSION.applied.has(sourceMat)
        ? sourceMat
        : sourceMat.clone();

      mat.side=THREE.DoubleSide;
      mat.transparent=false;
      mat.opacity=1;
      mat.depthWrite=true;
      mat.depthTest=true;
      mat.alphaTest=0;
      mat.needsUpdate=true;

      WALL_FULL_OCCLUSION.applied.add(mat);
      next.push(mat);
      changed=true;
    }

    if(changed){
      obj.material=Array.isArray(obj.material)
        ? next
        : next[0];

      obj.frustumCulled=true;
      obj.renderOrder=Math.max(0,obj.renderOrder||0);
    }
  });


  try{
    if(typeof CASINO_CAMERA_STRUCTURAL_CACHE!=="undefined"){
      CASINO_CAMERA_STRUCTURAL_CACHE=null;
    }
  }catch(_){}
}


queueMicrotask(()=>enforceFullWallOcclusion());
setTimeout(enforceFullWallOcclusion,450);
setTimeout(enforceFullWallOcclusion,1300);
setTimeout(enforceFullWallOcclusion,3000);
setTimeout(enforceFullWallOcclusion,6000);


const casinoFloorTexture=
  CASINO_WORLD_GEOMETRY.floorTexture;

const casinoFloorMat=
  CASINO_WORLD_GEOMETRY.floorMaterial;

const facadeMaterials=
  CASINO_WORLD_GEOMETRY.facadeMaterials;

const leftDoorX=
  CASINO_WORLD_GEOMETRY.leftDoorX;


buildCasinoJewelryDenseDivider();
setTimeout(buildCasinoJewelryDenseDivider,1800);
setTimeout(buildCasinoJewelryDenseDivider,4200);


function makeBox(name,w,h,d,x,y,z,color){
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color})
  );
  mesh.name=name;
  mesh.position.set(x,y,z);
  scene.add(mesh);
  return mesh;
}

function makeTiledTexture(path,repeatX,repeatY){
  const tex=textureLoader.load(path);
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeatX,repeatY);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(
    4,
    renderer.capabilities.getMaxAnisotropy()
  );
  return tex;
}

const outdoorGrassTexture=textureLoader.load("./assets/textures/grass.png");
outdoorGrassTexture.wrapS=THREE.RepeatWrapping;
outdoorGrassTexture.wrapT=THREE.RepeatWrapping;
outdoorGrassTexture.repeat.set(21,90);
outdoorGrassTexture.colorSpace=THREE.SRGBColorSpace;
outdoorGrassTexture.anisotropy=Math.min(8,Math.min(4,renderer.capabilities.getMaxAnisotropy()));
outdoorGrassTexture.needsUpdate=true;
const grassMat=new THREE.MeshBasicMaterial({
  map:outdoorGrassTexture,
  color:0x77767B,
  side:THREE.DoubleSide,
  fog:false,
  toneMapped:false
});
if (typeof sidewalkConcreteTex !== 'undefined') {
  sidewalkConcreteTex.wrapS=THREE.RepeatWrapping;
  sidewalkConcreteTex.wrapT=THREE.RepeatWrapping;
  sidewalkConcreteTex.repeat.set(1,1);
  sidewalkConcreteTex.needsUpdate=true;
}
const unifiedSidewalkMat=new THREE.MeshStandardMaterial({
  map:makeTiledTexture("./assets/textures/concrete.jpg",1,1),
  roughness:.86,
  metalness:0,
  side:THREE.DoubleSide
});
gardenBuild("rebuildGardenFrontConcreteStrip");

const ROAD_RUNTIME=roadInitCore({
  scene,
  makeTiledTexture,
  unifiedSidewalkMat
});
const U_X=ROAD_RUNTIME.U_X;
const U_FRONT_Z=ROAD_RUNTIME.U_FRONT_Z;
const U_BACK_Z=ROAD_RUNTIME.U_BACK_Z;
const U_RADIUS=ROAD_RUNTIME.U_RADIUS;
const U_ARC_K=ROAD_RUNTIME.U_ARC_K;
const uRoadCurve=ROAD_RUNTIME.uRoadCurve;
const roadGreyMat=ROAD_RUNTIME.roadGreyMat;
const curbMat=ROAD_RUNTIME.curbMat;
const roadMarkingMat=ROAD_RUNTIME.roadMarkingMat;
const INFINITE_ROAD=ROAD_RUNTIME.INFINITE_ROAD;
const SIDEWALK_JOIN_FIX=ROAD_RUNTIME.SIDEWALK_JOIN_FIX;
const CROSSWALK=ROAD_RUNTIME.CROSSWALK;
const crosswalkOffsets=roadCrosswalkOffsets;


const STATIC_SURFACE_MERGE={
  concrete:null,
  grass:null,
  optimized:false
};
function cloneWorldGeometryForMerge(mesh,{needsNormals=true}={}){
  if(!mesh?.geometry || !mesh?.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh){
    return null;
  }
  mesh.updateMatrixWorld(true);
  let geo=mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrixWorld);
  if(!geo.attributes.uv){
    const p=geo.attributes.position;
    const uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){
      uv[i*2]=p.getX(i)/5;
      uv[i*2+1]=p.getZ(i)/5;
    }
    geo.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  }
  if(needsNormals && !geo.attributes.normal){
    geo.computeVertexNormals();
  }
  for(const key of Object.keys(geo.attributes)){
    if(!["position","normal","uv"].includes(key)){
      geo.deleteAttribute(key);
    }
  }
  if(!needsNormals && geo.attributes.normal){
    geo.deleteAttribute("normal");
  }
  return geo;
}
function removeMergedSourceMesh(mesh){
  if(!mesh?.parent) return;
  mesh.parent.remove(mesh);
}
function mergeStaticSurfaceMeshes(meshes,material,name,{needsNormals=true,renderOrder=0}={}){
  const valid=[];
  const sources=[];
  for(const mesh of meshes){
    const geo=cloneWorldGeometryForMerge(mesh,{needsNormals});
    if(!geo) continue;
    valid.push(geo);
    sources.push(mesh);
  }
  if(valid.length<2){
    valid.forEach(g=>g.dispose?.());
    return null;
  }
  const mergedGeometry=mergeGeometries(valid,false);
  valid.forEach(g=>g.dispose?.());
  if(!mergedGeometry){
    return null;
  }
  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();
  const merged=new THREE.Mesh(mergedGeometry,material);
  merged.name=name;
  merged.castShadow=false;
  merged.receiveShadow=true;
  merged.frustumCulled=true;
  merged.renderOrder=renderOrder;
  scene.add(merged);
  for(const mesh of sources){
    removeMergedSourceMesh(mesh);
  }
  return merged;
}
function optimizeStaticGroundSurfaces(){
  if(STATIC_SURFACE_MERGE.optimized) return;
  STATIC_SURFACE_MERGE.optimized=true;
  const concreteMeshes=[];
  scene.traverse(obj=>{
    if(!obj?.isMesh || obj.visible===false) return;
    if(obj.material!==unifiedSidewalkMat) return;
    const n=String(obj.name||"").toLowerCase();
    if(
      n.includes("sidewalk") ||
      n.includes("shop_plaza") ||
      n.includes("connector_textured") ||
      n.includes("continuous_front")
    ){
      concreteMeshes.push(obj);
    }
  });
  STATIC_SURFACE_MERGE.concrete=mergeStaticSurfaceMeshes(
    concreteMeshes,
    unifiedSidewalkMat,
    "merged_static_concrete_sidewalks",
    {needsNormals:true,renderOrder:10}
  );
  const grassMeshes=[];
  scene.traverse(obj=>{
    if(!obj?.isMesh || obj.visible===false) return;
    const n=String(obj.name||"").toLowerCase();
    const usesGrassTexture=
      obj.material?.map===outdoorGrassTexture ||
      obj.material===grassMat;
    if(!usesGrassTexture) return;
    if(n==="world_grass_png_floor"){
      grassMeshes.push(obj);
    }
  });
  STATIC_SURFACE_MERGE.grass=mergeStaticSurfaceMeshes(
    grassMeshes,
    grassMat,
    "merged_static_grass_surfaces",
    {needsNormals:false,renderOrder:-30}
  );
}
const WORLD_GRASS_FLOOR={
  mesh:EnvironmentBuilders.buildWorldGrassFloor({
    scene,
    grassMaterial:grassMat,
    grassTexture:outdoorGrassTexture
  })
};
const UNEXPLORED_MIRAGE={
  approachGroup:new THREE.Group(),
  limitZ:U_BACK_Z-100,
  triggerDistance:10,
  lastMessage:0
};
UNEXPLORED_MIRAGE.approachGroup.name="unexplored_zone_approach";
scene.add(UNEXPLORED_MIRAGE.approachGroup);

function showUnexploredZoneMessage(){
  const now=performance.now();
  if(now-UNEXPLORED_MIRAGE.lastMessage<1400) return;
  UNEXPLORED_MIRAGE.lastMessage=now;
  let toast=document.getElementById("unexploredZoneToast");
  if(!toast){
    toast=document.createElement("div");
    toast.id="unexploredZoneToast";
    toast.textContent="ZONA INESPLORATA";
    Object.assign(toast.style,{
      position:"fixed",
      left:"50%",
      bottom:"12%",
      transform:"translateX(-50%)",
      padding:"10px 18px",
      border:"1px solid rgba(74,176,255,.75)",
      borderRadius:"9px",
      background:"rgba(4,25,52,.84)",
      color:"#d9f3ff",
      fontFamily:"Arial,sans-serif",
      fontWeight:"700",
      fontSize:"14px",
      letterSpacing:"1.6px",
      zIndex:"9999",
      pointerEvents:"none",
      opacity:"0",
      transition:"opacity .18s ease"
    });
    document.body.appendChild(toast);
  }
  toast.style.opacity="1";
  clearTimeout(toast._hideTimer);
  toast._hideTimer=
    setTimeout(
      ()=>toast.style.opacity="0",
      1100
    );
}

function optimizeFarWorldProps(){
  if(!player?.root) return;
  const px=player.root.position.x;
  const pz=player.root.position.z;
  const maxDistSq=520*520;
  for(const groupName of [
    "real_100m_barricades",
    "garden_boundary_fence_side_only",
    "garden_chair_cluster"
  ]){
    const group=scene.getObjectByName(groupName);
    if(!group) continue;
    for(const obj of group.children){
      const dx=obj.position.x-px;
      const dz=obj.position.z-pz;
      obj.visible=(dx*dx+dz*dz)<=maxDistSq;
    }
  }
}
roadBuildOuterContinuousRoadLines();

const BEACH_ENTRY_CENTER=.50;
const BEACH_ENTRY_HALF=.033;
EnvironmentBuilders.makeContinuousCurveWallSegment({
  scene,
  name:"beach_wall_continuous_left",
  curve:uRoadCurve,
  offset:25.20,
  width:.58,
  height:1.18,
  tStart:0,
  tEnd:BEACH_ENTRY_CENTER-BEACH_ENTRY_HALF,
  segments:180
});
EnvironmentBuilders.makeContinuousCurveWallSegment({
  scene,
  name:"beach_wall_continuous_right",
  curve:uRoadCurve,
  offset:25.20,
  width:.58,
  height:1.18,
  tStart:BEACH_ENTRY_CENTER+BEACH_ENTRY_HALF,
  tEnd:1,
  segments:180
});

function applyFixedGrassPngStyle(){
  const size=GardenBuilders.getGardenGrassTextureSize?.()??.22;
  const color=GardenBuilders.getGardenGrassColorHex?.()??"#77767B";
  const brightness=GardenBuilders.getGardenGrassBrightness?.()??.97;
  outdoorGrassTexture.wrapS=THREE.RepeatWrapping;
  outdoorGrassTexture.wrapT=THREE.RepeatWrapping;
  outdoorGrassTexture.repeat.set(21/Math.max(.10,size),90/Math.max(.10,size));
  outdoorGrassTexture.needsUpdate=true;
  const tint=new THREE.Color(color).multiplyScalar(brightness);
  const apply=mat=>{
    for(const m of (Array.isArray(mat)?mat:[mat])){
      if(!m) continue;
      m.map=outdoorGrassTexture;
      if(m.color)m.color.copy(tint);
      if(m.emissive)m.emissive.setHex(0);
      if("emissiveIntensity" in m)m.emissiveIntensity=0;
      m.fog=false;m.toneMapped=false;m.needsUpdate=true;
    }
  };
  apply(grassMat);
  apply(WORLD_GRASS_FLOOR?.mesh?.material);
  apply(STATIC_SURFACE_MERGE?.grass?.material);
  GardenBuilders.setGardenGrassColor(getGardenBuilderContext(),color,brightness);
}
gardenBuild("rebuildFlatGardenTexturePlane");
applyFixedGrassPngStyle();

const BARRICADE_CONCRETE_TEXTURE_URI="data:image/jpeg;base64,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";
const BARRICADE_CONCRETE_TEXTURE=new THREE.TextureLoader().load(
  BARRICADE_CONCRETE_TEXTURE_URI,
  tex=>{
    tex.wrapS=THREE.RepeatWrapping;
    tex.wrapT=THREE.RepeatWrapping;
    tex.repeat.set(2.25,1.0);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    tex.needsUpdate=true;
  }
);
const BARRICADE_CONCRETE_MATERIAL=new THREE.MeshStandardMaterial({
  map:BARRICADE_CONCRETE_TEXTURE,
  color:0x565a5e,
  roughness:.97,
  metalness:0
});


const proceduralBarricadeSource=
  RoadBuilders.createProceduralBarricadeSource({
    THREE,
    material:BARRICADE_CONCRETE_MATERIAL
  });
proceduralBarricadeSource.name="barricade_glb_source";
buildStaticGateBarricades();
RoadBuilders.buildInfiniteBarricadeExtensions({
  THREE,
  scene,
  source:proceduralBarricadeSource,
  maxPerfRootLocalBounds,
  maxPerfBuildInstancedGLB,
  U_X,
  U_BACK_Z
});
for(const child of [...INFINITE_ROAD.group.children]){
  INFINITE_ROAD.group.remove(child);
}
INFINITE_ROAD.built=false;
RoadBuilders.mainBuildInfiniteRoadOptical(getRoadBuilderContext());
EnvironmentBuilders.buildUnexploredMirageBoundary({
  scene,
  renderer,
  state:UNEXPLORED_MIRAGE,
  roadBuildRoadExtensions
});
RoadBuilders.mainRemoveInfiniteRoadBlackBlockers(getRoadBuilderContext());
roadBuildBuildingConnectedSidewalks(
  SCENE_ENV_CONFIG
);
const garden=null;
EnvironmentBuilders.loadDistantMountains({
  scene,
  loadGLBFromCandidates,
  cloneMaterials,
  centerModelXZ
});
const rightPierWoodMat=new THREE.MeshStandardMaterial({
  color:0x6f4a2f,
  roughness:.88,
  metalness:.02
});
const rightPierMetalMat=new THREE.MeshStandardMaterial({
  color:0x30343a,
  roughness:.72,
  metalness:.25
});
const rightPierGroup=new THREE.Group();
rightPierGroup.name='right_parallel_pier';
const rightPierDeck=makeBox(
  'right_parallel_pier_deck',
  12,.6,58,
  152,-.90,-82,
  0x6f4a2f
);
rightPierDeck.material=rightPierWoodMat;
rightPierGroup.add(rightPierDeck);
const rightPierHead=makeBox(
  'right_parallel_pier_head',
  28,.7,18,
  152,-.84,-108,
  0x6f4a2f
);
rightPierHead.material=rightPierWoodMat;
rightPierGroup.add(rightPierHead);
for(let i=0;i<5;i++){
  const z=-62-i*10.5;
  const p1=makeBox(`right_pier_pile_a_${i}`,.8,6,.8,147,-3.2,z,0x30343a);
  const p2=makeBox(`right_pier_pile_b_${i}`,.8,6,.8,157,-3.2,z,0x30343a);
  p1.material=rightPierMetalMat;
  p2.material=rightPierMetalMat;
  rightPierGroup.add(p1,p2);
}
for(let i=0;i<4;i++){
  const z=-68-i*12.0;
  const poleL=makeBox(`right_pier_lamp_pole_l_${i}`,.18,3.8,.18,146.2,1.0,z,0x2f3138);
  const poleR=makeBox(`right_pier_lamp_pole_r_${i}`,.18,3.8,.18,157.8,1.0,z,0x2f3138);
  rightPierGroup.add(poleL,poleR);
  createZeroPointLightPair(scene,{
    color:0xffd6a0,
    decay:1.8,
    leftPosition:[146.2,3.1,z],
    rightPosition:[157.8,3.1,z]
  });
}
roadBuildRoadMarkings();
let lastCrosswalkWarningAt=0;
function isPlayerOnCrosswalk(){
  if(!player?.root) return false;
  const p=player.root.position;
  return Math.abs(p.x-CROSSWALK.centerX)<=CROSSWALK.halfWidth &&
         p.z>=CROSSWALK.roadMinZ &&
         p.z<=CROSSWALK.roadMaxZ;
}

function showCrosswalkWarning(){
  const now=performance.now();
  if(now-lastCrosswalkWarningAt<1800) return;
  lastCrosswalkWarningAt=now;

  showAttentionWarning(
    "Caution · cross the road only at the crosswalk.",
    1900
  );
}

function isCrosswalkTrafficOccupied(){
  if(!STREET_ASSETS?.cars?.length) return false;

  for(const car of STREET_ASSETS.cars){
    const root=
      car?.root ||
      car?.model ||
      car?.mesh ||
      car;

    if(!root?.visible) continue;

    const x=root.position?.x;
    const z=root.position?.z;

    if(!Number.isFinite(x) || !Number.isFinite(z)) continue;

    const inRoadBand=
      z>=CROSSWALK.roadMinZ-2.0 &&
      z<=CROSSWALK.roadMaxZ+2.0;

    const nearCrossing=
      Math.abs(x-CROSSWALK.centerX)<=13.0;

    if(inRoadBand && nearCrossing){
      return true;
    }
  }

  return false;
}

function showTrafficOccupiedWarning(){
  showAttentionWarning(
    "Caution · the crossing is occupied by traffic. Wait for a safe gap before entering the road.",
    2100
  );
}

const SLIDING_DOORS={
  left:{
    name:"left_door_trigger_controller",
    centerX:leftDoorX,
    z:SCENE_ENV_CONFIG.doorZ,
    triggerX:leftDoorX,
    triggerZ:4.3,
    openDistance:7.4,
    openAmount:0,
    singlePanel:true
  },
  right:{
    name:"right_door_trigger_controller",
    centerX:SCENE_ENV_CONFIG.rightRoomCenterX,
    z:SCENE_ENV_CONFIG.doorZ,
    triggerX:SCENE_ENV_CONFIG.rightRoomCenterX,
    triggerZ:4.3,
    openDistance:7.4,
    openDirection:1,
    openAmount:0,
    singlePanel:false
  }
};
function loadArchitecturalDoorGLB({name,path,centerX,z,targetWidth,targetHeight}){
  loader.load(
    path,
    (gltf)=>{
      const model=gltf.scene;
      model.name=name;
      model.traverse((node)=>{
        if(!node.isMesh) return;
        node.castShadow=false;
        node.receiveShadow=true;
        if(Array.isArray(node.material)){
          node.material=node.material.map((material)=>material.clone());
        }else if(node.material){
          node.material=node.material.clone();
        }
        if(name==="doorCasino_model"){
          const materials=Array.isArray(node.material)
            ? node.material
            : [node.material];
          for(const material of materials){
            if(!material) continue;
            const isGlass=
              /glass/i.test(material.name||"") ||
              /glass/i.test(node.name||"");
            if(!isGlass) continue;
            material.color?.setHex(0x07121f);
            if("roughness" in material) material.roughness=.24;
            if("metalness" in material) material.metalness=.10;
            material.transparent=true;
            material.opacity=.72;
            material.depthWrite=true;
            material.side=THREE.DoubleSide;
            material.needsUpdate=true;
          }
        }
      });
      model.updateMatrixWorld(true);
      const initialBox=new THREE.Box3().setFromObject(model);
      const initialSize=initialBox.getSize(new THREE.Vector3());
      if(initialSize.y<=0){
        return;
      }
      const scaleX=targetWidth/initialSize.x;
      const scaleY=targetHeight/initialSize.y;
      model.scale.set(scaleX,scaleY,scaleY);
      model.updateMatrixWorld(true);
      const scaledBox=new THREE.Box3().setFromObject(model);
      const scaledCenter=scaledBox.getCenter(new THREE.Vector3());
      model.position.x+=centerX-scaledCenter.x;
      model.position.y+=-scaledBox.min.y;
      model.position.z+=z-scaledCenter.z;
      model.updateMatrixWorld(true);
      scene.add(model);
      maxPerfFreeze(model);

      LC_DOOR_CACHE=null;

      if(typeof lcSyncShopDoors==="function"){
        lcSyncShopDoors();
      }

      if(
        typeof rebuildArchitecturalDoorColliders==="function"
      ){
        rebuildArchitecturalDoorColliders();
      }
    },
    undefined,
    (error)=>console.error(`Errore caricamento ${path}`,error)
  );
}
loadArchitecturalDoorGLB({
  name:"doorCasino_model",
  path:"./assets/models/doorCasino.glb",
  centerX:leftDoorX,
  z:SCENE_ENV_CONFIG.doorZ+.18,
  targetWidth:SCENE_ENV_CONFIG.doorWidth*1.10,
  targetHeight:SCENE_ENV_CONFIG.doorHeight*1.1385
});
loadArchitecturalDoorGLB({
  name:"doorPub_model",
  path:"./assets/models/doorPub.glb",
  centerX:SCENE_ENV_CONFIG.rightRoomCenterX,
  z:SCENE_ENV_CONFIG.doorZ+.18,
  targetWidth:SCENE_ENV_CONFIG.doorWidth*1.10,
  targetHeight:SCENE_ENV_CONFIG.doorHeight*1.1385
});
const CASINO_FRAME_EDITOR={
  frame1:null,
  frame2:null
};
const CASINO_EDITABLE_OBJECTS={
  frame1:null,
  frame2:null,
  poster:null,
  bettingOverlay:null,
  bettingOverlay2:null,
  tv:null,
  tv2:null,
  jukebox:null,
  reception:null,
  casinoWoman:null,
  pokerTable:null,
  casinoBoy:null,
  clawMachine:null,
  child:null,
  entryWallD:null
};
const CASINO_MEDIA_RUNTIME={
  tv:null,
  tv2:null,
  tvScreen:null,
  tvScreenAlt:null,
  tvCanvas:null,
  tvCtx:null,
  tvTexture:null,
  tvTextureAlt:null,
  tvProgramIndex:-1,
  tvSwitchIntervalMs:10000,
  tvStartedAt:0,
  jukebox:null,
  jukeboxOn:false,
  jukeboxLightMaterials:[],
  bettingOverlay:{
    pos:new THREE.Vector3(49.72,0.030,100.22),
    rot:new THREE.Euler(0,THREE.MathUtils.degToRad(-60),THREE.MathUtils.degToRad(2)),
    scale:new THREE.Vector3(0.9940,0.9940,0.9940)
  }
};


const PERMANENT_CASINO_CHARACTER_COLLIDERS=new Map();

function getPermanentCasinoCharacterCollider(key,obj){
  if(!obj) return null;


  if(
    key==="child" &&
    typeof CASINO_CHILD_INITIAL!=="undefined" &&
    CASINO_CHILD_INITIAL?.position
  ){
    return {
      position:CASINO_CHILD_INITIAL.position.clone
        ? CASINO_CHILD_INITIAL.position.clone()
        : new THREE.Vector3(
            CASINO_CHILD_INITIAL.position.x,
            CASINO_CHILD_INITIAL.position.y,
            CASINO_CHILD_INITIAL.position.z
          ),
      quaternion:
        CASINO_CHILD_INITIAL.rotation?.isEuler
          ? new THREE.Quaternion().setFromEuler(CASINO_CHILD_INITIAL.rotation)
          : obj.quaternion.clone(),
      scale:new THREE.Vector3(
        CASINO_CHILD_INITIAL.scale,
        CASINO_CHILD_INITIAL.scale,
        CASINO_CHILD_INITIAL.scale
      )
    };
  }

  if(!PERMANENT_CASINO_CHARACTER_COLLIDERS.has(key)){
    PERMANENT_CASINO_CHARACTER_COLLIDERS.set(key,{
      position:obj.position.clone(),
      quaternion:obj.quaternion.clone(),
      scale:obj.scale.clone()
    });
  }

  return PERMANENT_CASINO_CHARACTER_COLLIDERS.get(key);
}

function rebuildCasinoEditableColliders(){
  const fixedCharacterKeys=new Set([
    "child",
    "casinoBoy",
    "casinoWoman",
    "reception"
  ]);

  const visualSnapshots=[];

  for(const [key,obj] of Object.entries(CASINO_EDITABLE_OBJECTS||{})){
    if(!obj || !fixedCharacterKeys.has(key)) continue;

    const fixed=getPermanentCasinoCharacterCollider(key,obj);
    if(!fixed) continue;

    visualSnapshots.push({
      obj,
      position:obj.position.clone(),
      quaternion:obj.quaternion.clone(),
      scale:obj.scale.clone()
    });


    obj.position.copy(fixed.position);
    obj.quaternion.copy(fixed.quaternion);
    obj.scale.copy(fixed.scale);
    obj.updateMatrixWorld(true);
  }

  rebuildCasinoEditableColliderData({
    THREE,
    state:LIGHT_COLLISION,
    objects:CASINO_EDITABLE_OBJECTS,
    edits:CASINO_COLLIDER_EDIT,
    bounds:lcBounds,
    makeBox:lcMakeBox,
    makeCylinder:lcMakeCylinder,
    makeEllipse:lcMakeEllipse,
    wallEdit:CASINO_WALL_COLLIDER_EDIT
  });


  for(const snap of visualSnapshots){
    snap.obj.position.copy(snap.position);
    snap.obj.quaternion.copy(snap.quaternion);
    snap.obj.scale.copy(snap.scale);
    snap.obj.updateMatrixWorld(true);
  }

  if(COLLISION_DEBUG?.enabled){
    rebuildCollisionDebugStatic();
    rebuildCollisionDebugPlayer();
  }
}
function registerCasinoEditable(key,obj){
  if(!obj) return;
  CASINO_EDITABLE_OBJECTS[key]=obj;

  setTimeout(rebuildCasinoEditableColliders,0);
  setTimeout(rebuildCasinoEditableColliders,400);
}
const CASINO_ENTRY_STRUCTURE={group:new THREE.Group(),built:false};
CASINO_ENTRY_STRUCTURE.group.name="casino_entry_structure";
scene.add(CASINO_ENTRY_STRUCTURE.group);


function updateSlidingDoors(){
  for(const door of Object.values(SLIDING_DOORS)){
    door.openAmount=0;
  }
}
let SECURITY_POST_CASE_HOME_LOCK=false;

const SECURITY_GAME_START_SNAPSHOT={
  captured:false,
  position:null,
  rotation:null,
  scale:null,
  modelPosition:null,
  modelRotation:null,
  bones:new Map()
};

const SECURITY_INITIAL_VISIBLE_POSE={
  captured:false,
  settleFrames:0,
  bones:new Map()
};

function captureSecurityInitialVisiblePose(security){
  if(SECURITY_INITIAL_VISIBLE_POSE.captured) return true;
  if(!security?.ready || !security?.root) return false;
  if(QUEST.stage!=="talk_police") return false;
  if(QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active) return false;
  if(security.state==="talk") return false;

  SECURITY_INITIAL_VISIBLE_POSE.settleFrames++;
  if(SECURITY_INITIAL_VISIBLE_POSE.settleFrames<45) return false;

  SECURITY_INITIAL_VISIBLE_POSE.bones.clear();
  security.root.traverse(o=>{
    if(o?.isBone){
      SECURITY_INITIAL_VISIBLE_POSE.bones.set(
        o,
        o.rotation.clone()
      );
    }
  });

  SECURITY_INITIAL_VISIBLE_POSE.captured=true;
  return true;
}

function applySecurityInitialVisiblePose(security){
  if(!security?.root || !SECURITY_INITIAL_VISIBLE_POSE.captured){
    return false;
  }

  for(const [bone,rotation] of SECURITY_INITIAL_VISIBLE_POSE.bones){
    if(bone?.isBone){
      bone.rotation.copy(rotation);
    }
  }

  security.root.updateMatrixWorld(true);
  return true;
}

function captureSecurityGameStartSnapshot(security){
  if(SECURITY_GAME_START_SNAPSHOT.captured) return true;
  if(!security?.ready || !security?.root) return false;

  if(QUEST.stage!=="talk_police") return false;
  if(QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active) return false;
  if(security.state==="talk") return false;

  SECURITY_GAME_START_SNAPSHOT.position=security.root.position.clone();
  SECURITY_GAME_START_SNAPSHOT.rotation=security.root.rotation.clone();
  SECURITY_GAME_START_SNAPSHOT.scale=security.root.scale.clone();

  if(security.model){
    SECURITY_GAME_START_SNAPSHOT.modelPosition=security.model.position.clone();
    SECURITY_GAME_START_SNAPSHOT.modelRotation=security.model.rotation.clone();
  }

  SECURITY_GAME_START_SNAPSHOT.bones.clear();
  security.root.traverse(o=>{
    if(o?.isBone){
      SECURITY_GAME_START_SNAPSHOT.bones.set(
        o,
        o.rotation.clone()
      );
    }
  });

  SECURITY_GAME_START_SNAPSHOT.captured=true;

  STOREKEEPER_FINAL.securityHome=SECURITY_GAME_START_SNAPSHOT.position.clone();
  STOREKEEPER_FINAL.securityHomeRotation=SECURITY_GAME_START_SNAPSHOT.rotation.clone();
  STOREKEEPER_FINAL.securityHomeYaw=SECURITY_GAME_START_SNAPSHOT.rotation.y;
  STOREKEEPER_FINAL.securityHomeScale=SECURITY_GAME_START_SNAPSHOT.scale.clone();

  return true;
}

function applySecurityInitialBeltPoseExact(security){
  if(!security?.root) return false;

  const b=getBones(security);
  const talkCfg=TALK_POSES.securityMan;

  if(b.leftArm && talkCfg?.leftArm){
    b.leftArm.rotation.set(
      talkCfg.leftArm.restX,
      talkCfg.leftArm.restY,
      talkCfg.leftArm.restZ
    );
  }
  if(b.leftForeArm && talkCfg?.leftForeArm){
    b.leftForeArm.rotation.set(
      talkCfg.leftForeArm.restX,
      talkCfg.leftForeArm.restY,
      talkCfg.leftForeArm.restZ
    );
  }
  if(b.leftHand && talkCfg?.leftHand){
    const r=getRest(security,b.leftHand);
    b.leftHand.rotation.set(
      r.x+talkCfg.leftHand.restX,
      r.y+talkCfg.leftHand.restY,
      r.z+talkCfg.leftHand.restZ
    );
  }

  if(b.rightArm){
    b.rightArm.rotation.set(.80,-.25,-.36);
  }
  if(b.rightForeArm){
    b.rightForeArm.rotation.set(-.10,-1.30,-.80);
  }
  if(b.rightHand){
    const r=getRest(security,b.rightHand);
    b.rightHand.rotation.set(
      r.x+.10,
      r.y-.124,
      r.z-.52
    );
  }

  const fingerState=getSecurityFingerState(security);
  const closure=.34;
  for(const item of fingerState.fingers){
    const {bone,rest,name,segment}=item;
    const isLeft=name.includes("left");

    if(name.includes("thumb")){
      let addX=0;
      let addZ=0;
      if(segment===1){
        addX=-.07;
        addZ=isLeft ? -.12 : .12;
      }else if(segment===2){
        addX=-.17;
        addZ=isLeft ? -.16 : .16;
      }else if(segment===3){
        addX=-.16;
        addZ=isLeft ? -.04 : .04;
      }
      bone.rotation.set(
        rest.x+addX*closure,
        rest.y,
        rest.z+addZ*closure
      );
    }else{
      bone.rotation.set(
        rest.x+getMainFingerCurl(name,segment)*closure,
        rest.y,
        rest.z
      );
    }
  }

  security.root.updateMatrixWorld(true);
  return true;
}

function applySecurityCompletedHomeExact(security){
  if(!security?.root) return false;

  const startCfg=CHARACTER_CONFIGS?.securityMan;

  if(startCfg?.position){
    security.root.position.set(
      Number(startCfg.position.x) || 0,
      Number.isFinite(startCfg.position.y)
        ? startCfg.position.y
        : .1,
      Number(startCfg.position.z) || 0
    );
  }else if(SECURITY_GAME_START_SNAPSHOT.captured){
    security.root.position.copy(SECURITY_GAME_START_SNAPSHOT.position);
  }else if(STOREKEEPER_FINAL?.securityHome){
    security.root.position.copy(STOREKEEPER_FINAL.securityHome);
  }else{
    return false;
  }

  security.root.rotation.set(0,0,0);

  if(SECURITY_GAME_START_SNAPSHOT.captured){
    security.root.scale.copy(SECURITY_GAME_START_SNAPSHOT.scale);

    if(security.model){
      if(SECURITY_GAME_START_SNAPSHOT.modelPosition){
        security.model.position.copy(SECURITY_GAME_START_SNAPSHOT.modelPosition);
        security.__securityModelBaseY=security.model.position.y;
      }
      if(SECURITY_GAME_START_SNAPSHOT.modelRotation){
        security.model.rotation.copy(SECURITY_GAME_START_SNAPSHOT.modelRotation);
      }
    }
  }else if(STOREKEEPER_FINAL?.securityHomeScale){
    security.root.scale.copy(STOREKEEPER_FINAL.securityHomeScale);
  }

  security.state="idle";
  security.timer=0;

  if(!applySecurityInitialVisiblePose(security)){
    applySecurityInitialBeltPoseExact(security);
  }
  security.root.updateMatrixWorld(true);
  return true;
}
function updateSecurityIdleFacing(){
  const security=globalThis.npcs?.find((npc)=>npc.name==="securityMan");
  if(!security || !security.ready || !security.root) return;

  if(!SECURITY_GAME_START_SNAPSHOT.captured){
    captureSecurityGameStartSnapshot(security);
  }

  if(
    SECURITY_POST_CASE_HOME_LOCK &&
    QUEST.stage==="game_complete" &&
    STOREKEEPER_FINAL.completed &&
    security.state!=="talk"
  ){
    applySecurityCompletedHomeExact(security);
    return;
  }

  if(security.state==="talk") return;
  if(player?.root){
    const dx=security.root.position.x-player.root.position.x;
    const dz=security.root.position.z-player.root.position.z;
    if(dx*dx+dz*dz>55*55) return;
  }

  const target=0;
  security.root.rotation.y=lerpAngle(security.root.rotation.y,target,.10);
}


const THIEF_POSE_TRANSITION_SPEED={
  body:.050,
  fingers:.055,
  head:.050,

  turn:.012
};


function lerpThiefTalkPose(a,b,t){
  const out={};
  const keys=[
    "head","neck",
    "leftShoulder","rightShoulder",
    "leftArm","rightArm",
    "leftForeArm","rightForeArm",
    "leftHand","rightHand",
    "hips","spine","spine1","spine2",
    "leftUpLeg","rightUpLeg",
    "leftKnee","rightKnee",
    "leftFoot","rightFoot",
    "leftToe","rightToe"
  ];

  for(const k of keys){
    out[k]={
      x:THREE.MathUtils.lerp(a[k].x,b[k].x,t),
      y:THREE.MathUtils.lerp(a[k].y,b[k].y,t),
      z:THREE.MathUtils.lerp(a[k].z,b[k].z,t)
    };
  }

  out.leftFingerCurl=THREE.MathUtils.lerp(a.leftFingerCurl,b.leftFingerCurl,t);
  out.rightFingerCurl=THREE.MathUtils.lerp(a.rightFingerCurl,b.rightFingerCurl,t);
  out.fingerCurl=THREE.MathUtils.lerp(a.fingerCurl,b.fingerCurl,t);

  return out;
}

const THIEF_TALK_POSE_STATE=new WeakMap();

function applyThiefTalkPoseSplitSpeed(c,b,pose,upperLerp,lowerLerp){
  const upper=[
    "leftShoulder","rightShoulder",
    "leftArm","rightArm",
    "leftForeArm","rightForeArm",
    "hips","spine","spine1","spine2",
    "leftHand","rightHand","neck","head"
  ];

  for(const key of upper){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;

    const rest=getRest(c,bone);

    const useAbsolute=
      key==="leftArm" ||
      key==="rightArm" ||
      key==="leftForeArm" ||
      key==="rightForeArm";

    smoothBoneTo(
      bone,
      useAbsolute ? target.x : rest.x+target.x,
      useAbsolute ? target.y : rest.y+target.y,
      useAbsolute ? target.z : rest.z+target.z,
      upperLerp
    );
  }

  for(const key of ["leftUpLeg","rightUpLeg"]){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;
    const rest=getRest(c,bone);

    smoothBoneTo(
      bone,
      rest.x+target.x,
      rest.y+target.y,
      rest.z+target.z,
      .010
    );
  }

  for(const key of ["leftKnee","rightKnee"]){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;
    const rest=getRest(c,bone);

    smoothBoneTo(
      bone,
      rest.x+target.x,
      rest.y+target.y,
      rest.z+target.z,
      .008
    );
  }

  for(const key of ["leftFoot","rightFoot"]){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;
    const rest=getRest(c,bone);

    smoothBoneTo(
      bone,
      rest.x+target.x,
      rest.y+target.y,
      rest.z+target.z,
      .007
    );
  }

  for(const key of ["leftToe","rightToe"]){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;
    const rest=getRest(c,bone);

    smoothBoneTo(
      bone,
      rest.x+target.x,
      rest.y+target.y,
      rest.z+target.z,
      .006
    );
  }
}

function animateThiefTalkPose(c){
  if(!c?.ready) return;

  if(THIEF_TALK_ROOT_LOCK.active && c?.root){
    c.root.position.copy(THIEF_TALK_ROOT_LOCK.position);
    c.root.rotation.y=THIEF_TALK_ROOT_LOCK.yaw;
  }

  const b=getBones(c);
  const now=performance.now();

  let s=THIEF_TALK_POSE_STATE.get(c);
  if(!s){
    s={start:now};
    THIEF_TALK_POSE_STATE.set(c,s);
  }

  const elapsed=(now-s.start)/1000;

  const talkWave=(Math.sin(elapsed*(Math.PI*2/6.4)-Math.PI/2)+1)*.5;
  const talkT=talkWave*talkWave*(3-2*talkWave);

  const pose=lerpThiefTalkPose(
    THIEF_TALK_POSE_A,
    THIEF_TALK_POSE_B,
    talkT
  );

  const entry=THREE.MathUtils.clamp(elapsed/3.6,0,1);
  const entrySmooth=entry*entry*(3-2*entry);

  const upperLerp=THREE.MathUtils.lerp(.010,.026,entrySmooth);
  const lowerLerp=.010;

  if(entry<1){
    const settleFade=1-entrySmooth;
    const stepWave=Math.sin(elapsed*3.2)*settleFade;
    const stepWave2=Math.sin(elapsed*3.2+Math.PI)*settleFade;

    pose.leftUpLeg.x+=stepWave*.035;
    pose.rightUpLeg.x+=stepWave2*.028;

    pose.leftKnee.x+=Math.abs(stepWave)*.050;
    pose.rightKnee.x+=Math.abs(stepWave2)*.042;

    pose.leftFoot.x-=Math.abs(stepWave)*.010;
    pose.rightFoot.x-=Math.abs(stepWave2)*.009;
  }

  applyThiefTalkPoseSplitSpeed(
    c,
    b,
    pose,
    upperLerp,
    lowerLerp
  );

  const t=performance.now()*.001;
  const handWave=Math.sin(t*1.25);
  const handWave2=Math.sin(t*.91+1.1);

  if(b.leftForeArm){
    smoothBoneTo(
      b.leftForeArm,
      pose.leftForeArm.x+handWave*.004,
      pose.leftForeArm.y+handWave2*.002,
      pose.leftForeArm.z+handWave*.005,
      upperLerp
    );
  }

  if(b.rightForeArm){
    smoothBoneTo(
      b.rightForeArm,
      pose.rightForeArm.x-handWave*.005,
      pose.rightForeArm.y-handWave2*.002,
      pose.rightForeArm.z-handWave*.005,
      upperLerp
    );
  }

  const curlPulse=(Math.sin(t*1.15)+1)*.5;
  const rightCurl=THREE.MathUtils.lerp(
    pose.rightFingerCurl ?? .14,
    THIEF_TALK_POSE_B.rightFingerCurl ?? .20,
    curlPulse*.12
  );

  animateThiefEditorFingers(
    c,
    pose.leftFingerCurl ?? .14,
    .025,
    rightCurl
  );

  if(THIEF_TALK_ROOT_LOCK.active && c?.root){
    c.root.position.copy(THIEF_TALK_ROOT_LOCK.position);
    c.root.rotation.y=THIEF_TALK_ROOT_LOCK.yaw;
    c.root.updateMatrixWorld(true);
  }
}

function animateThiefCounter10Pose(c){
  if(!c?.ready) return;

  if(THIEF_TALK_ROOT_LOCK.active && c?.root){
    c.root.position.copy(THIEF_TALK_ROOT_LOCK.position);
    c.root.rotation.y=THIEF_TALK_ROOT_LOCK.yaw;
  }

  const b=getBones(c);

  applyThiefEditorBodyPose(
    c,
    b,
    THIEF_COUNTER10_POSE,
    .045
  );

  animateThiefEditorFingers(
    c,
    THIEF_COUNTER10_POSE.fingerCurl,
    PLAYER_TURN_TUNING.forwardBodyLerp
  );
}

function animateThiefPostDialoguePose(c){
  if(!c?.ready) return;

  const b=getBones(c);
  const pose=THIEF_POST_DIALOGUE_POSE;

  applyThiefEditorBodyPose(
    c,
    b,
    pose,
    THIEF_POSE_TRANSITION_SPEED.body
  );

  animateThiefEditorFingers(
    c,
    pose.leftFingerCurl ?? .14,
    THIEF_POSE_TRANSITION_SPEED.fingers,
    pose.rightFingerCurl ?? .52
  );
}

function updateToxicHeadFacingPlayer(toxic){
  if(!toxic || !toxic.ready || !player || !player.root) return;

  const b=getBones(toxic);
  const head=b.head;
  const neck=b.neck;
  if(!head && !neck) return;

  const pose=THIEF_TALK_POSE;
  const dx=player.root.position.x-toxic.root.position.x;
  const dz=player.root.position.z-toxic.root.position.z;
  const worldAngle=Math.atan2(dx,dz);
  const localAngle=normalizeAngle(worldAngle-toxic.root.rotation.y);
  const yaw=Math.max(-.28,Math.min(.28,localAngle));

  if(neck){
    const rest=getRest(toxic,neck);
    smoothBoneTo(
      neck,
      rest.x+pose.neck.x,
      rest.y+pose.neck.y+yaw*.18,
      rest.z+pose.neck.z,
      THIEF_POSE_TRANSITION_SPEED.head
    );
  }

  if(head){
    const rest=getRest(toxic,head);
    smoothBoneTo(
      head,
      rest.x+pose.head.x,
      rest.y+pose.head.y+yaw*.34,
      rest.z+pose.head.z,
      THIEF_POSE_TRANSITION_SPEED.head
    );
  }
}
function fitModelToHeight(model,targetHeight=1.7){
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  if(size.y<=0){
    return;
  }
  const scale=targetHeight/size.y;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
}
function putModelOnFloor(model,y=0){
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  model.position.y += y - box.min.y;
  model.updateMatrixWorld(true);
}
function keepCharacterAboveFloor(c,margin=0.035){
  if(!c || !c.model) return;
  c.model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(c.model);
  let minY=box.min.y;
  const b=getBones(c);
  const footPos=new THREE.Vector3();
  if(b.leftFoot){
    b.leftFoot.getWorldPosition(footPos);
    minY=Math.min(minY,footPos.y);
  }
  if(b.rightFoot){
    b.rightFoot.getWorldPosition(footPos);
    minY=Math.min(minY,footPos.y);
  }
  if(minY < margin){
    c.model.position.y += margin - minY;
    c.model.updateMatrixWorld(true);
  }
}
function centerModelXZ(model){
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const center=box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.updateMatrixWorld(true);
}
function printHierarchy(obj,depth=0){
  const info=[];
  if(obj.isMesh) info.push("Mesh");
  if(obj.isSkinnedMesh) info.push("SkinnedMesh");
  if(obj.isBone) info.push("Bone");
  if(obj.isGroup) info.push("Group");
  obj.children.forEach((child)=>printHierarchy(child,depth+1));
}


function smoothBoneTo(bone,x,y,z,lerp=0.28){
  if(!bone) return;
  bone.rotation.x=THREE.MathUtils.lerp(bone.rotation.x,x,lerp);
  bone.rotation.y=THREE.MathUtils.lerp(bone.rotation.y,y,lerp);
  bone.rotation.z=THREE.MathUtils.lerp(bone.rotation.z,z,lerp);
}
function formatDialogueName(name){
  if(!name) return "UNKNOWN";
  return String(name)
    .replace(/([a-z])([A-Z])/g,"$1 $2")
    .replace(/_/g," ")
    .toUpperCase();
}
const GLOBAL_DIALOGUE_LOCK={
  active:false,
  npc:null
};
function getDialogueHintSafe(){
  return document.getElementById("dialogueHint") || null;
}

function showDialogue(text){
  dialogue.classList.remove("warningMode");
  const speaker=GLOBAL_DIALOGUE_LOCK.npc?.name || currentTarget?.name || "NPC";
  if(dialogueName) dialogueName.textContent=formatDialogueName(speaker);
  if(dialogueBody) dialogueBody.textContent=text;
  {
    const dialogueHint=getDialogueHintSafe();
    if(dialogueHint){
      dialogueHint.textContent="PRESS E · END CONVERSATION";
      dialogueHint.style.display="block";
    }
  }
  dialogue.style.display="block";
}
function hideDialogue(){
  dialogue.classList.remove("warningMode");
  dialogue.style.display="none";
  if(dialogueBody) dialogueBody.textContent="";
  {
    const dialogueHint=getDialogueHintSafe();
    if(dialogueHint) dialogueHint.style.display="none";
  }
}
function beginGenericNPCConversation(npc){
  if(!npc || GLOBAL_DIALOGUE_LOCK.active || QUEST.dialogueActive) return;

  NPC_CONVERSATION_FINAL_LATCH.delete(npc);
  NPC_TALK_TURN_STEP_STATE.delete(npc);

  DIALOGUE_E_LOCK=false;
  setDialogueMovementLock(true);
  if(npc.name==="child"){
    npc.state="talk";
    npc.timer=0;
    CHILD_VISIT_POSE_STATE.talkStart=performance.now();
    CHILD_VISIT_POSE_STATE.talkStartPos=npc.root ? npc.root.position.clone() : null;
    CHILD_ADVANCED_TALK_STATE.delete(npc);
    CHILD_NEW_TALK_STATE.delete(npc);

    childUserStartPoseFlow(npc);

    npc.userDataGreetingStart=performance.now();
    questStartDialogue("GIRL",[
      "Hi! Could you help me win a little toy from the claw machine?"
    ],()=>{

      NPC_TALK_TURN_STEP_STATE.delete(npc);
      NPC_CONVERSATION_FINAL_LATCH.delete(npc);

      childUserBeginReturnPose1(npc);

      npc.state="idle";
      npc.timer=0;
    });
    return;
  }
  GLOBAL_DIALOGUE_LOCK.active=true;
  GLOBAL_DIALOGUE_LOCK.npc=npc;
  npc.state="talk";
  npc.timer=0;
  npc.startDialogue();
  if(dialogueActionHint) dialogueActionHint.textContent="E · CONCLUDE";
}

const NPC_CONVERSATION_FINAL_LATCH=new WeakMap();

function captureNpcConversationFinalPose(npc){
  if(!npc?.root) return;

  const b=getBones(npc);
  const lowerKeys=[
    "hips",
    "leftUpLeg","rightUpLeg",
    "leftKnee","rightKnee",
    "leftFoot","rightFoot",
    "leftToe","rightToe"
  ];

  const lower={};

  for(const key of lowerKeys){
    const bone=b[key];
    if(!bone) continue;
    lower[key]=bone.quaternion.clone();
  }

  NPC_CONVERSATION_FINAL_LATCH.set(npc,{
    yaw:npc.root.rotation.y,
    lower
  });
}

function applyNpcConversationFinalPose(npc){
  if(!npc?.root) return false;

  const latched=NPC_CONVERSATION_FINAL_LATCH.get(npc);
  if(!latched) return false;

  npc.root.rotation.y=latched.yaw;

  const b=getBones(npc);

  for(const [key,q] of Object.entries(latched.lower)){
    const bone=b[key];
    if(!bone) continue;
    bone.quaternion.copy(q);
  }

  npc.root.updateMatrixWorld(true);
  return true;
}

function clearAllNpcConversationFinalPoses(){
  if(typeof npcs==="undefined") return;

  for(const npc of npcs){
    if(!npc?.root) continue;

    NPC_CONVERSATION_FINAL_LATCH.delete(npc);
    NPC_TALK_TURN_STEP_STATE.delete(npc);
    SECURITY_POST_TALK_IDLE_STATE.delete(npc);

    const b=getBones(npc);
    for(const key of [
      "hips",
      "leftUpLeg","rightUpLeg",
      "leftKnee","rightKnee",
      "leftFoot","rightFoot",
      "leftToe","rightToe"
    ]){
      const bone=b[key];
      if(!bone) continue;
      const rest=getRest(npc,bone);
      if(rest){
        bone.rotation.set(rest.x,rest.y,rest.z);
      }
    }

    if(typeof npc.__conversationOriginalYaw==="number"){
      npc.root.rotation.y=npc.__conversationOriginalYaw;
    }

    npc.root.updateMatrixWorld(true);
  }
}

function ensureNpcConversationOriginalYaw(npc){
  if(!npc?.root) return;
  if(typeof npc.__conversationOriginalYaw!=="number"){
    npc.__conversationOriginalYaw=npc.root.rotation.y;
  }
}

function endGenericNPCConversation(){
  const npc=GLOBAL_DIALOGUE_LOCK.npc;
  GLOBAL_DIALOGUE_LOCK.active=false;
  GLOBAL_DIALOGUE_LOCK.npc=null;

  if(npc){

    captureNpcConversationFinalPose(npc);

    npc.stopDialogue?.();
    npc.state="idle";
    npc.timer=0;
  }

  hideDialogue();
  setDialogueMovementLock(false);
}
const characterContext = {
  scene,
  dialogueSystem: {
    show: showDialogue,
    hide: hideDialogue
  }
};
function createCharacter(config) {
  return config.role === "player" || config.id === "player"
    ? new Player(config, characterContext)
    : new NPC(config, characterContext);
}
const player = createCharacter(CHARACTER_CONFIGS.player);

const LIGHTING_CONTROLLER=
  createLightingTuningController({
    scene,
    player,
    moonLight,
    ambientFill,
    skyFill,
    fixedLightPool:FIXED_LIGHT_POOL,
    getActiveWorldZone:()=>activeWorldZone,
    buildPanel:false
  });

function setCasinoInteriorLighting(insideCasino){
  LIGHTING_CONTROLLER.setCasinoInteriorLighting(insideCasino);
}

function applyPointLightTuning(){
  return LIGHTING_CONTROLLER.apply();
}

const PLAYER_GARDEN_BLOB_SHADOW=
  createPlayerGardenBlobShadowSystem(scene);


const PLAYER_GARDEN_DIRECTIONAL_SHADOW={
  enabled:false,
  entranceOffsetMeters:3.0,
  previousAutoUpdate:null,


  fade:0,
  targetFade:0,
  fadeSpeed:1.65,
  materials:new Map()
};

function getPlayerGardenDirectionalShadowBounds(){
  const p=GARDEN_PAVEMENT_PERIMETER;


  return {
    xMin:p.xMin-2.0,
    xMax:p.xMax+2.0,
    zMin:p.zMin+
      PLAYER_GARDEN_DIRECTIONAL_SHADOW.entranceOffsetMeters,
    zMax:p.zMax+4.0
  };
}

function isPlayerInsideGardenDirectionalShadowZone(){
  if(
    activeWorldZone!=="outside" ||
    !player?.root ||
    !player?.ready
  ){
    return false;
  }

  const p=player.root.position;
  const b=getPlayerGardenDirectionalShadowBounds();

  return (
    p.x>=b.xMin &&
    p.x<=b.xMax &&
    p.z>=b.zMin &&
    p.z<=b.zMax
  );
}

function updatePlayerGardenShadowFade(dt,insideGarden){
  const s=PLAYER_GARDEN_DIRECTIONAL_SHADOW;

  s.targetFade=insideGarden ? 1 : 0;

  const step=
    Math.max(dt||1/60,0)*
    s.fadeSpeed;

  s.fade=THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(
      s.fade,
      s.targetFade,
      THREE.MathUtils.clamp(step,0,1)
    ),
    0,
    1
  );


  player?.model?.traverse?.(obj=>{
    if(!obj?.isMesh) return;

    let depth=s.materials.get(obj);

    if(!depth){
      depth=new THREE.MeshDepthMaterial({
        depthPacking:THREE.RGBADepthPacking,
        alphaTest:0
      });


      depth.skinning=!!obj.isSkinnedMesh;

      s.materials.set(obj,depth);
      obj.customDepthMaterial=depth;
    }


    depth.alphaTest=
      THREE.MathUtils.lerp(
        1.01,
        0.0,
        s.fade
      );

    depth.needsUpdate=true;
  });

  return s.fade;
}

function setPlayerGardenDirectionalShadowEnabled(enabled){
  enabled=!!enabled;

  if(
    PLAYER_GARDEN_DIRECTIONAL_SHADOW.enabled===enabled &&
    player?.model
  ){
    return;
  }

  PLAYER_GARDEN_DIRECTIONAL_SHADOW.enabled=enabled;

  player?.model?.traverse?.(obj=>{
    if(!obj?.isMesh) return;


    obj.castShadow=enabled;
    obj.receiveShadow=true;
  });

  if(renderer?.shadowMap){
    if(enabled){
      if(
        PLAYER_GARDEN_DIRECTIONAL_SHADOW.previousAutoUpdate===null
      ){
        PLAYER_GARDEN_DIRECTIONAL_SHADOW.previousAutoUpdate=
          renderer.shadowMap.autoUpdate;
      }

      renderer.shadowMap.enabled=true;
      renderer.shadowMap.autoUpdate=true;
      renderer.shadowMap.needsUpdate=true;
    }else{
      if(
        PLAYER_GARDEN_DIRECTIONAL_SHADOW.previousAutoUpdate!==null
      ){
        renderer.shadowMap.autoUpdate=
          PLAYER_GARDEN_DIRECTIONAL_SHADOW.previousAutoUpdate;
      }

      PLAYER_GARDEN_DIRECTIONAL_SHADOW.previousAutoUpdate=null;
      renderer.shadowMap.needsUpdate=true;
    }
  }
}

function updatePlayerGardenBlobShadow(dt){
  const insideGarden=
    isPlayerInsideGardenDirectionalShadowZone();

  const fade=
    updatePlayerGardenShadowFade(
      dt,
      insideGarden
    );


  const shouldCast=
    insideGarden ||
    fade>.015;

  setPlayerGardenDirectionalShadowEnabled(
    shouldCast
  );

  if(!shouldCast) return;

  moonLight.castShadow=true;

  if(renderer?.shadowMap){
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.needsUpdate=true;
  }
}


const npcs = NPC_ORDER
  .filter((key)=>key!=="boyListeningMusic")
  .map((key)=>createCharacter(CHARACTER_CONFIGS[key]));
globalThis.npcs=npcs;
const POSES={
  player:{
    armX:.83,
    foreArmX:.14
  },
  securityMan:{
    armX:1.05,
    foreArmX:.10
  },
  boyListeningMusic:{
    armX:1.05,
    foreArmX:.10
  },
  toxicMan:{
    armX:1.05,
    foreArmX:.10
  },
  child:{
    armX:1.10,
    foreArmX:.10,
    leftArmRestX:1.0795,
    leftArmRestZ:-0.0015,
    rightArmRestX:1.1295,
    rightArmRestZ:0.0246,
    leftArmTalkX:0.9295,
    leftArmTalkZ:0.7485,
    rightArmTalkX:1.1295,
    rightArmTalkZ:0.2246,
    leftForeArmTalkX:0.1936,
    rightForeArmTalkX:-0.1583,
    rightHandTalkX:0.0379,
    rightHandTalkY:0.3435
  }
};
function getPose(c){
  return POSES[c.name] || POSES.player;
}
const TALK_POSES={
  child:{
    energy:1.0,
    useLeft:true,
    useRight:true,
    leftArm:{
      restX:0.90,
      restZ:0.0246,
      talkX:0.84,
      talkZ:0.1685
    },
    rightArm:{
      restX:0.95,
      restZ:0.0246,
      talkX:0.84,
      talkZ:-0.55
    },
    leftForeArmX:0.1936,
    rightForeArmX:0.05
  },
  securityMan:{
    energy:0.72,
    useLeft:true,
    useRight:true,
    leftArm:{
      restX:1.07,
      restY:0.00,
      restZ:0.03,
      talkX:0.84,
      talkY:0.00,
      talkZ:0.15,
      moveX:0.026,
      moveY:0.000,
      moveZ:0.032
    },
    leftForeArm:{
      restX:0.17,
      restY:0.00,
      restZ:0.025,
      talkX:0.46,
      talkY:0.00,
      talkZ:0.25,
      moveX:0.050,
      moveY:0.000,
      moveZ:0.038
    },
    leftHand:{
      restX:0.00,
      restY:0.00,
      restZ:0.00,
      talkX:0.015,
      talkY:0.010,
      talkZ:0.015,
      moveX:0.006,
      moveY:0.006,
      moveZ:0.008
    },
    rightArm:{
      restX:1.03,
      restY:0.00,
      restZ:-0.03,
      talkX:0.92,
      talkY:0.00,
      talkZ:-0.24,
      moveX:0.030,
      moveY:0.000,
      moveZ:0.038
    },
    rightForeArm:{
      restX:0.17,
      restY:-0.04,
      restZ:-0.145,
      talkX:0.48,
      talkY:0.00,
      talkZ:-0.50,
      moveX:0.058,
      moveY:0.000,
      moveZ:0.044
    },
    rightHand:{
      restX:0.00,
      restY:0.00,
      restZ:0.00,
      talkX:0.015,
      talkY:-0.010,
      talkZ:-0.015,
      moveX:0.006,
      moveY:0.006,
      moveZ:0.008
    }
  },
  boyListeningMusic:{
    energy:0.15,
    useLeft:true,
    useRight:true,
    leftArm:{
      restX:0.88,
      restZ:0,
      talkX:0.84,
      talkZ:0.20
    },
    rightArm:{
      restX:0.88,
      restZ:0,
      talkX:0.84,
      talkZ:0.20
    },
    leftForeArmX:0.32,
    rightForeArmX:0.35
  }
};
const TOXIC_MAN_STATIC_CONFIG={
  enabled:true,
  targetLimb:"all",
  use:{
    leftArm:true,
    rightArm:true,
    leftForeArm:true,
    rightForeArm:true,
    leftHand:true,
    rightHand:true,
    leftUpLeg:false,
    rightUpLeg:false,
    leftKnee:false,
    rightKnee:false,
    leftFoot:false,
    rightFoot:false
  },
  limbs:{
    leftArm:{x:0.95,y:0.00,z:THREE.MathUtils.degToRad(5),lerp:0.12},
    leftForeArm:{x:0.12,y:0.00,z:0.05,lerp:0.14},
    leftHand:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    rightArm:{x:1.05,y:0.00,z:-0.12,lerp:0.14},
    rightForeArm:{x:0.16,y:-0.52,z:-1.40,lerp:0.14},
    rightHand:{x:0.96,y:0.00,z:0.04,lerp:0.14},
    leftUpLeg:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    rightUpLeg:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    leftKnee:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    rightKnee:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    leftFoot:{x:0.00,y:0.00,z:0.00,lerp:0.14},
    rightFoot:{x:0.00,y:0.00,z:0.00,lerp:0.14}
  }
};

setTimeout(()=>{
  globalThis.__mainModuleReadyForLateEditors=true;

},0);

const THIEF_UNDISCOVERED_POSE_A={
  head:{x:-0.03,y:-0.43,z:0},
  neck:{x:0.10,y:0,z:0},
  leftShoulder:{x:0.06,y:0,z:0},
  rightShoulder:{x:0,y:0,z:0},
  leftArm:{x:0.91,y:-0.16,z:-0.09},
  rightArm:{x:0.91,y:-0.02,z:-0.09},
  leftForeArm:{x:0.14,y:0.03,z:0.06},
  rightForeArm:{x:0.14,y:-0.03,z:-0.06},
  leftHand:{x:0,y:0,z:0},
  rightHand:{x:0,y:0,z:0},
  hips:{x:0,y:0,z:0},
  spine:{x:0,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},
  leftUpLeg:{x:-0.05,y:0.08,z:0.10},
  rightUpLeg:{x:0,y:0,z:0},
  leftKnee:{x:0.01,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},
  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},
  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},
  leftFingerCurl:0.14,
  rightFingerCurl:0.14,
  fingerCurl:0.14
};

const THIEF_UNDISCOVERED_POSE_B={
  head:{x:-0.03,y:0.12,z:0},
  neck:{x:0.10,y:0,z:0},
  leftShoulder:{x:0.06,y:0,z:0},
  rightShoulder:{x:0,y:0,z:0},
  leftArm:{x:0.91,y:-0.66,z:-0.19},
  rightArm:{x:0.91,y:-0.02,z:-0.09},
  leftForeArm:{x:0.14,y:0.03,z:0.06},
  rightForeArm:{x:0.14,y:-0.03,z:-0.06},
  leftHand:{x:0,y:0,z:0},
  rightHand:{x:0,y:0,z:0},
  hips:{x:0,y:0,z:0},
  spine:{x:0,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},
  leftUpLeg:{x:-0.05,y:0.08,z:0.10},
  rightUpLeg:{x:0,y:0,z:0},
  leftKnee:{x:0.01,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},
  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},
  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},
  leftFingerCurl:0.14,
  rightFingerCurl:0.14,
  fingerCurl:0.20
};

const THIEF_UNDISCOVERED_POSE_C={
  head:{x:-0.03,y:-0.43,z:0},
  neck:{x:0.10,y:0,z:0},
  leftShoulder:{x:0.06,y:0,z:0},
  rightShoulder:{x:0,y:0,z:0},
  leftArm:{x:0.91,y:-0.16,z:-0.09},
  rightArm:{x:0.91,y:-0.02,z:-0.09},
  leftForeArm:{x:0.14,y:0.03,z:0.06},
  rightForeArm:{x:0.14,y:-0.03,z:-0.06},
  leftHand:{x:0,y:0,z:0},
  rightHand:{x:0,y:0,z:0},
  hips:{x:0,y:0,z:0},
  spine:{x:0,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},
  leftUpLeg:{x:-0.05,y:0.08,z:0.10},
  rightUpLeg:{x:0,y:0,z:0},
  leftKnee:{x:0.01,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},
  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},
  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},
  leftFingerCurl:0.14,
  rightFingerCurl:0.14,
  fingerCurl:0.14
};

const THIEF_COUNTER10_POSE={
  head:{x:0.22,y:-0.08,z:0.02},
  neck:{x:0.10,y:0,z:0},

  leftShoulder:{x:0.06,y:0,z:0},
  rightShoulder:{x:0,y:0,z:0},

  leftArm:{x:0.91,y:-0.16,z:-0.09},
  rightArm:{x:0.91,y:-0.02,z:-0.09},

  leftForeArm:{x:0.14,y:0.03,z:0.06},
  rightForeArm:{x:0.14,y:-0.03,z:-0.06},

  leftHand:{x:0,y:0,z:0},
  rightHand:{x:0,y:0,z:0},

  hips:{x:0,y:0,z:0},
  spine:{x:0.02,y:0,z:0},
  spine1:{x:0.03,y:0,z:0},
  spine2:{x:0.04,y:0,z:0},

  leftUpLeg:{x:-0.05,y:0.08,z:0.10},
  rightUpLeg:{x:0,y:0,z:0},

  leftKnee:{x:0.01,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},

  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},

  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},

  leftFingerCurl:0.14,
  rightFingerCurl:0.14,
  fingerCurl:0.14
};
const THIEF_TALK_POSE_A={
  head:{x:.03,y:.02,z:.03},
  neck:{x:.004,y:0,z:0},

  leftShoulder:{x:.13,y:.03,z:0},
  rightShoulder:{x:0,y:0,z:0},

  leftArm:{x:1.04,y:-.13,z:.38},
  rightArm:{x:1.01,y:.28,z:-.03},
  leftForeArm:{x:.18,y:.03,z:.08},
  rightForeArm:{x:.18,y:-.03,z:-.08},
  leftHand:{x:.02,y:0,z:.02},
  rightHand:{x:.02,y:0,z:-.02},

  hips:{x:0,y:0,z:0},
  spine:{x:.02,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},

  leftUpLeg:{x:-0.05,y:0.08,z:0.10},
  rightUpLeg:{x:0,y:0,z:0},
  leftKnee:{x:0.01,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},
  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},
  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},

  leftFingerCurl:.14,
  rightFingerCurl:.52,
  fingerCurl:.52
};
const THIEF_TALK_POSE_B={
  head:{x:0.21,y:0.02,z:0.03},
  neck:{x:0.004,y:0,z:0},

  leftShoulder:{x:-0.03,y:0.03,z:-0.16},
  rightShoulder:{x:0,y:0,z:0},

  leftArm:{x:1.04,y:0.06,z:0.38},
  rightArm:{x:0.91,y:-0.16,z:-0.03},

  leftForeArm:{x:0.18,y:0.03,z:0},
  rightForeArm:{x:0.18,y:-0.03,z:-0.28},

  leftHand:{x:-0.23,y:0,z:0.02},
  rightHand:{x:0.02,y:0,z:-0.02},

  hips:{x:0,y:0,z:0},
  spine:{x:0.02,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},

  leftUpLeg:{x:-0.08,y:0.06,z:0.11},
  rightUpLeg:{x:0,y:0,z:0},

  leftKnee:{x:-0.03,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},

  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},

  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},

  leftFingerCurl:0.28,
  rightFingerCurl:0.20,
  fingerCurl:0.20
};

const THIEF_TALK_POSE=THIEF_TALK_POSE_A;

const THIEF_POST_DIALOGUE_POSE={

  head:{x:.03,y:.02,z:.03},
  neck:{x:.004,y:0,z:0},

  leftShoulder:{x:.13,y:.03,z:0},
  rightShoulder:{x:0,y:0,z:0},

  leftArm:{x:1.04,y:-.13,z:.38},
  rightArm:{x:1.01,y:.28,z:-.03},
  leftForeArm:{x:.18,y:.03,z:.08},
  rightForeArm:{x:.18,y:-.03,z:-.08},
  leftHand:{x:.02,y:0,z:.02},
  rightHand:{x:.02,y:0,z:-.02},

  hips:{x:0,y:0,z:0},
  spine:{x:.02,y:0,z:0},
  spine1:{x:0,y:0,z:0},
  spine2:{x:0,y:0,z:0},

  leftUpLeg:{x:.03,y:.28,z:.03},
  rightUpLeg:{x:0,y:0,z:0},
  leftKnee:{x:0,y:0,z:0},
  rightKnee:{x:0,y:0,z:0},
  leftFoot:{x:0,y:0,z:0},
  rightFoot:{x:0,y:0,z:0},
  leftToe:{x:0,y:0,z:0},
  rightToe:{x:0,y:0,z:0},

  leftFingerCurl:.14,
  rightFingerCurl:.52,
  fingerCurl:.52
};

const TOXIC_FINGER_STATE=new WeakMap();
function getToxicFingerState(c){
  let state=TOXIC_FINGER_STATE.get(c);
  if(state) return state;
  const fingers=c.bones
    .map((bone)=>{
      const name=(bone.name || "").toLowerCase().replace(/[^a-z0-9]/g,"");
      const match=name.match(/(?:thumb|index|middle|ring|pinky|little)([1-4])/);
      const segment=match ? Number(match[1]) : 0;
      const isFinger=
        name.includes("thumb") ||
        name.includes("index") ||
        name.includes("middle") ||
        name.includes("ring") ||
        name.includes("pinky") ||
        name.includes("little");
      return {bone,name,segment,isFinger,rest:bone.rotation.clone()};
    })
    .filter((item)=>item.isFinger && item.segment>=1 && item.segment<=3);
  state={fingers};
  TOXIC_FINGER_STATE.set(c,state);
  return state;
}
function animateThiefEditorFingers(c,closure=.2,lerp=.11,rightClosure=closure){
  if(c?.name!=="toxicMan") return;

  const state=getToxicFingerState(c);
  if(!state.fingers.length) return;

  const leftAmount=THREE.MathUtils.clamp(closure,0,1.6);
  const rightAmount=THREE.MathUtils.clamp(rightClosure,0,1.6);

  for(const item of state.fingers){
    const {bone,name,segment,rest}=item;
    const isLeft=name.includes("left");
    const amount=isLeft ? leftAmount : rightAmount;

    if(name.includes("thumb")){
      const baseX=
        segment===1 ? -.12 :
        segment===2 ? -.22 :
        -.30;

      const baseZ=
        (
          segment===1 ? .11 :
          segment===2 ? .08 :
          .04
        )*(isLeft ? -1 : 1);

      smoothBoneTo(
        bone,
        rest.x+baseX*amount,
        rest.y,
        rest.z+baseZ*amount,
        lerp
      );
      continue;
    }

    let curl=
      segment===1 ? .52 :
      segment===2 ? .78 :
      .62;

    if(name.includes("ring")) curl*=1.06;
    if(name.includes("pinky") || name.includes("little")) curl*=1.12;

    smoothBoneTo(
      bone,
      rest.x+curl*amount,
      rest.y,
      rest.z,
      lerp
    );
  }
}

function posePartValues(part,talkAmount,s,s2,e){
  return {
    x:THREE.MathUtils.lerp(part.restX ?? 0, part.talkX ?? part.restX ?? 0, talkAmount) + s*(part.moveX ?? 0)*e,
    y:THREE.MathUtils.lerp(part.restY ?? 0, part.talkY ?? part.restY ?? 0, talkAmount) + s2*(part.moveY ?? 0)*e,
    z:THREE.MathUtils.lerp(part.restZ ?? 0, part.talkZ ?? part.restZ ?? 0, talkAmount) + s2*(part.moveZ ?? 0)*e
  };
}
function animateBoyListeningMusic(c,b,talking=false){
  if(!boyListeningMusic?.root) return;
  const t=performance.now()*0.001;
  const boyIsTalking=!!(activeDialogue && activeDialogue.npc===boyListeningMusic);
  const k=boyIsTalking ? 0.34 : 1.0;
  const bones=boyListeningMusic.bones||{};
  const rest=boyListeningMusic.rest||{};
  const breath=Math.sin(t*1.55);
  const slowWeight=Math.sin(t*0.48);
  const lookMicro=Math.sin(t*0.31+0.7);
  const reaction=Math.sin(t*0.93)*Math.sin(t*0.17);
  const shoulder=Math.sin(t*0.61+1.2);
  const apply=(key,rx=0,ry=0,rz=0,lerp=.075)=>{
    const bone=bones[key];
    if(!bone) return;
    const r=rest[key] || {x:bone.rotation.x,y:bone.rotation.y,z:bone.rotation.z};
    smoothBoneTo(
      bone,
      r.x+rx*k,
      r.y+ry*k,
      r.z+rz*k,
      lerp
    );
  };
  apply("hips", 0.006*breath, 0.010*slowWeight, 0.006*slowWeight, .065);
  apply("spine", -0.032+0.012*breath, 0.012*lookMicro, 0.004*slowWeight, .070);
  apply("spine1",-0.024+0.010*breath, 0.010*lookMicro, 0.003*slowWeight, .072);
  apply("spine2",-0.016+0.008*breath, 0.008*lookMicro, 0.003*slowWeight, .075);
  apply("neck",-0.015+0.006*breath, 0.014*lookMicro, 0.003*reaction, .080);
  apply("head",-0.008+0.005*breath, 0.020*Math.sin(t*.36), 0.004*reaction, .090);
  apply("leftUpperArm",  0.012*shoulder,  0.004*slowWeight,  0.035+0.008*breath, .080);
  apply("rightUpperArm",-0.012*shoulder, -0.004*slowWeight, -0.035-0.008*breath, .080);
  apply("leftLowerArm",  0.018+0.008*reaction, 0.004*lookMicro,  0.010, .085);
  apply("rightLowerArm", 0.018-0.008*reaction,-0.004*lookMicro, -0.010, .085);
  apply("leftHand",  0.006*breath, 0.004*reaction,  0.004, .090);
  apply("rightHand",-0.006*breath,-0.004*reaction, -0.004, .090);
  apply("leftUpperLeg",  0.010*slowWeight,0, 0.006*slowWeight,.065);
  apply("rightUpperLeg",-0.010*slowWeight,0,-0.006*slowWeight,.065);
  apply("leftLowerLeg",  0.008*Math.max(0, slowWeight),0,0,.070);
  apply("rightLowerLeg", 0.008*Math.max(0,-slowWeight),0,0,.070);
  apply("leftFoot", -0.006*slowWeight,0,0,.075);
  apply("rightFoot", 0.006*slowWeight,0,0,.075);
  if(Math.sin(t*.21)>0.82){
    apply("spine2",-0.022+0.012*reaction,0.012*reaction,0,.080);
    apply("head",-0.012,0.022*reaction,0,.095);
  }
}
function animateNpcPersonality(c,b,talking=false){
  const now=performance.now();
  if(c.name==="child"){
    const t=now*.00155;
    const slow=Math.sin(t);
    const slow2=Math.sin(t*.63+1.1);
    const amount=talking ? .72 : .42;
    if(talking){
      const wave=Math.sin(now*.010);
      if(b.rightArm){
        const r=getRest(c,b.rightArm);
        smoothBoneTo(b.rightArm,r.x-.20,r.y,r.z+.42,.10);
      }
      if(b.rightForeArm){
        const r=getRest(c,b.rightForeArm);
        smoothBoneTo(b.rightForeArm,r.x-.34,r.y,r.z+.18+wave*.08,.11);
      }
      if(b.rightHand){
        const r=getRest(c,b.rightHand);
        smoothBoneTo(b.rightHand,r.x,r.y+wave*.10,r.z+wave*.12,.12);
      }
    }
    if(b.hips){
      smoothBoneTo(
        b.hips,
        getRest(c,b.hips).x,
        getRest(c,b.hips).y+slow2*.006*amount,
        getRest(c,b.hips).z+slow*.007*amount,
        .055
      );
    }
    if(b.spine){
      smoothBoneTo(
        b.spine,
        getRest(c,b.spine).x+slow2*.006*amount,
        getRest(c,b.spine).y,
        getRest(c,b.spine).z+slow*.007*amount,
        .055
      );
    }
    if(b.neck){
      smoothBoneTo(
        b.neck,
        getRest(c,b.neck).x,
        getRest(c,b.neck).y+slow*.012*amount,
        getRest(c,b.neck).z+slow2*.005*amount,
        .060
      );
    }
    if(b.head){
      smoothBoneTo(
        b.head,
        getRest(c,b.head).x+slow2*.010*amount,
        getRest(c,b.head).y+slow*.024*amount,
        getRest(c,b.head).z+slow2*.012*amount,
        .060
      );
    }
    return;
  }
  if(c.name==="boyListeningMusic"){
    animateBoyListeningMusic(c,b,talking);
    return;
  }
}
function animateConfiguredTalk(c){
  const b=getBones(c);
  const cfg=TALK_POSES[c.name];
  if(!cfg){
    animateIdle(c);
    return;
  }
  const t=performance.now()*.0075;
  const s=Math.sin(t);
  const s2=Math.sin(t*1.7);
  const talkAmount=0.62 + Math.sin(t*.9)*0.22;
  const e=cfg.energy;
  const fullEditableArms =
    typeof cfg.leftForeArm === "object" &&
    typeof cfg.rightForeArm === "object" &&
    typeof cfg.leftHand === "object" &&
    typeof cfg.rightHand === "object";
  if(fullEditableArms){
    const leftArm=posePartValues(cfg.leftArm,talkAmount,s,s2,e);
    const rightArm=posePartValues(cfg.rightArm,talkAmount,s2,s,e);
    const leftForeArm=posePartValues(cfg.leftForeArm,talkAmount,s2,s,e);
    const rightForeArm=posePartValues(cfg.rightForeArm,talkAmount,s,s2,e);
    const leftHand=posePartValues(cfg.leftHand,talkAmount,s,s2,e);
    const rightHand=posePartValues(cfg.rightHand,talkAmount,s,s2,e);
    if(cfg.useLeft){
      smoothBoneTo(b.leftArm,leftArm.x,leftArm.y,leftArm.z,.17);
      smoothBoneTo(b.leftForeArm,leftForeArm.x,leftForeArm.y,leftForeArm.z,.17);
      smoothBoneTo(
        b.leftHand,
        getRest(c,b.leftHand).x + leftHand.x,
        getRest(c,b.leftHand).y + leftHand.y,
        getRest(c,b.leftHand).z + leftHand.z,
        .17
      );
    }else{
      smoothBoneTo(b.leftArm,cfg.leftArm.restX,cfg.leftArm.restY,cfg.leftArm.restZ,.17);
      smoothBoneTo(b.leftForeArm,cfg.leftForeArm.restX,cfg.leftForeArm.restY,cfg.leftForeArm.restZ,.17);
      smoothBoneTo(
        b.leftHand,
        getRest(c,b.leftHand).x + cfg.leftHand.restX,
        getRest(c,b.leftHand).y + cfg.leftHand.restY,
        getRest(c,b.leftHand).z + cfg.leftHand.restZ,
        .17
      );
    }
    if(cfg.useRight){
      smoothBoneTo(b.rightArm,rightArm.x,rightArm.y,rightArm.z,.17);
      smoothBoneTo(b.rightForeArm,rightForeArm.x,rightForeArm.y,rightForeArm.z,.17);
      smoothBoneTo(
        b.rightHand,
        getRest(c,b.rightHand).x + rightHand.x,
        getRest(c,b.rightHand).y + rightHand.y,
        getRest(c,b.rightHand).z + rightHand.z,
        .17
      );
    }else{
      smoothBoneTo(b.rightArm,cfg.rightArm.restX,cfg.rightArm.restY,cfg.rightArm.restZ,.17);
      smoothBoneTo(b.rightForeArm,cfg.rightForeArm.restX,cfg.rightForeArm.restY,cfg.rightForeArm.restZ,.17);
      smoothBoneTo(
        b.rightHand,
        getRest(c,b.rightHand).x + cfg.rightHand.restX,
        getRest(c,b.rightHand).y + cfg.rightHand.restY,
        getRest(c,b.rightHand).z + cfg.rightHand.restZ,
        .17
      );
    }
  }else{
    function armValues(side){
      const data=cfg[side+"Arm"];
      return {
        x:THREE.MathUtils.lerp(data.restX,data.talkX,talkAmount),
        z:THREE.MathUtils.lerp(data.restZ,data.talkZ,talkAmount)
      };
    }
    const left=armValues("left");
    const right=armValues("right");
    if(cfg.useLeft){
      smoothBoneTo(
        b.leftArm,
        left.x+s*.025*e,
        0,
        left.z+s2*.035*e,
        .17
      );
      smoothBoneTo(
        b.leftForeArm,
        cfg.leftForeArmX+s2*.05*e,
        getRest(c,b.leftForeArm).y,
        getRest(c,b.leftForeArm).z,
        .17
      );
      smoothBoneTo(
        b.leftHand,
        getRest(c,b.leftHand).x+s*.025*e,
        getRest(c,b.leftHand).y+s2*.030*e,
        getRest(c,b.leftHand).z+s2*.045*e,
        .17
      );
    }else{
      smoothBoneTo(b.leftArm,cfg.leftArm.restX,0,cfg.leftArm.restZ,.17);
      smoothBoneTo(b.leftForeArm,cfg.leftForeArmX,0,0,.17);
      smoothBoneTo(
        b.leftHand,
        getRest(c,b.leftHand).x,
        getRest(c,b.leftHand).y,
        getRest(c,b.leftHand).z,
        .17
      );
    }
    if(cfg.useRight){
      smoothBoneTo(
        b.rightArm,
        right.x+s2*.025*e,
        0,
        right.z+s2*.035*e,
        .17
      );
      smoothBoneTo(
        b.rightForeArm,
        cfg.rightForeArmX+s*.05*e,
        getRest(c,b.rightForeArm).y,
        getRest(c,b.rightForeArm).z,
        .17
      );
      const fistX = c.name==="securityMan" ? 0.10 : 0.00;
      const fistY = c.name==="securityMan" ? 0.08 : 0.00;
      const fistZ = c.name==="securityMan" ? -0.06 : 0.00;
      smoothBoneTo(
        b.rightHand,
        getRest(c,b.rightHand).x+fistX+s*.030*e,
        getRest(c,b.rightHand).y+fistY+s2*.10*e,
        getRest(c,b.rightHand).z+fistZ+s*.12*e,
        .17
      );
    }else{
      smoothBoneTo(b.rightArm,cfg.rightArm.restX,0,cfg.rightArm.restZ,.17);
      smoothBoneTo(b.rightForeArm,cfg.rightForeArmX,0,0,.17);
      smoothBoneTo(
        b.rightHand,
        getRest(c,b.rightHand).x,
        getRest(c,b.rightHand).y,
        getRest(c,b.rightHand).z,
        .17
      );
    }
  }
  smoothBoneTo(
    b.hips,
    getRest(c,b.hips).x+s*.002*e,
    getRest(c,b.hips).y+s*.004*e,
    getRest(c,b.hips).z-s*.004*e,
    .12
  );
  smoothBoneTo(
    b.spine,
    getRest(c,b.spine).x+s*.012*e,
    getRest(c,b.spine).y,
    getRest(c,b.spine).z+s*.026*e,
    .12
  );
  smoothBoneTo(
    b.neck,
    getRest(c,b.neck).x+s2*.006*e,
    getRest(c,b.neck).y+s*.040*e,
    getRest(c,b.neck).z,
    .12
  );
  smoothBoneTo(
    b.head,
    getRest(c,b.head).x+s*.020*e,
    getRest(c,b.head).y+s*.085*e,
    getRest(c,b.head).z+s2*.018*e,
    .12
  );
  if(c.model){
    c.model.position.y=THREE.MathUtils.lerp(c.model.position.y,Math.abs(s)*.008*e,.12);
  }
  animateNpcPersonality(c,b,true);
  animateSecurityFingers(c,true);
  animateSecurityHeadSpeech(c,true);
}
function loadCharacter(c){
  loader.load(
    c.file,
    (gltf)=>{
      const model=gltf.scene;
      c.model=model;
      c.setModel(model);
      c.model?.traverse?.(obj=>{
        if(!obj?.isMesh) return;
        obj.castShadow=false;
        obj.receiveShadow=true;
      });
      c.model.scale.multiplyScalar(1.15);
      c.model.updateMatrixWorld(true);

      const characterConfig=
        CHARACTER_CONFIGS?.[c.name] || null;

      const configuredY=
        characterConfig?.position?.y;

      if(Number.isFinite(configuredY)){
        c.root.position.y=configuredY;
        c.root.updateMatrixWorld(true);
      }

      keepCharacterAboveFloor(c,.035);
      if(c.name==="player"){
        PLAYER_CYLINDER_COLLIDER.ready=false;
      }
      if(c.name==="toxicMan"){
        c.toxicFixedRotationY=undefined;
        c.root.position.set(
      0,
      0,
      0
    );
        c.root.rotation.y=THREE.MathUtils.degToRad(0);
        c.root.visible=false;
      }
      if(c.name==="child"){
        c.root.position.copy(CASINO_CHILD_INITIAL.position);
        c.root.rotation.copy(CASINO_CHILD_INITIAL.rotation);
        c.root.scale.setScalar(CASINO_CHILD_INITIAL.scale);
        c.root.updateMatrixWorld(true);
      }
      if(c.name==="boyListeningMusic"){
        c.root.position.set(
          SCENE_ENV_CONFIG.leftRoomCenterX-7.0,
          0,
          -20.8
        );
      }
      if(c.name==="securityMan"){
        c.model.rotation.y=0;

        const configuredSecurityPosition=
          CHARACTER_CONFIGS?.securityMan?.position;

        if(Number.isFinite(configuredSecurityPosition?.y)){
          c.root.position.y=configuredSecurityPosition.y;
        }

        const configuredRotationY=
          CHARACTER_CONFIGS?.securityMan?.rotationY;

        if(Number.isFinite(configuredRotationY)){
          c.root.rotation.y=configuredRotationY;
        }

        c.__securityModelBaseY=c.model.position.y;

        c.root.updateMatrixWorld(true);
      }
      if(c.name==="player"){
        PLAYER_PROCEDURAL_STATE.delete(c);
        createPlayerProceduralState(c);
        applyPlayerOutfitPreset();
        if(typeof EVENT_GIRL!=="undefined"){
          EVENT_GIRL.heightMatched=false;
          syncGirlHeightToPlayer();
        }
      }
      window[c.name]=c;

    }
  );
}
let casinoPokerTable=null;

loader.load("./assets/models/pokerTable.glb",(gltf)=>{
  const poker=gltf.scene;
  poker.name="casino_poker_table";
  poker.position.set(-23.900,-2.500,-28.700);
  poker.rotation.set(0,0,0);
  poker.scale.set(2.6761,2.6761,2.6761);
  scene.add(poker);
  casinoPokerTable=poker;
  registerCasinoEditable("pokerTable",poker);
});
function prepareCasinoEditableModel(model){
  cloneMaterials(model);
  model.traverse(o=>{
    if(o.isMesh){
      o.castShadow=false;
      o.receiveShadow=true;
      o.frustumCulled=true;
    }
  });
}

function createCasinoTvProgramTexture(mode=0){
  const canvas=document.createElement("canvas");
  canvas.width=1024;
  canvas.height=512;
  const ctx=canvas.getContext("2d");

  const drawCoin=(x,y,r,label="BET")=>{
    const g=ctx.createRadialGradient(
      x-r*.35,y-r*.35,r*.15,
      x,y,r
    );
    g.addColorStop(0,"#fff2a9");
    g.addColorStop(.42,"#ffc84c");
    g.addColorStop(1,"#b87412");

    ctx.save();
    ctx.shadowColor="rgba(255,190,54,.32)";
    ctx.shadowBlur=14;
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(255,248,207,.76)";
    ctx.lineWidth=Math.max(2,r*.10);
    ctx.beginPath();
    ctx.arc(x,y,r*.78,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="#6d4308";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font=`bold ${Math.max(11,r*.42)}px Arial`;
    ctx.fillText(label,x,y+1);
    ctx.restore();
  };

  ctx.fillStyle=mode===0 ? "#07101f" : "#100b1c";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const topGrad=ctx.createLinearGradient(0,0,1024,0);
  topGrad.addColorStop(0,mode===0?"rgba(23,211,107,.18)":"rgba(255,184,77,.18)");
  topGrad.addColorStop(1,"rgba(90,169,255,.04)");
  ctx.fillStyle=topGrad;
  ctx.fillRect(0,0,1024,150);

  if(mode===0){
    ctx.fillStyle="#17d36b";
    ctx.font="bold 54px Arial";
    ctx.fillText("LIVE BETTING",55,80);

    ctx.fillStyle="#dbe8ff";
    ctx.font="bold 34px Arial";
    ctx.fillText("CASINO SPORTS BOARD",55,135);

    ctx.fillStyle="#5aa9ff";
    ctx.font="bold 18px Arial";
    ctx.fillText("PROGRAM 01",860,68);

    drawCoin(935,118,28,"LIVE");
    drawCoin(885,102,17,"$");

    const rows=[
      ["RACING 01","2.10","3.40","1.82"],
      ["MATCH 12","1.65","2.75","4.20"],
      ["TABLE 07","2.40","2.05","3.10"],
      ["LIVE 88","1.92","3.05","2.55"]
    ];

    ctx.font="28px Arial";
    rows.forEach((r,i)=>{
      const y=205+i*68;
      ctx.fillStyle=i%2?"#0b1930":"#0d213d";
      ctx.fillRect(45,y-38,930,54);
      ctx.fillStyle="#ffffff";
      ctx.fillText(r[0],65,y);
      ctx.fillStyle="#ffd76a";
      ctx.fillText(r[1],520,y);
      ctx.fillText(r[2],680,y);
      ctx.fillText(r[3],840,y);
    });

    ctx.fillStyle="#7891b5";
    ctx.font="22px Arial";
    ctx.fillText("ODDS UPDATE • DEMO FEED",55,485);
  }else{
    ctx.fillStyle="#ffb84d";
    ctx.font="bold 50px Arial";
    ctx.fillText("NEXT BETTING MARKETS",55,78);

    ctx.fillStyle="#e8ddff";
    ctx.font="bold 31px Arial";
    ctx.fillText("TODAY'S FEATURED EVENTS",55,130);

    ctx.fillStyle="#d7a2ff";
    ctx.font="bold 18px Arial";
    ctx.fillText("PROGRAM 02",860,68);

    drawCoin(920,112,32,"BET");
    drawCoin(862,96,20,"$");
    drawCoin(958,157,16,"$");

    const rows=[
      ["FOOTBALL","CITY vs UNITED","1.85","3.25","4.10"],
      ["TENNIS","QUARTER FINAL","1.62","2.30","—"],
      ["RACING","GRAND CUP · R5","2.75","4.20","6.40"],
      ["BASKETBALL","NORTH vs SOUTH","1.74","2.05","—"]
    ];

    ctx.font="25px Arial";
    rows.forEach((r,i)=>{
      const y=198+i*68;
      ctx.fillStyle=i%2?"#211633":"#291b3e";
      ctx.fillRect(45,y-36,930,54);
      ctx.fillStyle="#f4efff";
      ctx.fillText(r[0],65,y);
      ctx.fillStyle="#d6c7ff";
      ctx.fillText(r[1],250,y);
      ctx.fillStyle="#88e5b0";
      ctx.fillText(r[2],675,y);
      ctx.fillStyle="#ffd37a";
      ctx.fillText(r[3],800,y);
      ctx.fillStyle="#9ec5ff";
      ctx.fillText(r[4],910,y);
    });

    ctx.fillStyle="#9d8db9";
    ctx.font="21px Arial";
    ctx.fillText("PRE-MATCH ODDS • PROGRAM 02",55,485);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.generateMipmaps=false;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;

  return {canvas,ctx,texture};
}

function attachTvScreen(){
  const tv=CASINO_MEDIA_RUNTIME.tv;
  if(!tv) return;

  const p0=createCasinoTvProgramTexture(0);
  const p1=createCasinoTvProgramTexture(1);

  CASINO_MEDIA_RUNTIME.tvCanvas=p0.canvas;
  CASINO_MEDIA_RUNTIME.tvCtx=p0.ctx;
  CASINO_MEDIA_RUNTIME.tvTexture=p0.texture;
  CASINO_MEDIA_RUNTIME.tvTextureAlt=p1.texture;

  const box=new THREE.Box3().setFromObject(tv);
  const size=box.getSize(new THREE.Vector3());

  const makeScreen=(texture,name)=>{
    const screen=new THREE.Mesh(
      new THREE.PlaneGeometry(
        Math.max(.8,size.x*.72),
        Math.max(.45,size.y*.52)
      ),
      new THREE.MeshBasicMaterial({
        map:texture,
        toneMapped:false,
        transparent:false,
        depthWrite:true
      })
    );

    screen.name=name;
    screen.frustumCulled=false;

    const st=CASINO_MEDIA_RUNTIME.bettingOverlay;
    screen.position.copy(st.pos);
    screen.rotation.copy(st.rot);
    screen.scale.copy(st.scale);

    if(Math.abs(st.pos.z)<.0001){
      st.pos.z=Math.max(.02,size.z*.51);
      screen.position.z=st.pos.z;
    }

    return screen;
  };

  const screen0=makeScreen(
    p0.texture,
    "casino_tv_program_01"
  );
  const screen1=makeScreen(
    p1.texture,
    "casino_tv_program_02"
  );

  const bezelGroup=new THREE.Group();
  bezelGroup.name="casino_tv_betting_bezel";

  screen0.geometry.computeBoundingBox();
  const sb=screen0.geometry.boundingBox;
  const sw=sb.max.x-sb.min.x;
  const sh=sb.max.y-sb.min.y;
  const border=.08*Math.max(sw,sh);

  const bezelMat=new THREE.MeshBasicMaterial({
    color:0x050505,
    toneMapped:false
  });

  const mkBar=(w,h,x,y)=>{
    const m=new THREE.Mesh(
      new THREE.PlaneGeometry(w,h),
      bezelMat
    );
    m.position.set(x,y,-.006);
    bezelGroup.add(m);
  };

  mkBar(sw+border*2,border,0, sh*.5+border*.5);
  mkBar(sw+border*2,border,0,-sh*.5-border*.5);
  mkBar(border,sh,-sw*.5-border*.5,0);
  mkBar(border,sh, sw*.5+border*.5,0);

  screen0.add(bezelGroup);

  CASINO_MEDIA_RUNTIME.tvScreen=screen0;
  CASINO_MEDIA_RUNTIME.tvScreenAlt=screen1;
  CASINO_MEDIA_RUNTIME.tvStartedAt=performance.now();
  CASINO_MEDIA_RUNTIME.tvProgramIndex=-1;

  buildCasinoBettingSheet();
}

const JUKEBOX_AUDIO_RUNTIME={
  tracks:[
    {
      id:"epic-ballad",
      title:"Epic Ballad",
      file:"./audio/Epic Ballad.mp3",
      duration:"4:30"
    },
    {
      id:"metal-drum",
      title:"Metal Drum",
      file:"./audio/Metal  Drum.mp3",
      duration:"4:55"
    }
  ],
  audio:null,
  currentTrack:null,
  menuOpen:false,
  playToken:0,
  loadingTrackId:null,
  maxVolume:.72,
  nearDistance:3.0,
  farDistance:18.0,
  prompt:null,
  panel:null,
  status:null
};
function ensureJukeboxAudioElement(){
  if(JUKEBOX_AUDIO_RUNTIME.audio) return JUKEBOX_AUDIO_RUNTIME.audio;

  const audio=new Audio();
  audio.preload="auto";
  audio.loop=true;
  audio.volume=0;

  audio.addEventListener("error",()=>{
    const err=audio.error;

    if(!err){
      updateJukeboxMenuStatus("AUDIO UNAVAILABLE");
      return;
    }

    if(err.code===MediaError.MEDIA_ERR_ABORTED){
      return;
    }

    updateJukeboxMenuStatus("AUDIO FILE COULD NOT BE LOADED");
  });

  audio.addEventListener("playing",()=>{
    const t=JUKEBOX_AUDIO_RUNTIME.currentTrack;
    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(
      t ? `NOW PLAYING · ${t.title}` : "NOW PLAYING"
    );
  });

  audio.addEventListener("pause",()=>{
    if(!JUKEBOX_AUDIO_RUNTIME.menuOpen){
      const playing=
        JUKEBOX_AUDIO_RUNTIME.currentTrack &&
        !audio.paused;

      if(!playing) setJukeboxPower(false);
    }
  });

  JUKEBOX_AUDIO_RUNTIME.audio=audio;
  return audio;
}
function updateJukeboxMenuStatus(message){
  const status=JUKEBOX_AUDIO_RUNTIME.status;
  if(status) status.textContent=message||"CHOOSE A SONG";
}
function stopJukeboxMusic(keepLights=true){
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;

  JUKEBOX_AUDIO_RUNTIME.playToken++;
  JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;

  if(audio){
    audio.pause();
    try{
      audio.currentTime=0;
    }catch(_){}
  }

  JUKEBOX_AUDIO_RUNTIME.currentTrack=null;

  updateJukeboxMenuStatus("MUSIC STOPPED");

  if(!keepLights){
    setJukeboxPower(false);
  }

  refreshJukeboxTrackButtons();
}
async function playJukeboxTrack(trackId){
  const track=
    JUKEBOX_AUDIO_RUNTIME.tracks.find(t=>t.id===trackId);

  if(!track) return;

  const audio=ensureJukeboxAudioElement();

  if(
    JUKEBOX_AUDIO_RUNTIME.currentTrack?.id===track.id &&
    !audio.paused &&
    !audio.ended
  ){
    updateJukeboxMenuStatus(`NOW PLAYING · ${track.title}`);
    return;
  }

  const token=++JUKEBOX_AUDIO_RUNTIME.playToken;

  JUKEBOX_AUDIO_RUNTIME.loadingTrackId=track.id;
  JUKEBOX_AUDIO_RUNTIME.currentTrack=track;

  setJukeboxPower(true);
  updateJukeboxMenuStatus(`LOADING · ${track.title}`);

  const wantedSrc=new URL(track.file,location.href).href;
  const currentSrc=audio.currentSrc || audio.src || "";

  if(currentSrc!==wantedSrc){
    audio.pause();

    audio.src=track.file;
  }

  try{
    const playPromise=audio.play();

    if(playPromise && typeof playPromise.then==="function"){
      await playPromise;
    }

    if(token!==JUKEBOX_AUDIO_RUNTIME.playToken){
      return;
    }

    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(`NOW PLAYING · ${track.title}`);
  }catch(err){
    if(token!==JUKEBOX_AUDIO_RUNTIME.playToken){
      return;
    }

    const name=String(err?.name||"");

    if(
      name==="AbortError" ||
      name==="NotAllowedError" && document.visibilityState==="hidden"
    ){
      return;
    }

    console.error("Jukebox audio play error",err);

    JUKEBOX_AUDIO_RUNTIME.loadingTrackId=null;
    updateJukeboxMenuStatus(
      "AUDIO COULD NOT START · CLICK THE SONG AGAIN"
    );
  }

  refreshJukeboxTrackButtons();
}
function refreshJukeboxTrackButtons(){
  document.querySelectorAll("[data-jukebox-track]").forEach(btn=>{
    const active=
      JUKEBOX_AUDIO_RUNTIME.currentTrack?.id===btn.dataset.jukeboxTrack &&
      !JUKEBOX_AUDIO_RUNTIME.audio?.paused;
    btn.style.borderColor=active?"#e5be82":"rgba(180,135,85,.45)";
    btn.style.background=active?"#8a5d31":"#5b3d27";
    btn.style.boxShadow=active?"0 0 0 1px rgba(229,190,130,.35) inset":"none";
  });
}
function setJukeboxMenuOpen(open){
  JUKEBOX_AUDIO_RUNTIME.menuOpen=!!open;
  const panel=JUKEBOX_AUDIO_RUNTIME.panel;
  if(panel) panel.style.display=open?"block":"none";
  if(open){
    setJukeboxPower(true);
    refreshJukeboxTrackButtons();
    const current=JUKEBOX_AUDIO_RUNTIME.currentTrack;
    const audio=JUKEBOX_AUDIO_RUNTIME.audio;
    const playing=!!current && !!audio && !audio.paused;
    updateJukeboxMenuStatus(
      playing
        ? `NOW PLAYING · ${current.title}`
        : "CHOOSE A SONG"
    );
    return;
  }
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;
  const musicPlaying=
    !!JUKEBOX_AUDIO_RUNTIME.currentTrack &&
    !!audio &&
    !audio.paused;
  if(!musicPlaying){
    setJukeboxPower(false);
  }
}
function initJukeboxMusicMenu(){
  if(document.getElementById("jukeboxMusicMenu")) return;
  const prompt=uiNode("div",{
    id:"jukeboxWorldPrompt",
    text:"E · USE JUKEBOX",
    className:"interactionPromptUnified",
    style:"display:none"
  });
  prompt.classList.add("interactionPromptUnified");
  const panel=uiNode("div",{
    id:"jukeboxMusicMenu",
    style:"display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:13130;width:330px;padding:12px;border:1px solid #8f6946;border-radius:9px;background:#49311f;color:#fff4df;font:12px Arial;box-shadow:0 10px 26px rgba(0,0,0,.38)"
  });
  const header=uiNode("div",{
    style:"display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"
  });
  header.append(
    uiNode("div",{
      text:"JUKEBOX",
      style:"font:900 14px Arial;letter-spacing:.06em;color:#efc58d"
    }),
    uiNode("button",{
      id:"jukeboxMenuClose",
      text:"×",
      style:"width:30px;height:30px;border-radius:7px;border:1px solid rgba(230,196,148,.32);background:#4e321f;color:#f6ddba;font:900 18px Arial;cursor:pointer"
    })
  );
  const status=uiNode("div",{
    id:"jukeboxMenuStatus",
    text:"CHOOSE A SONG",
    style:"margin:7px 0 9px;padding:6px 8px;border-radius:5px;background:rgba(28,17,10,.26);color:#e8c99c;font:900 10px Arial;text-align:center"
  });
  const list=uiNode("div",{
    style:"display:grid;gap:8px"
  });
  JUKEBOX_AUDIO_RUNTIME.tracks.forEach((track,index)=>{
    const btn=uiNode("button",{
      attrs:{"data-jukebox-track":track.id},
      style:"display:grid;grid-template-columns:28px 1fr auto;gap:7px;align-items:center;width:100%;padding:8px;border:1px solid rgba(180,135,85,.34);border-radius:6px;background:#583b26;color:#fff0da;text-align:left;cursor:pointer"
    });
    btn.append(
      uiNode("span",{
        text:String(index+1).padStart(2,"0"),
        style:"font:900 13px monospace;color:#e2b873"
      }),
      uiNode("span",{
        text:track.title,
        style:"font:900 12px Arial;letter-spacing:.04em"
      }),
      uiNode("span",{
        text:track.duration,
        style:"font:10px monospace;color:#c9ab82"
      })
    );
    btn.onclick=()=>playJukeboxTrack(track.id);
    list.append(btn);
  });
  const actions=uiNode("div",{
    style:"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"
  });
  const stop=uiNode("button",{
    text:"STOP MUSIC",
    style:"padding:9px;border:1px solid rgba(220,178,119,.38);border-radius:8px;background:#563820;color:#f6dfbd;font-weight:900;cursor:pointer"
  });
  const off=uiNode("button",{
    text:"TURN OFF",
    style:"padding:9px;border:1px solid rgba(220,178,119,.38);border-radius:8px;background:#352419;color:#f6dfbd;font-weight:900;cursor:pointer"
  });
  stop.onclick=()=>stopJukeboxMusic(true);
  off.onclick=()=>{
    stopJukeboxMusic(false);
    setJukeboxMenuOpen(false);
  };
  actions.append(stop,off);
  panel.append(
    header,
    uiNode("div",{
      text:"CHOOSE A SONG",
      style:"color:#cda46f;font:900 10px Arial;letter-spacing:.13em;margin-bottom:7px"
    }),
    status,
    list,
    actions,
  );
  document.body.append(prompt,panel);
  document.getElementById("jukeboxMenuClose").onclick=()=>{
    setJukeboxMenuOpen(false);
  };
  panel.addEventListener("pointerdown",e=>e.stopPropagation());
  panel.addEventListener("click",e=>e.stopPropagation());
  JUKEBOX_AUDIO_RUNTIME.prompt=prompt;
  JUKEBOX_AUDIO_RUNTIME.panel=panel;
  JUKEBOX_AUDIO_RUNTIME.status=status;
}
function updateJukeboxInteraction(){
  if(!JUKEBOX_AUDIO_RUNTIME.prompt) return;
  const near=casinoJukeboxNear();
  JUKEBOX_AUDIO_RUNTIME.prompt.style.display=
    near && !JUKEBOX_AUDIO_RUNTIME.menuOpen
      ? "block"
      : "none";
  if(!near && JUKEBOX_AUDIO_RUNTIME.menuOpen){
    setJukeboxMenuOpen(false);
  }
  const audio=JUKEBOX_AUDIO_RUNTIME.audio;
  if(!audio || audio.paused || !player?.root || !CASINO_MEDIA_RUNTIME.jukebox){
    return;
  }
  const a=new THREE.Vector3();
  const b=new THREE.Vector3();
  CASINO_MEDIA_RUNTIME.jukebox.getWorldPosition(a);
  player.root.getWorldPosition(b);
  const dist=a.distanceTo(b);
  const rt=JUKEBOX_AUDIO_RUNTIME;
  let volume=0;
  if(dist<=rt.nearDistance){
    volume=rt.maxVolume;
  }else if(dist<rt.farDistance){
    const t=(dist-rt.nearDistance)/(rt.farDistance-rt.nearDistance);
    volume=rt.maxVolume*(1-THREE.MathUtils.smoothstep(t,0,1));
  }
  audio.volume=THREE.MathUtils.clamp(volume,0,1);
}


function casinoJukeboxNear(){
  if(!CASINO_MEDIA_RUNTIME.jukebox || !player?.root || activeWorldZone!=="leftRoom") return false;
  const a=new THREE.Vector3(), b=new THREE.Vector3();
  CASINO_MEDIA_RUNTIME.jukebox.getWorldPosition(a);
  player.root.getWorldPosition(b);
  return a.distanceTo(b)<=3.2;
}
addEventListener("keydown",e=>{
  if(
    e.code!=="KeyE" ||
    e.repeat ||
    QUEST.dialogueActive ||
    GLOBAL_DIALOGUE_LOCK.active
  ) return;
  if(casinoJukeboxNear()){
    e.preventDefault();
    e.stopPropagation();
    setJukeboxMenuOpen(!JUKEBOX_AUDIO_RUNTIME.menuOpen);
  }
},true);
function setJukeboxPower(on){
  CASINO_MEDIA_RUNTIME.jukeboxOn=!!on;
  const palette=[0xff356d,0x38e8ff,0xffd23f,0xb96cff];
  CASINO_MEDIA_RUNTIME.jukeboxLightMaterials.forEach((mat,i)=>{
    mat.emissive.setHex(on?palette[i%palette.length]:0x000000);
    mat.emissiveIntensity=on?2.1:0;
    mat.needsUpdate=true;
  });
  const btn=document.getElementById("jukeboxPowerButton");
  if(btn) btn.textContent=`JUKEBOX ${on?"ON":"OFF"} · CLICK TO TOGGLE`;
}

setTimeout(()=>rebuildCasinoEditableColliders?.(),1600);
setTimeout(()=>rebuildCasinoEditableColliders?.(),1200);
initJukeboxMusicMenu();
let casinoReception=null;


function createCasinoBoyController(ctx,CASINO_BOY){
  const THREE=ctx.THREE;

  const normalizeAngle=(angle)=>{
    return Math.atan2(Math.sin(angle),Math.cos(angle));
  };
  const fitToPlayerHeight=(model)=>{
    const THREE=ctx.THREE;
    if(!model) return false;
    model.updateMatrixWorld(true);
    const sourceBox=new THREE.Box3().setFromObject(model);
    const sourceH=sourceBox.getSize(new THREE.Vector3()).y;
    if(!Number.isFinite(sourceH) || sourceH<=.001) return false;

    let targetH=2.05;
    if(ctx.player?.model && ctx.player?.ready){
      ctx.player.model.updateMatrixWorld(true);
      const pb=new THREE.Box3().setFromObject(ctx.player.model);
      const ph=pb.getSize(new THREE.Vector3()).y;
      if(Number.isFinite(ph) && ph>.001){
        targetH=ph;
      }
    }

    model.scale.multiplyScalar(targetH/sourceH);
    model.updateMatrixWorld(true);
    return true;
  };
const CASINO_BOY_STANDARD_POSE={
  spine2:[0,0,0],

  leftShoulder:[0,0,0],
  leftArm:[38,0,-6],
  leftForeArm:[0,0,-4],
  leftHand:[0,0,0],

  rightShoulder:[0,0,0],
  rightArm:[35,0,6],
  rightForeArm:[0,0,4],
  rightHand:[0,0,0],

  leftUpLeg:[0,0,0],
  rightUpLeg:[0,0,0],

  leftKnee:[0,0,0],
  rightKnee:[0,0,0],

  leftFoot:[0,0,0],
  rightFoot:[0,0,0],

  leftToe:[0,0,0],
  rightToe:[0,0,0],

  neck:[0,0,0],
  head:[0,0,0]
};
const CASINO_BOY_GESTURE_POSE={
  spine2:[0,0,0],

  leftShoulder:[-7,0,0],
  leftArm:[17,0,-6],
  leftForeArm:[53,0,-4],
  leftHand:[-17,0,0],

  rightShoulder:[0,0,0],
  rightArm:[36,0,6],
  rightForeArm:[0,0,4],
  rightHand:[0,0,0],

  leftUpLeg:[0,0,0],
  rightUpLeg:[0,0,0],

  leftKnee:[0,0,0],
  rightKnee:[0,0,0],

  leftFoot:[0,0,0],
  rightFoot:[0,0,0],

  leftToe:[0,0,0],
  rightToe:[0,0,0],

  neck:[0,0,0],
  head:[0,0,0]
};
const CASINO_BOY_ANIM={
  cycleSeconds:4.4,
  poseLerp:.10,
  legLerp:.075,

  headX:1.45,
  headY:.70,
  torsoX:.50,
  torsoY:.38,

  legAmp:1.15,

  talkBodyTurnFactor:.22,
  talkBodyTurnMaxDeg:12
};
function casinoBoyFindBone(root,names){
  for(const name of names){
    const exact=root.getObjectByName(name);
    if(exact) return exact;
  }

  const norm=s=>String(s||"")
    .toLowerCase()
    .replace(/mixamorig/g,"")
    .replace(/[^a-z0-9]/g,"");

  const all=[];
  root.traverse(o=>{
    if(o?.isBone) all.push(o);
  });

  const wanted=names.map(norm);

  for(const w of wanted){
    const exact=all.find(b=>norm(b.name)===w);
    if(exact) return exact;
  }

  for(const w of wanted){
    const fuzzy=all.find(b=>{
      const n=norm(b.name);
      return n.includes(w) || n.endsWith(w);
    });
    if(fuzzy) return fuzzy;
  }

  return null;
}
function casinoBoyBuildRig(root){
  return {
    hips:casinoBoyFindBone(root,["mixamorig:Hips_01","mixamorig:Hips","Hips"]),

    spine:casinoBoyFindBone(root,["mixamorig:Spine_02","mixamorig:Spine","Spine"]),
    spine1:casinoBoyFindBone(root,["mixamorig:Spine1_03","mixamorig:Spine1","Spine1"]),
    spine2:casinoBoyFindBone(root,["mixamorig:Spine2_04","mixamorig:Spine2","Spine2"]),

    neck:casinoBoyFindBone(root,["mixamorig:Neck_05","mixamorig:Neck","Neck"]),
    head:casinoBoyFindBone(root,["mixamorig:Head_06","mixamorig:Head","Head"]),

    leftShoulder:casinoBoyFindBone(root,["mixamorig:LeftShoulder_08","mixamorig:LeftShoulder","LeftShoulder"]),
    leftArm:casinoBoyFindBone(root,["mixamorig:LeftArm_09","mixamorig:LeftArm","LeftArm"]),
    leftForeArm:casinoBoyFindBone(root,["mixamorig:LeftForeArm_010","mixamorig:LeftForeArm","LeftForeArm"]),
    leftHand:casinoBoyFindBone(root,["mixamorig:LeftHand_011","mixamorig:LeftHand","LeftHand"]),

    rightShoulder:casinoBoyFindBone(root,["mixamorig:RightShoulder_032","mixamorig:RightShoulder","RightShoulder"]),
    rightArm:casinoBoyFindBone(root,["mixamorig:RightArm_033","mixamorig:RightArm","RightArm"]),
    rightForeArm:casinoBoyFindBone(root,["mixamorig:RightForeArm_034","mixamorig:RightForeArm","RightForeArm"]),
    rightHand:casinoBoyFindBone(root,["mixamorig:RightHand_035","mixamorig:RightHand","RightHand"]),

    leftUpLeg:casinoBoyFindBone(root,["mixamorig:LeftUpLeg_055","mixamorig:LeftUpLeg","LeftUpLeg"]),
    leftKnee:casinoBoyFindBone(root,["mixamorig:LeftLeg_056","mixamorig:LeftLeg","LeftLeg"]),
    leftFoot:casinoBoyFindBone(root,["mixamorig:LeftFoot_057","mixamorig:LeftFoot","LeftFoot"]),

    rightUpLeg:casinoBoyFindBone(root,["mixamorig:RightUpLeg_060","mixamorig:RightUpLeg","RightUpLeg"]),
    rightKnee:casinoBoyFindBone(root,["mixamorig:RightLeg_061","mixamorig:RightLeg","RightLeg"]),
    rightFoot:casinoBoyFindBone(root,["mixamorig:RightFoot_062","mixamorig:RightFoot","RightFoot"])
  };
}
function casinoBoyCaptureRest(){
  CASINO_BOY.rest.clear();

  for(const bone of Object.values(CASINO_BOY.bones)){
    if(bone?.isBone){
      CASINO_BOY.rest.set(bone,bone.quaternion.clone());
    }
  }
}
function loadCasinoBoy(){
  ctx.loadGLBFromCandidates(
    ["./assets/models/boy.glb"],
    (gltf,path)=>{
      const boy=gltf.scene;
      boy.name="casino_boy_gambler";

      ctx.cloneMaterials?.(boy);
      boy.scale.set(1,1,1);
      ctx.centerModelXZ?.(boy);
      fitToPlayerHeight(boy);
      ctx.putModelOnFloor?.(boy,0);

      boy.scale.copy(CASINO_BOY.scale);
      boy.position.copy(CASINO_BOY.position);
      boy.rotation.copy(CASINO_BOY.rotation);

      boy.visible=true;
      ctx.scene.add(boy);

      CASINO_BOY.root=boy;
      CASINO_BOY.bones=casinoBoyBuildRig(boy);
      casinoBoyCaptureRest();

      ctx.registerCasinoEditable?.("casinoBoy",boy);
      ctx.onLoaded?.(boy);

      CASINO_BOY.talking=false;
    },
    err=>console.error("boy.glb load error",err)
  );
}
function casinoBoySmooth01(t){
  t=THREE.MathUtils.clamp(t,0,1);
  return t*t*(3-2*t);
}
function casinoBoyLerpVec(a,b,t){
  return [
    THREE.MathUtils.lerp(a?.[0]||0,b?.[0]||0,t),
    THREE.MathUtils.lerp(a?.[1]||0,b?.[1]||0,t),
    THREE.MathUtils.lerp(a?.[2]||0,b?.[2]||0,t)
  ];
}
function casinoBoyTargetQuaternion(bone,deg){
  const rest=CASINO_BOY.rest.get(bone);
  if(!bone || !rest) return null;

  return rest.clone().multiply(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(deg?.[0]||0),
        THREE.MathUtils.degToRad(deg?.[1]||0),
        THREE.MathUtils.degToRad(deg?.[2]||0),
        "XYZ"
      )
    )
  );
}
function casinoBoySetBone(bone,deg,k){
  if(!bone) return;

  const target=casinoBoyTargetQuaternion(bone,deg);
  if(!target) return;

  bone.quaternion.slerp(target,k);
}
function casinoBoyApplyUpperPose(pose,extra=null,k=CASINO_BOY_ANIM.poseLerp){
  const b=CASINO_BOY.bones;

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const p=pose?.[key]||[0,0,0];
    const e=extra?.[key]||[0,0,0];

    casinoBoySetBone(
      b[key],
      [
        (p[0]||0)+(e[0]||0),
        (p[1]||0)+(e[1]||0),
        (p[2]||0)+(e[2]||0)
      ],
      k
    );
  }
}
function casinoBoyLookAtPlayerWithHeadOnly(now){
  const root=CASINO_BOY.root;
  const b=CASINO_BOY.bones;

  if(!root || !player?.root) return;

  const boyPos=new THREE.Vector3();
  const playerPos=new THREE.Vector3();

  root.getWorldPosition(boyPos);
  player.root.getWorldPosition(playerPos);

  const worldYaw=Math.atan2(
    playerPos.x-boyPos.x,
    playerPos.z-boyPos.z
  );

  const baseYaw=CASINO_BOY.rotation.y;
  const localYaw=normalizeAngle(worldYaw-baseYaw);
  const localDeg=THREE.MathUtils.radToDeg(localYaw);

  const bodyTurnDeg=THREE.MathUtils.clamp(
    localDeg*CASINO_BOY_ANIM.talkBodyTurnFactor,
    -CASINO_BOY_ANIM.talkBodyTurnMaxDeg,
    CASINO_BOY_ANIM.talkBodyTurnMaxDeg
  );

  const targetRootYaw=
    baseYaw +
    THREE.MathUtils.degToRad(bodyTurnDeg);

  root.rotation.y +=
    normalizeAngle(
      targetRootYaw-root.rotation.y
    )*.075;

  const remainingDeg=localDeg-bodyTurnDeg;

  const neckYaw=THREE.MathUtils.clamp(
    remainingDeg*.35,
    -24,
    24
  );

  const headYaw=THREE.MathUtils.clamp(
    remainingDeg*.62,
    -40,
    40
  );

  const nod=Math.sin(now*2.0)*.8;

  casinoBoySetBone(
    b.neck,
    [nod*.42,neckYaw,0],
    .10
  );

  casinoBoySetBone(
    b.head,
    [nod,headYaw,0],
    .11
  );
}
function casinoBoyAnimateFingers(now,blend){
  const b=CASINO_BOY.bones;
  const pulse=(Math.sin(now*1.15)+1)*.5;

  const leftCurl=.08 + pulse*.05 + blend*.03;
  const rightCurl=.07 + (1-pulse)*.04 + blend*.025;

  const fingerGroups=[
    ["left",leftCurl],
    ["right",rightCurl]
  ];

  for(const [side,curl] of fingerGroups){
    for(const name of [
      `${side}Index1`,`${side}Index2`,`${side}Index3`,
      `${side}Middle1`,`${side}Middle2`,`${side}Middle3`,
      `${side}Ring1`,`${side}Ring2`,`${side}Ring3`,
      `${side}Pinky1`,`${side}Pinky2`,`${side}Pinky3`
    ]){
      const bone=b[name];
      if(!bone) continue;
      const rest=ctx.getRest(CASINO_BOY,bone);
      smoothBoneTo(
        bone,
        rest.x+curl,
        rest.y,
        rest.z,
        .045
      );
    }
  }
}
function updateCasinoBoyProcedural(dt){
  const root=CASINO_BOY.root;
  if(!root) return;

  root.position.copy(CASINO_BOY.position);
  root.scale.copy(CASINO_BOY.scale);

  const now=performance.now()*.001;

  const talking=
    ctx.QUEST?.dialogueActive &&
    ctx.QUEST?.dialogueSpeaker==="BOY";

  if(!talking){
    root.rotation.x=THREE.MathUtils.lerp(
      root.rotation.x,
      CASINO_BOY.rotation.x,
      .10
    );
    root.rotation.y +=
      normalizeAngle(
        CASINO_BOY.rotation.y-root.rotation.y
      )*.10;
    root.rotation.z=THREE.MathUtils.lerp(
      root.rotation.z,
      CASINO_BOY.rotation.z,
      .10
    );
  }

  CASINO_BOY.talking=talking;

  if(!talking){

    const cycleSeconds=13.2;
    const u=((now%cycleSeconds)+cycleSeconds)%cycleSeconds/cycleSeconds;

    let blend;

    if(u<.31){
      blend=0;
    }else if(u<.46){
      blend=casinoBoySmooth01((u-.31)/.15);
    }else if(u<.78){
      blend=1;
    }else if(u<.93){
      blend=1-casinoBoySmooth01((u-.78)/.15);
    }else{
      blend=0;
    }

    const pose={};

    for(const key of [
      "spine2",
      "leftShoulder","leftArm","leftForeArm","leftHand",
      "rightShoulder","rightArm","rightForeArm","rightHand",
      "leftUpLeg","rightUpLeg",
      "leftKnee","rightKnee",
      "leftFoot","rightFoot",
      "leftToe","rightToe",
      "neck","head"
    ]){
      pose[key]=casinoBoyLerpVec(
        CASINO_BOY_STANDARD_POSE[key],
        CASINO_BOY_GESTURE_POSE[key],
        blend
      );
    }

    const a=Math.sin(now*1.55);
    const c=Math.sin(now*1.10+.65);
    const breath=Math.sin(now*.72);
    const micro=Math.sin(now*1.85+.35);
    const micro2=Math.sin(now*1.35+1.1);

    casinoBoyApplyUpperPose(
      pose,
      {
        spine2:[
          a*CASINO_BOY_ANIM.torsoX + breath*.55,
          c*CASINO_BOY_ANIM.torsoY + micro*.28,
          breath*.20
        ],
        neck:[
          a*.55 + breath*.18,
          c*.24,
          micro2*.16
        ],
        head:[
          a*CASINO_BOY_ANIM.headX + micro*.55,
          c*CASINO_BOY_ANIM.headY + micro2*.42,
          micro*.20
        ],
        leftShoulder:[
          breath*.28,
          0,
          micro*.34
        ],
        rightShoulder:[
          -breath*.24,
          0,
          -micro*.28
        ],
        leftHand:[
          micro*.38,
          micro2*.22,
          breath*.18
        ],
        rightHand:[
          -micro*.32,
          -micro2*.18,
          -breath*.15
        ]
      }
    );

    const transitionAmount=
      blend>0 && blend<1
        ? Math.sin(blend*Math.PI)
        : 0;

    const stepWave=Math.sin(now*2.2);
    const stepWaveOpp=Math.sin(now*2.2+Math.PI);

    const leftLift=Math.max(0,stepWave)*transitionAmount;
    const rightLift=Math.max(0,stepWaveOpp)*transitionAmount;

    casinoBoySetBone(
      CASINO_BOY.bones.leftUpLeg,
      [leftLift*1.8,0,leftLift*.35],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightUpLeg,
      [rightLift*1.5,0,-rightLift*.28],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftKnee,
      [leftLift*2.2,0,0],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightKnee,
      [rightLift*1.9,0,0],
      .075
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftFoot,
      [-leftLift*.55,0,0],
      .07
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightFoot,
      [-rightLift*.48,0,0],
      .07
    );

    casinoBoySetBone(
      CASINO_BOY.bones.leftToe,
      [leftLift*.22,0,0],
      .065
    );

    casinoBoySetBone(
      CASINO_BOY.bones.rightToe,
      [rightLift*.20,0,0],
      .065
    );

    casinoBoyAnimateFingers(now,blend);
  }else{

    casinoBoyApplyUpperPose(
      CASINO_BOY_STANDARD_POSE,
      null,
      .11
    );

    casinoBoySetBone(CASINO_BOY.bones.leftUpLeg,CASINO_BOY_STANDARD_POSE.leftUpLeg,.09);
    casinoBoySetBone(CASINO_BOY.bones.rightUpLeg,CASINO_BOY_STANDARD_POSE.rightUpLeg,.09);
    casinoBoySetBone(CASINO_BOY.bones.leftKnee,CASINO_BOY_STANDARD_POSE.leftKnee,.09);
    casinoBoySetBone(CASINO_BOY.bones.rightKnee,CASINO_BOY_STANDARD_POSE.rightKnee,.09);
    casinoBoySetBone(CASINO_BOY.bones.leftFoot,CASINO_BOY_STANDARD_POSE.leftFoot,.09);
    casinoBoySetBone(CASINO_BOY.bones.rightFoot,CASINO_BOY_STANDARD_POSE.rightFoot,.09);
    casinoBoySetBone(CASINO_BOY.bones.leftToe,CASINO_BOY_STANDARD_POSE.leftToe,.09);
    casinoBoySetBone(CASINO_BOY.bones.rightToe,CASINO_BOY_STANDARD_POSE.rightToe,.09);

    casinoBoyAnimateFingers(now,0);

    casinoBoyLookAtPlayerWithHeadOnly(now);
  }

  root.updateMatrixWorld(true);
}
  return {
    load:loadCasinoBoy,
    update:updateCasinoBoyProcedural
  };
}


function createCasinoReceptionistController(ctx){
  const THREE=ctx.THREE;
  let casinoWoman=null;

  const look={
    head:null,neck:null,spine:null,spine2:null,hips:null,
    rightArm:null,rightForeArm:null,rightHand:null,
    leftArm:null,leftForeArm:null,leftHand:null,
    ready:false,rest:new Map(),wasTalking:false,talkStart:0,
    welcomeActive:false,welcomeStart:0,
    baseYaw:THREE.MathUtils.degToRad(116)
  };

  const approvedPose={
    leftShoulder:[0,0,0],
    leftArm:[65,60,7],
    leftForeArm:[28,-23,31],
    leftHand:[0,0,0],
    rightShoulder:[0,0,0],
    rightArm:[81,20,9],
    rightForeArm:[0,0,0],
    rightHand:[0,0,0]
  };

  const poseState={
    rest:new WeakMap(),
    talkStart:0,
    wasTalking:false,
    baseYaw:null,
    manualYawOffset:0,
    postTalkLatched:false
  };

  const poseRest=(b)=>{
    if(!b) return {x:0,y:0,z:0};
    if(!poseState.rest.has(b)){
      poseState.rest.set(b,b.rotation.clone());
    }
    return poseState.rest.get(b);
  };

  const poseBone=(bone,deg,k=.06)=>{
    if(!bone) return;
    const r=poseRest(bone);
    bone.rotation.x=THREE.MathUtils.lerp(
      bone.rotation.x,
      r.x+THREE.MathUtils.degToRad(deg?.[0]||0),
      k
    );
    bone.rotation.y=THREE.MathUtils.lerp(
      bone.rotation.y,
      r.y+THREE.MathUtils.degToRad(deg?.[1]||0),
      k
    );
    bone.rotation.z=THREE.MathUtils.lerp(
      bone.rotation.z,
      r.z+THREE.MathUtils.degToRad(deg?.[2]||0),
      k
    );
  };

  const mirroredPose=()=>({
    leftShoulder:[31,0,0],
    leftArm:[74,-20,0],
    leftForeArm:[7,0,0],
    leftHand:[0,0,0],
    rightShoulder:[0,0,0],
    rightArm:[74,-20,0],
    rightForeArm:[7,0,0],
    rightHand:[0,0,0]
  });

  const findBones=()=>{
    if(!casinoWoman) return false;
    const clean=n=>String(n||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    const all=[];
    casinoWoman.traverse(o=>{ if(o.isBone) all.push(o); });
    const find=(tokens)=>{
      for(const token of tokens){
        const t=clean(token);
        const exact=all.find(b=>clean(b.name)===t);
        if(exact) return exact;
      }
      for(const token of tokens){
        const t=clean(token);
        const partial=all.find(b=>clean(b.name).includes(t));
        if(partial) return partial;
      }
      return null;
    };
    look.head=find(["head06","head"]);
    look.neck=find(["neck"]);
    look.spine=find(["spine02","spine"]);
    look.spine2=find(["spine2"]);
    look.hips=find(["hips"]);
    look.rightArm=find(["rightarm"]);
    look.rightForeArm=find(["rightforearm"]);
    look.rightHand=find(["righthand019","righthand"]);
    look.leftArm=find(["leftarm"]);
    look.leftForeArm=find(["leftforearm"]);
    look.leftHand=find(["lefthand011","lefthand"]);
    for(const k of [
      "head","neck","spine","spine2","hips",
      "rightArm","rightForeArm","rightHand",
      "leftArm","leftForeArm","leftHand"
    ]){
      const b=look[k];
      if(b && !look.rest.has(b)) look.rest.set(b,b.rotation.clone());
    }
    look.ready=!!(
      look.head &&
      look.rightArm &&
      look.rightForeArm &&
      look.rightHand
    );
    look.baseYaw=casinoWoman.rotation.y;
    return look.ready;
  };

  const setInitialPose=()=>{
    if(!casinoWoman) return false;
    if(!look.ready) findBones();
    if(!look.ready) return false;
    const setNow=(bone,deg)=>{
      if(!bone) return;
      const r=poseRest(bone);
      bone.rotation.set(
        r.x+THREE.MathUtils.degToRad(deg?.[0]||0),
        r.y+THREE.MathUtils.degToRad(deg?.[1]||0),
        r.z+THREE.MathUtils.degToRad(deg?.[2]||0)
      );
    };
    const p=approvedPose;
    setNow(look.leftArm,p.leftArm);
    setNow(look.leftForeArm,p.leftForeArm);
    setNow(look.leftHand,p.leftHand);
    setNow(look.rightArm,p.rightArm);
    setNow(look.rightForeArm,p.rightForeArm);
    setNow(look.rightHand,p.rightHand);
    if(look.spine2) setNow(look.spine2,[0,0,0]);
    if(look.neck) setNow(look.neck,[0,0,0]);
    if(look.head) setNow(look.head,[0,0,0]);
    if(poseState.baseYaw===null){
      poseState.baseYaw=casinoWoman.rotation.y;
    }
    casinoWoman.updateMatrixWorld(true);
    return true;
  };

  const fitToPlayerHeight=(model)=>{
    model.updateMatrixWorld(true);
    const sourceBox=new THREE.Box3().setFromObject(model);
    const sourceH=sourceBox.getSize(new THREE.Vector3()).y;
    if(!Number.isFinite(sourceH) || sourceH<=.001) return false;
    let targetH=2.05;
    if(ctx.player?.model && ctx.player?.ready){
      ctx.player.model.updateMatrixWorld(true);
      const pb=new THREE.Box3().setFromObject(ctx.player.model);
      const ph=pb.getSize(new THREE.Vector3()).y;
      if(Number.isFinite(ph) && ph>.001) targetH=ph;
    }
    model.scale.multiplyScalar(targetH/sourceH);
    model.updateMatrixWorld(true);
    return true;
  };

  const load=()=>{
    const cfg=CASINO_MODEL_CONFIG.receptionist;
    ctx.loadGLBFromCandidates(
      cfg.paths,
      (gltf)=>{
        const woman=gltf.scene;
        woman.name="casino_receptionist_girl";
        ctx.cloneMaterials?.(woman);
        woman.traverse(o=>{
          if(o.isMesh){
            o.castShadow=false;
            o.receiveShadow=true;
            o.frustumCulled=true;
          }
        });
        woman.scale.set(1,1,1);
        ctx.centerModelXZ?.(woman);
        fitToPlayerHeight(woman);
        ctx.putModelOnFloor?.(woman,0);
        woman.position.set(...cfg.position);
        woman.rotation.set(
          ctx.THREE.MathUtils.degToRad(cfg.rotation[0]),
          ctx.THREE.MathUtils.degToRad(cfg.rotation[1]),
          ctx.THREE.MathUtils.degToRad(cfg.rotation[2])
        );
        woman.scale.set(...cfg.scale);
        woman.updateMatrixWorld(true);
        woman.visible=false;
        ctx.scene.add(woman);
        casinoWoman=woman;
        ctx.registerCasinoEditable?.("casinoWoman",woman);

        const reveal=()=>{
          if(setInitialPose()){
            woman.visible=true;
            return true;
          }
          return false;
        };
        if(!reveal()){
          requestAnimationFrame(()=>{
            if(!reveal()){
              setTimeout(()=>{
                reveal();
                woman.visible=true;
              },60);
            }
          });
        }
        setTimeout(findBones,0);
        setTimeout(()=>{findBones();setInitialPose();},300);
        setTimeout(()=>{findBones();setInitialPose();},900);
        ctx.onLoaded?.(woman);
      },
      err=>console.error("receptionist.glb load error",err)
    );
  };

  const applyApprovedPose=(talking)=>{
    if(!casinoWoman || !look.ready) return;
    const now=performance.now();
    const t=now*.001;
    if(poseState.baseYaw===null){
      poseState.baseYaw=casinoWoman.rotation.y;
    }
    if(talking && !poseState.wasTalking){
      poseState.talkStart=now;
      poseState.postTalkLatched=true;
    }
    poseState.wasTalking=talking;
    const target=
      (talking || poseState.postTalkLatched)
        ? mirroredPose()
        : approvedPose;

    poseBone(look.leftArm,target.leftArm,talking?.055:.045);
    poseBone(look.leftForeArm,target.leftForeArm,talking?.055:.045);
    poseBone(look.leftHand,target.leftHand,talking?.06:.045);
    poseBone(look.rightArm,target.rightArm,talking?.055:.045);
    poseBone(look.rightForeArm,target.rightForeArm,talking?.055:.045);
    poseBone(look.rightHand,target.rightHand,talking?.06:.045);

    const bodyAmp=
      (talking || poseState.postTalkLatched)?.010:.004;
    const headAmp=
      (talking || poseState.postTalkLatched)?.045:.012;

    if(look.spine2){
      const r=poseRest(look.spine2);
      look.spine2.rotation.z=THREE.MathUtils.lerp(
        look.spine2.rotation.z,
        r.z+Math.sin(t*.85)*bodyAmp,
        .035
      );
    }
    if(look.neck){
      const r=poseRest(look.neck);
      look.neck.rotation.y=THREE.MathUtils.lerp(
        look.neck.rotation.y,
        r.y+Math.sin(t*.72)*headAmp*.45,
        .04
      );
    }
    if(look.head){
      const r=poseRest(look.head);
      look.head.rotation.y=THREE.MathUtils.lerp(
        look.head.rotation.y,
        r.y+Math.sin(t*.72+.35)*headAmp,
        .045
      );
      look.head.rotation.x=THREE.MathUtils.lerp(
        look.head.rotation.x,
        r.x+Math.sin(t*.48)*headAmp*.22,
        .04
      );
    }

    if(talking && ctx.player?.root){
      const wp=new THREE.Vector3();
      const pp=new THREE.Vector3();
      casinoWoman.getWorldPosition(wp);
      ctx.player.root.getWorldPosition(pp);
      const desired=
        Math.atan2(pp.x-wp.x,pp.z-wp.z)+
        poseState.manualYawOffset;

      casinoWoman.rotation.y=
        ctx.lerpAngle(
          casinoWoman.rotation.y,
          desired,
          .035
        );

      const local=casinoWoman.worldToLocal(pp.clone());
      const yaw=THREE.MathUtils.clamp(
        Math.atan2(local.x,local.z),
        -.42,
        .42
      );

      if(look.neck){
        const r=poseRest(look.neck);
        look.neck.rotation.y=THREE.MathUtils.lerp(
          look.neck.rotation.y,
          r.y+yaw*.22+Math.sin(t*.72)*headAmp*.35,
          .05
        );
      }
      if(look.head){
        const r=poseRest(look.head);
        look.head.rotation.y=THREE.MathUtils.lerp(
          look.head.rotation.y,
          r.y+yaw*.50+Math.sin(t*.72+.35)*headAmp,
          .055
        );
      }
    }else if(!poseState.postTalkLatched){
      casinoWoman.rotation.y=
        ctx.lerpAngle(
          casinoWoman.rotation.y,
          poseState.baseYaw+poseState.manualYawOffset,
          .012
        );
    }
  };

  const update=()=>{
    if(
      !casinoWoman ||
      !ctx.player?.root ||
      ctx.activeWorldZone!=="leftRoom"
    ) return;

    if(!look.ready) findBones();
    if(!look.head) return;

    const talking=
      ctx.QUEST.dialogueActive &&
      ctx.QUEST.dialogueSpeaker==="RECEPTIONIST";

    applyApprovedPose(talking);
  };

  return {
    load,
    update,
    getRoot:()=>casinoWoman
  };
}


const CASINO_RECEPTIONIST_CONTROLLER=
  createCasinoReceptionistController({
    THREE,
    scene,
    player,
    QUEST,
    get activeWorldZone(){ return activeWorldZone; },
    loadGLBFromCandidates,
    cloneMaterials,
    centerModelXZ,
    putModelOnFloor,
    registerCasinoEditable,
    lerpAngle
  });

CASINO_RECEPTIONIST_CONTROLLER.load();


const RECEPTION_EXCHANGE={
  open:false,
  selectedAmount:1
};

function refreshReceptionExchangeText(){
  const box=document.getElementById("receptionExchangeText");
  if(!box) return;

  const amount=
    Number(RECEPTION_EXCHANGE.selectedAmount)||1;

  box.textContent=
    `You have $${PLAYER_MONEY.cashDollars} and ${PLAYER_MONEY.coinCents}¢. `+
    `Selected: $${amount} → ${amount*100}¢`;
}

function openReceptionExchange(){
  const panel=document.getElementById("receptionExchangePanel");
  if(!panel) return;

  RECEPTION_EXCHANGE.open=true;
  RECEPTION_EXCHANGE.selectedAmount=1;

  document.querySelectorAll(".rexChoice").forEach(btn=>{
    btn.classList.toggle(
      "selected",
      Number(btn.dataset.rex)===1
    );
  });

  refreshReceptionExchangeText();
  panel.classList.add("open");
  panel.style.display="block";

  if(pickupPrompt) pickupPrompt.style.display="none";
  if(dialogue) dialogue.style.display="none";
  if(dialogueActionHint) dialogueActionHint.style.display="none";

  gameplayInputEnabled=false;
}

function closeReceptionExchange(){
  const panel=document.getElementById("receptionExchangePanel");

  RECEPTION_EXCHANGE.open=false;

  if(panel){
    panel.classList.remove("open");
    panel.style.display="none";
  }

  if(dialogueActionHint){
    dialogueActionHint.style.display="";
  }

  if(!QUEST.dialogueActive && !GLOBAL_DIALOGUE_LOCK.active){
    gameplayInputEnabled=true;
  }
}

function exchangeReceptionDollars(amount){
  amount=Math.floor(Number(amount)||0);
  if(amount<=0) return;

  if(PLAYER_MONEY.cashDollars<amount){
    closeReceptionExchange();

    requestAnimationFrame(()=>{
      questShowClue(
        "NOT ENOUGH DOLLARS",
        1800
      );
    });

    return;
  }

  PLAYER_MONEY.cashDollars-=amount;
  PLAYER_MONEY.coinCents+=amount*100;

  renderInventoryMoney();

  closeReceptionExchange();

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      questShowClue(
        `MONEY CONVERTED · $${amount} → ${amount*100}¢`,
        1900
      );
    });
  });
}

function initReceptionExchangeUI(){
  document.querySelectorAll(".rexChoice").forEach(btn=>{
    if(btn.dataset.rexBound==="1") return;
    btn.dataset.rexBound="1";

    btn.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();

      const amount=Number(btn.dataset.rex)||1;
      RECEPTION_EXCHANGE.selectedAmount=amount;

      document.querySelectorAll(".rexChoice").forEach(other=>{
        other.classList.toggle(
          "selected",
          other===btn
        );
      });

      refreshReceptionExchangeText();
    });
  });

  const cancel=document.getElementById("receptionExchangeClose");
  if(cancel && cancel.dataset.rexBound!=="1"){
    cancel.dataset.rexBound="1";
    cancel.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();
      closeReceptionExchange();
    });
  }

  const cont=document.getElementById("receptionExchangeContinue");
  if(cont && cont.dataset.rexBound!=="1"){
    cont.dataset.rexBound="1";
    cont.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();

      exchangeReceptionDollars(
        RECEPTION_EXCHANGE.selectedAmount
      );
    });
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",initReceptionExchangeUI,{once:true});
}else{
  initReceptionExchangeUI();
}



addEventListener("keydown",e=>{
  if(!RECEPTION_EXCHANGE.open) return;

  if(e.code==="Escape"){
    e.preventDefault();
    e.stopPropagation();
    closeReceptionExchange();
    return;
  }

  if(e.code==="KeyE"){
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  if(
    e.code==="KeyW" ||
    e.code==="KeyA" ||
    e.code==="KeyS" ||
    e.code==="KeyD" ||
    e.key.startsWith("Arrow") ||
    e.code==="Space"
  ){
    e.preventDefault();
    e.stopPropagation();
  }
},true);

function casinoReceptionistNear(){
  const casinoWoman=CASINO_RECEPTIONIST_CONTROLLER.getRoot();
  if(!casinoWoman || !player?.root || activeWorldZone!=="leftRoom") return false;
  const a=new THREE.Vector3(), b=new THREE.Vector3();
  casinoWoman.getWorldPosition(a);
  player.root.getWorldPosition(b);
  return a.distanceTo(b)<=3.8;
}


const CASINO_BOY={
  root:null,
  bones:{},
  rest:new Map(),
  talking:false,

  position:new THREE.Vector3(-29.800,0.150,-18.550),
  rotation:new THREE.Euler(
    THREE.MathUtils.degToRad(2.00),
    THREE.MathUtils.degToRad(270.00),
    THREE.MathUtils.degToRad(0.00)
  ),
  scale:new THREE.Vector3(2.7749,2.7749,2.7749)
};

const CASINO_BOY_CONTROLLER=
  createCasinoBoyController(
    {
      THREE,
      scene,
      player,
      QUEST,
      get activeWorldZone(){ return activeWorldZone; },
      loadGLBFromCandidates,
      cloneMaterials,
      centerModelXZ,
      putModelOnFloor,
      registerCasinoEditable,
      getRest,
      onLoaded:()=>{ buildCasinoBettingSheet(); }
    },
    CASINO_BOY
  );
CASINO_BOY_CONTROLLER.load();


const CASINO_BETTING_SHEET={
  root:null,
  altRoot:null,
  activeIndex:0,
  switchTimer:0,
  switchIntervalMs:10000
};

const CASINO_BETTING_SHEET_2={
  root:null,
  altRoot:null,
  activeIndex:0,
  switchTimer:0,
  switchIntervalMs:11500
};

function createCasinoSecondTvProgramTexture(mode=0){
  const canvas=document.createElement("canvas");
  canvas.width=1024;
  canvas.height=512;
  const ctx=canvas.getContext("2d");

  if(mode===0){
    ctx.fillStyle="#071520";
    ctx.fillRect(0,0,1024,512);

    const g=ctx.createLinearGradient(0,0,1024,0);
    g.addColorStop(0,"#0e4f6f");
    g.addColorStop(1,"#10192d");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,1024,150);

    ctx.fillStyle="#7ee7ff";
    ctx.font="bold 52px Arial";
    ctx.fillText("CASINO LIVE REPORT",50,78);

    ctx.fillStyle="#ffffff";
    ctx.font="bold 30px Arial";
    ctx.fillText("TABLE ACTIVITY & LIVE RESULTS",50,128);

    const rows=[
      ["BLACKJACK 04","OPEN","x2.10"],
      ["ROULETTE 02","LIVE","x3.40"],
      ["POKER 07","FINAL","x1.88"],
      ["VIP TABLE","OPEN","x2.75"]
    ];

    rows.forEach((r,i)=>{
      const y=205+i*65;
      ctx.fillStyle=i%2?"#0b2231":"#0d2a3d";
      ctx.fillRect(45,y-36,930,52);
      ctx.fillStyle="#fff";
      ctx.font="25px Arial";
      ctx.fillText(r[0],65,y);
      ctx.fillStyle="#6fffb5";
      ctx.fillText(r[1],560,y);
      ctx.fillStyle="#ffd36b";
      ctx.fillText(r[2],820,y);
    });

    ctx.fillStyle="#7499ad";
    ctx.font="20px Arial";
    ctx.fillText("PROGRAM A · LIVE FLOOR FEED",50,485);
  }else{
    ctx.fillStyle="#190d17";
    ctx.fillRect(0,0,1024,512);

    const g=ctx.createLinearGradient(0,0,1024,0);
    g.addColorStop(0,"#7a1849");
    g.addColorStop(1,"#28122d");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,1024,150);

    ctx.fillStyle="#ff91c4";
    ctx.font="bold 52px Arial";
    ctx.fillText("JACKPOT WATCH",50,78);

    ctx.fillStyle="#fff5fa";
    ctx.font="bold 30px Arial";
    ctx.fillText("TONIGHT'S FEATURED PAYOUTS",50,128);

    const rows=[
      ["MEGA DRAW","$ 12,480"],
      ["TABLE BONUS","$ 8,220"],
      ["LUCKY HOUR","$ 5,750"],
      ["VIP PRIZE","$ 21,900"]
    ];

    rows.forEach((r,i)=>{
      const y=210+i*65;
      ctx.fillStyle=i%2?"#321329":"#3d1731";
      ctx.fillRect(45,y-36,930,52);
      ctx.fillStyle="#fff";
      ctx.font="25px Arial";
      ctx.fillText(r[0],65,y);
      ctx.fillStyle="#ffd56d";
      ctx.fillText(r[1],690,y);
    });

    ctx.fillStyle="#b387a0";
    ctx.font="20px Arial";
    ctx.fillText("PROGRAM B · JACKPOT BOARD",50,485);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.generateMipmaps=false;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;
  return texture;
}

function buildCasinoBettingSheet2(){
  if(CASINO_BETTING_SHEET_2.root?.parent){
    return CASINO_BETTING_SHEET_2.root;
  }

  const makeSheet=(texture,name)=>{
    const sheet=new THREE.Group();
    sheet.name=name;

    const backing=new THREE.Mesh(
      new THREE.BoxGeometry(3.65,2.05,.08),
      new THREE.MeshStandardMaterial({
        color:0x090b10,
        roughness:.58,
        metalness:.10
      })
    );
    backing.name=`${name}_backing`;
    sheet.add(backing);

    const face=new THREE.Mesh(
      new THREE.PlaneGeometry(3.45,1.85),
      new THREE.MeshBasicMaterial({
        map:texture,
        toneMapped:false,
        side:THREE.DoubleSide
      })
    );
    face.name=`${name}_face`;
    face.position.z=.045;
    sheet.add(face);

    sheet.position.set(-28.630,4.050,-13.970);
    sheet.rotation.set(0,THREE.MathUtils.degToRad(180),0);
    sheet.scale.set(1.3421,1.3421,1.3421);

    return sheet;
  };

  const sheet1=makeSheet(
    createCasinoSecondTvProgramTexture(0),
    "casino_betting_sheet_2_program_A"
  );

  const sheet2=makeSheet(
    createCasinoSecondTvProgramTexture(1),
    "casino_betting_sheet_2_program_B"
  );

  scene.add(sheet1);

  CASINO_BETTING_SHEET_2.root=sheet1;
  CASINO_BETTING_SHEET_2.altRoot=sheet2;
  CASINO_BETTING_SHEET_2.activeIndex=0;

  registerCasinoEditable("bettingOverlay2",sheet1);
  rebuildCasinoEditableColliders();
  startCasinoBettingSheetRotation2();

  return sheet1;
}

function startCasinoBettingSheetRotation2(){
  clearTimeout(CASINO_BETTING_SHEET_2.switchTimer);

  const sheet1=CASINO_BETTING_SHEET_2.root;
  const sheet2=CASINO_BETTING_SHEET_2.altRoot;
  if(!sheet1 || !sheet2) return;

  const scheduleNext=()=>{
    CASINO_BETTING_SHEET_2.switchTimer=setTimeout(()=>{
      const next=
        CASINO_BETTING_SHEET_2.activeIndex===0 ? 1 : 0;

      if(sheet1.parent) sheet1.parent.remove(sheet1);
      if(sheet2.parent) sheet2.parent.remove(sheet2);

      const active=next===0 ? sheet1 : sheet2;
      scene.add(active);
      registerCasinoEditable("bettingOverlay2",active);

      rebuildCasinoEditableColliders();

      CASINO_BETTING_SHEET_2.activeIndex=next;
      scheduleNext();
    },CASINO_BETTING_SHEET_2.switchIntervalMs);
  };

  scheduleNext();
}

function createCasinoBettingAltTexture(){
  const canvas=document.createElement("canvas");
  canvas.width=1024;
  canvas.height=512;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#100b1c";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const grad=ctx.createLinearGradient(0,0,canvas.width,0);
  grad.addColorStop(0,"rgba(255,184,77,.20)");
  grad.addColorStop(1,"rgba(120,80,220,.06)");
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,150);

  const drawCoin=(x,y,r,label="BET")=>{
    const g=ctx.createRadialGradient(
      x-r*.35,y-r*.35,r*.15,
      x,y,r
    );
    g.addColorStop(0,"#fff2a9");
    g.addColorStop(.42,"#ffc84c");
    g.addColorStop(1,"#b87412");

    ctx.save();
    ctx.shadowColor="rgba(255,190,54,.34)";
    ctx.shadowBlur=15;
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(255,248,207,.76)";
    ctx.lineWidth=Math.max(2,r*.10);
    ctx.beginPath();
    ctx.arc(x,y,r*.78,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="#6d4308";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font=`bold ${Math.max(11,r*.42)}px Arial`;
    ctx.fillText(label,x,y+1);

    ctx.textAlign="left";
    ctx.textBaseline="alphabetic";
    ctx.restore();
  };

  ctx.fillStyle="#ffb84d";
  ctx.font="bold 50px Arial";
  ctx.fillText("NEXT BETTING MARKETS",55,78);

  ctx.fillStyle="#e8ddff";
  ctx.font="bold 31px Arial";
  ctx.fillText("TODAY'S FEATURED EVENTS",55,130);

  ctx.fillStyle="#d7a2ff";
  ctx.font="bold 18px Arial";
  ctx.fillText("PROGRAM 02",860,68);

  drawCoin(920,112,32,"BET");
  drawCoin(862,96,20,"$");
  drawCoin(958,157,16,"$");

  const rows=[
    ["FOOTBALL","CITY vs UNITED","1.85","3.25","4.10"],
    ["TENNIS","QUARTER FINAL","1.62","2.30","—"],
    ["RACING","GRAND CUP · R5","2.75","4.20","6.40"],
    ["BASKETBALL","NORTH vs SOUTH","1.74","2.05","—"]
  ];

  ctx.font="25px Arial";
  rows.forEach((r,i)=>{
    const y=198+i*68;
    ctx.fillStyle=i%2?"#211633":"#291b3e";
    ctx.fillRect(45,y-36,930,54);

    ctx.fillStyle="#f4efff";
    ctx.fillText(r[0],65,y);

    ctx.fillStyle="#d6c7ff";
    ctx.fillText(r[1],250,y);

    ctx.fillStyle="#88e5b0";
    ctx.fillText(r[2],675,y);

    ctx.fillStyle="#ffd37a";
    ctx.fillText(r[3],800,y);

    ctx.fillStyle="#9ec5ff";
    ctx.fillText(r[4],910,y);
  });

  ctx.fillStyle="#9d8db9";
  ctx.font="21px Arial";
  ctx.fillText("PRE-MATCH ODDS • PROGRAM 02",55,485);

  const texture=new THREE.CanvasTexture(canvas);
  texture.generateMipmaps=false;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.needsUpdate=true;

  return texture;
}

function buildCasinoBettingSheet(){
  if(CASINO_BETTING_SHEET.root?.parent){
    return CASINO_BETTING_SHEET.root;
  }
  if(!CASINO_BOY?.root) return null;

  if(!CASINO_MEDIA_RUNTIME.tvTexture){
    const program=createCasinoTvProgramTexture(0);
    CASINO_MEDIA_RUNTIME.tvCanvas=program.canvas;
    CASINO_MEDIA_RUNTIME.tvCtx=program.ctx;
    CASINO_MEDIA_RUNTIME.tvTexture=program.texture;
  }

  const makeSheet=(texture,name)=>{
    const sheet=new THREE.Group();
    sheet.name=name;

    const backing=new THREE.Mesh(
      new THREE.BoxGeometry(3.65,2.05,.08),
      new THREE.MeshStandardMaterial({
        color:0x090b10,
        roughness:.58,
        metalness:.10
      })
    );
    backing.name=`${name}_backing`;
    sheet.add(backing);

    const face=new THREE.Mesh(
      new THREE.PlaneGeometry(3.45,1.85),
      new THREE.MeshBasicMaterial({
        map:texture,
        toneMapped:false,
        side:THREE.DoubleSide
      })
    );
    face.name=`${name}_face`;
    face.position.z=.045;
    sheet.add(face);

    sheet.position.set(-32.250,4.050,-18.050);
    sheet.rotation.set(
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(90),
      THREE.MathUtils.degToRad(0)
    );
    sheet.scale.set(1.3421,1.3421,1.3421);

    return sheet;
  };

  const sheet1=makeSheet(
    CASINO_MEDIA_RUNTIME.tvTexture,
    "casino_betting_sheet_program_01"
  );

  const sheet2=makeSheet(
    createCasinoBettingAltTexture(),
    "casino_betting_sheet_program_02"
  );

  scene.add(sheet1);

  CASINO_BETTING_SHEET.root=sheet1;
  CASINO_BETTING_SHEET.altRoot=sheet2;
  CASINO_BETTING_SHEET.activeIndex=0;

  registerCasinoEditable("bettingOverlay",sheet1);

  startCasinoBettingSheetRotation();

  return sheet1;
}

function startCasinoBettingSheetRotation(){
  clearTimeout(CASINO_BETTING_SHEET.switchTimer);

  const sheet1=CASINO_BETTING_SHEET.root;
  const sheet2=CASINO_BETTING_SHEET.altRoot;
  if(!sheet1 || !sheet2) return;

  const scheduleNext=()=>{
    CASINO_BETTING_SHEET.switchTimer=setTimeout(()=>{
      const current=CASINO_BETTING_SHEET.activeIndex;
      const next=current===0 ? 1 : 0;

      if(sheet1.parent){
        sheet1.parent.remove(sheet1);
      }
      if(sheet2.parent){
        sheet2.parent.remove(sheet2);
      }

      if(next===0){
        scene.add(sheet1);
        registerCasinoEditable("bettingOverlay",sheet1);
      }else{
        scene.add(sheet2);
        registerCasinoEditable("bettingOverlay",sheet2);
      }

      rebuildCasinoEditableColliders();
      CASINO_BETTING_SHEET.activeIndex=next;
      scheduleNext();
    },CASINO_BETTING_SHEET.switchIntervalMs);
  };

  scheduleNext();
}


function casinoBoyNear(){
  if(
    !CASINO_BOY.root ||
    !player?.root ||
    activeWorldZone!=="leftRoom"
  ){
    return false;
  }

  return player.root.position.distanceTo(
    CASINO_BOY.root.position
  )<=3.6;
}


function talkToCasinoBoy(){
  questStartDialogue("BOY",[
    "Hey—don't bother me. Can't you see I'm busy?",
    "I already lost enough money tonight. I need to think before I make another bet. Go away."
  ]);
}

const GAME_START_RETURN={
  captured:false,
  playerPos:null,
  playerYaw:0
};
const SECURITY_TALK2={
  active:false,
  gestureStart:0,
  panel:null,
  readout:null,
  agitation:{
    level:0.84,
    speed:0.74,
    shoulders:{amount:0.34,axis:"z"},
    forearms:{amount:0.82,axis:"z"},
    hands:{amount:1.00,axis:"xyz"},
    torso:{amount:0.26,axis:"z"},
    neck:{amount:0.22,axis:"x"},
    head:{amount:0.30,axis:"x"}
  },
  thumb:{
    right_thumb_1:{x:-16,y:0,z:0},
    right_thumb_2:{x:0,y:0,z:0},
    right_thumb_3:{x:0,y:0,z:0},
    right_thumb_4:{x:0,y:0,z:0}
  },
  target:{
    leftArm:{x:73,y:8,z:7},
    leftForeArm:{x:-5,y:0,z:79},
    leftHand:{x:0,y:0,z:2},
    rightArm:{x:58,y:0,z:-10},
    rightForeArm:{x:3,y:0,z:-38},
    rightHand:{x:13,y:-3,z:0}
  }
};

const SECURITY_UNIFIED_TALK_PANEL={
  panel:null,
  readout:null,
  controls:{},
  mode:null
};

function getSecurityUnifiedTalkTarget(){

  initSecurityOldTalkPanelTargets(questGetPolice());
  return {
    mode:"TALK",
    source:SECURITY_OLD_TALK_PANEL.target,
    degrees:false
  };
}

function securityUnifiedGetDeg(obj,key,axis){
  const v=obj?.[key]?.[axis] ?? 0;
  return THREE.MathUtils.radToDeg(v);
}

function refreshSecurityUnifiedTalkPanel(){
  const panel=SECURITY_UNIFIED_TALK_PANEL.panel;
  if(!panel) return;

  const info=getSecurityUnifiedTalkTarget();
  const mode=info.mode;
  const src=info.source;

  if(SECURITY_UNIFIED_TALK_PANEL.mode!==mode){
    SECURITY_UNIFIED_TALK_PANEL.mode=mode;

    for(const [key,axes] of Object.entries(SECURITY_UNIFIED_TALK_PANEL.controls)){
      for(const axis of ["x","y","z"]){
        const control=axes[axis];
        if(!control) continue;

        const deg=securityUnifiedGetDeg(src,key,axis);
        control.slider.value=String(Math.round(deg*10)/10);
        control.value.textContent=`${Number(control.slider.value).toFixed(1)}°`;
      }
    }
  }

  const lines=[
    `SECURITY LIVE TALK EDITOR · TALK`,
    "Security TALK · used in every Security conversation"
  ];

  for(const key of [
    "leftArm","leftForeArm","leftHand",
    "rightArm","rightForeArm","rightHand"
  ]){
    lines.push(
      `${key}: x ${securityUnifiedGetDeg(src,key,"x").toFixed(1)}° · `+
      `y ${securityUnifiedGetDeg(src,key,"y").toFixed(1)}° · `+
      `z ${securityUnifiedGetDeg(src,key,"z").toFixed(1)}°`
    );
  }

  SECURITY_UNIFIED_TALK_PANEL.readout.textContent=lines.join("\n");
}


function hideAllSecurityContextPanels(){
  if(SECURITY_OLD_TALK_PANEL?.panel){
    SECURITY_OLD_TALK_PANEL.panel.style.setProperty("display","none","important");
  }
  if(SECURITY_FINAL_POSE_EDITOR?.panel){
    SECURITY_FINAL_POSE_EDITOR.panel.style.setProperty("display","none","important");
  }
  if(SECURITY_TALK2?.panel){
    SECURITY_TALK2.panel.style.setProperty("display","none","important");
  }
}

const FINAL_SECURITY_DIALOGUE_FACING={
  mode:"player",
  active:false,
  transitionStart:0,
  initialized:false,
  fromRootYaw:0,
  fromNeckY:0,
  fromHeadY:0,
  fromSpineY:0,
  returnComplete:false,
  pendingConclude:false
};

function setFinalSecurityDialogueFacing(mode){
  const state=FINAL_SECURITY_DIALOGUE_FACING;

  state.mode=mode;
  state.active=true;
  state.transitionStart=performance.now();
  state.returnComplete=false;
  state.pendingConclude=false;

  const security=questGetPolice?.();

  if(security?.root){
    const b=getBones(security);
    const neckRest=getRest(security,b.neck);
    const headRest=getRest(security,b.head);
    const spineRest=getRest(security,b.spine);

    state.fromRootYaw=security.root.rotation.y;
    state.fromNeckY=b.neck?.rotation?.y ?? neckRest?.y ?? 0;
    state.fromHeadY=b.head?.rotation?.y ?? headRest?.y ?? 0;
    state.fromSpineY=b.spine?.rotation?.y ?? spineRest?.y ?? 0;
    state.initialized=true;
  }else{
    state.initialized=false;
  }
}

function updateFinalSecurityDialogueFacing(){
  if(
    !FINAL_SECURITY_DIALOGUE_FACING.active ||
    !QUEST.dialogueActive ||
    String(QUEST.dialogueSpeaker||"").toUpperCase()!=="SECURITY"
  ){
    return;
  }

  const security=questGetPolice?.();
  const thief=getEditableThief?.();

  if(!security?.root) return;

  let target=null;

  if(
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief" &&
    thief?.root?.visible
  ){
    target=thief.root;
  }else if(player?.root){
    target=player.root;
  }

  if(!target) return;

  const dx=target.position.x-security.root.position.x;
  const dz=target.position.z-security.root.position.z;

  if(dx*dx+dz*dz<.0001) return;

  const targetYaw=Math.atan2(dx,dz);
  const b=getBones(security);

  const neckRest=getRest(security,b.neck);
  const headRest=getRest(security,b.head);
  const spineRest=getRest(security,b.spine);

  const state=FINAL_SECURITY_DIALOGUE_FACING;

  if(!state.initialized){
    state.initialized=true;
    state.transitionStart=performance.now();
    state.fromRootYaw=security.root.rotation.y;
    state.fromNeckY=b.neck?.rotation?.y ?? neckRest?.y ?? 0;
    state.fromHeadY=b.head?.rotation?.y ?? headRest?.y ?? 0;
    state.fromSpineY=b.spine?.rotation?.y ?? spineRest?.y ?? 0;
  }

  const elapsed=(performance.now()-state.transitionStart)/1000;

  const returningToPlayer=
    FINAL_SECURITY_DIALOGUE_FACING.mode==="player";

  const smoother01=(v)=>{
    const t=THREE.MathUtils.clamp(v,0,1);
    return t*t*t*(t*(t*6-15)+10);
  };

  const headT=returningToPlayer
    ? smoother01(elapsed/1.65)
    : smooth01(THREE.MathUtils.clamp(elapsed/1.55,0,1));

  const neckT=returningToPlayer
    ? smoother01((elapsed-.02)/1.85)
    : smooth01(THREE.MathUtils.clamp((elapsed-.05)/1.35,0,1));

  const spineT=returningToPlayer
    ? smoother01((elapsed-.07)/2.00)
    : smooth01(THREE.MathUtils.clamp((elapsed-.10)/1.30,0,1));

  const rootT=returningToPlayer
    ? smoother01((elapsed-.10)/2.15)
    : smooth01(THREE.MathUtils.clamp((elapsed-.14)/1.45,0,1));

  const fullRootDelta=
    normalizeAngle(targetYaw-state.fromRootYaw);

  const rootAmount=
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief"
      ? .42
      : 1.00;

  const desiredRootYaw=
    state.fromRootYaw+
    fullRootDelta*rootAmount;

  const newRootYaw=
    state.fromRootYaw+
    normalizeAngle(desiredRootYaw-state.fromRootYaw)*rootT;

  security.root.rotation.y=newRootYaw;

  const localDelta=normalizeAngle(
    targetYaw-newRootYaw
  );

  const clamped=THREE.MathUtils.clamp(
    localDelta,
    -.26,
    .26
  );

  if(b.spine && spineRest){
    const targetSpineY=
      spineRest.y+
      clamped*.10*spineT;

    b.spine.rotation.y=THREE.MathUtils.lerp(
      state.fromSpineY,
      targetSpineY,
      spineT*.68
    );
  }

  if(b.neck && neckRest){
    const targetNeckY=
      neckRest.y+
      clamped*.30*neckT;

    b.neck.rotation.y=THREE.MathUtils.lerp(
      state.fromNeckY,
      targetNeckY,
      neckT*.78
    );
  }

  if(b.head && headRest){
    const targetHeadY=
      headRest.y+
      clamped*.34*headT;

    b.head.rotation.y=THREE.MathUtils.lerp(
      state.fromHeadY,
      targetHeadY,
      headT*.75
    );
  }

  if(
    QUEST.dialogueActive &&
    String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" &&
    b.head &&
    headRest
  ){
    const talkNow=performance.now();

    const lookingAtThief=
      FINAL_SECURITY_DIALOGUE_FACING.active &&
      FINAL_SECURITY_DIALOGUE_FACING.mode==="thief";

    const talkNod=lookingAtThief
      ? Math.sin(talkNow*.0027)*.011
      : Math.sin(talkNow*.0064)*.028;

    const currentYaw=b.head.rotation.y;
    const currentRoll=b.head.rotation.z;

    b.head.rotation.x=THREE.MathUtils.lerp(
      b.head.rotation.x,
      headRest.x+talkNod,
      lookingAtThief ? .055 : .10
    );

    b.head.rotation.y=currentYaw;
    b.head.rotation.z=currentRoll;
  }

  security.root.updateMatrixWorld(true);

  if(returningToPlayer){
    const finished=
      headT>=.999 &&
      neckT>=.999 &&
      spineT>=.999 &&
      rootT>=.999;

    if(finished && !state.returnComplete){
      state.returnComplete=true;

      if(state.pendingConclude){
        state.pendingConclude=false;
        requestAnimationFrame(()=>{
          if(QUEST.dialogueActive){
            questAdvanceDialogue();
          }
        });
      }
    }
  }
}

const FINAL_ARREST_FLOW={
  active:false,
  finished:false
};
function enforceFinalThiefVisible(){
  if(
    STOREKEEPER_FINAL?.policeSummoned &&
    !STOREKEEPER_FINAL?.completed &&
    !FINAL_ARREST_FLOW?.finished
  ){
    applyLockedFinalSceneLayout();
  }

  if(
    !STOREKEEPER_FINAL?.policeSummoned ||
    STOREKEEPER_FINAL?.completed ||
    FINAL_ARREST_FLOW?.finished
  ){
    return;
  }

  const toxic=getEditableThief?.();
  if(!toxic?.root) return;

  toxic.root.visible=true;

  toxic.root.traverse(o=>{
    if(o?.isMesh){
      o.visible=true;
      o.frustumCulled=false;
    }
  });

  if(
    !Number.isFinite(toxic.root.position.x) ||
    Math.abs(toxic.root.position.x)>1000 ||
    Math.abs(toxic.root.position.y)>1000 ||
    Math.abs(toxic.root.position.z)>1000
  ){
    toxic.root.position.copy(STOREKEEPER_FINAL.finalPos);
  }

  toxic.root.updateMatrixWorld(true);
}

function completeFinalArrestSequence(){
  if(FINAL_ARREST_FLOW.finished) return;

  FINAL_ARREST_FLOW.finished=true;
  FINAL_ARREST_FLOW.active=false;
  gameplayInputEnabled=false;
  SECURITY_POST_CASE_HOME_LOCK=true;

  if(dialogue) dialogue.style.display="none";
  QUEST.dialogueActive=false;
  QUEST.dialogueDone=null;
  GLOBAL_DIALOGUE_LOCK.active=false;
  GLOBAL_DIALOGUE_LOCK.npc=null;
  DIALOGUE_E_LOCK=false;

  const security=questGetPolice();
  const toxic=getEditableThief();

  STOREKEEPER_FINAL.completed=true;
  STOREKEEPER_FINAL.finishing=false;
  STOREKEEPER_FINAL.policeSummoned=false;
  STOREKEEPER_FINAL.thiefDialoguePending=false;
  STOREKEEPER_FINAL.thiefDialogueDone=true;
  STOREKEEPER_FINAL.lastPresenceState=null;

  POLICE_RADIO.callReady=false;
  POLICE_RADIO.calling=false;

  questSetStage("game_complete");
  if(taskText) taskText.textContent="TASKS COMPLETE";
  const eyebrow=document.getElementById("taskEyebrow");
  if(eyebrow) eyebrow.textContent="CURRENT TASK";

  let cut=document.getElementById("caseCompleteScreen");
  if(!cut){
    cut=document.createElement("div");
    cut.id="caseCompleteScreen";
    document.body.appendChild(cut);
  }

  Object.assign(cut.style,{
    position:"fixed",
    inset:"0",
    zIndex:"2147483647",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    gap:"22px",
    background:
      "radial-gradient(circle at 50% 42%, rgba(39,118,190,.24) 0%, rgba(9,31,52,.20) 30%, transparent 56%),"+
      "linear-gradient(180deg,#061421 0%,#071a2b 48%,#030b13 100%)",
    opacity:"1",
    visibility:"visible",
    pointerEvents:"auto",
    transition:"none",
    color:"#eef8ff",
    textAlign:"center",
    overflow:"hidden"
  });

  cut.innerHTML="";

  const solvedLens=document.createElement("div");
  solvedLens.className="caseCompleteLens";

  const solvedLabel=document.createElement("div");
  solvedLabel.className="caseCompleteTitle";
  solvedLabel.textContent="MYSTERY SOLVED";

  const solvedSub=document.createElement("div");
  solvedSub.className="caseCompleteSub";
  solvedSub.textContent="The truth has been uncovered.";

  cut.append(
    solvedLens,
    solvedLabel,
    solvedSub
  );

  if(pickupPrompt) pickupPrompt.style.display="none";
  if(slotPrompt) slotPrompt.style.display="none";
  if(doorPrompt) doorPrompt.style.display="none";

  requestAnimationFrame(()=>{

    if(toxic?.root){
      toxic.state="idle";
      toxic.timer=0;
      toxic.root.visible=false;
      toxic.root.position.set(9999,-9999,9999);
      toxic.root.updateMatrixWorld(true);
    }

    if(player?.root && GAME_START_RETURN.captured && GAME_START_RETURN.playerPos){
      for(const k of Object.keys(keys)) keys[k]=false;
      lastE=false;

      if(player.velocity?.set) player.velocity.set(0,0,0);
      if(player.moveVelocity?.set) player.moveVelocity.set(0,0,0);
      if(player.root.userData?.velocity?.set){
        player.root.userData.velocity.set(0,0,0);
      }

      player.root.position.copy(GAME_START_RETURN.playerPos);
      player.root.rotation.set(0,GAME_START_RETURN.playerYaw,0);

      if(player.prevPosition?.copy) player.prevPosition.copy(player.root.position);
      if(player.previousPosition?.copy) player.previousPosition.copy(player.root.position);
      if(player.targetPosition?.copy) player.targetPosition.copy(player.root.position);

      player.root.updateMatrixWorld(true);
    }

    if(security?.root && STOREKEEPER_FINAL.securityHome){
      NPC_CONVERSATION_FINAL_LATCH?.delete?.(security);
      NPC_TALK_TURN_STEP_STATE?.delete?.(security);

      SECURITY_TALK2.active=false;
      SECURITY_TALK2.gestureStart=0;
      security.__talkStartupState=null;
      security.__rightTalkCycleStart=0;
      security.__normalTalk2GestureStart=0;

      SECURITY_POSE_EDITOR.wasTalking=false;
      SECURITY_POSE_EDITOR.rightNeutralAfterTalk=false;
      SECURITY_POSE_EDITOR.rightReturnActive=false;
      SECURITY_POSE_EDITOR.rightReturnFrom={};
      SECURITY_POSE_EDITOR.finalPoseActive=false;
      SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
      SECURITY_FINAL_POSE_EDITOR.transitionFrom={};

      security.root.visible=false;
      applySecurityCompletedHomeExact(security);
    }

    activeWorldZone="outside";
    sceneTransitionBusy=false;
    pendingDoorTransition=null;

    cleanCameraYaw=player?.root?.rotation?.y || 0;
    toxicEntryCameraActive=false;
    toxicExitCameraActive=false;

    if(typeof updateCleanPlayerCamera==="function"){
      updateCleanPlayerCamera();
      cleanCameraReady=true;
    }

    playerMoving=false;
    animateIdle(player);

    let hiddenFrames=0;
    const settle=()=>{
      cut.style.opacity="1";

      if(player?.root && GAME_START_RETURN.captured && GAME_START_RETURN.playerPos){
        player.root.position.copy(GAME_START_RETURN.playerPos);
        player.root.rotation.set(0,GAME_START_RETURN.playerYaw,0);
        player.root.updateMatrixWorld(true);
      }

      if(security?.root && STOREKEEPER_FINAL.securityHome){
        security.root.visible=false;
        applySecurityCompletedHomeExact(security);
      }

        if(typeof updateCleanPlayerCamera==="function"){
        updateCleanPlayerCamera();
        cleanCameraReady=true;
      }

      hiddenFrames++;
      if(hiddenFrames<10){
        requestAnimationFrame(settle);
        return;
      }

      if(security?.root){
        NPC_CONVERSATION_FINAL_LATCH?.delete?.(security);
        NPC_TALK_TURN_STEP_STATE?.delete?.(security);
        applySecurityCompletedHomeExact(security);
        security.root.visible=true;
      }

      setTimeout(()=>{
        if(security?.root){
          applySecurityCompletedHomeExact(security);
          security.root.visible=true;
        }

        cut.style.transition="opacity .18s ease";
        requestAnimationFrame(()=>{ cut.style.opacity="0"; });

        setTimeout(()=>{
          cut.remove();

          QUEST.dialogueActive=false;
          QUEST.dialogueDone=null;
          GLOBAL_DIALOGUE_LOCK.active=false;
          GLOBAL_DIALOGUE_LOCK.npc=null;
          DIALOGUE_E_LOCK=false;

          for(const k of Object.keys(keys)) keys[k]=false;
          lastE=false;

          gameplayInputEnabled=true;
          playerMoving=false;
          cleanCameraReady=true;
        },210);
      },850);
    };

    requestAnimationFrame(settle);
  });
}
function captureGameStartReturnPoint(){
  if(!player?.root) return;
  if(activeWorldZone!=="outside") return;
  const p=player.root.position;
  if(Math.abs(p.x)<.001 && Math.abs(p.z)<.001) return;
  if(GAME_START_RETURN.captured) return;
  GAME_START_RETURN.captured=true;
  GAME_START_RETURN.playerPos=p.clone();
  GAME_START_RETURN.playerYaw=player.root.rotation.y;

  const security=questGetPolice?.();
  if(security?.ready){
    captureSecurityGameStartSnapshot(security);
  }
}
const STOREKEEPER_FINAL={
  securityHome:null,
  securityHomeYaw:null,
  securityHomeRotation:null,
  securityHomeScale:null,
  finalPos:new THREE.Vector3(-60.250,0.050,93.700),
  completed:false,
  finishing:false,
  lastPresenceState:null,
  thiefDialoguePending:false,
  thiefDialogueDone:false,
  policeSummoned:false,
  policeIntroDone:false
};
const POLICE_RADIO={
  owned:false,
  callReady:false,
  calling:false,
  prompt:null
};

function updateStorekeeperQuestPresence(){
  const toxic=globalThis.npcs?.find(n=>n?.name==="toxicMan");
  if(!toxic?.root) return;
  if(!STOREKEEPER_FINAL.securityHome){
    const sec=questGetPolice();
    if(sec?.root){
      STOREKEEPER_FINAL.securityHome=sec.root.position.clone();
      STOREKEEPER_FINAL.securityHomeYaw=sec.root.rotation.y;
      STOREKEEPER_FINAL.securityHomeRotation=sec.root.rotation.clone();
      STOREKEEPER_FINAL.securityHomeScale=sec.root.scale.clone();
    }
  }
  const shouldAppear=
    (
      QUEST.stage==="find_suspicious" ||
      QUEST.stage==="call_security" ||
      STOREKEEPER_FINAL.policeSummoned ||
      STOREKEEPER_FINAL.finishing
    ) &&
    !STOREKEEPER_FINAL.completed;
  if(STOREKEEPER_FINAL.lastPresenceState===shouldAppear) return;
  STOREKEEPER_FINAL.lastPresenceState=shouldAppear;
  if(!shouldAppear){
    toxic.root.visible=false;
    toxic.root.position.set(9999,-9999,9999);
    toxic.root.traverse(o=>{
      if(o.isMesh){
        o.visible=false;
        o.castShadow=false;
      }
    });
    toxic.state="idle";
    toxic.timer=0;
    removeObjectCollision(
      LIGHT_COLLISION,
      toxic.root
    );
    return;
  }
  toxic.root.visible=true;
  toxic.root.traverse(o=>{
    if(o.isMesh) o.visible=true;
  });
  toxic.root.position.copy(STOREKEEPER_FINAL.finalPos);
  toxic.root.rotation.y=THREE.MathUtils.degToRad(91.00);
  toxic.root.scale.set(1,1,1);
  toxic.toxicFixedRotationY=toxic.root.rotation.y;
  toxic.root.updateMatrixWorld(true);
}

let THIEF_HANDCUFFS_APPLIED=false;

const THIEF_HANDCUFF_EDITOR={
  panel:null,
  readout:null,
  bones:{},
  rest:{},
  offsets:{
    leftArm:{x:-17,y:0,z:-28},
    rightArm:{x:-23,y:0,z:28},
    leftForeArm:{x:75,y:-18,z:20},
    rightForeArm:{x:72,y:18,z:-20},
    leftHand:{x:0,y:-18,z:8},
    rightHand:{x:0,y:18,z:-8}
  }
};

function cacheThiefHandcuffBones(){
  const toxic=getEditableThief();
  if(!toxic?.root) return false;

  const bones={};
  toxic.root.traverse(o=>{
    if(!o?.isBone) return;
    const n=String(o.name||"").toLowerCase();

    if(n.includes("leftarm") && !n.includes("fore")) bones.leftArm=o;
    if(n.includes("rightarm") && !n.includes("fore")) bones.rightArm=o;
    if(n.includes("leftforearm")) bones.leftForeArm=o;
    if(n.includes("rightforearm")) bones.rightForeArm=o;
    if(n.includes("lefthand")) bones.leftHand=o;
    if(n.includes("righthand")) bones.rightHand=o;
  });

  THIEF_HANDCUFF_EDITOR.bones=bones;

  for(const key of Object.keys(THIEF_HANDCUFF_EDITOR.offsets)){
    const bone=bones[key];
    if(!bone) continue;

    if(!THIEF_HANDCUFF_EDITOR.rest[key]){
      THIEF_HANDCUFF_EDITOR.rest[key]=bone.rotation.clone();
    }
  }

  return !!(bones.leftHand && bones.rightHand);
}

function applyThiefHandcuffEditorPose(){
  const toxic=getEditableThief();
  if(!toxic?.root || !THIEF_HANDCUFFS_APPLIED) return;

  if(!THIEF_HANDCUFF_EDITOR.bones.leftHand){
    cacheThiefHandcuffBones();
  }

  for(const [key,offset] of Object.entries(THIEF_HANDCUFF_EDITOR.offsets)){
    const bone=THIEF_HANDCUFF_EDITOR.bones[key];
    const rest=THIEF_HANDCUFF_EDITOR.rest[key];
    if(!bone || !rest) continue;

    bone.rotation.set(
      rest.x+THREE.MathUtils.degToRad(offset.x||0),
      rest.y+THREE.MathUtils.degToRad(offset.y||0),
      rest.z+THREE.MathUtils.degToRad(offset.z||0)
    );
  }

  toxic.root.updateMatrixWorld(true);
}

function updateThiefHandcuffEditor(){

  if(
    THIEF_HANDCUFFS_APPLIED &&
    STOREKEEPER_FINAL.policeSummoned &&
    !STOREKEEPER_FINAL.completed
  ){
    applyThiefHandcuffEditorPose();
  }
}

function applyThiefHandcuffPose(){
  if(THIEF_HANDCUFFS_APPLIED) return;

  const toxic=getEditableThief();
  if(!toxic?.root) return;

  THIEF_HANDCUFFS_APPLIED=true;
  toxic.state="idle";
  toxic.timer=0;

  cacheThiefHandcuffBones();
  applyThiefHandcuffEditorPose();

  const bones=THIEF_HANDCUFF_EDITOR.bones;

  const cuffMat=new THREE.MeshStandardMaterial({
    color:0xb8bec6,
    metalness:.92,
    roughness:.22
  });

  const makeCuff=(hand,name)=>{
    if(!hand) return null;

    const old=hand.getObjectByName(name);
    if(old) return old;

    const cuff=new THREE.Group();
    cuff.name=name;

    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(.075,.018,10,24),
      cuffMat
    );
    ring.rotation.y=Math.PI*.5;
    cuff.add(ring);

    const hinge=new THREE.Mesh(
      new THREE.BoxGeometry(.030,.055,.025),
      cuffMat
    );
    hinge.position.x=.075;
    cuff.add(hinge);

    cuff.position.set(0,.015,0);
    hand.add(cuff);
    return cuff;
  };

  const leftCuff=makeCuff(
    bones.leftHand,
    "thief_handcuff_left"
  );
  const rightCuff=makeCuff(
    bones.rightHand,
    "thief_handcuff_right"
  );

  if(leftCuff && rightCuff && bones.leftHand){
    if(!leftCuff.getObjectByName("thief_handcuff_chain")){
      const chain=new THREE.Group();
      chain.name="thief_handcuff_chain";

      for(let i=0;i<4;i++){
        const link=new THREE.Mesh(
          new THREE.TorusGeometry(.026,.008,8,16),
          cuffMat
        );
        link.rotation.y=i%2 ? 0 : Math.PI*.5;
        link.position.x=.095+i*.040;
        chain.add(link);
      }

      leftCuff.add(chain);
    }
  }

  toxic.root.updateMatrixWorld(true);
  updateThiefHandcuffEditor();
}

const FINAL_SCENE_LOCKED_LAYOUT={
  player:{
    x:-51.235,
    y:0.135,
    z:86.146,
    yaw:-38.0
  },
  security:{
    x:-52.8,
    y:0.05,
    z:89.05,
    yaw:157.4
  },
  thief:{
    x:-54.05,
    y:0.05,
    z:88.5,
    yaw:138.3
  }
};

function applyLockedFinalSceneLayout(){
  const security=questGetPolice?.();
  const thief=getEditableThief?.();

  if(player?.root){
    const v=FINAL_SCENE_LOCKED_LAYOUT.player;
    player.root.position.set(v.x,v.y,v.z);
    player.root.rotation.y=THREE.MathUtils.degToRad(v.yaw);
    player.root.updateMatrixWorld(true);
  }

  if(security?.root){
    const v=FINAL_SCENE_LOCKED_LAYOUT.security;
    security.root.position.set(v.x,v.y,v.z);
    security.root.rotation.y=THREE.MathUtils.degToRad(v.yaw);
    security.root.visible=true;
    security.root.updateMatrixWorld(true);
  }

  if(thief?.root){
    const v=FINAL_SCENE_LOCKED_LAYOUT.thief;
    thief.root.position.set(v.x,v.y,v.z);
    thief.root.rotation.y=THREE.MathUtils.degToRad(v.yaw);
    thief.root.visible=true;
    thief.root.updateMatrixWorld(true);
  }
}

function snapFinalSecurityThiefSceneWhileBlack(){

  applyLockedFinalSceneLayout();

  const toxic=getEditableThief?.();
  const security=questGetPolice?.();
  const D=THREE.MathUtils.degToRad;

  initSecurityOldTalkPanelTargets(security);
  const shared=SECURITY_OLD_TALK_PANEL.target;
  const R=THREE.MathUtils.radToDeg;

  const p={
    leftArm:{x:R(shared.leftArm.x),y:R(shared.leftArm.y),z:R(shared.leftArm.z)},
    leftForeArm:{x:R(shared.leftForeArm.x),y:R(shared.leftForeArm.y),z:R(shared.leftForeArm.z)},
    leftHand:{x:R(shared.leftHand.x),y:R(shared.leftHand.y),z:R(shared.leftHand.z)},
    rightArm:{x:R(shared.rightArm.x),y:R(shared.rightArm.y),z:R(shared.rightArm.z)},
    rightForeArm:{x:R(shared.rightForeArm.x),y:R(shared.rightForeArm.y),z:R(shared.rightForeArm.z)},
    rightHand:{x:R(shared.rightHand.x),y:R(shared.rightHand.y),z:R(shared.rightHand.z)}
  };

  if(toxic?.root){
    toxic.root.visible=true;

    toxic.root.traverse(o=>{
      if(o?.isMesh){
        o.visible=true;
        o.frustumCulled=false;
      }
    });

    toxic.state="idle";
    toxic.timer=0;

    if(typeof applyThiefHandcuffPose==="function"){
      applyThiefHandcuffPose();
    }else if(typeof applyThiefHandcuffEditorPose==="function"){
      applyThiefHandcuffEditorPose();
    }

    toxic.root.updateMatrixWorld(true);
  }

  if(security?.root){
    const b=getBones(security);

    if(b.leftArm){
      b.leftArm.rotation.set(D(p.leftArm.x),D(p.leftArm.y),D(p.leftArm.z));
    }
    if(b.leftForeArm){
      b.leftForeArm.rotation.set(D(p.leftForeArm.x),D(p.leftForeArm.y),D(p.leftForeArm.z));
    }
    if(b.leftHand){
      const r=getRest(security,b.leftHand);
      b.leftHand.rotation.set(
        r.x+D(p.leftHand.x),
        r.y+D(p.leftHand.y),
        r.z+D(p.leftHand.z)
      );
    }

    security.root.updateMatrixWorld(true);
    mirrorSecurityTalkBoneWorld(security,b.leftShoulder,b.rightShoulder);
    mirrorSecurityTalkBoneWorld(security,b.leftArm,b.rightArm);
    mirrorSecurityTalkBoneWorld(security,b.leftForeArm,b.rightForeArm);
    mirrorSecurityTalkBoneWorld(security,b.leftHand,b.rightHand);
    security.root.updateMatrixWorld(true);

    if(!SECURITY_POSE_EDITOR.bones.leftArm){
      cacheSecurityPoseEditorBones();
    }

    for(const [key,v] of Object.entries(SECURITY_TALK2.thumb||{})){
      const bone=SECURITY_POSE_EDITOR.bones[key];
      const rest=SECURITY_POSE_EDITOR.rest[key];
      if(!bone || !rest) continue;

      bone.rotation.set(
        rest.x+D(v.x||0),
        rest.y+D(v.y||0),
        rest.z+D(v.z||0)
      );
    }

    security.root.updateMatrixWorld(true);
  }
}

function setFinalSceneBlackout(active,instant=false){
  const fade=document.getElementById("sceneFade");
  if(!fade) return;

  document.body.classList.toggle(
    "final-security-blackout",
    active
  );

  Object.assign(fade.style,{
    position:"fixed",
    inset:"0",
    width:"100vw",
    height:"100vh",
    background:"#000",
    opacity:active ? "1" : "0",
    visibility:active ? "visible" : "hidden",
    pointerEvents:active ? "auto" : "none",
    zIndex:"2147483647",
    transition:instant ? "none" : "opacity .30s ease"
  });

  fade.style.setProperty(
    "background",
    "#000",
    "important"
  );

  fade.style.setProperty(
    "opacity",
    active ? "1" : "0",
    "important"
  );

  fade.style.setProperty(
    "visibility",
    active ? "visible" : "hidden",
    "important"
  );

  fade.style.setProperty(
    "z-index",
    "2147483647",
    "important"
  );

  fade.style.setProperty(
    "pointer-events",
    active ? "auto" : "none",
    "important"
  );

  fade.classList.toggle("active",active);
}

function summonPoliceForFinalScene(){
  if(STOREKEEPER_FINAL.policeSummoned) return;

  STOREKEEPER_FINAL.policeSummoned=true;
  STOREKEEPER_FINAL.finishing=true;
  STOREKEEPER_FINAL.lastPresenceState=true;
  gameplayInputEnabled=false;

  if(pickupPrompt) pickupPrompt.style.display="none";
  if(slotPrompt) slotPrompt.style.display="none";

  const toxic=getEditableThief();
  const security=questGetPolice();

  setFinalSceneBlackout(true,true);

  requestAnimationFrame(()=>{

    setFinalSceneBlackout(true,true);

    applyLockedFinalSceneLayout();

    if(toxic?.root){
      toxic.root.visible=true;
      toxic.root.traverse(o=>{
        if(o?.isMesh){
          o.visible=true;
          o.frustumCulled=false;
        }
      });
      toxic.state="idle";
      toxic.timer=0;
      applyThiefHandcuffPose();
      toxic.root.updateMatrixWorld(true);
    }

    if(security?.root){
      security.root.visible=true;
      security.root.traverse(o=>{
        if(o?.isMesh){
          o.visible=true;
        }
      });
      security.state="talk";
      security.timer=0;
      security.root.updateMatrixWorld(true);

      security.__talkStartupState=null;
      security.__rightTalkCycleStart=0;
      security.__normalTalk2GestureStart=performance.now();
    }

    SECURITY_TALK2.gestureStart=performance.now();
    SECURITY_TALK2.active=true;

    let hiddenFrames=0;

    const settleWhileBlack=()=>{
      setFinalSceneBlackout(true,true);
      applyLockedFinalSceneLayout();
      snapFinalSecurityThiefSceneWhileBlack();

      hiddenFrames++;

      if(hiddenFrames<18){
        requestAnimationFrame(settleWhileBlack);
        return;
      }

      setFinalSecurityDialogueFacing("player");

      questStartDialogue("SECURITY",[
        "Good work. We got him.",
        "You did the right thing calling me.",
        "Stay here. I'll handle him.",
        "You're not going anywhere. Keep your hands where I can see them.",
        "All right. I've got him under control.",
        "Thanks for your help. You handled this exactly right.",
        "The case is closed.",
      "Thanks for your help."
      ],()=>{
        SECURITY_TALK2.active=false;
        SECURITY_TALK2.gestureStart=0;
        FINAL_SECURITY_DIALOGUE_FACING.active=false;
        FINAL_ARREST_FLOW.active=true;
        FINAL_ARREST_FLOW.finished=false;
        completeFinalArrestSequence();
      });

      let talkHiddenFrames=0;

      const revealAfterTalkSettles=()=>{
        setFinalSceneBlackout(true,true);
        applyLockedFinalSceneLayout();

        talkHiddenFrames++;

        if(talkHiddenFrames<6){
          requestAnimationFrame(revealAfterTalkSettles);
          return;
        }

        const fade=document.getElementById("sceneFade");
        if(fade){
          fade.style.transition="opacity .42s ease";
        }

        requestAnimationFrame(()=>{
          const fade=document.getElementById("sceneFade");

          document.body.classList.remove(
            "final-security-blackout"
          );

          if(fade){
            fade.style.setProperty(
              "transition",
              "opacity .34s ease",
              "important"
            );
          }

          requestAnimationFrame(()=>{
            setFinalSceneBlackout(false,false);
          });
        });
      };

      requestAnimationFrame(revealAfterTalkSettles);
    };

    requestAnimationFrame(settleWhileBlack);
  });
}
function finishStorekeeperCase(){
  if(STOREKEEPER_FINAL.thiefDialogueDone) return;

  STOREKEEPER_FINAL.thiefDialogueDone=true;

  POLICE_RADIO.callReady=true;

  questSetStage("call_security");
  questShowClue(
    "The thief confessed · use the Police Radio to call Security.",
    3600
  );
}
function usePoliceRadio(){
  if(!POLICE_RADIO.owned || POLICE_RADIO.calling) return;

  if(!POLICE_RADIO.callReady || QUEST.stage!=="call_security"){
    questShowClue("Nothing important to report yet.",1800);
    return;
  }

  POLICE_RADIO.calling=true;

  gameplayInputEnabled=false;

  questStartDialogue("RADIO",[
    "PLAYER: Security, come in. I found the man from the wallet.",
    "PLAYER: He confessed. He's the one who stole the jewellery and the cash.",
    "SECURITY: Copy that. Stay with him. I'm on my way."
  ],()=>{
    POLICE_RADIO.callReady=false;
    POLICE_RADIO.calling=false;

    setFinalSceneBlackout(true,false);

    setTimeout(()=>{
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          summonPoliceForFinalScene();
        });
      });
    },320);
  });
}

function ensurePoliceRadioPrompt(){
  if(POLICE_RADIO.prompt) return POLICE_RADIO.prompt;

  const el=document.createElement("div");
  el.id="policeRadioPrompt";
  el.textContent="E · CALL POLICE";

  Object.assign(el.style,{
    position:"fixed",
    left:"50%",
    bottom:"92px",
    transform:"translateX(-50%)",
    zIndex:"17000",
    display:"none",
    padding:"10px 18px",
    borderRadius:"8px",
    background:"rgba(10,12,16,.94)",
    border:"1px solid rgba(255,255,255,.22)",
    color:"#fff",
    font:"700 14px Arial",
    letterSpacing:".08em",
    whiteSpace:"nowrap",
    pointerEvents:"none",
    opacity:"1",
    transition:"none",
    animation:"none"
  });

  document.body.appendChild(el);
  POLICE_RADIO.prompt=el;
  return el;
}

function showPoliceRadioPrompt(){
  const el=ensurePoliceRadioPrompt();

  const show=
    POLICE_RADIO.owned &&
    POLICE_RADIO.callReady &&
    QUEST.stage==="call_security" &&
    !QUEST.dialogueActive &&
    !POLICE_RADIO.calling;

  el.style.display=show ? "block" : "none";
  el.style.opacity="1";

  if(show && pickupPrompt){
    pickupPrompt.style.display="none";
  }
}

function talkToStorekeeperFinal(){
  const toxic=globalThis.npcs?.find(n=>n?.name==="toxicMan");
  if(toxic){
    toxic.state="talk";
    toxic.timer=0;
  }

  questStartDialogue("THIEF",[
    "Wait... what are you doing here?",
    "You found the wallet, didn't you?",
    "Fine. You got me.",
    "I took the jewellery, the cash, the rings and the other valuables.",
    "I thought I could hide here until everyone stopped looking.",
    "Don't call security. We can forget this happened."
  ],finishStorekeeperCase);
}

const CASINO_CLAW=ClawMachineBuilders.createClawMachine({
  THREE,
  scene,
  loadGLBFromCandidates,
  cloneMaterials,
  registerCasinoEditable
});


const CLAW_MACHINE_TUNING_DEFAULTS=Object.freeze({
  scaleX:1.00,
  scaleY:1.01,
  scaleZ:.91
});
const CLAW_MACHINE_TUNING=window.CLAW_MACHINE_TUNING||(window.CLAW_MACHINE_TUNING={...CLAW_MACHINE_TUNING_DEFAULTS});


let __clawBaseTransformCaptured=false;
let __clawBasePos=null;
let __clawBaseScale=null;
let __clawBaseBox=null;

function applyClawMachineHeightTuning(){
  if(!CASINO_CLAW?.root) return;

  if(!__clawBaseTransformCaptured){
    __clawBasePos=CASINO_CLAW.root.position.clone();
    __clawBaseScale=CASINO_CLAW.root.scale.clone();

    const box=new THREE.Box3().setFromObject(CASINO_CLAW.root);
    const size=new THREE.Vector3();
    box.getSize(size);
    __clawBaseBox={size};

    __clawBaseTransformCaptured=true;
  }

  const sx=CLAW_MACHINE_TUNING.scaleX;
  const sy=CLAW_MACHINE_TUNING.scaleY;
  const sz=CLAW_MACHINE_TUNING.scaleZ;

  CASINO_CLAW.root.scale.set(
    __clawBaseScale.x*sx,
    __clawBaseScale.y*sy,
    __clawBaseScale.z*sz
  );


  const extraY=(__clawBaseBox?.size?.y||0)*(sy-1)*0.5;
  CASINO_CLAW.root.position.set(
    __clawBasePos.x,
    __clawBasePos.y+extraY,
    __clawBasePos.z
  );
}


const CLAW_LEFT_HAND_POSE_DEFAULTS=Object.freeze({
  armX:57,armY:-29,armZ:-41,
  foreX:-20,foreY:-18,foreZ:0,
  handX:-37,handY:2,handZ:23,
  fingerCurl:.36
});
const CLAW_LEFT_HAND_POSE=
  window.CLAW_LEFT_HAND_POSE ||
  (window.CLAW_LEFT_HAND_POSE={...CLAW_LEFT_HAND_POSE_DEFAULTS});

function applyClawLeftHandPose(c,dt=.016){
  if(!c?.ready || !c?.model) return;

  const state=getPlayerProceduralState(c);
  const b=state.bones;
  const D=THREE.MathUtils.degToRad;


  if(!CASINO_CLAW_INTERACTION.handStartQ){
    const controlledBones=[
      b.leftShoulder,
      b.leftArm,
      b.leftForeArm,
      b.leftHand,
      ...(state.fingers||[])
        .filter(f=>f.side==="left" && f.bone)
        .map(f=>f.bone)
    ].filter(Boolean);

    const startQ=new Map();
    for(const bone of controlledBones){
      startQ.set(bone,bone.quaternion.clone());
    }


    const restoreRest=(bone)=>{
      if(bone && state.restQ.has(bone)){
        bone.quaternion.copy(state.restQ.get(bone));
      }
    };

    restoreRest(b.leftShoulder);
    restoreRest(b.leftArm);
    restoreRest(b.leftForeArm);
    restoreRest(b.leftHand);

    for(const f of (state.fingers||[])){
      if(f.side==="left") restoreRest(f.bone);
    }


    if(b.leftShoulder){
      setPlayerBoneAxisRotation(
        c,state,b.leftShoulder,PLAYER_AXIS_RIGHT,D(-3.0)
      );
      addPlayerBoneAxisRotation(
        c,b.leftShoulder,PLAYER_AXIS_UP,D(-1.5)
      );
    }

    setPlayerBoneAxisRotation(
      c,state,b.leftArm,PLAYER_AXIS_RIGHT,D(CLAW_LEFT_HAND_POSE.armX)
    );
    addPlayerBoneAxisRotation(
      c,b.leftArm,PLAYER_AXIS_UP,D(CLAW_LEFT_HAND_POSE.armY)
    );
    addPlayerBoneAxisRotation(
      c,b.leftArm,PLAYER_AXIS_FORWARD,D(CLAW_LEFT_HAND_POSE.armZ)
    );

    setPlayerBoneAxisRotation(
      c,state,b.leftForeArm,PLAYER_AXIS_RIGHT,D(CLAW_LEFT_HAND_POSE.foreX)
    );
    addPlayerBoneAxisRotation(
      c,b.leftForeArm,PLAYER_AXIS_UP,D(CLAW_LEFT_HAND_POSE.foreY)
    );
    addPlayerBoneAxisRotation(
      c,b.leftForeArm,PLAYER_AXIS_FORWARD,D(CLAW_LEFT_HAND_POSE.foreZ)
    );

    setPlayerBoneAxisRotation(
      c,state,b.leftHand,PLAYER_AXIS_RIGHT,D(CLAW_LEFT_HAND_POSE.handX)
    );
    addPlayerBoneAxisRotation(
      c,b.leftHand,PLAYER_AXIS_UP,D(CLAW_LEFT_HAND_POSE.handY)
    );
    addPlayerBoneAxisRotation(
      c,b.leftHand,PLAYER_AXIS_FORWARD,D(CLAW_LEFT_HAND_POSE.handZ)
    );

    for(const f of (state.fingers||[])){
      if(f.side!=="left" || !f.bone) continue;

      const n=String(f.name||f.bone.name||"").toLowerCase();
      const isThumb=n.includes("thumb");
      const m=n.match(/(?:thumb|index|middle|ring|pinky|little)[^0-9]*([1-4])/);
      const seg=m ? Number(m[1]) : 2;
      const gain=seg===1?.65:seg===2?.90:seg===3?1.06:1.12;

      setPlayerBoneAxisRotation(
        c,
        state,
        f.bone,
        PLAYER_AXIS_RIGHT,
        (isThumb?.25:.42)*CLAW_LEFT_HAND_POSE.fingerCurl*gain
      );
    }

    const targetQ=new Map();
    for(const bone of controlledBones){
      targetQ.set(bone,bone.quaternion.clone());
    }


    for(const [bone,q] of startQ){
      bone.quaternion.copy(q);
    }

    CASINO_CLAW_INTERACTION.handStartQ=startQ;
    CASINO_CLAW_INTERACTION.handTargetQ=targetQ;
    CASINO_CLAW_INTERACTION.handPoseBlend=0;
  }


  CASINO_CLAW_INTERACTION.handPoseBlend=Math.min(
    1,
    CASINO_CLAW_INTERACTION.handPoseBlend + Math.max(.001,dt)*2.20
  );

  CASINO_CLAW_INTERACTION.handReady=
    CASINO_CLAW_INTERACTION.handPoseBlend>=.995;

  const p=CASINO_CLAW_INTERACTION.handPoseBlend;


  const t=p*p*p*(p*(p*6-15)+10);

  for(const [bone,startQ] of CASINO_CLAW_INTERACTION.handStartQ){
    const targetQ=CASINO_CLAW_INTERACTION.handTargetQ?.get(bone);
    if(!targetQ) continue;
    bone.quaternion.copy(startQ).slerp(targetQ,t);
  }

  c.model.updateMatrixWorld(true);
}





const CASINO_CLAW_INTERACTION={
  active:false,
  handPoseBlend:0,
  handStartQ:null,
  handTargetQ:null,


  activationPosition:new THREE.Vector3(-9.963,0.190,-7.573),


  activationYawDeg:92.1,


  activationSlices:[

    {z:-7.573, xMin:-9.963, xMax:-9.963},


    {z:-7.607, xMin:-10.122, xMax:-9.963},


    {z:-7.628, xMin:-10.126, xMax:-9.963},


    {z:-7.748, xMin:-10.126, xMax:-9.988},


    {z:-8.038, xMin:-10.155, xMax:-9.885},


    {z:-8.220, xMin:-10.180, xMax:-9.860}
  ],
  activationZMargin:.105,
  activationXMargin:.090,
  nearbyToleranceY:.12,


  activationYawMinDeg:73.0,
  activationYawMaxDeg:103.0,


  multiAnchors:[
    {
      id:"A1",
      x:-9.988, y:.190, z:-8.029, yawDeg:78.4,
      pose:{armX:46,armY:-29,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-37,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A2",
      x:-9.988, y:.190, z:-7.764, yawDeg:73.4,
      pose:{armX:57,armY:-24,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-39,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A3",
      x:-9.988, y:.190, z:-7.855, yawDeg:104.0,
      pose:{armX:44,armY:-24,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-39,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A4",
      x:-9.988, y:.190, z:-7.655, yawDeg:79.1,
      pose:{armX:60.5,armY:-24,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-39,handY:8,handZ:23,fingerCurl:.64}
    },
    {
      id:"A5",
      x:-9.988, y:.190, z:-7.641, yawDeg:95.4,
      pose:{armX:53,armY:-24,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-39,handY:8,handZ:23,fingerCurl:.64}
    },
    {
      id:"A6",
      x:-9.990, y:.190, z:-7.654, yawDeg:107.4,
      pose:{armX:39.5,armY:-29,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-37,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A7",
      x:-9.988, y:.190, z:-7.669, yawDeg:110.3,
      pose:{armX:33.5,armY:-29,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-37,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A8",
      x:-9.988, y:.190, z:-7.745, yawDeg:67.6,
      pose:{armX:57,armY:-21.5,armZ:-41,foreX:-20,foreY:-10,foreZ:0,handX:-39.5,handY:2,handZ:23,fingerCurl:.54}
    },
    {
      id:"A9",
      x:-9.990, y:.190, z:-7.527, yawDeg:74.9,
      pose:{armX:67,armY:-17.5,armZ:-39.5,foreX:-20,foreY:-18,foreZ:0,handX:-57,handY:4,handZ:27.5,fingerCurl:.36}
    },
    {
      id:"A10",
      x:-9.988, y:.190, z:-7.655, yawDeg:109.8,
      pose:{armX:41.5,armY:-17.5,armZ:-39.5,foreX:-20,foreY:-18,foreZ:0,handX:-57,handY:4,handZ:27.5,fingerCurl:.36}
    },
    {
      id:"A11",
      x:-9.988, y:.190, z:-7.886, yawDeg:60.8,
      pose:{armX:55,armY:-19.5,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-37,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A12",
      x:-9.988, y:.190, z:-7.739, yawDeg:94.0,
      pose:{armX:43.5,armY:-29,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-37,handY:2,handZ:23,fingerCurl:.36}
    },
    {
      id:"A13",
      x:-9.988, y:.190, z:-7.708, yawDeg:59.9,
      pose:{armX:65,armY:-12,armZ:-41,foreX:-20,foreY:-18,foreZ:0,handX:-51,handY:2,handZ:23,fingerCurl:.36}
    }
  ],
  selectedAnchor:null,


  aligning:false,
  alignProgress:0,
  alignStartPos:new THREE.Vector3(),
  alignStartYaw:0,


  alignBodyStartQ:null,
  alignBodyBones:null,
  alignYawDelta:0,
  alignMoveDistance:0,

  paidRoundReady:false,
  roundInProgress:false,
  awaitingReplay:false,
  lastMachinePhase:"idle",
  handReady:false,

  softRotateActive:false,
  softRotateStartYaw:0,
  softRotateTargetYaw:0,
  softRotateProgress:0,
  softRotateFeetStartQ:null,
  softRotateFeetBones:null,

  exitSettledSince:0,
  exitDelayMs:240
};

function casinoClawPositionAllowed(){
  if(!player?.root) return false;
  if(activeWorldZone!=="leftRoom") return false;

  const p=new THREE.Vector3();
  player.root.getWorldPosition(p);


  const xMin=-10.20;
  const xMax=-9.80;
  const zMin=-8.16;
  const zMax=-7.52;

  const dy=Math.abs(p.y-.190);

  return (
    p.x>=xMin &&
    p.x<=xMax &&
    p.z>=zMin &&
    p.z<=zMax &&
    dy<=.18
  );
}




function getNearestCasinoClawAnchor(){
  if(!player?.root) return null;

  const anchors=CASINO_CLAW_INTERACTION.multiAnchors||[];
  if(!anchors.length) return null;

  const p=new THREE.Vector3();
  player.root.getWorldPosition(p);

  let best=null;
  let bestDistance=Infinity;

  for(const a of anchors){
    const dx=p.x-a.x;
    const dz=p.z-a.z;
    const distance=Math.hypot(dx,dz);

    if(distance<bestDistance){
      bestDistance=distance;
      best=a;
    }
  }

  return best;
}

function applyCasinoClawAnchorHandPose(anchor){
  if(!anchor?.pose) return;

  Object.assign(CLAW_LEFT_HAND_POSE,anchor.pose);


  document.querySelectorAll("[data-cfh-key]").forEach(input=>{
    const key=input.dataset.cfhKey;
    if(!(key in CLAW_LEFT_HAND_POSE)) return;
    input.value=CLAW_LEFT_HAND_POSE[key];
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });
}

function normalizeAngleRad(a){
  return Math.atan2(Math.sin(a),Math.cos(a));
}





function restoreCasinoClawAlignBodyPose(){
  const startQ=CASINO_CLAW_INTERACTION.alignBodyStartQ;
  if(startQ){
    for(const [bone,q] of startQ){
      bone.quaternion.copy(q);
    }
  }

  CASINO_CLAW_INTERACTION.alignBodyStartQ=null;
  CASINO_CLAW_INTERACTION.alignBodyBones=null;
  CASINO_CLAW_INTERACTION.alignYawDelta=0;
  CASINO_CLAW_INTERACTION.alignMoveDistance=0;

  player?.model?.updateMatrixWorld?.(true);
}

function beginCasinoClawAutoAlign(){
  if(!player?.root) return;

  const anchor=getNearestCasinoClawAnchor();
  if(!anchor) return;

  CASINO_CLAW_INTERACTION.selectedAnchor=anchor;
  applyCasinoClawAnchorHandPose(anchor);

  CASINO_CLAW_INTERACTION.aligning=false;
  CASINO_CLAW_INTERACTION.alignProgress=0;
  CASINO_CLAW_INTERACTION.handReady=false;

  CASINO_CLAW_INTERACTION.softRotateActive=true;
  CASINO_CLAW_INTERACTION.softRotateProgress=0;
  CASINO_CLAW_INTERACTION.exitSettledSince=0;
  CASINO_CLAW_INTERACTION.softRotateStartYaw=player.root.rotation.y;
  CASINO_CLAW_INTERACTION.softRotateTargetYaw=
    THREE.MathUtils.degToRad(anchor.yawDeg);

  const proc=getPlayerProceduralState(player);
  const pb=proc?.bones;
  const feetBones={
    leftUpLeg:pb?.leftUpLeg,
    rightUpLeg:pb?.rightUpLeg,
    leftKnee:pb?.leftKnee,
    rightKnee:pb?.rightKnee,
    leftFoot:pb?.leftFoot,
    rightFoot:pb?.rightFoot
  };
  const feetStartQ=new Map();
  for(const bone of Object.values(feetBones)){
    if(bone) feetStartQ.set(bone,bone.quaternion.clone());
  }
  CASINO_CLAW_INTERACTION.softRotateFeetBones=feetBones;
  CASINO_CLAW_INTERACTION.softRotateFeetStartQ=feetStartQ;

  for(const k of Object.keys(keys||{})) keys[k]=false;
  playerMoving=false;

  setCasinoClawInteractionActive(true);
  refreshCasinoClawHandAfterE(true);
}

function updateCasinoClawAutoAlign(dt=.016){
  CASINO_CLAW_INTERACTION.aligning=false;
  return false;
}


function updateCasinoClawSoftRotation(dt=.016){
  if(
    !CASINO_CLAW_INTERACTION.softRotateActive ||
    !player?.root
  ){
    return false;
  }

  const safeDt=THREE.MathUtils.clamp(
    Number.isFinite(dt) ? dt : .016,
    .001,
    .033
  );

  // Very gentle rotation: about 0.8 s to settle.
  CASINO_CLAW_INTERACTION.softRotateProgress=Math.min(
    1,
    CASINO_CLAW_INTERACTION.softRotateProgress + safeDt*1.05
  );

  const p=CASINO_CLAW_INTERACTION.softRotateProgress;
  const t=p*p*(3-2*p);

  const start=CASINO_CLAW_INTERACTION.softRotateStartYaw;
  const target=CASINO_CLAW_INTERACTION.softRotateTargetYaw;
  const delta=normalizeAngleRad(target-start);

  player.root.rotation.y=start+delta*t;

  const feet=CASINO_CLAW_INTERACTION.softRotateFeetBones;
  const feetStart=CASINO_CLAW_INTERACTION.softRotateFeetStartQ;

  if(feet && feetStart){
    const envelope=Math.sin(Math.PI*p);
    const step=envelope*envelope;
    const dir=Math.sign(delta)||1;
    const D=THREE.MathUtils.degToRad;

    const restoreAndAdd=(bone,axis,angle)=>{
      if(!bone) return;
      const q=feetStart.get(bone);
      if(q) bone.quaternion.copy(q);
      addPlayerBoneAxisRotation(player,bone,axis,angle);
    };

    restoreAndAdd(
      feet.leftUpLeg,
      PLAYER_AXIS_RIGHT,
      D(1.15)*step*dir
    );
    restoreAndAdd(
      feet.rightUpLeg,
      PLAYER_AXIS_RIGHT,
      D(-1.35)*step*dir
    );

    restoreAndAdd(
      feet.leftKnee,
      PLAYER_AXIS_RIGHT,
      D(.70)*step
    );
    restoreAndAdd(
      feet.rightKnee,
      PLAYER_AXIS_RIGHT,
      D(.55)*step
    );

    restoreAndAdd(
      feet.leftFoot,
      PLAYER_AXIS_UP,
      D(-.85)*step*dir
    );
    restoreAndAdd(
      feet.rightFoot,
      PLAYER_AXIS_UP,
      D(.95)*step*dir
    );

    restoreAndAdd(
      feet.leftFoot,
      PLAYER_AXIS_FORWARD,
      D(.40)*step
    );
    restoreAndAdd(
      feet.rightFoot,
      PLAYER_AXIS_FORWARD,
      D(-.30)*step
    );
  }

  if(p>=1){
    player.root.rotation.y=target;

    const feet=CASINO_CLAW_INTERACTION.softRotateFeetBones;
    const feetStart=CASINO_CLAW_INTERACTION.softRotateFeetStartQ;
    if(feet && feetStart){
      for(const bone of Object.values(feet)){
        const q=feetStart.get(bone);
        if(bone && q) bone.quaternion.copy(q);
      }
    }

    CASINO_CLAW_INTERACTION.softRotateFeetBones=null;
    CASINO_CLAW_INTERACTION.softRotateFeetStartQ=null;
    CASINO_CLAW_INTERACTION.softRotateActive=false;
  }

  return true;
}

function refreshCasinoClawHandAfterE(forceRebuild=true){
  if(!player?.ready || !player?.model) return;


  player.root?.updateMatrixWorld?.(true);
  player.model.updateMatrixWorld(true);

  if(forceRebuild || !CASINO_CLAW_INTERACTION.handTargetQ){
    CASINO_CLAW_INTERACTION.handPoseBlend=0;
    CASINO_CLAW_INTERACTION.handStartQ=null;
    CASINO_CLAW_INTERACTION.handTargetQ=null;
  }


  applyClawLeftHandPose(
    player,
    typeof frameDt==="number" ? frameDt : .016
  );


  requestAnimationFrame(()=>{
    if(!CASINO_CLAW_INTERACTION.active) return;

    player.root?.updateMatrixWorld?.(true);
    player.model?.updateMatrixWorld?.(true);


    applyClawLeftHandPose(
      player,
      typeof frameDt==="number" ? frameDt : .016
    );
  });
}

function setCasinoClawInteractionActive(active){
  const wasActive=CASINO_CLAW_INTERACTION.active;
  CASINO_CLAW_INTERACTION.active=!!active;
  if(CASINO_CLAW_INTERACTION.active && !wasActive){
    CASINO_CLAW_INTERACTION.handReady=false;
    CASINO_CLAW_INTERACTION.handPoseBlend=0;
    CASINO_CLAW_INTERACTION.handStartQ=null;
    CASINO_CLAW_INTERACTION.handTargetQ=null;


    refreshCasinoClawHandAfterE();
  }
if(!active){
    CASINO_CLAW_INTERACTION.exitSettledSince=0;
    CASINO_CLAW_INTERACTION.softRotateActive=false;
    CASINO_CLAW_INTERACTION.softRotateProgress=0;
    CASINO_CLAW_INTERACTION.softRotateFeetBones=null;
    CASINO_CLAW_INTERACTION.softRotateFeetStartQ=null;
    CASINO_CLAW_INTERACTION.handReady=false;
    CASINO_CLAW_INTERACTION.paidRoundReady=false;
    CASINO_CLAW_INTERACTION.roundInProgress=false;
    CASINO_CLAW_INTERACTION.awaitingReplay=false;
    CASINO_CLAW_INTERACTION.lastMachinePhase=
      CASINO_CLAW?.state?.phase || "idle";

    CASINO_CLAW_INTERACTION.handPoseBlend=0;
    CASINO_CLAW_INTERACTION.handStartQ=null;
    CASINO_CLAW_INTERACTION.handTargetQ=null;

    if(CASINO_CLAW_INTERACTION.alignBodyStartQ){
      restoreCasinoClawAlignBodyPose();
    }
  }

  if(CASINO_CLAW.prompt){
    CASINO_CLAW.prompt.textContent=active
      ? "E · EXIT CLAW MACHINE"
      : "E · USE CLAW MACHINE · 50¢";
  }


  if(active){
    for(const k of Object.keys(keys||{})) keys[k]=false;
  }
}


function casinoClawExitIsReady(){
  return (
    CASINO_CLAW_INTERACTION.active &&
    CASINO_CLAW_INTERACTION.handReady &&
    !CASINO_CLAW_INTERACTION.softRotateActive &&
    CASINO_CLAW_INTERACTION.exitSettledSince>0 &&
    performance.now()-CASINO_CLAW_INTERACTION.exitSettledSince
      >=CASINO_CLAW_INTERACTION.exitDelayMs
  );
}

function setupCasinoClawInteraction(){
  CASINO_CLAW.prompt=document.createElement("div");
  CASINO_CLAW.prompt.id="casinoClawPrompt";
  CASINO_CLAW.prompt.className="interactionPromptUnified";
  CASINO_CLAW.prompt.textContent="E · USE CLAW MACHINE · 50¢";
  CASINO_CLAW.prompt.style.display="none";
  document.body.appendChild(CASINO_CLAW.prompt);

  const buyClawRound=()=>{
    if(!canAffordCasinoClaw()){
      setCasinoClawPaymentMessage(
        "NOT ENOUGH COINS · 50¢ REQUIRED",
        1700
      );
      return false;
    }

    if(!spendCasinoClawCost()) return false;

    CASINO_CLAW_INTERACTION.paidRoundReady=true;
    CASINO_CLAW_INTERACTION.roundInProgress=false;
    CASINO_CLAW_INTERACTION.awaitingReplay=false;
    if(CASINO_CLAW_INTERACTION.active){
      CASINO_CLAW_INTERACTION.handReady=true;
    }
    CASINO_CLAW_INTERACTION.lastMachinePhase=
      CASINO_CLAW?.state?.phase || "idle";

    setCasinoClawPaymentMessage(
      `50¢ INSERTED · ${PLAYER_MONEY.coinCents}¢ LEFT`,
      1200
    );

    return true;
  };

  addEventListener("keydown",e=>{
    if(activeWorldZone!=="leftRoom") return;

    const isE=
      e.code==="KeyE" ||
      String(e.key||"").toLowerCase()==="e";

    if(isE && !e.repeat){
      if(CASINO_CLAW_INTERACTION.active){
        e.preventDefault();
        e.stopPropagation();

        if(CASINO_CLAW_INTERACTION.awaitingReplay){
          if(!casinoClawExitIsReady()) return;
          buyClawRound();
          return;
        }

        if(!casinoClawExitIsReady()) return;

        setCasinoClawInteractionActive(false);
        return;
      }

      if(casinoClawPositionAllowed()){
        e.preventDefault();
        e.stopPropagation();

        if(!buyClawRound()) return;

        beginCasinoClawAutoAlign();
        return;
      }
    }

    if(!CASINO_CLAW_INTERACTION.active) return;

    const st=CASINO_CLAW.state;

    if(e.code==="Escape"){
      e.preventDefault();
      e.stopPropagation();

      if(!casinoClawExitIsReady()) return;

      setCasinoClawInteractionActive(false);
      return;
    }

    if(CASINO_CLAW_INTERACTION.awaitingReplay){
      if(e.key.startsWith("Arrow") || e.code==="Space"){
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    if(!CASINO_CLAW_INTERACTION.handReady){
      if(e.key.startsWith("Arrow") || e.code==="Space"){
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    if(e.key==="ArrowLeft") st.x-=.06;
    if(e.key==="ArrowRight") st.x+=.06;
    if(e.key==="ArrowUp") st.z-=.06;
    if(e.key==="ArrowDown") st.z+=.06;

    if(e.key.startsWith("Arrow")){
      e.preventDefault();
    }

    st.x=THREE.MathUtils.clamp(st.x,-.28,.28);
    st.z=THREE.MathUtils.clamp(st.z,-.28,.28);

    if(
      e.code==="Space" &&
      st.phase==="idle" &&
      CASINO_CLAW_INTERACTION.paidRoundReady &&
      !CASINO_CLAW_INTERACTION.roundInProgress
    ){
      e.preventDefault();

      CASINO_CLAW_INTERACTION.paidRoundReady=false;
      CASINO_CLAW_INTERACTION.roundInProgress=true;
      CASINO_CLAW_INTERACTION.lastMachinePhase="idle";

      st.phase="down";
      st.holding=null;
      st.falling=null;
      st.fallSpeed=0;
      return;
    }

    if(e.code==="Space"){
      e.preventDefault();
    }
  },true);
}


function updateCasinoClawMachine(){
  applyClawMachineHeightTuning();

  ClawMachineBuilders.updateClawMachine(
    THREE,
    CASINO_CLAW
  );

  const st=CASINO_CLAW.state;

  if(CASINO_CLAW_INTERACTION.active){
    const previousPhase=
      CASINO_CLAW_INTERACTION.lastMachinePhase || "idle";

    if(
      CASINO_CLAW_INTERACTION.roundInProgress &&
      previousPhase!=="idle" &&
      st.phase==="idle"
    ){
      CASINO_CLAW_INTERACTION.roundInProgress=false;
      CASINO_CLAW_INTERACTION.paidRoundReady=false;
      CASINO_CLAW_INTERACTION.awaitingReplay=true;

      setCasinoClawPaymentMessage(
        "PLAY FINISHED · CONTINUE FOR 50¢?",
        1500
      );
    }

    CASINO_CLAW_INTERACTION.lastMachinePhase=st.phase;
  }

  if(CASINO_CLAW.prompt){
    const canInteract=
      activeWorldZone==="leftRoom" &&
      (
        CASINO_CLAW_INTERACTION.active ||
        casinoClawPositionAllowed()
      );

    CASINO_CLAW.prompt.style.display=
      canInteract ? "block" : "none";

    const paymentMessageActive=
      performance.now()<CASINO_CLAW_PAYMENT.messageUntil;

    if(paymentMessageActive){
      CASINO_CLAW.prompt.textContent=
        CASINO_CLAW_PAYMENT.message;
    }else if(CASINO_CLAW_INTERACTION.active){
      if(
        !CASINO_CLAW_INTERACTION.handReady ||
        CASINO_CLAW_INTERACTION.softRotateActive ||
        !casinoClawExitIsReady()
      ){
        CASINO_CLAW.prompt.textContent=
          "POSITIONING HAND...";
      }else if(CASINO_CLAW_INTERACTION.awaitingReplay){
        CASINO_CLAW.prompt.textContent=
          "E · CONTINUE · 50¢    ESC · EXIT";
      }else if(
        CASINO_CLAW_INTERACTION.paidRoundReady &&
        st.phase==="idle"
      ){
        CASINO_CLAW.prompt.textContent=
          "SPACE · PLAY    E · EXIT";
      }else if(CASINO_CLAW_INTERACTION.roundInProgress){
        CASINO_CLAW.prompt.textContent=
          "CLAW MACHINE · PLAYING    E · EXIT";
      }else{
        CASINO_CLAW.prompt.textContent=
          "E · EXIT CLAW MACHINE";
      }
    }else{
      CASINO_CLAW.prompt.textContent=
        "E · USE CLAW MACHINE · 50¢";
    }
  }

  if(
    CASINO_CLAW_INTERACTION.active &&
    activeWorldZone!=="leftRoom"
  ){
    setCasinoClawInteractionActive(false);
  }
}

setupCasinoClawInteraction();


const STREET_ASSETS={
  shortLamps:[],
  cars:[]
};
function loadGLBFromCandidates(paths,onLoad,onError){
  const candidates=Array.isArray(paths)?paths.filter(Boolean):[];
  let index=0;
  let lastError=null;
  const tryNext=()=>{
    if(index>=candidates.length){
      if(typeof onError==="function"){
        onError(lastError || new Error("Nessun percorso GLB valido."));
      }
      return;
    }
    const path=candidates[index++];
    loader.load(
      path,
      (gltf)=>{
        if(typeof onLoad==="function") onLoad(gltf,path);
      },
      undefined,
      (error)=>{
        lastError=error;
        tryNext();
      }
    );
  };
  tryNext();
}
function cloneMaterials(root){
  root.traverse((obj)=>{
    if(!obj.isMesh) return;
    obj.castShadow=false;
    obj.receiveShadow=true;
    if(Array.isArray(obj.material)){
      obj.material=obj.material.map((material)=>material?.clone?.() || material);
    }else if(obj.material){
      obj.material=obj.material.clone();
    }
  });
}

CasinoBuilders.loadCasinoStaticGLBs({
  THREE,
  scene,
  loadGLBFromCandidates,
  cloneMaterials,
  prepareCasinoEditableModel,
  prepareStaticGLB,
  registerCasinoEditable,
  onPokerLoaded:(poker)=>{
    casinoPokerTable=poker;
  },
  onFrameLoaded:(key,model)=>{
    CASINO_FRAME_EDITOR[key]=model;
  },
  onTvLoaded:(tv,tv2)=>{
    CASINO_MEDIA_RUNTIME.tv=tv;
    CASINO_MEDIA_RUNTIME.tv2=tv2;
    setTimeout(attachTvScreen,0);
    setTimeout(buildCasinoBettingSheet2,0);
  },
  onJukeboxLoaded:(jukebox,lightMaterials)=>{
    CASINO_MEDIA_RUNTIME.jukebox=jukebox;
    CASINO_MEDIA_RUNTIME.jukeboxLightMaterials.length=0;
    CASINO_MEDIA_RUNTIME.jukeboxLightMaterials.push(...lightMaterials);
    setJukeboxPower(false);
  },
  onReceptionLoaded:(reception)=>{
    casinoReception=reception;
  }
});

CasinoBuilders.buildCasinoEntryGeometry({
  THREE,
  scene,
  facadeMaterials,
  registerCasinoEditable,
  rebuildCasinoEditableColliders
});


function lcBuildGardenBoundaryFence(){
  buildGardenBoundaryFenceCollisions({
    state:LIGHT_COLLISION,
    boundaryFence:GARDEN_BOUNDARY_FENCE,
    makeBox:lcMakeBox,
    remember:(collider,meta={})=>rememberGardenCollision(
      GARDEN_COLLISION_EDITOR_REGISTRY,
      collider,
      meta
    )
  });

  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
  }
}
GardenBuilders.initGardenFenceSource(getGardenBuilderContext());

gardenBuild("buildGardenBoundaryFence");

const ROSE_FENCE_SIDE_EDITOR={
  step:.10,
  left:{x:-2.900,y:0,z:-0.200,scaleX:1.000,scaleZ:.990},
  right:{x:3.500,y:0,z:-0.100,scaleX:1.000,scaleZ:.990}
};
function roseFenceEditorState(side){
  return side==="left"
    ? ROSE_FENCE_SIDE_EDITOR.left
    : ROSE_FENCE_SIDE_EDITOR.right;
}
function applyIndependentRoseFenceTransforms(...args){
  return GardenBuilders.applyIndependentRoseFenceTransforms(getGardenBuilderContext(),...args);
}
function refreshIndependentRoseFenceEditors(){
  for(const side of ["left","right"]){
    const read=document.getElementById(`roseFence${side}Read`);
    if(!read) continue;
    const st=roseFenceEditorState(side);
    const garden=side==="left"?"tulips":"roses";
    const d=GARDEN_FLOWER_FENCE_EDIT[garden];
    const cx=(d.left.x+d.right.x)*.5;
    const cz=(d.front.z+d.back.z)*.5;
    read.textContent=
      `${side.toUpperCase()} ROSE FENCE\n`+
      `CENTER X ${cx.toFixed(3)} Y ${st.y.toFixed(3)} Z ${cz.toFixed(3)}\n`+
      `WIDTH X ${d.front.length.toFixed(3)}\n`+
      `DEPTH Z ${d.left.length.toFixed(3)}\n`+
      `SCALE X ${st.scaleX.toFixed(3)} Z ${st.scaleZ.toFixed(3)}`;
  }
}
function flowerFenceIsHorizontal(...args){
  return GardenBuilders.flowerFenceIsHorizontal(getGardenBuilderContext(),...args);
}
function flowerFenceSegmentEnds(...args){
  return GardenBuilders.flowerFenceSegmentEnds(getGardenBuilderContext(),...args);
}
function lcBuildGardenFlowerZoneFences(){
  buildGardenFlowerFenceCollisions({
    state:LIGHT_COLLISION,
    flowerFenceGroup:GARDEN_FLOWER_ZONE_FENCES,
    flowerFenceEdit:GARDEN_FLOWER_FENCE_EDIT,
    roseFenceEditorState,
    flowerFenceIsHorizontal,
    makeBox:lcMakeBox
  });

  if(COLLISION_DEBUG.enabled){
    rebuildCollisionDebugStatic();
  }
}

function centerOriginalRoseFencesInsideBeds(...args){
  return GardenBuilders.centerOriginalRoseFencesInsideBeds(getGardenBuilderContext(),...args);
}
function flowerFenceCurrentSelection(){
  const garden=
    document.getElementById("gardenFlowerFenceGarden")?.value ||
    "tulips";
  const side=
    document.getElementById("gardenFlowerFenceSide")?.value ||
    "front";
  return {
    garden,
    side,
    data:GARDEN_FLOWER_FENCE_EDIT[garden][side]
  };
}
function refreshGardenFlowerFenceEditor(){
  const read=document.getElementById("gardenFlowerFenceRead");
  if(!read) return;
  const {garden,side,data}=flowerFenceCurrentSelection();
  read.textContent=
    `${garden.toUpperCase()} · ${side.toUpperCase()}\n`+
    `x=${data.x.toFixed(3)}\n`+
    `z=${data.z.toFixed(3)}\n`+
    `length=${data.length.toFixed(3)}`;
}
gardenBuild("buildGardenFlowerZoneFences");
const RIGHT_ROSE_GROUP_EDITOR={
  x:1.000,
  y:0,
  z:0,
  scaleX:1,
  scaleY:1,
  scaleZ:1,
  moveStep:.10,
  scaleStep:.025
};
const LEFT_ROSE_GROUP_MIRROR={
  x:-1.000,
  y:0,
  z:0,
  scaleX:1,
  scaleY:1,
  scaleZ:1
};
function refreshRightRoseGroupEditor(){
  const read=document.getElementById("rightRoseGroupRead");
  if(!read) return;
  const baseX=GARDEN_WIDTH_RUNTIME.roseRightX;
  const baseZ=82.4390;
  read.textContent=
    `RIGHT ROSE GROUP\n`+
    `CENTER X ${(baseX+RIGHT_ROSE_GROUP_EDITOR.x).toFixed(3)} `+
    `Y ${RIGHT_ROSE_GROUP_EDITOR.y.toFixed(3)} `+
    `Z ${(baseZ+RIGHT_ROSE_GROUP_EDITOR.z).toFixed(3)}\n`+
    `OFFSET X ${RIGHT_ROSE_GROUP_EDITOR.x.toFixed(3)} `+
    `Y ${RIGHT_ROSE_GROUP_EDITOR.y.toFixed(3)} `+
    `Z ${RIGHT_ROSE_GROUP_EDITOR.z.toFixed(3)}\n`+
    `SCALE X ${RIGHT_ROSE_GROUP_EDITOR.scaleX.toFixed(3)} `+
    `Y ${RIGHT_ROSE_GROUP_EDITOR.scaleY.toFixed(3)} `+
    `Z ${RIGHT_ROSE_GROUP_EDITOR.scaleZ.toFixed(3)}`;
}

gardenBuild("loadRealGardenFlowers");

const GARDEN_PALM_EDITOR={
  selected:0,
  moveStep:.25,
  rotStep:2.0
};
function refreshGardenPalmEditor(){
  const read=document.getElementById("gardenPalmEditorRead");
  const select=document.getElementById("gardenPalmEditorSelect");
  if(!read) return;
  const i=THREE.MathUtils.clamp(
    Number(GARDEN_PALM_EDITOR.selected)||0,
    0,
    STATIC_GARDEN_PALM_LAYOUT.length-1
  );
  GARDEN_PALM_EDITOR.selected=i;
  if(select && Number(select.value)!==i) select.value=String(i);
  const p=STATIC_GARDEN_PALM_LAYOUT[i];
  read.textContent=
    `PALM ${i+1} · ABSOLUTE\n`+
    `POSITION X ${p.x.toFixed(3)} Y ${p.y.toFixed(3)} Z ${p.z.toFixed(3)}\n`+
    `ROT Y ${THREE.MathUtils.radToDeg(p.rotY).toFixed(1)}°\n`+
    `SCALE ${p.scale.toFixed(3)}`;
}

loadGLBFromCandidates(
  [
    "./assets/models/trees.glb",
    ],
  (gltf,path)=>{
    const source=gltf.scene;
    source.name="garden_tree_source";
    cloneMaterials(source);
    centerModelXZ(source);
    putModelOnFloor(source,0);
    GARDEN_TREE_DECOR.source=source;
    gardenBuild("buildGardenFenceTreeBackdrop",source);
    source.traverse(obj=>{
      if(!obj?.isMesh) return;
      obj.castShadow=false;
      obj.receiveShadow=false;
    });

    {
      const sideTreeSource=source.clone(true);
      cloneMaterials(sideTreeSource);
      gardenBuild("gardenTreeTint",
        sideTreeSource,
        0x1d4223,
        0x352419,
        0x291c16
      );
      sideTreeSource.updateMatrixWorld(true);
      const sideBox=
        new THREE.Box3().setFromObject(sideTreeSource);
      const sideSize=
        sideBox.getSize(new THREE.Vector3());
      if(sideSize.y>.001){
        const SIDE_TREE_LAYOUT=[
          [-145,.04,65,  13.0,-.35],
          [-160,.04,92,  15.0, .48],
          [-148,.04,121, 12.5,-.80],
          [-170,.04,150, 14.0, .18],
          [145,.04,67,  13.5, .32],
          [160,.04,95,  15.5,-.50],
          [148,.04,124, 12.8, .76],
          [170,.04,153, 14.5,-.20]
        ];
        const matrices=[];
        for(
          const [x,y,z,targetH,rotY]
          of SIDE_TREE_LAYOUT
        ){
          const s=targetH/sideSize.y;
          matrices.push(
            new THREE.Matrix4().compose(
              new THREE.Vector3(x,y,z),
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0,rotY,0)
              ),
              new THREE.Vector3(s,s,s)
            )
          );
        }
        const sideTrees=
          maxPerfBuildInstancedGLB(
            sideTreeSource,
            matrices,
            "world_side_trees_instanced"
          );
        sideTrees.name="WORLD_SIDE_TREES_LOW_COST";
        sideTrees.traverse(obj=>{
          if(!obj?.isMesh) return;
          obj.castShadow=false;
          obj.receiveShadow=false;
          obj.frustumCulled=true;
        });
        scene.add(sideTrees);
        const MOUNTAIN_TREE_LAYOUT=[
          [-205,.04,35,  15.5,-.40],
          [-225,.04,58,  13.8, .22],
          [-245,.04,82,  16.2,-.72],
          [-265,.04,108, 14.4, .55],
          [-285,.04,132, 17.0,-.15],
          [-305,.04,155, 15.0, .84],
          [-235,.04,145, 12.8,-.92],
          [-275,.04,55,  13.2, .34],
          [205,.04,37,  15.8, .38],
          [225,.04,60,  14.0,-.24],
          [245,.04,84,  16.0, .70],
          [265,.04,110, 14.6,-.52],
          [285,.04,134, 17.2, .18],
          [305,.04,158, 15.2,-.82],
          [235,.04,147, 12.6, .90],
          [275,.04,57,  13.4,-.32]
        ];
        const mountainTreeMatrices=[];
        for(
          const [x,y,z,targetH,rotY]
          of MOUNTAIN_TREE_LAYOUT
        ){
          const s=targetH/sideSize.y;
          mountainTreeMatrices.push(
            new THREE.Matrix4().compose(
              new THREE.Vector3(x,y,z),
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(0,rotY,0)
              ),
              new THREE.Vector3(s,s,s)
            )
          );
        }
        const mountainSideTrees=
          maxPerfBuildInstancedGLB(
            sideTreeSource,
            mountainTreeMatrices,
            "mountain_transition_trees_instanced"
          );
        mountainSideTrees.name=
          "MOUNTAIN_TRANSITION_TREES_LOW_COST";
        mountainSideTrees.traverse(obj=>{
          if(!obj?.isMesh) return;
          obj.castShadow=false;
          obj.receiveShadow=false;
          obj.frustumCulled=true;
        });
        scene.add(mountainSideTrees);
      }
    }
  },
  err=>console.error("trees.glb load error",err)
);
if(!TASK_BOUNDARY.gateReady){
  gardenBuild("loadGardenGate");
}
GardenBuilders.loadApprovedGardenPalms(getGardenBuilderContext());

function prepareStaticGLB(root){
  root.traverse((obj)=>{
    if(!obj.isMesh) return;
    obj.castShadow=false;
    obj.receiveShadow=true;
  });
}

function refreshGardenExhibitionLampEditor(){
  const read=document.getElementById("gardenExhibitionLampRead");
  if(!read) return;
  const fmt=(lamp)=>{
    if(!lamp) return "loading";
    return `P(${lamp.position.x.toFixed(3)}, ${lamp.position.y.toFixed(3)}, ${lamp.position.z.toFixed(3)})`;
  };
  read.textContent=
    `GARDEN LAMPS\n\n`+
    `LAMP 1  ${fmt(GARDEN_EXHIBITION_LAMPS.lamps[0])}\n`+
    `LAMP 2  ${fmt(GARDEN_EXHIBITION_LAMPS.lamps[1])}\n\n`+
    `STEP ${GARDEN_EXHIBITION_LAMPS.step.toFixed(2)}`;
}
loader.load(
  "./assets/models/Lampione.glb",
  (gltf)=>{
    let shortPart=gltf.scene.getObjectByName("375770_Lampione_Lightstar");
    if(!shortPart){
      gltf.scene.traverse((obj)=>{
        const n=(obj.name || "").toLowerCase();
        if(
          !shortPart &&
          n.includes("lampione") &&
          !n.includes("long")
        ){
          shortPart=obj;
        }
      });
    }
    if(!shortPart){
      return;
    }
    function createShortLamp(
      name,
      x,
      z,
      rotationY=0,
      height=4.7,
      lightIntensity=1.85
    ){
      const lamp=shortPart.clone(true);
      lamp.name=name;
      prepareStaticGLB(lamp);
      fitModelToHeight(lamp,height);
      centerModelXZ(lamp);
      putModelOnFloor(lamp,0);
      lamp.position.set(x,0,z);
      lamp.rotation.y=rotationY;
      scene.add(lamp);
      lamp.updateMatrixWorld(true);
      const groundBox=new THREE.Box3().setFromObject(lamp);
      lamp.position.y-=groundBox.min.y;
      lamp.updateMatrixWorld(true);
      addLampGlow(
        lamp,
        new THREE.Vector3(0,height*.84,0),
        lightIntensity,
        15,
        0xffdfa0
      );
      STREET_ASSETS.shortLamps.push(lamp);
    }
    const lampPositions=[

      {x:-34,z:52.5},
      {x: 34,z:52.5},
      {x:-105.5,z:-12.0},
      {x: 105.5,z:-12.0},

      {x:-35.7,z:15.9},
      {x: 35.7,z:15.9}
    ];
    GardenBuilders.setupApprovedGardenExhibitionLamps(
      getGardenBuilderContext(),
      shortPart
    );
    refreshFixedLightSources(scene,FIXED_LIGHT_POOL);
    for(let i=0;i<lampPositions.length;i++){
      const position=lampPositions[i];
      const isNearFrontLamp=i<2;
      const isShopFrontLamp=i>=4;
      createShortLamp(
        `sidewalk_short_lamp_${i+1}`,
        position.x,
        position.z,
        0,
        7.8,
        isShopFrontLamp
          ? 1.85
          : (isNearFrontLamp ? 2.25 : 1.85)
      );
    }
    rebuildShopFrontLampCollisions();
  },
  undefined,
  (error)=>console.error("Errore caricando Lampione.glb",error)
);
loader.load(
  "./assets/models/lampioneFuori.glb",
  (gltf)=>{
    const source=gltf.scene;
    function createFrontWallLamp(name,x,y,rotationY=0){
      const lamp=source.clone(true);
      lamp.name=name;
      prepareStaticGLB(lamp);
      fitModelToHeight(lamp,1.85);
      centerModelXZ(lamp);
      lamp.rotation.y=rotationY;
      lamp.position.set(x,y,0);
      scene.add(lamp);
      const wallFrontZ=SCENE_ENV_CONFIG.frontZ+.36;
      const EMBED_IN_WALL=.18;
      lamp.updateMatrixWorld(true);
      let wallBox=new THREE.Box3().setFromObject(lamp);
      lamp.position.z+=wallFrontZ-EMBED_IN_WALL-wallBox.min.z;
      lamp.updateMatrixWorld(true);
      addLampGlow(
        lamp,
        new THREE.Vector3(0,-.28,.50),
        1.55,
        10,
        0xffdfa0
      );
    }
    createFrontWallLamp(
      "casino_front_wall_lamp",
      -10,
      4.45,
      Math.PI/2
    );
    createFrontWallLamp(
      "pub_front_wall_lamp",
      10,
      4.45,
      Math.PI/2
    );
  },
  undefined,
  (error)=>console.error("Errore caricando lampioneFuori.glb",error)
);
if(VEHICLE_SYSTEM_LOADED){
  initVehicleSystem({
    loadingManager,
    scene,
    STREET_ASSETS,
    uRoadCurve,
    CROSSWALK,
    prepareStaticGLB,
    setCarBodyColor,
    fitModelToHeight,
    centerModelXZ,
    putModelOnFloor,
    getPlayer:()=>player,
    getActiveWorldZone:()=>activeWorldZone,
    isPlayerOnCrosswalk,
    isPlayerNearRoad
  });
  setTimeout(
    ()=>{
      for(const car of STREET_ASSETS?.cars || []){
        const root=
          car?.root ||
          car?.model ||
          car?.mesh ||
          car;
        root?.traverse?.(obj=>{
          if(obj?.isMesh){
            obj.castShadow=false;
          }
        });
      }
    },
    4200
  );
}
function updateStreetCar(){
  if(VEHICLE_SYSTEM_LOADED && updateVehicles){
    updateVehicles();
  }
}
loadCharacter(player);
npcs.forEach(loadCharacter);
function findBone(c,words){
  const lowerWords=words.map(w=>w.toLowerCase());
  return c.bones.find((bone)=>{
    const n=(bone.name || "").toLowerCase();
    return lowerWords.some(w=>n.includes(w));
  }) || null;
}
function getRest(c,bone){
  return c.rest.get(bone) || new THREE.Euler(0,0,0);
}
function getBones(c){
  return {
    hips:findBone(c,["mixamorighips","hips","pelvis"]),
    spine:findBone(c,["mixamorigspine","spine_01","spine"]),
    spine1:findBone(c,["mixamorigspine1","spine_02","spine1"]),
    spine2:findBone(c,["mixamorigspine2","spine_04","chest","spine2"]),
    neck:findBone(c,["mixamorigneck","neck"]),
    head:findBone(c,["mixamorighead","head"]),
    leftShoulder:findBone(c,["mixamorigleftshoulder","leftshoulder"]),
    rightShoulder:findBone(c,["mixamorigrightshoulder","rightshoulder"]),
    leftArm:findBone(c,["mixamorigleftarm","leftarm","left_arm","arm_l","upperarm_l"]),
    rightArm:findBone(c,["mixamorigrightarm","rightarm","right_arm","arm_r","upperarm_r"]),
    leftForeArm:findBone(c,["mixamorigleftforearm","leftforearm","left_forearm","forearm_l","lowerarm_l"]),
    rightForeArm:findBone(c,["mixamorigrightforearm","rightforearm","right_forearm","forearm_r","lowerarm_r"]),
    leftHand:findBone(c,["mixamoriglefthand","lefthand","hand_l"]),
    rightHand:findBone(c,["mixamorigrighthand","righthand","hand_r"]),
    leftUpLeg:findBone(c,["mixamorigleftupleg","leftupleg","thigh_l"]),
    rightUpLeg:findBone(c,["mixamorigrightupleg","rightupleg","thigh_r"]),
    leftKnee:findBone(c,["mixamorigleftleg","leftlowerleg","lowerleg_l","calf_l","shin_l"]),
    rightKnee:findBone(c,["mixamorigrightleg","rightlowerleg","lowerleg_r","calf_r","shin_r"]),
    leftFoot:findBone(c,["mixamorigleftfoot","leftfoot","foot_l"]),
    rightFoot:findBone(c,["mixamorigrightfoot","rightfoot","foot_r"]),
    leftToe:findBone(c,["mixamoriglefttoebase","lefttoebase","lefttoe","toe_l"]),
    rightToe:findBone(c,["mixamorigrighttoebase","righttoebase","righttoe","toe_r"])
  };
}

const SECURITY_POSE_EDITOR={
  panel:null,
  readout:null,
  bones:{},
  rest:{},
  enabled:true,
  wasTalking:false,
  returnActive:false,
  returnStart:0,
  returnDuration:1600,
  returnFrom:{},
  rightNeutralAfterTalk:false,
  rightReturnActive:false,
  rightReturnStart:0,
  rightReturnDuration:1300,
  rightReturnFrom:{},
  offsets:{
    leftShoulder:{x:0,y:0,z:0},
    leftArm:{x:0,y:10,z:0},
    leftForeArm:{x:0,y:22,z:7},
    leftHand:{x:0,y:0,z:0},
    rightShoulder:{x:0,y:0,z:0},
    rightArm:{x:14.5,y:0,z:0},
    rightForeArm:{x:0,y:0,z:0},
    rightHand:{x:0,y:0,z:0}
  },
  fingerOffsets:{
    left_thumb_1:{x:-11,y:0,z:-21},
    left_thumb_2:{x:9,y:0,z:0}
  }
};

const SECURITY_FINAL_POSE_EDITOR={
  panel:null,
  readout:null,
  transitionActive:false,
  transitionStart:0,
  transitionDuration:1600,
  transitionFrom:{},
  body:{
    leftShoulder:{x:0,y:0,z:0},
    leftArm:{x:0,y:10,z:0},
    leftForeArm:{x:0,y:22,z:7},
    leftHand:{x:0,y:0,z:0},

    rightShoulder:{x:0,y:0,z:0},
    rightArm:{x:0,y:-10,z:0},
    rightForeArm:{x:0,y:-22,z:-7},
    rightHand:{x:0,y:0,z:0}
  },
  fingers:{}
};

function securityMirrorLeftFinalToRight(){
  const security=questGetPolice();
  if(!security?.root) return;

  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  const b=SECURITY_FINAL_POSE_EDITOR.body;
  const bones=SECURITY_POSE_EDITOR.bones;
  const rest=SECURITY_POSE_EDITOR.rest;

  const pairs=[
    ["leftShoulder","rightShoulder"],
    ["leftArm","rightArm"],
    ["leftForeArm","rightForeArm"],
    ["leftHand","rightHand"]
  ];

  const touched=new Set();
  for(const [l,r] of pairs){
    if(bones[l]) touched.add(bones[l]);
    if(bones[r]) touched.add(bones[r]);
  }

  const saved=[];
  for(const bone of touched){
    saved.push({
      bone,
      quat:bone.quaternion.clone()
    });
  }

  try{

    for(const [leftKey] of pairs){
      const bone=bones[leftKey];
      const r=rest[leftKey];
      const o=b[leftKey];
      if(!bone || !r || !o) continue;

      bone.rotation.set(
        r.x+THREE.MathUtils.degToRad(o.x||0),
        r.y+THREE.MathUtils.degToRad(o.y||0),
        r.z+THREE.MathUtils.degToRad(o.z||0),
        bone.rotation.order
      );
      bone.updateMatrix();
    }

    security.root.updateMatrixWorld(true);

    const rootRot=new THREE.Matrix4().extractRotation(security.root.matrixWorld);
    const invRootRot=rootRot.clone().invert();

    const reflectX=new THREE.Matrix4().makeScale(-1,1,1);

    const wrapPi=(a)=>{
      a=(a+Math.PI)%(Math.PI*2);
      if(a<0) a+=Math.PI*2;
      return a-Math.PI;
    };

    for(const [leftKey,rightKey] of pairs){
      const leftBone=bones[leftKey];
      const rightBone=bones[rightKey];
      const rightRest=rest[rightKey];
      if(!leftBone || !rightBone || !rightRest) continue;

      security.root.updateMatrixWorld(true);

      const leftWorldRot=
        new THREE.Matrix4().extractRotation(leftBone.matrixWorld);

      const leftCharacterRot=
        invRootRot.clone().multiply(leftWorldRot);

      const mirroredCharacterRot=
        reflectX.clone()
          .multiply(leftCharacterRot)
          .multiply(reflectX);

      const desiredWorldRot=
        rootRot.clone().multiply(mirroredCharacterRot);

      const parentWorldRot=
        new THREE.Matrix4().extractRotation(rightBone.parent.matrixWorld);
      const desiredLocalRot=
        parentWorldRot.clone().invert().multiply(desiredWorldRot);

      const targetQuat=
        new THREE.Quaternion().setFromRotationMatrix(desiredLocalRot);

      const targetEuler=
        new THREE.Euler().setFromQuaternion(
          targetQuat,
          rightBone.rotation.order
        );

      b[rightKey]={
        x:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.x-rightRest.x)
        ),
        y:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.y-rightRest.y)
        ),
        z:THREE.MathUtils.radToDeg(
          wrapPi(targetEuler.z-rightRest.z)
        )
      };

      rightBone.rotation.copy(targetEuler);
      rightBone.updateMatrix();
      security.root.updateMatrixWorld(true);
    }
  } finally {

    for(const item of saved){
      item.bone.quaternion.copy(item.quat);
      item.bone.updateMatrix();
    }
    security.root.updateMatrixWorld(true);
  }

  for(const [key,v] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
    if(!key.startsWith("left_")) continue;
    const rightKey="right_"+key.slice(5);
    if(!bones[rightKey]) continue;

    SECURITY_FINAL_POSE_EDITOR.fingers[rightKey]={
      x:v.x||0,
      y:-(v.y||0),
      z:-(v.z||0)
    };
  }
}
function cacheSecurityFinalPoseDefaults(){
  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  for(const key of ["leftShoulder","leftArm","leftForeArm","leftHand"]){
    const v=SECURITY_POSE_EDITOR.offsets[key] || {x:0,y:0,z:0};
    SECURITY_FINAL_POSE_EDITOR.body[key]={x:v.x||0,y:v.y||0,z:v.z||0};
  }

  for(const [key,v] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
    if(!key.startsWith("left_")) continue;
    SECURITY_FINAL_POSE_EDITOR.fingers[key]={
      x:v.x||0,
      y:v.y||0,
      z:v.z||0
    };
  }

  securityMirrorLeftFinalToRight();
  applyUserApprovedSecurityFinalPoseValues();
}

function applyUserApprovedSecurityFinalPoseValues(){
  const b=SECURITY_FINAL_POSE_EDITOR.body;
  const f=SECURITY_FINAL_POSE_EDITOR.fingers;

  b.leftShoulder={x:0,y:1,z:-5};
  b.leftArm={x:0,y:3,z:0};
  b.leftForeArm={x:0,y:22,z:7};
  b.leftHand={x:0,y:0,z:0};

  b.rightShoulder={x:-5,y:1,z:9};
  b.rightArm={
    x:15.469860468532177,
    y:4.323944878270592,
    z:18.907607239317095
  };
  b.rightForeArm={
    x:15.469860468532229,
    y:52.484513367006954,
    z:37.404229122638775
  };
  b.rightHand={
    x:-5.852554118987924,
    y:-11.125095166644414,
    z:30.58354829751882
  };

  for(const key of Object.keys(f)){
    f[key]={x:0,y:0,z:0};
  }

  f.left_thumb_1={x:-11,y:0,z:-21};
  f.left_thumb_2={x:9,y:0,z:0};

  f.right_thumb_1={x:-11,y:0,z:21};
  f.right_thumb_2={x:9,y:0,z:0};
}

function captureSecurityFinalPoseTransition(){
  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  SECURITY_FINAL_POSE_EDITOR.transitionFrom={};

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.body)){
    const bone=SECURITY_POSE_EDITOR.bones[key];
    if(bone){
      SECURITY_FINAL_POSE_EDITOR.transitionFrom[key]=bone.rotation.clone();
    }
  }

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers)){
    const bone=SECURITY_POSE_EDITOR.bones[key];
    if(bone){
      SECURITY_FINAL_POSE_EDITOR.transitionFrom[key]=bone.rotation.clone();
    }
  }

  SECURITY_FINAL_POSE_EDITOR.transitionStart=performance.now();
  SECURITY_FINAL_POSE_EDITOR.transitionActive=true;
}

function getSecurityFinalTargetEuler(key,offset){
  const rest=SECURITY_POSE_EDITOR.rest[key];
  if(!rest || !offset) return null;

  return new THREE.Euler(
    rest.x+THREE.MathUtils.degToRad(offset.x||0),
    rest.y+THREE.MathUtils.degToRad(offset.y||0),
    rest.z+THREE.MathUtils.degToRad(offset.z||0)
  );
}

function applySecurityFinalPose(){
  const security=questGetPolice();
  if(!security?.root) return;

  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }

  const raw=SECURITY_FINAL_POSE_EDITOR.transitionActive
    ? THREE.MathUtils.clamp(
        (performance.now()-SECURITY_FINAL_POSE_EDITOR.transitionStart)/
        Math.max(1,SECURITY_FINAL_POSE_EDITOR.transitionDuration),
        0,
        1
      )
    : 1;

  const t=raw*raw*(3-2*raw);

  const applyOne=(key,offset)=>{
    const bone=SECURITY_POSE_EDITOR.bones[key];
    const target=getSecurityFinalTargetEuler(key,offset);
    if(!bone || !target) return;

    if(SECURITY_FINAL_POSE_EDITOR.transitionActive){
      const from=
        SECURITY_FINAL_POSE_EDITOR.transitionFrom[key] ||
        bone.rotation;

      bone.rotation.set(
        THREE.MathUtils.lerp(from.x,target.x,t),
        THREE.MathUtils.lerp(from.y,target.y,t),
        THREE.MathUtils.lerp(from.z,target.z,t)
      );
    }else{
      bone.rotation.copy(target);
    }
  };

  for(const [key,offset] of Object.entries(SECURITY_FINAL_POSE_EDITOR.body)){
    applyOne(key,offset);
  }

  for(const [key,offset] of Object.entries(SECURITY_FINAL_POSE_EDITOR.fingers)){
    applyOne(key,offset);
  }

  security.root.updateMatrixWorld(true);

  if(raw>=1){
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionFrom={};
  }
}

function refreshSecurityFinalPoseReadout(){
  const read=SECURITY_FINAL_POSE_EDITOR.readout;
  if(!read) return;

  const lines=["SECURITY FINAL POSE · AFTER TALK"];
  for(const [key,v] of Object.entries(SECURITY_FINAL_POSE_EDITOR.body)){
    lines.push(`${key}: x ${v.x}° · y ${v.y}° · z ${v.z}°`);
  }

  lines.push("");
  lines.push("FINGERS / PHALANGES");

  for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers).sort()){
    const v=SECURITY_FINAL_POSE_EDITOR.fingers[key];
    lines.push(`${key}: x ${v.x}° · y ${v.y}° · z ${v.z}°`);
  }

  read.textContent=lines.join("\n");
}

function makeSecurityPanelCollapsible(panel,titleEl,storageKey){
  if(!panel || panel.dataset.collapsibleReady==="1") return;
  panel.dataset.collapsibleReady="1";

  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.textContent="−";
  toggle.title="Riduci / apri pannello";

  Object.assign(toggle.style,{
    float:"right",
    width:"28px",
    height:"24px",
    marginLeft:"8px",
    padding:"0",
    border:"1px solid rgba(255,255,255,.22)",
    borderRadius:"6px",
    background:"rgba(255,255,255,.08)",
    color:"#fff",
    cursor:"pointer",
    font:"900 16px/20px Arial"
  });

  titleEl.prepend(toggle);

  const body=document.createElement("div");
  body.className="securityPanelCollapsibleBody";

  while(titleEl.nextSibling){
    body.appendChild(titleEl.nextSibling);
  }
  panel.appendChild(body);

  let collapsed=false;

  const setCollapsed=(value)=>{
    collapsed=!!value;
    body.style.display=collapsed ? "none" : "";
    toggle.textContent=collapsed ? "+" : "−";
    toggle.title=collapsed ? "Apri pannello" : "Riduci pannello";

    panel.style.width=collapsed ? "170px" : "";
    panel.style.maxHeight=collapsed ? "38px" : "";

    try{
      localStorage.setItem(storageKey,collapsed ? "1" : "0");
    }catch(e){}
  };

  toggle.addEventListener("click",(e)=>{
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  });

  titleEl.style.cursor="pointer";
  titleEl.addEventListener("click",(e)=>{
    if(e.target===toggle) return;
    setCollapsed(!collapsed);
  });

  try{
    collapsed=localStorage.getItem(storageKey)==="1";
  }catch(e){}

  setCollapsed(collapsed);
}

function ensureSecurityFinalPoseEditor(){
  if(SECURITY_FINAL_POSE_EDITOR.panel){
    return SECURITY_FINAL_POSE_EDITOR.panel;
  }

  cacheSecurityFinalPoseDefaults();

  const panel=document.createElement("div");
  panel.id="securityFinalPoseEditor";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"18px",
    width:"285px",
    maxHeight:"64vh",
    overflowY:"auto",
    zIndex:"24650",
    display:"none",
    padding:"13px",
    borderRadius:"11px",
    background:"rgba(7,10,16,.97)",
    border:"1px solid rgba(112,184,255,.36)",
    color:"#fff",
    font:"12px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY FINAL POSE";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".10em",
    marginBottom:"6px"
  });
  panel.appendChild(title);

  const subtitle=document.createElement("div");
  subtitle.textContent=
    "Si apre solo dopo il TALK. Modifica la posa finale in tempo reale.";
  Object.assign(subtitle.style,{
    color:"rgba(255,255,255,.66)",
    fontSize:"10px",
    lineHeight:"1.4",
    marginBottom:"9px"
  });
  panel.appendChild(subtitle);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 7px",
    padding:"6px",
    maxHeight:"92px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.70)",
    font:"9px/1.28 monospace"
  });
  panel.appendChild(read);
  SECURITY_FINAL_POSE_EDITOR.readout=read;

  const makeAxisControls=(container,key,targetObject,min=-160,max=160)=>{
    const h=document.createElement("div");
    h.textContent=key
      .replace(/([A-Z])/g," $1")
      .replace(/^./,c=>c.toUpperCase());
    Object.assign(h.style,{
      marginTop:"8px",
      paddingTop:"7px",
      borderTop:"1px solid rgba(255,255,255,.08)",
      fontWeight:"900",
      fontSize:"10px",
      letterSpacing:".07em"
    });
    container.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 48px",
        gap:"6px",
        alignItems:"center",
        margin:"4px 0"
      });

      const label=document.createElement("span");
      label.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min=String(min);
      slider.max=String(max);
      slider.step="1";
      slider.value=String(targetObject[key][axis]||0);

      const value=document.createElement("span");
      value.textContent=`${slider.value}°`;
      value.style.textAlign="right";

      slider.addEventListener("input",()=>{
        targetObject[key][axis]=Number(slider.value);
        value.textContent=`${slider.value}°`;

        SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
        applySecurityFinalPose();
        refreshSecurityFinalPoseReadout();
      });

      row.append(label,slider,value);
      container.appendChild(row);
    }
  };

  const upper=document.createElement("div");
  panel.appendChild(upper);

  for(const key of [
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand"
  ]){
    makeAxisControls(
      upper,
      key,
      SECURITY_FINAL_POSE_EDITOR.body,
      -160,
      160
    );
  }

  const addFingerDetails=(side)=>{
    const details=document.createElement("details");
    details.style.marginTop="10px";

    const summary=document.createElement("summary");
    summary.textContent=`${side.toUpperCase()} FINGERS / PHALANGES`;
    Object.assign(summary.style,{
      cursor:"pointer",
      fontWeight:"900",
      letterSpacing:".06em"
    });
    details.appendChild(summary);

    for(const key of Object.keys(SECURITY_FINAL_POSE_EDITOR.fingers)
      .filter(k=>k.startsWith(side+"_"))
      .sort()){
      makeAxisControls(
        details,
        key,
        SECURITY_FINAL_POSE_EDITOR.fingers,
        -120,
        120
      );
    }

    panel.appendChild(details);
  };

  addFingerDetails("left");
  addFingerDetails("right");

  const mirror=document.createElement("button");
  mirror.textContent="MIRROR LEFT → RIGHT · GLB AXES";
  Object.assign(mirror.style,{
    width:"100%",
    marginTop:"10px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });
  mirror.addEventListener("click",()=>{
    securityMirrorLeftFinalToRight();

    panel.remove();
    SECURITY_FINAL_POSE_EDITOR.panel=null;
    SECURITY_FINAL_POSE_EDITOR.readout=null;

    ensureSecurityFinalPoseEditor();
    SECURITY_FINAL_POSE_EDITOR.panel.style.display="block";
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    applySecurityFinalPose();
  });
  panel.appendChild(mirror);

  const print=document.createElement("button");
  print.textContent="PRINT / COPY FINAL POSE";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"6px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });
  print.addEventListener("click",async()=>{
    const output=
      "SECURITY FINAL POSE AFTER TALK\n"+
      JSON.stringify(SECURITY_FINAL_POSE_EDITOR.body,null,2)+
      "\n\nSECURITY FINAL FINGERS / PHALANGES\n"+
      JSON.stringify(SECURITY_FINAL_POSE_EDITOR.fingers,null,2);

    console.log(output);

    try{
      await navigator.clipboard.writeText(output);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>{
      print.textContent="PRINT / COPY FINAL POSE";
    },1400);
  });
  panel.appendChild(print);

  makeSecurityPanelCollapsible(
    panel,
    title,
    "securityFinalPosePanelCollapsed"
  );

  document.body.appendChild(panel);
  SECURITY_FINAL_POSE_EDITOR.panel=panel;

  refreshSecurityFinalPoseReadout();
  return panel;
}

function cacheSecurityPoseEditorBones(){
  const security=questGetPolice();
  if(!security?.root) return false;

  const map={};

  security.root.traverse(o=>{
    if(!o?.isBone) return;

    const n=String(o.name||"").toLowerCase();

    if(n.includes("leftshoulder")){
      map.leftShoulder=o;
    }else if(n.includes("leftarm") && !n.includes("fore")){
      map.leftArm=o;
    }else if(n.includes("leftforearm")){
      map.leftForeArm=o;
    }else if(
      n.includes("lefthand") &&
      !n.includes("thumb") &&
      !n.includes("index") &&
      !n.includes("middle") &&
      !n.includes("ring") &&
      !n.includes("pinky")
    ){
      map.leftHand=o;
    }else if(n.includes("rightshoulder")){
      map.rightShoulder=o;
    }else if(n.includes("rightarm") && !n.includes("fore")){
      map.rightArm=o;
    }else if(n.includes("rightforearm")){
      map.rightForeArm=o;
    }else if(
      n.includes("righthand") &&
      !n.includes("thumb") &&
      !n.includes("index") &&
      !n.includes("middle") &&
      !n.includes("ring") &&
      !n.includes("pinky")
    ){
      map.rightHand=o;
    }
  });

  security.root.traverse(o=>{
    if(!o?.isBone) return;
    const clean=String(o.name||"")
      .toLowerCase()
      .replace(/[^a-z0-9]/g,"");

    const match=clean.match(
      /(left|right)hand(thumb|index|middle|ring|pinky|little)([1-4])/
    );
    if(!match) return;

    const side=match[1];
    const finger=match[2]==="little" ? "pinky" : match[2];
    const segment=match[3];
    const key=`${side}_${finger}_${segment}`;

    map[key]=o;

    if(!SECURITY_POSE_EDITOR.fingerOffsets[key]){
      SECURITY_POSE_EDITOR.fingerOffsets[key]={x:0,y:0,z:0};
    }
  });

  SECURITY_POSE_EDITOR.bones=map;

  for(const key of Object.keys(SECURITY_POSE_EDITOR.offsets)){
    const bone=map[key];
    if(!bone) continue;

    if(!SECURITY_POSE_EDITOR.rest[key]){
      SECURITY_POSE_EDITOR.rest[key]=bone.rotation.clone();
    }
  }

  for(const key of Object.keys(SECURITY_POSE_EDITOR.fingerOffsets)){
    const bone=map[key];
    if(!bone) continue;
    if(!SECURITY_POSE_EDITOR.rest[key]){
      SECURITY_POSE_EDITOR.rest[key]=bone.rotation.clone();
    }
  }

  return Object.keys(map).length>0;
}

function updateSecurityPoseEditor(){
  const security=questGetPolice();
  if(!security?.root) return;

  hideAllSecurityContextPanels();

  if(
    SECURITY_POST_CASE_HOME_LOCK &&
    QUEST.stage==="game_complete" &&
    STOREKEEPER_FINAL.completed
  ){
    SECURITY_POSE_EDITOR.wasTalking=false;
    SECURITY_POSE_EDITOR.rightNeutralAfterTalk=false;
    SECURITY_POSE_EDITOR.rightReturnActive=false;
    SECURITY_POSE_EDITOR.rightReturnFrom={};
    SECURITY_POSE_EDITOR.finalPoseActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_FINAL_POSE_EDITOR.transitionFrom={};
    return;
  }

  const securityIsTalking =
    security.state==="talk" ||
    (
      QUEST.dialogueActive &&
      (
        String(QUEST.dialogueSpeaker||"").toUpperCase()==="SECURITY" ||
        String(QUEST.dialogueSpeaker||"").toUpperCase()==="POLICE"
      )
    ) ||
    (
      GLOBAL_DIALOGUE_LOCK.active &&
      GLOBAL_DIALOGUE_LOCK.npc===security
    );

  const finalPanel=ensureSecurityFinalPoseEditor();

  if(securityIsTalking){
SECURITY_FINAL_POSE_EDITOR.transitionActive=false;
    SECURITY_POSE_EDITOR.rightReturnActive=false;
    SECURITY_POSE_EDITOR.rightReturnFrom={};
  }else{
    if(SECURITY_POSE_EDITOR.wasTalking){

      SECURITY_POSE_EDITOR.rightNeutralAfterTalk=true;
      cacheSecurityFinalPoseDefaults();
      captureSecurityFinalPoseTransition();
    }

    if(SECURITY_POSE_EDITOR.rightNeutralAfterTalk){

      applySecurityFinalPose();
}else{

      if(!SECURITY_POSE_EDITOR.bones.leftArm){
        cacheSecurityPoseEditorBones();
      }

      for(const key of ["leftShoulder","leftArm","leftForeArm","leftHand"]){
        const bone=SECURITY_POSE_EDITOR.bones[key];
        const rest=SECURITY_POSE_EDITOR.rest[key];
        const offset=SECURITY_POSE_EDITOR.offsets[key];
        if(!bone || !rest || !offset) continue;

        bone.rotation.set(
          rest.x+THREE.MathUtils.degToRad(offset.x||0),
          rest.y+THREE.MathUtils.degToRad(offset.y||0),
          rest.z+THREE.MathUtils.degToRad(offset.z||0)
        );
      }

      for(const [key,offset] of Object.entries(SECURITY_POSE_EDITOR.fingerOffsets)){
        if(!key.startsWith("left_")) continue;

        const bone=SECURITY_POSE_EDITOR.bones[key];
        const rest=SECURITY_POSE_EDITOR.rest[key];
        if(!bone || !rest) continue;

        bone.rotation.set(
          rest.x+THREE.MathUtils.degToRad(offset.x||0),
          rest.y+THREE.MathUtils.degToRad(offset.y||0),
          rest.z+THREE.MathUtils.degToRad(offset.z||0)
        );
      }

      security.root.updateMatrixWorld(true);
      finalPanel.style.display="none";
    }
  }

  SECURITY_POSE_EDITOR.wasTalking=securityIsTalking;
  SECURITY_POSE_EDITOR.returnActive=false;
}

const SECURITY_HEAD_SPEECH_STATE=new WeakMap();
function getSecurityHeadSpeechState(c){
  let state=SECURITY_HEAD_SPEECH_STATE.get(c);
  if(state) return state;
  const head=c.bones.find((bone)=>bone.name==="mixamorig:Head_06") || null;
  state={
    head,
    rest:head ? head.rotation.clone() : null,
    warned:false
  };
  SECURITY_HEAD_SPEECH_STATE.set(c,state);
  return state;
}
function animateSecurityHeadSpeech(c,talking=false){
  if(c.name!=="securityMan") return;
  const state=getSecurityHeadSpeechState(c);
  if(!state.head || !state.rest){
    if(!state.warned){
      state.warned=true;
    }
    return;
  }
  const now=performance.now();
  const nod=Math.sin(now*.0055);
  const turn=Math.sin(now*.0037+1.1);
  const targetX=state.rest.x+(talking ? Math.sin(now*.0066)*.050 : 0);
  const targetY=state.rest.y+(talking ? turn*.026 : 0);
  const targetZ=state.rest.z+(talking ? Math.sin(now*.0043+.4)*.010 : 0);
  smoothBoneTo(
    state.head,
    targetX,
    targetY,
    targetZ,
    talking ? .10 : .08
  );
}
const SECURITY_FINGER_STATE=new WeakMap();
function cleanBoneName(name){
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g,"");
}
function getFingerSegment(name){
  const match=name.match(/(?:thumb|index|middle|ring|pinky|little)([1-4])/);
  return match ? Number(match[1]) : 0;
}
function isSecurityFingerBone(name){
  const n=cleanBoneName(name);
  const isFinger=
    n.includes("thumb") ||
    n.includes("index") ||
    n.includes("middle") ||
    n.includes("ring") ||
    n.includes("pinky") ||
    n.includes("little");
  const segment=getFingerSegment(n);
  return isFinger && segment>=1 && segment<=3;
}
function getSecurityFingerState(c){
  let state=SECURITY_FINGER_STATE.get(c);
  if(state) return state;
  const fingers=c.bones
    .filter((bone)=>isSecurityFingerBone(bone.name))
    .map((bone)=>({
      bone,
      rest:bone.rotation.clone(),
      name:cleanBoneName(bone.name),
      segment:getFingerSegment(cleanBoneName(bone.name))
    }));
  state={fingers};
  SECURITY_FINGER_STATE.set(c,state);
  return state;
}
function getMainFingerCurl(name,segment){
  let amount=0;
  if(segment===1) amount=0.72;
  else if(segment===2) amount=1.02;
  else if(segment===3) amount=0.82;
  if(name.includes("index")) amount*=0.92;
  else if(name.includes("middle")) amount*=1.00;
  else if(name.includes("ring")) amount*=1.05;
  else if(name.includes("pinky") || name.includes("little")) amount*=1.08;
  return amount;
}
function animateSecurityFingers(c,talking=false){
  if(c.name!=="securityMan") return;
  const state=getSecurityFingerState(c);
  if(!state.fingers.length) return;
  const lookingAtThief=
    talking &&
    FINAL_SECURITY_DIALOGUE_FACING?.active &&
    FINAL_SECURITY_DIALOGUE_FACING.mode==="thief";

  const t=performance.now()*(lookingAtThief ? .0028 : .007);
  const waveA=(Math.sin(t)+1)*.5;
  const waveB=(Math.sin(t*1.63+.8)+1)*.5;
  const gesture=waveA*.65+waveB*.35;

  const closure=talking
    ? (
        lookingAtThief
          ? THREE.MathUtils.lerp(.30,.265,gesture)
          : THREE.MathUtils.lerp(.34,.20,gesture)
      )
    : .34;
  for(const item of state.fingers){
    const {bone,rest,name,segment}=item;
    const isLeft=name.includes("left");
    if(name.includes("thumb")){
      let addX=0;
      let addZ=0;
      if(segment===1){
        addX=-0.07;
        addZ=isLeft ? -0.12 : 0.12;
      }else if(segment===2){
        addX=-0.17;
        addZ=isLeft ? -0.16 : 0.16;
      }else if(segment===3){
        addX=-0.16;
        addZ=isLeft ? -0.04 : 0.04;
      }
      smoothBoneTo(
        bone,
        rest.x+addX*closure,
        rest.y,
        rest.z+addZ*closure,
        talking ? (lookingAtThief ? .065 : .14) : .11
      );
      continue;
    }
    const addX=getMainFingerCurl(name,segment)*closure;
    smoothBoneTo(
      bone,
      rest.x+addX,
      rest.y,
      rest.z,
      talking ? (lookingAtThief ? .065 : .14) : .11
    );
  }
}
function applyThiefEditorBodyPose(c,b,pose,lerp=.12){
  const directBones=[
    "leftShoulder",
    "rightShoulder",
    "leftArm",
    "rightArm",
    "leftForeArm",
    "rightForeArm",
    "hips",
    "spine",
    "spine1",
    "spine2",
    "leftUpLeg",
    "rightUpLeg",
    "leftKnee",
    "rightKnee",
    "leftFoot",
    "rightFoot",
    "leftToe",
    "rightToe"
  ];

  for(const key of directBones){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;

    const rest=getRest(c,bone);

    const useAbsolute=
      key==="leftArm" ||
      key==="rightArm" ||
      key==="leftForeArm" ||
      key==="rightForeArm";

    smoothBoneTo(
      bone,
      useAbsolute ? target.x : rest.x+target.x,
      useAbsolute ? target.y : rest.y+target.y,
      useAbsolute ? target.z : rest.z+target.z,
      lerp
    );
  }

  for(const key of ["leftHand","rightHand","neck","head"]){
    const bone=b[key];
    const target=pose[key];
    if(!bone || !target) continue;

    const rest=getRest(c,bone);

    smoothBoneTo(
      bone,
      rest.x+target.x,
      rest.y+target.y,
      rest.z+target.z,
      lerp
    );
  }
}

function lerpThiefInitialIdlePose(a,b,t){
  const out={};
  const keys=[
    "head","neck",
    "leftShoulder","rightShoulder",
    "leftArm","rightArm",
    "leftForeArm","rightForeArm",
    "leftHand","rightHand",
    "hips","spine","spine1","spine2",
    "leftUpLeg","rightUpLeg",
    "leftKnee","rightKnee",
    "leftFoot","rightFoot",
    "leftToe","rightToe"
  ];

  for(const k of keys){
    out[k]={
      x:THREE.MathUtils.lerp(a[k].x,b[k].x,t),
      y:THREE.MathUtils.lerp(a[k].y,b[k].y,t),
      z:THREE.MathUtils.lerp(a[k].z,b[k].z,t)
    };
  }

  out.leftFingerCurl=THREE.MathUtils.lerp(a.leftFingerCurl,b.leftFingerCurl,t);
  out.rightFingerCurl=THREE.MathUtils.lerp(a.rightFingerCurl,b.rightFingerCurl,t);
  out.fingerCurl=THREE.MathUtils.lerp(a.fingerCurl,b.fingerCurl,t);

  return out;
}

function animateToxicNeutralIdle(c,b){
  if(!c || !b) return;
  if(!STOREKEEPER_FINAL.thiefDialogueDone){
    THIEF_TALK_ROOT_LOCK.active=false;
  }
  THIEF_TALK_POSE_STATE.delete(c);

  const now=performance.now()*.001;

  const cycle=12.0;
  const u=((now%cycle)+cycle)%cycle/cycle;

  let fromPose;
  let toPose;
  let localT;

  if(u<.18){
    fromPose=THIEF_UNDISCOVERED_POSE_A;
    toPose=THIEF_UNDISCOVERED_POSE_C;
    localT=u/.18;
  }else if(u<.36){
    fromPose=THIEF_UNDISCOVERED_POSE_C;
    toPose=THIEF_UNDISCOVERED_POSE_A;
    localT=(u-.18)/.18;
  }else if(u<.68){
    fromPose=THIEF_UNDISCOVERED_POSE_A;
    toPose=THIEF_UNDISCOVERED_POSE_B;
    localT=(u-.36)/.32;
  }else{
    fromPose=THIEF_UNDISCOVERED_POSE_B;
    toPose=THIEF_UNDISCOVERED_POSE_A;
    localT=(u-.68)/.32;
  }

  const smoothT=localT*localT*(3-2*localT);

  const pose=lerpThiefInitialIdlePose(
    fromPose,
    toPose,
    smoothT
  );

  const side=Math.sin(now*.78);
  const side2=Math.sin(now*.52+1.05);
  const breath=Math.sin(now*.66+.35);

  pose.head.y+=side*.085;
  pose.head.z+=side2*.024;
  pose.neck.y+=side*.030;
  pose.neck.z+=side2*.010;

  pose.spine.y+=side*.026;
  pose.spine1.y+=side*.036;
  pose.spine2.y+=side*.048;
  pose.spine2.z+=breath*.020;

  pose.leftArm.x+=breath*.032;
  pose.leftArm.y+=side*.045;
  pose.leftArm.z+=side2*.018;

  pose.rightArm.x-=breath*.026;
  pose.rightArm.y-=side*.034;
  pose.rightArm.z-=side2*.014;

  pose.leftForeArm.x+=side2*.022;
  pose.leftForeArm.z+=breath*.014;
  pose.rightForeArm.x-=side2*.018;
  pose.rightForeArm.z-=breath*.012;

  pose.hips.z+=breath*.012;

  pose.leftUpLeg.x+=breath*.018;
  pose.rightUpLeg.x-=breath*.014;
  pose.leftKnee.x+=side2*.010;
  pose.rightKnee.x-=side2*.008;

  applyThiefEditorBodyPose(
    c,
    b,
    pose,
    .046
  );

  animateThiefEditorFingers(
    c,
    pose.fingerCurl,
    .035
  );
}
const CHILD_VISIT_POSE_STATE={
  talkStart:0,
  talkStartPos:null,
  talkPoseLatched:false,
  stableYaw:null
};
const CHILD_ADVANCED_TALK_STATE=new WeakMap();

const CHILD_NEW_TALK_STATE=new WeakMap();

function animateChildNewTalk(c){
  if(!c?.ready || !c?.root) return;

  const stillTurning=turnNpcTowardPlayerWithSteps(c,.12);

  let s=CHILD_USER_POSE_FLOW_STATE.get(c);
  if(!s){
    childUserStartPoseFlow(c);
    s=CHILD_USER_POSE_FLOW_STATE.get(c);
  }

  const now=performance.now();

  if(
    s?.stepStartPos &&
    s?.stepTargetPos &&
    !s.stepDone
  ){
    const elapsed=now-s.start;

    const stepRaw=THREE.MathUtils.clamp(
      elapsed/(CHILD_USER_POSE_FLOW.enterMs*.72),
      0,
      1
    );
    const stepT=childUserSmooth01(stepRaw);

    c.root.position.lerpVectors(
      s.stepStartPos,
      s.stepTargetPos,
      stepT
    );

    if(stepRaw>=1){
      s.stepDone=true;
    }
  }

  if(s.phase==="enter"){
    const raw=(now-s.start)/CHILD_USER_POSE_FLOW.enterMs;
    const t=childUserSmooth01(raw);

    const p=childUserLerpPose(
      s.from,
      CHILD_USER_POSE_1,
      t
    );

    p.leftFingerCurl=THREE.MathUtils.lerp(
      s.from?.leftFingerCurl||0,
      CHILD_USER_POSE_1.leftFingerCurl||0,
      t
    );
    p.rightFingerCurl=THREE.MathUtils.lerp(
      s.from?.rightFingerCurl||0,
      CHILD_USER_POSE_1.rightFingerCurl||0,
      t
    );

    p.head=[
      Math.sin(t*Math.PI)*.75,
      Math.sin(t*Math.PI*.85)*.30,
      0
    ];
    p.neck=[
      Math.sin(t*Math.PI)*.35,
      Math.sin(t*Math.PI*.85)*.14,
      0
    ];

    childUserApplyPose(c,p);

    childUserApplyLegTurnOverlay(c,t*.55);

    if(raw>=1){
      s.phase="talk";
      s.start=now;
    }
    return;
  }

  if(s.phase==="talk"){
    const seconds=(now-s.start)/1000;

    const sine=
      (Math.sin(
        seconds*(Math.PI*2/CHILD_USER_POSE_FLOW.cycleSeconds)
        - Math.PI/2
      )+1)*.5;

    const blend=childUserSmooth01(sine);

    const p=childUserLerpPose(
      CHILD_USER_POSE_1,
      CHILD_USER_POSE_2,
      blend
    );

    const a=Math.sin(seconds*1.55);
    const b=Math.sin(seconds*1.25+.75);
    const c2=Math.sin(seconds*.95+1.25);

    p.leftArm[0]+=a*CHILD_USER_POSE_FLOW.armShake*.12;
    p.rightArm[0]+=a*CHILD_USER_POSE_FLOW.armShake*.12;

    p.leftForeArm[0]+=b*CHILD_USER_POSE_FLOW.foreShake*.10;
    p.leftForeArm[2]+=a*.07;

    p.rightForeArm[0]+=b*.09;
    p.rightForeArm[2]-=a*.06;

    p.leftHand[0]+=a*.025;
    p.rightHand[0]+=a*.025;

    p.head=[
      a*CHILD_USER_POSE_FLOW.headNod,
      b*.78,
      c2*.24
    ];
    p.neck=[
      a*CHILD_USER_POSE_FLOW.neckNod,
      b*.32,
      c2*.10
    ];

    const pulse=(Math.sin(seconds*3.55)+1)*.5;

    p.leftFingerCurl=
      THREE.MathUtils.lerp(
        CHILD_USER_POSE_1.leftFingerCurl,
        CHILD_USER_POSE_2.leftFingerCurl,
        blend
      )
      + pulse*CHILD_USER_POSE_FLOW.fingerPulse*.02;

    p.rightFingerCurl=
      THREE.MathUtils.lerp(
        CHILD_USER_POSE_1.rightFingerCurl,
        CHILD_USER_POSE_2.rightFingerCurl,
        blend
      )
      + (1-pulse)*CHILD_USER_POSE_FLOW.fingerPulse*.02;

    childUserApplyPose(c,p);

    const turnP=THREE.MathUtils.clamp(seconds/1.45,0,1);

    if(stillTurning || turnP<1 || (s?.turnAngleDeg||0)<12){
      childUserApplyLegTurnOverlay(c,turnP);
    }

    return;
  }
}

const CHILD_USER_POSE_1={
  spine2:[0,0,0],

  leftShoulder:[0,0,0],
  leftArm:[81,0,0],
  leftForeArm:[0,0,-6],
  leftHand:[0,0,0],

  rightShoulder:[0,0,0],
  rightArm:[80,0,0],
  rightForeArm:[0,0,6],
  rightHand:[0,0,0],

  neck:[0,0,0],
  head:[0,0,0],

  leftFingerCurl:.07,
  rightFingerCurl:.07
};

const CHILD_USER_POSE_2={
  spine2:[0,0,0],

  leftShoulder:[0,0,0],
  leftArm:[79,0,0],
  leftForeArm:[13,0,36],
  leftHand:[0,0,0],

  rightShoulder:[0,0,0],
  rightArm:[79,0,0],
  rightForeArm:[0,0,-20],
  rightHand:[0,0,0],

  neck:[0,0,0],
  head:[0,0,0],

  leftFingerCurl:.28,
  rightFingerCurl:.25
};

const CHILD_USER_POSE_FLOW={
  enterMs:700,
  returnMs:900,
  cycleSeconds:2.20,

  armShake:2.15,
  foreShake:2.35,
  headNod:1.55,
  neckNod:.82,

  fingerPulse:.10,
  legTurnStrength:1.0
};

const CHILD_USER_POSE_FLOW_STATE=new WeakMap();

function childUserSmooth01(v){
  const t=THREE.MathUtils.clamp(v,0,1);
  return t*t*(3-2*t);
}

function childUserCapturePose(c){
  const b=getBones(c);
  const out={};

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const bone=b[key];
    if(!bone) continue;

    const r=getRest(c,bone);
    if(!r) continue;

    out[key]=[
      THREE.MathUtils.radToDeg(bone.rotation.x-r.x),
      THREE.MathUtils.radToDeg(bone.rotation.y-r.y),
      THREE.MathUtils.radToDeg(bone.rotation.z-r.z)
    ];
  }

  out.leftFingerCurl=0;
  out.rightFingerCurl=0;

  return out;
}

function childUserLerpPose(a,b,t){
  const out={};

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const av=a?.[key] || [0,0,0];
    const bv=b?.[key] || [0,0,0];

    out[key]=[
      THREE.MathUtils.lerp(av[0]||0,bv[0]||0,t),
      THREE.MathUtils.lerp(av[1]||0,bv[1]||0,t),
      THREE.MathUtils.lerp(av[2]||0,bv[2]||0,t)
    ];
  }

  return out;
}

function childUserFingerBones(c){
  const root=c?.root;
  if(!root) return {left:[],right:[]};

  const norm=s=>String(s||"")
    .toLowerCase()
    .replace(/mixamorig/g,"")
    .replace(/[^a-z0-9]/g,"");

  const left=[];
  const right=[];

  root.traverse(o=>{
    if(!o?.isBone) return;
    const n=norm(o.name);

    if(
      n.includes("lefthandindex1") ||
      n.includes("lefthandmiddle1") ||
      n.includes("lefthandring1") ||
      n.includes("lefthandpinky1")
    ){
      left.push(o);
    }

    if(
      n.includes("righthandindex1") ||
      n.includes("righthandmiddle1") ||
      n.includes("righthandring1") ||
      n.includes("righthandpinky1")
    ){
      right.push(o);
    }
  });

  return {left,right};
}

const CHILD_USER_FINGER_BASE=new WeakMap();

function childUserEnsureFingerBase(c){
  let base=CHILD_USER_FINGER_BASE.get(c);
  if(base) return base;

  const fingers=childUserFingerBones(c);
  base={
    left:new Map(),
    right:new Map()
  };

  for(const bone of fingers.left){
    base.left.set(bone,bone.quaternion.clone());
  }
  for(const bone of fingers.right){
    base.right.set(bone,bone.quaternion.clone());
  }

  CHILD_USER_FINGER_BASE.set(c,base);
  return base;
}

function childUserApplyFingerCurl(c,leftCurl,rightCurl){
  const base=childUserEnsureFingerBase(c);

  const apply=(map,amount)=>{
    for(const [bone,q0] of map){
      if(!bone) continue;

      const qCurl=new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(
            THREE.MathUtils.clamp(amount,0,1)*52
          ),
          0,
          0,
          "XYZ"
        )
      );

      bone.quaternion.copy(q0).multiply(qCurl);
    }
  };

  apply(base.left,leftCurl||0);
  apply(base.right,rightCurl||0);
}

function childUserApplyLegTurnOverlay(c,p){
  if(!c?.ready) return;

  const s=CHILD_USER_POSE_FLOW_STATE.get(c);
  const turnAngleDeg=s?.turnAngleDeg||0;

  const b=getBones(c);

  const turnStrength=THREE.MathUtils.clamp(
    (turnAngleDeg-12)/55,
    0,
    1
  );

  const phase=THREE.MathUtils.clamp(p,0,1);

  const leftLift=Math.sin(
    THREE.MathUtils.clamp(phase*2,0,1)*Math.PI
  );

  const rightPhase=THREE.MathUtils.clamp(
    (phase-.42)/.58,
    0,
    1
  );
  const rightLift=Math.sin(rightPhase*Math.PI);

  const tiny=Math.sin(performance.now()*.0032)*.28;

  const move=(bone,dx,dy,dz,speed=.12)=>{
    if(!bone) return;
    const r=getRest(c,bone);
    if(!r) return;

    smoothBoneTo(
      bone,
      r.x+THREE.MathUtils.degToRad(dx),
      r.y+THREE.MathUtils.degToRad(dy),
      r.z+THREE.MathUtils.degToRad(dz),
      speed
    );
  };

  const legAmp=4.0*turnStrength;

  move(
    b.leftUpLeg,
    leftLift*legAmp + tiny,
    0,
    leftLift*.55*turnStrength,
    .12
  );
  move(
    b.rightUpLeg,
    rightLift*legAmp - tiny,
    0,
    -rightLift*.55*turnStrength,
    .12
  );

  move(
    b.leftKnee,
    leftLift*2.8*turnStrength,
    0,
    0,
    .13
  );
  move(
    b.rightKnee,
    rightLift*2.8*turnStrength,
    0,
    0,
    .13
  );

  move(
    b.leftFoot,
    -leftLift*.85*turnStrength,
    0,
    0,
    .14
  );
  move(
    b.rightFoot,
    -rightLift*.85*turnStrength,
    0,
    0,
    .14
  );
}

function childUserApplyPose(c,pose,extra=null){
  if(!c?.ready) return;

  const b=getBones(c);

  for(const key of [
    "spine2",
    "leftShoulder","leftArm","leftForeArm","leftHand",
    "rightShoulder","rightArm","rightForeArm","rightHand",
    "neck","head"
  ]){
    const bone=b[key];
    const p=pose?.[key];
    if(!bone || !p) continue;

    childPoseOffsetTarget(
      c,
      bone,
      p,
      extra?.[key] || [0,0,0]
    );
  }

  childUserApplyFingerCurl(
    c,
    pose?.leftFingerCurl||0,
    pose?.rightFingerCurl||0
  );

  c.root.updateMatrixWorld(true);
}

function childUserStartPoseFlow(c){
  let turnAngleDeg=0;
  let stepStartPos=null;
  let stepTargetPos=null;

  if(c?.root && player?.root){
    const dx=player.root.position.x-c.root.position.x;
    const dz=player.root.position.z-c.root.position.z;

    const targetYaw=Math.atan2(dx,dz);
    const diff=normalizeAngle(targetYaw-c.root.rotation.y);

    turnAngleDeg=Math.abs(
      THREE.MathUtils.radToDeg(diff)
    );

    stepStartPos=c.root.position.clone();

    const stepFactor=THREE.MathUtils.clamp(
      (turnAngleDeg-18)/72,
      0,
      1
    );

    const dir=new THREE.Vector3(dx,0,dz);
    if(dir.lengthSq()>.0001){
      dir.normalize();

      stepTargetPos=stepStartPos.clone().addScaledVector(
        dir,
        .14*stepFactor
      );
    }else{
      stepTargetPos=stepStartPos.clone();
    }
  }

  CHILD_USER_POSE_FLOW_STATE.set(c,{
    phase:"enter",
    start:performance.now(),
    from:childUserCapturePose(c),

    turnAngleDeg,
    stepStartPos,
    stepTargetPos,
    stepDone:false
  });
}

function childUserBeginReturnPose1(c){
  CHILD_USER_POSE_FLOW_STATE.set(c,{
    phase:"return",
    start:performance.now(),
    from:childUserCapturePose(c)
  });

  CHILD_VISIT_POSE_STATE.talkPoseLatched=true;
}

const CHILD_APPROVED_POSES={
  wall:{
    spine2:[3,0,0],
    leftShoulder:[4,0,0],
    leftArm:[15,23,12],
    leftForeArm:[28,-20,95],
    leftHand:[-81,4,0],
    rightShoulder:[7,0,0],
    rightArm:[57,9,-12],
    rightForeArm:[-25,-81,-60],
    rightHand:[-4,41,-47]
  },
  talk:{
    spine2:[0,0,0],
    leftShoulder:[4,0,0],
    leftArm:[15,23,12],
    leftForeArm:[28,-20,95],
    leftHand:[-81,4,0],
    rightShoulder:[7,0,0],
    rightArm:[57,9,-12],
    rightForeArm:[-25,-81,-60],
    rightHand:[-4,41,-47]
  }
};
const CASINO_CHILD_INITIAL={
  position:new THREE.Vector3(
    CHARACTER_CONFIGS.child.position.x,
    CHARACTER_CONFIGS.child.position.y,
    CHARACTER_CONFIGS.child.position.z
  ),
  rotation:new THREE.Euler(
    0,
    THREE.MathUtils.degToRad(-533.44),
    0
  ),
  scale:1.0
};


const CHILD_EXTRA_DENSE_WALL={
  mesh:null,
  basePosition:new THREE.Vector3(),
  tuning:{
    x:.47,
    y:0,
    z:0,
    width:.41,
    height:8.03,
    depth:39.20
  }
};

function childExtraDenseWallMaterial(){
  const source=findDenseWallSourceMaterial("internal");
  if(source){
    const mat=source.clone();
    mat.transparent=false;
    mat.opacity=1;
    mat.depthWrite=true;
    mat.depthTest=true;
    mat.side=THREE.DoubleSide;
    mat.needsUpdate=true;
    return mat;
  }

  return new THREE.MeshStandardMaterial({
    color:0x262b32,
    roughness:.9,
    metalness:0,
    side:THREE.DoubleSide
  });
}

function rebuildChildExtraDenseWallGeometry(){
  const wall=CHILD_EXTRA_DENSE_WALL.mesh;
  if(!wall) return;

  wall.geometry?.dispose?.();
  wall.geometry=new THREE.BoxGeometry(
    Math.max(.05,CHILD_EXTRA_DENSE_WALL.tuning.width),
    Math.max(.10,CHILD_EXTRA_DENSE_WALL.tuning.height),
    Math.max(.05,CHILD_EXTRA_DENSE_WALL.tuning.depth)
  );
  wall.geometry.computeBoundingBox();
  wall.geometry.computeBoundingSphere();
}

function applyChildExtraDenseWallTuning(){
  const d=CHILD_EXTRA_DENSE_WALL;
  if(!d.mesh) return;

  d.mesh.position.set(
    d.basePosition.x+d.tuning.x,
    d.basePosition.y+d.tuning.y,
    d.basePosition.z+d.tuning.z
  );

  rebuildChildExtraDenseWallGeometry();
  d.mesh.updateMatrixWorld(true);
}

function buildChildExtraDenseWall(){
  CHILD_EXTRA_DENSE_WALL.mesh?.removeFromParent?.();

  const t=CHILD_EXTRA_DENSE_WALL.tuning;

  const wall=new THREE.Mesh(
    new THREE.BoxGeometry(t.width,t.height,t.depth),
    childExtraDenseWallMaterial()
  );

  wall.name="child_extra_dense_wall";
  wall.castShadow=false;
  wall.receiveShadow=true;


  const childPos=CASINO_CHILD_INITIAL.position;

  const casinoDepthCenter=
    (SCENE_ENV_CONFIG.frontZ+SCENE_ENV_CONFIG.backZ)*.5;

  CHILD_EXTRA_DENSE_WALL.basePosition.set(
    childPos.x + 1.05,
    4.15,
    casinoDepthCenter
  );

  wall.position.copy(CHILD_EXTRA_DENSE_WALL.basePosition);

  scene.add(wall);
  CHILD_EXTRA_DENSE_WALL.mesh=wall;

  applyChildExtraDenseWallTuning();
}


queueMicrotask(buildChildExtraDenseWall);
setTimeout(buildChildExtraDenseWall,1800);

function childPoseOffsetTarget(c,bone,deg,extra=[0,0,0]){
  if(!bone) return;
  const r=getRest(c,bone);
  smoothBoneTo(
    bone,
    r.x+THREE.MathUtils.degToRad((deg?.[0]||0)+(extra?.[0]||0)),
    r.y+THREE.MathUtils.degToRad((deg?.[1]||0)+(extra?.[1]||0)),
    r.z+THREE.MathUtils.degToRad((deg?.[2]||0)+(extra?.[2]||0)),
    .115
  );
}

let CHILD_RIGHT_ARM_FROM_SECURITY_READY=false;

function copySecurityLeftArmPoseToChildRightWall(){
  if(CHILD_RIGHT_ARM_FROM_SECURITY_READY) return true;

  const security=globalThis.npcs?.find(n=>n?.name==="securityMan");
  const child=globalThis.npcs?.find(n=>n?.name==="child");

  if(!security?.ready || !child?.ready) return false;
  if(!SECURITY_INITIAL_VISIBLE_POSE?.captured) return false;

  const sb=getBones(security);

  const map=[
    ["leftShoulder","rightShoulder"],
    ["leftArm","rightArm"],
    ["leftForeArm","rightForeArm"],
    ["leftHand","rightHand"]
  ];

  for(const [securityKey,childKey] of map){
    const sBone=sb[securityKey];
    if(!sBone) continue;

    const sRest=getRest(security,sBone);
    if(!sRest) continue;

    const captured=
      SECURITY_INITIAL_VISIBLE_POSE.bones.get(sBone) ||
      sBone.rotation;

    const ox=captured.x-sRest.x;
    const oy=captured.y-sRest.y;
    const oz=captured.z-sRest.z;

    CHILD_APPROVED_POSES.wall[childKey]=[
      THREE.MathUtils.radToDeg(ox),
      THREE.MathUtils.radToDeg(-oy),
      THREE.MathUtils.radToDeg(-oz)
    ];
  }

  CHILD_RIGHT_ARM_FROM_SECURITY_READY=true;
  return true;
}

function applyChildWallPoseExact(c){
  if(!c?.ready || !c?.root) return;

  const b=getBones(c);
  const pose=CHILD_APPROVED_POSES.wall;

  const apply=(bone,deg)=>{
    if(!bone || !deg) return;
    const r=getRest(c,bone);
    if(!r) return;

    bone.rotation.set(
      r.x+THREE.MathUtils.degToRad(deg[0]||0),
      r.y+THREE.MathUtils.degToRad(deg[1]||0),
      r.z+THREE.MathUtils.degToRad(deg[2]||0)
    );
  };

  apply(b.head,pose.head);
  apply(b.neck,pose.neck);
  apply(b.hips,pose.hips);
  apply(b.spine,pose.spine);
  apply(b.spine1,pose.spine1);
  apply(b.spine2,pose.spine2);

  apply(b.leftShoulder,pose.leftShoulder);
  apply(b.rightShoulder,pose.rightShoulder);
  apply(b.leftArm,pose.leftArm);
  apply(b.rightArm,pose.rightArm);
  apply(b.leftForeArm,pose.leftForeArm);
  apply(b.rightForeArm,pose.rightForeArm);
  apply(b.leftHand,pose.leftHand);
  apply(b.rightHand,pose.rightHand);

  apply(b.leftUpLeg,pose.leftUpLeg);
  apply(b.rightUpLeg,pose.rightUpLeg);
  apply(b.leftKnee,pose.leftKnee);
  apply(b.rightKnee,pose.rightKnee);
  apply(b.leftFoot,pose.leftFoot);
  apply(b.rightFoot,pose.rightFoot);
  apply(b.leftToe,pose.leftToe);
  apply(b.rightToe,pose.rightToe);

  c.root.updateMatrixWorld(true);
}

function resetCasinoChildToWall(){
  const child=globalThis.npcs?.find(n=>n?.name==="child");
  if(!child?.ready || !child?.root) return false;

  copySecurityLeftArmPoseToChildRightWall();

  CHILD_VISIT_POSE_STATE.talkStart=0;
  CHILD_VISIT_POSE_STATE.talkStartPos=null;
  CHILD_VISIT_POSE_STATE.talkPoseLatched=false;
  CHILD_VISIT_POSE_STATE.stableYaw=CASINO_CHILD_INITIAL.rotation.y;

  CHILD_ADVANCED_TALK_STATE.delete(child);
  if(typeof CHILD_NEW_TALK_STATE!=="undefined"){
    CHILD_NEW_TALK_STATE.delete(child);
  }

  NPC_CONVERSATION_FINAL_LATCH.delete(child);
  NPC_TALK_TURN_STEP_STATE.delete(child);

  child.state="idle";
  child.timer=0;

  child.root.position.copy(CASINO_CHILD_INITIAL.position);
  child.root.rotation.copy(CASINO_CHILD_INITIAL.rotation);
  child.root.scale.setScalar(CASINO_CHILD_INITIAL.scale);

  applyChildWallPoseExact(child);
  return true;
}

function ensureCasinoChildInitialSetup(c){
  if(!c?.root) return;
  if(!c.root.userData.casinoChildInitialSetup){
    c.root.position.copy(CASINO_CHILD_INITIAL.position);
    c.root.rotation.copy(CASINO_CHILD_INITIAL.rotation);
    c.root.scale.setScalar(CASINO_CHILD_INITIAL.scale);
    c.root.updateMatrixWorld(true);
    c.root.userData.casinoChildInitialSetup=true;
    CHILD_VISIT_POSE_STATE.stableYaw=c.root.rotation.y;
  }
  if(CASINO_EDITABLE_OBJECTS.child!==c.root){
    registerCasinoEditable("child",c.root);
  }
}
function animateCasinoChildPostDialoguePose(c){
  if(!c?.ready) return;
  ensureCasinoChildInitialSetup(c);

  let s=CHILD_USER_POSE_FLOW_STATE.get(c);

  if(!s || s.phase==="done"){
    childUserApplyPose(c,CHILD_USER_POSE_1);

    childUserApplyLegTurnOverlay(c,0);
    return;
  }

  if(s.phase!=="return"){
    childUserBeginReturnPose1(c);
    s=CHILD_USER_POSE_FLOW_STATE.get(c);
  }

  const raw=
    (performance.now()-s.start) /
    CHILD_USER_POSE_FLOW.returnMs;

  const t=childUserSmooth01(raw);

  const p=childUserLerpPose(
    s.from,
    CHILD_USER_POSE_1,
    t
  );

  p.leftFingerCurl=THREE.MathUtils.lerp(
    s.from?.leftFingerCurl||CHILD_USER_POSE_2.leftFingerCurl,
    CHILD_USER_POSE_1.leftFingerCurl,
    t
  );
  p.rightFingerCurl=THREE.MathUtils.lerp(
    s.from?.rightFingerCurl||CHILD_USER_POSE_2.rightFingerCurl,
    CHILD_USER_POSE_1.rightFingerCurl,
    t
  );

  const settle=Math.sin((1-t)*Math.PI);
  p.head=[settle*.55,0,0];
  p.neck=[settle*.24,0,0];

  childUserApplyPose(c,p);

  childUserApplyLegTurnOverlay(c,0);

  if(raw>=1){
    s.phase="done";
    s.start=performance.now();
  }
}
function animateCasinoChildInitialIdle(c){
  if(!c?.ready) return;
  ensureCasinoChildInitialSetup(c);

  copySecurityLeftArmPoseToChildRightWall();
  c.root.position.copy(CASINO_CHILD_INITIAL.position);
  c.root.rotation.copy(CASINO_CHILD_INITIAL.rotation);
  c.root.scale.setScalar(CASINO_CHILD_INITIAL.scale);
  c.root.updateMatrixWorld(true);
  if(CHILD_VISIT_POSE_STATE.talkPoseLatched){
    animateCasinoChildPostDialoguePose(c);
    return;
  }
  const b=getBones(c);
  const pose=CHILD_APPROVED_POSES.wall;
  const t=performance.now()*.001;
  const sway=Math.sin(t*.78);
  const sway2=Math.sin(t*.53+1.15);
  const amp=.34;
  childPoseOffsetTarget(c,b.spine2,pose.spine2,[sway2*amp*.32,sway*amp*.16,sway*amp*.10]);
  childPoseOffsetTarget(c,b.leftShoulder,pose.leftShoulder,[0,0,sway2*amp*.16]);
  childPoseOffsetTarget(c,b.leftArm,pose.leftArm,[sway*amp*.18,sway2*amp*.10,sway2*amp*.18]);
  childPoseOffsetTarget(c,b.leftForeArm,pose.leftForeArm,[0,sway2*amp*.10,sway*amp*.20]);
  childPoseOffsetTarget(c,b.leftHand,pose.leftHand,[sway2*amp*.16,sway*amp*.22,0]);
  childPoseOffsetTarget(c,b.rightShoulder,pose.rightShoulder,[0,0,-sway2*amp*.16]);
  childPoseOffsetTarget(c,b.rightArm,pose.rightArm,[-sway*amp*.14,-sway2*amp*.08,-sway2*amp*.18]);
  childPoseOffsetTarget(c,b.rightForeArm,pose.rightForeArm,[0,-sway2*amp*.10,-sway*amp*.20]);
  childPoseOffsetTarget(c,b.rightHand,pose.rightHand,[-sway2*amp*.16,-sway*amp*.22,0]);
  const rightLookWave=Math.sin(t*.82+.55);
  const rightLookWave2=Math.sin(t*.57+1.35);
  if(b.rightArm){
    const r=getRest(c,b.rightArm);
    const base=pose.rightArm;
    b.rightArm.rotation.y=THREE.MathUtils.lerp(
      b.rightArm.rotation.y,
      r.y+THREE.MathUtils.degToRad((base[1]||0)+rightLookWave*.55),
      .035
    );
    b.rightArm.rotation.z=THREE.MathUtils.lerp(
      b.rightArm.rotation.z,
      r.z+THREE.MathUtils.degToRad((base[2]||0)+rightLookWave2*.40),
      .035
    );
  }
  if(b.rightForeArm){
    const r=getRest(c,b.rightForeArm);
    const base=pose.rightForeArm;
    b.rightForeArm.rotation.y=THREE.MathUtils.lerp(
      b.rightForeArm.rotation.y,
      r.y+THREE.MathUtils.degToRad((base[1]||0)+rightLookWave2*.75),
      .040
    );
    b.rightForeArm.rotation.z=THREE.MathUtils.lerp(
      b.rightForeArm.rotation.z,
      r.z+THREE.MathUtils.degToRad((base[2]||0)+rightLookWave*.60),
      .040
    );
  }
  if(b.rightHand){
    const r=getRest(c,b.rightHand);
    const base=pose.rightHand;
    b.rightHand.rotation.y=THREE.MathUtils.lerp(
      b.rightHand.rotation.y,
      r.y+THREE.MathUtils.degToRad((base[1]||0)+rightLookWave*1.15),
      .045
    );
    b.rightHand.rotation.z=THREE.MathUtils.lerp(
      b.rightHand.rotation.z,
      r.z+THREE.MathUtils.degToRad((base[2]||0)+rightLookWave2*.85),
      .045
    );
  }
  const bodyAmp=.62;
  const headAmp=.85;
  if(b.spine){
    const r=getRest(c,b.spine);
    smoothBoneTo(
      b.spine,
      r.x+THREE.MathUtils.degToRad(Math.sin(t*.66+.4)*bodyAmp*.16),
      r.y+THREE.MathUtils.degToRad(Math.sin(t*.48+1.1)*bodyAmp*.20),
      r.z+THREE.MathUtils.degToRad(Math.sin(t*.57+2.0)*bodyAmp*.12),
      .085
    );
  }
  if(b.neck){
    const r=getRest(c,b.neck);
    smoothBoneTo(
      b.neck,
      r.x+THREE.MathUtils.degToRad(Math.sin(t*.71+1.4)*headAmp*.22),
      r.y+THREE.MathUtils.degToRad(Math.sin(t*.43+.2)*headAmp*.34),
      r.z+THREE.MathUtils.degToRad(Math.sin(t*.61+2.2)*headAmp*.12),
      .085
    );
  }
  if(b.head){
    const r=getRest(c,b.head);
    smoothBoneTo(
      b.head,
      r.x+THREE.MathUtils.degToRad(Math.sin(t*.73+.8)*headAmp*.34),
      r.y+THREE.MathUtils.degToRad(Math.sin(t*.39+1.8)*headAmp*.52),
      r.z+THREE.MathUtils.degToRad(Math.sin(t*.55+.5)*headAmp*.18),
      .085
    );
  }
}
function animateIdle(c){
  if(!c.ready) return;
  if(c.name==="player"){
    animatePlayerProceduralIdle(c);
    return;
  }
  if(c.name==="child"){
    animateCasinoChildInitialIdle(c);
    return;
  }
  if(
    c.name==="toxicMan" &&
    STOREKEEPER_FINAL.thiefDialogueDone &&
    (
      QUEST.stage==="call_security" ||
      STOREKEEPER_FINAL.policeSummoned ||
      STOREKEEPER_FINAL.finishing
    )
  ){
    animateThiefCounter10Pose(c);
    return;
  }
  const b=getBones(c);
  const t=performance.now()*.0035;
  const s=Math.sin(t);
  const s2=Math.sin(t*.7);
  const pose=getPose(c);
  const talkCfg=TALK_POSES[c.name];
  if(c.name==="toxicMan" && TOXIC_MAN_STATIC_CONFIG.enabled){
    animateToxicNeutralIdle(c,b);
    return;
  }else if(c.name==="securityMan"){
    const idlePose={
      arm:{x:.80,y:-.25,z:-.36},
      fore:{x:-.10,y:-1.30,z:-0.80},
      hand:{x:.10,y:-.124,z:-.52}
    };
    smoothBoneTo(b.leftArm,talkCfg.leftArm.restX,talkCfg.leftArm.restY,talkCfg.leftArm.restZ,.14);
    smoothBoneTo(b.leftForeArm,talkCfg.leftForeArm.restX,talkCfg.leftForeArm.restY,talkCfg.leftForeArm.restZ,.14);
    smoothBoneTo(
      b.leftHand,
      getRest(c,b.leftHand).x+talkCfg.leftHand.restX,
      getRest(c,b.leftHand).y+talkCfg.leftHand.restY,
      getRest(c,b.leftHand).z+talkCfg.leftHand.restZ,
      .14
    );
    smoothBoneTo(b.rightArm,idlePose.arm.x,idlePose.arm.y,idlePose.arm.z,.14);
    smoothBoneTo(b.rightForeArm,idlePose.fore.x,idlePose.fore.y,idlePose.fore.z,.14);
    smoothBoneTo(
      b.rightHand,
      getRest(c,b.rightHand).x+idlePose.hand.x,
      getRest(c,b.rightHand).y+idlePose.hand.y,
      getRest(c,b.rightHand).z+idlePose.hand.z,
      .14
    );
    animateSecurityFingers(c,false);
  }else if(talkCfg){
    const fullEditableArms =
      typeof talkCfg.leftForeArm === "object" &&
      typeof talkCfg.rightForeArm === "object";
    if(fullEditableArms){
      smoothBoneTo(b.leftArm,talkCfg.leftArm.restX,talkCfg.leftArm.restY,talkCfg.leftArm.restZ,.14);
      smoothBoneTo(b.rightArm,talkCfg.rightArm.restX,talkCfg.rightArm.restY,talkCfg.rightArm.restZ,.14);
      smoothBoneTo(b.leftForeArm,talkCfg.leftForeArm.restX,talkCfg.leftForeArm.restY,talkCfg.leftForeArm.restZ,.14);
      smoothBoneTo(b.rightForeArm,talkCfg.rightForeArm.restX,talkCfg.rightForeArm.restY,talkCfg.rightForeArm.restZ,.14);
      smoothBoneTo(
        b.leftHand,
        getRest(c,b.leftHand).x + talkCfg.leftHand.restX,
        getRest(c,b.leftHand).y + talkCfg.leftHand.restY,
        getRest(c,b.leftHand).z + talkCfg.leftHand.restZ,
        .14
      );
      smoothBoneTo(
        b.rightHand,
        getRest(c,b.rightHand).x + talkCfg.rightHand.restX,
        getRest(c,b.rightHand).y + talkCfg.rightHand.restY,
        getRest(c,b.rightHand).z + talkCfg.rightHand.restZ,
        .14
      );
    }else{
      smoothBoneTo(b.leftArm,talkCfg.leftArm.restX,0,talkCfg.leftArm.restZ,.14);
      smoothBoneTo(b.rightArm,talkCfg.rightArm.restX,0,talkCfg.rightArm.restZ,.14);
      smoothBoneTo(b.leftForeArm,talkCfg.leftForeArmX,0,0,.14);
      smoothBoneTo(b.rightForeArm,talkCfg.rightForeArmX,0,0,.14);
    }
  }else{
    smoothBoneTo(b.leftArm,pose.armX,0,0,.14);
    smoothBoneTo(b.rightArm,pose.armX,0,0,.14);
    if(c.name==="player"){
      smoothBoneTo(
        b.leftForeArm,
        pose.foreArmX,
        0,
        0,
        .14
      );
      smoothBoneTo(
        b.rightForeArm,
        pose.foreArmX,
        0,
        0,
        .14
      );
    }else{
      smoothBoneTo(b.leftForeArm,pose.foreArmX,0,0,.14);
      smoothBoneTo(b.rightForeArm,pose.foreArmX,0,0,.14);
    }
  }
  if(c.name==="player"){
    smoothBoneTo(
      b.leftUpLeg,
      getRest(c,b.leftUpLeg).x,
      getRest(c,b.leftUpLeg).y,
      getRest(c,b.leftUpLeg).z,
      .10
    );
    smoothBoneTo(
      b.rightUpLeg,
      getRest(c,b.rightUpLeg).x,
      getRest(c,b.rightUpLeg).y,
      getRest(c,b.rightUpLeg).z,
      .10
    );
    smoothBoneTo(
      b.leftKnee,
      getRest(c,b.leftKnee).x,
      getRest(c,b.leftKnee).y,
      getRest(c,b.leftKnee).z,
      .12
    );
    smoothBoneTo(
      b.rightKnee,
      getRest(c,b.rightKnee).x,
      getRest(c,b.rightKnee).y,
      getRest(c,b.rightKnee).z,
      .12
    );
    smoothBoneTo(
      b.leftFoot,
      getRest(c,b.leftFoot).x,
      getRest(c,b.leftFoot).y,
      getRest(c,b.leftFoot).z,
      .12
    );
    smoothBoneTo(
      b.rightFoot,
      getRest(c,b.rightFoot).x,
      getRest(c,b.rightFoot).y,
      getRest(c,b.rightFoot).z,
      .12
    );
  }
  smoothBoneTo(
    b.hips,
    getRest(c,b.hips).x+s2*.003,
    getRest(c,b.hips).y+s*.004,
    getRest(c,b.hips).z-s*.004,
    .09
  );
  smoothBoneTo(
    b.spine,
    getRest(c,b.spine).x+s2*.006,
    getRest(c,b.spine).y,
    getRest(c,b.spine).z+s*.012,
    .09
  );
  smoothBoneTo(
    b.neck,
    getRest(c,b.neck).x+s2*.004,
    getRest(c,b.neck).y+s*.014,
    getRest(c,b.neck).z,
    .09
  );
  smoothBoneTo(
    b.head,
    getRest(c,b.head).x+s2*.007,
    getRest(c,b.head).y+s*.026,
    getRest(c,b.head).z+s2*.008,
    .09
  );
  if(c.model){
    const baseY=
      c.name==="securityMan" &&
      Number.isFinite(c.__securityModelBaseY)
        ? c.__securityModelBaseY
        : 0;

    c.model.position.y=THREE.MathUtils.lerp(
      c.model.position.y,
      baseY+Math.abs(s)*.004,
      .12
    );
  }
  animateNpcPersonality(c,b,false);
  animateSecurityFingers(c,false);
  animateSecurityHeadSpeech(c,false);
}
const PLAYER_PROCEDURAL_WALK_CONFIG={
  format:"procedural-walk-config",
  version:1,
  speed:1.12,
  stride:0.250,
  knee:0.78,
  ankle:0.32,
  armAmount:0.70,
  shoulderIn:0.29,
  shoulderPoseX:0.00,
  shoulderPoseY:-0.41,
  shoulderPoseZ:0.00,
  armPoseX:0.00,
  armPoseY:0.00,
  armPoseZ:0.00,
  forearmPoseX:0.20,
  forearmPoseY:0.00,
  forearmPoseZ:0.00,
  handPoseX:-0.16,
  handPoseY:-0.08,
  handPoseZ:0.00,
  armSwingX:1.00,
  armSwingY:0.00,
  armSwingZ:0.00,
  forearmSwingX:0.12,
  forearmSwingY:0.00,
  forearmSwingZ:0.00,
  handSwingX:0.00,
  handSwingY:0.00,
  handSwingZ:0.00,
  floorClearance:0.075,
  mirrorArmPose:true,
  invertLeftArm:false,
  invertRightArm:false,
  invertHips:false,
  invertKnees:false,
  cycleRadiansPerSecond:4.85,
  shoulderSwingFactor:0.05,
  toeFactor:0.52,
  pelvisTwist:0.012,
  pelvisRoll:0.004,
  breathingSway:0.003,
  oldArms:{
    shoulderZ:0.0,
    armSwingX:-0.01,
    armBaseX:-0.04,
    leftArmZMin:0.20,
    leftArmZMax:-0.50,
    rightArmZMin:-0.20,
    rightArmZMax:0.50,
    foreArmBaseX:0.06,
    foreArmMoveX:0.045,
    leftForeArmZBase:0.00,
    leftForeArmZMin:0.15,
    leftForeArmZMax:0.25,
    rightForeArmZBase:0.00,
    rightForeArmZMin:-0.15,
    rightForeArmZMax:-0.25,
    handZ:0.025
  },
  walkPoseLerp:0.28,
  stopPoseLerp:0.075,
  stopPositionLerp:0.08
};
const PLAYER_AXIS_RIGHT=new THREE.Vector3(1,0,0);
const PLAYER_AXIS_UP=new THREE.Vector3(0,1,0);
const PLAYER_AXIS_FORWARD=new THREE.Vector3(0,0,1);
const PLAYER_PROCEDURAL_STATE=new WeakMap();

function getPlayerFingerBones(c,bones){
  const fingers=[];
  const seen=new Set();

  const detectFinger=(name)=>{
    const n=String(name||"").toLowerCase();
    if(n.includes("thumb")) return "thumb";
    if(n.includes("index")) return "index";
    if(n.includes("middle")) return "middle";
    if(n.includes("ring")) return "ring";
    if(n.includes("pinky") || n.includes("little")) return "pinky";
    return null;
  };

  const detectSide=(bone)=>{
    const chain=[];
    let node=bone;
    for(let i=0;node && i<6;i++,node=node.parent){
      chain.push(String(node.name||"").toLowerCase());
    }
    const all=chain.join(" ");

    if(
      /(^|[^a-z])(left|l)([^a-z]|$)/.test(all) ||
      all.includes("lefthand") ||
      all.includes("hand_l") ||
      all.includes("hand.l") ||
      all.includes("_l_") ||
      all.includes(".l.")
    ) return "left";

    if(
      /(^|[^a-z])(right|r)([^a-z]|$)/.test(all) ||
      all.includes("righthand") ||
      all.includes("hand_r") ||
      all.includes("hand.r") ||
      all.includes("_r_") ||
      all.includes(".r.")
    ) return "right";

    return null;
  };

  const addBone=(bone,forcedSide=null)=>{
    if(!bone?.isBone || seen.has(bone)) return;

    const finger=detectFinger(bone.name);
    if(!finger) return;

    const side=forcedSide || detectSide(bone);
    if(!side) return;

    seen.add(bone);
    fingers.push({
      bone,
      side,
      finger,
      name:String(bone.name||"").toLowerCase()
    });
  };


  c?.model?.traverse?.((bone)=>addBone(bone));


  bones.leftHand?.traverse?.((bone)=>addBone(bone,"left"));
  bones.rightHand?.traverse?.((bone)=>addBone(bone,"right"));

  return fingers;
}

function applyPlayerFingerCurl(c,state,phase,amount=1){
  const fingers=state.fingers||[];
  if(!fingers.length) return;


  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const isThumb=f.finger==="thumb";
    const segment=f.segment||2;

    const sidePhase=
      f.side==="left"
        ? phase*1.35
        : phase*1.35+Math.PI*.65;

    const pulse=(Math.sin(sidePhase)+1)*.5;

    const base=isThumb ? .012 : .020;
    const movingCurl=isThumb ? .018 : .032;

    const segmentGain=
      segment<=1 ? .48 :
      segment===2 ? .70 :
      segment===3 ? .82 :
      .16;

    const curl=
      (base+pulse*movingCurl)*
      segmentGain*
      amount;

    setPlayerBoneAxisRotation(
      c,
      state,
      f.bone,
      PLAYER_AXIS_RIGHT,
      curl
    );
  }
}

function createPlayerProceduralState(c){
  const b=getBones(c);
  const restQ=new Map();
  const restP=new Map();
  Object.values(b).filter(Boolean).forEach((bone)=>{
    restQ.set(bone,bone.quaternion.clone());
    restP.set(bone,bone.position.clone());
  });
  const fingers=getPlayerFingerBones(c,b);
  fingers.forEach(({bone})=>{
    if(!restQ.has(bone)) restQ.set(bone,bone.quaternion.clone());
    if(!restP.has(bone)) restP.set(bone,bone.position.clone());
  });
  const state={
    bones:b,
    fingers,
    restQ,
    restP,
    phase:0,
    lastTime:performance.now(),
    initialized:true,
    modelBaseY:c.model ? c.model.position.y : 0
  };
  PLAYER_PROCEDURAL_STATE.set(c,state);
  return state;
}
function getPlayerProceduralState(c){
  let state=PLAYER_PROCEDURAL_STATE.get(c);
  if(!state || !state.initialized || state.bones.hips?.parent===null){
    state=createPlayerProceduralState(c);
  }
  return state;
}
function smooth01(v){
  const x=THREE.MathUtils.clamp(v,0,1);
  return x*x*(3-2*x);
}
function getPlayerGaitPhase(phase){
  const s=Math.sin(phase);
  const c=Math.cos(phase);
  const pushOff=smooth01((-c-0.08)/0.92);
  const swingLift=smooth01((-s+0.02)/1.02);
  const landing=smooth01((c-0.08)/0.92);
  const support=smooth01((s+0.15)/1.15)*smooth01((c+0.35)/1.35);
  const knee=
    pushOff*0.34+
    swingLift*0.90-
    landing*0.08;
  const ankle=
    -s*0.20+
    pushOff*0.38-
    landing*0.22-
    support*0.05;
  const toe=
    pushOff*0.50-
    landing*0.06;
  return {
    hip:s,
    knee:Math.max(0.02,knee),
    ankle,
    toe
  };
}
function restorePlayerProceduralPose(state){
  for(const [bone,q] of state.restQ){
    bone.quaternion.copy(q);
  }
  for(const [bone,p] of state.restP){
    bone.position.copy(p);
  }
}
function getPlayerAxisInBoneParent(c,bone,axisInModel){
  if(!c.model || !bone || !bone.parent) return null;
  c.model.updateMatrixWorld(true);
  bone.parent.updateMatrixWorld(true);
  const modelWorldQ=new THREE.Quaternion();
  const parentWorldQ=new THREE.Quaternion();
  c.model.getWorldQuaternion(modelWorldQ);
  bone.parent.getWorldQuaternion(parentWorldQ);
  return axisInModel.clone()
    .applyQuaternion(modelWorldQ)
    .normalize()
    .applyQuaternion(parentWorldQ.invert())
    .normalize();
}
function setPlayerBoneAxisRotation(c,state,bone,axisInModel,angle){
  if(!bone || !state.restQ.has(bone)) return;
  const axisParent=getPlayerAxisInBoneParent(c,bone,axisInModel);
  if(!axisParent) return;
  const deltaQ=new THREE.Quaternion().setFromAxisAngle(axisParent,angle);
  bone.quaternion.copy(state.restQ.get(bone));
  bone.quaternion.premultiply(deltaQ);
}
function addPlayerBoneAxisRotation(c,bone,axisInModel,angle){
  if(!bone) return;
  const axisParent=getPlayerAxisInBoneParent(c,bone,axisInModel);
  if(!axisParent) return;
  const deltaQ=new THREE.Quaternion().setFromAxisAngle(axisParent,angle);
  bone.quaternion.premultiply(deltaQ);
}
function applyPlayerOldArms(c,state,phase,isWalking){
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG.oldArms;
  const b=state.bones;
  const pose=getPose(c);
  const walk=Math.sin(phase);
  const walkOpp=Math.sin(phase+Math.PI);
  if(isWalking){
    if(b.leftShoulder){
      b.leftShoulder.rotation.set(
        getRest(c,b.leftShoulder).x,
        getRest(c,b.leftShoulder).y,
        getRest(c,b.leftShoulder).z+walkOpp*cfg.shoulderZ
      );
    }
    if(b.rightShoulder){
      b.rightShoulder.rotation.set(
        getRest(c,b.rightShoulder).x,
        getRest(c,b.rightShoulder).y,
        getRest(c,b.rightShoulder).z+walk*cfg.shoulderZ
      );
    }
    const leftArmZAmount=(walkOpp+1)*0.5;
    const rightArmZAmount=(walk+1)*0.5;
    const leftArmZ=THREE.MathUtils.lerp(
      cfg.leftArmZMin,
      cfg.leftArmZMax,
      leftArmZAmount
    );
    const rightArmZ=THREE.MathUtils.lerp(
      cfg.rightArmZMin,
      cfg.rightArmZMax,
      rightArmZAmount
    );
    if(b.leftArm){
      b.leftArm.rotation.set(
        pose.armX+cfg.armBaseX+walkOpp*cfg.armSwingX,
        0,
        leftArmZ
      );
    }
    if(b.rightArm){
      b.rightArm.rotation.set(
        pose.armX+cfg.armBaseX+walk*cfg.armSwingX,
        0,
        rightArmZ
      );
    }
    const leftElbowZAmount=(walkOpp+1)*0.5;
    const rightElbowZAmount=(walk+1)*0.5;
    const leftForeArmZ=THREE.MathUtils.lerp(
      cfg.leftForeArmZMin,
      cfg.leftForeArmZMax,
      leftElbowZAmount
    );
    const rightForeArmZ=THREE.MathUtils.lerp(
      cfg.rightForeArmZMin,
      cfg.rightForeArmZMax,
      rightElbowZAmount
    );
    if(b.leftForeArm){
      b.leftForeArm.rotation.set(
        pose.foreArmX+cfg.foreArmBaseX+Math.max(0,walk)*cfg.foreArmMoveX,
        0,
        leftForeArmZ
      );
    }
    if(b.rightForeArm){
      b.rightForeArm.rotation.set(
        pose.foreArmX+cfg.foreArmBaseX+Math.max(0,walkOpp)*cfg.foreArmMoveX,
        0,
        rightForeArmZ
      );
    }
    if(b.leftHand){
      b.leftHand.rotation.set(
        getRest(c,b.leftHand).x,
        getRest(c,b.leftHand).y,
        getRest(c,b.leftHand).z+walkOpp*cfg.handZ
      );
    }
    if(b.rightHand){
      b.rightHand.rotation.set(
        getRest(c,b.rightHand).x,
        getRest(c,b.rightHand).y,
        getRest(c,b.rightHand).z+walk*cfg.handZ
      );
    }
  }else{
    if(b.leftShoulder){
      b.leftShoulder.rotation.copy(getRest(c,b.leftShoulder));
    }
    if(b.rightShoulder){
      b.rightShoulder.rotation.copy(getRest(c,b.rightShoulder));
    }
    if(b.leftArm){
      b.leftArm.rotation.set(pose.armX,0,0);
    }
    if(b.rightArm){
      b.rightArm.rotation.set(pose.armX,0,0);
    }
    if(b.leftForeArm){
      b.leftForeArm.rotation.set(
        pose.foreArmX,
        0,
        cfg.leftForeArmZBase
      );
    }
    if(b.rightForeArm){
      b.rightForeArm.rotation.set(
        pose.foreArmX,
        0,
        cfg.rightForeArmZBase
      );
    }
    if(b.leftHand){
      b.leftHand.rotation.copy(getRest(c,b.leftHand));
    }
    if(b.rightHand){
      b.rightHand.rotation.copy(getRest(c,b.rightHand));
    }
  }
}
function applyPlayerOldArmsTurn(c,state,phase){
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG.oldArms;
  const b=state.bones;
  const pose=getPose(c);

  // Dedicated A/D turn arm cycle.
  // Same idea as oldArms, but with smaller swing values.
  const turn=Math.sin(phase*.82);
  const turnOpp=Math.sin(phase*.82+Math.PI);

  const SHOULDER_SWING_SCALE=AD_TURN_WALK.shoulderSwing;
  const ARM_SWING_SCALE=AD_TURN_WALK.armSwing;
  const FOREARM_SWING_SCALE=AD_TURN_WALK.forearmSwing;
  const HAND_SWING_SCALE=AD_TURN_WALK.handSwing;

  if(b.leftShoulder){
    b.leftShoulder.rotation.set(
      getRest(c,b.leftShoulder).x,
      getRest(c,b.leftShoulder).y,
      getRest(c,b.leftShoulder).z+
        turnOpp*cfg.shoulderZ*SHOULDER_SWING_SCALE
    );
  }

  if(b.rightShoulder){
    b.rightShoulder.rotation.set(
      getRest(c,b.rightShoulder).x,
      getRest(c,b.rightShoulder).y,
      getRest(c,b.rightShoulder).z+
        turn*cfg.shoulderZ*SHOULDER_SWING_SCALE
    );
  }

  const leftArmZAmount=(turnOpp+1)*.5;
  const rightArmZAmount=(turn+1)*.5;

  const leftArmZ=THREE.MathUtils.lerp(
    cfg.leftArmZMin,
    cfg.leftArmZMax,
    leftArmZAmount
  );

  const rightArmZ=THREE.MathUtils.lerp(
    cfg.rightArmZMin,
    cfg.rightArmZMax,
    rightArmZAmount
  );

  if(b.leftArm){
    b.leftArm.rotation.set(
      pose.armX+
        cfg.armBaseX+
        turnOpp*cfg.armSwingX*ARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        pose.armZ||0,
        leftArmZ,
        ARM_SWING_SCALE
      )
    );
  }

  if(b.rightArm){
    b.rightArm.rotation.set(
      pose.armX+
        cfg.armBaseX+
        turn*cfg.armSwingX*ARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        pose.armZ||0,
        rightArmZ,
        ARM_SWING_SCALE
      )
    );
  }

  const leftElbowZAmount=(turnOpp+1)*.5;
  const rightElbowZAmount=(turn+1)*.5;

  const leftForeArmZ=THREE.MathUtils.lerp(
    cfg.leftForeArmZMin,
    cfg.leftForeArmZMax,
    leftElbowZAmount
  );

  const rightForeArmZ=THREE.MathUtils.lerp(
    cfg.rightForeArmZMin,
    cfg.rightForeArmZMax,
    rightElbowZAmount
  );

  if(b.leftForeArm){
    b.leftForeArm.rotation.set(
      pose.foreArmX+
        cfg.foreArmBaseX+
        Math.max(0,turn)*cfg.foreArmMoveX*FOREARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        cfg.leftForeArmZBase,
        leftForeArmZ,
        FOREARM_SWING_SCALE
      )
    );
  }

  if(b.rightForeArm){
    b.rightForeArm.rotation.set(
      pose.foreArmX+
        cfg.foreArmBaseX+
        Math.max(0,turnOpp)*cfg.foreArmMoveX*FOREARM_SWING_SCALE,
      0,
      THREE.MathUtils.lerp(
        cfg.rightForeArmZBase,
        rightForeArmZ,
        FOREARM_SWING_SCALE
      )
    );
  }

  if(b.leftHand){
    b.leftHand.rotation.set(
      getRest(c,b.leftHand).x,
      getRest(c,b.leftHand).y,
      getRest(c,b.leftHand).z+
        turnOpp*cfg.handZ*HAND_SWING_SCALE
    );
  }

  if(b.rightHand){
    b.rightHand.rotation.set(
      getRest(c,b.rightHand).x,
      getRest(c,b.rightHand).y,
      getRest(c,b.rightHand).z+
        turn*cfg.handZ*HAND_SWING_SCALE
    );
  }
}

function capturePlayerPose(state){
  const snapshot=new Map();
  for(const bone of state.restQ.keys()){
    snapshot.set(bone,{
      quaternion:bone.quaternion.clone(),
      position:bone.position.clone()
    });
  }
  return snapshot;
}
function blendPlayerPoseFromSnapshot(state,snapshot,amount,positionAmount=amount){
  const targetQ=new THREE.Quaternion();
  const targetP=new THREE.Vector3();
  for(const bone of state.restQ.keys()){
    const previous=snapshot.get(bone);
    if(!previous) continue;
    targetQ.copy(bone.quaternion);
    bone.quaternion.copy(previous.quaternion).slerp(targetQ,amount);
    targetP.copy(bone.position);
    bone.position.copy(previous.position).lerp(targetP,positionAmount);
  }
}
function solvePlayerFloorCollision(c,state){
  return solveCharacterFloorContact({
    THREE,
    character:c,
    player,
    state,
    floorClearance:PLAYER_PROCEDURAL_WALK_CONFIG.floorClearance
  });
}

function applyPlayerRealFingerCurl(c,state,lateralTurnOnly,comboTurn=false){
  const fingers=state?.fingers||[];
  if(!fingers.length) return;

  const phase=state.phase||0;
  const walkPulse=(Math.sin(phase*1.15)+1)*.5;


  const baseCurl=(lateralTurnOnly || comboTurn)
    ? 0
    : PLAYER_HAND_TUNING.walkFingerCurl;

  const leftScale=PLAYER_HAND_TUNING.walkFingerCurlLeft ?? 1;
  const rightScale=PLAYER_HAND_TUNING.walkFingerCurlRight ?? 1;

  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const n=String(f.name||f.bone.name||"").toLowerCase();
    const isThumb=n.includes("thumb");
    const m=n.match(/(?:thumb|index|middle|ring|pinky|little)[^0-9]*([1-4])/);
    const segment=m ? Number(m[1]) : 2;


    const segmentGain=
      segment===1 ? .70 :
      segment===2 ? .95 :
      segment===3 ? 1.08 :
      1.14;

    const sideScale=f.side==="left" ? leftScale : rightScale;
    const sideSign=f.side==="left" ? 1 : -1;


    const closeRadians=(isThumb ? .32 : .46) * baseCurl * segmentGain * sideScale;
    const gaitVariation=lateralTurnOnly ? 1 : (.88 + walkPulse*.12);

    setPlayerBoneAxisRotation(
      c,state,f.bone,PLAYER_AXIS_RIGHT,
      closeRadians*gaitVariation*sideSign
    );


    if(isThumb){
      addPlayerBoneAxisRotation(
        c,f.bone,PLAYER_AXIS_UP,
        .10*baseCurl*sideScale*(f.side==="left" ? 1 : -1)
      );
    }
  }
}


const AD_TURN_WALK_DEFAULTS=Object.freeze({
  cycleScale:1.00,
  legScale:.13,
  footScale:.075,
  outsideLiftDeg:1.70,
  outsideKneeDeg:1.35,
  outsideFootDeg:.60,
  footYawDeg:.85,
  ankleRollDeg:.30,
  ankleFlexDeg:.35,
  legYawDeg:.90,
  kneeYawDeg:.75,
  armBlend:.62,
  shoulderSwing:.38,
  armSwing:.42,
  forearmSwing:.40,
  handSwing:.34
});
const AD_TURN_WALK={...AD_TURN_WALK_DEFAULTS};

function animatePlayerWalk(c,direction=1,strafe=0){
if(!c.ready || !c.model) return;
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG;
  const state=getPlayerProceduralState(c);
  const b=state.bones;
  const now=performance.now();
  const delta=Math.min((now-state.lastTime)/1000,0.05);
  state.lastTime=now;
  const gaitDirection=direction<0 ? -1 : 1;
  const gaitSpeed=direction<0 ? .68 : 1.0;
const lateralTurnOnly=
    Math.abs(strafe)>.001 &&
    gaitDirection>0;

  const soloTurnMotionScale=
    lateralTurnOnly ? .028 : 1.0;

  const soloTurnLegScale=
    lateralTurnOnly ? AD_TURN_WALK.legScale : 1.0;
  state.phase+=
    delta*
    cfg.cycleRadiansPerSecond*
    Math.max(cfg.speed,0.04)*
    gaitDirection*
    gaitSpeed*
    (lateralTurnOnly ? AD_TURN_WALK.cycleScale : 1)*
    (AD_CURRENT_FRAME_ACTIVE?AD_CURRENT.walkCycleScale:1);
  const previousPose=capturePlayerPose(state);
  restorePlayerProceduralPose(state);
  const left=getPlayerGaitPhase(state.phase);
  const right=getPlayerGaitPhase(state.phase+Math.PI);
  const legSign=cfg.invertHips ? -1 : 1;
  const kneeSign=cfg.invertKnees ? -1 : 1;
  left.hip*=legSign;
  right.hip*=legSign;
  setPlayerBoneAxisRotation(c,state,b.leftUpLeg,PLAYER_AXIS_RIGHT,left.hip*cfg.stride*soloTurnLegScale);
  setPlayerBoneAxisRotation(c,state,b.rightUpLeg,PLAYER_AXIS_RIGHT,right.hip*cfg.stride*soloTurnLegScale);
  setPlayerBoneAxisRotation(
    c,state,b.leftKnee,PLAYER_AXIS_RIGHT,
    kneeSign*left.knee*cfg.knee*soloTurnLegScale
  );
  setPlayerBoneAxisRotation(
    c,state,b.rightKnee,PLAYER_AXIS_RIGHT,
    kneeSign*right.knee*cfg.knee*soloTurnLegScale
  );


  const turnFootScale=
    lateralTurnOnly ? AD_TURN_WALK.footScale : 1.0;

  const turnToeScale=
    lateralTurnOnly ? 0.0 : 1.0;

  setPlayerBoneAxisRotation(
    c,state,b.leftFoot,PLAYER_AXIS_RIGHT,
    left.ankle*cfg.ankle*turnFootScale
  );


  setPlayerBoneAxisRotation(
    c,state,b.rightFoot,PLAYER_AXIS_RIGHT,
    lateralTurnOnly ? 0 : right.ankle*cfg.ankle
  );
  setPlayerBoneAxisRotation(
    c,state,b.leftToe,PLAYER_AXIS_RIGHT,
    left.toe*cfg.toeFactor*turnToeScale
  );
  setPlayerBoneAxisRotation(
    c,state,b.rightToe,PLAYER_AXIS_RIGHT,
    right.toe*cfg.toeFactor*turnToeScale
  );

  if(lateralTurnOnly){


    const turnDir=Math.sign(strafe)||0;


    const leftPivotWeight=
      turnDir<0 ? .05 : 1.0;

    const rightPivotWeight=
      turnDir>0 ? .05 : 1.0;


    const stepWave=
      Math.max(0,Math.sin(state.phase*.82));

    const outsideLift=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideLiftDeg)*
      stepWave;

    const outsideKnee=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideKneeDeg)*
      stepWave;

    const outsideFootFlex=
      THREE.MathUtils.degToRad(AD_TURN_WALK.outsideFootDeg)*
      stepWave;


    if(turnDir<0){
      addPlayerBoneAxisRotation(
        c,b.rightUpLeg,
        PLAYER_AXIS_RIGHT,
        -outsideLift
      );
      addPlayerBoneAxisRotation(
        c,b.rightKnee,
        PLAYER_AXIS_RIGHT,
        outsideKnee
      );
      addPlayerBoneAxisRotation(
        c,b.rightFoot,
        PLAYER_AXIS_RIGHT,
        outsideFootFlex*.35
      );
    }


    if(turnDir>0){
      addPlayerBoneAxisRotation(
        c,b.leftUpLeg,
        PLAYER_AXIS_RIGHT,
        -outsideLift
      );
      addPlayerBoneAxisRotation(
        c,b.leftKnee,
        PLAYER_AXIS_RIGHT,
        outsideKnee
      );
      addPlayerBoneAxisRotation(
        c,b.leftFoot,
        PLAYER_AXIS_RIGHT,
        outsideFootFlex*.80
      );
    }

    const footYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.footYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_UP,
      footYaw*leftPivotWeight*
        (turnDir>0 ? 1.62 : 1.0)
    );

    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_UP,
      footYaw*rightPivotWeight*
        (turnDir<0 ? 1.62 : 1.0)
    );


    const footPhase=
      Math.sin(state.phase*.92);

    const ankleRoll=
      THREE.MathUtils.degToRad(AD_TURN_WALK.ankleRollDeg)*
      footPhase;

    const ankleFlex=
      THREE.MathUtils.degToRad(AD_TURN_WALK.ankleFlexDeg)*
      Math.sin(state.phase*.92+Math.PI*.5);


    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_FORWARD,
      ankleRoll*turnDir*leftPivotWeight
    );

    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_FORWARD,
      -ankleRoll*turnDir*rightPivotWeight
    );

    addPlayerBoneAxisRotation(
      c,b.leftFoot,
      PLAYER_AXIS_RIGHT,
      ankleFlex
    );


    addPlayerBoneAxisRotation(
      c,b.rightFoot,
      PLAYER_AXIS_RIGHT,
      -ankleFlex*.38
    );


    const legTurnYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.legYawDeg)*
      -turnDir;

    const kneeTurnYaw=
      THREE.MathUtils.degToRad(AD_TURN_WALK.kneeYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftUpLeg,
      PLAYER_AXIS_UP,
      legTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightUpLeg,
      PLAYER_AXIS_UP,
      legTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftKnee,
      PLAYER_AXIS_UP,
      kneeTurnYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightKnee,
      PLAYER_AXIS_UP,
      kneeTurnYaw
    );

    const toeYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristYawDeg)*
      -turnDir;

    addPlayerBoneAxisRotation(
      c,b.leftToe,
      PLAYER_AXIS_UP,
      toeYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightToe,
      PLAYER_AXIS_UP,
      toeYaw
    );
  }


  if(lateralTurnOnly){
    const armBones=[
      b.leftShoulder,b.rightShoulder,
      b.leftArm,b.rightArm,
      b.leftForeArm,b.rightForeArm,
      b.leftHand,b.rightHand
    ];
    const beforeArmQ=new Map();

    for(const bone of armBones){
      if(bone) beforeArmQ.set(bone,bone.quaternion.clone());
    }

    applyPlayerOldArmsTurn(c,state,state.phase);

    for(const bone of armBones){
      const before=beforeArmQ.get(bone);
      if(before){
        bone.quaternion.slerpQuaternions(
          before,
          bone.quaternion,
          AD_TURN_WALK.armBlend
        );
      }
    }
  }else{
    applyPlayerOldArms(c,state,state.phase,true);
  }


  const armWave=(Math.sin(state.phase))*soloTurnMotionScale;
  const armOpp=-armWave;
  const backwardFactor=gaitDirection<0 ? .82 : 1.0;
  const shoulderCounter=PLAYER_HAND_TUNING.walkShoulderCounter*backwardFactor;
  const foreTwist=PLAYER_HAND_TUNING.walkForeTwist*backwardFactor;
  const wristSwing=PLAYER_HAND_TUNING.walkWristSwing*backwardFactor;
  const wristRoll=PLAYER_HAND_TUNING.walkWristRollRaw*backwardFactor;

  addPlayerBoneAxisRotation(c,b.leftShoulder,PLAYER_AXIS_UP,armOpp*shoulderCounter);
  addPlayerBoneAxisRotation(c,b.rightShoulder,PLAYER_AXIS_UP,armWave*shoulderCounter);

  addPlayerBoneAxisRotation(c,b.leftForeArm,PLAYER_AXIS_UP,armWave*foreTwist);
  addPlayerBoneAxisRotation(c,b.rightForeArm,PLAYER_AXIS_UP,armOpp*foreTwist);

  addPlayerBoneAxisRotation(c,b.leftHand,PLAYER_AXIS_RIGHT,armWave*wristSwing);
  addPlayerBoneAxisRotation(c,b.rightHand,PLAYER_AXIS_RIGHT,armOpp*wristSwing);
  addPlayerBoneAxisRotation(c,b.leftHand,PLAYER_AXIS_FORWARD,armOpp*wristRoll);
  addPlayerBoneAxisRotation(c,b.rightHand,PLAYER_AXIS_FORWARD,armWave*wristRoll);


  const handFlexWave=Math.sin(state.phase*1.45);
  const handTwistWave=Math.sin(state.phase*1.45+Math.PI*.5);


  const turnHandWave=
    lateralTurnOnly
      ? Math.sin(state.phase*1.10)
      : 0;

  const turnHandTwist=
    lateralTurnOnly
      ? Math.sin(state.phase*1.10+Math.PI*.5)
      : 0;

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_RIGHT,
    (lateralTurnOnly ? turnHandWave*PLAYER_HAND_TUNING.turnHandFollowFlex : handFlexWave*PLAYER_HAND_TUNING.walkExtraFlex)*soloTurnMotionScale
  );
  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_RIGHT,
    -(lateralTurnOnly ? turnHandWave*PLAYER_HAND_TUNING.turnHandFollowFlex : handFlexWave*PLAYER_HAND_TUNING.walkExtraFlex)*soloTurnMotionScale
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_UP,
    (lateralTurnOnly ? turnHandTwist*PLAYER_HAND_TUNING.turnHandFollowTwist : handTwistWave*PLAYER_HAND_TUNING.walkExtraTwist)*soloTurnMotionScale
  );
  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_UP,
    -(lateralTurnOnly ? turnHandTwist*PLAYER_HAND_TUNING.turnHandFollowTwist : handTwistWave*PLAYER_HAND_TUNING.walkExtraTwist)*soloTurnMotionScale
  );

  applyPlayerFingerCurl(
    c,
    state,
    state.phase,
    lateralTurnOnly ? PLAYER_HAND_TUNING.turnFingerCurl : PLAYER_HAND_TUNING.walkFingerCurl
  );

  const turnBodyScale=lateralTurnOnly ? .10 : 1.0;
  const pelvisTwist=Math.sin(state.phase)*cfg.pelvisTwist*turnBodyScale;
  const pelvisRoll=Math.sin(state.phase*2)*cfg.pelvisRoll*turnBodyScale;
  const bodyBreath=Math.sin(state.phase*2)*cfg.breathingSway*turnBodyScale;


  const travelLean=
    gaitDirection<0
      ? -0.012
      : (lateralTurnOnly ? 0.0015 : 0.010);
  setPlayerBoneAxisRotation(c,state,b.hips,PLAYER_AXIS_UP,pelvisTwist);
  addPlayerBoneAxisRotation(c,b.hips,PLAYER_AXIS_FORWARD,pelvisRoll);
  setPlayerBoneAxisRotation(c,state,b.spine,PLAYER_AXIS_UP,-pelvisTwist*0.30);
  addPlayerBoneAxisRotation(c,b.spine,PLAYER_AXIS_RIGHT,bodyBreath+travelLean);
  addPlayerBoneAxisRotation(c,b.spine1,PLAYER_AXIS_RIGHT,travelLean*.55);
  setPlayerBoneAxisRotation(c,state,b.spine1,PLAYER_AXIS_UP,-pelvisTwist*0.20);
  addPlayerBoneAxisRotation(c,b.spine1,PLAYER_AXIS_RIGHT,bodyBreath*0.55);
  setPlayerBoneAxisRotation(c,state,b.spine2,PLAYER_AXIS_UP,-pelvisTwist*0.12);
  addPlayerBoneAxisRotation(c,b.spine2,PLAYER_AXIS_RIGHT,bodyBreath*0.25);
  setPlayerBoneAxisRotation(c,state,b.neck,PLAYER_AXIS_UP,pelvisTwist*0.08);
  setPlayerBoneAxisRotation(c,state,b.head,PLAYER_AXIS_UP,pelvisTwist*0.035);
  if(b.hips && state.restP.has(b.hips)){
    b.hips.position.copy(state.restP.get(b.hips));
    b.hips.position.x+=Math.sin(state.phase)*0.018;
    b.hips.position.y+=Math.cos(state.phase*2)*0.018;
    b.hips.position.z+=
      Math.sin(state.phase)*
      (lateralTurnOnly ? 0.0025 : 0.010);
  }
  blendPlayerPoseFromSnapshot(
    state,
    previousPose,
    cfg.walkPoseLerp,
    cfg.walkPoseLerp
  );


  if(!lateralTurnOnly){
    const walkHandWave=
      Math.sin(state.phase);

    const walkHandWaveOpp=
      Math.sin(state.phase+Math.PI);

    const walkHandTwist=
      Math.sin(state.phase+Math.PI*.5);

    const walkHandFlex=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristFlexDeg);

    const walkHandYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristYawDeg);

    const walkHandRoll=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.walkWristRollDeg);

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_RIGHT,
      walkHandWave*walkHandFlex
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_RIGHT,
      walkHandWaveOpp*walkHandFlex
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_UP,
      walkHandTwist*walkHandYaw
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_UP,
      -walkHandTwist*walkHandYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_FORWARD,
      -walkHandWave*.85*walkHandRoll
    );

    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_FORWARD,
      walkHandWaveOpp*.85*walkHandRoll
    );
  }


  if(lateralTurnOnly){
    const handFlex=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristFlexDeg)*
      turnHandWave;

    const handYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristYawDeg)*
      turnHandTwist;

    const handRoll=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnWristRollDeg)*
      turnHandWave;

    const foreYaw=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnForeYawDeg)*
      turnHandWave;

    const armFollow=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnArmFollowDeg)*
      turnHandWave;


    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_RIGHT,
      handFlex
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_RIGHT,
      -handFlex
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_UP,
      handYaw
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_UP,
      -handYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftHand,
      PLAYER_AXIS_FORWARD,
      -handRoll
    );
    addPlayerBoneAxisRotation(
      c,b.rightHand,
      PLAYER_AXIS_FORWARD,
      handRoll
    );

    addPlayerBoneAxisRotation(
      c,b.leftForeArm,
      PLAYER_AXIS_UP,
      foreYaw
    );
    addPlayerBoneAxisRotation(
      c,b.rightForeArm,
      PLAYER_AXIS_UP,
      -foreYaw
    );

    addPlayerBoneAxisRotation(
      c,b.leftArm,
      PLAYER_AXIS_RIGHT,
      armFollow
    );
    addPlayerBoneAxisRotation(
      c,b.rightArm,
      PLAYER_AXIS_RIGHT,
      -armFollow
    );


    const shoulderFollow=
      THREE.MathUtils.degToRad(PLAYER_HAND_TUNING.turnShoulderFollowDeg)*
      turnHandWave;

    addPlayerBoneAxisRotation(
      c,b.leftShoulder,
      PLAYER_AXIS_RIGHT,
      shoulderFollow
    );
    addPlayerBoneAxisRotation(
      c,b.rightShoulder,
      PLAYER_AXIS_RIGHT,
      -shoulderFollow
    );


    const torsoFollow=
      THREE.MathUtils.degToRad(.58)*
      turnHandWave;

    const neckFollow=
      THREE.MathUtils.degToRad(.30)*
      turnHandTwist;

    addPlayerBoneAxisRotation(
      c,b.spine1,
      PLAYER_AXIS_UP,
      torsoFollow
    );
    addPlayerBoneAxisRotation(
      c,b.spine2,
      PLAYER_AXIS_UP,
      torsoFollow*.72
    );
    addPlayerBoneAxisRotation(
      c,b.neck,
      PLAYER_AXIS_UP,
      neckFollow
    );
    addPlayerBoneAxisRotation(
      c,b.head,
      PLAYER_AXIS_UP,
      neckFollow*.40
    );
  }

  const comboTurnForHands=!lateralTurnOnly && Math.abs(strafe)>0.01 && Math.abs(direction)>0.01;
  applyPlayerRealFingerCurl(c,state,lateralTurnOnly,comboTurnForHands);
  if(AD_CURRENT_FRAME_ACTIVE){
    const scaleFromRest=(bone,amount)=>{
      const rest=state.restQ?.get(bone);
      if(!bone||!rest||Math.abs(amount-1)<.000001)return;
      bone.quaternion.slerpQuaternions(rest,bone.quaternion,amount);
    };
    [b.leftUpLeg,b.rightUpLeg,b.leftKnee,b.rightKnee].forEach(x=>scaleFromRest(x,AD_CURRENT.legMotionScale));
    [b.leftFoot,b.rightFoot,b.leftToe,b.rightToe].forEach(x=>scaleFromRest(x,AD_CURRENT.footMotionScale));
    [b.hips,b.spine,b.spine1,b.spine2,b.neck,b.head].forEach(x=>scaleFromRest(x,AD_CURRENT.bodyWalkScale));
    [b.leftShoulder,b.rightShoulder,b.leftArm,b.rightArm,b.leftForeArm,b.rightForeArm,b.leftHand,b.rightHand].forEach(x=>scaleFromRest(x,AD_CURRENT.baseArmAnimationScale));
  }
  c.model.updateMatrixWorld(true);
  solvePlayerFloorCollision(c,state);
}

const PLAYER_SOFT_TURN_STATE=new WeakMap();

function getPlayerSoftTurnState(c){
  let state=PLAYER_SOFT_TURN_STATE.get(c);
  if(!state){
    state={
      targetYaw:0,
      amount:0
    };
    PLAYER_SOFT_TURN_STATE.set(c,state);
  }
  return state;
}


function softenPlayerADPivotFoot(c,sideInput){
  if(!c?.ready || !sideInput) return;

  const state=getPlayerProceduralState(c);
  const b=state?.bones;
  if(!b) return;


  const pivotFoot=sideInput<0 ? b.leftFoot : b.rightFoot;
  if(!pivotFoot) return;

  const restQ=state.restQ?.get(pivotFoot);
  if(!restQ) return;


  const PIVOT_FOOT_MOTION=AD_CURRENT.pivotMotion;

  pivotFoot.quaternion.slerpQuaternions(
    restQ,
    pivotFoot.quaternion,
    PIVOT_FOOT_MOTION
  );
}

function applyPlayerSoftDirectionalTurn(c,targetYaw){

  const AD_ARM_MOTION_SCALE=AD_CURRENT.turnArmOverlayScale; 

  if(!c?.ready || !c?.root || !c?.model) return false;

  const root=c.root;
  const procedural=getPlayerProceduralState(c);
  const b=procedural.bones;
  const state=getPlayerSoftTurnState(c);

  state.targetYaw=targetYaw;

  const delta=normalizeAngle(targetYaw-root.rotation.y);
  const absDelta=Math.abs(delta);

  if(absDelta<THREE.MathUtils.degToRad(AD_CURRENT.snapDeg)){
    root.rotation.y=targetYaw;
    state.amount=THREE.MathUtils.lerp(state.amount,0,.18);
    return false;
  }

  const direction=Math.sign(delta)||1;
  const turnStrength=THREE.MathUtils.clamp(
    absDelta/THREE.MathUtils.degToRad(AD_CURRENT.fullStrengthDeg),
    0,
    1
  );


  const rootTurnLerp=THREE.MathUtils.lerp(
    AD_CURRENT.rootLerpMin,
    AD_CURRENT.rootLerpMax,
    turnStrength
  );

  root.rotation.y=lerpAngle(
    root.rotation.y,
    targetYaw,
    rootTurnLerp
  );

  state.amount=THREE.MathUtils.lerp(
    state.amount,
    direction*turnStrength,
    AD_CURRENT.bodyResponseLerp
  );

  const a=state.amount;


  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_UP,
    a*.032
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_UP,
    a*.046
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_UP,
    a*.034
  );

  addPlayerBoneAxisRotation(
    c,b.spine2,
    PLAYER_AXIS_UP,
    a*.011
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_UP,
    a*.024
  );

  addPlayerBoneAxisRotation(
    c,b.head,
    PLAYER_AXIS_UP,
    a*.024
  );


  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_FORWARD,
    -a*.008
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_FORWARD,
    -a*.012
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_FORWARD,
    -a*.008
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_FORWARD,
    -a*.006
  );


  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_FORWARD,
    a*(.016*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_FORWARD,
    -a*(.011*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_UP,
    a*(.012*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_UP,
    a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftArm,
    PLAYER_AXIS_UP,
    -a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightArm,
    PLAYER_AXIS_UP,
    -a*(.018*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftForeArm,
    PLAYER_AXIS_UP,
    a*(.026*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightForeArm,
    PLAYER_AXIS_UP,
    a*(.026*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftForeArm,
    PLAYER_AXIS_FORWARD,
    a*(.010*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightForeArm,
    PLAYER_AXIS_FORWARD,
    -a*(.010*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_UP,
    a*(.014*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_UP,
    a*(.021*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.leftHand,
    PLAYER_AXIS_FORWARD,
    a*(.014*AD_ARM_MOTION_SCALE)
  );

  addPlayerBoneAxisRotation(
    c,b.rightHand,
    PLAYER_AXIS_FORWARD,
    -a*(.014*AD_ARM_MOTION_SCALE)
  );

  c.model.updateMatrixWorld(true);
  return true;
}

function applyPlayerForwardWalkingTurn(c,targetYaw){
  if(!c?.ready || !c?.root || !c?.model) return false;

  const root=c.root;
  const procedural=getPlayerProceduralState(c);
  const b=procedural.bones;
  const state=getPlayerSoftTurnState(c);

  const delta=normalizeAngle(targetYaw-root.rotation.y);
  const absDelta=Math.abs(delta);

  if(absDelta<THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.forwardSnapThresholdDeg)){
    root.rotation.y=targetYaw;
    state.amount=THREE.MathUtils.lerp(
      state.amount,
      0,
      .10
    );
    return false;
  }

  const direction=Math.sign(delta)||1;

  const turnStrength=THREE.MathUtils.clamp(
    absDelta/THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.forwardFullStrengthDeg),
    0,
    1
  );


  const rootTurnLerp=THREE.MathUtils.lerp(
    PLAYER_TURN_TUNING.forwardTurnLerpMin,
    PLAYER_TURN_TUNING.forwardTurnLerpMax,
    turnStrength
  );

  root.rotation.y=lerpAngle(
    root.rotation.y,
    targetYaw,
    rootTurnLerp
  );


  const targetBody=
    direction*
    turnStrength*
    PLAYER_TURN_TUNING.forwardBodyTarget;

  state.amount=THREE.MathUtils.lerp(
    state.amount,
    targetBody,
    PLAYER_TURN_TUNING.forwardBodyLerp
  );

  const a=state.amount;

  addPlayerBoneAxisRotation(
    c,b.hips,
    PLAYER_AXIS_UP,
    a*.018
  );

  addPlayerBoneAxisRotation(
    c,b.spine,
    PLAYER_AXIS_UP,
    a*.026
  );

  addPlayerBoneAxisRotation(
    c,b.spine1,
    PLAYER_AXIS_UP,
    a*.024
  );

  addPlayerBoneAxisRotation(
    c,b.spine2,
    PLAYER_AXIS_UP,
    a*.016
  );

  addPlayerBoneAxisRotation(
    c,b.neck,
    PLAYER_AXIS_UP,
    a*.012
  );

  addPlayerBoneAxisRotation(
    c,b.head,
    PLAYER_AXIS_UP,
    a*.006
  );


  addPlayerBoneAxisRotation(
    c,b.leftShoulder,
    PLAYER_AXIS_FORWARD,
    a*.006
  );

  addPlayerBoneAxisRotation(
    c,b.rightShoulder,
    PLAYER_AXIS_FORWARD,
    -a*.006
  );

  c.model.updateMatrixWorld(true);
  return true;
}

function applyPlayerDialogueFist(c,state,amount,phase){
  const fingers=state.fingers||[];
  if(!fingers.length || amount<=.0001) return;


  const talkPulse=(Math.sin(phase*.82)+1)*.5;

  for(const f of fingers){
    if(!f?.bone || !state.restQ.has(f.bone)) continue;

    const n=String(f.name||"").toLowerCase();
    const isThumb=f.finger==="thumb" || n.includes("thumb");

    const segmentMatch=n.match(
      /(?:thumb|index|middle|ring|pinky|little)[^0-9]*([1-4])/
    );
    const segment=segmentMatch ? Number(segmentMatch[1]) : 2;

    const segmentGain=
      segment<=1 ? .72 :
      segment===2 ? 1.00 :
      segment===3 ? 1.12 :
      1.18;


    const relaxed=isThumb ? .035 : .060;
    const closeAmount=isThumb ? .105 : .185;

    const curl=
      (relaxed+talkPulse*closeAmount)*
      segmentGain*
      amount;

    const sideSign=f.side==="left" ? 1 : -1;

    setPlayerBoneAxisRotation(
      c,
      state,
      f.bone,
      PLAYER_AXIS_RIGHT,
      curl*sideSign
    );
  }
}

function animatePlayerProceduralIdle(c){
  if(!c.ready || !c.model) return;
  const cfg=PLAYER_PROCEDURAL_WALK_CONFIG;
  const state=getPlayerProceduralState(c);
  const now=performance.now();
  state.lastTime=now;
  const previousPose=capturePlayerPose(state);
  restorePlayerProceduralPose(state);
  applyPlayerOldArms(c,state,state.phase,false);

  const idleSeconds=now*0.001;
  const idleSlow=Math.sin(idleSeconds*1.15);
  const idleBreath=Math.sin(idleSeconds*1.85);
  const idleMicro=Math.sin(idleSeconds*0.63);

  const dialogueFistTarget=
    (QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active)
      ? 1
      : 0;

  state.dialogueFistAmount=THREE.MathUtils.lerp(
    state.dialogueFistAmount||0,
    dialogueFistTarget,
    dialogueFistTarget ? .18 : .12
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine,PLAYER_AXIS_RIGHT,
    idleBreath*0.006
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine,PLAYER_AXIS_UP,
    idleSlow*0.0035
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine1,PLAYER_AXIS_RIGHT,
    idleBreath*0.0045
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine1,PLAYER_AXIS_UP,
    -idleSlow*0.0028
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.spine2,PLAYER_AXIS_RIGHT,
    idleBreath*0.003
  );
  addPlayerBoneAxisRotation(
    c,state,state.bones.spine2,PLAYER_AXIS_UP,
    idleMicro*0.002
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.neck,PLAYER_AXIS_UP,
    -idleSlow*0.002
  );
  setPlayerBoneAxisRotation(
    c,state,state.bones.head,PLAYER_AXIS_UP,
    idleMicro*0.0015
  );
  if(state.bones.spine && state.restP.has(state.bones.spine)){
    state.bones.spine.position.copy(state.restP.get(state.bones.spine));
    state.bones.spine.position.y+=idleBreath*0.0035;
  }

  applyPlayerDialogueFist(
    c,
    state,
    state.dialogueFistAmount,
    idleSeconds
  );

  blendPlayerPoseFromSnapshot(
    state,
    previousPose,
    cfg.stopPoseLerp,
    cfg.stopPositionLerp
  );
  c.model.updateMatrixWorld(true);
  solvePlayerFloorCollision(c,state);
}

const SECURITY_OLD_TALK_PANEL={
  panel:null,
  readout:null,
  initialized:false,
  agitation:{
    level:0.95,
    speed:0.82,
    shoulders:{amount:0.28,axis:"z"},
    forearms:{amount:0.88,axis:"z"},
    hands:{amount:0.88,axis:"xyz"},
    torso:{amount:0.22,axis:"z"},
    neck:{amount:0.18,axis:"y"},
    head:{amount:0.25,axis:"xy"}
  },
  target:{
    leftArm:{x:0,y:0,z:0},
    rightArm:{x:0,y:0,z:0},
    leftForeArm:{x:0,y:0,z:0},
    rightForeArm:{x:0,y:0,z:0},
    leftHand:{x:0,y:0,z:0},
    rightHand:{x:0,y:0,z:0}
  }
};

function initSecurityOldTalkPanelTargets(c){
  if(SECURITY_OLD_TALK_PANEL.initialized) return;

  const D=THREE.MathUtils.degToRad;

  SECURITY_OLD_TALK_PANEL.target.leftArm={
    x:D(62), y:D(0), z:D(0)
  };
  SECURITY_OLD_TALK_PANEL.target.leftForeArm={
    x:D(10), y:D(1), z:D(17)
  };
  SECURITY_OLD_TALK_PANEL.target.leftHand={
    x:D(0), y:D(0), z:D(-18.5)
  };

  SECURITY_OLD_TALK_PANEL.target.rightArm={
    x:D(60.5), y:D(0), z:D(0)
  };
  SECURITY_OLD_TALK_PANEL.target.rightForeArm={
    x:D(-1), y:D(1), z:D(-65.5)
  };
  SECURITY_OLD_TALK_PANEL.target.rightHand={
    x:D(10), y:D(0), z:D(-5)
  };

  SECURITY_OLD_TALK_PANEL.initialized=true;
}

function securityAddAgitationControls(panel,settings,refreshFn,prefix){
  const wrap=document.createElement("details");
  wrap.open=false;
  Object.assign(wrap.style,{
    marginTop:"9px",
    borderTop:"1px solid rgba(255,255,255,.10)",
    paddingTop:"8px"
  });

  const summary=document.createElement("summary");
  summary.textContent="AGITATION CONTROLS";
  Object.assign(summary.style,{
    cursor:"pointer",
    fontWeight:"900",
    letterSpacing:".06em"
  });
  wrap.appendChild(summary);

  const makeSlider=(label,keyObj,key,min,max,step)=>{
    const row=document.createElement("div");
    Object.assign(row.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr 46px",
      gap:"6px",
      alignItems:"center",
      margin:"5px 0"
    });

    const lab=document.createElement("span");
    lab.textContent=label;
    lab.style.fontSize="10px";

    const slider=document.createElement("input");
    slider.type="range";
    slider.min=String(min);
    slider.max=String(max);
    slider.step=String(step);
    slider.value=String(keyObj[key]);

    const value=document.createElement("span");
    value.textContent=Number(slider.value).toFixed(2);
    value.style.textAlign="right";
    value.style.fontFamily="monospace";

    slider.addEventListener("input",()=>{
      keyObj[key]=Number(slider.value);
      value.textContent=Number(slider.value).toFixed(2);
      refreshFn();
    });

    row.append(lab,slider,value);
    wrap.appendChild(row);
  };

  makeSlider("LEVEL",settings,"level",0,2,.05);
  makeSlider("SPEED",settings,"speed",.25,2,.05);

  const parts=[
    ["shoulders","SHOULDERS"],
    ["forearms","FOREARMS"],
    ["hands","HANDS"],
    ["torso","TORSO"],
    ["neck","NECK"],
    ["head","HEAD"]
  ];

  for(const [key,label] of parts){
    const section=document.createElement("div");
    Object.assign(section.style,{
      marginTop:"8px",
      paddingTop:"7px",
      borderTop:"1px solid rgba(255,255,255,.07)"
    });

    const title=document.createElement("div");
    title.textContent=label;
    title.style.fontWeight="800";
    title.style.fontSize="10px";
    title.style.marginBottom="4px";
    section.appendChild(title);

    const amtRow=document.createElement("div");
    Object.assign(amtRow.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr 46px",
      gap:"6px",
      alignItems:"center",
      margin:"4px 0"
    });

    const amtLab=document.createElement("span");
    amtLab.textContent="AMOUNT";
    amtLab.style.fontSize="10px";

    const amt=document.createElement("input");
    amt.type="range";
    amt.min="0";
    amt.max="2";
    amt.step=".05";
    amt.value=String(settings[key].amount);

    const amtVal=document.createElement("span");
    amtVal.textContent=Number(amt.value).toFixed(2);
    amtVal.style.textAlign="right";
    amtVal.style.fontFamily="monospace";

    amt.addEventListener("input",()=>{
      settings[key].amount=Number(amt.value);
      amtVal.textContent=Number(amt.value).toFixed(2);
      refreshFn();
    });

    amtRow.append(amtLab,amt,amtVal);
    section.appendChild(amtRow);

    const axisRow=document.createElement("div");
    Object.assign(axisRow.style,{
      display:"grid",
      gridTemplateColumns:"100px 1fr",
      gap:"6px",
      alignItems:"center",
      margin:"4px 0"
    });

    const axisLab=document.createElement("span");
    axisLab.textContent="DIRECTION";
    axisLab.style.fontSize="10px";

    const select=document.createElement("select");
    for(const value of ["x","y","z","xy","xz","yz","xyz"]){
      const opt=document.createElement("option");
      opt.value=value;
      opt.textContent=value.toUpperCase();
      if(settings[key].axis===value) opt.selected=true;
      select.appendChild(opt);
    }

    select.addEventListener("change",()=>{
      settings[key].axis=select.value;
      refreshFn();
    });

    axisRow.append(axisLab,select);
    section.appendChild(axisRow);

    wrap.appendChild(section);
  }

  panel.appendChild(wrap);
}

function refreshSecurityOldTalkPanel(){
  const read=SECURITY_OLD_TALK_PANEL.readout;
  if(!read) return;

  const d=v=>Math.round(THREE.MathUtils.radToDeg(v)*10)/10;
  const lines=["SECURITY TALK · ORIGINAL ANIMATION"];

  for(const [key,v] of Object.entries(SECURITY_OLD_TALK_PANEL.target)){
    lines.push(`${key}: x ${d(v.x)}° · y ${d(v.y)}° · z ${d(v.z)}°`);
  }

  const a=SECURITY_OLD_TALK_PANEL.agitation;
  lines.push("");
  lines.push(`AGITATION level ${a.level.toFixed(2)} · speed ${a.speed.toFixed(2)}`);
  lines.push(`forearms ${a.forearms.amount.toFixed(2)} ${a.forearms.axis.toUpperCase()} · hands ${a.hands.amount.toFixed(2)} ${a.hands.axis.toUpperCase()}`);
  lines.push(`shoulders ${a.shoulders.amount.toFixed(2)} ${a.shoulders.axis.toUpperCase()} · torso ${a.torso.amount.toFixed(2)} ${a.torso.axis.toUpperCase()}`);
  lines.push(`neck ${a.neck.amount.toFixed(2)} ${a.neck.axis.toUpperCase()} · head ${a.head.amount.toFixed(2)} ${a.head.axis.toUpperCase()}`);

  read.textContent=lines.join("\n");
}

function ensureSecurityOldTalkPanel(c){
  initSecurityOldTalkPanelTargets(c);

  if(SECURITY_OLD_TALK_PANEL.panel){
    return SECURITY_OLD_TALK_PANEL.panel;
  }

  const panel=document.createElement("div");
  panel.id="securityOldTalkPanel";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"90px",
    width:"285px",
    maxHeight:"64vh",
    overflowY:"auto",
    zIndex:"24750",
    display:"none",
    padding:"12px",
    borderRadius:"11px",
    background:"rgba(8,10,15,.97)",
    border:"1px solid rgba(255,190,90,.38)",
    color:"#fff",
    font:"12px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY TALK POSITION";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".09em",
    marginBottom:"6px"
  });
  panel.appendChild(title);

  const sub=document.createElement("div");
  sub.textContent=
    "La TALK resta quella vecchia. Qui cambi solo la posizione verso cui braccia, avambracci e mani interpolano.";
  Object.assign(sub.style,{
    color:"rgba(255,255,255,.68)",
    fontSize:"10px",
    lineHeight:"1.4",
    marginBottom:"9px"
  });
  panel.appendChild(sub);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 7px",
    padding:"6px",
    maxHeight:"88px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.72)",
    font:"9px/1.28 monospace"
  });
  panel.appendChild(read);
  SECURITY_OLD_TALK_PANEL.readout=read;

  const labels={
    leftArm:"LEFT ARM",
    leftForeArm:"LEFT FOREARM",
    leftHand:"LEFT HAND",
    rightArm:"RIGHT ARM",
    rightForeArm:"RIGHT FOREARM",
    rightHand:"RIGHT HAND"
  };

  for(const [key,labelText] of Object.entries(labels)){
    const sec=document.createElement("div");
    Object.assign(sec.style,{
      borderTop:"1px solid rgba(255,255,255,.08)",
      paddingTop:"7px",
      marginTop:"7px"
    });

    const h=document.createElement("div");
    h.textContent=labelText;
    h.style.fontWeight="900";
    h.style.fontSize="10px";
    h.style.letterSpacing=".07em";
    h.style.marginBottom="5px";
    sec.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 54px",
        gap:"6px",
        alignItems:"center",
        margin:"4px 0"
      });

      const lab=document.createElement("span");
      lab.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min="-180";
      slider.max="180";
      slider.step="1";
      slider.value=String(Math.round(
        THREE.MathUtils.radToDeg(SECURITY_OLD_TALK_PANEL.target[key][axis])
      ));

      const val=document.createElement("span");
      val.textContent=`${slider.value}°`;
      val.style.textAlign="right";

      slider.addEventListener("input",()=>{
        SECURITY_OLD_TALK_PANEL.target[key][axis]=
          THREE.MathUtils.degToRad(Number(slider.value));
        val.textContent=`${slider.value}°`;
        refreshSecurityOldTalkPanel();
      });

      row.append(lab,slider,val);
      sec.appendChild(row);
    }

    panel.appendChild(sec);
  }

  securityAddAgitationControls(
    panel,
    SECURITY_OLD_TALK_PANEL.agitation,
    refreshSecurityOldTalkPanel,
    "normalTalk"
  );

  const print=document.createElement("button");
  print.textContent="PRINT / COPY TALK POSITION";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"10px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  print.addEventListener("click",async()=>{
    const output={};
    for(const [key,v] of Object.entries(SECURITY_OLD_TALK_PANEL.target)){
      output[key]={
        x:Math.round(THREE.MathUtils.radToDeg(v.x)*10)/10,
        y:Math.round(THREE.MathUtils.radToDeg(v.y)*10)/10,
        z:Math.round(THREE.MathUtils.radToDeg(v.z)*10)/10
      };
    }

    const txt=
      "SECURITY TALK POSITION\n"+
      JSON.stringify(output,null,2)+
      "\n\nSECURITY TALK AGITATION\n"+
      JSON.stringify(SECURITY_OLD_TALK_PANEL.agitation,null,2);
    console.log(txt);

    try{
      await navigator.clipboard.writeText(txt);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>print.textContent="PRINT / COPY TALK POSITION",1400);
  });

  panel.appendChild(print);

  makeSecurityPanelCollapsible(
    panel,
    title,
    "securityTalkPositionPanelCollapsed"
  );

  document.body.appendChild(panel);

  SECURITY_OLD_TALK_PANEL.panel=panel;
  refreshSecurityOldTalkPanel();
  return panel;
}

function updateSecurityOldTalkPanel(c){
  ensureSecurityOldTalkPanel(c);
}

function mirrorSecurityTalkBoneWorld(c,leftBone,rightBone){
  if(!c?.root || !leftBone || !rightBone || !rightBone.parent) return;

  c.root.updateMatrixWorld(true);

  const rootRot=new THREE.Matrix4().extractRotation(c.root.matrixWorld);
  const invRootRot=rootRot.clone().invert();
  const reflectX=new THREE.Matrix4().makeScale(-1,1,1);

  const leftWorldRot=
    new THREE.Matrix4().extractRotation(leftBone.matrixWorld);

  const leftCharacterRot=
    invRootRot.clone().multiply(leftWorldRot);

  const mirroredCharacterRot=
    reflectX.clone()
      .multiply(leftCharacterRot)
      .multiply(reflectX);

  const desiredWorldRot=
    rootRot.clone().multiply(mirroredCharacterRot);

  const parentWorldRot=
    new THREE.Matrix4().extractRotation(rightBone.parent.matrixWorld);

  const desiredLocalRot=
    parentWorldRot.clone().invert().multiply(desiredWorldRot);

  const targetQuat=
    new THREE.Quaternion().setFromRotationMatrix(desiredLocalRot);

  rightBone.quaternion.slerp(targetQuat,.18);
  rightBone.updateMatrix();
  c.root.updateMatrixWorld(true);
}

function animateTalkSecurity(c){

  if(!c.__talkApprovedValuesLoaded){
    SECURITY_OLD_TALK_PANEL.initialized=false;
    c.__talkApprovedValuesLoaded=true;
    c.__rightTalkCycleStart=performance.now();
  }

  initSecurityOldTalkPanelTargets(c);
  refreshSecurityUnifiedTalkPanel();

  const b=getBones(c);
  const p=SECURITY_OLD_TALK_PANEL.target;

  if(!SECURITY_POSE_EDITOR.bones.leftArm){
    cacheSecurityPoseEditorBones();
  }
  cacheSecurityFinalPoseDefaults();

  if(!c.__talkStartupState){
    c.__talkStartupState={
      start:performance.now(),
      done:false
    };
    c.__rightTalkCycleStart=0;
  }

  const t=performance.now()*.00345;

  const speech=Math.sin(t);
  const speechSoft=Math.sin(t+.30);
  const speechLate=Math.sin(t+.60);
  const speechAccent=Math.sin(t*1.25+.15);

  const wave=speech;
  const wave2=speechSoft;
  const wave3=speechLate;

  const armSmooth=.078;

  const D=THREE.MathUtils.degToRad;

  const leftFinalBody=[
    ["leftShoulder",b.leftShoulder],
    ["leftArm",b.leftArm],
    ["leftForeArm",b.leftForeArm]
  ];

  for(const [key,bone] of leftFinalBody){
    if(!bone) continue;

    const rest=SECURITY_POSE_EDITOR.rest[key];
    const off=SECURITY_FINAL_POSE_EDITOR.body[key];
    if(!rest || !off) continue;

    let x=rest.x+D(off.x||0);
    let y=rest.y+D(off.y||0);
    let z=rest.z+D(off.z||0);

    if(key==="leftArm"){

      x+=wave2*.010;
      y+=wave3*.003;
      z+=wave*.017;
    }else if(key==="leftForeArm"){

      x+=wave3*.010;
      y+=wave2*.004;
      z+=wave*.028;
    }else if(key==="leftShoulder"){
      z+=wave2*.006;
    }

    smoothBoneTo(bone,x,y,z,.12);
  }

  const finalLeftHand=SECURITY_FINAL_POSE_EDITOR.body.leftHand;
  const finalLeftHandRest=SECURITY_POSE_EDITOR.rest.leftHand;

  if(b.leftHand && finalLeftHand && finalLeftHandRest){
    smoothBoneTo(
      b.leftHand,
      finalLeftHandRest.x+D(finalLeftHand.x||0)+wave3*.008,
      finalLeftHandRest.y+D(finalLeftHand.y||0)+wave*.020,
      finalLeftHandRest.z+D(finalLeftHand.z||0)+wave2*.011,
      .12
    );
  }

  const startupElapsed=(performance.now()-c.__talkStartupState.start)/1000;
  const startupDuration=.58;

  let lowerMix=1;

  if(!c.__talkStartupState.done){

    lowerMix=1;

    if(startupElapsed>=startupDuration){
      c.__talkStartupState.done=true;
      c.__rightTalkCycleStart=performance.now();
    }
  }else{
    if(!c.__rightTalkCycleStart){
      c.__rightTalkCycleStart=performance.now();
    }

    const elapsed=(performance.now()-c.__rightTalkCycleStart)/1000;
    const cycle=elapsed%3.65;

    if(cycle<0.18){

      lowerMix=1;
    }else if(cycle<0.82){
      lowerMix=1-THREE.MathUtils.smoothstep(cycle,.18,.82);
    }else if(cycle<1.82){
      lowerMix=0;
    }else if(cycle<2.52){
      lowerMix=THREE.MathUtils.smoothstep(cycle,1.82,2.52);
    }else{
      lowerMix=1;
    }
  }

  c.root.updateMatrixWorld(true);
  mirrorSecurityTalkBoneWorld(c,b.leftShoulder,b.rightShoulder);
  mirrorSecurityTalkBoneWorld(c,b.leftArm,b.rightArm);
  mirrorSecurityTalkBoneWorld(c,b.leftForeArm,b.rightForeArm);
  mirrorSecurityTalkBoneWorld(c,b.leftHand,b.rightHand);
  c.root.updateMatrixWorld(true);

  const calmRightArm=b.rightArm.rotation.clone();
  const calmRightFore=b.rightForeArm.rotation.clone();
  const calmRightHand=b.rightHand.rotation.clone();

  const rhr=getRest(c,b.rightHand);

  const rightArmBob=0.01280;
  const rightForeBob=0.02184;
  const rightWristBob=.022;

  const rightSmooth=c.__talkStartupState.done ? .12 : .085;
  const rightHandSmooth=c.__talkStartupState.done ? .13 : .09;

  if(b.rightArm){
    const tx=THREE.MathUtils.lerp(
      p.rightArm.x,
      calmRightArm.x,
      lowerMix
    );
    const ty=THREE.MathUtils.lerp(
      p.rightArm.y,
      calmRightArm.y,
      lowerMix
    );
    const tz=THREE.MathUtils.lerp(
      p.rightArm.z,
      calmRightArm.z,
      lowerMix
    );

    smoothBoneTo(
      b.rightArm,
      tx - wave2*rightArmBob*.25,
      ty,
      tz - wave*rightArmBob*.32,
      rightSmooth
    );
  }

  if(b.rightForeArm){
    const tx=THREE.MathUtils.lerp(
      p.rightForeArm.x,
      calmRightFore.x,
      lowerMix
    );
    const ty=THREE.MathUtils.lerp(
      p.rightForeArm.y,
      calmRightFore.y,
      lowerMix
    );
    const tz=THREE.MathUtils.lerp(
      p.rightForeArm.z,
      calmRightFore.z,
      lowerMix
    );

    smoothBoneTo(
      b.rightForeArm,
      tx - wave3*rightForeBob*.18,
      ty,
      tz - wave*rightForeBob*.42,
      rightSmooth
    );
  }

  if(b.rightHand && rhr){
    const authoredX=rhr.x+p.rightHand.x;
    const authoredY=rhr.y+p.rightHand.y;
    const authoredZ=rhr.z+p.rightHand.z;

    const tx=THREE.MathUtils.lerp(authoredX,calmRightHand.x,lowerMix);
    const ty=THREE.MathUtils.lerp(authoredY,calmRightHand.y,lowerMix);
    const tz=THREE.MathUtils.lerp(authoredZ,calmRightHand.z,lowerMix);

    smoothBoneTo(
      b.rightHand,
      tx - wave3*rightWristBob*.22,
      ty + wave*rightWristBob*.52,
      tz - wave2*rightWristBob*.28,
      rightHandSmooth
    );
  }

  for(const [key,off] of Object.entries(SECURITY_FINAL_POSE_EDITOR.fingers)){
    const bone=SECURITY_POSE_EDITOR.bones[key];
    const rest=SECURITY_POSE_EDITOR.rest[key];
    if(!bone || !rest) continue;

    smoothBoneTo(
      bone,
      rest.x+THREE.MathUtils.degToRad(off.x||0),
      rest.y+THREE.MathUtils.degToRad(off.y||0),
      rest.z+THREE.MathUtils.degToRad(off.z||0),
      armSmooth
    );
  }

  const hips=getRest(c,b.hips);
  const spine=getRest(c,b.spine);
  const neck=getRest(c,b.neck);
  const head=getRest(c,b.head);
  const lShoulder=getRest(c,b.leftShoulder);
  const rShoulder=getRest(c,b.rightShoulder);

  if(b.hips && hips){
    smoothBoneTo(
      b.hips,
      hips.x,
      hips.y,
      hips.z,
      .16
    );
  }

  if(b.spine && spine){
    smoothBoneTo(
      b.spine,
      spine.x+speech*.0015,
      spine.y,
      spine.z+speechSoft*.0015,
      .12
    );
  }

  if(b.leftShoulder && lShoulder){
    smoothBoneTo(
      b.leftShoulder,
      lShoulder.x+speech*.0025,
      lShoulder.y,
      lShoulder.z+speechSoft*.0035,
      .10
    );
  }

  if(b.rightShoulder && rShoulder){
    smoothBoneTo(
      b.rightShoulder,
      rShoulder.x-speech*.0020,
      rShoulder.y,
      rShoulder.z-speechSoft*.0030,
      .10
    );
  }

  if(b.neck && neck){
    smoothBoneTo(
      b.neck,
      neck.x+speechSoft*.0025,
      neck.y,
      neck.z,
      .12
    );
  }

  if(b.head && head){
    smoothBoneTo(
      b.head,
      head.x+speechSoft*.0040+speechAccent*.0010,
      head.y,
      head.z,
      .12
    );
  }

  updateSecurityOldTalkPanel(c);
}
function animateTalk(c){
  if(c.name==="securityMan"){
    animateTalkSecurity(c);
    return;
  }
  animateConfiguredTalk(c);
}
const WORLD_ZONES={
  outside:{label:"OUTSIDE"},
  leftRoom:{label:"CASINO"},
  rightRoom:{label:"THE GRAND PAVILION"}
};
let sceneTransitionBusy=false;
let transitionCooldown=0;

const JEWELRY_CLOSED_INTERACTION={
  near:false,
  hideTimer:0
};

function isPlayerNearJewelryEntrance(){
  if(
    !player?.root ||
    activeWorldZone!=="outside"
  ){
    return false;
  }

  const p=player.root.position;
  const jewelryDoorX=SCENE_ENV_CONFIG.rightRoomCenterX;

  return (
    Math.abs(p.x-jewelryDoorX)<2.8 &&
    p.z>2.4 &&
    p.z<7.2
  );
}

function showJewelryClosedMessage(){
  showAttentionWarning(
    "Jewelry is currently closed · Reopening date to be announced.",
    2600
  );
}

function setWorldZone(zoneKey){
  const enteringCasino=
    zoneKey==="leftRoom";
  setCasinoInteriorLighting(enteringCasino);
  activeWorldZone=zoneKey;
  currentZoneLabel.textContent="";
}

function runDoorTransition(zoneKey,targetPosition,targetRotation){
  const previousZone=activeWorldZone;

  clearAllNpcConversationFinalPoses();

  if(sceneTransitionBusy || !player || !player.ready){
    return;
  }

  pendingDoorTransition=null;
  doorPrompt.style.display="none";
  sceneTransitionBusy=true;

  const enteringCasino=
    zoneKey==="leftRoom";

  const leavingCasino=
    zoneKey==="outside" &&
    previousZone==="leftRoom";

  const transitionLabel=
    enteringCasino
      ? "CASINO"
      : leavingCasino
        ? "OUTSIDE"
        : WORLD_ZONES[zoneKey].label;

  zoneTitle.classList.remove("active");
  zoneTitle.textContent=transitionLabel;
  sceneFade.classList.add("active");

  setTimeout(()=>{
    zoneTitle.classList.add("active");
  },170);

  setTimeout(()=>{
    player.root.position.copy(targetPosition);

    if(zoneKey==="leftRoom"){
      player.root.position.y=0.190;
    }

    player.root.rotation.y=targetRotation;
    cleanCameraReady=false;
    setWorldZone(zoneKey);

    if(
      zoneKey==="leftRoom" &&
      previousZone!=="leftRoom"
    ){
      resetCasinoChildToWall();
    }

    if(
      previousZone==="outside" &&
      zoneKey==="leftRoom"
    ){
      beginToxicEntryCamera();
    }

    if(
      zoneKey==="outside" &&
      previousZone==="leftRoom"
    ){
      beginToxicExitCamera();
    }
  },290);

  setTimeout(()=>{
    zoneTitle.classList.remove("active");
    sceneFade.classList.remove("active");

    setTimeout(()=>{
      sceneTransitionBusy=false;
      transitionCooldown=45;
    },330);
  },720);
}
function updateDoorSceneTransitions(){
  pendingDoorTransition=null;

  if(!player || !player.ready || sceneTransitionBusy){
    JEWELRY_CLOSED_INTERACTION.near=false;
    doorPrompt.style.display="none";
    return;
  }

  if(transitionCooldown>0){
    transitionCooldown--;
    JEWELRY_CLOSED_INTERACTION.near=
      isPlayerNearJewelryEntrance();
    doorPrompt.style.display="none";
    return;
  }

  const p=player.root.position;

  const leftDoorX=
    SCENE_ENV_CONFIG.leftRoomCenterX+
    SCENE_ENV_CONFIG.leftDoorOffsetX;

  const leftDoorZ=
    SCENE_ENV_CONFIG.doorZ;

  const doorDx=
    Math.abs(p.x-leftDoorX);

  const doorDz=
    Math.abs(p.z-leftDoorZ);

  const nearCasinoDoor=
    doorDx < 3.15 &&
    doorDz < 4.65;

  JEWELRY_CLOSED_INTERACTION.near=
    isPlayerNearJewelryEntrance();

  if(
    activeWorldZone==="outside" &&
    nearCasinoDoor &&
    p.z >= leftDoorZ-.35
  ){
    pendingDoorTransition={
      label:"E · ENTER CASINO",
      zoneKey:"leftRoom",
      target:new THREE.Vector3(
        leftDoorX,
        0,
        -2.9
      ),
      rotation:Math.PI
    };
  }

  if(
    activeWorldZone==="leftRoom" &&
    nearCasinoDoor &&
    p.z <= leftDoorZ+.35
  ){
    pendingDoorTransition={
      label:"E · EXIT TO OUTSIDE",
      zoneKey:"outside",
      target:new THREE.Vector3(
        leftDoorX,
        0,
        6.2
      ),
      rotation:0
    };
  }

  if(pendingDoorTransition){
    doorPrompt.textContent=
      pendingDoorTransition.label;

    doorPrompt.classList.add(
      "interactionPromptUnified"
    );

    doorPrompt.style.display="block";
    return;
  }

  if(JEWELRY_CLOSED_INTERACTION.near){
    doorPrompt.textContent="E · JEWELRY";
    doorPrompt.classList.add(
      "interactionPromptUnified"
    );
    doorPrompt.style.display="block";
    return;
  }

  doorPrompt.style.display="none";
}
function getPlayerMapZone(){
  if(!player || !player.ready) return "LOADING";
  const p=player.root.position;
  if(p.z<SCENE_ENV_CONFIG.frontZ){
    const splitX=(SCENE_ENV_CONFIG.leftRoomCenterX+SCENE_ENV_CONFIG.rightRoomCenterX)/2;
    return p.x<splitX ? "CASINO" : "JEWELRY STORE";
  }
  if(p.z<29.1) return "SIDEWALK";
  if(p.z<53.1) return "ROAD";
  if(p.z<60.5) return "FAR SIDEWALK";
  return "TERRAIN";
}
let playerMoving=false;
const PLAYER_MOVE_CACHE={
  previous:new THREE.Vector3(),
  camForward:new THREE.Vector3(),
  camRight:new THREE.Vector3(),
  moveDir:new THREE.Vector3(),


  previousForwardInput:0,
  previousSideInput:0,
  wToSoloTurnBlend:1,
  wToSoloTurnActive:false,
  wToSoloTurnDir:new THREE.Vector3(),


  turnMicroActive:false,
  turnMicroAnchor:new THREE.Vector3(),
  turnMicroStartYaw:0,
  turnPivotCenter:new THREE.Vector3(),
  turnPivotRadius:0,

  up:new THREE.Vector3(0,1,0)
};

window.__PLAYER_POSITION_READER__=()=>{
  if(!player?.root) return null;
  const wp=new THREE.Vector3();
  player.root.getWorldPosition(wp);
  return {
    x:wp.x,
    y:wp.y,
    z:wp.z,
    rotDeg:THREE.MathUtils.radToDeg(player.root.rotation.y),
    zone:typeof activeWorldZone!=="undefined" ? activeWorldZone : ""
  };
};

function updatePlayer(){
  if(typeof CASINO_CLAW_INTERACTION!=="undefined" && CASINO_CLAW_INTERACTION.aligning){
    for(const k of Object.keys(keys||{})) keys[k]=false;
    playerMoving=false;
    updateCasinoClawAutoAlign(typeof frameDt==="number" ? frameDt : .016);
    return;
  }

  if(typeof CASINO_CLAW_INTERACTION!=="undefined" && CASINO_CLAW_INTERACTION.active){
    for(const k of Object.keys(keys||{})) keys[k]=false;
    playerMoving=false;

    updateCasinoClawSoftRotation(
      typeof frameDt==="number" ? frameDt : .016
    );

    applyClawLeftHandPose(
      player,
      typeof frameDt==="number" ? frameDt : .016
    );

    if(
      CASINO_CLAW_INTERACTION.handReady &&
      !CASINO_CLAW_INTERACTION.softRotateActive
    ){
      if(!CASINO_CLAW_INTERACTION.exitSettledSince){
        CASINO_CLAW_INTERACTION.exitSettledSince=performance.now();
      }
    }else{
      CASINO_CLAW_INTERACTION.exitSettledSince=0;
    }

    return;
  }

  if(TELESCOPE_MODE.active){
    playerMoving=false;
    animateIdle(player);
    return;
  }

  if(QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active){
    playerMoving=false;
    if(player?.mixer && player.mixer.timeScale!==undefined){
      player.mixer.timeScale=THREE.MathUtils.lerp(
        player.mixer.timeScale,
        1.0,
        .16
      );
    }
    animateIdle(player);
    return;
  }

  if(INVENTORY.open || !player.ready || sceneTransitionBusy) return;

  const cache=PLAYER_MOVE_CACHE;
  const root=player.root;
  const previousPosition=cache.previous.copy(root.position);

  const w=!!keys["w"];
  const sKey=!!keys["s"];
  const aKey=!!keys["a"];
  const dKey=!!keys["d"];

  const forwardInput=(w ? 1 : 0)-(sKey ? 1 : 0);
  const sideInput=(dKey ? 1 : 0)-(aKey ? 1 : 0);

  const forwardTurning=
    forwardInput>0 &&
    Math.abs(sideInput)>.001;

  const pureTurnInPlace=
    forwardInput===0 &&
    Math.abs(sideInput)>.001;

  if(pureTurnInPlace && !cache.turnMicroActive){
    cache.turnMicroActive=true;
    cache.turnMicroAnchor.copy(root.position);
    cache.turnMicroStartYaw=root.rotation.y;


    const pivotSide=
      sideInput<0 ? -1 : 1;

    const pivotOffset=PLAYER_TURN_TUNING.pivotOffset*pivotSide;

    cache.turnPivotCenter.set(
      root.position.x+
        Math.cos(root.rotation.y)*pivotOffset,
      root.position.y,
      root.position.z-
        Math.sin(root.rotation.y)*pivotOffset
    );

    cache.turnPivotRadius=
      Math.abs(pivotOffset);
  }else if(!pureTurnInPlace && cache.turnMicroActive){
    cache.turnMicroActive=false;
  }

  const soloTurnInput=
    forwardInput===0 &&
    Math.abs(sideInput)>.001;

  const startedSoloTurnFromForward=
    soloTurnInput &&
    cache.previousForwardInput>0;

  if(startedSoloTurnFromForward){
    cache.wToSoloTurnActive=true;
    cache.wToSoloTurnBlend=0;


    cache.wToSoloTurnDir.set(
      Math.sin(root.rotation.y),
      0,
      Math.cos(root.rotation.y)
    );
  }

  playerMoving=
    forwardInput!==0 ||
    sideInput!==0;

  let targetFacingYaw=root.rotation.y;
  let backwardWalking=false;

  if(playerMoving){
    const speed=player.getMoveSpeed()*1.08; 


    const camForward=cache.camForward;
    camera.getWorldDirection(camForward);
    camForward.y=0;

    if(camForward.lengthSq()<.0001){
      camForward.set(0,0,-1);
    }else{
      camForward.normalize();
    }

    const camRight=cache.camRight.crossVectors(
      camForward,
      cache.up
    );

    if(camRight.lengthSq()>.0001){
      camRight.normalize();
    }

    const moveDir=cache.moveDir.set(0,0,0);

    if(forwardTurning){


      moveDir.set(
        Math.sin(root.rotation.y),
        0,
        Math.cos(root.rotation.y)
      );
    }else{
      if(forwardInput!==0){
        moveDir.addScaledVector(
          camForward,
          forwardInput
        );
      }

      if(sideInput!==0){
        moveDir.addScaledVector(
          camRight,
          sideInput
        );
      }

      if(moveDir.lengthSq()>.0001){
        moveDir.normalize();
      }

      if(
        soloTurnInput &&
        cache.wToSoloTurnActive
      ){
        cache.wToSoloTurnBlend=
          THREE.MathUtils.clamp(
            cache.wToSoloTurnBlend+
            THREE.MathUtils.clamp(
              (frameDt || 1/60)*PLAYER_TURN_TUNING.handoffSpeed,
              PLAYER_TURN_TUNING.handoffFrameMin,
              PLAYER_TURN_TUNING.handoffFrameMax
            ),
            0,
            1
          );

        const smoothAmount=
          THREE.MathUtils.smoothstep(
            cache.wToSoloTurnBlend,
            0,
            1
          );

        cache.wToSoloTurnDir.lerp(
          moveDir,
          PLAYER_TURN_TUNING.handoffLerpBase+PLAYER_TURN_TUNING.handoffLerpExtra*smoothAmount
        );

        cache.wToSoloTurnDir.y=0;

        if(cache.wToSoloTurnDir.lengthSq()>.0001){
          cache.wToSoloTurnDir.normalize();
          moveDir.copy(cache.wToSoloTurnDir);
        }

        if(cache.wToSoloTurnBlend>=.999){
          cache.wToSoloTurnActive=false;
        }
      }else if(!soloTurnInput){
        cache.wToSoloTurnActive=false;
        cache.wToSoloTurnBlend=1;
      }
    }

    const movementScale=THREE.MathUtils.clamp(
      (frameDt || 1/60)*60,
      .85,
      1.30
    );

    backwardWalking=
      forwardInput<0 &&
      Math.abs(sideInput)<.001;

    let speedFactor=1.0;

    if(backwardWalking){
      speedFactor=.52;
    }else if(
      forwardInput===0 &&
      sideInput!==0
    ){
      speedFactor=.88;
    }else if(
      forwardInput<0 &&
      sideInput!==0
    ){
      speedFactor=.80;
    }

    const globalPlayerMoveFactor=.79;


    const wSoloSpeedBoost=
      (forwardInput>0 && sideInput===0)
        ? 1.04
        : 1;

    if(pureTurnInPlace){
      const arcForward=cache.arcForward || (cache.arcForward=new THREE.Vector3());
      arcForward.set(
        Math.sin(root.rotation.y),
        0,
        Math.cos(root.rotation.y)
      );

      const arcStepFactor=.15;

      root.position.addScaledVector(
        arcForward,
        speed*
        movementScale*
        globalPlayerMoveFactor*
        arcStepFactor
      );
    }else{
      root.position.addScaledVector(
        moveDir,
        speed*
        movementScale*
        speedFactor*
        globalPlayerMoveFactor*
        wSoloSpeedBoost
      );
    }


    if(backwardWalking){
      targetFacingYaw=Math.atan2(
        -moveDir.x,
        -moveDir.z
      );
    }else if(forwardTurning){
      const lightYawAhead=
        THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.forwardSteerAheadDeg)*
        -Math.sign(sideInput);

      targetFacingYaw=
        root.rotation.y+
        lightYawAhead;
    }else if(pureTurnInPlace){
      const turnAhead=
        THREE.MathUtils.degToRad(PLAYER_TURN_TUNING.soloTurnAheadDeg)*
        -Math.sign(sideInput);

      targetFacingYaw=
        root.rotation.y+
        turnAhead;
    }else{
      targetFacingYaw=Math.atan2(
        moveDir.x,
        moveDir.z
      );
    }

    if(activeWorldZone==="outside"){
      const px=root.position.x;
      const pz=root.position.z;

      const isInsideRoad=
        pz>CROSSWALK.roadMinZ &&
        pz<CROSSWALK.roadMaxZ;

      const isOnCrosswalk=
        Math.abs(px-CROSSWALK.centerX)<=
        CROSSWALK.halfWidth;

      const previousWasInsideRoad=
        previousPosition.z>CROSSWALK.roadMinZ &&
        previousPosition.z<CROSSWALK.roadMaxZ;

      const enteringRoadNow=
        isInsideRoad &&
        !previousWasInsideRoad;

      if(isInsideRoad && !isOnCrosswalk){
        root.position.copy(previousPosition);
        showCrosswalkWarning();
      }else if(
        enteringRoadNow &&
        isOnCrosswalk &&
        isCrosswalkTrafficOccupied()
      ){
        root.position.copy(previousPosition);
        showTrafficOccupiedWarning();
      }

      root.position.z=THREE.MathUtils.clamp(
        root.position.z,
        U_BACK_Z+2,
        176.0
      );
    }else{
      const centerX=
        activeWorldZone==="leftRoom"
          ? SCENE_ENV_CONFIG.leftRoomCenterX
          : activeWorldZone==="rightRoom"
            ? SCENE_ENV_CONFIG.rightRoomCenterX
            : SCENE_ENV_CONFIG.thirdRoomCenterX;

      const halfW=
        SCENE_ENV_CONFIG.roomWidth*.5-.8;

      root.position.x=THREE.MathUtils.clamp(
        root.position.x,
        centerX-halfW,
        centerX+halfW
      );

      root.position.z=THREE.MathUtils.clamp(
        root.position.z,
        SCENE_ENV_CONFIG.backZ+1.0,
        SCENE_ENV_CONFIG.frontZ-1.0
      );
    }

    lcResolveMovement(previousPosition);
    enforceExactReferenceTaskLimits(
      previousPosition
    );

    EnvironmentBuilders.updateUnexploredMirageBoundary({
      player,
      activeWorldZone,
      state:UNEXPLORED_MIRAGE,
      previousPosition,
      showMessage:showUnexploredZoneMessage
    });
  }

  if(
    activeWorldZone==="outside" &&
    Math.abs(root.position.y-.025)>.0005
  ){
    root.position.y=.025;
  }

  if(playerMoving){
    if(
      player?.mixer &&
      player.mixer.timeScale!==undefined
    ){
      let targetTimeScale=1.0;

      if(backwardWalking){
        targetTimeScale=.86;
      }else if(
        forwardInput===0 &&
        sideInput!==0
      ){
        targetTimeScale=PLAYER_TURN_TUNING.soloMixerScale;
      }

      player.mixer.timeScale=
        THREE.MathUtils.lerp(
          player.mixer.timeScale,
          targetTimeScale,
          .12
        );
    }


    const lateralTurnOnly=
      forwardInput===0 &&
      sideInput!==0;

    if(lateralTurnOnly){


      AD_CURRENT_FRAME_ACTIVE=true;
      try{
        animatePlayerWalk(
          player,
          1.08,
          0
        );

        softenPlayerADPivotFoot(
          player,
          sideInput
        );

        const softerADTarget=
          root.rotation.y+
          normalizeAngle(targetFacingYaw-root.rotation.y)*AD_CURRENT.targetScale;

        applyPlayerSoftDirectionalTurn(
          player,
          softerADTarget
        );
      }finally{
        AD_CURRENT_FRAME_ACTIVE=false;
      }
    }else{
      animatePlayerWalk(
        player,
        backwardWalking ? -1 : 1,
        0
      );


      if(forwardTurning){
        applyPlayerForwardWalkingTurn(
          player,
          targetFacingYaw
        );
      }else{
        applyPlayerSoftDirectionalTurn(
          player,
          targetFacingYaw
        );
      }
    }
  }else{
const softState=
      getPlayerSoftTurnState(player);

    softState.amount=
      THREE.MathUtils.lerp(
        softState.amount,
        0,
        .16
      );

    if(
      player?.mixer &&
      player.mixer.timeScale!==undefined
    ){
      player.mixer.timeScale=
        THREE.MathUtils.lerp(
          player.mixer.timeScale,
          1.0,
          .16
        );
    }

    animateIdle(player);
  }

  cache.previousForwardInput=forwardInput;
  cache.previousSideInput=sideInput;
}

function createFourPointStarGeometry(outer=.085,inner=.018){
  const shape=new THREE.Shape();
  const pts=[
    [0,outer],[inner,inner],[outer,0],[inner,-inner],
    [0,-outer],[-inner,-inner],[-outer,0],[-inner,inner]
  ];
  shape.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) shape.lineTo(pts[i][0],pts[i][1]);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
function createCollectibleWallet(){
  const root=new THREE.Group();
  root.name="collectible_wallet";
  const leather=new THREE.MeshStandardMaterial({
    color:0x6b3b24,
    roughness:.72,
    metalness:.02
  });
  const leatherDark=new THREE.MeshStandardMaterial({
    color:0x3d2118,
    roughness:.82,
    metalness:.01
  });
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(.72,.085,.48),
    leather
  );
  body.position.y=.07;
  root.add(body);
  const fold=new THREE.Mesh(
    new THREE.BoxGeometry(.035,.094,.46),
    leatherDark
  );
  fold.position.set(0,.071,0);
  root.add(fold);
  const clasp=new THREE.Mesh(
    new THREE.BoxGeometry(.12,.045,.10),
    new THREE.MeshStandardMaterial({color:0xb88a52,roughness:.4,metalness:.65})
  );
  clasp.position.set(.25,.125,.18);
  root.add(clasp);
  const card=new THREE.Mesh(
    new THREE.BoxGeometry(.30,.018,.20),
    new THREE.MeshStandardMaterial({color:0xded8c8,roughness:.82})
  );
  card.position.set(.12,.13,-.08);
  card.rotation.y=-.12;
  root.add(card);
  root.position.set(
    SCENE_ENV_CONFIG.leftRoomCenterX+11.8,
    .18,
    -20.8
  );
  root.rotation.set(0,.35,.06);
  root.visible=false;
  scene.add(root);
  const sparkleGeo=createFourPointStarGeometry(.075,.014);
  const sparkleMat=new THREE.MeshBasicMaterial({
    color:0xe8edf5,
    transparent:true,
    opacity:.90,
    depthWrite:false,
    side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending
  });
  const sparkles=[];
  for(const [x,y,z,p] of [[-.32,.18,-.18,0],[.32,.16,.15,1.3],[0,.24,0,2.6]]){
    const sp=new THREE.Mesh(sparkleGeo,sparkleMat.clone());
    sp.position.set(x,y,z);
    sp.rotation.x=-Math.PI/2;
    sp.userData.phase=p;
    root.add(sp);
    sparkles.push(sp);
  }
  root.userData.sparkles=sparkles;
  COLLECTIBLES.wallet=root;
}
createCollectibleWallet();
function updateCollectibleSparkles(){
  if(!moduleInitializationComplete) return;
  const t=performance.now()*.006;
  for(const root of [COLLECTIBLES.wallet,COLLECTIBLES.documents]){
    if(!root?.visible || !root?.userData?.sparkles) continue;
    if(player?.root){
      const dx=player.root.position.x-root.position.x;
      const dz=player.root.position.z-root.position.z;
      if(dx*dx+dz*dz>30*30) continue;
    }
    for(const s of root.userData.sparkles){
      const phase=s.userData.phase||0;
      const pulse=.5+.5*Math.sin(t+phase);
      const sc=.62+pulse*.72;
      s.scale.setScalar(sc);
      s.material.opacity=.38+pulse*.62;
      s.rotation.z+=.02;
    }
  }
}
function distance(a,b){
  return a.root.position.distanceTo(b.root.position);
}
function questIsPoliceTarget(target){
  return target?.name==="securityMan";
}
const SECURITY_INTERACTION_CONE={

  minFrontDot:Math.cos(THREE.MathUtils.degToRad(90))
};

function isPlayerBodyFacingSecurity(security){
  if(
    !security?.root ||
    !player?.root ||
    !["securityMan","child"].includes(security.name)
  ){
    return false;
  }

  const playerPos=new THREE.Vector3();
  const securityPos=new THREE.Vector3();

  player.root.getWorldPosition(playerPos);
  security.root.getWorldPosition(securityPos);

  const toSecurity=securityPos.sub(playerPos);
  toSecurity.y=0;

  if(toSecurity.lengthSq()<0.000001) return true;
  toSecurity.normalize();

  const playerForward=new THREE.Vector3(0,0,1);
  const playerQ=new THREE.Quaternion();

  player.root.getWorldQuaternion(playerQ);
  playerForward.applyQuaternion(playerQ);
  playerForward.y=0;

  if(playerForward.lengthSq()<0.000001) return false;
  playerForward.normalize();

  return (
    playerForward.dot(toSecurity) >=
    Math.cos(THREE.MathUtils.degToRad(35))
  );
}

function isPlayerInSecurityFrontCone(security){
  if(
    !security?.root ||
    !player?.root ||
    !["securityMan","child"].includes(security.name)
  ){
    return false;
  }

  const securityPos=new THREE.Vector3();
  const playerPos=new THREE.Vector3();
  const forward=new THREE.Vector3(0,0,1);

  security.root.getWorldPosition(securityPos);
  player.root.getWorldPosition(playerPos);

  const rootQ=new THREE.Quaternion();
  security.root.getWorldQuaternion(rootQ);

  forward.applyQuaternion(rootQ);
  forward.y=0;

  if(forward.lengthSq()<0.000001) return false;
  forward.normalize();

  const toPlayer=playerPos.sub(securityPos);
  toPlayer.y=0;

  if(toPlayer.lengthSq()<0.000001) return true;
  toPlayer.normalize();

  return (
    forward.dot(toPlayer) >=
    SECURITY_INTERACTION_CONE.minFrontDot
  );
}

const CHILD_TALK_INTERACTION={


  maxDistance:1.75
};

function canInteractWithNpc(npc){
  if(!npc) return false;
  if(npc.visible===false) return false;

  if(npc.name==="securityMan"){
    return (
      isPlayerInSecurityFrontCone(npc) &&
      isPlayerBodyFacingSecurity(npc)
    );
  }

  if(npc.name==="child"){
    if(!npc.root || !player?.root) return false;

    const npcPos=new THREE.Vector3();
    const playerPos=new THREE.Vector3();

    npc.root.getWorldPosition(npcPos);
    player.root.getWorldPosition(playerPos);

    npcPos.y=0;
    playerPos.y=0;


    return playerPos.distanceTo(npcPos)<=CHILD_TALK_INTERACTION.maxDistance;
  }

  return true;
}

function updateInteraction(){
  if(!moduleInitializationComplete) return;
  const eDown=!!keys["e"];
  if(QUEST.dialogueActive || GLOBAL_DIALOGUE_LOCK.active){
    if(pickupPrompt) pickupPrompt.style.display="none";
    if(slotPrompt) slotPrompt.style.display="none";
    return;
  }
  currentTarget=null;
  collectibleTarget=null;
  slotInteractionTarget=null;
  if(INVENTORY.open){
    if(pickupPrompt) pickupPrompt.style.display="none";
    if(slotPrompt) slotPrompt.style.display="none";
    lastE=eDown;
    return;
  }
  let best=null;
  let bestDist=999;
  const collectibleCandidates=[
    {id:"wallet",name:"Wallet",kind:"wallet",root:COLLECTIBLES.wallet}
  ];
  let collectibleBest=999;
  for(const item of collectibleCandidates){
    if(!item.root) continue;
    const d=player.root.position.distanceTo(item.root.position);
    if(d<2.6 && d<collectibleBest){
      collectibleBest=d;
      collectibleTarget=item;
    }
  }
  for(const npc of npcs){
    if(!npc.ready || !npc.root?.visible) continue;

    const d=player.distanceTo(npc);

    const talkRange=
      npc.name==="child"
        ? CHILD_TALK_INTERACTION.maxDistance
        : 4.3;

    if(
      d<talkRange &&
      d<bestDist &&
      canInteractWithNpc(npc)
    ){
      best=npc;
      bestDist=d;
    }
  }
  currentTarget=best;
  let promptText="";
  const telescopeNear=isPlayerNearTelescope();
  if(telescopeNear){
    promptText="";
  }else if(collectibleTarget){
    promptText=`Press E to pick up ${collectibleTarget.name}`;
  }else if(casinoReceptionistNear() && !RECEPTION_EXCHANGE.open){
    promptText="Press E to talk to Receptionist";
  }else if(casinoBoyNear()){
    promptText="Press E to talk to Boy";
  }else if(currentTarget?.name==="securityMan"){
    promptText="Press E to talk to Security";
  }else if(currentTarget?.name==="child"){
    promptText="Press E to talk to Girl";
  }else if(currentTarget?.name==="toxicMan" && QUEST.stage==="find_suspicious"){
    promptText="Investigating suspicious person...";
  }
  if(pickupPrompt){
    if(promptText){
      pickupPrompt.textContent=promptText;
      pickupPrompt.style.display="block";
    }else{
      pickupPrompt.style.display="none";
    }
  }
  if(slotPrompt) slotPrompt.style.display="none";
  if(eDown && !lastE){
    if(
      QUEST.stage==="call_security" &&
      POLICE_RADIO.owned &&
      POLICE_RADIO.callReady
    ){
      usePoliceRadio();
      lastE=eDown;
      return;
    }

    if(telescopeNear){
      enterTelescopeMode();
    }else if(casinoReceptionistNear() && !RECEPTION_EXCHANGE.open){
      questStartDialogue("RECEPTIONIST",[
        "Welcome. I can exchange dollars into cents for the machines.",
        "How many dollars would you like to exchange?"
      ],()=>{
        openReceptionExchange();
      });
    }else if(casinoBoyNear()){
      talkToCasinoBoy();
    }else if(collectibleTarget){
      const item=collectibleTarget;
      addInventoryItem({
        id:item.id,
        name:item.name,
        kind:item.kind,
        description:item.id==="wallet"
          ? "A brown leather wallet with an ID and photo inside."
          : ""
      });
      if(item.root?.parent) item.root.parent.remove(item.root);
      if(item.id==="wallet"){
        COLLECTIBLES.wallet=null;
        if(QUEST.stage==="search_clues"){
          questSetStage("return_wallet");
          questShowClue("Wallet found · bring it to the Police.");
        }
      }
      collectibleTarget=null;
      if(pickupPrompt) pickupPrompt.style.display="none";
    }else if(JEWELRY_CLOSED_INTERACTION.near){
      showJewelryClosedMessage();
    }else if(pendingDoorTransition){
      runDoorTransition(
        pendingDoorTransition.zoneKey,
        pendingDoorTransition.target,
        pendingDoorTransition.rotation
      );
    }else if(currentTarget && canInteractWithNpc(currentTarget)){
      if(questIsPoliceTarget(currentTarget)){
        questTalkToPolice();
      }else if(currentTarget?.name==="toxicMan" && QUEST.stage==="find_suspicious"){
        beginThiefDiscovery();
      }else{
        beginGenericNPCConversation(currentTarget);
      }
    }
  }
  lastE=eDown;
}
const NPC_RELEVANCE_CONFIG={
  nearDistance:25,
  mediumDistance:60,
  farDistance:120,
  nearEvery:1,
  mediumEvery:2,
  farEvery:4,
  veryFarEvery:12
};
let NPC_RELEVANCE_TICK=0;
function shouldUpdateNPCByDistance(npc){
  if(!npc?.ready || !npc?.root) return false;
  if(
    npc.state==="talk" ||
    currentTarget===npc ||
    QUEST.dialogueActive ||
    GLOBAL_DIALOGUE_LOCK.active
  ){
    return true;
  }
  if(!player?.root) return true;
  const dx=npc.root.position.x-player.root.position.x;
  const dz=npc.root.position.z-player.root.position.z;
  const distSq=dx*dx+dz*dz;
  const nearSq=
    NPC_RELEVANCE_CONFIG.nearDistance*
    NPC_RELEVANCE_CONFIG.nearDistance;
  const mediumSq=
    NPC_RELEVANCE_CONFIG.mediumDistance*
    NPC_RELEVANCE_CONFIG.mediumDistance;
  const farSq=
    NPC_RELEVANCE_CONFIG.farDistance*
    NPC_RELEVANCE_CONFIG.farDistance;
  let every=NPC_RELEVANCE_CONFIG.veryFarEvery;
  if(distSq<=nearSq){
    every=NPC_RELEVANCE_CONFIG.nearEvery;
  }else if(distSq<=mediumSq){
    every=NPC_RELEVANCE_CONFIG.mediumEvery;
  }else if(distSq<=farSq){
    every=NPC_RELEVANCE_CONFIG.farEvery;
  }
  if(every<=1) return true;
  if(npc.__relevancePhase===undefined){
    npc.__relevancePhase=
      Math.abs(
        String(npc.name||"npc")
          .split("")
          .reduce((acc,ch)=>acc+ch.charCodeAt(0),0)
      )%every;
  }
  return (
    (NPC_RELEVANCE_TICK+npc.__relevancePhase)%every
  )===0;
}

const SECURITY_LOWER_BODY_EDITOR={
  panel:null,
  readout:null,
  initialized:false,
  bones:{},
  rest:{},
  offsets:{
    hips:{x:0,y:0,z:0},
    leftUpLeg:{x:0,y:0,z:0},
    rightUpLeg:{x:0,y:0,z:0},
    leftKnee:{x:0,y:0,z:0},
    rightKnee:{x:0,y:0,z:0},
    leftFoot:{x:0,y:0,z:0},
    rightFoot:{x:0,y:0,z:0},
    leftToe:{x:0,y:0,z:0},
    rightToe:{x:0,y:0,z:0}
  }
};

function cacheSecurityLowerBodyEditor(){
  const security=questGetPolice?.();
  if(!security?.root) return false;

  const b=getBones(security);
  const map={
    hips:b.hips,
    leftUpLeg:b.leftUpLeg,
    rightUpLeg:b.rightUpLeg,
    leftKnee:b.leftKnee,
    rightKnee:b.rightKnee,
    leftFoot:b.leftFoot,
    rightFoot:b.rightFoot,
    leftToe:b.leftToe,
    rightToe:b.rightToe
  };

  for(const [key,bone] of Object.entries(map)){
    if(!bone) continue;
    SECURITY_LOWER_BODY_EDITOR.bones[key]=bone;

    if(!SECURITY_LOWER_BODY_EDITOR.rest[key]){
      SECURITY_LOWER_BODY_EDITOR.rest[key]={
        x:bone.rotation.x,
        y:bone.rotation.y,
        z:bone.rotation.z
      };
    }
  }

  SECURITY_LOWER_BODY_EDITOR.initialized=true;
  return true;
}

function applySecurityLowerBodyEditor(){
  const security=questGetPolice?.();
  if(!security?.root) return;

  if(!cacheSecurityLowerBodyEditor()) return;

  const D=THREE.MathUtils.degToRad;

  for(const [key,off] of Object.entries(SECURITY_LOWER_BODY_EDITOR.offsets)){
    const bone=SECURITY_LOWER_BODY_EDITOR.bones[key];
    const rest=SECURITY_LOWER_BODY_EDITOR.rest[key];

    if(!bone || !rest) continue;

    bone.rotation.set(
      rest.x+D(off.x||0),
      rest.y+D(off.y||0),
      rest.z+D(off.z||0)
    );
  }

  security.root.updateMatrixWorld(true);
}

function refreshSecurityLowerBodyEditorReadout(){
  if(!SECURITY_LOWER_BODY_EDITOR.readout) return;

  const lines=["SECURITY LOWER BODY"];

  for(const [key,v] of Object.entries(SECURITY_LOWER_BODY_EDITOR.offsets)){
    lines.push(
      `${key}: x ${Number(v.x).toFixed(1)}° · `+
      `y ${Number(v.y).toFixed(1)}° · `+
      `z ${Number(v.z).toFixed(1)}°`
    );
  }

  SECURITY_LOWER_BODY_EDITOR.readout.textContent=lines.join("\n");
}

function ensureSecurityLowerBodyEditor(){
  if(SECURITY_LOWER_BODY_EDITOR.panel){
    return SECURITY_LOWER_BODY_EDITOR.panel;
  }

  const panel=document.createElement("div");
  panel.id="securityLowerBodyEditor";

  Object.assign(panel.style,{
    position:"fixed",
    right:"18px",
    top:"18px",
    width:"315px",
    maxHeight:"82vh",
    overflowY:"auto",
    zIndex:"999999",
    display:"block",
    padding:"10px",
    borderRadius:"10px",
    background:"rgba(8,10,15,.97)",
    border:"1px solid rgba(110,200,255,.48)",
    color:"#fff",
    font:"11px Arial,sans-serif",
    boxShadow:"0 14px 38px rgba(0,0,0,.48)"
  });

  const title=document.createElement("div");
  title.textContent="SECURITY LOWER BODY";
  Object.assign(title.style,{
    font:"900 13px Arial,sans-serif",
    letterSpacing:".07em",
    marginBottom:"5px"
  });
  panel.appendChild(title);

  const sub=document.createElement("div");
  sub.textContent="Prova pose della parte bassa del Security. Valori relativi alla posa base.";
  Object.assign(sub.style,{
    color:"rgba(255,255,255,.66)",
    fontSize:"10px",
    lineHeight:"1.35",
    marginBottom:"7px"
  });
  panel.appendChild(sub);

  const read=document.createElement("pre");
  Object.assign(read.style,{
    whiteSpace:"pre-wrap",
    margin:"0 0 8px",
    padding:"6px",
    maxHeight:"110px",
    overflowY:"auto",
    borderRadius:"6px",
    background:"rgba(255,255,255,.045)",
    color:"rgba(255,255,255,.80)",
    font:"9px/1.3 monospace"
  });
  panel.appendChild(read);
  SECURITY_LOWER_BODY_EDITOR.readout=read;

  const labels={
    hips:"HIPS",
    leftUpLeg:"LEFT UPPER LEG",
    rightUpLeg:"RIGHT UPPER LEG",
    leftKnee:"LEFT KNEE",
    rightKnee:"RIGHT KNEE",
    leftFoot:"LEFT FOOT",
    rightFoot:"RIGHT FOOT",
    leftToe:"LEFT TOE",
    rightToe:"RIGHT TOE"
  };

  for(const [key,label] of Object.entries(labels)){
    const section=document.createElement("div");
    Object.assign(section.style,{
      borderTop:"1px solid rgba(255,255,255,.08)",
      paddingTop:"6px",
      marginTop:"6px"
    });

    const h=document.createElement("div");
    h.textContent=label;
    h.style.fontWeight="900";
    h.style.fontSize="10px";
    section.appendChild(h);

    for(const axis of ["x","y","z"]){
      const row=document.createElement("div");
      Object.assign(row.style,{
        display:"grid",
        gridTemplateColumns:"18px 1fr 56px",
        gap:"5px",
        alignItems:"center",
        margin:"3px 0"
      });

      const lab=document.createElement("span");
      lab.textContent=axis.toUpperCase();

      const slider=document.createElement("input");
      slider.type="range";
      slider.min="-90";
      slider.max="90";
      slider.step=".5";
      slider.value=String(
        SECURITY_LOWER_BODY_EDITOR.offsets[key][axis]
      );

      const val=document.createElement("span");
      val.textContent=
        Number(slider.value).toFixed(1)+"°";
      val.style.textAlign="right";
      val.style.fontFamily="monospace";

      slider.addEventListener("input",()=>{
        SECURITY_LOWER_BODY_EDITOR.offsets[key][axis]=
          Number(slider.value);

        val.textContent=
          Number(slider.value).toFixed(1)+"°";

        applySecurityLowerBodyEditor();
        refreshSecurityLowerBodyEditorReadout();
      });

      row.append(lab,slider,val);
      section.appendChild(row);
    }

    panel.appendChild(section);
  }

  const reset=document.createElement("button");
  reset.textContent="RESET LOWER BODY";
  Object.assign(reset.style,{
    width:"100%",
    marginTop:"8px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  reset.addEventListener("click",()=>{
    for(const v of Object.values(SECURITY_LOWER_BODY_EDITOR.offsets)){
      v.x=0; v.y=0; v.z=0;
    }

    panel.remove();
    SECURITY_LOWER_BODY_EDITOR.panel=null;
    SECURITY_LOWER_BODY_EDITOR.readout=null;

    applySecurityLowerBodyEditor();
    ensureSecurityLowerBodyEditor();
  });

  panel.appendChild(reset);

  const print=document.createElement("button");
  print.textContent="PRINT / COPY LOWER BODY";
  Object.assign(print.style,{
    width:"100%",
    marginTop:"5px",
    padding:"8px",
    cursor:"pointer",
    fontWeight:"900"
  });

  print.addEventListener("click",async()=>{
    const txt=
      "SECURITY LOWER BODY\n"+
      JSON.stringify(
        SECURITY_LOWER_BODY_EDITOR.offsets,
        null,
        2
      );

    console.log(txt);

    try{
      await navigator.clipboard.writeText(txt);
      print.textContent="COPIED + PRINTED";
    }catch(e){
      print.textContent="PRINTED TO CONSOLE";
    }

    setTimeout(()=>{
      print.textContent="PRINT / COPY LOWER BODY";
    },1300);
  });

  panel.appendChild(print);

  document.body.appendChild(panel);
  SECURITY_LOWER_BODY_EDITOR.panel=panel;

  refreshSecurityLowerBodyEditorReadout();
  return panel;
}

function updateSecurityLowerBodyEditor(){
  if(SECURITY_LOWER_BODY_EDITOR?.panel){
    SECURITY_LOWER_BODY_EDITOR.panel.style.setProperty("display","none","important");
  }

}

const SECURITY_TURN_POSE_EDITOR={
  panel:null,
  closed:false,
  readout:null,
  initialized:false,
  activePose:"start",
  bones:{},
  rest:{},
  poses:{
    start:{
      hips:{x:0,y:0,z:0},
      leftUpLeg:{x:0,y:0,z:0},
      rightUpLeg:{x:0,y:0,z:0},
      leftKnee:{x:0,y:0,z:0},
      rightKnee:{x:0,y:0,z:0},
      leftFoot:{x:0,y:0,z:0},
      rightFoot:{x:0,y:0,z:0},
      leftToe:{x:0,y:0,z:0},
      rightToe:{x:0,y:0,z:0}
    },
    mid:{
      hips:{x:0,y:1.2,z:0.35},
      leftUpLeg:{x:0.5,y:-0.9,z:-0.35},
      rightUpLeg:{x:-10.5,y:1.9,z:0.65},
      leftKnee:{x:0,y:-0.6,z:-0.25},
      rightKnee:{x:-17.5,y:0.4,z:0.25},
      leftFoot:{x:0.55,y:-1.35,z:-0.40},
      rightFoot:{x:-0.9,y:4.9,z:1.15},
      leftToe:{x:0.2,y:-0.7,z:-0.15},
      rightToe:{x:-0.45,y:2.9,z:0.30}
    },
    leftMid:{
      hips:{x:0,y:-1.2,z:-0.35},
      leftUpLeg:{x:-10.5,y:-1.9,z:-0.65},
      rightUpLeg:{x:0.5,y:0.9,z:0.35},
      leftKnee:{x:-17.5,y:-0.4,z:-0.25},
      rightKnee:{x:0,y:0.6,z:0.25},
      leftFoot:{x:-0.9,y:-4.9,z:-1.15},
      rightFoot:{x:0.55,y:1.35,z:0.40},
      leftToe:{x:-0.45,y:-2.9,z:-0.30},
      rightToe:{x:0.2,y:0.7,z:0.15}
    },
    end:{
      hips:{x:0,y:0,z:0},
      leftUpLeg:{x:0,y:0,z:0},
      rightUpLeg:{x:0,y:0,z:0},
      leftKnee:{x:0,y:0,z:0},
      rightKnee:{x:0,y:0,z:0},
      leftFoot:{x:0,y:0,z:0},
      rightFoot:{x:0,y:0,z:0},
      leftToe:{x:0,y:0,z:0},
      rightToe:{x:0,y:0,z:0}
    }
  },
  controls:{}
};

function lerpSecurityTurnPose(a,b,t){
  const out={};
  const k=smooth01(t);

  for(const key of Object.keys(a)){
    out[key]={
      x:THREE.MathUtils.lerp(a[key].x,b[key].x,k),
      y:THREE.MathUtils.lerp(a[key].y,b[key].y,k),
      z:THREE.MathUtils.lerp(a[key].z,b[key].z,k)
    };
  }

  return out;
}

function applyNpcTurnPoseValues(npc,pose){
  if(!npc?.root || !pose) return;

  const D=THREE.MathUtils.degToRad;
  const b=getBones(npc);

  for(const [key,off] of Object.entries(pose)){
    const bone=b[key];
    if(!bone) continue;

    const rest=getRest(npc,bone);
    if(!rest) continue;

    bone.rotation.set(
      rest.x+D(off.x||0),
      rest.y+D(off.y||0),
      rest.z+D(off.z||0)
    );
  }

  npc.root.updateMatrixWorld(true);
}

const NPC_TALK_TURN_STEP_STATE=new WeakMap();

function keepSecurityTurningFeetAboveGround(
  security,
  turnProgress,
  startYaw,
  targetYaw
){
  if(
    security?.name!=="securityMan" ||
    !security?.ready
  ){
    return;
  }

  const b=getBones(security);
  const p=THREE.MathUtils.clamp(turnProgress,0,1);
  const delta=normalizeAngle(targetYaw-startYaw);
  const direction=Math.sign(delta) || 1;

  security.root.updateMatrixWorld(true);

  const groundY=.035;

  const safety=.045;
  const footWorld=new THREE.Vector3();

  const protectFoot=(foot,toe,isLeft)=>{
    if(!foot) return;

    foot.getWorldPosition(footWorld);

    const penetration=
      Math.max(
        0,
        groundY+safety-footWorld.y
      );

    if(penetration<=0) return;

    const liftPitch=
      THREE.MathUtils.clamp(
        penetration*1.75,
        0,
        .135
      );

    const side=
      isLeft ? 1 : -1;

    const landingPhase=
      THREE.MathUtils.clamp(
        (p-.48)/.32,
        0,
        1
      );

    const anticipatoryPitch=
      Math.sin(landingPhase*Math.PI)*
      .026;

    foot.rotation.x-=(
      liftPitch+
      anticipatoryPitch
    );
    foot.rotation.y+=direction*side*.0015*Math.sin(p*Math.PI);

    if(toe){

      toe.rotation.x+=liftPitch*.82;
    }

    foot.updateMatrixWorld(true);
  };

  protectFoot(b.leftFoot,b.leftToe,true);
  protectFoot(b.rightFoot,b.rightToe,false);

  security.root.updateMatrixWorld(true);

  const leftPos=new THREE.Vector3();
  const rightPos=new THREE.Vector3();

  let lowest=Infinity;

  if(b.leftFoot){
    b.leftFoot.getWorldPosition(leftPos);
    lowest=Math.min(lowest,leftPos.y);
  }

  if(b.rightFoot){
    b.rightFoot.getWorldPosition(rightPos);
    lowest=Math.min(lowest,rightPos.y);
  }

  if(
    Number.isFinite(lowest) &&
    security.model
  ){
    const hardFloor=
      groundY+.018;

    const missing=
      Math.max(
        0,
        hardFloor-lowest
      );

    const emergencyLift=
      Math.min(
        missing,
        .004
      );

    const baseY=
      Number.isFinite(security.__securityModelBaseY)
        ? security.__securityModelBaseY
        : security.model.position.y;

    security.model.position.y=
      THREE.MathUtils.lerp(
        security.model.position.y,
        baseY+emergencyLift,
        emergencyLift>0 ? .28 : .12
      );

    security.model.updateMatrixWorld(true);
  }
}

function applySecurityTurnVerticalLift(
  security,
  turnProgress
){
  if(
    security?.name!=="securityMan" ||
    !security?.ready ||
    !security?.model
  ){
    return;
  }

  const p=THREE.MathUtils.clamp(turnProgress,0,1);

  const firstStep=
    Math.exp(
      -Math.pow((p-.30)/.13,2)
    );

  const secondStep=
    Math.exp(
      -Math.pow((p-.70)/.16,2)
    );

  const lift=
    Math.max(firstStep,secondStep)*
    .028;

  const baseY=
    Number.isFinite(security.__securityModelBaseY)
      ? security.__securityModelBaseY
      : security.model.position.y;

  security.model.position.y=
    THREE.MathUtils.lerp(
      security.model.position.y,
      baseY+lift,
      .18
    );

  security.model.updateMatrixWorld(true);
}

function animateSecurityLegsDirectionalTurn(
  security,
  turnProgress,
  startYaw,
  targetYaw
){
  if(
    security?.name!=="securityMan" ||
    !security?.ready
  ){
    return;
  }

  const b=getBones(security);
  const delta=normalizeAngle(targetYaw-startYaw);
  const direction=Math.sign(delta) || 1;
  const p=THREE.MathUtils.clamp(turnProgress,0,1);

  const pulse=Math.sin(p*Math.PI);

  const lUp=getRest(security,b.leftUpLeg);
  const rUp=getRest(security,b.rightUpLeg);
  const lKnee=getRest(security,b.leftKnee);
  const rKnee=getRest(security,b.rightKnee);
  const lFoot=getRest(security,b.leftFoot);
  const rFoot=getRest(security,b.rightFoot);

  if(b.leftUpLeg && lUp){
    smoothBoneTo(
      b.leftUpLeg,
      b.leftUpLeg.rotation.x,
      b.leftUpLeg.rotation.y+direction*.0035*pulse,
      b.leftUpLeg.rotation.z+direction*.0012*pulse,
      .060
    );
  }

  if(b.rightUpLeg && rUp){
    smoothBoneTo(
      b.rightUpLeg,
      b.rightUpLeg.rotation.x,
      b.rightUpLeg.rotation.y+direction*.0035*pulse,
      b.rightUpLeg.rotation.z-direction*.0012*pulse,
      .060
    );
  }

  if(b.leftKnee && lKnee){
    smoothBoneTo(
      b.leftKnee,
      b.leftKnee.rotation.x,
      b.leftKnee.rotation.y+direction*.0015*pulse,
      b.leftKnee.rotation.z,
      .060
    );
  }

  if(b.rightKnee && rKnee){
    smoothBoneTo(
      b.rightKnee,
      b.rightKnee.rotation.x,
      b.rightKnee.rotation.y+direction*.0015*pulse,
      b.rightKnee.rotation.z,
      .060
    );
  }

  const footOpen=.0055*pulse;
  const footCounter=.0025*pulse;

  if(b.leftFoot && lFoot){
    const leftYaw=
      direction>0
        ? direction*footOpen
        : direction*footCounter;

    smoothBoneTo(
      b.leftFoot,
      b.leftFoot.rotation.x,
      b.leftFoot.rotation.y+leftYaw,
      b.leftFoot.rotation.z,
      .065
    );
  }

  if(b.rightFoot && rFoot){
    const rightYaw=
      direction<0
        ? direction*footOpen
        : direction*footCounter;

    smoothBoneTo(
      b.rightFoot,
      b.rightFoot.rotation.x,
      b.rightFoot.rotation.y+rightYaw,
      b.rightFoot.rotation.z,
      .065
    );
  }
}

function animateSecurityUpperBodyDuringTurn(
  security,
  turnProgress,
  startYaw,
  targetYaw
){
  if(
    security?.name!=="securityMan" ||
    !security?.ready
  ){
    return;
  }

  const b=getBones(security);
  const delta=normalizeAngle(targetYaw-startYaw);
  const direction=Math.sign(delta) || 1;
  const p=THREE.MathUtils.clamp(turnProgress,0,1);

  const headLead=smooth01(
    THREE.MathUtils.clamp(p/.22,0,1)
  );
  const neckLead=smooth01(
    THREE.MathUtils.clamp((p-.05)/.34,0,1)
  );
  const chestLead=smooth01(
    THREE.MathUtils.clamp((p-.13)/.48,0,1)
  );

  const remaining=1-smooth01(
    THREE.MathUtils.clamp((p-.35)/.65,0,1)
  );

  const headYaw=
    THREE.MathUtils.clamp(delta,-.58,.58)*
    headLead*
    remaining;

  const neckYaw=
    THREE.MathUtils.clamp(delta,-.38,.38)*
    neckLead*
    remaining;

  const chestYaw=
    THREE.MathUtils.clamp(delta,-.22,.22)*
    chestLead*
    remaining;

  const headRest=getRest(security,b.head);
  const neckRest=getRest(security,b.neck);
  const spineRest=getRest(security,b.spine);
  const hipsRest=getRest(security,b.hips);
  const leftShoulderRest=getRest(security,b.leftShoulder);
  const rightShoulderRest=getRest(security,b.rightShoulder);

  if(b.head && headRest){
    smoothBoneTo(
      b.head,
      headRest.x,
      headRest.y+headYaw,
      headRest.z,
      .18
    );
  }

  if(b.neck && neckRest){
    smoothBoneTo(
      b.neck,
      neckRest.x,
      neckRest.y+neckYaw,
      neckRest.z,
      .15
    );
  }

  if(b.spine && spineRest){
    smoothBoneTo(
      b.spine,
      spineRest.x,
      spineRest.y+chestYaw,
      spineRest.z+direction*.006*Math.sin(p*Math.PI),
      .12
    );
  }

  if(b.hips && hipsRest){
    smoothBoneTo(
      b.hips,
      hipsRest.x,
      hipsRest.y+chestYaw*.20,
      hipsRest.z+direction*.0025*Math.sin(p*Math.PI),
      .10
    );
  }

  const shoulderPulse=Math.sin(p*Math.PI);

  if(b.leftShoulder && leftShoulderRest){
    smoothBoneTo(
      b.leftShoulder,
      leftShoulderRest.x+direction*.0025*shoulderPulse,
      leftShoulderRest.y+chestYaw*.16,
      leftShoulderRest.z+direction*.006*shoulderPulse,
      .11
    );
  }

  if(b.rightShoulder && rightShoulderRest){
    smoothBoneTo(
      b.rightShoulder,
      rightShoulderRest.x-direction*.0025*shoulderPulse,
      rightShoulderRest.y+chestYaw*.16,
      rightShoulderRest.z-direction*.006*shoulderPulse,
      .11
    );
  }
}

function turnNpcTowardPlayerWithSteps(npc,turnSpeed=.31){
  if(!npc?.ready || !npc?.root || !player?.root) return false;

  const dx=player.root.position.x-npc.root.position.x;
  const dz=player.root.position.z-npc.root.position.z;
  if(dx*dx+dz*dz<0.0001) return false;

  const targetYaw=Math.atan2(dx,dz);
  const currentYaw=npc.root.rotation.y;
  const delta=normalizeAngle(targetYaw-currentYaw);
  const absDelta=Math.abs(delta);

  if(
    npc.name==="securityMan" ||
    npc.name==="child" ||
    npc.name==="toxicMan"
  ){
    ensureNpcConversationOriginalYaw(npc);

    let state=NPC_TALK_TURN_STEP_STATE.get(npc);

    if(!state || !state.poseSequence){
      state={
        poseSequence:true,
        active:false,
        progress:0,
        startYaw:currentYaw,
        targetYaw
      };
      NPC_TALK_TURN_STEP_STATE.set(npc,state);
    }

    if(!state.active && absDelta>THREE.MathUtils.degToRad(10)){

      applyNpcTurnPoseValues(
        npc,
        SECURITY_TURN_POSE_EDITOR.poses.start
      );

      state.active=true;
      state.progress=0;
      state.startYaw=currentYaw;
      state.targetYaw=targetYaw;
    }

    if(state.active){

      state.targetYaw=targetYaw;

      state.progress=Math.min(1,state.progress+.0325);

      const p=state.progress;
      const poses=SECURITY_TURN_POSE_EDITOR.poses;
      const neutral=poses.start;

      let pose;

      if(p<.03){

        pose=neutral;
      }else if(p<.25){

        pose=lerpSecurityTurnPose(
          neutral,
          poses.mid,
          (p-.03)/.22
        );
      }else if(p<.43){

        pose=lerpSecurityTurnPose(
          poses.mid,
          neutral,
          (p-.25)/.18
        );
      }else if(p<.65){

        pose=lerpSecurityTurnPose(
          neutral,
          poses.leftMid,
          (p-.43)/.22
        );
      }else{

        pose=lerpSecurityTurnPose(
          poses.leftMid,
          poses.end,
          (p-.65)/.35
        );
      }

      applyNpcTurnPoseValues(npc,pose);

      if(npc.name==="securityMan"){
        animateSecurityLegsDirectionalTurn(
          npc,
          p,
          state.startYaw,
          state.targetYaw
        );

        applySecurityTurnVerticalLift(
          npc,
          p
        );

        keepSecurityTurningFeetAboveGround(
          npc,
          p,
          state.startYaw,
          state.targetYaw
        );

        animateSecurityUpperBodyDuringTurn(
          npc,
          p,
          state.startYaw,
          state.targetYaw
        );
      }

      const yawT=
        npc.name==="securityMan"
          ? smooth01(
              THREE.MathUtils.clamp(
                (p-.10)/.82,
                0,
                1
              )
            )
          : smooth01(
              THREE.MathUtils.clamp(p*1.30,0,1)
            );
      npc.root.rotation.y=
        state.startYaw+
        normalizeAngle(state.targetYaw-state.startYaw)*yawT;

      if(p>=1){
        npc.root.rotation.y=state.targetYaw;
        applyNpcTurnPoseValues(
          npc,
          SECURITY_TURN_POSE_EDITOR.poses.end
        );

        if(npc.name==="securityMan"){
          animateSecurityUpperBodyDuringTurn(
            npc,
            1,
            state.startYaw,
            state.targetYaw
          );
        }
        state.active=false;
        state.progress=0;
      }

      return true;
    }

    return false;
  }

  npc.root.rotation.y=lerpAngle(
    currentYaw,
    targetYaw,
    turnSpeed
  );

  return absDelta>THREE.MathUtils.degToRad(.8);
}


const CHILD_TALK_HAND_STATE=new WeakMap();

function applyChildTalkHandsFinalPass(npc){
  if(
    !npc?.ready ||
    npc.name!=="child" ||
    npc.state!=="talk"
  ){
    return;
  }

  const b=getBones(npc);
  if(!b) return;

  let s=CHILD_TALK_HAND_STATE.get(npc);
  if(!s){
    s={phase:Math.random()*Math.PI*2};
    CHILD_TALK_HAND_STATE.set(npc,s);
  }

  const t=performance.now()*.001;
  const wave=Math.sin(t*1.65+s.phase);
  const wave2=Math.sin(t*1.22+s.phase+Math.PI*.55);


  const fore=
    THREE.MathUtils.degToRad(1.8)*wave;

  const hand=
    THREE.MathUtils.degToRad(.85)*wave;

  const twist=
    THREE.MathUtils.degToRad(.65)*wave2;

  addPlayerBoneAxisRotation(
    npc,b.leftForeArm,
    PLAYER_AXIS_RIGHT,
    fore
  );
  addPlayerBoneAxisRotation(
    npc,b.rightForeArm,
    PLAYER_AXIS_RIGHT,
    -fore
  );

  addPlayerBoneAxisRotation(
    npc,b.leftHand,
    PLAYER_AXIS_RIGHT,
    hand
  );
  addPlayerBoneAxisRotation(
    npc,b.rightHand,
    PLAYER_AXIS_RIGHT,
    -hand
  );

  addPlayerBoneAxisRotation(
    npc,b.leftHand,
    PLAYER_AXIS_UP,
    twist
  );
  addPlayerBoneAxisRotation(
    npc,b.rightHand,
    PLAYER_AXIS_UP,
    -twist
  );

  npc.root.updateMatrixWorld(true);
}

const SECURITY_POST_TALK_IDLE_STATE=new WeakMap();

function animateSecurityPostTalkIdle(npc){
  if(
    !npc?.ready ||
    npc.name!=="securityMan" ||
    npc.state==="talk" ||
    !NPC_CONVERSATION_FINAL_LATCH.has(npc)
  ){
    return;
  }

  const b=getBones(npc);
  const talkCfg=TALK_POSES?.securityMan;
  if(!b || !talkCfg) return;

  let state=SECURITY_POST_TALK_IDLE_STATE.get(npc);
  if(!state){
    state={
      start:performance.now(),
      phase:Math.random()*Math.PI*2
    };
    SECURITY_POST_TALK_IDLE_STATE.set(npc,state);
  }

  const t=(performance.now()-state.start)*0.001;
  const slow=Math.sin(t*1.55+state.phase);
  const slow2=Math.sin(t*1.12+state.phase+1.1);


  const leftArmX=
    talkCfg.leftArm.restX+
    slow*.007;

  const leftArmZ=
    talkCfg.leftArm.restZ+
    slow2*.005;

  const leftForeX=
    talkCfg.leftForeArm.restX+
    slow2*.006;

  const rightIdle={
    arm:{x:.80,y:-.25,z:-.36},
    fore:{x:-.10,y:-1.30,z:-0.80},
    hand:{x:.10,y:-.124,z:-.52}
  };

  const rightArmX=
    rightIdle.arm.x-
    slow*.008;

  const rightArmZ=
    rightIdle.arm.z-
    slow2*.005;

  const rightForeX=
    rightIdle.fore.x-
    slow2*.0065;

  smoothBoneTo(
    b.leftArm,
    leftArmX,
    talkCfg.leftArm.restY,
    leftArmZ,
    .075
  );

  smoothBoneTo(
    b.leftForeArm,
    leftForeX,
    talkCfg.leftForeArm.restY,
    talkCfg.leftForeArm.restZ,
    .075
  );

  smoothBoneTo(
    b.rightArm,
    rightArmX,
    rightIdle.arm.y,
    rightArmZ,
    .075
  );

  smoothBoneTo(
    b.rightForeArm,
    rightForeX,
    rightIdle.fore.y,
    rightIdle.fore.z,
    .075
  );


  const lShoulderRest=getRest(npc,b.leftShoulder);
  const rShoulderRest=getRest(npc,b.rightShoulder);

  if(b.leftShoulder && lShoulderRest){
    smoothBoneTo(
      b.leftShoulder,
      lShoulderRest.x+slow*.0025,
      lShoulderRest.y,
      lShoulderRest.z+slow2*.0018,
      .07
    );
  }

  if(b.rightShoulder && rShoulderRest){
    smoothBoneTo(
      b.rightShoulder,
      rShoulderRest.x-slow*.0025,
      rShoulderRest.y,
      rShoulderRest.z-slow2*.0018,
      .07
    );
  }

  npc.root.updateMatrixWorld(true);
}

function applySecurityTalkHeadNodLastPass(npc){
  if(
    !npc ||
    npc.name!=="securityMan" ||
    !npc.ready ||
    npc.state!=="talk"
  ){
    return;
  }

  if(
    STOREKEEPER_FINAL?.policeSummoned &&
    FINAL_SECURITY_DIALOGUE_FACING?.active
  ){
    return;
  }

  const b=getBones(npc);
  const head=b?.head;
  if(!head) return;

  const rest=getRest(npc,head);
  if(!rest) return;

  const now=performance.now();

  const nod=Math.sin(now*.0048)*.036;

  head.rotation.x=THREE.MathUtils.lerp(
    head.rotation.x,
    rest.x+nod,
    .18
  );

  npc.root.updateMatrixWorld(true);
}

function updateNPC(npc){
  if(!npc.ready) return;
  if(
    npc.name==="securityMan" &&
    SECURITY_POST_CASE_HOME_LOCK &&
    QUEST.stage==="game_complete" &&
    STOREKEEPER_FINAL.completed &&
    npc.state!=="talk"
  ){
    applySecurityCompletedHomeExact(npc);
    return;
  }
  if(
    npc.name==="toxicMan" &&
    STOREKEEPER_FINAL.policeSummoned
  ){
    return;
  }

  if(npc.name==="toxicMan" && THIEF_DISCOVERY_TURN.active){

    return;
  }

  if(
    npc.name==="toxicMan" &&
    QUEST.stage==="call_security" &&
    STOREKEEPER_FINAL.thiefDialogueDone &&
    !POLICE_RADIO.calling &&
    !STOREKEEPER_FINAL.policeSummoned
  ){

    if(typeof npc.toxicFixedRotationY==="number"){
      npc.root.rotation.y=npc.toxicFixedRotationY;
    }

    animateThiefPostDialoguePose(npc);
    return;
  }

  if(npc.name==="child"){
    ensureCasinoChildInitialSetup(npc);
  }
  if(npc.state==="talk"){
    npc.timer++;

    if(npc.name==="child"){
      animateChildNewTalk(npc);
      return;
    }

    if(npc.name==="toxicMan"){

      turnNpcTowardPlayerWithSteps(
        npc,
        THIEF_POSE_TRANSITION_SPEED.turn
      );
      animateThiefTalkPose(npc);
      updateToxicHeadFacingPlayer(npc);
    }else{

      turnNpcTowardPlayerWithSteps(npc,.12);
      animateTalk(npc);
    if(npc.name==="child"){
      applyChildTalkHandsFinalPass(npc);
    }

      if(npc.name==="securityMan"){
        applySecurityTalkHeadNodLastPass(npc);
      }
    }
    return;
  }

  if(
    npc.name==="child" &&
    CHILD_VISIT_POSE_STATE.talkPoseLatched
  ){
    animateCasinoChildPostDialoguePose(npc);
    return;
  }

  if(NPC_CONVERSATION_FINAL_LATCH.has(npc)){

    animateIdle(npc);

    if(npc.name==="securityMan"){
      animateSecurityPostTalkIdle(npc);
    }

    applyNpcConversationFinalPose(npc);
    return;
  }

  if(npc.name==="toxicMan"){
    if(typeof npc.toxicFixedRotationY==="number"){
      npc.root.rotation.y=npc.toxicFixedRotationY;
    }
  }

  animateIdle(npc);

  if(
    npc.name==="securityMan" &&
    !SECURITY_INITIAL_VISIBLE_POSE.captured &&
    QUEST.stage==="talk_police" &&
    !QUEST.dialogueActive &&
    !GLOBAL_DIALOGUE_LOCK.active &&
    npc.state!=="talk"
  ){
    captureSecurityInitialVisiblePose(npc);
  }

}
const CLEAN_CAMERA_CONFIG={
  distance:6.75,
  height:6.25,
  lookHeight:2.55,
  sideOffset:0.00,
  yawLerp:0.16,
  sharpTurnYawLerp:0.48,
  sharpTurnThreshold:THREE.MathUtils.degToRad(75),
  positionLerp:0.16,
  sharpTurnPositionLerp:0.32,
  lookLerp:0.12
};
let cleanCameraLookTarget=new THREE.Vector3();
let cleanCameraReady=false;
let cleanCameraYaw=0;
let toxicEntryCameraActive=false;
let toxicEntryCameraStartPosition=new THREE.Vector3();
const TOXIC_ENTRY_CAMERA={
  startDistance:4.350,
  endDistance:6.650,
  startHeight:4.900,
  endHeight:6.350,
  startLookHeight:2.150,
  endLookHeight:1.650,
  sideOffset:0.000,
  fov:60.00,
  startBlendDistance:1.25,
  finishBlendDistance:4.50
};
let toxicExitCameraActive=false;
let toxicExitCameraStartPosition=new THREE.Vector3();
const TOXIC_EXIT_CAMERA={
  distance:2.550,
  height:4.750,
  lookHeight:3.100,
  sideOffset:0.000,
  fov:60.00,
  returnDistance:5.000
};
function beginToxicEntryCamera(){
  if(!player?.root) return;
  toxicEntryCameraActive=true;
  toxicEntryCameraStartPosition.copy(player.root.position);
}
function getToxicEntryCameraVisual(){
  if(!player?.root){
    return null;
  }
  const walked=toxicEntryCameraActive
    ? player.root.position.distanceTo(toxicEntryCameraStartPosition)
    : TOXIC_ENTRY_CAMERA.finishBlendDistance;
  if(toxicEntryCameraActive && walked<=TOXIC_ENTRY_CAMERA.startBlendDistance){
    return {
      distance:TOXIC_ENTRY_CAMERA.startDistance,
      height:TOXIC_ENTRY_CAMERA.startHeight,
      lookHeight:TOXIC_ENTRY_CAMERA.startLookHeight
    };
  }
  const span=Math.max(
    .001,
    TOXIC_ENTRY_CAMERA.finishBlendDistance-TOXIC_ENTRY_CAMERA.startBlendDistance
  );
  const raw=toxicEntryCameraActive
    ? THREE.MathUtils.clamp(
        (walked-TOXIC_ENTRY_CAMERA.startBlendDistance)/span,
        0,
        1
      )
    : 1;
  const smooth=raw*raw*(3-2*raw);
  if(toxicEntryCameraActive && raw>=1){
    toxicEntryCameraActive=false;
  }
  return {
    distance:THREE.MathUtils.lerp(
      TOXIC_ENTRY_CAMERA.startDistance,
      TOXIC_ENTRY_CAMERA.endDistance,
      smooth
    ),
    height:THREE.MathUtils.lerp(
      TOXIC_ENTRY_CAMERA.startHeight,
      TOXIC_ENTRY_CAMERA.endHeight,
      smooth
    ),
    lookHeight:THREE.MathUtils.lerp(
      TOXIC_ENTRY_CAMERA.startLookHeight,
      TOXIC_ENTRY_CAMERA.endLookHeight,
      smooth
    )
  };
}
function beginToxicExitCamera(){
  if(!player?.root) return;
  toxicExitCameraActive=true;
  toxicExitCameraStartPosition.copy(player.root.position);
}
function updateToxicExitCamera(){
  if(!toxicExitCameraActive || !player?.root) return false;
  const walked=player.root.position.distanceTo(toxicExitCameraStartPosition);
  const t=THREE.MathUtils.clamp(walked/TOXIC_EXIT_CAMERA.returnDistance,0,1);
  const smoothT=t*t*(3-2*t);
  const normal=getLiveCameraTuning();
  const finalDistance=Number(normal.distance)*Number(GAME_SETTINGS.cameraZoom);
  const finalHeight=Number(normal.height)+Number(GAME_SETTINGS.cameraHeightOffset);
  const finalLookHeight=Number(normal.lookHeight)+Number(GAME_SETTINGS.cameraLookOffset);
  const finalSideOffset=Number(normal.sideOffset);
  const finalFov=Number(GAME_SETTINGS.cameraFov);
  const distance=THREE.MathUtils.lerp(
    TOXIC_EXIT_CAMERA.distance,
    finalDistance,
    smoothT
  );
  const height=THREE.MathUtils.lerp(
    TOXIC_EXIT_CAMERA.height,
    finalHeight,
    smoothT
  );
  const lookHeight=THREE.MathUtils.lerp(
    TOXIC_EXIT_CAMERA.lookHeight,
    finalLookHeight,
    smoothT
  );
  const sideOffset=THREE.MathUtils.lerp(
    TOXIC_EXIT_CAMERA.sideOffset,
    finalSideOffset,
    smoothT
  );
  const fov=THREE.MathUtils.lerp(
    TOXIC_EXIT_CAMERA.fov,
    finalFov,
    smoothT
  );
  camera.fov=fov;
  camera.updateProjectionMatrix();
  const targetYaw=player.root.rotation.y;
  if(!cleanCameraReady){
    cleanCameraYaw=targetYaw;
  }
  const yawDelta=Math.atan2(
    Math.sin(targetYaw-cleanCameraYaw),
    Math.cos(targetYaw-cleanCameraYaw)
  );
  const sharpTurn=Math.abs(yawDelta)>CLEAN_CAMERA_CONFIG.sharpTurnThreshold;
  const yawAmount=sharpTurn
    ? CLEAN_CAMERA_CONFIG.sharpTurnYawLerp
    : CLEAN_CAMERA_CONFIG.yawLerp;
  cleanCameraYaw=lerpAngle(cleanCameraYaw,targetYaw,yawAmount);
  const forward=new THREE.Vector3(
    Math.sin(cleanCameraYaw),0,Math.cos(cleanCameraYaw)
  ).normalize();
  const right=new THREE.Vector3(
    Math.cos(cleanCameraYaw),0,-Math.sin(cleanCameraYaw)
  ).normalize();
  const desiredCameraPos=player.root.position.clone()
    .addScaledVector(forward,-distance)
    .addScaledVector(right,sideOffset)
    .add(new THREE.Vector3(0,height,0));
  const desiredLookTarget=player.root.position.clone();
  desiredLookTarget.y+=lookHeight;
  if(!cleanCameraReady){
    camera.position.copy(desiredCameraPos);
    cleanCameraLookTarget.copy(desiredLookTarget);
    cleanCameraReady=true;
  }else{
    camera.position.lerp(
      desiredCameraPos,
      sharpTurn
        ? CLEAN_CAMERA_CONFIG.sharpTurnPositionLerp
        : CLEAN_CAMERA_CONFIG.positionLerp
    );
    cleanCameraLookTarget.lerp(
      desiredLookTarget,
      CLEAN_CAMERA_CONFIG.lookLerp
    );
  }
  camera.lookAt(cleanCameraLookTarget);
  if(t>=1){
    toxicExitCameraActive=false;
  }
  return true;
}
const CASINO_CAMERA_WALL_AVOIDANCE={
  enabled:true,
  minDistance:1.05,
  safetyMargin:.54,
  currentDistance:null,
  targetDistance:null,


  approachLerp:.27,
  returnLerp:.085,


  clawEnabled:true,
  clawMinDistance:3.40,
  clawSafetyMargin:.48,
  clawApproachLerp:.24,
  clawReturnLerp:.085,
  clawExtraRange:.25,


  cacheRefreshMs:1400,
  cacheBuiltAt:0,

  raycaster:new THREE.Raycaster(),
  origin:new THREE.Vector3(),
  direction:new THREE.Vector3()
};
let CASINO_CAMERA_STRUCTURAL_CACHE=null;

function isCasinoClawCameraObject(obj){
  if(!obj) return false;

  let n=obj;
  while(n){
    if(
      (typeof CASINO_CLAW!=="undefined" && CASINO_CLAW?.root && n===CASINO_CLAW.root) ||
      String(n.name||"").toLowerCase().includes("claw")
    ){
      return true;
    }
    n=n.parent;
  }

  return false;
}

function getCasinoCameraStructuralMeshes(){
  const cfg=CASINO_CAMERA_WALL_AVOIDANCE;
  const now=performance.now();

  if(
    CASINO_CAMERA_STRUCTURAL_CACHE &&
    now-cfg.cacheBuiltAt<cfg.cacheRefreshMs
  ){
    return CASINO_CAMERA_STRUCTURAL_CACHE;
  }

  const meshes=[];
  const seen=new Set();

  const pushMesh=o=>{
    if(!o?.visible || !o.isMesh || seen.has(o)) return;
    seen.add(o);
    meshes.push(o);
  };

  scene.traverse(o=>{
    if(!o?.visible || !o.isMesh) return;

    const n=String(o.name||"").toLowerCase();


    const structural=
      n.includes("wall") ||
      n.includes("facade") ||
      n.includes("façade") ||
      n.includes("storefront") ||
      n.includes("shopfront") ||
      n.includes("shop_front") ||
      n.includes("store_front") ||
      n.includes("buildingfront") ||
      n.includes("building_front") ||
      n.includes("exteriorwall") ||
      n.includes("exterior_wall") ||
      n.includes("partition") ||
      n.includes("interior") ||
      n.includes("column") ||
      n.includes("pillar") ||
      n.includes("casino") ||
      n.includes("claw");

    if(structural) pushMesh(o);
  });


  if(typeof CASINO_CLAW!=="undefined" && CASINO_CLAW?.root){
    CASINO_CLAW.root.traverse(pushMesh);
  }

  CASINO_CAMERA_STRUCTURAL_CACHE=meshes;
  cfg.cacheBuiltAt=now;
  return meshes;
}
function resolveCasinoCameraWallDistance(
  lookTarget,
  desiredCameraPos,
  desiredDistance
){
  const cfg=CASINO_CAMERA_WALL_AVOIDANCE;
  if(!cfg.enabled){
    cfg.currentDistance=desiredDistance;
    cfg.targetDistance=desiredDistance;
    return desiredDistance;
  }
  const origin=cfg.origin.copy(lookTarget);
  const direction=cfg.direction
    .copy(desiredCameraPos)
    .sub(origin);
  const fullLength=direction.length();
  if(fullLength<.001) return desiredDistance;
  direction.multiplyScalar(1/fullLength);
  cfg.raycaster.set(origin,direction);
  cfg.raycaster.near=.05;
  cfg.raycaster.far=fullLength+Math.max(.25,cfg.clawExtraRange||0);

  const hits=cfg.raycaster.intersectObjects(
    getCasinoCameraStructuralMeshes(),
    false
  );

  let allowed=desiredDistance;
  let activeMinDistance=cfg.minDistance;
  let activeSafetyMargin=cfg.safetyMargin;
  let activeApproachLerp=cfg.approachLerp;
  let activeReturnLerp=cfg.returnLerp;

  if(hits.length){
    let hit=hits[0];
    const clawHit=cfg.clawEnabled && isCasinoClawCameraObject(hit.object);

    if(clawHit){
      activeMinDistance=cfg.clawMinDistance;
      activeSafetyMargin=cfg.clawSafetyMargin;
      activeApproachLerp=cfg.clawApproachLerp;
      activeReturnLerp=cfg.clawReturnLerp;
    }

    allowed=Math.max(
      activeMinDistance,
      Math.min(
        desiredDistance,
        hit.distance-activeSafetyMargin
      )
    );
  }

  cfg.targetDistance=allowed;

  if(!Number.isFinite(cfg.currentDistance)){
    cfg.currentDistance=allowed;
  }

  const amount=
    allowed<cfg.currentDistance
      ? activeApproachLerp
      : activeReturnLerp;

  cfg.currentDistance=THREE.MathUtils.lerp(
    cfg.currentDistance,
    allowed,
    amount
  );
  return cfg.currentDistance;
}
function updateCleanPlayerCamera(){
  updateCasinoFacadeBackdropVisibility();
  if(TELESCOPE_MODE.active){
    updateTelescopeView(frameDt||.016);
    return;
  }
  if(!player || !player.root) return;
  if(updateToxicExitCamera()) return;
  const targetYaw=player.root.rotation.y;
  if(!cleanCameraReady){
    cleanCameraYaw=targetYaw;
  }
  const yawDelta=Math.atan2(
    Math.sin(targetYaw-cleanCameraYaw),
    Math.cos(targetYaw-cleanCameraYaw)
  );
  const sharpTurn=Math.abs(yawDelta)>CLEAN_CAMERA_CONFIG.sharpTurnThreshold;
  const yawAmountBase=sharpTurn
    ? CLEAN_CAMERA_CONFIG.sharpTurnYawLerp
    : CLEAN_CAMERA_CONFIG.yawLerp;
  const yawAmount=yawAmountBase;
  cleanCameraYaw=lerpAngle(cleanCameraYaw,targetYaw,yawAmount);
  const forward=new THREE.Vector3(
    Math.sin(cleanCameraYaw),
    0,
    Math.cos(cleanCameraYaw)
  ).normalize();
  const right=new THREE.Vector3(
    Math.cos(cleanCameraYaw),
    0,
    -Math.sin(cleanCameraYaw)
  ).normalize();
  const stationCameraBlend=0;
  const cabinCameraBlend=0;
  const liveCamera=getLiveCameraTuning();
  let normalCameraDistance=Number(liveCamera.distance);
  let normalCameraHeight=Number(liveCamera.height);
  let normalLookHeight=Number(liveCamera.lookHeight);
  if(activeWorldZone==="leftRoom"){
    const toxicEntryVisual=getToxicEntryCameraVisual();

    if(toxicEntryVisual){
      normalCameraDistance=toxicEntryVisual.distance;
      normalCameraHeight=toxicEntryVisual.height;
      normalLookHeight=toxicEntryVisual.lookHeight;
    }

    if(CASINO_CAMERA_LIVE_OVERRIDE.enabled){
      normalCameraDistance=CASINO_CAMERA_LIVE_OVERRIDE.distance;
      normalCameraHeight=CASINO_CAMERA_LIVE_OVERRIDE.height;
      normalLookHeight=CASINO_CAMERA_LIVE_OVERRIDE.lookHeight;
    }
  }
  normalCameraDistance*=GAME_SETTINGS.cameraZoom;
  normalCameraHeight+=GAME_SETTINGS.cameraHeightOffset;
  normalLookHeight+=GAME_SETTINGS.cameraLookOffset;
  const requestedCameraFov=
    activeWorldZone==="leftRoom" &&
    CASINO_CAMERA_LIVE_OVERRIDE.enabled
      ? Number(CASINO_CAMERA_LIVE_OVERRIDE.fov)
      : Number(GAME_SETTINGS.cameraFov);

  if(camera.fov!==requestedCameraFov){
    camera.fov=requestedCameraFov;
    camera.updateProjectionMatrix();
  }
  const rampCameraDistance=THREE.MathUtils.lerp(normalCameraDistance,5.25,stationCameraBlend);
  const rampCameraHeight=THREE.MathUtils.lerp(normalCameraHeight,3.65,stationCameraBlend);
  const rampLookHeight=THREE.MathUtils.lerp(normalLookHeight,1.85,stationCameraBlend);
  const cameraDistance=THREE.MathUtils.lerp(rampCameraDistance,3.15,cabinCameraBlend);
  const cameraHeight=THREE.MathUtils.lerp(rampCameraHeight,4.15,cabinCameraBlend);
  const cameraLookHeight=THREE.MathUtils.lerp(rampLookHeight,2.05,cabinCameraBlend);
  const desiredLookTarget=player.root.position.clone();
  desiredLookTarget.y+=cameraLookHeight;
  const activeSideOffset=
    activeWorldZone==="leftRoom" &&
    CASINO_CAMERA_LIVE_OVERRIDE.enabled
      ? CASINO_CAMERA_LIVE_OVERRIDE.sideOffset
      : liveCamera.sideOffset;

  const cameraSideOffset=
    THREE.MathUtils.lerp(
      activeSideOffset,
      .18,
      cabinCameraBlend
    );
  const rawDesiredCameraPos=player.root.position.clone()
    .addScaledVector(forward,-cameraDistance)
    .addScaledVector(right,cameraSideOffset)
    .add(new THREE.Vector3(0,cameraHeight,0));
  const safeCameraDistance=resolveCasinoCameraWallDistance(
    desiredLookTarget,
    rawDesiredCameraPos,
    cameraDistance
  );
  const distanceRatio=
    cameraDistance>.001
      ? THREE.MathUtils.clamp(
          safeCameraDistance/cameraDistance,
          0,
          1
        )
      : 1;
  const desiredCameraPos=player.root.position.clone()
    .addScaledVector(forward,-safeCameraDistance)
    .addScaledVector(
      right,
      cameraSideOffset*distanceRatio
    )
    .add(
      new THREE.Vector3(
        0,
        THREE.MathUtils.lerp(
          Math.max(2.15,cameraHeight*.72),
          cameraHeight,
          distanceRatio
        ),
        0
      )
    );
  if(!cleanCameraReady){
    camera.position.copy(desiredCameraPos);
    cleanCameraLookTarget.copy(desiredLookTarget);
    cleanCameraReady=true;
  }else{
    const positionAmount=sharpTurn
      ? CLEAN_CAMERA_CONFIG.sharpTurnPositionLerp
      : CLEAN_CAMERA_CONFIG.positionLerp;
    camera.position.lerp(desiredCameraPos,positionAmount);
    cleanCameraLookTarget.lerp(
      desiredLookTarget,
      CLEAN_CAMERA_CONFIG.lookLerp
    );
  }
  camera.lookAt(cleanCameraLookTarget);
}
function isInsideMainShopsPosition(pos){
  return pos.z < SCENE_ENV_CONFIG.frontZ + 1.5 && Math.abs(pos.x) < 68;
}
function updateFarDecorVisibility(){
  if(!player?.root) return;
  if(!MAX_PERF.farDecor.length) maxPerfCacheFarDecor();
  const px=player.root.position.x,pz=player.root.position.z;
  const maxSq=420*420;
  for(const obj of MAX_PERF.farDecor){
    const dx=obj.position.x-px,dz=obj.position.z-pz;
    obj.visible=(dx*dx+dz*dz)<maxSq;
  }
}
function removeMusicBoyCompletely(){
  if(typeof npcs==="undefined") return;
  const music=npcs.find(n=>n?.name==="boyListeningMusic");
  if(!music) return;
  if(music.root){
    music.root.visible=false;
    if(music.root.parent) music.root.parent.remove(music.root);
  }
  music.ready=false;
  music.state="idle";
}
function freezePerformanceStaticWorld(){
  const staticNames=[
    "merged_static_concrete_sidewalks",
    "merged_static_grass_surfaces",
    "garden_boundary_fence_side_only",
    "static_gate_barricades_curve",
    "real_100m_barricades",
    "garden_fence_tree_backdrop",
    "distant_mountains_glb"
  ];
  for(const name of staticNames){
    const root=scene.getObjectByName(name);
    if(root) maxPerfFreeze(root);
  }
  scene.traverse(obj=>{
    if(!obj?.isMesh || obj.isSkinnedMesh || obj.isInstancedMesh) return;
    const n=String(obj.name||"").toLowerCase();
    if(
      n.includes("sidewalk") ||
      n.includes("road_outer") ||
      n.includes("road_lane") ||
      n.includes("curb_clean")
    ){
      obj.updateMatrix();
      obj.matrixAutoUpdate=false;
      obj.castShadow=false;
      obj.frustumCulled=true;
    }
  });
}
function updatePerformanceVisibility(){
  updateFarDecorVisibility();

  if(typeof npcs!=='undefined'){
    for(const npc of npcs){
      const root=npc?.root;
      if(!root) continue;
      const pos=root.position;
      if(!isInsideMainShopsPosition(pos)){
        root.visible=true;
        continue;
      }
      if(activeWorldZone==='leftRoom') root.visible=pos.x<0;
      else if(activeWorldZone==='rightRoom') root.visible=pos.x>=0;
      else if(activeWorldZone==='thirdRoom') root.visible=true;
      else root.visible=false;
    }
  }
}
refreshPerformanceLightCache(scene,PERF_RUNTIME,FIXED_LIGHT_POOL);
updateFixedLightPool(player,FIXED_LIGHT_POOL);
function enforceNoToxicManInCasino(){
  const toxic=globalThis.npcs?.find?.(n=>n?.name==="toxicMan");
  if(!toxic?.root) return;
  if(activeWorldZone==="leftRoom"){
    toxic.root.visible=false;
  }
}
let DIALOGUE_E_LOCK=false;
window.addEventListener("keydown",(ev)=>{
  const isE=
    ev.code==="KeyE" ||
    String(ev.key||"").toLowerCase()==="e";
  if(!isE) return;
  if(!QUEST.dialogueActive && !GLOBAL_DIALOGUE_LOCK.active) return;
  ev.preventDefault();
  ev.stopPropagation();
  if(ev.repeat || DIALOGUE_E_LOCK) return;
  DIALOGUE_E_LOCK=true;
  if(QUEST.dialogueActive){
    questAdvanceDialogue();
  }else if(GLOBAL_DIALOGUE_LOCK.active){
    endGenericNPCConversation();
  }
},true);
window.addEventListener("keyup",(ev)=>{
  const isE=
    ev.code==="KeyE" ||
    String(ev.key||"").toLowerCase()==="e";
  if(isE){
    DIALOGUE_E_LOCK=false;
  }
},true);
const GAME_FPS_LIMIT=30;
const GAME_FRAME_INTERVAL_MS=1000/GAME_FPS_LIMIT;
let GAME_LAST_FRAME_GATE=0;
let PLAYER_PERF_SAMPLE={
  frames:0,
  start:performance.now()
};
function samplePlayerPerformance(){
  PLAYER_PERF_SAMPLE.frames++;
  const now=performance.now();
  const elapsed=now-PLAYER_PERF_SAMPLE.start;
  if(elapsed>=5000){
    PLAYER_PERF_SAMPLE.frames=0;
    PLAYER_PERF_SAMPLE.start=now;
  }
}

addEventListener("DOMContentLoaded",()=>{
  document.getElementById("handTargetToPlayer")?.addEventListener("click",()=>{
    window.__HAND_TARGET_TO_PLAYER__?.();
  });
});

function animate(rafNow){
  requestAnimationFrame(animate);
  const now=Number.isFinite(rafNow)
    ? rafNow
    : performance.now();
  if(!GAME_LAST_FRAME_GATE){
    GAME_LAST_FRAME_GATE=now-GAME_FRAME_INTERVAL_MS;
  }
  const elapsed=now-GAME_LAST_FRAME_GATE;
  if(elapsed<GAME_FRAME_INTERVAL_MS){
    return;
  }
  GAME_LAST_FRAME_GATE=
    now-(elapsed%GAME_FRAME_INTERVAL_MS);
  const dt=Math.min(Math.max((now-(PERF_RUNTIME.lastFrame||now))/1000,0),.05);
  PERF_RUNTIME.lastFrame=now;
  frameDt=dt;
  MAX_PERF.interaction+=dt;
  MAX_PERF.fx+=dt;
  MAX_PERF.water+=dt;
  MAX_PERF.cars+=dt;
  MAX_PERF.girl+=dt;
  MAX_PERF.collision+=dt;
  MAX_PERF.visibility+=dt;
  MAX_PERF.npc+=dt;
  MAX_PERF.lights+=dt;
  MAX_PERF.questPresence+=dt;
  MAX_PERF.editorUi+=dt;
  FIXED_LIGHT_POOL.updateAccumulator+=dt;
  PERF_RUNTIME.minimapAccumulator+=dt;
  PERF_RUNTIME.editorAccumulator+=dt;
  PERF_RUNTIME.tikiAnimAccumulator+=dt;
  updatePlayer();
  updateJukeboxInteraction();
  updateTelescopeInteractionPrompt();
  showPoliceRadioPrompt();
  if(TELESCOPE_MODE?.active) telescopeForceMoonInvisible();
  updateThiefDiscoveryTurn(dt);
  if(!GAME_START_RETURN.captured){
    captureGameStartReturnPoint();
  }
  updateSlidingDoors();
  updateDoorSceneTransitions();
  if(activeWorldZone==="leftRoom"){
    CASINO_RECEPTIONIST_CONTROLLER.update();
    CASINO_BOY_CONTROLLER.update(frameDt||0.016);
    updateCasinoClawMachine();
    enforceNoToxicManInCasino();
  }
  if(MAX_PERF.questPresence>=MAX_PERF.questPresenceStep){
    MAX_PERF.questPresence=0;
    updateStorekeeperQuestPresence();
    updateWalletDiscoveryEvent();
    updateStorekeeperDiscoveryEvent();
  }
  if(MAX_PERF.editorUi>=MAX_PERF.editorUiStep){
    MAX_PERF.editorUi=0;
  }
  if(MAX_PERF.cars>=MAX_PERF.carsStep){
    const s=MAX_PERF.cars; MAX_PERF.cars=0;
    updateStreetCar();
}
  if(MAX_PERF.girl>=MAX_PERF.girlStep){
    const s=MAX_PERF.girl; MAX_PERF.girl=0;
  }
  if(MAX_PERF.collision>=MAX_PERF.collisionStep){
    const s=MAX_PERF.collision;
    MAX_PERF.collision=0;
    lcUpdateDynamicCars(s);
    if(COLLISION_DEBUG.enabled){
      updateCollisionDebugPlayer();
      updateCollisionDebugDynamic();
    }
  }
  if(MAX_PERF.water>=MAX_PERF.waterStep){
    MAX_PERF.water=0;
}
  if(MAX_PERF.fx>=MAX_PERF.fxStep){
    MAX_PERF.fx=0;
    updateCollectibleSparkles();
    gardenBuild("updateGardenFountainWater");
}
  if(MAX_PERF.interaction>=MAX_PERF.interactionStep){
    MAX_PERF.interaction=0;
    updateInteraction();
    updateInventoryToggle();
  }
  if(MAX_PERF.npc>=MAX_PERF.npcStep){
    MAX_PERF.npc=0;
    NPC_RELEVANCE_TICK++;
    updateSecurityIdleFacing();
    for(const npc of npcs){
      if(npc?.root?.visible===false) continue;
      if(!shouldUpdateNPCByDistance(npc)) continue;
      updateNPC(npc);
    }
  }
  if(PERF_RUNTIME.tikiAnimAccumulator>=.05){
    const s=PERF_RUNTIME.tikiAnimAccumulator;
    PERF_RUNTIME.tikiAnimAccumulator=0;
  }
  if(MAX_PERF.visibility>=MAX_PERF.visibilityStep){
    MAX_PERF.visibility=0;
    updatePerformanceVisibility();
    optimizeFarWorldProps();
    if(typeof updateTikiVisibilityCulling==="function"){
      updateTikiVisibilityCulling();
    }
  }
  if(MAX_PERF.lights>=MAX_PERF.lightsStep){
    MAX_PERF.lights=0;
    refreshPerformanceLightCache(scene,PERF_RUNTIME,FIXED_LIGHT_POOL);

    applyPointLightTuning();
  }
  if(FIXED_LIGHT_POOL.updateAccumulator>=FIXED_LIGHT_POOL.updateStep){
    FIXED_LIGHT_POOL.updateAccumulator=0;
    updateFixedLightPool(player,FIXED_LIGHT_POOL);
  }
  if(PERF_RUNTIME.minimapAccumulator>=.125){
    PERF_RUNTIME.minimapAccumulator=0;
    if(typeof drawMinimap==="function") drawMinimap();
  }
  if(PERF_RUNTIME.editorAccumulator>=.20){
    PERF_RUNTIME.editorAccumulator=0;
    if(typeof refreshLiveCameraEditor==="function") refreshLiveCameraEditor();
  }
  if(typeof updateTaskBarrierSmoothTurn==="function") updateTaskBarrierSmoothTurn(dt);
  if(typeof updateCleanPlayerCamera==="function"){
    updateCleanPlayerCamera();
  }
  if(MAX_PERF.interaction===0 && ui){
    }
  updatePlayerGardenBlobShadow(dt);
  enforceFinalThiefVisible();
  updateFinalSecurityDialogueFacing();
  updateThiefHandcuffEditor();
  updateSecurityPoseEditor();
  updateSecurityLowerBodyEditor();
renderer.render(scene,camera);
  samplePlayerPerformance();
}
setTimeout(()=>{
  refreshPerformanceLightCache(scene,PERF_RUNTIME,FIXED_LIGHT_POOL);
  updateFixedLightPool(player,FIXED_LIGHT_POOL);
  updatePerformanceVisibility();
  drawMinimap();
},250);
setTimeout(()=>{

  applyPointLightTuning();
  updateFixedLightPool(player,FIXED_LIGHT_POOL);
},2200);
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

moduleInitializationComplete=true;
if(loadingCompletedBeforeModuleInit){
  loadingCompletedBeforeModuleInit=false;
  requestAnimationFrame(()=>{
    finishSceneLoading();
  });
}

applyPointLightTuning();

window.addEventListener("load",()=>{

  setTimeout(()=>{
    rebuildCasinoEditableColliders();
      },1000);
});

const CASINO_CAMERA_LIVE_OVERRIDE={
  enabled:true,
  distance:5.250,
  height:5.550,
  lookHeight:2.350,
  sideOffset:0.000,
  fov:60.00
};

function setCasinoFloorTint(hex){
  const color=new THREE.Color(hex);

  casinoFloorMat.color.copy(color);
  casinoFloorMat.needsUpdate=true;

  scene.traverse(obj=>{
    if(!obj?.isMesh || !obj.material) return;

    const mats=Array.isArray(obj.material)
      ? obj.material
      : [obj.material];

    for(const mat of mats){
      if(!mat) continue;

      if(
        mat.map===casinoFloorTexture ||
        obj.name==="casino_blue_threshold" ||
        String(obj.name||"").includes("casino_floor")
      ){
        if(mat.color) mat.color.copy(color);
        mat.needsUpdate=true;
      }
    }
  });
}

window.addEventListener("load",()=>{ setCasinoFloorTint("#28496C"); });
