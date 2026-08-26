import { AuthProvider, useAuth } from './context/AuthContext'
import { BoardProvider, useBoardContext } from './context/BoardContext'
import { AuthPage } from './components/Auth/AuthPage'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Board } from './components/Board/Board'
import styles from './App.module.css'

function BoardApp() {
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

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <AuthPage />

  return (
    <BoardProvider>
      <BoardApp />
    </BoardProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
