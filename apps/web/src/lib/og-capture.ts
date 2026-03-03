import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { domToPng } from 'modern-screenshot'
import { OGImageCard, type OGImageCardProps } from '../components/og/OGImageCard'

export type { OGImageCardProps }

async function fetchFontAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  } catch {
    return null
  }
}

async function buildEmbeddedFontStyles(): Promise<string> {
  const fonts = [
    { family: 'JapanRamen', url: '/fonts/JapanRamen.otf', format: 'opentype' },
    { family: 'GeistPixel-Line', url: '/fonts/GeistPixel-Line.woff2', format: 'woff2' },
  ]

  const rules: string[] = []
  for (const font of fonts) {
    const b64 = await fetchFontAsBase64(font.url)
    if (b64) {
      rules.push(`@font-face {
  font-family: "${font.family}";
  src: url(data:font/${font.format};base64,${b64}) format("${font.format}");
  font-weight: 400;
  font-style: normal;
}`)
    }
  }
  return rules.join('\n')
}

export async function captureOGImage(props: OGImageCardProps): Promise<string> {
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '1200px',
    height: '630px',
    overflow: 'hidden',
    zIndex: '-1',
    pointerEvents: 'none',
  })
  document.body.appendChild(container)

  // Embed fonts as base64 inline styles so domToPng can serialize them
  const fontCss = await buildEmbeddedFontStyles()
  const styleEl = document.createElement('style')
  styleEl.textContent = fontCss
  container.appendChild(styleEl)

  const wrapper = document.createElement('div')
  container.appendChild(wrapper)

  const root = createRoot(wrapper)
  flushSync(() => {
    root.render(createElement(OGImageCard, props))
  })

  await document.fonts.ready
  await new Promise<void>((r) => setTimeout(() => r(), 300))

  const dataUrl = await domToPng(container, {
    width: 1200,
    height: 630,
    scale: 1,
    backgroundColor: '#2A2520',
  })

  root.unmount()
  container.remove()

  return dataUrl.replace(/^data:image\/png;base64,/, '')
}
