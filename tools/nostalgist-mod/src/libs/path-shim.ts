// Minimal POSIX path helpers (replaces path-browserify, which Nostalgist only uses for these).
function normalize(input: string) {
  const absolute = input.startsWith('/')
  const parts: string[] = []
  for (const part of input.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (parts.length && parts.at(-1) !== '..') parts.pop()
      else if (!absolute) parts.push('..')
    } else {
      parts.push(part)
    }
  }
  const joined = parts.join('/')
  return (absolute ? '/' : '') + joined || (absolute ? '/' : '.')
}
function join(...segments: string[]) {
  const filtered = segments.filter((s) => typeof s === 'string' && s.length > 0)
  return filtered.length ? normalize(filtered.join('/')) : '.'
}
function dirname(p: string) {
  const index = p.replace(/\/+$/, '').lastIndexOf('/')
  if (index < 0) return '.'
  if (index === 0) return '/'
  return p.slice(0, index)
}
function basename(p: string, ext?: string) {
  const base = p.replace(/\/+$/, '').split('/').pop() || ''
  return ext && base.endsWith(ext) && base !== ext ? base.slice(0, -ext.length) : base
}
function extname(p: string) {
  const base = basename(p)
  const index = base.lastIndexOf('.')
  return index <= 0 ? '' : base.slice(index)
}
function parse(p: string) {
  const root = p.startsWith('/') ? '/' : ''
  const base = basename(p)
  const ext = extname(p)
  const dir = p.includes('/') ? dirname(p) : ''
  return { base, dir, ext, name: ext ? base.slice(0, -ext.length) : base, root }
}
export default { basename, dirname, extname, join, normalize, parse, sep: '/' }
