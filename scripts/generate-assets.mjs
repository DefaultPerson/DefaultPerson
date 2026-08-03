import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(projectRoot, 'assets', 'source-icons')
const buttonsDir = join(projectRoot, 'assets', 'buttons')
const projectsDir = join(projectRoot, 'assets', 'projects')

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"

// Plate colors per GitHub theme. Project cards ship in both variants and are
// selected in the README through <picture> + prefers-color-scheme.
const THEMES = {
  dark: { plate: '#161b22', border: '#30363d', text: '#e6edf3' },
  light: { plate: '#f6f8fa', border: '#d0d7de', text: '#1f2328' },
}

// Social buttons keep their brand color, which reads on either theme, so they
// are generated once.
const buttons = [
  { output: 'telegram-main', label: 'Telegram', file: 'simple-telegram.svg', background: '#26a5e4' },
  { output: 'telegram-shitpost', label: 'Shitpost', file: 'simple-telegram.svg', background: '#7c3aed' },
  // The X wordmark is the logo, so a text label next to it would just repeat
  // itself; this one renders as a centered icon instead.
  { output: 'x', file: 'simple-x.svg', background: '#111111', border: '#30363d', iconOnly: true },
  { output: 'github-repos', label: 'Repos', file: 'simple-github.svg', background: '#24292f', border: '#30363d' },
]

const projects = [
  {
    output: 'hydra-monitors',
    label: 'Hydra Monitors',
    file: 'lucide-radar.svg',
    accent: { dark: '#2dd4bf', light: '#0d9488' },
  },
  {
    output: 'web3-aggregator',
    label: 'Web3 Aggregator',
    file: 'lucide-rss.svg',
    accent: { dark: '#f59e0b', light: '#b45309' },
  },
]

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

// Character width is per-metric rather than hardcoded: the label font differs
// between buttons and project cards, and a shared constant misfits both.
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

  // Lucide carries stroke-width/linecap/linejoin on the root <svg>; dropping
  // them renders every outline icon at the default 1px and visibly too thin.
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

async function renderButton(button) {
  const iconOnly = button.iconOnly === true
  const width = iconOnly
    ? 34
    : measure(button.label, { charWidth: 6.4, padding: 40, minWidth: 48 })
  const iconX = iconOnly ? (width - 16) / 2 : 7
  const icon = await svgIcon(button.file, '#ffffff', { x: iconX, y: 6, size: 16 })
  const ariaLabel = escapeXml(button.label ?? button.output)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28" role="img" aria-label="${ariaLabel}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="27" rx="7" fill="${button.background}" stroke="${button.border ?? button.background}"/>`,
    icon,
    iconOnly
      ? ''
      : `<text x="29" y="18.2" fill="#ffffff" font-family="${FONT}" font-size="11" font-weight="700">${escapeXml(button.label)}</text>`,
    '</svg>',
  ].join('')
}

async function renderProject(project, themeName) {
  const theme = THEMES[themeName]
  const width = measure(project.label, { charWidth: 6.8, padding: 43, minWidth: 82 })
  const icon = await svgIcon(project.file, project.accent[themeName], { x: 7, y: 6, size: 17 })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="30" viewBox="0 0 ${width} 30" role="img" aria-label="${escapeXml(project.label)}">`,
    `<rect x=".5" y=".5" width="${width - 1}" height="29" rx="7.5" fill="${theme.plate}" stroke="${theme.border}"/>`,
    icon,
    `<text x="31" y="19.2" fill="${theme.text}" font-family="${FONT}" font-size="12" font-weight="650">${escapeXml(project.label)}</text>`,
    '</svg>',
  ].join('')
}

await mkdir(buttonsDir, { recursive: true })
await mkdir(projectsDir, { recursive: true })

for (const button of buttons) {
  await writeFile(join(buttonsDir, `${button.output}.svg`), await renderButton(button))
}

let projectFiles = 0
for (const project of projects) {
  for (const themeName of Object.keys(THEMES)) {
    await writeFile(
      join(projectsDir, `${project.output}-${themeName}.svg`),
      await renderProject(project, themeName),
    )
    projectFiles += 1
  }
}

console.log(`Generated ${buttons.length} buttons and ${projectFiles} project cards.`)
