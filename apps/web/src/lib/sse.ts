type SSEHandler = (event: string, data: string) => void

// Use direct backend URL for SSE to bypass Vercel's rewrite proxy (which buffers responses)
const SSE_BASE = import.meta.env.VITE_API_URL || '/api'

export function connectSSE(
  conversationId: string,
  message: string,
  onEvent: SSEHandler,
  onDone: () => void,
  onError: (error: Error) => void
): AbortController {
  const controller = new AbortController()
  const token = localStorage.getItem('token')

  fetch(`${SSE_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: message }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`SSE error: ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Flush any remaining buffered event
          if (buffer.trim()) {
            const lines = (buffer + '\n\n').split('\n')
            let currentEvent = ''
            let currentData = ''
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim()
              } else if (line.startsWith('data: ')) {
                currentData = line.slice(6)
              } else if (line === '' && currentEvent && currentData) {
                onEvent(currentEvent, currentData)
                currentEvent = ''
                currentData = ''
              }
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            if (currentEvent && currentData) {
              onEvent(currentEvent, currentData)
            }
            currentEvent = line.slice(7).trim()
            currentData = ''
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)
          } else if (line === '' && currentEvent && currentData) {
            onEvent(currentEvent, currentData)
            currentEvent = ''
            currentData = ''
          }
        }

        // Carry over unpaired event/data to next chunk
        if (currentEvent && currentData) {
          onEvent(currentEvent, currentData)
        } else if (currentEvent || currentData) {
          buffer = (currentEvent ? `event: ${currentEvent}\n` : '') +
                   (currentData ? `data: ${currentData}\n` : '') +
                   buffer
        }
      }

      onDone()
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err)
      }
    })

  return controller
}
