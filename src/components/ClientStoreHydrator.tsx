'use client'

import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

export function ClientStoreHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAppStore.persist.rehydrate()
  }, [])

  return children
}

