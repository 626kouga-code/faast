import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as usersApi from '../api/users'
import type { ApiUser } from '../api/users'

interface AuthContextValue {
  user: ApiUser | null
  loading: boolean
  register: (payload: usersApi.RegisterPayload) => Promise<void>
  login: (payload: usersApi.LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi
      .me()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const register = useCallback(async (payload: usersApi.RegisterPayload) => {
    await usersApi.register(payload)
    await usersApi.login({ email: payload.email, password: payload.password }).then(setUser)
  }, [])

  const login = useCallback(async (payload: usersApi.LoginPayload) => {
    const loggedInUser = await usersApi.login(payload)
    setUser(loggedInUser)
  }, [])

  const logout = useCallback(async () => {
    await usersApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
