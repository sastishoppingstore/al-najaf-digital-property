# Al-Najaf Digital Property — Complete Website Clone Prompt

## Project Overview

**Project Name:** Al-Najaf Digital Property  
**Tech Stack:** React + Vite + TypeScript (Frontend), PHP MySQL APIs (Backend), Tailwind CSS  
**Domain:** Pakistan Real Estate + Legal Services Mega Portal  
**Branding:** Al-Najaf Digital Property — Premium 8K Quality Images with Branding Watermark on Every Photo

---

## COMPLETE SECTION LIST (100% Clone Requirements)

### 1. HOMEPAGE SECTIONS

#### 1.1 Hero Section
- Gradient background (amber-900 → navy-800 → amber-950)
- Background image overlay with 15% opacity
- Animated gradient overlay
- Badge: "Trusted by 10,000+ Clients" with ShieldCheck icon
- Main Title: "Al-Najaf Digital Property — Your Trusted Real Estate Partner"
- Subtitle: "Complete real estate solutions including property listing, legal documentation, E-Stamp, Fard records, and Islamic calculators"
- Two Panel Cards:
  - Panel A: Property Bazaar (link: /properties)
  - Panel B: Legal Services (link: /services)
- CTA Buttons with ArrowRight icons
- Auto-sliding carousel (3-second intervals)

#### 1.2 Capital Valley Promo Section
- 3D card with glow effect
- Cover image from admin panel (localStorage: hero_promo_image)
- Dynamic title in English/Urdu
- CTA button linking to /capital-valley

#### 1.3 Calculators Section
- DC Rate Calculator card (link: /dc-rate)
- Islamic Inheritance Calculator card (link: /islamic-inheritance)
- Both with icons (Calculator, BookOpen)
- Hover effects with 3D tilt

#### 1.4 Featured Properties Section
- Section title: "Featured Properties"
- Horizontal scroll carousel
- ProductCard components for each property
- Navigation arrows (ChevronLeft, ChevronRight)
- Auto-slide every 4 seconds

#### 1.5 Popular Services Section
- Section title: "Our Services"
- 6 service cards in grid layout
- Each card with icon, title, description, price
- Link to /services

#### 1.6 Why Choose Us Section
- 4 feature cards:
  1. "Verified Properties" with ShieldCheck icon
  2. "Legal Expertise" with Scale icon
  3. "Customer Support" with Users icon
  4. "Trusted by Thousands" with Award icon
- Animated reveal on scroll

#### 1.7 Stats Counter Section
- Animated counters:
  - 10,000+ Happy Clients
  - 5,000+ Properties Listed
  - 500+ Lawyers Registered
  - 1,000+ E-Stamps Processed

#### 1.8 Testimonials Section
- Customer reviews carousel
- Star ratings
- Customer names and photos

#### 1.9 Newsletter Section
- Email subscription form
- "Subscribe to our newsletter" heading

#### 1.10 Footer
- Company logo and description
- Quick links (Properties, Services, Legal, E-Stamp, Fard)
- Contact information (phone, email, address)
- Social media links
- Copyright notice
- Dynamic content from admin panel (localStorage: footer content)

---

### 2. PROPERTIES PAGE (`/properties`)

#### 2.1 Search Bar
- Keyword search input
- City dropdown (from managed cities in admin)
- Purpose filter (Sale/Rent)
- Search button

#### 2.2 Category Pills
- Horizontal scrollable pills:
  - All
  - Houses
  - Apartments
  - Commercial
  - Land
  - Farmhouses

#### 2.3 Filter Bar (OLX-Style)
- Rate filter (min-max price slider)
- Area filter (min-max area)
- Bedrooms filter
- Bathrooms filter
- Property type filter
- Clear filters button

#### 2.4 Sort Options
- Sort by: Price (Low to High), Price (High to Low), Date (Newest), Area (Largest)

