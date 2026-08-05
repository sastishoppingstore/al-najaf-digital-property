import { useState, useEffect, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, Stamp, Briefcase, Scale, ShieldCheck, Mail, Bell, BarChart3, FileText,
  TrendingUp, Clock, Check, X, Eye, ChevronRight, Plus, Trash2, Save, Globe, Search, Image as ImageIcon,
  Settings, Edit3, Building2, Phone, MapPin, Award, DollarSign, Menu, Upload, Database,
  Lock, ShieldAlert, ArrowRight, Send, LogOut, MessageSquare, AlertCircle,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import {
  addCustomProperty, updateCustomProperty, deleteCustomProperty,
  getCustomProperties, getAllProperties, approveCustomProperty, rejectCustomProperty,
  getPropOverride, setPropOverride, getAllUsers, deleteUser, updateUserRole,
  getInquiries, getCurrentUser, loginUser, logoutUser, markInquiryRead, getOrders,
  useDataVersion,
} from '@/lib/dataService';
import { dbLogin, syncAll, isDbMode } from '@/lib/dbSync';
import type { CustomProperty } from '@/lib/dataService';
import { getStampTypes, saveStampTypes, getStampFees, saveStampFees, getManagedServices, saveManagedServices, getManagedLawyers, saveManagedLawyers, getAllPageText, saveAllPageText, getManagedCities, saveManagedCities, getManagedTowns, saveManagedTowns, getManagedCategories, saveManagedCategories, getManagedSubCategories, saveManagedSubCategories, getManagedNavbar, saveManagedNavbar, getManagedFooter, saveManagedFooter } from '@/lib/contentManager';
import type { StampType, EditableService, EditableLawyer, ManagedCategory, ManagedSubCategory, NavbarLink, FooterContent } from '@/lib/contentManager';
import { fetchApi } from '@/lib/registryRates';
import { uploadImage } from '@/lib/uploadImage';
import { DEFAULT_BRANCHES } from '@/lib/branchData';
import type { Branch } from '@/lib/branchData';
import { getEmailLogs, sendGeneralEmail, deleteEmailLog } from '@/lib/emailApi';
import type { EmailLog } from '@/lib/emailApi';

type Plan = { size: string; totalPrice: string; downPayment: string; monthly36: string; halfYearly6: string; possession: string };

const EMPTY_PLAN: Plan = { size: '', totalPrice: '', downPayment: '', monthly36: '', halfYearly6: '', possession: '' };

function loadJSON<T>(key: string, fallback: T): T { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; } }
function saveJSON(key: string, data: any) { localStorage.setItem(key, JSON.stringify(data)); }

// A property's main image is considered valid only if it is a non-empty string.
// Properties with a missing/invalid main image are dropped from admin lists so the
// UI never crashes on broken image URLs.
function hasValidMainImage(p: { images?: unknown[] }): boolean {
  try {
    const imgs = Array.isArray(p?.images) ? p.images : [];
    const main = imgs[0];
    return typeof main === 'string' && main.trim() !== '';
  } catch { return false; }
}
function onImgError(e: SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  el.onerror = null;
  el.style.visibility = 'hidden';
}

