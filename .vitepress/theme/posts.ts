import { parseFrontmatter } from './utils'

export interface Post {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  url: string
  readingTime: number
}

// Use ?raw without import:'default' to avoid VitePress dev-mode glob issues
const rawModules = import.meta.glob('../../blog/*.md', {
  eager: true,
  query: '?raw',
})

export const posts: Post[] = Object.entries(rawModules)
  .filter(([path]) => !path.includes('/blog/index'))
  .map(([path, mod]) => {
    // In build mode: mod is string; in dev mode with ?raw: mod is { default: string }
    const raw = typeof mod === 'string' ? mod : (mod as any).default || ''
    const fm = parseFrontmatter(raw)
    const slug = path.replace(/.*\/blog\//, '').replace(/\.md$/, '')
    const content = raw.replace(/^---[\s\S]*?---/, '').replace(/[#*\->`|~\s]/g, '')
    const readingTime = Math.max(1, Math.round(content.length / 400))
    return {
      title: fm.title || slug,
      description: fm.description || '',
      date: fm.date || '',
      author: fm.author || '',
      tags: fm.tags || [],
      url: `/blog/${slug}`,
      readingTime,
    }
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())