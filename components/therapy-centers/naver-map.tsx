'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface MarkerData {
  lat: number
  lng: number
  title: string
  address: string
  phone: string
  index: number
}

interface NaverMapProps {
  apiKey: string
  markers?: MarkerData[]
  onMarkerClick?: (index: number) => void
}

// Default position: 대구과학대
const DEFAULT_LAT = 35.9070
const DEFAULT_LNG = 128.6025
const DEFAULT_ZOOM = 14

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: Record<string, unknown>
        ) => NaverMap
        LatLng: new (lat: number, lng: number) => NaverLatLng
        LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds
        Marker: new (opts: Record<string, unknown>) => NaverMarker
        InfoWindow: new (opts: Record<string, unknown>) => NaverInfoWindow
        Event: {
          addListener: (
            instance: unknown,
            event: string,
            handler: () => void
          ) => void
        }
      }
    }
  }
}

interface NaverLatLng {
  lat(): number
  lng(): number
}

interface NaverLatLngBounds {
  extend(latlng: NaverLatLng): NaverLatLngBounds
}

interface NaverMap {
  setCenter(latlng: NaverLatLng): void
  setZoom(zoom: number): void
  fitBounds(bounds: NaverLatLngBounds, padding?: Record<string, number>): void
}

interface NaverMarker {
  setMap(map: NaverMap | null): void
}

interface NaverInfoWindow {
  open(map: NaverMap, marker: NaverMarker): void
  close(): void
}

export function NaverMap({ apiKey, markers = [], onMarkerClick }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<NaverMap | null>(null)
  const markerInstancesRef = useRef<NaverMarker[]>([])
  const infoWindowRef = useRef<NaverInfoWindow | null>(null)
  const scriptLoadedRef = useRef(false)

  const clearMarkers = useCallback(() => {
    markerInstancesRef.current.forEach((m) => m.setMap(null))
    markerInstancesRef.current = []
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
      infoWindowRef.current = null
    }
  }, [])

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps) return

    const center = new window.naver.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG)
    const map = new window.naver.maps.Map(mapRef.current, {
      center,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      zoomControlOptions: { position: 9 }, // TOP_RIGHT
    })
    mapInstanceRef.current = map
  }, [])

  // Load Naver Maps SDK
  useEffect(() => {
    if (!apiKey || scriptLoadedRef.current) return

    // Check if already loaded
    if (window.naver?.maps) {
      scriptLoadedRef.current = true
      initMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${apiKey}`
    script.async = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initMap()
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup is tricky with map SDKs; leave script loaded
    }
  }, [apiKey, initMap])

  // Render markers when markers change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.naver?.maps) return

    clearMarkers()

    if (markers.length === 0) return

    const bounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(markers[0].lat, markers[0].lng),
      new window.naver.maps.LatLng(markers[0].lat, markers[0].lng)
    )

    markers.forEach((m) => {
      const position = new window.naver.maps.LatLng(m.lat, m.lng)
      bounds.extend(position)

      const marker = new window.naver.maps.Marker({
        map,
        position,
        title: m.title,
        icon: {
          content: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:28px;height:28px;border-radius:50%;
            background:#4A90D9;color:#fff;font-weight:700;font-size:13px;
            border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">${m.index + 1}</div>`,
          anchor: { x: 14, y: 14 },
        },
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:12px;min-width:200px;font-size:13px;line-height:1.6;">
              <strong style="font-size:14px;">${m.title}</strong><br/>
              <span style="color:#666;">${m.address}</span><br/>
              ${m.phone ? `<span style="color:#4A90D9;">${m.phone}</span>` : ''}
            </div>
          `,
          borderColor: '#ddd',
          borderWidth: 1,
        })

        infoWindow.open(map, marker)
        infoWindowRef.current = infoWindow

        onMarkerClick?.(m.index)
      })

      markerInstancesRef.current.push(marker)
    })

    if (markers.length > 1) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    } else {
      map.setCenter(new window.naver.maps.LatLng(markers[0].lat, markers[0].lng))
      map.setZoom(16)
    }
  }, [markers, clearMarkers, onMarkerClick])

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <AlertTriangle className="h-10 w-10 text-warning" />
          <div className="text-center">
            <p className="font-semibold text-text-primary">
              네이버 지도 API 키가 설정되지 않았습니다
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              .env.local 파일에 NEXT_PUBLIC_NAVER_MAP_KEY 를 추가하세요
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      ref={mapRef}
      className="h-full w-full min-h-[400px] rounded-lg border border-border"
    />
  )
}
