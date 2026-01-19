# CRM System Development - HubSpot Replacement

## Phase 1 — Planning & Architecture
- [x] Confirm stack: NestJS + PostgreSQL + React
- [ ] Choose hosting (Hetzner / DigitalOcean)
- [x] Create Git repository
- [/] Setup dev & staging environments (localhost works)

## Phase 2 — Database & Core Models
- [x] Create PostgreSQL database (Supabase)
- [x] Implement tables (users, leads, activities, emails, calls, email_templates, tasks)
- [x] Add indexes (email, phone, status)
- [x] Create migration scripts (TypeORM synchronize)
- [x] Define business rules (lead lifecycle, contact status, automation triggers, lost lead rules)

## Phase 3 — Authentication & Users
- [x] Implement JWT login
- [x] Roles: admin / staff
- [x] User assignment to leads

## Phase 4 — Leads Management
- [x] Create lead CRUD API
- [x] Lead list with filters
- [x] Lead detail view
- [x] Status & milestone updates
- [x] Duplicate detection (email / phone)

## Phase 5 — Activity Timeline
- [x] Auto-log: Emails, Calls, Status changes
- [x] Manual notes
- [x] Chronological timeline UI

## Phase 6 — Email Client (Replaces Thunderbird)
- [x] Email client UI (multi-account inbox like Thunderbird)
- [/] Configure email accounts: (code ready, needs production credentials)
  - [ ] alex.barcea@holdemremovals.co.uk
  - [ ] holdemremovals@gmail.com
  - [ ] cr@holdemremovals.co.uk
  - [ ] quote@holdemremovals.co.uk
  - [ ] ella.v@holdemremovals.co.uk
  - [ ] office@holdemremovals.co.uk
- [x] IMAP sync (fetch emails)
- [x] SMTP send (compose, reply, forward)
- [x] Unified inbox view
- [x] Email templates
- [x] Auto-link emails to leads
- [x] Lead source parsers:
  - [x] CompareMyMove (accounts@comparemymove.com)
  - [x] ReallyMoving (manuallead@reallymoving.com)
  - [x] GetAMover (info@getamover.co.uk)
  - [x] Internal website quotes
  - [ ] Video survey bookings (self-service scheduler)
- [x] Parse inbound emails & update contact_status
- [x] Assessments module (dual calendar):
  - [x] Video calls calendar (auto-populated + manual)
  - [x] In-person assessments calendar (manual only)
  - [x] Assessment completion & notes
  - [x] Confirmation & reminder emails

## Phase 7 — Telephony (Tamar Integration)
- [ ] Get Tamar API / SIP credentials ⚠️ BLOCKED - contact Tamar at 0800 772 0000
- [ ] Click-to-call from CRM
- [ ] Webhook endpoint for call events
- [x] Call logging & missed call handling (manual logging implemented)

## Phase 8 — Data Migration (HubSpot → CRM)
- [ ] Field mapping (HubSpot → CRM)
- [ ] Test import (500 contacts)
- [ ] Full migration (50k contacts)
- [ ] Validation & spot-checks

## Phase 9 — Dashboard & Reporting
- [x] Contact metrics (contacted, responded by email/call)
- [x] Conversion funnel (lead → survey → quote → accepted)
- [x] Location filtering (postcode: NN1, NN3, MK, PE1, etc.)
- [x] Export reports to CSV

## Phase 10 — ~~Data Migration (HubSpot → CRM)~~ (duplicate of Phase 8)

## Phase 11 — Deployment
- [x] Localhost testing
- [ ] Vercel staging deployment
- [ ] Production deployment

## Phase 12 — Post-Exit Hardening
- [ ] Daily DB backups
- [ ] Error monitoring
- [ ] Performance tuning

