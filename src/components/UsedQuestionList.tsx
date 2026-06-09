import type { Topic, Question } from '../types'
import './UsedQuestionList.css'

interface UsedEntry {
  topic: Topic
  question: Question
}

interface Props {
  topics: Topic[]
  usedIds: Set<string>
  onReopen: (topic: Topic, question: Question) => void
  onReset: () => void
  onClose: () => void
}

export default function UsedQuestionList({ topics, usedIds, onReopen, onReset, onClose }: Props) {
  const entries: UsedEntry[] = []
  topics.forEach(t => {
    t.questions.forEach(q => {
      if (usedIds.has(q.id)) entries.push({ topic: t, question: q })
    })
  })

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>Used Questions ({entries.length})</h2>
        <div className="history-header-actions">
          <button className="btn btn-danger" onClick={onReset}>Reset all</button>
          <button className="btn btn-ghost" onClick={onClose}>Close ✕</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="history-empty">No questions used yet.</p>
      ) : (
        <ul className="history-list">
          {entries.map(({ topic, question }) => (
            <li key={question.id} className="history-item">
              <span className="history-badge" style={{ background: topic.color }}>{topic.title}</span>
              <span className="history-q">{question.question}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onReopen(topic, question)}
              >
                Reopen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
