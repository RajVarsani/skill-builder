import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { domToPng } from 'modern-screenshot'
import { OGImageCard, type OGImageCardProps } from '../components/og/OGImageCard'

export type { OGImageCardProps }

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

  const root = createRoot(container)
  flushSync(() => {
    root.render(createElement(OGImageCard, props))
  })

  await document.fonts.ready
  await new Promise<void>((r) => setTimeout(() => r(), 200))

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
