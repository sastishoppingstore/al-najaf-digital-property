import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3x3, List, MapPin, BedDouble, Bath, Maximize, BadgeCheck, Heart, Phone, MessageCircle, Clock, Filter, DollarSign, Image as ImageIcon, Map, LayoutGrid, Star, TrendingUp, ChevronDown, Eye, Shield, Minus, Plus, ChevronLeft, ChevronRight, History, Settings2 } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { formatPKR } from '@/data/mock';
import type { Property } from '@/data/mock';
import { getManagedCities, getManagedTowns, getManagedCategories, getManagedSubCategories } from '@/lib/contentManager';
const CITIES = getManagedCities();
const TOWNS = getManagedTowns();
const CATEGORIES = getManagedCategories();
const SUB_CATEGORIES = getManagedSubCategories();
import { getSession, toggleFavorite, getFavorites, getPropOverride, getAllProperties, useDataVersion } from '@/lib/dataService';
import { getIcon } from '@/lib/icons';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

import L from 'leaflet';

const PRICE_RANGES = [
  { label: 'Under Rs. 1L', min: 0, max: 100000 },
  { label: 'Rs. 1L - 10L', min: 100000, max: 10000000 },
  { label: 'Rs. 10L - 1Cr', min: 10000000, max: 100000000 },
  { label: 'Rs. 1Cr - 5Cr', min: 100000000, max: 500000000 },
  { label: 'Rs. 5Cr+', min: 500000000, max: Infinity },
];

const AREA_SIZES = [
  { label: '3-5 Marla', min: 3, max: 5 },
  { label: '5-10 Marla', min: 5, max: 10 },
  { label: '10-20 Marla', min: 10, max: 20 },
  { label: '1-2 Kanal', min: 20, max: 40 },
  { label: '2+ Kanal', min: 40, max: Infinity },
];

const PAGE_SIZE = 12;

type SortKey = 'newest' | 'price-asc' | 'price-desc';
type DateFilter = '' | 'today' | 'week' | 'month';

function getDateFilterRange(filter: DateFilter) {
  const now = Date.now();
  if (filter === 'today') return now - 86400000;
  if (filter === 'week') return now - 7 * 86400000;
  if (filter === 'month') return now - 30 * 86400000;
  return 0;
}

function parseSizeMarla(size: string): number {
  const match = size.match(/([\d.]+)\s*(Marla|Kanal)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  if (match[2].toLowerCase() === 'kanal') return val * 20;
  return val;
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

const RECENT_KEY = 'recently_viewed';
function getRecentlyViewed(): Property[] {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
    const all = getAllProperties();
    return ids.map(id => all.find(p => p.id === id)).filter(Boolean) as Property[];
  } catch { return []; }
}
function addRecentlyViewed(id: string) {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
    const filtered = ids.filter(x => x !== id);
    filtered.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 6)));
  } catch { /* */ }
}

