import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, BadgeCheck, Heart, Phone, MessageCircle, Clock, Image as ImageIcon, TrendingUp, Star, Eye, Shield } from 'lucide-react';
import type { Property, Service, PropertyCategory } from '@/data/mock';
import { formatPKR } from '@/data/mock';
import { getIcon } from '@/lib/icons';

type CardVariant = 'property' | 'category' | 'service';

type Props = {
  variant: CardVariant;
  property?: Property;
  category?: PropertyCategory;
  service?: Service;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
};

export function ProductCard({ variant, property, category, service, saved, onToggleSave }: Props) {
  if (variant === 'property' && property) return <PropertyCard property={property} saved={saved} onToggleSave={onToggleSave} />;
  if (variant === 'category' && category) return <CategoryCard category={category} />;
  if (variant === 'service' && service) return <ServiceCard service={service} />;
  return null;
}

function Badge({ children, tone = 'navy' }: { children: React.ReactNode; tone?: 'navy' | 'gold' | 'green' | 'red' | 'blue' }) {
  const tones = {
    navy: 'bg-navy-700 text-white',
    gold: 'bg-gold-400 text-navy-800',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-500 text-white',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function PropertyCard({ property, saved, onToggleSave }: { property: Property; saved?: boolean; onToggleSave?: (id: string) => void }) {
  const purposeTone = property.purpose === 'sale' ? 'green' : property.purpose === 'rent' ? 'navy' : 'gold';
  const [showPhone, setShowPhone] = useState(false);
  const imgs = property.images && property.images.length > 0 ? property.images : ['/images/placeholder.jpg'];
  const seller = property.seller || { name: 'Owner', type: 'Owner', phone: '', premium: false };
  const isAgent = seller.type === 'Agent' || seller.type === 'Dealer';
  const propStatus = (property as any).status as string | undefined;
  const price = property.price || 0;
  const pricePerMarla = Math.round(price / 5);

  return (
    <div className={`card-3d card-glow property-card group flex flex-col overflow-hidden border ${propStatus === 'pending' ? 'border-amber-300/60' : propStatus === 'rejected' ? 'border-rose-200/60 opacity-60' : 'border-gold-200/40'}`}>
      <div className="relative aspect-square overflow-hidden bg-amber-100 sm:aspect-[4/3]">
        <img src={imgs[0]} alt={property.title || 'Property'} loading="lazy" className="property-card-img h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 layer-1" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone={purposeTone}>{property.purpose === 'requirement' ? 'Wanted' : property.purpose === 'sale' ? 'For Sale' : 'For Rent'}</Badge>
          {property.featured && <Badge tone="gold">Featured</Badge>}
          {propStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
          {propStatus === 'rejected' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              Rejected
            </span>
          )}
        </div>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(property.id)}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:bg-white"
            aria-label="Save property"
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-navy-600'}`} />
          </button>
        )}
        {property.verified && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </div>
        )}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            <ImageIcon className="h-3 w-3" /> {imgs.length}
          </div>
        )}
        {seller.premium && (
          <div className={`absolute right-3 ${imgs.length > 1 ? 'bottom-10' : 'bottom-3'} flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur shadow-lg`}>
            <Shield className="h-3 w-3" /> Titanium
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-serif text-xl font-bold text-gold-600">Rs {formatPKR(price)}</span>
          <span className="text-[10px] text-navy-400 uppercase">{property.priceType || 'fixed'}</span>
        </div>
        <h3 className="mt-1 line-clamp-1 font-semibold text-navy-800">{property.title || 'Untitled Property'}</h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-navy-500">
          <MapPin className="h-3.5 w-3.5 text-gold-500" />
          {property.area || 'DHA'}, {property.city || 'Lahore'}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-600">
          <span className="inline-flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-gold-500" /> {property.size || '5 Marla'}</span>
          {property.bedrooms != null && property.bedrooms > 0 && <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gold-500" /> {property.bedrooms} Beds</span>}
          {property.bathrooms != null && property.bathrooms > 0 && <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-gold-500" /> {property.bathrooms} Baths</span>}
        </div>

        <div className="mt-1 text-[10px] text-navy-400">Rs {formatPKR(pricePerMarla)} / Marla</div>

        <div className="mt-3 flex items-center justify-between border-t border-navy-50 pt-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-navy-400"><Clock className="h-3 w-3" /> {timeAgo(property.postedAt || new Date().toISOString())}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-navy-500">
            {seller.premium ? (
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                <Shield className="h-3 w-3 text-indigo-500" />{seller.name}
              </span>
            ) : isAgent ? (
              <span className="inline-flex items-center gap-0.5 text-blue-600">
                <Shield className="h-3 w-3" />{seller.name}
              </span>
            ) : seller.name}
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <Link to={`/property/${property.id}`} className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-3 py-2 text-center text-sm font-semibold text-navy-900 transition hover:from-gold-400 hover:to-gold-300 shadow-gold">
            More Details
          </Link>
          {!showPhone ? (
            <button onClick={() => setShowPhone(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
              <Eye className="h-4 w-4" /> Show Number
            </button>
          ) : (
            <>
              <a href={`tel:${property.seller.phone}`} className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100" aria-label="Call seller">
                <Phone className="h-4 w-4" />
              </a>
              <a href={`https://wa.me/${property.seller.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100" aria-label="WhatsApp seller">
                <MessageCircle className="h-4 w-4" />
              </a>
              <span className="hidden md:inline-flex items-center text-xs text-navy-500 font-medium">{property.seller.phone}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: PropertyCategory }) {
  const Icon = getIcon(category.icon);
  return (
    <Link to={`/properties?category=${category.id}`} className="card-3d card-glow group relative flex flex-col overflow-hidden border border-gold-200/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-amber-100">
        <img src={category.image} alt={category.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400 text-navy-800"><Icon className="h-5 w-5" /></span>
          <div>
            <h3 className="font-semibold leading-tight">{category.name}</h3>
            <p className="text-xs text-white/80">{category.count} listings</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm text-navy-500">{category.description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-600 transition group-hover:gap-2">Explore <span aria-hidden>→</span></span>
      </div>
    </Link>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = getIcon(service.icon);
  return (
    <div className="card-3d card-glow group flex flex-col overflow-hidden border border-gold-200/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-amber-100">
        <img src={service.image} alt={service.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/30 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400 text-navy-800"><Icon className="h-5 w-5" /></span>
          <h3 className="font-semibold leading-tight">{service.shortName}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold text-navy-800">{service.name}</h4>
        <p className="mt-1 line-clamp-2 text-sm text-navy-500">{service.description}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-navy-600">
          <span className="font-semibold text-gold-600">{service.fee}</span>
          <span>{service.duration}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to={`/services/${service.id}`} className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-3 py-2 text-center text-sm font-semibold text-navy-900 transition hover:from-gold-400 hover:to-gold-300 shadow-gold">
            Book Online
          </Link>
          <Link to={`/services/${service.id}`} className="flex-1 rounded-xl border border-gold-300/50 px-3 py-2 text-center text-sm font-semibold text-gold-700 transition hover:bg-gold-50">
            More Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: string) {
  const d = new Date(date);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

export { Badge };
