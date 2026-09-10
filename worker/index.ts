export interface Env {
  ASSETS: Fetcher
  DB: D1Database
}

interface ScoreRow {
  name: string
  score: number
  created_at: string
}

const MAX_NAME_LENGTH = 20
const MAX_SCORE = 500
const LEADERBOARD_SIZE = 10

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function sanitizeName(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const name = input
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
  return name.length > 0 ? name : null
}

async function topScores(db: D1Database): Promise<ScoreRow[]> {
  const { results } = await db
    .prepare(
      'SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?',
    )
    .bind(LEADERBOARD_SIZE)
    .all<ScoreRow>()
  return results ?? []
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return json({ leaderboard: await topScores(env.DB) })
    }

    if (url.pathname === '/api/scores' && request.method === 'POST') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return json({ error: 'invalid json' }, 400)
      }

      const payload = body as { name?: unknown; score?: unknown }
      const name = sanitizeName(payload.name)
      const score = Number(payload.score)

      if (!name) return json({ error: 'invalid name' }, 400)
      if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
        return json({ error: 'invalid score' }, 400)
      }

      await env.DB.prepare('INSERT INTO scores (name, score) VALUES (?, ?)')
        .bind(name, score)
        .run()

      return json({ leaderboard: await topScores(env.DB) }, 201)
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'not found' }, 404)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
