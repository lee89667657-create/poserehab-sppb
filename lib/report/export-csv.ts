import type { Assessment } from '@/types/database'

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(',')
}

function getAssessmentFields(a: Assessment): {
  score: string
  detail1: string
  detail2: string
  detail3: string
  detail4: string
} {
  const d = a.details as Record<string, unknown> | null

  switch (a.assessment_type) {
    case 'BBS': {
      const riskLevel = (d?.riskLevel as string) ?? ''
      return {
        score: `${a.score ?? ''}/56`,
        detail1: riskLevel,
        detail2: '',
        detail3: '',
        detail4: '',
      }
    }
    case 'FAC': {
      return {
        score: `Level ${a.score ?? ''}`,
        detail1: '',
        detail2: '',
        detail3: '',
        detail4: '',
      }
    }
    case 'MBI': {
      const totalScore = a.score ?? 0
      const dep = Number(totalScore) >= 91 ? 'Independent' : Number(totalScore) >= 50 ? 'Partial' : 'Dependent'
      return {
        score: `${a.score ?? ''}/100`,
        detail1: dep,
        detail2: '',
        detail3: '',
        detail4: '',
      }
    }
    case 'MMT': {
      const scores = d?.scores as Record<string, { lt: number | null; rt: number | null }> | undefined
      const count = scores ? Object.keys(scores).length : 0
      return {
        score: `${count} muscles`,
        detail1: `${count}`,
        detail2: '',
        detail3: '',
        detail4: '',
      }
    }
    case 'ROM': {
      const scores = d?.scores as Record<string, unknown> | undefined
      const count = scores ? Object.keys(scores).length : 0
      return {
        score: `${count} joints`,
        detail1: `${count}`,
        detail2: '',
        detail3: '',
        detail4: '',
      }
    }
    case 'HandFunction': {
      const leftTotal = (d?.leftTotalScore as number) ?? ''
      const rightTotal = (d?.rightTotalScore as number) ?? ''
      return {
        score: `Lt.${leftTotal}/Rt.${rightTotal}`,
        detail1: `${leftTotal}`,
        detail2: `${rightTotal}`,
        detail3: '',
        detail4: '',
      }
    }
    case 'ASIA': {
      const motorTotal = (d?.motorTotal as number) ?? ''
      const lightTouchTotal = (d?.lightTouchTotal as number) ?? ''
      const pinPrickTotal = (d?.pinPrickTotal as number) ?? ''
      const aisGrade = (d?.aisGrade as string) ?? ''
      return {
        score: `Motor ${motorTotal}`,
        detail1: `${motorTotal}`,
        detail2: `${lightTouchTotal}`,
        detail3: `${pinPrickTotal}`,
        detail4: aisGrade,
      }
    }
    default:
      return {
        score: `${a.score ?? ''}`,
        detail1: '',
        detail2: '',
        detail3: '',
        detail4: '',
      }
  }
}

export function generateAssessmentsCsv(assessments: Assessment[], patientName: string): void {
  const headers = [
    '환자명 (Patient)',
    '평가일 (Date)',
    '평가유형 (Type)',
    '점수 (Score)',
    '세부1 (Detail1: riskLevel/muscleCount/jointCount/leftTotal/motorTotal)',
    '세부2 (Detail2: rightTotal/lightTouchTotal)',
    '세부3 (Detail3: pinPrickTotal)',
    '세부4 (Detail4: aisGrade)',
  ]

  const rows = assessments
    .sort((a, b) => new Date(a.assessed_at).getTime() - new Date(b.assessed_at).getTime())
    .map((a) => {
      const fields = getAssessmentFields(a)
      const dateStr = new Date(a.assessed_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      return formatRow([
        patientName,
        dateStr,
        a.assessment_type,
        fields.score,
        fields.detail1,
        fields.detail2,
        fields.detail3,
        fields.detail4,
      ])
    })

  const csvContent = '\uFEFF' + [formatRow(headers), ...rows].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${patientName}_assessments_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
