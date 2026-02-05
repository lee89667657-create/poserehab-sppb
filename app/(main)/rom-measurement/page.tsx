'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ROM 카메라 자동측정 페이지는 평가 도구(ROM 탭)로 통합되었습니다.
export default function RomMeasurementRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/gait-analysis')
  }, [router])
  return null
}
