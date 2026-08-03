import { useSyncExternalStore } from 'react';

const API_URL = new URL('api/index.php', window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') + '/').href;

async function apiPost(data: Record<string, unknown>) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return await res.json();
  } catch { return { success: false, error: 'network' }; }
}

function isDb(): boolean { return localStorage.getItem('db_mode') === '1'; }

const KEYS = {
  USERS: 'data_users',
  SESSION: 'data_session',
  FAVORITES: (uid: string) => `data_fav_${uid}`,
  INQUIRIES: 'data_inquiries',
  ORDERS: 'data_orders',
  CUSTOM_PROPS: 'data_custom_properties',
};

function loadJSON<T>(key: string): T | null {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; }
}
function saveJSON(key: string, data: unknown) { localStorage.setItem(key, JSON.stringify(data)); }

// Lightweight pub/sub so pages re-render once DB data finishes syncing.
let dataVersion = 0;
const listeners = new Set<() => void>();
export function subscribeData(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function getDataVersion() { return dataVersion; }
export function notifyData() { dataVersion++; listeners.forEach((fn) => fn()); }

// React hook: re-renders the component whenever DB data finishes syncing.
export function useDataVersion() {
  return useSyncExternalStore(subscribeData, getDataVersion, getDataVersion);
}

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  city: string;
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'owner' | 'user';
  createdAt: string;
};

export const ROLES = {
  super_admin: { label: 'Super Admin', level: 100 },
  admin: { label: 'Admin', level: 80 },
  manager: { label: 'Manager', level: 60 },
  owner: { label: 'Owner', level: 40 },
  user: { label: 'User', level: 20 },
} as const;

export function hasRole(user: User | null, requiredLevel: number): boolean {
  if (!user) return false;
  const roleLevel = ROLES[user.role]?.level || 0;
  return roleLevel >= requiredLevel;
}

export function ensureSuperAdmin() {
  const users = getUsers();
  const current = users.find(u => u.email === 'info@alnajafdigitalproperty.com');
  if (current) {
    let changed = false;
    if (current.password !== 'Wafa@1122') { current.password = 'Wafa@1122'; changed = true; }
    if (current.role !== 'super_admin') { current.role = 'super_admin'; changed = true; }
    if (current.name !== 'Super Admin') { current.name = 'Super Admin'; changed = true; }
    if (changed) saveUsers(users);
    return;
  }
  const legacy = users.find(u => u.role === 'super_admin' || u.role === 'admin');
  if (legacy) {
    legacy.email = 'info@alnajafdigitalproperty.com';
    legacy.password = 'Wafa@1122';
    legacy.role = 'super_admin';
    legacy.name = 'Super Admin';
    legacy.phone = '+923213216423';
    saveUsers(users);
    return;
  }
  const superAdmin: User = {
    id: 'superadmin',
    name: 'Super Admin',
    email: 'info@alnajafdigitalproperty.com',
    phone: '+923213216423',
    cnic: '00000-0000000-0',
    city: 'Lahore',
    password: 'Wafa@1122',
    role: 'super_admin',
    createdAt: new Date().toISOString(),
  };
  users.push(superAdmin);
  saveUsers(users);
}

export function updateUserRole(userId: string, role: User['role']): boolean {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) { users[idx].role = role; saveUsers(users); }
  if (isDb()) apiPost({ action: 'update-user-role', id: userId, role });
  return idx >= 0;
}

export function getAllUsers(): User[] { return getUsers(); }

export function deleteUser(userId: string): boolean {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
  if (isDb()) apiPost({ action: 'delete-user', id: userId });
  return true;
}

export type Inquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type CustomProperty = {
  id: string;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'negotiable' | 'on-call';
  purpose: 'sale' | 'rent' | 'requirement';
  category: string;
  subCategory: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  size: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  verified: boolean;
  featured: boolean;
  postedAt: string;
  images: string[];
  seller: {
    name: string;
    type: 'Owner' | 'Agent' | 'Dealer';
    phone: string;
    whatsapp: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  source?: string;
};

export function getUsers(): User[] {
  return loadJSON<User[]>(KEYS.USERS) || [];
}
export function saveUsers(users: User[]) { saveJSON(KEYS.USERS, users); }

export function registerUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const existing = users.find(u => u.email === user.email);
  if (existing) throw new Error('Email already registered');
  const newUser: User = { ...user, id: `u${Date.now()}`, createdAt: new Date().toISOString() };
  users.push(newUser);
  saveUsers(users);
  saveJSON(KEYS.SESSION, { userId: newUser.id, email: newUser.email, name: newUser.name });
  if (isDb()) apiPost({ action: 'register', ...user, password: user.password });
  return newUser;
}

export function loginUser(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    saveJSON(KEYS.SESSION, { userId: user.id, email: user.email, name: user.name });
  }
  return user || null;
}

