# RiskFit Design Tokens

Toss-inspired token set powering the RiskFit web app. All tokens are declared in
[`src/index.css`](../src/index.css) inside the Tailwind v4 `@theme` block, so
they are exposed **both** as CSS variables (`var(--color-brand-500)`) **and**
as Tailwind utility classes (`bg-brand-500`).

> **Rule of thumb:** prefer the Tailwind utility in JSX/TSX. Reach for the raw
> CSS variable only in CSS files or inline `style` props.

---

## 1. Color

### 1.1 Brand (Toss Blue)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--color-brand-50`  | `#EFF6FF` | `bg-brand-50`  | Tinted backgrounds, hover wash |
| `--color-brand-100` | `#DBE9FE` | `bg-brand-100` | Subtle pill backgrounds |
| `--color-brand-200` | `#BDD8FD` | `bg-brand-200` | Disabled primary, focus ring base |
| `--color-brand-300` | `#92BCFE` | `bg-brand-300` | — |
| `--color-brand-400` | `#5B95F9` | `bg-brand-400` | — |
| `--color-brand-500` | `#3182F6` | `bg-brand-500` | **Primary CTA, links, key emphasis** |
| `--color-brand-600` | `#1B64DA` | `bg-brand-600` | Primary hover/press |
| `--color-brand-700` | `#1957BD` | `bg-brand-700` | Accent text on brand-50 bg |
| `--color-brand-800` | `#11489A` | `bg-brand-800` | — |
| `--color-brand-900` | `#0B3A82` | `bg-brand-900` | Deep brand, rare |

### 1.2 Neutral (Toss Gray)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--color-neutral-0`   | `#FFFFFF` | `bg-neutral-0`   | Card surface |
| `--color-neutral-50`  | `#F9FAFB` | `bg-neutral-50`  | Page background |
| `--color-neutral-100` | `#F2F4F6` | `bg-neutral-100` | Subtle surface tint, chips |
| `--color-neutral-200` | `#E5E8EB` | `border-neutral-200` | **Default border / divider** |
| `--color-neutral-300` | `#D1D6DB` | `border-neutral-300` | Strong border |
| `--color-neutral-400` | `#B0B8C1` | `text-neutral-400` | Placeholder |
| `--color-neutral-500` | `#8B95A1` | `text-neutral-500` | Disabled text, helper |
| `--color-neutral-600` | `#6B7684` | `text-neutral-600` | **Muted foreground** |
| `--color-neutral-700` | `#4E5968` | `text-neutral-700` | Secondary text |
| `--color-neutral-800` | `#333D4B` | `text-neutral-800` | High-emphasis body |
| `--color-neutral-900` | `#191F28` | `text-neutral-900` | **Primary foreground / headings** |

### 1.3 Semantic state

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `--color-semantic-success` | `#00C896` | `bg-semantic-success` / `text-semantic-success` | Positive trend, success toast |
| `--color-semantic-warn`    | `#F59E0B` | `text-semantic-warn`    | Caution, soft warning |
| `--color-semantic-danger`  | `#F04452` | `text-semantic-danger`  | Errors, destructive actions |
| `--color-semantic-info`    | `#3182F6` | `text-semantic-info`    | Informational accents |

### 1.4 Semantic aliases

These map intent onto the palette above. Use these in **components** so the
palette can be retuned without touching JSX.

