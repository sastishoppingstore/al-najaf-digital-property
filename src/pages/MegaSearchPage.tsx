import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, FileText, Database, Scale, ChevronRight, Check, ArrowRight, Building2, Stamp, Globe, Shield, User, Clock, ListTodo, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { getAllProperties, useDataVersion } from '@/lib/dataService';

type SearchCategory = 'all' | 'properties' | 'estamp' | 'legal' | 'fard' | 'services';
type SearchResult = {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  icon: typeof Home;
  url: string;
  tags: string[];
};

const ALL_SERVICES: SearchResult[] = [
  { id: 'properties', title: 'Property Bazaar', description: 'Buy, sell, rent properties — land, houses, flats, plots', icon: Building2, url: '/properties', category: 'properties', tags: ['land', 'house', 'flat', 'plot', 'sale', 'rent', 'property', 'jadid', 'ghar', 'zamin', 'makan'] },
  { id: 'estamp', title: 'E-Stamp Paper', description: 'Apply for judicial & non-judicial e-stamp papers online', icon: Stamp, url: '/estamp', category: 'estamp', tags: ['stamp', 'estamp', 'judicial', 'non-judicial', 'fbr', 'stamp paper', 'dashtavez'] },
  { id: 'legal-all', title: 'Legal Document Services', description: 'Sula Nama, Talaq Nama, Aaq Nama, Bayan Halfi, PoA, Will, Rent Agreement', icon: Scale, url: '/legal', category: 'legal', tags: ['sula', 'talaq', 'aaq', 'halfi', 'affidavit', 'power of attorney', 'will', 'wasiyat', 'kiraya', 'hibba', 'gift deed', 'rent', 'legal'] },
  { id: 'fard-all', title: 'Fard Government Records', description: 'Fard bray record, fard bray meter, fard baray zati, mutation, clearance, extract', icon: Database, url: '/fard', category: 'fard', tags: ['fard', 'record', 'government', 'bray', 'meter', 'zati', 'intiqal', 'mutation', 'clearance', 'extract'] },
  { id: 'services-all', title: 'All Services', description: 'Land registration, meter transfer, valuation, legal aid & more', icon: Globe, url: '/services', category: 'services', tags: ['service', 'registration', 'meter', 'transfer', 'valuation', 'lawyer', 'gas', 'electricity', 'water'] },
];

const TASK_STEPS: Record<string, { step: number; label: string; url: string }[]> = {
  'estamp': [
    { step: 1, label: 'Select E-Stamp type & amount', url: '/estamp' },
    { step: 2, label: 'Fill applicant details', url: '/estamp' },
    { step: 3, label: 'Scan ID card (front, back, with person)', url: '/estamp' },
    { step: 4, label: 'Upload documents & signature', url: '/estamp' },
    { step: 5, label: 'Fingerprint scan & selfie', url: '/estamp' },
    { step: 6, label: 'Review & submit with OTP', url: '/estamp' },
  ],
  'legal': [
    { step: 1, label: 'Select legal document type', url: '/legal' },
    { step: 2, label: 'Fill applicant details', url: '/legal' },
    { step: 3, label: 'Provide document details & urgency', url: '/legal' },
    { step: 4, label: 'Upload required documents', url: '/legal' },
    { step: 5, label: 'Review & submit', url: '/legal' },
  ],
  'fard': [
    { step: 1, label: 'Select fard record type', url: '/fard' },
    { step: 2, label: 'Search by CNIC / property number', url: '/fard' },
    { step: 3, label: 'Review fard record results', url: '/fard' },
    { step: 4, label: 'Book service (if paid)', url: '/fard' },
  ],
  'properties': [
    { step: 1, label: 'Browse or search properties', url: '/properties' },
    { step: 2, label: 'Filter by area, price, type', url: '/properties' },
    { step: 3, label: 'View property details', url: '/properties' },
    { step: 4, label: 'Contact seller or save property', url: '/properties' },
  ],
  'services': [
    { step: 1, label: 'Browse all services', url: '/services' },
    { step: 2, label: 'Select service type', url: '/services' },
    { step: 3, label: 'Fill application form', url: '/services' },
    { step: 4, label: 'Upload documents', url: '/services' },
    { step: 5, label: 'Review & submit', url: '/services' },
  ],
};

