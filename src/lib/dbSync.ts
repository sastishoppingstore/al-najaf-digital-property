import { notifyData } from '@/lib/dataService';

const API_URL = new URL('api/index.php', window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') + '/').href;

async function api(data: Record<string, unknown>): Promise<Record<string, any>> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return await res.json();
  } catch {
    return { success: false, error: 'network' };
  }
}

export function isDbMode(): boolean {
  return localStorage.getItem('db_mode') === '1';
}

export function setDbMode(on: boolean) {
  localStorage.setItem('db_mode', on ? '1' : '0');
}

export async function syncAll() {
  try {
    const testRes = await api({ action: 'get-properties' });
    if (!testRes || testRes.success === false) {
      setDbMode(false);
      return { success: false, error: 'Database API unavailable' };
    }
    setDbMode(true);
    const [users, overrides, inquiries, orders, cities, towns, cats, subs, navbar, footer, services, lawyers, config, texts, properties, emailLogs] = await Promise.all([
      api({ action: 'get-users' }),
    api({ action: 'get-all-overrides' }),
    api({ action: 'get-inquiries' }),
    api({ action: 'get-orders' }),
    api({ action: 'get-cities' }),
    api({ action: 'get-towns' }),
    api({ action: 'get-categories' }),
    api({ action: 'get-sub-categories' }),
    api({ action: 'get-navbar' }),
    api({ action: 'get-footer' }),
    api({ action: 'get-services' }),
    api({ action: 'get-lawyers' }),
    api({ action: 'get-site-config' }),
    api({ action: 'get-page-texts' }),
    api({ action: 'get-properties' }),
    api({ action: 'get-email-logs' }),
  ]);

  if (users.success) localStorage.setItem('data_users', JSON.stringify(users.users));
  if (overrides.success) localStorage.setItem('prop_overrides', JSON.stringify(overrides.overrides));
  if (inquiries.success) localStorage.setItem('data_inquiries', JSON.stringify(inquiries.inquiries));
  if (orders.success) {
    const mapped = (orders.orders || []).map((o: any) => ({
      id: o.id, userId: o.user_id || '', orderRef: o.order_ref, orderType: o.order_type,
      orderDate: o.order_date, orderAmount: o.order_amount, status: o.status || 'Pending',
      name: o.name, email: o.email, phone: o.phone, notes: o.notes, createdAt: o.created_at,
    }));
    localStorage.setItem('data_orders', JSON.stringify(mapped));
  }
  if (cities.success) localStorage.setItem('mgr_cities', JSON.stringify(cities.cities));
  if (towns.success) localStorage.setItem('mgr_towns', JSON.stringify(towns.towns));
  if (cats.success) localStorage.setItem('mgr_categories', JSON.stringify(cats.categories));
  if (subs.success) localStorage.setItem('mgr_sub_categories', JSON.stringify(subs.subCategories));
  if (navbar.success) localStorage.setItem('mgr_navbar', JSON.stringify(navbar.links));
  if (footer.success) localStorage.setItem('mgr_footer', JSON.stringify(footer.footer));
  if (services.success) localStorage.setItem('mgr_services', JSON.stringify(services.services));
  if (lawyers.success) localStorage.setItem('mgr_lawyers', JSON.stringify(lawyers.lawyers));
  if (config.success) localStorage.setItem('site_config_db', JSON.stringify(config.config));
  if (texts.success) localStorage.setItem('page_texts_db', JSON.stringify(texts.texts));

  // Sync DB properties into localStorage cache (DB is the single source of truth).
  if (properties.success && Array.isArray(properties.properties)) {
    const dbProps = (properties.properties || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: Number(p.price) || 0,
      priceType: p.price_type || 'fixed',
      purpose: p.purpose || 'sale',
      category: p.category_id || 'houses',
      subCategory: p.sub_category_id || '',
      city: p.city || '',
      area: p.area || '',
      lat: Number(p.lat) || 0,
      lng: Number(p.lng) || 0,
      size: p.size || '',
      bedrooms: Number(p.bedrooms) || 0,
      bathrooms: Number(p.bathrooms) || 0,
      furnished: !!p.furnished,
      verified: !!p.verified,
      featured: !!p.featured,
      postedAt: p.created_at ? p.created_at.split(' ')[0] : '',
      images: p.images || [],
      seller: {
        name: p.seller_name || 'Owner',
        type: p.seller_type || 'Owner',
        phone: p.seller_phone || '',
        whatsapp: p.seller_whatsapp || p.seller_phone || '',
      },
      status: p.status || 'pending',
      createdAt: p.created_at || '',
      source: 'db',
    }));
    localStorage.setItem('data_custom_properties', JSON.stringify(dbProps));
  }

  // Sync DB email logs into localStorage
  if (emailLogs.success && Array.isArray(emailLogs.logs)) {
    const dbLogs = (emailLogs.logs || []).map((l: any) => ({
      id: `dbe_${l.id}`,
      recipient: l.recipient || '',
      subject: l.subject || '',
      message: l.error || '',
      type: l.template || 'general',
      status: l.status === 'sent' ? 'sent' : 'failed',
      sent_at: l.sent_at || '',
    }));
    const existing = JSON.parse(localStorage.getItem('data_email_logs') || '[]');
    const dbIds = new Set(dbLogs.map((l: any) => l.id));
    const merged = [...dbLogs, ...existing.filter((l: any) => !dbIds.has(l.id))];
    localStorage.setItem('data_email_logs', JSON.stringify(merged));
  }

  notifyData();

    return { success: true };
  } catch {
    setDbMode(false);
    notifyData();
    return { success: false, mode: 'local' };
  }
}

export async function dbLogin(email: string, password: string) {
  const res = await api({ action: 'login', email, password });
  if (res.success) {
    localStorage.setItem('data_session', JSON.stringify(res.session));
  }
  return res;
}

export async function dbRegister(data: Record<string, string>) {
  const res = await api({ action: 'register', ...data });
  if (res.success) {
    localStorage.setItem('data_session', JSON.stringify({ userId: res.user.id, email: res.user.email, name: res.user.name }));
  }
  return res;
}

export async function dbLogout(token: string) {
  await api({ action: 'logout', token });
  localStorage.removeItem('data_session');
}

export async function dbGetSession(token: string) {
  const res = await api({ action: 'get-session', token });
  return res;
}
