import type { FormEvent } from 'react'
import type { LeaderboardEntry } from '../lib/api'
import { Leaderboard } from './Leaderboard'

interface HomeScreenProps {
  name: string
  onNameChange: (name: string) => void
  onStart: () => void
  leaderboard: LeaderboardEntry[]
  boardStatus: 'loading' | 'ready' | 'error'
}

export function HomeScreen({
  name,
  onNameChange,
  onStart,
  leaderboard,
  boardStatus,
}: HomeScreenProps) {
  const canStart = name.trim().length > 0

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (canStart) onStart()
  }

  return (
    <div className="home">
      <div className="home-main">
        <h1 className="home-title">Note Flashcards</h1>
        <p className="home-tagline">How many notes can you name in 60 seconds?</p>
        <form className="home-form" onSubmit={handleSubmit}>
          <input
            className="home-input"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="go"
            aria-label="Your name"
          />
          <button className="home-go" type="submit" disabled={!canStart}>
            Go
          </button>
        </form>
      </div>

      <section className="board-section">
        <h2 className="board-title">Leaderboard</h2>
        {boardStatus === 'loading' && <p className="board-empty">Loading…</p>}
        {boardStatus === 'error' && (
          <p className="board-empty">Couldn’t load the leaderboard.</p>
        )}
        {boardStatus === 'ready' && <Leaderboard entries={leaderboard} />}
      </section>
    </div>
  )
}