export function AdminPage() {
  const { lang, t } = useLang();
  useDataVersion();
  const [active, setActive] = useState('overview');
  const [onlineFee, setOnlineFee] = useState(() => localStorage.getItem('estamp_fee_online') || '150');
  const [offlineFee, setOfflineFee] = useState(() => localStorage.getItem('estamp_fee_offline') || '300');
  const [saved, setSaved] = useState('');
  const [loginTick, setLoginTick] = useState(0);
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin');

  const showSaved = () => { setSaved('Settings saved!'); setTimeout(() => setSaved(''), 2000); };

  // Status Approval Modal State
  const [statusModalProp, setStatusModalProp] = useState<any | null>(null);

  // Property CRUD state
  const [allProps, setAllProps] = useState<any[]>(() => getAllProperties().filter(hasValidMainImage));
  const [form, setForm] = useState<Partial<CustomProperty>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refreshProps = () => setAllProps(getAllProperties().filter(hasValidMainImage));

  useEffect(() => {
    if (active === 'properties' || active === 'property-crud' || active === 'verifications' || active === 'overview') {
      refreshProps();
    }
  }, [active]);

  const emptyForm = () => ({
    title: '', description: '', price: 0, priceType: 'fixed' as const, purpose: 'sale' as const,
    category: 'houses', subCategory: '', city: '', area: '', size: '', bedrooms: 0, bathrooms: 0,
    furnished: false, featured: false, verified: false, lat: 0, lng: 0,
    images: [], postedAt: new Date().toISOString().split('T')[0],
    seller: { name: '', type: 'Owner' as const, phone: '', whatsapp: '' },
    status: 'pending' as const,
  });

  const handleNewProp = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };
  const handleEditProp = (p: CustomProperty) => { setForm({ ...p }); setEditingId(p.id); setShowForm(true); };
  const handleSaveProp = () => {
    const typed = (document.getElementById('prop-images') as HTMLInputElement)?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const merged = [...typed, ...((form as any).images || [])].filter(Boolean);
    const data = { ...form, images: merged };
    if (editingId) {
      updateCustomProperty(editingId, data);
    } else {
      addCustomProperty(data as any);
    }
    refreshProps();
    setShowForm(false);
    setForm(emptyForm());
    setEditingId(null);
  };
  const handleDeleteProp = (id: string) => { if (confirm('Delete this property?')) { deleteCustomProperty(id); refreshProps(); } };
  const handleApprove = (id: string) => { approveCustomProperty(id); refreshProps(); };
  const handleReject = (id: string) => { rejectCustomProperty(id); refreshProps(); };
  const setStatus = (id: string, status: 'approved' | 'rejected' | 'pending') => { setPropOverride(id, { status }); refreshProps(); };
  const setVerify = (id: string, verified: boolean) => { setPropOverride(id, { verified }); refreshProps(); };

  // Capital Valley state
  const [cvResidential, setCvResidential] = useState<Plan[]>(() => loadJSON<Plan[]>('capital_valley_plans_residential', [
    { size: '3 Marla', totalPrice: '4,850,000', downPayment: '1,200,000', monthly36: '40,000', halfYearly6: '130,000', possession: '1,300,000' },
    { size: '3.5 Marla', totalPrice: '7,000,000', downPayment: '1,750,000', monthly36: '60,000', halfYearly6: '200,000', possession: '1,890,000' },
    { size: '5 Marla', totalPrice: '10,000,000', downPayment: '2,500,000', monthly36: '90,000', halfYearly6: '350,000', possession: '2,160,000' },
  ]));
  const [cvCommercial, setCvCommercial] = useState<Plan[]>(() => loadJSON<Plan[]>('capital_valley_plans_commercial', [
    { size: '5.33 Marla', totalPrice: '17,500,000', downPayment: '4,375,000', monthly36: '145,000', halfYearly6: '500,000', possession: '4,905,000' },
  ]));
  const [cvHeroTitle, setCvHeroTitle] = useState(() => localStorage.getItem('capital_valley_hero_title') || 'CAPITAL VALLEY — 3 YEARS PAYMENT PLAN');
  const [cvHeroSub, setCvHeroSub] = useState(() => localStorage.getItem('capital_valley_hero_subtitle') || 'A project of Shab Raj Developer (Pvt) Limited');
  const [cvHeroCons, setCvHeroCons] = useState(() => localStorage.getItem('capital_valley_hero_consultants') || 'Consultants: THE BASE (Real Estate Consultants) & Al Najaf Associate (Real Estate & Property Consultants)');
  const [cvHeroTag, setCvHeroTag] = useState(() => localStorage.getItem('capital_valley_hero_tagline') || 'Secure Your Future, Today!');
  const [cvContact, setCvContact] = useState(() => loadJSON('capital_valley_contact', { person1: 'Malik Imran', phone1: '0321-4288345', person2: 'Ayan Ali', phone2: '0322-0778860', address: 'Thokar, Lahore, Pakistan', email: 'alnajafassociate.official@gmail.com' }));
  const [cvImages, setCvImages] = useState(() => loadJSON<string[]>('capital_valley_images', ['/images/cv-1.jpg', '/images/cv-2.jpg', '/images/cv-3.jpg']));
  const [newImg, setNewImg] = useState('');
  const [cvFeatures, setCvFeatures] = useState<string[]>(() => loadJSON<string[]>('capital_valley_features', [
    'Prime Location on Main Boulevard',
    'Approved by LDA & PHATA',
    'Underground Electricity & Modern Infrastructure',
    'Parks, Mosques, and Community Centers',
    '24/7 Security & Gated Community',
    'Near Lahore Ring Road & Motorway',
  ]));
  const [cvCharges, setCvCharges] = useState<string[]>(() => loadJSON<string[]>('capital_valley_charges', [
    'No Hidden Charges',
    'Development Charges: Rs 150/sq ft',
    'Membership Fee: One-time Rs 25,000',
    'Annual Property Tax: As per LDA',
  ]));
  const [cvAmenities, setCvAmenities] = useState<string[]>(() => loadJSON<string[]>('capital_valley_amenities', [
    'School & College Campus',
    'Hospital & Medical Center',
    'Commercial Area & Shopping Mall',
    'Sports Complex & Gym',
    'Sewerage & Water Supply System',
    'Solar Street Lights',
  ]));
  const [cvNewFeature, setCvNewFeature] = useState('');
  const [cvNewCharge, setCvNewCharge] = useState('');
  const [cvNewAmenity, setCvNewAmenity] = useState('');
  const [cvHeadingCharges, setCvHeadingCharges] = useState(() => localStorage.getItem('cv_heading_charges') || 'Additional Charges');
  const [cvHeadingAmenities, setCvHeadingAmenities] = useState(() => localStorage.getItem('cv_heading_amenities') || 'Key Amenities');

  // Website settings
  const [ws, setWs] = useState(() => loadJSON('website_settings', {
    showMegaSearch: true, showStats: true, showFeatured: true, showCategories: true, showServices: true, showCTA: true,
    defaultLang: 'en', currency: 'PKR', theme: 'gold',
  }));

  // SEO settings
  const [seo, setSeo] = useState(() => loadJSON('seo_settings', {
    homeTitle: 'Al Najaf Digital Property - Property & Legal Services', homeDesc: 'Pakistan\'s premier digital estate platform',
    propsTitle: 'Properties for Sale & Rent', propsDesc: 'Browse properties across Pakistan',
    servicesTitle: 'Legal & Utility Services', servicesDesc: 'Book legal and utility services online',
    fardTitle: 'Fard Records - Government Land Records', fardDesc: 'Search government fard records',
    articlesTitle: 'Real Estate Articles & Guides', articlesDesc: 'Expert articles on Pakistan real estate',
    cvTitle: 'Capital Valley - Payment Plans', cvDesc: 'Invest in Capital Valley housing society',
    ogImage: '/images/og-default.jpg', gaId: '',
  }));

  // Home Page Content
  const [hp, setHp] = useState(() => loadJSON('homepage_content', {
    heroBadge: 'Trusted Real Estate & Legal Services',
    heroTitle: 'Property and Legal Services — All in One Place',
    heroSub: 'Al Najaf Digital Property brings you a modern property marketplace and trusted legal/utility services under one roof.',
    panelATitle: 'Property Bazaar',
    panelATag: 'Buy, sell, or rent property across Pakistan — premium marketplace with verified listings.',
    panelACta: 'Explore Properties',
    panelBTitle: 'Associates',
    panelBTag: 'Legal and utility services — E-Stamp, land registration, lawyer consultations, meter transfers and more.',
    panelBCta: 'Book Services',
    megaTitle: 'Mega Portal Search',
    megaSub: 'Search properties, e-stamp, legal docs, fard records & all services',
    statListings: '12+', statClients: '5,000+', statServices: '17', statCities: '10+',
    featTitle: 'Featured Properties', featSub: 'Hand-picked listings from verified sellers',
    catTitle: 'Browse by Category', catSub: 'Find exactly what you\'re looking for',
    svcTitle: 'Popular Services', svcSub: 'Legal and utility services you can book online',
    ctaTitle: 'Ready to list or book?', ctaSub: 'Join Al Najaf Digital Property today.',
    ctaPost: 'Post a Property Ad', ctaBrowse: 'Browse Services',
    viewAll: 'View all',
  }));

  // E-Stamp settings
  const [stampTypes, setStampTypes] = useState<StampType[]>(() => getStampTypes());
  const [stampFees, setStampFees] = useState(() => getStampFees());

  // Services manager
  const [editableServices, setEditableServices] = useState<EditableService[]>(() => getManagedServices());

  // Lawyers manager
  const [editableLawyers, setEditableLawyers] = useState<EditableLawyer[]>(() => getManagedLawyers());

  // Cities/Towns
  const [adminCities, setAdminCities] = useState<string[]>(() => getManagedCities());
  const [adminTowns, setAdminTowns] = useState<string[]>(() => getManagedTowns());
  const [adminCategories, setAdminCategories] = useState<ManagedCategory[]>(() => getManagedCategories());
  const [adminSubCategories, setAdminSubCategories] = useState<ManagedSubCategory[]>(() => getManagedSubCategories());
  const [adminNavLinks, setAdminNavLinks] = useState<NavbarLink[]>(() => getManagedNavbar());
  const [adminFooter, setAdminFooter] = useState<FooterContent>(() => getManagedFooter());

  const managedCategories = getManagedCategories();
  const managedSubCats = getManagedSubCategories();

  const totalUsers = getAllUsers().length;
  const pendingProps = getAllProperties().filter(p => { const ov = getPropOverride(p.id); return (ov.status ?? (p as any).status ?? 'approved') === 'pending'; }).length;
  const totalInquiries = getInquiries().length;

  // Content text
  const [pageText, setPageText] = useState<Record<string, string>>(() => {
    const existing = getAllPageText();
    if (Object.keys(existing).length > 0) return existing;
    return {
      navbar_brand: 'Al Najaf',
      navbar_tagline: 'Digital Property',
      hero_badge: 'Trusted Real Estate & Legal Services',
      hero_title: 'Property and Legal Services — All in One Place',
      hero_subtitle: 'Al Najaf Digital Property brings you a modern property marketplace and trusted legal/utility services under one roof.',
      footer_tagline: 'Property aur Qanooni Khidmatain — Sab Ek Jagah.',
      footer_email: 'info@alnajafdigital.com',
      footer_phone: '+92 300 1234567',
      footer_address: 'Office # 1, Main Boulevard, Lahore',
      hero_promo_en: 'Become the Owner of a Built House with Just a Few Thousand Advance — First Time in Lahore',
      hero_promo_ur: 'لاہور میں پہلی بار صرف چند ہزار ایڈوانس دے کر بنے ہوئے گھر کے مالک بنیں',
      hero_promo_cta: 'Learn More',
      hero_promo_link: '/capital-valley',
      hero_promo_image: '/images/cv-cover.jpg',
      cv_heading_plans: 'Payment Plan',
      cv_heading_plans_sub: 'Flexible 3-year installment plans for every budget',
      cv_heading_invest: 'Why Invest in Capital Valley?',
      cv_heading_invest_sub: 'A premier housing society with modern amenities',
      cv_heading_gallery: 'Gallery',
      cv_heading_gallery_sub: 'Explore Capital Valley through images',
      cv_heading_contact: 'Contact Us',
      cv_heading_contact_sub: 'Get in touch for booking, inquiries, and site visits',
      site_brand: 'Al Najaf',
      site_tagline: 'Digital Property',
      site_fullname: 'Al Najaf Digital Property',
      site_phone: '0321 3216423',
      site_phone_display: '0321 3216423',
      site_whatsapp: '923213216423',
      site_email: 'alnajafassociate.official@gmail.com',
      site_address: 'Thokar, Lahore, Pakistan',
      site_admin_email: 'info@alnajafdigitalproperty.com',
    };
  });
  const [pageTextNewKey, setPageTextNewKey] = useState('');

  const menu = [
    { id: 'overview', label: t('admin.overview'), icon: LayoutDashboard },
    { id: 'users', label: t('admin.users'), icon: Users },
    { id: 'properties', label: t('admin.properties'), icon: Home },
    { id: 'property-crud', label: 'Property CRUD & Status', icon: Edit3 },
    { id: 'capital-valley', label: 'Capital Valley', icon: Building2 },
    { id: 'site-media', label: 'Site Media & Images', icon: ImageIcon },
    { id: 'email', label: 'Email Box & Inbox', icon: Send },
    { id: 'estamp', label: t('admin.estamp'), icon: Stamp },
    { id: 'services', label: t('admin.services'), icon: Briefcase },
    { id: 'lawyers', label: t('admin.lawyers'), icon: Scale },
    { id: 'homepage', label: 'Home Page Editor', icon: Edit3 },
    { id: 'website', label: 'Website Settings', icon: Settings },
    { id: 'seo', label: 'SEO Settings', icon: Globe },
    { id: 'estamp-settings', label: 'E-Stamp Settings', icon: Stamp },
    { id: 'services-manager', label: 'Services Editor', icon: Briefcase },
    { id: 'lawyers-manager', label: 'Lawyers Editor', icon: Scale },
    { id: 'content-text', label: 'Page Text Editor', icon: FileText },
    { id: 'cities', label: 'Cities / Towns', icon: MapPin },
    { id: 'categories', label: 'Categories / Sub-Categories', icon: Home },
    { id: 'navbar', label: 'Navbar Links', icon: Menu },
    { id: 'footer', label: 'Footer Editor', icon: FileText },
    { id: 'branches', label: 'Branches', icon: MapPin },
    { id: 'verifications', label: t('admin.verifications'), icon: ShieldCheck },
    { id: 'messages', label: t('admin.messages'), icon: Mail },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell },
    { id: 'reports', label: t('admin.reports'), icon: BarChart3 },
    { id: 'dc-rates', label: 'DC Rates', icon: Database },
    { id: 'logs', label: t('admin.auditLogs'), icon: FileText },
  ];

  const saveCV = () => {
    saveJSON('capital_valley_plans_residential', cvResidential);
    saveJSON('capital_valley_plans_commercial', cvCommercial);
    localStorage.setItem('capital_valley_hero_title', cvHeroTitle);
    localStorage.setItem('capital_valley_hero_subtitle', cvHeroSub);
    localStorage.setItem('capital_valley_hero_consultants', cvHeroCons);
    localStorage.setItem('capital_valley_hero_tagline', cvHeroTag);
    saveJSON('capital_valley_contact', cvContact);
    saveJSON('capital_valley_images', cvImages);
    saveJSON('capital_valley_features', cvFeatures);
    saveJSON('capital_valley_charges', cvCharges);
    saveJSON('capital_valley_amenities', cvAmenities);
    localStorage.setItem('cv_heading_charges', cvHeadingCharges);
    localStorage.setItem('cv_heading_amenities', cvHeadingAmenities);
    showSaved();
  };

  const saveHP = () => { saveJSON('homepage_content', hp); showSaved(); };
  const saveWS = () => { saveJSON('website_settings', ws); showSaved(); };
  const saveSEO = () => { saveJSON('seo_settings', seo); showSaved(); };

  const saveSiteText = () => {
    Object.entries(pageText).forEach(([key, val]) => {
      if (key.startsWith('site_') || key.startsWith('footer_') || key.startsWith('navbar_') || key.startsWith('hero_') || key.startsWith('cv_') || key.startsWith('promo_')) {
        localStorage.setItem(key, val);
      }
    });
    saveAllPageText(pageText);
    showSaved();
  };

  function PlanEditor({ plans, setPlans, label }: { plans: Plan[]; setPlans: (p: Plan[]) => void; label: string }) {
    const add = () => setPlans([...plans, { ...EMPTY_PLAN }]);
    const remove = (i: number) => setPlans(plans.filter((_, idx) => idx !== i));
    const update = (i: number, field: keyof Plan, val: string) => {
      const next = [...plans];
      next[i] = { ...next[i], [field]: val };
      setPlans(next);
    };
    const FIELDS: { key: keyof Plan; label: string; w: string }[] = [
      { key: 'size', label: 'Size', w: 'w-20' },
      { key: 'totalPrice', label: 'Total Price', w: 'w-28' },
      { key: 'downPayment', label: 'Down Payment', w: 'w-28' },
      { key: 'monthly36', label: 'Monthly (36)', w: 'w-28' },
      { key: 'halfYearly6', label: 'Half-Yearly (6)', w: 'w-28' },
      { key: 'possession', label: 'Possession', w: 'w-28' },
    ];
    return (
      <div className="mb-6">
        <h3 className="mb-1 font-semibold text-navy-800">{label}</h3>
        <p className="mb-3 text-xs text-navy-400">Down payment aur installment (Monthly / Half-Yearly) ki mukammal details yahan se add/edit karein.</p>
        {plans.map((p, i) => (
          <div key={i} className="mb-2 rounded-lg border border-navy-100 p-3">
            <div className="flex flex-wrap gap-2">
              {FIELDS.map(f => (
                <div key={f.key as string}>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase text-navy-400">{f.label}</label>
                  <input value={p[f.key]} onChange={e => update(i, f.key, e.target.value)} placeholder={f.label} className={`${f.w} rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400`} />
                </div>
              ))}
              <div className="self-end"><button onClick={() => remove(i)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          </div>
        ))}
        <button onClick={add} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Plan</button>
      </div>
    );
  }

  return (
    !currentUser ? (
      <AdminLogin onLogin={() => setLoginTick(t => t + 1)} />
    ) : !isAdmin ? (
      <div className="mx-auto max-w-md px-4 py-20">
       <div className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-8 shadow-sm text-center">
           <ShieldAlert className="mx-auto h-10 w-10 text-rose-400" />
           <h2 className="mt-4 font-serif text-2xl font-bold text-navy-800">{lang === 'ur' ? 'رسائی سے انکار' : 'Access Denied'}</h2>
          <p className="mt-2 text-sm text-navy-500">{lang === 'ur' ? 'صرف ایڈمن صارفین پینل تک رسائی حاصل کر سکتے ہیں' : 'Only admin users can access this panel'}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy-700 px-8 py-3 font-semibold text-white transition hover:bg-navy-800">
            {lang === 'ur' ? 'ہوم پیج پر جائیں' : 'Go to Home'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    ) : (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{t('admin.title')}</h1>
          <p className="mt-1 text-sm text-navy-500">Super Admin · Full Access</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 animate-fade-up">{saved}</span>}
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">
            <Globe className="h-4 w-4" /> {lang === 'ur' ? 'ویب سائٹ' : 'View Site'}
          </Link>
          <button onClick={() => { logoutUser(); window.location.href = '/'; }} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
            <LogOut className="h-4 w-4" /> {lang === 'ur' ? 'لاگ آؤٹ' : 'Logout'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-navy-100 bg-white p-3">
            {menu.map((m) => (
              <button key={m.id} onClick={() => setActive(m.id)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === m.id ? 'bg-navy-700 text-white' : 'text-navy-600 hover:bg-navy-50'}`}>
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
          </div>
        </aside>

        <div>
          {active === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Widget icon={<Users className="h-5 w-5" />} label={t('admin.totalUsers')} value={`${totalUsers}`} trend="Active" color="navy" />
                <Widget icon={<Home className="h-5 w-5" />} label={t('admin.pendingAds')} value={`${pendingProps}`} trend="Pending" color="amber" />
                <Widget icon={<Stamp className="h-5 w-5" />} label={t('admin.pendingEstamp')} value={`${getOrders().filter(o => o.orderType.includes('E-Stamp')).length}`} trend="Total" color="gold" />
                <Widget icon={<Briefcase className="h-5 w-5" />} label={t('admin.serviceRequests')} value={`${getOrders().filter(o => o.orderType !== 'E-Stamp Application').length}`} trend="Total" color="emerald" />
              </div>
              <div>
                <AdminCard title={t('admin.recentActivity')}>
                  <div className="space-y-3">
                    {(() => {
                      const recent: { icon: any; text: string; time: string; action: string; go: string }[] = [];
                      const props = getAllProperties();
                      props.slice(0, 2).forEach(p => recent.push({ icon: Home, text: `Property: "${p.title}"`, time: p.postedAt || '', action: 'View', go: 'property-crud' }));
                      getOrders().slice(0, 2).forEach(o => recent.push({ icon: Stamp, text: `${o.orderType} #${o.orderRef} from ${o.name}`, time: o.orderDate, action: 'View', go: 'reports' }));
                      getInquiries().slice(0, 2).forEach(i => recent.push({ icon: Mail, text: `Inquiry about "${i.propertyTitle}" from ${i.name}`, time: new Date(i.createdAt).toLocaleString(), action: 'View', go: 'messages' }));
                      return recent.length ? recent.map((a, i) => (
                        <button key={i} onClick={() => setActive(a.go)} className="flex w-full items-start gap-3 border-b border-navy-50 pb-3 text-left last:border-0 last:pb-0">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600"><a.icon className="h-4 w-4" /></span>
                          <div className="flex-1"><p className="text-sm text-navy-700">{a.text}</p><p className="text-xs text-navy-400">{a.time}</p></div>
                          {a.action && <span className="rounded-lg bg-navy-50 px-3 py-1 text-xs font-medium text-navy-600">{a.action}</span>}
                        </button>
                      )) : <div className="py-6 text-center text-sm text-navy-400">No activity yet</div>;
                    })()}
                  </div>
                </AdminCard>
              </div>
            </div>
          )}

          {active === 'properties' && (
            <div><AdminCard title={t('admin.properties')}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-navy-500">Manage all properties — add new, edit, verify status, approve or reject</p>
                <button onClick={handleNewProp} className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 shadow-sm"><Plus className="h-4 w-4" /> Add New Property</button>
              </div>

              {showForm && (
                <div className="mb-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">{editingId ? 'Edit Property' : 'Add New Property'}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 sm:col-span-2" rows={2} />
                    <input type="number" value={form.price || 0} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <select value={form.priceType || 'fixed'} onChange={e => setForm({ ...form, priceType: e.target.value as any })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="fixed">Fixed</option><option value="negotiable">Negotiable</option><option value="on-call">On Call</option>
                    </select>
                    <select value={form.purpose || 'sale'} onChange={e => setForm({ ...form, purpose: e.target.value as any })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="sale">Sale</option><option value="rent">Rent</option><option value="requirement">Requirement</option>
                    </select>
                    <select value={form.category || 'houses'} onChange={e => setForm({ ...form, category: e.target.value, subCategory: '' })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      {managedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={form.subCategory || ''} onChange={e => setForm({ ...form, subCategory: e.target.value })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="">Sub Category</option>
                      {managedSubCats.filter(sc => sc.categoryId === form.category).map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
                    </select>
                    <select value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="">City</option>
                      {getManagedCities().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={form.area || ''} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Area" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={form.size || ''} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Size (e.g. 5 Marla)" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input type="number" value={form.bedrooms || 0} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} placeholder="Bedrooms" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input type="number" value={form.bathrooms || 0} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} placeholder="Bathrooms" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.furnished || false} onChange={e => setForm({ ...form, furnished: e.target.checked })} className="accent-gold-500" /> Furnished
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.featured || false} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-gold-500" /> Featured
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.verified || false} onChange={e => setForm({ ...form, verified: e.target.checked })} className="accent-gold-500" /> Verified
                    </label>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Status</label>
                      <select value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="border-t border-navy-100 pt-3 sm:col-span-3">
                      <p className="mb-2 text-xs font-semibold text-navy-500">Seller Info</p>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <input value={form.seller?.name || ''} onChange={e => setForm({ ...form, seller: { ...form.seller as any, name: e.target.value } })} placeholder="Seller Name" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                        <select value={form.seller?.type || 'Owner'} onChange={e => setForm({ ...form, seller: { ...form.seller as any, type: e.target.value as any } })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                          <option value="Owner">Owner</option><option value="Agent">Agent</option><option value="Dealer">Dealer</option>
                        </select>
                        <input value={form.seller?.phone || ''} onChange={e => setForm({ ...form, seller: { ...form.seller as any, phone: e.target.value } })} placeholder="Seller Phone" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                        <input value={form.seller?.whatsapp || ''} onChange={e => setForm({ ...form, seller: { ...form.seller as any, whatsapp: e.target.value } })} placeholder="WhatsApp Number" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Images (URLs or upload)</label>
                      <input id="prop-images-main" defaultValue={(form.images || []).join(', ')} placeholder="/images/prop-1.jpg, /images/prop-2.jpg" className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(form.images || []).map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt="" className="h-14 w-20 rounded-lg object-cover border border-navy-100" />
                            <button type="button" onClick={() => { const next = [...(form.images || [])]; next.splice(idx, 1); setForm({ ...form, images: next }); }} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                        <Upload className="h-3 w-3" /> Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const url = await uploadImage(f);
                          if (url) setForm({ ...form, images: [...(form.images || []), url] });
                          e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => {
                      const typed = (document.getElementById('prop-images-main') as HTMLInputElement)?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
                      const merged = [...typed, ...((form as any).images || [])].filter(Boolean);
                      const data = { ...form, images: merged };
                      if (editingId) { updateCustomProperty(editingId, data); } else { addCustomProperty(data as any); }
                      refreshProps(); setShowForm(false); setForm(emptyForm()); setEditingId(null);
                    }} className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> {editingId ? 'Update' : 'Create'} Property</button>
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-navy-200 px-5 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">{allProps.map((p) => {
                const ov = getPropOverride(p.id);
                const ovVerified = ov.verified ?? p.verified;
                const ovFeatured = ov.featured ?? (p as any).featured ?? false;
                const ovPremium = ov.premium ?? (p as any).premium ?? false;
                const ovStatus = ov.status ?? p.status ?? (ovVerified ? 'approved' : 'pending');
                return (
                  <div key={`${p.source || 'prop'}-${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-50 p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || '/images/placeholder.jpg'} alt="" onError={onImgError} className="h-14 w-20 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-navy-800">{p.title}</p>
                        <p className="text-xs text-navy-400">{p.area}, {p.city} · Rs {p.price?.toLocaleString()} · {p.purpose} · by {p.seller?.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ovVerified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>}
                          {ovFeatured && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-gold-700">Featured</span>}
                          {ovPremium && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">Premium</span>}
                          {p.source === 'custom' && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">User Added</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${ovStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : ovStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{ovStatus}</span>
                      <button onClick={() => setStatusModalProp(p)} className="inline-flex items-center gap-1 rounded-lg bg-gold-400 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-gold-300 shadow-sm" title="Status / Verification Modal">
                        <ShieldCheck className="h-3.5 w-3.5" /> Status / Verify
                      </button>
                      <button onClick={() => setStatus(p.id, 'approved')} className={`grid h-7 w-7 place-items-center rounded-lg ${ovStatus === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'} hover:brightness-90`} title="Quick Approve"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setStatus(p.id, 'rejected')} className={`grid h-7 w-7 place-items-center rounded-lg ${ovStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'} hover:brightness-90`} title="Quick Reject"><X className="h-3 w-3" /></button>
                      <button onClick={() => handleEditProp(p as any)} className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Edit"><Edit3 className="h-3 w-3" /></button>
                      <button onClick={() => handleDeleteProp(p.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}</div>
            </AdminCard></div>
          )}

          {active === 'property-crud' && (
            <div><AdminCard title="Property CRUD & Verification Status Manager">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-navy-500">Manage all properties — click "Status / Verify" button to open approval modal</p>
                <button onClick={handleNewProp} className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /> Add Property</button>
              </div>

              {showForm && (
                <div className="mb-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">{editingId ? 'Edit Property' : 'New Property'}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 sm:col-span-2" rows={2} />
                    <input type="number" value={form.price || 0} onChange={e => setForm({ ...form, price: Number(e.target.value) })} placeholder="Price" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <select value={form.priceType || 'fixed'} onChange={e => setForm({ ...form, priceType: e.target.value as any })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="fixed">Fixed</option><option value="negotiable">Negotiable</option><option value="on-call">On Call</option>
                    </select>
                    <select value={form.purpose || 'sale'} onChange={e => setForm({ ...form, purpose: e.target.value as any })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="sale">Sale</option><option value="rent">Rent</option><option value="requirement">Requirement</option>
                    </select>
                    <select value={form.category || 'houses'} onChange={e => setForm({ ...form, category: e.target.value, subCategory: '' })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      {managedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={form.subCategory || ''} onChange={e => setForm({ ...form, subCategory: e.target.value })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="">Sub Category</option>
                      {managedSubCats.filter(sc => sc.categoryId === form.category).map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
                    </select>
                    <select value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                      <option value="">City</option>
                      {getManagedCities().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={form.area || ''} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Area" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={form.size || ''} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="Size (e.g. 5 Marla)" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input type="number" value={form.bedrooms || 0} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} placeholder="Bedrooms" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input type="number" value={form.bathrooms || 0} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} placeholder="Bathrooms" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.furnished || false} onChange={e => setForm({ ...form, furnished: e.target.checked })} className="accent-gold-500" /> Furnished
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.featured || false} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-gold-500" /> Featured
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-700">
                      <input type="checkbox" checked={form.verified || false} onChange={e => setForm({ ...form, verified: e.target.checked })} className="accent-gold-500" /> Verified
                    </label>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Status</label>
                      <select value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="border-t border-navy-100 pt-3 sm:col-span-3">
                      <p className="mb-2 text-xs font-semibold text-navy-500">Seller Info</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input value={form.seller?.name || ''} onChange={e => setForm({ ...form, seller: { ...form.seller as any, name: e.target.value } })} placeholder="Seller Name" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                        <select value={form.seller?.type || 'Owner'} onChange={e => setForm({ ...form, seller: { ...form.seller as any, type: e.target.value as any } })} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                          <option value="Owner">Owner</option><option value="Agent">Agent</option><option value="Dealer">Dealer</option>
                        </select>
                        <input value={form.seller?.phone || ''} onChange={e => setForm({ ...form, seller: { ...form.seller as any, phone: e.target.value } })} placeholder="Seller Phone" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Images (URLs or upload)</label>
                      <input id="prop-images" defaultValue={(form.images || []).join(', ')} placeholder="/images/prop-1.jpg, /images/prop-2.jpg" className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(form.images || []).map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt="" className="h-14 w-20 rounded-lg object-cover border border-navy-100" />
                            <button type="button" onClick={() => { const next = [...(form.images || [])]; next.splice(idx, 1); setForm({ ...form, images: next }); }} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                        <Upload className="h-3 w-3" /> Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const url = await uploadImage(f);
                          if (url) setForm({ ...form, images: [...(form.images || []), url] });
                          e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={handleSaveProp} className="inline-flex items-center gap-1.5 rounded-xl bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> {editingId ? 'Update' : 'Create'} Property</button>
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-navy-200 px-5 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {allProps.map((p) => {
                  const ov = getPropOverride(p.id);
                  const ovVerified = ov.verified ?? p.verified;
                  const ovFeatured = ov.featured ?? (p as any).featured ?? false;
                  const ovPremium = ov.premium ?? (p as any).premium ?? false;
                  const ovStatus = ov.status ?? p.status ?? 'pending';
                  return (
                    <div key={`${p.source || 'prop'}-${p.id}`} className="flex items-start gap-3 rounded-xl border border-navy-50 p-3">
                      <img src={p.images?.[0] || '/images/placeholder.jpg'} alt="" onError={onImgError} className="h-16 w-24 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-navy-800 truncate">{p.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ovVerified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>}
                          {ovFeatured && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-gold-700">Featured</span>}
                          {ovPremium && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">Premium</span>}
                        </div>
                        <p className="text-xs text-navy-400">{p.area}, {p.city} · Rs {p.price?.toLocaleString()} · {p.purpose} · {p.category}</p>
                        <p className="text-xs text-navy-400">Seller: {p.seller?.name} ({p.seller?.type}) · {p.seller?.phone}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ovStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : ovStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{ovStatus}</span>
                        {p.source === 'custom' && <span className="ml-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">User</span>}
                      </div>
                      <div className="flex shrink-0 gap-1.5 flex-wrap items-center max-w-[260px]">
                        <button onClick={() => setStatusModalProp(p)} className="inline-flex items-center gap-1 rounded-lg bg-gold-400 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-gold-300 shadow-sm" title="Status / Verification Modal">
                          <ShieldCheck className="h-3.5 w-3.5" /> Status / Verify
                        </button>
                        <button onClick={() => setStatus(p.id, 'approved')} className={`grid h-7 w-7 place-items-center rounded-lg ${ovStatus === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'} hover:brightness-90`} title="Quick Approve"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setStatus(p.id, 'rejected')} className={`grid h-7 w-7 place-items-center rounded-lg ${ovStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'} hover:brightness-90`} title="Quick Reject"><X className="h-3 w-3" /></button>
                        <button onClick={() => handleEditProp(p as CustomProperty)} className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Edit Details"><Edit3 className="h-3 w-3" /></button>
                        <button onClick={() => handleDeleteProp(p.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminCard></div>
          )}


          {active === 'estamp' && (
            <div><AdminCard title={t('admin.estamp')}>
              <div className="py-8 text-center">
                <Stamp className="mx-auto h-10 w-10 text-navy-200" />
                <p className="mt-3 text-sm text-navy-500">E-Stamp applications will appear here. Manage stamp types and fees in E-Stamp Settings.</p>
                <button onClick={() => setActive('estamp-settings')} className="mt-4 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300">Go to E-Stamp Settings</button>
              </div>
            </AdminCard></div>
          )}

          {active === 'users' && (
            <div><AdminCard title={t('admin.users')}>
              <div className="space-y-3">{getAllUsers().map((u) => {
                const isSuper = u.role === 'super_admin';
                return (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-100 font-semibold text-navy-700">{u.name.charAt(0).toUpperCase()}</span>
                    <div className="flex-1">
                      <p className="font-medium text-navy-800">{u.name}</p>
                      <p className="text-xs text-navy-400">{u.email} · {u.city || '—'} · {u.role}</p>
                    </div>
                    <select value={u.role} onChange={e => { updateUserRole(u.id, e.target.value as any); window.location.reload(); }} disabled={isSuper} className={`rounded-lg border px-2 py-1 text-xs font-medium outline-none ${isSuper ? 'bg-gold-50 text-gold-700 border-gold-200' : 'border-navy-100 text-navy-600'}`}>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                      <option value="user">User</option>
                    </select>
                    {!isSuper && (
                      <button onClick={() => { if (confirm('Delete user?')) { deleteUser(u.id); window.location.reload(); } }} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Delete User"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                );
              })}</div>
            </AdminCard></div>
          )}

          {active === 'lawyers' && (
            <div><AdminCard title={t('admin.lawyers')}>
              <div className="space-y-3">{editableLawyers.length === 0 ? (
                <p className="py-4 text-center text-sm text-navy-400">No lawyers added yet. Use <strong>Lawyers Editor</strong> to add.</p>
              ) : editableLawyers.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                  <img src={l.image || '/images/placeholder.jpg'} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1"><p className="font-medium text-navy-800">{l.name}</p><p className="text-xs text-navy-400">{l.designation} · {l.city} · {l.experience} yrs</p></div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                  <button onClick={() => setActive('lawyers-manager')} className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-100">Manage</button>
                </div>
              ))}</div>
            </AdminCard></div>
          )}

          {active === 'services' && (
            <div><AdminCard title={t('admin.services')}>
              <div className="space-y-3">{editableServices.length === 0 ? (
                <p className="py-4 text-center text-sm text-navy-400">No services added yet. Use <strong>Services Editor</strong> to add.</p>
              ) : editableServices.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600"><Briefcase className="h-5 w-5" /></span>
                  <div className="flex-1"><p className="font-medium text-navy-800">{s.name}</p><p className="text-xs text-navy-400">{s.fee} · {s.duration}</p></div>
                  <button onClick={() => setActive('services-manager')} className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-100">Manage</button>
                </div>
              ))}</div>
            </AdminCard></div>
          )}

          {/* CAPITAL VALLEY */}
          {active === 'capital-valley' && (
            <AdminCard title="Capital Valley Management">
              <div className="space-y-6">
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Hero Content</h3>
                  <div className="grid gap-3">
                    <input value={cvHeroTitle} onChange={e => setCvHeroTitle(e.target.value)} placeholder="Hero Title" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvHeroSub} onChange={e => setCvHeroSub(e.target.value)} placeholder="Subtitle" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvHeroCons} onChange={e => setCvHeroCons(e.target.value)} placeholder="Consultants" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvHeroTag} onChange={e => setCvHeroTag(e.target.value)} placeholder="Tagline" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                  </div>
                </div>
                <PlanEditor plans={cvResidential} setPlans={setCvResidential} label="Residential Plans" />
                <PlanEditor plans={cvCommercial} setPlans={setCvCommercial} label="Commercial Plans" />
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Contact Info</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={cvContact.person1} onChange={e => setCvContact({ ...cvContact, person1: e.target.value })} placeholder="Person 1" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvContact.phone1} onChange={e => setCvContact({ ...cvContact, phone1: e.target.value })} placeholder="Phone 1" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvContact.person2} onChange={e => setCvContact({ ...cvContact, person2: e.target.value })} placeholder="Person 2" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvContact.phone2} onChange={e => setCvContact({ ...cvContact, phone2: e.target.value })} placeholder="Phone 2" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvContact.address} onChange={e => setCvContact({ ...cvContact, address: e.target.value })} placeholder="Address" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none sm:col-span-2 focus:border-gold-400" />
                    <input value={cvContact.email} onChange={e => setCvContact({ ...cvContact, email: e.target.value })} placeholder="Email" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none sm:col-span-2 focus:border-gold-400" />
                  </div>
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Section Headings</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={cvHeadingCharges} onChange={e => setCvHeadingCharges(e.target.value)} placeholder="Charges Heading" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <input value={cvHeadingAmenities} onChange={e => setCvHeadingAmenities(e.target.value)} placeholder="Amenities Heading" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                  </div>
                </div>
                <TextArrayEditor label="Features" items={cvFeatures} setItems={setCvFeatures} newItem={cvNewFeature} setNewItem={setCvNewFeature} storageKey="capital_valley_features" />
                <TextArrayEditor label="Charges" items={cvCharges} setItems={setCvCharges} newItem={cvNewCharge} setNewItem={setCvNewCharge} storageKey="capital_valley_charges" />
                <TextArrayEditor label="Amenities" items={cvAmenities} setItems={setCvAmenities} newItem={cvNewAmenity} setNewItem={setCvNewAmenity} storageKey="capital_valley_amenities" />
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Gallery Images</h3>
                  <div className="flex flex-wrap gap-2 mb-3">{cvImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="h-16 w-24 rounded-lg border border-navy-100 object-cover" />
                      <button onClick={() => setCvImages(cvImages.filter((_, idx) => idx !== i))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}</div>
                  <div className="flex gap-2">
                    <input value={newImg} onChange={e => setNewImg(e.target.value)} placeholder="Image URL" className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <button onClick={() => { if (newImg) { setCvImages([...cvImages, newImg]); setNewImg(''); } }} className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /></button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
                      <Upload className="h-4 w-4" /> Upload Photo
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) { setCvImages([...cvImages, url]); }
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-navy-400">Capital Valley ki photos yahan se upload karein (project site, maps, layout). Admin se hi photo add hoti hai.</p>
                </div>
                <button onClick={saveCV} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save All Capital Valley Changes</button>
              </div>
            </AdminCard>
          )}

          {/* HOME PAGE EDITOR */}
          {active === 'homepage' && (
            <AdminCard title="Home Page Content Editor">
              <p className="mb-4 text-sm text-navy-500">Edit every text/heading on the home page. Changes save immediately.</p>
              <div className="space-y-4">
                {Object.entries(hp).map(([key, val]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                    <input value={val as string} onChange={e => setHp({ ...hp, [key]: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                  </div>
                ))}
                <button onClick={saveHP} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Home Page Content</button>
              </div>
            </AdminCard>
          )}

          {/* WEBSITE SETTINGS */}
          {active === 'website' && (
            <AdminCard title="Website Settings">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Section Visibility</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries({ showMegaSearch: 'Mega Search Bar', showStats: 'Stats Strip', showFeatured: 'Featured Properties', showCategories: 'Categories Section', showServices: 'Popular Services', showCTA: 'CTA Section' }).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-xl border border-navy-100 p-3">
                        <span className="text-sm text-navy-700">{label}</span>
                        <input type="checkbox" checked={(ws as any)[key]} onChange={e => setWs({ ...ws, [key]: e.target.checked })} className="h-5 w-5 rounded accent-gold-500" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Site Branding</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Brand Name</label>
                      <input value={localStorage.getItem('site_brand') || 'Al Najaf'} onChange={e => { localStorage.setItem('site_brand', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Tagline</label>
                      <input value={localStorage.getItem('site_tagline') || 'Digital Property'} onChange={e => { localStorage.setItem('site_tagline', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Full Name</label>
                      <input value={localStorage.getItem('site_fullname') || 'Al Najaf Digital Property'} onChange={e => { localStorage.setItem('site_fullname', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Phone (Display)</label>
                      <input value={localStorage.getItem('site_phone') || '0321 3216423'} onChange={e => { localStorage.setItem('site_phone', e.target.value); localStorage.setItem('site_phone_display', e.target.value.replace(/[^0-9]/g, '').replace(/^(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') || e.target.value); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">WhatsApp Number</label>
                      <input value={localStorage.getItem('site_whatsapp') || '923213216423'} onChange={e => { localStorage.setItem('site_whatsapp', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Email</label>
                      <input value={localStorage.getItem('site_email') || 'alnajafassociate.official@gmail.com'} onChange={e => { localStorage.setItem('site_email', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div className="sm:col-span-2 lg:col-span-3"><label className="mb-1 block text-xs font-semibold text-navy-500">Address</label>
                      <input value={localStorage.getItem('site_address') || 'Thokar, Lahore, Pakistan'} onChange={e => { localStorage.setItem('site_address', e.target.value); window.location.reload(); }} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                  </div>
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Logo & Hero Images</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Site Logo</label>
                      <div className="flex items-center gap-3">
                        <img src={localStorage.getItem('site_logo') || '/logo-square.png'} alt="logo" className="h-16 w-16 rounded-xl border border-navy-100 bg-white object-contain p-1" />
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                          <Upload className="h-3 w-3" /> Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const url = await uploadImage(f);
                            if (url) { localStorage.setItem('site_logo', url); window.location.reload(); }
                            e.target.value = '';
                          }} />
                        </label>
                        <input value={localStorage.getItem('site_logo') || '/logo-square.png'} onChange={e => { localStorage.setItem('site_logo', e.target.value); window.location.reload(); }} placeholder="or paste image URL" className="w-40 rounded border border-navy-100 px-2 py-1.5 text-xs outline-none focus:border-gold-400" />
                      </div>
                      <p className="mt-2 text-xs text-navy-400">Appears in navbar and footer. Recommended square / transparent PNG.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-500">Home Promo Image</label>
                      <div className="flex items-center gap-3">
                        <img src={localStorage.getItem('hero_promo_image') || '/images/cv-cover.jpg'} alt="promo" className="h-16 w-28 rounded-xl border border-navy-100 bg-white object-cover" />
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                          <Upload className="h-3 w-3" /> Upload Image
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const url = await uploadImage(f);
                            if (url) { localStorage.setItem('hero_promo_image', url); window.location.reload(); }
                            e.target.value = '';
                          }} />
                        </label>
                        <input value={localStorage.getItem('hero_promo_image') || '/images/cv-cover.jpg'} onChange={e => { localStorage.setItem('hero_promo_image', e.target.value); window.location.reload(); }} placeholder="or paste image URL" className="w-40 rounded border border-navy-100 px-2 py-1.5 text-xs outline-none focus:border-gold-400" />
                      </div>
                      <p className="mt-2 text-xs text-navy-400">Large image on the home promo strip (Capital Valley banner).</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">General Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Default Language</label>
                      <select value={ws.defaultLang} onChange={e => setWs({ ...ws, defaultLang: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                        <option value="en">English</option><option value="ur">Urdu</option>
                      </select></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Currency</label>
                      <select value={ws.currency} onChange={e => setWs({ ...ws, currency: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                        <option value="PKR">PKR</option><option value="USD">USD</option>
                      </select></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Theme Color</label>
                      <select value={ws.theme} onChange={e => setWs({ ...ws, theme: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
                        <option value="gold">Gold</option><option value="navy">Navy</option><option value="emerald">Emerald</option>
                      </select></div>
                  </div>
                </div>
                <button onClick={saveWS} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Website Settings</button>
              </div>
            </AdminCard>
          )}

          {/* SEO SETTINGS */}
          {active === 'seo' && (
            <AdminCard title="SEO Settings">
              <p className="mb-4 text-sm text-navy-500">Manage meta titles, descriptions for every page on the site.</p>
              <div className="space-y-4">
                {Object.entries(seo).map(([key, val]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                    <input value={val as string} onChange={e => setSeo({ ...seo, [key]: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                  </div>
                ))}
                <button onClick={saveSEO} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save SEO Settings</button>
              </div>
            </AdminCard>
          )}

          {/* E-STAMP SETTINGS */}
          {active === 'estamp-settings' && (
            <div><AdminCard title="E-Stamp Settings">
              <div className="space-y-6">
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Fee Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-600">Online Fee (Rs.)</label>
                      <input type="number" value={stampFees.online} onChange={e => setStampFees({ ...stampFees, online: Number(e.target.value) })} className="w-full rounded-xl border border-navy-150 bg-white px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-navy-600">Offline Fee (Rs.)</label>
                      <input type="number" value={stampFees.offline} onChange={e => setStampFees({ ...stampFees, offline: Number(e.target.value) })} className="w-full rounded-xl border border-navy-150 bg-white px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Stamp Types</h3>
                  {stampTypes.map((st, i) => (
                    <div key={st.id} className="mb-2 flex flex-wrap gap-2 rounded-lg border border-navy-100 p-3">
                      <input value={st.name} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], name: e.target.value }; setStampTypes(next); }} placeholder="Name" className="w-36 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={st.description} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], description: e.target.value }; setStampTypes(next); }} placeholder="Description" className="w-44 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input type="number" value={st.minValue} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], minValue: Number(e.target.value) }; setStampTypes(next); }} placeholder="Min Value" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input type="number" value={st.maxValue} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], maxValue: Number(e.target.value) }; setStampTypes(next); }} placeholder="Max Value" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input type="number" value={st.govRate} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], govRate: Number(e.target.value) }; setStampTypes(next); }} placeholder="Gov Rate" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={st.source} onChange={e => { const next = [...stampTypes]; next[i] = { ...next[i], source: e.target.value }; setStampTypes(next); }} placeholder="Source" className="w-28 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <button onClick={() => setStampTypes(stampTypes.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setStampTypes([...stampTypes, { id: `stamp-${Date.now()}`, name: '', description: '', minValue: 0, maxValue: 0, category: '', govRate: 0, source: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Stamp Type</button>
                </div>
                <button onClick={() => { saveStampTypes(stampTypes); saveStampFees(stampFees); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save E-Stamp Settings</button>
              </div>
            </AdminCard></div>
          )}

          {/* SERVICES EDITOR */}
          {active === 'services-manager' && (
            <div><AdminCard title="Services Editor">
              <p className="mb-4 text-sm text-navy-500">Every service is editable here — name, description, fee, duration and image. Upload a new image or paste a URL.</p>
              <div className="space-y-4">
                {editableServices.map((svc, i) => (
                  <div key={svc.id} className="rounded-lg border border-navy-100 p-3">
                    <div className="flex flex-wrap gap-2">
                      <input value={svc.name} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], name: e.target.value }; setEditableServices(next); }} placeholder="Name" className="w-48 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={svc.shortName} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], shortName: e.target.value }; setEditableServices(next); }} placeholder="Short Name" className="w-28 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={svc.fee} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], fee: e.target.value }; setEditableServices(next); }} placeholder="Fee" className="w-28 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={svc.duration} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], duration: e.target.value }; setEditableServices(next); }} placeholder="Duration" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={svc.category} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], category: e.target.value }; setEditableServices(next); }} placeholder="Category" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <button onClick={() => setEditableServices(editableServices.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <textarea value={svc.description} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], description: e.target.value }; setEditableServices(next); }} placeholder="Description" rows={2} className="mt-2 w-full rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <div className="mt-2 flex items-center gap-3">
                      {svc.image && <img src={svc.image} alt="" className="h-14 w-20 rounded-lg object-cover border border-navy-100" />}
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
                        <Upload className="h-3 w-3" /> Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const url = await uploadImage(f);
                          if (url) { const next = [...editableServices]; next[i] = { ...next[i], image: url }; setEditableServices(next); }
                          e.target.value = '';
                        }} />
                      </label>
                      <input value={svc.image} onChange={e => { const next = [...editableServices]; next[i] = { ...next[i], image: e.target.value }; setEditableServices(next); }} placeholder="or paste image URL" className="flex-1 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setEditableServices([...editableServices, { id: `svc-${Date.now()}`, name: '', shortName: '', description: '', fee: '', duration: '', icon: '', image: '', category: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Service</button>
                <button onClick={() => { saveManagedServices(editableServices); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Services</button>
              </div>
            </AdminCard></div>
          )}

          {/* LAWYERS EDITOR */}
          {active === 'lawyers-manager' && (
            <div><AdminCard title="Lawyers Editor">
              <div className="space-y-4">
                {editableLawyers.map((lw, i) => (
                  <div key={lw.id} className="flex flex-wrap gap-2 rounded-lg border border-navy-100 p-3">
                    <input value={lw.name} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], name: e.target.value }; setEditableLawyers(next); }} placeholder="Name" className="w-36 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input value={lw.designation} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], designation: e.target.value }; setEditableLawyers(next); }} placeholder="Designation" className="w-32 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input value={lw.specializations?.join(', ') || ''} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], specializations: e.target.value.split(',').map(s => s.trim()) }; setEditableLawyers(next); }} placeholder="Specializations (comma)" className="w-40 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input type="number" value={lw.experience} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], experience: Number(e.target.value) }; setEditableLawyers(next); }} placeholder="Experience" className="w-20 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input type="number" step="0.1" value={lw.rating} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], rating: Number(e.target.value) }; setEditableLawyers(next); }} placeholder="Rating" className="w-20 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input type="number" value={lw.fee} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], fee: Number(e.target.value) }; setEditableLawyers(next); }} placeholder="Fee" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input value={lw.city} onChange={e => { const next = [...editableLawyers]; next[i] = { ...next[i], city: e.target.value }; setEditableLawyers(next); }} placeholder="City" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <button onClick={() => setEditableLawyers(editableLawyers.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setEditableLawyers([...editableLawyers, { id: `law-${Date.now()}`, name: '', designation: '', specializations: [], experience: 0, rating: 0, reviews: 0, fee: 0, city: '', image: '', barCouncil: '', education: '', bio: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Lawyer</button>
                <button onClick={() => { saveManagedLawyers(editableLawyers); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Lawyers</button>
              </div>
            </AdminCard></div>
          )}

          {/* PAGE TEXT EDITOR */}
          {active === 'content-text' && (
            <div><AdminCard title="Page Text Editor">
              <p className="mb-4 text-sm text-navy-500">Edit text content used across the site. Each key maps to a specific text location.</p>
              <div className="space-y-4">
                {Object.entries(pageText).map(([key, val]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-400">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                    <textarea value={val} onChange={e => setPageText({ ...pageText, [key]: e.target.value })} rows={2} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-navy-200 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-navy-600">Add New Key</h4>
                  <div className="flex gap-2">
                    <input value={pageTextNewKey} onChange={e => setPageTextNewKey(e.target.value)} placeholder="Key name (e.g. about_title)" className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <button onClick={() => { if (pageTextNewKey) { setPageText({ ...pageText, [pageTextNewKey]: '' }); setPageTextNewKey(''); } }} className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <button onClick={saveSiteText} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save All Page Text</button>
              </div>
            </AdminCard></div>
          )}

          {/* CITIES / TOWNS */}
          {active === 'cities' && (
            <div><AdminCard title="Cities & Towns">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Cities</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {adminCities.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs border border-navy-100">
                        <span className="text-navy-700">{c}</span>
                        <button onClick={() => setAdminCities(adminCities.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="admin-new-city" onKeyDown={e => { if (e.key === 'Enter') { const el = document.getElementById('admin-new-city') as HTMLInputElement; if (el.value.trim()) { setAdminCities([...adminCities, el.value.trim()]); el.value = ''; } } }} placeholder="Add city" className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <button onClick={() => { const el = document.getElementById('admin-new-city') as HTMLInputElement; if (el.value.trim()) { setAdminCities([...adminCities, el.value.trim()]); el.value = ''; } }} className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Towns</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {adminTowns.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs border border-navy-100">
                        <span className="text-navy-700">{t}</span>
                        <button onClick={() => setAdminTowns(adminTowns.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="admin-new-town" onKeyDown={e => { if (e.key === 'Enter') { const el = document.getElementById('admin-new-town') as HTMLInputElement; if (el.value.trim()) { setAdminTowns([...adminTowns, el.value.trim()]); el.value = ''; } } }} placeholder="Add town" className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    <button onClick={() => { const el = document.getElementById('admin-new-town') as HTMLInputElement; if (el.value.trim()) { setAdminTowns([...adminTowns, el.value.trim()]); el.value = ''; } }} className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <button onClick={() => { saveManagedCities(adminCities); saveManagedTowns(adminTowns); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Cities & Towns</button>
              </div>
            </AdminCard></div>
          )}

          {/* CATEGORIES / SUB-CATEGORIES */}
          {active === 'categories' && (
            <div><AdminCard title="Categories & Sub-Categories">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Categories</h3>
                  {adminCategories.map((cat, i) => (
                    <div key={cat.id} className="mb-2 flex flex-wrap gap-2 rounded-lg border border-navy-100 p-3">
                      <input value={cat.id} onChange={e => { const next = [...adminCategories]; next[i] = { ...next[i], id: e.target.value }; setAdminCategories(next); }} placeholder="ID" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={cat.name} onChange={e => { const next = [...adminCategories]; next[i] = { ...next[i], name: e.target.value }; setAdminCategories(next); }} placeholder="Name" className="w-32 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={cat.icon} onChange={e => { const next = [...adminCategories]; next[i] = { ...next[i], icon: e.target.value }; setAdminCategories(next); }} placeholder="Icon" className="w-24 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={cat.description} onChange={e => { const next = [...adminCategories]; next[i] = { ...next[i], description: e.target.value }; setAdminCategories(next); }} placeholder="Description" className="w-40 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input type="number" value={cat.count} onChange={e => { const next = [...adminCategories]; next[i] = { ...next[i], count: Number(e.target.value) }; setAdminCategories(next); }} placeholder="Count" className="w-20 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <button onClick={() => setAdminCategories(adminCategories.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setAdminCategories([...adminCategories, { id: '', name: '', icon: '', description: '', image: '', count: 0 }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Category</button>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Sub-Categories</h3>
                  {adminSubCategories.map((sc, i) => (
                    <div key={sc.id} className="mb-2 flex flex-wrap gap-2 rounded-lg border border-navy-100 p-3">
                      <input value={sc.id} onChange={e => { const next = [...adminSubCategories]; next[i] = { ...next[i], id: e.target.value }; setAdminSubCategories(next); }} placeholder="ID" className="w-28 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <input value={sc.label} onChange={e => { const next = [...adminSubCategories]; next[i] = { ...next[i], label: e.target.value }; setAdminSubCategories(next); }} placeholder="Label" className="w-32 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                      <select value={sc.categoryId} onChange={e => { const next = [...adminSubCategories]; next[i] = { ...next[i], categoryId: e.target.value }; setAdminSubCategories(next); }} className="rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400">
                        {adminCategories.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                      </select>
                      <button onClick={() => setAdminSubCategories(adminSubCategories.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setAdminSubCategories([...adminSubCategories, { id: '', label: '', categoryId: adminCategories[0]?.id || '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Sub-Category</button>
                </div>
                <button onClick={() => { saveManagedCategories(adminCategories); saveManagedSubCategories(adminSubCategories); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Categories</button>
              </div>
            </AdminCard></div>
          )}

          {/* NAVBAR LINKS */}
          {active === 'navbar' && (
            <div><AdminCard title="Navbar Links">
              <div className="space-y-4">
                {adminNavLinks.map((link, i) => (
                  <div key={i} className="flex flex-wrap gap-2 rounded-lg border border-navy-100 p-3">
                    <input value={link.to} onChange={e => { const next = [...adminNavLinks]; next[i] = { ...next[i], to: e.target.value }; setAdminNavLinks(next); }} placeholder="Route (e.g. /properties)" className="w-40 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <input value={link.label} onChange={e => { const next = [...adminNavLinks]; next[i] = { ...next[i], label: e.target.value }; setAdminNavLinks(next); }} placeholder="Label" className="w-32 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                    <button onClick={() => setAdminNavLinks(adminNavLinks.filter((_, idx) => idx !== i))} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setAdminNavLinks([...adminNavLinks, { to: '', label: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Link</button>
                <button onClick={() => { saveManagedNavbar(adminNavLinks); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Navbar Links</button>
              </div>
            </AdminCard></div>
          )}

          {/* FOOTER EDITOR */}
          {active === 'footer' && (
            <div><AdminCard title="Footer Editor">
              <div className="space-y-6">
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <h3 className="mb-3 font-semibold text-navy-800">Contact Info</h3>
                  <div className="grid gap-3">
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Tagline</label>
                      <input value={adminFooter.tagline} onChange={e => setAdminFooter({ ...adminFooter, tagline: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Email</label>
                      <input value={adminFooter.email} onChange={e => setAdminFooter({ ...adminFooter, email: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Phone</label>
                      <input value={adminFooter.phone} onChange={e => setAdminFooter({ ...adminFooter, phone: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                    <div><label className="mb-1 block text-xs font-semibold text-navy-500">Address</label>
                      <input value={adminFooter.address} onChange={e => setAdminFooter({ ...adminFooter, address: e.target.value })} className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-navy-800">Footer Columns</h3>
                  {adminFooter.columns.map((col, ci) => (
                    <div key={ci} className="mb-4 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <input value={col.title} onChange={e => { const next = { ...adminFooter, columns: [...adminFooter.columns] }; next.columns[ci] = { ...next.columns[ci], title: e.target.value }; setAdminFooter(next); }} placeholder="Column Title" className="w-48 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                        <button onClick={() => { const next = { ...adminFooter, columns: adminFooter.columns.filter((_, idx) => idx !== ci) }; setAdminFooter(next); }} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {col.links.map((link, li) => (
                        <div key={li} className="mb-2 flex flex-wrap gap-2">
                          <input value={link.label} onChange={e => { const next = { ...adminFooter, columns: [...adminFooter.columns] }; next.columns[ci] = { ...next.columns[ci], links: [...next.columns[ci].links] }; next.columns[ci].links[li] = { ...next.columns[ci].links[li], label: e.target.value }; setAdminFooter(next); }} placeholder="Label" className="w-36 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                          <input value={link.to} onChange={e => { const next = { ...adminFooter, columns: [...adminFooter.columns] }; next.columns[ci] = { ...next.columns[ci], links: [...next.columns[ci].links] }; next.columns[ci].links[li] = { ...next.columns[ci].links[li], to: e.target.value }; setAdminFooter(next); }} placeholder="Route" className="w-36 rounded border border-navy-100 px-2 py-1 text-xs outline-none focus:border-gold-400" />
                          <button onClick={() => { const next = { ...adminFooter, columns: [...adminFooter.columns] }; next.columns[ci] = { ...next.columns[ci], links: next.columns[ci].links.filter((_, idx) => idx !== li) }; setAdminFooter(next); }} className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <button onClick={() => { const next = { ...adminFooter, columns: [...adminFooter.columns] }; next.columns[ci] = { ...next.columns[ci], links: [...next.columns[ci].links, { label: '', to: '' }] }; setAdminFooter(next); }} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Link</button>
                    </div>
                  ))}
                  <button onClick={() => { setAdminFooter({ ...adminFooter, columns: [...adminFooter.columns, { title: '', links: [] }] }); }} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> Add Column</button>
                </div>
                <button onClick={() => { saveManagedFooter(adminFooter); showSaved(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> Save Footer</button>
              </div>
            </AdminCard></div>
          )}

          {active === 'branches' && <BranchesAdmin />}

          {active === 'dc-rates' && <DcRatesAdmin />}

          {active === 'email' && <EmailsAdmin />}

          {active === 'site-media' && <SiteMediaAdmin />}

          {active === 'verifications' && (
            <div><AdminCard title="Verifications / Property Approvals">
              <p className="mb-4 text-sm text-navy-500">Review pending properties and approve, reject, or mark them verified.</p>
              <div className="space-y-3">
                {allProps.map((p) => {
                  const ov = getPropOverride(p.id);
                  const ovVerified = ov.verified ?? p.verified;
                  const ovFeatured = ov.featured ?? (p as any).featured ?? false;
                  const ovPremium = ov.premium ?? (p as any).premium ?? false;
                  const ovStatus = ov.status ?? p.status ?? 'pending';
                  return (
                    <div key={`${p.source || 'prop'}-${p.id}`} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                      <img src={p.images?.[0] || '/images/placeholder.jpg'} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-navy-800 truncate">{p.title}</p>
                        <p className="text-xs text-navy-400">{p.area}, {p.city} · Rs {p.price?.toLocaleString()} · by {p.seller?.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ovVerified && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>}
                          {ovFeatured && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-medium text-gold-700">Featured</span>}
                          {ovPremium && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">Premium</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${ovStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : ovStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{ovStatus}</span>
                        <button onClick={() => setStatusModalProp(p)} className="inline-flex items-center gap-1 rounded-lg bg-gold-400 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-gold-300"><ShieldCheck className="h-3.5 w-3.5" /> Status / Verify</button>
                        <button onClick={() => setStatus(p.id, 'approved')} className={`grid h-8 w-8 place-items-center rounded-lg ${ovStatus === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'} hover:brightness-90`} title="Approve"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setStatus(p.id, 'pending')} className={`grid h-8 w-8 place-items-center rounded-lg ${ovStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'} hover:brightness-90`} title="Pending"><Clock className="h-4 w-4" /></button>
                        <button onClick={() => setStatus(p.id, 'rejected')} className={`grid h-8 w-8 place-items-center rounded-lg ${ovStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'} hover:brightness-90`} title="Reject"><X className="h-4 w-4" /></button>
                        <button onClick={() => setVerify(p.id, !ovVerified)} className={`grid h-8 w-8 place-items-center rounded-lg ${ovVerified ? 'bg-emerald-600 text-white' : 'bg-navy-50 text-navy-500'} hover:brightness-90`} title={ovVerified ? 'Unverify' : 'Verify'}><ShieldCheck className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminCard></div>
          )}

          {active === 'messages' && <MessagesAdmin />}
          {active === 'notifications' && <NotificationsAdmin />}
          {active === 'reports' && <ReportsAdmin />}
          {active === 'logs' && <LogsAdmin />}
        </div>
      </div>
      {statusModalProp && (
        <PropertyStatusModal
          prop={statusModalProp}
          onClose={() => setStatusModalProp(null)}
          onRefresh={refreshProps}
        />
      )}
    </div>
    )
  );
}

function Widget({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: string; trend: string; color: string }) {
  const colors: Record<string, string> = { navy: 'bg-navy-50 text-navy-700', gold: 'bg-gold-50 text-gold-600', amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="card-3d border border-navy-100/60 p-4">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[color]}`}>{icon}</span>
        <span className="text-xs font-medium text-navy-400">{trend}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-navy-800">{value}</div>
      <div className="text-xs text-navy-500">{label}</div>
    </div>
  );
}

function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-serif text-lg font-bold text-navy-800">{title}</h2>
      {children}
    </div>
  );
}

function DcRatesAdmin() {
  const [rates, setRates] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ city: '', zila: '', tehsil: '', mouzaArea: '', propertyType: 'Residential', locationStatus: 'Urban', dcRate: '' });
  const [csvText, setCsvText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const loadRates = async () => {
    setLoading(true);
    const res = await fetchApi({ action: 'get-dc-rates' });
    if (res.success) setRates(res.rates);
    setLoading(false);
  };

  const saveRate = async () => {
    const payload = { ...form, dcRate: parseFloat(form.dcRate) || 0 };
    if (editId) {
      await fetchApi({ action: 'update-dc-rate', id: editId, ...payload });
    } else {
      await fetchApi({ action: 'add-dc-rate', ...payload });
    }
    setShowForm(false);
    setEditId(null);
    setForm({ city: '', zila: '', tehsil: '', mouzaArea: '', propertyType: 'Residential', locationStatus: 'Urban', dcRate: '' });
    loadRates();
  };

  const deleteRate = async (id: number) => {
    if (!confirm('Delete this rate?')) return;
    await fetchApi({ action: 'delete-dc-rate', id });
    loadRates();
  };

  const editRate = (r: Record<string, any>) => {
    setForm({ city: r.city || '', zila: r.zila, tehsil: r.tehsil, mouzaArea: r.mouza_area, propertyType: r.property_type, locationStatus: r.location_status, dcRate: String(r.dc_rate) });
    setEditId(r.id);
    setShowForm(true);
  };

  const resetForm = () => setForm({ city: '', zila: '', tehsil: '', mouzaArea: '', propertyType: 'Residential', locationStatus: 'Urban', dcRate: '' });

  const handleBulkImport = async () => {
    const lines = csvText.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setImportMsg('CSV must have header + data rows'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
    const res = await fetchApi({ action: 'bulk-import-dc-rates', rows });
    if (res.success) {
      setImportMsg(`Imported ${res.imported} of ${rows.length} rows`);
      loadRates();
    }
    setCsvText('');
  };

  const filtered = rates.filter(r =>
    !search || r.city?.toLowerCase().includes(search.toLowerCase()) || r.zila.toLowerCase().includes(search.toLowerCase()) || r.tehsil.toLowerCase().includes(search.toLowerCase()) || r.mouza_area.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { loadRates(); }, []);

  const PROP_TYPES = ['Residential', 'Commercial', 'Agricultural'];

  return (
    <div><AdminCard title="DC Rates Manager">
      {importMsg && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{importMsg}</div>}
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by City / Zila / Tehsil / Area..." className="flex-1 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2 text-sm outline-none focus:border-gold-400 min-w-[200px]" />
        <button onClick={() => { setShowForm(true); setEditId(null); resetForm(); }} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300">
          <Plus className="h-4 w-4" /> Add Rate
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <h3 className="mb-3 font-semibold text-navy-800">{editId ? 'Edit DC Rate' : 'Add New DC Rate'}</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City (e.g. Lahore)" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            <input value={form.zila} onChange={e => setForm({...form, zila: e.target.value})} placeholder="Zila / District" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            <input value={form.tehsil} onChange={e => setForm({...form, tehsil: e.target.value})} placeholder="Tehsil" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            <input value={form.mouzaArea} onChange={e => setForm({...form, mouzaArea: e.target.value})} placeholder="Area / Mouza" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            <select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
              {PROP_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
            <select value={form.locationStatus} onChange={e => setForm({...form, locationStatus: e.target.value})} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400">
              <option value="Urban">Urban</option><option value="Rural">Rural</option>
            </select>
            <input value={form.dcRate} onChange={e => setForm({...form, dcRate: e.target.value})} type="number" placeholder="Price per Marla (Rs.)" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
          </div>
          <p className="mt-2 text-xs text-navy-400">City, Zila, Tehsil aur Area sab alag-alag box mein add karein. Price sirf per Marla enter karein — calculator khud size ke hisaab se multiply karega.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={saveRate} className="flex items-center gap-1 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> {editId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-lg border border-navy-200 px-4 py-2 text-sm text-navy-600 hover:bg-navy-50">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {loading ? <div className="text-center py-8 text-navy-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-8 text-navy-400">No rates found</div>
        ) : filtered.map(r => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-navy-50 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-navy-800">{r.city || r.zila} &gt; {r.zila} &gt; {r.tehsil} &gt; {r.mouza_area}</p>
              <p className="text-xs text-navy-400">{r.property_type} | {r.location_status} | Rs. {Number(r.dc_rate).toLocaleString()} / Marla | Updated: {new Date(r.last_updated).toLocaleDateString()}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => editRate(r)} className="grid h-8 w-8 place-items-center rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100"><Edit3 className="h-4 w-4" /></button>
              <button onClick={() => deleteRate(r.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Bulk Import */}
      <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-navy-800"><Upload className="h-4 w-4" /> Bulk CSV Import</h3>
        <p className="mb-2 text-xs text-navy-400">CSV columns: city,zila,tehsil,mouzaArea,propertyType,locationStatus,dcRate (per Marla)</p>
        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={4} placeholder="city,zila,tehsil,mouzaArea,propertyType,locationStatus,dcRate&#10;Lahore,Lahore,Lahore City,Niaz Baig Thokar,Residential,Urban,15000&#10;Lahore,Lahore,Lahore City,Mansoora,Residential,Urban,18000" className="w-full rounded-lg border border-navy-100 px-3 py-2 text-xs outline-none focus:border-gold-400" />
        <button onClick={handleBulkImport} disabled={!csvText.trim()} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"><Upload className="h-4 w-4" /> Import CSV</button>
      </div>
    </AdminCard></div>
  );
}

function PropertyStatusModal({ prop, onClose, onRefresh }: { prop: any; onClose: () => void; onRefresh: () => void }) {
  const ov = getPropOverride(prop.id);
  const [status, setStatus] = useState<'approved' | 'pending' | 'rejected'>(ov.status ?? prop.status ?? 'pending');
  const [verified, setVerified] = useState<boolean>(ov.verified ?? prop.verified ?? false);
  const [featured, setFeatured] = useState<boolean>(ov.featured ?? prop.featured ?? false);
  const [premium, setPremium] = useState<boolean>(ov.premium ?? prop.seller?.premium ?? false);
  const [adminNote, setAdminNote] = useState('');

  const handleSave = () => {
    setPropOverride(prop.id, { status, verified, featured, premium });
    if (prop.source === 'custom') {
      updateCustomProperty(prop.id, { status, verified, featured });
    }
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-navy-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-navy-100 pb-3">
          <h3 className="font-serif text-lg font-bold text-navy-800 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold-500" /> Property Status & Verification
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property preview */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-navy-50/70 p-3">
          <img src={prop.images?.[0] || '/images/placeholder.jpg'} alt="" onError={onImgError} className="h-16 w-20 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-navy-800 text-sm truncate">{prop.title}</h4>
            <p className="text-xs text-navy-500">{prop.area}, {prop.city} · Rs {prop.price?.toLocaleString()}</p>
            <p className="text-xs text-navy-500">Seller: <strong>{prop.seller?.name}</strong> ({prop.seller?.phone})</p>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">Select Approval Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                  status === 'approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-navy-100 bg-white text-navy-600 hover:bg-navy-50'
                }`}
              >
                <Check className="h-5 w-5 text-emerald-600" />
                Approve (منظور)
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                  status === 'pending' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' : 'border-navy-100 bg-white text-navy-600 hover:bg-navy-50'
                }`}
              >
                <Clock className="h-5 w-5 text-amber-600" />
                Pending (زیرِ غور)
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                  status === 'rejected' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-navy-100 bg-white text-navy-600 hover:bg-navy-50'
                }`}
              >
                <X className="h-5 w-5 text-rose-600" />
                Reject (مسترد)
              </button>
            </div>
          </div>

          {/* Badges / Verification Toggles */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">Verification & Badges</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between rounded-xl border border-navy-100 p-3 hover:bg-navy-50/50 cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-navy-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified Property Badge (تصدیق شدہ)
                </span>
                <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="h-5 w-5 rounded accent-emerald-600" />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-navy-100 p-3 hover:bg-navy-50/50 cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-navy-800">
                  <Award className="h-4 w-4 text-gold-500" /> Featured Listing Badge (خاص اشتہار)
                </span>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="h-5 w-5 rounded accent-gold-500" />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-navy-100 p-3 hover:bg-navy-50/50 cursor-pointer">
                <span className="flex items-center gap-2 text-sm font-medium text-navy-800">
                  <DollarSign className="h-4 w-4 text-purple-600" /> Premium Seller Badge (پریمیم سیلر)
                </span>
                <input type="checkbox" checked={premium} onChange={e => setPremium(e.target.checked)} className="h-5 w-5 rounded accent-purple-600" />
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-navy-500 mb-1">Admin Verification Notes / Remarks</label>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="e.g. Documents verified, plot location confirmed..."
              rows={2}
              className="w-full rounded-xl border border-navy-100 px-3 py-2 text-xs outline-none focus:border-gold-400"
            />
          </div>
        </div>

        {/* Modal footer actions */}
        <div className="mt-6 flex justify-end gap-2 border-t border-navy-100 pt-4">
          <button onClick={onClose} className="rounded-xl border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
            Cancel
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300 shadow-sm">
            <Save className="h-4 w-4" /> Save & Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

function SiteMediaAdmin() {
  const { lang } = useLang();
  const [siteLogo, setSiteLogo] = useState(() => localStorage.getItem('site_logo') || '/logo-square.png');
  const [siteLogoDark, setSiteLogoDark] = useState(() => localStorage.getItem('site_logo_dark') || '/logo-horizontal.png');
  const [heroPromoImg, setHeroPromoImg] = useState(() => localStorage.getItem('hero_promo_image') || '/images/cv-cover.jpg');
  const [homeHeroBg, setHomeHeroBg] = useState(() => localStorage.getItem('homepage_hero_bg') || '');
  const [saved, setSaved] = useState(false);

  const [categories, setCategories] = useState<ManagedCategory[]>(() => getManagedCategories());
  const [services, setServices] = useState<EditableService[]>(() => getManagedServices());

  const handleSaveAll = () => {
    localStorage.setItem('site_logo', siteLogo);
    localStorage.setItem('site_logo_dark', siteLogoDark);
    localStorage.setItem('hero_promo_image', heroPromoImg);
    if (homeHeroBg) localStorage.setItem('homepage_hero_bg', homeHeroBg);
    saveManagedCategories(categories);
    saveManagedServices(services);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <AdminCard title={lang === 'ur' ? 'ویب سائٹ میڈیا اور تمام تصاویر' : 'Site Media & Image Assets'}>
        <p className="mb-6 text-sm text-navy-500">
          Upload or update any image across the entire site — Logos, Banners, Category Images, Service Images & Banners.
        </p>

        {saved && (
          <div className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm font-semibold text-emerald-800 animate-fade-in">
            ✓ All image assets saved successfully!
          </div>
        )}

        <div className="space-y-8">
          <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-5">
            <h3 className="mb-4 font-serif text-base font-bold text-navy-800">1. Website Logos & Branding</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 border border-navy-100">
                <label className="mb-2 block text-xs font-bold text-navy-700 uppercase">Main Logo (Square / Primary)</label>
                <div className="flex items-center gap-4">
                  <img src={siteLogo} alt="Logo" className="h-16 w-16 rounded-xl border border-navy-200 bg-white object-contain p-1 shadow-sm" />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                      <Upload className="h-3.5 w-3.5" /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) setSiteLogo(url);
                        e.target.value = '';
                      }} />
                    </label>
                    <input value={siteLogo} onChange={e => setSiteLogo(e.target.value)} placeholder="Image URL..." className="w-full rounded-lg border border-navy-100 px-2.5 py-1 text-xs outline-none focus:border-gold-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 border border-navy-100">
                <label className="mb-2 block text-xs font-bold text-navy-700 uppercase">Horizontal / Header Logo</label>
                <div className="flex items-center gap-4">
                  <img src={siteLogoDark} alt="Horizontal Logo" className="h-16 w-28 rounded-xl border border-navy-200 bg-white object-contain p-1 shadow-sm" />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                      <Upload className="h-3.5 w-3.5" /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) setSiteLogoDark(url);
                        e.target.value = '';
                      }} />
                    </label>
                    <input value={siteLogoDark} onChange={e => setSiteLogoDark(e.target.value)} placeholder="Image URL..." className="w-full rounded-lg border border-navy-100 px-2.5 py-1 text-xs outline-none focus:border-gold-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-5">
            <h3 className="mb-4 font-serif text-base font-bold text-navy-800">2. Hero & Banner Images</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4 border border-navy-100">
                <label className="mb-2 block text-xs font-bold text-navy-700 uppercase">Capital Valley Banner Image</label>
                <div className="flex items-center gap-4">
                  <img src={heroPromoImg} alt="Promo Banner" className="h-20 w-32 rounded-xl border border-navy-200 object-cover shadow-sm" />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                      <Upload className="h-3.5 w-3.5" /> Upload Banner
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) setHeroPromoImg(url);
                        e.target.value = '';
                      }} />
                    </label>
                    <input value={heroPromoImg} onChange={e => setHeroPromoImg(e.target.value)} placeholder="Image URL..." className="w-full rounded-lg border border-navy-100 px-2.5 py-1 text-xs outline-none focus:border-gold-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 border border-navy-100">
                <label className="mb-2 block text-xs font-bold text-navy-700 uppercase">Homepage Hero Background Image</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-32 rounded-xl border border-navy-200 bg-navy-800 flex items-center justify-center overflow-hidden">
                    {homeHeroBg ? <img src={homeHeroBg} alt="Hero Bg" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gold-400" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                      <Upload className="h-3.5 w-3.5" /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) setHomeHeroBg(url);
                        e.target.value = '';
                      }} />
                    </label>
                    <input value={homeHeroBg} onChange={e => setHomeHeroBg(e.target.value)} placeholder="Image URL..." className="w-full rounded-lg border border-navy-100 px-2.5 py-1 text-xs outline-none focus:border-gold-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-5">
            <h3 className="mb-4 font-serif text-base font-bold text-navy-800">3. Category Card Images</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-3 rounded-xl bg-white p-3 border border-navy-100">
                  <img src={cat.image || '/images/placeholder.jpg'} alt="" className="h-16 w-20 rounded-lg object-cover border border-navy-100" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-semibold text-xs text-navy-800">{cat.name}</p>
                    <input
                      value={cat.image}
                      onChange={e => {
                        const next = [...categories];
                        next[idx] = { ...next[idx], image: e.target.value };
                        setCategories(next);
                      }}
                      placeholder="Image URL..."
                      className="w-full rounded border border-navy-100 px-2 py-1 text-[11px] outline-none focus:border-gold-400"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-navy-50 px-2 py-1 text-[10px] font-medium text-navy-700 hover:bg-navy-100">
                      <Upload className="h-3 w-3" /> Change
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) {
                          const next = [...categories];
                          next[idx] = { ...next[idx], image: url };
                          setCategories(next);
                        }
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-5">
            <h3 className="mb-4 font-serif text-base font-bold text-navy-800">4. Service Card Images</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc, idx) => (
                <div key={svc.id} className="flex items-center gap-3 rounded-xl bg-white p-3 border border-navy-100">
                  <img src={svc.image || '/images/placeholder.jpg'} alt="" className="h-14 w-20 rounded-lg object-cover border border-navy-100 shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-semibold text-xs text-navy-800 truncate">{svc.name}</p>
                    <input
                      value={svc.image}
                      onChange={e => {
                        const next = [...services];
                        next[idx] = { ...next[idx], image: e.target.value };
                        setServices(next);
                      }}
                      placeholder="Image URL..."
                      className="w-full rounded border border-navy-100 px-2 py-1 text-[11px] outline-none focus:border-gold-400"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-navy-50 px-2 py-1 text-[10px] font-medium text-navy-700 hover:bg-navy-100">
                      <Upload className="h-3 w-3" /> Change
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) {
                          const next = [...services];
                          next[idx] = { ...next[idx], image: url };
                          setServices(next);
                        }
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-8 py-3.5 font-bold text-navy-900 transition hover:bg-gold-300 shadow-gold"
          >
            <Save className="h-5 w-5" /> Save All Site Media Assets
          </button>
        </div>
      </AdminCard>
    </div>
  );
}

