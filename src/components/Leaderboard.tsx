import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '../lib/api'
import { formatRelativeTime } from '../lib/time'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  highlightName?: string
}

export function Leaderboard({ entries, highlightName }: LeaderboardProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  if (entries.length === 0) {
    return <p className="board-empty">No scores yet. Be the first!</p>
  }

  return (
    <ol className="board">
      {entries.map((entry, index) => {
        const isYou = highlightName !== undefined && entry.name === highlightName
        return (
          <li
            key={`${entry.name}-${entry.score}-${entry.created_at}-${index}`}
            className={`board-row${isYou ? ' is-you' : ''}`}
          >
            <span className="board-rank">{index + 1}</span>
            <span className="board-main">
              <span className="board-name">
                {entry.name}
                {isYou ? <span className="board-you">you</span> : null}
              </span>
              <span className="board-time">
                {formatRelativeTime(entry.created_at)}
              </span>
            </span>
            <span className="board-score-block">
              <span className="board-score">{entry.score}</span>
              <span className="board-accuracy">{entry.accuracy ?? 100}%</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
