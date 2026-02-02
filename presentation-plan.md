# Inventri — 10-Minute Final Presentation Plan

> **Course:** Final Project in Project Management
> **Team size:** 3 CS students
> **Format:** Canva slides
> **Demo:** Pre-recorded video (embedded)

---

## Timing Overview

| # | Slide | Time |
|---|-------|------|
| 1 | Title | 0:15 |
| 2 | The Problem | 0:45 |
| 3 | The Solution — Inventri | 0:30 |
| 4 | Project Management Approach | 1:00 |
| 5 | Timeline & Milestones | 0:45 |
| 6 | Tech Stack & Architecture | 0:45 |
| 7 | Demo Video | 3:00 |
| 8 | Challenges & Solutions | 1:00 |
| 9 | Results & Impact | 1:00 |
| 10 | Lessons Learned | 0:30 |
| 11 | Closing / Q&A | 0:30 |
| **Total** | | **10:00** |

---

## Slide 1 — Title (0:15)

**Content:**
- App name: **Inventri**
- Tagline: "Smart Stock Management for Perfume Shops"
- Team member names + course name
- University logo (if applicable)

**Layout:** Centered text, clean background. Use a gradient or a subtle product photo as the background. Keep it minimal.

**Speaker script:**
> "Good [morning/afternoon]. We're [names], and today we'll be presenting Inventri — a mobile inventory management system we built for a real perfume shop client."

---

## Slide 2 — The Problem (0:45)

**Content:**
- Client: a perfume shop owner
- Current system: handwritten logbooks
- Pain points (use 3 icons or bullet points):
  1. Manual stock tracking is error-prone
  2. No real-time visibility of stock levels
  3. No easy way to generate reports or detect low stock

**Layout:** Left side — photo or illustration of a handwritten logbook. Right side — the 3 pain points with icons.

**Speaker script:**
> "Our client is a perfume shop owner who tracks all inventory with a handwritten logbook. This leads to counting errors, no real-time view of what's in stock, and no way to quickly generate reports. We set out to solve this."

---

## Slide 3 — The Solution — Inventri (0:30)

**Content:**
- One-sentence pitch: "A mobile app that replaces the logbook with real-time digital stock management."
- 4 key features (icons + short labels):
  - Dashboard & low-stock alerts
  - Product catalog with barcode scanning
  - Delivery & sales transaction recording
  - Inventory report export

**Layout:** App logo/mockup in center, 4 feature icons arranged around it.

**Speaker script:**
> "Inventri is a mobile app that gives the shop owner a real-time dashboard, product management with barcode scanning, transaction recording for deliveries and sales, and the ability to export inventory reports — all from their phone."

---

## Slide 4 — Project Management Approach (1:00)

**Content:**
- **Methodology:** Agile-Kanban hybrid — weekly sprints with a Kanban-style task board for continuous flow
- **Tools:**
  - **Notion** — central workspace for task tracking (Kanban board), meeting notes, requirements documentation, and sprint planning
  - **Lovable** — rapid prototyping; built a clickable prototype that the client approved before development began
  - **GitHub** — version control, pull requests with code reviews, branch-per-feature workflow
  - **Messenger** — constant async communication with the team and the client
  - **Canva** — slide design and UI mockup collaboration
- **Team roles (shared leadership model):**
  | Member | Focus Areas |
  |--------|------------|
  | Sheldon | Full-stack development, backend architecture, database design, sprint planning |
  | Anton | Full-stack development, frontend UI/UX, barcode scanning integration, testing |
  | Carl | Full-stack development, API integration, reporting features, client liaison |
  - All three rotated the **Project Manager** role each sprint to distribute leadership experience
