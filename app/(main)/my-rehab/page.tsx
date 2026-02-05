'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 내 재활 현황 페이지는 대시보드로 통합되었습니다.
export default function MyRehabRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
}
