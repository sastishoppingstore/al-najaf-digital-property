const { build } = require('esbuild');
const fs = require('fs');
(async () => {
  await build({
    entryPoints: ['src/data/mock.ts'],
    bundle: true,
    format: 'cjs',
    outfile: '/tmp/opencode/mock-bundle.cjs',
    logLevel: 'error',
  });
  const { PROPERTIES } = require('/tmp/opencode/mock-bundle.cjs');
  const rows = PROPERTIES.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: Number(p.price) || 0,
    price_type: p.priceType || 'fixed',
    purpose: p.purpose || 'sale',
    category_id: p.category || 'houses',
    sub_category_id: p.subCategory || '',
    city: p.city || '',
    area: p.area || '',
    lat: p.lat || 0,
    lng: p.lng || 0,
    size: p.size || '',
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    furnished: p.furnished ? 1 : 0,
    seller_name: p.seller?.name || 'Owner',
    seller_type: p.seller?.type || 'Owner',
    seller_phone: p.seller?.phone || '',
    seller_whatsapp: p.seller?.whatsapp || p.seller?.phone || '',
    status: 'approved',
    featured: p.featured ? 1 : 0,
    premium: p.seller?.premium ? 1 : 0,
    verified: p.verified ? 1 : 0,
    images: Array.isArray(p.images) ? p.images : [],
    created_at: p.postedAt || null,
  }));
  fs.writeFileSync('/home/sastishoppingstore/project/public/api/seed-properties.json', JSON.stringify(rows));
  console.log('WROTE', rows.length, 'rows to public/api/seed-properties.json');
  const totalImgs = rows.reduce((s, r) => s + r.images.length, 0);
  console.log('total images:', totalImgs);
  console.log('sample id:', rows[0].id, '| last id:', rows[rows.length-1].id);
})();