#### 2.5 View Toggle
- Grid view (default)
- List view

#### 2.6 Property Cards
- Image carousel (first image primary)
- Price with PKR currency
- Title
- Location (area, city)
- Bedrooms/Bathrooms icons
- Area in sqft
- Seller info (name, type)
- Save/Favorite button (heart icon)
- Share button
- WhatsApp inquiry button

#### 2.7 Pagination
- Page numbers
- Previous/Next buttons

---

### 3. PROPERTY DETAIL PAGE (`/property/:id`)

#### 3.1 Image Gallery
- Main large image
- Thumbnail gallery (click to change main image)
- Fullscreen lightbox
- Image counter (1/5)

#### 3.2 Property Info
- Title
- Price (formatted with commas)
- Property type badge
- Purpose badge (Sale/Rent)
- Posted date
- View count
- Save/Share buttons

#### 3.3 Description
- Full property description
- Read more/less toggle

#### 3.4 Property Details
- Bedrooms
- Bathrooms
- Area (sqft)
- Property type
- City
- Area/Location
- Latitude/Longitude (map link)

#### 3.5 Seller Information
- Seller name
- Seller type (Owner/Agent/Dealer)
- Phone number
- WhatsApp button
- Profile picture

#### 3.6 Similar Properties
- 4 similar property cards
- Same category and city

---

### 4. POST AD PAGE (`/post-ad`)

#### 4.1 Step 1: Basic Info
- Title
- Description (rich text editor)
- Category dropdown
- Sub-category dropdown
- Purpose (Sale/Rent)
- Property type

#### 4.2 Step 2: Location
- City dropdown
- Area/Location
- Full address
- Google Maps integration
- Latitude/Longitude picker

#### 4.3 Step 3: Details
- Bedrooms
- Bathrooms
- Area (sqft)
- Furnished (Yes/No)
- Featured (Yes/No)

#### 4.4 Step 4: Images
- Image upload area (drag & drop)
- Image URL input
- Image preview
- Reorder images
- Delete images

#### 4.5 Step 5: Pricing
- Price input
- Price type (Fixed/Negotiable)
- Contact info

#### 4.6 Step 6: Preview & Submit
- Property preview card
- Submit button
- Terms acceptance checkbox

---

### 5. SERVICES PAGE (`/services`)

#### 5.1 Service Categories
- Legal Documentation
- Survey & Valuation
- Tax & Finance
- Dispute Resolution

#### 5.2 Service Cards
- Icon
- Service name
- Description
- Price (PKR)
- Duration
- Book Now button

#### 5.3 Service Detail Modal
- Full description
- Requirements list
- Process steps
- Book button

---

### 6. SERVICE DETAIL PAGE (`/service/:id`)

#### 6.1 Service Info
- Service name
- Category
- Price
- Duration
- Description

#### 6.2 Booking Form
- Customer name
- Email
- Phone
- Address
- Preferred date
- Preferred time
- Notes/Requirements
- Submit button

---

### 7. LEGAL DOCUMENTS PAGE (`/legal`)

#### 7.1 Document Types
1. Sula Nama (Divorce Deed)
2. Talaq Nama (Divorce Document)
3. Aaq Nama (Maintenance Document)
4. Bayan Halfi (Settlement Deed)
5. Power of Attorney
6. Wasiyat Nama (Will)
7. Kiraya Nama (Rent Agreement)
8. Hibba Nama (Gift Deed)
9. Custom Agreements

#### 7.2 Document Cards
- Icon
- Document name
- Description
- Price
- Requirements list
- Apply Now button

---

### 8. LEGAL DOCUMENT DETAIL PAGE (`/legal/:id`)

#### 8.1 Document Info
- Document type
- Full description
- Legal requirements
- Process steps
- Required documents list
- Price

#### 8.2 Application Form
- Applicant name
- CNIC
- Phone
- Email
- Address
- Document details
- Upload required documents
- Urgency level
- Review and submit

