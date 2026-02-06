'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function Home() {
  const router = useRouter()
  const { session, isLoading } = useAuth()
  const redirected = useRef(false)

  useEffect(() => {
    if (redirected.current) return
    if (!isLoading) {
      redirected.current = true
      router.replace(session ? '/patients' : '/login')
    }
  }, [session, isLoading, router])

  // 5초 타임아웃: auth 로딩이 안 풀리면 로그인으로 이동
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!redirected.current) {
        redirected.current = true
        router.replace('/login')
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
