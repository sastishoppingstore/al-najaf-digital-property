import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';

export function ForgotPasswordPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate('/login'), 800);
  };

  return (
    <div className="scene-3d grid min-h-[calc(100vh-4rem)] place-items-center bg-navy-50/40 px-4 py-12">
      <Reveal variant="scale">
        <div className="w-full max-w-md">
          <div className="tilt-3d rounded-3xl border border-navy-100 bg-white p-8 shadow-card-hover">
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy-700 text-gold-400">
                <Building2 className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('auth.forgotTitle')}</h1>
              <p className="mt-1 text-sm text-navy-500">{t('auth.forgotSub')}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold-400 focus:bg-white" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300 disabled:opacity-60">
                {loading ? t('common.loading') : t('auth.sendOtp')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-navy-500">
              {t('auth.rememberForgot')} <Link to="/login" className="font-semibold text-gold-600 hover:underline">{t('auth.login')}</Link>
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
