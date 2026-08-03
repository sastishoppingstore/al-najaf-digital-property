import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Clock, ExternalLink, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { getSiteConfig } from '@/lib/siteConfig';
import { getManagedFooter } from '@/lib/contentManager';
import { getBranches, waLink, telLink, localizedBranchLabel } from '@/lib/branchData';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

export function Footer() {
  const cfg = getSiteConfig();
  const { t, lang } = useLang();
  const footerData = getManagedFooter();
  const branches = getBranches();

  return (
    <footer className="bg-navy-800 text-navy-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gold-400">
                <img src={cfg.logo} alt={cfg.brand} className="h-full w-full object-cover" />
              </span>
              <div className="leading-tight">
                <div className="font-serif text-lg font-bold text-white">{cfg.brand}</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-gold-400">{cfg.tagline}</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-navy-200">{footerData.tagline}</p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg bg-navy-700 transition hover:bg-gold-400 hover:text-navy-800" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg bg-navy-700 transition hover:bg-gold-400 hover:text-navy-800" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg bg-navy-700 transition hover:bg-gold-400 hover:text-navy-800" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>

          {footerData.columns.map((col, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-white">{col.title}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((link, lidx) => (
                  <li key={lidx}><Link to={link.to} className="text-navy-200 hover:text-gold-400">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-semibold text-white">{t('footer.contact')}</h4>
            <div className="mt-3 space-y-2 text-sm">
              {footerData.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold-400" /> {footerData.phone}</p>}
              {footerData.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold-400" /> {footerData.email}</p>}
              {footerData.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gold-400" /> {footerData.address}</p>}
            </div>
          </div>
        </div>

        {/* Branches — 2x2 grid on mobile and desktop */}
        <div className="footer-branches mt-10">
          {branches.map((b, i) => (
            <div key={i} className="branch-card group rounded-xl border border-navy-700/70 bg-navy-900/40 p-4 transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)] hover:border-gold-400/40">
              <p className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-gold-400">{localizedBranchLabel(b.label || 'Branch', lang)}</span>
                {b.phone && <a href={telLink(b.phone)} className="text-sm font-medium text-navy-200 hover:text-gold-400">{b.phone}</a>}
              </p>
              {b.phone2 && (
                <p className="mt-0.5 flex items-center justify-end gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-gold-400" />
                  <a href={telLink(b.phone2)} className="text-sm font-medium text-navy-200 hover:text-gold-400">{b.phone2}</a>
                </p>
              )}
              {b.name && b.name !== 'Al Najaf Associates' && (
                <p className="mt-0.5 text-xs text-navy-300">{b.name}</p>
              )}
              {b.contactPerson && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-navy-200">
                  <User className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                  <span>{t('footer.contactPerson')}:</span> <span className="font-medium text-white">{b.contactPerson}</span>
                </p>
              )}
              {b.address ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-navy-300"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" /> {b.address}</p>
              ) : (
                <p className="mt-1 text-xs text-navy-400">{t('footer.addressPending')}</p>
              )}
              {b.whatsapp && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-300">
                  <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <a href={waLink(b.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-gold-400">{b.whatsapp}</a>
                  {b.whatsappName && <span className="text-navy-400">({b.whatsappName})</span>}
                </p>
              )}
              {b.hours && <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-300"><Clock className="h-3.5 w-3.5 shrink-0 text-gold-400" /> {b.hours}</p>}
              {b.maps && <a href={b.maps} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300"><ExternalLink className="h-3 w-3" /> {lang === 'ur' ? 'گوگل میپ' : 'Google Maps'}</a>}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-navy-700 pt-6 text-xs text-navy-300 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {cfg.fullName}. {t('footer.rights')}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gold-400">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-gold-400">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
