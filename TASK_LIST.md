# Al Najaf Digital Estate — Mega Portal Upgrade Task List

> Yeh document is project ki complete upgrade requirements aur current progress track karta hai.
> Agar aap (AI agent) is project par kaam kar rahe hain, sab se pehle yeh file padhein.

---

## Project Overview

**Project Name:** Al Najaf Digital Estate  
**Tech Stack:** React + Vite + TypeScript (frontend), PHP MySQL APIs (backend), Tailwind CSS  
**Domain:** Pakistan real estate + legal services mega portal

**Existing Sections (already in code):**
- Property Bazaar (OLX-style classifieds — partial)
- Services (Legal / Utility / Valuation)
- E-Stamp application
- Lawyers directory
- Admin dashboard
- Auth (login, register, OTP, forgot password)
- Customer dashboard

---

## Goal

Is ko ek **mega portal** banana hai jis mein:

1. **OLX / 100zamin.com jaisi property classifieds** ho — area, GPS, rate filter, area filter.
2. **Law firm integration** — Sula nama, Talaq nama, Aaq nama, Bayan halfi, Power of Attorney, Will, Kiraya nama, Hibba nama, etc.
3. **E-Stamp Pakistan** — Rs. 100 se Rs. 1200 tak, online/offline with extra online charges, full legal form.
4. **Fard (government records)** — fard bray record, fard bray meter, fard baray zati record, sab qisam.
5. **Mega portal search** — search kare, results se task list bane, step by step complete kare.
6. **Customer profile mein sections:** My Orders, My Favorites, Password Reset, Profile Picture Upload.
7. **Admin process:** Government site se E-Stamp fetch karke customer ko email + order section mein upload kare.
8. **Meter transfer, land registration, mutation (intiqal)** aur tamam services upgrade hon.

---

## Completed Work (As of Last Update)

- [x] E-Stamp page basic upgrade started (fingerprint, ID scan, selfie, gov search UI)
- [x] Dashboard enhanced with My Orders, password change, profile pic UI
- [x] Properties page enhanced with OLX-style rate filter bar and area filter
- [x] New pages created: `/legal` and `/fard`
- [x] Routes updated (`/legal`, `/fard`)
- [x] Navbar updated with Legal Docs and Fard Records links
- [x] i18n English + Urdu translations added
- [x] Admin E-Stamp government upload API endpoint created

---

## Remaining / In-Progress Work

### CRITICAL — Fix Compilation Bugs First

1. **Fix E-Stamp page (`src/pages/EStampPage.tsx`) bugs:**
   - `setFingerprintStream` — invalid pattern. Use `useRef`.
   - `setIdStreams` invalid pattern. Fix with `useRef`.
   - Ensure TypeScript build succeeds.
   - `OTPVerification` component needs access to `t()` function.
   - Remove unused imports.

2. Run `npm run typecheck` and resolve all errors.
3. Run `npm run build` and resolve all Vite errors.

---

### Module 1 — OLX-Style Property Bazaar (Complete)

**Requirements:**
- Search bar with keyword, city, purpose.
- Horizontal category pills.
- Horizontal "Rate" filter like OLX.
- Area/Location filter per city.
- GPS location picker on map.
- Sort by price, date, area.
- Saved properties (favorites).
- List and grid view.
- Mobile responsive.

**Files to work on:**
- `src/pages/PropertiesPage.tsx`
- `src/pages/PropertyDetailPage.tsx`
- `src/pages/PostAdPage.tsx`
- Backend: `public_html/api/property/list.php`, `public_html/api/property/create.php`

---

### Module 2 — E-Stamp Pakistan (Complete)

**Requirements:**
- Online government stamp type search (8 types).
- Amount select (Rs. 100 – Rs. 1200) + online/offline mode with extra online charges.
- Customer details form (name, CNIC, phone, email, address).
- ID card scan: front side, back side, **person holding ID card** selfie.
- Signature upload.
- Fingerprint scan via camera.
- Property/transaction details.
- Review total payable.
- OTP verification via SMTP.
- Submit application, generate reference number.
- Admin fetches estamp from government site and uploads certificate.
- Customer gets email notification + sees in **Dashboard > My Orders > E-Stamp**.

**Files to work on:**
- `src/pages/EStampPage.tsx`
- Backend: `public_html/api/estamp/apply.php`
- Backend: `public_html/api/estamp/upload.php`
- Backend: `public_html/api/admin/estamp-upload.php`
- Backend: `public_html/api/auth/verify-otp.php`

---

### Module 3 — Customer Profile / Dashboard (Complete)

**Sections:**
- My Listings
- My Inquiries  
- My Orders (E-Stamp + services + legal docs + fard)
- My Favorites
- Profile picture upload
- Password reset
- Account settings, notifications, messages

