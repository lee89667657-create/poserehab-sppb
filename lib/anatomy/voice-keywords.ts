// voice-keywords.ts - Korean medical keyword extraction for voice input

export const KEYWORD_CATEGORIES: Record<string, string[]> = {
  '통증 양상': [
    '통증', '아프', '쑤시', '찌르는', '뻐근', '욱신', '화끈', '저림', '저리',
    '시림', '둔통', '방사통', '이질통', '작열감', '압통', '당기', '뻣뻣', '결리', '쥐가',
  ],
  '부위': [
    '허리', '목', '어깨', '무릎', '골반', '등', '팔', '다리', '손목', '발목',
    '엉덩이', '가슴', '두통', '머리', '손', '발', '종아리', '허벅지', '팔꿈치',
    '척추', '디스크', '관절', '근육', '힘줄', '인대',
  ],
  '시기·빈도': [
    '아침', '저녁', '밤', '새벽', '오래', '갑자기', '서서히', '점점', '항상',
    '가끔', '자주', '매일', '최근', '어제', '오늘', '지난주', '지난달', '몇 달', '몇 년',
  ],
  '악화·완화': [
    '앉을 때', '서있을 때', '걸을 때', '눕을 때', '구부릴 때', '돌릴 때', '들 때',
    '계단', '운동', '스트레칭', '휴식', '찜질', '약', '주사', '마사지', '잠잘 때',
  ],
  '정도': [
    '심하', '약간', '많이', '조금', '극심', '참을 수 없', '견딜 수 없',
    '불편', '호전', '악화', '나아', '심해',
  ],
}

/**
 * Extract keywords from transcribed text and group by category.
 */
export function extractKeywords(text: string): Map<string, string[]> {
  const result = new Map<string, string[]>()

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    const matched: string[] = []
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matched.push(keyword)
      }
    }
    if (matched.length > 0) {
      result.set(category, matched)
    }
  }

  return result
}

/**
 * Generate auto-fill suggestions for SOAP Subjective fields based on detected tags.
 */
export function getAutoFillSuggestions(tags: Map<string, string[]>): Record<string, string> {
  const suggestions: Record<string, string> = {}

  // Pain location from '부위'
  const bodyParts = tags.get('부위')
  if (bodyParts && bodyParts.length > 0) {
    suggestions.painLocation = bodyParts.join(', ')
  }

  // Symptom description from '통증 양상'
  const painTypes = tags.get('통증 양상')
  if (painTypes && painTypes.length > 0) {
    suggestions.symptomDescription = painTypes.join(', ')
  }

  // Onset from '시기·빈도'
  const timing = tags.get('시기·빈도')
  if (timing && timing.length > 0) {
    suggestions.onset = timing.join(', ')
  }

  // Aggravating factors from '악화·완화'
  const factors = tags.get('악화·완화')
  if (factors && factors.length > 0) {
    suggestions.aggravating = factors.join(', ')
  }

  // Chief complaint: combine pain type + body part
  const parts: string[] = []
  if (bodyParts && bodyParts.length > 0) parts.push(bodyParts[0])
  if (painTypes && painTypes.length > 0) parts.push(painTypes[0])
  if (parts.length > 0) {
    suggestions.chiefComplaint = parts.join(' ')
  }

  return suggestions
}