| Alias | Resolves to | Tailwind |
|---|---|---|
| `--color-background`         | `--color-neutral-0`   | `bg-background` |
| `--color-surface`            | `--color-neutral-0`   | `bg-surface` |
| `--color-surface-muted`      | `--color-neutral-50`  | `bg-surface-muted` |
| `--color-surface-subtle`     | `--color-neutral-100` | `bg-surface-subtle` |
| `--color-border`             | `--color-neutral-200` | `border-border` |
| `--color-border-strong`      | `--color-neutral-300` | `border-border-strong` |
| `--color-foreground`         | `--color-neutral-900` | `text-foreground` |
| `--color-foreground-muted`   | `--color-neutral-600` | `text-foreground-muted` |
| `--color-foreground-subtle`  | `--color-neutral-500` | `text-foreground-subtle` |
| `--color-primary`            | `--color-brand-500`   | `bg-primary` / `text-primary` |
| `--color-primary-hover`      | `--color-brand-600`   | `bg-primary-hover` |
| `--color-primary-foreground` | `#FFFFFF`             | `text-primary-foreground` |
| `--color-accent`             | `--color-brand-50`    | `bg-accent` |
| `--color-accent-foreground`  | `--color-brand-700`   | `text-accent-foreground` |

---

## 2. Typography

### 2.1 Family

| Token | Tailwind | Stack |
|---|---|---|
| `--font-sans`    | `font-sans`    | Pretendard Variable → Pretendard → system fallbacks |
| `--font-display` | `font-display` | Same as sans (Toss does not use a separate display face) |
| `--font-mono`    | `font-mono`    | `ui-monospace`, SF Mono, Consolas, … |

### 2.2 Size scale

| Token | rem | px | Tailwind | Usage |
|---|---|---|---|---|
| `--text-xs`   | 0.75  | 12 | `text-xs`   | Caption, legal |
| `--text-sm`   | 0.875 | 14 | `text-sm`   | Helper, secondary |
| `--text-base` | 1.0   | 16 | `text-base` | **Body default** |
| `--text-lg`   | 1.125 | 18 | `text-lg`   | Emphasised body |
| `--text-xl`   | 1.25  | 20 | `text-xl`   | Card title |
| `--text-2xl`  | 1.5   | 24 | `text-2xl`  | Section title |
| `--text-3xl`  | 2.0   | 32 | `text-3xl`  | Page title |
| `--text-4xl`  | 2.5   | 40 | `text-4xl`  | Hero |
| `--text-5xl`  | 3.0   | 48 | `text-5xl`  | **Score display** |
| `--text-6xl`  | 4.0   | 64 | `text-6xl`  | Large score / launch screen |

### 2.3 Leading & tracking

| Token | Value | Tailwind |
|---|---|---|
| `--leading-tight`   | 1.2   | `leading-tight` |
| `--leading-snug`    | 1.35  | `leading-snug` |
| `--leading-normal`  | 1.5   | `leading-normal` |
| `--leading-relaxed` | 1.625 | `leading-relaxed` |
| `--tracking-tight`  | -0.02em | `tracking-tight` |
| `--tracking-normal` | -0.01em | `tracking-normal` (default) |
| `--tracking-wide`   | 0em     | `tracking-wide` |

Korean text benefits from slightly negative tracking — the body default
is `-0.01em`, and large headings tighten further to `-0.02em`.

### 2.4 Helper utility

`.text-score` — opinionated class for the big number on the result page:
`text-5xl`, `font-bold`, `tracking-tight`, `tabular-nums`. Apply directly:

```tsx
<p className="text-score text-brand-500">87</p>
```

---

## 3. Spacing

Spacing follows the Tailwind default 4 px scale (`p-1` = 4 px, `p-2` = 8 px,
`p-4` = 16 px, `p-6` = 24 px, `p-8` = 32 px, …). Toss-style cards typically use
`p-5` (20 px) or `p-6` (24 px) of inner padding, and `gap-3` / `gap-4` between
stacked items.

---

## 4. Radius

| Token | px | Tailwind | Usage |
|---|---|---|---|
| `--radius-sm`   | 8     | `rounded-sm`   | Pills, small chips, focus rings |
| `--radius` / `--radius-md` | 12 | `rounded` / `rounded-md` | **Buttons, inputs** |
| `--radius-lg`   | 16    | `rounded-lg`   | **Cards** |
| `--radius-xl`   | 24    | `rounded-xl`   | Large cards, modal sheet |
| `--radius-2xl`  | 32    | `rounded-2xl`  | Full-bleed sheets, hero cards |
| `--radius-full` | 9999  | `rounded-full` | Avatars, circular buttons |

