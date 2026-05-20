# 🏥 RSM HMS — Next-Gen Hospital Management System

An enterprise-grade, FHIR-native, multi-tenant Hospital Management System built with React, NestJS, and PostgreSQL.

---

## 🚀 Quick Start Guide

Follow these steps in order to start the full system.

### 1. Start the Database (Docker)
Ensure Docker Desktop is running on your machine.
```bash
cd services/clinical-service
docker compose up -d
```
*This starts PostgreSQL 16 on port 5432 and pgAdmin 4 on http://localhost:5050.*

### 2. Start the Backend (NestJS)
Open a new terminal:
```bash
cd services/clinical-service
# Install dependencies if not done
npm install
# Start in dev mode
npm run start:dev
```
*The API will be available at http://localhost:3001/api/v1*

### 3. Seed Initial Data (Hospital + Admin)
Before logging in the first time, you must create a tenant (hospital) and an admin user.
Open your browser or use `curl`:
```
GET http://localhost:3001/api/v1/auth/seed
```
**Credentials:**
- **Email:** `admin@hms.local`
- **Password:** `admin123`

### 4. Start the Frontend (Vite/React)
Open a new terminal:
```bash
cd frontend
# Install dependencies if not done
npm install
# Start dev server
npm run dev
```
*The UI will be available at http://localhost:5173*

---

## � Documentation

For comprehensive user documentation, including detailed workflows, user roles, and system capabilities, see:

**[APPLICATION_DOCUMENTATION.md](APPLICATION_DOCUMENTATION.md)** - Complete end-to-end user guide

---

## �🔐 Security Features (Sprint 1)
- **JWT Auth:** Stateless authentication with 8h access tokens and 7d refresh tokens.
- **Global Guard:** All API routes are protected by default (requires Bearer token).
- **Multi-Tenancy:** Automated `tenant_id` isolation via middleware.
- **Security Headers:** Helmet.js integrated for XSS/CSRF protection.
- **Safe Passwords:** Bcrypt hashing with 12 salt rounds.

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, React Router 6.
- **Backend:** Node.js, NestJS 11, TypeORM, Passport.js.
- **Database:** PostgreSQL 16.
- **DevOps:** Docker Compose.
