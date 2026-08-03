import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Search, Database, Hash, Shield, Clock, Loader2, AlertCircle, Upload, ChevronLeft, ChevronRight, MapPin, User, FileText, Building2, Landmark, Book, Phone, Mail, Home, Map as MapIcon, Layers, Ruler } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { addOrder, getSession } from '@/lib/dataService';

const FARD_TYPES = [
  { id: 'fard-bray-record', name: 'Fard Bray Record', description: 'Search and retrieve fard bray (registered) record from government database', category: 'Record', govSource: 'Lands Department', rate: 'Free' },
  { id: 'fard-bray-meter', name: 'Fard Bray Meter', description: 'Check fard bray for metered properties and utility connections', category: 'Meter', govSource: 'Lands Dept / Utilities', rate: 'Free' },
  { id: 'fard-baray-zati', name: 'Fard Baray Zati (Record)', description: 'Retrieve personal fard record (zati) from government records', category: 'Personal Record', govSource: 'Revenue Department', rate: 'Free' },
  { id: 'fard-all-types', name: 'All Fard Types', description: 'Comprehensive search across all fard record types', category: 'All', govSource: 'Multiple Departments', rate: 'Free' },
  { id: 'fard-mutation', name: 'Fard Mutation (Intiqal)', description: 'Record transfer and mutation in fard records', category: 'Mutation', govSource: 'Lands Department', rate: 'From PKR 500' },
  { id: 'fard-clearance', name: 'Fard Clearance Certificate', description: 'Obtain fard clearance certificate for property transactions', category: 'Certificate', govSource: 'Revenue Dept', rate: 'From PKR 1,000' },
  { id: 'fard-verify', name: 'Fard Verification', description: 'Verify property fard status and ownership details', category: 'Verification', govSource: 'Lands Department', rate: 'From PKR 500' },
  { id: 'fard-extract', name: 'Fard Extract Copy', description: 'Get verified extract copy of fard records', category: 'Copy', govSource: 'Revenue Department', rate: 'From PKR 300' },
];

type SearchMethod = 'cnic' | 'khasra' | 'keyword';

interface OwnerDetails {
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  address: string;
}

interface PropertyDetails {
  khasraNumber: string;
  khatauniNumber: string;
  patwarCircle: string;
  tehsil: string;
  district: string;
  province: string;
  propertyType: string;
  totalArea: string;
}

interface CustomerDetails {
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  relationshipToOwner: string;
}

interface FormErrors {
  [key: string]: string;
}

function validateStep(step: number, owner: OwnerDetails, property: PropertyDetails, customer: CustomerDetails): FormErrors {
  const errors: FormErrors = {};
  if (step === 0) {
    if (!customer.fullName.trim()) errors.customerFullName = 'Required';
    if (!customer.fatherName.trim()) errors.customerFatherName = 'Required';
    if (!customer.cnic.trim()) errors.customerCnic = 'Required';
    if (!customer.phone.trim()) errors.customerPhone = 'Required';
    if (!customer.address.trim()) errors.customerAddress = 'Required';
  }
  if (step <= 1) {
    if (!owner.fullName.trim()) errors.ownerFullName = 'Required';
    if (!owner.fatherName.trim()) errors.ownerFatherName = 'Required';
    if (!owner.cnic.trim()) errors.ownerCnic = 'Required';
  }
  if (step <= 2) {
    if (!property.khasraNumber.trim()) errors.khasraNumber = 'Required';
    if (!property.khatauniNumber.trim()) errors.khatauniNumber = 'Required';
    if (!property.patwarCircle.trim()) errors.patwarCircle = 'Required';
    if (!property.tehsil.trim()) errors.tehsil = 'Required';
    if (!property.district.trim()) errors.district = 'Required';
  }
  return errors;
}