---

## 5. Shadow

Toss shadows are *whisper-quiet*. Never reach for a heavier shadow than needed.

| Token | Tailwind | Usage |
|---|---|---|
| `--shadow-xs`         | `shadow-xs`         | Hairline lift on hover |
| `--shadow-card`       | `shadow-card`       | **Default resting card** |
| `--shadow-card-hover` | `shadow-card-hover` | Card hover state |
| `--shadow-cta`        | `shadow-cta`        | Primary button (brand-tinted glow) |
| `--shadow-modal`      | `shadow-modal`      | Modal / sheet |
| `--shadow-focus`      | `shadow-focus`      | Applied automatically by `:focus-visible` |

---

## 6. Motion

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--duration-instant` | 80 ms  | `duration-instant` | Press feedback |
| `--duration-fast`    | 160 ms | `duration-fast`    | Hover, micro-interactions |
| `--duration-base`    | 220 ms | `duration-base`    | **Default** |
| `--duration-slow`    | 320 ms | `duration-slow`    | Sheets, large transitions |
| `--duration-slower`  | 480 ms | `duration-slower`  | Page reveal |
| `--ease-out-quart`   | `cubic-bezier(0.25, 1, 0.5, 1)`  | `ease-out-quart` | Default ease |
| `--ease-out-expo`    | `cubic-bezier(0.16, 1, 0.3, 1)`  | `ease-out-expo`  | Slide / translate |
| `--ease-spring`      | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `ease-spring` | Pop / overshoot |
| `--ease-in-out`      | `cubic-bezier(0.65, 0, 0.35, 1)` | `ease-in-out`    | Reversible toggles |

JS-side presets live in [`src/lib/motion.ts`](../src/lib/motion.ts):
`fadeIn`, `slideUp`, `springScale`, plus the `transitions` and
`staggerContainer()` helpers.

```tsx
import { motion } from "motion/react";
import { slideUp } from "@/lib/motion";

<motion.section {...slideUp}>…</motion.section>
```

---

## 7. Usage guidelines (1 page)

1. **Compose with semantic aliases first.** A button uses `bg-primary
   text-primary-foreground hover:bg-primary-hover` — not `bg-brand-500`.
   This keeps theming centralized.
2. **Cards = `bg-surface rounded-lg shadow-card p-6`.** Hover lifts to
   `shadow-card-hover` with `transition-shadow duration-base ease-out-quart`.
3. **Primary CTAs = `bg-primary text-primary-foreground rounded-md px-5 h-12
   shadow-cta`.** Toss buttons are tall (48 px) and roomy.
4. **Numbers always `tabular-nums`** so they don't jitter when animating.
   The `.text-score` helper bakes this in.
5. **Spacing breathes.** Default to `gap-3` (12 px) inside a card and `gap-6`
   (24 px) between sections. Generous whitespace > dense layouts.
6. **One radius per surface.** Don't mix `rounded-lg` cards with `rounded-xl`
   inner elements; pick one scale step and stay there.
7. **Shadow is the last resort.** A 1 px `border-border` is the preferred
   separator. Use `shadow-card` only when the surface must visually float.
8. **Motion durations stay short.** Hover/press should never exceed
   `duration-fast` (160 ms). Page-level transitions cap at `duration-slow`
   (320 ms). The `motion` presets enforce this.
9. **Brand colour is reserved for action.** Don't paint decorative surfaces
   in `brand-*`; use `brand-50` washes if you need a tinted background.
10. **Use `cn()` from `src/lib/cn.ts`** to merge classes — it dedupes
    conflicting Tailwind utilities (e.g. `cn("px-4", isLarge && "px-6")`
    correctly yields `px-6`).
