![API Status](https://img.shields.io/website?url=https://newsletter-saas-api.onrender.com/api/health)
# Newsletter SaaS — Backend API

A multi-tenant newsletter platform backend built with Node.js, Express, and MongoDB. Features JWT authentication with refresh token rotation, role-based access control (RBAC), and a payment verification flow.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access + refresh tokens), bcryptjs
- **Payment:** Mock payment gateway with HMAC-SHA256 signature verification

---

## Architecture Decisions

**Multi-tenancy via Membership collection**
Each user can belong to multiple organizations with different roles. A separate `Membership` collection links users to organizations with a role field, enforced by a compound unique index at the database level.

**Two-token auth strategy**
Access tokens expire in 15 minutes and are stored in memory on the client. Refresh tokens are long-lived (7 days), stored in an httpOnly cookie inaccessible to JavaScript, and rotated on every use to limit the damage window of a stolen token.

**RBAC middleware**
A role hierarchy (`subscriber → editor → owner`) is enforced at the route level. Every org-scoped route checks the requesting user's membership role before allowing access, so data isolation between tenants is guaranteed server-side.

**Payment signature verification**
Payment verification uses HMAC-SHA256 signing — the server generates a signature when creating an order and re-computes it on verification. Any tampering with the order ID in transit causes a signature mismatch and the request is rejected. This mirrors how production gateways like Razorpay and Stripe work.

---

## Project Structure

server/
├── config/
│   └── db.js                 MongoDB connection
├── controllers/
│   ├── authController.js     Signup, login, refresh, logout
│   ├── orgController.js      Org CRUD, member management
│   └── billingController.js  Order creation, payment verification
├── middleware/
│   ├── requireAuth.js        JWT access token verification
│   └── requireRole.js        RBAC role checking per org
├── models/
│   ├── User.js
│   ├── Organization.js       Tenant model
│   └── Membership.js         User ↔ Org join with role
├── routes/
│   ├── authRoutes.js
│   ├── orgRoutes.js
│   └── billingRoutes.js
├── utils/
│   ├── tokens.js             JWT generation and verification
│   └── cookies.js            Refresh token cookie management
└── server.js


---

## API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register a new user | None |
| POST | `/api/auth/login` | Login and receive tokens | None |
| POST | `/api/auth/refresh` | Get new access token | Cookie |
| POST | `/api/auth/logout` | Clear refresh token | None |
| GET | `/api/auth/me` | Get current user | Bearer |

### Organizations
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| POST | `/api/organizations` | Create organization | Logged in |
| GET | `/api/organizations/mine` | List my organizations | Logged in |
| GET | `/api/organizations/:orgId` | Get organization | Subscriber |
| GET | `/api/organizations/:orgId/members` | List members | Subscriber |
| POST | `/api/organizations/:orgId/invite` | Invite a member | Editor |
| PATCH | `/api/organizations/:orgId/members/:userId/role` | Change member role | Owner |
| DELETE | `/api/organizations/:orgId/members/:userId` | Remove member | Owner |

### Billing
| Method | Endpoint | Description | Min Role |
|--------|----------|-------------|----------|
| POST | `/api/billing/:orgId/create-order` | Create payment order | Owner |
| POST | `/api/billing/:orgId/verify-payment` | Verify and activate | Owner |
| GET | `/api/billing/:orgId/status` | Get subscription status | Subscriber |
| POST | `/api/billing/:orgId/cancel` | Cancel subscription | Owner |

---

## Local Setup

**1. Clone and install**
```bash
git clone https://github.com/yourusername/newsletter-saas.git
cd newsletter-saas/server
npm install
```

**2. Environment variables**
```bash
cp .env.example .env
```
Fill in the following in `.env`:


PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_ACCESS_SECRET=run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=run above again with a different output
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
PAYMENT_SECRET=run above again




**3. Start the server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`. Test the health check:
GET http://localhost:5000/api/health



---

## Key Concepts Demonstrated

- JWT access + refresh token rotation with httpOnly cookies
- Multi-tenant data isolation via scoped MongoDB queries
- Role-based access control enforced at middleware level
- HMAC-SHA256 payment signature verification
- Compound unique indexes for data integrity at the DB level
- Mongoose `select: false` to prevent password hash leaks



**Live API:** https://newsletter-saas-api.onrender.com