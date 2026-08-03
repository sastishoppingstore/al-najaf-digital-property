import { Phone, MapPin, Clock, ExternalLink, Building2, Info, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { getBranches, waLink, telLink, localizedBranchLabel } from '@/lib/branchData';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

export function BranchesPage() {
  const { lang } = useLang();
  const u = lang === 'ur';
  const branches = getBranches();

  return (
    <div className="bg-gradient-to-br from-amber-50 via-cream to-yellow-50/80 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <Reveal variant="up">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-600">
              <Building2 className="h-3.5 w-3.5" /> {u ? 'ہماری شاخیں' : 'Our Branches'}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold text-navy-800 sm:text-4xl">
              {u ? 'ہماری شاخیں' : 'All Branches'}
            </h1>
            <p className="mt-2 text-navy-500">
              {u ? 'اپنی قریب ترین شاخ سے رابطہ کریں' : 'Visit or contact a branch near you'}
            </p>
          </div>
        </Reveal>

        {/* Branch cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {branches.map((b, i) => (
            <Reveal key={i} variant="up" delay={(i % 2) + 1}>
              <div className="card-3d tilt-3d flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-300">
                    {localizedBranchLabel(b.label || `Branch ${i + 1}`, lang)}
                  </span>
                  <Building2 className="h-5 w-5 text-gold-400" />
                </div>
                <h2 className="mt-3 font-serif text-xl font-bold text-navy-800">{b.name}</h2>

                <div className="mt-4 space-y-3 text-sm flex-1">
                  {b.contactPerson && (
                    <p className="flex items-center gap-2.5 text-navy-700">
                      <User className="h-4 w-4 shrink-0 text-gold-500" />
                      <span className="text-navy-500">{u ? 'رابطہ شخص:' : 'Contact Person:'}</span>
                      <span className="font-semibold text-navy-800">{b.contactPerson}</span>
                    </p>
                  )}
                  {b.address ? (
                    <p className="flex items-start gap-2.5 text-navy-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /> <span className="leading-relaxed">{b.address}</span></p>
                  ) : (
                    <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-100 p-2.5 text-navy-500">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {u ? 'اس برانچ کا پتہ جلد اپ ڈیٹ کیا جائے گا۔ رابطہ کے لیے درج ذیل نمبر استعمال کریں۔' : 'This branch address will be updated soon. Use the contact number below to reach us.'}
                    </p>
                  )}
                  {b.phone && (
                    <p className="flex items-center gap-2.5 text-navy-700">
                      <Phone className="h-4 w-4 shrink-0 text-gold-500" />
                      <a href={telLink(b.phone)} className="font-semibold text-navy-800 hover:text-gold-600">{b.phone}</a>
                    </p>
                  )}
                  {b.phone2 && (
                    <p className="flex items-center gap-2.5 text-navy-700">
                      <Phone className="h-4 w-4 shrink-0 text-gold-500" />
                      <a href={telLink(b.phone2)} className="font-semibold text-navy-800 hover:text-gold-600">{b.phone2}</a>
                    </p>
                  )}
                  {b.whatsapp && (
                    <p className="flex items-center gap-2.5 text-navy-700">
                      <WhatsAppIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                      <a href={waLink(b.whatsapp)} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-800 hover:text-emerald-600">{b.whatsapp}</a>
                    </p>
                  )}
                  {b.hours && (
                    <p className="flex items-center gap-2.5 text-navy-700"><Clock className="h-4 w-4 shrink-0 text-gold-500" /> {b.hours}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {b.phone && (
                    <a href={telLink(b.phone)} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800">
                      <Phone className="h-4 w-4" /> {u ? 'کال کریں' : 'Call'}
                    </a>
                  )}
                  {b.phone2 && (
                    <a href={telLink(b.phone2)} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800">
                      <Phone className="h-4 w-4" /> {u ? 'کال 2' : 'Call 2'}
                    </a>
                  )}
                  {b.whatsapp && (
                    <a href={waLink(b.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe57]">
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  {b.maps && (
                    <a href={b.maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-600 transition hover:bg-navy-50">
                      <ExternalLink className="h-4 w-4" /> {u ? 'نقشہ' : 'Google Maps'}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
