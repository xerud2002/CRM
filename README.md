# Holdem Removals CRM

Custom CRM system to replace HubSpot.

## Quick Start

### 1. Database Setup (Choose One)

**Option A: Supabase (Recommended - Free)**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database and copy the connection details
4. Update `backend/.env` with your credentials:
```env
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=postgres
```

**Option B: Neon (Free Serverless PostgreSQL)**
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string and extract the values for `.env`

**Option C: Local PostgreSQL**
1. Download and install [PostgreSQL](https://www.postgresql.org/download/)
2. Create a database called `crm_database`
3. Update `backend/.env` with your local credentials

### 2. Run the Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs at: http://localhost:3001

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password

### Leads
- `GET /api/leads` - List all leads (with filters)
- `GET /api/leads/inbox` - Get pending leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/:id/accept` - Accept pending lead
- `POST /api/leads/:id/reject` - Reject pending lead

### Dashboard
- `GET /api/dashboard/overview` - All metrics
- `GET /api/dashboard/contact-metrics` - Contact/response rates
- `GET /api/dashboard/conversion-funnel` - Conversion funnel
- `GET /api/dashboard/by-location?postcodes=NN1,MK` - Filter by postcode

## Tech Stack
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Deployment**: Vercel (staging), Self-hosted (production)
