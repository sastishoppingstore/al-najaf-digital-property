const API_URL = new URL('api/index.php', window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') + '/').href;

export const REGISTRY_RATES = {
  stampDuty: { pct: 1, labelEn: 'Stamp Duty (1%)', labelUr: 'اسٹامپ ڈیوٹی (1%)', lawRef: 'Punjab Stamp Act 1899, amended via Finance Act 2025-26' },
  registrationFee: { labelEn: 'Registration Fee', labelUr: 'رجسٹریشن فیس', lawRef: 'Registration Act 1908' },
  localBodyFee: { pct: 1, labelEn: 'Local Body / Committee Fee (1%)', labelUr: 'لوکل باڈی / کمیٹی فیس (1%)', lawRef: 'Punjab Local Government Act 2022 — varies by TMA' },
  plraFee: { labelEn: 'PLRA Fee', labelUr: 'PLRA فیس', lawRef: 'Punjab Land Records Authority Act 2017' },
  advTax236K: { labelEn: 'Advance Tax 236K — Buyer', labelUr: 'ایڈوانس ٹیکس 236K — خریدار', lawRef: 'Income Tax Ordinance 2001, Sec 236K — FBR' },
  gainTax236C: { labelEn: 'Capital Gain Tax 236C — Seller', labelUr: 'کیپٹل گین ٹیکس 236C — بیچنے والا', lawRef: 'Income Tax Ordinance 2001, Sec 236C — FBR' },
  mapNonApprovalFee: { pct: 2, labelEn: 'Map Non-Approval Fee (2%)', labelUr: 'میپ نان اپروول فیس (2%)', lawRef: 'Punjab Development of Cities Act 1976' },
  mutationFee: { labelEn: 'Mutation Fee (~Rs. 600)', labelUr: 'انتقال فیس (~600 روپے)', lawRef: 'District Collector rate — varies by district' },
  comparisonFee: { labelEn: 'Comparison Fee (~Rs. 100)', labelUr: 'مقابلہ فیس (~100 روپے)', lawRef: 'District Collector rate — approximate, verify locally' },
  miscCharges: { labelEn: 'Miscellaneous Charges (~Rs. 15,000)', labelUr: 'متفرق اخراجات (~15,000 روپے)', lawRef: 'Deed writer / office charges — not government-fixed' },
};

export const TAX_SLABS = {
  filer236K: 1.25,
  nonFiler236K: { min: 10.5, max: 18.5 },
  lateFiler236K: null,
  filer236C: 2.75,
  nonFiler236C: 11,
  lateFiler236C: null,
};

export async function fetchApi(data: Record<string, unknown>) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch { return { success: false }; }
}
