import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  MapPin, BedDouble, Bath, Maximize, BadgeCheck, Heart, Phone, MessageCircle,
  Share2, Flag, ChevronLeft, ChevronRight, X, Check, Star, ArrowLeft, Clock, Calendar,
  Copy, Printer, Image as ImageIcon, Hash, TrendingUp, ExternalLink, Send
} from 'lucide-react';
import L from 'leaflet';
import { formatPKR } from '@/data/mock';
import { getPropOverride, getAllProperties, useDataVersion } from '@/lib/dataService';
import { sendInquiryNotification } from '@/lib/emailApi';
import { useLang } from '@/lib/i18n';
import { getSession, toggleFavorite, getFavorites, addInquiry } from '@/lib/dataService';

export function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  useDataVersion();
  const property = getAllProperties().find((p) => p.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [saved, setSaved] = useState<boolean>(() => {
    const session = getSession();
    if (session && id) return getFavorites(session.userId).includes(id);
    return false;
  });
  const [showInquiry, setShowInquiry] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!property || !mapRef.current) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    const map = L.map(mapRef.current).setView([property.lat, property.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const marker = L.marker([property.lat, property.lng], { draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
      const ll = (e.target as L.Marker).getLatLng();
      map.panTo(ll);
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, [property]);

  if (!property) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-lg font-semibold text-navy-700">Property not found.</p>
        <Link to="/properties" className="mt-3 text-gold-600 hover:underline">Back to listings</Link>
      </div>
    );
  }

  const similar = getAllProperties().filter((p) => p.category === property.category && p.id !== property.id).slice(0, 4).map(p => {
    const ov = getPropOverride(p.id);
    return { ...p, verified: ov.verified ?? p.verified, featured: ov.featured ?? p.featured ?? false, seller: { ...p.seller, premium: ov.premium ?? p.seller.premium ?? false } };
  });
  const propertyId = `NP-${property.id.toUpperCase()}`;
  const pricePerMarla = Math.round(property.price / 5);

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const text = `Check out this property: ${property.title} - Rs ${formatPKR(property.price)}`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } else {
      navigator.share?.({ title: property.title, url }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-sm text-navy-500 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 hover:text-navy-800"><ArrowLeft className="h-4 w-4" /> {t('detail.back')}</button>
          <span>/</span>
          <Link to="/properties" className="hover:text-navy-800">{t('detail.properties')}</Link>
          <span>/</span>
          <span className="text-navy-700">{property.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="relative overflow-hidden rounded-2xl bg-navy-100">
              <div className="relative aspect-[16/10]">
                <img src={property.images[activeImg]} alt={property.title} className="h-full w-full object-cover" />
                {property.images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg((i) => (i === 0 ? property.images.length - 1 : i - 1))} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-white" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
                    <button onClick={() => setActiveImg((i) => (i === property.images.length - 1 ? 0 : i + 1))} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-white" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5">
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                    <ImageIcon className="mr-1 inline h-3.5 w-3.5" /> {activeImg + 1}/{property.images.length}
                  </span>
                  <button onClick={() => setLightbox(true)} className="rounded-lg bg-navy-800/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-navy-900">{t('detail.fullscreen')}</button>
                </div>
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar">
                  {property.images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImg ? 'border-gold-400' : 'border-transparent'}`}>
                      <img src={img} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + price */}
            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-emerald-700">{property.purpose === 'sale' ? t('card.forSale') : property.purpose === 'rent' ? t('card.forRent') : t('card.wanted')}</span>
                    {property.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm"><BadgeCheck className="h-3.5 w-3.5" /> {t('card.verified')}</span>}
                    {property.featured && <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700"><TrendingUp className="mr-0.5 inline h-3 w-3" /> {t('card.featured')}</span>}
                    {(property as any).status === 'pending' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm"><Clock className="h-3 w-3" /> Pending Review</span>}
                    {(property as any).status === 'rejected' && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">Rejected</span>}
                    <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-600"><Hash className="h-3 w-3" /> {propertyId}</span>
                  </div>
                  <h1 className="mt-2 font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{property.title}</h1>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-navy-500"><MapPin className="h-4 w-4 text-gold-500" /> {property.area}, {property.city}</p>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl font-bold text-gold-600 sm:text-3xl">Rs {formatPKR(property.price)}</div>
                  <div className="text-xs text-navy-400">{property.priceType === 'negotiable' ? t('card.negotiable') : property.priceType === 'fixed' ? t('card.fixed') : t('card.onCall')}</div>
                  <div className="mt-0.5 text-xs text-navy-400">Rs {formatPKR(pricePerMarla)} / Marla</div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox icon={<Maximize className="h-5 w-5" />} label={t('detail.size')} value={property.size} />
              {property.bedrooms != null && <StatBox icon={<BedDouble className="h-5 w-5" />} label={t('detail.bedrooms')} value={`${property.bedrooms}`} />}
              {property.bathrooms != null && <StatBox icon={<Bath className="h-5 w-5" />} label={t('detail.bathrooms')} value={`${property.bathrooms}`} />}
              <StatBox icon={<Calendar className="h-5 w-5" />} label={t('detail.posted')} value={property.postedAt} />
            </div>

            {/* Description */}
            <section className="mt-8">
              <h2 className="font-serif text-xl font-bold text-navy-800">{t('detail.description')}</h2>
              <p className="mt-2 text-navy-600 leading-relaxed">{property.description}</p>
            </section>

            {/* Details table */}
            <section className="mt-8">
              <h2 className="font-serif text-xl font-bold text-navy-800">{t('detail.details')}</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-navy-100">
                <DetailRow label="Property ID" value={propertyId} />
                <DetailRow label={t('detail.category')} value={property.category} />
                <DetailRow label={t('detail.purpose')} value={property.purpose} />
                <DetailRow label={t('detail.size')} value={property.size} />
                {property.bedrooms != null && <DetailRow label={t('detail.bedrooms')} value={`${property.bedrooms}`} />}
                {property.bathrooms != null && <DetailRow label={t('detail.bathrooms')} value={`${property.bathrooms}`} />}
                {property.furnished != null && <DetailRow label={t('detail.furnishing')} value={property.furnished ? t('detail.furnished') : t('detail.unfurnished')} />}
                <DetailRow label={t('detail.city')} value={property.city} />
                <DetailRow label={t('detail.area')} value={property.area} />
                <DetailRow label="Price / Marla" value={`Rs ${formatPKR(pricePerMarla)}`} />
                <DetailRow label={t('detail.posted')} value={property.postedAt} last />
              </div>
            </section>

            {/* Map */}
            <section className="mt-8">
              <h2 className="font-serif text-xl font-bold text-navy-800">{t('detail.location')}</h2>
              <p className="mt-1 text-sm text-navy-500">{t('detail.locationSub')}</p>
              <div ref={mapRef} className="mt-3 h-80 w-full overflow-hidden rounded-xl border border-navy-100" />
              <p className="mt-1 text-xs text-navy-400">GPS: {property.lat.toFixed(4)}, {property.lng.toFixed(4)}</p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Seller card */}
            <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-navy-100 font-serif text-lg font-bold text-navy-700">
                  {property.seller.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-800">{property.seller.name}</h3>
                  <p className="text-xs text-navy-500">{property.seller.type} · Member since {property.seller.memberSince}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-gold-600">
                    <Star className="h-3.5 w-3.5 fill-gold-400" /> {property.seller.rating} · {property.seller.totalAds} {t('detail.ads')}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href={`tel:${property.seller.phone}`} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-600">
                  <Phone className="h-4 w-4" /> Call Seller
                </a>
                <a href={`https://wa.me/${property.seller.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-100">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
              <button onClick={() => { const session = getSession(); if (session && id) { toggleFavorite(session.userId, id); setSaved(!saved); } else { setSaved(!saved); } }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy-200 py-2.5 font-semibold text-navy-700 transition hover:bg-navy-50">
                <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} /> {saved ? t('detail.saved') : t('detail.saveFav')}
              </button>
              <button onClick={() => setShowInquiry(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300">
                <Send className="h-4 w-4" /> {t('detail.sendInquiry')}
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => handleShare('whatsapp')} className="flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                <button onClick={() => handleShare()} className="flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => handleShare('copy')} className="flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
                  {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Link</>}
                </button>
                <button onClick={() => setShowReport(true)} className="flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
                  <Flag className="h-4 w-4" /> {t('detail.report')}
                </button>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-navy-100 bg-navy-50/30 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-3">Price Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-navy-500">Total Price</span><span className="font-semibold text-navy-800">Rs {formatPKR(property.price)}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Price / Marla</span><span className="font-semibold text-navy-800">Rs {formatPKR(pricePerMarla)}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Area</span><span className="font-semibold text-navy-800">{property.size}</span></div>
                {property.bedrooms != null && <div className="flex justify-between"><span className="text-navy-500">Price / Bed</span><span className="font-semibold text-navy-800">Rs {formatPKR(Math.round(property.price / property.bedrooms))}</span></div>}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-xl font-bold text-navy-800">{t('detail.similar')}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((p) => (
                <Link key={p.id} to={`/property/${p.id}`} className="card-3d group block overflow-hidden border border-navy-100/60">
                  <div className="relative aspect-[16/9] overflow-hidden bg-navy-100">
                    <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {p.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                        <ImageIcon className="h-3 w-3" /> {p.images.length}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-serif text-lg font-bold text-gold-600">Rs {formatPKR(p.price)}</div>
                    <p className="line-clamp-1 text-sm font-medium text-navy-800">{p.title}</p>
                    <p className="mt-0.5 text-xs text-navy-500"><MapPin className="inline h-3 w-3" /> {p.area}, {p.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/95 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
          <img src={property.images[activeImg]} alt={property.title} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
          {property.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {property.images.map((_: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-2 w-2 rounded-full ${i === activeImg ? 'bg-gold-400' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inquiry modal */}
      {showInquiry && (
        <Modal title={t('detail.inquiryTitle')} onClose={() => setShowInquiry(false)}>
          <InquiryForm property={property} onClose={() => setShowInquiry(false)} />
        </Modal>
      )}

      {/* Report modal */}
      {showReport && (
        <Modal title={t('detail.reportTitle')} onClose={() => setShowReport(false)}>
          <ReportForm onClose={() => setShowReport(false)} />
        </Modal>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-3">
      <div className="flex items-center gap-2 text-gold-600">{icon}</div>
      <div className="mt-1.5 text-xs text-navy-400">{label}</div>
      <div className="text-sm font-semibold capitalize text-navy-800">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-2.5 text-sm ${!last ? 'border-b border-navy-50' : ''} ${last ? 'bg-navy-50/30' : 'bg-white'}`}>
      <span className="text-navy-500">{label}</span>
      <span className="font-medium capitalize text-navy-800">{value}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-navy-800">{title}</h3>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function InquiryForm({ property, onClose }: { property: { seller: { name: string }; id?: string; title?: string }; onClose: () => void }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  if (sent) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></div>
        <p className="mt-3 font-semibold text-navy-800">{t('detail.inquirySent')} {property.seller.name}</p>
        <p className="text-sm text-navy-500">{t('detail.inquirySentSub')}</p>
        <button onClick={onClose} className="mt-4 rounded-xl bg-navy-700 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-800">{t('detail.done')}</button>
      </div>
    );
  }
  return (
    <form onSubmit={async (e) => { e.preventDefault(); const session = getSession(); addInquiry({ propertyId: property.id || '', propertyTitle: property.title || '', userId: session?.userId || null, name, email, phone, message }); setSent(true); try { await sendInquiryNotification({ email: (property.seller as any).email || 'alnajafassociate.official@gmail.com', name: property.seller.name, propertyTitle: property.title || '', buyerName: name, buyerPhone: phone, buyerEmail: email, message }); } catch {} }} className="space-y-3">
      <Input label={t('detail.yourName')} value={name} onChange={setName} required />
      <Input label={t('detail.email')} type="email" value={email} onChange={setEmail} required />
      <Input label={t('detail.phone')} value={phone} onChange={setPhone} required />
      <div>
        <label className="mb-1 block text-sm font-medium text-navy-700">{t('detail.message')}</label>
        <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" placeholder={t('detail.messagePlaceholder')} />
      </div>
      <button type="submit" className="w-full rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 hover:bg-gold-300">{t('detail.send')}</button>
    </form>
  );
}

function ReportForm({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const reasons = ['Spam', 'Fraud', 'Already Sold', 'Wrong Information', 'Duplicate', 'Other'];
  if (sent) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></div>
        <p className="mt-3 font-semibold text-navy-800">{t('detail.reportSent')}</p>
        <p className="text-sm text-navy-500">{t('detail.reportSentSub')}</p>
        <button onClick={onClose} className="mt-4 rounded-xl bg-navy-700 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-800">{t('detail.done')}</button>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {reasons.map((r) => (
          <label key={r} className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">
            <input type="radio" name="reason" value={r} required className="accent-gold-500" /> {r}
          </label>
        ))}
      </div>
      <textarea rows={2} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" placeholder="Additional details (optional)" />
      <button type="submit" className="w-full rounded-xl bg-rose-500 py-2.5 font-semibold text-white hover:bg-rose-600">{t('detail.submit')}</button>
    </form>
  );
}

function Input({ label, type = 'text', required, value, onChange }: { label: string; type?: string; required?: boolean; value?: string; onChange?: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
    </div>
  );
}
