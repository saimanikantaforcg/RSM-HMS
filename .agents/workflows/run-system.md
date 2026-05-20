---
description: How to start the HMS development environment (DB, Backend, Seed, Frontend)
---

# 🚀 HMS Startup Workflow

Follow these steps to get the system running locally:

### 1. Infrastructure
Ensure Docker is running, then start the database:
```powershell
cd services/clinical-service; docker compose up -d
```

### 2. Backend Service
Start the clinical service in a separate terminal:
```powershell
cd services/clinical-service; npm run start:dev
```

### 3. Data Seeding
// turbo
Initialize the demo hospital and admin user:
```powershell
curl http://localhost:3001/api/v1/auth/seed
```

### 4. Frontend Application
Start the Vite dev server in a third terminal:
```powershell
cd frontend; npm run dev
```

### 5. Login
Navigate to `http://localhost:5173/login` and use:
- **Email:** `admin@hms.local`
- **Password:** `admin123`
