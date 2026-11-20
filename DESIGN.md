# HUSTLE design system

Source: Refero style `d2774b0c-b85e-43b6-95e2-1da6c69bb504` (derived from attio.com), adopted 2026-11-20 for the marketing site and the signed-in app. The reference spec follows below unchanged; this section records how HUSTLE applies it. Where they disagree, this section wins.

## HUSTLE rules

- **Fonts.** Inter with the optical-size axis (`axes: ["opsz"]` in `src/app/layout.tsx`) stands in for interDisplay and inter; display sizes pick up Inter Display automatically. Tiempos Text is licensed per buyer and this repo is public, so the serif uses the named substitute Libre Baskerville (`--font-serif`). Swap in licensed Tiempos files only from outside the public repo.
- **No chapter tags or eyebrows.** Headings carry themselves (house rule from the impeccable craft floor). Use the two-ink heading pair instead.
- **No invented proof.** HUSTLE has no customer logos, testimonials or adoption numbers yet. The logo matrix lists real data sources and channels; the serif pause is a product principle with no attributed person; stat markers state how the product works (findings per audit, drafts per lead), never projections. Update cells use real dated releases from git history.
- **Product scenes use labelled sample data** and only show features that exist.
- **Marketing surfaces (Persuade):** tokens live on `.site` in `src/components/marketing/site.module.css`. Pages follow the reference page flows: home = broad product landing, `/how-it-works` = focused feature page, `/pricing` = purchase evaluation (no closing band), `/privacy` and `/terms` = reading pages.
- **App surfaces (Operate):** the signed-in app takes type, palette, density and controls from this system (`src/app/globals.css` tokens): white canvas, cool-gray stages, 1px rules, charcoal primary actions with 10px corners, blue only for selection, focus and signals. Standard navigation and controls; no marketing devices (horizon, ribs, serif) inside the app.
- **Copy:** plain and direct, no em dashes.

---

# Attio — luminous systems on rails

## Overview

A light, architectural software style with white and cool gray expanses, restrained blue accents and occasional near-black technical theaters. Tightly set grotesk headings share space with softer editorial serif quotations and fine diagrammatic imagery. Layered interfaces, ruled grids and luminous curves make complex products feel active without making the page visually busy. It suits ambitious platforms whose capabilities need both demonstration and human proof.

### Essentials

- Headlines behave like one continuous thought in two inks: 40px/44px medium display text begins in near-black and continues in gray, with -0.01em tracking; the opening uses 64px/0.95 at weight 600.
- The promise floats above a working object: a centered headline about 805px wide, a 486px support line and paired 36px actions sit above a 1080px interface stage that enters the first fold.
- The page is an architectural drawing, not a pile of cards: 24px outer gutters, 1px continuous rails, a 24-column underlying grid and 152px chapter lead-ins frame the content.
- Controls stay small beside ambitious claims: 14px/20px labels, 10px corners, 12px horizontal padding and a dark primary action paired with a white outlined secondary action.
- Color belongs to light and signals: white and pale gray dominate; blue appears in 24px chapter labels, 2px stat rules and fine curves. Reserve broad chromatic effects for low-opacity hero light and a narrow spectral rim inside a black technical chapter.
- Product theater shifts from tactile to cosmic: rounded 12–16px interface layers on pale backing contrast with a dark, vertically ruled horizon and wireframe data geometry. Include the luminous horizon device; a CSS ellipse with a thin colored rim is the minimum equivalent when no complex illustration exists.
- Human proof interrupts the machinery: a centered 48px/52px editorial serif quotation and small sans attribution provide a deliberate change of texture, while the closing returns to a centered 56px/56px white statement on black.

## Colors

### Accent

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Signal blue | `#386be5` | `--color-blue` | accent, border, link | Fine stat rules and scale curves, not default button fills. |
| Deep blue label | `#2458b3` | `--color-label-ink` | text | Text on pale-blue chapter tags. |
| Periwinkle atmosphere | `#cfd9f8` | `--color-hero-wash` | background | Visible pale-blue outer hero wash produced by a 40% opacity periwinkle gradient over white and further softened by a white radial veil. |
| Blue label wash | `#edf2ff` | `--color-label-wash` | surface | Chapter tags and compact savings tags. |

### Neutral

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Charcoal action | `#1f2125` | `--color-button` | action, surface | Default primary button background. |
| Technical black | `#101010` | `--color-night` | background | Technical theater, closing band and footer; full canvas only for developer-oriented pages. |
| Headline ink | `#1c1d1f` | `--color-ink` | text | Primary light-theme text. |
| Secondary ink | `#242629` | `--color-secondary-ink` | text | Supporting titles and compact plan descriptions. |
| Dark divider | `#30343b` | `--color-dark-edge` | border, surface | Rules within dark chapters and raised dark controls. |
| Deep slate | `#505967` | `--color-tertiary` | text, border | Small descriptive labels, dark-button edges and footer group labels. |
| Slate support | `#707781` | `--color-support` | text | Default secondary half of large heading pairs and descriptive text. |
| Muted silver | `#949ba5` | `--color-muted` | text | Secondary technical headings and supporting text on dark bands; lighter secondary text on feature and story pages. |
| Silver text | `#b8bec7` | `--color-footer-text` | text | Links on the black footer. |
| Control edge | `#cad0d9` | `--color-control-edge` | border | Outlined action edges. |
| Media edge | `#d6d9df` | `--color-media-edge` | border | Photo frames and newsletter field edges. |
| Structural rule | `#e4e7ec` | `--color-rule` | border, surface | Continuous page rails and grid dividers. |
| Weak edge | `#eeeff1` | `--color-weak-rule` | border | Subordinate separators and FAQ row edges. |
| Pale gray stage | `#f3f4f5` | `--color-stage` | surface, background, text | Backing behind interface demonstrations and soft primary-button text. |
| Cool off-white | `#fafafb` | `--color-chapter` | background, surface | Long product chapters and logo cells; also soft reversed text. |
| White canvas | `#ffffff` | `--color-canvas` | background, surface, text | Default canvas, interface cards and reversed headline text. |

