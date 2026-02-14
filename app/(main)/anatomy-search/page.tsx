'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { AnatomySearchPanel } from '@/components/anatomy/anatomy-search-panel'
import { useTranslation } from '@/hooks/use-translation'

export default function AnatomySearchPage() {
  const { language } = useTranslation()

  return (
    <MainLayout title={language === 'ko' ? '질환/해부학 검색' : 'Disease / Anatomy Search'}>
      <div className="mx-auto max-w-5xl">
        <AnatomySearchPanel />
      </div>
    </MainLayout>
  )
}
