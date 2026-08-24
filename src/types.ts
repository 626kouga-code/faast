export interface Label {
  id: string
  name: string
  color: string
}

export interface List {
  id: string
  backendId: number
  title: string
}

export interface Board {
  id: string
  backendId: number
  title: string
  lists: Record<string, List>
  listOrder: string[]
  labels: Record<string, Label>
  cardLabelIds: Record<number, string[]>
}

export interface AppState {
  boards: Record<string, Board>
  boardOrder: string[]
  activeBoardId: string | null
  nextBackendId: number
}
