import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Therapist } from '@/types/database'

interface AuthStore {
  user: User | null
  session: Session | null
  therapist: Therapist | null
  isLoading: boolean
  _initialized: boolean
  _init: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  therapist: null,
  isLoading: true,
  _initialized: false,

  _init: () => {
    if (get()._initialized) return
    set({ _initialized: true })

    // 초기 세션 가져오기
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('therapists')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ user: session.user, session, therapist: (data as Therapist | null), isLoading: false })
      } else {
        set({ user: null, session: null, therapist: null, isLoading: false })
      }
    }).catch(() => {
      set({ user: null, session: null, therapist: null, isLoading: false })
    })

    // 인증 상태 변화 리스너
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // therapist가 이미 캐시되어 있고 같은 유저면 재사용
        const current = get()
        if (current.therapist && current.user?.id === session.user.id) {
          set({ user: session.user, session, isLoading: false })
        } else {
          const { data } = await supabase
            .from('therapists')
            .select('*')
            .eq('id', session.user.id)
            .single()
          set({ user: session.user, session, therapist: (data as Therapist | null), isLoading: false })
        }
      } else {
        set({ user: null, session: null, therapist: null, isLoading: false })
      }
    })
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false })
      throw error
    }
    // 세션 + 치료사 데이터를 스토어에 즉시 반영 (onAuthStateChange 대기하지 않음)
    if (data.session?.user) {
      const { data: therapistData } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', data.session.user.id)
        .single()
      set({
        user: data.session.user,
        session: data.session,
        therapist: (therapistData as Therapist | null),
        isLoading: false,
      })
    } else {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, therapist: null, isLoading: false })
  },
}))
