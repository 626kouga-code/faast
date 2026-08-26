import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ApiCard } from '../../api/cards'
import type { Board } from '../../types'
import styles from './Card.module.css'

interface CardProps {
  board: Board
  card: ApiCard
  onOpen: () => void
}

function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  HIGH: { label: '高', className: styles.priorityHigh },
  MEDIUM: { label: '中', className: styles.priorityMedium },
  LOW: { label: '低', className: styles.priorityLow },
}

export function Card({ board, card, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(card.id),
    data: { type: 'card' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const labelIds = board.cardLabelIds[card.id] ?? []
  const labels = labelIds.map((id) => board.labels[id]).filter(Boolean)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.card}
      onClick={onOpen}
    >
      {labels.length > 0 && (
        <div className={styles.labels}>
          {labels.map((label) => (
            <span key={label.id} className={styles.labelChip} style={{ backgroundColor: label.color }}>
              {label.name}
            </span>
          ))}
        </div>
      )}
      {card.priority && PRIORITY_BADGE[card.priority] && (
        <span className={`${styles.priorityBadge} ${PRIORITY_BADGE[card.priority].className}`}>
          優先度: {PRIORITY_BADGE[card.priority].label}
        </span>
      )}
      <div className={styles.title}>{card.title}</div>
      {card.dueDate && (
        <div className={isOverdue(card.dueDate) ? `${styles.dueDate} ${styles.overdue}` : styles.dueDate}>
          期限: {card.dueDate}
        </div>
      )}
    </div>
  )
}