function EmailsAdmin() {
  const { lang } = useLang();
  const [subTab, setSubTab] = useState<'inbox' | 'compose'>('inbox');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [logs, setLogs] = useState<EmailLog[]>(() => getEmailLogs());
  const inquiries = getInquiries();

  const refreshLogs = () => {
    setLogs(getEmailLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      setSendResult(lang === 'ur' ? 'براہ کرم تمام خانے (To, Subject, Message) مکمل پر کریں' : 'Please fill out all fields (To, Subject, Message)');
      return;
    }
    setSending(true);
    setSendResult('');
    const ok = await sendGeneralEmail({ to: to.trim(), subject: subject.trim(), message: message.trim() });
    if (ok) {
      setSendResult(lang === 'ur' ? '✓ ای میل کامیابی سے بھیج دی گئی ہے!' : '✓ Email sent successfully!');
      setTo('');
      setSubject('');
      setMessage('');
    } else {
      setSendResult(lang === 'ur' ? 'ای میل بھیجنے میں ناکامی' : 'Failed to send email');
    }
    setSending(false);
    refreshLogs();
  };


  const handleReply = (recipientEmail: string, initialSubject: string) => {
    setTo(recipientEmail);
    setSubject(`Re: ${initialSubject}`);
    setSubTab('compose');
  };

  return (
    <div>
      <AdminCard title={lang === 'ur' ? 'ای میل مینجمنٹ' : 'Email & Inbox Management'}>
        <div className="mb-6 flex gap-2 border-b border-navy-100 pb-3">
          <button
            onClick={() => setSubTab('inbox')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              subTab === 'inbox' ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
            }`}
          >
            📬 {lang === 'ur' ? 'ان باکس اور لاگز' : 'Inbox & Sent Logs'} ({logs.length + inquiries.length})
          </button>
          <button
            onClick={() => setSubTab('compose')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              subTab === 'compose' ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
            }`}
          >
            ✉️ {lang === 'ur' ? 'نیا ای میل بھیجیں' : 'Compose Email'}
          </button>
        </div>

        {subTab === 'compose' ? (
          <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-5 space-y-4">
            <h3 className="font-semibold text-navy-800">{lang === 'ur' ? 'ای میل بھیجیں' : 'Send Email / Reply'}</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-500">{lang === 'ur' ? 'وصول کنندہ' : 'To (Recipient Email)'}</label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 bg-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-500">{lang === 'ur' ? 'عنوان' : 'Subject'}</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder={lang === 'ur' ? 'ای میل کا عنوان' : 'Email subject'} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 bg-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-500">{lang === 'ur' ? 'پیغام' : 'Message'}</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder={lang === 'ur' ? 'یہاں پیغام لکھیں...' : 'Write your message here...'} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 bg-white" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSend} disabled={sending || !to || !subject || !message} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300 disabled:opacity-50 shadow-sm">
                <Send className="h-4 w-4" /> {sending ? (lang === 'ur' ? 'بھیج رہا ہے...' : 'Sending...') : (lang === 'ur' ? 'ای میل بھیجیں' : 'Send Email')}
              </button>
            </div>
            {sendResult && <p className={`text-sm font-medium ${sendResult.includes('success') || sendResult.includes('کامیاب') ? 'text-emerald-600' : 'text-rose-600'}`}>{sendResult}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-navy-800 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold-500" /> Property & Contact Inquiries ({inquiries.length})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="rounded-xl border border-navy-100 bg-white p-3.5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-navy-800 text-sm">{inq.name} <span className="text-xs font-normal text-navy-500">({inq.email} · {inq.phone})</span></p>
                          <p className="text-xs font-semibold text-gold-600 mt-0.5">Property: {inq.propertyTitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-navy-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                          <button onClick={() => handleReply(inq.email, inq.propertyTitle)} className="inline-flex items-center gap-1 rounded-lg bg-gold-400/20 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-gold-400">
                            <Send className="h-3 w-3" /> Reply
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 rounded-lg bg-navy-50 p-2.5 text-xs text-navy-700">{inq.message || 'No message provided'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-navy-800">{lang === 'ur' ? 'تمام ای میل لاگز' : 'Sent Email Logs'}</h3>
                <button onClick={refreshLogs} className="text-xs font-semibold text-gold-600 hover:text-gold-500">{lang === 'ur' ? 'ریفریش کریں' : 'Refresh'}</button>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-6 text-navy-400">{lang === 'ur' ? 'کوئی لاگز نہیں' : 'No sent email logs yet'}</div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-navy-50 bg-white p-3.5 text-xs shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-navy-800">{log.recipient}</span>
                          <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-navy-600">{log.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{log.status}</span>
                          <span className="text-[11px] text-navy-400">{new Date(log.sent_at).toLocaleDateString()}</span>
                          <button onClick={() => { deleteEmailLog(log.id); refreshLogs(); }} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <p className="mt-1 font-semibold text-navy-700">{log.subject}</p>
                      <p className="mt-1 text-navy-500 line-clamp-2 whitespace-pre-wrap">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function BranchesAdmin() {
  const { lang } = useLang();
  const BRANCH_KEY = 'branch_addresses';
  const [branches, setBranches] = useState<Branch[]>(() => {
    const d = localStorage.getItem(BRANCH_KEY);
    return d ? JSON.parse(d) : JSON.parse(JSON.stringify(DEFAULT_BRANCHES));
  });
  const [savedMsg, setSavedMsg] = useState('');

  const updateBranch = (i: number, field: string, val: string) => {
    const next = [...branches];
    next[i] = { ...next[i], [field]: val };
    setBranches(next);
  };

  const save = () => {
    localStorage.setItem(BRANCH_KEY, JSON.stringify(branches));
    setSavedMsg(lang === 'ur' ? 'محفوظ ہو گیا' : 'Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  return (
    <div><AdminCard title={lang === 'ur' ? 'برانچ ایڈریس اور رابطہ نمبر' : 'Branches & Contact Numbers'}>
      {savedMsg && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{savedMsg}</div>}

      {/* Branches */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-navy-800">{lang === 'ur' ? 'برانچز' : 'Branches'}</h3>
        {branches.map((b, i) => (
          <div key={i} className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-navy-700">{lang === 'ur' ? `برانچ ${i + 1}` : `Branch ${i + 1}`}</span>
              <button onClick={() => { if (branches.length <= 1) return; setBranches(branches.filter((_, idx) => idx !== i)); }} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" disabled={branches.length <= 1}><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={b.label} onChange={e => updateBranch(i, 'label', e.target.value)} placeholder={lang === 'ur' ? 'برانچ لیبل (مثلاً ہیڈ آفس)' : 'Branch Label (e.g. Head Office)'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.name} onChange={e => updateBranch(i, 'name', e.target.value)} placeholder={lang === 'ur' ? 'برانچ کا نام' : 'Branch Name'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.phone} onChange={e => updateBranch(i, 'phone', e.target.value)} placeholder={lang === 'ur' ? 'فون نمبر' : 'Phone'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.phone2 || ''} onChange={e => updateBranch(i, 'phone2', e.target.value)} placeholder={lang === 'ur' ? 'دوسرا فون نمبر' : 'Second Phone (optional)'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.whatsapp} onChange={e => updateBranch(i, 'whatsapp', e.target.value)} placeholder="WhatsApp" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.whatsappName || ''} onChange={e => updateBranch(i, 'whatsappName', e.target.value)} placeholder={lang === 'ur' ? 'واٹس ایپ کا نام (اختیاری)' : 'WhatsApp Name (optional)'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.contactPerson || ''} onChange={e => updateBranch(i, 'contactPerson', e.target.value)} placeholder={lang === 'ur' ? 'رابطہ شخص کا نام' : 'Contact Person Name'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.email} onChange={e => updateBranch(i, 'email', e.target.value)} placeholder="Email" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.maps} onChange={e => updateBranch(i, 'maps', e.target.value)} placeholder="Google Maps URL" className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <input value={b.hours} onChange={e => updateBranch(i, 'hours', e.target.value)} placeholder={lang === 'ur' ? 'اوقات کار' : 'Office Hours'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
              <textarea value={b.address} onChange={e => updateBranch(i, 'address', e.target.value)} rows={2} placeholder={lang === 'ur' ? 'پتہ' : 'Address'} className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
          </div>
        ))}
        <button onClick={() => setBranches([...branches, { label: '', name: '', address: '', phone: '', phone2: '', email: '', whatsapp: '', whatsappName: '', maps: '', hours: '', contactPerson: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-navy-200 px-4 py-2 text-xs font-medium text-navy-600 hover:bg-navy-50"><Plus className="h-3 w-3" /> {lang === 'ur' ? 'برانچ شامل کریں' : 'Add Branch'}</button>
      </div>

      <div className="mt-6">
        <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> {lang === 'ur' ? 'محفوظ کریں' : 'Save'}</button>
      </div>
    </AdminCard></div>
  );
}

function MessagesAdmin() {
  const [inquiries, setInquiries] = useState(() => getInquiries());
  const refresh = () => setInquiries(getInquiries());
  return (
    <div><AdminCard title="Messages / Inquiries">
      <p className="mb-4 text-sm text-navy-500">Inquiries sent from property detail pages.</p>
      <div className="space-y-3">
        {inquiries.length === 0 && <div className="py-8 text-center text-sm text-navy-400">No inquiries yet</div>}
        {inquiries.map((inq) => (
          <div key={inq.id} className={`rounded-xl border p-3 ${inq.read ? 'border-navy-50 bg-white' : 'border-gold-300 bg-gold-50/40'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-100 font-semibold text-navy-700">{inq.name.charAt(0).toUpperCase()}</span>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{inq.name} <span className="font-normal text-navy-400">({inq.phone})</span></p>
                  <p className="text-xs text-navy-500">Re: {inq.propertyTitle} · {new Date(inq.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {!inq.read && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-semibold text-navy-800">NEW</span>}
            </div>
            {inq.email && <p className="mt-2 text-xs text-navy-500">Email: {inq.email}</p>}
            {inq.message && <p className="mt-1 text-sm text-navy-600">{inq.message}</p>}
            <div className="mt-2 flex gap-2">
              {!inq.read && <button onClick={() => { markInquiryRead(inq.id); refresh(); }} className="rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800">Mark as read</button>}
              {inq.phone && <a href={`tel:${inq.phone}`} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50"><Phone className="h-3 w-3 inline mr-1" />Call</a>}
            </div>
          </div>
        ))}
      </div>
    </AdminCard></div>
  );
}

function NotificationsAdmin() {
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; read: boolean; type: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_notifications') || '[]'); } catch { return []; }
  });
  const save = (next: any[]) => { setNotifications(next); localStorage.setItem('admin_notifications', JSON.stringify(next)); };
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div><AdminCard title={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}>
      <p className="mb-4 text-sm text-navy-500">System notifications for new orders, inquiries and registrations.</p>
      <div className="space-y-3">
        {notifications.length === 0 && <div className="py-8 text-center text-sm text-navy-400">No notifications yet. They appear when users register, submit ads or place orders.</div>}
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 ${n.read ? 'border-navy-50' : 'border-gold-300 bg-gold-50/40'}`}>
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600"><Bell className="h-4 w-4" /></span>
            <div className="flex-1">
              <p className="text-sm text-navy-700">{n.text}</p>
              <p className="text-xs text-navy-400">{n.time}</p>
            </div>
            {!n.read && <button onClick={() => save(notifications.map(x => x.id === n.id ? { ...x, read: true } : x))} className="text-xs font-medium text-gold-600 hover:text-gold-700">Mark read</button>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => { const now = new Date().toLocaleString(); save([{ id: `n${Date.now()}`, text: 'Test notification from admin panel', time: now, read: false, type: 'test' }, ...notifications]); }} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">+ Add test notification</button>
        <button onClick={() => save(notifications.filter(n => !n.read).map(n => ({ ...n, read: true })))} disabled={unread === 0} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50 disabled:opacity-50">Mark all read</button>
      </div>
    </AdminCard></div>
  );
}

function ReportsAdmin() {
  const custom = getCustomProperties();
  const orders = getOrders();
  const inquiries = getInquiries();
  const users = getAllUsers();
  const pending = custom.filter(p => { const ov = getPropOverride(p.id); return (ov.status ?? p.status ?? 'pending') === 'pending'; }).length;
  const revenue = orders.reduce((sum, o) => sum + (parseInt(o.orderAmount?.replace(/[^0-9]/g, '')) || 0), 0);
  const card = (label: string, value: string, color: string, sub: string) => (
    <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
      <p className="text-xs font-medium text-navy-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-navy-400">{sub}</p>
    </div>
  );
  return (
    <div><AdminCard title="Reports & Analytics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {card('Total Users', String(users.length), 'text-navy-800', 'Registered accounts')}
        {card('Total Properties', String(custom.length), 'text-navy-800', 'Custom listings added')}
        {card('Pending Approvals', String(pending), 'text-amber-600', 'Awaiting admin review')}
        {card('Total Inquiries', String(inquiries.length), 'text-navy-800', 'Property inquiries received')}
        {card('Total Orders', String(orders.length), 'text-navy-800', 'Services / e-stamp bookings')}
        {card('Order Value', `Rs ${revenue.toLocaleString()}`, 'text-emerald-600', 'Sum of order amounts')}
      </div>
      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-navy-800">Recent Orders</h3>
        <div className="space-y-2">
          {orders.length === 0 && <div className="py-6 text-center text-sm text-navy-400">No orders yet</div>}
          {orders.slice(0, 10).map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-navy-50 p-3">
              <div>
                <p className="text-sm font-medium text-navy-800">{o.orderRef} — {o.orderType}</p>
                <p className="text-xs text-navy-400">{o.name} · {o.orderDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-800">{o.orderAmount}</p>
                <span className="text-xs font-medium text-navy-500">{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminCard></div>
  );
}

function LogsAdmin() {
  const [logs, setLogs] = useState<{ id: string; time: string; action: string; user: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_logs') || '[]'); } catch { return []; }
  });
  const log = (action: string, user: string) => {
    setLogs((prev) => [{ id: `l${Date.now()}`, time: new Date().toLocaleString(), action, user }, ...prev].slice(0, 200));
  };
  const saveLogs = (next: any[]) => { setLogs(next); localStorage.setItem('admin_logs', JSON.stringify(next)); };
  return (
    <div><AdminCard title="Audit Logs">
      <p className="mb-4 text-sm text-navy-500">Actions performed in the admin panel are recorded here.</p>
      <div className="space-y-2">
        {logs.length === 0 && <div className="py-8 text-center text-sm text-navy-400">No logs recorded yet.</div>}
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-lg border border-navy-50 px-3 py-2 text-sm">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-500"><FileText className="h-3.5 w-3.5" /></span>
            <span className="flex-1 text-navy-700">{l.action}</span>
            <span className="text-xs text-navy-400">{l.user}</span>
            <span className="text-xs text-navy-400">{l.time}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => log('Opened audit logs', 'Admin')} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">+ Add log entry</button>
        <button onClick={() => saveLogs([])} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Clear logs</button>
      </div>
    </AdminCard></div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isDbMode()) {
        const res = await dbLogin(email, password);
        if (!res.success) {
          const u = loginUser(email, password);
          if (!u) { setError(res.error || (lang === 'ur' ? 'غلط ای میل یا پاس ورڈ' : 'Invalid email or password')); setLoading(false); return; }
        } else {
          await syncAll();
        }
      } else {
        const user = loginUser(email, password);
        if (!user) { setError(lang === 'ur' ? 'غلط ای میل یا پاس ورڈ' : 'Invalid email or password'); setLoading(false); return; }
      }
      const u = getCurrentUser();
      if (!u || (u.role !== 'super_admin' && u.role !== 'admin')) {
        setError(lang === 'ur' ? 'رسائی سے انکار — صرف ایڈمن' : 'Access denied — admin only');
        setLoading(false);
        return;
      }
      setLoading(false);
      onLogin();
    } catch {
      setError(lang === 'ur' ? 'غلط ای میل یا پاس ورڈ' : 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="scene-3d grid min-h-screen place-items-center bg-navy-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-3d tilt-3d rounded-3xl border border-navy-100 bg-white p-8 shadow-card-hover">
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-400 text-navy-800">
              <LayoutDashboard className="h-7 w-7" />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{lang === 'ur' ? 'ایڈمن لاگ ان' : 'Admin Login'}</h1>
            <p className="mt-1 text-sm text-navy-500">{lang === 'ur' ? 'ایڈمن پینل تک رسائی کے لیے لاگ ان کریں' : 'Sign in to access the admin panel'}</p>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">{lang === 'ur' ? 'پاس ورڈ' : 'Password'}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 py-2.5 font-semibold text-navy-800 transition hover:bg-gold-300 disabled:opacity-60">
              {loading ? (lang === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Signing in…') : (lang === 'ur' ? 'لاگ ان کریں' : 'Login')} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <Link to="/" className="mt-4 block text-center text-sm font-medium text-navy-500 hover:text-navy-700">{lang === 'ur' ? '← ویب سائٹ دیکھیں' : '← Back to website'}</Link>
        </div>
      </div>
    </div>
  );
}

function TextArrayEditor({ label, items, setItems, newItem, setNewItem, storageKey }: {
  label: string; items: string[]; setItems: (v: string[]) => void; newItem: string; setNewItem: (v: string) => void; storageKey: string;
}) {
  const add = () => {
    if (newItem.trim()) {
      const next = [...items, newItem.trim()];
      setItems(next);
      saveJSON(storageKey, next);
      setNewItem('');
    }
  };
  const remove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    saveJSON(storageKey, next);
  };
  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
      <h3 className="mb-3 font-semibold text-navy-800">{label}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs border border-navy-100">
            <span className="text-navy-700">{item}</span>
            <button onClick={() => remove(i)} className="text-rose-500 hover:text-rose-700"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={`Add ${label.toLowerCase()}`} className="flex-1 rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
        <button onClick={add} className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
