export interface Label {
  id: string
  name: string
  color: string
}

export interface Card {
  id: string
  title: string
  description?: string
  labelIds: string[]
  dueDate?: string
}

export interface List {
  id: string
  title: string
  cardIds: string[]
}

export interface Board {
  id: string
  title: string
  lists: Record<string, List>
  listOrder: string[]
  cards: Record<string, Card>
  labels: Record<string, Label>
}

export interface AppState {
  boards: Record<string, Board>
  boardOrder: string[]
  activeBoardId: string | null
}
