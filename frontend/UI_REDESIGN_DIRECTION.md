# HireMe UI Redesign Direction

## Direction
**Signal Deck**

HireMe should feel like a hiring command center, not a lifestyle product and not a generic dark SaaS clone. The right direction is a **hybrid signal cockpit**:

- light content canvases for reading, forms, and long sessions
- dark instrument surfaces for AI output, live status, and high-priority workflow
- color used semantically, never decoratively
- typography that feels engineered, sharp, and decisive

This combines the best part of Claude's suggestion, semantic color and "cockpit" thinking, with the best part of Gemini's suggestion, more modular dashboard composition, without inheriting Gemini's overused neon-dark aesthetic or heavy glassmorphism.

## Product Tone

HireMe solves a high-stakes coordination problem:

- candidates need clarity on readiness, momentum, and next action
- recruiters need speed, triage, and defensible decisions
- AI features should feel like signal extraction, not magic theater

So the product tone should be:

- precise
- calm under pressure
- technical
- fast
- high-trust

The interface should feel like it is helping users read the market and act on evidence.

## Core Visual Principle

Every screen should answer two questions within 3 seconds:

1. What state am I in?
2. What should I do next?

That means every major page needs:

- one dominant page purpose
- one primary action
- one clear signal summary
- one compact secondary layer for detail

No page should look like a pile of unrelated cards.

## Aesthetic System

### 1. Surface Strategy

Use a **layered light-plus-dark system**, not full dark mode everywhere.

- `Canvas surfaces`: main workspace background, forms, long lists, reading-heavy sections
- `Panel surfaces`: cards, modules, summary trays
- `Instrument surfaces`: AI analysis, fit scoring, interview signal, status-heavy modules
- `Overlay surfaces`: modals, slideovers, action drawers

Rule:

- light surfaces carry content
- dark surfaces carry signal

This lets HireMe look modern and technical without becoming visually exhausting.

### 2. Color Logic

The palette must be semantic first.

#### Core neutrals

- `Ink 950` `#09111F`
- `Ink 900` `#0F172A`
- `Slate 700` `#334155`
- `Slate 500` `#64748B`
- `Fog 100` `#F3F7FB`
- `Snow` `#FBFDFF`
- `Line` `#D7E0EA`

#### Signal colors

- `Signal Positive` `#12D6A0`
- `Signal Active` `#3B82F6`
- `Signal Review` `#F5A524`
- `Signal Alert` `#F25555`
- `Signal AI Bright` `#5EE7FF`
- `Signal AI Deep` `#0891B2`

#### Meaning

- green = fit, progress, ready, passed
- blue = active, open, linked, in motion
- amber = review, pending, incomplete, needs action
- red = blocker, rejection, risk, missing
- cyan = AI-generated analysis, assistant state, machine signal

Usage rule:

- use `Signal AI Bright` on dark instrument panels, glows, chart accents, and live AI states
- use `Signal AI Deep` for text, pills, borders, and icons on light surfaces

No salmon, peach, beige-accent, or decorative warm gradients in product surfaces.

### 3. Typography

The current serif/editorial voice should be removed from product pages.

Recommended stack:

- `Satoshi` for core UI, forms, cards, tables, dashboards, and larger headlines
- `IBM Plex Mono` for score labels, metadata, timestamps, pipeline codes, and system microcopy

Rules:

- product UI should be almost entirely sans-serif
- one primary sans plus one mono accent is enough for the first redesign pass
- hero emphasis should come from weight, spacing, and scale before adding a third font
- metrics should feel machine-readable
- use tighter tracking on headlines and looser line-height on explanatory copy

This keeps the UI distinctive without paying unnecessary font-weight and implementation cost in the first rollout.

### 4. Shape Language

The app should feel structured, not soft-clay.

- interactive radius: `8px`
- card radius: `12px`
- large module radius: `20px`
- borders are thin and intentional
- shadows are soft and wide, not blurry and decorative

Use crisp edges with occasional rounded corners. Avoid oversized pill-everything UI and avoid making standard cards feel inflated.

### 5. Shadow Tokens

Shadow should be standardized early so surfaces feel related across pages.

- `Shadow Resting`: `0 10px 30px rgba(9, 17, 31, 0.06)`
- `Shadow Elevated`: `0 18px 48px rgba(9, 17, 31, 0.1)`
- `Shadow Overlay`: `0 28px 80px rgba(9, 17, 31, 0.18)`

Rules:

- resting shadow for cards and summary tiles
- elevated shadow for hover, priority modules, and active surfaces
- overlay shadow for modals, drawers, and floating action layers
- dark panels should rely more on border contrast and tonal separation than heavy shadow

