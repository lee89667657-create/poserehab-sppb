'use client'

import { useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Save, FileDown, Trash2, ArrowLeft, User } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SoapForm } from '@/components/soap/soap-form'
import { useSoapStore } from '@/stores/soap-store'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useTranslation } from '@/hooks/use-translation'

function SoapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useTranslation()
  const { subjective, objective, assessment, plan, clearForm } = useSoapStore()
  const {
    selectedPatientId,
    selectedPatientName,
    selectedPatientAge,
    selectedPatientGender,
    selectedPatientDiagnosis,
  } = usePatientContextStore()

  const patientIdParam = searchParams.get('patient')
  const hasPatientContext = patientIdParam && selectedPatientId === patientIdParam && selectedPatientName

  const handleSave = useCallback(() => {
    const soapData = {
      patientId: hasPatientContext ? selectedPatientId : undefined,
      patientName: hasPatientContext ? selectedPatientName : undefined,
      subjective,
      objective,
      assessment,
      plan,
      timestamp: Date.now(),
    }
    const blob = new Blob([JSON.stringify(soapData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const prefix = hasPatientContext ? `${selectedPatientName}_` : ''
    a.download = `${prefix}soap-notes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [subjective, objective, assessment, plan, hasPatientContext, selectedPatientId, selectedPatientName])

  const handleExportText = useCallback(() => {
    const lines = [
      '=== SOAP Notes ===',
      `Date: ${new Date().toLocaleDateString('ko-KR')}`,
      ...(hasPatientContext
        ? [
            `Patient: ${selectedPatientName} (${selectedPatientAge}세/${selectedPatientGender})`,
            `Diagnosis: ${selectedPatientDiagnosis}`,
          ]
        : []),
      '',
      '--- S (Subjective) ---',
      `Chief Complaint: ${subjective.chiefComplaint}`,
      `Pain Scale: ${subjective.painScale}/10`,
      `Symptoms: ${subjective.symptomDescription}`,
      `Pain Location: ${subjective.painLocation}`,
      `Onset: ${subjective.onset}`,
      `Aggravating: ${subjective.aggravating}`,
      `Relieving: ${subjective.relieving}`,
      '',
      '--- O (Objective) ---',
      `Auto Findings: ${objective.autoFindings}`,
      `ROM: ${objective.rom}`,
      `MMT: ${objective.mmt}`,
      `Special Tests: ${objective.specialTests}`,
      `Palpation: ${objective.palpation}`,
      `Gait: ${objective.gait}`,
      `Additional: ${objective.additionalFindings}`,
      '',
      '--- A (Assessment) ---',
      `Clinical Impression: ${assessment.clinicalImpression}`,
      `Progress Level: ${assessment.progressLevel}`,
      `Functional Level: ${assessment.functionalLevel}`,
      `Goals: ${assessment.goals}`,
      '',
      '--- P (Plan) ---',
      `Treatment: ${plan.treatment}`,
      `HEP: ${plan.hep}`,
      `Frequency: ${plan.frequency}`,
      `Duration: ${plan.duration}`,
      `Next Visit: ${plan.nextVisit}`,
      `Precautions: ${plan.precautions}`,
      `Referral: ${plan.referral}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const prefix = hasPatientContext ? `${selectedPatientName}_` : ''
    a.download = `${prefix}soap-notes-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [subjective, objective, assessment, plan, hasPatientContext, selectedPatientName, selectedPatientAge, selectedPatientGender, selectedPatientDiagnosis])

  return (
    <MainLayout title={language === 'ko' ? 'SOAP 기록' : 'SOAP Notes'}>
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Patient Context Banner */}
        {hasPatientContext && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{selectedPatientName}</span>
                  <span className="text-xs text-text-secondary">
                    {selectedPatientAge}세 / {selectedPatientGender}
                  </span>
                </div>
                {selectedPatientDiagnosis && (
                  <p className="text-xs text-text-secondary">{selectedPatientDiagnosis}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/patients/${selectedPatientId}`)}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {language === 'ko' ? '환자 상세' : 'Patient Detail'}
              </Button>
            </CardContent>
          </Card>
        )}

        <SoapForm />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave}>
            <Save className="mr-1.5 h-4 w-4" />
            {language === 'ko' ? 'JSON 저장' : 'Save JSON'}
          </Button>
          <Button variant="outline" onClick={handleExportText}>
            <FileDown className="mr-1.5 h-4 w-4" />
            {language === 'ko' ? '텍스트 내보내기' : 'Export Text'}
          </Button>
          <Button variant="destructive" onClick={clearForm}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            {language === 'ko' ? '초기화' : 'Clear'}
          </Button>
          {hasPatientContext && (
            <Button
              variant="outline"
              onClick={() => router.push(`/patients/${selectedPatientId}`)}
              className="ml-auto"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {language === 'ko' ? '환자 상세로 돌아가기' : 'Back to Patient'}
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default function SoapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <SoapContent />
    </Suspense>
  )
}
