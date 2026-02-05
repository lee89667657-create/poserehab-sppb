'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 운동 기록 페이지는 데이터/기록 페이지로 통합되었습니다.
export default function HistoryRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/data-records')
  }, [router])
  return null
}
