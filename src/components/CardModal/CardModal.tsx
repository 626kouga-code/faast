import { useState } from 'react'
import { useBoardContext } from '../../context/BoardContext'
import type { ApiCard, Priority } from '../../api/cards'
import { LabelPicker } from '../LabelPicker/LabelPicker'
import type { Board } from '../../types'
import styles from './CardModal.module.css'

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

interface CardModalProps {
  board: Board
  card: ApiCard
  onEdit: (
    card: ApiCard,
    changes: Partial<Pick<ApiCard, 'title' | 'description' | 'dueDate' | 'priority'>>,
  ) => Promise<ApiCard>
  onRemove: (card: ApiCard) => Promise<void>
  onClose: () => void
}

export function CardModal({ board, card, onEdit, onRemove, onClose }: CardModalProps) {
  const { dispatch } = useBoardContext()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [dueDate, setDueDate] = useState(card.dueDate ?? '')
  const [priority, setPriority] = useState<Priority | ''>(card.priority ?? '')

  const labelIds = board.cardLabelIds[card.id] ?? []

  const handleSave = () => {
    onEdit(card, {
      title: title.trim() || card.title,
      description: description.trim() || null,
      dueDate: dueDate || null,
      priority: priority || null,
    }).catch(() => {})
    onClose()
  }

  const handleToggleLabel = (labelId: string) => {
    const newLabelIds = labelIds.includes(labelId)
      ? labelIds.filter((id) => id !== labelId)
      : [...labelIds, labelId]
    dispatch({ type: 'SET_CARD_LABELS', boardId: board.id, cardId: card.id, labelIds: newLabelIds })
  }

  const handleDelete = () => {
    if (confirm('このカードを削除しますか？')) {
      onRemove(card).catch(() => {})
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

        <label className={styles.fieldLabel}>優先度</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')}>
          <option value="">未設定</option>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>

        <label className={styles.fieldLabel}>ラベル</label>
        <LabelPicker board={board} selectedLabelIds={labelIds} onToggle={handleToggleLabel} />

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
