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

function loadJSON<T>(key: string, fallback: T): T {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}
function saveJSON(key: string, data: unknown) { localStorage.setItem(key, JSON.stringify(data)); }

const KEYS = {
  STAMP_TYPES: 'admin_stamp_types',
  ESTAMP_FEES: 'admin_estamp_fees',
  SERVICES: 'admin_services',
  LAWYERS: 'admin_lawyers',
  LEGAL_DOCS: 'admin_legal_docs',
  FOOTER: 'admin_footer',
  NAVBAR: 'admin_navbar',
  CITIES: 'admin_cities',
  TOWNS: 'admin_towns',
  CATEGORIES: 'admin_categories',
  SUB_CATEGORIES: 'admin_sub_categories',
  PAGE_TEXT: 'admin_page_text',
};

export type StampType = {
  id: string; name: string; description: string; minValue: number; maxValue: number;
  category: string; govRate: number; source: string;
};
export type EditableService = {
  id: string; name: string; shortName: string; description: string; fee: string;
  duration: string; icon: string; image: string; category: string;
};
export type EditableLawyer = {
  id: string; name: string; designation: string; specializations: string[];
  experience: number; rating: number; reviews: number; fee: number; city: string;
  image: string; barCouncil: string; education: string; bio: string;
};
export type EditableLegalDoc = {
  id: string; title: string; description: string; category: string; fee: string;
  duration: string; icon: string; image: string;
};
export type NavbarLink = { to: string; label: string };
export type FooterContent = {
  tagline: string; email: string; phone: string; address: string;
  columns: { title: string; links: { label: string; to: string }[] }[];
};

export const DEFAULT_STAMP_TYPES: StampType[] = [
  { id: 'judicial', name: 'Judicial Stamp Paper', description: 'Court fee stamps for legal proceedings', minValue: 100, maxValue: 1200, category: 'judicial', govRate: 10, source: 'FBR / Courts' },
  { id: 'non-judicial', name: 'Non-Judicial Stamp', description: 'Non-judicial stamp papers for agreements', minValue: 100, maxValue: 1200, category: 'non-judicial', govRate: 10, source: 'FBR' },
  { id: 'agreement', name: 'Agreement Stamp', description: 'Stocks for property sale/rent agreements', minValue: 100, maxValue: 1200, category: 'agreement', govRate: 10, source: 'RD & MR' },
  { id: 'affidavit', name: 'Affidavit Stamp', description: 'Stamps for sworn affidavits and declarations', minValue: 100, maxValue: 1200, category: 'affidavit', govRate: 10, source: 'Courts' },
  { id: 'indemnity', name: 'Indemnity Bond Stamp', description: 'Stamps for indemnity and surety bonds', minValue: 100, maxValue: 1200, category: 'bond', govRate: 10, source: 'FBR' },
  { id: 'power-attorney', name: 'Power of Attorney Stamp', description: 'Stamps for power of attorney documents', minValue: 100, maxValue: 1200, category: 'poa', govRate: 10, source: 'RD & MR' },
  { id: 'gift-deed', name: 'Gift Deed Stamp', description: 'Stamps for gift deed transactions', minValue: 100, maxValue: 1200, category: 'deed', govRate: 10, source: 'RD & MR' },
  { id: 'relinquishment', name: 'Relinquishment Stamp', description: 'Stamps for relinquishment deeds', minValue: 100, maxValue: 1200, category: 'deed', govRate: 10, source: 'Revenue Dept' },
];

export const DEFAULT_SERVICES: EditableService[] = [
  { id: 'lawyer', name: 'Lawyer / Legal Services', shortName: 'Lawyer', description: 'Consult verified lawyers for property, civil, criminal, family and corporate cases.', fee: 'From PKR 2,000', duration: '1-3 days', icon: 'Scale', image: '/images/svc-lawyer.jpg?v=2', category: 'legal' },
  { id: 'estamp', name: 'E-Stamp', shortName: 'E-Stamp', description: 'Apply for e-stamp papers with live selfie verification.', fee: 'From PKR 500', duration: '3-5 days', icon: 'Stamp', image: '/images/svc-estamp.jpg?v=2', category: 'legal' },
  { id: 'land-registration', name: 'Land Registration', shortName: 'Registration', description: 'Register your land with full documentation support.', fee: 'From PKR 5,000', duration: '7-14 days', icon: 'FileText', image: '/images/svc-land-registration.jpg?v=2', category: 'legal' },
  { id: 'intiqal', name: 'Intiqal (Mutation)', shortName: 'Intiqal', description: 'Transfer property ownership through mutation records.', fee: 'From PKR 3,000', duration: '7-10 days', icon: 'ArrowLeftRight', image: '/images/svc-intiqal.jpg?v=2', category: 'legal' },
  { id: 'kiraya-nama', name: 'Kiraya Nama (Rent Agreement)', shortName: 'Kiraya Nama', description: 'Draft and register rent agreements with legal validity.', fee: 'From PKR 1,500', duration: '1-2 days', icon: 'FileSignature', image: '/images/svc-kiraya-nama.jpg?v=2', category: 'legal' },
  { id: 'gas-meter', name: 'Gas Meter Transfer', shortName: 'Gas Meter', description: 'Transfer gas meter connection to new owner.', fee: 'From PKR 1,000', duration: '3-5 days', icon: 'Flame', image: '/images/svc-gas-meter.jpg?v=2', category: 'utility' },
  { id: 'electricity-meter', name: 'Electricity Meter Transfer', shortName: 'Electricity', description: 'Transfer electricity meter to new owner name.', fee: 'From PKR 1,000', duration: '3-5 days', icon: 'Zap', image: '/images/svc-electricity-meter.jpg?v=2', category: 'utility' },
  { id: 'water-meter', name: 'Water Meter Transfer', shortName: 'Water', description: 'Transfer water connection and meter ownership.', fee: 'From PKR 800', duration: '2-4 days', icon: 'Droplets', image: '/images/svc-water-meter.jpg?v=2', category: 'utility' },
  { id: 'valuation', name: 'Property Valuation', shortName: 'Valuation', description: 'Get certified property valuation reports.', fee: 'From PKR 3,000', duration: '2-3 days', icon: 'Calculator', image: '/images/svc-valuation.jpg?v=2', category: 'valuation' },
  { id: 'attestation', name: 'Document Attestation', shortName: 'Attestation', description: 'Attest your legal documents officially.', fee: 'From PKR 500', duration: '1-2 days', icon: 'BadgeCheck', image: '/images/svc-attestation.jpg?v=2', category: 'legal' },
];

