import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Building2, Mail, Phone, Users } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { getPartnerDetailFn } from '@/features/admin/detail.functions'

export const Route = createFileRoute('/staff/partners/$partnerCompanyId')({
  loader: ({ params }) => getPartnerDetailFn({ data: params.partnerCompanyId }),
  component: PartnerDetail,
})

function PartnerDetail() {
  const partner = Route.useLoaderData()
  return <div className="space-y-5">
    <Link href="/staff/partners" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-amber-300"><ArrowLeft className="size-4" />Back to partners</Link>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex gap-5"><span className="grid size-16 place-items-center rounded-2xl bg-indigo-400/10"><Building2 className="size-7 text-indigo-300" /></span><div><h2 className="font-display text-3xl">{partner.name}</h2><p className="mt-1 text-xs text-white/35">Registration {partner.registrationNumber} · {partner.country}</p></div></div></section>
    <section className="grid gap-5 lg:grid-cols-3"><div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6 lg:col-span-2"><h3 className="font-display text-xl">Company details</h3><p className="mt-4 text-xs text-white/60">{partner.address}</p><p className="mt-3 flex items-center gap-2 text-xs"><Mail className="size-3" />{partner.contactEmail}</p><p className="mt-2 flex items-center gap-2 text-xs"><Phone className="size-3" />{partner.contactPhone}</p></div><div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><Users className="size-5 text-amber-300" /><p className="mt-4 font-display text-3xl">{partner.assignedStudentCount}</p><p className="text-xs text-white/45">Assigned students</p></div></section>
  </div>
}
