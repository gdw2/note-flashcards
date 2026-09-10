import type { Letter } from '../lib/notes'

interface AnswerButtonsProps {
  choices: Letter[]
  wrongGuesses: Letter[]
  onSelect: (letter: Letter) => void
}

export function AnswerButtons({ choices, wrongGuesses, onSelect }: AnswerButtonsProps) {
  return (
    <div className="choices">
      {choices.map((letter) => {
        const isWrong = wrongGuesses.includes(letter)

        return (
          <button
            key={letter}
            type="button"
            className={`choice ${isWrong ? 'is-wrong' : ''}`}
            disabled={isWrong}
            onClick={() => onSelect(letter)}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}
