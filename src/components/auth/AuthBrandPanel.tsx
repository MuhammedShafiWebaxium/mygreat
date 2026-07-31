import { Image } from '@/lib/navigation'
import { Link } from '@/lib/navigation'
import { CheckCircle2, Compass, ShieldCheck } from 'lucide-react'

const FEATURES = [
  'Track every application in one place',
  'Stay ahead of documents and deadlines',
  'Work directly with your admissions team',
]

export function AuthBrandPanel() {
  return (
    <section className="login-brand-panel relative border-r border-white/10 px-10 py-10 text-white xl:px-16 xl:py-12">
      <div className="absolute -left-44 -top-40 size-[500px] rounded-full bg-indigo-600/25 blur-[110px]" />
      <div className="absolute -bottom-56 right-[-12rem] size-[520px] rounded-full bg-amber-400/15 blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.035] noise" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-[min(88%,780px)] opacity-90 mix-blend-screen" style={{ maskImage: 'linear-gradient(135deg, transparent 8%, black 58%)' }}>
        <Image src="/images/glob.png" alt="" width={1024} height={1024} priority className="h-auto w-full brightness-[1.65] contrast-110 saturate-125" />
      </div>

      <Link href="/" className="relative z-10 flex w-fit items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/20"><Compass className="size-6 text-[#10172a]" strokeWidth={2.4} /></span>
        <span><span className="block font-display text-2xl leading-none">Mygreat</span><span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-white/45">Study Abroad</span></span>
      </Link>

      <div className="relative z-10 my-auto max-w-lg py-16">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3.5 py-2 text-xs font-semibold text-amber-200"><ShieldCheck className="size-3.5" /> One secure workspace</p>
        <h1 className="font-display text-5xl font-light leading-[1.04] tracking-[-0.025em] xl:text-[4rem]">Your next chapter,<br /><span className="text-gradient-gold font-medium">beautifully organized.</span></h1>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-white/55">From your first shortlist to your final visa decision, keep the whole journey moving with your Mygreat team beside you.</p>
        <div className="mt-9 space-y-4">
          {FEATURES.map((feature) => <div key={feature} className="flex items-center gap-3 text-sm text-white/70"><span className="grid size-6 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/10"><CheckCircle2 className="size-3.5 text-emerald-300" /></span>{feature}</div>)}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/40">
        <span>Trusted guidance</span><span className="size-1 rounded-full bg-white/25" /><span>Secure student data</span><span className="size-1 rounded-full bg-white/25" /><span>Human support</span>
      </div>
    </section>
  )
}
