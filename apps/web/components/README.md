# components — cross-feature shared UI

Genuinely cross-feature primitives live here. **Most shared UI (Button, Dialog,
Input…) lives in the `@repo/ui` package** (shadcn/ui) and is built in the NEXT task —
this folder is intentionally near-empty for now.

## Rules
- Anything here must be feature-agnostic. **Shared code must not import from `@/features/**`**
  (lint-enforced).
- Reach for `@repo/ui` first; only add here when a primitive is app-specific but still cross-feature.

## Current contents
- `feature-placeholder.tsx` — the Tier-0 route placeholder (removed once real pages land).
