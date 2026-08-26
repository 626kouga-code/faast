export interface ApiUser {
  id: number
  email: string
  username: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

async function handle(res: Response): Promise<ApiUser> {
  if (!res.ok) {
    const message = await res.text().catch(() => '')
    throw new Error(message || `API error: ${res.status}`)
  }
  return res.json()
}

export function register(payload: RegisterPayload): Promise<ApiUser> {
  return fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle)
}

export function login(payload: LoginPayload): Promise<ApiUser> {
  return fetch('/api/users/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle)
}

export function logout(): Promise<void> {
  return fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`)
  })
}

export function me(): Promise<ApiUser | null> {
  return fetch('/api/users/me', { credentials: 'include' }).then((res) => {
    if (res.status === 401) return null
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  })
}
