export const SITE_CONFIG = {
  brand: 'Al Najaf',
  tagline: 'Digital Property',
  fullName: 'Al Najaf Digital Property',
  phone: '0321 3216423',
  phoneDisplay: '0321 3216423',
  whatsapp: '923213216423',
  email: 'alnajafassociate.official@gmail.com',
  address: 'Thokar, Lahore, Pakistan',
  adminEmail: 'info@alnajafdigitalproperty.com',
};

function loadStr(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function getSiteConfig() {
  return {
    brand: loadStr('site_brand', SITE_CONFIG.brand),
    tagline: loadStr('site_tagline', SITE_CONFIG.tagline),
    fullName: loadStr('site_fullname', SITE_CONFIG.fullName),
    phone: loadStr('site_phone', SITE_CONFIG.phone),
    phoneDisplay: loadStr('site_phone_display', SITE_CONFIG.phoneDisplay),
    whatsapp: loadStr('site_whatsapp', SITE_CONFIG.whatsapp),
    email: loadStr('site_email', SITE_CONFIG.email),
    address: loadStr('site_address', SITE_CONFIG.address),
    adminEmail: loadStr('site_admin_email', SITE_CONFIG.adminEmail),
    logo: loadStr('site_logo', '/logo-square.png'),
    heroImage: loadStr('hero_promo_image', '/images/cv-cover.jpg'),
  };
}
