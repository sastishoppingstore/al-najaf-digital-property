import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Building2, CheckCircle2, Shield, Trees, Route, Award, Image as ImageIcon, PhoneCall, ChevronRight, Home, Landmark, Clock, DollarSign, FileText, Heart, BedDouble, Bath, Eye, MessageCircle, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPKR } from '@/data/mock';
import { getPropOverride, getAllProperties, useDataVersion } from '@/lib/dataService';
import { ProductCard } from '@/components/ProductCard';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

type Plan = { size: string; totalPrice: string; downPayment: string; monthly36: string; halfYearly6: string; possession: string };

const DEFAULT_RESIDENTIAL: Plan[] = [
  { size: '3 Marla', totalPrice: '4,850,000', downPayment: '1,200,000', monthly36: '40,000', halfYearly6: '130,000', possession: '1,300,000' },
  { size: '3.5 Marla', totalPrice: '7,000,000', downPayment: '1,750,000', monthly36: '60,000', halfYearly6: '200,000', possession: '1,890,000' },
  { size: '5 Marla', totalPrice: '10,000,000', downPayment: '2,500,000', monthly36: '90,000', halfYearly6: '350,000', possession: '2,160,000' },
];

const DEFAULT_COMMERCIAL: Plan[] = [
  { size: '5.33 Marla', totalPrice: '17,500,000', downPayment: '4,375,000', monthly36: '145,000', halfYearly6: '500,000', possession: '4,905,000' },
];

const DEFAULT_CONTACT = { person1: 'Malik Imran', phone1: '0321-4288345', person2: 'Ayan Ali', phone2: '322-0778860', address: 'Thokar, Lahore, Pakistan', email: 'alnajafassociate.official@gmail.com' };

const DEFAULT_FEATURES = [
  { icon: 'MapPin', title: 'Prime Location', desc: 'Facing Park / Corner / Main Road plots available' },
  { icon: 'Route', title: 'Wide Carpeted Roads', desc: "30', 35', 50' & 80' wide roads throughout" },
  { icon: 'Shield', title: 'LDA Approved', desc: 'Legally approved project by Lahore Development Authority' },
  { icon: 'Building2', title: 'Modern Infrastructure', desc: 'Underground electricity, sewerage, water & gas' },
  { icon: 'Trees', title: 'Beautiful Parks', desc: 'Green community living with parks & recreational areas' },
  { icon: 'Award', title: 'High Investment Potential', desc: 'Great future returns on your investment' },
];

const DEFAULT_CHARGES = [
  { label: 'Prime Location (Facing Park)', value: '10% of Total Price' },
  { label: 'Corner Plot', value: '10% of Total Price' },
  { label: 'Main Road Facing', value: '10% of Total Price' },
];

const DEFAULT_AMENITIES = ['Prime Location', 'Gated Community', '24/7 Security', 'Parks & Green Areas', 'Mosque', 'Commercial Zone', 'Underground Electricity', 'Sewerage System', 'Gas Connection', 'Water Supply'];

const ICON_MAP: Record<string, React.ComponentType<any>> = { MapPin, Route, Shield, Building2, Trees, Award };

function loadJSON<T>(key: string, fallback: T): T { try { const d = localStorage.getItem(key); if (!d) return fallback; const v = JSON.parse(d); if (Array.isArray(fallback) && !Array.isArray(v)) return fallback; return v; } catch { return fallback; } }
function loadStr(key: string, fallback: string): string { return localStorage.getItem(key) || fallback; }

