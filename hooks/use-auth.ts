'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const store = useAuthStore()

  // 최초 1회만 init
  useEffect(() => {
    store._init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    user: store.user,
    session: store.session,
    therapist: store.therapist,
    isLoading: store.isLoading,
    signIn: store.signIn,
    signOut: store.signOut,
  }
}
