'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMappingStore } from '@/stores/mapping-store'
import { REGION_GROUPS, getRegionColor, regionKeyToLabel } from '@/lib/anatomy/regions'
import { cn } from '@/lib/utils'

export function RegionList() {
  const {
    mappingData,
    selectedRegionKey,
    setSelectedRegionKey,
    addRegion,
  } = useMappingStore()

  const [newRegionKey, setNewRegionKey] = useState('')

  const regions = mappingData?.regions || {}

  const handleAddRegion = () => {
    const key = newRegionKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!key) return
    addRegion(key)
    setNewRegionKey('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRegion()
    }
  }

  // Build an index for color assignment
  const allRegionKeys = Object.keys(regions)
  const regionColorIndex = new Map<string, number>()
  allRegionKeys.forEach((key, idx) => {
    regionColorIndex.set(key, idx)
  })

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">부위 목록</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Region groups */}
        <div
          className="space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: 'calc(100vh - 340px)' }}
        >
          {REGION_GROUPS.map((group) => {
            const groupRegions = group.ids.filter((id) => id in regions)
            if (groupRegions.length === 0) return null

            return (
              <div key={group.name}>
                <p className="mb-1 text-[11px] font-semibold uppercase text-text-secondary">
                  {group.name}
                </p>
                <div className="space-y-0.5">
                  {groupRegions.map((id) => {
                    const meshCount = regions[id]?.meshes?.length || 0
                    const colorIdx = regionColorIndex.get(id) ?? 0
                    const isSelected = selectedRegionKey === id

                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedRegionKey(isSelected ? null : id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-surface text-text-primary'
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: getRegionColor(colorIdx) }}
                        />
                        <span className="flex-1 truncate">
                          {regionKeyToLabel(id)}
                        </span>
                        <span className="flex-shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[10px] text-text-secondary">
                          {meshCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Custom (non-predefined) regions */}
          {(() => {
            const predefinedIds = new Set(
              REGION_GROUPS.flatMap((g) => g.ids)
            )
            const customKeys = allRegionKeys.filter(
              (key) => !predefinedIds.has(key)
            )
            if (customKeys.length === 0) return null

            return (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase text-text-secondary">
                  사용자 정의
                </p>
                <div className="space-y-0.5">
                  {customKeys.map((id) => {
                    const meshCount = regions[id]?.meshes?.length || 0
                    const colorIdx = regionColorIndex.get(id) ?? 0
                    const isSelected = selectedRegionKey === id

                    return (
                      <button
                        key={id}
                        onClick={() =>
                          setSelectedRegionKey(isSelected ? null : id)
                        }
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-surface text-text-primary'
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: getRegionColor(colorIdx),
                          }}
                        />
                        <span className="flex-1 truncate">
                          {regionKeyToLabel(id)}
                        </span>
                        <span className="flex-shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[10px] text-text-secondary">
                          {meshCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Add region form */}
        <div className="border-t border-border pt-3">
          <p className="mb-1.5 text-[11px] font-semibold text-text-secondary">
            부위 추가
          </p>
          <div className="flex gap-1.5">
            <Input
              placeholder="region_key"
              value={newRegionKey}
              onChange={(e) => setNewRegionKey(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleAddRegion}
              disabled={!newRegionKey.trim()}
              className="h-8 px-2"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
