import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

async function loadEnvModule() {
  vi.resetModules()
  return import('@/lib/env')
}

describe('lib/env', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.restoreAllMocks()
  })

  it('parses successfully with valid required environment variables', async () => {
    process.env.DATABASE_URL = 'sqlite://test.db'
    process.env.PAYLOAD_SECRET = 'x'.repeat(32)
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example.com'

    const { env } = await loadEnvModule()

    expect(env.DATABASE_URL).toBe('sqlite://test.db')
    expect(env.PAYLOAD_SECRET).toBe('x'.repeat(32))
    expect(env.NEXT_PUBLIC_SERVER_URL).toBe('https://example.com')
  })

  it('throws when DATABASE_URL is missing', async () => {
    process.env.PAYLOAD_SECRET = 'x'.repeat(32)
    Reflect.deleteProperty(process.env, 'DATABASE_URL')

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(loadEnvModule()).rejects.toThrow('Invalid environment variables')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('throws when PAYLOAD_SECRET is shorter than 32 characters', async () => {
    process.env.DATABASE_URL = 'sqlite://test.db'
    process.env.PAYLOAD_SECRET = 'short-secret'

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(loadEnvModule()).rejects.toThrow('Invalid environment variables')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('throws when NEXT_PUBLIC_SERVER_URL is malformed', async () => {
    process.env.DATABASE_URL = 'sqlite://test.db'
    process.env.PAYLOAD_SECRET = 'x'.repeat(32)
    process.env.NEXT_PUBLIC_SERVER_URL = 'not-a-url'

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(loadEnvModule()).rejects.toThrow('Invalid environment variables')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('throws when optional stripe keys are provided with invalid prefixes', async () => {
    process.env.DATABASE_URL = 'sqlite://test.db'
    process.env.PAYLOAD_SECRET = 'x'.repeat(32)
    process.env.STRIPE_SECRET_KEY = 'pk_not_allowed_here'
    process.env.STRIPE_WEBHOOK_SECRET = 'bad-webhook-secret'

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(loadEnvModule()).rejects.toThrow('Invalid environment variables')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