**Files to work on:**
- `src/pages/DashboardPage.tsx`
- Backend: `public_html/api/auth/profile.php`
- Backend: `public_html/api/property/save.php`

---

### Module 4 — Legal Documents / Law Firm Section (Complete)

**Required Documents:**
1. Sula Nama
2. Talaq Nama
3. Aaq Nama
4. Bayan Halfi
5. Power of Attorney
6. Wasiyat Nama
7. Kiraya Nama
8. Hibba Nama
9. Custom Agreements

**For each:**
- Dedicated detail page.
- Booking form.
- Upload required docs.
- Review and submit.
- Track status in **My Orders**.

**Files:**
- `src/pages/legal/LegalDocumentsPage.tsx`
- `src/pages/legal/LegalDocDetailPage.tsx`
- Backend: `public_html/api/legal/apply.php`
- Backend: `public_html/api/legal/status.php`
- DB: `legal_document_requests` table

---

### Module 5 — Fard Government Records (Complete)

**Types:**
1. Fard Bray Record
2. Fard Bray Meter
3. Fard Baray Zati Record
4. Fard Mutation (Intiqal)
5. Fard Clearance Certificate
6. Fard Verification
7. Fard Extract Copy
8. All Fard Types combined search

**Files:**
- `src/pages/legal/FardPage.tsx`
- `src/pages/legal/FardDetailPage.tsx`
- Backend: `public_html/api/fard/apply.php`
- Backend: `public_html/api/fard/status.php`
- Backend: `public_html/api/fard/search.php`
- DB: `fard_requests` table

---

### Module 6 — Land Registration, Mutation, Meter Transfer (Complete)

**Services:**
- Land Registration
- Mutation / Intiqal
- Gas / Electricity / Water Meter Transfer
- Sewerage Connection
- Property Valuation

**Files:**
- `src/pages/ServicesPage.tsx`
- `src/pages/ServiceDetailPage.tsx`
- Backend: existing `public_html/api/associates/*`

---

### Module 7 — Mega Portal Search (Create New)

**Requirements:**
- Universal search bar.
- Select action from results.
- Generate **task list / checklist**.
- Step-by-step guided flow.

**Files:**
- `src/pages/MegaSearchPage.tsx`
- `src/components/TaskList.tsx`
- Backend: `public_html/api/search/unified.php`

---

### Module 8 — Admin Dashboard (Upgrade)

- View all E-stamp, legal, fard, service requests.
- Fetch/upload estamp from government site.
- Send email notifications.
- Manage users, properties, lawyers.

**Files:**
- `src/pages/AdminPage.tsx`
- Backend: `public_html/api/admin/estamp.php`, `legal.php`, `fard.php`

---

### Module 9 — Backend / DB Updates

```sql
CREATE TABLE legal_document_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50) UNIQUE,
    applicant_name VARCHAR(255),
    applicant_cnic VARCHAR(20),
    applicant_phone VARCHAR(20),
    applicant_email VARCHAR(255),
    applicant_address TEXT,
    details TEXT,
    urgency VARCHAR(50),
    price DECIMAL(15,2),
    status ENUM('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE fard_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fard_type VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50) UNIQUE,
    cnic VARCHAR(20),
    property_number VARCHAR(255),
    survey_number VARCHAR(255),
    applicant_name VARCHAR(255),
    applicant_phone VARCHAR(20),
    applicant_email VARCHAR(255),
    applicant_address TEXT,
    search_query TEXT,
    status ENUM('pending','searching','found','approved','completed','not_found') DEFAULT 'pending',
    result_file VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Development Workflow

```bash
cd /home/sastishoppingstore/project
npm run typecheck
npm run build
npm run lint
```

**Always run after major changes.**

---

## Testing Checklist

1. [ ] `/properties` — search, rate filter, area filter, save, grid/list.
2. [ ] `/estamp` — complete E-Stamp flow.
3. [ ] `/dashboard` — My Orders, Favorites, password change, profile pic.
4. [ ] `/legal` and `/legal/:id` — legal document booking.
5. [ ] `/fard` — fard types and search.
6. [ ] `/services` — land reg / meter transfer booking.
7. [ ] `/admin` — admin uploads gov estamp.
8. [ ] English/Urdu switch works.
9. [ ] Mobile responsive.

---

## Known Issues

1. `src/pages/EStampPage.tsx` — `setFingerprintStream` and `setIdStreams` are invalid React patterns. Must use `useRef`.
2. `OTPVerification` component needs `t()` access.
3. Some unused imports may remain.
4. Must run `npm run typecheck` to catch all errors.

---

## Next Immediate Actions

1. Fix TypeScript errors in `EStampPage.tsx`.
2. Complete individual legal document detail page.
3. Complete fard detail page.
4. Complete land registration / meter transfer detail pages.
5. Create mega search + task list page.
6. Update admin dashboard and DB schema.