export function PropertiesPage() {
  const { t } = useLang();
  const dataVersion = useDataVersion();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => {
    const session = getSession();
    if (session) return new Set(getFavorites(session.userId));
    return new Set();
  });
  const [page, setPage] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const keyword = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const purpose = params.get('purpose') ?? '';
  const town = params.get('town') ?? '';
  const category = params.get('category') ?? '';
  const subCategory = params.get('subCategory') ?? '';
  const minPrice = params.get('min') ?? '';
  const maxPrice = params.get('max') ?? '';
  const beds = params.get('beds') ?? '';
  const priceRange = params.get('priceRange') ?? '';
  const area = params.get('area') ?? '';
  const areaSize = params.get('areaSize') ?? '';
  const verifiedOnly = params.get('verified') === '1';
  const featuredOnly = params.get('featured') === '1';
  const furnishedOnly = params.get('furnished') === '1';
  const dateFilter = (params.get('date') ?? '') as DateFilter;
  const sort = (params.get('sort') ?? 'newest') as SortKey;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  const toggleSave = (id: string) => {
    const session = getSession();
    if (!session) {
      setSaved((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
      return;
    }
    const updated = toggleFavorite(session.userId, id);
    setSaved(new Set(updated));
  };

  const filtered = useMemo(() => {
    let list = getAllProperties().filter((p) => {
      if (keyword && !`${p.title || ''} ${p.description || ''} ${p.area || ''} ${p.city || ''}`.toLowerCase().includes(keyword.toLowerCase().trim())) return false;
      if (city && p.city?.toLowerCase().trim() !== city.toLowerCase().trim()) return false;
      if (town && p.area?.toLowerCase().trim() !== town.toLowerCase().trim()) return false;
      if (purpose && p.purpose?.toLowerCase().trim() !== purpose.toLowerCase().trim()) return false;
      if (category && p.category?.toLowerCase().trim() !== category.toLowerCase().trim()) return false;
      if (subCategory && p.subCategory?.toLowerCase().trim() !== subCategory.toLowerCase().trim()) return false;
      if (minPrice && (p.price || 0) < Number(minPrice)) return false;
      if (maxPrice && (p.price || 0) > Number(maxPrice)) return false;
      if (beds && p.bedrooms != null && p.bedrooms < Number(beds)) return false;
      if (priceRange) {
        const range = PRICE_RANGES.find(r => r.label === priceRange);
        if (range && ((p.price || 0) < range.min || (p.price || 0) > range.max)) return false;
      }
      if (area && p.area?.toLowerCase().trim() !== area.toLowerCase().trim()) return false;
      if (areaSize) {
        const pMarla = parseSizeMarla(p.size || '');
        const sizeRange = AREA_SIZES.find(r => r.label === areaSize);
        if (sizeRange && (pMarla < sizeRange.min || pMarla > sizeRange.max)) return false;
      }
      if (dateFilter) {
        const posted = new Date(p.postedAt || Date.now()).getTime();
        const cutoff = getDateFilterRange(dateFilter);
        if (posted > 0 && posted < cutoff) return false;
      }
      const ov = getPropOverride(p.id);
      const ovVerified = ov.verified ?? p.verified;
      const ovFeatured = ov.featured ?? p.featured ?? false;
      if (verifiedOnly && !ovVerified) return false;
      if (featuredOnly && !ovFeatured) return false;
      if (furnishedOnly && !p.furnished) return false;
      return true;
    });
    const merged = list.map(p => {
      const ov = getPropOverride(p.id);
      return {
        ...p,
        verified: ov.verified ?? p.verified,
        featured: ov.featured ?? p.featured ?? false,
        status: ov.status ?? p.status ?? 'approved',
        seller: { ...p.seller, premium: ov.premium ?? p.seller.premium ?? false },
      };
    });
    // Sort: approved first, then pending, then rejected
    merged.sort((a, b) => {
      const statusOrder = { approved: 0, pending: 1, rejected: 2 } as Record<string, number>;
      const aStatusScore = statusOrder[(a as any).status] ?? 1;
      const bStatusScore = statusOrder[(b as any).status] ?? 1;
      if (aStatusScore !== bStatusScore) return aStatusScore - bStatusScore;
      const aScore = (a.featured ? 2 : 0) + ((a.seller.premium) ? 1 : 0);
      const bScore = (b.featured ? 2 : 0) + ((b.seller.premium) ? 1 : 0);
      return bScore - aScore;
    });
    if (sort === 'price-asc') merged.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') merged.sort((a, b) => b.price - a.price);
    return merged;
  }, [keyword, city, town, purpose, category, subCategory, minPrice, maxPrice, beds, priceRange, area, verifiedOnly, featuredOnly, furnishedOnly, dateFilter, sort, areaSize, dataVersion]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cityAreas = useMemo(() => {
    const areas = [...new Set(getAllProperties().filter(p => !city || p.city === city).map(p => p.area))];
    return areas.sort();
  }, [city, dataVersion]);

  const recentProperties = useMemo(() => getRecentlyViewed().filter(p => p.id !== params.get('q')), []);

  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([31.52, 74.36], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance.current);
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [showMap]);

  useEffect(() => {
    if (!mapInstance.current || !showMap) return;
    const map = mapInstance.current;
    map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    const bounds: L.LatLngTuple[] = [];
    filtered.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const marker = L.marker([p.lat, p.lng]).addTo(map);
      bounds.push([p.lat, p.lng]);
      marker.bindPopup(`
        <div style="font-family:sans-serif;width:220px">
          <img src="${p.images[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:8px" />
          <div style="font-weight:700;color:#b8860b;margin-top:6px">Rs ${formatPKR(p.price)}</div>
          <div style="font-size:13px;font-weight:600">${p.title.slice(0, 40)}...</div>
          <div style="font-size:11px;color:#666">${p.area}, ${p.city}</div>
          <a href="/property/${p.id}" style="display:inline-block;margin-top:6px;padding:4px 12px;background:#1e293b;color:white;border-radius:6px;text-decoration:none;font-size:12px">View Details</a>
        </div>
      `, { maxWidth: 240 });
    });
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });
  }, [filtered, showMap]);

  const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
    { label: 'All Time', value: '' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  const PROPERTY_TABS = [
    { id: '', label: 'All' },
    ...CATEGORIES.map(c => ({ id: c.id, label: c.name })),
  ];

  const currentSubCategories = SUB_CATEGORIES.filter(sc => sc.categoryId === category);

  return (
    <div>
      {/* City Tabs */}
      <div className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            <button onClick={() => setParam('city', '')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!city ? 'bg-navy-700 text-white' : 'text-navy-500 hover:bg-navy-50'}`}>All Cities</button>
            {CITIES.map((c) => (
              <button key={c} onClick={() => setParam('city', city === c ? '' : c)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${city === c ? 'bg-navy-700 text-white' : 'text-navy-500 hover:bg-navy-50'}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Town Tabs */}
      <div className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            <button onClick={() => setParam('town', '')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!town ? 'bg-navy-700 text-white' : 'text-navy-500 hover:bg-navy-50'}`}>All Towns</button>
            {TOWNS.map((t) => (
              <button key={t} onClick={() => setParam('town', town === t ? '' : t)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${town === t ? 'bg-navy-700 text-white' : 'text-navy-500 hover:bg-navy-50'}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Type Tabs */}
      <div className="border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto py-3 no-scrollbar">
            {PROPERTY_TABS.map((tab) => (
              <button key={tab.id} onClick={() => { setParam('category', tab.id === category ? '' : tab.id); setParam('subCategory', ''); }} className={`shrink-0 pb-1 text-sm font-semibold transition border-b-2 ${tab.id === category ? 'border-gold-500 text-navy-800' : 'border-transparent text-navy-400 hover:text-navy-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Category Tabs */}
      {currentSubCategories.length > 0 && (
        <div className="border-b border-navy-50 bg-navy-50/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {currentSubCategories.map((sc) => (
                <button key={sc.id} onClick={() => setParam('subCategory', subCategory === sc.id ? '' : sc.id)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${subCategory === sc.id ? 'bg-navy-700 text-white' : 'bg-white text-navy-500 border border-navy-100 hover:bg-navy-50'}`}>
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Search + Purpose + Filter */}
        <div className="rounded-2xl border border-navy-100 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input value={keyword} onChange={(e) => setParam('q', e.target.value)} placeholder={t('props.searchPlaceholder')} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 py-2.5 pl-10 pr-3 text-sm text-navy-700 outline-none focus:border-gold-400 focus:bg-white" />
            </div>
            <select value={city} onChange={(e) => setParam('city', e.target.value)} className="rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm text-navy-700 outline-none focus:border-gold-400">
              <option value="">{t('props.allCities')}</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={purpose} onChange={(e) => setParam('purpose', e.target.value)} className="rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm text-navy-700 outline-none focus:border-gold-400">
              <option value="">{t('props.allPurposes')}</option>
              <option value="sale">{t('props.forSale')}</option>
              <option value="rent">{t('props.forRent')}</option>
              <option value="requirement">{t('props.requirement')}</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
              <SlidersHorizontal className="h-4 w-4" /> {t('props.filters')}
            </button>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-400 shrink-0"><DollarSign className="inline h-3 w-3" /> Price</span>
            {PRICE_RANGES.map((r) => (
              <button key={r.label} onClick={() => setParam('priceRange', priceRange === r.label ? '' : r.label)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition whitespace-nowrap ${priceRange === r.label ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{r.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-400 shrink-0"><Maximize className="inline h-3 w-3" /> Area</span>
            {AREA_SIZES.map((r) => (
              <button key={r.label} onClick={() => setParam('areaSize', areaSize === r.label ? '' : r.label)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition whitespace-nowrap ${areaSize === r.label ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{r.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-400 shrink-0"><BedDouble className="inline h-3 w-3" /> Beds</span>
            {['', '1', '2', '3', '4', '5'].map((b) => (
              <button key={b || 'any'} onClick={() => setParam('beds', beds === b ? '' : b)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${beds === b ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{b || 'Any'}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-400 shrink-0"><Clock className="inline h-3 w-3" /> Posted</span>
            {DATE_OPTIONS.map((d) => (
              <button key={d.value} onClick={() => setParam('date', dateFilter === d.value ? '' : d.value)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${dateFilter === d.value ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{d.label}</button>
            ))}
          </div>
          <button onClick={() => setParam('featured', featuredOnly ? '' : '1')} className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${featuredOnly ? 'bg-gold-400 text-navy-800' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>
            <Star className="h-3 w-3" /> Featured
          </button>
          <button onClick={() => setParam('verified', verifiedOnly ? '' : '1')} className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${verifiedOnly ? 'bg-emerald-600 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>
            <BadgeCheck className="h-3 w-3" /> Verified
          </button>

          {/* More Options Button */}
          <button onClick={() => setShowMoreOptions(!showMoreOptions)} className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${showMoreOptions ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>
            <Settings2 className="h-3 w-3" /> More
          </button>
        </div>

        {/* More Options Dropdown */}
        {showMoreOptions && (
          <div className="mt-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-lg">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">Furnished</label>
                <div className="flex gap-2">
                  <button onClick={() => setParam('furnished', furnishedOnly ? '' : '1')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${furnishedOnly ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>Furnished</button>
                  <button onClick={() => setParam('furnished', furnishedOnly ? '' : '1')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${!furnishedOnly ? 'bg-navy-50 text-navy-600 hover:bg-navy-100' : 'bg-white border border-navy-100 text-navy-600'}`}>Unfurnished</button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">Seller Type</label>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600">All</button>
                  <button className="rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600">Owner</button>
                  <button className="rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600">Agent</button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">Price Type</label>
                <select className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-xs outline-none focus:border-gold-400">
                  <option>All</option>
                  <option>Fixed</option>
                  <option>Negotiable</option>
                  <option>On Call</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">Reset</label>
                <button onClick={() => setParams(new URLSearchParams(), { replace: true })} className="w-full rounded-lg border border-navy-200 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50">Clear All Filters</button>
              </div>
            </div>
          </div>
        )}

        {/* Results Bar */}
        <div className="mt-4 flex items-center justify-between gap-4 border-b border-navy-100 pb-3">
          <p className="text-sm text-navy-500">
            <span className="font-semibold text-navy-800">{filtered.length}</span> {filtered.length === 1 ? 'property' : 'properties'} found
          </p>
          <div className="flex items-center gap-3">
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 outline-none focus:border-gold-400">
              <option value="newest">{t('props.sortNewest')}</option>
              <option value="price-asc">{t('props.sortPriceAsc')}</option>
              <option value="price-desc">{t('props.sortPriceDesc')}</option>
            </select>
            <button onClick={() => setShowMap(!showMap)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${showMap ? 'bg-navy-700 text-white' : 'border border-navy-100 text-navy-600 hover:bg-navy-50'}`}>
              <Map className="h-3.5 w-3.5" /> Map
            </button>
            <div className="flex gap-0.5 rounded-lg border border-navy-100 bg-white p-0.5">
              <button onClick={() => setView('grid')} className={`grid h-7 w-7 place-items-center rounded-md ${view === 'grid' ? 'bg-navy-700 text-white' : 'text-navy-400'}`} aria-label="Grid"><Grid3x3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setView('list')} className={`grid h-7 w-7 place-items-center rounded-md ${view === 'list' ? 'bg-navy-700 text-white' : 'text-navy-400'}`} aria-label="List"><List className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6 flex gap-6">
          {showFilters && (
            <aside className="w-64 shrink-0">
              <div className="sticky top-24 rounded-2xl border border-navy-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy-800">{t('props.advFilters')}</h3>
                  <button onClick={() => setShowFilters(false)} className="text-navy-400 hover:text-navy-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 space-y-4">
                  <FilterGroup label={t('props.priceRange')}>
                    <div className="flex gap-2">
                      <input type="number" value={minPrice} onChange={(e) => setParam('min', e.target.value)} placeholder="Min" className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400" />
                      <input type="number" value={maxPrice} onChange={(e) => setParam('max', e.target.value)} placeholder="Max" className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400" />
                    </div>
                  </FilterGroup>
                  <FilterGroup label="Price Range">
                    <div className="flex flex-col gap-1">
                      {PRICE_RANGES.map((r) => (
                        <button key={r.label} onClick={() => setParam('priceRange', priceRange === r.label ? '' : r.label)} className={`text-left rounded-lg px-3 py-1.5 text-xs font-medium transition ${priceRange === r.label ? 'bg-gold-400 text-navy-800' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>{r.label}</button>
                      ))}
                    </div>
                  </FilterGroup>
                  <FilterGroup label="Area Size">
                    <div className="flex flex-col gap-1">
                      {AREA_SIZES.map((r) => (
                        <button key={r.label} onClick={() => setParam('areaSize', areaSize === r.label ? '' : r.label)} className={`text-left rounded-lg px-3 py-1.5 text-xs font-medium transition ${areaSize === r.label ? 'bg-gold-400 text-navy-800' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>{r.label}</button>
                      ))}
                    </div>
                  </FilterGroup>
                  <FilterGroup label="Area / Location">
                    <select value={area} onChange={(e) => setParam('area', e.target.value)} className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400">
                      <option value="">All Areas</option>
                      {cityAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </FilterGroup>
                  <FilterGroup label={t('props.minBeds')}>
                    <select value={beds} onChange={(e) => setParam('beds', e.target.value)} className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400">
                      <option value="">{t('props.any')}</option>
                      <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option>
                    </select>
                  </FilterGroup>
                  <FilterGroup label="Posted Date">
                    <select value={dateFilter} onChange={(e) => setParam('date', e.target.value)} className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400">
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </FilterGroup>
                  <FilterGroup label="Sort By">
                    <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="w-full rounded-lg border border-navy-100 px-2 py-1.5 text-sm outline-none focus:border-gold-400">
                      <option value="newest">{t('props.sortNewest')}</option>
                      <option value="price-asc">{t('props.sortPriceAsc')}</option>
                      <option value="price-desc">{t('props.sortPriceDesc')}</option>
                    </select>
                  </FilterGroup>
                  <label className="flex items-center gap-2 text-sm text-navy-700">
                    <input type="checkbox" checked={verifiedOnly} onChange={(e) => setParam('verified', e.target.checked ? '1' : '')} className="h-4 w-4 rounded accent-gold-500" />
                    Verified Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-navy-700">
                    <input type="checkbox" checked={featuredOnly} onChange={(e) => setParam('featured', e.target.checked ? '1' : '')} className="h-4 w-4 rounded accent-gold-500" />
                    Featured Only
                  </label>
                  <button onClick={() => setParams(new URLSearchParams(), { replace: true })} className="w-full rounded-lg border border-navy-200 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">{t('props.clearAll')}</button>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            {showMap && (
              <div ref={mapRef} className="mb-6 h-[400px] w-full overflow-hidden rounded-2xl border border-navy-100" style={{ zIndex: 1 }} />
            )}
            {paged.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-navy-200 bg-white py-20 text-center">
                <MapPin className="h-10 w-10 text-navy-300" />
                <p className="mt-3 font-medium text-navy-700">{t('props.noResults')}</p>
                <p className="text-sm text-navy-400">{t('props.noResultsSub')}</p>
              </div>
            ) : view === 'grid' ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((p, i) => (
                  <Reveal key={p.id} variant="up" delay={(i % 3) + 1}>
                    <ProductCard variant="property" property={p} saved={saved.has(p.id)} onToggleSave={toggleSave} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paged.map((p, i) => (
                  <Reveal key={p.id} variant="left" delay={1}>
                    <ListItem property={p} saved={saved.has(p.id)} onToggleSave={toggleSave} />
                  </Reveal>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="grid h-9 w-9 place-items-center rounded-lg border border-navy-100 text-navy-600 transition hover:bg-navy-50 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold transition ${page === p ? 'bg-navy-700 text-white' : 'border border-navy-100 text-navy-600 hover:bg-navy-50'}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="grid h-9 w-9 place-items-center rounded-lg border border-navy-100 text-navy-600 transition hover:bg-navy-50 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Recently Viewed */}
            {recentProperties.length > 0 && (
              <div className="mt-12">
                <div className="mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-navy-400" />
                  <h2 className="font-serif text-xl font-bold text-navy-800">Recently Viewed</h2>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {recentProperties.slice(0, 3).map((p) => (
                    <Link key={p.id} to={`/property/${p.id}`} className="flex gap-3 rounded-xl border border-navy-100 bg-white p-3 transition hover:shadow-md" onClick={() => addRecentlyViewed(p.id)}>
                      <img src={p.images[0]} alt={p.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gold-600 text-sm">Rs {formatPKR(p.price)}</p>
                        <p className="truncate text-xs font-medium text-navy-800">{p.title}</p>
                        <p className="text-[10px] text-navy-400">{p.area}, {p.city}</p>
                        <p className="text-[10px] text-navy-400">{p.size} | {timeAgo(p.postedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</label>
      {children}
    </div>
  );
}

function ListItem({ property, saved, onToggleSave }: { property: Property; saved?: boolean; onToggleSave?: (id: string) => void }) {
  const { t } = useLang();
  const [showPhone, setShowPhone] = useState(false);
  const isAgent = property.seller.type === 'Agent' || property.seller.type === 'Dealer';
  const pricePerMarla = Math.round(property.price / 5);
  return (
    <div className="card-3d group flex flex-col gap-4 border border-navy-100/60 p-4 sm:flex-row">
      <Link to={`/property/${property.id}`} className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-xl bg-navy-100 sm:h-32 sm:w-48" onClick={() => addRecentlyViewed(property.id)}>
        <img src={property.images[0]} alt={property.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {property.images.length > 1 && (
          <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            <ImageIcon className="h-3 w-3" /> {property.images.length}
          </div>
        )}
        {property.verified && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3 w-3" /> {t('card.verified')}
          </div>
        )}
        {property.featured && (
          <div className="absolute top-1.5 left-1.5 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-semibold text-navy-800">
            <TrendingUp className="mr-0.5 inline h-3 w-3" /> Featured
          </div>
        )}
        {property.seller.premium && (
          <div className="absolute top-1.5 right-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
            <Shield className="mr-0.5 inline h-3 w-3" /> Titanium
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-serif text-lg font-bold text-gold-600">Rs {formatPKR(property.price)}</span>
            {property.size && <span className="ml-2 text-xs text-navy-400">({formatPKR(pricePerMarla)}/Marla)</span>}
            <Link to={`/property/${property.id}`} onClick={() => addRecentlyViewed(property.id)} className="block font-semibold text-navy-800 hover:text-navy-900">{property.title}</Link>
          </div>
          {onToggleSave && (
            <button onClick={() => onToggleSave(property.id)} className="grid h-8 w-8 place-items-center rounded-full bg-navy-50 hover:bg-navy-100" aria-label="Save">
              <Heart className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : 'text-navy-600'}`} />
            </button>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-navy-500">{property.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-600">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gold-500" /> {property.area}, {property.city}</span>
          <span className="inline-flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-gold-500" /> {property.size}</span>
          {property.bedrooms != null && property.bedrooms > 0 && <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-gold-500" /> {property.bedrooms}</span>}
          {property.bathrooms != null && property.bathrooms > 0 && <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-gold-500" /> {property.bathrooms}</span>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(property.postedAt)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-navy-400">
          {property.seller.premium ? (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
              <Shield className="h-3 w-3 text-indigo-500" /> {property.seller.name}
            </span>
          ) : isAgent ? (
            <span className="inline-flex items-center gap-1 text-blue-600">
              <Shield className="h-3 w-3" /> {property.seller.name}
            </span>
          ) : (
            <span>{property.seller.name}</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/property/${property.id}`} onClick={() => addRecentlyViewed(property.id)} className="rounded-lg bg-navy-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-800">{t('card.moreDetails')}</Link>
          {!showPhone ? (
            <button onClick={() => setShowPhone(true)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              <Eye className="h-4 w-4" /> Show Number
            </button>
          ) : (
            <>
              <a href={`tel:${property.seller.phone}`} className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><Phone className="h-4 w-4" /></a>
              <a href={`https://wa.me/${property.seller.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><MessageCircle className="h-4 w-4" /></a>
              <span className="text-xs text-navy-500 font-medium flex items-center">{property.seller.phone}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
