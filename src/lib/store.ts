import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { OnboardingData } from '@/types'
import { onboardingSchema } from '@/features/profile/profile.schema'
import { accountSchema, type Account } from '@/features/auth/auth.schema'

export { accountSchema, onboardingSchema, type Account }

interface AppState {
  theme: 'light' | 'dark'
  profile: OnboardingData | null
  account: Account | null
  toggleTheme: () => void
  setProfile: (profile: OnboardingData) => void
  setAccount: (account: Account) => void
  clear: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      profile: null,
      account: null,
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setProfile: (profile) => set({ profile: onboardingSchema.parse(profile) }),
      setAccount: (account) => set({ account: accountSchema.parse(account) }),
      clear: () => set({ profile: null, account: null }),
    }),
    {
      name: 'mygreat.session',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: ({ theme, profile, account }) => ({ theme, profile, account }),
    },
  ),
)

// Compatibility helpers keep migrated components small while new code uses the hook.
export const saveOnboarding = (profile: OnboardingData) =>
  useAppStore.getState().setProfile(profile)
export const loadOnboarding = () => useAppStore.getState().profile
export const saveAccount = (account: Account) =>
  useAppStore.getState().setAccount(account)
export const loadAccount = () => useAppStore.getState().account
export const clearStore = () => useAppStore.getState().clear()

