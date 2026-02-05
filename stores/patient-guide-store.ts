import { create } from 'zustand'

// 가이드 타입 정의
export type GuideType = 'bbs' | 'rom' | 'handFunction' | null

export interface GuideItem {
  type: GuideType
  id: string | number
  title: string
  titleEn: string
  instruction: string
  instructionEn: string
  duration?: number // 초 단위 (타이머 필요시)
  icon?: string // 아이콘 타입
}

// BBS 가이드 데이터
export const BBS_GUIDES: Record<number, { instruction: string; instructionEn: string; duration?: number; icon: string }> = {
  1: { instruction: '의자에서 일어나 보세요. 손을 사용하지 말고 일어나 보세요.', instructionEn: 'Stand up from the chair. Try not to use your hands.', icon: 'stand-up' },
  2: { instruction: '아무것도 잡지 말고 2분간 서 계세요.', instructionEn: 'Stand for 2 minutes without holding anything.', duration: 120, icon: 'standing' },
  3: { instruction: '팔짱을 끼고 2분간 앉아 계세요.', instructionEn: 'Sit with arms folded for 2 minutes.', duration: 120, icon: 'sitting' },
  4: { instruction: '천천히 앉아 보세요.', instructionEn: 'Please sit down slowly.', icon: 'sit-down' },
  5: { instruction: '의자에서 다른 의자로 옮겨 앉으세요. 한쪽은 팔걸이가 있는 의자, 한쪽은 없는 의자입니다.', instructionEn: 'Transfer from one chair to another. One chair has armrests, the other does not.', icon: 'transfer' },
  6: { instruction: '눈을 감고 10초간 서 계세요.', instructionEn: 'Close your eyes and stand for 10 seconds.', duration: 10, icon: 'eyes-closed' },
  7: { instruction: '두 발을 모으고 서 계세요.', instructionEn: 'Stand with your feet together.', duration: 60, icon: 'feet-together' },
  8: { instruction: '팔을 90도로 들고, 손끝을 가능한 한 앞으로 쭉 뻗어 보세요.', instructionEn: 'Raise your arms to 90 degrees and reach forward as far as you can.', icon: 'reach-forward' },
  9: { instruction: '발 앞에 놓인 물건을 주워 보세요.', instructionEn: 'Pick up the object placed in front of your feet.', icon: 'pick-up' },
  10: { instruction: '왼쪽 어깨 너머로 뒤를 돌아보세요. 오른쪽도 해 보세요.', instructionEn: 'Turn to look behind over your left shoulder. Then try the right side.', icon: 'look-behind' },
  11: { instruction: '제자리에서 한 바퀴 돌아 보세요. 반대 방향으로도 한 바퀴 돌아 보세요.', instructionEn: 'Turn a full circle in place. Then turn in the opposite direction.', icon: 'turn-360' },
  12: { instruction: '발판 위에 발을 번갈아 올려 보세요.', instructionEn: 'Place each foot alternately on the step.', icon: 'step-up' },
  13: { instruction: '한 발을 다른 발 바로 앞에 놓고 서 보세요.', instructionEn: 'Place one foot directly in front of the other and stand.', duration: 30, icon: 'tandem' },
  14: { instruction: '잡지 말고 한 발로 서 보세요.', instructionEn: 'Stand on one leg without holding anything.', duration: 10, icon: 'one-leg' },
}

// Hand Function 가이드 데이터
export const HAND_FUNCTION_GUIDES: Record<string, { instruction: string; instructionEn: string; icon: string }> = {
  grip_strength: { instruction: '악력계를 최대한 세게 쥐세요', instructionEn: 'Squeeze the dynamometer as hard as you can', icon: 'grip' },
  pinch_lateral: { instruction: '엄지와 검지 측면으로 집어 주세요', instructionEn: 'Pinch with thumb and side of index finger', icon: 'lateral-pinch' },
  pinch_threejaw: { instruction: '엄지, 검지, 중지로 집어 주세요', instructionEn: 'Pinch with thumb, index, and middle finger', icon: 'three-jaw' },
  pinch_tip: { instruction: '엄지와 검지 끝으로 집어 주세요', instructionEn: 'Pinch with fingertips of thumb and index', icon: 'tip-pinch' },
  arm_forward: { instruction: '팔을 앞으로 올려 주세요', instructionEn: 'Raise your arm forward', icon: 'arm-forward' },
  arm_lateral: { instruction: '팔을 옆으로 올려 주세요', instructionEn: 'Raise your arm to the side', icon: 'arm-lateral' },
  hand_to_head: { instruction: '손바닥을 뒷머리에 대 주세요', instructionEn: 'Place your palm on the back of your head', icon: 'hand-head' },
  hand_to_back: { instruction: '손바닥을 등에 대 주세요', instructionEn: 'Place your palm on your back', icon: 'hand-back' },
  grasp: { instruction: '물건을 쥐어 주세요', instructionEn: 'Grasp the object', icon: 'grasp' },
  pinch: { instruction: '물건을 집어 주세요', instructionEn: 'Pinch the object', icon: 'pinch' },
  cube_transfer: { instruction: '입방체를 옮겨 주세요', instructionEn: 'Transfer the cubes', icon: 'cube' },
  pegboard: { instruction: '페그보드에 핀을 꽂아 주세요', instructionEn: 'Insert pegs into the pegboard', icon: 'pegboard' },
}

