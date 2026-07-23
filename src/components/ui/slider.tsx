'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> & {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: SliderProps) {
  const currentValue = value?.[0]
  const initialValue = defaultValue?.[0]
  const numericMin = Number(min)
  const numericMax = Number(max)
  const displayedValue = currentValue ?? initialValue ?? numericMin
  const progress = ((displayedValue - numericMin) / (numericMax - numericMin)) * 100

  return (
    <input
      type="range"
      data-slot="slider"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      defaultValue={currentValue === undefined ? initialValue : undefined}
      onChange={(event) => onValueChange?.([event.currentTarget.valueAsNumber])}
      style={{
        background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`,
      }}
      className={cn(
        'h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none',
        '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
        '[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white',
        '[&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full',
        '[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white',
        'focus-visible:ring-4 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Slider }
