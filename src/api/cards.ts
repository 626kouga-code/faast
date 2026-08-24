export interface ApiCard {
  id: number
  boardId: number
  listId: number
  title: string
  description: string | null
  dueDate: string | null
  position: number
}

export interface CardPayload {
  title: string
  description?: string | null
  dueDate?: string | null
  boardId: number
  listId: number
  position?: number
}

async function handle(res: Response): Promise<ApiCard> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function listCards(boardId: number): Promise<ApiCard[]> {
  return fetch(`/api/cards?boardId=${boardId}`).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  })
}

export function createCard(payload: CardPayload): Promise<ApiCard> {
  return fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle)
}

export function updateCard(id: number, payload: CardPayload): Promise<ApiCard> {
  return fetch(`/api/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle)
}

export function deleteCard(id: number): Promise<void> {
  return fetch(`/api/cards/${id}`, { method: 'DELETE' }).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`)
  })
}
