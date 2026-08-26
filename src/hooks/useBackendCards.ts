import { useCallback, useEffect, useState } from 'react'
import {
  type ApiCard,
  createCard as apiCreateCard,
  deleteCard as apiDeleteCard,
  listCards,
  updateCard as apiUpdateCard,
} from '../api/cards'

export function useBackendCards(boardId: number) {
  const [cards, setCards] = useState<ApiCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return listCards(boardId)
      .then((data) => setCards(data))
      .catch(() => setError('バックエンドとの通信に失敗しました'))
      .finally(() => setLoading(false))
  }, [boardId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addCard = useCallback(
    async (listId: number, title: string) => {
      const created = await apiCreateCard({ title, boardId, listId })
      setCards((prev) => [...prev, created])
      return created
    },
    [boardId],
  )

  const editCard = useCallback(
    async (
      card: ApiCard,
      changes: Partial<Pick<ApiCard, 'title' | 'description' | 'dueDate' | 'priority'>>,
    ) => {
      const updated = await apiUpdateCard(card.id, {
        title: changes.title ?? card.title,
        description: changes.description ?? card.description,
        dueDate: changes.dueDate ?? card.dueDate,
        boardId: card.boardId,
        listId: card.listId,
        position: card.position,
        priority: changes.priority !== undefined ? changes.priority : card.priority,
      })
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      return updated
    },
    [],
  )

  const removeCard = useCallback(async (card: ApiCard) => {
    await apiDeleteCard(card.id)
    setCards((prev) => prev.filter((c) => c.id !== card.id))
  }, [])

  const moveCard = useCallback(
    async (card: ApiCard, toListId: number, toIndex: number) => {
      const siblings = cards
        .filter((c) => c.listId === toListId && c.id !== card.id)
        .sort((a, b) => a.position - b.position)

      const before = siblings[toIndex - 1]
      const after = siblings[toIndex]
      const newPosition =
        before && after
          ? (before.position + after.position) / 2
          : before
            ? before.position + 1
            : after
              ? after.position - 1
              : 1

      const updated = await apiUpdateCard(card.id, {
        title: card.title,
        description: card.description,
        dueDate: card.dueDate,
        boardId: card.boardId,
        listId: toListId,
        position: newPosition,
        priority: card.priority,
      })
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      return updated
    },
    [cards],
  )

  return { cards, loading, error, refresh, addCard, editCard, removeCard, moveCard }
}
