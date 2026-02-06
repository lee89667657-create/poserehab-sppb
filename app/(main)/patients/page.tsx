'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  User,
  Heart,
  Calendar,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { useAuth } from '@/hooks/use-auth'
import { usePatients } from '@/hooks/use-patients'
import { useTranslation } from '@/hooks/use-translation'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { cn } from '@/lib/utils'
import type { PatientStatus } from '@/types/database'

const STATUS_LABELS: Record<PatientStatus, { ko: string; en: string; color: string }> = {
  active: { ko: '입원중', en: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  discharged: { ko: '퇴원', en: 'Discharged', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
  outpatient: { ko: '외래', en: 'Outpatient', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
}

const DIAGNOSIS_PRESETS = ['뇌졸중', '외상성뇌손상', '척수손상', '파킨슨', '기타']

type FilterStatus = 'all' | PatientStatus

export default function PatientsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { patients, isLoading, addPatient, deletePatient } = usePatients(user?.id)
  const { language } = useTranslation()
  const { setSelectedPatient } = usePatientContextStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 새 환자 폼
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: '남' as '남' | '여',
    diagnosis: '' as string,
    diagnosisCustom: '',
    onset_date: '',
    admission_date: new Date().toISOString().split('T')[0],
    status: 'active' as PatientStatus,
    history: '',
  })

  // 필터링
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.includes(searchQuery) || p.diagnosis.includes(searchQuery)
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const finalDiagnosis = newPatient.diagnosis === '기타' ? newPatient.diagnosisCustom : newPatient.diagnosis

  const handleAddPatient = async () => {
    if (!newPatient.name || !finalDiagnosis || !newPatient.age) return
    setIsSubmitting(true)
    try {
      await addPatient({
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        diagnosis: finalDiagnosis,
        onset_date: newPatient.onset_date || null,
        admission_date: newPatient.admission_date,
        status: newPatient.status,
        history: newPatient.history || null,
      })
      setShowAddModal(false)
      setNewPatient({
        name: '',
        age: '',
        gender: '남',
        diagnosis: '',
        diagnosisCustom: '',
        onset_date: '',
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        history: '',
      })
    } catch {
      // error handled silently
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePatient = async () => {
    if (!showDeleteModal) return
    setIsSubmitting(true)
    try {
      await deletePatient(showDeleteModal)
      setShowDeleteModal(null)
    } catch {
      // error handled silently
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: language === 'ko' ? '전체' : 'All' },
    { value: 'active', label: language === 'ko' ? '입원중' : 'Active' },
    { value: 'discharged', label: language === 'ko' ? '퇴원' : 'Discharged' },
    { value: 'outpatient', label: language === 'ko' ? '외래' : 'Outpatient' },
  ]

  const getDaysInHospital = (admissionDate: string) => {
    return Math.floor(
      (Date.now() - new Date(admissionDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return (
    <MainLayout title={language === 'ko' ? '내 환자' : 'My Patients'}>
      <div className="mx-auto max-w-6xl space-y-4">
        {/* 상단: 검색 + 필터 + 추가 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 검색바 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ko'
                  ? '이름 또는 진단명 검색...'
                  : 'Search name or diagnosis...'
              }
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 상태 필터 + 추가 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    filterStatus === f.value
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {language === 'ko' ? '환자 추가' : 'Add Patient'}
            </Button>
          </div>
        </div>

        {/* 환자 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 w-24 rounded bg-border mb-3" />
                  <div className="h-3 w-32 rounded bg-border mb-2" />
                  <div className="h-3 w-40 rounded bg-border" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-text-secondary/30 mb-3" />
              <p className="text-sm text-text-secondary">
                {language === 'ko' ? '환자가 없습니다' : 'No patients found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredPatients.map((patient, index) => {
                const status = STATUS_LABELS[patient.status as PatientStatus]
                const days = getDaysInHospital(patient.admission_date)

                return (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer transition-shadow hover:shadow-md group relative"
                      onClick={() => {
                        setSelectedPatient(patient.id, patient.name)
                        router.push(`/patients/${patient.id}`)
                      }}
                    >
                      <CardContent className="p-5">
                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteModal(patient.id)
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error" />
                        </button>

                        {/* 이름 + 상태 배지 */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-text-primary truncate">
                                {patient.name}
                              </h3>
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0',
                                  status.color
                                )}
                              >
                                {language === 'ko' ? status.ko : status.en}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary">
                              {patient.age}세 / {patient.gender}
                            </p>
                          </div>
                        </div>

                        {/* 진단명 */}
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1.5">
                          <Heart className="h-3 w-3 text-red-400 flex-shrink-0" />
                          <span className="truncate">{patient.diagnosis}</span>
                        </div>

                        {/* 온셋일 + 입원일 + 재원일수 */}
                        <div className="flex items-center justify-between text-[11px] text-text-secondary/70">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {patient.onset_date
                                ? `${language === 'ko' ? '온셋 ' : 'Onset '}${new Date(patient.onset_date).toLocaleDateString('ko-KR')}`
                                : new Date(patient.admission_date).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <span>
                            {language === 'ko' ? `재원 ${days}일` : `Day ${days}`}
                          </span>
                        </div>

                        {/* 최근 평가일 */}
                        {patient.last_assessed_at && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <span className="text-[10px] text-text-secondary">
                              {language === 'ko' ? '최근 평가: ' : 'Last assessed: '}
                              {new Date(patient.last_assessed_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* 환자 수 표시 */}
        <div className="text-xs text-text-secondary text-center">
          {language === 'ko'
            ? `총 ${filteredPatients.length}명의 환자`
            : `${filteredPatients.length} patients total`}
        </div>
      </div>

      {/* 환자 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={language === 'ko' ? '새 환자 등록' : 'Add New Patient'}
        size="md"
      >
        <div className="space-y-3">
          {/* 이름 + 나이 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                {language === 'ko' ? '이름' : 'Name'} *
              </label>
              <input
                type="text"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                {language === 'ko' ? '나이' : 'Age'} *
              </label>
              <input
                type="number"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              {language === 'ko' ? '성별' : 'Gender'} *
            </label>
            <div className="flex gap-2">
              {(['남', '여'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setNewPatient({ ...newPatient, gender: g })}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                    newPatient.gender === g
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:text-text-primary'
                  )}
                >
                  {g === '남'
                    ? language === 'ko' ? '남성' : 'Male'
                    : language === 'ko' ? '여성' : 'Female'}
                </button>
              ))}
            </div>
          </div>

          {/* 주상병 (드롭다운 + 직접입력) */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              {language === 'ko' ? '주상병' : 'Diagnosis'} *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DIAGNOSIS_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setNewPatient({ ...newPatient, diagnosis: d, diagnosisCustom: '' })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    newPatient.diagnosis === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:text-text-primary'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            {newPatient.diagnosis === '기타' && (
              <input
                type="text"
                value={newPatient.diagnosisCustom}
                onChange={(e) => setNewPatient({ ...newPatient, diagnosisCustom: e.target.value })}
                placeholder={language === 'ko' ? '진단명을 입력하세요' : 'Enter diagnosis'}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>

          {/* 온셋일 + 입원일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                {language === 'ko' ? '온셋일' : 'Onset Date'}
              </label>
              <input
                type="date"
                value={newPatient.onset_date}
                onChange={(e) => setNewPatient({ ...newPatient, onset_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                {language === 'ko' ? '입원일' : 'Admission Date'}
              </label>
              <input
                type="date"
                value={newPatient.admission_date}
                onChange={(e) => setNewPatient({ ...newPatient, admission_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              {language === 'ko' ? '상태' : 'Status'}
            </label>
            <div className="flex gap-2">
              {(['active', 'discharged', 'outpatient'] as PatientStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setNewPatient({ ...newPatient, status: s })}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
                    newPatient.status === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:text-text-primary'
                  )}
                >
                  {STATUS_LABELS[s][language === 'ko' ? 'ko' : 'en']}
                </button>
              ))}
            </div>
          </div>

          {/* 히스토리 */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              {language === 'ko' ? '히스토리' : 'History'}
            </label>
            <textarea
              value={newPatient.history}
              onChange={(e) => setNewPatient({ ...newPatient, history: e.target.value })}
              placeholder={language === 'ko' ? '예: 2025.12.01 Lt. MCA infarction, Rt. hemiplegia, HTN, DM' : 'e.g., 2025.12.01 Lt. MCA infarction, Rt. hemiplegia, HTN, DM'}
              className="w-full h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            {language === 'ko' ? '취소' : 'Cancel'}
          </Button>
          <Button
            onClick={handleAddPatient}
            disabled={!newPatient.name || !finalDiagnosis || !newPatient.age || isSubmitting}
            isLoading={isSubmitting}
          >
            {language === 'ko' ? '등록' : 'Add'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title={language === 'ko' ? '환자 삭제' : 'Delete Patient'}
        size="sm"
      >
        <div className="flex items-center gap-3 rounded-lg bg-error/10 border border-error/20 p-3 mb-4">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
          <p className="text-xs text-text-primary">
            {language === 'ko'
              ? '이 환자의 모든 평가 기록이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'
              : 'All assessment records for this patient will be permanently deleted. This action cannot be undone.'}
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
            {language === 'ko' ? '취소' : 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePatient}
            isLoading={isSubmitting}
          >
            {language === 'ko' ? '삭제' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </MainLayout>
  )
}
