import type { JointMovement, JointCategoryInfo, JointCategory, MovementType } from '@/types/rom'

// MediaPipe Pose 랜드마크 인덱스
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
}

// 관절 카테고리 정보 (평가지 기준)
export const JOINT_CATEGORIES: JointCategoryInfo[] = [
  // === 상지 (Upper Extremity) ===
  {
    id: 'shoulder',
    extremity: 'upper',
    nameEn: 'Shoulder',
    nameKo: 'Shoulder',
    icon: '💪',
    movements: ['shoulder_flexion', 'shoulder_extension'],
  },
  {
    id: 'elbow',
    extremity: 'upper',
    nameEn: 'Elbow',
    nameKo: 'Elbow',
    icon: '🦾',
    movements: ['elbow_flexion'],
  },
  {
    id: 'wrist',
    extremity: 'upper',
    nameEn: 'Wrist',
    nameKo: 'Wrist',
    icon: '✋',
    movements: ['wrist_flexion', 'wrist_extension'],
  },
  {
    id: 'finger',
    extremity: 'upper',
    nameEn: 'Finger',
    nameKo: 'Finger',
    icon: '🖐️',
    movements: ['finger_mcp_flexion', 'finger_pip_flexion'],
  },
  // === 하지 (Lower Extremity) ===
  {
    id: 'hip',
    extremity: 'lower',
    nameEn: 'Hip',
    nameKo: 'Hip',
    icon: '🦵',
    movements: ['hip_flexion', 'hip_abduction'],
  },
  {
    id: 'knee',
    extremity: 'lower',
    nameEn: 'Knee',
    nameKo: 'Knee',
    icon: '🦿',
    movements: ['knee_flexion'],
  },
  {
    id: 'ankle',
    extremity: 'lower',
    nameEn: 'Ankle',
    nameKo: 'Ankle',
    icon: '🦶',
    movements: ['ankle_dorsiflexion', 'ankle_plantarflexion'],
  },
]

