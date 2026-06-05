/**
 * 解析 Markdown 文件中的 YAML frontmatter
 * 供 config.mts 和 posts.ts 共用
 */
export function parseFrontmatter(raw: string): Record<string, any> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const fm: Record<string, any> = {}
  let currentKey = ''
  let inArray = false
  let arrayValues: string[] = []

  for (const line of match[1].split('\n')) {
    const arrMatch = line.match(/^\s{2}-\s+(.+)/)
    if (arrMatch && inArray) {
      arrayValues.push(arrMatch[1].trim())
      continue
    }
    if (inArray && currentKey) {
      fm[currentKey] = arrayValues
      inArray = false
      arrayValues = []
    }
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const val = kvMatch[2].trim()
      if (val === '') {
        inArray = true
        arrayValues = []
      } else {
        const strVal = val.replace(/^['"](.*)['"]$/, '$1')
        if (strVal.startsWith('[') && strVal.endsWith(']')) {
          fm[currentKey] = strVal.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^['"](.*)['"]$/, '$1'))
        } else {
          fm[currentKey] = strVal
        }
      }
    }
  }
  if (inArray && currentKey) {
    fm[currentKey] = arrayValues
  }
  return fm
}