- **Process:**
  - Bi-weekly standup meetings within the team to sync progress and resolve blockers
  - Monthly client meetings to demo progress and gather formal feedback
  - Constant client communication via Messenger for quick questions and approvals between meetings
  - Feedback captured in Notion and prioritized using MoSCoW method (Must have, Should have, Could have, Won't have)

**Layout:** Two columns — left: methodology overview + tool logos (Notion, Lovable, GitHub, Messenger, Canva) stacked vertically; right: team role cards (3 cards with member name + focus areas) and a small process diagram showing the flow (Prototype → Client Approval → Build → Demo → Feedback → Prioritize → Build).

**Speaker script:**
> "For project management, we used an Agile-Kanban hybrid approach — weekly sprints tracked on a Kanban board in Notion. Before writing any code, we used Lovable to build a clickable prototype and got our client's approval first — this saved us from building the wrong thing. For communication, we held bi-weekly standup meetings as a team and monthly formal meetings with our client, but we also kept constant contact with them through Messenger for quick feedback. All three of us — Sheldon, Anton, and Carl — are full-stack developers, so we split work by feature area. We also rotated the project manager role each sprint so everyone gained leadership experience. Client feedback was logged in Notion and prioritized using the MoSCoW method to keep us focused on what mattered most."

---

## Slide 5 — Timeline & Milestones (0:45)

**Content:**
- Visual timeline or Gantt chart showing project phases:
  - Planning & requirements gathering
  - Design & prototyping
  - Development sprints
  - Testing & QA
  - Deployment & handoff
- Mark key milestones (first working prototype, client demo, final release)

**Layout:** Horizontal timeline graphic spanning the slide. Use colored segments for each phase. Place milestone markers above the line.

**Speaker script:**
> "Here's our project timeline. We started with requirements gathering and design, moved into development in sprints, and ran QA before final deployment. Key milestones were [list 2-3 specific milestones with approximate dates]."

---

## Slide 6 — Tech Stack & Architecture (0:45)

**Content:**
- Frontend: Expo / React Native, TypeScript, NativeWind (Tailwind CSS)
- Backend: Supabase (Postgres, Auth, Row-Level Security, Realtime)
- Other: Barcode scanning, XLSX export, date-fns
- Simple architecture diagram: Mobile App -> Supabase (Auth + DB + Realtime)

**Layout:** Left: tech stack logos in a grid. Right: simple architecture diagram (3 boxes with arrows).

**Speaker script:**
> "We built Inventri with Expo and React Native for cross-platform mobile support, TypeScript for type safety, and Supabase as our backend — giving us authentication, a Postgres database with row-level security, and real-time data sync out of the box."

---

## Slide 7 — Demo Video (3:00)

**Content:**
- Embedded pre-recorded video showing:
  1. Login flow
  2. Dashboard overview (stock levels, low-stock alerts, inventory value)
  3. Adding/editing a product
  4. Barcode scanning a product
  5. Recording a delivery (stock in)
  6. Recording a sale (stock out)
  7. Exporting an inventory report
- Suggested video resolution: 1080p, recorded on a real device or emulator

**Layout:** Full-screen video embed. Add a thin bottom bar with "Live Demo" label if desired. In Canva, use a video element or link to the video.

**Canva tip:** Upload the video directly to Canva and embed it in the slide. Use "Present" mode to play it inline. Alternatively, switch to a video player during the presentation and switch back.

**Speaker script (before playing):**
> "Now let's see Inventri in action. This is a pre-recorded demo walking through the core workflows."

**Speaker script (after video):**
> "As you saw, the app covers the full inventory lifecycle — from receiving stock to selling it and reporting on it."

---

## Slide 8 — Challenges & Solutions (1:00)

**Content:**
- 3 challenges faced during the project, each with how you resolved them. Examples:
  1. **Real-time stock accuracy** — Used Supabase `current_stock` view computed from completed transactions instead of mutable stock counters
  2. **Barcode scanning on multiple devices** — Leveraged Expo Camera API with fallback handling
  3. **Scope creep / changing requirements** — Regular client check-ins and prioritized backlog kept scope manageable
  4. **Syncing offline usage with real-time data** — Designed transactions to queue locally and reconcile with Supabase once connectivity was restored, preventing duplicate or lost entries
  5. **Coordinating three full-stack developers on the same codebase** — Adopted a branch-per-feature workflow with mandatory code reviews on GitHub to avoid merge conflicts and maintain code quality

**Layout:** 3 cards or rows, each with a challenge heading, short description, and resolution. Use a red-to-green or problem-to-solution visual pattern.

**Speaker script:**
> "No project goes perfectly. [Walk through each challenge and solution briefly]. These experiences taught us how to adapt under pressure and communicate effectively with our client."

---

## Slide 9 — Results & Impact (1:00)

**Content:**
- Quantifiable outcomes (if available):
  - Number of products managed
  - Time saved vs. manual process
  - Client satisfaction / testimonial quote
- Screenshot of the dashboard with real data (or sample data)
- What the client can now do that they couldn't before

**Layout:** Left: key metrics in large bold numbers. Right: dashboard screenshot or client quote in a callout box.

**Speaker script:**
> "With Inventri, our client now has instant visibility into stock levels, can record transactions in seconds instead of minutes, and can generate reports with one tap. [Include any specific feedback from the client]."

---

## Slide 10 — Lessons Learned (0:30)

**Content:**
- 3 brief takeaways (one per team member is a nice touch):
  1. Project management lesson (e.g., importance of early planning)
  2. Technical lesson (e.g., choosing the right tools simplifies development)
  3. Client communication lesson (e.g., regular feedback prevents rework)

**Layout:** 3 columns, each with a team member's name and their key takeaway. Keep text short — one sentence each.

**Speaker script:**
> "To wrap up our takeaways: [Name] learned [lesson], [Name] learned [lesson], and [Name] learned [lesson]."

---

## Slide 11 — Closing / Q&A (0:30)

**Content:**
- "Thank you"
- Team member names
- GitHub repo link or QR code (optional)
- "Questions?"

**Layout:** Clean, centered. Same style as title slide for bookend effect.

**Speaker script:**
> "That's Inventri. Thank you for your time — we're happy to take any questions."

---

## Canva Design Tips

1. **Use a consistent color palette.** Pick 2-3 brand colors (e.g., a deep purple/navy + gold/amber for a perfume brand feel) and apply them to all slides.
2. **Stick to one or two fonts.** Use a clean sans-serif (e.g., Montserrat, Inter, or Poppins) for headings and body text.
3. **Use Canva's "Brand Kit"** if available to lock in your colors and fonts.
4. **Keep slides sparse.** No more than 6 bullet points per slide. Use visuals (icons, screenshots, diagrams) to replace text where possible.
5. **Use Canva's built-in icons** for feature lists and pain points — search for "inventory," "barcode," "chart," etc.
6. **For the architecture diagram,** use Canva's simple shapes (rectangles + arrows) rather than importing an external image.
7. **For the timeline,** search Canva templates for "timeline" and customize one to match your brand colors.
8. **Embed the demo video directly** into Canva so it plays inline during presentation mode. Trim the video to exactly 3 minutes.
9. **Add slide numbers** in a small font at the bottom corner for easy reference during Q&A.
10. **Practice the full presentation** at least twice with the video to ensure timing works.
