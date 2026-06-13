import { useState, useLayoutEffect, useRef } from 'react'
import type { Topic, Question } from '../types'
import './QuestionCard.css'

interface Props {
  topic: Topic
  question: Question
  onBack: () => void
  onNext: () => void
  hasNext: boolean
}

export default function QuestionCard({ topic, question, onBack, onNext, hasNext }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [cardHeight, setCardHeight] = useState(180)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  // Measure front face height after each new question renders
  useLayoutEffect(() => {
    setFlipped(false)
    if (frontRef.current) setCardHeight(frontRef.current.offsetHeight)
  }, [question.id])

  function handleFlip() {
    if (flipping) return
    setFlipping(true)
    const nextFlipped = !flipped
    setTimeout(() => {
      // Height and flip transition start together
      const target = nextFlipped ? backRef.current : frontRef.current
      if (target) setCardHeight(target.offsetHeight)
      setFlipped(nextFlipped)
      setFlipping(false)
    }, 180)
  }

  return (
    <div className="card-scene">
      <div className="card-topic-badge" style={{ background: topic.color }}>
        {topic.title}
      </div>

      <div
        className={`card-inner ${flipped ? 'flipped' : ''} ${flipping ? 'flipping' : ''}`}
        style={{ height: cardHeight }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleFlip()}
        aria-label={flipped ? 'Click to see the question' : 'Click to reveal the answer'}
      >
        <div className="card-face card-front" ref={frontRef}>
          <p className="card-label">Question</p>
          <p className="card-text" onClick={e => e.stopPropagation()}>{question.question}</p>
          <p className="card-hint">Click card to reveal answer</p>
        </div>
        <div className="card-face card-back" ref={backRef}>
          <p className="card-label">Answer</p>
          <p className="card-text" onClick={e => e.stopPropagation()}>{question.answer}</p>
          <p className="card-hint">Click card to flip back</p>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to roulette
        </button>
        {hasNext && (
          <button className="btn btn-primary" onClick={onNext}>
            Next question →
          </button>
        )}
      </div>
    </div>
  )
}
