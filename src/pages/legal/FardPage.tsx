import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Hash, Clock, Check, Shield, Database, Search as SearchIcon } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const FARD_TYPES = [
  { id: 'fard-bray-record', name: 'Fard Bray Record', description: 'Search and retrieve fard bray (registered) record from government database', icon: Database, category: 'Record', govSource: 'Lands Department', rate: 'Free' },
  { id: 'fard-bray-meter', name: 'Fard Bray Meter', description: 'Check fard bray for metered properties and utility connections', icon: Database, category: 'Meter', govSource: 'Lands Dept / Utilities', rate: 'Free' },
  { id: 'fard-baray-zati', name: 'Fard Baray Zati (Record)', description: 'Retrieve personal fard record (zati) from government records', icon: Database, category: 'Personal Record', govSource: 'Revenue Department', rate: 'Free' },
  { id: 'fard-all-types', name: 'All Fard Types', description: 'Comprehensive search across all fard record types', icon: SearchIcon, category: 'All', govSource: 'Multiple Departments', rate: 'Free' },
  { id: 'fard-mutation', name: 'Fard Mutation (Intiqal)', description: 'Record transfer and mutation in fard records', icon: Hash, category: 'Record', govSource: 'Lands Department', rate: 'From PKR 500' },
  { id: 'fard-clearance', name: 'Fard Clearance Certificate', description: 'Obtain fard clearance certificate for property transactions', icon: Shield, category: 'Certificate', govSource: 'Revenue Dept', rate: 'From PKR 1,000' },
  { id: 'fard-verify', name: 'Fard Verification', description: 'Verify property fard status and ownership details', icon: Check, category: 'Verification', govSource: 'Lands Department', rate: 'From PKR 500' },
  { id: 'fard-extract', name: 'Fard Extract Copy', description: 'Get verified extract copy of fard records', icon: Database, category: 'Copy', govSource: 'Revenue Department', rate: 'From PKR 300' },
];

const FARD_CATEGORIES = ['all', 'Record', 'Meter', 'Personal Record', 'All', 'Mutation', 'Certificate', 'Verification', 'Copy'];

export function FardPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [searching, setSearching] = useState(false);

  const filtered = FARD_TYPES.filter((f) => {
    if (q && !`${f.name} ${f.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== 'all' && f.category !== cat) return false;
    return true;
  });

  const handleSearch = (fardId: string) => {
    setSearching(true);
    setTimeout(() => {
      navigate(`/fard/${fardId}`);
      setSearching(false);
    }, 800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden bg-navy-800 py-14">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/fard-hero.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
            <Database className="h-3.5 w-3.5" /> Fard Records
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl enter-3d">Government Fard Records</h1>
          <p className="mx-auto mt-3 max-w-2xl text-navy-100">Search fard bray record, fard bray meter, fard baray zati record — all government records in one place, Pakistan ki qanoon ke mutabik.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-navy-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-gold-500" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-navy-800">Search Government Fard Records</h3>
              <p className="text-xs text-navy-500">Search fard bray record, fard bray meter, fard baray zati — all from official government sources</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <input type="text" placeholder="Search fard by CNIC, property no, or record type..." className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            <button className="rounded-lg bg-navy-700 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-800">Search</button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          {FARD_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(cat === c ? 'all' : c)} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize ${cat === c ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{c === 'all' ? 'All Types' : c}</button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((f, i) => (
            <div key={f.id} className="card-3d group flex flex-col overflow-hidden border border-navy-100/60 hover:shadow-lg transition cursor-pointer" onClick={() => handleSearch(f.id)}>
              <div className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy-50 text-navy-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-navy-800">{f.name}</h3>
                  <p className="text-xs text-navy-500">{f.category}</p>
                </div>
              </div>
              <div className="px-4 pb-3">
                <p className="text-xs text-navy-500">{f.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gold-600"><Hash className="h-3 w-3" /> {f.govSource}</span>
                  <span className="font-semibold text-navy-700">{f.rate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searching && (
          <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/30 py-12">
            <Database className="h-10 w-10 animate-pulse text-navy-400" />
            <p className="mt-3 text-sm text-navy-500">Searching government fard records...</p>
          </div>
        )}
      </div>
    </div>
  );
}