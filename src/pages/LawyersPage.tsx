import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Award, Scale } from 'lucide-react';
import { getManagedLawyers } from '@/lib/contentManager';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

export function LawyersPage() {
  const { t } = useLang();
  const [lawyersList, setLawyersList] = useState(() => getManagedLawyers());
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  const [city, setCity] = useState('');
  const specs = ['Property', 'Civil', 'Criminal', 'Family', 'Corporate'];

  const filtered = lawyersList.filter((l) => {
    if (q && !`${l.name} ${l.designation} ${l.bio}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (spec && !l.specializations.includes(spec)) return false;
    if (city && l.city !== city) return false;
    return true;
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-800 py-14">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-banner-3.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300"><Scale className="h-3.5 w-3.5" /> {t('nav.lawyers')}</span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl enter-3d">{t('lawyers.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-navy-100">{t('lawyers.subtitle')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('lawyers.searchPlaceholder')} className="w-full rounded-xl border border-navy-100 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400" />
          </div>
          <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-400">
            <option value="">{t('lawyers.allSpecs')}</option>
            {specs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-400">
            <option value="">{t('lawyers.allCities')}</option>
            {[...new Set(lawyersList.map((l) => l.city))].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="mt-4 text-sm text-navy-500">{filtered.length} {t('lawyers.found')}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => (
            <Reveal key={l.id} variant="up" delay={(i % 3) + 1}>
              <div className="card-3d group flex flex-col overflow-hidden border border-navy-100/60">
                <div className="relative aspect-[16/9] overflow-hidden bg-navy-100">
                  <img src={l.image} alt={l.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif text-lg font-bold text-white">{l.name}</h3>
                    <p className="text-xs text-white/85">{l.designation}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {l.specializations.map((s) => (
                      <span key={s} className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-600">{s}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-navy-600">
                    <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5 text-gold-500" /> {l.experience} {t('lawyers.yrs')}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" /> {l.rating} ({l.reviews})</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gold-500" /> {l.city}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-navy-50 pt-3">
                    <span className="text-sm font-semibold text-gold-600">Rs {l.fee.toLocaleString()}</span>
                    <span className="text-xs text-navy-400">{t('lawyers.consultation')}</span>
                  </div>
                  <Link to="/services/lawyer" className="mt-3 w-full rounded-xl bg-navy-700 py-2 text-center text-sm font-semibold text-white hover:bg-navy-800">{t('lawyers.bookConsultation')}</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
