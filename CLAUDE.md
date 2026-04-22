# Tattoo Booking App — Project Context

## What this app is

A single-artist tattoo booking web app. Clients arrive from Instagram having
already agreed on a design and price with the artist. They visit the site to
browse available appointment slots and submit a formal booking confirmation
including payment proof. The artist reviews submissions, approves or rejects
them, and confirmed bookings sync automatically to Google Calendar.

## Tech stack

- **Framework**: Next.js 14, App Router, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth — email/password, artist only. Clients do not log in.
- **Storage**: Supabase Storage — two buckets: `payment-proofs` (private), `portfolio` (public)
- **Email**: Resend
- **Calendar**: Google Calendar API via googleapis
- **Form handling**: react-hook-form + zod

## Repository structure

```
app/
  (public)/                         ← no auth required
    page.tsx                        ← landing page
    booking/page.tsx                ← public booking form with slot picker
    gallery/page.tsx                ← portfolio gallery
    status/[token]/page.tsx         ← client booking status (token-based, no login)
  (admin)/                          ← all routes protected by middleware
    admin/
      page.tsx                      ← bookings dashboard
      bookings/[id]/page.tsx        ← booking detail + approve/reject
      slots/page.tsx                ← available slot management
      gallery/page.tsx              ← portfolio management
      settings/page.tsx             ← studio settings + Google Calendar connect
      login/page.tsx                ← artist login
components/
lib/
  supabase/
    client.ts       ← browser Supabase client
    server.ts       ← server component Supabase client (uses cookies)
  actions/
    booking.ts      ← booking submission, approve, reject, cancel
    slots.ts        ← create, delete, sync slots
    portfolio.ts    ← upload, delete, reorder portfolio images
    settings.ts     ← save settings
  email/
    index.ts        ← all email sending functions
  google/
    auth.ts         ← OAuth client, token exchange, getAuthorizedClient
    calendar.ts     ← createCalendarEvent, deleteCalendarEvent, getFreeBusy
types/
  database.ts       ← TypeScript types for all tables
supabase/
  migrations/
    001_initial_schema.sql
```

## Database tables

### available_slots
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| created_at | timestamptz | |
| date | date | the appointment date |
| start_time | time | e.g. 10:00 |
| end_time | time | e.g. 12:00 |
| status | enum | available, pending, booked |
| source | enum | manual, google_calendar |
| google_event_id | text | nullable — set for google_calendar sourced slots |

### bookings
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| created_at | timestamptz | |
| slot_id | uuid | foreign key → available_slots.id |
| client_name | text | |
| client_email | text | |
| client_phone | text | |
| client_instagram | text | |
| tattoo_description | text | |
| body_placement | text | |
| size | enum | small, medium, large, full_piece |
| agreed_price | numeric | in BRL (R$) |
| payment_proof_url | text | Supabase Storage path |
| notes | text | nullable |
| status | enum | pending, approved, rejected, cancelled |
| rejection_reason | text | nullable |
| status_token | uuid | for client status page — no login needed |
| google_event_id | text | nullable — set after calendar event created |

### portfolio_images
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| created_at | timestamptz | |
| url | text | |
| caption | text | nullable |
| category | text | |
| sort_order | integer | |

