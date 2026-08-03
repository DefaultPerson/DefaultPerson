import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(projectRoot, 'assets', 'source-icons')
const stackDir = join(projectRoot, 'assets', 'stack')
const inlineDir = join(projectRoot, 'assets', 'inline')

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"

// Plate colors per GitHub theme. Stack cards ship in both variants and are
// picked in the README through <picture> + prefers-color-scheme.
const THEMES = {
  dark: { plate: '#161b22', border: '#30363d', text: '#e6edf3' },
  light: { plate: '#f6f8fa', border: '#d0d7de', text: '#1f2328' },
}

// Muted gray that stays legible on both themes, so the small footer icons
// need only one variant instead of a <picture> each.
const INLINE_COLOR = '#7d8590'

// Accents are the official Simple Icons brand hex, except where the brand
// color is black or near-black and would vanish on the dark plate.
const stack = [
  { output: 'python', label: 'Python', file: 'simple-python.svg', accent: { light: '#3776ab', dark: '#4b8bbe' } },
  { output: 'go', label: 'Go', file: 'simple-go.svg', accent: { light: '#00add8', dark: '#00add8' } },
  { output: 'rust', label: 'Rust', file: 'simple-rust.svg', accent: { light: '#ce422b', dark: '#f74c00' } },
  { output: 'solana', label: 'Solana', file: 'simple-solana.svg', accent: { light: '#9945ff', dark: '#9945ff' } },
  { output: 'ethereum', label: 'Ethereum', file: 'simple-ethereum.svg', accent: { light: '#3c3c3d', dark: '#8a92b2' } },
  { output: 'postgresql', label: 'PostgreSQL', file: 'simple-postgresql.svg', accent: { light: '#4169e1', dark: '#6f8ff5' } },
  { output: 'redis', label: 'Redis', file: 'simple-redis.svg', accent: { light: '#ff4438', dark: '#ff4438' } },
  { output: 'docker', label: 'Docker', file: 'simple-docker.svg', accent: { light: '#2496ed', dark: '#2496ed' } },
  { output: 'claude-code', label: 'Claude Code', file: 'simple-claude.svg', accent: { light: '#d97757', dark: '#d97757' } },
]

const inlineIcons = [
  { output: 'telegram', label: 'Telegram', file: 'simple-telegram.svg' },
  { output: 'x', label: 'X', file: 'simple-x.svg' },
  { output: 'github', label: 'GitHub', file: 'simple-github.svg' },
]

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

// Character width is a per-metric constant: a single shared value misfits
// labels rendered at different font sizes and weights.
const measure = (label, { charWidth, padding, minWidth }) =>
  Math.max(minWidth, Math.ceil(label.length * charWidth + padding))

async function svgIcon(file, color, { x: iconX, y: iconY, size }) {
  const source = await readFile(join(sourceDir, file), 'utf8')
  const rootMatch = source.match(/<svg([^>]*)>/)
  const viewBoxMatch = source.match(/viewBox="([^"]+)"/)
  const bodyMatch = source.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)

  if (!rootMatch || !viewBoxMatch || !bodyMatch) {
    throw new Error(`Could not parse SVG source: ${file}`)
  }

  const rootAttrs = rootMatch[1]
  const [minX, minY, width, height] = viewBoxMatch[1].split(/\s+/).map(Number)
  const body = bodyMatch[1]
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replaceAll('currentColor', color)

  // Outline sets (Lucide and friends) carry stroke-width/linecap/linejoin on
  // the root <svg>; dropping them renders every icon at the default 1px.
  const carried = ['stroke-width', 'stroke-linecap', 'stroke-linejoin']
    .map((name) => {
      const match = rootAttrs.match(new RegExp(`${name}="([^"]+)"`))
      return match ? ` ${name}="${match[1]}"` : ''
    })
    .join('')

  const outlined = /stroke="currentColor"/.test(rootAttrs)
  const paint = outlined
    ? `fill="none" stroke="${color}" color="${color}"${carried}`
    : `fill="${color}" color="${color}"`

  const scale = Math.min(size / width, size / height)
  const x = iconX + (size - width * scale) / 2
  const y = iconY + (size - height * scale) / 2

  return `<g transform="translate(${x} ${y}) scale(${scale}) translate(${-minX} ${-minY})" ${paint}>${body}</g>`
}

async function renderStack(item, themeName) {
  const theme = THEMES[themeName]
  const width = measure(item.label, { charWidth: 6.8, padding: 43, minWidth: 66 })
  const icon = await svgIcon(item.file, item.accent[themeName], { x: 7, y: 6, size: 17 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="30" viewBox="0 0 ${width} 30" role="img" aria-label="${escapeXml(item.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="29" rx="7.5" fill="${theme.plate}" stroke="${theme.border}"/>`,
    icon,
    `<text x="31" y="19.2" fill="${theme.text}" font-family="${FONT}" font-size="12" font-weight="650">${escapeXml(item.label)}</text>`,
    '</svg>',
  ].join('')
}

async function renderInline(item) {
  const icon = await svgIcon(item.file, INLINE_COLOR, { x: 0, y: 0, size: 16 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="${escapeXml(item.label)}">`,
    icon,
    '</svg>',
  ].join('')
}

await mkdir(stackDir, { recursive: true })
await mkdir(inlineDir, { recursive: true })

let stackFiles = 0
for (const item of stack) {
  for (const themeName of Object.keys(THEMES)) {
    await writeFile(join(stackDir, `${item.output}-${themeName}.svg`), await renderStack(item, themeName))
    stackFiles += 1
  }
}

for (const item of inlineIcons) {
  await writeFile(join(inlineDir, `${item.output}.svg`), await renderInline(item))
}

console.log(`Generated ${stackFiles} stack cards and ${inlineIcons.length} inline icons.`)
