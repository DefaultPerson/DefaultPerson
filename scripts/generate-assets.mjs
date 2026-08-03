import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(projectRoot, 'assets', 'source-icons')
const inlineDir = join(projectRoot, 'assets', 'inline')

// Muted gray that stays legible on both GitHub themes, so each footer icon
// needs only one variant instead of a <picture> pair.
const INLINE_COLOR = '#7d8590'

// Every icon fills the same box. An earlier optical correction shrank the
// round marks, but the resulting size difference was visible next to the X
// wordmark, so matching boxes win over optical balance here.
const inlineIcons = [
  { output: 'telegram', label: 'Telegram', file: 'simple-telegram.svg' },
  { output: 'x', label: 'X', file: 'simple-x.svg' },
]

const INLINE_BOX = 16

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

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

async function renderInline(item) {
  const glyph = INLINE_BOX * (item.scale ?? 1)
  const offset = (INLINE_BOX - glyph) / 2
  const icon = await svgIcon(item.file, INLINE_COLOR, { x: offset, y: offset, size: glyph })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${INLINE_BOX}" height="${INLINE_BOX}" viewBox="0 0 ${INLINE_BOX} ${INLINE_BOX}" role="img" aria-label="${escapeXml(item.label)}">`,
    icon,
    '</svg>',
  ].join('')
}

await mkdir(inlineDir, { recursive: true })

for (const item of inlineIcons) {
  await writeFile(join(inlineDir, `${item.output}.svg`), await renderInline(item))
}

console.log(`Generated ${inlineIcons.length} inline icons.`)
