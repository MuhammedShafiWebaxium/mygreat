import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Building2, Globe2, Mail, MapPin, Phone, Users } from 'lucide-react'
import { getSessionUser } from '@/features/auth/session.server'
import { readPartnerProfileForStaff } from '@/features/admin/admin.server'

export const metadata = { title: 'Partner profile' }

export default async function Page({ params }: { params: Promise<{ partnerCompanyId: string }> }) {
  const user = await getSessionUser()
  if (!user || user.accountType !== 'ADMIN') redirect('/staff')
  const { partnerCompanyId } = await params
  const partner = await readPartnerProfileForStaff(user, partnerCompanyId).catch((error) => {
    if (error instanceof Error && error.message === 'Partner profile not found.') return null
    throw error
  })
  if (!partner) notFound()

  return <div className="space-y-5">
    <Link href="/staff/partners" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-amber-300"><ArrowLeft className="size-4" />Back to partners</Link>
    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><span className="grid size-16 place-items-center rounded-2xl bg-indigo-400/10"><Building2 className="size-7 text-indigo-300" /></span><div className="flex-1"><h2 className="font-display text-3xl">{partner.name}</h2><p className="mt-1 text-xs text-white/35">Registration {partner.registrationNumber}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{partner.country}</span>{partner.website && <a href={partner.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-300"><Globe2 className="size-3.5" />{partner.website}</a>}</div></div><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">{partner.status}</span></div></section>

    <section className="grid gap-5 lg:grid-cols-3">
      <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6 lg:col-span-2"><h3 className="font-display text-xl">Company details</h3><dl className="mt-5 grid gap-5 text-xs sm:grid-cols-2">{[
        ['Address', partner.address], ['Contact person', partner.contactName], ['Contact email', partner.contactEmail], ['Contact phone', partner.contactPhone],
        ['Review note', partner.reviewNote || 'No review note'], ['Joined', new Date(partner.createdAt).toLocaleDateString()],
      ].map(([label, value]) => <div key={label}><dt className="text-[9px] uppercase tracking-[.15em] text-white/30">{label}</dt><dd className="mt-1.5 text-white/75">{value}</dd></div>)}</dl></div>
      <div className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><Users className="size-5 text-amber-300" /><p className="mt-4 font-display text-3xl">{partner.assignedStudentCount}</p><p className="mt-1 text-xs text-white/45">Assigned students</p><p className="mt-5 font-display text-3xl">{partner.partners.length}</p><p className="mt-1 text-xs text-white/45">Team members</p></div>
    </section>

    <section className="staff-card rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><h3 className="font-display text-xl">Partner team</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="text-[9px] uppercase tracking-[.16em] text-white/30"><th className="pb-3">Name</th><th className="pb-3">Role</th><th className="pb-3">Contact</th><th className="pb-3">Status</th></tr></thead><tbody className="divide-y divide-white/[.06]">{partner.partners.map((member) => <tr key={member.id}><td className="py-4 text-xs font-semibold">{member.name}</td><td className="py-4 text-xs text-white/50">{member.role.replaceAll('_',' ')}</td><td className="py-4"><p className="flex items-center gap-1.5 text-xs"><Mail className="size-3" />{member.email}</p>{member.phone && <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/35"><Phone className="size-3" />{member.phone}</p>}</td><td className="py-4 text-xs text-emerald-300">{member.active ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div></section>
  </div>
}