---

### 9. FARD RECORDS PAGE (`/fard`)

#### 9.1 Fard Types
1. Fard Bray Record
2. Fard Bray Meter
3. Fard Baray Zati Record
4. Fard Mutation (Intiqal)
5. Fard Clearance Certificate
6. Fard Verification
7. Fard Extract Copy
8. All Fard Types combined search

#### 9.2 Fard Cards
- Type name
- Description
- Requirements
- Apply Now button

---

### 10. FARD DETAIL PAGE (`/fard/:id`)

#### 10.1 Fard Info
- Fard type
- Full description
- Legal requirements
- Process steps
- Required documents

#### 10.2 Application Form
- CNIC
- Property number
- Survey number
- Applicant name
- Phone
- Email
- Address
- Search query
- Submit button

---

### 11. E-STAMP PAGE (`/estamp`)

#### 11.1 Stamp Types
1. Property Sale
2. Property Rent
3. Affidavit
4. Power of Attorney
5. Agreement
6. Other

#### 11.2 Stamp Amount Selection
- Amount range: Rs. 100 – Rs. 1200
- Online/Offline mode selection
- Online charges: Rs. 150 (configurable in admin)
- Offline charges: Rs. 300 (configurable in admin)

#### 11.3 Customer Details Form
- Full name
- CNIC
- Phone
- Email
- Address

#### 11.4 ID Verification
- CNIC front side upload
- CNIC back side upload
- Person holding ID card selfie

#### 11.5 Signature Upload
- Signature image upload

#### 11.6 Fingerprint Scan
- Camera integration for fingerprint
- Live preview
- Capture button

#### 11.7 Property/Transaction Details
- Property address
- Property value
- Transaction description

#### 11.8 Review & Payment
- Total payable amount
- Application summary
- OTP verification
- Submit application

---

### 12. LAWYERS PAGE (`/lawyers`)

#### 12.1 Search & Filter
- Search by name/specialty
- Filter by city
- Filter by specialty
- Filter by rating

#### 12.2 Lawyer Cards
- Profile picture
- Name
- Specialties
- Experience (years)
- Rating (stars)
- Consultation fee
- Availability status
- Book Consultation button

---

### 13. DC RATE CHECK PAGE (`/dc-rate`)

#### 13.1 Location Selection
- District dropdown
- Tehsil dropdown
- Mouza dropdown

#### 13.2 Property Details
- Property type (Residential/Commercial/Agricultural)
- Location status (Urban/Rural)
- Land area input
- Land unit (Marla/Kanal/Sq. Ft./Acre)

#### 13.3 Buyer/Seller Status
- Buyer status (Filer/Late Filer/Non-Filer)
- Seller status (Filer/Late Filer/Non-Filer)
- Map approval status (Approved/Not Approved)

#### 13.4 Calculation Results
- DC Rate per unit
- Total DC Value
- Tax calculation breakdown:
  - Stamp Duty
  - Registration Fee
  - Local Body Tax
  - Provincial Government Tax
  - Additional Tax (if applicable)
- Grand total

---

### 14. ISLAMIC INHERITANCE CALCULATOR PAGE (`/islamic-inheritance`)

#### 14.1 Asset Details
- Cash amount
- Land area
- Land unit (Marla/Kanal/Sq. Ft./Acre)

#### 14.2 Deceased Information
- Gender (Male/Female)

#### 14.3 Family Members
- Number of wives (if male deceased)
- Husband alive (if female deceased)
- Number of sons
- Number of daughters
- Father alive
- Mother alive

#### 14.4 Fiqh Selection
- Hanafi
- Shafi
- Maliki
- Hanbali

#### 14.5 Calculation Results
- Total estate value
- Shares breakdown:
  - Husband/Wife share
  - Son(s) share
  - Daughter(s) share
  - Father share
  - Mother share