### settings (single row)
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| studio_name | text | |
| studio_address | text | |
| notification_email | text | |
| default_duration_min | integer | used when creating manual slots |
| google_refresh_token | text | nullable, AES-256 encrypted |
| instagram_url | text | used in emails and status page |

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
ENCRYPTION_KEY=          ← AES-256 key for encrypting Google refresh token
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
```

---

## Google Calendar — source of truth

The app is the single source of truth for all appointment data.
Google Calendar is a write-only mirror of confirmed appointments.
This must be maintained consistently throughout the codebase.

**App → Google Calendar (automatic, always):**
- Booking approved → Google Calendar event created
- Booking cancelled → Google Calendar event deleted
- Booking rejected → no calendar action (slot was never confirmed)

**Google Calendar → App (setup convenience only):**
- Artist can trigger a manual sync from the settings page
- The app reads free/busy blocks to generate `available_slots` rows
- This is for initial slot population only — not ongoing sync

**The artist must never manage appointments directly in Google Calendar.**
All cancellations, reschedules, and approvals happen through the admin
dashboard. Display this warning prominently in the admin UI:

> "Manage all appointments through this dashboard. Changes made
> directly in Google Calendar will not be reflected here."

---

## Slot management

Slots have two sources:
1. **Manual** — artist creates slots directly in the admin slots page
   (date + start time + end time)
2. **Google Calendar sync** — artist triggers a sync from the settings
   page; the app reads their Google Calendar free/busy data and creates
   `available_slots` rows for open blocks

Slot lifecycle:
- `available` — visible to clients on the booking form
- `pending` — a client has submitted a booking; hidden from other
  clients, not yet confirmed by artist
- `booked` — artist approved; Google Calendar event created
- On rejection or cancellation → slot returns to `available`,
  Google Calendar event deleted if one existed

---

## Booking flow

1. Client visits `/booking`, sees available slots grouped by date
2. Client selects a slot — slot is NOT locked at this point
3. Client fills in booking details and submits
4. On submission:
   - Booking row created with `status: pending`
   - Slot status updated to `pending`
   - Confirmation email → client (includes `/status/[token]` link)
   - Notification email → artist (includes admin detail link)
5. Artist reviews in dashboard → approves or rejects
6. On approval:
   - Booking `status` → `approved`
   - Slot `status` → `booked`
   - Google Calendar event created, `google_event_id` stored
   - Approval email → client
7. On rejection:
   - Booking `status` → `rejected`
   - Slot `status` → `available`
   - Rejection email → client with optional reason
8. On cancellation (artist cancels an approved booking):
   - Booking `status` → `cancelled`
   - Slot `status` → `available`
   - Google Calendar event deleted via `google_event_id`
   - Cancellation email → client

---

## Database workflow — Supabase CLI

The Supabase CLI is connected and linked to the project. All database
changes follow this exact workflow — no exceptions:

1. Claude Code writes the migration SQL in `supabase/migrations/`
2. Claude Code presents the migration for review and waits for approval
3. On approval ("looks good", "apply it", "go ahead", or similar),
   Claude Code runs `supabase db push` immediately
4. Claude Code confirms the push succeeded before moving on
5. If `supabase db push` fails, Claude Code reports the error in full
   and does not proceed until it is resolved

**Never apply a migration without explicit developer approval.**
**Always use `supabase db push` — never run raw SQL manually.**

---

## Key conventions

### Server Actions
- All data mutations go through Next.js Server Actions in `lib/actions/`
- Validate all inputs with zod before any database call
- Use the Supabase service role client inside server actions
- Return `{ success: true, data }` or `{ success: false, error: string }`

### Data fetching
- Fetch data server-side in page components where possible
- Use the cookie-based server client for authenticated admin pages
- Use the service role client only inside Server Actions and API routes

### Auth
- Only the artist has an account — no client registration UI
- All `/admin/*` routes protected by `middleware.ts`
- Unauthenticated requests redirect to `/admin/login`
- Artist account is created manually via the Supabase dashboard

### Email
- All email functions in `lib/email/index.ts`
- Fetch studio name/address from settings inside each function
- Email failures must never cause DB operations to fail —
  always wrap in try/catch and log errors only

### Google Calendar
- Refresh token stored AES-256 encrypted in the settings table
- `getAuthorizedClient()` in `lib/google/auth.ts` handles
  decryption and returns a ready OAuth2 client
- Always use `getAuthorizedClient()` — never instantiate OAuth2 manually
- Handle 404 gracefully in `deleteCalendarEvent` (event may be gone)
- `getFreeBusy()` used during slot sync only

### Storage
- `payment-proofs`: private — authenticated read only
- `portfolio`: public read
- Always store the Supabase Storage path in the DB, not a full URL
- Generate signed URLs at read time for `payment-proofs`

### UI & formatting
- shadcn/ui components only — do not introduce other UI libraries
- Mobile-first responsive layout on all pages
- Price: always `R$ 0.00`
- Date: always `Monday 14 July 2025`
- Time: always `2:00 PM`
- Status badges: pending=yellow, approved=green, rejected=red,
  cancelled=grey, available=blue

---

## Design system

### Vibe
Bold and editorial. High contrast. Strong typographic hierarchy.
The app should feel like a premium tattoo studio — confident, clean,
and intentional. Not soft, not playful. Think fashion editorial meets
functional tool.

### Colour palette
Defined as CSS variables in `globals.css`. Use these variables
throughout — never hardcode hex values in components.

```css
:root {
  /* Backgrounds */
  --color-bg:           #F5F0EB;   /* warm off-white — primary background */
  --color-bg-surface:   #EDEAE5;   /* cards, inputs */
  --color-bg-inset:     #E2DDD7;   /* hover / inset state */

  /* Foregrounds */
  --color-fg:           #1A1714;   /* near-black — primary text */
  --color-fg-muted:     #6B6560;   /* labels, secondary text */
  --color-fg-subtle:    #A39E99;   /* placeholders, hints */

  /* Accent — warm red */
  --color-accent:       #C0392B;
  --color-accent-hover: #A93226;
  --color-accent-soft:  #F5D5D2;

  /* Borders */
  --color-border:       #D6D0CA;
  --color-border-strong:#B5AFA9;

  /* Status */
  --color-pending:      #D4820A;
  --color-pending-bg:   #FEF3C7;
  --color-approved:     #1A7A4A;
  --color-approved-bg:  #D1FAE5;
  --color-rejected:     #B91C1C;
  --color-rejected-bg:  #FEE2E2;
  --color-cancelled:    #6B7280;
  --color-cancelled-bg: #F3F4F6;
  --color-available:    #1D4ED8;
  --color-available-bg: #DBEAFE;
}
```

No gradients. No box shadows. Use borders only to lift surfaces.

### Typography

Both fonts free on Google Fonts. Load via `next/font/google`.

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | Archivo | 700, 900 | Headings, hero, section titles |
| UI | DM Sans | 400, 500 | Body, labels, buttons, forms, nav |

```css
/* In layout.tsx */
--font-display: var(--font-archivo);
--font-ui:      var(--font-dm-sans);
```

Type scale:
```css
--text-xs:   0.75rem;    /* 12px */
--text-sm:   0.875rem;   /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg:   1.125rem;   /* 18px */
--text-xl:   1.25rem;    /* 20px */
--text-2xl:  1.5rem;     /* 24px */
--text-3xl:  1.875rem;   /* 30px */
--text-4xl:  2.25rem;    /* 36px */
--text-5xl:  3rem;       /* 48px */
```

Rules:
- Headings: Archivo 700 or 900, line-height 1.2, letter-spacing -0.02em
- Body: DM Sans 400, line-height 1.6
- Emphasis: DM Sans 500 only
- Never use weights outside 400, 500, 700, 900

### Spacing & layout

- Max content width: 1200px, centred
- Base unit: 8px
- Page padding: 24px mobile, 48px desktop
- Section rhythm: 80px desktop, 48px mobile
- Card padding: 24px
- Border radius: 4px (inputs, buttons), 8px (cards), 0px (hero elements)

### Components

**Buttons:**
- Primary: accent background, white text — main CTAs only
- Secondary: transparent, border, `--color-fg` text
- Ghost: transparent, `--color-fg-muted` text
- All: border-radius 4px, DM Sans 500 14px, padding 10px 20px
- No pill / rounded-full buttons

**Inputs:**
- Background: `--color-bg-surface`
- Border: `1px solid --color-border`
- Focus: border → `--color-fg`, no coloured ring
- Label: DM Sans 500 14px `--color-fg-muted`, above input
- Error: `--color-rejected` text below, no background change
- Placeholder: `--color-fg-subtle`

**Cards:**
- Background: `--color-bg-surface`
- Border: `1px solid --color-border`
- Border radius: 8px
- No shadows

**Admin nav:**
- Background: `--color-fg` (near-black)
- Text: white / 50% white muted
- Active: `--color-accent`
- Height: 56px

**Public nav:**
- Background: `--color-bg`
- Border bottom: `1px solid --color-border`

### Tone by section

**Public pages** (landing, booking, gallery, status): premium, calm,
generous whitespace, large Archivo headings, warm off-white base.
The booking form must feel trustworthy — not clinical.

**Admin pages**: functional, information-dense, dark nav to clearly
separate from public. Tables and status indicators over decoration.

---

## Client status page

- URL: `/status/[status_token]` — public, no login
- Token from `bookings.status_token` acts as the access key
- Shows: status badge, slot date/time, tattoo description,
  body placement, size, agreed price
- Never shows: payment proof, phone number, email
- Footer: link to artist Instagram

---

## Git workflow

This project uses GitFlow. There are two persistent branches and
short-lived feature and hotfix branches.

### Branch structure

```
main        ← production (auto-deploys to Vercel production)
develop     ← integration / staging (auto-deploys to Vercel preview)
feature/*   ← one branch per prompt session
hotfix/*    ← emergency production fixes only
```

### Rules Claude Code must follow

- Always work on a `feature/` branch — never commit directly to
  `develop` or `main`
- Branch naming: `feature/prompt-01-scaffold`,
  `feature/prompt-02-database`, `feature/prompt-03-booking-form`, etc.
- At the start of each session: confirm the correct feature branch is
  checked out, or create it from `develop`
- At the end of each session: push the feature branch to origin and
  remind the developer to open a PR into `develop`
- Never force push — never rebase a branch that has been pushed
- Never merge branches — that is the developer's responsibility

### Commit convention — Conventional Commits

Every commit must follow this format:

```
<type>(<scope>): <short description>

Types:  feat | fix | chore | refactor | test | docs
Scope:  booking | slots | calendar | email | auth | gallery |
        settings | db | ui | deps
```

Examples:
```
feat(booking): add two-step slot picker to public form
fix(calendar): handle 404 gracefully on deleted event
chore(db): add available_slots migration 001
refactor(email): extract slot date formatting to helper
```

### When to commit

- After each logical unit of work — not after every file save
- Never commit broken code — always verify `npm run build`
  passes before committing
- One commit per meaningful change — do not batch unrelated
  changes into a single commit
- Commit messages in present tense: "add" not "added"

### Commit workflow per session

1. Check out or create the feature branch for this prompt
2. Do the work in logical units, committing as you go
3. Run `npm run build` — fix any errors before the final commit
4. Push the branch to origin
5. Summarise what was built and what the developer should review
   before merging into `develop`

---

## Deployment

### Platform: Vercel

The app is deployed on Vercel with automatic deployments on push.

### Environment mapping

| Branch | Vercel environment | Supabase project |
|---|---|---|
| `main` | Production | Production Supabase project |
| `develop` | Preview (staging) | Staging Supabase project |
| `feature/*` | Preview (per branch) | Staging Supabase project |

Two Supabase projects are required:
- **Production** — used only by `main`
- **Staging** — used by `develop` and all `feature/*` branches

### Environment variables

Set in Vercel dashboard under Project → Settings → Environment Variables:

Production variables (scope: Production only):
```
NEXT_PUBLIC_SUPABASE_URL         ← production Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    ← production anon key
SUPABASE_SERVICE_ROLE_KEY        ← production service role key
NEXT_PUBLIC_SITE_URL             ← https://yourdomain.com
RESEND_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI              ← https://yourdomain.com/api/google/callback
ENCRYPTION_KEY
NEXT_PUBLIC_INSTAGRAM_URL
```

Preview variables (scope: Preview only):
```
NEXT_PUBLIC_SUPABASE_URL         ← staging Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    ← staging anon key
SUPABASE_SERVICE_ROLE_KEY        ← staging service role key
NEXT_PUBLIC_SITE_URL             ← https://staging.yourdomain.com
RESEND_API_KEY                   ← can share with production
GOOGLE_CLIENT_ID                 ← can share with production
GOOGLE_CLIENT_SECRET             ← can share with production
GOOGLE_REDIRECT_URI              ← staging callback URL
ENCRYPTION_KEY                   ← use a different key from production
NEXT_PUBLIC_INSTAGRAM_URL
```

### Vercel configuration

A `vercel.json` file is not required for this project — Vercel detects
Next.js automatically. The only required config is ensuring the
`supabase/` directory is not inadvertently served as a public route,
which Next.js App Router handles by default.

---

## What this app is NOT

- Not a multi-artist platform
- Not a payment processor — bank transfer happens before submission;
  form only collects a screenshot as proof
- Not a walk-in tool — clients are pre-qualified via Instagram DMs
- Not a bidirectional calendar sync — the app is the source of truth,
  Google Calendar is the output only
