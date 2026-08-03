import { useState, useEffect, useCallback } from 'react';
import { Search, Calculator, ExternalLink, RefreshCw, FileText, Info, AlertTriangle, Check } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { REGISTRY_RATES, TAX_SLABS, fetchApi } from '@/lib/registryRates';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Agricultural'];
const LOCATION_STATUSES = ['Urban', 'Rural'];
const BUYER_STATUSES = ['Filer', 'Late Filer', 'Non-Filer'];
const LAND_UNITS = ['Marla', 'Kanal', 'Sq. Ft.', 'Acre'];

type MouzaRate = { mouza_area: string; dc_rate: string; unit: string };

function formatNum(n: number): string {
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function unitToMarlas(val: number, unit: string): number {
  switch (unit) {
    case 'Kanal': return val * 20;
    case 'Sq. Ft.': return val / 272.25;
    case 'Acre': return val * 20 * 20;
    default: return val;
  }
}

export function DcRateCheckPage() {
  const { lang } = useLang();
  const u = lang === 'ur';
  const [districts, setDistricts] = useState<string[]>([]);
  const [tehsils, setTehsils] = useState<string[]>([]);
  const [mouzaRates, setMouzaRates] = useState<MouzaRate[]>([]);
  const [zila, setZila] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [mouza, setMouza] = useState('');
  const [propType, setPropType] = useState('Residential');
  const [locStatus, setLocStatus] = useState('Urban');
  const [landArea, setLandArea] = useState('');
  const [landUnit, setLandUnit] = useState('Marla');
  const [buyerStatus, setBuyerStatus] = useState('Filer');
  const [sellerStatus, setSellerStatus] = useState('Filer');
  const [mapApproved, setMapApproved] = useState('Approved');
  const [loading, setLoading] = useState(false);
  const [foundRate, setFoundRate] = useState<Record<string, any> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, { label: string; amount: number; note?: string }> | null>(null);
  const [totalDcValue, setTotalDcValue] = useState(0);
  const [ratePerMarla, setRatePerMarla] = useState(0);
  const [areaInMarlas, setAreaInMarlas] = useState(0);

  useEffect(() => {
    fetchApi({ action: 'get-dc-districts' }).then((res) => {
      if (res.success) setDistricts(res.districts);
    });
  }, []);

  const loadTehsils = useCallback((d: string) => {
    if (!d) return;
    fetchApi({ action: 'get-dc-tehsils', zila: d }).then((res) => {
      if (res.success) setTehsils(res.tehsils);
    });
  }, []);

  const loadMouzaRates = useCallback((d: string, t: string) => {
    if (!d || !t) return;
    fetchApi({ action: 'get-dc-mouza-rates', zila: d, tehsil: t }).then((res) => {
      if (res.success) setMouzaRates(res.mouzas);
    });
  }, []);

  const selectedMouzaRate = mouzaRates.find((m) => m.mouza_area === mouza);

  const handleCalculate = async () => {
    if (!zila || !tehsil || !mouza || !landArea || parseFloat(landArea) <= 0) return;
    setLoading(true);
    setNotFound(false);
    setCalcResult(null);

    const res = await fetchApi({ action: 'get-dc-rate-lookup', zila, tehsil, mouzaArea: mouza, propertyType: propType, locationStatus: locStatus });
    if (!res.success || !res.rate) {
      setNotFound(true);
      setFoundRate(null);
      setLoading(false);
      return;
    }

    const ratePerUnit = Number(res.rate.dc_rate);
    const unit = res.rate.unit || 'Marla';
    const area = parseFloat(landArea) || 0;
    const areaMarlas = unitToMarlas(area, landUnit);
    const rateMarla = unitToMarlas(ratePerUnit, unit);
    const total = rateMarla * areaMarlas;

    setFoundRate(res.rate);
    setRatePerMarla(rateMarla);
    setAreaInMarlas(areaMarlas);
    setTotalDcValue(total);

    const val = total;
    const items: Record<string, { label: string; amount: number; note?: string }> = {};

    items.stampDuty = {
      label: REGISTRY_RATES.stampDuty.labelEn,
      amount: val * (REGISTRY_RATES.stampDuty.pct / 100),
    };
    items.registrationFee = {
      label: REGISTRY_RATES.registrationFee.labelEn,
      amount: val <= 500000 ? 500 : 1000,
      note: val <= 500000 ? 'Flat Rs. 500' : 'Flat Rs. 1,000',
    };
    items.localBody = {
      label: REGISTRY_RATES.localBodyFee.labelEn,
      amount: val * (REGISTRY_RATES.localBodyFee.pct / 100),
    };
    items.plraFee = {
      label: REGISTRY_RATES.plraFee.labelEn,
      amount: val <= 3000000 ? 3250 : val * 0.001,
      note: val <= 3000000 ? 'Flat Rs. 3,200-3,300' : '0.1% of DC value',
    };
    let bRate = TAX_SLABS.filer236K;
    if (buyerStatus === 'Late Filer') bRate = 0;
    else if (buyerStatus === 'Non-Filer') bRate = TAX_SLABS.nonFiler236K.max;
    items.advTax = {
      label: `${REGISTRY_RATES.advTax236K.labelEn} (${buyerStatus})`,
      amount: val * (bRate / 100),
      note: buyerStatus === 'Late Filer' ? 'Confirm current FBR slab' : `${bRate}%`,
    };
    let sRate = TAX_SLABS.filer236C;
    if (sellerStatus === 'Non-Filer') sRate = TAX_SLABS.nonFiler236C;
    else if (sellerStatus === 'Late Filer') sRate = 0;
    items.gainTax = {
      label: `${REGISTRY_RATES.gainTax236C.labelEn} (${sellerStatus})`,
      amount: val * (sRate / 100),
      note: sellerStatus === 'Late Filer' ? 'Confirm current FBR slab' : `${sRate}%`,
    };
    items.mapFee = {
      label: REGISTRY_RATES.mapNonApprovalFee.labelEn,
      amount: mapApproved === 'Not Approved' ? val * (REGISTRY_RATES.mapNonApprovalFee.pct / 100) : 0,
      note: mapApproved === 'Not Approved' ? '2% of DC value' : 'N/A (Approved)',
    };
    items.mutationFee = {
      label: REGISTRY_RATES.mutationFee.labelEn,
      amount: 600,
      note: 'Approximate — verify locally',
    };
    items.comparisonFee = {
      label: REGISTRY_RATES.comparisonFee.labelEn,
      amount: 100,
      note: 'Approximate — verify locally',
    };
    items.miscCharges = {
      label: REGISTRY_RATES.miscCharges.labelEn,
      amount: 15000,
      note: 'Deed writer / office charges',
    };

    setCalcResult(items);
    setLoading(false);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const totalCalc = calcResult ? Object.values(calcResult).reduce((s, i) => s + i.amount, 0) : 0;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-cream to-yellow-50/80 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal variant="up">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-600">
              <FileText className="h-3.5 w-3.5" /> {u ? 'ڈی سی ریٹ اور رجسٹری کے اخراجات' : 'DC Rate & Registry Expenses'}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold text-navy-800 sm:text-4xl">
              {u ? 'ڈی سی ریٹ چیک اور رجسٹری کیلکولیٹر' : 'DC Rate Check & Registry Calculator'}
            </h1>
            <p className="mt-2 text-navy-500">
              {u ? 'اپنے علاقے کی ڈی سی ریٹ چیک کریں — رقبہ درج کریں — خودکار اخراجات کا حساب لگائیں' : 'Check DC Rate for your area — enter land size — auto-calculate all registry expenses'}
            </p>
          </div>
        </Reveal>

        {/* Main Form — Single Step */}
        <Reveal variant="up">
          <div className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-navy-800 mb-4">
              {u ? 'جائیداد کی معلومات' : 'Property Information'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Area selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'ضلع' : 'District / Zila'}</label>
                <select value={zila} onChange={(e) => { setZila(e.target.value); setTehsil(''); setMouza(''); setMouzaRates([]); setCalcResult(null); setFoundRate(null); setNotFound(false); loadTehsils(e.target.value); }} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                  <option value="">{u ? 'ضلع منتخب کریں' : 'Select District'}</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'تحصیل' : 'Tehsil'}</label>
                <select value={tehsil} onChange={(e) => { setTehsil(e.target.value); setMouza(''); setMouzaRates([]); setCalcResult(null); setFoundRate(null); setNotFound(false); loadMouzaRates(zila, e.target.value); }} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400" disabled={!zila}>
                  <option value="">{u ? 'تحصیل منتخب کریں' : 'Select Tehsil'}</option>
                  {tehsils.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'موضع / علاقہ' : 'Mouza / Area'}</label>
                <select value={mouza} onChange={(e) => { setMouza(e.target.value); setCalcResult(null); setFoundRate(null); setNotFound(false); }} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400" disabled={!tehsil}>
                  <option value="">{u ? 'موضع منتخب کریں' : 'Select Mouza'}</option>
                  {mouzaRates.map((m) => (
                    <option key={m.mouza_area} value={m.mouza_area}>
                      {m.mouza_area} — {u ? 'ریٹ' : 'Rate'}: Rs. {formatNum(Number(m.dc_rate))}/{m.unit || 'Marla'}
                    </option>
                  ))}
                </select>
                {selectedMouzaRate && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> DC Rate: Rs. {formatNum(Number(selectedMouzaRate.dc_rate))} / {selectedMouzaRate.unit || 'Marla'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'جائیداد کی قسم' : 'Property Type'}</label>
                  <select value={propType} onChange={(e) => setPropType(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                    {PROPERTY_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'مقام کی حیثیت' : 'Location'}</label>
                  <select value={locStatus} onChange={(e) => setLocStatus(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                    {LOCATION_STATUSES.map((ls) => <option key={ls} value={ls}>{ls}</option>)}
                  </select>
                </div>
              </div>

              {/* Land area input */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'زمین کا رقبہ' : 'Land Area'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="flex-1 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400"
                    placeholder={u ? 'رقبہ درج کریں' : 'Enter area'}
                    min="0"
                    step="any"
                  />
                  <select value={landUnit} onChange={(e) => setLandUnit(e.target.value)} className="w-28 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                    {LAND_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
              </div>

              {/* Buyer/Seller status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'خریدار کی حیثیت' : 'Buyer Status'}</label>
                <select value={buyerStatus} onChange={(e) => setBuyerStatus(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                  {BUYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'بیچنے والے کی حیثیت' : 'Seller Status'}</label>
                <select value={sellerStatus} onChange={(e) => setSellerStatus(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                  {BUYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">{u ? 'میپ کی حیثیت' : 'Map Status'}</label>
                <select value={mapApproved} onChange={(e) => setMapApproved(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-gold-400">
                  <option value="Approved">{u ? 'منظور شدہ' : 'Approved'}</option>
                  <option value="Not Approved">{u ? 'غیر منظور شدہ' : 'Not Approved'}</option>
                </select>
              </div>
            </div>

            <button onClick={handleCalculate} disabled={loading || !zila || !tehsil || !mouza || !landArea || parseFloat(landArea) <= 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-semibold text-navy-800 transition hover:bg-gold-300 disabled:opacity-50">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {u ? 'حساب لگائیں' : 'Calculate'}
            </button>

            <div className="mt-3 rounded-xl bg-amber-50/60 border border-amber-100 p-3 text-xs text-navy-500">
              <Info className="inline h-3 w-3 text-amber-500 mr-1" />
              {u
                ? 'آپ صرف رقبہ (مثلاً 4 مارلہ) درج کریں — ڈی سی ریٹ خودکار لگ جائے گا اور تمام رجسٹری کے اخراجات اپنے آپ حساب ہو جائیں گے۔'
                : 'Just enter your land area (e.g. 4 Marla) — DC rate is auto-fetched and all registry expenses are calculated automatically.'}
            </div>
          </div>
        </Reveal>

        {/* Rate Found — inline summary */}
        {foundRate && calcResult && (
          <Reveal variant="up">
             <div className="card-3d tilt-3d mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
              {/* DC Rate Summary Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-emerald-100">{u ? 'ڈی سی ریٹ' : 'DC Rate'}</div>
                    <div className="text-2xl font-bold text-white">Rs. {formatNum(Math.round(ratePerMarla))} / {foundRate.unit || 'Marla'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-100">{u ? 'کل جائیداد کی قیمت' : 'Total Property Value'}</div>
                    <div className="text-2xl font-bold text-white">Rs. {formatNum(Math.round(totalDcValue))}</div>
                    <div className="text-xs text-emerald-200">{landArea} {landUnit} = {formatNum(Math.round(areaInMarlas * 100) / 100)} Marla</div>
                  </div>
                </div>
                {/* Formula breakdown for transparency */}
                <div className="mt-3 rounded-xl bg-white/10 px-4 py-2.5 text-xs text-emerald-50">
                  <span className="font-semibold">{u ? 'فارمولا' : 'Formula'}:</span>{' '}
                  {u
                    ? `ریٹ ${formatNum(Math.round(ratePerMarla))}/${foundRate.unit || 'Marla'} × ${formatNum(Math.round(areaInMarlas * 100) / 100)} مارلہ = ${formatNum(Math.round(totalDcValue))}`
                    : `Rate ${formatNum(Math.round(ratePerMarla))}/${foundRate.unit || 'Marla'} × ${formatNum(Math.round(areaInMarlas * 100) / 100)} Marla = ${formatNum(Math.round(totalDcValue))}`}
                </div>
              </div>

              {/* Expense Breakdown Table */}
              <div className="divide-y divide-navy-50">
                {Object.entries(calcResult).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-navy-800">{item.label}</span>
                      {item.note && <span className="ml-2 text-xs text-navy-400">({item.note})</span>}
                    </div>
                    <span className="text-sm font-semibold text-navy-700">Rs. {formatNum(Math.round(item.amount))}</span>
                  </div>
                ))}
                 <div className="card-3d tilt-3d flex items-center justify-between bg-emerald-50 px-6 py-4">
                  <span className="text-base font-bold text-emerald-700">
                    {u ? 'کل رجسٹری کے اخراجات' : 'Total Registry Expenses'}
                  </span>
                  <span className="text-lg font-bold text-emerald-700">Rs. {formatNum(Math.round(totalCalc))}</span>
                </div>
              </div>

              <div className="px-6 py-3 bg-navy-50/50 flex flex-wrap gap-4 text-xs text-navy-500">
                <div><span className="font-semibold text-navy-700">{u ? 'آخری اپ ڈیٹ' : 'Last Updated'}:</span> {new Date(foundRate.last_updated).toLocaleDateString()}</div>
                <div><span className="font-semibold text-navy-700">{u ? 'ضلع' : 'District'}:</span> {foundRate.zila} &gt; {foundRate.tehsil} &gt; {foundRate.mouza_area}</div>
              </div>

              <div className="px-6 py-4 text-xs text-navy-500 border-t border-navy-100">
                <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />
                {u
                  ? 'یہ ریٹس پنجاب/ایف بی آر کے قوانین 2026 کے مطابق ہیں اور صرف تخمینی ہیں۔ ایڈوانس ٹیکس کے سلیب (236K/236C) اور اضلاعی فلیٹ فیٹس وقتاً فوقتاً تبدیل ہوتے ہیں۔ حتمی لین دین سے پہلے سرکاری پنجاب ای-اسٹامپ پورٹل اور ایف بی آر سے تصدیق کریں۔'
                  : 'Rates are based on Punjab/FBR laws 2026 and are indicative. Advance tax slabs (236K/236C) and district-level fees are periodically revised. Always verify via official Punjab e-Stamp portal and FBR before finalizing.'}
              </div>

              <div className="px-6 pb-4 text-center">
                <button onClick={() => { setCalcResult(null); setFoundRate(null); setNotFound(false); }} className="inline-flex items-center gap-2 text-sm font-semibold text-gold-600 hover:text-gold-500">
                  <RefreshCw className="h-4 w-4" /> {u ? 'دوبارہ حساب لگائیں' : 'Recalculate'}
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* Not Found */}
        {notFound && (
          <Reveal variant="up">
             <div className="card-3d tilt-3d mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <AlertTriangle className="h-5 w-5" /> {u ? 'اس علاقے کے لیے ریٹ دستیاب نہیں' : 'Rate Not Available for This Area'}
              </div>
              <p className="mt-2 text-sm text-navy-600">
                {u
                  ? 'براہ کرم سرکاری پنجاب ای-اسٹامپ پورٹل چیک کریں یا اپنے اعلیٰ افسر سے رجوع کریں۔'
                  : 'Please check the official Punjab e-Stamp portal or contact your senior officer.'}
              </p>
              <a href="https://es.punjab-zameen.gov.pk" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                <ExternalLink className="h-4 w-4" /> e-Stamp Portal
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
