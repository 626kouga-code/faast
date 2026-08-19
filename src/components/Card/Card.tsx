import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Board, Card as CardType } from '../../types'
import styles from './Card.module.css'

interface CardProps {
  board: Board
  card: CardType
  onOpen: () => void
}

function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

export function Card({ board, card, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const labels = card.labelIds.map((id) => board.labels[id]).filter(Boolean)

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
      <div className={styles.title}>{card.title}</div>
      {card.dueDate && (
        <div className={isOverdue(card.dueDate) ? `${styles.dueDate} ${styles.overdue}` : styles.dueDate}>
          期限: {card.dueDate}
        </div>
      )}
    </div>
  )
}
