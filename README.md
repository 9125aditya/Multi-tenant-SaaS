# Veyra

### Multi-Tenant SaaS Platform

Veyra is a production-ready multi-tenant SaaS platform built with **React, TypeScript, Node.js, Express, Prisma, and PostgreSQL**.

It provides tenant-isolated user management, role-based access control, secure authentication, email verification, password recovery, refresh-token sessions, audit logging, and an admin dashboard.

The project is deployed using **Vercel + Render + PostgreSQL**.

---

## Live Demo

**Frontend:**  
https://multi-tenant-saas-alpha.vercel.app

**Backend API:**  
https://veyra-api-bbur.onrender.com

**Login:**  
https://multi-tenant-saas-alpha.vercel.app/login

> The production environment uses a separate PostgreSQL database and production environment variables.

---

## Features

### Authentication & Security

- User registration and login
- JWT-based authentication
- Short-lived access tokens
- Database-backed refresh sessions
- Refresh-token rotation
- Token versioning for session invalidation
- Password hashing with bcrypt
- Change password
- Forgot password
- Password reset
- Email verification
- Resend verification email
- Protected frontend routes
- Protected backend routes
- Role-based authorization
- Helmet security headers
- CORS configuration
- Request rate limiting
- Request body size limits
- Environment variable validation with Zod
- Graceful server shutdown

### Multi-Tenant Architecture

Veyra is designed around tenant isolation.

Each user belongs to a tenant:

```text
Tenant
   │
   ├── User
   ├── Audit Logs
   ├── Refresh Sessions
   ├── Email Verification Tokens
   └── Password Reset Tokens
```

Users can only access resources belonging to their authenticated tenant.

This provides a foundation for building scalable SaaS applications where multiple organizations can use the same platform while keeping their data logically isolated.

### Role-Based Access Control

Veyra supports four roles:

| Role | Purpose |
|---|---|
| `SUPER_ADMIN` | Platform-level administration |
| `ADMIN` | Tenant administration |
| `MANAGER` | Management-level access |
| `USER` | Standard application access |

Authorization is enforced on the backend rather than relying only on frontend UI restrictions.

### Admin Dashboard

The dashboard provides:

- Overview dashboard
- User management
- Tenant settings
- Audit log viewer
- Profile management
- Role-based UI
- Authentication state management
- Toast notifications
- Responsive navigation
- Light/dark theme support

### Audit Logging

Important administrative actions are recorded in the audit system.

Audit logs are tenant-scoped and accessible to authorized administrators.

This provides visibility into actions performed inside the platform and creates a foundation for compliance and security monitoring.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

### Backend

- Node.js
- Express
- TypeScript
- Zod
- JSON Web Tokens
- bcrypt
- Helmet
- express-rate-limit
- CORS
- Swagger

### Database

- PostgreSQL
- Prisma ORM

### Email

- Resend

### Deployment

- Vercel — Frontend
- Render — Backend
- Render PostgreSQL — Production Database

### Development Tools

- Git
- GitHub
- VS Code
- Thunder Client

---

## Architecture

```text
                         ┌─────────────────────┐
                         │       Vercel        │
                         │    React + Vite     │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
                         ┌─────────────────────┐
                         │       Render        │
                         │  Node + Express API │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌────────────┐  ┌────────────┐  ┌────────────┐
             │ PostgreSQL │  │   Resend   │  │   Prisma   │
             │  Database  │  │   Email    │  │    ORM     │
             └────────────┘  └────────────┘  └────────────┘
```

---

## Project Structure

```text
multi-tenant-saas/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── theme/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── lib/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Authentication Flow

Veyra uses a two-token authentication architecture.

```text
Login
  │
  ▼
Validate credentials
  │
  ▼
Generate access token
  │
  ├── Short-lived JWT
  │
  ▼
Create refresh session
  │
  └── Database-backed session
```

When the access token expires:

```text
Client
  │
  ▼
Refresh request
  │
  ▼
Validate refresh session
  │
  ▼
Rotate refresh token
  │
  ▼
Issue new access token
```

This provides better session control than relying on a long-lived JWT alone.

---

## Tenant Isolation

Every authenticated request carries tenant context:

```text
userId
tenantId
role
tokenVersion
```

Backend queries use the authenticated tenant ID to scope resources.

Conceptually:

```text
Authenticated User
        │
        ▼
    tenantId
        │
        ▼
