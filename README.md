# 🚗 Neko-ber — Enterprise Carpooling Platform with Fare Negotiation

An enterprise-grade, multi-tenant B2B/B2C carpooling and ride-sharing platform designed for corporate organizations and regular commuters. Features real-time fare negotiation, live GPS tracking with OSRM routing, boarding OTP verification, Razorpay payment gateway integration (UPI, Cards, Wallet, Cash), real-time WebSocket chat, and a custom neo-brutalist sketchbook UI design system.

---

## 🌟 Key Features

### 🏢 Multi-Tenant Enterprise Architecture
- **Super Admin Portal (`/super-admin`)**: Platform control center for provisioning organizations, managing corporate admins, auto-generating credentials, and monitoring cross-tenant metrics.
- **Organization Admin Hub (`/[orgSlug]/admin`)**: Admin dashboard for corporate employee registration approvals, company ID card inspection, driver vehicle & license verification, and subsidy policy management.
- **Employee & Commuter Dashboard (`/dashboard`)**: Unified dashboard for searching rides, publishing ride offers, managing active bargains, live trip tracking, and wallet/payment management.

### 💬 Real-Time Dynamic Fare Negotiation
- **Turn-Based Counter-Offers**: Passengers and drivers can propose alternating counter-offers on ride listings.
- **Instant Agreement & Auto-Booking**: Accepting a negotiated offer instantly confirms the fare agreement and generates the ride booking and trip wrapper atomically.
- **Real-Time WebSocket Sync**: Live offer updates delivered over Socket.IO without requiring page refreshes.

### 📍 Live GPS Tracking & Route Optimization
- **OSRM Engine Integration**: Automatic calculation of driving distance, duration, and GeoJSON route geometry.
- **Haversine Distance Fallback**: High-reliability straight-line calculation fallback if routing servers are unreachable.
- **30-Second Throttled ETA Engine**: Real-time driver location broadcasts with dynamic ETA calculation.
- **Kolkata Location Dataset**: Pre-configured with major Kolkata landmarks (Park Street, Salt Lake Sector V, New Town, Airport, Howrah, Victoria, EM Bypass).

### 🔑 Boarding OTP Verification
- **4-Digit Boarding PIN**: Passengers receive a 4-digit verification PIN upon ride booking.
- **Driver Verification Panel**: Drivers input the passenger's boarding PIN to transition trip state to `IN_PROGRESS` and activate live GPS tracking.

### 💳 Payments & Digital Wallet
- **Razorpay Integration**: Native support for **UPI**, **Credit/Debit Cards**, **Cash**, and **Wallet**.
- **HMAC-SHA256 Signature Verification**: Server-side verification for online trip payments and wallet recharges.
- **Interactive Checkout Modal**: Custom fallback modal for sandbox testing environments and adblocker-friendly execution.
- **Automated Ledger**: Complete wallet credit/debit transaction history.

### 🚀 High-Performance Optimizations
- **Search Bar Debouncing**: `350ms` debounced place search with `AbortController` HTTP request cancellation.
- **Multi-Tier In-Memory Caching**:
  - **OSRM Routes**: 1-hour TTL cache for coordinate route geometry.
  - **User Authentication**: 30-second TTL cache for JWT user verification to reduce database queries by 90%+.
  - **Geocoding & Autocomplete**: 24-hour geocode cache and 15-minute autocomplete cache.
  - **Client REST API**: 1-to-5 minute TTL cache for vehicles, saved places, and orgs with automatic mutation invalidation.
