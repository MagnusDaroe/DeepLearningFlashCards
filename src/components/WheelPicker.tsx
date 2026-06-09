import { useEffect, useRef, useState } from 'react'
import type { Topic } from '../types'
import './WheelPicker.css'

interface Props {
  topics: Topic[]
  usedIds: Set<string>
  onSelect: (topic: Topic) => void
}

const MIN_SPINS = 5
const SPIN_DURATION = 3200 // ms
const SIZE = 900

export default function WheelPicker({ topics, usedIds, onSelect }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const spinRef = useRef(rotation)
  spinRef.current = rotation
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const segmentAngle = 360 / topics.length

  function availableCount(t: Topic) {
    return t.questions.filter(q => !usedIds.has(q.id)).length
  }

  // Canvas is always drawn at fixed angles — CSS transform handles the animation.
  // This avoids double-rotation and lets text rendering stay in a predictable frame.
  useEffect(() => {
    drawWheel()
  }, [topics, usedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  function drawWheel() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cx = SIZE / 2
    const cy = SIZE / 2
    const r = SIZE / 2 - 10

    ctx.clearRect(0, 0, SIZE, SIZE)

    const n = topics.length
    const segRad = (2 * Math.PI) / n

    topics.forEach((t, i) => {
      const start = i * segRad - Math.PI / 2
      const end = start + segRad
      const mid = start + segRad / 2

      // Segment fill
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = t.color
      ctx.fill()
      ctx.strokeStyle = '#0f1117'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Dim exhausted topics
      if (availableCount(t) === 0) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, start, end)
        ctx.closePath()
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fill()
        ctx.restore()
      }

      // Label — positioned at 68% radius, rotated to align with segment bisector.
      // Segments in the left half (cos < 0) get an extra 180° flip so text stays readable.
      const textR = r * 0.68
      const tx = cx + Math.cos(mid) * textR
      const ty = cy + Math.sin(mid) * textR

      const available = availableCount(t)
      const label = available === 0 ? `${t.title} ✓` : `${t.title} (${available})`
      const fontSize = Math.max(11, Math.min(16, Math.floor(280 / n)))

      ctx.save()
      ctx.translate(tx, ty)

      // Align text along the bisector; flip if pointing left so it stays right-side up
      const bisector = mid + Math.PI / 2
      const normalizedMid = ((mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const isLeftHalf = normalizedMid > Math.PI / 2 && normalizedMid < (3 * Math.PI) / 2
      ctx.rotate(isLeftHalf ? bisector + Math.PI : bisector)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${fontSize}px Segoe UI, system-ui, sans-serif`
      ctx.shadowColor = 'rgba(0,0,0,0.85)'
      ctx.shadowBlur = 6

      // Max text width is the chord at textR, minus padding
      const maxWidth = 2 * textR * Math.sin(segRad / 2) * 0.72
      const lines = wrapText(ctx, label, maxWidth)
      const lineHeight = fontSize * 1.25
      const totalHeight = (lines.length - 1) * lineHeight
      lines.forEach((line, li) => {
        ctx.fillText(line, 0, -totalHeight / 2 + li * lineHeight)
      })
      ctx.restore()
    })

    // Center hub
    ctx.beginPath()
    ctx.arc(cx, cy, 26, 0, Math.PI * 2)
    ctx.fillStyle = '#1a1d2e'
    ctx.fill()
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  function spin() {
    if (spinning || topics.length === 0) return
    setSpinning(true)

    const extraSpins = (MIN_SPINS + Math.random() * 3) * 360
    const randomOffset = Math.random() * 360
    const target = spinRef.current + extraSpins + randomOffset
    setRotation(target)
    spinRef.current = target

    setTimeout(() => {
      const normalized = ((target % 360) + 360) % 360
      const idx = Math.floor(((360 - normalized) % 360) / segmentAngle) % topics.length
      setSpinning(false)
      onSelect(topics[idx])
    }, SPIN_DURATION)
  }

  return (
    <div className="wheel-wrapper">
      <div className="wheel-indicator" />
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="wheel-canvas"
        style={{
          transition: spinning
            ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,1)`
            : 'none',
          transform: `rotate(${rotation}deg)`,
        }}
        onClick={spin}
        aria-label="Spin the topic wheel"
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && spin()}
      />
      <p className="wheel-hint">
        {spinning
          ? 'Spinning…'
          : topics.length === 0
          ? 'No topics loaded'
          : 'Click the wheel to spin'}
      </p>
    </div>
  )
}
