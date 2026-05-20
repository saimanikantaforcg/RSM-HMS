# RSM HMS: Online Deployment & Server Requirements Guide

To deploy RSM HMS online for real-world clinical use, you will need to move away from the local SQLite database and development servers, and use a production-grade infrastructure. 

Here are the requirements and the step-by-step deployment strategies ranging from the easiest approach to the enterprise approach.

## 📋 Minimum Production Requirements

To run this system securely on the internet, you will need:
1. **Database**: A **PostgreSQL** database (Local SQLite is not safe for concurrent production use).
2. **Backend Hosting**: A server capable of running **Node.js (v20+)** or Docker containers.
3. **Frontend Hosting**: A static file host or CDN (Content Delivery Network).
4. **Domain & SSL**: A registered domain name (e.g., `hms.myclinic.com`) and an SSL certificate (HTTPS is strictly required for clinical data and the `Secure` HttpOnly cookies to work).

---

## 🚀 Option 1: The Easiest Way (Platform-as-a-Service)
*Best for getting online quickly with zero server maintenance.*

### 1. Database (Supabase or Railway)
* Create a free/paid managed PostgreSQL database online (e.g., Supabase, Neon, or Railway).
* Copy the provided Connection URI string.

### 2. Backend (Render or Railway)
* Push your code to a private GitHub repository.
* Link the repository to [Render.com](https://render.com) or [Railway.app](https://railway.app).
* Set the Root Directory to `services/clinical-service`.
* Add your Environment Variables matches the `.env.production` file we created:
  ```env
  NODE_ENV=production
  DB_TYPE=postgres
  DB_HOST=<your-postgres-host>
  DB_PASS=<your-postgres-password>
  JWT_SECRET=<random-64-character-string>
  COOKIE_SECRET=<random-32-character-string>
  FRONTEND_URL=https://your-frontend-domain.vercel.app
  ```

### 3. Frontend (Vercel or Netlify)
* Link your GitHub repository to [Vercel](https://vercel.com).
* Set the Root Directory to `frontend`.
* **Important**: Add an Environment Variable: `VITE_API_BASE=https://your-backend-url.onrender.com/api/v1` 
  *(Note: update `frontend/src/lib/api.js` to use `import.meta.env.VITE_API_BASE` instead of the hardcoded localhost before pushing)*.
* Click Deploy.

---

## 🏢 Option 2: The Enterprise Way (VPS + Docker)
*Best for total control, HIPAA compliance, and lowest long-term cost.*

### 1. Virtual Private Server (VPS)
* Rent an Ubuntu Linux server from AWS (EC2), DigitalOcean, or Hetzner.
* Install **Docker** and **Docker Compose** on the server.

### 2. Managed Database
* Provision a managed AWS RDS PostgreSQL instance in the same VPC (Virtual Private Cloud) as your server so it is hidden from the public internet.

### 3. Run the Backend Container
* SSH into your server, pull your code, and build the Docker container using the `Dockerfile` we already created:
  ```bash
  cd services/clinical-service
  docker build -t rsm-hms-backend .
  docker run -d --name hms-api -p 3001:3001 --env-file .env.production rsm-hms-backend
  ```

### 4. Reverse Proxy & SSL
* Install **Nginx** or **Caddy** on the server.
* Configure Nginx to route traffic to port `3001` for the backend, and serve the `frontend/dist` compiled files directly for the frontend.
* Use **Certbot (Let's Encrypt)** to automatically generate and apply free SSL certificates to your domain.

---

## 🔒 Critical Security Reminders for Go-Live

Before going live with real patient data, you **MUST**:
1. Change **all** secret keys (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`) to long, random hexadecimal strings.
2. Ensure `NODE_ENV` is set strictly to `production`. This disables TypeORM's `synchronize` feature (preventing accidental database wipes) and tells the cookies to strictly mandate `HTTPS`.
3. Read the `STARTUP_PROD.md` file located in the project root for specific instructions on running TypeORM database schema migrations in production.
