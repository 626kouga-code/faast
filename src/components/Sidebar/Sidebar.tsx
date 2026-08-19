import { useState } from 'react'
import { useBoardContext } from '../../context/BoardContext'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { state, dispatch } = useBoardContext()
  const [newBoardTitle, setNewBoardTitle] = useState('')

  const handleAddBoard = () => {
    const title = newBoardTitle.trim()
    if (!title) return
    dispatch({ type: 'ADD_BOARD', title })
    setNewBoardTitle('')
  }

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.heading}>ボード</h2>
      <ul className={styles.list}>
        {state.boardOrder.map((boardId) => {
          const board = state.boards[boardId]
          if (!board) return null
          const isActive = board.id === state.activeBoardId
          return (
            <li key={board.id}>
              <button
                className={isActive ? `${styles.boardButton} ${styles.active}` : styles.boardButton}
                onClick={() => dispatch({ type: 'SET_ACTIVE_BOARD', boardId: board.id })}
              >
                {board.title}
              </button>
              <button
                className={styles.deleteButton}
                title="ボードを削除"
                onClick={() => {
                  if (confirm(`「${board.title}」を削除しますか？`)) {
                    dispatch({ type: 'DELETE_BOARD', boardId: board.id })
                  }
                }}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
      <div className={styles.addBoard}>
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="新しいボード名"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddBoard()
          }}
        />
        <button onClick={handleAddBoard}>追加</button>
      </div>
    </aside>
  )
}
