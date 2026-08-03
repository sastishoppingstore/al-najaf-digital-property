import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, ShieldCheck, FileText, Star, Upload } from 'lucide-react';
import { useState } from 'react';
import { getManagedServices } from '@/lib/contentManager';
import { getIcon } from '@/lib/icons';
import { useLang } from '@/lib/i18n';
import { addOrder, getSession } from '@/lib/dataService';

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const allServices = getManagedServices();
  const service = allServices.find((s) => s.id === id);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!service) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-lg font-semibold text-navy-700">Service not found.</p>
        <Link to="/services" className="mt-3 text-gold-600 hover:underline">Back to services</Link>
      </div>
    );
  }

  const Icon = getIcon(service.icon);
  const steps = [t('service.applicantDetails'), t('service.serviceDetails'), t('service.documents'), t('service.reviewSubmit')];

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="enter-3d">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('service.submitted')}</h1>
          <p className="mt-2 text-navy-500"><span className="font-semibold">{service.name}</span> {t('service.submittedSub')}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/services" className="rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">{t('service.backToServices')}</Link>
            <Link to="/" className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">{t('service.goHome')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-800">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${service.image})`, backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 to-navy-800/85 gradient-animated" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-navy-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t('common.back')}</button>
          <div className="mt-4 flex items-center gap-4 enter-3d">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-400 text-navy-800"><Icon className="h-7 w-7" /></span>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">{service.name}</h1>
              <p className="mt-1 max-w-2xl text-navy-100">{service.description}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-navy-100">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold-400" /> {t('services.verifiedProcess')}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold-400" /> {service.duration}</span>
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-gold-400" /> {service.fee}</span>
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

        <form onSubmit={(e) => { e.preventDefault(); if (step < steps.length - 1) { setStep(step + 1); } else { const s = getSession(); try { addOrder({ userId: s?.userId || 'guest', orderRef: `SVC-${Date.now().toString().slice(-6)}`, orderType: 'Service Booking', orderDate: new Date().toLocaleDateString(), orderAmount: service.fee, status: 'Pending', name: s?.name || 'Guest', email: s?.email || '', phone: '', notes: service.name }); } catch {} setSubmitted(true); } }} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.applicantDetails')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('service.fullName')} required />
                <Field label={t('service.cnic')} required placeholder="XXXXX-XXXXXXX-X" />
                <Field label={t('auth.phone')} required type="tel" />
                <Field label={t('auth.email')} type="email" />
                <Field label={t('auth.city')} required />
                <Field label={t('detail.area')} required />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.serviceDetails')}</h2>
              <Field label={t('service.subjectTitle')} required />
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('detail.description')}</label>
                <textarea required rows={4} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" placeholder={t('service.descriptionPlaceholder')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('service.preferredDate')} type="date" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('service.urgency')}</label>
                  <select className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                    <option>{t('service.normal')}</option>
                    <option>{t('service.urgent')}</option>
                    <option>{t('service.veryUrgent')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.uploadDocs')}</h2>
              <p className="text-sm text-navy-500">{t('service.uploadDocsSub')}</p>
              <div className="rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-navy-400" />
                <p className="mt-2 text-sm font-medium text-navy-700">{t('service.dragDrop')}</p>
                <p className="text-xs text-navy-400">{t('service.orBrowse')}</p>
                <input type="file" multiple className="hidden" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 enter-3d">
              <h2 className="font-serif text-lg font-bold text-navy-800">{t('service.reviewSubmit')}</h2>
              <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-600">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-gold-500" /> {t('postAd.category')}: <span className="font-semibold text-navy-800">{service.name}</span></p>
                <p className="mt-1">{t('card.bookNow')}: <span className="font-semibold text-gold-600">{service.fee}</span></p>
                <p className="mt-1">{t('service.preferredDate')}: {service.duration}</p>
              </div>
              <label className="flex items-start gap-2 text-sm text-navy-700">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-gold-500" />
                {t('service.reviewConfirm')}
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">{t('service.back')}</button>
            ) : <span />}
            <button type="submit" className="rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300">
              {step < steps.length - 1 ? t('service.continue') : t('service.submitRequest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', required, placeholder }: { label: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input type={type} required={required} placeholder={placeholder} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
    </div>
  );
}
