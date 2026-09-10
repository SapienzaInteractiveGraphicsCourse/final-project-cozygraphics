// character-poses.js
// Character pose/config data extracted from core/main.js.
// Numeric values are unchanged. Exported objects remain mutable.

export const POSES={
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

export const TALK_POSES={
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

export const THIEF_UNDISCOVERED_POSE_A={
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

export const THIEF_UNDISCOVERED_POSE_B={
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

export const THIEF_UNDISCOVERED_POSE_C={
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

export const THIEF_COUNTER10_POSE={
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

export const THIEF_TALK_POSE_A={
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

export const THIEF_TALK_POSE_B={
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

export const THIEF_TALK_POSE=THIEF_TALK_POSE_A;

export const THIEF_POST_DIALOGUE_POSE={

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

export const CASINO_BOY_STANDARD_POSE={
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

export const CASINO_BOY_GESTURE_POSE={
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

export const SECURITY_TALK2={
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

export const RIGHT_ROSE_GROUP_EDITOR={
  x:1.000,
  y:0,
  z:0,
  scaleX:1,
  scaleY:1,
  scaleZ:1,
  moveStep:.10,
  scaleStep:.025
};

export const SECURITY_POSE_EDITOR={
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

export const SECURITY_FINAL_POSE_EDITOR={
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

export const CHILD_USER_POSE_1={
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

export const CHILD_USER_POSE_2={
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

export const CHILD_USER_POSE_FLOW={
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

export const CHILD_APPROVED_POSES={
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

export const SECURITY_OLD_TALK_PANEL={
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

export const SECURITY_LOWER_BODY_EDITOR={
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

export const SECURITY_TURN_POSE_EDITOR={
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

