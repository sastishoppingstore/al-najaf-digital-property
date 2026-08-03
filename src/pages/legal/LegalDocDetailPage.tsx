import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ShieldCheck, FileText, User, Upload, Mail, Phone, Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { addOrder, getSession } from '@/lib/dataService';

const LEGAL_DOCUMENT_TYPES = [
  { id: 'sula-nama', name: 'Sula Nama (Settlement)', description: 'Deed for mutual settlement and compromise between parties', fee: 'From PKR 2,000', duration: '2-3 days', category: 'settlement' },
  { id: 'talaq-nama', name: 'Talaq Nama (Divorce Deed)', description: 'Draft divorce deeds with proper legal procedure and registration', fee: 'From PKR 2,000', duration: '2-4 days', category: 'family' },
  { id: 'aaq-nama', name: 'Aaq Nama (Relinquishment)', description: 'Relinquish your share in inherited property legally', fee: 'From PKR 2,500', duration: '3-5 days', category: 'inheritance' },
  { id: 'bayan-halfi', name: 'Bayan Halfi (Affidavit)', description: 'Create sworn affidavits for various legal needs', fee: 'From PKR 800', duration: '1 day', category: 'affidavit' },
  { id: 'power-of-attorney', name: 'Power of Attorney (PoA)', description: 'Authorize someone to act on your behalf legally', fee: 'From PKR 2,000', duration: '2-3 days', category: 'authorization' },
  { id: 'wasiyat', name: 'Will / Wasiyat Nama', description: 'Draft a legally binding will for your assets', fee: 'From PKR 1,500', duration: '1-2 days', category: 'will' },
  { id: 'kiraya-nama', name: 'Kiraya Nama (Rent Agreement)', description: 'Draft and register rent agreements with legal validity', fee: 'From PKR 1,500', duration: '1-2 days', category: 'rental' },
  { id: 'hibba-nama', name: 'Hibba Nama (Gift Deed)', description: 'Transfer property as a gift through a registered deed', fee: 'From PKR 2,500', duration: '3-5 days', category: 'gift' },
  { id: 'agreement', name: 'Various Agreements', description: 'Custom legal agreements for all types of purposes', fee: 'From PKR 3,000', duration: '2-5 days', category: 'agreement' },
];

const URGENCY_OPTIONS = ['Normal (3-5 days)', 'Urgent (1-2 days)', 'Emergency (24 hours)'];