- Detailed explanation of Islamic inheritance rules

---

### 15. ARTICLES PAGE (`/articles`)

#### 15.1 Article List
- Article cards with:
  - Featured image
  - Title
  - Excerpt
  - Author
  - Date
  - Read more button

#### 15.2 Categories
- Real Estate
- Legal
- Tax
- Investment
- Guides

---

### 16. ARTICLE DETAIL PAGE (`/article/:id`)

#### 16.1 Article Content
- Title
- Featured image
- Author info
- Date
- Full article content
- Related articles
- Share buttons

---

### 17. BRANCHES PAGE (`/branches`)

#### 17.1 Branch List
- Branch cards with:
  - Branch name
  - Address
  - Phone
  - Email
  - Working hours
  - Google Maps link

---

### 18. CAPITAL VALLEY PAGE (`/capital-valley`)

#### 18.1 Project Overview
- Project description
- Location details
- Features and amenities

#### 18.2 Payment Plans
- Plot sizes and prices
- Down payment
- Monthly installments
- Half-yearly payments
- Possession amount

#### 18.3 Gallery
- Project images
- Virtual tour (if available)

---

### 19. MEGA SEARCH PAGE (`/mega-search`)

#### 19.1 Universal Search Bar
- Search across all services
- Auto-suggestions

#### 19.2 Results Display
- Categorized results
- Action buttons for each result

#### 19.3 Task List Generation
- Step-by-step checklist
- Progress tracking

---

## ADMIN DASHBOARD SECTIONS

### 20. ADMIN LOGIN
- Email/Phone input
- Password input
- Remember me checkbox
- Forgot password link
- Login button

### 21. ADMIN OVERVIEW (`/admin` → overview)
- Dashboard stats cards:
  - Total Users
  - Total Properties
  - Pending Properties
  - E-Stamp Applications
  - Service Requests
  - Legal Document Requests
- Recent activity feed
- Quick actions

### 22. ADMIN - PROPERTIES MANAGEMENT
#### 22.1 Property List
- Table with columns:
  - ID
  - Image
  - Title
  - Price
  - City
  - Status
  - Posted Date
  - Actions (Edit/Delete/Approve/Reject)

#### 22.2 Add/Edit Property Form
- All fields from Post Ad page
- Status selection (Active/Pending/Rejected/Expired)
- Featured toggle
- Verified toggle

### 23. ADMIN - E-STAMP MANAGEMENT
#### 23.1 Applications List
- Table with columns:
  - Reference Number
  - Applicant Name
  - Document Type
  - Amount
  - Status
  - Applied Date
  - Actions

#### 23.2 Application Detail
- Full application info
- Uploaded documents
- Upload government stamp
- Status update
- Send email notification

### 24. ADMIN - LEGAL DOCUMENT MANAGEMENT
#### 24.1 Requests List
- Table with columns:
  - Reference Number
  - Applicant Name
  - Document Type
  - Status
  - Applied Date
  - Actions

#### 24.2 Request Detail
- Full application info
- Uploaded documents
- Process request
- Update status

### 25. ADMIN - FARD RECORDS MANAGEMENT
#### 25.1 Requests List
- Table with columns:
  - Reference Number
  - Applicant Name
  - Fard Type
  - Status
  - Applied Date
  - Actions

#### 25.2 Request Detail
- Full application info
- Search results
- Update status
- Upload result file

### 26. ADMIN - SERVICES MANAGEMENT
#### 26.1 Service List
- Table with columns:
  - ID
  - Name
  - Category
  - Price
  - Status
  - Actions

#### 26.2 Add/Edit Service Form
- Service name
- Description
- Category
- Price
- Duration
- Icon
- Status

#### 26.3 Service Requests
- Table with all bookings
- Status update
- Assign to staff

### 27. ADMIN - LAWYERS MANAGEMENT
#### 27.1 Lawyer List
- Table with columns:
  - ID
  - Name
  - Email
  - Phone
  - Specialties
  - Rating
  - Status
  - Actions

