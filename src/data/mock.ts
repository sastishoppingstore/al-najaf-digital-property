export type PropertyCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  count: number;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'negotiable' | 'on-call';
  purpose: 'sale' | 'rent' | 'requirement';
  category: string;
  subCategory?: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  size: string;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  verified: boolean;
  featured?: boolean;
  postedAt: string;
  images: string[];
  seller: {
    name: string;
    type: 'Owner' | 'Agent' | 'Dealer';
    memberSince: string;
    totalAds: number;
    rating: number;
    phone: string;
    premium?: boolean;
  };
};

export type SubCategory = {
  id: string;
  label: string;
  categoryId: string;
};

export const SUB_CATEGORIES: SubCategory[] = [
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

export type Service = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  fee: string;
  duration: string;
  icon: string;
  image: string;
  category: string;
};

export type Lawyer = {
  id: string;
  name: string;
  designation: string;
  specializations: string[];
  experience: number;
  rating: number;
  reviews: number;
  fee: number;
  city: string;
  image: string;
  barCouncil: string;
  education: string;
  bio: string;
};

export const CATEGORIES: PropertyCategory[] = [
  { id: 'houses', name: 'Houses', icon: 'House', description: 'Built houses for sale or rent', image: '/images/cat-houses.jpg', count: 20 },
  { id: 'flats', name: 'Flats & Apartments', icon: 'Building', description: 'Apartments and flats for sale or rent', image: '/images/cat-flats.jpg', count: 20 },
  { id: 'plots', name: 'Plots & Land', icon: 'Square', description: 'Residential and commercial plots', image: '/images/cat-plots.jpg', count: 15 },
  { id: 'commercial', name: 'Commercial', icon: 'Building2', description: 'Shops, offices, buildings', image: '/images/cat-commercial.jpg', count: 10 },
];

export const SERVICES: Service[] = [
  { id: 'lawyer', name: 'Lawyer / Legal Services', shortName: 'Lawyer', description: 'Consult verified lawyers for property, civil, criminal, family and corporate cases.', fee: 'From PKR 2,000', duration: '1-3 days', icon: 'Scale', image: '/images/svc-lawyer.jpg?v=2', category: 'legal' },
  { id: 'estamp', name: 'E-Stamp', shortName: 'E-Stamp', description: 'Apply for e-stamp papers with live selfie verification.', fee: 'From PKR 500', duration: '3-5 days', icon: 'Stamp', image: '/images/svc-estamp.jpg?v=2', category: 'legal' },
  { id: 'land-registration', name: 'Land Registration', shortName: 'Registration', description: 'Register your land with full documentation support.', fee: 'From PKR 5,000', duration: '7-14 days', icon: 'FileText', image: '/images/svc-land-registration.jpg?v=2', category: 'legal' },
  { id: 'intiqal', name: 'Intiqal (Mutation)', shortName: 'Intiqal', description: 'Transfer property ownership through mutation records.', fee: 'From PKR 3,000', duration: '7-10 days', icon: 'ArrowLeftRight', image: '/images/svc-intiqal.jpg?v=2', category: 'legal' },
  { id: 'kiraya-nama', name: 'Kiraya Nama (Rent Agreement)', shortName: 'Kiraya Nama', description: 'Draft and register rent agreements with legal validity.', fee: 'From PKR 1,500', duration: '1-2 days', icon: 'FileSignature', image: '/images/svc-kiraya-nama.jpg?v=2', category: 'legal' },
  { id: 'hibba-nama', name: 'Hibba Nama (Gift Deed)', shortName: 'Hibba Nama', description: 'Transfer property as a gift through a registered deed.', fee: 'From PKR 2,500', duration: '3-5 days', icon: 'Gift', image: '/images/svc-hibba-nama.jpg', category: 'legal' },
  { id: 'aaq-nama', name: 'Aaq Nama (Relinquishment)', shortName: 'Aaq Nama', description: 'Relinquish your share in inherited property legally.', fee: 'From PKR 2,500', duration: '3-5 days', icon: 'FileMinus', image: '/images/svc-aaq-nama.jpg', category: 'legal' },
  { id: 'talaq-nama', name: 'Talaq Nama (Divorce Deed)', shortName: 'Talaq Nama', description: 'Draft divorce deeds with proper legal procedure.', fee: 'From PKR 2,000', duration: '2-4 days', icon: 'FileX', image: '/images/svc-talaq-nama.jpg', category: 'legal' },
  { id: 'bayan-halfi', name: 'Bayan Halfi (Affidavit)', shortName: 'Affidavit', description: 'Create sworn affidavits for various legal needs.', fee: 'From PKR 800', duration: '1 day', icon: 'Scroll', image: '/images/svc-bayan-halfi.jpg', category: 'legal' },
  { id: 'power-attorney', name: 'Power of Attorney', shortName: 'Power of Attorney', description: 'Authorize someone to act on your behalf legally.', fee: 'From PKR 2,000', duration: '2-3 days', icon: 'FileSignature', image: '/images/svc-power-attorney.jpg', category: 'legal' },
  { id: 'wasiyat', name: 'Will / Wasiyat Nama', shortName: 'Will', description: 'Draft a legally binding will for your assets.', fee: 'From PKR 1,500', duration: '1-2 days', icon: 'BookText', image: '/images/svc-wasiyat.jpg', category: 'legal' },
  { id: 'gas-meter', name: 'Gas Meter Transfer', shortName: 'Gas Meter', description: 'Transfer gas meter connection to new owner.', fee: 'From PKR 1,000', duration: '3-5 days', icon: 'Flame', image: '/images/svc-gas-meter.jpg?v=2', category: 'utility' },
  { id: 'electricity-meter', name: 'Electricity Meter Transfer', shortName: 'Electricity', description: 'Transfer electricity meter to new owner name.', fee: 'From PKR 1,000', duration: '3-5 days', icon: 'Zap', image: '/images/svc-electricity-meter.jpg?v=2', category: 'utility' },
  { id: 'water-meter', name: 'Water Meter Transfer', shortName: 'Water', description: 'Transfer water connection and meter ownership.', fee: 'From PKR 800', duration: '2-4 days', icon: 'Droplets', image: '/images/svc-water-meter.jpg?v=2', category: 'utility' },
  { id: 'sewerage', name: 'Sewerage Connection', shortName: 'Sewerage', description: 'Apply for new sewerage connection for your property.', fee: 'From PKR 1,500', duration: '5-7 days', icon: 'Droplets', image: '/images/svc-sewerage.jpg', category: 'utility' },
  { id: 'valuation', name: 'Property Valuation', shortName: 'Valuation', description: 'Get certified property valuation reports.', fee: 'From PKR 3,000', duration: '2-3 days', icon: 'Calculator', image: '/images/svc-valuation.jpg?v=2', category: 'valuation' },
  { id: 'attestation', name: 'Document Attestation', shortName: 'Attestation', description: 'Attest your legal documents officially.', fee: 'From PKR 500', duration: '1-2 days', icon: 'BadgeCheck', image: '/images/svc-attestation.jpg?v=2', category: 'legal' },
];

