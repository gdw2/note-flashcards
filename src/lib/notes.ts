export type Clef = 'treble' | 'bass'
export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface Note {
  clef: Clef
  letter: Letter
  octave: number
}

export interface Question {
  note: Note
  choices: Letter[]
  correct: Letter
}

const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

function buildPool(
  clef: Clef,
  startOctave: number,
  endOctave: number,
  endLetter: Letter,
): Note[] {
  const notes: Note[] = []
  const endIndex = LETTERS.indexOf(endLetter)
  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let i = 0; i < LETTERS.length; i++) {
      if (octave === endOctave && i > endIndex) break
      notes.push({ clef, letter: LETTERS[i], octave })
    }
  }
  return notes
}

const TREBLE_NOTES = buildPool('treble', 4, 5, 'A')
const BASS_NOTES = buildPool('bass', 2, 4, 'C')
const ALL_NOTES = [...TREBLE_NOTES, ...BASS_NOTES]

export function noteToKey(note: Note): string {
  return `${note.letter.toLowerCase()}/${note.octave}`
}

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function makeQuestion(previous?: Note): Question {
  const pool = previous
    ? ALL_NOTES.filter((note) => noteToKey(note) !== noteToKey(previous))
    : ALL_NOTES
  const note = randomOf(pool)
  const correct = note.letter
  const distractors = shuffle(LETTERS.filter((letter) => letter !== correct)).slice(0, 2)
  const choices = shuffle([correct, ...distractors])
  return { note, choices, correct }
}
