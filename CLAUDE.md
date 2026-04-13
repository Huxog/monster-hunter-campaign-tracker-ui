# MH Campaign Tracker UI — Claude Guide

## Project Overview

Frontend for a Monster Hunter campaign tracker. All business logic lives in an existing backend API. This UI handles:

- **Auth** — login / session management
- **Hunters** — user hunter profiles
- **Campaigns** — campaigns hunters belong to
- **Equipment & Weapons** — gear management
- **Inventory** — hunter item inventory
- **Quests** — quests and their status
- **Materials & Loot** — material tracking

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 + TypeScript (Vite) |
| Routing | TanStack Router |
| Data fetching | TanStack Query |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + tailwind-variants |
| Testing | Vitest |
| Linting | ESLint + Prettier |

## Folder Structure

Feature-based. Each domain owns its components, hooks, store slice, types, and API layer. Shared/reusable code lives in `shared/`.

```
src/
  features/
    auth/
    hunters/
    campaigns/
    equipment/
    weapons/
    inventory/
    quests/
    materials/
  shared/
    components/   ← reusable UI primitives
    hooks/        ← reusable hooks
    lib/          ← api client, query client, zod helpers
    types/        ← global types / enums
  routes/         ← TanStack Router route tree
  App.tsx
  main.tsx
```

Each feature folder follows this internal shape:

```
features/<domain>/
  components/
  hooks/
  store.ts        ← zustand slice (if needed)
  api.ts          ← TanStack Query query/mutation definitions
  schemas.ts      ← zod schemas
  types.ts        ← TypeScript types derived from schemas
```

## API Integration

Full API spec lives in `api_client_context.md` at the project root. Key points:

### Auth
- Laravel Sanctum — token-based. Send `Authorization: Bearer <token>` on every authenticated request.
- Token returned on login/register, stored client-side (Zustand + persisted to localStorage or cookie).
- Two roles: `player` (default, can read all + hunter actions) and `admin` (write operations on catalog entities).

### Base URL
Laravel routes live under the `/api` prefix (e.g. `/api/auth/login`). Set the env var to `/api` for local dev — the Vite proxy forwards `/api/*` to the backend without rewriting the path:
```
VITE_API_BASE_URL=/api
```
The API client (`src/shared/lib/apiClient.ts`) reads `import.meta.env.VITE_API_BASE_URL`. For production, point this at the full backend origin (e.g. `https://api.example.com/api`).

### Response shape
- Single resource: `{ data: { ...fields } }`
- Collection (paginated): `{ data: [...], links: { first, last, prev, next }, meta: { current_page, last_page, per_page, total } }`
- All IDs are UUIDs. Timestamps are camelCase (`createdAt`, `updatedAt`).
- Relationships are only present when eager-loaded by the backend (expect them on `show`, not `index`).

### Key constraints
- Equipment `type` is immutable after creation.
- Equipping an item requires it to be in the hunter's inventory first (craft → equip).
- Quest `hunterIds` must all belong to the given campaign.
- Material and map names are globally unique.
- All deletes are soft deletes.
- Monster `stars` range 1–7. Weakness scales are 0–3 (0 = none, 3 = extreme).

### Enums (use these exact strings)
- **WeaponClass:** `Bow`, `Great Sword`, `Dual Blades`, `Long Sword`, `Sword and Shield`, `Hammer`, `Lance`, `Gun Lance`, `Switch Axe`, `Charge Blade`, `Insect Glaive`, `Light Bowgun`, `Heavy Bowgun`, `Hunting Horn`
- **ElementalType:** `Fire`, `Water`, `Thunder`, `Ice`, `Dragon`, `None`
- **EquipmentType:** `helmet`, `vest`, `trouser`
- **QuestOutcome:** `success`, `failure`, `abandoned`
- **AilmentType:** `Poison`, `Paralysis`, `Sleep`, `Stun`, `Blast`

## Design System

Inspired by Monster Hunter World's UI aesthetic:

- **Dark, atmospheric backgrounds** — near-black with warm charcoal surfaces
- **Gold / amber accents** — primary interactive color, borders, highlights
- **Earthy tones** — warm browns and tans for surfaces and cards
- **Danger red** — monster stars, quest failures, destructive actions
- **Cream / off-white text** — readable against dark surfaces

### Tailwind color tokens (extend in `tailwind.config.ts`)
```
background:  #111008   (near-black, warm tint)
surface:     #1e1a10   (card backgrounds)
surface-alt: #2a2416   (raised surfaces)
gold:        #c8952a   (primary accent)
gold-light:  #e8b84b   (hover / highlight)
ember:       #8b1a1a   (danger / failure)
cream:       #f0e3c0   (primary text)
muted:       #8a7a5a   (secondary text)
```

Use `tailwind-variants` (tv()) for all conditional/variant styling — never inline ternaries in className.

## Code Conventions

### General
- Strict TypeScript — no `any`, no type assertions unless unavoidable
- Named exports only — no default exports except for route components and pages
- No barrel `index.ts` re-exports inside feature folders; import directly from the file
- No class components

### Components
- One component per file; file name matches component name (PascalCase)
- Use `tailwind-variants` (tv()) for conditional/variant styling — no inline ternaries in className
- Props interfaces defined in the same file, named `<ComponentName>Props`

### Forms
- All forms use React Hook Form + Zod (`zodResolver`)
- Schema defined in the feature's `schemas.ts`; infer the TS type with `z.infer`

### Data Fetching
- All server state via TanStack Query — no raw `fetch` in components
- Query/mutation definitions live in `features/<domain>/api.ts`
- No Zustand for server state — Zustand is for client-only UI state

### Zustand
- One store slice per feature when needed; compose in `src/shared/lib/store.ts`
- Use slices pattern — do not put everything in a single flat store

### Routing
- File-based routes under `src/routes/`
- Loaders use TanStack Query's `queryClient.ensureQueryData` for prefetching
- Route params and search params must be typed via TanStack Router's schema

### Testing
- Unit tests co-located next to the file they test (`*.test.ts`)
- Use Vitest + React Testing Library for component tests
- Mock the API layer, not Zustand or React Query internals

## Commands

See `Makefile` for all runnable commands. Use `make <target>`.

```
make dev          # start dev server
make build        # type-check + build
make preview      # preview production build
make lint         # run eslint
make format       # run prettier
make type-check   # tsc --noEmit only
make test         # run vitest (watch mode)
make test-run     # run vitest once (CI)
make test-ui      # run vitest with browser UI
```