export function logoutUser() { localStorage.removeItem(KEYS.SESSION); }

export function getSession(): { userId: string; email: string; name: string } | null {
  return loadJSON(KEYS.SESSION);
}

export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find(u => u.id === session.userId) || null;
}

export function getFavorites(uid: string): string[] {
  return loadJSON<string[]>(KEYS.FAVORITES(uid)) || [];
}
export function toggleFavorite(uid: string, propertyId: string): string[] {
  const favs = getFavorites(uid);
  const idx = favs.indexOf(propertyId);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(propertyId);
  saveJSON(KEYS.FAVORITES(uid), favs);
  return favs;
}
export function isFavorite(uid: string, propertyId: string): boolean {
  return getFavorites(uid).includes(propertyId);
}

export function getInquiries(): Inquiry[] {
  return loadJSON<Inquiry[]>(KEYS.INQUIRIES) || [];
}
export function addInquiry(inq: Omit<Inquiry, 'id' | 'createdAt' | 'read'>): Inquiry {
  const inquiries = getInquiries();
  const newInq: Inquiry = { ...inq, id: `inq${Date.now()}`, createdAt: new Date().toISOString(), read: false };
  inquiries.unshift(newInq);
  saveJSON(KEYS.INQUIRIES, inquiries);
  if (isDb()) apiPost({ action: 'add-inquiry', propertyId: inq.propertyId, propertyTitle: inq.propertyTitle, name: inq.name, email: inq.email, phone: inq.phone, message: inq.message });
  return newInq;
}
export function markInquiryRead(id: string) {
  const inquiries = getInquiries();
  const inq = inquiries.find(i => i.id === id);
  if (inq) { inq.read = true; saveJSON(KEYS.INQUIRIES, inquiries); }
  if (isDb()) apiPost({ action: 'mark-inquiry-read', id });
}

export function getMyInquiries(uid: string): Inquiry[] {
  return getInquiries().filter(i => !i.userId || i.userId === uid);
}

export type Order = {
  id: string;
  userId: string;
  orderRef: string;
  orderType: string;
  orderDate: string;
  orderAmount: string;
  status: 'Under Review' | 'Completed' | 'Confirmed' | 'Approved' | 'Processing' | 'Pending' | 'Cancelled';
  name: string;
  email: string;
  phone: string;
  notes?: string;
  createdAt: string;
};

export function getOrders(): Order[] {
  return loadJSON<Order[]>(KEYS.ORDERS) || [];
}
export function getMyOrders(uid: string): Order[] {
  return getOrders().filter(o => o.userId === uid);
}
export function addOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
  const orders = getOrders();
  const newOrder: Order = { ...order, id: `ord${Date.now()}`, createdAt: new Date().toISOString() };
  orders.unshift(newOrder);
  saveJSON(KEYS.ORDERS, orders);
  if (isDb()) apiPost({ action: 'add-order', userId: order.userId, orderRef: order.orderRef, orderType: order.orderType, orderDate: order.orderDate, orderAmount: order.orderAmount, status: order.status, name: order.name, email: order.email, phone: order.phone, notes: order.notes || '' });
  return newOrder;
}
export function updateOrderStatus(id: string, status: Order['status']) {
  const orders = getOrders();
  const o = orders.find(x => x.id === id);
  if (o) { o.status = status; saveJSON(KEYS.ORDERS, orders); }
  if (isDb()) apiPost({ action: 'update-order-status', id, status });
}

export function getCustomProperties(): CustomProperty[] {
  const v = loadJSON<CustomProperty[]>(KEYS.CUSTOM_PROPS);
  return Array.isArray(v) ? v : [];
}
export function addCustomProperty(cp: Omit<CustomProperty, 'id' | 'createdAt'>): CustomProperty {
  const props = getCustomProperties();
  const newProp: CustomProperty = { ...cp, id: `cp${Date.now()}`, createdAt: new Date().toISOString() };
  props.push(newProp);
  saveJSON(KEYS.CUSTOM_PROPS, props);
  notifyData();
  apiPost({ action: 'add-property', ...cp, id: newProp.id, images: cp.images || [], categoryId: cp.category || 'houses', subCategoryId: cp.subCategory || '', sellerName: cp.seller.name, sellerType: cp.seller.type, sellerPhone: cp.seller.phone, sellerWhatsapp: cp.seller.whatsapp || '' });
  return newProp;
}
export function updateCustomProperty(id: string, data: Partial<CustomProperty>) {
  const props = getCustomProperties();
  const idx = props.findIndex(p => p.id === id);
  if (idx >= 0) { props[idx] = { ...props[idx], ...data }; saveJSON(KEYS.CUSTOM_PROPS, props); }
  notifyData();
  apiPost({ action: 'update-property', id, ...data, categoryId: (data.category || props[idx]?.category) || 'houses', subCategoryId: (data.subCategory || props[idx]?.subCategory) || '', sellerName: (data.seller?.name || props[idx]?.seller?.name) || '', sellerType: (data.seller?.type || props[idx]?.seller?.type) || 'Owner', sellerPhone: (data.seller?.phone || props[idx]?.seller?.phone) || '', sellerWhatsapp: (data.seller?.whatsapp || props[idx]?.seller?.whatsapp) || '' });
}
export function deleteCustomProperty(id: string) {
  const props = getCustomProperties().filter(p => p.id !== id);
  saveJSON(KEYS.CUSTOM_PROPS, props);
  notifyData();
  apiPost({ action: 'delete-property', id });
}
export function approveCustomProperty(id: string) {
  updateCustomProperty(id, { status: 'approved' });
  apiPost({ action: 'save-override', propertyId: id, status: 'approved' });
}
export function rejectCustomProperty(id: string) {
  updateCustomProperty(id, { status: 'rejected' });
  apiPost({ action: 'save-override', propertyId: id, status: 'rejected' });
}