export function LegalDocDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const doc = LEGAL_DOCUMENT_TYPES.find((d) => d.id === id);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cnic: '',
    phone: '',
    email: '',
    address: '',
    urgency: 'Normal (3-5 days)',
    details: '',
    counterparty: '',
  });

  if (!doc) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-lg font-semibold text-navy-700">Legal document type not found.</p>
        <Link to="/legal" className="mt-3 text-gold-600 hover:underline">Back to Legal Documents</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="enter-3d">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('service.submitted')}</h1>
          <p className="mt-2 text-navy-500"><span className="font-semibold">{doc.name}</span> {t('service.submittedSub')}</p>
          <p className="mt-1 text-sm text-navy-400">Reference: <strong>LG-{Date.now().toString(36).toUpperCase()}</strong></p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">{t('dash.title')}</Link>
            <Link to="/legal" className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">{t('service.backToServices')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const steps = [t('service.applicantDetails'), 'Document Details', t('service.reviewSubmit')];

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-800">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-navy-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t('common.back')}</button>
          <div className="mt-4 flex items-center gap-4 enter-3d">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-400 text-navy-800"><FileText className="h-7 w-7" /></span>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">{doc.name}</h1>
              <p className="mt-1 max-w-2xl text-navy-100">{doc.description}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-navy-100">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold-400" /> Verified Legal Drafting</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold-400" /> {doc.duration}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gold-400" /> {doc.fee}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${i <= step ? 'bg-gold-400 text-navy-800' : 'bg-navy-100 text-navy-400'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`ml-2 hidden text-xs font-medium sm:block ${i <= step ? 'text-navy-700' : 'text-navy-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-gold-400' : 'bg-navy-100'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (step < steps.length - 1) { setStep(step + 1); } else { const s = getSession(); try { addOrder({ userId: s?.userId || 'guest', orderRef: `LG-${Date.now().toString().slice(-6)}`, orderType: doc.name, orderDate: new Date().toLocaleDateString(), orderAmount: doc.fee, status: 'Under Review', name: form.name || s?.name || 'Guest', email: form.email || s?.email || '', phone: form.phone || '', notes: `Urgency: ${form.urgency} · ${form.details || ''}` }); } catch {} setSubmitted(true); } }} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.applicantDetails')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.partyName')} <span className="text-rose-500">*</span></label>
                  <input type="text" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.partyCnic')} <span className="text-rose-500">*</span></label>
                  <input type="text" required value={form.cnic} onChange={(e) => setForm(p => ({ ...p, cnic: e.target.value }))} placeholder="XXXXX-XXXXXXX-X" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('auth.phone')} <span className="text-rose-500">*</span></label>
                  <input type="tel" required value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('auth.email')} <span className="text-rose-500">*</span></label>
                  <input type="email" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('estamp.partyAddress')}</label>
                <textarea rows={3} value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">Document Details</h2>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">Select Urgency <span className="text-rose-500">*</span></label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {URGENCY_OPTIONS.map((u) => (
                    <button key={u} type="button" onClick={() => setForm(p => ({ ...p, urgency: u }))} className={`rounded-xl border p-3 text-sm transition ${form.urgency === u ? 'border-gold-400 bg-gold-50 text-navy-800 font-semibold' : 'border-navy-100 text-navy-600 hover:bg-navy-50'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">Details / Description <span className="text-rose-500">*</span></label>
                <textarea required rows={5} value={form.details} onChange={(e) => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Provide full details of what you need drafted..." className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              </div>
              {doc.id !== 'bayan-halfi' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">Counterparty / Other Party Name</label>
                  <input type="text" value={form.counterparty} onChange={(e) => setForm(p => ({ ...p, counterparty: e.target.value }))} placeholder="Name of the other party (if applicable)" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">Upload Required Documents</label>
                <div className="grid gap-2">
                  <label className="cursor-pointer rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-4 text-center transition hover:border-gold-400 hover:bg-gold-50">
                    <Upload className="mx-auto h-5 w-5 text-navy-400" />
                    <p className="mt-1 text-xs font-medium text-navy-700">Upload CNIC Copy</p>
                  </label>
                  <label className="cursor-pointer rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-4 text-center transition hover:border-gold-400 hover:bg-gold-50">
                    <Upload className="mx-auto h-5 w-5 text-navy-400" />
                    <p className="mt-1 text-xs font-medium text-navy-700">Upload Supporting Documents</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.reviewSubmit')}</h2>
              <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-700 space-y-2">
                <div className="flex justify-between border-b border-navy-100 pb-2 font-bold">
                  <span>Field</span>
                  <span>Value</span>
                </div>
                <div className="flex justify-between"><span className="text-navy-500">Document</span><span className="font-semibold">{doc.name}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Applicant</span><span>{form.name}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">CNIC</span><span>{form.cnic}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Phone</span><span>{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Email</span><span>{form.email}</span></div>
                <div className="flex justify-between"><span className="text-navy-500">Urgency</span><span>{form.urgency}</span></div>
                <div className="flex justify-between border-t border-navy-150 pt-2 font-bold text-gold-600">
                  <span>Total Fee</span>
                  <span>{doc.fee}</span>
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-navy-700 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-gold-500" />
                I confirm that the information provided is correct and agree to the terms & conditions.
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
                <ChevronLeft className="h-4 w-4" /> {t('service.back')}
              </button>
            ) : <div />}
            <button type="submit" className="inline-flex items-center gap-1 rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300">
              {step < steps.length - 1 ? t('service.continue') : 'Submit Application'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
