import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Scale, ShieldCheck, MapPin, TrendingUp, Users, Award, Search, Sparkles, ChevronRight, ChevronLeft, BookOpen, Calculator } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { CATEGORIES, SERVICES } from '@/data/mock';
import { getAllProperties, useDataVersion } from '@/lib/dataService';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

export function HomePage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  useDataVersion();
  const allProperties = getAllProperties();
  const featured = allProperties.filter((p) => p.featured || (p as any).status === 'approved' || (p as any).status === 'pending').slice(0, 6);
  const popularServices = SERVICES.slice(0, 6);
  const [slideIdx, setSlideIdx] = useState(0);
  const nextSlide = useCallback(() => setSlideIdx((i) => (i + 1) % featured.length), [featured.length]);
  const prevSlide = useCallback(() => setSlideIdx((i) => (i - 1 + featured.length) % featured.length), [featured.length]);
  useEffect(() => {
    const id = setInterval(nextSlide, 3000);
    return () => clearInterval(id);
  }, [nextSlide]);

  return (
    <div>
      {/* Hero with two panels */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-navy-800 to-amber-950">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-banner-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-navy-900/75 to-amber-900/80 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center enter-3d">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
              <ShieldCheck className="h-3.5 w-3.5" /> {t('hero.badge')}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              {t('hero.title').split('—')[0]}—<span className="text-gold-gradient">{t('hero.title').split('—')[1]}</span>
            </h1>
            <p className="mt-4 text-base text-navy-100 sm:text-lg">{t('hero.subtitle')}</p>
          </div>

          {/* Two panels */}
          <div className="mt-12 grid gap-6 md:grid-cols-2 scene-3d">
            <Reveal variant="left" delay={1}>
              <Panel
                to="/properties"
                eyebrow={t('hero.panelA')}
                title={t('hero.panelA.title')}
                tagline={t('hero.panelA.tagline')}
                cta={t('hero.panelA.cta')}
                icon={<Building2 className="h-6 w-6" />}
                image="/images/hero-banner-2.jpg"
              />
            </Reveal>
            <Reveal variant="right" delay={2}>
              <Panel
                to="/services"
                eyebrow={t('hero.panelB')}
                title={t('hero.panelB.title')}
                tagline={t('hero.panelB.tagline')}
                cta={t('hero.panelB.cta')}
                icon={<Scale className="h-6 w-6" />}
                image="/images/hero-banner-3.jpg"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3D Promo Card - Capital Valley */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="card-3d card-glow tilt-3d rounded-2xl overflow-hidden bg-white/80 backdrop-blur border border-gold-200/40 shadow-gold-lg">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-4">
              <img
                src={localStorage.getItem('hero_promo_image') || '/images/cv-cover.jpg'}
                alt="Capital Valley"
                className="rounded-xl layer-1 w-full h-auto object-cover"
              />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-8">
              <h3 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl leading-relaxed">
                {lang === 'ur'
                  ? (localStorage.getItem('hero_promo_ur') || 'لاہور میں پہلی بار صرف چند ہزار ایڈوانس دے کر بنے ہوئے گھر کے مالک بنیں')
                  : (localStorage.getItem('hero_promo_en') || 'Become the Owner of a Built House with Just a Few Thousand Advance — First Time in Lahore')}
              </h3>
              <Link
                to={localStorage.getItem('hero_promo_link') || '/capital-valley'}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 transition hover:bg-gold-300 hover:shadow-gold"
              >
                {localStorage.getItem('hero_promo_cta') || 'Learn More'} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Calculators: DC Rate & Islamic Inheritance */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <Reveal variant="up">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-600">
              <Calculator className="h-3.5 w-3.5" /> {lang === 'ur' ? 'کیلکولیٹرز' : 'Calculators'}
            </span>
            <h2 className="mt-3 font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{lang === 'ur' ? 'اپنے اخراجات کا حساب لگائیں' : 'Estimate Your Costs & Shares'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-navy-500">{lang === 'ur' ? 'ڈی سی ریٹ رجسٹری اور اسلامی وراثت — دونوں کیلکولیٹر یہاں استعمال کریں' : 'Both calculators in one place — DC Rate registry and Islamic inheritance shares'}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/dc-rate-check" className="card-3d tilt-3d group overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-800 px-6 py-10 text-center shadow-lg transition hover:shadow-xl">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white transition-transform duration-300 group-hover:scale-110">
                <Calculator className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-serif text-2xl font-bold text-white">{lang === 'ur' ? 'ڈی سی ریٹ اور رجسٹری کیلکولیٹر' : 'DC Rate Check & Registry Calculator'}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm text-amber-100">{lang === 'ur' ? 'اپنے علاقے کی ڈی سی ریٹ چیک کریں اور رجسٹری کے تمام اخراجات کا حساب لگائیں' : 'Check DC Rate for your area and auto-calculate all registry expenses'}</p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-amber-800 transition group-hover:gap-3 group-hover:bg-amber-50">
                {lang === 'ur' ? 'کیلکولیٹر استعمال کریں' : 'Use Calculator'} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/islamic-inheritance-calculator" className="card-3d tilt-3d group overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-6 py-10 text-center shadow-lg transition hover:shadow-xl">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-serif text-2xl font-bold text-white">{lang === 'ur' ? 'اسلامی شرعی وراثت کیلکولیٹر' : 'Islamic Inheritance Calculator'}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm text-emerald-100">{lang === 'ur' ? 'شریعت کے مطابق وراثت کے حصوں کا حساب لگائیں' : 'Calculate inheritance shares according to Shar\'i rules (Fara\'idh)'}</p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-emerald-800 transition group-hover:gap-3 group-hover:bg-emerald-50">
                {lang === 'ur' ? 'کیلکولیٹر استعمال کریں' : 'Use Calculator'} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Mega Search Bar */}
      <div className="relative -mt-8 mb-8 mx-auto max-w-4xl px-4 z-10">
        <Link to="/search" className="group flex items-center gap-3 rounded-2xl border border-gold-200 bg-white p-4 shadow-lg transition hover:shadow-xl hover:border-gold-400">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-100 text-gold-600 group-hover:bg-gold-400 group-hover:text-navy-800 transition">
            <Search className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-navy-800 group-hover:text-gold-600 transition">Mega Portal Search</p>
            <p className="text-xs text-navy-400">Search properties, e-stamp, legal docs, fard records & all services</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 group-hover:bg-gold-300">
            <Sparkles className="h-4 w-4" /> Search
          </span>
        </Link>
      </div>

      {/* Stats strip */}
      <section className="border-b border-gold-200/40 bg-gradient-to-r from-amber-50 via-cream to-yellow-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6">
          <Reveal variant="up" delay={1}><Stat icon={<TrendingUp className="h-5 w-5" />} value="12+" label={t('stats.listings')} /></Reveal>
          <Reveal variant="up" delay={2}><Stat icon={<Users className="h-5 w-5" />} value="5,000+" label={t('stats.clients')} /></Reveal>
          <Reveal variant="up" delay={3}><Stat icon={<Award className="h-5 w-5" />} value="17" label={t('stats.services')} /></Reveal>
          <Reveal variant="up" delay={4}><Stat icon={<MapPin className="h-5 w-5" />} value="10+" label={t('stats.cities')} /></Reveal>
        </div>
      </section>

      {/* Featured properties */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionHeader title={t('home.featured')} subtitle={t('home.featuredSub')} link="/properties" viewAllLabel={t('viewAll')} />
        </Reveal>
        {/* Mobile: auto-slider 1 card at a time */}
        <div className="mt-8 lg:hidden">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${slideIdx * 100}%)` }}
              >
                {featured.map((p) => (
                  <div key={p.id} className="w-full shrink-0 px-1">
                    <div className="card-3d card-glow tilt-3d scale-3d-slide">
                      <ProductCard variant="property" property={p} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow text-navy-600 hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow text-navy-600 hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="mt-3 flex justify-center gap-2">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === slideIdx ? 'w-6 bg-gold-500' : 'w-2 bg-navy-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Desktop: grid 4 cols */}
        <div className="mt-8 hidden lg:grid gap-4 grid-cols-4">
          {featured.map((p, i) => (
            <Reveal key={p.id} variant="up" delay={i + 1}>
              <ProductCard variant="property" property={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Property categories */}
      <section className="bg-gradient-to-r from-amber-50/80 via-cream to-yellow-50/80 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader title={t('home.categories')} subtitle={t('home.categoriesSub')} link="/properties" viewAllLabel={t('viewAll')} />
          </Reveal>
          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.slice(0, 8).map((c, i) => (
              <Reveal key={c.id} variant="scale" delay={(i % 4) + 1}>
                <ProductCard variant="category" category={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular services */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionHeader title={t('home.popularServices')} subtitle={t('home.popularServicesSub')} link="/services" viewAllLabel={t('viewAll')} />
        </Reveal>
          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {popularServices.map((s, i) => (
            <Reveal key={s.id} variant="up" delay={(i % 3) + 1}>
              <ProductCard variant="service" service={s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Reveal variant="scale">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-800 via-navy-800 to-gold-900 px-6 py-12 text-center shadow-gold-lg sm:px-12 gradient-animated">
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">{t('home.ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-navy-100">{t('home.ctaSubtitle')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/post-ad" className="rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 transition hover:bg-gold-300 hover:shadow-gold">{t('home.ctaPost')}</Link>
              <Link to="/services" className="rounded-xl border border-gold-400/40 px-6 py-3 font-semibold text-gold-300 transition hover:bg-gold-400/10">{t('home.ctaBrowse')}</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Panel({ to, eyebrow, title, tagline, cta, icon, image }: {
  to: string; eyebrow: string; title: string; tagline: string; cta: string; icon: React.ReactNode; image: string;
}) {
  return (
    <Link to={to} className="card-3d group relative block overflow-hidden border border-gold-400/20 bg-navy-700/60 tilt-3d">
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/7]">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/70 to-navy-900/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 layer-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">{eyebrow}</span>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-400 text-navy-800 transition-transform duration-300 group-hover:scale-110">{icon}</span>
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">{title}</h2>
          </div>
          <p className="mt-2 max-w-md text-sm text-navy-100">{tagline}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 transition group-hover:gap-3">
            {cta} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ title, subtitle, link, viewAllLabel }: { title: string; subtitle: string; link: string; viewAllLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
      </div>
      <Link to={link} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-gold-600 hover:gap-2">
        {viewAllLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-gold-600 transition-transform hover:scale-110">{icon}</span>
      <div>
        <div className="text-xl font-bold text-navy-800">{value}</div>
        <div className="text-xs text-navy-500">{label}</div>
      </div>
    </div>
  );
}
