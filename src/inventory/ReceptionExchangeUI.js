// ReceptionExchangeUI.js
// Casino reception exchange UI. No camera logic.

export const RECEPTION_EXCHANGE={
  open:false,
  selectedAmount:1
};

export function createReceptionExchangeUI(ctx){

function refreshReceptionExchangeText(){
  const box=document.getElementById("receptionExchangeText");
  if(!box) return;

  const amount=
    Number(RECEPTION_EXCHANGE.selectedAmount)||1;

  box.textContent=
    `You have $${ctx.PLAYER_MONEY.cashDollars} and ${ctx.PLAYER_MONEY.coinCents}¢. `+
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

  if(ctx.pickupPrompt) ctx.pickupPrompt.style.display="none";
  if(ctx.dialogue) ctx.dialogue.style.display="none";
  if(ctx.dialogueActionHint) ctx.dialogueActionHint.style.display="none";

  ctx.gameplayInputEnabled=false;
}

function closeReceptionExchange(){
  const panel=document.getElementById("receptionExchangePanel");

  RECEPTION_EXCHANGE.open=false;

  if(panel){
    panel.classList.remove("open");
    panel.style.display="none";
  }

  if(ctx.dialogueActionHint){
    ctx.dialogueActionHint.style.display="";
  }

  if(!ctx.QUEST.dialogueActive && !ctx.GLOBAL_DIALOGUE_LOCK.active){
    ctx.gameplayInputEnabled=true;
  }
}

function exchangeReceptionDollars(amount){
  amount=Math.floor(Number(amount)||0);
  if(amount<=0) return;

  if(ctx.PLAYER_MONEY.cashDollars<amount){
    closeReceptionExchange();

    requestAnimationFrame(()=>{
      ctx.questShowClue(
        "NOT ENOUGH DOLLARS",
        1800
      );
    });

    return;
  }

  ctx.PLAYER_MONEY.cashDollars-=amount;
  ctx.PLAYER_MONEY.coinCents+=amount*100;

  ctx.renderInventoryMoney();

  closeReceptionExchange();

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      ctx.questShowClue(
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

return {
  refreshReceptionExchangeText,
  openReceptionExchange,
  closeReceptionExchange,
  exchangeReceptionDollars,
  initReceptionExchangeUI
};
}
