import { useEffect, useState } from 'react'
import { loadTopics } from './lib/loadTopics'
import { loadUsedIds, saveUsedIds, clearUsedIds } from './lib/questionStore'
import RouletteReel from './components/RouletteReel'
import QuestionCard from './components/QuestionCard'
import UsedQuestionList from './components/UsedQuestionList'
import type { Topic, Question, AppView } from './types'
import './App.css'

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loadErrors, setLoadErrors] = useState<{ file: string; message: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set())
  const [view, setView] = useState<AppView>('roulette')
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [autoSpin, setAutoSpin] = useState(false)

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

  function handleQuestionSelect(topic: Topic, question: Question) {
    markUsed(question.id)
    setActiveTopic(topic)
    setActiveQuestion(question)
    setView('card')
  }

  function handleReopen(topic: Topic, question: Question) {
    setActiveTopic(topic)
    setActiveQuestion(question)
    setView('card')
  }

  function handleBack() {
    setAutoSpin(false)
    setView('roulette')
  }

  function handleNext() {
    setAutoSpin(true)
    setView('roulette')
  }

  function handleReset() {
    clearUsedIds()
    setUsedIds(new Set())
    setView('roulette')
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify([...usedIds], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flashcard-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!Array.isArray(data) || !data.every(x => typeof x === 'string')) {
          alert('Invalid progress file.')
          return
        }
        setUsedIds(prev => {
          const next = new Set(prev)
          data.forEach((id: string) => next.add(id))
          saveUsedIds(next)
          return next
        })
      } catch {
        alert('Could not parse progress file.')
      }
    }
    reader.readAsText(file)
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
        <h1 className="app-title">Question Roulette</h1>
        <div className="app-stats">
          <span>{remaining} remaining</span>
          <span className="divider">·</span>
          <span>{usedCount} used</span>
          <button
            className="btn btn-ghost btn-sm history-btn"
            onClick={() => setView(v => v === 'history' ? 'roulette' : 'history')}
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
          <p>Add YAML files to <code>src/topics/</code> or <code>src/</code> and restart the dev server.</p>
        </div>
      )}

      <main className="app-main">
        {view === 'roulette' && topics.length > 0 && (
          <RouletteReel
            topics={topics}
            usedIds={usedIds}
            onSelect={handleQuestionSelect}
            autoSpin={autoSpin}
          />
        )}

        {view === 'card' && activeTopic && activeQuestion && (
          <QuestionCard
            topic={activeTopic}
            question={activeQuestion}
            onBack={handleBack}
            onNext={handleNext}
            hasNext={topics.some(t => t.questions.some(q => !usedIds.has(q.id)))}
          />
        )}

        {view === 'history' && (
          <UsedQuestionList
            topics={topics}
            usedIds={usedIds}
            onReopen={handleReopen}
            onReset={handleReset}
            onExport={handleExport}
            onImport={handleImport}
            onClose={() => setView('roulette')}
          />
        )}
      </main>
    </div>
  )
}
