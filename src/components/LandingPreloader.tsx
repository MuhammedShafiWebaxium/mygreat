'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  FileText,
  Folder,
  GraduationCap,
  Globe,
  Plane,
  MapPin,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

const steps = [
  { label: 'Application', icon: FileText },
  { label: 'Documents', icon: Folder },
  { label: 'Universities', icon: GraduationCap },
  { label: 'Visa', icon: Globe },
  { label: 'Journey', icon: Plane },
]

const pins = [
  { label: 'CANADA', className: 'left-[18%] top-[26%]' },
  { label: 'USA', className: 'left-[21%] top-[45%]' },
  { label: 'UK', className: 'right-[31%] top-[25%]' },
  { label: 'AUSTRALIA', className: 'right-[16%] bottom-[27%]' },
]

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 130"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left Wing / Book Page */}
      <path
        d="M96 118C70 102 38 100 12 108C8 109.5 4 106.5 4 102V36C4 32.5 7 29.5 10.5 29.5C36 29.5 68 37 96 52V118Z"
        fill="url(#brand-logo-grad)"
      />
      {/* Right Wing / Book Page */}
      <path
        d="M104 118C130 102 162 100 188 108C192 109.5 196 106.5 196 102V36C196 32.5 193 29.5 189.5 29.5C164 29.5 132 37 104 52V118Z"
        fill="url(#brand-logo-grad)"
      />
      {/* Center Airplane Silhouette */}
      <path
        d="M100 38L96 66L84 69L84 74L97 72L98 84L94 87L94 90L100 88L106 90L106 87L102 84L103 72L116 74L116 69L104 66L100 38Z"
        fill="#fcd34d"
      />
      <defs>
        <linearGradient id="brand-logo-grad" x1="4" y1="29.5" x2="196" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FloatingPlane({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M92 42L56 24C53.5 22.8 50.5 24.2 49.5 26.8L44 41L20 34C18.3 33.5 16.5 34.4 15.8 36L12 44.5L28 54L19 68L9 66L5 72L22 81L37 77L49 61L74 71C76 71.8 78.2 71 79.2 69L93.5 48.5C94.8 46.5 94.2 43.1 92 42Z" />
    </svg>
  )
}

