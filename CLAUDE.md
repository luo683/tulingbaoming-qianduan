# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

图灵学社 (Turing Society) — university CS club website. VitePress static site with custom Vue 3 theme, TypeScript, GSAP animations. All dynamic data fetched from backend REST API (`http://localhost:8080/api/*`). The `tulin/` directory contains the Spring Boot backend.

## Commands

```
npm run dev       # Start dev server (hot reload, default :5173)
npm run build     # Production build to .vitepress/dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Architecture

### Data layer — all from REST API

All data is fetched from the Spring Boot backend at `:8080`. JSON files in `data/` and `import.meta.glob` in `posts.ts` are **fallbacks only** — each component calls `fetch()` in `onMounted`, handles loading/error states, and falls back to localStorage if the API is unreachable.

Pattern every component follows:
```ts
const loading = ref(true)
const error = ref(false)
async function loadData() {
  try {
    const res = await fetch('http://localhost:8080/api/xxx')
    data.value = await res.json()
  } catch { error.value = true }
  finally { loading.value = false }
}
onMounted(loadData)
```

### Auth system

- `auth.ts` — shared auth state (`useAuth()`). Uses `ref<User | null>` at module level so **all components share the same state**. SSR-safe (`typeof window` check).
- `UserMenu.vue` — top-right nav bar login button / avatar dropdown. `position: fixed; z-index: 30` on the right side of the nav bar.
- `LoginModal.vue` — Teleport-to-body modal for login/register/change-password. Opened via `(window as any).__openLogin?.()`.
- **Content restrictions**: see the access control table below.

### Build-time vs runtime

1. **Build-time** (`.vitepress/config.mts`) — parses blog `*.md` frontmatter via Node `fs` for sidebar generation, auto-generates `search/index.md` that aggregates all site data into a single page for VitePress local search indexing.
2. **Runtime** — all components fetch from the backend API. `.vitepress/theme/posts.ts` is a static fallback.

### Theme layer

`.vitepress/theme/index.ts` registers all components globally via `enhanceApp`. `.vitepress/theme/Layout.vue` wraps VitePress default Layout with: `ParticleBackground`, `UserMenu`, `BackToTop`, `CodeCopy`.

### Content pages

| Page | File | Data source |
|---|---|---|
| Home | `index.md` | `HomeHero`, `HomeStats`, `HomeFeatures`, `HomePosts` (API) |
| About | `about.md` | `AboutTimeline` (hardcoded timeline) |
| Teachers | `teachers/index.md` | `TeacherList` (API: `/api/teachers`, 82 from Excel) |
| Blog | `blog/index.md` | `BlogIndex` (API: `/api/blog/posts`) |
| Q&A | `qa/index.md` | `QaFAQ` + `AskQuestion` + `AiChat` (API: `/api/faqs`) |
| Events | `events/index.md` | `EventTimeline` (API: `/api/events`) |
| Resources | `resources/index.md` | `ResourceList` (API: `/api/resources`) |
| Members | `members/index.md` | `MemberList` (API: `/api/members`, 40 from Excel) |
| Projects | `projects/index.md` | `ProjectShowcase` (API: `/api/projects`) |
| Admin KB | `admin/knowledge.md` | `KnowledgeManager` (API: `/api/knowledge/`) |

### Authority access

| Action | Visitor | User | Admin |
|---|---|---|---|
| Browse pages, events, resources list | ✅ | ✅ | ✅ |
| Blog full content | ❌ 200-char preview | ✅ | ✅ |
| FAQ expand (beyond 1st) | ❌ | ✅ | ✅ |
| Download links / extract codes | ❌ lock overlay | ✅ | ✅ |
| Project links (GitHub) | ❌ | ✅ | ✅ |
| Event registration | ❌ | ✅ | ✅ |
| Post articles / ask questions / upload | ❌ → login modal | ✅ | ✅ |
| Admin knowledge base (/admin/knowledge) | ❌ | ❌ | ✅ |

Guards are at the component action level (`auth.isLoggedIn.value` check at function entry).

### Key components

| Component | Role |
|---|---|
| `ParticleBackground.vue` | Canvas particle animation with theme-aware colors (dark=white, light=brand-color), particles + connection lines |
| `UserMenu.vue` | Login button / avatar dropdown in nav bar |
| `LoginModal.vue` | Login/register/change-password modal with BCrypt-backed API |
| `AiChat.vue` | SSE streaming AI chat to `POST /api/chat/stream` |
| `BlogIndex.vue` | Blog cards + tag filter + write modal + read modal with lock overlay |
| `MemberList.vue` | Department-grouped member cards (社长团 + 6 departments), collapsible "other members" |
| `TeacherList.vue` | Teacher large cards with avatar, quote, research, tags |
| `EventTimeline.vue` | Timeline + registration form (locked for visitors) |
| `ResourceList.vue` | Resource grid + category chips + download (locked for visitors) + likes |
| `QaFAQ.vue` | Accordion FAQ (first unlocked, rest locked for visitors) |
| `AskQuestion.vue` | Question submission + reply threads |
| `ProjectShowcase.vue` | Project cards with stats |
| `KnowledgeManager.vue` | Admin page: knowledge document CRUD + RAG search test |
| `BackToTop.vue` | Scroll-to-top FAB |
| `CodeCopy.vue` | Copy button on code blocks (always visible on touch devices) |
| `ParticleBackground.vue` | Floating particles with connecting lines, theme-aware colors |

### Styling

- Brand color: `#FC5531` (CSDN red/orange)
- Glassmorphism: `rgba(..., 0.55–0.82)` + `backdrop-filter: blur()` 
- Dark mode: VitePress `.dark` class, particle colors follow theme
- Global CSS: `custom.css` (breakpoints: 1280/768/480)
- **IMPORTANT**: Never put `backdrop-filter` on `.VPNav` — it creates a CSS stacking context that breaks the mobile hamburger menu. Use `.VPNavBar` instead.
- **IMPORTANT**: VitePress local search uses `.VPLocalSearchBox` selectors (not DocSearch), the search component is built-in, not Algolia

### Mobile responsive

Standardized 3-breakpoint system:
- `1280px` — TOC sidebar hidden
- `768px` — main layout breakpoint
- `480px` — phone fine-tuning

GSAP animations have `ScrollTrigger` with `toggleActions: 'play none none none'` (only play once on scroll-in).

### Data files (fallback only)

- `data/events.json`, `data/faqs.json`, `data/resources.json`, `data/teachers.json` — used as fallback when API unreachable
- `data/` files are NOT the primary data source since phase 2 migration
