'use client'

import { useRef } from 'react'
import { Download, Upload, Box } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RegionList } from '@/components/mapping/region-list'
import { RegionDetail } from '@/components/mapping/region-detail'
import { useMappingStore } from '@/stores/mapping-store'
import { useTranslation } from '@/hooks/use-translation'
import type { MappingJson } from '@/types/anatomy'

export default function MappingEditorPage() {
  const { language } = useTranslation()
  const { exportMapping, importMapping } = useMappingStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportMapping()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `mapping-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as MappingJson
        if (!json.regions || typeof json.regions !== 'object') {
          alert('올바른 매핑 JSON 파일이 아닙니다.')
          return
        }
        importMapping(json)
      } catch {
        alert('JSON 파일을 파싱할 수 없습니다.')
      }
    }
    reader.readAsText(file)

    // Reset file input
    e.target.value = ''
  }

  return (
    <MainLayout
      title={language === 'ko' ? '매핑 에디터' : 'Mapping Editor'}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {language === 'ko' ? '해부학 부위 매핑 에디터' : 'Anatomy Region Mapping Editor'}
            </h2>
            <p className="text-xs text-text-secondary">
              {language === 'ko'
                ? '3D 모델의 메쉬를 해부학 부위에 할당합니다'
                : 'Assign 3D model meshes to anatomy regions'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-2">
              <Upload className="h-3.5 w-3.5" />
              {language === 'ko' ? '가져오기' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              {language === 'ko' ? '내보내기' : 'Export'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: Region List */}
          <div className="lg:col-span-3">
            <RegionList />
          </div>

          {/* Center: 3D Viewer Placeholder */}
          <div className="lg:col-span-6">
            <Card className="h-full min-h-[500px]">
              <CardContent className="flex h-full flex-col items-center justify-center gap-4 py-16">
                <Box className="h-16 w-16 text-text-secondary/20" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-secondary">
                    3D 뷰어
                  </p>
                  <p className="mt-1 text-xs text-text-secondary/60">
                    해부학 뷰어 페이지에서 사용
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Region Detail */}
          <div className="lg:col-span-3">
            <RegionDetail />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
