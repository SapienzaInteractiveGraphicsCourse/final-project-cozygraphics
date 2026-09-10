import * as GardenBuilders from "./Garden.js";

export function ensureDisplayCaseWoodenLegs(ctx,...args){
  return GardenBuilders.ensureDisplayCaseWoodenLegs(ctx,...args);
}

export function applyDisplayCaseWoodColor(ctx,...args){
  return GardenBuilders.applyDisplayCaseWoodColor(ctx,...args);
}

export function createMuseumLabel(ctx,...args){
  return GardenBuilders.createMuseumLabel(ctx,...args);
}

export function removeDisplayCaseRedCloth(ctx,...args){
  return GardenBuilders.removeDisplayCaseRedCloth(ctx,...args);
}

export function fitArtworkIntoCase(ctx,...args){
  return GardenBuilders.fitArtworkIntoCase(ctx,...args);
}

export function refreshAllMuseumPurpleCloths(ctx,...args){
  return GardenBuilders.refreshAllMuseumPurpleCloths(ctx,...args);
}

export function museumClothPrefixFromEditorId(id){
  return id==="abstract1" ? "garden_abstract_1_display_case" :
         id==="abstract2" ? "garden_abstract_2_display_case" :
         id==="meteorite" ? "garden_meteorite_display_case" : null;
}

export function museumPart(ctx,...args){
  return GardenBuilders.museumPart(ctx,...args);
}

export function museumPrefixParts(ctx,...args){
  return GardenBuilders.museumPrefixParts(ctx,...args);
}

export function placeMuseumLabel(ctx,...args){
  return GardenBuilders.placeMuseumLabel(ctx,...args);
}

export function refitMuseumArtwork(ctx,...args){
  return GardenBuilders.refitMuseumArtwork(ctx,...args);
}

export function enforceCenteredMuseumCasesAndBases(ctx,...args){
  return GardenBuilders.enforceCenteredMuseumCasesAndBases(ctx,...args);
}

export function lockLeftExhibitContentsToCases(ctx,...args){
  return GardenBuilders.lockLeftExhibitContentsToCases(ctx,...args);
}

export function applyMuseumGermanAlignment(ctx,...args){
  return GardenBuilders.applyMuseumGermanAlignment(ctx,...args);
}

export function applyMuseumPanelInitialWorldValues(ctx,...args){
  return GardenBuilders.applyMuseumPanelInitialWorldValues(ctx,...args);
}

export const MUSEUM_PANEL_EDITOR={
  step:.10,
  selected:"all",
  element:"board"
};

export function getMuseumPanelEditorTargets(ctx){
  const find=(prefix)=>ctx.GARDEN_MUSEUM.editable.get(`${prefix}:label`)||null;
  const telescopeLabel=ctx.NEW_TELESCOPE?.label||null;
  return [
    ["abstract1","ABSTRACT 1 PANEL",find("garden_abstract_1_display_case")],
    ["abstract2","ABSTRACT 2 PANEL",find("garden_abstract_2_display_case")],
    ["meteorite","METEORITE PANEL",find("garden_meteorite_display_case")],
    ["telescope","TELESCOPE PANEL",telescopeLabel]
  ];
}

export function getMuseumPanelEditorObjects(ctx){
  const targets=getMuseumPanelEditorTargets(ctx);
  if(MUSEUM_PANEL_EDITOR.selected==="all"){
    return targets.map(x=>x[2]).filter(Boolean);
  }
  const obj=targets.find(
    x=>x[0]===MUSEUM_PANEL_EDITOR.selected
  )?.[2]||null;
  return obj?[obj]:[];
}

export function museumPanelPart(panel,element){
  if(!panel) return null;
  if(element==="board"){
    return panel.getObjectByName("panel_piece_board")||null;
  }
  if(element==="stem"){
    return panel.getObjectByName("panel_piece_stem")||null;
  }
  if(element==="base"){
    return panel.getObjectByName("panel_piece_base")||null;
  }
  return null;
}

