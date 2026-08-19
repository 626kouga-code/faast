import { useState } from 'react'
import { LABEL_COLORS, useBoardContext } from '../../context/BoardContext'
import type { Board } from '../../types'
import styles from './LabelPicker.module.css'

interface LabelPickerProps {
  board: Board
  selectedLabelIds: string[]
  onToggle: (labelId: string) => void
}

export function LabelPicker({ board, selectedLabelIds, onToggle }: LabelPickerProps) {
  const { dispatch } = useBoardContext()
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])

  const handleAddLabel = () => {
    const name = newLabelName.trim()
    if (!name) return
    dispatch({ type: 'ADD_LABEL', boardId: board.id, name, color: newLabelColor })
    setNewLabelName('')
  }

  return (
    <div className={styles.picker}>
      <div className={styles.labelList}>
        {Object.values(board.labels).map((label) => (
          <div key={label.id} className={styles.labelRow}>
            <button
              className={styles.labelChip}
              style={{
                backgroundColor: label.color,
                outline: selectedLabelIds.includes(label.id) ? '2px solid #333' : 'none',
              }}
              onClick={() => onToggle(label.id)}
            >
              {label.name}
            </button>
            <button
              className={styles.removeLabel}
              title="ラベルを削除"
              onClick={() => dispatch({ type: 'DELETE_LABEL', boardId: board.id, labelId: label.id })}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className={styles.newLabel}>
        <input
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          placeholder="新しいラベル名"
        />
        <select value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)}>
          {LABEL_COLORS.map((color) => (
            <option key={color} value={color} style={{ backgroundColor: color }}>
              {color}
            </option>
          ))}
        </select>
        <button onClick={handleAddLabel}>作成</button>
      </div>
    </div>
  )
}