export function FardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const fard = FARD_TYPES.find((f) => f.id === id);

  const [searchMethod, setSearchMethod] = useState<SearchMethod>('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [cnic, setCnic] = useState('');
  const [khasraNo, setKhasraNo] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [found, setFound] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [owner, setOwner] = useState<OwnerDetails>({ fullName: '', fatherName: '', cnic: '', phone: '', address: '' });
  const [property, setProperty] = useState<PropertyDetails>({ khasraNumber: '', khatauniNumber: '', patwarCircle: '', tehsil: '', district: '', province: 'Punjab', propertyType: 'agricultural', totalArea: '' });
  const [customer, setCustomer] = useState<CustomerDetails>({ fullName: '', fatherName: '', cnic: '', phone: '', email: '', address: '', relationshipToOwner: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const isFree = fard?.rate === 'Free';

  const steps = [
    { label: 'Search', icon: Search },
    { label: 'Details', icon: User },
    { label: 'Review', icon: FileText },
    { label: 'Confirm', icon: Check },
  ];

  if (!fard) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <p className="text-lg font-semibold text-navy-700">Fard type not found.</p>
        <Link to="/fard" className="mt-3 text-gold-600 hover:underline">Back to Fard Records</Link>
      </div>
    );
  }

  const handleSearch = () => {
    const q = searchMethod === 'cnic' ? cnic : searchMethod === 'khasra' ? khasraNo : searchQuery;
    if (!q.trim()) return;
    setSearching(true);
    setSearchDone(false);
    setSearchProgress('');
    const messages = [
      'Connecting to government database...',
      'Authenticating with Revenue Department...',
      'Querying Patwar records...',
      'Fetching fard entries...',
      'Verifying record integrity...',
    ];
    messages.forEach((msg, i) => {
      setTimeout(() => setSearchProgress(msg), (i + 1) * 400);
    });
    setTimeout(() => {
      setSearching(false);
      setSearchDone(true);
      setFound(Math.random() > 0.25);
    }, 2500);
  };

  const handleOwnerChange = (field: keyof OwnerDetails, value: string) => {
    setOwner((prev) => ({ ...prev, [field]: value }));
    if (errors[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => { const n = { ...prev }; delete n[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`]; return n; });
    }
  };

  const handlePropertyChange = (field: keyof PropertyDetails, value: string) => {
    setProperty((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleCustomerChange = (field: keyof CustomerDetails, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[`customer${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => { const n = { ...prev }; delete n[`customer${field.charAt(0).toUpperCase() + field.slice(1)}`]; return n; });
    }
  };

  const handleNext = () => {
    const fieldErrors = validateStep(currentStep, owner, property, customer);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const s = getSession();
    try {
      addOrder({
        userId: s?.userId || 'guest',
        orderRef: `FR-${Date.now().toString().slice(-6)}`,
        orderType: 'Fard Record',
        orderDate: new Date().toLocaleDateString(),
        orderAmount: isFree ? 'Free' : fard?.rate || '',
        status: 'Under Review',
        name: customer.fullName || s?.name || 'Guest',
        email: customer.email || s?.email || '',
        phone: customer.phone || '',
        notes: `Search: ${searchQuery || cnic || khasraNo || ''} · ${fard?.name || ''}`,
      });
    } catch {}
    setSubmitted(true);
  };

  const renderField = (label: string, value: string, onChange: (v: string) => void, placeholder: string, opts?: { required?: boolean; type?: string; errorKey?: string }) => {
    const hasError = opts?.errorKey && errors[opts.errorKey];
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-navy-700">
          {label} {opts?.required && <span className="text-rose-500">*</span>}
        </label>
        <input
          type={opts?.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border ${hasError ? 'border-rose-300 bg-rose-50' : 'border-navy-100'} px-3 py-2 text-sm outline-none focus:border-gold-400 transition-colors`}
        />
        {hasError && <p className="mt-0.5 text-xs text-rose-500">{errors[opts!.errorKey!]}</p>}
      </div>
    );
  };

  const renderSelect = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 bg-white">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="enter-3d">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-navy-800">{fard.name} — Request Submitted</h1>
          <p className="mt-2 text-navy-500">Your fard record request has been received. We will process it and notify you via email/SMS.</p>
          <p className="mt-1 text-sm text-navy-400">Reference: <strong>FR-{Date.now().toString(36).toUpperCase()}</strong></p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-800">{t('dash.title')}</Link>
            <Link to="/fard" className="rounded-xl border border-navy-200 px-5 py-2.5 font-semibold text-navy-700 hover:bg-navy-50">Back to Fard Records</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="mt-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-100 text-gold-600"><Database className="h-6 w-6" /></span>
          <div>
            <h1 className="font-serif text-xl font-bold text-navy-800 sm:text-2xl">{fard.name}</h1>
            <p className="text-sm text-navy-500">{fard.description}</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = currentStep === i;
              const isComplete = currentStep > i;
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
                      isComplete ? 'bg-emerald-500 text-white' :
                      isActive ? 'bg-gold-400 text-navy-800' :
                      'bg-navy-100 text-navy-400'
                    }`}>
                      {isComplete ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`hidden text-xs font-semibold sm:block ${isActive ? 'text-navy-800' : 'text-navy-400'}`}>{s.label}</span>
                    {i < steps.length - 1 && <div className={`hidden h-0.5 w-12 sm:block ${currentStep > i ? 'bg-emerald-400' : 'bg-navy-100'}`} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 0: Search + Fard Type Selection */}
        {currentStep === 0 && (
          <>
            {!searchDone && !searching && (
              <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-gold-500" />
                  <h2 className="font-serif font-bold text-navy-800">Search Fard Records</h2>
                </div>
                <p className="mb-4 text-sm text-navy-500">Source: {fard.govSource} — Choose a search method below</p>

                {/* Search Method Tabs */}
                <div className="mb-5 flex gap-2 border-b border-navy-100 pb-3">
                  {[
                    { key: 'keyword' as SearchMethod, label: 'By Keyword', icon: Search },
                    { key: 'cnic' as SearchMethod, label: 'By CNIC', icon: Shield },
                    { key: 'khasra' as SearchMethod, label: 'By Khasra / Property', icon: Hash },
                  ].map((m) => {
                    const isActive = searchMethod === m.key;
                    const MIcon = m.icon;
                    return (
                      <button key={m.key} onClick={() => setSearchMethod(m.key)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive ? 'bg-gold-100 text-gold-700' : 'text-navy-400 hover:text-navy-600'
                      }`}>
                        <MIcon className="h-3.5 w-3.5" /> {m.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  {searchMethod === 'keyword' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">Search by keyword</label>
                      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${fard.name}...`} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                  )}
                  {searchMethod === 'cnic' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">CNIC Number</label>
                      <input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                  )}
                  {searchMethod === 'khasra' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">Khasra / Property Number</label>
                      <input value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} placeholder="e.g. Khasra #123, Mouza ABC" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                  )}
                </div>

                <button onClick={handleSearch} disabled={searching} className="mt-5 w-full rounded-xl bg-navy-700 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 transition-colors">
                  {searching ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Searching...</> : <><Search className="mr-2 inline h-4 w-4" /> Search {fard.govSource} Database</>}
                </button>
              </div>
            )}

            {searching && (
              <div className="mt-6 space-y-3">
                <div className="grid place-items-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/30 py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
                  <p className="mt-3 text-sm font-medium text-navy-600">{searchProgress || 'Initializing search...'}</p>
                  <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-navy-200">
                    <div className="h-full w-full origin-left animate-pulse rounded-full bg-gold-400" style={{ animationDuration: '1.5s' }} />
                  </div>
                </div>
              </div>
            )}

            {searchDone && !searching && (
              <div className="mt-6 space-y-6">
                {found ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Check className="h-5 w-5 text-emerald-600" />
                      <h2 className="font-serif font-bold text-emerald-800">Record Found</h2>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-white p-4 text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-navy-500">Record Type</span><span className="font-semibold">{fard.name}</span></div>
                      <div className="flex justify-between"><span className="text-navy-500">Property ID</span><span className="font-semibold">PK-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="text-navy-500">Area</span><span className="font-semibold">DHA Phase 5, Lahore</span></div>
                      <div className="flex justify-between"><span className="text-navy-500">Measurement</span><span className="font-semibold">5 Marla (125 sq. yd)</span></div>
                      <div className="flex justify-between"><span className="text-navy-500">Owner</span><span className="font-semibold">Record retrieved — will be entered below</span></div>
                      <div className="flex justify-between"><span className="text-navy-500">Fard Status</span><span className="font-semibold text-emerald-600">Active / Clear</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <h2 className="font-serif font-bold text-amber-800">No Record Found</h2>
                    </div>
                    <p className="text-sm text-amber-700">No matching fard record was found. You can still proceed by entering details manually.</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => { setSearchDone(false); setSearching(false); setSearchProgress(''); }} className="rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                    New Search
                  </button>
                  {isFree ? (
                    <div className="rounded-xl bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700">Free Service — No Booking Required</div>
                  ) : (
                    <button onClick={handleNext} className="rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 transition-colors">
                      Continue to Details <ChevronRight className="ml-1 inline h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 1: Customer + Owner Details */}
        {currentStep === 1 && (
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <User className="h-5 w-5 text-gold-500" />
              <h2 className="font-serif font-bold text-navy-800">Applicant &amp; Owner Details</h2>
            </div>

            <div className="mb-6">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-3"><User className="h-4 w-4 text-gold-500" /> Applicant (Customer)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField('Full Name', customer.fullName, (v) => handleCustomerChange('fullName', v), 'Enter full name', { required: true, errorKey: 'customerFullName' })}
                {renderField("Father's Name", customer.fatherName, (v) => handleCustomerChange('fatherName', v), "Enter father's name", { required: true, errorKey: 'customerFatherName' })}
                {renderField('CNIC', customer.cnic, (v) => handleCustomerChange('cnic', v), 'XXXXX-XXXXXXX-X', { required: true, errorKey: 'customerCnic' })}
                {renderField('Phone', customer.phone, (v) => handleCustomerChange('phone', v), '03XX-XXXXXXX', { required: true, errorKey: 'customerPhone' })}
                {renderField('Email', customer.email, (v) => handleCustomerChange('email', v), 'email@example.com', { type: 'email' })}
                {renderField('Address', customer.address, (v) => handleCustomerChange('address', v), 'Full address', { required: true, errorKey: 'customerAddress' })}
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-700">Relationship to Property Owner</label>
                  <select value={customer.relationshipToOwner} onChange={(e) => handleCustomerChange('relationshipToOwner', e.target.value)} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400 bg-white">
                    <option value="">Select relationship...</option>
                    <option value="self">Self (Owner)</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="father">Father</option>
                    <option value="spouse">Spouse</option>
                    <option value="agent">Agent / Representative</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-navy-100 pt-6">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-3"><Building2 className="h-4 w-4 text-gold-500" /> Land Owner (Zamindar / Malik)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField('Owner Full Name', owner.fullName, (v) => handleOwnerChange('fullName', v), 'Owner full name', { required: true, errorKey: 'ownerFullName' })}
                {renderField("Owner Father's Name", owner.fatherName, (v) => handleOwnerChange('fatherName', v), "Owner father's name", { required: true, errorKey: 'ownerFatherName' })}
                {renderField('Owner CNIC', owner.cnic, (v) => handleOwnerChange('cnic', v), 'XXXXX-XXXXXXX-X', { required: true, errorKey: 'ownerCnic' })}
                {renderField('Owner Phone', owner.phone, (v) => handleOwnerChange('phone', v), '03XX-XXXXXXX')}
                {renderField('Owner Address', owner.address, (v) => handleOwnerChange('address', v), 'Owner address')}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                <ChevronLeft className="mr-1 inline h-4 w-4" /> Back
              </button>
              <button onClick={handleNext} className="rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 transition-colors">
                Continue to Property <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Property Details */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-gold-500" />
              <h2 className="font-serif font-bold text-navy-800">Property Details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {renderField('Khasra Number', property.khasraNumber, (v) => handlePropertyChange('khasraNumber', v), 'e.g. Khasra #123', { required: true, errorKey: 'khasraNumber' })}
              {renderField('Khatauni Number', property.khatauniNumber, (v) => handlePropertyChange('khatauniNumber', v), 'e.g. Khatauni #456', { required: true, errorKey: 'khatauniNumber' })}
              {renderField('Patwar Circle / Halqa', property.patwarCircle, (v) => handlePropertyChange('patwarCircle', v), 'e.g. Patwar Circle ABC', { required: true, errorKey: 'patwarCircle' })}
              {renderField('Tehsil', property.tehsil, (v) => handlePropertyChange('tehsil', v), 'e.g. Tehsil XYZ', { required: true, errorKey: 'tehsil' })}
              {renderField('District', property.district, (v) => handlePropertyChange('district', v), 'e.g. Lahore', { required: true, errorKey: 'district' })}
              {renderSelect('Province', property.province, (v) => handlePropertyChange('province', v), [
                { value: 'Punjab', label: 'Punjab' },
                { value: 'Sindh', label: 'Sindh' },
                { value: 'KPK', label: 'Khyber Pakhtunkhwa' },
                { value: 'Balochistan', label: 'Balochistan' },
                { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
                { value: 'AJK', label: 'Azad Jammu & Kashmir' },
              ])}
              {renderSelect('Property Type', property.propertyType, (v) => handlePropertyChange('propertyType', v), [
                { value: 'agricultural', label: 'Agricultural' },
                { value: 'residential', label: 'Residential' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'industrial', label: 'Industrial' },
                { value: 'mixed', label: 'Mixed Use' },
              ])}
              {renderField('Total Area (Kanals / Marlas)', property.totalArea, (v) => handlePropertyChange('totalArea', v), 'e.g. 5 Kanals or 20 Marlas')}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                <ChevronLeft className="mr-1 inline h-4 w-4" /> Back
              </button>
              <button onClick={handleNext} className="rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 transition-colors">
                Review &amp; Submit <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="h-5 w-5 text-gold-500" />
              <h2 className="font-serif font-bold text-navy-800">Review Your Information</h2>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-2"><User className="h-4 w-4 text-gold-500" /> Applicant</h3>
                <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3 text-sm space-y-1">
                  <p><span className="text-navy-500">Name:</span> <span className="font-semibold">{customer.fullName || '—'}</span></p>
                  <p><span className="text-navy-500">Father's Name:</span> <span className="font-semibold">{customer.fatherName || '—'}</span></p>
                  <p><span className="text-navy-500">CNIC:</span> <span className="font-semibold">{customer.cnic || '—'}</span></p>
                  <p><span className="text-navy-500">Phone:</span> <span className="font-semibold">{customer.phone || '—'}</span></p>
                  <p><span className="text-navy-500">Email:</span> <span className="font-semibold">{customer.email || '—'}</span></p>
                  <p><span className="text-navy-500">Address:</span> <span className="font-semibold">{customer.address || '—'}</span></p>
                  <p><span className="text-navy-500">Relationship:</span> <span className="font-semibold">{customer.relationshipToOwner || '—'}</span></p>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-2"><Building2 className="h-4 w-4 text-gold-500" /> Land Owner</h3>
                <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3 text-sm space-y-1">
                  <p><span className="text-navy-500">Name:</span> <span className="font-semibold">{owner.fullName || '—'}</span></p>
                  <p><span className="text-navy-500">Father's Name:</span> <span className="font-semibold">{owner.fatherName || '—'}</span></p>
                  <p><span className="text-navy-500">CNIC:</span> <span className="font-semibold">{owner.cnic || '—'}</span></p>
                  <p><span className="text-navy-500">Phone:</span> <span className="font-semibold">{owner.phone || '—'}</span></p>
                  <p><span className="text-navy-500">Address:</span> <span className="font-semibold">{owner.address || '—'}</span></p>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-2"><MapPin className="h-4 w-4 text-gold-500" /> Property</h3>
                <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3 text-sm space-y-1">
                  <p><span className="text-navy-500">Khasra #:</span> <span className="font-semibold">{property.khasraNumber || '—'}</span></p>
                  <p><span className="text-navy-500">Khatauni #:</span> <span className="font-semibold">{property.khatauniNumber || '—'}</span></p>
                  <p><span className="text-navy-500">Patwar Circle:</span> <span className="font-semibold">{property.patwarCircle || '—'}</span></p>
                  <p><span className="text-navy-500">Tehsil:</span> <span className="font-semibold">{property.tehsil || '—'}</span></p>
                  <p><span className="text-navy-500">District:</span> <span className="font-semibold">{property.district || '—'}</span></p>
                  <p><span className="text-navy-500">Province:</span> <span className="font-semibold">{property.province}</span></p>
                  <p><span className="text-navy-500">Type:</span> <span className="font-semibold capitalize">{property.propertyType}</span></p>
                  <p><span className="text-navy-500">Total Area:</span> <span className="font-semibold">{property.totalArea || '—'}</span></p>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-navy-700 mb-2"><Database className="h-4 w-4 text-gold-500" /> Service</h3>
                <div className="rounded-xl border border-navy-100 bg-navy-50/30 p-3 text-sm space-y-1">
                  <p><span className="text-navy-500">Fard Type:</span> <span className="font-semibold">{fard.name}</span></p>
                  <p><span className="text-navy-500">Rate:</span> <span className="font-semibold">{fard.rate}</span></p>
                  <p><span className="text-navy-500">Source:</span> <span className="font-semibold">{fard.govSource}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={handleBack} className="rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors">
                <ChevronLeft className="mr-1 inline h-4 w-4" /> Edit
              </button>
              <button onClick={handleSubmit} className="rounded-xl bg-gold-400 px-6 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300 transition-colors">
                Confirm &amp; Submit <Check className="ml-1 inline h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