#### 27.2 Add/Edit Lawyer Form
- All lawyer fields
- Profile picture upload
- Specialties selection
- Availability toggle

### 28. ADMIN - USERS MANAGEMENT
#### 28.1 User List
- Table with columns:
  - ID
  - Name
  - Email
  - Phone
  - Role
  - Status
  - Joined Date
  - Actions

#### 28.2 User Actions
- Edit role
- Suspend/Activate
- Delete user
- View user details

### 29. ADMIN - INQUIRIES MANAGEMENT
- Property inquiries list
- Mark as read/responded
- Reply to inquiry

### 30. ADMIN - VERIFICATIONS
- Property verification requests
- Agent verification requests
- Lawyer verification requests
- Approve/Reject actions

### 31. ADMIN - ORDERS MANAGEMENT
- All orders (E-Stamp + Services + Legal + Fard)
- Status tracking
- Filter by type/status

### 32. ADMIN - EMAIL MANAGEMENT
#### 32.1 Email Logs
- Sent emails list
- Email details

#### 32.2 Send Email
- To (user email)
- Subject
- Body
- Send button

### 33. ADMIN - NOTIFICATIONS
- Send notifications to users
- Notification history

### 34. ADMIN - CONTENT MANAGEMENT

#### 34.1 Stamp Types Management
- Add/Edit/Delete stamp types
- Configure online/offline fees

#### 34.2 Services Management
- Add/Edit/Delete managed services
- Set prices and durations

#### 34.3 Lawyers Management
- Add/Edit/Delete managed lawyers
- Set consultation fees

#### 34.4 Cities Management
- Add/Edit/Delete cities
- Set city status

#### 34.5 Towns Management
- Add/Edit/Delete towns
- Link to cities

#### 34.6 Categories Management
- Add/Edit/Delete property categories
- Set sort order

#### 34.7 Sub-Categories Management
- Add/Edit/Delete sub-categories
- Link to categories

#### 34.8 Navbar Management
- Edit navbar links
- Reorder navigation items

#### 34.9 Footer Management
- Edit footer content
- Social media links
- Contact information

#### 34.10 Page Text Management
- Edit all page text (English/Urdu)
- Hero section text
- Service descriptions
- Legal document descriptions

### 35. ADMIN - SETTINGS
- Online/Offline fee configuration
- SMTP settings
- API keys
- Site maintenance mode

---

## CUSTOMER DASHBOARD SECTIONS

### 36. CUSTOMER DASHBOARD (`/dashboard`)

#### 36.1 My Listings
- Properties posted by user
- Status indicators
- Edit/Delete options

#### 36.2 My Inquiries
- Property inquiries submitted
- Status (pending/responded/closed)

#### 36.3 My Orders
- E-Stamp applications
- Service bookings
- Legal document requests
- Fard record requests
- Status tracking

#### 36.4 My Favorites
- Saved properties
- Remove from favorites

#### 36.5 Profile Settings
- Profile picture upload
- Name, email, phone
- Password change
- Notification preferences

---

## AUTHENTICATION PAGES

### 37. LOGIN PAGE (`/login`)
- Email/Phone input
- Password input
- Remember me
- Forgot password link
- Login button
- Register link

### 38. REGISTER PAGE (`/register`)
- Name input
- Email input
- Phone input
- Password input
- Confirm password
- Terms acceptance checkbox
- Register button
- Login link

### 39. OTP VERIFICATION PAGE (`/verify-otp`)
- OTP input (6 digits)
- Resend OTP button
- Verify button

### 40. FORGOT PASSWORD PAGE (`/forgot-password`)
- Email input
- Send reset link button
- Back to login link

### 41. RESET PASSWORD PAGE (`/reset-password`)
- New password input
- Confirm password input
- Reset button

---

