import jsPDF from 'jspdf'
import type { PostureAnalysisResult } from '@/types/posture'
import type { ExerciseRecord } from '@/types/exercise'
import type { PainPrediction } from '@/lib/prediction'
import type { BBSResult } from '@/types/bbs'
import type { FACResult, MBIResult, MMTResult, ROMResult, HandFunctionResult } from '@/types/assessments'

interface ReportData {
  userName: string
  analysis: PostureAnalysisResult
  exerciseRecords: ExerciseRecord[]
  painPredictions: PainPrediction[]
  language: 'ko' | 'en'
}

export interface ComparisonReportData {
  language: 'ko' | 'en'
  bbs: { history: BBSResult[] }
  fac: { history: FACResult[] }
  mbi: { history: MBIResult[] }
  mmt: { history: MMTResult[] }
  rom: { history: ROMResult[] }
  hand: { history: HandFunctionResult[] }
}

const COLORS = {
  primary: [99, 102, 241] as [number, number, number],
  secondary: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  text: [17, 24, 39] as [number, number, number],
  textSecondary: [107, 114, 128] as [number, number, number],
  background: [250, 250, 250] as [number, number, number],
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.secondary
  if (score >= 60) return COLORS.warning
  return COLORS.error
}

export async function generatePdfReport(data: ReportData): Promise<Blob> {
  const { userName, analysis, exerciseRecords, painPredictions, language } = data
  const isKo = language === 'ko'

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Helper functions
  const addText = (
    text: string,
    x: number,
    y: number,
    options?: {
      fontSize?: number
      fontStyle?: 'normal' | 'bold'
      color?: [number, number, number]
      align?: 'left' | 'center' | 'right'
    }
  ) => {
    const { fontSize = 10, fontStyle = 'normal', color = COLORS.text, align = 'left' } = options || {}
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)
    doc.text(text, x, y, { align })
  }

  const addLine = (y: number) => {
    doc.setDrawColor(229, 231, 235)
    doc.line(margin, y, pageWidth - margin, y)
  }

  const addSection = (title: string) => {
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }
    yPos += 10
    addText(title, margin, yPos, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary })
    yPos += 8
    addLine(yPos)
    yPos += 8
  }

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  addText('PostureAI', pageWidth / 2, 18, {
    fontSize: 24,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'center',
  })
  addText(
    isKo ? '자세 분석 리포트' : 'Posture Analysis Report',
    pageWidth / 2,
    28,
    {
      fontSize: 12,
      color: [255, 255, 255],
      align: 'center',
    }
  )

  yPos = 55

  // User Info & Date
  addText(isKo ? '사용자' : 'User', margin, yPos, { fontStyle: 'bold' })
  addText(userName || (isKo ? '익명' : 'Anonymous'), margin + 25, yPos)

  addText(isKo ? '날짜' : 'Date', pageWidth / 2, yPos, { fontStyle: 'bold' })
  addText(new Date(analysis.timestamp).toLocaleDateString(), pageWidth / 2 + 20, yPos)

  yPos += 5
  addLine(yPos)
  yPos += 10

  // Overall Score
  addSection(isKo ? '전체 자세 점수' : 'Overall Posture Score')

  const scoreColor = getScoreColor(analysis.overallScore)
  doc.setFillColor(...scoreColor)
  doc.roundedRect(margin, yPos, 40, 25, 3, 3, 'F')

  addText(analysis.overallScore.toString(), margin + 20, yPos + 16, {
    fontSize: 20,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'center',
  })

  const scoreLabel =
    analysis.overallScore >= 80
      ? isKo ? '양호' : 'Good'
      : analysis.overallScore >= 60
      ? isKo ? '주의' : 'Warning'
      : isKo ? '개선 필요' : 'Needs Improvement'

  addText(scoreLabel, margin + 50, yPos + 10, {
    fontSize: 14,
    fontStyle: 'bold',
    color: scoreColor,
  })

  addText(
    isKo
      ? `분석 방향: ${analysis.direction === 'front' ? '정면' : analysis.direction === 'side' ? '측면' : '후면'}`
      : `Analysis Direction: ${analysis.direction}`,
    margin + 50,
    yPos + 20,
    { color: COLORS.textSecondary }
  )

  yPos += 35

  // Body Parts Analysis
  addSection(isKo ? '부위별 분석' : 'Body Part Analysis')

  const bodyParts = Object.entries(analysis.bodyParts)
  const partWidth = contentWidth / 2 - 5

  bodyParts.forEach(([key, part], index) => {
    if (!part) return

    const x = margin + (index % 2) * (partWidth + 10)
    const localY = yPos + Math.floor(index / 2) * 25

    if (localY > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }

    const partColor = getScoreColor(part.score)

    doc.setFillColor(partColor[0], partColor[1], partColor[2], 0.1)
    doc.roundedRect(x, localY - 5, partWidth, 20, 2, 2, 'F')

    addText(isKo ? part.nameKo : part.name, x + 5, localY + 3, { fontStyle: 'bold' })
    addText(`${part.score}%`, x + partWidth - 25, localY + 3, {
      fontStyle: 'bold',
      color: partColor,
    })

    if (part.feedback) {
      addText(
        (isKo ? part.feedbackKo : part.feedback).slice(0, 40),
        x + 5,
        localY + 10,
        { fontSize: 8, color: COLORS.textSecondary }
      )
    }
  })

  yPos += Math.ceil(bodyParts.length / 2) * 25 + 10

  // Detected Issues
  if (analysis.postureTypes && analysis.postureTypes.length > 0) {
    addSection(isKo ? '감지된 자세 문제' : 'Detected Posture Issues')

    const postureLabels: Record<string, { en: string; ko: string }> = {
      forward_head: { en: 'Forward Head', ko: '거북목' },
      rounded_shoulders: { en: 'Rounded Shoulders', ko: '둥근 어깨' },
      kyphosis: { en: 'Kyphosis', ko: '척추후만증' },
      lordosis: { en: 'Lordosis', ko: '척추전만증' },
      scoliosis: { en: 'Scoliosis', ko: '척추측만증' },
      pelvic_tilt: { en: 'Pelvic Tilt', ko: '골반 기울어짐' },
      bow_legs: { en: 'Bow Legs', ko: 'O자 다리' },
      knock_knees: { en: 'Knock Knees', ko: 'X자 다리' },
    }

    analysis.postureTypes
      .filter((p) => p !== 'normal')
      .forEach((postureType, index) => {
        const label = postureLabels[postureType]
        if (label) {
          addText(`• ${isKo ? label.ko : label.en}`, margin + 5, yPos, {
            color: COLORS.error,
          })
          yPos += 6
        }
      })

    yPos += 5
  }

  // Pain Predictions
  if (painPredictions.length > 0) {
    addSection(isKo ? '통증 위험 예측' : 'Pain Risk Predictions')

    painPredictions.slice(0, 5).forEach((prediction) => {
      const riskColor =
        prediction.riskLevel === 'high'
          ? COLORS.error
          : prediction.riskLevel === 'medium'
          ? COLORS.warning
          : COLORS.secondary

      addText(`• ${isKo ? prediction.areaKo : prediction.area}`, margin + 5, yPos, {
        fontStyle: 'bold',
      })
      addText(`${prediction.probability}%`, margin + 60, yPos, {
        color: riskColor,
        fontStyle: 'bold',
      })
      addText(
        `(${
          prediction.riskLevel === 'high'
            ? isKo ? '높음' : 'High'
            : prediction.riskLevel === 'medium'
            ? isKo ? '중간' : 'Medium'
            : isKo ? '낮음' : 'Low'
        })`,
        margin + 80,
        yPos,
        { color: riskColor }
      )
      yPos += 6
    })

    yPos += 5
  }

  // Exercise Statistics
  if (exerciseRecords.length > 0) {
    addSection(isKo ? '운동 통계' : 'Exercise Statistics')

    const totalSessions = exerciseRecords.length
    const totalTime = exerciseRecords.reduce((sum, r) => sum + r.duration, 0)
    const avgAccuracy =
      exerciseRecords.reduce((sum, r) => sum + r.averageAccuracy, 0) / totalSessions

    addText(isKo ? '총 운동 횟수:' : 'Total Sessions:', margin + 5, yPos, {
      fontStyle: 'bold',
    })
    addText(totalSessions.toString(), margin + 50, yPos)
    yPos += 6

    addText(isKo ? '총 운동 시간:' : 'Total Time:', margin + 5, yPos, {
      fontStyle: 'bold',
    })
    addText(`${Math.round(totalTime / 60)} ${isKo ? '분' : 'min'}`, margin + 50, yPos)
    yPos += 6

    addText(isKo ? '평균 정확도:' : 'Average Accuracy:', margin + 5, yPos, {
      fontStyle: 'bold',
    })
    addText(`${avgAccuracy.toFixed(1)}%`, margin + 50, yPos)
    yPos += 10
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    addSection(isKo ? '추천 운동' : 'Recommended Exercises')

    analysis.recommendations.slice(0, 3).forEach((rec) => {
      addText(`• ${isKo ? rec.titleKo : rec.title}`, margin + 5, yPos, {
        fontStyle: 'bold',
      })
      yPos += 5
      addText(
        (isKo ? rec.descriptionKo : rec.description).slice(0, 80),
        margin + 10,
        yPos,
        { fontSize: 9, color: COLORS.textSecondary }
      )
      yPos += 8
    })
  }

  // Footer
  const footerY = pageHeight - 15
  addLine(footerY - 5)
  addText(
    isKo
      ? 'PostureAI에서 생성됨 • 이 리포트는 참고용이며 의료 조언을 대체하지 않습니다.'
      : 'Generated by PostureAI • This report is for reference only and does not replace medical advice.',
    pageWidth / 2,
    footerY,
    { fontSize: 8, color: COLORS.textSecondary, align: 'center' }
  )

  return doc.output('blob')
}