// 전체 관절 움직임 데이터 (평가지 기준)
export const JOINT_MOVEMENTS: JointMovement[] = [
  // === 상지 (Upper Extremity) ===

  // 1. 어깨 굴곡/신전 (Shoulder Flexion/Extension)
  {
    id: 'shoulder_flexion',
    category: 'shoulder',
    nameEn: 'Shoulder Flexion',
    nameKo: 'Shoulder Flexion',
    descriptionEn: 'Raising arm forward and up',
    descriptionKo: '팔을 앞으로 들어올리기',
    guideEn: 'Raise your arm forward and up toward the ceiling',
    guideKo: '팔을 앞으로 천천히 들어올려주세요',
    normalRange: { min: 0, max: 180 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_HIP,
      point2: POSE_LANDMARKS.LEFT_SHOULDER,
      point3: POSE_LANDMARKS.LEFT_ELBOW,
    },
  },
  {
    id: 'shoulder_extension',
    category: 'shoulder',
    nameEn: 'Shoulder Extension',
    nameKo: 'Shoulder Extension',
    descriptionEn: 'Moving arm backward',
    descriptionKo: '팔을 뒤로 뻗기',
    guideEn: 'Move your arm backward behind your body',
    guideKo: '팔을 뒤로 천천히 뻗어주세요',
    normalRange: { min: 0, max: 60 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_HIP,
      point2: POSE_LANDMARKS.LEFT_SHOULDER,
      point3: POSE_LANDMARKS.LEFT_ELBOW,
    },
  },

  // 2. 팔꿈치 굴곡 (Elbow Flexion)
  {
    id: 'elbow_flexion',
    category: 'elbow',
    nameEn: 'Elbow Flexion',
    nameKo: 'Elbow Flexion',
    descriptionEn: 'Bending the elbow',
    descriptionKo: '팔꿈치 구부리기',
    guideEn: 'Bend your elbow bringing your hand toward your shoulder',
    guideKo: '팔꿈치를 구부려 손을 어깨 쪽으로 가져오세요',
    normalRange: { min: 0, max: 150 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_SHOULDER,
      point2: POSE_LANDMARKS.LEFT_ELBOW,
      point3: POSE_LANDMARKS.LEFT_WRIST,
    },
  },

  // 3. 손목 굴곡/신전 (Wrist Flexion/Extension)
  {
    id: 'wrist_flexion',
    category: 'wrist',
    nameEn: 'Wrist Flexion',
    nameKo: 'Wrist Flexion',
    descriptionEn: 'Bending wrist toward palm',
    descriptionKo: '손바닥 쪽으로 손목 구부리기',
    guideEn: 'Bend your wrist so your palm moves toward your forearm',
    guideKo: '손바닥이 전완 쪽으로 향하도록 손목을 구부려주세요',
    normalRange: { min: 0, max: 80 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_ELBOW,
      point2: POSE_LANDMARKS.LEFT_WRIST,
      point3: POSE_LANDMARKS.LEFT_INDEX,
    },
  },
  {
    id: 'wrist_extension',
    category: 'wrist',
    nameEn: 'Wrist Extension',
    nameKo: 'Wrist Extension',
    descriptionEn: 'Bending wrist toward back of hand',
    descriptionKo: '손등 쪽으로 손목 젖히기',
    guideEn: 'Bend your wrist so the back of your hand moves toward your forearm',
    guideKo: '손등이 전완 쪽으로 향하도록 손목을 젖혀주세요',
    normalRange: { min: 0, max: 70 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_ELBOW,
      point2: POSE_LANDMARKS.LEFT_WRIST,
      point3: POSE_LANDMARKS.LEFT_INDEX,
    },
  },

  // 4. 손가락 굴곡 (Finger MCP/PIP Flexion) — 카메라 측정 불가
  {
    id: 'finger_mcp_flexion',
    category: 'finger',
    nameEn: 'Finger MCP Flexion',
    nameKo: 'Finger MCP Flexion',
    descriptionEn: 'Bending fingers at the knuckle joint',
    descriptionKo: '손가락 중수지절 관절 구부리기',
    guideEn: 'Bend your fingers at the knuckle joints',
    guideKo: '손가락을 주먹 쥐듯이 구부려주세요',
    normalRange: { min: 0, max: 90 },
    side: 'left',
    cameraMeasurable: false,
    landmarks: { point1: 0, point2: 0, point3: 0 },
  },
  {
    id: 'finger_pip_flexion',
    category: 'finger',
    nameEn: 'Finger PIP Flexion',
    nameKo: 'Finger PIP Flexion',
    descriptionEn: 'Bending fingers at the middle joint',
    descriptionKo: '손가락 근위지절 관절 구부리기',
    guideEn: 'Bend your fingers at the middle joints',
    guideKo: '손가락 중간 마디를 구부려주세요',
    normalRange: { min: 0, max: 100 },
    side: 'left',
    cameraMeasurable: false,
    landmarks: { point1: 0, point2: 0, point3: 0 },
  },

  // === 하지 (Lower Extremity) ===

  // 5. 고관절 굴곡/외전 (Hip Flexion/Abduction)
  {
    id: 'hip_flexion',
    category: 'hip',
    nameEn: 'Hip Flexion',
    nameKo: 'Hip Flexion',
    descriptionEn: 'Raising thigh toward chest',
    descriptionKo: '허벅지를 가슴 쪽으로 들어올리기',
    guideEn: 'Raise your knee toward your chest while keeping your back straight',
    guideKo: '등을 곧게 유지하면서 무릎을 가슴 쪽으로 들어올려주세요',
    normalRange: { min: 0, max: 120 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_SHOULDER,
      point2: POSE_LANDMARKS.LEFT_HIP,
      point3: POSE_LANDMARKS.LEFT_KNEE,
    },
  },
  {
    id: 'hip_abduction',
    category: 'hip',
    nameEn: 'Hip Abduction',
    nameKo: 'Hip Abduction',
    descriptionEn: 'Moving leg sideways away from body',
    descriptionKo: '다리를 옆으로 벌리기',
    guideEn: 'Move your leg out to the side away from your body',
    guideKo: '다리를 옆으로 벌려주세요',
    normalRange: { min: 0, max: 45 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.RIGHT_HIP,
      point2: POSE_LANDMARKS.LEFT_HIP,
      point3: POSE_LANDMARKS.LEFT_KNEE,
    },
  },

  // 6. 무릎 굴곡 (Knee Flexion)
  {
    id: 'knee_flexion',
    category: 'knee',
    nameEn: 'Knee Flexion',
    nameKo: 'Knee Flexion',
    descriptionEn: 'Bending the knee',
    descriptionKo: '무릎 구부리기',
    guideEn: 'Bend your knee bringing your heel toward your buttock',
    guideKo: '발뒤꿈치를 엉덩이 쪽으로 가져가며 무릎을 구부려주세요',
    normalRange: { min: 0, max: 135 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_HIP,
      point2: POSE_LANDMARKS.LEFT_KNEE,
      point3: POSE_LANDMARKS.LEFT_ANKLE,
    },
  },

  // 7. 발목 배굴/저굴 (Ankle Dorsiflexion/Plantarflexion)
  {
    id: 'ankle_dorsiflexion',
    category: 'ankle',
    nameEn: 'Ankle Dorsiflexion',
    nameKo: 'Ankle Dorsiflexion',
    descriptionEn: 'Pulling toes up toward shin',
    descriptionKo: '발끝을 위로 (정강이 쪽으로)',
    guideEn: 'Pull your toes up toward your shin',
    guideKo: '발끝을 정강이 쪽으로 당겨주세요',
    normalRange: { min: 0, max: 20 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_KNEE,
      point2: POSE_LANDMARKS.LEFT_ANKLE,
      point3: POSE_LANDMARKS.LEFT_FOOT_INDEX,
    },
  },
  {
    id: 'ankle_plantarflexion',
    category: 'ankle',
    nameEn: 'Ankle Plantarflexion',
    nameKo: 'Ankle Plantarflexion',
    descriptionEn: 'Pointing toes downward',
    descriptionKo: '발끝을 아래로',
    guideEn: 'Point your toes downward',
    guideKo: '발끝을 아래로 향하게 해주세요',
    normalRange: { min: 0, max: 50 },
    side: 'left',
    cameraMeasurable: true,
    landmarks: {
      point1: POSE_LANDMARKS.LEFT_KNEE,
      point2: POSE_LANDMARKS.LEFT_ANKLE,
      point3: POSE_LANDMARKS.LEFT_FOOT_INDEX,
    },
  },
]

