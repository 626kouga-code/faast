import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useBoardContext } from '../../context/BoardContext'
import type { ApiCard } from '../../api/cards'
import { Card } from '../Card/Card'
import type { Board, List as ListType } from '../../types'
import styles from './List.module.css'

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
    onAddCard(list.backendId, title).catch(() => {})
    setNewCardTitle('')
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
        <SortableContext items={cards.map((c) => String(c.id))} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
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
