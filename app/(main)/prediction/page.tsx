'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 통증 예측 페이지는 현재 사용하지 않습니다.
export default function PredictionRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
}