// 움직임 ID로 움직임 데이터 찾기
export function getMovementById(id: MovementType): JointMovement | undefined {
  return JOINT_MOVEMENTS.find((m) => m.id === id)
}

// 카테고리로 움직임 목록 찾기
export function getMovementsByCategory(category: JointCategory): JointMovement[] {
  return JOINT_MOVEMENTS.filter((m) => m.category === category)
}

// 카테고리 정보 찾기
export function getCategoryInfo(category: JointCategory): JointCategoryInfo | undefined {
  return JOINT_CATEGORIES.find((c) => c.id === category)
}

// 카메라 측정 가능한 움직임만 필터링
export function getCameraMeasurableMovements(category?: JointCategory): JointMovement[] {
  const movements = category
    ? JOINT_MOVEMENTS.filter((m) => m.category === category)
    : JOINT_MOVEMENTS
  return movements.filter((m) => m.cameraMeasurable)
}

// 오른쪽 버전의 랜드마크 인덱스 가져오기 (왼쪽 <-> 오른쪽 미러링)
export function getMirroredLandmarks(movement: JointMovement): JointMovement['landmarks'] {
  const mirrorMap: Record<number, number> = {
    [POSE_LANDMARKS.LEFT_EYE]: POSE_LANDMARKS.RIGHT_EYE,
    [POSE_LANDMARKS.RIGHT_EYE]: POSE_LANDMARKS.LEFT_EYE,
    [POSE_LANDMARKS.LEFT_EAR]: POSE_LANDMARKS.RIGHT_EAR,
    [POSE_LANDMARKS.RIGHT_EAR]: POSE_LANDMARKS.LEFT_EAR,
    [POSE_LANDMARKS.LEFT_SHOULDER]: POSE_LANDMARKS.RIGHT_SHOULDER,
    [POSE_LANDMARKS.RIGHT_SHOULDER]: POSE_LANDMARKS.LEFT_SHOULDER,
    [POSE_LANDMARKS.LEFT_ELBOW]: POSE_LANDMARKS.RIGHT_ELBOW,
    [POSE_LANDMARKS.RIGHT_ELBOW]: POSE_LANDMARKS.LEFT_ELBOW,
    [POSE_LANDMARKS.LEFT_WRIST]: POSE_LANDMARKS.RIGHT_WRIST,
    [POSE_LANDMARKS.RIGHT_WRIST]: POSE_LANDMARKS.LEFT_WRIST,
    [POSE_LANDMARKS.LEFT_HIP]: POSE_LANDMARKS.RIGHT_HIP,
    [POSE_LANDMARKS.RIGHT_HIP]: POSE_LANDMARKS.LEFT_HIP,
    [POSE_LANDMARKS.LEFT_KNEE]: POSE_LANDMARKS.RIGHT_KNEE,
    [POSE_LANDMARKS.RIGHT_KNEE]: POSE_LANDMARKS.LEFT_KNEE,
    [POSE_LANDMARKS.LEFT_ANKLE]: POSE_LANDMARKS.RIGHT_ANKLE,
    [POSE_LANDMARKS.RIGHT_ANKLE]: POSE_LANDMARKS.LEFT_ANKLE,
    [POSE_LANDMARKS.LEFT_PINKY]: POSE_LANDMARKS.RIGHT_PINKY,
    [POSE_LANDMARKS.RIGHT_PINKY]: POSE_LANDMARKS.LEFT_PINKY,
    [POSE_LANDMARKS.LEFT_INDEX]: POSE_LANDMARKS.RIGHT_INDEX,
    [POSE_LANDMARKS.RIGHT_INDEX]: POSE_LANDMARKS.LEFT_INDEX,
    [POSE_LANDMARKS.LEFT_THUMB]: POSE_LANDMARKS.RIGHT_THUMB,
    [POSE_LANDMARKS.RIGHT_THUMB]: POSE_LANDMARKS.LEFT_THUMB,
    [POSE_LANDMARKS.LEFT_HEEL]: POSE_LANDMARKS.RIGHT_HEEL,
    [POSE_LANDMARKS.RIGHT_HEEL]: POSE_LANDMARKS.LEFT_HEEL,
    [POSE_LANDMARKS.LEFT_FOOT_INDEX]: POSE_LANDMARKS.RIGHT_FOOT_INDEX,
    [POSE_LANDMARKS.RIGHT_FOOT_INDEX]: POSE_LANDMARKS.LEFT_FOOT_INDEX,
  }

  return {
    point1: mirrorMap[movement.landmarks.point1] ?? movement.landmarks.point1,
    point2: mirrorMap[movement.landmarks.point2] ?? movement.landmarks.point2,
    point3: mirrorMap[movement.landmarks.point3] ?? movement.landmarks.point3,
  }
}
