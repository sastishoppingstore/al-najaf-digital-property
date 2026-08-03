import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Building2, RefreshCw, Check } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { getCurrentUser } from '@/lib/dataService';

export function VerifyOtpPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = getCurrentUser();
    if (user) {
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="scene-3d grid min-h-[calc(100vh-4rem)] place-items-center bg-navy-50/40 px-4 py-12">
      <Reveal variant="scale">
        <div className="w-full max-w-md">
          <div className="tilt-3d rounded-3xl border border-navy-100 bg-white p-8 shadow-card-hover">
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-400 text-navy-800">
                <Building2 className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{t('auth.otpTitle')}</h1>
              <p className="mt-1 text-sm text-navy-500">{t('auth.otpSub')}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex justify-center gap-2" dir="ltr">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-12 rounded-xl border-2 border-navy-100 bg-navy-50/40 text-center text-2xl font-bold text-navy-800 outline-none focus:border-gold-400 focus:bg-white"
                  />
                ))}
              </div>

              <button type="submit" disabled={loading || digits.some((d) => !d)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300 disabled:opacity-60">
                {loading ? t('common.loading') : t('auth.verifyBtn')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-navy-400">Resend available in {resendTimer}s</p>
              ) : (
                <button onClick={() => setResendTimer(60)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline">
                  <RefreshCw className="h-3.5 w-3.5" /> {t('auth.resendOtp')}
                </button>
              )}
              <p className="mt-3 text-sm text-navy-500">
                <Link to="/login" className="font-medium text-navy-600 hover:underline">{t('auth.backToLogin')}</Link>
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
