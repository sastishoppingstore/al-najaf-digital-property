import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, Phone, Languages, User, Search, LogOut, LayoutDashboard } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { getSession, getCurrentUser, logoutUser } from '@/lib/dataService';
import { getSiteConfig } from '@/lib/siteConfig';
import { getManagedNavbar } from '@/lib/contentManager';
import { dbLogout, isDbMode } from '@/lib/dbSync';

export function Navbar() {
  const cfg = getSiteConfig();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const user = session ? getCurrentUser() : null;

  useEffect(() => { setSession(getSession()); }, []);

  const handleLogout = async () => {
    if (isDbMode()) {
      const s = getSession();
      if (s) await dbLogout((s as any).token || '');
    }
    logoutUser(); setSession(null); navigate('/');
  };

  const links = getManagedNavbar();

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-navy-700 transition-transform duration-300 group-hover:rotate-[8deg] group-hover:scale-110">
            <img src={cfg.logo} alt={cfg.brand} className="h-full w-full object-cover" />
          </span>
          <div className="leading-tight">
            <div className="font-serif text-lg font-bold text-navy-800">{cfg.brand}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-gold-600">{cfg.tagline}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-navy-50 text-navy-800' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-800'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-100 px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4 text-gold-500" />
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
          <a href={`tel:${cfg.phone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800">
            <Phone className="h-4 w-4 text-gold-500" /> {cfg.phone}
          </a>
          {session && user ? (
            <>
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
                <LayoutDashboard className="h-4 w-4" /> {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> {t('nav.logout')}
              </button>
            </>  
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
              <User className="h-4 w-4" /> {t('nav.login')}
            </Link>
          )}
          <Link to="/post-ad" className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 transition hover:bg-gold-300 hover:shadow-gold">
            {t('nav.postAd')}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-navy-100 text-navy-700"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4 text-gold-500" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-lg text-navy-700" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-navy-50 text-navy-800' : 'text-navy-600'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {session && user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600">
                <LayoutDashboard className="inline h-4 w-4 mr-1" /> Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600">
                <LogOut className="inline h-4 w-4 mr-1" /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600">
              {t('nav.login')}
            </Link>
          )}
          <Link to="/post-ad" onClick={() => setOpen(false)} className="mt-2 block rounded-xl bg-gold-400 px-4 py-2 text-center text-sm font-semibold text-navy-800">
            {t('nav.postAd')}
          </Link>
        </div>
      )}
    </header>
  );
}