export function CapitalValleyPage() {
  const { t } = useLang();
  useDataVersion();
  const [tab, setTab] = useState<'residential' | 'commercial'>('residential');

  const heroTitle = loadStr('capital_valley_hero_title', 'CAPITAL VALLEY — 3 YEARS PAYMENT PLAN');
  const heroSubtitle = loadStr('capital_valley_hero_subtitle', 'A project of Shab Raj Developer (Pvt) Limited');
  const heroConsultants = loadStr('capital_valley_hero_consultants', 'Consultants: THE BASE (Real Estate Consultants) & Al Najaf Associate (Real Estate & Property Consultants)');
  const heroTagline = loadStr('capital_valley_hero_tagline', 'Secure Your Future, Today!');
  const residential = loadJSON<Plan[]>('capital_valley_plans_residential', DEFAULT_RESIDENTIAL);
  const commercial = loadJSON<Plan[]>('capital_valley_plans_commercial', DEFAULT_COMMERCIAL);
  const contact = loadJSON('capital_valley_contact', DEFAULT_CONTACT);
  const images = loadJSON<string[]>('capital_valley_images', ['/images/cv-cover.jpg']);

  const features = loadJSON('capital_valley_features', DEFAULT_FEATURES);
  const charges = loadJSON<{ label: string; value: string }[]>('capital_valley_charges', DEFAULT_CHARGES);
  const amenities = loadJSON<string[]>('capital_valley_amenities', DEFAULT_AMENITIES);

  const headingPlans = loadStr('cv_heading_plans', 'Payment Plan');
  const subtitlePlans = loadStr('cv_heading_plans_sub', 'Flexible 3-year installment plans for every budget');
  const headingInvest = loadStr('cv_heading_invest', 'Why Invest in Capital Valley?');
  const subtitleInvest = loadStr('cv_heading_invest_sub', 'A premier housing society with modern amenities');
  const headingCharges = loadStr('cv_heading_charges', 'Additional Charges');
  const headingAmenities = loadStr('cv_heading_amenities', 'Key Amenities');
  const headingGallery = loadStr('cv_heading_gallery', 'Gallery');
  const subtitleGallery = loadStr('cv_heading_gallery_sub', 'Explore Capital Valley through images');

  const allProps = getAllProperties();
  const cvPropsStorage = loadJSON<any[]>('capital_valley_properties', []);

  const allAvailableProps = [
    ...cvPropsStorage,
    ...allProps.filter(p => (p.area || '').toLowerCase().includes('capital') || (p.city || '').toLowerCase().includes('capital') || (p.title || '').toLowerCase().includes('capital') || p.area === 'B-17'),
  ];

  const capitalProps = allAvailableProps.map(p => {
    const ov = getPropOverride(p.id);
    const ovVerified = ov.verified ?? p.verified ?? true;
    const ovFeatured = ov.featured ?? p.featured ?? false;
    const ovStatus = ov.status ?? p.status ?? 'approved';
    return {
      ...p,
      verified: ovVerified,
      featured: ovFeatured,
      status: ovStatus,
      seller: { ...p.seller, premium: ov.premium ?? p.seller?.premium ?? false },
    };
  }).filter(p => p.status === 'approved');

  const builtProps = capitalProps.filter(p => p.category === 'houses');


  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-navy-800 to-amber-950 py-24">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/70 via-navy-900/75 to-amber-900/80 gradient-animated" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
            <Home className="h-3.5 w-3.5" /> Capital Valley
          </span>
          <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-white sm:text-5xl md:text-6xl enter-3d">{heroTitle}</h1>
          <p className="mt-4 text-lg text-navy-100">{heroSubtitle}</p>
          <p className="mt-2 text-sm text-gold-300/80">{heroConsultants}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400/20 px-6 py-2 text-gold-300 font-semibold">
            <Award className="h-4 w-4" /> {heroTagline}
          </div>
        </div>
      </section>

      {/* Payment Plans */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{headingPlans}</h2>
            <p className="mt-2 text-navy-500">{subtitlePlans}</p>
          </div>
        </Reveal>

        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setTab('residential')} className={`rounded-full px-6 py-2 text-sm font-semibold transition ${tab === 'residential' ? 'bg-gold-400 text-navy-800' : 'bg-white text-navy-600 border border-navy-100'}`}>Residential Plots</button>
          <button onClick={() => setTab('commercial')} className={`rounded-full px-6 py-2 text-sm font-semibold transition ${tab === 'commercial' ? 'bg-gold-400 text-navy-800' : 'bg-white text-navy-600 border border-navy-100'}`}>Commercial Plots</button>
        </div>

        <Reveal variant="up">
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gold-200/40 bg-white shadow-gold">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900">
                  <th className="p-4 font-semibold">Plot Size</th>
                  <th className="p-4 font-semibold">Total Price</th>
                  <th className="p-4 font-semibold">Down Payment</th>
                  <th className="p-4 font-semibold">36 Monthly</th>
                  <th className="p-4 font-semibold">6 Half-Yearly</th>
                  <th className="p-4 font-semibold">Possession</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'residential' ? residential : commercial).map((plan, i) => (
                  <tr key={i} className="border-t border-navy-50 transition hover:bg-amber-50/50">
                    <td className="p-4 font-bold text-navy-800">{plan.size}</td>
                    <td className="p-4 font-semibold text-gold-600">Rs. {plan.totalPrice}</td>
                    <td className="p-4 text-navy-700">Rs. {plan.downPayment}</td>
                    <td className="p-4 text-navy-700">Rs. {plan.monthly36}</td>
                    <td className="p-4 text-navy-700">Rs. {plan.halfYearly6}</td>
                    <td className="p-4 text-navy-700">Rs. {plan.possession}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Available Properties in Capital Valley */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">Available Properties in Capital Valley</h2>
            <p className="mt-2 text-navy-500">Ready-to-build plots with easy installments</p>
          </div>
        </Reveal>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {capitalProps.slice(0, 6).map((p) => (
            <Reveal key={p.id} variant="up" delay={1}>
              <ProductCard variant="property" property={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why Invest */}
      <section className="bg-gradient-to-r from-amber-50/80 via-cream to-yellow-50/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{headingInvest}</h2>
              <p className="mt-2 text-navy-500">{subtitleInvest}</p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const FeatureIcon = ICON_MAP[f.icon] || MapPin;
              return (
                <Reveal key={i} variant="up" delay={(i % 3) + 1}>
                  <div className="card-3d card-glow group flex flex-col items-center p-6 text-center tilt-3d">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-100 text-gold-600 transition group-hover:bg-gold-400 group-hover:text-navy-800"><FeatureIcon className="h-7 w-7" /></span>
                    <h3 className="mt-4 font-serif text-lg font-bold text-navy-800">{f.title}</h3>
                    <p className="mt-2 text-sm text-navy-500">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Charges & Amenities */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal variant="left">
            <div className="rounded-2xl border border-gold-200/40 bg-white p-6 shadow-gold">
              <h3 className="font-serif text-xl font-bold text-navy-800 flex items-center gap-2"><DollarSign className="h-5 w-5 text-gold-500" /> {headingCharges}</h3>
              <ul className="mt-4 space-y-3">
                {charges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /> {c.label}: <strong>{c.value}</strong></li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal variant="right">
            <div className="rounded-2xl border border-gold-200/40 bg-white p-6 shadow-gold">
              <h3 className="font-serif text-xl font-bold text-navy-800 flex items-center gap-2"><Award className="h-5 w-5 text-gold-500" /> {headingAmenities}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {amenities.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-sm text-navy-600"><CheckCircle2 className="h-3.5 w-3.5 text-gold-500" /> {a}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Built Houses */}
      {builtProps.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50/80 via-cream to-yellow-50/80 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">Built Houses in Capital Valley</h2>
                <p className="mt-2 text-navy-500">Ready-to-move houses available for sale</p>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {builtProps.map((p) => (
                <Reveal key={p.id} variant="up" delay={1}>
                  <ProductCard variant="property" property={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Image Gallery */}
      <section className="bg-gradient-to-r from-amber-50/80 via-cream to-yellow-50/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{headingGallery}</h2>
              <p className="mt-2 text-navy-500">{subtitleGallery}</p>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <Reveal key={i} variant="up" delay={(i % 3) + 1}>
                <div className="card-3d overflow-hidden">
                  <img src={img} alt={`Capital Valley view ${i + 1}`} className="h-64 w-full object-cover transition duration-500 hover:scale-110" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-amber-800 via-navy-800 to-amber-900 px-6 py-12 text-center shadow-gold-lg sm:px-12 gradient-animated">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">Contact Us</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-100">Get in touch for booking, inquiries, and site visits</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <Phone className="mx-auto h-6 w-6 text-gold-400" />
              <p className="mt-2 font-semibold text-white">{contact.person1}</p>
              <p className="text-sm text-gold-300">{contact.phone1}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <Phone className="mx-auto h-6 w-6 text-gold-400" />
              <p className="mt-2 font-semibold text-white">{contact.person2}</p>
              <p className="text-sm text-gold-300">{contact.phone2}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <MapPin className="mx-auto h-6 w-6 text-gold-400" />
              <p className="mt-2 font-semibold text-white">Office</p>
              <p className="text-sm text-navy-200">{contact.address}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <Mail className="mx-auto h-6 w-6 text-gold-400" />
              <p className="mt-2 font-semibold text-white">Email</p>
              <p className="text-sm text-navy-200">{contact.email}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
