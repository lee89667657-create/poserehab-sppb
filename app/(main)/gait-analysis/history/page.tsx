'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Trash2,
  Scale,
  Calendar,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Dumbbell,
  Ruler,
  PersonStanding,
  Hand,
  Stethoscope,
  Briefcase,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useBBSStore } from '@/stores/bbs-store'
import { useMMTStore } from '@/stores/mmt-store'
import { useROMAssessmentStore } from '@/stores/rom-assessment-store'
import { useFACStore } from '@/stores/fac-store'
import { useMBIStore } from '@/stores/mbi-store'
import { useHandFunctionStore } from '@/stores/hand-function-store'
import { useTranslation } from '@/hooks/use-translation'
import type { BBSResult } from '@/types/bbs'
import type { MMTResult, ROMResult, FACResult, MBIResult, HandFunctionResult } from '@/types/assessments'
import { MMT_ITEMS, ROM_ITEMS, FAC_LEVELS, MBI_ITEMS, HAND_FUNCTION_ITEMS } from '@/types/assessments'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type TherapyCategory = 'physical' | 'occupational'
type PhysicalHistoryTab = 'mmt' | 'rom' | 'bbs' | 'fac'
type OccupationalHistoryTab = 'mbi' | 'handFunction'
type HistoryTab = PhysicalHistoryTab | OccupationalHistoryTab

const PHYSICAL_TABS = [
  { id: 'mmt' as const, label: 'MMT', icon: Dumbbell },
  { id: 'rom' as const, label: 'ROM', icon: Ruler },
  { id: 'bbs' as const, label: 'BBS', icon: Scale },
  { id: 'fac' as const, label: 'FAC', icon: PersonStanding },
]

const OCCUPATIONAL_TABS = [
  { id: 'mbi' as const, label: 'MBI', icon: ClipboardList },
  { id: 'handFunction' as const, label: 'Hand', icon: Hand },
]