export const LAWYERS: Lawyer[] = [
  { id: 'l1', name: 'Adv. Muhammad Imran Qureshi', designation: 'Senior Advocate High Court', specializations: ['Property', 'Civil'], experience: 15, rating: 4.8, reviews: 124, fee: 3000, city: 'Lahore', image: '/images/lawyer-1.jpg', barCouncil: 'Punjab Bar Council', education: 'LLB, University of the Punjab', bio: 'Specialist in property disputes, land litigation, and civil matters with 15 years of courtroom experience.' },
  { id: 'l2', name: 'Adv. Sana Farooq', designation: 'Advocate High Court', specializations: ['Family', 'Civil'], experience: 8, rating: 4.6, reviews: 67, fee: 2000, city: 'Karachi', image: '/images/lawyer-2.jpg', barCouncil: 'Sindh Bar Council', education: 'LLB, University of Karachi', bio: 'Family law expert handling divorce, inheritance, and guardianship cases with compassion.' },
  { id: 'l3', name: 'Adv. Abdul Rehman Gilani', designation: 'Senior Advocate Supreme Court', specializations: ['Corporate', 'Property'], experience: 22, rating: 4.9, reviews: 201, fee: 5000, city: 'Islamabad', image: '/images/lawyer-3.jpg', barCouncil: 'Islamabad Bar Council', education: 'LLM, Quaid-i-Azam University', bio: 'Corporate and property law veteran advising major real estate developers and companies.' },
  { id: 'l4', name: 'Adv. Fatima Zahra', designation: 'Advocate District Court', specializations: ['Criminal', 'Family'], experience: 5, rating: 4.5, reviews: 38, fee: 1500, city: 'Lahore', image: '/images/lawyer-4.jpg', barCouncil: 'Punjab Bar Council', education: 'LLB, University of the Punjab', bio: 'Dedicated criminal defense and family law practitioner with strong client focus.' },
  { id: 'l5', name: 'Adv. Bilal Hussain Shah', designation: 'Advocate High Court', specializations: ['Property', 'Corporate'], experience: 11, rating: 4.7, reviews: 89, fee: 2500, city: 'Multan', image: '/images/lawyer-5.jpg', barCouncil: 'Punjab Bar Council', education: 'LLB, Bahauddin Zakariya University', bio: 'Property transactions and corporate compliance specialist serving South Punjab.' },
];

