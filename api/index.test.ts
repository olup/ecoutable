import { describe, it, expect, vi } from 'vitest'
import handler from './index'
import { EdgeTTS } from 'node-edge-tts'

vi.mock('node-edge-tts', () => ({
  EdgeTTS: vi.fn().mockImplementation(() => ({
    ttsPromise: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe('API Handler', () => {
  it('returns 400 if url is missing', async () => {
    const req = { query: {} }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await handler(req as any, res as any)
    
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'URL parameter is required' })
  })

  it('creates article in pending state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('mock markdown')
    })

    const req = { query: { url: 'test-url' } }
    const res = {
      json: vi.fn()
    }

    await handler(req as any, res as any)

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      articleId: expect.any(String)
    }))
  })
})
