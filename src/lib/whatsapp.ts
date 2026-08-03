export function digitsOnly(s: string): string {
  return (s || '').replace(/[^0-9]/g, '');
}

/** Normalize a local (03xx-xxxxxxx) or international (+92 xxx xxxxxxx) phone number to wa.me format (923xxxxxxxxx). */
export function toWaNumber(phone: string): string {
  let d = digitsOnly(phone);
  if (!d) return d;
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '92' + d.slice(1);
  return d;
}

export function waLink(phone: string, text = 'Assalam o Alaikum'): string {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  return `tel:${digitsOnly(phone)}`;
}

export function formatPhone(phone: string): string {
  return phone || '';
}
