import { useState, useEffect, type ChangeEvent } from 'react';
import { Calculator, Info } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface CalculationResult {
  expenseType: string;
  rateRule: string;
  amount: string;
}

interface CalculatorResponse {
  success: boolean;
  dcRate: number;
  calculations: CalculationResult[];
  grandTotal: string;
  inputs: {
    buyerStatus: string;
    sellerStatus: string;
    localBody: string;
    mapType: string;
  };
}

interface FormState {
  dcRate: string;
  buyerStatus: string;
  sellerStatus: string;
  localBody: string;
  mapType: string;
}

// English labels for form fields
const EN_LABELS = {
  dcRate: 'Enter DC Rate (Property Total Value in Rs.)',
  buyerStatus: 'Buyer (Purchaser) Status',
  sellerStatus: 'Seller (Owner) Status',
  localBody: 'Local Body / Area Council',
  mapType: 'Property Map / Type',
  filer: 'Filer',
  lateFiler: 'Late Filer',
  nonFiler: 'Non-Filer',
  districtCommittee: 'District/Committee',
  municipalCorporation: 'Municipal Corporation',
  cantonmentBoard: 'Cantonment Board',
  approved: 'Approved',
  notApproved: 'Not Approved',
};

// Urdu labels for form fields
const UR_LABELS = {
  dcRate: 'ڈی سی ریٹ (خاکے کی کل قیمت روپے میں)',
  buyerStatus: 'خریار (خریدار) کی حالت',
  sellerStatus: 'فروشندہ (مالک) کی حالت',
  localBody: 'مقامی باڈی / ایریا کونسل',
  mapType: 'پراپرٹی کا نقشہ / قسم',
  filer: 'فائلر',
  lateFiler: 'لیٹ فائلر',
  nonFiler: 'نان فائلر',
  districtCommittee: 'ڈسٹرکٹ/کمیٹی',
  municipalCorporation: 'مکانیکل کارپوریشن',
  cantonmentBoard: 'کنٹنمنٹ بورڈ',
  approved: 'منظور شدہ',
  notApproved: 'منظور نہیں شدہ',
};

