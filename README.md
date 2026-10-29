# LionsDen Resort Management System — Backend API

Production-ready, modular REST API backend for the LionsDen Luxury Resort Management System across Ahmedabad and Dhari branches. Built with Node.js Active LTS, Express 5, MongoDB (Mongoose 8), ES Modules, Zod, and structured Pino logging.

---

## 1. Technology Stack

- **Runtime:** Node.js (Active LTS, v18+; verified on v25)
- **Framework:** Express.js 5 (`^5.0.1`)
- **Module System:** JavaScript ES Modules (`"type": "module"`)
- **Database:** MongoDB with Mongoose (`^8.10.1`)
- **Validation:** Zod (`^3.24.2`)
- **Authentication:** JWT (JSON Web Tokens) with refresh-token rotation and reuse detection
- **Password Security:** bcryptjs (10 salt rounds)
- **Logging:** Pino & Pino-HTTP with request-id tracking and data redaction
- **Security:** Helmet, CORS allowlisting, Express Rate Limiting
- **Documentation:** OpenAPI 3.0 via Swagger UI (`/api-docs`)
- **Code Standards:** ESLint 9 (Flat Config) & Prettier

---

## 2. Architecture & Directory Structure

Feature-based modular architecture adhering to separation of concerns:

```
backend/
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore configuration
├── .prettierrc & .prettierignore    # Code formatter configuration
├── eslint.config.js                 # ESLint 9 flat configuration
├── package.json                     # Dependencies and scripts
├── postman_collection.json          # Ready-to-import Postman API collection
├── README.md                        # Documentation and runbook
└── src/
    ├── app.js                       # Express app configuration & middleware pipeline
    ├── server.js                    # HTTP server bootstrap & graceful shutdown
    ├── config/
    │   ├── constants.js             # Roles, permissions, statuses, categories
    │   ├── db.js                    # MongoDB connection & replica set detection
    │   ├── index.js                 # Zod-validated environment config
    │   └── logger.js                # Pino structured logger with redaction
    ├── database/
    │   └── seed.js                  # Idempotent seed script (Roles, Branches, Admin, 80 Bungalows)
    ├── common/
    │   ├── errors/                  # AppError subclasses & error codes
    │   ├── middleware/              # Auth, RBAC, Validation, Error, Rate Limiting, RequestId
    │   ├── utils/                   # Currency (paise), Date (IST/UTC), JWT, Response
    │   └── validators/              # Common validators (Id, Pagination)
    ├── modules/
    │   ├── auth/                    # Login, Token Rotation, Logout, Change Password
    │   ├── users/                   # User accounts & RBAC management
    │   ├── roles/                   # System roles & permissions
    │   ├── branches/                # Ahmedabad & Dhari branch operations
    │   ├── bungalows/               # 1BHK, 2BHK, 3BHK, 4BHK inventory
    │   ├── pricing/                 # Peak pricing & festival surcharge rules
    │   ├── bookings/                # Bookings, half-open availability, concurrency control
    │   ├── customers/               # Customer master & booking frequency
    │   ├── payments/                # Immutable payment ledger & reversals
    │   ├── negotiations/            # Sales rent negotiation & Admin approval
    │   ├── maintenance/             # Work orders, blocking/partial availability sync
    │   ├── dashboard/               # Real-time metrics & action items
    │   ├── reports/                 # Collections, occupancy, and balances reports
    │   └── audit-logs/              # Immutable audit trail
    └── docs/
        └── swagger.js               # OpenAPI 3.0 specification
```

---

## 3. Quickstart & Installation

### Prerequisites
- Node.js `>= 18.0.0`
- MongoDB `>= 6.0` (Local or MongoDB Atlas)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and secrets
   ```

3. **Seed database (Idempotent):**
   ```bash
   npm run seed
   ```
   *Creates system roles, Ahmedabad and Dhari branches, initial Super Admin, and seeds the default inventory of ~80 bungalows.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *For production:*
   ```bash
   npm start
   ```

5. **Verify server status:**
   - Health check: `http://localhost:5000/health`
   - Readiness check: `http://localhost:5000/ready`
   - Swagger Documentation: `http://localhost:5000/api-docs`