type PropOverride = {
  verified?: boolean;
  featured?: boolean;
  premium?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
};
export function getPropOverride(id: string): PropOverride {
  try {
    const all = JSON.parse(localStorage.getItem('prop_overrides') || '{}');
    return all[id] || {};
  } catch { return {}; }
}
export function setPropOverride(id: string, overrides: PropOverride) {
  try {
    const all = JSON.parse(localStorage.getItem('prop_overrides') || '{}');
    all[id] = { ...(all[id] || {}), ...overrides };
    localStorage.setItem('prop_overrides', JSON.stringify(all));
  } catch { /* */ }
  notifyData();
  apiPost({ action: 'save-override', propertyId: id, ...overrides });
}
export function togglePropBadge(id: string, badge: 'verified' | 'featured' | 'premium' | 'status') {
  const current = getPropOverride(id);
  if (badge === 'status') {
    const next = current.status === 'approved' ? 'rejected' : current.status === 'rejected' ? 'pending' : 'approved';
    setPropOverride(id, { status: next });
  } else {
    setPropOverride(id, { [badge]: !current[badge] });
  }
}
import { PROPERTIES } from '@/data/mock';

export function getAllProperties(): any[] {
  try {
    const custom = getCustomProperties().map(cp => {
    const ov = getPropOverride(cp.id);
    const status = ov.status ?? cp.status ?? 'pending';
    const verified = ov.verified ?? cp.verified ?? false;
    const featured = ov.featured ?? cp.featured ?? false;
    return {
      id: cp.id,
      title: cp.title,
      description: cp.description,
      price: cp.price,
      priceType: cp.priceType || 'fixed',
      purpose: cp.purpose || 'sale',
      category: cp.category || 'houses',
      subCategory: cp.subCategory || 'house',
      city: cp.city || 'Lahore',
      area: cp.area || 'DHA',
      lat: cp.lat || 31.5204,
      lng: cp.lng || 74.3587,
      size: cp.size || '5 Marla',
      bedrooms: cp.bedrooms || 0,
      bathrooms: cp.bathrooms || 0,
      furnished: cp.furnished || false,
      verified,
      featured,
      postedAt: cp.postedAt || cp.createdAt || new Date().toISOString(),
      images: cp.images && cp.images.length > 0 ? cp.images : ['/images/placeholder.jpg'],
      seller: {
        name: cp.seller?.name || 'Owner',
        type: cp.seller?.type || 'Owner',
        phone: cp.seller?.phone || '0321 3216423',
        whatsapp: cp.seller?.whatsapp || cp.seller?.phone || '923213216423',
        rating: 4.9,
        responseRate: '100%',
        listingsCount: 1,
        premium: ov.premium ?? false,
      },
      status,
      source: cp.source || 'custom',
    };
  });

  // DB is the single source of truth: after seeding, the DB cache holds the full
  // catalog. Only fall back to the built-in mock list when DB is unreachable and
  // the cache is empty, so the site is never blank.
  if (custom.length > 0) return custom;

  const mock = PROPERTIES.map(p => {
    const ov = getPropOverride(p.id);
    const status = ov.status ?? (p.verified ? 'approved' : 'approved');
    const verified = ov.verified ?? p.verified;
    const featured = ov.featured ?? p.featured ?? false;
    return {
      ...p,
      verified,
      featured,
      status,
      seller: {
        ...p.seller,
        premium: ov.premium ?? p.seller?.premium ?? false,
      },
      source: 'mock',
    };
  });

  return mock;
  } catch {
    return PROPERTIES;
  }
}

export function getApprovedProperties(): any[] {
  return getAllProperties().filter(p => p.status === 'approved');
}

export async function syncDb() {
  if (!isDb()) return { success: false };
  const { syncAll } = await import('@/lib/dbSync');
  return syncAll();
}

