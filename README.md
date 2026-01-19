# Holdem CRM

A custom CRM system for Holdem Removals built with NestJS, React, and Supabase.

## Tech Stack
- **Backend**: NestJS, TypeORM, PostgreSQL (Supabase)
- **Frontend**: React, Vite, TailwindCSS
- **Database**: PostgreSQL

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Supabase)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Configure Environment Variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Supabase credentials and other secrets.

### Running Locally

1. Start the Backend:
   ```bash
   cd backend
   npm run start:dev
   ```
   Server runs on `http://localhost:3001`

2. Start the Frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   App runs on `http://localhost:5173`

### Default Login
- **Admin**: `alex.burcea@holdemremovals.co.uk`
- **Password**: `123456`

## Features implemented
- Auth (JWT, Roles)
- Dashboard (Metrics, Funnel)
- Leads Management (List, Detail, Filtering)
- Email Client UI (Outlook-style)
