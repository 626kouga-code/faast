import { useEffect, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useBoardContext } from '../../context/BoardContext'
import { List } from '../List/List'
import { CardModal } from '../CardModal/CardModal'
import { SearchBar } from '../SearchBar/SearchBar'
import type { Board as BoardType } from '../../types'
import styles from './Board.module.css'

interface BoardProps {
  board: BoardType
}

export function Board({ board }: BoardProps) {
  const { dispatch } = useBoardContext()
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(board.title)

  useEffect(() => {
    setTitleDraft(board.title)
    setIsEditingTitle(false)
  }, [board.id, board.title])

  const handleRenameBoard = () => {
    const title = titleDraft.trim()
    if (title) {
      dispatch({ type: 'RENAME_BOARD', boardId: board.id, title })
    } else {
      setTitleDraft(board.title)
    }
    setIsEditingTitle(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const query = search.trim().toLowerCase()
  const visibleCardIdsByList: Record<string, string[]> = {}
  for (const listId of board.listOrder) {
    const list = board.lists[listId]
    if (!list) continue
    visibleCardIdsByList[listId] = query
      ? list.cardIds.filter((cardId) => {
          const card = board.cards[cardId]
          if (!card) return false
          return (
            card.title.toLowerCase().includes(query) ||
            (card.description ?? '').toLowerCase().includes(query)
          )
        })
      : list.cardIds
  }

  const findListIdForCard = (cardId: string): string | undefined =>
    board.listOrder.find((listId) => board.lists[listId]?.cardIds.includes(cardId))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'list') {
      if (active.id === over.id) return
      const oldIndex = board.listOrder.indexOf(String(active.id))
      const overIndex = board.listOrder.indexOf(String(over.id))
      if (oldIndex === -1 || overIndex === -1) return
      const newOrder = arrayMove(board.listOrder, oldIndex, overIndex)
      dispatch({
        type: 'MOVE_LIST',
        boardId: board.id,
        listId: String(active.id),
        toIndex: newOrder.indexOf(String(active.id)),
      })
      return
    }

    if (activeType === 'card') {
      const cardId = String(active.id)
      const fromListId = findListIdForCard(cardId)
      if (!fromListId) return

      let toListId: string
      let toIndex: number

      if (overType === 'card') {
        const overCardId = String(over.id)
        toListId = findListIdForCard(overCardId) ?? fromListId
        const toList = board.lists[toListId]
        toIndex = toList ? toList.cardIds.indexOf(overCardId) : 0
      } else {
        toListId = String(over.id)
        const toList = board.lists[toListId]
        toIndex = toList ? toList.cardIds.length : 0
      }

      if (!board.lists[toListId]) return

      dispatch({
        type: 'MOVE_CARD',
        boardId: board.id,
        cardId,
        fromListId,
        toListId,
        toIndex,
      })
    }
  }

  const handleAddList = () => {
    const title = newListTitle.trim()
    if (!title) {
      setIsAddingList(false)
      return
    }
    dispatch({ type: 'ADD_LIST', boardId: board.id, title })
    setNewListTitle('')
  }

  const openCard = openCardId ? board.cards[openCardId] : null

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.toolbar}>
        {isEditingTitle ? (
          <input
            className={styles.boardTitleInput}
            value={titleDraft}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleRenameBoard}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameBoard()
            }}
          />
        ) : (
          <h1 className={styles.boardTitle} onClick={() => setIsEditingTitle(true)}>
            {board.title}
          </h1>
        )}
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.lists}>
          <SortableContext items={board.listOrder} strategy={horizontalListSortingStrategy}>
            {board.listOrder.map((listId) => {
              const list = board.lists[listId]
              if (!list) return null
              return (
                <List
                  key={list.id}
                  board={board}
                  list={list}
                  visibleCardIds={visibleCardIdsByList[listId] ?? []}
                  onOpenCard={setOpenCardId}
                />
              )
            })}
          </SortableContext>

          <div className={styles.addList}>
            {isAddingList ? (
              <div className={styles.addListForm}>
                <input
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="リスト名を入力"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList()
                  }}
                />
                <div className={styles.addListActions}>
                  <button onClick={handleAddList}>追加</button>
                  <button
                    onClick={() => {
                      setIsAddingList(false)
                      setNewListTitle('')
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button className={styles.addListButton} onClick={() => setIsAddingList(true)}>
                + リストを追加
              </button>
            )}
          </div>
        </div>
      </DndContext>

      {openCard && (
        <CardModal board={board} card={openCard} onClose={() => setOpenCardId(null)} />
      )}
    </div>
  )
}
