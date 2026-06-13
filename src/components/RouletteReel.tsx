import { useEffect, useRef, useState } from 'react'
import type { Topic, Question } from '../types'
import './RouletteReel.css'

export const RARITY_COLORS: Record<string, string> = {
  'Consumer Grade':   '#b0c3d9',
  'Industrial Grade': '#5e98d9',
  'Mil-Spec':         '#4b69ff',
  'Restricted':       '#8847ff',
  'Classified':       '#d32ce6',
  'Covert':           '#eb4b4b',
  'Exceedingly Rare': '#ffd700',
}

const CARD_W = 160
const GAP = 8
const STRIDE = CARD_W + GAP
const N_ITEMS = 60
const WIN_IDX = 50
const SPIN_DURATION = 5500

type Phase = 'idle' | 'ready' | 'spinning' | 'landed'

interface ReelItem {
  topic: Topic
  question: Question
}

interface Props {
  topics: Topic[]
  usedIds: Set<string>
  onSelect: (topic: Topic, question: Question) => void
  autoSpin?: boolean
}

export default function RouletteReel({ topics, usedIds, onSelect, autoSpin }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [reelItems, setReelItems] = useState<ReelItem[]>([])
  const [currentX, setCurrentX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const winnerRef = useRef<ReelItem | null>(null)
  const targetXRef = useRef(0)

  const available: ReelItem[] = topics.flatMap(t =>
    t.questions.filter(q => !usedIds.has(q.id)).map(q => ({ topic: t, question: q }))
  )

  function handleOpen() {
    if (phase === 'ready' || phase === 'spinning' || available.length === 0) return

    const winner = available[Math.floor(Math.random() * available.length)]
    winnerRef.current = winner

    const items: ReelItem[] = Array.from({ length: N_ITEMS }, (_, i) =>
      i === WIN_IDX ? winner : available[Math.floor(Math.random() * available.length)]
    )

    const containerWidth = containerRef.current?.offsetWidth ?? 900
    const winnerCenter = WIN_IDX * STRIDE + CARD_W / 2
    const jitter = (Math.random() - 0.5) * 40
    targetXRef.current = -(winnerCenter - containerWidth / 2 + jitter)

    setReelItems(items)
    setCurrentX(0)
    setPhase('ready')
  }

  // Auto-spin on mount when triggered by "Next question"
  useEffect(() => {
    if (!autoSpin) return
    const id = requestAnimationFrame(() => handleOpen())
    return () => cancelAnimationFrame(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // After items render at X=0 with no transition, kick off the scroll
  useEffect(() => {
    if (phase !== 'ready') return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCurrentX(targetXRef.current)
        setPhase('spinning')
      })
    })
  }, [phase])

  useEffect(() => {
    if (phase === 'spinning') {
      const id = setTimeout(() => setPhase('landed'), SPIN_DURATION)
      return () => clearTimeout(id)
    }
    if (phase === 'landed') {
      const isGold = winnerRef.current?.question.rarity === 'Exceedingly Rare'
      const delay = isGold ? 2800 : 1100
      const id = setTimeout(() => {
        onSelect(winnerRef.current!.topic, winnerRef.current!.question)
      }, delay)
      return () => clearTimeout(id)
    }
  }, [phase, onSelect])

  const isDisabled = phase === 'ready' || phase === 'spinning'
  const showGold = phase === 'landed' && winnerRef.current?.question.rarity === 'Exceedingly Rare'

  return (
    <div className="roulette-wrapper">
      <div className="roulette-container" ref={containerRef}>
        <div className="roulette-pointer roulette-pointer--top" />
        <div className="roulette-pointer roulette-pointer--bottom" />
        <div className="roulette-overlay roulette-overlay--left" />
        <div className="roulette-overlay roulette-overlay--right" />

        {phase !== 'idle' ? (
          <div
            className="roulette-strip"
            style={{
              transform: `translateX(${currentX}px)`,
              transition:
                phase === 'spinning'
                  ? `transform ${SPIN_DURATION}ms cubic-bezier(0.07, 0.85, 0.15, 1)`
                  : 'none',
            }}
          >
            {reelItems.map((item, i) => {
              const color = RARITY_COLORS[item.question.rarity] ?? '#b0c3d9'
              const isWinner = i === WIN_IDX && phase === 'landed'
              return (
                <div
                  key={i}
                  className={`reel-card${isWinner ? ' reel-card--winner' : ''}`}
                  style={{ '--rarity-color': color } as React.CSSProperties}
                >
                  <div className="reel-card__bar" />
                  <div className="reel-card__body">
                    <span className="reel-card__topic">{item.topic.title}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="roulette-idle">
            <span>Press Open to reveal a question</span>
          </div>
        )}
      </div>

      <button
        className="btn-open-case"
        onClick={handleOpen}
        disabled={isDisabled || available.length === 0}
      >
        {available.length === 0
          ? 'All Questions Revealed'
          : isDisabled
          ? 'Opening…'
          : 'Open Question'}
      </button>

      {showGold && (
        <div className="gold-popup">
          <span className="gold-popup__word" style={{ animationDelay: '0ms' }}>GOLD</span>
          <span className="gold-popup__word" style={{ animationDelay: '120ms' }}>GOLD</span>
          <span className="gold-popup__word" style={{ animationDelay: '240ms' }}>GOLD</span>
        </div>
      )}
    </div>
  )
}