## Typography

- **inter** — Body text, navigation and actions. Compact neutral grotesk with a substantial medium default. OpenType features: "ss03". Font stack: "inter", Inter, Arial, sans-serif.
- **interDisplay** — Headlines, section heading pairs, numbers and overlines. Display grotesk with close-fitting spacing and open, clean counters. OpenType features: "ss03". If unavailable, use **Inter**. Use optical display sizing where available and retain the negative tracking. Font stack: "interDisplay", Inter, Arial, sans-serif.
- **tiemposText** — Editorial quotations and the softer line of a customer-proof closing. Warm, compact text serif with bracketed serifs; upright rather than italic. If unavailable, use **Libre Baskerville**. Use regular weight; check line breaks against the compact original. Font stack: "tiemposText", "Libre Baskerville", Georgia, serif.
- **JetBrains Mono** (only for developer-oriented pages) — Attributions, activity captions and the closing documentation URL. Small technical monospace, often uppercase. Font stack: "JetBrains Mono", ui-monospace, monospace.

| Recipe | Font | Weight | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- | --- |
| technical-monument | interDisplay | 600 | 96px | 1 | -0.024em | Single short phrase above the luminous horizon; larger than the opening headline. |
| display | interDisplay | 600 | 64px | 0.95 | -0.02em | Default centered opening promise. |
| closing | interDisplay | 500 | 56px | 1 | -0.015em | Centered white statement in a dark conversion band. |
| editorial-quote | tiemposText | 400 | 48px | 52px | -0.015em | Centered human testimonial interlude. |
| heading-pair | interDisplay | 500 | 40px | 1.1 | -0.01em | Main chapter claim and its gray continuation, set as one typographic block. |
| stat | interDisplay | 500 | 32px | 1 | -0.01em | Compact scale-proof numbers. |
| feature-lead | interDisplay | 500 | 24px | 1.15 | -0.01em | Compact benefit title with inline gray explanation above a demonstration. |
| hero-support | inter | 500 | 18px | 1.3 | -0.01em | Centered short support paragraph under the default opening. |
| card-title | inter | 500 | 18px | 24px | -0.01em | Update and feature card titles. |
| body | inter | 500 | 16px | 22px | -0.01em | Card descriptions and general marketing text. |
| stat-caption | inter | 500 | 16px | 1 | -0.01em | Single-line units immediately below stat numbers. |
| navigation | inter | 500 | 15px | 22px | -0.011em | Top-level navigation labels. |
| action | inter | 500 | 14px | 20px | -0.005em | Buttons and compact interface-independent labels. |
| chapter-tag | inter | 500 | 14px | 20px | -0.01em | Blue-backed chapter labels. |
| footer-link | inter | 400 | 14px | 20px | -0.005em | Dense footer link columns. |
| overline | interDisplay | 600 | 12px | 14px | 0.06em, uppercase, features "calt" | Industry and funding metadata, or bracketed technical section markers. |
| date | interDisplay | 500 | 12px | 14px | normal, features "calt" | Mixed-case dates above update titles. |

### Page-type variants

| Only for | Recipe | Font | Weight | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pricing, feature, developer and customer-story pages | specialist-opening | interDisplay | 600 | 56px | 60px | -0.015em | Smaller opening headline for focused page types. |
| pricing and customer-proof closings | pricing-number | interDisplay | 600 | 40px | 44px | -0.01em | Plan amounts, FAQ heading and sans portion of a proof-page closing. |
| feature testimonials and customer-proof closings | proof-serif | tiemposText | 400 | 40px | 44px | -0.015em | Smaller editorial quote or second line of a proof-page closing. |
| feature, developer and customer-story pages | compact-heading | interDisplay | 600 | 32px | 36px | -0.01em | Lead claim in a narrower section or case-study row. |
| feature, developer and customer-story pages | compact-continuation | interDisplay | 500 | 32px | 36px | -0.01em | Gray continuation of compact headings. |
| developer-oriented pages | technical-quote | interDisplay | 500 | 28px | 34px | -0.01em | Technical partner quotations, in sans rather than serif. |
| pricing, feature and customer-story pages | specialist-support | inter | 500 | 20px | 1.3 | -0.01em | Opening support, generally two short lines. |
| developer-oriented pages | documentation-url | JetBrains Mono | 500 | 16px | 22px | -0.01em | Closing link with bright hostname between dimmer URL parts. |
| pricing pages | faq-question | inter | 600 | 16px | 22px | -0.01em | Accordion question. |
| pricing pages | faq-answer | inter | 400 | 16px | 22px | -0.01em | Expanded explanatory paragraphs; only inline links are underlined. |
| feature and customer-story pages | page-tag | inter | 500 | 13px | 1.4 | -0.012em | White outlined opening category tag. |
| developer-oriented pages | technical-caption | JetBrains Mono | 500 | 12px | 18px | normal, uppercase | Activity total and portrait attribution. |

**Notes:**

- Headings and descriptions often share the same size and baseline; hierarchy comes from ink-to-gray contrast, not from placing a small paragraph below every title.
- Medium weight is the normal reading texture. Use semibold for the opening and compact specialist headings, not heavy black weights.
- Negative tracking tightens from -0.01em section headings to -0.02em opening display and -0.024em monumental type. Serif proof remains upright.
- Overlines switch to contextual alternates and positive tracking; mixed-case update dates retain the same small size without capital spacing.

