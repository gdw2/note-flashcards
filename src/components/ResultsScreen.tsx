import type { LeaderboardEntry } from '../lib/api'
import { Leaderboard } from './Leaderboard'

interface ResultsScreenProps {
  name: string
  score: number
  leaderboard: LeaderboardEntry[]
  status: 'submitting' | 'done' | 'error'
  onRetry: () => void
  onPlayAgain: () => void
  onHome: () => void
}

export function ResultsScreen({
  name,
  score,
  leaderboard,
  status,
  onRetry,
  onPlayAgain,
  onHome,
}: ResultsScreenProps) {
  return (
    <div className="results">
      <div className="results-main">
        <p className="results-label">Time’s up, {name}!</p>
        <p className="results-score">{score}</p>
        <p className="results-unit">
          {score === 1 ? 'note' : 'notes'} in 60 seconds
        </p>
        <div className="results-actions">
          <button className="home-go" type="button" onClick={onPlayAgain}>
            Play again
          </button>
          <button className="link-button" type="button" onClick={onHome}>
            Home
          </button>
        </div>
      </div>

      <section className="board-section">
        <h2 className="board-title">Leaderboard</h2>
        {status === 'submitting' && <p className="board-empty">Saving score…</p>}
        {status === 'error' && (
          <p className="board-empty">
            Couldn’t save your score.{' '}
            <button className="link-button" type="button" onClick={onRetry}>
              Retry
            </button>
          </p>
        )}
        {status === 'done' && (
          <Leaderboard entries={leaderboard} highlightName={name} />
        )}
      </section>
    </div>
  )
}
