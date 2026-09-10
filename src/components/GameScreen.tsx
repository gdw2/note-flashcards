import type { Letter, Note } from '../lib/notes'
import { AnswerButtons } from './AnswerButtons'
import { Staff } from './Staff'

interface GameScreenProps {
  score: number
  remainingMs: number
  note: Note
  choices: Letter[]
  wrongGuesses: Letter[]
  onSelect: (letter: Letter) => void
}

export function GameScreen({
  score,
  remainingMs,
  note,
  choices,
  wrongGuesses,
  onSelect,
}: GameScreenProps) {
  return (
    <div className="game">
      <header className="game-header">
        <span className="game-score">{score}</span>
        <span className="game-time">{Math.ceil(remainingMs / 1000)}s</span>
      </header>

      <div className="staff-card">
        <Staff note={note} />
      </div>

      <footer className="footer">
        <AnswerButtons
          choices={choices}
          wrongGuesses={wrongGuesses}
          onSelect={onSelect}
        />
      </footer>
    </div>
  )
}
