import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useBoardContext } from '../../context/BoardContext'
import type { ApiCard, Priority } from '../../api/cards'
import { Card } from '../Card/Card'
import type { Board, List as ListType } from '../../types'
import styles from './List.module.css'

const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function sortByPriorityThenPosition(cards: ApiCard[]): ApiCard[] {
  return [...cards].sort((a, b) => {
    const rankA = a.priority ? PRIORITY_ORDER[a.priority] : 3
    const rankB = b.priority ? PRIORITY_ORDER[b.priority] : 3
    if (rankA !== rankB) return rankA - rankB
    return a.position - b.position
  })
}

interface ListProps {
  board: Board
  list: ListType
  cards: ApiCard[]
  onOpenCard: (cardId: number) => void
  onAddCard: (listId: number, title: string) => Promise<ApiCard>
}

export function List({ board, list, cards, onOpenCard, onAddCard }: ListProps) {
  const { dispatch } = useBoardContext()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(list.title)
  const [sortByPriority, setSortByPriority] = useState(false)

  const displayCards = sortByPriority ? sortByPriorityThenPosition(cards) : cards

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
    data: { type: 'list' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddCard = () => {
    const title = newCardTitle.trim()
    if (!title) {
      setIsAddingCard(false)
      return
    }
    onAddCard(list.backendId, title)
      .then(() => setNewCardTitle(''))
      .catch((err) => {
        console.error('カードの追加に失敗しました', err)
        alert('カードの追加に失敗しました。もう一度お試しください。')
      })
  }

  const handleRenameList = () => {
    const title = titleDraft.trim()
    if (title) {
      dispatch({ type: 'RENAME_LIST', boardId: board.id, listId: list.id, title })
    }
    setIsEditingTitle(false)
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.list}>
      <div className={styles.header} {...attributes} {...listeners}>
        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            value={titleDraft}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleRenameList}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameList()
            }}
          />
        ) : (
          <span className={styles.title} onClick={() => setIsEditingTitle(true)}>
            {list.title}
          </span>
        )}
        <button
          className={styles.sortButton}
          aria-pressed={sortByPriority}
          title="優先度順に並べ替え"
          onClick={() => setSortByPriority((prev) => !prev)}
        >
          {sortByPriority ? '優先度順' : '並べ替え'}
        </button>
        <button
          className={styles.deleteListButton}
          onClick={() => {
            if (confirm(`「${list.title}」を削除しますか？`)) {
              dispatch({ type: 'DELETE_LIST', boardId: board.id, listId: list.id })
            }
          }}
        >
          ×
        </button>
      </div>

      <div ref={setDroppableRef} className={styles.cards}>
        <SortableContext
          items={displayCards.map((c) => String(c.id))}
          strategy={verticalListSortingStrategy}
        >
          {displayCards.map((card) => (
            <Card key={card.id} board={board} card={card} onOpen={() => onOpenCard(card.id)} />
          ))}
        </SortableContext>
      </div>

      {isAddingCard ? (
        <div className={styles.addCard}>
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="カードのタイトルを入力"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddCard()
              }
            }}
          />
          <div className={styles.addCardActions}>
            <button onClick={handleAddCard}>追加</button>
            <button
              onClick={() => {
                setIsAddingCard(false)
                setNewCardTitle('')
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.addCardButton} onClick={() => setIsAddingCard(true)}>
          + カードを追加
        </button>
      )}
    </div>
  )
}