## Layout

**Density:** Airy at the page level, compact within controls and product scenes; large empty lead-ins make dense demonstrations feel deliberate.

### Spacing

| Value | Use |
| --- | --- |
| 6px | Icon-label gaps and stat number-to-caption gaps. |
| 8px | Input/button pairing and tight card stacks. |
| 10px | Gap between paired conversion buttons. |
| 12px | Button horizontal inset and small content grouping. |
| 16px | Date-to-title gap and specialist heading-to-support gap. |
| 24px | Outer gutters, chapter label-to-heading gap and ordinary card padding. |
| 28px | Closing statement-to-action gap and FAQ row padding. |
| 32px | Story panel padding and stat row gap. |
| 36px | Opening tag-to-headline and headline-to-support gaps. |
| 48px | Stat column gap and footer vertical group spacing. |
| 64px | Newsletter band vertical padding and photo-stage vertical breathing room. |
| 80px | Chapter heading-to-content separation. |
| 96px | Default opening top inset below the header. |
| 112px | Benefit lead-in within the product chapter. |
| 120px | Dark closing band vertical padding. |
| 152px | Default chapter top inset. |
| 160px | Specialist section lead-in. |

### Containers and grids

- **page rails**: max width 1440px · 24 columns · gap 0px · side padding 24px. Centered shell with continuous vertical rules just inside the outer gutters. Main chapter text starts one structural column inside the rails.
- **heading measure**: max width 896px. Default two-ink section heading, left-aligned; short inline claim plus a longer muted continuation.
- **product chapter**: 4 columns · gap 0px. A one-quarter sticky text navigation rail beside a three-quarter demonstration area; media can bleed to the right.
- **split theater**: 2 columns · gap 0px. Text and visual halves in dark technical chapters and featured customer stories.
- **specialist inner grid** (only for feature, developer and customer-story pages): max width 1158px · 3 columns · gap 1px. Equal structural cells separated by hairlines, contained within the larger page rails.
- **plan grid** (only for pricing pages): max width 1156px · 4 columns · gap 24px. Four equal plan cards centered within the outer shell; comparison table below is 1116px wide.
- **faq column** (only for pricing pages): max width 672px. Narrow centered text column after the comparison matrix.

## Corner radius

| Only for | Element | Radius |
| --- | --- | --- |
|  | controls | 10px |
|  | chapter tags | 8px |
|  | interface panels | 12px |
|  | hero outer frame | 16px |
| pricing pages | plan cards | 20px |
| customer stories | photo frames | 12px |

## Surfaces and depth

### Shadows

| Only for | Name | Value | Use |
| --- | --- | --- | --- |
|  | floating product layer | `rgba(0, 22, 62, 0.01) 0px 0px 1px 1px, rgba(0, 22, 62, 0.04) 0px 4px 12px -1px, rgba(0, 22, 62, 0.18) 0px 1px 3px -1px` | Selective raised UI layers inside demonstrations, not ordinary chapter cells. |
|  | hero frame | `rgba(11, 13, 24, 0.06) 0px 0px 0px 1px, rgba(11, 13, 24, 0.024) 0px 1px 2px 0px, rgba(11, 13, 24, 0.03) 0px 3px 6px 0px, rgba(11, 13, 24, 0.035) 0px 8px 14px 0px, rgba(11, 13, 24, 0.04) 0px 16px 28px 0px` | Broad subtle depth under the opening browser scene. |
| customer stories | photo frame | `rgba(28, 40, 64, 0.08) 0px 6px 20px -2px, rgba(28, 40, 64, 0.06) 0px 2px 6px 0px` | Lift a real-world image above the faint construction grid. |

### Surfaces

#### Canvas · level 0

**Use:** Default light page.

**CSS:** `background: #ffffff; color: #1c1d1f`

#### Ruled chapter · level 0

**Use:** Long product explanation and proof sections.

**CSS:** `background: #fafafb; border-left: 1px solid #e4e7ec; border-right: 1px solid #e4e7ec`

**Observed:** Adjacent sections share continuous vertical edges; horizontal separators connect rather than float apart.

**Transfer:** Keep structural edges square and align neighboring sections to the same rails.

#### Pale product stage · level 1

**Use:** Large interface demonstrations.

**CSS:** `background: #f3f4f5; overflow: hidden`

**Observed:** The gray backing fills the cell while white panels sit inside; panel corners, not the whole chapter, are rounded.

**Transfer:** Compose one legible workflow or task on the stage instead of a dashboard collage.

#### Hero atmosphere · level 0

**Use:** Low-intensity light beneath the opening promise.

**CSS:** `background: radial-gradient(90% 80% at 50% 100%, rgba(230,236,255,0.4) 0%, rgba(188,203,255,0.4) 45%, rgba(134,160,238,0.4) 100%)`

**Observed:** A white radial veil clears the upper text area; fine white vertical ribs soften the lower periwinkle field.

**Transfer:** Keep the text region almost white and concentrate atmospheric color around the lower product stage.

#### Technical theater · level 0

**Use:** Signature technical chapter, closing band and footer; developer-oriented pages extend it throughout.

**CSS:** `background: #101010; color: #ffffff; border-color: #30343b`

**Observed:** Dim vertical ribs, wireframes and thin rules appear on black rather than glossy gradient cards.

**Transfer:** Invert a whole chapter so its diagrams and copy share a single field.

#### Dark ribs · level 1

**Use:** Texture in the luminous technical chapter and conversion band.

