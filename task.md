# CRM System Development - HubSpot Replacement

## Phase 1 — Planning & Architecture
- [/] Confirm stack: NestJS + PostgreSQL + React
- [ ] Choose hosting (Hetzner / DigitalOcean)
- [ ] Create Git repository
- [ ] Setup dev & staging environments

## Phase 2 — Database & Core Models
- [ ] Create PostgreSQL database
- [ ] Implement tables (users, leads, activities, emails, calls, email_templates, tasks)
- [ ] Add indexes (email, phone, status)
- [ ] Create migration scripts
- [ ] Define business rules (lead lifecycle, contact status, automation triggers, lost lead rules)

## Phase 3 — Authentication & Users
- [ ] Implement JWT login
- [ ] Roles: admin / staff
- [ ] User assignment to leads

## Phase 4 — Leads Management
- [ ] Create lead CRUD API
- [ ] Lead list with filters
- [ ] Lead detail view
- [ ] Status & milestone updates
- [ ] Duplicate detection (email / phone)

## Phase 5 — Activity Timeline
- [ ] Auto-log: Emails, Calls, Status changes
- [ ] Manual notes
- [ ] Chronological timeline UI

## Phase 6 — Email Client (Replaces Thunderbird)
- [ ] Email client UI (multi-account inbox like Thunderbird)
- [ ] Configure email accounts:
  - [ ] alex.barcea@holdemremovals.co.uk
  - [ ] holdemremovals@gmail.com
  - [ ] cr@holdemremovals.co.uk
  - [ ] quote@holdemremovals.co.uk
  - [ ] ella.v@holdemremovals.co.uk
  - [ ] office@holdemremovals.co.uk
- [ ] IMAP sync (fetch emails)
- [ ] SMTP send (compose, reply, forward)
- [ ] Unified inbox view
- [ ] Email templates
- [ ] Auto-link emails to leads
- [ ] Lead source parsers:
  - [ ] CompareMyMove (accounts@comparemymove.com)
  - [ ] ReallyMoving (manuallead@reallymoving.com)
  - [ ] GetAMover (info@getamover.co.uk)
  - [ ] Internal website quotes
  - [ ] Video survey bookings (self-service scheduler)
- [ ] Parse inbound emails & update contact_status
- [ ] Assessments module (dual calendar):
  - [ ] Video calls calendar (auto-populated + manual)
  - [ ] In-person assessments calendar (manual only)
  - [ ] Assessment completion & notes
  - [ ] Confirmation & reminder emails

## Phase 7 — Telephony (Tamar Integration)
- [ ] Get Tamar API / SIP credentials
- [ ] Click-to-call from CRM
- [ ] Webhook endpoint for call events
- [ ] Call logging & missed call handling

## Phase 8 — Data Migration (HubSpot → CRM)
- [ ] Field mapping (HubSpot → CRM)
- [ ] Test import (500 contacts)
- [ ] Full migration (50k contacts)
- [ ] Validation & spot-checks

## Phase 9 — Dashboard & Reporting
- [ ] Contact metrics (contacted, responded by email/call)
- [ ] Conversion funnel (lead → survey → quote → accepted)
- [ ] Location filtering (postcode: NN1, NN3, MK, PE1, etc.)
- [ ] Export reports to CSV

## Phase 10 — Data Migration (HubSpot → CRM)
- [ ] Field mapping (HubSpot → CRM)
- [ ] Test import (500 contacts)
- [ ] Full migration (50k contacts)
- [ ] Validation & spot-checks

## Phase 11 — Deployment
- [ ] Localhost testing
- [ ] Vercel staging deployment
- [ ] Production deployment

## Phase 12 — Post-Exit Hardening
- [ ] Daily DB backups
- [ ] Error monitoring
- [ ] Performance tuning