export function refreshMuseumAlignmentEditor(ctx){
  const read=document.getElementById("museumAlignmentRead");
  if(!read) return;

  const a1=museumPart(ctx,"garden_abstract_1_display_case","case");
  const a2=museumPart(ctx,"garden_abstract_2_display_case","case");
  const met=museumPart(ctx,"garden_meteorite_display_case","case");
  const tel=ctx.NEW_TELESCOPE?.root||null;

  const line=(name,o)=>!o
    ? `${name} · loading`
    : `${name}  X ${o.position.x.toFixed(3)}  Y ${o.position.y.toFixed(3)}  Z ${o.position.z.toFixed(3)}`;

  const alignment=ctx.MUSEUM_ALIGNMENT;
  read.textContent=[
    "COORDINATED EXHIBIT GRID",
    "",
    "LEFT SIDE",
    line("ABSTRACT 1",a1),
    line("ABSTRACT 2",a2),
    `LEFT CENTER Z ${alignment.leftCenterZ.toFixed(3)}`,
    "",
    "RIGHT SIDE",
    line("METEORITE",met),
    line("TELESCOPE",tel),
    `RIGHT CENTER Z ${alignment.rightCenterZ.toFixed(3)}`,
    "",
    `SAME-SIDE DISTANCE Z ${alignment.spacingZ.toFixed(3)}`,
    `AISLE WIDTH X ${(alignment.rightX-alignment.leftX).toFixed(3)}`,
    `DISPLAY CASE ROT Y ${alignment.sharedYaw.toFixed(1)}°`
  ].join("\\n");
}

export function refreshMuseumPanelEditor(ctx){
  const THREE=ctx.THREE;
  const select=document.getElementById("museumPanelSelect");

  if(select){
    const current=MUSEUM_PANEL_EDITOR.selected;
    const targets=getMuseumPanelEditorTargets(ctx);
    const allReady=targets.some(x=>!!x[2]);
    const options=[
      ["all","ALL PANELS",allReady],
      ...targets.map(([id,label,obj])=>[id,label,!!obj])
    ];

    select.replaceChildren(...options.map(([id,label,ready])=>{
      const option=document.createElement("option");
      option.value=id;
      option.textContent=label+(ready?"":" · loading");
      option.disabled=!ready;
      return option;
    }));

    if([...select.options].some(o=>o.value===current&&!o.disabled)){
      select.value=current;
    }
  }

  const objects=getMuseumPanelEditorObjects(ctx);
  const read=document.getElementById("museumPanelRead");
  if(!read) return;

  if(!objects.length){
    read.textContent="PANEL LOADING...";
    return;
  }

  ctx.scene.updateMatrixWorld(true);

  const fmt=(panel)=>{
    const pos=new THREE.Vector3();
    const q=new THREE.Quaternion();
    const e=new THREE.Euler();
    panel.getWorldPosition(pos);
    panel.getWorldQuaternion(q);
    e.setFromQuaternion(q,"XYZ");
    return `P(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})  `+
      `R(${THREE.MathUtils.radToDeg(e.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(e.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(e.z).toFixed(1)}°)`;
  };

  const part=museumPanelPart(
    objects[0],
    MUSEUM_PANEL_EDITOR.element
  );

  const partInfo=part
    ? `PART LOCAL\\nP(${part.position.x.toFixed(3)}, ${part.position.y.toFixed(3)}, ${part.position.z.toFixed(3)})  `+
      `R(${THREE.MathUtils.radToDeg(part.rotation.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(part.rotation.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(part.rotation.z).toFixed(1)}°)\\n`+
      `S(${part.scale.x.toFixed(3)}, ${part.scale.y.toFixed(3)}, ${part.scale.z.toFixed(3)})`
    : "PART LOADING";

  if(MUSEUM_PANEL_EDITOR.selected==="all"){
    const targets=getMuseumPanelEditorTargets(ctx);
    read.textContent=
      `EDITING: ALL PANELS\\n`+
      `Each panel contains 3 independent pieces.\\n`+
      `WHOLE PANEL controls move/rotate all 3 pieces together.\\n`+
      `ALL PANELS applies the same whole-panel or selected-piece change to every panel.\\n\\n`+
      targets.map(([id,label,obj])=>`${label}\\n${obj?fmt(obj):"loading"}`).join("\\n\\n")+
      `\\n\\nEDITING PART: ${MUSEUM_PANEL_EDITOR.element.toUpperCase()}\\n${partInfo}`;
  }else{
    read.textContent=
      `${MUSEUM_PANEL_EDITOR.selected.toUpperCase()} PANEL\\n`+
      `${fmt(objects[0])}\\n\\n`+
      `EDITING PART: ${MUSEUM_PANEL_EDITOR.element.toUpperCase()}\\n${partInfo}`;
  }
}
