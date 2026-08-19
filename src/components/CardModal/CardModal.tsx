import { useState } from 'react'
import { useBoardContext } from '../../context/BoardContext'
import { LabelPicker } from '../LabelPicker/LabelPicker'
import type { Board, Card } from '../../types'
import styles from './CardModal.module.css'

interface CardModalProps {
  board: Board
  card: Card
  onClose: () => void
}

export function CardModal({ board, card, onClose }: CardModalProps) {
  const { dispatch } = useBoardContext()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [dueDate, setDueDate] = useState(card.dueDate ?? '')

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_CARD',
      boardId: board.id,
      cardId: card.id,
      changes: {
        title: title.trim() || card.title,
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
      },
    })
    onClose()
  }

  const handleToggleLabel = (labelId: string) => {
    const labelIds = card.labelIds.includes(labelId)
      ? card.labelIds.filter((id) => id !== labelId)
      : [...card.labelIds, labelId]
    dispatch({ type: 'UPDATE_CARD', boardId: board.id, cardId: card.id, changes: { labelIds } })
  }

  const handleDelete = () => {
    if (confirm('このカードを削除しますか？')) {
      dispatch({ type: 'DELETE_CARD', boardId: board.id, cardId: card.id })
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className={styles.fieldLabel}>説明</label>
        <textarea
          className={styles.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="詳細を入力..."
        />

        <label className={styles.fieldLabel}>期限</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <label className={styles.fieldLabel}>ラベル</label>
        <LabelPicker board={board} selectedLabelIds={card.labelIds} onToggle={handleToggleLabel} />

        <div className={styles.actions}>
          <button className={styles.deleteButton} onClick={handleDelete}>
            削除
          </button>
          <div className={styles.rightActions}>
            <button onClick={onClose}>キャンセル</button>
            <button className={styles.saveButton} onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
