'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 3D 아바타 페이지는 현재 사용하지 않습니다.
export default function AvatarRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return null
}