export async function generateComparisonPdfReport(data: ComparisonReportData): Promise<Blob> {
  const { language, bbs, fac, mbi, mmt, rom, hand } = data
  const isKo = language === 'ko'

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  const addText = (
    text: string,
    x: number,
    y: number,
    options?: {
      fontSize?: number
      fontStyle?: 'normal' | 'bold'
      color?: [number, number, number]
      align?: 'left' | 'center' | 'right'
    }
  ) => {
    const { fontSize = 10, fontStyle = 'normal', color = COLORS.text, align = 'left' } = options || {}
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(...color)
    doc.text(text, x, y, { align })
  }

  const addLine = (y: number) => {
    doc.setDrawColor(229, 231, 235)
    doc.line(margin, y, pageWidth - margin, y)
  }

  const addSection = (title: string) => {
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }
    yPos += 10
    addText(title, margin, yPos, { fontSize: 14, fontStyle: 'bold', color: COLORS.primary })
    yPos += 8
    addLine(yPos)
    yPos += 8
  }

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 20) {
      doc.addPage()
      yPos = margin
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const addComparisonRow = (label: string, prev: string, curr: string, diff: number, unit?: string) => {
    checkPageBreak(12)
    addText(label, margin + 5, yPos, { fontStyle: 'bold' })
    addText(prev, margin + 60, yPos, { color: COLORS.textSecondary })
    addText(' → ', margin + 90, yPos, { color: COLORS.textSecondary })
    addText(curr, margin + 100, yPos, { fontStyle: 'bold' })

    const diffStr = diff > 0 ? `+${diff}` : `${diff}`
    const diffColor: [number, number, number] = diff > 0 ? COLORS.secondary : diff < 0 ? COLORS.error : COLORS.textSecondary
    addText(`(${diffStr}${unit || ''})`, margin + 130, yPos, { color: diffColor, fontStyle: 'bold' })
    yPos += 7
  }

  // === Header ===
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  addText('PoseRehab', pageWidth / 2, 18, {
    fontSize: 24,
    fontStyle: 'bold',
    color: [255, 255, 255],
    align: 'center',
  })
  addText(
    isKo ? '평가 전후 비교 리포트' : 'Assessment Comparison Report',
    pageWidth / 2,
    28,
    { fontSize: 12, color: [255, 255, 255], align: 'center' }
  )

  yPos = 50

  addText(isKo ? '생성일' : 'Date', margin, yPos, { fontStyle: 'bold' })
  addText(new Date().toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 25, yPos)
  yPos += 5
  addLine(yPos)
  yPos += 5

  // === BBS Section ===
  if (bbs.history.length >= 2) {
    addSection(`BBS (Berg Balance Scale) — 0-56`)
    const sorted = [...bbs.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]
    const diff = curr.totalScore - prev.totalScore

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    const getRiskLabel = (score: number) => {
      if (score <= 20) return isKo ? '높은 위험' : 'High Risk'
      if (score <= 40) return isKo ? '중간 위험' : 'Medium Risk'
      return isKo ? '낮은 위험' : 'Low Risk'
    }

    addComparisonRow(isKo ? '점수' : 'Score', `${prev.totalScore}/56`, `${curr.totalScore}/56`, diff)
    addText(`${isKo ? '위험도' : 'Risk'}: ${getRiskLabel(prev.totalScore)} → ${getRiskLabel(curr.totalScore)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 10
  } else if (bbs.history.length === 1) {
    addSection('BBS (Berg Balance Scale)')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === FAC Section ===
  if (fac.history.length >= 2) {
    addSection(`FAC (Functional Ambulation) — Level 0-5`)
    const sorted = [...fac.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]
    const diff = curr.level - prev.level

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    addComparisonRow(isKo ? '보행 수준' : 'Level', `Level ${prev.level}`, `Level ${curr.level}`, diff)
    yPos += 5
  } else if (fac.history.length === 1) {
    addSection('FAC (Functional Ambulation)')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === MBI Section ===
  if (mbi.history.length >= 2) {
    addSection(`MBI (Modified Barthel Index) — 0-100`)
    const sorted = [...mbi.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]
    const diff = curr.totalScore - prev.totalScore

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    const getDepLabel = (score: number) => {
      if (score >= 91) return isKo ? '독립' : 'Independent'
      if (score >= 50) return isKo ? '부분의존' : 'Partial Dependency'
      return isKo ? '의존' : 'Dependent'
    }

    addComparisonRow(isKo ? '점수' : 'Score', `${prev.totalScore}/100`, `${curr.totalScore}/100`, diff)
    addText(`${isKo ? '의존도' : 'Dependency'}: ${getDepLabel(prev.totalScore)} → ${getDepLabel(curr.totalScore)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 10
  } else if (mbi.history.length === 1) {
    addSection('MBI (Modified Barthel Index)')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === MMT Section ===
  if (mmt.history.length >= 2) {
    addSection(`MMT (Manual Muscle Testing) — Grade 0-5`)
    const sorted = [...mmt.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    const gradeNames: Record<number, string> = { 0: 'Zero', 1: 'Trace', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Normal' }
    const countGoodPlus = (scores: Record<string, { lt: number | null; rt: number | null }>) => {
      return Object.values(scores).filter(s => (s.lt ?? 0) >= 4 && (s.rt ?? 0) >= 4).length
    }

    const prevGood = countGoodPlus(prev.scores)
    const currGood = countGoodPlus(curr.scores)
    const currCount = Object.keys(curr.scores).length

    addComparisonRow(
      isKo ? 'Good 이상' : 'Good+',
      `${prevGood}/${Object.keys(prev.scores).length}`,
      `${currGood}/${currCount}`,
      currGood - prevGood
    )

    // 부위별 등급 표시
    Object.entries(curr.scores).forEach(([key, s]) => {
      const prevS = prev.scores[key]
      const name = key.replace(/_/g, ' ')
      const currLt = s.lt !== null ? Math.round(s.lt) : null
      const currRt = s.rt !== null ? Math.round(s.rt) : null
      const prevLt = prevS?.lt !== null ? Math.round(prevS?.lt ?? 0) : null
      const prevRt = prevS?.rt !== null ? Math.round(prevS?.rt ?? 0) : null
      addText(`${name}: Lt ${gradeNames[prevLt ?? 0] ?? '-'}→${gradeNames[currLt ?? 0] ?? '-'}, Rt ${gradeNames[prevRt ?? 0] ?? '-'}→${gradeNames[currRt ?? 0] ?? '-'}`, margin + 5, yPos, { fontSize: 8, color: COLORS.textSecondary })
      yPos += 5
    })
    yPos += 5
  } else if (mmt.history.length === 1) {
    addSection('MMT (Manual Muscle Testing)')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === Hand Function Section ===
  if (hand.history.length >= 2) {
    addSection(isKo ? '손기능 검사 (Hand Function)' : 'Hand Function Test')
    const sorted = [...hand.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    addComparisonRow(
      isKo ? '좌측' : 'Left',
      `${prev.leftTotalScore}`,
      `${curr.leftTotalScore}`,
      curr.leftTotalScore - prev.leftTotalScore
    )
    addComparisonRow(
      isKo ? '우측' : 'Right',
      `${prev.rightTotalScore}`,
      `${curr.rightTotalScore}`,
      curr.rightTotalScore - prev.rightTotalScore
    )
    yPos += 5
  } else if (hand.history.length === 1) {
    addSection(isKo ? '손기능 검사' : 'Hand Function Test')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === ROM Section ===
  if (rom.history.length >= 2) {
    addSection(`ROM (Range of Motion)`)
    const sorted = [...rom.history].sort((a, b) => a.timestamp - b.timestamp)
    const prev = sorted[sorted.length - 2]
    const curr = sorted[sorted.length - 1]

    addText(`${isKo ? '이전' : 'Previous'}: ${formatDate(prev.timestamp)}`, margin + 5, yPos, { fontSize: 9, color: COLORS.textSecondary })
    addText(`${isKo ? '최근' : 'Latest'}: ${formatDate(curr.timestamp)}`, margin + 80, yPos, { fontSize: 9, color: COLORS.textSecondary })
    yPos += 7

    const prevCount = Object.keys(prev.scores).length
    const currCount = Object.keys(curr.scores).length
    addText(`${isKo ? '측정 관절 수' : 'Joints measured'}: ${prevCount} → ${currCount}`, margin + 5, yPos, { fontStyle: 'bold' })
    yPos += 10
  } else if (rom.history.length === 1) {
    addSection('ROM (Range of Motion)')
    addText(isKo ? '다음 평가 후 비교 가능합니다.' : 'Comparison available after next assessment.', margin + 5, yPos, { color: COLORS.textSecondary })
    yPos += 10
  }

  // === Footer ===
  const footerY = pageHeight - 15
  addLine(footerY - 5)
  addText(
    isKo
      ? 'PoseRehab에서 생성됨 • 이 리포트는 참고용이며 의료 조언을 대체하지 않습니다.'
      : 'Generated by PoseRehab • This report is for reference only and does not replace medical advice.',
    pageWidth / 2,
    footerY,
    { fontSize: 8, color: COLORS.textSecondary, align: 'center' }
  )

  return doc.output('blob')
}

export function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
