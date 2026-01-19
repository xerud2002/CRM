# Holdem CRM - AI Coding Instructions

## Architecture Overview
Monorepo CRM for Holdem Removals (HubSpot replacement). REST API between layers:
- **Backend** (`/backend`): NestJS + TypeORM + PostgreSQL (Supabase) → `:3001`
- **Frontend** (`/frontend`): React + Vite + TailwindCSS → `:5173`
- All routes prefixed with `/api` (see `main.ts` global prefix)

## Backend Module Pattern
Every feature follows this structure with barrel exports via `index.ts`:
```
module/
├── index.ts              # Re-export: module, service, DTOs
├── *.module.ts           # @Module({ imports, controllers, providers, exports })
├── *.controller.ts       # @UseGuards(JwtAuthGuard) on all protected routes
├── *.service.ts          # Business logic, inject repositories
└── dto/                  # class-validator decorators required
```
**Reference**: `leads/`, `auth/`, `activities/`

## Entity Conventions
All entities in `backend/src/entities/` with barrel export. Key patterns:
- Explicit DB column names: `@Column({ name: 'assigned_to' })`
- Enums defined in same file: `LeadStatus`, `ContactStatus`, `ActivityType`, `LeadSource`
- Always UUID PKs: `@PrimaryGeneratedColumn('uuid')`
- Relations use `@JoinColumn({ name: 'snake_case' })` with explicit FK column

## Business Rules

### Lead Status Flow (`LeadStatus` enum)
```
pending → new → contacted → qualified → proposal → won/lost
    ↓
 rejected
```
- `pending`: New from email parsers, shown in Inbox (`GET /leads/inbox`)
- Accept: `POST /leads/:id/accept` → `new`
- Reject: `POST /leads/:id/reject` → `rejected` (excluded from main list)
- Main list filters exclude `pending` by default

### Contact Status (separate tracking)
```
not_contacted → contacted → responded / no_response
```

## Email Parsers
Parser factory at `backend/src/emails/parsers/parser.factory.ts`. To add new source:
1. Create `newsource.parser.ts` extending `BaseEmailParser`
2. Implement `canParse(from, subject)` and `parse(subject, body, htmlBody)`
3. Add to `parsers` array in factory constructor
4. Add enum value to `LeadSource`

Existing parsers: `comparemymove`, `reallymoving`, `getamover`, `website`

## Activity Logging
Auto-logged via `ActivitiesService` methods:
- `logStatusChange(leadId, oldStatus, newStatus, userId)`
- `logEmailActivity(leadId, subject, direction, userId)`
- `logCallActivity(leadId, dto, userId)`
- Manual: `addNote(leadId, dto, userId)`

Types: `email | call | note | status_change | milestone | assessment | assignment | sms`

## Authentication
- Guard: `@UseGuards(JwtAuthGuard)` from `auth/guards/jwt-auth.guard.ts`
- Roles: `@Roles(UserRole.ADMIN)` with `RolesGuard`
- Get current user: `@Request() req` → `req.user.id`

## Frontend Patterns
- Auth: `useAuth()` hook from `context/AuthContext.tsx`
- API: Import `api` from `services/api.ts` (axios with interceptors)
- Pages: `pages/*.tsx` (Dashboard, Leads, LeadDetail, LeadInbox, Email, Assessments, Calls, Reports)
- 401 response auto-redirects to `/login`

## API Response Format
Paginated endpoints return:
```typescript
{ data: T[], meta: { total, page, limit, totalPages } }
```

## Development Commands
```bash
cd backend && npm run start:dev    # Backend hot reload
cd frontend && npm run dev         # Frontend dev server
docker-compose up -d               # PostgreSQL on :5432
```

## Key Conventions
1. **DTOs**: Always use `@IsOptional()`, `@IsEmail()`, `@IsEnum()` from class-validator
2. **Filters**: Complex queries use TypeORM QueryBuilder (see `leads.service.ts findAll`)
3. **Postcodes**: UK format, ILIKE filter by prefix (NN1, MK, PE1)
4. **New modules**: Register in `app.module.ts` imports array + add entity to entities array
