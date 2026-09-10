export interface LeaderboardEntry {
  name: string
  score: number
  created_at: string
}

interface LeaderboardResponse {
  leaderboard?: LeaderboardEntry[]
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch('/api/leaderboard')
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard (${response.status})`)
  }
  const data = (await response.json()) as LeaderboardResponse
  return data.leaderboard ?? []
}

export async function submitScore(
  name: string,
  score: number,
): Promise<LeaderboardEntry[]> {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, score }),
  })
  if (!response.ok) {
    throw new Error(`Failed to submit score (${response.status})`)
  }
  const data = (await response.json()) as LeaderboardResponse
  return data.leaderboard ?? []
}