- **Pagination & Code Splitting**: Server-side and client-side pagination across all list views (Ride History, Offered Rides, Available Rides, Wallet Transactions, Organizations, Employees).
- **Hydration Protection**: React client-mount guard (`hasMounted`) preventing SSR/CSR hydration mismatch warnings.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), PostCSS
- **Real-Time Client**: [Socket.IO Client v4](https://socket.io/)
- **Maps & Leaflet**: [Leaflet.js](https://leafletjs.com/), OpenStreetMap, Ola Maps / Mappls API
- **Payments**: Razorpay Checkout JS SDK

### Backend
- **Runtime & Server**: Node.js v20+, Express.js v4
- **ORM & Database**: [Prisma ORM 5.22](https://www.prisma.io/), PostgreSQL 16 (Docker / Cloud Postgres)
- **Real-Time Server**: Socket.IO Server (Namespaces: `/tracking`, `/chat`, `/calls`)
- **Security & Validation**: JWT (Access & Refresh tokens), Bcrypt hashing, Zod validation, Helmet, CORS
- **File Storage**: Multer (ID proof documents, driving licenses)

---

## 📂 Project Structure

```plaintext
Oddo-Final/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma ORM Database Models & Relations
│   │   ├── seed.js             # Seeding script (500 Kolkata records per model)
│   │   └── migrations/         # PostgreSQL migration SQL files
│   ├── src/
│   │   ├── app.js              # Express app setup & middleware
│   │   ├── server.js           # HTTP & Socket.IO server listener
│   │   ├── config/             # Prisma & Razorpay singletons
│   │   ├── middleware/         # Auth JWT, Role, SocketAuth, Validation
│   │   ├── modules/
│   │   │   ├── auth/           # Login, Register, ID proof upload, Refresh token
│   │   │   ├── orgs/           # Tenant management & corporate settings
│   │   │   ├── users/          # User approvals, profiles & access toggle
│   │   │   ├── vehicles/       # Driver vehicle registration & license approval
│   │   │   ├── rides/          # Ride publishing, Kolkata route search, Join requests
│   │   │   ├── negotiations/   # Fare bargain offers & counter-offers
│   │   │   ├── trips/          # Trip lifecycle (SCHEDULED -> IN_PROGRESS -> COMPLETED)
│   │   │   ├── tracking/       # Live GPS updates, ETA throttling & socket rooms
│   │   │   ├── chat/           # In-trip REST & WebSocket messaging
│   │   │   ├── payments/       # Razorpay trip payments & webhook handler
│   │   │   ├── wallet/         # Wallet balance & Razorpay recharge verification
│   │   │   └── reports/        # Sustainability & fuel cost reporting
│   │   └── utils/              # Routing (OSRM), Token revocation, Trip auth
│   ├── uploads/                # User ID proofs & vehicle license documents
│   └── compose.yml             # Local PostgreSQL Docker container config
│
└── frontend/
    ├── app/
    │   ├── page.tsx            # Landing page
    │   ├── layout.tsx          # Root layout & global providers
    │   ├── login/              # Login page
    │   ├── signup/             # Signup & ID proof upload page
    │   ├── dashboard/          # Main Employee/Commuter Dashboard
    │   ├── super-admin/        # Super Admin Control Center
    │   ├── [orgSlug]/
    │   │   └── admin/          # Org Admin Dashboard & Admin Login
    │   ├── api/
    │   │   └── places/         # Next.js API route proxies (Autocomplete, Geocode)
    │   ├── components/         # RouteMap, LocationInput, Toast, Modals, Navbar, Footer
    │   ├── context/            # AuthContext, AppContext
    │   └── lib/                # API client (cachedFetchApi), Socket singleton, Razorpay SDK
    ├── public/                 # Logos, styles, assets
    └── DESIGN.md               # Say Briefly sketchbook design tokens
```

---

## 🗄️ Database Models (Prisma)

- **`Org`**: Tenant organizations with subsidy %, base charges, max riders per carpool.
- **`User`**: Accounts with roles (`SUPER_ADMIN`, `ORG_ADMIN`, `USER`), verification status (`PENDING`, `APPROVED`, `REJECTED`), ratings, and org associations.
- **`Vehicle`**: Vehicles owned by employees with capacity, fuel type, registration plate, and driving license status.
- **`Ride`**: Ride offers published by drivers with pickup/destination coordinates, departure times, seats, and fares.
- **`JoinRequest`**: Seat requests sent by passengers or invitations sent by drivers (`PENDING`, `ACCEPTED`, `DECLINED`).
- **`Negotiation` & `NegotiationOffer`**: Fare negotiation sessions holding chronological counter-offers between driver and passenger.
- **`Booking`**: Confirmed seat bookings tied to accepted join requests.
- **`Trip`**: Active trip wrapper controlling the journey lifecycle (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **`TripPassenger`**: Booked riders per trip with individual payment status.
- **`TripLocation`**: Real-time GPS coordinate breadcrumbs for live tracking (`onDelete: Cascade`).
- **`Message`**: In-trip chat messages (`onDelete: Cascade`).
- **`CallLog`**: Audio/Video in-app call duration history (`onDelete: Cascade`).
- **`Payment`**: Trip payment records storing Razorpay order & payment IDs (`onDelete: SetNull`).
- **`Wallet` & `WalletTransaction`**: Digital wallet ledger tracking credits and debits.
- **`SavedPlace`**: User-saved locations (Home, Office).
- **`FareBreakdown`**: Fuel components, distance, duration, and corporate subsidy breakdowns.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **pnpm** or **npm**
- **Docker**: For running local PostgreSQL database (optional if using cloud Postgres)

---

### Step 1: Clone Repository & Configure Environment Variables

Create `.env` in `backend/`:
```env
PORT=3000
NODE_ENV=development

# Database Connection (Docker local or Cloud Postgres)
DATABASE_URL="postgresql://carpool_user:carpool_pass@localhost:5433/carpool_db?schema=public"

# PostgreSQL Docker Setup
POSTGRES_USER=carpool_user
POSTGRES_PASSWORD=carpool_pass
POSTGRES_DB=carpool_db
POSTGRES_PORT=5433

# JWT Secrets
JWT_ACCESS_SECRET="super-secret-access-token-key"
JWT_REFRESH_SECRET="super-secret-refresh-token-key"
JWT_PENDING_SECRET="super-secret-pending-token-key"
JWT_ACCESS_EXPIRY="30d"
JWT_REFRESH_EXPIRY="90d"

# OSRM Routing Base URL
OSRM_BASE_URL="https://router.project-osrm.org"

# Razorpay API Credentials
RAZORPAY_KEY_ID="rzp_test_TIEEOjvbFoasiQ"
RAZORPAY_KEY_SECRET="CGDBIcpUhFFJjZATENMKmzJG"
RAZORPAY_WEBHOOK_SECRET="n65SUjnBoucxiMYy8Bj4nfeOzPW3TErWxBoVqWd5CVSePBLCLxdJdOPrXaVXyMJF"
```

Create `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api/v1"
```

---

### Step 2: Start PostgreSQL Database (Docker)

```bash
cd backend
docker compose up -d
```

---

### Step 3: Setup & Seed Backend Database

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npx prisma db push

# Seed 500+ Kolkata records across every model
node prisma/seed.js
```

---

### Step 4: Setup & Run Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

---

### Step 5: Start Backend Server

```bash
cd backend

# Run development server with Nodemon
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: `http://localhost:3000/api/v1`
- **Socket.io Endpoint**: `ws://localhost:3000`

---

## 🔑 Default Seeded Credentials

All accounts are pre-seeded with the password: **`Password123!`**

| Role | Email | Password | Org / Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@platform.com` | `Password123!` | `/super-admin` (Global Platform Control) |
| **Org Admin** | `admin@acme.com` | `Password123!` | `/acme-corporation/admin/login` (Acme Corp Admin) |
| **Driver (User)** | `john.doe@acme.com` | `Password123!` | `/login` (Acme Corp — Has verified Tesla Model Y) |
| **Commuter (User)** | `user3@kolkatacarpool.com` | `Password123!` | `/login` (Seeded Kolkata Employee #3) |
| **Commuter (User)** | `user4@kolkatacarpool.com` to `user499@kolkatacarpool.com` | `Password123!` | `/login` (Seeded Kolkata Employees) |

---

## 📡 WebSocket Real-Time Event Schema

### `/tracking` Namespace
- **`join:trip`** (`{ tripId }`): Joins tracking room and receives `route:info` GeoJSON.
- **`join:ride`** (`{ rideId }`): Joins negotiation room.
- **`location:update`** (`{ tripId, lat, lng }`): Driver emits location, server calculates OSRM ETA and broadcasts to room.
- **`negotiation:offer`** (`{ rideId, negotiationId, amount, offeredBy }`): Real-time counter-offer broadcast.
- **`negotiation:accepted`** (`{ rideId, negotiationId, agreedFare, trip }`): Broadcasts offer acceptance and confirmed trip details.
- **`ride:accepted`** (`{ rideId, passengerId, tripId }`): Broadcasts ride match event.
- **`payment:updated`** (`{ tripId, payment }`): Real-time payment status update.

### `/chat` Namespace
- **`join:trip`** (`{ tripId }`): Joins chat room.
- **`message:send`** (`{ tripId, content }`): Sends chat message, server saves to DB and broadcasts `message:new`.

---

## 🎨 UI & Design Tokens ("Say Briefly" Theme)

Designed with a sketchbook aesthetic on warm cream paper:
- **Canvas / Background**: Warm Cream (`#FCFAF5`)
- **Primary Structural Fills**: Forest Ink (`#173300`)
- **Accent Fills**: Highlighter Yellow (`#FFEB5B`)
- **Card Borders**: 2px Solid Forest Ink with 6px–8px hard offset shadows (`shadow-[6px_6px_0px_#173300]`)
- **Typography**: Display headlines in *Bricolage Grotesque*, UI/body copy in *Inter*, micro-metadata in *Roboto Mono*.

---

## 📜 License

Distributed under the MIT License. Developed for enterprise corporate carpooling and urban ride-sharing.