interface PatientGuideState {
  // 현재 가이드 상태
  currentGuide: GuideItem | null
  isActive: boolean
  timerSeconds: number
  isTimerRunning: boolean

  // Actions
  setGuide: (guide: GuideItem | null) => void
  setBBSGuide: (itemId: number, title: string, titleEn: string) => void
  setROMGuide: (movementId: string, title: string, titleEn: string, instruction: string, instructionEn: string) => void
  setHandFunctionGuide: (itemId: string, title: string, titleEn: string) => void
  clearGuide: () => void
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  tickTimer: () => void
}

// BroadcastChannel을 통한 탭 간 동기화
const channel = typeof window !== 'undefined' ? new BroadcastChannel('patient-guide-sync') : null

// 브로드캐스트 (다른 탭에 상태 전달)
type GuideStatePayload = {
  currentGuide: GuideItem | null
  isActive: boolean
  timerSeconds: number
  isTimerRunning: boolean
}

function broadcast(state: GuideStatePayload) {
  try {
    channel?.postMessage({ type: 'guide-update', data: state })
    console.log('[PatientGuide] 브로드캐스트 전송:', state.currentGuide?.title || 'clear')
  } catch {
    // BroadcastChannel 오류 무시
  }
}

export const usePatientGuideStore = create<PatientGuideState>()((set, get) => {
  // 다른 탭에서 보낸 메시지 수신
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data?.type === 'guide-update') {
        console.log('[PatientGuide] 브로드캐스트 수신:', event.data.data?.currentGuide?.title || 'clear')
        set(event.data.data)
      }
    }
  }

  return {
    currentGuide: null,
    isActive: false,
    timerSeconds: 0,
    isTimerRunning: false,

    setGuide: (guide) => {
      const newState = {
        currentGuide: guide,
        isActive: guide !== null,
        timerSeconds: guide?.duration || 0,
        isTimerRunning: false,
      }
      set(newState)
      broadcast(newState)
    },

    setBBSGuide: (itemId, title, titleEn) => {
      const guideData = BBS_GUIDES[itemId]
      if (guideData) {
        console.log('[PatientGuide] setBBSGuide 호출:', itemId, title)
        const newState = {
          currentGuide: {
            type: 'bbs' as GuideType,
            id: itemId,
            title,
            titleEn,
            instruction: guideData.instruction,
            instructionEn: guideData.instructionEn,
            duration: guideData.duration,
            icon: guideData.icon,
          },
          isActive: true,
          timerSeconds: guideData.duration || 0,
          isTimerRunning: false,
        }
        set(newState)
        broadcast(newState)
      }
    },

    setROMGuide: (movementId, title, titleEn, instruction, instructionEn) => {
      const newState = {
        currentGuide: {
          type: 'rom' as GuideType,
          id: movementId,
          title,
          titleEn,
          instruction,
          instructionEn,
          icon: 'rom',
        },
        isActive: true,
        timerSeconds: 0,
        isTimerRunning: false,
      }
      set(newState)
      broadcast(newState)
    },

    setHandFunctionGuide: (itemId, title, titleEn) => {
      const guideData = HAND_FUNCTION_GUIDES[itemId]
      if (guideData) {
        const newState = {
          currentGuide: {
            type: 'handFunction' as GuideType,
            id: itemId,
            title,
            titleEn,
            instruction: guideData.instruction,
            instructionEn: guideData.instructionEn,
            icon: guideData.icon,
          },
          isActive: true,
          timerSeconds: 0,
          isTimerRunning: false,
        }
        set(newState)
        broadcast(newState)
      }
    },

    clearGuide: () => {
      console.log('[PatientGuide] clearGuide 호출')
      const newState = {
        currentGuide: null,
        isActive: false,
        timerSeconds: 0,
        isTimerRunning: false,
      }
      set(newState)
      broadcast(newState)
    },

    startTimer: () => {
      set({ isTimerRunning: true })
    },

    stopTimer: () => {
      set({ isTimerRunning: false })
    },

    resetTimer: () => {
      const { currentGuide } = get()
      set({
        timerSeconds: currentGuide?.duration || 0,
        isTimerRunning: false,
      })
    },

    tickTimer: () => {
      const { timerSeconds, isTimerRunning } = get()
      if (isTimerRunning && timerSeconds > 0) {
        set({ timerSeconds: timerSeconds - 1 })
      } else if (timerSeconds === 0) {
        set({ isTimerRunning: false })
      }
    },
  }
})
