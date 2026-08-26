import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthPage.module.css'

export function AuthPage() {
  const { register, login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register({ email, username, password })
      } else {
        await login({ email, password })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>{mode === 'register' ? '新規登録' : 'ログイン'}</h1>

        <label className={styles.fieldLabel}>メールアドレス</label>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode === 'register' && (
          <>
            <label className={styles.fieldLabel}>ユーザー名</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </>
        )}

        <label className={styles.fieldLabel}>パスワード</label>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submitButton} type="submit" disabled={submitting}>
          {mode === 'register' ? '登録する' : 'ログイン'}
        </button>

        <div className={styles.switchText}>
          {mode === 'register' ? (
            <>
              すでにアカウントをお持ちですか？{' '}
              <button type="button" className={styles.switchLink} onClick={() => setMode('login')}>
                ログイン
              </button>
            </>
          ) : (
            <>
              アカウントをお持ちでないですか？{' '}
              <button type="button" className={styles.switchLink} onClick={() => setMode('register')}>
                新規登録
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
