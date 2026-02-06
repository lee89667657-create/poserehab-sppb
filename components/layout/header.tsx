'use client'

import { Bell, Globe, User, ChevronRight, LogOut } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { useAuth } from '@/hooks/use-auth'
import { usePatientContextStore } from '@/stores/patient-context-store'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeaderProps {
  title?: string
  showBackButton?: boolean
}

export function Header({ title }: HeaderProps) {
  const { language, setLanguage } = useSettingsStore()
  const { therapist, signOut } = useAuth()
  const { selectedPatientName } = usePatientContextStore()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-sm">
      {/* Title + Breadcrumb */}
      <div className="flex items-center gap-2">
        {title && (
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        )}
        {selectedPatientName && (
          <>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
            <Link href="/patients" className="text-sm text-primary hover:underline">
              {selectedPatientName}
            </Link>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">{language}</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
        </Button>

        {/* Therapist Profile */}
        <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary">
              {therapist?.name || t('common.guest')}
            </p>
            {therapist?.department && (
              <p className="text-[10px] text-text-secondary">{therapist.department}</p>
            )}
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          title={t('auth.logout')}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
