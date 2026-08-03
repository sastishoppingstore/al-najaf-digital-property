import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="grid place-items-center px-4 py-32 text-center">
      <div className="enter-3d">
        <div className="float-3d font-serif text-7xl font-bold text-gold-400 sm:text-9xl">404</div>
        <p className="mt-4 text-lg font-semibold text-navy-800">{t('notfound.title')}</p>
        <p className="mt-1 text-sm text-navy-500">{t('notfound.subtitle')}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">
          <Home className="h-4 w-4" /> {t('notfound.back')}
        </Link>
      </div>
    </div>
  );
}