export function LandingPreloader({ onComplete }: { onComplete: () => void }) {
  const theme = useAppStore((state) => state.theme)
  const isLight = theme === 'light'
  const reduceMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
    }
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      setProgress(100)
      const timeout = window.setTimeout(onComplete, 250)
      return () => window.clearTimeout(timeout)
    }

    const startedAt = performance.now()
    const duration = 3200
    let frame = 0

    const tick = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - elapsed, 3)
      setProgress(Math.round(eased * 100))
      if (elapsed < 1) frame = requestAnimationFrame(tick)
      else window.setTimeout(onComplete, 350)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [onComplete, reduceMotion])

  return (
    <motion.div
      className={`fixed inset-0 z-[9999] grid h-[100svh] w-screen touch-none place-items-center overflow-hidden overscroll-none ${
        isLight ? 'bg-[#f8fafc] text-[#172033]' : 'bg-[#070b18] text-white'
      }`}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
      transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
      role="status"
      aria-label={`Preparing your future, ${progress}%`}
    >
      {/* Background Soft Glows (Matching app theme radial gradients) */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_4%,rgba(245,158,11,0.12),transparent_28rem),radial-gradient(circle_at_12%_92%,rgba(99,102,241,0.08),transparent_30rem)]" />
          <div className="absolute inset-0 opacity-[0.02] noise" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(99,102,241,.15),transparent_35%),radial-gradient(circle_at_15%_25%,rgba(245,158,11,.12),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(99,102,241,.1),transparent_30%)]" />
          <div className="absolute inset-0 opacity-[0.035] noise" />
        </>
      )}

      {/* World Map Dotted Pattern Background & Flight Arc */}
      <svg className={`absolute inset-0 h-full w-full ${isLight ? 'opacity-35' : 'opacity-[0.18]'}`} viewBox="0 0 1440 900" aria-hidden="true">
        <defs>
          <pattern id="dot-grid-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill={isLight ? '#64748b' : '#a5b4fc'} opacity={isLight ? 0.4 : 0.6} />
          </pattern>
          <mask id="world-map-mask-preloader">
            <rect width="1440" height="900" fill="black" />
            <path fill="white" d="M120 220l85-60 160-20 140 40 40 70-70 40-35 105-60 85-80-15-35-85-65-35-80-110zm390-70l145-55 125 15 65 55-60 45-35 90-65 15-35-80-85-30-55-55zm320 110l90-65 95 15 80-65 150 1 100 65-45 50-95 2-55 65-85-3-35-50-70 22-130-37zm310 130l95-20 88 47 25 105-62 57-98-29-33-85-17-75zm-380-10l58 27 47 115-31 133-61-45-25-135 12-95z" />
          </mask>
        </defs>
        <rect width="1440" height="900" fill="url(#dot-grid-pattern)" mask="url(#world-map-mask-preloader)" />
        
        {/* Curved Flight Line in App Amber accent */}
        <motion.path
          d="M 230 520 Q 320 120, 1100 150"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="6 8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: isLight ? 0.5 : 0.7 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
      </svg>

      {/* Map Pins with Amber Accent */}
      {pins.map((pin, index) => (
        <motion.div
          key={pin.label}
          className={`absolute hidden -translate-x-1/2 text-center sm:block ${pin.className}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.12 }}
        >
          <div className="relative mx-auto flex size-8 items-center justify-center">
            <span className={`absolute inset-0 rounded-full blur-sm ${isLight ? 'bg-amber-500/25' : 'bg-amber-400/20'}`} />
            <MapPin className={`relative size-6 ${isLight ? 'fill-amber-400/30 text-amber-600' : 'fill-amber-400/20 text-amber-400'}`} />
          </div>
          <span className={`mt-1 block text-[11px] font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-white/50'}`}>{pin.label}</span>
        </motion.div>
      ))}

      {/* Top Right Animated Flying Plane */}
      <motion.div
        className="absolute right-[18%] top-[14%] hidden sm:block"
        initial={{ x: -40, y: 20, opacity: 0, rotate: -15 }}
        animate={{ x: 0, y: 0, opacity: 0.85, rotate: -12 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      >
        <FloatingPlane className={`w-16 ${isLight ? 'text-amber-500/80 drop-shadow-[0_8px_16px_rgba(245,158,11,0.25)]' : 'text-amber-300 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]'}`} />
      </motion.div>

      {/* Center Preloader Box */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center">
        {/* Logo Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-3"
        >
          <BrandLogo className="h-20 w-auto drop-shadow-[0_10px_25px_rgba(245,158,11,0.3)]" />
        </motion.div>

        {/* Brand Name using app text-gradient-gold */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-5xl font-semibold tracking-tight sm:text-6xl"
        >
          <span className={isLight ? 'text-slate-900' : 'text-white'}>
            My<span className="text-gradient-gold">great</span>
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-2 text-sm font-medium tracking-wide sm:text-base ${isLight ? 'text-slate-600' : 'text-white/60'}`}
        >
          Your Dream. Our Expertise. Your Future.
        </motion.p>

        {/* Steps Flow Icons */}
        <div className="mt-10 hidden w-full items-center justify-center gap-4 sm:flex">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`grid size-12 place-items-center rounded-xl border backdrop-blur-md ${
                  isLight
                    ? 'border-slate-200 bg-white/80 shadow-md shadow-slate-200/50'
                    : 'border-white/10 bg-white/[0.04] shadow-inner'
                }`}>
                  <step.icon className={`size-6 ${isLight ? 'text-slate-800' : 'text-indigo-200'}`} strokeWidth={1.5} />
                </div>
                <p className={`mt-2 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>{step.label}</p>
              </motion.div>
              {index < steps.length - 1 && (
                <span className={`mb-5 text-sm font-semibold ${isLight ? 'text-amber-500' : 'text-amber-400/60'}`}>&gt;</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar & Flying Plane Indicator in App Gold/Amber */}
        <div className="mt-10 w-full max-w-md">
          <p className={`mb-3 text-xs font-semibold tracking-wide ${isLight ? 'text-amber-700' : 'text-amber-200/90'}`}>
            Preparing your future...
          </p>
          
          <div className="relative">
            <div className={`relative h-2 w-full overflow-hidden rounded-full ${isLight ? 'bg-slate-200/80 ring-1 ring-slate-300/50' : 'bg-white/[0.08] ring-1 ring-white/10'}`}>
              <motion.div
                className={`h-full rounded-full ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 shadow-sm'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.15, ease: 'easeOut' }}
              />
            </div>

            {/* Plane icon sliding at progress edge */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2"
              initial={{ left: '0%' }}
              animate={{ left: `${Math.min(Math.max(progress, 2), 98)}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.15, ease: 'easeOut' }}
            >
              <div className="relative -ml-3 flex items-center">
                <div className={`mr-1 h-[2px] w-6 ${isLight ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-amber-500' : 'bg-gradient-to-r from-transparent via-amber-400/40 to-amber-300'}`} />
                <Plane className={`size-5 rotate-45 ${
                  isLight
                    ? 'text-amber-600 drop-shadow-[0_2px_4px_rgba(217,119,6,0.3)]'
                    : 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`} strokeWidth={2.2} />
              </div>
            </motion.div>

          </div>

          {/* Progress Percentage */}
          <div className={`mt-3 text-center text-xs font-bold tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-200/90'}`}>
            {progress}%
          </div>
        </div>
      </div>
    </motion.div>
  )
}