### 6. Motion

Motion should communicate system state, not just polish.

- staggered page-entry reveal for dashboard modules
- subtle border pulse for AI processing states
- pipeline progress sweep when stages update
- elevated hover with 2-4px lift and sharper shadow
- number transitions for metrics

Avoid:

- constant floating animations
- large parallax gimmicks
- glossy glassmorphism over core workflows

## Layout Language

### Candidate Experience

The candidate side should feel like **trajectory management**.

- more breathable
- more optimistic
- more progression-oriented
- mostly light mode with selective dark signal cards

Pattern:

- top summary rail
- one dominant "next move" card
- one pipeline status band
- one prep/skill/readiness zone
- one compact activity feed

The candidate should feel guided, not judged.

### Recruiter Experience

The recruiter side should feel like **triage and control**.

- denser information
- darker anchor surfaces
- stronger semantic contrast
- queue-based decision patterns

Pattern:

- left rail or strong top nav shell
- signal overview row
- priority queue as the dominant panel
- pipeline distribution and role health beside it
- drill-down drawers for resume, match, and interview evidence

The recruiter should feel like they are operating a live system.

## Signature Components

These should become the recurring visual language across pages:

### Signal Card

A card with:

- eyebrow label
- large primary value or title
- compact evidence line
- semantic edge or status strip

### Stage Rail

A horizontal application/interview progression rail with:

- completed stages in green
- active stage in blue
- pending stages in slate
- blocked/rejected states in red

This should replace generic badges wherever possible.

### Fit Meter

Use a segmented or ring-based score treatment for:

- ATS score
- role fit
- skills match
- interview readiness

The visual should show confidence bands, not just one percentage.

### AI Analysis Tray

A dark, instrument-style module for:

- parsed resume insight
- job-match explanation
- interview briefing
- training prompts

This is where cyan can appear as a machine-signal accent.

### Action Dock

Persistent primary action grouping with:

- one primary CTA
- one secondary CTA
- one low-emphasis utility action

Users should never search for the next move.

## Navigation Direction

The current shell should evolve into a proper product shell.

- dark header or left rail with strong brand presence
- compact gradient mark, green to blue, for the logo
- primary nav should reflect workflows, not generic pages

Suggested nav model:

### Candidate

- Overview
- Jobs
- Applications
- Interviews
- Profile

### Recruiter

- Overview
- Roles
- Candidates
- Pipeline
- Interviews

Notifications and user actions should sit in a utility cluster, not compete with core navigation.

## Content Behavior

The UX copy should sound operational.

Prefer:

- "2 interviews need prep"
- "Resume ready for screening"
- "3 applications stalled in review"
- "High fit, low evidence in backend depth"

Avoid vague marketing copy inside the product shell.

## What To Avoid

- warm editorial palette in product pages
- serif headings in dashboards
- default Bootstrap visual language
- random gradients with no meaning
- too many equally weighted cards
- badges as the only status signal
- large blocks of plain text with no data hierarchy
- dark mode everywhere
- fake futuristic neon effects

## Rollout Plan

### Phase 1: Foundation

- replace global design tokens in `frontend/src/index.css`
- build shared shell styles for header, nav, page frame, and section spacing
- define reusable card, signal, button, input, and status primitives

### Phase 2: First visible transformation

- candidate dashboard
- recruiter dashboard
- global header/navigation

These pages establish the entire visual language.

### Phase 3: High-frequency workflows

- candidate job listings
- candidate applications
- recruiter job applications
- recruiter candidate detail

This is where the signal system proves itself.

### Phase 4: Interview ecosystem

- candidate interview inbox
- recruiter interview inbox
- recruiter briefing room
- training room
- mock interview room
- video conference framing

These pages should lean more heavily into dark instrument surfaces and live-state motion.

### Phase 5: Edge and entry flows

- landing page
- auth pages
- profile completion flows
- empty states
- errors, toasts, loaders, and success states

## Recommendation

The best direction for HireMe is:

**a hybrid light-and-dark command-center aesthetic with semantic signal color, engineered typography, and workflow-first layout composition.**

Not warm editorial.

Not generic dark SaaS.

Not neon sci-fi.

HireMe should look like a system that reads hiring momentum and helps people act with confidence.

## Refinements Applied

After an external critique pass, these implementation-focused refinements are now part of the direction:

- simplified typography from three fonts to two for the first rollout
- tightened radius scale so the UI feels sharper and more operational
- defined concrete shadow tokens instead of relying on per-component judgment
- split the AI accent into bright and deep variants to preserve contrast across dark and light surfaces
