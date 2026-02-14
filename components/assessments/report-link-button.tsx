'use client'

import { useRouter } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useTranslation } from '@/hooks/use-translation'

interface ReportLinkButtonProps {
  show: boolean
}

export function ReportLinkButton({ show }: ReportLinkButtonProps) {
  const router = useRouter()
  const { language } = useTranslation()
  const { selectedPatientId } = usePatientContextStore()

  if (!show) return null

  const href = selectedPatientId
    ? `/reports?patient=${selectedPatientId}`
    : '/reports'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push(href)}
      className="gap-2 h-9 text-sm border-primary/30 text-primary hover:bg-primary/5"
    >
      <BarChart3 className="h-3.5 w-3.5" />
      {language === 'ko' ? '리포트에 반영' : 'View in Report'}
    </Button>
  )
}