Tenant-scoped database query
```

This prevents users from accessing resources belonging to another tenant through normal API operations.

---

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me

POST /api/auth/verify-email
POST /api/auth/resend-verification

POST /api/auth/forgot-password
POST /api/auth/reset-password

POST /api/auth/change-password
```

### Users

```text
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Tenants

```text
GET   /api/tenants
POST  /api/tenants
PATCH /api/tenants/:id
```

### Audit Logs

```text
GET /api/audit-logs
```

All protected endpoints require authentication, and authorization is enforced according to the user's role.

---

## Database Models

The main Prisma models include:

```text
Tenant
User
RefreshSession
EmailVerificationToken
PasswordResetToken
AuditLog
```

The `User` model uses a composite uniqueness constraint:

```text
tenantId + email
```

This allows the same email address to exist in different tenants while remaining unique within each tenant.

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/9125aditya/Multi-tenant-SaaS.git
cd Multi-tenant-SaaS
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

---

## Environment Variables

### Backend

Create:

```text
server/.env
```

Example:

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=
EMAIL_FROM=
NODE_ENV=development
PORT=3000
```

Never commit real environment variables or secrets.

### Frontend

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000/api
```

For production:

```env
VITE_API_URL=https://veyra-api-bbur.onrender.com/api
```

---

## Database Setup

From the `server` directory:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

For production migrations:

```bash
npx prisma migrate deploy
```

---

## Running Locally

### Start backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:3000
```

### Start frontend

In another terminal:

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Testing

API endpoints can be tested using:

- Thunder Client
- Postman
- Browser
- Swagger

The project includes API documentation through Swagger.

Authentication and authorization should be tested across different roles to verify tenant isolation and RBAC behavior.

---

## Production Deployment

### Frontend — Vercel

The frontend is deployed as a Vite application.

Production configuration:

```text
Framework: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Production environment variable:

```env
VITE_API_URL=https://veyra-api-bbur.onrender.com/api
```

### Backend — Render

The backend is deployed as an Express/Node.js web service.

Production build:

```bash
npm install --include=dev && npx prisma migrate deploy && npm run build
```

The application uses Render's provided `PORT`.

Production environment variables include:

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
RESEND_API_KEY=
EMAIL_FROM=
NODE_ENV=production
```

---

## Security Considerations

The application includes several production-oriented security measures:

- Password hashing with bcrypt
- JWT authentication
- Short-lived access tokens
- Refresh-token rotation
- Database-backed sessions
- Token versioning
- Role-based authorization
- Tenant-scoped authorization
- Rate limiting
- Helmet
- CORS restrictions
- Environment validation
- Request body limits
- Password reset tokens
- Email verification
- Audit logging
- Graceful shutdown

Secrets are stored through environment variables and are not committed to Git.

---

## UI & Design

Veyra uses a minimal B2B SaaS and admin-console design language with:

- Clean grayscale interface
- Responsive layouts
- Notebook-inspired visual system
- Light and dark themes
- Consistent typography
- Lucide icons
- Toast notifications
- Role-aware navigation
- Focus on usability over visual noise

The goal is to provide an interface suitable for an internal enterprise dashboard rather than a consumer-oriented application.

---

## Current Status

**Veyra v1.0.0**

The application is deployed and operational with:

- Production frontend
- Production backend
- Production PostgreSQL database
- Prisma migrations
- Authentication
- Multi-tenancy
- RBAC
- User management
- Tenant management
- Email verification
- Password recovery
- Refresh sessions
- Audit logging
- Production deployment configuration

---

## Future Improvements

Potential future improvements include:

- Automated database backups
- Advanced tenant administration
- Organization invitations
- Fine-grained permissions
- Advanced analytics
- User activity dashboards
- Automated CI/CD checks
- Automated integration testing
- Monitoring and observability
- SSO / OAuth
- Two-factor authentication
- Subscription and billing support

---

## Author

**Aditya Singh**

B.Tech Computer Science Engineering  
Dr. Akhilesh Das Gupta Institute of Professional Studies

GitHub:  
https://github.com/9125aditya

---

## License

This project is currently maintained as a personal software engineering project.

If you plan to make the repository public, add an explicit license such as MIT before allowing others to reuse the code.
