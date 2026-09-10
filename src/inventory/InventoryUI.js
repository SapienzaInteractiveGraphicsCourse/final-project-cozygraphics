// InventoryUI.js
// Inventory presentation and toggle input.

export function createInventoryUI(ctx){
  let lastInventoryX=false;

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
  ctx.renderInventoryMoney();
  if(!ctx.inventoryGrid) return;
  ctx.inventoryGrid.replaceChildren();
  if(ctx.INVENTORY.items.length===0){
    const empty=document.createElement('div');
    empty.className='inventoryEmpty';
    empty.textContent='No items collected';
    ctx.inventoryGrid.appendChild(empty);
    return;
  }
  for(const item of ctx.INVENTORY.items){
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
    ctx.inventoryGrid.appendChild(card);
  }
}

function setInventoryOpen(open){
  ctx.INVENTORY.open=!!open;
  if(ctx.inventoryOverlay){
    ctx.inventoryOverlay.classList.toggle('open',ctx.INVENTORY.open);
  }
  if(ctx.INVENTORY.open){
    for(const k of Object.keys(ctx.keys)) ctx.keys[k]=false;
    renderInventory();
  }
}

function addInventoryItem(item){
  if(ctx.INVENTORY.items.some(x=>x.id===item.id)) return;
  ctx.INVENTORY.items.push(item);
  renderInventory();
}

function updateInventoryToggle(){
  const xDown=!!ctx.keys['x'];
  if(xDown && !lastInventoryX){
    setInventoryOpen(!ctx.INVENTORY.open);
  }
  lastInventoryX=xDown;
}

return {
  makeInventoryThumb,
  renderInventory,
  setInventoryOpen,
  addInventoryItem,
  updateInventoryToggle
};
}
