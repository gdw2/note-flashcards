import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { GameScreen } from './components/GameScreen'
import { HomeScreen } from './components/HomeScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { TimeBar } from './components/TimeBar'
import {
  fetchLeaderboard,
  submitScore,
  type LeaderboardEntry,
} from './lib/api'
import { makeQuestion, type Letter, type Question } from './lib/notes'
import './App.css'

const GAME_DURATION_MS = 60_000

type Screen = 'home' | 'playing' | 'results'
type BoardStatus = 'loading' | 'ready' | 'error'
type SubmitStatus = 'submitting' | 'done' | 'error'

function celebrate() {
  const shared = {
    particleCount: 70,
    spread: 70,
    startVelocity: 45,
    ticks: 200,
    gravity: 1,
    scalar: 1,
  }
  confetti({ ...shared, angle: 60, origin: { x: 0.1, y: 0.1 } })
  confetti({ ...shared, angle: 120, origin: { x: 0.9, y: 0.1 } })
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [playerName, setPlayerName] = useState('')
  const [question, setQuestion] = useState<Question>(() => makeQuestion())
  const [wrongGuesses, setWrongGuesses] = useState<Letter[]>([])
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [boardStatus, setBoardStatus] = useState<BoardStatus>('loading')
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('submitting')

  const startTimeRef = useRef(0)
  const advancingRef = useRef(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    advancingRef.current = false
  }, [question])

  useEffect(() => {
    if (screen !== 'home') return
    let cancelled = false
    setBoardStatus('loading')
    fetchLeaderboard()
      .then((entries) => {
        if (cancelled) return
        setLeaderboard(entries)
        setBoardStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setBoardStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [screen])

  useEffect(() => {
    if (screen !== 'playing') return
    const tick = () => {
      const remaining = Math.max(
        0,
        GAME_DURATION_MS - (Date.now() - startTimeRef.current),
      )
      setRemainingMs(remaining)
      if (remaining <= 0) setScreen('results')
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [screen])

  const submit = useCallback(() => {
    const accuracy = attempts === 0 ? 100 : Math.round((score / attempts) * 100)
    setSubmitStatus('submitting')
    submitScore(playerName, score, accuracy)
      .then((entries) => {
        setLeaderboard(entries)
        setSubmitStatus('done')
      })
      .catch(() => setSubmitStatus('error'))
  }, [playerName, score, attempts])

  useEffect(() => {
    if (screen !== 'results' || submittedRef.current) return
    submittedRef.current = true
    submit()
  }, [screen, submit])

  const startGame = useCallback(() => {
    const name = playerName.trim()
    if (!name) return
    setPlayerName(name)
    setScore(0)
    setAttempts(0)
    setWrongGuesses([])
    setQuestion(makeQuestion())
    setRemainingMs(GAME_DURATION_MS)
    setSubmitStatus('submitting')
    submittedRef.current = false
    advancingRef.current = false
    startTimeRef.current = Date.now()
    setScreen('playing')
  }, [playerName])

  const handleSelect = useCallback(
    (letter: Letter) => {
      if (advancingRef.current) return
      setAttempts((value) => value + 1)
      if (letter === question.correct) {
        advancingRef.current = true
        celebrate()
        setScore((value) => value + 1)
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

  const goHome = useCallback(() => {
    setLeaderboard([])
    setBoardStatus('loading')
    setScreen('home')
  }, [])

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          name={playerName}
          onNameChange={setPlayerName}
          onStart={startGame}
          leaderboard={leaderboard}
          boardStatus={boardStatus}
        />
      )}

      {screen === 'playing' && (
        <GameScreen
          score={score}
          remainingMs={remainingMs}
          note={question.note}
          choices={question.choices}
          wrongGuesses={wrongGuesses}
          onSelect={handleSelect}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          name={playerName}
          score={score}
          leaderboard={leaderboard}
          status={submitStatus}
          onRetry={submit}
          onPlayAgain={startGame}
          onHome={goHome}
        />
      )}

      {screen === 'playing' && (
        <TimeBar fraction={remainingMs / GAME_DURATION_MS} />
      )}
    </div>
  )
}
