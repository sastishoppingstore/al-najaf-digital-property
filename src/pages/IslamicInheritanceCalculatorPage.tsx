import { useState } from 'react';
import { BookOpen, AlertTriangle, RefreshCw, Users, Info } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { calculateInheritance, type Fiqh } from '@/lib/inheritanceCalculator';

const LAND_UNITS = ['Marla', 'Kanal', 'Sq. Ft.', 'Acre'];

type Result = ReturnType<typeof calculateInheritance>;

function formatNum(n: number): string {
  return n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function IslamicInheritanceCalculatorPage() {
  const { lang } = useLang();

  // Form state
  const [cash, setCash] = useState('');
  const [landArea, setLandArea] = useState('');
  const [landUnit, setLandUnit] = useState('Marla');
  const [deceasedGender, setDeceasedGender] = useState<'male' | 'female'>('male');
  const [wivesCount, setWivesCount] = useState(0);
  const [husbandAlive, setHusbandAlive] = useState(false);
  const [sons, setSons] = useState(0);
  const [daughters, setDaughters] = useState(0);
  const [fatherAlive, setFatherAlive] = useState(false);
  const [motherAlive, setMotherAlive] = useState(false);
  const [fiqh, setFiqh] = useState<Fiqh>('hanafi');

  const [result, setResult] = useState<Result | null>(null);

  const handleCalculate = () => {
    const res = calculateInheritance({
      cash: parseFloat(cash) || 0,
      landArea: parseFloat(landArea) || 0,
      landUnit,
      deceasedGender,
      wivesCount: deceasedGender === 'male' ? wivesCount : 0,
      husbandAlive: deceasedGender === 'female' ? husbandAlive : false,
      sons,
      daughters,
      fatherAlive,
      motherAlive,
      fiqh,
    });
    setResult(res);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('calc-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReset = () => {
    setCash('');
    setLandArea('');
    setLandUnit('Marla');
    setDeceasedGender('male');
    setWivesCount(0);
    setHusbandAlive(false);
    setSons(0);
    setDaughters(0);
    setFatherAlive(false);
    setMotherAlive(false);
    setFiqh('hanafi');
    setResult(null);
  };

  const u = lang === 'ur';

  return (
    <div className="bg-gradient-to-br from-amber-50 via-cream to-yellow-50/80 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <Reveal variant="up">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <BookOpen className="h-3.5 w-3.5" /> {u ? 'اسلامی شرعی وراثت' : 'Islamic Inheritance'}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold text-navy-800 sm:text-4xl">
              {u ? 'اسلامی شرعی وراثت کیلکولیٹر' : 'Islamic Inheritance Calculator'}
            </h1>
            <p className="mt-2 text-navy-500">
              {u ? 'شریعت کے مطابق وراثت کے حصوں کا حساب لگائیں' : 'Calculate inheritance shares according to Shar\'i rules'}
            </p>
          </div>
        </Reveal>

        {/* Form Card */}
        <Reveal variant="up">
          <div className="card-3d tilt-3d rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-navy-800 mb-4">
              {u ? 'جائیداد اور ورثاء کی معلومات' : 'Estate & Heir Information'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 1. Total Cash */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'کل رقم / نقد' : 'Total Cash / Amount'}
                </label>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  placeholder={u ? 'مثلاً 1000000' : 'e.g. 1000000'}
                  min="0"
                />
              </div>

              {/* 2. Total Land Area */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'کل زمین' : 'Total Land Area'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    className="flex-1 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                    placeholder={u ? 'رقبہ' : 'Area'}
                    min="0"
                  />
                  <select
                    value={landUnit}
                    onChange={(e) => setLandUnit(e.target.value)}
                    className="w-28 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    {LAND_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* 3. Deceased Gender */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'مرحوم کی جنس' : 'Deceased Gender'}
                </label>
                <select
                  value={deceasedGender}
                  onChange={(e) => setDeceasedGender(e.target.value as 'male' | 'female')}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="male">{u ? 'مرد (Male)' : 'Male (مرد)'}</option>
                  <option value="female">{u ? 'عورت (Female)' : 'Female (عورت)'}</option>
                </select>
              </div>

              {/* 4. Fiqh (مذهب) selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'مذهب / طریقہ' : 'Fiqh / Madhab'}
                </label>
                <select
                  value={fiqh}
                  onChange={(e) => setFiqh(e.target.value as Fiqh)}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="hanafi">{u ? 'حنفی (اہل سنت)' : 'Fiqh-e-Hanafi (Ahl-e-Sunnat)'}</option>
                  <option value="jafria">{u ? 'جعفری (اہل تشیع)' : 'Fiqh-e-Jafria (Ahl-e-Tashi)'}</option>
                </select>
              </div>

              {/* 5. Conditional spouse field */}
              {deceasedGender === 'male' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-600">
                    {u ? 'بیواؤں کی تعداد' : 'Wives Count'}
                  </label>
                  <select
                    value={wivesCount}
                    onChange={(e) => setWivesCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value={0}>{u ? 'کوئی نہیں' : 'None'}</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-600">
                    {u ? 'شوہر حیات ہیں؟' : 'Husband Alive?'}
                  </label>
                  <select
                    value={husbandAlive ? 'yes' : 'no'}
                    onChange={(e) => setHusbandAlive(e.target.value === 'yes')}
                    className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="yes">{u ? 'ہاں' : 'Yes'}</option>
                    <option value="no">{u ? 'نہیں' : 'No'}</option>
                  </select>
                </div>
              )}

              {/* 5. Sons */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'بیٹے' : 'Sons'}
                </label>
                <input
                  type="number"
                  value={sons}
                  onChange={(e) => setSons(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  min="0"
                />
              </div>

              {/* 6. Daughters */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'بیٹیاں' : 'Daughters'}
                </label>
                <input
                  type="number"
                  value={daughters}
                  onChange={(e) => setDaughters(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  min="0"
                />
              </div>

              {/* 7. Father Alive */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'والد حیات ہیں؟' : 'Father Alive?'}
                </label>
                <select
                  value={fatherAlive ? 'yes' : 'no'}
                  onChange={(e) => setFatherAlive(e.target.value === 'yes')}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="yes">{u ? 'ہاں' : 'Yes'}</option>
                  <option value="no">{u ? 'نہیں' : 'No'}</option>
                </select>
              </div>

              {/* 8. Mother Alive */}
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-600">
                  {u ? 'والدہ حیات ہیں؟' : 'Mother Alive?'}
                </label>
                <select
                  value={motherAlive ? 'yes' : 'no'}
                  onChange={(e) => setMotherAlive(e.target.value === 'yes')}
                  className="w-full rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="yes">{u ? 'ہاں' : 'Yes'}</option>
                  <option value="no">{u ? 'نہیں' : 'No'}</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCalculate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                <Users className="h-4 w-4" />
                {u ? 'حساب لگائیں' : 'Calculate Shares'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-navy-200 px-4 py-3 font-semibold text-navy-600 transition hover:bg-navy-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Results */}
        {result && (
          <Reveal variant="up">
            <div id="calc-result" className="card-3d tilt-3d mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
              <div className="bg-emerald-600 px-6 py-3">
                <h3 className="font-serif text-lg font-bold text-white">
                  {u ? 'وراثت کے حصوں کی تفصیل' : 'Inheritance Share Breakdown'}
                </h3>
                {result.awlApplied && (
                  <p className="mt-1 text-sm text-emerald-100">
                    {u
                      ? ' totaled fractions 1 سے زیادہ ہیں — عول (تناسبی کمی) لاگو ہوئی'
                      : 'Total fixed shares exceeded 100% — \'Awl (proportional reduction) applied'}
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-100 bg-navy-50/50">
                      <th className="px-6 py-3 text-left font-semibold text-navy-700">
                        {u ? 'وارث' : 'Heir'}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-navy-700">
                        {u ? 'حصہ' : 'Share'}
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-navy-700">
                        {u ? 'رقم (روپے)' : 'Cash (Rs.)'}
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-navy-700">
                        {u ? `زمین (${result.landUnit})` : `Land (${result.landUnit})`}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.shares.map((s, i) => (
                      <tr key={i} className="border-b border-navy-50 last:border-0">
                        <td className="px-6 py-3 font-medium text-navy-800">{s.heir}</td>
                        <td className="px-4 py-3 text-center text-navy-600">{s.fraction}</td>
                        <td className="px-4 py-3 text-right font-semibold text-navy-700">
                          Rs. {formatNum(s.cash)}
                        </td>
                        <td className="px-4 py-3 text-right text-navy-600">
                          {s.land > 0 ? `${s.land} ${result.landUnit}` : '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-emerald-50 font-bold">
                      <td className="px-6 py-3 text-emerald-700">
                        {u ? 'کل' : 'TOTAL'}
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-700">
                        {Math.round(result.totalFraction * 100)}%
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        Rs. {formatNum(result.shares.reduce((s, x) => s + x.cash, 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        {result.shares.reduce((s, x) => s + x.land, 0) > 0
                          ? `${result.shares.reduce((s, x) => s + x.land, 0)} ${result.landUnit}`
                          : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.note && (
                <div className="mx-6 my-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-navy-600">
                  <Info className="inline h-3 w-3 text-amber-500 mr-1" />
                  {result.note}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 rounded-xl bg-amber-50/60 border border-amber-100 p-4 text-xs text-navy-500">
              <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" />
              {u
                ? 'یہ کیلکولیٹر ' +
                  (fiqh === 'hanafi' ? 'فقہ حنفی (اہل سنت)' : 'فقہ جعفری (اہل تشیع)') +
                  ' کے عام اصولوں کے مطابق اوپر فہرست کے ورثہ (بیوی، بچے، والدین) کے لیے حصوں کا حساب لگاتا ہے۔ جعفری فقہ میں بیوی زمین (غیر منقولہ جائیداد) کی وارث نہیں ہوتی؛ اسے صرف منقولہ مال اور عمارات/درختوں کی قیمت سے حصہ ملتا ہے۔ اس میں بہائیں، دادا/دادی، نانی/نانا، اور دیگر رشتے دار شامل نہیں ہیں۔ ساتھ ہی قرضوں، وصیت، اور دیگر مخصوص تفاوات کا بھی خیال نہیں رکھا جاتا۔ حقیقی وراثت کی تقسیم کے لیے براہ کرم کسی مستند اسلامی عالم یا قانونی ماہر سے رجوع کریں۔'
                : 'This calculator applies standard ' +
                  (fiqh === 'hanafi' ? 'Fiqh-e-Hanafi (Ahl-e-Sunnat)' : 'Fiqh-e-Jafria (Ahl-e-Tashi)') +
                  " inheritance (Faraidh) rules for the heirs listed above (spouse, children, parents). Under Jafria fiqh, a wife does not inherit land (immovable property); she only receives her share from movable wealth and the value of buildings/trees. It does not account for siblings, grandparents, other agnate/uterine relatives, debts, or wills. For actual estate distribution, please consult a qualified Islamic scholar or legal expert."}
            </div>

            <div className="mt-6 text-center">
              <button onClick={handleReset} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                <RefreshCw className="h-4 w-4" /> {u ? 'دوبارہ حساب لگائیں' : 'Calculate Again'}
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
