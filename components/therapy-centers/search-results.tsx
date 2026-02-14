'use client'

import { ExternalLink, Phone, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SearchResult {
  title: string
  category: string
  address: string
  phone: string
  distance: string
  link: string
  index: number
}

interface SearchResultsProps {
  results: SearchResult[]
  activeIndex: number | null
  onCardClick?: (index: number) => void
}

export function SearchResults({ results, activeIndex, onCardClick }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <MapPin className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">검색 결과가 없습니다</p>
        <p className="mt-1 text-xs">치료실, 재활센터 등을 검색해보세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      {results.map((result) => (
        <Card
          key={result.index}
          className={cn(
            'cursor-pointer transition-all hover:border-primary/50 hover:shadow-md',
            activeIndex === result.index && 'border-primary bg-primary/5 shadow-md'
          )}
          onClick={() => onCardClick?.(result.index)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Numbered badge */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {result.index + 1}
              </div>

              <div className="min-w-0 flex-1">
                {/* Title + Category */}
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-text-primary">
                    {result.title}
                  </h3>
                  {result.category && (
                    <span className="flex-shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-secondary">
                      {result.category}
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{result.address}</span>
                </div>

                {/* Phone + Link */}
                <div className="mt-1.5 flex items-center gap-3">
                  {result.phone && (
                    <a
                      href={`tel:${result.phone}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      {result.phone}
                    </a>
                  )}
                  {result.link && (
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      상세보기
                    </a>
                  )}
                </div>

                {/* Distance */}
                {result.distance && (
                  <p className="mt-1 text-[11px] text-text-secondary">
                    거리: {result.distance}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