export const DEFAULT_STAMP_FEES = { online: 150, offline: 300 };

export function getStampTypes(): StampType[] {
  return loadJSON(KEYS.STAMP_TYPES, DEFAULT_STAMP_TYPES);
}
export function saveStampTypes(data: StampType[]) { saveJSON(KEYS.STAMP_TYPES, data); if (isDb()) apiPost({ action: 'save-stamp-types', stampTypes: data }); }
export function getStampFees() { return loadJSON(KEYS.ESTAMP_FEES, DEFAULT_STAMP_FEES); }
export function saveStampFees(data: typeof DEFAULT_STAMP_FEES) { saveJSON(KEYS.ESTAMP_FEES, data); }

export function getManagedServices(): EditableService[] {
  return loadJSON(KEYS.SERVICES, DEFAULT_SERVICES);
}
export function saveManagedServices(data: EditableService[]) { saveJSON(KEYS.SERVICES, data); if (isDb()) apiPost({ action: 'save-services', services: data }); }

export function getManagedLawyers(): EditableLawyer[] {
  return loadJSON(KEYS.LAWYERS, []);
}
export function saveManagedLawyers(data: EditableLawyer[]) { saveJSON(KEYS.LAWYERS, data); if (isDb()) apiPost({ action: 'save-lawyers', lawyers: data }); }

export function getManagedLegalDocs(): EditableLegalDoc[] {
  return loadJSON(KEYS.LEGAL_DOCS, []);
}
export function saveManagedLegalDocs(data: EditableLegalDoc[]) { saveJSON(KEYS.LEGAL_DOCS, data); }

export const DEFAULT_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export type ManagedCategory = { id: string; name: string; icon: string; description: string; image: string; count: number };

export const DEFAULT_CATEGORIES: ManagedCategory[] = [
  { id: 'houses', name: 'Houses', icon: 'House', description: 'Built houses for sale or rent', image: '/images/cat-houses.jpg', count: 20 },
  { id: 'flats', name: 'Flats & Apartments', icon: 'Building', description: 'Apartments and flats for sale or rent', image: '/images/cat-flats.jpg', count: 20 },
  { id: 'plots', name: 'Plots & Land', icon: 'Square', description: 'Residential and commercial plots', image: '/images/cat-plots.jpg', count: 15 },
  { id: 'commercial', name: 'Commercial', icon: 'Building2', description: 'Shops, offices, buildings', image: '/images/cat-commercial.jpg', count: 10 },
];

export type ManagedSubCategory = { id: string; label: string; categoryId: string };

export const DEFAULT_SUB_CATEGORIES: ManagedSubCategory[] = [
  { id: 'house', label: 'House', categoryId: 'houses' },
  { id: 'upper-portion', label: 'Upper Portion', categoryId: 'houses' },
  { id: 'lower-portion', label: 'Lower Portion', categoryId: 'houses' },
  { id: 'farm-house', label: 'Farm House', categoryId: 'houses' },
  { id: 'room', label: 'Room', categoryId: 'houses' },
  { id: 'flat', label: 'Flat', categoryId: 'flats' },
  { id: 'penthouse', label: 'Penthouse', categoryId: 'flats' },
  { id: 'serviced-apartment', label: 'Serviced Apartment', categoryId: 'flats' },
  { id: 'residential-plot', label: 'Residential Plot', categoryId: 'plots' },
  { id: 'commercial-plot', label: 'Commercial Plot', categoryId: 'plots' },
  { id: 'agricultural-land', label: 'Agricultural Land', categoryId: 'plots' },
  { id: 'industrial-land', label: 'Industrial Land', categoryId: 'plots' },
  { id: 'office', label: 'Office', categoryId: 'commercial' },
  { id: 'shop', label: 'Shop', categoryId: 'commercial' },
  { id: 'warehouse', label: 'Warehouse', categoryId: 'commercial' },
  { id: 'factory', label: 'Factory', categoryId: 'commercial' },
  { id: 'building', label: 'Building', categoryId: 'commercial' },
  { id: 'showroom', label: 'Showroom', categoryId: 'commercial' },
];

