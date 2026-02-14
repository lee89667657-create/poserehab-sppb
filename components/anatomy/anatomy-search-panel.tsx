'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { searchAnatomy } from '@/lib/anatomy/anatomy-search'
import { getAnatomyInfo } from '@/lib/anatomy/anatomy-data'
import type { SearchResult } from '@/types/anatomy'
import { cn } from '@/lib/utils'

export function AnatomySearchPanel() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query])

  const results: SearchResult[] = useMemo(() => {
    return searchAnatomy(debouncedQuery)
  }, [debouncedQuery])

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="질환명, 근육명, 부위명으로 검색 (예: 디스크, 이두근, 어깨)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      {debouncedQuery && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Search className="h-10 w-10 text-text-secondary/30 mb-3" />
          <p className="text-sm text-text-secondary">
            &ldquo;{debouncedQuery}&rdquo;에 대한 검색 결과가 없습니다.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => {
            const info = getAnatomyInfo(result.regionKey)
            if (!info) return null

            return (
              <Card key={result.regionKey} className="transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {result.name}
                    </CardTitle>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {result.matchField}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {info.description}
                  </p>

                  {/* Pathology tags */}
                  {info.commonPathologies.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-text-secondary mb-1">질환</p>
                      <div className="flex flex-wrap gap-1">
                        {info.commonPathologies.map((p) => (
                          <span
                            key={p}
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px]',
                              debouncedQuery && p.toLowerCase().includes(debouncedQuery.toLowerCase())
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-semibold'
                                : 'bg-background text-text-secondary'
                            )}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Muscle tags */}
                  {info.keyMuscles.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-text-secondary mb-1">근육</p>
                      <div className="flex flex-wrap gap-1">
                        {info.keyMuscles.map((m) => (
                          <span
                            key={m}
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px]',
                              debouncedQuery && m.toLowerCase().includes(debouncedQuery.toLowerCase())
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-semibold'
                                : 'bg-background text-text-secondary'
                            )}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercise list */}
                  {info.exercises.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-text-secondary mb-1">운동</p>
                      <div className="flex flex-wrap gap-1">
                        {info.exercises.map((ex) => (
                          <span
                            key={ex.name}
                            className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          >
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View in 3D button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/anatomy?region=${result.regionKey}`)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    3D에서 보기
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state when no query */}
      {!debouncedQuery && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-12 w-12 text-text-secondary/20 mb-4" />
          <p className="text-sm text-text-secondary">
            검색어를 입력하면 해당하는 해부학 정보가 표시됩니다.
          </p>
          <p className="mt-1 text-xs text-text-secondary/60">
            질환명, 근육명, 구조물, 운동명 등으로 검색할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  )
}
