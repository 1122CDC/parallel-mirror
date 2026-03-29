import { env } from '../config/env'

export interface AiCompletionOptions {
  systemInstruction: string
  prompt: string
  isJson?: boolean
}

export interface AiImageOptions {
  prompt: string
  size?: string
}

function stripJsonCodeFences(text: string) {
  return text.replace(/```json/gi, '').replace(/```/gi, '').trim()
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }

      if (part && typeof part === 'object') {
        const record = part as Record<string, unknown>
        const text = record.text ?? record.content ?? record.value
        return typeof text === 'string' ? text : ''
      }

      return ''
    })
    .join('')
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>
      const error = payload.error
      if (error && typeof error === 'object') {
        const message = (error as Record<string, unknown>).message
        if (typeof message === 'string' && message.trim()) {
          return message
        }
      }

      const message = payload.message
      if (typeof message === 'string' && message.trim()) {
        return message
      }
    } catch {
      // Ignore JSON parse failures and keep reading the text fallback.
    }
  }

  try {
    const text = await response.text()
    if (text.trim()) {
      return text.trim()
    }
  } catch {
    // Ignore secondary read failures.
  }

  return `AI request failed with ${response.status}`
}

async function readStreamText(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let streamedText = ''
  let finished = false

  const appendChunk = (chunk: string) => {
    if (chunk) {
      streamedText += chunk
    }
  }

  const processLine = (rawLine: string) => {
    const line = rawLine.replace(/\r$/, '')
    if (!line.startsWith('data:')) {
      return
    }

    const data = line.slice(5).replace(/^ /, '')
    if (!data) {
      return
    }

    if (data === '[DONE]') {
      finished = true
      return
    }

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{
          delta?: { content?: string }
          message?: { content?: unknown }
        }>
      }

      const choice = parsed.choices?.[0]
      const deltaContent = choice?.delta?.content
      if (typeof deltaContent === 'string') {
        appendChunk(deltaContent)
        return
      }

      const messageContent = choice?.message?.content
      const extracted = extractTextFromContent(messageContent)
      if (extracted) {
        appendChunk(extracted)
        return
      }
    } catch {
      appendChunk(data)
    }
  }

  try {
    while (!finished) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        processLine(line)
        if (finished) {
          break
        }
      }
    }

    if (!finished && buffer) {
      processLine(buffer)
    }

    const tail = decoder.decode()
    if (!finished && tail) {
      processLine(tail)
    }
  } finally {
    reader.releaseLock()
  }

  return streamedText.trim()
}

export async function callAiCompletion(options: AiCompletionOptions) {
  if (!env.deepseekApiKey) {
    throw new Error('Missing DEEPSEEK_API_KEY')
  }

  const baseUrl = normalizeBaseUrl(env.deepseekBaseUrl)
  const shouldStream = !options.isJson
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: shouldStream ? 'text/event-stream' : 'application/json',
        Authorization: `Bearer ${env.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: env.deepseekTextModel,
        messages: [
          { role: 'system', content: options.systemInstruction },
          { role: 'user', content: options.prompt },
        ],
        temperature: options.isJson ? 0.2 : 0.85,
        stream: shouldStream,
        ...(options.isJson ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        choices?: Array<{
          message?: { content?: unknown }
        }>
      }

      const content = payload.choices?.[0]?.message?.content
      const text = extractTextFromContent(content)
      if (!text) {
        throw new Error('AI response is empty')
      }

      return options.isJson ? stripJsonCodeFences(text) : text.trim()
    }

    if (!response.body) {
      throw new Error('AI response stream is empty')
    }

    const streamedText = await readStreamText(response.body)
    if (!streamedText) {
      throw new Error('AI response is empty')
    }

    return options.isJson ? stripJsonCodeFences(streamedText) : streamedText
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callAiImage(options: AiImageOptions) {
  if (!env.aiProxyApiKey) {
    throw new Error('Missing AI_PROXY_API_KEY')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs)
  const baseUrl = normalizeBaseUrl(env.aiProxyBaseUrl)

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.aiProxyApiKey}`,
      },
      body: JSON.stringify({
        model: env.aiImageModel,
        prompt: options.prompt,
        size: options.size ?? '1024x1024',
        n: 1,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }

    const payload = (await response.json()) as {
      data?: Array<{
        url?: unknown
        b64_json?: unknown
      }>
    }

    const firstImage = payload.data?.[0]
    const url = typeof firstImage?.url === 'string' ? firstImage.url.trim() : ''
    if (url) {
      return url
    }

    const b64Json = typeof firstImage?.b64_json === 'string' ? firstImage.b64_json.trim() : ''
    if (b64Json) {
      return `data:image/png;base64,${b64Json}`
    }

    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
