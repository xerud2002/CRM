# Holdem CRM - AI Coding Instructions

## Architecture Overview
Monorepo CRM for Holdem Removals replacing HubSpot. Backend and frontend communicate via REST API:
- **Backend** (`/backend`): NestJS + TypeORM + PostgreSQL (Supabase) on `:3001`
- **Frontend** (`/frontend`): React + Vite + TailwindCSS + React Query on `:5173`
- All API routes prefixed with `/api` (set in [main.ts](backend/src/main.ts#L26))

## Backend Module Pattern
Each feature follows NestJS modular structure with barrel exports:
```
module/
├── index.ts              # Re-exports public APIs
├── module.module.ts      # Module definition
├── module.controller.ts  # @UseGuards(JwtAuthGuard) on protected routes
├── module.service.ts     # Business logic
└── dto/                  # class-validator DTOs
```
Reference: [leads/](backend/src/leads/), [auth/](backend/src/auth/)

## Entity Conventions
- All in [backend/src/entities/](backend/src/entities/) with barrel export via `index.ts`
- Explicit column names: `@Column({ name: 'assigned_to' })`
- Enums in entity files (e.g., `LeadStatus`, `ContactStatus`)
- UUIDs: `@PrimaryGeneratedColumn('uuid')`

## Business Rules

### Lead Status Flow
```
pending → new → contacted → qualified → proposal → won
    ↓                                           ↘ lost
 rejected
```
- `pending`: New leads from email parsers, shown in Inbox queue
- Staff accepts (`POST /leads/:id/accept`) → becomes `new`
- Staff rejects (`POST /leads/:id/reject`) → `rejected`, hidden from list

### Contact Status Flow (separate from lead status)
```
not_contacted → contacted (first outbound email/call)
             → responded (any inbound from customer)
             → no_response (7 days without reply)
```

### Lost Lead Rules
- Explicit "Mark as Lost" action
- 30 days in `no_response` status
- Bounce/invalid email detected

## Lead Sources & Email Parsers
Inbound leads arrive at `office@holdemremovals.co.uk`. Parser detection:
| Sender | Source | Format |
|--------|--------|--------|
| `accounts@comparemymove.com` | `comparemymove` | HTML |
| `manuallead@reallymoving.com` | `reallymoving` | Plain text |
| `info@getamover.co.uk` | `getamover` | HTML |
| Own domain + "Instant Quote" | `website` | HTML/PDF |

Parsers in `backend/src/emails/parsers/` extract: name, email, phone, addresses, postcodes, move_date, bedrooms.

## Assessments (Dual Calendar)
Two types managed separately:
- **Video** (`whatsapp|zoom|phone`): Auto-populated from bookings + manual
- **In-person** (`on_site|office_visit`): Manual only

Status: `scheduled → completed|cancelled|no_show`

## Authentication
- JWT via Passport (`@nestjs/passport`, `@nestjs/jwt`)
- Guard: `@UseGuards(JwtAuthGuard)` from [jwt-auth.guard.ts](backend/src/auth/guards/jwt-auth.guard.ts)
- Roles: `@Roles(UserRole.ADMIN)` with `RolesGuard`
- User roles: `admin` | `staff`

## Frontend Patterns
- Auth via Context: [AuthContext.tsx](frontend/src/context/AuthContext.tsx)
- API client with interceptors: [api.ts](frontend/src/services/api.ts)
- Token in `localStorage` (keys: `token`, `user`)
- Protected routes via `<ProtectedRoute>` wrapper

## API Response Format
Paginated endpoints return:
```typescript
{ data: T[], meta: { total, page, limit, totalPages } }
```

## Development Commands
```bash
# Backend
cd backend && npm run start:dev    # Hot reload
cd backend && npm run start:debug  # Debug mode

# Frontend
cd frontend && npm run dev

# Database
docker-compose up -d               # PostgreSQL :5432
```

## Key Conventions
1. **DTOs**: Always use class-validator (`@IsOptional()`, `@IsEmail()`)
2. **QueryBuilder**: Complex filters use TypeORM QueryBuilder (see [leads.service.ts](backend/src/leads/leads.service.ts#L18))
3. **Activity Logging**: Auto-log on status changes, emails, calls via `ActivityType` enum
4. **Postcodes**: UK format, filterable by prefix (NN1, MK, PE1)
