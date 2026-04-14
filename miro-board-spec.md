# REI Amplifi Org Chart — Miro Board Spec

This is the build spec for the Miro board. Read this in the next session and use it to construct the board via the Miro MCP. Every element is defined: name, position, color, content. Build in this order so dependencies resolve correctly.

## Board metadata

```
  Board name:   REI Amplifi Org Chart
  Owner:        bill (whoever the Miro account holder is)
  Permissions:  Private to start, can be shared via link later
  Dimensions:   Default infinite canvas, layout fits in
                approximately 1800 x 1400 pixels
  Background:   Default white
```

## Color palette (use consistently)

```
  REI Amplifi (parent):           dark gray         #2D3748
  Brand cards:                     amber             #F59E0B
  Department cards:                blue              #3182CE
  Role cards (inside dept):        light blue        #BEE3F8
  Operating rules sticky notes:    yellow            #FEF3C7
  Connection lines (brand→dept):   green             #38A169
  Inactive/mothballed:             gray              #A0AEC8
  Link card to plan:               purple            #805AD5
```

## Layout (top to bottom, left to right)

### Top center: REI Amplifi parent header

```
  Type:        Frame or large shape
  Position:    x=900, y=100, width=400, height=80
  Color:       #2D3748
  Text:        REI Amplifi
  Subtext:     The company
  Font:        Bold, white, 28pt
```

### Brand row (left side, vertical column)

Six brand cards, stacked vertically on the left side of the canvas.

```
  Position start:  x=100, y=250
  Card size:       250 x 100 each
  Vertical gap:    20 between cards
  Color:           #F59E0B (amber) for active, #A0AEC8 (gray) for mothballed/pending
```

| Order | Brand | Status | Card text (top line) | Card text (bottom line) |
|---|---|---|---|---|
| 1 | GlobalHighLevel | active | GlobalHighLevel | Affiliate content + GHL agency |
| 2 | SafeBath | active | SafeBath | Senior home safety + dad's installs |
| 3 | Ice Machines | planning | Ice Machines | Bass fishing ramp infrastructure |
| 4 | REI Amplifi (parent) | active | REI Amplifi | Parent agency umbrella |
| 5 | Bass Forecast | pending | Bass Forecast | Pending: Landon retainer |
| 6 | Hatch Investments | mothballed | Hatch | Mothballed: OM Builder |

### Department row (top center across, horizontal row)

Five department cards across the top, just below the REI Amplifi parent header.

```
  Position start:  x=450, y=250
  Card size:       240 x 100 each
  Horizontal gap:  20 between cards
  Color:           #3182CE (blue)
```

| Order | Department | Card text (top line) | Card text (bottom line) |
|---|---|---|---|
| 1 | Editorial | Editorial | Written content for all brands |
| 2 | Audio | Audio | Podcast production |
| 3 | Operations | Operations | Physical infrastructure |
| 4 | Analytics | Analytics | Measurement across brands |
| 5 | Strategy | Strategy | Decisions, rules, planning |

### Roles inside each department (below each department card)

For each department, a sub-cluster of role cards stacked vertically below the department card.

```
  Position:        Below each department card, y=400 start
  Role card size:  220 x 60 each
  Vertical gap:    10 between cards
  Color:           #BEE3F8 (light blue)
  Text:            Role name only, 14pt, dark text
```

#### Editorial Department roles (under Editorial card)

```
  1. Researcher
  2. Writer (per language)
  3. Editor (fact-checker)
  4. Link Builder
  5. Publisher
  6. Distribution
```

#### Audio Department roles (under Audio card)

```
  1. Scraper
  2. NotebookLM Producer
  3. SEO Writer
  4. Transcriber
  5. Publisher (audio)
```

#### Operations Department roles (under Operations card)

```
  1. Site Scout
  2. Service Partner Liaison
  3. Pricing Optimizer
  4. Financial Tracking
```

#### Analytics Department roles (under Analytics card)

```
  1. GSC Pull
  2. GA4 Pull
  3. Trend Detector
  4. Insights Writer
  5. Dispatcher
```

