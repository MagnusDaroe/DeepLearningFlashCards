import yaml from 'js-yaml'
import type { Topic, Question } from '../types'

// Vite resolves this glob at build time — no index file needed.
// Add a new .yaml file to src/topics/ and restart the dev server to pick it up.
const topicModules = import.meta.glob('../topics/*.yaml', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

// Visually distinct palette — cycles automatically when topics don't specify a color.
const PALETTE = [
  '#6c63ff', '#ff6584', '#43c6ac', '#f7971e', '#a18cd1',
  '#f953c6', '#4facfe', '#43e97b', '#fa709a', '#fee140',
  '#30cfd0', '#ff9a9e', '#a1c4fd', '#fd7043', '#26c6da',
]

// Stable color from palette based on topic id — same color every run for the same id.
function paletteColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

interface RawQuestion {
  id: unknown
  question: unknown
  answer: unknown
}

interface RawTopic {
  id: unknown
  title: unknown
  color?: unknown
  questions: unknown
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function validateQuestion(q: unknown, topicId: string, idx: number): Question {
  const raw = q as RawQuestion
  if (!isString(raw.id)) throw new Error(`Topic "${topicId}" question[${idx}] missing string "id"`)
  if (!isString(raw.question)) throw new Error(`Topic "${topicId}" question[${idx}] missing string "question"`)
  if (!isString(raw.answer)) throw new Error(`Topic "${topicId}" question[${idx}] missing string "answer"`)
  return { id: `${topicId}::${raw.id}`, question: raw.question, answer: raw.answer }
}

function validateTopic(raw: unknown, filename: string): Topic {
  const r = raw as RawTopic
  if (!isString(r.id)) throw new Error(`File "${filename}" missing string "id"`)
  if (!isString(r.title)) throw new Error(`File "${filename}" missing string "title"`)
  if (!Array.isArray(r.questions) || r.questions.length === 0)
    throw new Error(`File "${filename}" must have a non-empty "questions" array`)
  return {
    id: r.id,
    title: r.title,
    color: isString(r.color) ? r.color : paletteColor(r.id),
    questions: r.questions.map((q, i) => validateQuestion(q, r.id as string, i)),
  }
}

export interface LoadResult {
  topics: Topic[]
  errors: { file: string; message: string }[]
}

export async function loadTopics(): Promise<LoadResult> {
  const topics: Topic[] = []
  const errors: { file: string; message: string }[] = []

  await Promise.all(
    Object.entries(topicModules).map(async ([path, load]) => {
      const filename = path.split('/').pop() ?? path
      try {
        const text = await load()
        const parsed = yaml.load(text)
        topics.push(validateTopic(parsed, filename))
      } catch (e) {
        errors.push({ file: filename, message: String(e) })
      }
    })
  )

  topics.sort((a, b) => a.title.localeCompare(b.title))
  return { topics, errors }
}
