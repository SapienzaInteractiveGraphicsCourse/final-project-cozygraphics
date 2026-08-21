import * as THREE from "three";
import {MAP_CONFIG} from "../config/map.config.js";

export function drawMinimap(deps){
  const {
    minimapCtx,
    minimap,
    player,
    camera,
    uRoadCurve,
    crosswalkOffsets,
    CROSSWALK,
    GARDEN_TREE_DECOR,
    GARDEN_DESIGN_AXIS,
    GARDEN_FEATURES,
    GAME_SETTINGS,
    QUEST,
    questGetPolice,
    COLLECTIBLES,
    STOREKEEPER_FINAL,
    SCENE_ENV_CONFIG,
    currentZoneLabel,
    getPlayerMapZone,
    npcs
  }=deps;
  if(!minimapCtx || !minimap || !player?.root) return;

  const ctx=minimapCtx;
  const w=minimap.width;
  const h=minimap.height;
  const cx=w*.5;
  const cy=h*MAP_CONFIG.centerYRatio;

  const playerPos=player.root.position;

  const radarForward=new THREE.Vector3();
  camera.getWorldDirection(radarForward);
  radarForward.y=0;
  if(radarForward.lengthSq()<.000001) radarForward.set(0,0,-1);
  else radarForward.normalize();

  const radarRight=new THREE.Vector3()
    .crossVectors(radarForward,new THREE.Vector3(0,1,0))
    .normalize();

  const viewWidth=MAP_CONFIG.viewWidth;
  const pixelsPerMeter=w/viewWidth;

  const COL={
    ...MAP_CONFIG.colors,
    bg:"#0b0f14",
    fence:"#a29374",
    crosswalk:"#e5e7e7",
    poi:"#dce9ff",
    locked:"#9bbcff"
  };


  function worldToRadar(x,z){
    const dx=x-playerPos.x;
    const dz=z-playerPos.z;

    const localRight=dx*radarRight.x+dz*radarRight.z;
    const localForward=dx*radarForward.x+dz*radarForward.z;

    return {
      x:cx+localRight*pixelsPerMeter,
      y:cy-localForward*pixelsPerMeter
    };
  }

  function polygon(points,fill,stroke=null,lineWidth=1){
    if(!points?.length) return;
    ctx.beginPath();
    const a=worldToRadar(points[0][0],points[0][1]);
    ctx.moveTo(a.x,a.y);
    for(let i=1;i<points.length;i++){
      const p=worldToRadar(points[i][0],points[i][1]);
      ctx.lineTo(p.x,p.y);
    }
    ctx.closePath();
    if(fill){
      ctx.fillStyle=fill;
      ctx.fill();
    }
    if(stroke){
      ctx.strokeStyle=stroke;
      ctx.lineWidth=lineWidth;
      ctx.stroke();
    }
  }

  function rotatedRect(cx0,cz0,width,depth,yaw,fill,stroke=null,lineWidth=1){
    const hw=width*.5, hd=depth*.5;
    const c=Math.cos(yaw||0), sn=Math.sin(yaw||0);
    const pts=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([lx,lz])=>[
      cx0+lx*c+lz*sn,
      cz0-lx*sn+lz*c
    ]);
    polygon(pts,fill,stroke,lineWidth);
  }

  function drawWorldLabel(x,z,text,alpha=.82){
    const p=worldToRadar(x,z);
    if(p.x<-30||p.x>w+30||p.y<-20||p.y>h+20) return;
    ctx.save();
    ctx.font="800 12px Arial";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillStyle=`rgba(238,244,250,${alpha})`;
    ctx.shadowColor="rgba(0,0,0,.9)";
    ctx.shadowBlur=5;
    ctx.fillText(text,p.x,p.y);
    ctx.restore();
  }

  ctx.clearRect(0,0,w,h);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0,0,w,h,38);
  ctx.clip();

  ctx.fillStyle=COL.ground;
  ctx.fillRect(0,0,w,h);

  polygon([[-140,104],[140,104],[140,210],[-140,210]],COL.sea);
  polygon([[-140,86],[140,86],[140,104],[-140,104]],COL.wet);
  polygon([[-140,54],[140,54],[140,86],[-140,86]],COL.sand);

  ctx.globalAlpha=.12;
  ctx.strokeStyle="#ffffff";
  ctx.lineWidth=1;
  for(let gy=-40;gy<190;gy+=8){
    const a=worldToRadar(-140,gy);
    const b=worldToRadar(140,gy);
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }
  ctx.globalAlpha=1;

  function strokeRoad(offset,width,color){
    ctx.beginPath();
    for(let i=0;i<=220;i++){
      const t=i/220;
      const p=uRoadCurve.getPointAt(t);
      const tangent=uRoadCurve.getTangentAt(t).normalize();
      const nx=-tangent.z;
      const nz=tangent.x;
      const q=worldToRadar(p.x+nx*offset,p.z+nz*offset);
      if(i===0) ctx.moveTo(q.x,q.y);
      else ctx.lineTo(q.x,q.y);
    }
    ctx.strokeStyle=color;
    ctx.lineWidth=width*pixelsPerMeter;
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.stroke();
  }

  strokeRoad(0,29,COL.roadEdge);
  strokeRoad(0,22,COL.road);
  strokeRoad(-15,7,COL.sidewalk);
  strokeRoad(17.5,13,COL.sidewalk);

  ctx.beginPath();
  for(let i=0;i<=220;i++){
    const p=uRoadCurve.getPointAt(i/220);
    const q=worldToRadar(p.x,p.z);
    if(i===0) ctx.moveTo(q.x,q.y);
    else ctx.lineTo(q.x,q.y);
  }
  ctx.strokeStyle=COL.lane;
  ctx.lineWidth=1.5;
  ctx.setLineDash([8,9]);
  ctx.globalAlpha=.72;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha=1;

  polygon([[-37.75,-35],[-6.25,-35],[-6.25,3],[-37.75,3]],COL.building,COL.buildingEdge,1.5);
  polygon([[6.25,-35],[37.75,-35],[37.75,3],[6.25,3]],COL.building,COL.buildingEdge,1.5);

  polygon([[-34,-31],[-10,-31],[-10,-4],[-34,-4]],"#303740",null);
  polygon([[10,-31],[34,-31],[34,-4],[10,-4]],"#303740",null);

  for(const off of crosswalkOffsets){
    const z=CROSSWALK.centerZ+off;
    polygon([
      [CROSSWALK.centerX-CROSSWALK.stripeLength*.5,z-CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX+CROSSWALK.stripeLength*.5,z-CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX+CROSSWALK.stripeLength*.5,z+CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX-CROSSWALK.stripeLength*.5,z+CROSSWALK.stripeDepth*.5]
    ],"rgba(232,235,236,.80)");
  }

  polygon([
    [-88,164],
    [88,164],
    [88,218],
    [-88,218]
  ],"rgba(36,77,49,.56)","rgba(71,115,84,.50)",1);

  polygon([
    [-88,58],
    [-52,58],
    [-52,190],
    [-88,190]
  ],"rgba(36,77,49,.44)",null);

  polygon([
    [54,58],
    [88,58],
    [88,190],
    [54,190]
  ],"rgba(36,77,49,.44)",null);

  if(
    typeof GARDEN_TREE_DECOR!=="undefined" &&
    Array.isArray(GARDEN_TREE_DECOR.treeCollisionInstances) &&
    GARDEN_TREE_DECOR.treeCollisionInstances.length
  ){
    ctx.save();

    const treeGroupMatrix=
      GARDEN_TREE_DECOR.group?.matrixWorld ||
      new THREE.Matrix4();

    GARDEN_TREE_DECOR.group?.updateMatrixWorld(true);

    const wm=new THREE.Matrix4();
    const wp=new THREE.Vector3();

    ctx.fillStyle=COL.forest;
    ctx.strokeStyle=COL.forestEdge;
    ctx.lineWidth=.65;

    for(const tree of GARDEN_TREE_DECOR.treeCollisionInstances){
      if(!tree?.matrix) continue;

      wm.copy(treeGroupMatrix).multiply(tree.matrix);
      wp.setFromMatrixPosition(wm);

      const q=worldToRadar(wp.x,wp.z);

      if(q.x<-12 || q.x>w+12 || q.y<-12 || q.y>h+12) continue;

      const crownRadius=Math.max(
        2.0,
        Math.min(4.2,(tree.radius||.35)*4.2)
      );

      ctx.beginPath();
      ctx.arc(q.x,q.y,crownRadius,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  const gardenAxisX=
    (typeof GARDEN_DESIGN_AXIS!=="undefined" &&
     Number.isFinite(GARDEN_DESIGN_AXIS.x))
      ? GARDEN_DESIGN_AXIS.x
      : 0.600;

  const gardenWidth=MAP_CONFIG.garden.width;
  const gardenHalfWidth=gardenWidth*.5;
  const gardenFrontZ=MAP_CONFIG.garden.frontZ;
  const gardenBackZ=MAP_CONFIG.garden.backZ;

  polygon([
    [gardenAxisX-gardenHalfWidth,gardenFrontZ],
    [gardenAxisX+gardenHalfWidth,gardenFrontZ],
    [gardenAxisX+gardenHalfWidth,gardenBackZ],
    [gardenAxisX-gardenHalfWidth,gardenBackZ]
  ],COL.garden,COL.gardenEdge,1.7);

  const flowerWidth=MAP_CONFIG.garden.flowerWidth;
  const flowerDepth=MAP_CONFIG.garden.flowerDepth;
  const flowerZ=MAP_CONFIG.garden.flowerZ;
  const flowerOffsetX=MAP_CONFIG.garden.flowerOffsetX;

  rotatedRect(
    gardenAxisX-flowerOffsetX,
    flowerZ,
    flowerWidth,
    flowerDepth,
    0,
    "#3f7047",
    null,
    0
  );

  rotatedRect(
    gardenAxisX+flowerOffsetX,
    flowerZ,
    flowerWidth,
    flowerDepth,
    0,
    "#3f7047",
    null,
    0
  );

  const holeZMin=flowerZ-flowerDepth*.5;
  const holeZMax=flowerZ+flowerDepth*.5;

  const leftHoleMin=
    gardenAxisX-flowerOffsetX-flowerWidth*.5;
  const leftHoleMax=
    gardenAxisX-flowerOffsetX+flowerWidth*.5;

  const rightHoleMin=
    gardenAxisX+flowerOffsetX-flowerWidth*.5;
  const rightHoleMax=
    gardenAxisX+flowerOffsetX+flowerWidth*.5;

  rotatedRect(
    gardenAxisX,
    (gardenFrontZ+holeZMin)*.5,
    gardenWidth,
    holeZMin-gardenFrontZ,
    0,
    COL.gardenPath,
    "#bcae91",
    1
  );

  rotatedRect(
    gardenAxisX,
    (holeZMax+gardenBackZ)*.5,
    gardenWidth,
    gardenBackZ-holeZMax,
    0,
    COL.gardenPath,
    "#bcae91",
    1
  );

  rotatedRect(
    (gardenAxisX-gardenHalfWidth+leftHoleMin)*.5,
    flowerZ,
    leftHoleMin-(gardenAxisX-gardenHalfWidth),
    flowerDepth,
    0,
    COL.gardenPath,
    null,
    1
  );

  rotatedRect(
    gardenAxisX,
    flowerZ,
    rightHoleMin-leftHoleMax,
    flowerDepth,
    0,
    COL.gardenPath,
    null,
    1
  );

  rotatedRect(
    (rightHoleMax+gardenAxisX+gardenHalfWidth)*.5,
    flowerZ,
    (gardenAxisX+gardenHalfWidth)-rightHoleMax,
    flowerDepth,
    0,
    COL.gardenPath,
    null,
    1
  );

  const activityOffsetX=MAP_CONFIG.garden.activityOffsetX;
  const activityZ=MAP_CONFIG.garden.activityZ;

  {
    const p=worldToRadar(
      gardenAxisX-activityOffsetX,
      activityZ
    );

    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.fillStyle="#536c4d";
    ctx.strokeStyle="#9ab08e";
    ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.roundRect(-7,-5,14,10,2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle="rgba(218,231,207,.72)";
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(-4,2);ctx.lineTo(-1,-3);
    ctx.lineTo(2,2);ctx.lineTo(5,-3);
    ctx.stroke();
    ctx.restore();
  }

  {
    const p=worldToRadar(
      gardenAxisX+activityOffsetX,
      activityZ
    );

    ctx.save();
    ctx.translate(p.x,p.y);

    ctx.fillStyle="#766e64";
    ctx.strokeStyle="#c1b6a6";
    ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.arc(0,0,5.6,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle="rgba(210,224,238,.82)";
    ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(4,-5);
    ctx.lineTo(8,-9);
    ctx.moveTo(6,-7);
    ctx.lineTo(9,-4);
    ctx.stroke();

    ctx.restore();
  }

  let fountainX=gardenAxisX;
  let fountainZ=MAP_CONFIG.garden.fountainZ;

  if(
    typeof GARDEN_FEATURES!=="undefined" &&
    GARDEN_FEATURES.fountain?.visible
  ){
    const fp=new THREE.Vector3();
    GARDEN_FEATURES.fountain.getWorldPosition(fp);
    fountainX=gardenAxisX; 
    fountainZ=fp.z;
  }

  {
    const fountainMap=worldToRadar(fountainX,fountainZ);

    ctx.save();

    ctx.fillStyle="#456d82";
    ctx.strokeStyle="#c0dce6";
    ctx.lineWidth=1.3;

    ctx.beginPath();
    ctx.arc(fountainMap.x,fountainMap.y,8.4,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle="#6f9daf";
    ctx.strokeStyle="rgba(214,238,246,.74)";
    ctx.lineWidth=1;

    ctx.beginPath();
    ctx.arc(fountainMap.x,fountainMap.y,5.2,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle="#dff5fb";
    ctx.beginPath();
    ctx.arc(fountainMap.x,fountainMap.y,1.8,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="rgba(230,248,252,.78)";
    ctx.lineWidth=1;
    for(let n=0;n<8;n++){
      const a=n*Math.PI*.25;
      ctx.beginPath();
      ctx.moveTo(
        fountainMap.x+2.5*Math.cos(a),
        fountainMap.y+2.5*Math.sin(a)
      );
      ctx.lineTo(
        fountainMap.x+6.2*Math.cos(a),
        fountainMap.y+6.2*Math.sin(a)
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  {
    const e=worldToRadar(gardenAxisX,gardenFrontZ);
    ctx.save();
    ctx.strokeStyle="rgba(231,224,202,.88)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(e.x-8,e.y);
    ctx.lineTo(e.x-3,e.y);
    ctx.moveTo(e.x+3,e.y);
    ctx.lineTo(e.x+8,e.y);
    ctx.stroke();
    ctx.restore();
  }

  drawWorldLabel(
    gardenAxisX,
    gardenFrontZ+5.5,
    "GARDEN",
    .98
  );

  function getEasyTaskDestination(){
    if(String(GAME_SETTINGS?.difficulty||"intermediate").toLowerCase()!=="easy"){
      return null;
    }

    const stage=QUEST?.stage;

    if(stage==="talk_police" || stage==="return_wallet"){
      const police=questGetPolice?.();
      if(police?.root){
        const p=new THREE.Vector3();
        police.root.getWorldPosition(p);
        return p;
      }
    }

    if(stage==="search_clues"){
      const wallet=COLLECTIBLES?.wallet;
      if(wallet?.visible!==false){
        if(wallet?.getWorldPosition){
          const p=new THREE.Vector3();
          wallet.getWorldPosition(p);
          return p;
        }
        if(wallet?.position) return wallet.position.clone();
      }
    }

    if(stage==="find_suspicious"){
      const suspect=npcs?.find?.(n=>n?.name==="toxicMan");
      if(suspect?.root?.visible){
        const p=new THREE.Vector3();
        suspect.root.getWorldPosition(p);
        return p;
      }
      if(typeof STOREKEEPER_FINAL!=="undefined" && STOREKEEPER_FINAL?.finalPos){
        return STOREKEEPER_FINAL.finalPos.clone();
      }
    }

    if(stage==="arrest_in_progress"){
      const suspect=npcs?.find?.(n=>n?.name==="toxicMan");
      if(suspect?.root?.visible){
        const p=new THREE.Vector3();
        suspect.root.getWorldPosition(p);
        return p;
      }
    }

    return null;
  }

  function drawPulsingTaskDiamond(worldPos){
    if(!worldPos) return;
    const p=worldToRadar(worldPos.x,worldPos.z);
    if(p.x<10||p.x>w-10||p.y<10||p.y>h-10) return;

    const pulse=(Math.sin(performance.now()*.006)+1)*.5;
    const size=7.5+pulse*3.2;

    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(Math.PI/4);
    ctx.shadowColor="rgba(101,181,255,.95)";
    ctx.shadowBlur=8+pulse*9;
    ctx.fillStyle="rgba(103,183,255,.92)";
    ctx.strokeStyle="rgba(236,248,255,.96)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.rect(-size*.5,-size*.5,size,size);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawPulsingTaskDiamond(getEasyTaskDestination());

  drawWorldLabel(
    SCENE_ENV_CONFIG.rightRoomCenterX,
    SCENE_ENV_CONFIG.roomCenterZ,
    "JEWELRY",
    .72
  );

  ctx.save();
  ctx.translate(cx,cy);
  ctx.shadowColor="rgba(0,0,0,.85)";
  ctx.shadowBlur=7;
  ctx.fillStyle=COL.player;
  ctx.strokeStyle="#0b1016";
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(0,-11);
  ctx.lineTo(7,8);
  ctx.lineTo(0,5);
  ctx.lineTo(-7,8);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0,0,2.7,0,Math.PI*2);
  ctx.fillStyle="#78a8e8";
  ctx.fill();
  ctx.restore();

  const vignette=ctx.createRadialGradient(cx,cy,45,cx,cy,Math.max(w,h)*.68);
  vignette.addColorStop(0,"rgba(0,0,0,0)");
  vignette.addColorStop(.72,"rgba(0,0,0,.05)");
  vignette.addColorStop(1,"rgba(0,0,0,.62)");
  ctx.fillStyle=vignette;
  ctx.fillRect(0,0,w,h);

  ctx.save();
  ctx.translate(w-25,28);
  
  const northRight=radarRight.z;
  const northForward=radarForward.z;
  const northAngle=Math.atan2(northRight,northForward);
  ctx.rotate(northAngle);
  ctx.strokeStyle="rgba(230,239,250,.80)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(0,-8);
  ctx.lineTo(0,8);
  ctx.stroke();
  ctx.fillStyle="#f4f7fb";
  ctx.beginPath();
  ctx.moveTo(0,-11);
  ctx.lineTo(-3,-5);
  ctx.lineTo(3,-5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle="rgba(239,245,252,.82)";
  ctx.font="800 8px Arial";
  ctx.textAlign="center";
  ctx.fillText("N",w-25,13);

  ctx.strokeStyle="rgba(237,243,250,.55)";
  ctx.lineWidth=2;
  const scaleLen=20*pixelsPerMeter;
  ctx.beginPath();
  ctx.moveTo(18,h-17);
  ctx.lineTo(18+scaleLen,h-17);
  ctx.stroke();
  ctx.fillStyle="rgba(237,243,250,.68)";
  ctx.font="700 8px Arial";
  ctx.textAlign="left";
  ctx.fillText("20 m",18,h-23);

  ctx.restore();

  ctx.strokeStyle="rgba(224,236,252,.18)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.roundRect(1,1,w-2,h-2,37);
  ctx.stroke();

  if(currentZoneLabel){
    currentZoneLabel.textContent=getPlayerMapZone();
  }
}