**CSS:** `background-image: repeating-linear-gradient(to right, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 8px)`

**Observed:** The lines are barely visible and fade near text or scene edges.

**Transfer:** Apply on a separate masked layer so type remains clean.

#### Photo frame · level 2

**Only for:** customer stories

**Use:** Interview stills and real-world case-study photography.

**CSS:** `background: #ffffff; border: 1px solid #d6d9df; border-radius: 12px; padding: 8px; box-shadow: rgba(28, 40, 64, 0.08) 0px 6px 20px -2px, rgba(28, 40, 64, 0.06) 0px 2px 6px 0px`

**Observed:** A thin white mat surrounds a wide, softly rounded image.

**Transfer:** Use this frame for editorial media, leaving ordinary text cells unraised.

## Components

### Primary button

**Use:** Main conversion on a light canvas.

**CSS:** `display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0px 12px; gap: 6px; background: #1f2125; color: #f3f4f5; border: 1px solid #505967; border-radius: 10px`

**Text style:** `action` — inter 500 · 14px/20px · tracking -0.005em

**Observed:** Pairs with a secondary action rather than becoming an oversized centerpiece. In a dark chapter the primary is a slightly raised slate control.

**States:** Declared: hover lightens the charcoal fill and changes text to white; focus-visible uses the same fill and text changes; active lightens the fill further.

### Secondary button

**Use:** Sales contact and secondary exploration.

**CSS:** `display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0px 12px; gap: 6px; background: #ffffff; color: #30343b; border: 1px solid #cad0d9; border-radius: 10px`

**Text style:** `action` — inter 500 · 14px/20px · tracking -0.005em

**Observed:** Compact white outline by default. On dark backgrounds it becomes black with a dark border and silver text. Small chapter links use a 32px height with a trailing arrow.

**States:** Declared: hover retains the white fill and dark text while darkening the border to slate; focus-visible does the same; active uses a pale gray fill.

### Navigation item

**Use:** Shared desktop navigation.

**CSS:** `display: inline-flex; align-items: center; height: 36px; padding: 0px 12px; gap: 6px; border: 1px solid transparent; border-radius: 10px; background: transparent`

**Text style:** `navigation` — inter 500 · 15px/22px · tracking -0.011em

**Observed:** Wordmark left, horizontal navigation beside it, account actions right. Dropdown items add a small chevron and use 8px right padding. A 48px black announcement bar sits above the main row; combined header height is 116px. The white row changes to black over technical sections.

**States:** Declared: hover uses pale gray backing and dark text; focus-visible matches hover; active deepens the pale backing.

### Chapter tag

**Use:** Short chapter label above a major heading.

**CSS:** `display: inline-flex; align-items: center; height: 24px; padding: 0px 6px; border-radius: 8px; background: #edf2ff; color: #2458b3`

**Text style:** `chapter-tag` — inter 500 · 14px/20px · tracking -0.01em

**Observed:** Sized to its text, not stretched across the section; the heading follows after 24px.

**Transfer:** Use a functional category rather than a decorative slogan.

### Logo matrix

**Use:** Compact social proof immediately after an opening or above a story.

**CSS:** `display: grid; grid-template-columns: repeat(5, minmax(0px, 1fr)); gap: 1px; background: #e4e7ec; border-left: 1px solid #e4e7ec; border-right: 1px solid #e4e7ec`

**Observed:** Five columns by two rows of 96px-high off-white cells, with centered monochrome marks and occasional tiny outbound arrows. Specialist proof pages use a looser six-column by two-row logo arrangement.

**Transfer:** Normalize logo optical weight rather than assigning identical wordmark widths.

### Stat marker

**Use:** Scale proof on a large graphic stage.

**CSS:** `display: flex; flex-direction: column; gap: 6px; padding-left: 24px; border-left: 2px solid #386be5`

**Text style:** `stat` — interDisplay 500 · 32px/1 · tracking -0.01em

**Observed:** Number above a stat-caption label; four markers form two columns with 48px column gap and 32px row gap. Labels carry the units so the number stays short.

**Transfer:** Use verified operational quantities and abbreviate numerals consistently.

### Update cell

**Use:** Recent progress or release proof.

**CSS:** `display: flex; flex-direction: column; border-left: 1px solid #e4e7ec`

**Text style:** `card-title` — inter 500 · 18px/24px · tracking -0.01em

**Observed:** Four adjacent cells, each about 319px wide and 312px tall. Mixed-case date sits above the title with 16px separation; a body description follows with 4px gap. Text is inset 24px, with restrained line-art detail near the bottom.

**Transfer:** Keep the rhythm of date, concrete improvement and short benefit rather than turning this into a blog tile grid.

### Newsletter field

**Use:** Inline subscription band below updates.

**CSS:** `height: 40px; padding: 10px 13px; background: #ffffff; border: 1px solid #d6d9df; border-radius: 10px`

**Observed:** A 251px field and compact dark submit button share an 8px gap within a 352px form; the two-line invitation occupies the opposite half of the band.

### Footer link

**Use:** Shared dark directory ending.

**CSS:** `display: flex; align-items: center; padding: 4px; border-radius: 8px; color: #b8bec7`

**Text style:** `footer-link` — inter 400 · 14px/20px · tracking -0.005em

**Observed:** A wordmark anchors the left third; four narrow link columns occupy the right, with some categories stacked. Dim group labels precede lighter links. Social icons sit bottom-left and small legal links bottom-right within the 685px-tall desktop footer.

**States:** Declared: hover and focus-visible brighten the link to a pale neutral; active changes it to white. A thin underline grows beneath the text.

### Plan card

**Only for:** pricing pages

