import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access_token: string, refresh_token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      setAuth: (user, access_token, refresh_token) => {
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        set({ user, access_token, refresh_token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.clear()
        set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false })
      },
    }),
    { name: 'campusiq-auth', partialize: (s) => ({ user: s.user, access_token: s.access_token, refresh_token: s.refresh_token, isAuthenticated: s.isAuthenticated }) }
  )
)

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const next = !get().isDark
        document.documentElement.classList.toggle('dark', next)
        set({ isDark: next })
      },
    }),
    { name: 'campusiq-theme' }
  )
)
