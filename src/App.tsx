import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnswerButtons } from './components/AnswerButtons'
import { Staff } from './components/Staff'
import { makeQuestion, type Letter, type Question } from './lib/notes'
import './App.css'

function celebrate() {
  const shared = {
    particleCount: 90,
    spread: 75,
    startVelocity: 45,
    ticks: 220,
    gravity: 1,
    scalar: 1.1,
  }
  confetti({ ...shared, angle: 60, origin: { x: 0.1, y: 0.1 } })
  confetti({ ...shared, angle: 120, origin: { x: 0.9, y: 0.1 } })
}

export default function App() {
  const [question, setQuestion] = useState<Question>(() => makeQuestion())
  const [wrongGuesses, setWrongGuesses] = useState<Letter[]>([])
  const advancingRef = useRef(false)

  useEffect(() => {
    advancingRef.current = false
  }, [question])

  const handleSelect = useCallback(
    (letter: Letter) => {
      if (letter === question.correct) {
        if (advancingRef.current) return
        advancingRef.current = true
        celebrate()
        setWrongGuesses([])
        setQuestion(makeQuestion())
        return
      }

      setWrongGuesses((prev) =>
        prev.includes(letter) ? prev : [...prev, letter],
      )
    },
    [question.correct],
  )

  return (
    <div className="app">
      <main className="stage">
        <div className="staff-card">
          <Staff note={question.note} />
        </div>
      </main>

      <footer className="footer">
        <AnswerButtons
          choices={question.choices}
          wrongGuesses={wrongGuesses}
          onSelect={handleSelect}
        />
      </footer>
    </div>
  )
}