export function MegaSearchPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  useDataVersion();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedService, setSelectedService] = useState<SearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = ALL_SERVICES.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some((tag) => tag.toLowerCase().includes(q))
    );
    setResults(matches);
    setShowResults(true);
  }, [query]);

  const handleSelect = (service: SearchResult) => {
    setSelectedService(service);
    setShowResults(false);
  };

  const getMatchingTasks = () => {
    if (!selectedService) return [];
    return TASK_STEPS[selectedService.category] || [];
  };

  const handleStart = (url: string) => {
    navigate(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Search Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800 p-8 sm:p-12">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-gold-500/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-24 translate-y-24 rounded-full bg-gold-500/5" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
            <Sparkles className="h-3.5 w-3.5" /> Mega Portal Search
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">{t('common.search')} <span className="text-gold-400">&amp;</span> Complete</h1>
          <p className="mt-2 max-w-2xl text-navy-100">Pakistan ka sab se comprehensive property aur legal services portal. Search karein, task list banayein, step-by-step complete karein — sab ek hi jagah.</p>

          <div className="mt-6 relative">
            <div className="flex items-center gap-0 rounded-2xl border border-navy-600 bg-navy-700/50 backdrop-blur-sm overflow-hidden focus-within:border-gold-400 transition">
              <Search className="ml-4 h-5 w-5 shrink-0 text-navy-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search properties, estamp, legal docs, fard, services..."
                className="flex-1 bg-transparent px-3 py-4 text-sm text-white placeholder-navy-400 outline-none"
              />
            </div>
            {showResults && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-xl">
                {results.map((r) => (
                  <button key={r.id} onClick={() => handleSelect(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gold-50/50">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-600"><r.icon className="h-5 w-5" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-800">{r.title}</p>
                      <p className="truncate text-xs text-navy-500">{r.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium capitalize text-gold-600">{r.category}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-navy-300" />
                  </button>
                ))}
              </div>
            )}
            {showResults && query.length >= 2 && results.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-navy-200 bg-white p-6 text-center shadow-xl">
                <p className="text-sm text-navy-500">No results found for "{query}"</p>
                <p className="mt-1 text-xs text-navy-400">Try searching for: property, estamp, legal, fard, sula nama, talaq, etc.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        {ALL_SERVICES.map((s) => (
          <button key={s.id} onClick={() => handleSelect(s)} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${selectedService?.id === s.id ? 'border-gold-400 bg-gold-50 shadow-md' : 'border-navy-100 bg-white hover:border-gold-300 hover:shadow-sm'}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${selectedService?.id === s.id ? 'bg-gold-400 text-navy-800' : 'bg-navy-50 text-navy-600'}`}><s.icon className="h-5 w-5" /></span>
            <span className="text-xs font-semibold text-navy-700">{s.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {selectedService && (
        <div className="mt-8 enter-3d">
          <div className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-600"><ListTodo className="h-5 w-5" /></span>
              <div>
                <h2 className="font-serif font-bold text-navy-800">{selectedService.title}</h2>
                <p className="text-xs text-navy-500">{selectedService.description}</p>
              </div>
              <button onClick={() => handleStart(selectedService.url)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300">
                Start Now <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Task Steps */}
            <div className="space-y-3">
              {getMatchingTasks().map((task) => (
                <div key={task.step} className="group flex items-center gap-4 rounded-xl border border-navy-100 bg-navy-50/30 p-4 transition hover:border-gold-200 hover:bg-gold-50/30">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-400 text-xs font-bold text-navy-800">{task.step}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-700">{task.label}</p>
                    <p className="text-xs text-navy-400">Step {task.step} of {getMatchingTasks().length}</p>
                  </div>
                  <button onClick={() => handleStart(task.url)} className="shrink-0 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-600 opacity-0 transition group-hover:opacity-100 hover:bg-navy-700 hover:text-white">
                    Go <ChevronRight className="ml-0.5 inline h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-6 border-t border-navy-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-500">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleStart('/dashboard')} className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                  <User className="h-3 w-3" /> My Dashboard
                </button>
                <button onClick={() => handleStart('/dashboard')} className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                  <Clock className="h-3 w-3" /> My Orders
                </button>
                <button onClick={() => handleStart('/')} className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                  <Home className="h-3 w-3" /> Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Properties */}
      {!selectedService && (
        <div className="mt-8">
          <h2 className="font-serif text-lg font-bold text-navy-800 mb-4">Featured Properties</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {getAllProperties().slice(0, 3).map((p) => (
              <div key={p.id} onClick={() => navigate(`/property/${p.id}`)} className="card-3d tilt-3d group cursor-pointer overflow-hidden rounded-2xl border border-navy-100 bg-white transition hover:shadow-md">
                <div className="h-36 overflow-hidden bg-navy-100">
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-navy-800">{p.title}</h3>
                  <p className="mt-0.5 text-xs text-navy-500">{p.area}, {p.city}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gold-600">Rs. {p.price.toLocaleString()}</span>
                    <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-600">{p.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
