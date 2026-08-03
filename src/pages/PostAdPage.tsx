import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, MapPin, Upload, X, Camera, BedDouble, Bath } from 'lucide-react';
import L from 'leaflet';
import { useLang } from '@/lib/i18n';
import { CATEGORIES, CITIES } from '@/data/mock';
import { getIcon } from '@/lib/icons';
import { addCustomProperty } from '@/lib/dataService';
import { uploadImage } from '@/lib/uploadImage';

type FormState = {
  category: string;
  purpose: 'sale' | 'rent' | 'requirement';
  title: string;
  description: string;
  price: string;
  negotiable: boolean;
  city: string;
  area: string;
  size: string;
  sizeUnit: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  yearBuilt: string;
  furnished: boolean;
  contactName: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
};

const INITIAL: FormState = {
  category: 'houses',
  purpose: 'sale',
  title: '',
  description: '',
  price: '',
  negotiable: false,
  city: '',
  area: '',
  size: '',
  sizeUnit: 'Marla',
  bedrooms: '',
  bathrooms: '',
  floor: '',
  yearBuilt: '',
  furnished: false,
  contactName: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactEmail: '',
};

export function PostAdPage() {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [lat, setLat] = useState(31.5204);
  const [lng, setLng] = useState(74.3587);
  const [form, setForm] = useState<FormState>(INITIAL);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = [t('postAd.step1'), t('postAd.step2'), t('postAd.step3'), t('postAd.step4'), t('postAd.step5'), t('postAd.step6'), t('postAd.step7')];

  useEffect(() => {
    if (step !== 2 || !mapRef.current) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    const map = L.map(mapRef.current).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
      const ll = (e.target as L.Marker).getLatLng();
      setLat(ll.lat); setLng(ll.lng);
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [step]);

  const handlePhotos = async (files: FileList | null) => {
    if (!files) return;
    const uploaded: string[] = [];
    for (const f of Array.from(files).slice(0, 15 - photos.length)) {
      const url = await uploadImage(f);
      if (url) uploaded.push(url);
    }
    setPhotos((prev) => [...prev, ...uploaded].slice(0, 15));
  };

  const toggleFeature = (f: string) => {
    setFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  };

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      addCustomProperty({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        priceType: form.negotiable ? 'negotiable' : 'fixed',
        purpose: form.purpose,
        category: form.category,
        subCategory: '',
        city: form.city || 'Lahore',
        area: form.area,
        lat,
        lng,
        size: `${form.size} ${form.sizeUnit}`,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        furnished: form.furnished,
        verified: false,
        featured: false,
        postedAt: new Date().toISOString().split('T')[0],
        images: photos,
        seller: {
          name: form.contactName || 'Owner',
          type: 'Owner',
          phone: form.contactPhone,
          whatsapp: form.contactWhatsapp || form.contactPhone,
        },
        status: 'pending',
      } as any);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="enter-3d">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('postAd.submitted')}</h1>
          <p className="mt-2 text-navy-500">{t('postAd.submittedSub')}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">{t('dash.title')}</Link>
            <Link to="/" className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">{t('service.goHome')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const featureList = ['gas', 'electricity', 'water', 'security', 'parking', 'ac', 'elevator', 'garden'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{t('postAd.title')}</h1>
        <p className="mt-1 text-sm text-navy-500">{t('postAd.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition ${i <= step ? 'bg-gold-400 text-navy-800' : 'bg-navy-100 text-navy-400'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 hidden text-xs font-medium lg:block ${i <= step ? 'text-navy-700' : 'text-navy-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-gold-400' : 'bg-navy-100'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (step < steps.length - 1) setStep(step + 1); else handleSubmit(); }} className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step1')}</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-700">{t('postAd.category')}</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const Icon = getIcon(c.icon);
                  const selected = form.category === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => set('category', c.id)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition ${selected ? 'border-gold-400 bg-gold-50 text-navy-800' : 'border-navy-100 text-navy-600 hover:border-gold-400 hover:bg-gold-50'}`}>
                      <Icon className="h-5 w-5 text-gold-500" /> {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-700">{t('postAd.purpose')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ k: 'sale' as const, l: t('postAd.sale') }, { k: 'rent' as const, l: t('postAd.rent') }, { k: 'requirement' as const, l: t('postAd.requirement') }].map((p) => (
                  <button key={p.k} type="button" onClick={() => set('purpose', p.k)} className={`rounded-xl border p-3 text-sm font-medium transition ${form.purpose === p.k ? 'border-gold-400 bg-gold-50 text-navy-800' : 'border-navy-100 text-navy-600 hover:border-gold-400 hover:bg-gold-50'}`}>{p.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step2')}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.adTitle')} <span className="text-rose-500"> *</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.description')} <span className="text-rose-500"> *</span></label>
              <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.price')} (PKR) <span className="text-rose-500"> *</span></label>
                <input type="number" required min={1} value={form.price} onChange={e => set('price', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.negotiable')}</label>
                <label className="flex h-[42px] items-center gap-2 rounded-xl border border-navy-100 px-3 text-sm text-navy-600">
                  <input type="checkbox" checked={form.negotiable} onChange={e => set('negotiable', e.target.checked)} className="h-4 w-4 accent-gold-500" /> {t('postAd.negotiable')}
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step3')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.city')}</label>
                <select value={form.city} onChange={e => set('city', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                  <option value="">{t('props.allCities')}</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('detail.area')} <span className="text-rose-500"> *</span></label>
                <input required value={form.area} onChange={e => set('area', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('detail.location')}</label>
              <p className="mb-2 text-xs text-navy-500">{t('detail.locationSub')}</p>
              <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-xl border border-navy-100" />
              <p className="mt-2 text-xs text-navy-400">GPS: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step4')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.size')}</label>
                <input type="number" value={form.size} onChange={e => set('size', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.sizeUnit')}</label>
                <select value={form.sizeUnit} onChange={e => set('sizeUnit', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                  <option>{t('postAd.marla')}</option>
                  <option>{t('postAd.kanal')}</option>
                  <option>{t('postAd.sqft')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.bedrooms')}</label>
                <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.bathrooms')}</label>
                <input type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.furnishing')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set('furnished', true)} className={`rounded-xl border p-3 text-sm font-medium transition ${form.furnished ? 'border-gold-400 bg-gold-50 text-navy-800' : 'border-navy-100 text-navy-600 hover:bg-gold-50'}`}>{t('detail.furnished')}</button>
                <button type="button" onClick={() => set('furnished', false)} className={`rounded-xl border p-3 text-sm font-medium transition ${!form.furnished ? 'border-gold-400 bg-gold-50 text-navy-800' : 'border-navy-100 text-navy-600 hover:bg-gold-50'}`}>{t('detail.unfurnished')}</button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy-700">{t('postAd.features')}</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {featureList.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)} className={`flex items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${features.has(f) ? 'border-gold-400 bg-gold-50 text-navy-800' : 'border-navy-100 text-navy-600 hover:bg-navy-50'}`}>
                    {features.has(f) ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-3.5 w-3.5 rounded-full border border-navy-200" />} {t(`postAd.${f}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step5')}</h2>
            <p className="text-sm text-navy-500">{t('postAd.photos')}</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-8 text-center transition hover:border-gold-400 hover:bg-gold-50"
            >
              <Upload className="mx-auto h-8 w-8 text-navy-400" />
              <p className="mt-2 text-sm font-medium text-navy-700">{t('postAd.dragDrop')}</p>
              <p className="text-xs text-navy-400">{t('service.orBrowse')}</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { handlePhotos(e.target.files); e.target.value = ''; }} />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-navy-100">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-navy-600 hover:text-rose-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step6')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.contactName')} <span className="text-rose-500"> *</span></label>
                <input required value={form.contactName} onChange={e => set('contactName', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.contactPhone')} <span className="text-rose-500"> *</span></label>
                <input type="tel" required value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.contactWhatsapp')}</label>
                <input type="tel" value={form.contactWhatsapp} onChange={e => set('contactWhatsapp', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('postAd.contactEmail')}</label>
                <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 enter-3d">
            <h2 className="font-serif text-lg font-bold text-navy-800">{t('postAd.step7')}</h2>
            <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-600">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-500" /> {t('postAd.category')}: <span className="font-semibold text-navy-800">{CATEGORIES.find(c => c.id === form.category)?.name || form.category}</span></p>
              <p className="mt-1 flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-500" /> {form.city || 'Lahore'}, {form.area}</p>
              <p className="mt-1 flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-500" /> {form.size ? `${form.size} ${form.sizeUnit}` : 'Size not set'}</p>
              <p className="mt-1 flex items-center gap-2"><BedDouble className="h-4 w-4 text-gold-500" /> {form.bedrooms || 0} Beds · <Bath className="h-4 w-4 text-gold-500" /> {form.bathrooms || 0} Baths</p>
              <p className="mt-1">Price: Rs {parseInt(form.price || '0').toLocaleString()}</p>
              <p className="mt-1">Photos: {photos.length}</p>
            </div>
            <div className="rounded-xl bg-gold-50 p-3 text-sm text-navy-600">
              <Camera className="inline h-4 w-4 text-gold-500" /> {t('postAd.reviewNote')}
            </div>
            <label className="flex items-start gap-2 text-sm text-navy-700">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-gold-500" />
              {t('service.reviewConfirm')}
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
              <ChevronLeft className="h-4 w-4" /> {t('postAd.back')}
            </button>
          ) : <span />}
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 disabled:opacity-60">
            {saving ? 'Saving...' : (step < steps.length - 1 ? t('postAd.next') : t('postAd.submit'))} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