#### Strategy Department roles (under Strategy card)

```
  1. Bill (human)
  2. Memory files (persistent context)
  3. Plan / press release / commitments
```

### Connection lines: which brand uses which department

Draw lines from each brand card on the left to each department card on the top that the brand uses.

```
  Line color:   #38A169 (green)
  Line weight:  2px
  Line style:   Solid for active relationships
                Dashed for planning/pending
```

| Brand | Editorial | Audio | Operations | Analytics | Strategy |
|---|---|---|---|---|---|
| GlobalHighLevel | solid | solid | — | solid | solid |
| SafeBath | solid | — | — | solid | solid |
| Ice Machines | dashed | — | dashed | dashed | solid |
| REI Amplifi (parent) | solid | — | — | solid | solid |
| Bass Forecast (pending) | dashed | — | — | dashed | dashed |
| Hatch (mothballed) | — | — | — | — | — |

### Operating rules sticky notes (right side of canvas)

Four sticky notes on the right side, stacked vertically.

```
  Position start:  x=1500, y=250
  Sticky size:     300 x 200 each
  Vertical gap:    20 between
  Color:           #FEF3C7 (yellow)
  Text:            Bold heading + body, 14pt
```

| Order | Heading | Body |
|---|---|---|
| 1 | Rule 1: Floor | No service work below $7,500/mo × 12 months. Below-floor inquiries route to Extendly. |
| 2 | Rule 2: Truth | No fabricated claims. No client counts, outcomes, credentials, or stats without verifiable source. |
| 3 | Rule 3: Moat | No licensing of proprietary placement intelligence, gap data, platform code, or methodology to competitors in markets we enter. |
| 4 | Rule 4: ES First | No English-first content strategy when non-English markets show thinner competition. |

### Link card: published 12-month plan

A clickable link card at the bottom right, linking to the live published plan.

```
  Position:    x=1500, y=1100, width=300, height=100
  Color:       #805AD5 (purple)
  Text:        12-Month Plan
  Subtext:     Public commitment, dated April 2027
  URL:         https://globalhighlevel.com/12-month-plan/
```

### Title block (top left of canvas)

```
  Position:    x=50, y=50, width=400, height=80
  Type:        Text only, no background
  Text:        REI Amplifi Org Chart
  Subtext:     Brands × Departments × Roles | Built April 2026
  Font:        24pt bold + 12pt regular
```

## Build sequence (do in this order in the next session)

```
  1. Create the board: "REI Amplifi Org Chart"
  
  2. Add the title block (top left)
  
  3. Add the REI Amplifi parent header (top center)
  
  4. Add all 6 brand cards (left column)
  
  5. Add all 5 department cards (top row)
  
  6. Add role cards under each department
  
  7. Draw connection lines from brands to departments
     (use the table above for which connections)
  
  8. Add the 4 operating rules sticky notes (right side)
  
  9. Add the link card to the 12-month plan (bottom right)
  
  10. Verify the layout matches this spec, take a screenshot,
      send Bill the board URL
```

## Notes for the build

```
  • Use sticky notes for the operating rules (they read as
    "rules" in the visual language)
  • Use card / shape elements for brands and departments
    (more structured)
  • Use frames sparingly; the layout should be visually
    clear without forcing frames
  • Keep all text concise. The board is a reference, not
    a document.
  • If Miro MCP supports it, group each department + its
    roles into a single named group for easier movement
  • If Miro MCP supports it, lock the layout positions so
    drag-drop does not break the spec
```

## What this board IS for

```
  • A single-page visual reference for the org structure
  • A planning surface to add new brands or departments
    over time (drag-drop additions)
  • A communication tool when explaining REI Amplifi to
    Landon, partners, or future hires
  • A check against the codebase: if the code path does
    not match this board, one of them is wrong
```

## What this board is NOT for

```
  • Project management (use Active TODOs in Sheets for that)
  • Detailed pipeline architecture (use the per-department
    README files for that)
  • Revenue tracking (use the analytics dashboard for that)
  • Real-time status (this is a static structure, not a
    state machine)
```