export const DEFAULT_TOWNS = [
  'DHA Defence', 'Bahria Town', 'Gulberg', 'Johar Town', 'LDA Avenue',
  'Clifton', 'Gulshan-e-Iqbal Town', 'Naya Nazimabad', 'Cantt',
  'B-17', 'F-8', 'H-13', 'I-14', 'I-15',
  'Raiwind Road', 'Saddar', 'Wapda City', 'Bahria Orchard',
  'University Road', 'Rashid Minhas Road', 'Main Canal Bank Road',
  'Navy Housing Scheme Karsaz', 'Lake City',
];

export const DEFAULT_NAVBAR_LINKS: NavbarLink[] = [
  { to: '/', label: 'Home' },
  { to: '/properties', label: 'Properties' },
  { to: '/capital-valley', label: 'Capital Valley' },
  { to: '/services', label: 'Services' },
  { to: '/lawyers', label: 'Lawyers' },
  { to: '/legal', label: 'Legal Docs' },
  { to: '/search', label: 'Search' },
  { to: '/fard', label: 'Fard' },
  { to: '/branches', label: 'Our Branches' },
];

export const DEFAULT_FOOTER: FooterContent = {
  tagline: 'Property aur Qanooni Khidmatain — Sab Ek Jagah.',
  email: 'alnajafassociate.official@gmail.com',
  phone: '0321 3216423',
  address: 'Thokar, Lahore, Pakistan',
  columns: [
    { title: 'Properties', links: [{ label: 'For Sale', to: '/properties?purpose=sale' }, { label: 'For Rent', to: '/properties?purpose=rent' }, { label: 'Plots', to: '/properties?category=plots' }, { label: 'Houses', to: '/properties?category=houses' }] },
    { title: 'Services', links: [{ label: 'E-Stamp', to: '/estamp' }, { label: 'Lawyers', to: '/lawyers' }, { label: 'Land Registration', to: '/services/land-registration' }, { label: 'All Services', to: '/services' }] },
  ],
};

export function getManagedCities(): string[] { return loadJSON(KEYS.CITIES, DEFAULT_CITIES); }
export function saveManagedCities(data: string[]) { saveJSON(KEYS.CITIES, data); if (isDb()) apiPost({ action: 'save-cities', cities: data }); }
export function getManagedTowns(): string[] { return loadJSON(KEYS.TOWNS, DEFAULT_TOWNS); }
export function saveManagedTowns(data: string[]) { saveJSON(KEYS.TOWNS, data); if (isDb()) apiPost({ action: 'save-towns', towns: data }); }
export function getManagedCategories(): ManagedCategory[] { return loadJSON(KEYS.CATEGORIES, DEFAULT_CATEGORIES); }
export function saveManagedCategories(data: ManagedCategory[]) { saveJSON(KEYS.CATEGORIES, data); if (isDb()) apiPost({ action: 'save-categories', categories: data }); }
export function getManagedSubCategories(): ManagedSubCategory[] { return loadJSON(KEYS.SUB_CATEGORIES, DEFAULT_SUB_CATEGORIES); }
export function saveManagedSubCategories(data: ManagedSubCategory[]) { saveJSON(KEYS.SUB_CATEGORIES, data); if (isDb()) apiPost({ action: 'save-sub-categories', subCategories: data }); }
export function getManagedNavbar(): NavbarLink[] { return loadJSON(KEYS.NAVBAR, DEFAULT_NAVBAR_LINKS); }
export function saveManagedNavbar(data: NavbarLink[]) { saveJSON(KEYS.NAVBAR, data); if (isDb()) apiPost({ action: 'save-navbar', links: data }); }
export function getManagedFooter(): FooterContent { return loadJSON(KEYS.FOOTER, DEFAULT_FOOTER); }
export function saveManagedFooter(data: FooterContent) { saveJSON(KEYS.FOOTER, data); if (isDb()) apiPost({ action: 'save-footer', ...data }); }

export function getPageText(key: string, fallback: string): string {
  const all = loadJSON<Record<string, string>>(KEYS.PAGE_TEXT, {});
  return all[key] ?? fallback;
}
export function setPageText(key: string, value: string) {
  const all = loadJSON<Record<string, string>>(KEYS.PAGE_TEXT, {});
  all[key] = value;
  saveJSON(KEYS.PAGE_TEXT, all);
}
export function getAllPageText(): Record<string, string> {
  return loadJSON(KEYS.PAGE_TEXT, {});
}
export function saveAllPageText(data: Record<string, string>) { saveJSON(KEYS.PAGE_TEXT, data); }