**Use:** Present comparable subscription choices.

**CSS:** `display: flex; flex-direction: column; justify-content: space-between; padding: 21px 23px 23px; border: 1px solid #e4e7ec; border-radius: 20px; box-shadow: rgba(28,40,64,0.08) 0px 1px 2px -1px, rgba(28,40,64,0.04) 0px 2px 4px 0px`

**Text style:** `specialist-support` — inter 500 · 20px/1.3 · tracking -0.01em

**Observed:** Plan name, large amount, billing qualifier, audience description, three feature checks and a full-width action. The recommended choice has a fine blue outline and pale 4px halo; its button alone is dark. A compact monthly/annual segmented control sits above the grid.

**Transfer:** Keep card heights aligned and highlight one choice without using a solid brand-color card.

### FAQ row

**Only for:** pricing pages

**Use:** Resolve objections after detailed comparison.

**CSS:** `position: relative; padding: 28px 0px; border-bottom: 1px solid #eeeff1`

**Text style:** `faq-question` — inter 600 · 16px/22px · tracking -0.01em

**Observed:** Text left, tiny bracketed plus at the right; expanded answers use regular-weight paragraphs with 20px paragraph spacing. The 672px column is much narrower than the comparison table.

**Transfer:** Answer actual purchase questions, not promotional headings disguised as questions.

## Imagery and graphics

### Working interface theater

**Use:** Opening object and recurring product demonstrations.

**Observed:** A broad browser-like white application frame is centered beneath the opening copy, with a pale gray outer shell and tiny window dots. Later scenes layer tables, kanban boards, message composers, charts and connected workflow nodes on pale gray stages. Panels have fine borders, realistic compact data and gentle cool shadows; the object occupies far more area than the explanatory text.

**Transfer:** Show the different product completing one credible task. If no polished interface exists, create a simplified but populated task panel with one floating result layer; maintain the white/gray material and hierarchy rather than inventing a decorative dashboard.

**Build:** Use a 1080px-wide stage at desktop, a 16px outer shell, a 12px white inner panel and the hero-frame shadow. Stack a main application view and at most two smaller result windows with different depths. Fade only peripheral content and clip excess media at the section edge.

### Luminous horizon

**Use:** Signature visual device in a dark technical chapter.

**Observed:** A huge black disk rises beyond the panel bounds; only its upper rim is visible, with a thin spectral edge moving from warm red/yellow on the left to teal/blue on the right. A dim halo and 8px vertical ribs recede behind it. Large centered white type precedes the horizon.

**Transfer:** Make an abstract horizon that suggests the product's underlying system; it need not depict a literal planet. Preserve the dark disk, narrow light and scale contrast with the type.

**Build:** Position a 1728px circle partly below a 1392px overflow-hidden dark panel. Put a conic-gradient ring behind a slightly smaller #101010 disk: pale neutral at 0deg, teal near 10deg, deep blue from 60–180deg, red from 180–300deg and yellow near 350deg. Duplicate the ring with 10px blur and 0.45 opacity. Keep only a narrow rim visible, overlay low-opacity vertical ribs and fade the bottom.

### Wireframe systems

**Use:** Dark technical diagrams and ecosystem explanations.

**Observed:** Fine gray concentric ellipses, radial spokes and sparse lit nodes create a funnel-like data field. Other illustrations use isometric outlines, crosshatched faces and small square vertex handles on faint construction grids. They remain low-contrast beside white headings.

**Transfer:** Diagram the new product's real relationship model with simple SVG geometry; minimum acceptable art is a clean perspective lattice with sparse nodes, not a generic neon network.

**Build:** Use SVG unfilled paths with 1px gray strokes at 0.15–0.35 opacity. Draw 6–10 elliptical rings, connect corresponding points with radial curves, and add a few 2px nodes. For isometric forms use parallel diagonal edges and horizontal 6px-spaced hatch lines; place 4px square handles at intersections.

### Scale curve

**Use:** Quantified proof section.

**Observed:** A very thin blue convex growth curve climbs from the lower left to beyond the upper right of a white 1390px by 760px stage. Fine vertical gray stems and a faint blue wash sit below it. Heading and four compact blue-rule stats occupy the clear left portion.

**Transfer:** Use a justified trend, capacity envelope or abstract scale curve; the diagram should remain an atmospheric supporting device rather than imply unverified data.

**Build:** Draw an SVG cubic path that starts nearly horizontal at the lower left and steepens toward the upper right. Use a 1–2px blue stroke. Clip 1px vertical rules at 8px intervals and a top-to-transparent blue fill below the curve, with the fill near 0.18 opacity. Leave the upper-left text area empty.

### Editorial customer media

**Only for:** customer stories and social-proof sections

**Use:** Featured outcome stories and human proof.

**Observed:** Wide interview stills show people in naturally lit offices with plants, sofas and ordinary workspaces. Other media shows candid team interaction or real urban advertising. Color is natural and mildly subdued, not monochromatized; the framed image usually occupies one half of a ruled row.

**Transfer:** Use real customer activity in context, with wide framing and calm natural light. Pair it with a concise outcome rather than a large promotional portrait cutout.

### Technical portrait and activity field

**Only for:** developer-oriented pages

**Use:** Partner quotations and proof of sustained building.

**Observed:** Partner portraits are rendered as coarse monochrome dithering on black. A separate activity field uses rows of 19px rounded squares in a neutral gray ramp, with a 12px uppercase mono caption aligned bottom-right.

**Transfer:** Use an authentic partner portrait and real activity data from the new product; reduce them to the same gray technical language.

