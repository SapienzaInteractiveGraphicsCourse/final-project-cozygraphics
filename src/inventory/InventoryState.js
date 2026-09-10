// InventoryState.js
// Inventory, player money and claw-machine payment state extracted from core/main.js.

export const INVENTORY={
  open:false,
  items:[]
};

export const CLAW_PLAY_COST_CENTS=50;

export const PLAYER_MONEY={
  cashDollars:150,
  coinCents:200
};

export const CASINO_CLAW_PAYMENT={
  message:"",
  messageUntil:0
};

export const COLLECTIBLES={
  wallet:null
};

export function renderInventoryMoney(){
  const cash=document.getElementById("inventoryCashValue");
  const coins=document.getElementById("inventoryCoinValue");
  if(cash) cash.textContent="$"+Math.max(0,Math.floor(PLAYER_MONEY.cashDollars));
  if(coins) coins.textContent=Math.max(0,Math.floor(PLAYER_MONEY.coinCents))+"¢";
}

export function canAffordCasinoClaw(){
  return PLAYER_MONEY.coinCents>=CLAW_PLAY_COST_CENTS;
}

export function spendCasinoClawCost(){
  if(!canAffordCasinoClaw()) return false;
  PLAYER_MONEY.coinCents-=CLAW_PLAY_COST_CENTS;
  renderInventoryMoney();
  return true;
}

export function setCasinoClawPaymentMessage(message,duration=1500){
  CASINO_CLAW_PAYMENT.message=String(message||"");
  CASINO_CLAW_PAYMENT.messageUntil=performance.now()+duration;
}
