// BBS (Berg Balance Scale) Types

export interface BBSItem {
  id: number
  title: string
  titleEn: string
  instruction: string
  scores: {
    score: number
    label: string
  }[]
}

export interface BBSResult {
  id: string
  timestamp: number
  scores: Record<number, number> // itemId -> score
  totalScore: number
  riskLevel: 'high' | 'medium' | 'low'
}

// BBS 14개 항목 (실제 평가지 기준)
export const BBS_ITEMS: BBSItem[] = [
  {
    id: 1,
    title: '앉은 자세에서 일어서기',
    titleEn: 'Sitting to Standing',
    instruction: '',
    scores: [
      { score: 4, label: '손 사용하지 않고도 혼자서 안정되게 설 수 있다' },
      { score: 3, label: '손을 사용하여 혼자 설 수 있다' },
      { score: 2, label: '여러 번의 시도 끝에 손을 사용하여 설 수 있다' },
      { score: 1, label: '안정되게 서기 위해서 약간의 도움이 필요하다' },
      { score: 0, label: '일어서기 위해서 많은 도움이 필요하다' },
    ],
  },
  {
    id: 2,
    title: '지지 없이 서 있기',
    titleEn: 'Standing Unsupported',
    instruction: '2분간 서 있으세요',
    scores: [
      { score: 4, label: '2분동안 안전하게 서 있을 수 있다' },
      { score: 3, label: '감독하에 2분동안 안정되게 서 있을 수 있다' },
      { score: 2, label: '지지하지 않고 30초간 서 있을 수 있다' },
      { score: 1, label: '지지하지 않고 30초간 서기 위해서 몇차례 시도가 필요하다' },
      { score: 0, label: '도움 없이는 30초간 서 있을 수 없다' },
    ],
  },
  {
    id: 3,
    title: '지지 없이 앉아 있기',
    titleEn: 'Sitting Unsupported',
    instruction: '2분간 팔짱을 끼고 앉아 보세요',
    scores: [
      { score: 4, label: '2분간 안전하게 앉아있을 수 있다' },
      { score: 3, label: '감독하에 2분간 앉아 있을 수 있다' },
      { score: 2, label: '30초간 앉아 있을 수 있다' },
      { score: 1, label: '10초간 앉아 있을 수 있다' },
      { score: 0, label: '지지하지 않고는 10초도 앉아 있을 수 없다' },
    ],
  },
  {
    id: 4,
    title: '선 자세에서 앉기',
    titleEn: 'Standing to Sitting',
    instruction: '앉아보세요',
    scores: [
      { score: 4, label: '손을 거의 사용하지 않고도 안전하게 앉을 수 있다' },
      { score: 3, label: '손을 사용해서 조절하며 앉을 수 있다' },
      { score: 2, label: '다리를 뒤쪽 의자에 의지해서 앉는다' },
      { score: 1, label: '혼자 앉을 수 있지만, 조절하며 앉기 어렵다' },
      { score: 0, label: '앉으려면 도움이 필요하다' },
    ],
  },
  {
    id: 5,
    title: '이동하기',
    titleEn: 'Transfers',
    instruction: '',
    scores: [
      { score: 4, label: '손을 거의 사용하지 않고도 안전하게 이동할 수 있다' },
      { score: 3, label: '확실부분 손을 사용하며 안전하게 이동할 수 있다' },
      { score: 2, label: '구두지시나 감독을 통하여 이동할 수 있다' },
      { score: 1, label: '한사람의 도움이 필요하다' },
      { score: 0, label: '안전한 이동을 위해 2사람의 도움이나 감독이 필요하다' },
    ],
  },
  {
    id: 6,
    title: '눈 감고 서 있기',
    titleEn: 'Standing with Eyes Closed',
    instruction: '눈을 감고 10초간 서 보세요',
    scores: [
      { score: 4, label: '10초간 안전하게 서 있을 수 있다' },
      { score: 3, label: '감독하에 10초간 서 있을 수 있다' },
      { score: 2, label: '3초간 서 있을 수 있다' },
      { score: 1, label: '안전하게 서 있을 수 있지만, 눈을 감고는 3초도 유지하기 힘들다' },
      { score: 0, label: '도움 없이는 서 있을 수 없다' },
    ],
  },
  {
    id: 7,
    title: '두발을 모아서 서 있기',
    titleEn: 'Standing with Feet Together',
    instruction: '두발을 모아서 서보세요',
    scores: [
      { score: 4, label: '1분간 두발을 모아 혼자 서 있을 수 있다' },
      { score: 3, label: '감독하에 두발을 모아 혼자 서 있을 수 있다' },
      { score: 2, label: '두발을 모아 혼자 서 있을 수는 있지만, 30초간 유지하기는 힘들다' },
      { score: 1, label: '자세를 잡는데 도움이 필요하지만, 15초간 유지할 수 있다' },
      { score: 0, label: '자세를 잡는데 도움이 필요하고, 15초간 유지할 수도 없다' },
    ],
  },
  {
    id: 8,
    title: '팔을 들고 앞으로 뻗기',
    titleEn: 'Reaching Forward',
    instruction: '팔을 들고(90°) 손을 가능한 한 앞으로 쭉 뻗어 보세요',
    scores: [
      { score: 4, label: '자신있게 25cm 이상 앞으로 뻗는다' },
      { score: 3, label: '12cm 이상 안전하게 뻗는다' },
      { score: 2, label: '5cm 이상 안전하게 뻗는다' },
      { score: 1, label: '앞으로 뻗을 수 있지만, 감독이 필요하다' },
      { score: 0, label: '수행 시 균형을 잃기 때문에 지지해 주어야 한다' },
    ],
  },
  {
    id: 9,
    title: '바닥에서 물건 집기',
    titleEn: 'Pick Up Object from Floor',
    instruction: '바닥에 놓인 슬리퍼를 집어보세요',
    scores: [
      { score: 4, label: '안전하고 쉽게 슬리퍼를 집어 올린다' },
      { score: 3, label: '슬리퍼를 집어 올릴 수 있지만, 감독이 필요하다' },
      { score: 2, label: '집을 수 없지만, 슬리퍼에서 2-5cm 높이까지는 균형을 유지하며 손을 뻗을 수 있다' },
      { score: 1, label: '집을 수 없고, 수행하는 동안 감독이 필요하다' },
      { score: 0, label: '시도할 수 없다. 균형을 잃고 넘어지지 않도록 도움이 필요하다' },
    ],
  },
  {
    id: 10,
    title: '뒤로 돌아보기',
    titleEn: 'Turning to Look Behind',
    instruction: '양쪽 어깨 뒤를 돌아보세요',
    scores: [
      { score: 4, label: '좌우로 돌아볼 수 있으며 체중이동도 잘된다' },
      { score: 3, label: '돌아볼 때, 반대편으로 체중이동이 잘 되지 않는다' },
      { score: 2, label: '돌아보진 못하고, 좌우로만 몸을 돌릴 수 있다' },
      { score: 1, label: '감독이나 구두지시가 필요하다' },
      { score: 0, label: '몸을 돌리기 위해서 보조가 필요하다' },
    ],
  },
  {
    id: 11,
    title: '360도 회전',
    titleEn: 'Turn 360 Degrees',
    instruction: '한바퀴 돌아보세요',
    scores: [
      { score: 4, label: '양방향으로 4초 이내 안전하게 360°회전이 가능하다' },
      { score: 3, label: '한방향으로만 4초 이내 돌 수 있다' },
      { score: 2, label: '360°회전이 가능하나, 속도가 느리다' },
      { score: 1, label: '가까운 감독 또는 구두지시가 필요하다' },
      { score: 0, label: '보조가 필요하다' },
    ],
  },
  {
    id: 12,
    title: '발판에 교대로 발 올리기',
    titleEn: 'Placing Alternate Foot on Step',
    instruction: '두발을 교대로 하여 stool에 오르세요',
    scores: [
      { score: 4, label: '20초 이내 8step을 할 수 있다' },
      { score: 3, label: '8step을 완성하는데 20초 이상 시간이 걸린다' },
      { score: 2, label: '도움이나 감독 없이 4step을 할 수 있다' },
      { score: 1, label: '약간 도와주면 2step이상 할 수 있다' },
      { score: 0, label: '넘어지지 않기 위해서 보조가 필요하다' },
    ],
  },
  {
    id: 13,
    title: '일렬로 서 있기',
    titleEn: 'Standing with One Foot in Front',
    instruction: '',
    scores: [
      { score: 4, label: '양발을 앞뒤로 나란히 두고 30초간 유지할 수 있다' },
      { score: 3, label: '한발을 반대편 발 앞에 두고 30초간 유지할 수 있다' },
      { score: 2, label: '작은보폭(small step)으로 30초간 유지할 수 있다' },
      { score: 1, label: '발을 앞으로 내기 위해서 도움이 필요하지만 15초간 유지할 수 있다' },
      { score: 0, label: 'stepping이나 standing 시 균형이 무너진다' },
    ],
  },
  {
    id: 14,
    title: '한 발로 서 있기',
    titleEn: 'Standing on One Leg',
    instruction: '한발로 서보세요',
    scores: [
      { score: 4, label: '10초 이상 한발을 들고 있을 수 있다' },
      { score: 3, label: '5-10초간 한발을 들고 있을 수 있다' },
      { score: 2, label: '3초간 한발을 들고 있을 수 있다' },
      { score: 1, label: '3초간 유지하기 힘들지만, 혼자서 한발로 설 수 있다' },
      { score: 0, label: '시도할 수 없으며, 넘어지지 않도록 보조가 필요하다' },
    ],
  },
]

// BBS 점수 해석
export function interpretBBSScore(score: number): {
  riskLevel: 'high' | 'medium' | 'low'
  description: string
  descriptionEn: string
} {
  if (score <= 20) {
    return {
      riskLevel: 'high',
      description: '높은 낙상 위험 - 이동 시 도움 필요',
      descriptionEn: 'High fall risk - Requires assistance for mobility',
    }
  } else if (score <= 40) {
    return {
      riskLevel: 'medium',
      description: '중간 낙상 위험 - 보조기구 사용 권장',
      descriptionEn: 'Medium fall risk - Assistive device recommended',
    }
  } else {
    return {
      riskLevel: 'low',
      description: '낮은 낙상 위험 - 독립 보행 가능',
      descriptionEn: 'Low fall risk - Independent ambulation possible',
    }
  }
}
