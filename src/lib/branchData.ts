import { waLink, telLink, toWaNumber, formatPhone } from './whatsapp';

export type Branch = {
  label: string;
  name: string;
  address: string;
  phone: string;
  phone2?: string;
  email: string;
  whatsapp: string;
  whatsappName?: string;
  maps: string;
  hours: string;
  contactPerson: string;
  addressPending?: boolean;
};

export type ContactPerson = {
  name: string;
  phone: string;
  whatsapp: string;
};

export const DEFAULT_BRANCHES: Branch[] = [
  {
    label: 'Head Office',
    name: 'Al Najaf Associates – Thokar Niaz Baig Branch',
    address: 'Chairman Market, Niaz Baig Road, Thokar, Lahore',
    phone: '0321 3216423',
    email: '',
    whatsapp: '0321 3216423',
    whatsappName: '',
    maps: 'https://maps.app.goo.gl/1eikhxHxadkzGcob7?g_st=iwb',
    hours: '24 Hours',
    contactPerson: 'Malik Imran Ahmed',
  },
  {
    label: 'Branch 2',
    name: 'Al Najaf Associates',
    address: 'Pakka Mail Stop, Near Eden Value Homes, Multan Road, Thokar, Lahore',
    phone: '0321 3216423',
    email: '',
    whatsapp: '0321 3216423',
    whatsappName: '',
    maps: '',
    hours: '',
    contactPerson: 'Malik Imran Ahmed',
  },
  {
    label: 'Branch 3',
    name: 'Al Najaf Associates',
    address: 'Khuda Bakhsh Road, Jafferia Colony, Lahore',
    phone: '0321 4506286',
    email: '',
    whatsapp: '0309 9116228',
    whatsappName: 'Nauman Ali Advocate',
    maps: '',
    hours: '',
    contactPerson: 'Syed Imran Haider Naqvi',
  },
  {
    label: 'Branch 4',
    name: 'Al Najaf Associates',
    address: 'Bakkar Mandi, Sheera Kot, Lahore',
    phone: '0307 4243568',
    phone2: '0322 4300561',
    email: '',
    whatsapp: '',
    whatsappName: '',
    maps: '',
    hours: '',
    contactPerson: 'Imran Ali Bhatti',
  },
];

export const DEFAULT_CONTACT_PERSONS: ContactPerson[] = [
  { name: 'ملک عمران احمد', phone: '0321 3216423', whatsapp: '0321 3216423' },
  { name: 'سید عمران حیدر نقوی', phone: '0321 4506286', whatsapp: '0321 4506286' },
  { name: 'عمران علی بھٹی', phone: '0322 4300561', whatsapp: '' },
  { name: 'نعمان علی ایڈووکیٹ', phone: '+92 309 9116228', whatsapp: '0309 9116228' },
];

const BRANCH_KEY = 'branch_addresses';
const PERSONS_KEY = 'contact_persons';

function loadJSON<T>(key: string, fallback: T): T {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}

export function getBranches(): Branch[] {
  const list = loadJSON<Branch[]>(BRANCH_KEY, DEFAULT_BRANCHES);
  const filled = Array.isArray(list) ? list.filter((b) => b && (b.name || b.address || b.phone || b.whatsapp)) : [];
  if (!filled.length) return DEFAULT_BRANCHES;
  return filled.map((b) => ({ ...b, label: b.label || 'Branch' }));
}

export function getContactPersons(): ContactPerson[] {
  const list = loadJSON<ContactPerson[]>(PERSONS_KEY, DEFAULT_CONTACT_PERSONS);
  return Array.isArray(list) ? list.filter((p) => p && (p.name || p.phone)) : DEFAULT_CONTACT_PERSONS;
}

export function localizedBranchLabel(label: string, lang: 'en' | 'ur'): string {
  const map: Record<string, [string, string]> = {
    'Head Office': ['Head Office', 'ہیڈ آفس'],
    'Branch 2': ['Branch 2', 'برانچ 2'],
    'Branch 3': ['Branch 3', 'برانچ 3'],
    'Branch 4': ['Branch 4', 'برانچ 4'],
  };
  const hit = map[label];
  if (hit) return lang === 'ur' ? hit[1] : hit[0];
  if (label && label !== 'Branch') return label;
  return lang === 'ur' ? 'برانچ' : 'Branch';
}

export { waLink, telLink, toWaNumber, formatPhone };
