import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Check, ChevronRight, FileText, ShieldCheck, Hash, MapPin, Phone, Mail, Calendar, AlertCircle, Clock } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const LEGAL_DOCUMENT_TYPES = [
  { id: 'sula-nama', name: 'Sula Nama (Settlement)', description: 'Deed for mutual settlement and compromise between parties', icon: 'FileText', fee: 'From PKR 2,000', duration: '2-3 days', category: 'settlement' },
  { id: 'talaq-nama', name: 'Talaq Nama (Divorce Deed)', description: 'Draft divorce deeds with proper legal procedure and registration', icon: 'FileX', fee: 'From PKR 2,000', duration: '2-4 days', category: 'family' },
  { id: 'aaq-nama', name: 'Aaq Nama (Relinquishment)', description: 'Relinquish your share in inherited property legally', icon: 'FileMinus', fee: 'From PKR 2,500', duration: '3-5 days', category: 'inheritance' },
  { id: 'bayan-halfi', name: 'Bayan Halfi (Affidavit)', description: 'Create sworn affidavits for various legal needs', icon: 'Scroll', fee: 'From PKR 800', duration: '1 day', category: 'affidavit' },
  { id: 'power-of-attorney', name: 'Power of Attorney (PoA)', description: 'Authorize someone to act on your behalf legally', icon: 'FileSignature', fee: 'From PKR 2,000', duration: '2-3 days', category: 'authorization' },
  { id: 'wasiyat', name: 'Will / Wasiyat Nama', description: 'Draft a legally binding will for your assets', icon: 'BookText', fee: 'From PKR 1,500', duration: '1-2 days', category: 'will' },
  { id: 'kiraya-nama', name: 'Kiraya Nama (Rent Agreement)', description: 'Draft and register rent agreements with legal validity', icon: 'FileSignature', fee: 'From PKR 1,500', duration: '1-2 days', category: 'rental' },
  { id: 'hibba-nama', name: 'Hibba Nama (Gift Deed)', description: 'Transfer property as a gift through a registered deed', icon: 'Gift', fee: 'From PKR 2,500', duration: '3-5 days', category: 'gift' },
  { id: 'agreement', name: 'Various Agreements', description: 'Custom legal agreements for all types of purposes', icon: 'FileText', fee: 'From PKR 3,000', duration: '2-5 days', category: 'agreement' },
];

const CATEGORIES = ['all', 'settlement', 'family', 'inheritance', 'affidavit', 'authorization', 'will', 'rental', 'gift', 'agreement'];

export function LegalDocumentsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = LEGAL_DOCUMENT_TYPES.filter((doc) => {
    if (q && !`${doc.name} ${doc.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== 'all' && doc.category !== cat) return false;
    return true;
  });

  const handleBook = (docId: string) => {
    navigate(`/legal/${docId}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden bg-navy-800 py-14">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/images/hero-banner-legal.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Legal Documents
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl enter-3d">All Legal Document Services</h1>
          <p className="mx-auto mt-3 max-w-2xl text-navy-100">Sula naam, Talaq naam, Aaq naam, Bayan halfi, Power of Attorney, Will, and all types of legal agreements — drafted and registered by verified lawyers.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search legal documents..." className="w-full rounded-xl border border-navy-100 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(cat === c ? 'all' : c)} className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize ${cat === c ? 'bg-navy-700 text-white' : 'bg-white text-navy-600 border border-navy-100 hover:bg-navy-50'}`}>{c === 'all' ? 'All' : c}</button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-navy-500">{filtered.length} {filtered.length === 1 ? 'document found' : 'documents found'}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, i) => (
            <div key={doc.id} className="card-3d group flex flex-col overflow-hidden border border-navy-100/60 hover:shadow-lg transition">
              <div className="relative aspect-[16/9] overflow-hidden bg-navy-100">
                <img src={`/images/legal-${doc.id}.jpg`} alt={doc.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-serif text-lg font-bold text-white">{doc.name}</h3>
                  <p className="text-xs text-white/85">{doc.category}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-sm text-navy-600 flex-1">{doc.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-navy-600">
                  <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-gold-500" /> {doc.fee}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gold-500" /> {doc.duration}</span>
                </div>
                <button onClick={() => handleBook(doc.id)} className="mt-4 w-full rounded-xl bg-navy-700 py-2 text-sm font-semibold text-white hover:bg-navy-800">Book This Service</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}