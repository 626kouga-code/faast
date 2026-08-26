export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ApiCard {
  id: number
  boardId: number
  listId: number
  title: string
  description: string | null
  dueDate: string | null
  position: number
  priority: Priority | null
}

export interface CardPayload {
  title: string
  description?: string | null
  dueDate?: string | null
  boardId: number
  listId: number
  position?: number
  priority?: Priority | null
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function handleVoid(res: Response): Promise<void> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export function listCards(boardId: number): Promise<ApiCard[]> {
  return fetch(`/api/cards?boardId=${boardId}`, { credentials: 'include' }).then((res) =>
    handle<ApiCard[]>(res),
  )
}

export function createCard(payload: CardPayload): Promise<ApiCard> {
  return fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  }).then((res) => handle<ApiCard>(res))
}

export function updateCard(id: number, payload: CardPayload): Promise<ApiCard> {
  return fetch(`/api/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  }).then((res) => handle<ApiCard>(res))
}

export function deleteCard(id: number): Promise<void> {
  return fetch(`/api/cards/${id}`, { method: 'DELETE', credentials: 'include' }).then(handleVoid)
}
