export interface Question {
  id: string
  question: string
  answer: string
  rarity: string
}

export interface Topic {
  id: string
  title: string
  color: string
  questions: Question[]
}

export type AppView = 'roulette' | 'card' | 'history'
