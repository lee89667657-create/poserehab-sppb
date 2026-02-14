'use client'

import { useState, useCallback } from 'react'
import { Search, MapPin, Loader2, AlertTriangle } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NaverMap } from '@/components/therapy-centers/naver-map'
import { SearchResults } from '@/components/therapy-centers/search-results'
import { useTranslation } from '@/hooks/use-translation'

interface NaverSearchItem {
  title: string
  category: string
  roadAddress: string
  address: string
  telephone: string
  mapx: string
  mapy: string
  link: string
  description: string
}

interface MapMarker {
  lat: number
  lng: number
  title: string
  address: string
  phone: string
  index: number
}

interface SearchResult {
  title: string
  category: string
  address: string
  phone: string
  distance: string
  link: string
  index: number
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

const NAVER_MAP_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY || ''

export default function TherapyCentersPage() {
  const { language } = useTranslation()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const res = await fetch(`/api/naver-search?query=${encodeURIComponent(q)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '검색 중 오류가 발생했습니다')
        setResults([])
        setMarkers([])
        return
      }

      const items: NaverSearchItem[] = data.items || []

      const parsedResults: SearchResult[] = items.map((item, index) => ({
        title: stripHtmlTags(item.title),
        category: item.category,
        address: item.roadAddress || item.address,
        phone: item.telephone,
        distance: '',
        link: item.link,
        index,
      }))

      const parsedMarkers: MapMarker[] = items
        .map((item, index) => {
          const lng = Number(item.mapx) / 10_000_000
          const lat = Number(item.mapy) / 10_000_000
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null
          return {
            lat,
            lng,
            title: stripHtmlTags(item.title),
            address: item.roadAddress || item.address,
            phone: item.telephone,
            index,
          }
        })
        .filter((m): m is MapMarker => m !== null)

      setResults(parsedResults)
      setMarkers(parsedMarkers)
      setActiveIndex(null)
    } catch {
      setError('네트워크 오류가 발생했습니다')
      setResults([])
      setMarkers([])
    } finally {
      setIsSearching(false)
    }
  }, [query])

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 정보를 사용할 수 없습니다')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationQuery = `${query || '재활치료'} ${latitude},${longitude}`
        // Search with query near location
        const q = query.trim() || '재활치료'
        setQuery(q)
        handleSearch(q)
        // Note: Naver local search doesn't directly support lat/lng filtering,
        // but the search query can include area info
        void locationQuery // location can be used for distance calc later
      },
      () => {
        setError('위치 정보를 가져올 수 없습니다. 위치 권한을 확인하세요.')
      }
    )
  }, [query, handleSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleMarkerClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  return (
    <MainLayout title={language === 'ko' ? '주변 치료센터' : 'Therapy Centers'}>
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  placeholder={language === 'ko' ? '재활치료, 물리치료, 작업치료 등 검색...' : 'Search therapy centers...'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                  className="gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {language === 'ko' ? '검색' : 'Search'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUseMyLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {language === 'ko' ? '내 위치 사용' : 'My Location'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Notice */}
        {!NAVER_MAP_KEY && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {language === 'ko' ? '네이버 지도 API 설정 필요' : 'Naver Maps API Setup Required'}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {language === 'ko'
                    ? '.env.local 파일에 다음 환경변수를 추가하세요: NEXT_PUBLIC_NAVER_MAP_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET'
                    : 'Add to .env.local: NEXT_PUBLIC_NAVER_MAP_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="p-4">
              <p className="text-sm text-error">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Map + Results */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {language === 'ko' ? '지도' : 'Map'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <NaverMap
                    apiKey={NAVER_MAP_KEY}
                    markers={markers}
                    onMarkerClick={handleMarkerClick}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {language === 'ko' ? '검색 결과' : 'Results'}
                  {results.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
                      {results.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SearchResults
                  results={results}
                  activeIndex={activeIndex}
                  onCardClick={handleCardClick}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
