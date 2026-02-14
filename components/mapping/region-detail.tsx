'use client'

import { useState } from 'react'
import { Trash2, X, MousePointerClick, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMappingStore } from '@/stores/mapping-store'
import { regionKeyToLabel, getRegionColor } from '@/lib/anatomy/regions'
import { cn } from '@/lib/utils'

export function RegionDetail() {
  const {
    mappingData,
    selectedRegionKey,
    isAssignMode,
    setIsAssignMode,
    deleteRegion,
    removeMeshFromRegion,
    setSelectedRegionKey,
  } = useMappingStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!selectedRegionKey) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MousePointerClick className="mb-3 h-10 w-10 text-text-secondary/30" />
          <p className="text-sm text-text-secondary">
            왼쪽 목록에서 부위를 선택하세요
          </p>
        </CardContent>
      </Card>
    )
  }

  const region = mappingData?.regions[selectedRegionKey]
  if (!region) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-text-secondary">부위를 찾을 수 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  const allKeys = Object.keys(mappingData?.regions || {})
  const colorIdx = allKeys.indexOf(selectedRegionKey)
  const label = regionKeyToLabel(selectedRegionKey)

  const handleDelete = () => {
    deleteRegion(selectedRegionKey)
    setShowDeleteConfirm(false)
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: getRegionColor(colorIdx >= 0 ? colorIdx : 0) }}
          />
          <CardTitle className="flex-1 truncate text-sm">{label}</CardTitle>
        </div>
        <p className="text-[11px] text-text-secondary">
          Key: {selectedRegionKey}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Assign mode toggle */}
        <div>
          <Button
            variant={isAssignMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAssignMode(!isAssignMode)}
            className={cn(
              'w-full gap-2',
              isAssignMode && 'animate-pulse'
            )}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            {isAssignMode ? '할당 모드 ON' : '할당 모드'}
          </Button>
          {isAssignMode && (
            <p className="mt-1.5 text-[11px] text-primary">
              3D 뷰어에서 메쉬를 클릭하면 이 부위에 할당됩니다
            </p>
          )}
        </div>

        {/* Mesh list */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-text-secondary">
            할당된 메쉬 ({region.meshes.length})
          </p>
          <div
            className="space-y-1 overflow-y-auto pr-1"
            style={{ maxHeight: 'calc(100vh - 480px)' }}
          >
            {region.meshes.length === 0 ? (
              <p className="py-4 text-center text-xs text-text-secondary/60">
                할당된 메쉬가 없습니다
              </p>
            ) : (
              region.meshes.map((mesh) => (
                <div
                  key={mesh}
                  className="flex items-center gap-2 rounded-md bg-surface px-2 py-1.5"
                >
                  <span className="flex-1 truncate text-xs text-text-primary">
                    {mesh}
                  </span>
                  <button
                    onClick={() =>
                      removeMeshFromRegion(selectedRegionKey, mesh)
                    }
                    className="flex-shrink-0 rounded-md p-0.5 text-text-secondary hover:bg-error/10 hover:text-error"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete region */}
        <div className="border-t border-border pt-3">
          {showDeleteConfirm ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md bg-error/10 p-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-error" />
                <p className="text-xs text-error">
                  &apos;{label}&apos; 부위를 삭제하시겠습니까?
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  삭제
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-error hover:bg-error/10 hover:text-error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              부위 삭제
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