export function CalculatorPage() {
  const { lang } = useLang();
  const t = (key: string) => {
    if (lang === 'ur') {
      return UR_LABELS[key as keyof typeof UR_LABELS] || key;
    }
    return EN_LABELS[key as keyof typeof EN_LABELS] || key;
  };

  const [form, setForm] = useState<FormState>({
    dcRate: '',
    buyerStatus: 'Filer',
    sellerStatus: 'Filer',
    localBody: 'District/Committee',
    mapType: 'Approved',
  });

  const [results, setResults] = useState<CalculatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Calculate immediately when component mounts with default values
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = async () => {
    if (!form.dcRate || parseFloat(form.dcRate) <= 0) {
      setError(lang === 'ur' ? 'براہ کرم درست ڈی سی ریٹ داخل کریں' : 'Please enter a valid DC Rate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calculator.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dcRate: parseFloat(form.dcRate),
          buyerStatus: form.buyerStatus,
          sellerStatus: form.sellerStatus,
          localBody: form.localBody,
          mapType: form.mapType,
        }),
      });

      if (!response.ok) {
        throw new Error('Calculation failed');
      }

      const data: CalculatorResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(lang === 'ur' ? 'حساب لگانے میں خطا' : 'Error calculating expenses');
    } finally {
      setLoading(false);
    }
  };

  // Trigger calculation on any input change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.dcRate) {
        handleCalculate();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.buyerStatus, form.sellerStatus, form.localBody, form.mapType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-cream to-yellow-50">
      {/* Header Section */}
      <section className="bg-green-700 text-white py-12 px-4 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Punjab Registry Expenses Calculator
          <span className="block text-sm mt-2 font-normal">پنبج رجسٹری ایکسپیمنٹس کیلکولیٹر</span>
        </h1>
        <p className="text-green-100 max-w-2xl mx-auto text-sm md:text-base">
          {lang === 'ur' 
            ? 'براہ مہربانی اپنے فلد کی قیمت اور تفصیلات داخل کریں تاکہ آپ کے پراپرٹی کے ڈی جی ایس (DC) کے مطابق جامع اخراجات کا حساب لگا سکیں۔'
            : 'Please enter your property details to calculate total registry expenses based on your DC (District Collector) value.'}
        </p>
      </section>

       <div className="mx-auto max-w-7xl px-4 py-8">
         {/* Form Section */}
         <section className="card-3d tilt-3d bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border border-gold-200">
          <div className="space-y-6">
            {/* DC Rate Input */}
            <div className="md:flex md:items-center md:gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label className="block text-sm font-semibold text-navy-700 mb-1" htmlFor="dcRate">
                  {t('dcRate')}
                </label>
                <span className="text-xs text-navy-400 block mb-2">ڈی جی ایس رت</span>
              </div>
              <div className="md:w-2/3">
                <input
                  type="number"
                  id="dcRate"
                  name="dcRate"
                  value={form.dcRate}
                  onChange={handleInputChange}
                  placeholder={lang === 'ur' ? 'مثلاً: 5000000' : 'e.g., 5000000'}
                  className="w-full px-4 py-3 border-2 border-navy-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-navy-800 text-base"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Buyer Status Dropdown */}
            <div className="md:flex md:items-center md:gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label className="block text-sm font-semibold text-navy-700 mb-1" htmlFor="buyerStatus">
                  {t('buyerStatus')}
                </label>
                <span className="text-xs text-navy-400 block mb-2">خریدار کی حالت</span>
              </div>
              <div className="md:w-2/3">
                <select
                  id="buyerStatus"
                  name="buyerStatus"
                  value={form.buyerStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-navy-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-navy-800 bg-white text-base"
                >
                  <option value="Filer">{t('filer')}</option>
                  <option value="Late Filer">{t('lateFiler')}</option>
                  <option value="Non-Filer">{t('nonFiler')}</option>
                </select>
              </div>
            </div>

            {/* Seller Status Dropdown */}
            <div className="md:flex md:items-center md:gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label className="block text-sm font-semibold text-navy-700 mb-1" htmlFor="sellerStatus">
                  {t('sellerStatus')}
                </label>
                <span className="text-xs text-navy-400 block mb-2">فروشندہ کی حالت</span>
              </div>
              <div className="md:w-2/3">
                <select
                  id="sellerStatus"
                  name="sellerStatus"
                  value={form.sellerStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-navy-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-navy-800 bg-white text-base"
                >
                  <option value="Filer">{t('filer')}</option>
                  <option value="Late Filer">{t('lateFiler')}</option>
                  <option value="Non-Filer">{t('nonFiler')}</option>
                </select>
              </div>
            </div>

            {/* Local Body Dropdown */}
            <div className="md:flex md:items-center md:gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label className="block text-sm font-semibold text-navy-700 mb-1" htmlFor="localBody">
                  {t('localBody')}
                </label>
                <span className="text-xs text-navy-400 block mb-2">مقامی باڈی</span>
              </div>
              <div className="md:w-2/3">
                <select
                  id="localBody"
                  name="localBody"
                  value={form.localBody}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-navy-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-navy-800 bg-white text-base"
                >
                  <option value="District/Committee">{t('districtCommittee')}</option>
                  <option value="Municipal Corporation">{t('municipalCorporation')}</option>
                  <option value="Cantonment Board">{t('cantonmentBoard')}</option>
                </select>
              </div>
            </div>

            {/* Map Type Dropdown */}
            <div className="md:flex md:items-center md:gap-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label className="block text-sm font-semibold text-navy-700 mb-1" htmlFor="mapType">
                  {t('mapType')}
                </label>
                <span className="text-xs text-navy-400 block mb-2">پراپرٹی کی قسم</span>
              </div>
              <div className="md:w-2/3">
                <select
                  id="mapType"
                  name="mapType"
                  value={form.mapType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-navy-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-navy-800 bg-white text-base"
                >
                  <option value="Approved">{t('approved')}</option>
                  <option value="Not Approved">{t('notApproved')}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="card-3d tilt-3d bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border border-gold-200">
          <h2 className="font-serif text-2xl font-bold text-navy-800 mb-6 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-green-600" />
            {lang === 'ur' ? 'حساب لگے گئے اخراجات' : 'Calculated Expenses'}
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-navy-600">{lang === 'ur' ? 'ہونے والا ہے...' : 'Calculating...'}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {results && (
            <>
              {/* Expenses Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy-50">
                      <th className="px-4 py-3 text-sm font-semibold text-navy-700 border-b border-navy-200">
                        {lang === 'ur' ? 'اخراجات کی قسم' : 'Expense Type'}
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-navy-700 border-b border-navy-200">
                        {lang === 'ur' ? 'درج ارتباط / قاعدہ' : 'Rate/Rule'}
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-navy-700 text-right border-b border-navy-200">
                        {lang === 'ur' ? 'رقم (روپے)' : 'Amount (Rs.)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.calculations.map((calc, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-navy-50/50'}>
                        <td className="px-4 py-3 text-sm text-navy-800 border-b border-navy-100">
                          {calc.expenseType}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-600 border-b border-navy-100">
                          {calc.rateRule}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-navy-800 text-right border-b border-navy-100">
                          Rs. {Number(calc.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

               {/* Grand Total */}
               <div className="card-3d tilt-3d mt-6 bg-green-700 text-white rounded-xl p-4 sm:p-6 text-center border border-green-600">
                <span className="text-green-100 text-sm uppercase tracking-wide block mb-2">
                  {lang === 'ur' ? 'کل اخراجات' : 'TOTAL REGISTRY EXPENSES'}
                </span>
                <div className="font-serif text-3xl md:text-4xl font-bold">
                  Rs. {Number(results.grandTotal).toLocaleString()}
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 p-4 bg-navy-50 rounded-xl">
                <p className="text-sm text-navy-600">
                  <span className="font-semibold text-navy-700">
                    {lang === 'ur' ? 'DC Rate:' : 'DC Rate:'} {Number(results.dcRate).toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-navy-500 mt-1">
                  {lang === 'ur' 
                    ? `خریدار: ${results.inputs.buyerStatus} | فروشندہ: ${results.inputs.sellerStatus} | ${results.inputs.localBody} | ${results.inputs.mapType}`
                    : `Buyer: ${results.inputs.buyerStatus} | Seller: ${results.inputs.sellerStatus} | ${results.inputs.localBody} | ${results.inputs.mapType}`}
                </p>
              </div>
            </>
          )}

          {!results && !loading && !error && (
            <p className="text-center text-navy-500 py-8">
              {lang === 'ur' ? 'براہ کرم فارم کو پر کریں تاکہ حساب لگایا جا سکے' : 'Please fill the form to calculate expenses'}
            </p>
          )}
        </section>

        {/* Disclaimer */}
        <section className="card-3d tilt-3d bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-navy-700">
                <span className="font-semibold text-navy-800">{lang === 'ur' ? 'وعدہ:' : 'Note:'} </span>
                {lang === 'ur' 
                  ? 'یہ ریٹس صرف حوالہ کے لئے ہیں۔ اپنے ادارے کے کلائنٹ یا ڈی جی ایس آفس کے ساتھ یقینی بنائیں۔'
                  : 'Rates are for reference only. Verify with local registrar/DC office before making payments.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}