---

## 4. Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `PORT` | No | `5000` | HTTP port |
| `API_PREFIX` | No | `/api/v1` | Base route prefix |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins (comma-separated for multiple) |
| `TIMEZONE` | No | `Asia/Kolkata` | Business timezone |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/lionsden_resort` | Connection string |
| `JWT_ACCESS_SECRET` | **Yes** | — | Min 16-char secret for Access Tokens |
| `JWT_REFRESH_SECRET` | **Yes** | — | Min 16-char secret for Refresh Tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Lifetime of access tokens |
| `JWT_REFRESH_EXPIRY`| No | `7d` | Lifetime of refresh tokens |
| `SUPER_ADMIN_EMAIL` | No | `superadmin@lionsdenresorts.com` | Initial Super Admin login email |
| `SUPER_ADMIN_PASSWORD` | No | `ChangeMeSuperSecret123!` | Initial Super Admin password |
| `SUPER_ADMIN_NAME` | No | `LionsDen Super Admin` | Super Admin name |
| `LOG_LEVEL` | No | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |

---

## 5. MongoDB Atlas & Transaction Requirements

### Concurrency & Double-Booking Protection
1. **Multi-Document ACID Transactions:**
   - Supported when running against a MongoDB Replica Set (including all MongoDB Atlas clusters: Free M0, M10, etc.).
   - The backend automatically detects whether MongoDB has replica set capabilities (`admin.command({ replSetGetStatus: 1 })`).
2. **Atomic Reservation Locks (`ReservationLock` collection):**
   - In addition to session transactions, each night in the half-open interval `[checkIn, checkOut)` is locked using a unique compound index on `{ bungalow: 1, dateKey: 1 }`.
   - If two requests attempt to book the same bungalow for the same night simultaneously, MongoDB triggers a `11000 E11000 duplicate key error` on the lock collection, preventing double bookings even on standalone non-replica instances.

### Connecting to MongoDB Atlas
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write privileges.
3. Whitelist your server IP address (or `0.0.0.0/0` in Atlas Network Access).
4. Copy the SRV URI into `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/lionsden_resort?retryWrites=true&w=majority
   ```

---

## 6. Business Rules & Logic

### 1. Integer Paise Representation
- Floating-point arithmetic errors in currency are avoided by storing all monetary amounts as **integer paise** (1 INR = 100 paise).
- Example: Standard rent of ₹5,000 is stored as `500000`.
- Response utilities include both integer paise and formatted Indian Rupee strings.

### 2. Timezone & Half-Open Booking Interval
- Business timezone is `Asia/Kolkata` (IST, UTC+05:30).
- All timestamps are stored in UTC in MongoDB.
- Bookings use **half-open interval semantics**: `[checkIn, checkOut)`.
  - Check-in date is inclusive; check-out date is exclusive.
  - Overlap condition: `existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn`.
  - A guest checking out at 11:00 AM does not block a guest checking in at 2:00 PM on the same day.

### 3. Roles and Branch Scoping
- **Super Admin:** Unrestricted global access across all branches, finance, user administration, and system configurations.
- **Admin:** Scoped to their assigned branch. Can approve negotiated rent discounts, assign and close maintenance requests, manage branch bookings, and view branch reports.
- **Sales:** Scoped to search bungalow availability, create bookings, register customers, record initial payments, and submit discount negotiation requests for Admin review.
- Client-supplied roles and branch IDs are never trusted: enforced via `rbac.middleware.js` and `enforceBranchScope()`.

### 4. Peak Pricing & Festival Rules
- Dynamic pricing rules allow percentage surge, percentage discount, or fixed rent.
- Overlapping rule resolution priority:
  `Specific Bungalow Match > Category Match > Branch Match > Global Default`.
  Higher priority number breaks ties. Quoted price is saved with the booking.

### 5. Negotiated Rent Approval
- Sales submits request -> Status is `PENDING`.
- Admin approves -> Booking's `finalRentPerNight` is updated, and `totalAmount` and `outstandingBalance` are recalculated server-side.
- Admin rejects -> Booking remains at current rent with recorded decision comment.

### 6. Immutable Payment Ledger & Reversals
- Payments cannot be updated or deleted.
- Corrections and refunds must be processed through authorized **reversal entries** (`isReversal: true`, `reversalOfPaymentId`).
- Balances are recalculated on the server.
- Duplicate submission is prevented via unique `idempotencyKey`.

### 7. Maintenance Management
- Tickets track problem, priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and facility affected (e.g. AC, Geyser, Entire Bungalow).
- `blocksAvailability: true` automatically flags bungalow as `UNDER_MAINTENANCE` and excludes it from availability.
- Partial facility tickets show non-blocking **maintenance warnings** during availability searches.
- Status history is maintained for full accountability.

---

## 7. API Endpoints Overview (`/api/v1`)

| Module | Method | Endpoint | Description | Minimum Role |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/login` | Login with email & password | Public |
| | `POST` | `/auth/refresh-token` | Rotate refresh token | Public |
| | `POST` | `/auth/logout` | Revoke refresh token | Authenticated |
| | `GET` | `/auth/me` | Current user profile | Authenticated |
| | `POST` | `/auth/change-password` | Change password | Authenticated |
| **Availability** | `GET` | `/availability` | Half-open availability search | Sales |
| **Bookings** | `GET` | `/bookings` | List bookings with filters | Sales |
| | `POST` | `/bookings` | Create booking (ACID locks) | Sales |
| | `GET` | `/bookings/:id` | Get booking details | Sales |
| | `POST` | `/bookings/:id/cancel` | Cancel booking | Sales |
| | `PATCH` | `/bookings/:id/status` | Update status (Check-in/out) | Sales |
| **Negotiations** | `GET` | `/negotiations` | List negotiation requests | Sales |
| | `POST` | `/negotiations` | Submit negotiated rent request | Sales |
| | `POST` | `/negotiations/:id/approve` | Approve discount & update rent | Admin |
| | `POST` | `/negotiations/:id/reject` | Reject discount request | Admin |
| **Payments** | `GET` | `/payments` | List payment ledger entries | Sales |
| | `POST` | `/payments` | Record payment | Sales |
| | `POST` | `/payments/:id/reverse` | Reverse payment entry | Admin |
| **Maintenance** | `GET` | `/maintenance` | List maintenance tickets | Sales |
| | `POST` | `/maintenance` | Report maintenance issue | Sales |
| | `PATCH` | `/maintenance/:id/status` | Update maintenance status | Admin |
| **Dashboard** | `GET` | `/dashboard` | Resort metrics & action items | Sales |
| **Reports** | `GET` | `/reports/collections`| Collections by mode & user | Admin |
| | `GET` | `/reports/occupancy` | Occupancy by bungalow category| Admin |
| | `GET` | `/reports/balances` | Outstanding balances report | Admin |
| **Audit Logs** | `GET` | `/audit-logs` | Immutable audit trail | Super Admin |

---

## 8. Deployment Guide

### Deployment via PM2 on Linux VPS
1. Install PM2: `npm install -g pm2`
2. Clone and setup `.env`:
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   ```
3. Run migrations / seed:
   ```bash
   npm run seed
   ```
4. Start application:
   ```bash
   pm2 start src/server.js --name "lionsden-backend" -i max
   pm2 save
   pm2 startup
   ```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## 9. Phase 1 Disclosures & Future Architecture

- **Phase 1 Complete:** All requirements for Super Admin, Admin, and Sales roles, multi-branch bungalow inventory, availability search, pricing rules, bookings, payments ledger, negotiations, maintenance, dashboard, and reports are fully implemented.
- **Phase 2 Extensibility:** The architecture is decoupled with modular services and role-based permissions ready for future `Recipient` and `Restaurant` roles without schema redesign.
- **Online Gateway Notice:** As mandated by standards, online payment gateway verification (Razorpay/Stripe webhook verification) is intentionally not mocked or claimed without real merchant credentials. Ledger recording operates via standard verified payment references (`UPI`, `CASH`, `BANK_TRANSFER`).