export const PROPERTIES: Property[] = [
  {
    id: 'z1', title: 'MODERN DESIGNER SOLAR POWER HOUSE IN MULTI GARDENS B-17, ISLAMABAD FOR SALE', description: '10 Marla Luxury Designer House | Prime Block C | 5 Beds | Double Height Lounge | 10kW Solar | Multi', price: 64000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Islamabad', area: 'B-17', lat: 33.679925, lng: 72.823906, size: '8 Marla', bedrooms: 6, bathrooms: 7, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p1-1.jpg', '/images/p1-2.jpg', '/images/p1-3.jpg', '/images/p1-4.jpg', '/images/p1-5.jpg'], seller: { name: 'Nasir Khattak', type: 'Agent', memberSince: '2025', totalAds: 54, rating: 3.5, phone: '+923324641430' },
  },
  {
    id: 'z2', title: 'Kanal Brand New Royal Spanish Bungalow At The Idea Location Of DHA Phase 7 Walking Distance To Raya Fairway', description: 'Home Estate & Builder Offer\n Owner Needy\n Urgentlly Sale \n Dont Miss This Golden Opportunity\n Home', price: 64200000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'DHA Defence', lat: 31.483429, lng: 74.488935, size: '16 Marla', bedrooms: 5, bathrooms: 6, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p2-1.jpg', '/images/p2-2.jpg', '/images/p2-3.jpg', '/images/p2-4.jpg', '/images/p2-5.jpg'], seller: { name: 'Badshah MALIK', type: 'Agent', memberSince: '2025', totalAds: 42, rating: 3.5, phone: '+923218490004' },
  },
  {
    id: 'z3', title: 'Kanal Modern Luxury House For Sale Close To Macdonold Park & Commercial', description: 'Proposal House \n\nONE KANAL Bungalow Details:\n\n5 Master Bed With Attached Baths\n6 Bathrooms In The', price: 76500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'DHA Defence', lat: 31.45217, lng: 74.489794, size: '16 Marla', bedrooms: 5, bathrooms: 6, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p3-1.jpg', '/images/p3-2.jpg', '/images/p3-3.jpg', '/images/p3-4.jpg', '/images/p3-5.jpg'], seller: { name: 'Awais', type: 'Agent', memberSince: '2025', totalAds: 25, rating: 3.5, phone: '+923005370606' },
  },
  {
    id: 'z4', title: 'CORNER HOUSE FOR SALE', description: 'F 8 1 Corner House Old House 5 Bed Room Corner House\n 60 Feet St Proper 2 Street Corner Old', price: 245000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', subCategory: 'house', city: 'Islamabad', area: 'F-8', lat: 33.713131, lng: 73.038383, size: '16 Marla', bedrooms: 5, bathrooms: 5, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p4-1.jpg', '/images/p4-2.jpg', '/images/p4-3.jpg', '/images/p4-4.jpg', '/images/p4-5.jpg'], seller: { name: 'Sardar Raza', type: 'Agent', memberSince: '2025', totalAds: 13, rating: 4.5, phone: '+923015249265', premium: true },
  },
  {
    id: 'z5', title: 'Designer House Ready to move 272sq yd 4 & 5 Bedroom DDL Luxury Villa FOR SALE. Only 4km from Main Entrance of BTK. Near ', description: 'A luxurious villa in Precinct 8 of Bahria Town Karachi. This villa offers a spacious living', price: 46500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Karachi', area: 'Bahria Town Karachi', lat: 25.0474, lng: 67.313864, size: '8 Marla', bedrooms: 5, bathrooms: 5, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p5-1.jpg', '/images/p5-2.jpg', '/images/p5-3.jpg', '/images/p5-4.jpg', '/images/p5-5.jpg'], seller: { name: 'Abdul Sattar', type: 'Agent', memberSince: '2025', totalAds: 19, rating: 3.5, phone: '+923334783852' },
  },
  {
    id: 'z6', title: '12 Marla Ultra Spanish English Style House Available For Sale In Joher Town Phase II Lahore', description: '12 MARLA BRAND NEW HOUSE FOR SALE\n 12 MARLA luxery condition brand new Ultra Modern style Double', price: 67200000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'Johar Town', lat: 31.469082, lng: 74.266148, size: '9 Marla', bedrooms: 5, bathrooms: 6, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p6-1.jpg', '/images/p6-2.jpg', '/images/p6-3.jpg', '/images/p6-4.jpg', '/images/p6-5.jpg'], seller: { name: 'Muhammad Awais', type: 'Agent', memberSince: '2025', totalAds: 48, rating: 3.5, phone: '+923214534760' },
  },
  {
    id: 'z7', title: '100 Percent Original Add Near Defence Raya And Masjid One Kanal Brand New Modern Ultra Luxury Supreme Location House In ', description: '100 Percent Original Add Near Crrefour And Masjid\n The Sapphire Properties Offers \n One Kanal Brand', price: 76500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'DHA Defence', lat: 31.497848, lng: 74.476147, size: '16 Marla', bedrooms: 5, bathrooms: 6, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p7-1.jpg', '/images/p7-2.jpg', '/images/p7-3.jpg', '/images/p7-4.jpg', '/images/p7-5.jpg'], seller: { name: 'Shoaib Akhtar', type: 'Agent', memberSince: '2025', totalAds: 32, rating: 3.5, phone: '+923011074786' },
  },
  {
    id: 'z8', title: 'Extremely Beautiful House For Sale With Underground Huge Water', description: 'Brand New House Have\n 7 Bedrooms\n 1 Drawing Room\n 1servant Quarter\n 2T. V Lounge\n 24 Hr Underground', price: 58000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Islamabad', area: 'B-17', lat: 33.68064, lng: 72.822189, size: '10 Marla', bedrooms: 7, bathrooms: 6, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p8-1.jpg', '/images/p8-2.jpg', '/images/p8-3.jpg', '/images/p8-4.jpg', '/images/p8-5.jpg'], seller: { name: 'Razzak Khattak', type: 'Agent', memberSince: '2025', totalAds: 25, rating: 3.5, phone: '+923340538645' },
  },
  {
    id: 'z9', title: 'CHANCE DEAL AT Prime Location In Askari 6 300 Square Yards House For Sale', description: 'Brigadier House Available For Sale\n Askari 6\n Sector 4\n 300 Square Yards\n 5beds\n 5 Baths\n 2 Kitchen', price: 78000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', subCategory: 'house', city: 'Karachi', area: 'Cantt', lat: 24.979905, lng: 67.236394, size: '9 Marla', bedrooms: 5, bathrooms: 5, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p9-1.jpg', '/images/p9-2.jpg', '/images/p9-3.jpg', '/images/p9-4.jpg', '/images/p9-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 30, rating: 4.5, phone: '+923198407050', premium: true },
  },
  {
    id: 'z10', title: 'You Can Find A Gorgeous Prime Location House For Sale In Askari 6', description: 'Brigadier house Available For Sale \n Askari 6 \n Sector 4 \n 300 Square Yards \n 5beds \n 5 baths \n 2', price: 76000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Karachi', area: 'Cantt', lat: 24.979905, lng: 67.236394, size: '9 Marla', bedrooms: 5, bathrooms: 5, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p10-1.jpg', '/images/p10-2.jpg', '/images/p10-3.jpg', '/images/p10-4.jpg', '/images/p10-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 25, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z11', title: 'Looking For A Prime Location House In Askari 6', description: 'Askari 6 Villas Sector 1 | Prime Living in a Secure Community\n \nExperience premium living in the', price: 85000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Karachi', area: 'Cantt', lat: 24.979905, lng: 67.236394, size: '12 Marla', bedrooms: 5, bathrooms: 5, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p11-1.jpg', '/images/p11-2.jpg', '/images/p11-3.jpg', '/images/p11-4.jpg', '/images/p11-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 27, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z12', title: '240 Yards Luxurious Villa In Block D', description: '240 yards one unit Vila available for sale . \n in block D \n 40 feet road facing. \n west open \n next', price: 75000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Karachi', area: 'Naya Nazimabad', lat: 24.969255, lng: 67.039855, size: '7 Marla', bedrooms: 5, bathrooms: 6, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p12-1.jpg', '/images/p12-2.jpg', '/images/p12-3.jpg', '/images/p12-4.jpg', '/images/p12-5.jpg'], seller: { name: 'Zia Farooqui', type: 'Agent', memberSince: '2025', totalAds: 37, rating: 3.5, phone: '+923498964563' },
  },
  {
    id: 'z13', title: '1 Kanal Used House For Sale In Overseas B Extension Block Bahria Town Lahore', description: '1 Kanal Used House For Sale in Overseas B Extension Block Bahria Town Lahore\n 100% Attachment Pics', price: 56000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'Bahria Town', lat: 31.36730921, lng: 74.15951239, size: '16 Marla', bedrooms: 4, bathrooms: 4, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p13-1.jpg', '/images/p13-2.jpg', '/images/p13-3.jpg', '/images/p13-4.jpg', '/images/p13-5.jpg'], seller: { name: 'Asad Malhi', type: 'Owner', memberSince: '2025', totalAds: 30, rating: 3.5, phone: '+923155355353' },
  },
  {
    id: 'z14', title: 'Brand New G+2 House For Sale Gulshan E Iqbal Karachi Sindh', description: 'Brand new 120 sq. Yard G+2 house having 6 bedrooms with attached bathrooms Drawing rooms with', price: 62500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Karachi', area: 'Gulshan-e-Iqbal Town', lat: 24.91567, lng: 67.083628, size: '4 Marla', bedrooms: 6, bathrooms: 7, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p14-1.jpg', '/images/p14-2.jpg', '/images/p14-3.jpg', '/images/p14-4.jpg', '/images/p14-5.jpg'], seller: { name: 'Muhammad Talha Pasta', type: 'Agent', memberSince: '2025', totalAds: 48, rating: 4.5, phone: '+923422223863' },
  },
  {
    id: 'z15', title: '1 Kanal Luxury Bungalow With Basement For Sale At Super Hot Location Near Defence Raya Prime Location', description: '01 KANAL BRAND NEW LUXURIOUS HOUSE FOR SALE IN DHA PHASE 7 \n MAJEED REAL ESTATE OFFER:\n Original', price: 82500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'DHA Defence', lat: 31.455522, lng: 74.465523, size: '16 Marla', bedrooms: 5, bathrooms: 6, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p15-1.jpg', '/images/p15-2.jpg', '/images/p15-3.jpg', '/images/p15-4.jpg', '/images/p15-5.jpg'], seller: { name: 'Ch Zahid Farooq', type: 'Agent', memberSince: '2025', totalAds: 54, rating: 3.5, phone: '+923212206661' },
  },
  {
    id: 'z16', title: '11 Marla Corner Out Standing Designer House Available For Sale IN DHA Phase7 Top Location', description: 'Faisal Properties. . . . . . For Sale: Brand New Luxury House 10 Marla DHA Phase 7 In each room AC', price: 44500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'DHA Defence', lat: 31.484893, lng: 74.472342, size: '9 Marla', bedrooms: 4, bathrooms: 6, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p16-1.jpg', '/images/p16-2.jpg', '/images/p16-3.jpg', '/images/p16-4.jpg', '/images/p16-5.jpg'], seller: { name: 'Faisal properties', type: 'Agent', memberSince: '2025', totalAds: 36, rating: 3.5, phone: '+923002224531' },
  },
  {
    id: 'z17', title: '10 Marla Spanish House Available For Sale In L. D. A Avenue Block J Lahore', description: '6 Spacious Bedroom 6 Bathroom 2 Kitchen 2 Tv Lounge 1 Drawing Room Available For Rent In Lda Avenue', price: 38500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'LDA Avenue', lat: 31.40918, lng: 74.210107, size: '8 Marla', bedrooms: 6, bathrooms: 6, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p17-1.jpg', '/images/p17-2.jpg', '/images/p17-3.jpg', '/images/p17-4.jpg', '/images/p17-5.jpg'], seller: { name: 'ASIM RAZA', type: 'Agent', memberSince: '2025', totalAds: 38, rating: 4.5, phone: '+923254949999' },
  },
  {
    id: 'z18', title: '10 Marla Brand New Spanish House Available For Sale in L. D. A Avenue 1 Block J Lahore', description: '5 Spacious Bedroom 6 Bathroom 2 Kitchen 2 Tv Lounge 1 Drawing Room Available For Sale In Lda Avenue', price: 39000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'LDA Avenue', lat: 31.40918, lng: 74.210107, size: '8 Marla', bedrooms: 5, bathrooms: 7, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p18-1.jpg', '/images/p18-2.jpg', '/images/p18-3.jpg', '/images/p18-4.jpg', '/images/p18-5.jpg'], seller: { name: 'ASIM RAZA', type: 'Agent', memberSince: '2025', totalAds: 37, rating: 4.5, phone: '+923254949999' },
  },
  {
    id: 'z19', title: '1 Kanal Beautiful Double Storey House In AWT Phase 2| Gas & Electricity Installed |Prime Location In AWT Phase 2', description: 'A rare opportunity to own a beautifully located 1 Kanal Double Storey House in the highly', price: 36500000, priceType: 'negotiable', purpose: 'sale', category: 'houses', city: 'Lahore', area: 'Raiwind Road', lat: 31.354743, lng: 74.212191, size: '16 Marla', bedrooms: 5, bathrooms: 5, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p19-1.jpg', '/images/p19-2.jpg', '/images/p19-3.jpg', '/images/p19-4.jpg', '/images/p19-5.jpg'], seller: { name: 'Saleem Noor', type: 'Agent', memberSince: '2025', totalAds: 11, rating: 3.5, phone: '+923008388858' },
  },
  {
    id: 'z20', title: 'Book A 1 Kanal House In DHA Phase 4 - Block DD', description: 'The best feature of the House is its prime central location and such a property is hard to come by', price: 105000000, priceType: 'negotiable', purpose: 'sale', category: 'houses', subCategory: 'house', city: 'Lahore', area: 'DHA Defence', lat: 31.46641, lng: 74.383621, size: '16 Marla', bedrooms: 5, bathrooms: 6, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p20-1.jpg', '/images/p20-2.jpg', '/images/p20-3.jpg', '/images/p20-4.jpg', '/images/p20-5.jpg'], seller: { name: 'Malik Aqeel Abbas', type: 'Agent', memberSince: '2025', totalAds: 39, rating: 4.5, phone: '+923214997912', premium: true },
  },
  {
    id: 'z21', title: 'Modern Luxury Apartment With Premium Amenities Also Available On Installments', description: 'A Residential Development In Naya Nazimabad, Karachi, Offering 2, 3, And 4-Bedroom Apartments', price: 17500000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Naya Nazimabad', lat: 24.969255, lng: 67.039855, size: '2 Bed', bedrooms: 2, bathrooms: 3, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p21-1.jpg', '/images/p21-2.jpg', '/images/p21-3.jpg', '/images/p21-4.jpg', '/images/p21-5.jpg'], seller: { name: 'Abdullah Rehman', type: 'Agent', memberSince: '2025', totalAds: 19, rating: 3.5, phone: '+923042376225' },
  },
  {
    id: 'z22', title: 'Globe Residency Apartments For Sale Comfort, Class & Convenience In Naya Nazimabad!', description: 'Globe Residency Apartments Naya Nazimabad\n Modern Living. Prime Location. Easy Payment on Loan! \n 2', price: 20000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Naya Nazimabad', lat: 24.969255, lng: 67.039855, size: '4 Bed', bedrooms: 4, bathrooms: 2, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p22-1.jpg', '/images/p22-2.jpg', '/images/p22-3.jpg', '/images/p22-4.jpg', '/images/p22-5.jpg'], seller: { name: 'Abdullah Rehman', type: 'Agent', memberSince: '2025', totalAds: 28, rating: 3.5, phone: '+923042376225' },
  },
  {
    id: 'z23', title: 'Clifton Block 1 Brand New Grand Monarch Sea Side Residency', description: 'Clifton Block 1 Brand New Grand Monarch Sea Side Residency 3,4,5 Bedrooms Attached Bathrooms D TVL', price: 90000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', subCategory: 'flat', city: 'Karachi', area: 'Clifton', lat: 24.817121, lng: 66.998363, size: '3 Bed', bedrooms: 3, bathrooms: 5, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p23-1.jpg', '/images/p23-2.jpg', '/images/p23-3.jpg', '/images/p23-4.jpg', '/images/p23-5.jpg'], seller: { name: 'Dildar Ali Channa', type: 'Agent', memberSince: '2025', totalAds: 15, rating: 4.5, phone: '+923352444323', premium: true },
  },
  {
    id: 'z24', title: 'Apartment For sale', description: '*THE HILLS by SUMSUM*\n \n*4 BED DRAWING DINING* Brand New *Westopen* & *Corner* LUXURY APARTMENT', price: 73500000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Gulshan-e-Iqbal Town', lat: 24.895196, lng: 67.084107, size: '4 Bed', bedrooms: 4, bathrooms: 4, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p24-1.jpg', '/images/p24-2.jpg', '/images/p24-3.jpg', '/images/p24-4.jpg', '/images/p24-5.jpg'], seller: { name: 'Abdul Sattar Mianoor', type: 'Agent', memberSince: '2025', totalAds: 21, rating: 3.5, phone: '+923357197815' },
  },
  {
    id: 'z25', title: 'Prime Location WEST OPEN CHANCE DEAL IDEAL FLOOR ,SEMI FURNISHED 3000SQFT', description: '4 Bed Apartment Askari 6 \n Experience premium living in the most secure AREA\n This ready-to-move', price: 39000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.979905, lng: 67.236394, size: '4 Bed', bedrooms: 4, bathrooms: 4, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p25-1.jpg', '/images/p25-2.jpg', '/images/p25-3.jpg', '/images/p25-4.jpg', '/images/p25-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 15, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z26', title: 'Prime Location Flat Sized 3000 Square Feet Is Available For Sale In Askari 6', description: '4 Bed Apartment Askari 6 \n Experience premium living in the most secure and well-managed community', price: 41000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.979905, lng: 67.236394, size: '4 Bed', bedrooms: 4, bathrooms: 4, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p26-1.jpg', '/images/p26-2.jpg', '/images/p26-3.jpg', '/images/p26-4.jpg', '/images/p26-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 20, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z27', title: 'Prime Location 2480 Square Feet Flat For Sale In Askari 5 - Sector J Karachi', description: '3 Bed Apartment Askari 5, Sector J \n \nExperience premium living in the most secure and well-managed', price: 42500000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.938837, lng: 67.183516, size: '3 Bed', bedrooms: 3, bathrooms: 3, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p27-1.jpg', '/images/p27-2.jpg', '/images/p27-3.jpg', '/images/p27-4.jpg', '/images/p27-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 13, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z28', title: 'Prime Location Askari 5 - Sector J Flat Sized 2480 Square Feet Is Available', description: '3 Bed Apartment Askari 5, Sector J \n \nExperience premium living in the most secure and well-managed', price: 44000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.938837, lng: 67.183516, size: '3 Bed', bedrooms: 3, bathrooms: 3, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p28-1.jpg', '/images/p28-2.jpg', '/images/p28-3.jpg', '/images/p28-4.jpg', '/images/p28-5.jpg'], seller: { name: 'Sarah Khalil', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923198407050' },
  },
  {
    id: 'z29', title: 'Creek Vista 4 Bed Outer Side View In Front Of Moin Khan Facing Apartment For Sell Fully Renovated', description: 'Alhamdulillah I am specialist of Creek Vitsa since last 15 years\n \n CHANCE DEAL\n\n CREEK VISTA 4 BED', price: 129000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'DHA Defence', lat: 24.777115, lng: 67.089857, size: '4 Bed', bedrooms: 4, bathrooms: 5, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p29-1.jpg', '/images/p29-2.jpg', '/images/p29-3.jpg', '/images/p29-4.jpg', '/images/p29-5.jpg'], seller: { name: '??k? v??w', type: 'Agent', memberSince: '2025', totalAds: 21, rating: 3.5, phone: '+923089196906' },
  },
  {
    id: 'z30', title: 'Flat In Askari 5 - Sector J For Sale', description: 'You can become a proud owner of property in Askari 5 - Sector J if you only time your decision', price: 43000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.938837, lng: 67.183516, size: '3 Bed', bedrooms: 3, bathrooms: 3, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p30-1.jpg', '/images/p30-2.jpg', '/images/p30-3.jpg', '/images/p30-4.jpg', '/images/p30-5.jpg'], seller: { name: 'Muhammad Ahsan', type: 'Agent', memberSince: '2025', totalAds: 24, rating: 4.5, phone: '+923002664668' },
  },
  {
    id: 'z31', title: 'Sale The Ideally Located Flat For An Incredible Price', description: 'What could possible get more better than a property priced at Rs. 44300000. Plus, it has features', price: 44300000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.938837, lng: 67.183516, size: '3 Bed', bedrooms: 3, bathrooms: 3, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p31-1.jpg', '/images/p31-2.jpg', '/images/p31-3.jpg', '/images/p31-4.jpg', '/images/p31-5.jpg'], seller: { name: 'Muhammad Ahsan', type: 'Agent', memberSince: '2025', totalAds: 24, rating: 4.5, phone: '+923002664668' },
  },
  {
    id: 'z32', title: 'Flat For Sale Situated In Askari 5 - Sector J', description: 'Malir cantt Askari 5\n Sector j\n Block 24\n Installment Flat available for sale\n Tallest residential', price: 15000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Cantt', lat: 24.938837, lng: 67.183516, size: '3 Bed', bedrooms: 3, bathrooms: 3, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p32-1.jpg', '/images/p32-2.jpg', '/images/p32-3.jpg', '/images/p32-4.jpg'], seller: { name: 'Muhammad Ahsan', type: 'Agent', memberSince: '2025', totalAds: 9, rating: 4.5, phone: '+923002664668' },
  },
  {
    id: 'z33', title: 'In H-13 Flat For Sale Sized 950 Square Feet', description: '2 Bed 2 Bath Tvl Kitchen 950 Sq Ft\n Total Price 1,52,10,560\n 30% Down Payment 45,63,168\n Reaming 8', price: 15210560, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Islamabad', area: 'H-13', lat: 33.637489, lng: 72.972193, size: '2 Bed', bedrooms: 2, bathrooms: 2, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p33-1.jpg', '/images/p33-2.jpg', '/images/p33-3.jpg', '/images/p33-4.jpg', '/images/p33-5.jpg'], seller: { name: 'Fahad Arshad', type: 'Agent', memberSince: '2025', totalAds: 13, rating: 4.5, phone: '+923400333335' },
  },
  {
    id: 'z34', title: 'Fully Furnished 1-Bed Apartment For Sale 806 Sq. Ft. | Courtyard View | Lahore', description: 'A beautifully maintained, fully furnished 1-bedroom apartment is available for sale in Spring', price: 15600000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Lahore', area: 'Main Canal Bank Road', lat: 31.413029, lng: 74.168558, size: '1 Bed', bedrooms: 1, bathrooms: 1, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p34-1.jpg', '/images/p34-2.jpg', '/images/p34-3.jpg', '/images/p34-4.jpg', '/images/p34-5.jpg'], seller: { name: 'Mian Umair Nadeem', type: 'Owner', memberSince: '2025', totalAds: 10, rating: 3.5, phone: '+923234429311' },
  },
  {
    id: 'z35', title: 'Skypark One 2 Bed Available For Sale', description: 'Skypark One 2 Bedroom Luxury Apartment\n Property Highlights:\n - 2 Bedrooms with 2 Bathrooms\n -', price: 38000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Islamabad', area: 'Gulberg', lat: 33.602203, lng: 73.15869, size: '2 Bed', bedrooms: 2, bathrooms: 2, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p35-1.jpg', '/images/p35-2.jpg', '/images/p35-3.jpg', '/images/p35-4.jpg', '/images/p35-5.jpg'], seller: { name: 'Sajid Raqeeb', type: 'Agent', memberSince: '2025', totalAds: 37, rating: 3.5, phone: '+923075288855' },
  },
  {
    id: 'z36', title: '12% Rented Apartments are available', description: 'Invest in Luxury. Earn with Confidence. \n\nOwn a premium apartment in the heart of Lahore\'s most', price: 10000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Lahore', area: 'Gulberg', lat: 31.510471, lng: 74.350526, size: '0 Bed', bedrooms: 0, bathrooms: 1, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p36-1.jpg', '/images/p36-2.jpg', '/images/p36-3.jpg', '/images/p36-4.jpg', '/images/p36-5.jpg'], seller: { name: 'Salar Pasha', type: 'Owner', memberSince: '2025', totalAds: 19, rating: 3.5, phone: '+923164206688' },
  },
  {
    id: 'z37', title: '3 Bed Apartment For Sale Askari Heights 4, DHA Phase 5', description: '3 Bed Apartment For Sale Askari Heights 4, DHA Phase 5\n\n Location: Askari Heights 4, DHA Phase 5\n 3', price: 33500000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Islamabad', area: 'DHA Defence', lat: 33.5371833, lng: 73.2250407, size: '3 Bed', bedrooms: 3, bathrooms: 4, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p37-1.jpg', '/images/p37-2.jpg', '/images/p37-3.jpg', '/images/p37-4.jpg', '/images/p37-5.jpg'], seller: { name: 'Nasir Jamal', type: 'Agent', memberSince: '2025', totalAds: 20, rating: 3.5, phone: '+923351450005' },
  },
  {
    id: 'z38', title: '1 Bed Flat Available For Sale With Possession On Easy Installments', description: '1 Bed Flat Available For Sale With Possession On Easy Installments\n Take Possession On Half Amount\n', price: 7900000, priceType: 'fixed', purpose: 'sale', category: 'flats', city: 'Lahore', area: 'Bahria Town', lat: 31.364887, lng: 74.186554, size: '1 Bed', bedrooms: 1, bathrooms: 1, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p38-1.jpg', '/images/p38-2.jpg', '/images/p38-3.jpg', '/images/p38-4.jpg', '/images/p38-5.jpg'], seller: { name: 'Abdul Mannan Maqbool', type: 'Agent', memberSince: '2025', totalAds: 16, rating: 3.5, phone: '+923043321000' },
  },
  {
    id: 'z39', title: 'Beautiful Apartment Available For Sale', description: 'Beautiful Apartment Available For Sale In NHS Karsaz\n Peaceful Environment. \n Reasonable Demand. \n', price: 147500000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Navy Housing Scheme Karsaz', lat: 24.893299, lng: 67.103462, size: '5 Bed', bedrooms: 5, bathrooms: 5, furnished: true, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p39-1.jpg', '/images/p39-2.jpg', '/images/p39-3.jpg', '/images/p39-4.jpg', '/images/p39-5.jpg'], seller: { name: 'Mian International', type: 'Agent', memberSince: '2025', totalAds: 15, rating: 3.5, phone: '+923332156440' },
  },
  {
    id: 'z40', title: 'Apartment Available For Sale', description: 'Please carefully read the description\n This apartment is west open. \n 5 bedrooms with attached', price: 150000000, priceType: 'negotiable', purpose: 'sale', category: 'flats', city: 'Karachi', area: 'Navy Housing Scheme Karsaz', lat: 24.893299, lng: 67.103462, size: '5 Bed', bedrooms: 5, bathrooms: 5, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p40-1.jpg', '/images/p40-2.jpg', '/images/p40-3.jpg', '/images/p40-4.jpg', '/images/p40-5.jpg'], seller: { name: 'Mian International', type: 'Agent', memberSince: '2025', totalAds: 21, rating: 3.5, phone: '+923332156440' },
  },
  {
    id: 'z41', title: 'Highly-Desirable 440 Square Feet Shop Available In Safari Enclave Apartments', description: '*Shop For Sale* \n*Location*: Safari Enclave \n*Size*: 11 x 40 = 440 sqft \n*Features*: \n- Best', price: 27500000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', subCategory: 'shop', city: 'Karachi', area: 'University Road', lat: 24.938947, lng: 67.155589, size: '1 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p41-1.jpg', '/images/p41-2.jpg', '/images/p41-3.jpg', '/images/p41-4.jpg', '/images/p41-5.jpg'], seller: { name: 'Mairaj Younus', type: 'Agent', memberSince: '2025', totalAds: 15, rating: 4.5, phone: '+923233478314', premium: true },
  },
  {
    id: 'z42', title: '12% Rented Shops for available on MM Alam Road', description: 'Rented Shop for Sale on MM Alam Road Lahore 12% Rental Yield\n Excellent investment opportunity! A', price: 13000000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', city: 'Lahore', area: 'Gulberg', lat: 31.510471, lng: 74.350526, size: '0 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p42-1.jpg', '/images/p42-2.jpg', '/images/p42-3.jpg', '/images/p42-4.jpg', '/images/p42-5.jpg'], seller: { name: 'Salar Pasha', type: 'Owner', memberSince: '2025', totalAds: 11, rating: 3.5, phone: '+923164206688' },
  },
  {
    id: 'z43', title: '5 Marla READY Plaza Available For Sale In Business Bay Lake City', description: 'Some of the Main features of the Lake City are \n Ring Road Excess to whole city\n Around 4000', price: 180000000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', city: 'Lahore', area: 'Raiwind Road', lat: 31.359647, lng: 74.253073, size: '4 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p43-1.jpg', '/images/p43-2.jpg', '/images/p43-3.jpg', '/images/p43-4.jpg', '/images/p43-5.jpg'], seller: { name: 'Awais Shah', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 3.5, phone: '+923219442557' },
  },
  {
    id: 'z44', title: 'SHOP FOR SALE IN SECTOR E BAHRIA TOWN LAHORE', description: 'Bahria Town Lahore is a privately developed residential and commercial real estate project by', price: 8500000, priceType: 'fixed', purpose: 'sale', category: 'commercial', city: 'Lahore', area: 'Bahria Town', lat: 31.364887, lng: 74.186554, size: '1 Marla', bedrooms: 0, bathrooms: 1, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p44-1.jpg', '/images/p44-2.jpg', '/images/p44-3.jpg', '/images/p44-4.jpg', '/images/p44-5.jpg'], seller: { name: 'Junaid Bhatti', type: 'Agent', memberSince: '2025', totalAds: 13, rating: 3.5, phone: '+923207358304' },
  },
  {
    id: 'z45', title: 'PRIME LEASED OFFICE FOR SALE READY RENTAL INCOME MAIN RASHID MINHAS ROAD', description: 'Looking For A Secure Commercial Investment With Immediate Rental Return?\n Property Overview:\n', price: 4000000, priceType: 'fixed', purpose: 'sale', category: 'commercial', city: 'Karachi', area: 'Rashid Minhas Road', lat: 24.901333764765, lng: 67.115314780372, size: '0 Marla', bedrooms: 1, bathrooms: 1, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p45-1.jpg', '/images/p45-2.jpg', '/images/p45-3.jpg', '/images/p45-4.jpg', '/images/p45-5.jpg'], seller: { name: 'haris malik', type: 'Agent', memberSince: '2025', totalAds: 15, rating: 4.5, phone: '+923112988348' },
  },
  {
    id: 'z46', title: '9 Marla Commercial Building Is Available For Sale In Hathi Chowk, Saddar Cantt Rawalpindi', description: 'Property Highlights:\n 1st Floor to 4th Floor + Rooftop (Basement & Ground Floor shops not included)', price: 100000000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', subCategory: 'building', city: 'Rawalpindi', area: 'Saddar', lat: 33.596104, lng: 73.053582, size: '7 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p46-1.jpg', '/images/p46-2.jpg', '/images/p46-3.jpg', '/images/p46-4.jpg', '/images/p46-5.jpg'], seller: { name: 'Ch. Imtiaz Hussain', type: 'Owner', memberSince: '2025', totalAds: 42, rating: 3.5, phone: '+923325275851' },
  },
  {
    id: 'z47', title: 'Brand Outlet Shop For Sale In Grand 15 Sector E, Bahria Town Lahore | Easy Installment Plan', description: 'Own A Premium **Brand Outlet Shop** In The Heart Of **Sector E, Bahria Town Lahore** And Establish', price: 8550000, priceType: 'fixed', purpose: 'sale', category: 'commercial', city: 'Lahore', area: 'Bahria Town', lat: 31.364887, lng: 74.186554, size: '0 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p47-1.jpg', '/images/p47-2.jpg', '/images/p47-3.jpg', '/images/p47-4.jpg', '/images/p47-5.jpg'], seller: { name: 'Landmark Developers', type: 'Agent', memberSince: '2025', totalAds: 16, rating: 3.5, phone: '+923210004000' },
  },
  {
    id: 'z48', title: 'Rented Plaza For Sale Monthly Rent 16 Lac', description: 'Rented Plaza For Sale Monthly Rent is 16 Lac \n10 Marla 6 Storey Rented To Famous Brands\n10 Year', price: 360000000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', city: 'Islamabad', area: 'DHA Defence', lat: 33.540894, lng: 73.095732, size: '8 Marla', bedrooms: 5, bathrooms: 7, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p48-1.jpg', '/images/p48-2.jpg', '/images/p48-3.jpg', '/images/p48-4.jpg', '/images/p48-5.jpg'], seller: { name: 'Muhammad Hamza', type: 'Agent', memberSince: '2025', totalAds: 12, rating: 3.5, phone: '+923035666999' },
  },
  {
    id: 'z49', title: 'SHOWROOM FOR SALE IN   NISHAT COMMERCIAL AREA', description: 'SHOWROOM FOR SALE IN \n NISHAT COMMERCIAL AREA\n 1678 GROUND + Basement\n PRICE 10.5 CR\n ALL UTILITIES', price: 105000000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', city: 'Karachi', area: 'DHA Defence', lat: 24.79990879, lng: 67.06275401, size: '6 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p49-1.jpg', '/images/p49-2.jpg', '/images/p49-3.jpg', '/images/p49-4.jpg', '/images/p49-5.jpg'], seller: { name: 'Haseeb Mumtaz', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923208286661' },
  },
  {
    id: 'z50', title: 'Offices For Sale Plot 25C, Bukhari Lane 13 & 14 Corner, DHA Phase 6 Karachi', description: 'A modern commercial office project featuring 2193 Sqft of office space across 4 floors at Plot 25C,', price: 65790000, priceType: 'negotiable', purpose: 'sale', category: 'commercial', subCategory: 'office', city: 'Karachi', area: 'DHA Defence', lat: 24.791955, lng: 67.065082, size: '8 Marla', bedrooms: 1, bathrooms: 1, furnished: true, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p50-1.jpg', '/images/p50-2.jpg', '/images/p50-3.jpg', '/images/p50-4.jpg', '/images/p50-5.jpg'], seller: { name: 'Haseeb Mumtaz', type: 'Agent', memberSince: '2025', totalAds: 31, rating: 4.5, phone: '+923208286661', premium: true },
  },
  {
    id: 'z51', title: 'A Well Designed Residential Plot Is Up For sale In An Ideal Location In Lahore', description: 'With the boom in real estate market properties for sale to your liking can be easy to find. Avail', price: 27000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', subCategory: 'residential-plot', city: 'Lahore', area: 'DHA Defence', lat: 31.424623, lng: 74.436504, size: '16 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p51-1.jpg', '/images/p51-2.jpg', '/images/p51-3.jpg', '/images/p51-4.jpg', '/images/p51-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727', premium: true },
  },
  {
    id: 'z52', title: 'Ideally Located Residential Plot Of 40 Marla Is Available For Sale In Lahore', description: 'The Residential Plot enjoys the ideal location of DHA Phase 7 - Block U with notable landmarks', price: 92500000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'DHA Defence', lat: 31.475378, lng: 74.488592, size: '1 Kanal', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p52-1.jpg', '/images/p52-2.jpg', '/images/p52-3.jpg', '/images/p52-4.jpg', '/images/p52-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727' },
  },
  {
    id: 'z53', title: 'Find Your Ideal Residential Plot In Lahore Under Rs. 31500000', description: 'Rs. 31500000 Is Quite Reasonable For The Kind Of Property You Are Looking For. At A Price Like This', price: 31500000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'DHA Defence', lat: 31.429091, lng: 74.445001, size: '16 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p53-1.jpg', '/images/p53-2.jpg', '/images/p53-3.jpg', '/images/p53-4.jpg', '/images/p53-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727' },
  },
  {
    id: 'z54', title: '40 Marla Residential Plot Is Available For Sale', description: 'This Residential Plot is the ideal property at a price of PKR Rs. 140000000. The city of Lahore is', price: 140000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'DHA Defence', lat: 31.488411, lng: 74.45397, size: '1 Kanal', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p54-1.jpg', '/images/p54-2.jpg', '/images/p54-3.jpg', '/images/p54-4.jpg', '/images/p54-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727' },
  },
  {
    id: 'z55', title: '40 Marla Residential Plot Is Available In Affordable Price In DHA Phase 7 - Block U', description: 'Ideally situated in DHA Phase 7 - Block U, this is an investment opportunity like no other. At a', price: 122500000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'DHA Defence', lat: 31.475378, lng: 74.488592, size: '1 Kanal', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p55-1.jpg', '/images/p55-2.jpg', '/images/p55-3.jpg', '/images/p55-4.jpg', '/images/p55-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727' },
  },
  {
    id: 'z56', title: 'Highly-Coveted 40 Marla Residential Plot Is Available In DHA Phase 7 - Block S For Sale', description: 'You can find the best properties in DHA Phase 7 - Block S. You will not regret buying this property', price: 122500000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'DHA Defence', lat: 31.484454, lng: 74.483871, size: '1 Kanal', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-27', images: ['/images/p56-1.jpg', '/images/p56-2.jpg', '/images/p56-3.jpg', '/images/p56-4.jpg', '/images/p56-5.jpg'], seller: { name: 'Umair Saeed Mughal', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923219405727' },
  },
  {
    id: 'z57', title: 'Investment Opportunity! 4 Kanal Non-Develop Solid Land Plot In Block B Gulberg Greens', description: 'Property Overview\nBlock: B\nSize: 4 Kanal\n\nStatus: Non Develop\nTopography: Heighted Location | Solid', price: 47000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Islamabad', area: 'Gulberg', lat: 33.600513, lng: 73.165011, size: '3 Kanal', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-27', images: ['/images/p57-1.jpg'], seller: { name: 'Faisal Baloch', type: 'Agent', memberSince: '2025', totalAds: 6, rating: 3.5, phone: '+923218617610' },
  },
  {
    id: 'z58', title: 'Get A Corner 15 Marla Residential Plot For sale In Wapda City - Block C', description: '15 Marla Extra land If you are looking for lucrative property options for investment, we think this', price: 32000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Faisalabad', area: 'Wapda City', lat: 31.498433, lng: 73.211339, size: '12 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p58-1.jpg', '/images/p58-2.jpg', '/images/p58-3.jpg', '/images/p58-4.jpg', '/images/p58-5.jpg'], seller: { name: 'Umer Anees Chaudhary', type: 'Agent', memberSince: '2025', totalAds: 21, rating: 4.5, phone: '+923006666623' },
  },
  {
    id: 'z59', title: 'Prime Location Residential Plot For sale Is Readily Available In Prime Location Of DHA Phase 1 - Sector H', description: 'Hopefully, this is the perfect 20 Marla Residential Plot matching your requirements. Considering', price: 9000000, priceType: 'fixed', purpose: 'sale', category: 'plots', city: 'Multan', area: 'DHA Defence', lat: 30.29497216, lng: 71.54097895, size: '16 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p59-1.jpg', '/images/p59-2.jpg', '/images/p59-3.jpg', '/images/p59-4.jpg', '/images/p59-5.jpg'], seller: { name: 'Umair Abid', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923017951155' },
  },
  {
    id: 'z60', title: 'Block V 7 Marla Plot For Sale , Gulberg Residencia Islamabad', description: 'Location: Block V, Gulberg Residencia\n\n Size: 7 Marla\n\n Status: Developed Possession Plot\n\n', price: 9500000, priceType: 'fixed', purpose: 'sale', category: 'plots', city: 'Islamabad', area: 'Gulberg', lat: 33.581751, lng: 73.210251, size: '5 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p60-1.jpg', '/images/p60-2.jpg', '/images/p60-3.jpg', '/images/p60-4.jpg', '/images/p60-5.jpg'], seller: { name: 'Usama Yaseen', type: 'Agent', memberSince: '2025', totalAds: 28, rating: 3.5, phone: '+923165400338' },
  },
  {
    id: 'z61', title: '10 Marla Developed & Possession Plot For Sale In Block Q Gulberg Residencia', description: 'Plot Details & Features:\n Size: 10 Marla\n Location: Block Q, Gulberg Residencia\n Solid Land Ready', price: 15000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Islamabad', area: 'Gulberg', lat: 33.593012, lng: 73.222268, size: '8 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p61-1.jpg', '/images/p61-2.jpg', '/images/p61-3.jpg', '/images/p61-4.jpg', '/images/p61-5.jpg'], seller: { name: 'Usama Yaseen', type: 'Agent', memberSince: '2025', totalAds: 28, rating: 3.5, phone: '+923165400338' },
  },
  {
    id: 'z62', title: 'PRIME LOCATION, INVESTORS PRICE PLOT 5.5 MARLA CORNER PAID OPEN FORM', description: 'Hot cake for Investors Very attractive location, Investment price 5.5 Marla plot open form Corner', price: 5350000, priceType: 'fixed', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'Bahria Orchard', lat: 74.284737157131, lng: 31.306200627686, size: '4 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p62-1.jpg', '/images/p62-2.jpg', '/images/p62-3.jpg', '/images/p62-4.jpg', '/images/p62-5.jpg'], seller: { name: 'Greenz Realtors', type: 'Agent', memberSince: '2025', totalAds: 11, rating: 3.5, phone: '+923004000017' },
  },
  {
    id: 'z63', title: '13 MARLA PLOT FOR SALE ALL CLEAR IN LDA AVENUE 1 LAHORE G BLOCK. CONTACT:03004941726.', description: '13 MARLA PLOT FOR SALE G BLOCK LDA AVENUE 1 LAHORE. \nALL CLEAR \nHOT LOCATION \nBETTER OPPORTUNITY ', price: 12500000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Lahore', area: 'LDA Avenue', lat: 31.412476, lng: 74.194829, size: '10 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: false, featured: true, postedAt: '2026-07-26', images: ['/images/p1-1.jpg'], seller: { name: 'Mian Liaqat Ali', type: 'Agent', memberSince: '2025', totalAds: 5, rating: 3.5, phone: '+923004941726' },
  },
  {
    id: 'z64', title: '8 Marla Plot On Double Road With Extra Land On Front Available For Sale', description: 'If 1800 Square Feet Residential Plot is what you are looking for, this is it. The growing property', price: 17000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Islamabad', area: 'I-14', lat: 33.59735083958, lng: 73.027717369107, size: '6 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p64-1.jpg', '/images/p64-2.jpg', '/images/p64-3.jpg', '/images/p64-4.jpg', '/images/p64-5.jpg'], seller: { name: 'Nabeel Ahmed', type: 'Agent', memberSince: '2025', totalAds: 11, rating: 4.5, phone: '+923105313044' },
  },
  {
    id: 'z65', title: 'This Is Your Chance To Buy Residential Plot In I-15 I-15', description: 'Nothing is better than scoring the ultimate property deal. And this I-15 happens to have the best', price: 12000000, priceType: 'negotiable', purpose: 'sale', category: 'plots', city: 'Islamabad', area: 'I-15', lat: 33.602896, lng: 72.951765, size: '5 Marla', bedrooms: 0, bathrooms: 0, furnished: false, verified: true, featured: true, postedAt: '2026-07-26', images: ['/images/p65-1.jpg', '/images/p65-2.jpg', '/images/p65-3.jpg', '/images/p65-4.jpg', '/images/p65-5.jpg'], seller: { name: 'Nabeel Ahmed', type: 'Agent', memberSince: '2025', totalAds: 10, rating: 4.5, phone: '+923105313044' },
  },
];

export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export const TOWNS = [
  'DHA Defence', 'Bahria Town', 'Gulberg', 'Johar Town', 'LDA Avenue',
  'Clifton', 'Gulshan-e-Iqbal Town', 'Naya Nazimabad', 'Cantt',
  'B-17', 'F-8', 'H-13', 'I-14', 'I-15',
  'Raiwind Road', 'Saddar', 'Wapda City', 'Bahria Orchard',
  'University Road', 'Rashid Minhas Road', 'Main Canal Bank Road',
  'Navy Housing Scheme Karsaz', 'Lake City',
];

export const formatPKR = (n: number) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
  if (n >= 100000) return `${(n / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  return n.toLocaleString('en-PK');
};
