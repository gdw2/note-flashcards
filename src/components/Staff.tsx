import { useEffect, useRef } from 'react'
import { Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'
import { noteToKey, type Note } from '../lib/notes'

interface StaffProps {
  note: Note
}

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 240
const STAVE_X = 20
const STAVE_WIDTH = 280
const TREBLE_Y = 20
const BASS_Y = 100
const NOTE_GAP = 34

const CROP_X = 12
const CROP_WIDTH = 132
const CROP_HEIGHT = 184
const TOP_OVERHANG = 26
const BOTTOM_OVERHANG = 30

export function Staff({ note }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT)
    const context = renderer.getContext()

    const trebleStave = new Stave(STAVE_X, TREBLE_Y, STAVE_WIDTH)
    trebleStave.addClef('treble').setContext(context).draw()

    const bassStave = new Stave(STAVE_X, BASS_Y, STAVE_WIDTH)
    bassStave.addClef('bass').setContext(context).draw()

    const noteStave = note.clef === 'treble' ? trebleStave : bassStave

    const staveNote = new StaveNote({
      clef: note.clef,
      keys: [noteToKey(note)],
      duration: 'q',
      autoStem: true,
    })

    const voice = new Voice({ numBeats: 1, beatValue: 4 })
    voice.addTickables([staveNote])

    new Formatter().joinVoices([voice]).format([voice], 0)

    const tickContext = staveNote.getTickContext()
    if (tickContext) {
      tickContext.setX(NOTE_GAP)
    }

    voice.draw(context, noteStave)

    const top = trebleStave.getYForLine(0) - TOP_OVERHANG
    const bottom = bassStave.getYForLine(4) + BOTTOM_OVERHANG
    const cropY = (top + bottom) / 2 - CROP_HEIGHT / 2

    const svg = container.querySelector('svg')
    svg?.setAttribute(
      'viewBox',
      `${CROP_X} ${cropY} ${CROP_WIDTH} ${CROP_HEIGHT}`,
    )
    svg?.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    return () => {
      container.innerHTML = ''
    }
  }, [note])

  return <div ref={containerRef} className="staff" aria-label="Music staff" />
}