**Build:** For portraits, downsample a grayscale image into small thresholded dots or pixels, retaining the silhouette. For activity, build a dense grid of 19px squares with 30% corner radius and narrow gaps; map quantity to dark-to-light neutral fills. Keep the caption outside the grid, within the same ruled panel.

### Human mosaic canopy

**Only for:** customer-proof closings

**Use:** Distinctive light conversion scene.

**Observed:** Hundreds of tiny desaturated face tiles form a broad canopy above a centered two-line closing. Tile edges fade into white and the lower outline breaks into scattered columns; a sans line sits above an upright serif line.

**Transfer:** Use permissioned community portraits or small authentic customer marks. Preserve the clustered arch and soft disappearance into the page.

**Build:** Arrange 24px square grayscale portraits with 7px corners in a dense horizontal grid. Vary opacity and omit cells toward the lower center to open a shallow arch above the headline. Apply white linear-gradient masks at both horizontal edges and a bottom fade; use pale gray fallback marks rather than empty cells.

### Icons

**Observed:** Small rounded-line SVGs, typically 14–20px, with 1.1px strokes and round caps; navigation chevrons use 18px icons. Most marketing icons are slate or muted silver, with tiny color-backed symbols confined to product diagrams.

**Transfer:** Choose restrained outline symbols with matching stroke weight; align icons to text centers and use 6px gaps in actions. Avoid heavy filled icon badges outside a product scene.

## Section recipes

How recurring sections are built.

### First screen: Floating product opening

**Observed:** A 116px sticky header combines the black announcement strip with a white navigation row. Below it, a centered content stack begins after 96px: a small outlined news link, then the display headline after 36px, spanning about two-thirds of the page in a single line where copy permits. The 486px-wide gray support follows after 36px, then Secondary button and Primary button after 24px with 10px separation. From back to front: white canvas, low periwinkle Hero atmosphere with white radial veil and fine vertical ribs, then a 1080px-wide Working interface theater. Within the first 900px the complete promise, support and actions are visible, and the upper portion of the application enters around the lower third; its remaining content and the logo matrix fall below the fold.

**Transfer:** Keep the promise and task object equally prominent for a different product. A simple populated application frame with one meaningful result is sufficient. Focused feature pages instead use left-aligned 56px type beside a workflow diagram; developer pages use the same split composition on black with wireframe art. Pricing and proof directories use centered 56px headlines followed by cards or logos rather than the browser stage.

**Avoid:** Do not replace the lower stage with an isolated icon, full-bleed photograph or a small screenshot floating beside the headline. Do not let the gradient compete with the text or force oversized actions.

**Text style:** `display` — interDisplay 600 · 64px/0.95 · tracking -0.02em

### Continuous heading pair

**Observed:** Chapter tag precedes a heading-pair block by 24px; a short near-black claim flows directly into a muted explanation of equal size. The block is left-aligned, up to 896px wide, with 152px top padding and 80px before the next major construction.

**Transfer:** Write the claim and continuation as one thought, preserving contrast without turning the continuation into a second headline.

**Text style:** `heading-pair` — interDisplay 500 · 40px/1.1 · tracking -0.01em

### Guided product chapter

**Observed:** A sticky quarter-width navigation rail sits beside the three-quarter product stage. Active items are darker with a slim blue position mark. Each benefit starts with a feature-lead block after 112px of air, followed by a large Pale product stage and, where needed, two bordered explanatory cells below.

**Transfer:** Group capabilities by user outcome and show a different complete task in each scene; a shorter page can use the same rail-and-stage construction for fewer outcomes.

**Text style:** `feature-lead` — interDisplay 500 · 24px/1.15 · tracking -0.01em

### Technical theater chapter

**Observed:** Technical theater inverts the page, with 1px dark rails, Dark ribs, technical-monument type and the Luminous horizon. Supporting capability cells share edges beneath the art. Later split panels pair 40px two-ink text and a small outlined action with Wireframe systems.

**Transfer:** Give the underlying architecture one dramatic visual identity; keep its mechanics and proof legible rather than relying on the artwork alone.

**Text style:** `technical-monument` — interDisplay 600 · 96px/1 · tracking -0.024em

### Editorial proof pause

**Observed:** Centered editorial-quote type sits within an 864px measure and generous white space. A small name and role sit below; fine page rails and faint technical texture remain. Feature-page quotes use proof-serif at 40px instead; technical partner quotes stay 28px sans alongside dithered portraits.

**Transfer:** Let a real person's specific observation provide the emotional register that the surrounding product diagrams do not.

**Text style:** `editorial-quote` — tiemposText 400 · 48px/52px · tracking -0.015em

### Scale proof stage

**Observed:** Scale curve spans a 760px-high ruled section. The Chapter tag, heading pair and a two-by-two group of Stat markers sit left of the steepest portion of the graphic.

**Transfer:** Separate the short verified quantities from their units and give them enough clear canvas to read at a glance.

**Text style:** `stat` — interDisplay 500 · 32px/1 · tracking -0.01em

### Updates and subscription

**Observed:** A Chapter tag and heading pair lead into four Update cells after 80px. A fine ribbed base meets a newsletter band with 64px vertical padding: two-line 24px invitation left and Newsletter field plus a 40px submit action right.

**Transfer:** Use dated improvements to substantiate product momentum; keep the subscription invitation secondary to the primary conversion.

**Text style:** `card-title` — inter 500 · 18px/24px · tracking -0.01em

### Dark conversion and directory

**Observed:** A 417px dark conversion band centers a maximum 672px-wide closing statement with 120px top and bottom padding and a 28px gap to paired actions. Dark ribs and faint vertical light streaks sit behind it. The directory continues on the same black canvas with the logo left, four narrow link columns right and a restrained bottom utility line.