## DATABASE SCHEMA (MySQL 8.0+)

### Tables:

1. **roles** - User roles (user, agent, lawyer, admin, super_admin)
2. **users** - User accounts with authentication
3. **permissions** - Role-based permissions
4. **password_resets** - Password reset tokens
5. **email_otps** - Email OTP verification
6. **property_categories** - Property categories
7. **properties** - Property listings
8. **property_images** - Property images
9. **property_inquiries** - Property inquiries
10. **saved_properties** - User saved properties
11. **verification_requests** - Verification requests
12. **estamp_applications** - E-Stamp applications
13. **estamp_documents** - E-Stamp uploaded documents
14. **estamp_status_history** - E-Stamp status changes
15. **services** - Available services
16. **service_requests** - Service bookings
17. **service_status_history** - Service status changes
18. **lawyers** - Lawyer profiles
19. **lawyer_bookings** - Lawyer consultation bookings
20. **notifications** - User notifications
21. **messages** - User messages
22. **admin_logs** - Admin activity logs

---

## API ENDPOINTS (PHP MySQL)

### Authentication
- `POST /api/auth/register.php` - Register new user
- `POST /api/auth/login.php` - Login user
- `POST /api/auth/verify-otp.php` - Verify OTP
- `POST /api/auth/forgot-password.php` - Send reset link
- `POST /api/auth/reset-password.php` - Reset password
- `GET /api/auth/profile.php` - Get user profile
- `PUT /api/auth/profile.php` - Update profile

### Properties
- `GET /api/property/list.php` - List properties
- `GET /api/property/detail.php` - Property details
- `POST /api/property/create.php` - Create property
- `PUT /api/property/update.php` - Update property
- `DELETE /api/property/delete.php` - Delete property
- `POST /api/property/save.php` - Save/unsave property
- `GET /api/property/inquiries.php` - Get inquiries
- `POST /api/property/inquiry.php` - Submit inquiry

### E-Stamp
- `POST /api/estamp/apply.php` - Apply for E-Stamp
- `GET /api/estamp/status.php` - Check status
- `POST /api/estamp/upload.php` - Upload documents
- `GET /api/admin/estamp.php` - Admin: List applications
- `POST /api/admin/estamp/upload.php` - Admin: Upload stamp

### Legal Documents
- `POST /api/legal/apply.php` - Apply for legal document
- `GET /api/legal/status.php` - Check status
- `GET /api/admin/legal.php` - Admin: List requests

### Fard Records
- `POST /api/fard/apply.php` - Apply for Fard
- `GET /api/fard/status.php` - Check status
- `POST /api/fard/search.php` - Search records
- `GET /api/admin/fard.php` - Admin: List requests

### Services
- `GET /api/service/list.php` - List services
- `POST /api/service/book.php` - Book service
- `GET /api/service/status.php` - Check status
- `GET /api/admin/services.php` - Admin: List services
- `POST /api/admin/service-update.php` - Admin: Update service

### Lawyers
- `GET /api/lawyer/list.php` - List lawyers
- `GET /api/lawyer/detail.php` - Lawyer details
- `POST /api/lawyer/book.php` - Book consultation
- `GET /api/admin/lawyers.php` - Admin: List lawyers
- `POST /api/admin/lawyer-update.php` - Admin: Update lawyer

### Admin
- `GET /api/admin/overview.php` - Dashboard stats
- `GET /api/admin/users.php` - List users
- `PUT /api/admin/user-update.php` - Update user
- `DELETE /api/admin/user-delete.php` - Delete user
- `GET /api/admin/properties.php` - List all properties
- `POST /api/admin/property-approve.php` - Approve property
- `POST /api/admin/property-reject.php` - Reject property
- `GET /api/admin/orders.php` - List all orders
- `GET /api/admin/inquiries.php` - List inquiries
- `POST /api/admin/inquiry-read.php` - Mark inquiry read
- `POST /api/admin/email-send.php` - Send email
- `GET /api/admin/email-logs.php` - Get email logs
- `POST /api/admin/notification-send.php` - Send notification

