<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Codebase Search & Exploration Rules
- Keep file searches restricted to application source directories (`components/`, `app/`, `lib/`, `hooks/`).
- Do not inspect third-party library internals in `node_modules` unless other methods have been tried first.

## Verification Policy
- Never run pre-edit builds, baseline lints, or git log archeology for straightforward component/styling changes.
- Do not run `npm run lint` for routine edits.
- Only run `next build` (or TypeScript check) ONCE, at the very end after edits are made, to verify compilation.