**Transfer:** Close on one confident outcome sentence and two small actions; let the directory be useful and dense without introducing a new visual campaign.

**Text style:** `closing` — interDisplay 500 · 56px/1 · tracking -0.015em

### Story rows

**Only for:** customer-story directories

**Observed:** A centered opening label, 56px headline and 20px support lead into a six-by-two logo field. Featured 462px-high rows alternate text/media direction; between them, pairs of square-edged text story panels share a 1px divider. Each story uses a monochrome logo, uppercase metadata, a bold outcome and muted 32px continuation, then a small arrow link.

**Transfer:** Alternate rich human media with compact text-led outcomes rather than making every story the same floating card.

**Text style:** `compact-heading` — interDisplay 600 · 32px/36px · tracking -0.01em

### Plans and comparison

**Only for:** pricing pages

**Observed:** A centered specialist-opening and short support lead into a segmented billing switch and four Plan cards. Below logos, a 1116px comparison matrix uses a left feature column and four plan columns, 45–57px rows, faint horizontal rules and a subtly shaded recommended column. Plan names and actions repeat in a sticky comparison header. A 672px FAQ column follows with 176px top spacing, then the dark footer directly.

**Transfer:** Keep quick plan choice separate from exhaustive comparison and purchasing objections. No separate promotional closing band is needed on this page type.

**Text style:** `specialist-opening` — interDisplay 600 · 56px/60px · tracking -0.015em

### Specialist closing scenes

**Only for:** developer-oriented and customer-proof pages

**Observed:** Developer-oriented pages center a 32px readiness question and a dotted-underlined 16px mono URL in a framed construction grid, surrounded by dim floating form controls. Customer-proof pages stay white: Human mosaic canopy above a 40px sans line and a 40px upright serif line, then paired actions and the shared dark directory.

**Transfer:** For a builder audience, make the immediate next step a documentation destination. For a community-proof page, let the collective human field support a warmer closing rather than reusing the black conversion statement.

## Page flow

**Storyline:** Promise → working demonstration → recognizable proof → capability depth → underlying system → human and quantified proof → confident next step.

### Broad product marketing landing page

1. **Promise** — Centered floating opening with a large task-oriented interface.
2. **Social proof** — Monochrome logo matrix integrated into the structural rails.
3. **Capability chapters** — Guided rail, large working scenes and compact explanatory cells.
4. **System explanation** — Dark luminous horizon, wireframe relationships and ecosystem modules.
5. **Human and quantified proof** — Editorial quote, scale curve with stat markers and featured customer outcome.
6. **Product momentum** — Dated update cells and a secondary subscription band.
7. **Closing call** — Centered white-on-black statement, small paired actions and dark directory.

**Transfer:** Choose only the narrative beats needed for the new product while retaining the contrast of working scenes, structural grids and a luminous systems device.

### Purchase evaluation and plan selection

1. **Pricing** — Centered promise, billing switch and four comparable plan cards.
2. **Trust** — Compact customer logo field.
3. **Detailed comparison** — Grouped horizontal tables with repeated sticky plan actions and a softly highlighted recommendation.
4. **Objection handling** — Narrow ruled FAQ column.
5. **Directory** — Direct transition to the shared dark footer without a promotional CTA band.

**Transfer:** Preserve a quick decision layer above exhaustive information; organize categories around genuine buying criteria.

### Focused feature landing page

1. **Promise and demonstration** — Left text beside a connected workflow diagram on a faint light field.
2. **Capability breadth** — Logo matrix, two-row capability card field and a five-column summary.
3. **Human proof** — Large centered serif quotation.
4. **Ease of adoption** — Steps beside an interface demonstration.
5. **System explanation** — Dark technical chapter with a monumental phrase and five support cells.
6. **Reliability and control** — Three-column illustrated capabilities followed by three concise assurance cells.
7. **Closing call** — Dark statement band with two actions, followed by directory.

**Transfer:** Move from what the feature achieves to how it works and why it can be trusted, without requiring the same categories or section count.

### Technical platform and builder recruitment

1. **Promise** — Dark split opening with short imperative headline and wireframe object.
2. **Technical capabilities** — Repeated heading pairs, documentation links and indexed diagram cells.
3. **Partner proof** — Dithered portraits and sans quotations interrupt the diagrams.
4. **Quantified credibility** — Neutral activity grid with mono total aligned below.
5. **Ecosystem proof** — Monochrome app marks in equal cells and an open-source text link.
6. **Closing call** — Centered readiness question and documentation URL amid a grid of UI primitives, then dark directory.

**Transfer:** Use black as the page canvas only for this specialist technical mode; replace each diagram with real extension points and access patterns.

### Customer-proof directory

1. **Promise** — Centered short heading and support under an outlined page tag.
2. **Breadth of adoption** — Loose two-row monochrome logo field.
3. **Outcome proof** — Alternating media/text stories interspersed with paired text panels.
4. **Personal endorsement** — Portrait beside an editorial serif quote.
5. **Closing call** — Soft portrait mosaic canopy, mixed sans/serif statement and paired actions before the dark directory.

**Transfer:** Use outcome-led stories and real human context; vary editorial scale rather than adding colorful category cards.

## Writing

Confident and operational, with warmth coming from the user's reclaimed time rather than exuberant adjectives. The product sounds capable and active, while concrete verbs make ambitious technology understandable.

**Do not copy:** Do not reuse Attio's name, wordmark, proprietary feature names, customer marks or names, quotations, pricing, adoption totals or performance claims. Source phrases below illustrate cadence, not reusable claims.