export default function AssessmentHistoryPage() {
  const router = useRouter()
  const { language } = useTranslation()
  const [category, setCategory] = useState<TherapyCategory>('physical')
  const [physicalTab, setPhysicalTab] = useState<PhysicalHistoryTab>('mmt')
  const [occupationalTab, setOccupationalTab] = useState<OccupationalHistoryTab>('mbi')

  const { history: bbsHistory, deleteResult: deleteBBS, clearHistory: clearBBS } = useBBSStore()
  const { history: mmtHistory, deleteResult: deleteMMT, clearHistory: clearMMT } = useMMTStore()
  const { history: romHistory, deleteResult: deleteROM, clearHistory: clearROM } = useROMAssessmentStore()
  const { history: facHistory, deleteResult: deleteFAC, clearHistory: clearFAC } = useFACStore()
  const { history: mbiHistory, deleteResult: deleteMBI, clearHistory: clearMBI } = useMBIStore()
  const { history: handFunctionHistory, deleteResult: deleteHandFunction, clearHistory: clearHandFunction } = useHandFunctionStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const activeTab: HistoryTab = category === 'physical' ? physicalTab : occupationalTab

  const getHistoryData = () => {
    switch (activeTab) {
      case 'mmt': return { history: mmtHistory, deleteResult: deleteMMT, clearHistory: clearMMT }
      case 'rom': return { history: romHistory, deleteResult: deleteROM, clearHistory: clearROM }
      case 'bbs': return { history: bbsHistory, deleteResult: deleteBBS, clearHistory: clearBBS }
      case 'fac': return { history: facHistory, deleteResult: deleteFAC, clearHistory: clearFAC }
      case 'mbi': return { history: mbiHistory, deleteResult: deleteMBI, clearHistory: clearMBI }
      case 'handFunction': return { history: handFunctionHistory, deleteResult: deleteHandFunction, clearHistory: clearHandFunction }
    }
  }

  const { history, deleteResult, clearHistory } = getHistoryData()

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const handleDelete = (id: string) => {
    deleteResult(id)
  }

  const handleClearAll = () => {
    clearHistory()
    setShowClearConfirm(false)
  }

  // BBS 점수 색상
  const getBBSScoreColor = (riskLevel: 'high' | 'medium' | 'low') => {
    switch (riskLevel) {
      case 'low': return 'text-emerald-500'
      case 'medium': return 'text-amber-500'
      case 'high': return 'text-red-500'
    }
  }

  const getBBSRiskLabel = (riskLevel: 'high' | 'medium' | 'low', lang: string) => {
    switch (riskLevel) {
      case 'low': return lang === 'ko' ? '낮은 위험' : 'Low Risk'
      case 'medium': return lang === 'ko' ? '중간 위험' : 'Medium Risk'
      case 'high': return lang === 'ko' ? '높은 위험' : 'High Risk'
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors hover:bg-surface"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-text-primary text-xl font-bold">
                {language === 'ko' ? '평가 기록' : 'Assessment History'}
              </h1>
              <p className="text-text-secondary text-sm">
                {language === 'ko'
                  ? `총 ${history.length}개의 기록`
                  : `${history.length} records total`}
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {language === 'ko' ? '전체 삭제' : 'Clear All'}
            </Button>
          )}
        </div>

        {/* 치료 카테고리 탭 */}
        <div className="bg-surface rounded-xl border border-border p-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCategory('physical')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all',
                category === 'physical'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm">{language === 'ko' ? '물리치료' : 'Physical'}</span>
            </button>
            <button
              onClick={() => setCategory('occupational')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all',
                category === 'occupational'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm">{language === 'ko' ? '작업치료' : 'Occupational'}</span>
            </button>
          </div>
        </div>

        {/* 하위 탭 선택 */}
        <div className="bg-surface rounded-xl border border-border p-1">
          {category === 'physical' ? (
            <div className="grid grid-cols-4 gap-1">
              {PHYSICAL_TABS.map((tab) => {
                const Icon = tab.icon
                const count = tab.id === 'mmt' ? mmtHistory.length
                  : tab.id === 'rom' ? romHistory.length
                  : tab.id === 'bbs' ? bbsHistory.length
                  : facHistory.length
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPhysicalTab(tab.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium transition-all',
                      physicalTab === tab.id
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{tab.label}</span>
                    <span className={cn('text-[10px]', physicalTab === tab.id ? 'text-white/80' : 'text-text-secondary')}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {OCCUPATIONAL_TABS.map((tab) => {
                const Icon = tab.icon
                const count = tab.id === 'mbi' ? mbiHistory.length : handFunctionHistory.length
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOccupationalTab(tab.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 font-medium transition-all',
                      occupationalTab === tab.id
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{tab.label}</span>
                    <span className={cn('text-[10px]', occupationalTab === tab.id ? 'text-white/80' : 'text-text-secondary')}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 기록 목록 */}
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Calendar className="mb-4 h-16 w-16 text-text-secondary opacity-50" />
            <p className="text-text-secondary text-lg">
              {language === 'ko' ? '검사 기록이 없습니다' : 'No assessment records'}
            </p>
            <Link href="/gait-analysis" className="mt-4">
              <Button>
                {language === 'ko' ? '새로운 검사 시작' : 'Start New Assessment'}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* MMT 기록 */}
            {activeTab === 'mmt' && (history as MMTResult[]).map((result, index) => (
              <MMTHistoryCard
                key={result.id}
                result={result}
                index={index}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
              />
            ))}

            {/* ROM 기록 */}
            {activeTab === 'rom' && (history as ROMResult[]).map((result, index) => (
              <ROMHistoryCard
                key={result.id}
                result={result}
                index={index}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
              />
            ))}

            {/* BBS 기록 */}
            {activeTab === 'bbs' && (history as BBSResult[]).map((result, index) => (
              <BBSHistoryCard
                key={result.id}
                result={result}
                index={index}
                prevResult={index < history.length - 1 ? (history as BBSResult[])[index + 1] : null}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
                getBBSScoreColor={getBBSScoreColor}
                getBBSRiskLabel={getBBSRiskLabel}
              />
            ))}

            {/* FAC 기록 */}
            {activeTab === 'fac' && (history as FACResult[]).map((result, index) => (
              <FACHistoryCard
                key={result.id}
                result={result}
                index={index}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
              />
            ))}

            {/* MBI 기록 */}
            {activeTab === 'mbi' && (history as MBIResult[]).map((result, index) => (
              <MBIHistoryCard
                key={result.id}
                result={result}
                index={index}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
              />
            ))}

            {/* Hand Function 기록 */}
            {activeTab === 'handFunction' && (history as HandFunctionResult[]).map((result, index) => (
              <HandFunctionHistoryCard
                key={result.id}
                result={result}
                index={index}
                onDelete={handleDelete}
                formatDate={formatDate}
                language={language}
              />
            ))}
          </div>
        )}

        {/* 새 검사 버튼 */}
        {history.length > 0 && (
          <div className="flex justify-center pb-6">
            <Link href="/gait-analysis">
              <Button size="lg">
                {language === 'ko' ? '새로운 검사 시작' : 'Start New Assessment'}
              </Button>
            </Link>
          </div>
        )}

        {/* 전체 삭제 확인 모달 */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface rounded-2xl border border-border p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-text-primary font-bold">
                      {language === 'ko' ? '전체 삭제' : 'Clear All Records'}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {language === 'ko'
                        ? '모든 검사 기록이 삭제됩니다'
                        : 'All assessment records will be deleted'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </Button>
                  <Button variant="destructive" onClick={handleClearAll}>
                    {language === 'ko' ? '삭제' : 'Delete'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}

// MMT 기록 카드
function MMTHistoryCard({
  result,
  index,
  onDelete,
  formatDate,
  language,
}: {
  result: MMTResult
  index: number
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
}) {
  const { date, time } = formatDate(result.timestamp)
  const completedCount = Object.values(result.scores).filter(s => s.lt !== null || s.rt !== null).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{completedCount}/{MMT_ITEMS.length}</div>
          <div className="text-text-secondary text-xs">{language === 'ko' ? '항목 완료' : 'items'}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        {MMT_ITEMS.slice(0, 8).map((item) => {
          const score = result.scores[item.id]
          if (!score || (score.lt === null && score.rt === null)) return null
          return (
            <div key={item.id} className="bg-background rounded-lg p-2 text-center">
              <div className="text-text-secondary truncate text-[10px]">{item.name.slice(0, 8)}</div>
              <div className="font-medium text-text-primary">
                <span className="text-blue-600">{score.lt ?? '-'}</span>
                <span className="text-text-secondary">/</span>
                <span className="text-rose-600">{score.rt ?? '-'}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}

// ROM 기록 카드
function ROMHistoryCard({
  result,
  index,
  onDelete,
  formatDate,
  language,
}: {
  result: ROMResult
  index: number
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
}) {
  const { date, time } = formatDate(result.timestamp)
  const completedCount = Object.values(result.scores).filter(
    s => s.lt !== null || s.rt !== null
  ).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ruler className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{completedCount}/{ROM_ITEMS.length}</div>
          <div className="text-text-secondary text-xs">{language === 'ko' ? '항목 완료' : 'items'}</div>
        </div>
      </div>

      {/* 헤더 */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-text-secondary mb-1 px-1">
        <div></div>
        <div className="text-center text-blue-600">Lt.</div>
        <div className="text-center text-rose-600">Rt.</div>
      </div>

      <div className="space-y-1">
        {ROM_ITEMS.slice(0, 5).map((item) => {
          const score = result.scores[item.id]
          if (!score || (score.lt === null && score.rt === null)) return null
          return (
            <div key={item.id} className="grid grid-cols-3 gap-1 bg-background rounded-lg py-1.5 px-2 text-xs items-center">
              <div className="text-text-secondary truncate text-[10px]">{item.name.slice(0, 15)}</div>
              <div className="text-center font-medium text-blue-600">{Object.values(score.lt).filter(v => v !== null).join('/') || '-'}°</div>
              <div className="text-center font-medium text-rose-600">{Object.values(score.rt).filter(v => v !== null).join('/') || '-'}°</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}

// BBS 기록 카드
function BBSHistoryCard({
  result,
  index,
  prevResult,
  onDelete,
  formatDate,
  language,
  getBBSScoreColor,
  getBBSRiskLabel,
}: {
  result: BBSResult
  index: number
  prevResult: BBSResult | null
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
  getBBSScoreColor: (level: 'high' | 'medium' | 'low') => string
  getBBSRiskLabel: (level: 'high' | 'medium' | 'low', lang: string) => string
}) {
  const { date, time } = formatDate(result.timestamp)
  const scoreDiff = prevResult ? result.totalScore - prevResult.totalScore : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={cn('text-3xl font-bold', getBBSScoreColor(result.riskLevel))}>
              {result.totalScore}
            </div>
            <div className="text-text-secondary text-xs">/ 56</div>
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
            <div className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              result.riskLevel === 'low' ? 'bg-emerald-500/10 text-emerald-500'
                : result.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-500'
                : 'bg-red-500/10 text-red-500'
            )}>
              {getBBSRiskLabel(result.riskLevel, language)}
              {scoreDiff !== null && scoreDiff !== 0 && (
                <span className={scoreDiff > 0 ? 'text-emerald-500' : 'text-red-500'}>
                  ({scoreDiff > 0 ? '+' : ''}{scoreDiff})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2',
          result.riskLevel === 'low' ? 'bg-emerald-500/10 text-emerald-500'
            : result.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-500'
            : 'bg-red-500/10 text-red-500'
        )}>
          {result.riskLevel === 'low' ? <CheckCircle className="h-5 w-5" />
            : result.riskLevel === 'medium' ? <AlertTriangle className="h-5 w-5" />
            : <AlertCircle className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((itemId) => (
            <div
              key={itemId}
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium',
                result.scores[itemId] === 4 ? 'bg-emerald-500/20 text-emerald-600' :
                result.scores[itemId] === 3 ? 'bg-emerald-500/10 text-emerald-500' :
                result.scores[itemId] === 2 ? 'bg-amber-500/10 text-amber-500' :
                result.scores[itemId] === 1 ? 'bg-orange-500/10 text-orange-500' :
                'bg-red-500/10 text-red-500'
              )}
            >
              {result.scores[itemId]}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}

// FAC 기록 카드
function FACHistoryCard({
  result,
  index,
  onDelete,
  formatDate,
  language,
}: {
  result: FACResult
  index: number
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
}) {
  const { date, time } = formatDate(result.timestamp)
  const level = FAC_LEVELS.find(l => l.value === result.level)

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'text-emerald-500'
    if (level >= 2) return 'text-amber-500'
    return 'text-red-500'
  }

  const getLevelBgColor = (level: number) => {
    if (level >= 4) return 'bg-emerald-500/10'
    if (level >= 2) return 'bg-amber-500/10'
    return 'bg-red-500/10'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', getLevelBgColor(result.level))}>
            <span className={cn('text-2xl font-bold', getLevelColor(result.level))}>
              {result.level}
            </span>
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
            <div className={cn('mt-1 text-sm font-medium', getLevelColor(result.level))}>
              FAC {result.level}
            </div>
          </div>
        </div>
        <div className="flex-1 ml-4 max-w-[200px]">
          <div className="text-text-secondary text-sm">
            {level?.descriptionEn}
          </div>
        </div>
      </div>

      {result.notes && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-text-secondary text-sm">{result.notes}</div>
        </div>
      )}

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}

// MBI 기록 카드
function MBIHistoryCard({
  result,
  index,
  onDelete,
  formatDate,
  language,
}: {
  result: MBIResult
  index: number
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
}) {
  const { date, time } = formatDate(result.timestamp)

  const getDependencyLevel = (score: number) => {
    if (score >= 91) return { level: language === 'ko' ? '완전 독립' : 'Complete', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    if (score >= 75) return { level: language === 'ko' ? '약간 의존' : 'Slight', color: 'text-green-500', bg: 'bg-green-500/10' }
    if (score >= 50) return { level: language === 'ko' ? '중등도 의존' : 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    if (score >= 25) return { level: language === 'ko' ? '심한 의존' : 'Severe', color: 'text-orange-500', bg: 'bg-orange-500/10' }
    return { level: language === 'ko' ? '완전 의존' : 'Total', color: 'text-red-500', bg: 'bg-red-500/10' }
  }

  const dependencyInfo = getDependencyLevel(result.totalScore)
  const completedCount = Object.keys(result.scores).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={cn('text-3xl font-bold', dependencyInfo.color)}>
              {result.totalScore}
            </div>
            <div className="text-text-secondary text-xs">/ 100</div>
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
            <div className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium', dependencyInfo.bg, dependencyInfo.color)}>
              {dependencyInfo.level}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{completedCount}/{MBI_ITEMS.length}</div>
          <div className="text-text-secondary text-xs">{language === 'ko' ? '항목' : 'items'}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-xs">
        {MBI_ITEMS.slice(0, 8).map((item) => {
          const score = result.scores[item.id]
          if (score === undefined) return null
          return (
            <div key={item.id} className="bg-background rounded-lg p-1.5 text-center">
              <div className="text-text-secondary truncate text-[10px]">
                {item.nameEn.slice(0, 8)}
              </div>
              <div className="font-medium text-text-primary">{score}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}

// Hand Function 기록 카드
function HandFunctionHistoryCard({
  result,
  index,
  onDelete,
  formatDate,
  language,
}: {
  result: HandFunctionResult
  index: number
  onDelete: (id: string) => void
  formatDate: (ts: number) => { date: string; time: string }
  language: string
}) {
  const { date, time } = formatDate(result.timestamp)
  const maxScore = 32

  const getScoreColor = (score: number) => {
    const percent = (score / maxScore) * 100
    if (percent >= 80) return 'text-emerald-500'
    if (percent >= 60) return 'text-green-500'
    if (percent >= 40) return 'text-amber-500'
    return 'text-orange-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Hand className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-text-primary font-medium">{date}</div>
            <div className="text-text-secondary text-sm">{time}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-500/10 p-3 text-center">
          <div className="text-blue-600 text-xs font-medium mb-1">Lt.</div>
          <div className={cn('text-2xl font-bold', getScoreColor(result.leftTotalScore))}>
            {result.leftTotalScore}
          </div>
          <div className="text-text-secondary text-xs">/ {maxScore}</div>
        </div>
        <div className="rounded-xl bg-rose-500/10 p-3 text-center">
          <div className="text-rose-600 text-xs font-medium mb-1">Rt.</div>
          <div className={cn('text-2xl font-bold', getScoreColor(result.rightTotalScore))}>
            {result.rightTotalScore}
          </div>
          <div className="text-text-secondary text-xs">/ {maxScore}</div>
        </div>
      </div>

      {result.notes && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-text-secondary text-sm">{result.notes}</div>
        </div>
      )}

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          onClick={() => onDelete(result.id)}
          className="text-text-secondary hover:text-red-500 flex items-center gap-1 text-sm transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'ko' ? '삭제' : 'Delete'}
        </button>
      </div>
    </motion.div>
  )
}
