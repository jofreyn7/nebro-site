# Nebro — Website & Admin Panel

A multi-page marketing site plus an admin dashboard UI, on a compiled
Tailwind CSS production build. No server or build step needed to run it.

## Files
| File | Purpose |
|---|---|
| `index.html` | Home — hero slideshow, specializations, trust/stats |
| `about.html` | About Us |
| `products.html` | Product catalog with category filtering |
| `industries.html` | Industries served |
| `case-studies.html` | Case studies |
| `resources.html` | Guides, spec sheets, FAQ |
| `contact.html` | Quote request form |
| `admin.html` | Admin dashboard — products, case studies, inquiries, reports, settings |
| `style.css` | Shared design system |
| `tailwind.css` | Compiled, purged Tailwind (production build) |
| `script.js` | Shared front-end behavior (nav, animations, slideshow, filters, AI widget) |
| `admin.js` | Admin dashboard behavior (in-memory data) |
| `vendor/` | Locally hosted Chart.js, jsPDF, SheetJS — no CDN dependency |
| `logo.png` | Company logo / favicon |

## Running it
Open `index.html` in a browser. Keep the whole folder together.

## What's real vs. placeholder
**Real / working:** all layouts and responsive nav, light/dark theme toggle
(top-right, persists via localStorage), animated hero with overlapping photo
composition, word-by-word headline animation, stats that count up every time
they scroll into view, hover switchers, product filter + hover "Request a
Quote" overlay, Quote/Appointment tab toggle on Contact, admin view
switching, publish/unpublish/delete, add-product with photo upload (now
saved to Supabase Storage), roles table, reports charts (Chart.js, vendored
locally), working PDF and Excel export, WhatsApp button (real wa.me link),
AI assistant widget (canned front-end responses only).

**Placeholder — needs real content:**
- About page team section (Amani Joseph / Fatuma Rashidi / Baraka Mwakalinga) —
  invented placeholder names, swap for your real team's names/titles/photos
- Resources page articles — placeholder blog posts, swap for real content
- Contact page map — static placeholder, add a real Google Maps embed link
- Notification preferences UI — needs the backend wiring below to actually send alerts

**Placeholder — needs backend to go live:**
- Contact form (wire to Web3Forms/Formspree, or your own API)
- Admin data (products/inquiries/users) — resets on refresh
- Roles & permissions — UI only, no real authentication yet
- Notification preferences — UI only, no email/SMS actually sends
- Visitor analytics / location — not built here; use a real analytics tool (see below)

## Admin: responding to queries & editing site content
Two new capabilities, both backed by the Supabase functions/tables in
`supabase/`:
- **Reply to Inquiry** — in Admin → Inquiries, each row has a Reply button
  that opens a modal, composes a message, and sends it to the customer's
  email via the `send-reply` Edge Function (Resend). Marks the inquiry
  Responded automatically.
- **Site Content** — a new "Site Content" section in the admin sidebar lets
  any signed-in staff member edit the Homepage Hero (eyebrow, headline,
  subtext) and the Footer (blurb, address, phone). Changes save to the
  `site_content` table and the public pages fetch + apply them automatically
  on load — no redeploy needed. Both are wired up and tested against the
  fallback path (static content shows correctly when no backend is
  connected yet); the live read/write path needs the Supabase project
  from the setup steps below to actually persist edits.
- **Extending this further**: Hero and Footer are the first two editable
  blocks, chosen because they appear on every page. The same
  `site_content` key/value pattern extends cleanly to About/Industries/
  Products/Case-Studies copy — each new editable block is: an id on the
  HTML element(s), a form in the admin Site Content view, and a row in
  `site_content`. This is real, working infrastructure, not a mockup —
  but making literally every paragraph on every page editable is a larger
  effort than this pass covers; treat it as a backlog of "add one more
  content key" tasks rather than a single big lift.

## Deployment (so your client can see progress today)
This is a static site — the fastest way to get a shareable link:

1. Go to https://app.netlify.com/drop
2. Drag the whole `nebro-site` folder onto the page
3. Netlify gives you a live URL in seconds (e.g. `random-name.netlify.app`)
4. Share that link with your client — every time you want to update it,
   drag the folder again (or connect it to a GitHub repo for auto-deploy)

Alternatives: Vercel (similar drag-and-drop via their dashboard), GitHub
Pages (free, needs a GitHub repo), or your own hosting via cPanel/FTP.
Once the client approves, point their real domain at whichever host you pick.

## Phase 2 — the real backend
These need actual server infrastructure, not just files:
- **Auth + roles (Developer/Super Admin/Staff):** Supabase Auth + Row
  Level Security is the fastest realistic path — free tier is enough for this.
- **Email alerts for new/unanswered inquiries:** a scheduled function
  (Supabase Edge Function or a small Node cron job) + Resend or SendGrid
  for sending. The "remind me after N days" logic lives in that job.
- **WhatsApp Business API** (for automated replies, not just the wa.me
  button already in place): requires Meta Business verification — slower
  to set up than everything else here, budget extra time for it.
- **Visitor analytics with location:** don't build this custom — use
  Plausible or Google Analytics 4, both handle it properly (and more
  responsibly, with privacy compliance built in) in an afternoon.
- **Real AI assistant:** swap the canned-response widget for a real
  Claude/OpenAI API call from a small backend function (never call the
  AI API directly from the browser — that exposes your API key).

None of this needs to happen at once — it's a natural "v2" once the
client signs off on the design in front of them.
