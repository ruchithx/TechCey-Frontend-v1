import { nextJsConfig } from "@repo/eslint-config/next-js";

/**
 * Feature-boundary + design-token enforcement (D5). These rules FAIL the build
 * (they surface as warnings via eslint-plugin-only-warn, and the app runs with
 * `--max-warnings 0`).
 *
 * The four enforced rules:
 *   1. No cross-feature imports (features/a must not import features/b).
 *   2. No deep import into a feature that bypasses its index.ts.
 *   3. Shared code (core/, components/, layouts/) must not import features.
 *   4. No raw Tailwind palette classes (bg-blue-500…) or raw hex in app code.
 */

const PALETTE_CLASS_REGEX =
  "\\b(bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|divide|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\\b";
const HEX_REGEX = "#[0-9a-fA-F]{3,8}\\b";

const tokenSyntaxRules = [
  {
    selector: `Literal[value=/${PALETTE_CLASS_REGEX}/]`,
    message:
      "Raw Tailwind palette class is banned. Use a semantic token utility (bg-primary, text-muted-foreground). Change tokens in packages/ui/src/styles/globals.css.",
  },
  {
    selector: `Literal[value=/${HEX_REGEX}/]`,
    message:
      "Raw hex color is banned in app code. Add/adjust a token in packages/ui/src/styles/globals.css and use the semantic utility.",
  },
];

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,

  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"] },

  // Rule 4 (+ URL literals): app source must use tokens and ENDPOINTS.
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "features/**/*.{ts,tsx}",
      "layouts/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...tokenSyntaxRules],
    },
  },
  // core/ gets the token bans too.
  {
    files: ["core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...tokenSyntaxRules],
    },
  },
  // The token showcase legitimately displays hex values — exempt it.
  {
    files: ["app/**/token-showcase.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },

  // Rule 1: a feature must not import another feature (import your own files
  // with relative paths; share cross-feature code via @/core or @/components).
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message:
                "Cross-feature import is banned. Share via @/core or @/components; import this feature's own files with relative paths.",
            },
          ],
        },
      ],
    },
  },

  // Rule 3: shared code must never depend on features.
  {
    files: ["core/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "layouts/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message: "Shared code (core/components/layouts) must not import features.",
            },
          ],
        },
      ],
    },
  },

  // Rule 2: app routes may import a feature only through its public index.ts.
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*", "@/features/*/**"],
              message:
                "Deep feature import bypasses the public surface. Import from @/features/<domain> only.",
            },
          ],
        },
      ],
    },
  },
];
