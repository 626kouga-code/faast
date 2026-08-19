import { BoardProvider, useBoardContext } from './context/BoardContext'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Board } from './components/Board/Board'
import styles from './App.module.css'

function AppContent() {
  const { state } = useBoardContext()
  const activeBoard = state.activeBoardId ? state.boards[state.activeBoardId] : null

  return (
    <div className={styles.app}>
      <Sidebar />
      {activeBoard ? (
        <Board board={activeBoard} />
      ) : (
        <div className={styles.empty}>ボードを作成してください</div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  )
}
