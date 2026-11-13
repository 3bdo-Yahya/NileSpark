# BurnCal visual foundations

Source: the team's Cinematic Earth Figma direction, hero `26:266` and refined Explorer `75:2`.

`src/styles/tokens.css` is authoritative. Components consume these Tailwind theme variables instead of introducing their own palettes.

| Purpose                    | Token             | Value     |
| -------------------------- | ----------------- | --------- |
| Background                 | `--color-space`   | `#060B11` |
| Surface                    | `--color-panel`   | `#0D151E` |
| Raised control             | `--color-raised`  | `#101B25` |
| Main action / selected AOI | `--color-brand`   | `#F3A66B` |
| Warm display text          | `--color-horizon` | `#EAC8AB` |
| Main text                  | `--color-paper`   | `#F7F5EF` |
| Muted readable text        | `--color-muted`   | `#A5B8C6` |
| Keyboard focus             | `--color-focus`   | `#91D9DF` |

Space Grotesk is used for the brand and headlines, Inter for body and controls, IBM Plex Mono for technical labels. Latin normal subsets are self-hosted. The interface currently follows the English Figma content; a future Arabic interface needs an Arabic font and an RTL layout, not only translated strings.

The scale uses 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px spacing, 8 / 14 / 20 px panel radii, and pill-shaped actions. The default action is at least 48 px high; compact controls are 40 px. Focus is always visible for keyboard users. Status labels accompany colors.

Orange is an interaction/selection color. It is not a scientific activity bin. A future activity legend requires the metric, unit, thresholds and missingness policy approved by Salma.

## Components

- `Button`: primary / secondary / ghost, sm / md / lg, disabled, loading, optional leading/trailing icons. Uses a native button and defaults to `type="button"`.
- `ButtonLink`: matching visual treatment with native anchor semantics.
- `TextField`: persistent label, optional hint and error, programmatic descriptions and invalid state.
- `Badge`: labeled neutral / info / success / warning / error statuses. These colors are UI semantics, not fire risk.
- `Surface`: shared panel shell.
- `Dialog`: native modal dialog with a title, Escape support and browser-managed focus containment/return.

The foundation gallery is an internal component preview; its label-save feedback and statuses never represent an analysis result. Hero art is decorative and disclosed as AI-generated. The geographic map, observations and analysis are later milestones.

Tailwind v4 is connected through `@tailwindcss/vite`. The CSS-first `@theme` generates utilities such as `bg-space`, `text-brand` and `font-display`; responsive and interaction styles live alongside the components. Custom CSS is limited to base accessibility rules and the cinematic artwork gradients/orbit.
