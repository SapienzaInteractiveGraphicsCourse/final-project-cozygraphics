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
    npcs,
    TASK_BOUNDARY,
    GATE_PART_EDITORS,
    COASTAL_ASSETS
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


  function worldSegment(x1,z1,x2,z2,color,width=.22){
    const a=worldToRadar(x1,z1);
    const b=worldToRadar(x2,z2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=color;
    ctx.lineWidth=Math.max(1,width*pixelsPerMeter);
    ctx.lineCap="round";
    ctx.stroke();
    ctx.restore();
  }

  function drawDoorMarker(centerX,z,width){
    const half=Math.max(.6,width*.5);
    worldSegment(centerX-half,z,centerX+half,z,"#d7c29b",.22);
  }

  function drawObjectLeaf(obj,color,width=.22){
    if(!obj || obj.visible===false || !obj.parent) return;
    obj.updateMatrixWorld?.(true);
    const box=new THREE.Box3().setFromObject(obj);
    if(box.isEmpty()) return;
    const size=box.getSize(new THREE.Vector3());
    const center=box.getCenter(new THREE.Vector3());
    if(size.x>=size.z){
      worldSegment(box.min.x,center.z,box.max.x,center.z,color,width);
    }else{
      worldSegment(center.x,box.min.z,center.x,box.max.z,color,width);
    }
  }

  function drawGardenGatewayOnMap(){
    const left=GATE_PART_EDITORS?.left || null;
    const right=GATE_PART_EDITORS?.right || null;
    drawObjectLeaf(left,"#d7c29b",.24);
    drawObjectLeaf(right,"#d7c29b",.24);
    if(!left && !right && TASK_BOUNDARY?.gate){
      drawObjectLeaf(TASK_BOUNDARY.gate,"#bda77d",.18);
    }
  }

  function drawGardenBarricadesOnMap(){
    const left=GATE_PART_EDITORS?.barricadeLeft || null;
    const right=GATE_PART_EDITORS?.barricadeRight || null;
    drawObjectLeaf(left,"#8b6f4d",.20);
    drawObjectLeaf(right,"#8b6f4d",.20);
    if(!left && !right && COASTAL_ASSETS?.barricades){
      drawObjectLeaf(COASTAL_ASSETS.barricades,"#8b6f4d",.18);
    }
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

  // Neutral world ground. Green is reserved for the fenced garden/lawn,
  // so grass does not visually continue beyond the garden fence.
  ctx.fillStyle="#777167";
  ctx.fillRect(0,0,w,h);

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

  // ------------------------------------------------------------
  // GRASS TO ROAD CURVE · GARDEN SIDE ONLY
  //
  // The lawn reaches all the way to the curved sidewalk/road boundary,
  // but ONLY on the Garden side.
  // Casino/Jewelry side is not modified at all.
  // ------------------------------------------------------------
  function drawGardenGrassToCurve(){
    const roadSide=[];
    const gardenSide=[];
    const samples=120;

    // A reference point clearly inside the Garden.
    const gardenRefX=0;
    const gardenRefZ=112;

    // Start at the outer edge of the Garden-side sidewalk.
    // The second offset simply extends the same grass farther into Garden.
    const nearOffset=24.2;
    const farOffset=105.0;

    for(let i=0;i<=samples;i++){
      const t=i/samples;
      const p=uRoadCurve.getPointAt(t);

      // Do not touch the Casino/Jewelry portion of the road.
      // Only start this terrain once the curve reaches the Garden area.
      if(p.z<52.0) continue;

      const tangent=uRoadCurve.getTangentAt(t).normalize();

      let nx=-tangent.z;
      let nz= tangent.x;

      // Pick ONLY the normal pointing toward the Garden.
      const gx=gardenRefX-p.x;
      const gz=gardenRefZ-p.z;

      if(nx*gx+nz*gz<0){
        nx=-nx;
        nz=-nz;
      }

      roadSide.push(
        worldToRadar(
          p.x+nx*nearOffset,
          p.z+nz*nearOffset
        )
      );

      gardenSide.push(
        worldToRadar(
          p.x+nx*farOffset,
          p.z+nz*farOffset
        )
      );
    }

    if(roadSide.length<2 || gardenSide.length<2) return;

    ctx.save();
    ctx.fillStyle=COL.garden;

    ctx.beginPath();
    ctx.moveTo(roadSide[0].x,roadSide[0].y);

    for(let i=1;i<roadSide.length;i++){
      ctx.lineTo(roadSide[i].x,roadSide[i].y);
    }

    for(let i=gardenSide.length-1;i>=0;i--){
      ctx.lineTo(gardenSide[i].x,gardenSide[i].y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawGardenGrassToCurve();

  strokeRoad(0,29,COL.roadEdge);
  strokeRoad(0,22,COL.road);

  // Keep BOTH curve/sidewalk strokes exactly as they were.
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

  // Main building footprints come directly from the current scene values.
  const roomHalfW=SCENE_ENV_CONFIG.roomWidth*.5;
  const roomFrontZ=SCENE_ENV_CONFIG.frontZ;
  const roomBackZ=SCENE_ENV_CONFIG.backZ;

  // Casino + Jewelry + the real wall between them are drawn as ONE
  // continuous exterior footprint. There is no sidewalk-colored gap.
  const casinoLeftX=SCENE_ENV_CONFIG.leftRoomCenterX-roomHalfW;
  const casinoRightX=SCENE_ENV_CONFIG.leftRoomCenterX+roomHalfW;
  const jewelryLeftX=SCENE_ENV_CONFIG.rightRoomCenterX-roomHalfW;
  const jewelryRightX=SCENE_ENV_CONFIG.rightRoomCenterX+roomHalfW;

  polygon([
    [casinoLeftX,roomBackZ],
    [jewelryRightX,roomBackZ],
    [jewelryRightX,roomFrontZ],
    [casinoLeftX,roomFrontZ]
  ],COL.building,COL.buildingEdge,1.5);

  const innerInsetX=3.75;
  const innerInsetZ=4.0;
  const innerCenterGrow=2.25;

  polygon([
    [casinoLeftX+innerInsetX,roomBackZ+innerInsetZ],
    [casinoRightX-innerInsetX+innerCenterGrow,roomBackZ+innerInsetZ],
    [casinoRightX-innerInsetX+innerCenterGrow,roomFrontZ-innerInsetZ],
    [casinoLeftX+innerInsetX,roomFrontZ-innerInsetZ]
  ],"#303740",null);

  polygon([
    [jewelryLeftX+innerInsetX-innerCenterGrow,roomBackZ+innerInsetZ],
    [jewelryRightX-innerInsetX,roomBackZ+innerInsetZ],
    [jewelryRightX-innerInsetX,roomFrontZ-innerInsetZ],
    [jewelryLeftX+innerInsetX-innerCenterGrow,roomFrontZ-innerInsetZ]
  ],"#303740",null);

  for(const off of crosswalkOffsets){
    const z=CROSSWALK.centerZ+off;
    polygon([
      [CROSSWALK.centerX-CROSSWALK.stripeLength*.5,z-CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX+CROSSWALK.stripeLength*.5,z-CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX+CROSSWALK.stripeLength*.5,z+CROSSWALK.stripeDepth*.5],
      [CROSSWALK.centerX-CROSSWALK.stripeLength*.5,z+CROSSWALK.stripeDepth*.5]
    ],"rgba(232,235,236,.80)");
  }

  // ============================================================
  // GARDEN · EXACT PROPORTIONS + REPRESENTATIVE TREES + FOUNTAIN
  // No exhibition objects are drawn.
  // ============================================================

  const gardenAxisX=0;

  const fenceMinX=-71.000;
  const fenceMaxX=71.000;
  const fenceFrontZ=56.900;
  const fenceBackZ=161.012;

  const concreteMinX=-42.450;
  const concreteMaxX=48.450;
  const concreteFrontZ=58.440;
  const concreteBackZ=128.530;

  const roseWidth=12.000;
  const roseDepth=11.500;
  const roseZ=82.439;
  const roseLeftX=-23.100;
  const roseRightX=23.700;

  const concrete="#9a9383";
  const concreteEdge="#c0b7a4";
  const lawn=COL.garden;
  const lawnEdge=COL.gardenEdge;

  // Garden green continues beyond the fence wherever the garden trees stand.
  // The fence is a boundary element, not the end of the grass terrain.
  // Real accepted tree layout reaches roughly X -84.7..+83.8 and Z up to ~169.
  // Paint that whole outer tree belt with the SAME garden green so the trees
  // never appear to stand on the mountain/background terrain.
  // The grass does NOT end shortly after the fence.
  // It is the surrounding terrain and continues far beyond the visible map.
  const outerTreeGrassMinX=-260.0;
  const outerTreeGrassMaxX= 260.0;
  const outerTreeGrassMinZ=fenceFrontZ;
  const outerTreeGrassMaxZ=420.0;

  polygon([
    [outerTreeGrassMinX,outerTreeGrassMinZ],
    [outerTreeGrassMaxX,outerTreeGrassMinZ],
    [outerTreeGrassMaxX,outerTreeGrassMaxZ],
    [outerTreeGrassMinX,outerTreeGrassMaxZ]
  ],lawn,lawnEdge,.8);

  // The green terrain continues indefinitely after the curved section.
  // There is intentionally NO visible back edge to the grass on the minimap.
  // Road and sidewalk are drawn above this terrain later.
  {
    const farLeft=worldToRadar(-260.0,165.0);
    const farRight=worldToRadar(260.0,165.0);
    const infinityRight=worldToRadar(260.0,420.0);
    const infinityLeft=worldToRadar(-260.0,420.0);

    ctx.save();
    ctx.fillStyle=lawn;

    ctx.beginPath();
    ctx.moveTo(farLeft.x,farLeft.y);
    ctx.lineTo(farRight.x,farRight.y);
    ctx.lineTo(infinityRight.x,infinityRight.y);
    ctx.lineTo(infinityLeft.x,infinityLeft.y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Inside the fence, keep the same green around the central concrete pavement.

  // Left green strip between pavement and side fence.
  polygon([
    [fenceMinX,fenceFrontZ],
    [concreteMinX,fenceFrontZ],
    [concreteMinX,fenceBackZ],
    [fenceMinX,fenceBackZ]
  ],lawn,lawnEdge,.8);

  // Right green strip between pavement and side fence.
  polygon([
    [concreteMaxX,fenceFrontZ],
    [fenceMaxX,fenceFrontZ],
    [fenceMaxX,fenceBackZ],
    [concreteMaxX,fenceBackZ]
  ],lawn,lawnEdge,.8);

  // Far green strip behind the end of the concrete.
  polygon([
    [concreteMinX,concreteBackZ],
    [concreteMaxX,concreteBackZ],
    [concreteMaxX,fenceBackZ],
    [concreteMinX,fenceBackZ]
  ],lawn,lawnEdge,.8);

  // Actual concrete pavement.
  polygon([
    [concreteMinX,concreteFrontZ],
    [concreteMaxX,concreteFrontZ],
    [concreteMaxX,concreteBackZ],
    [concreteMinX,concreteBackZ]
  ],concrete,concreteEdge,1.5);

  // Actual rose beds.
  rotatedRect(
    roseLeftX,
    roseZ,
    roseWidth,
    roseDepth,
    0,
    lawn,
    lawnEdge,
    .8
  );

  rotatedRect(
    roseRightX,
    roseZ,
    roseWidth,
    roseDepth,
    0,
    lawn,
    lawnEdge,
    .8
  );

  // A few small roses inside the two real rose beds.
  // Decorative only: positions remain inside the actual bed dimensions.
  const minimapRoses=[
    [roseLeftX-3.5,roseZ-2.7],
    [roseLeftX,roseZ-2.0],
    [roseLeftX+3.3,roseZ-2.6],
    [roseLeftX-2.2,roseZ+2.3],
    [roseLeftX+2.4,roseZ+2.5],

    [roseRightX-3.5,roseZ-2.7],
    [roseRightX,roseZ-2.0],
    [roseRightX+3.3,roseZ-2.6],
    [roseRightX-2.2,roseZ+2.3],
    [roseRightX+2.4,roseZ+2.5]
  ];

  ctx.save();
  for(let i=0;i<minimapRoses.length;i++){
    const [rx,rz]=minimapRoses[i];
    const p=worldToRadar(rx,rz);

    ctx.fillStyle=(i%2===0)?"#d76a78":"#b94e62";
    ctx.strokeStyle="rgba(255,220,225,.70)";
    ctx.lineWidth=.55;

    ctx.beginPath();
    ctx.arc(p.x,p.y,1.65,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // ------------------------------------------------------------
  // GARDEN TREES · SIMPLE STYLIZED PINE ICONS
  // One icon per side, matching the requested triangular tree symbol.
  // ------------------------------------------------------------
  function drawStylizedGardenTree(worldX,worldZ){
    const p=worldToRadar(worldX,worldZ);

    ctx.save();
    ctx.fillStyle="#111111";

    // upper triangle
    ctx.beginPath();
    ctx.moveTo(p.x, p.y-8);
    ctx.lineTo(p.x-4.2, p.y-1.5);
    ctx.lineTo(p.x+4.2, p.y-1.5);
    ctx.closePath();
    ctx.fill();

    // lower triangle
    ctx.beginPath();
    ctx.moveTo(p.x, p.y-3.2);
    ctx.lineTo(p.x-5.5, p.y+5.2);
    ctx.lineTo(p.x+5.5, p.y+5.2);
    ctx.closePath();
    ctx.fill();

    // small trunk
    ctx.fillRect(p.x-1.1, p.y+4.8, 2.2, 3.4);

    ctx.restore();
  }

  // Three stylized trees only:
  // two on the left, one on the right.
  drawStylizedGardenTree(-64.5, 92.0);
  drawStylizedGardenTree(-64.5,132.0);

  drawStylizedGardenTree( 64.5,108.0);

  // ------------------------------------------------------------
  // FOUNTAIN
  // Real current position from the HTML:
  // X 0.600, Z 113.194
  // ------------------------------------------------------------
  {
    const fountainMap=worldToRadar(0.600,113.194);

    ctx.save();
    ctx.fillStyle="#456d82";
    ctx.strokeStyle="#c0dce6";
    ctx.lineWidth=1.2;

    ctx.beginPath();
    ctx.arc(fountainMap.x,fountainMap.y,6.0,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle="#7fa9b9";
    ctx.beginPath();
    ctx.arc(fountainMap.x,fountainMap.y,2.5,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  // Strong final garden/fence outline so green visibly ENDS here.
  polygon([
    [fenceMinX,fenceFrontZ],
    [fenceMaxX,fenceFrontZ],
    [fenceMaxX,fenceBackZ],
    [fenceMinX,fenceBackZ]
  ],null,"rgba(214,202,173,.92)",2.2);

  // Keep only the location name; no exhibition icons.
  drawWorldLabel(
    gardenAxisX,
    70.5,
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

  const casinoDoorX=
    SCENE_ENV_CONFIG.leftRoomCenterX+
    (SCENE_ENV_CONFIG.leftDoorOffsetX||0);
  const jewelryDoorX=SCENE_ENV_CONFIG.rightRoomCenterX;
  const doorZ=SCENE_ENV_CONFIG.doorZ ?? roomFrontZ;
  const doorWidth=SCENE_ENV_CONFIG.doorWidth || 3.0;

  drawDoorMarker(casinoDoorX,doorZ,doorWidth);
  drawDoorMarker(jewelryDoorX,doorZ,doorWidth);

  drawGardenGatewayOnMap();
  drawGardenBarricadesOnMap();

  // Building names centered on the actual room footprints.
  drawWorldLabel(
    SCENE_ENV_CONFIG.leftRoomCenterX,
    SCENE_ENV_CONFIG.roomCenterZ,
    "CASINO",
    .95
  );

  drawWorldLabel(
    SCENE_ENV_CONFIG.rightRoomCenterX,
    SCENE_ENV_CONFIG.roomCenterZ,
    "JEWELRY",
    .95
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