- **Addressing the reader:** Speak directly to you and your team; refer to the product by name when assigning it concrete work. Use we sparingly for builder credibility.
- **Rhythm:** Short declarative headlines, often with a full stop, followed by one or two compact sentences. Three-part verb sequences and clipped contrasts give momentum without exclamation marks.

| Role | Pattern | Typical length | Examples of the pattern |
| --- | --- | --- | --- |
| Opening promise | Name the new mode of work or give three compact imperatives. | 3–8 words | “Welcome to agentic revenue.”<br>“Dream. Code. Ship.”<br>“From zero to IPO.” |
| Section claim | Short benefit first; a longer concrete continuation can share its typographic block. | 4–10 words before the continuation | “The intelligent system that never sleeps.”<br>“All of the signals, none of the noise.”<br>“Built for the long run.” |
| Support | Describe who acts, what gets done and the practical result. | 12–25 words | “[Brand] is the platform that builds pipeline, advances deals, and grows accounts around the clock.”<br>“Describe the goal. [Brand] assembles the workflow for you to approve.” |
| Proof title | State a measurable outcome first, then explain the mechanism in muted continuation. | 3–7 words for the outcome | “83% faster lead triage.”<br>“25% revenue boost.” |
| Action | Verb plus an explicit destination or low-friction next step. | 2–4 words | “Start for free”<br>“Talk to sales”<br>“View docs” |
| Closing | One unqualified product-position statement, not a paragraph. | 4–9 words | “Agentic revenue runs on [Brand].”<br>“Ask more from CRM. Ask [Brand].”<br>“Ready to build?” |

**Words and phrasing to use:** build; run; connect; describe; test; ship; signals; context; every; your team; before; scale

**Avoid:** revolutionary; game-changing; unlock limitless potential; synergy; magical all-in-one; excessive AI superlatives

**Rules:**

- Make technology act through a specific verb rather than describing it with a stack of adjectives.
- Pair an automated action with a retained human decision: the system prepares, the user approves or acts.
- Use repetition and parallelism for emphasis, but keep supporting copy literal.
- State units and time periods with numerical proof, and substantiate each claim.
- Keep category tags factual and brief; save complete sentences for headings.

## Do's and Don'ts

### Do

- Keep the default opening at 64px/0.95, weight 600, with -0.02em tracking.
- Let 40px heading claims and gray continuations share a baseline and line-height.
- Carry 1px rails through adjoining sections inside the 24px page gutters.
- Use 36px conversion buttons with 10px corners even beside very large typography.
- Stage white product panels on pale gray, with 12px panel corners and selective cool shadows.
- Give chapter starts 152px of air and keep dense content aligned to the structural grid.
- Include a thin luminous horizon on black as the signature architectural moment.
- Use compact 32px numbers with 2px blue left rules for operational scale proof.

### Don't

- Do not make the default landing page entirely dark; reserve that continuous treatment for a technical builder audience.
- Do not replace the charcoal primary action with a saturated blue marketing button.
- Do not round structural sections into 20px cards; that radius belongs to plan cards.
- Do not colorize every customer logo; social proof is mostly monochrome.
- Do not apply heavy drop shadows to the whole card grid; depth belongs to selected media layers.
- Do not turn supporting heading continuations into bold black text; their gray is part of the hierarchy.
- Do not use JetBrains Mono for the general body or editorial quotations.
- Do not make every metric monumental; the 96px recipe belongs to the short technical chapter title, not stat numerals.

## Motion and responsive

### Motion

**Observed:**

- Declared button color transitions use 0.3s cubic-bezier(.2, 0, 0, 1). Footer links use color 0.15s cubic-bezier(0, 0, 0, 1), with underline background-size at 0.4s cubic-bezier(.65, 0, .35, 1).
- Declared signal roller animation runs for 24s, linear, infinitely. Pricing construction lines use a 1.5s ease-out appearance.
- The product opening and editorial quotation use sticky stages; a product navigation rail tracks the active benefit.

**Transfer:**

- Use subtle state changes on the small controls rather than making them expand or bounce.
- If animating capability breadth, keep the motion inside the ruled media field; the headline remains the stable anchor.
- Keep essential product results and proof readable without waiting for an animation cycle.

**Unknown:**

- Exact scroll timelines, illustration rotation durations and complete reduced-motion behavior are not established.

### Responsive

**Observed:**

- Declared width breakpoints include 640px, 768px, 992px, 1024px, 1200px and 1400px among others.
- Desktop navigation is hidden below its large-layout mode. The main logo matrix uses a five-column desktop grid. The update row has horizontal snap scrolling.
- Specialist plan cards declare a single-column base and four-column large-layout mode; the outer page shell has a 1440px maximum width.

**Transfer:**

- On narrow layouts, place the product stage below the promise and turn the quarter-width guided rail into a compact local navigation rather than compressing the desktop columns.
- Keep update cells in a horizontal snapping strip when four columns become too narrow.
- Allow heading pairs to wrap together; maintain the ink-to-gray continuation instead of splitting the relationship into unrelated blocks.

**Unknown:**

- Exact mobile typography, artwork placement, menu design and table overflow behavior are not established. Narrow-layout transfer rules are design recommendations.

## How to use this guide

1. Start from the Essentials and the first-screen recipe; where the guide offers variants, use the default named for a new marketing page.
2. Plan the page before building: map your content onto the section recipes and page flow, then check the plan against the Do's and Don'ts.
3. Build with the tokens and component specs; recreate signature graphics with their build recipes instead of generic decoration, and use the named font substitutes if a font is unavailable.
4. Render the page at desktop and mobile widths, compare it with the Essentials and the Don'ts, and fix the differences before you finish.
