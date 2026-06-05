# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project overview

图灵学社 (Turing Society) — university CS club website. VitePress static site with custom Vue 3 theme, written in TypeScript.

## Commands

```
npm run dev       # Start dev server (hot reload)
npm run build     # Production build to .vitepress/dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Architecture

### Build-time vs runtime data

Blog post metadata is scanned at **two levels**:

1. **Build-time** (`.vitepress/config.mts`) — parses frontmatter from `blog/*.md` via Node `fs` to generate the sidebar (tag index, recent posts, archive). This runs once at build/dev-start.
2. **Runtime** (`.vitepress/theme/posts.ts`) — uses `import.meta.glob` with `?raw` to eagerly load all `blog/*.md` content for client-side rendering (BlogIndex, HomePosts, RelatedPosts).

Both files contain a nearly-identical custom YAML-like frontmatter parser. If you modify the frontmatter format, update both.

### Theme layer

`.vitepress/theme/index.ts` registers all custom components globally via `enhanceApp`. `.vitepress/theme/Layout.vue` wraps VitePress's default `Layout` with three permanent UI overlays: `ParticleBackground`, `BackToTop`, `CodeCopy` — these appear on every page automatically. All other components (`HomeHero`, `BlogIndex`, `QaFAQ`, etc.) are used manually in markdown files via `<script setup>` imports.

### Content pages

Each page is a standalone `.md` file that imports its own data and Vue components via `<script setup>`:

- `index.md` — home page with `HomeHero`, `HomeStats`, `HomeFeatures`, `HomePosts`
- `blog/index.md` — blog listing with tag filtering, plus user post submission modal (posts stored in `localStorage` under `turing-submitted-posts`)
- `qa/index.md` — FAQ accordion + comment widget; FAQ data defined inline as a JS array
- `events/index.md` — event timeline; event data defined inline, sorted with `status: 'open' | 'soon' | 'past'`
- `resources/index.md` — resource grid; resource metadata defined inline with categories
- `about.md` — static about page using plain HTML/CSS timeline and member cards

### Styling

- Brand color: CSDN red/orange (`#FC5531`)
- Glassmorphism: semi-transparent backgrounds (`rgba(..., 0.55–0.82)`) with `backdrop-filter: blur()` to show the particle canvas underneath
- Dark mode: darker backgrounds with same brand color, handled via VitePress's `.dark` class
- Custom CSS live in `.vitepress/theme/custom.css` (global) and component `<style scoped>` blocks

### Key components

| Component | Role |
|---|---|
| `ParticleBackground.vue` | Full-screen canvas particle animation behind everything |
| `BackToTop.vue` | Scroll-to-top FAB |
| `CodeCopy.vue` | Adds copy button to code blocks |
| `BlogIndex.vue` | Blog list with tag filtering, inline markdown editor for user-submitted posts |
| `BlogComment.vue` | CSDN-style comment section (likely external embed) |
| `EventTimeline.vue` | Timeline display with status badges |
| `RelatedPosts.vue` | Shows related posts by tag overlap |
| `FadeInSection.vue` | Scroll-triggered fade-in wrapper |