### Content Management
- `GET /api/admin/stamp-types.php` - Get stamp types
- `POST /api/admin/stamp-types.php` - Save stamp types
- `GET /api/admin/stamp-fees.php` - Get stamp fees
- `POST /api/admin/stamp-fees.php` - Save stamp fees
- `GET /api/admin/services-managed.php` - Get managed services
- `POST /api/admin/services-managed.php` - Save managed services
- `GET /api/admin/lawyers-managed.php` - Get managed lawyers
- `POST /api/admin/lawyers-managed.php` - Save managed lawyers
- `GET /api/admin/page-text.php` - Get page text
- `POST /api/admin/page-text.php` - Save page text
- `GET /api/admin/cities.php` - Get cities
- `POST /api/admin/cities.php` - Save cities
- `GET /api/admin/towns.php` - Get towns
- `POST /api/admin/towns.php` - Save towns
- `GET /api/admin/categories.php` - Get categories
- `POST /api/admin/categories.php` - Save categories
- `GET /api/admin/subcategories.php` - Get sub-categories
- `POST /api/admin/subcategories.php` - Save sub-categories
- `GET /api/admin/navbar.php` - Get navbar links
- `POST /api/admin/navbar.php` - Save navbar links
- `GET /api/admin/footer.php` - Get footer content
- `POST /api/admin/footer.php` - Save footer content

---

## IMAGE REQUIREMENTS

### Branding
- **Al-Najaf Digital Property** logo watermark on ALL images
- Semi-transparent logo in bottom-right corner
- Consistent branding across all photos

### Quality
- **8K Resolution** for hero images (7680x4320)
- **4K Resolution** for property images (3840x2160)
- **1080p Minimum** for thumbnails and cards
- WebP format for optimized loading
- Lazy loading implementation

### Image Categories
1. **Hero Images**
   - Hero banner 1 (1920x1080 minimum)
   - Hero banner 2 (1920x1080 minimum)
   - Hero banner 3 (1920x1080 minimum)
   - Capital Valley cover image

2. **Property Images**
   - Front view (8K quality)
   - Living room
   - Kitchen
   - Bedrooms
   - Bathrooms
   - Garden/Outdoor
   - Parking

3. **Service Images**
   - Legal documentation
   - Property valuation
   - E-Stamp process
   - Fard records

4. **Team/Office Images**
   - Office exterior
   - Team photos
   - Meeting rooms

5. **Background Images**
   - Section backgrounds
   - Card backgrounds
   - Footer background

### Image Generation Prompts

#### Hero Images
```
Hero Banner 1: "Luxury modern house in Lahore with beautiful landscaping, 
golden hour lighting, professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner, 
cinematic composition, warm amber and navy blue color grading"

Hero Banner 2: "Pakistani family happily standing in front of their new home, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner, 
warm lighting, joyful atmosphere"

Hero Banner 3: "Legal documents and gavel on mahogany desk, 
professional law office setting, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner, 
dramatic lighting, golden accents"
```

#### Property Images
```
Modern House: "5 marla modern house exterior in DHA Phase 5 Lahore, 
contemporary architecture, marble flooring visible, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner, 
golden hour lighting"

Villa: "Luxury 10 marla villa in Bahria Town with garden and swimming pool, 
Mediterranean architecture style, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner, 
twilight lighting"

Apartment: "Furnished 3 bedroom apartment interior in Gulberg Lahore, 
modern interior design, natural lighting, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"

Commercial: "Prime commercial shop on main boulevard Lahore, 
high foot traffic area, glass facade, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"

Land: "5 acre agricultural land in Kasur Punjab Pakistan, 
fertile green fields, canal water access, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"

Farmhouse: "4 kanal farmhouse with swimming pool in Bedian Lahore, 
landscaped gardens, luxury amenities, 
professional real estate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"
```

