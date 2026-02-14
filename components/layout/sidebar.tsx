'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ClipboardList,
  Settings,
  Moon,
  Sun,
  Monitor,
  MonitorSmartphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Palette,
  Database,
  Users,
  LogOut,
  Bone,
  Search,
  FileText,
  BarChart3,
  MapPin,
  Camera,
  Box,
  Dumbbell,
  BookOpen,
  ListChecks,
  Gamepad2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore, type Theme, type ColorTheme } from '@/stores/settings-store'
import { useTranslation } from '@/hooks/use-translation'
import { useAuth } from '@/hooks/use-auth'

type NavItem = {
  href: string
  icon: React.ElementType
  labelKey: string
  external?: boolean
  children?: { href: string; icon: React.ElementType; labelKey: string }[]
}

const navItems: NavItem[] = [
  { href: '/patients', icon: Users, labelKey: 'nav.patients' },
  { href: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { href: '/patient', icon: MonitorSmartphone, labelKey: 'nav.patientDashboard', external: true },
  {
    href: '/posture-analysis', icon: Camera, labelKey: 'nav.postureAnalysis',
    children: [
      { href: '/posture-analysis/ai-3d', icon: Box, labelKey: 'nav.ai3dAnalysis' },
    ],
  },
  {
    href: '/exercise/list', icon: Dumbbell, labelKey: 'nav.exercise',
    children: [
      { href: '/exercise/guided', icon: BookOpen, labelKey: 'nav.guidedExercise' },
      { href: '/exercise/list', icon: ListChecks, labelKey: 'nav.exerciseList' },
      { href: '/exercise/games', icon: Gamepad2, labelKey: 'nav.exerciseGames' },
    ],
  },
  { href: '/gait-analysis', icon: ClipboardList, labelKey: 'nav.assessmentTools' },
  { href: '/anatomy', icon: Bone, labelKey: 'nav.anatomy' },
  { href: '/anatomy-search', icon: Search, labelKey: 'nav.anatomySearch' },
  { href: '/soap', icon: FileText, labelKey: 'nav.soap' },
  { href: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { href: '/therapy-centers', icon: MapPin, labelKey: 'nav.therapyCenters' },
  { href: '/data-records', icon: Database, labelKey: 'nav.dataRecords' },
]

const themeOptions: { value: Theme; icon: React.ElementType; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
]

const colorOptions: { value: ColorTheme; color: string }[] = [
  { value: 'default', color: '#6366F1' },
  { value: 'blue', color: '#3B82F6' },
  { value: 'green', color: '#10B981' },
  { value: 'pink', color: '#EC4899' },
  { value: 'orange', color: '#F97316' },
  { value: 'purple', color: '#8B5CF6' },
  { value: 'teal', color: '#14B8A6' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, colorTheme, sidebarCollapsed, setTheme, setColorTheme, toggleSidebar } = useSettingsStore()
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  // store 상태 사용
  const isCollapsed = sidebarCollapsed

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  // Auto-expand parent if child is active
  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'))

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 210 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-white">P</span>
              </div>
              <span className="font-semibold text-text-primary">PostureAI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedMenus.has(item.href) || isChildActive(item)

          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-text-secondary hover:bg-background hover:text-text-primary"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate text-sm font-medium"
                    >
                      {t(item.labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </a>
            )
          }

          // Items with sub-menu
          if (hasChildren) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleMenu(item.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 truncate text-left text-sm font-medium"
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
                        {item.children!.map((child) => {
                          const isChildItemActive = pathname === child.href || pathname.startsWith(child.href + '/')
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors',
                                isChildItemActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
                              )}
                            >
                              <child.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate text-xs font-medium">{t(child.labelKey)}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate text-sm font-medium"
                  >
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* 하단 고정: 설정 + 로그아웃 */}
      <div className="space-y-1 px-3 pb-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary'
              : 'text-text-secondary hover:bg-background hover:text-text-primary'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate text-sm font-medium"
              >
                {t('nav.settings')}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate text-sm font-medium"
              >
                {t('auth.logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Theme Section */}
      <div className="border-t border-border px-3 py-4">
        {/* Theme Mode */}
        <div className="mb-4 flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-xs font-medium text-text-secondary">
              {t('theme.mode')}
            </span>
          )}
          <div className={cn('flex gap-1', isCollapsed && 'flex-col')}>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  theme === option.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                )}
                title={t(option.labelKey)}
              >
                <option.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            <Palette className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">{t('theme.color')}</span>
            )}
            <div
              className="ml-auto h-4 w-4 rounded-full border border-border"
              style={{
                backgroundColor:
                  colorOptions.find((c) => c.value === colorTheme)?.color ||
                  colorOptions[0].color,
              }}
            />
          </button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'absolute bottom-full mb-2 rounded-lg border border-border bg-surface p-2 shadow-lg',
                  isCollapsed ? 'left-0' : 'left-0 right-0'
                )}
              >
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setColorTheme(option.value)
                        setShowColorPicker(false)
                      }}
                      className={cn(
                        'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                        colorTheme === option.value
                          ? 'border-text-primary'
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: option.color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
