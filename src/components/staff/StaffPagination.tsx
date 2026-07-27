'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const STAFF_PAGE_SIZE = 10

export function StaffPagination({
  page,
  total,
  onPageChange,
  pageSize = STAFF_PAGE_SIZE,
}: {
  page: number
  total: number
  onPageChange: (page: number) => void
  pageSize?: number
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = total ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage * pageSize, total)
  if (total <= pageSize) return null

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === pageCount || Math.abs(value - currentPage) <= 1)

  return <div className="flex flex-col gap-3 border-t border-white/[.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p className="text-[10.5px] text-white/35">Showing {start}–{end} of {total}</p>
    <div className="flex items-center gap-1.5">
      <button aria-label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/50 disabled:opacity-30"><ChevronLeft className="size-3.5" /></button>
      {pages.map((value, index) => {
        const previous = pages[index - 1]
        return <span key={value} className="contents">
          {previous && value - previous > 1 && <span className="px-1 text-xs text-white/25">…</span>}
          <button onClick={() => onPageChange(value)} className={cn('grid size-8 place-items-center rounded-lg border text-[10.5px] font-semibold', value === currentPage ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/10 text-white/45')}>{value}</button>
        </span>
      })}
      <button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)} className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/50 disabled:opacity-30"><ChevronRight className="size-3.5" /></button>
    </div>
  </div>
}
