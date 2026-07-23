'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function Switch({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = checked ?? internalChecked

  function toggle() {
    if (disabled) return
    const next = !isChecked
    if (checked === undefined) setInternalChecked(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-slot="switch"
      data-state={isChecked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none transition-colors',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isChecked ? 'bg-primary' : 'bg-input dark:bg-input/80',
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={isChecked ? 'checked' : 'unchecked'}
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform',
          isChecked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export { Switch }
