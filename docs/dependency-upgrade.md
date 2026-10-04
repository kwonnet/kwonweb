# Dependency upgrade — 2026-10-04

Dependencies are pinned in `package.json`; `package-lock.json` is the source for
reproducible npm installs and Docker builds. Use `npm ci`, not `--force` or
`--legacy-peer-deps`. Node 22.23.3 is the tested runtime; Docker remains on Node 22.

## Main changes

- Next.js 16.3.8, React 19.3, Material UI 9.4 and MUI X date pickers 9.14.
- Next's `middleware.ts` becomes `proxy.ts`; auth routing stays the same.
  The MUI App Router integration uses its v16 adapter. Turbopack is the default.
- Removed Toolpad, whose current peer requirements exclude this Next/MUI pair.
  The dashboard, account menu, notifications and confirmation dialog now use
  Material UI directly. Existing notification callers keep their show/close API.
- Migrated removed MUI system props to `sx`, and deprecated input, dialog and
  menu props to slots. Updated virtual selection lists for react-window 2.
- Replaced incompatible Draft emoji and legacy linkify plugins. Emoji selection
  uses a lazy-loaded picker; composer links share the safe post-text tokenizer.
  Read-only feed posts still render text directly without loading Draft.
- Consolidated carousels on react-slick. The other carousel installed the npm CLI
  and its vulnerable bundled packages as application dependencies.
- Replaced the React 18-only card-flip helper with a small accessible CSS flip.
  Removed unused ImageKit, Popper and obsolete type packages.
- Updated Zod 4 validation and explicit unkeyed libsodium hash arguments. A
  regression test checks the unchanged chain KDF against an independent BLAKE2b
  vector and verifies out-of-order message decryption.

## Deliberate compatibility pins

The newest registry tag is not always compatible with the rest of the stack:

- **TypeScript 6.0.3:** TypeScript 7.0.2 no longer provides compiler JavaScript
  APIs used by Next's build/type-check integration and the TSX test loader.
- **ESLint 9.39.5:** Next's current lint plugins do not all support ESLint 10.
- **@types/node 22:** follows the deployed Node 22 runtime.
- **NextAuth 5 beta:** retains the existing v5 integration; the `latest` tag
  points at v4. Vidstack and media-icons use their newer published stable-semver
  releases, which are currently on `next` distribution tags.
- **Immutable 3.8.4 override:** patched compatible 3.x release for Draft, which
  pins an older vulnerable minor. Immutable 5 is not a compatible replacement.
- **Flutterwave overrides:** current Axios and Jest's jsdom environment replace
  stale dependencies shipped in the payment package. Payment API logic is unchanged.

The new ESLint preset also enables React Compiler diagnostics. The project does
not use React Compiler yet. Existing refs/effect/purity/static-component findings
remain visible as warnings; rules-of-hooks and the other correctness checks
remain errors. These warnings are not a claim that every legacy component has
been refactored for React Compiler.

## Security and release verification

After this upgrade, npm audit reports one unresolved advisory through five
development packages: `braces` → `micromatch` → `fast-glob` → Next's ESLint plugin
and config. The registry currently has no patched braces release. It processes
local lint globs, not public application request input. Do not run `npm audit fix
--force`: its suggested Next lint downgrade is incompatible with this upgrade.
Recheck the advisory when updating eslint-config-next. `npm audit --omit=dev`
reports zero known vulnerabilities in production dependencies.

Verified after a clean `npm ci` on Node 22.23.3:

- `npm ls --all`: valid dependency tree, no peer errors.
- `npm test`: 79 passing tests.
- `npm run typecheck`: passed.
- `npm run lint`: zero errors, 59 existing warnings under the new preset.
- `npm run build`: production standalone build passed.

Run tests, typecheck, lint and production build after a clean install. Browser
smoke tests cover desktop/mobile navigation, the account menu, notifications,
virtual selections, editor emoji insertion, responsive carousels and game card flipping. These local
checks do not exercise real payment charges, production login, authenticated
uploads or production database writes; verify those with staging credentials
before routing production traffic to the new image.
