import { useEffect, useState } from 'react'
import { loadTopics } from './lib/loadTopics'
import { loadUsedIds, saveUsedIds, clearUsedIds } from './lib/questionStore'
import WheelPicker from './components/WheelPicker'
import QuestionCard from './components/QuestionCard'
import UsedQuestionList from './components/UsedQuestionList'
import type { Topic, Question, AppView } from './types'
import './App.css'

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loadErrors, setLoadErrors] = useState<{ file: string; message: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set())
  const [view, setView] = useState<AppView>('wheel')
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)

  useEffect(() => {
    loadTopics().then(({ topics: t, errors }) => {
      setTopics(t)
      setLoadErrors(errors)
      setLoading(false)
    })
    setUsedIds(loadUsedIds())
  }, [])

  function markUsed(id: string) {
    setUsedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveUsedIds(next)
      return next
    })
  }

  function handleTopicSpin(topic: Topic) {
    const available = topic.questions.filter(q => !usedIds.has(q.id))
    if (available.length === 0) return // all used — stay on wheel
    const q = available[Math.floor(Math.random() * available.length)]
    markUsed(q.id)
    setActiveTopic(topic)
    setActiveQuestion(q)
    setView('card')
  }

  function handleReopen(topic: Topic, question: Question) {
    setActiveTopic(topic)
    setActiveQuestion(question)
    setView('card')
  }

  function handleNext() {
    if (!activeTopic) return
    const available = activeTopic.questions.filter(q => !usedIds.has(q.id))
    if (available.length === 0) return
    const q = available[Math.floor(Math.random() * available.length)]
    markUsed(q.id)
    setActiveQuestion(q)
  }

  function handleReset() {
    clearUsedIds()
    setUsedIds(new Set())
    setView('wheel')
  }

  const totalQuestions = topics.reduce((s, t) => s + t.questions.length, 0)
  const usedCount = usedIds.size
  const remaining = totalQuestions - usedCount

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading topics…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Question Wheel</h1>
        <div className="app-stats">
          <span>{remaining} remaining</span>
          <span className="divider">·</span>
          <span>{usedCount} used</span>
          <button
            className="btn btn-ghost btn-sm history-btn"
            onClick={() => setView(v => v === 'history' ? 'wheel' : 'history')}
          >
            History
          </button>
        </div>
      </header>

      {loadErrors.length > 0 && (
        <div className="error-banner">
          {loadErrors.map(e => (
            <p key={e.file}><strong>{e.file}:</strong> {e.message}</p>
          ))}
        </div>
      )}

      {topics.length === 0 && !loading && loadErrors.length === 0 && (
        <div className="empty-state">
          <p>No topic files found.</p>
          <p>Add YAML files to <code>public/topics/</code> and list them in <code>public/topics/index.json</code>.</p>
        </div>
      )}

      <main className="app-main">
        {view === 'wheel' && topics.length > 0 && (
          <WheelPicker topics={topics} usedIds={usedIds} onSelect={handleTopicSpin} />
        )}

        {view === 'card' && activeTopic && activeQuestion && (
          <QuestionCard
            topic={activeTopic}
            question={activeQuestion}
            onBack={() => setView('wheel')}
            onNext={handleNext}
            hasNext={activeTopic.questions.some(q => !usedIds.has(q.id))}
          />
        )}

        {view === 'history' && (
          <UsedQuestionList
            topics={topics}
            usedIds={usedIds}
            onReopen={handleReopen}
            onReset={handleReset}
            onClose={() => setView('wheel')}
          />
        )}
      </main>
    </div>
  )
}
