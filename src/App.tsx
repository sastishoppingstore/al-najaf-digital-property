import { useEffect, useState } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { AppRoutes } from '@/routes';
import { ensureSuperAdmin } from '@/lib/dataService';
import { getSiteConfig } from '@/lib/siteConfig';
import { syncAll } from '@/lib/dbSync';
import { waLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        ensureSuperAdmin();
        await syncAll();
        ensureSuperAdmin();
      } catch { /* never block render */ }
      setReady(true);
    })();
  }, []);
  const cfg = getSiteConfig();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-gold-500" />
          <p className="text-sm font-medium text-navy-500">Loading Al Najaf Digital Property…</p>
        </div>
      </div>
    );
  }
  return (
    <LanguageProvider>
      <AppRoutes />
      <a
        href={waLink(cfg.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:bg-[#1ebe57] hover:scale-110 animate-bounce-slow"
        aria-label="Chat on WhatsApp"
        title="WhatsApp Chat"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </LanguageProvider>
  );
}

export default App;