#### Service Images
```
Legal: "Pakistani lawyer reviewing legal documents in office, 
Scales of justice in background, 
professional corporate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"

E-Stamp: "Digital E-Stamp certificate on screen with Pakistani flag colors, 
modern technology concept, 
professional corporate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"

Valuation: "Property valuation report with calculator and house model, 
professional business setting, 
professional corporate photography, 8K ultra HD, 
Al-Najaf Digital Property watermark in bottom-right corner"
```

---

## DESIGN SPECIFICATIONS

### Color Palette
- **Primary:** Gold (#D4AF37)
- **Secondary:** Navy Blue (#1E3A5F)
- **Background:** Cream (#F5F5DC)
- **Accent:** Emerald Green (#10B981)
- **Text:** Dark Navy (#0F172A)
- **Light Text:** Navy 100 (#CBD5E1)

### Typography
- **Headings:** Serif font (e.g., Playfair Display)
- **Body:** Sans-serif font (e.g., Inter)
- **Urdu:** Noto Nastaliq Urdu

### Components
- Rounded corners (16px for cards)
- Subtle shadows
- Glass morphism effects
- 3D tilt effects on hover
- Smooth transitions (300ms)
- Gradient backgrounds

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Setup
- [ ] Initialize React + Vite + TypeScript project
- [ ] Set up Tailwind CSS with custom theme
- [ ] Create database schema
- [ ] Set up PHP API structure
- [ ] Implement authentication system

### Phase 2: Frontend Pages
- [ ] Homepage with all sections
- [ ] Properties page with filters
- [ ] Property detail page
- [ ] Post ad page
- [ ] Services page
- [ ] Legal documents page
- [ ] Fard records page
- [ ] E-Stamp page
- [ ] Lawyers page
- [ ] DC Rate calculator
- [ ] Islamic inheritance calculator
- [ ] Articles page
- [ ] Branches page
- [ ] Capital Valley page
- [ ] Mega search page

### Phase 3: Admin Dashboard
- [ ] Admin login
- [ ] Overview dashboard
- [ ] Properties management
- [ ] E-Stamp management
- [ ] Legal document management
- [ ] Fard records management
- [ ] Services management
- [ ] Lawyers management
- [ ] Users management
- [ ] Inquiries management
- [ ] Verifications
- [ ] Orders management
- [ ] Email management
- [ ] Content management
- [ ] Settings

### Phase 4: Customer Dashboard
- [ ] My listings
- [ ] My inquiries
- [ ] My orders
- [ ] My favorites
- [ ] Profile settings

### Phase 5: Images & Branding
- [ ] Generate all hero images (8K)
- [ ] Generate all property images (8K)
- [ ] Generate all service images (8K)
- [ ] Add Al-Najaf Digital Property watermark to all images
- [ ] Optimize images for web (WebP format)
- [ ] Implement lazy loading

### Phase 6: Testing & Deployment
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Deployment to production

---

## LOCALE SUPPORT

### Languages
- English (default)
- Urdu (اردو)

### Translation Keys
- All UI text must support both languages
- RTL layout for Urdu
- Language switcher in navbar

---

## SECURITY FEATURES

1. CSRF protection
2. XSS prevention
3. SQL injection prevention
4. Password hashing (bcrypt)
5. JWT authentication
6. Rate limiting
7. Input validation
8. File upload validation
9. HTTPS enforcement
10. Content Security Policy

---

## PERFORMANCE OPTIMIZATION

1. Image lazy loading
2. Code splitting
3. Tree shaking
4. Gzip compression
5. Browser caching
6. CDN for static assets
7. Database indexing
8. API response caching
9. Virtual scrolling for lists
10. Debounced search inputs

---

**END OF COMPLETE WEBSITE PROMPT**
