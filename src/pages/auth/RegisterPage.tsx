import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, User, Phone, CreditCard, MapPin, ArrowRight, Building2, Check } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { registerUser } from '@/lib/dataService';
import { sendOtpEmail } from '@/lib/emailApi';
import { getManagedCities } from '@/lib/contentManager';
import { dbRegister, syncAll, isDbMode } from '@/lib/dbSync';
const CITIES = getManagedCities();

export function RegisterPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', cnic: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isDbMode()) {
        const res = await dbRegister({
          name: form.name, email: form.email, phone: form.phone,
          password: form.password, cnic: form.cnic, city: form.city,
        });
        if (!res.success) { setError(res.error || 'Registration failed'); setLoading(false); return; }
        await syncAll();
      } else {
        registerUser({
          name: form.name, email: form.email, phone: form.phone,
          password: form.password, cnic: form.cnic, city: form.city,
          role: 'user',
        });
      }
      await sendOtpEmail(form.email, form.name);
      navigate('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };



  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="scene-3d grid min-h-[calc(100vh-4rem)] place-items-center bg-navy-50/40 px-4 py-12">
      <Reveal variant="scale">
        <div className="w-full max-w-lg">
          <div className="tilt-3d rounded-3xl border border-navy-100 bg-white p-8 shadow-card-hover">
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy-700 text-gold-400">
                <Building2 className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('auth.registerTitle')}</h1>
              <p className="mt-1 text-sm text-navy-500">{t('auth.registerSub')}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={<User className="h-4 w-4" />} label={t('auth.fullName')} value={form.name} onChange={(v) => set('name', v)} required />
                <Field icon={<Mail className="h-4 w-4" />} label={t('auth.email')} type="email" value={form.email} onChange={(v) => set('email', v)} required />
                <Field icon={<Phone className="h-4 w-4" />} label={t('auth.phone')} value={form.phone} onChange={(v) => set('phone', v)} required placeholder="+92 300 1234567" />
                <Field icon={<CreditCard className="h-4 w-4" />} label={t('auth.cnic')} value={form.cnic} onChange={(v) => set('cnic', v)} required placeholder="XXXXX-XXXXXXX-X" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">{t('auth.city')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                    <select required value={form.city} onChange={(e) => set('city', e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400 focus:bg-white">
                      <option value="">{t('props.allCities')}</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <Field icon={<Lock className="h-4 w-4" />} label={t('auth.password')} type="password" value={form.password} onChange={(v) => set('password', v)} required />
              </div>

              <div className="rounded-xl bg-navy-50 p-3 text-xs text-navy-500">
                <Check className="inline h-3.5 w-3.5 text-emerald-500" /> Password must be 8+ characters with letters and numbers.
              </div>

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300 disabled:opacity-60">
                {loading ? t('common.loading') : t('auth.registerBtn')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-500">
              {t('auth.hasAccount')} <Link to="/login" className="font-semibold text-gold-600 hover:underline">{t('auth.login')}</Link>
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Field({ icon, label, type = 'text', value, onChange, required, placeholder }: {
  icon: React.ReactNode; label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">{icon}</span>
        <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400 focus:bg-white" />
      </div>
    </div>
  );
}
