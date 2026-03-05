# Design System Contract

Project-level contract for keeping UI styles unified and token-driven.

## Core Rule

Do not hardcode visual values in component code when a token can represent them.

Use tokens for:
- colors
- spacing
- radius
- shadows
- z-index
- animation duration/easing
- typography weights

## Token Locations

- Global tokens: `app/globals.css` (`:root`)
- Component variants: `components/ui/*` via variants + `className` escape hatch
- Motion primitives: `motion-*` utility classes in `app/globals.css`

## Allowed vs Disallowed

Allowed:
- semantic utility classes (`motion-card`, `reader-chrome`, `num-tabular`)
- token references (`var(--dur-standard)`, `var(--z-dialog)`)
- Tailwind semantic variables (`bg-background`, `text-foreground`)

Disallowed (unless no alternative exists):
- hardcoded hex/rgb in component TSX
- one-off animation timings in class strings
- arbitrary z-index values in component files

## Motion Contract

- Enter/exit: `ease-out` tokens
- On-screen movement: `ease-in-out` tokens
- Hover/color: `ease` token
- Reduced motion: all motion disabled under `prefers-reduced-motion`

## Deployment Variants Contract

- The UI must support two runtime variants:
- Cloud: default end-user feature set, no modules marketplace.
- Self-hosted: first authenticated user becomes `admin`, can manage modules.
- Self-hosted admin-only surfaces (`/modules`) must be hidden and server-guarded for non-admin users.
- Onboarding copy and first-run checklist must adapt to deployment mode.

## Module Contract

- Builtin modules are defined in `lib/config/modules.ts` and persisted via cookie/localStorage.
- Module switches must be runtime-safe: disabling a module must hide controls and route entry points.
- Account surfaces must honor `account_center`.
- Reader controls must honor `advanced_reader`.
- Offline behavior controls must honor `offline_cache`.
- Import automation controls must honor `import_automation`.

## Typography Contract

- Heading wrap: `text-wrap: balance`
- Dynamic numeric values: `.num-tabular`
- Global smoothing: `-webkit-font-smoothing: antialiased`
- Font weights defined as CSS variables

## Review Checklist (PR)

1. Any new hardcoded color/spacing/animation value in TSX?
2. Does new motion follow duration/easing tokens?
3. Is `prefers-reduced-motion` respected?
4. Is z-index from scale tokens?
5. Are repeated patterns extracted to reusable classes/components?
6. For self-hosted flows: are admin-only routes both hidden in nav and protected server-side?
7. For module-driven UI: does disabling each module produce a coherent fallback?
