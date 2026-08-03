import { ProductCard } from '@/components/ProductCard';
import { getManagedServices } from '@/lib/contentManager';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

export function ServicesPage() {
  const { t } = useLang();
  const [servicesList, setServicesList] = useState(() => getManagedServices());
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const cats = ['legal', 'utility', 'valuation'];
  const filtered = servicesList.filter((s) => {
    if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && s.category !== cat) return false;
    return true;
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-800 py-14">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-banner-3.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">{t('nav.associates')}</span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl enter-3d">{t('services.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-navy-100">{t('services.subtitle')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('services.searchPlaceholder')} className="w-full rounded-xl border border-navy-100 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCat('')} className={`rounded-xl px-4 py-2.5 text-sm font-medium ${!cat ? 'bg-navy-700 text-white' : 'bg-white border border-navy-100 text-navy-600 hover:bg-navy-50'}`}>{t('common.all')}</button>
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(cat === c ? '' : c)} className={`rounded-xl px-4 py-2.5 text-sm font-medium capitalize ${cat === c ? 'bg-gold-400 text-navy-800' : 'bg-white border border-navy-100 text-navy-600 hover:bg-navy-50'}`}>{c}</button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-navy-500">{filtered.length} {t('services.available')}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <Reveal key={s.id} variant="up" delay={(i % 3) + 1}>
              <ProductCard variant="service" service={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
