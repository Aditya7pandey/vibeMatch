import axios from 'axios'

/**
 * The single axios instance for the app.
 *
 * baseURL '/api' is forwarded by Vite to http://localhost:3001 and the '/api'
 * prefix is stripped (see vite.config.ts).
 *
 * withCredentials: true is REQUIRED for cookie auth: it makes the browser send
 * the httpOnly cookies with every request, and store cookies the backend sends.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export interface User {
  id: string
  email: string
}

export interface Session {
  user: User
  /** Unix timestamp (seconds) when the access token cookie expires. */
  expiresAt: number | null
  /** True when the session was rebuilt from the refresh cookie. */
  refreshed: boolean
}

/** Turn an axios/JS error into a short readable message. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined
    return data?.message || data?.error || err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

function toSession(data: { user: User; expiresAt?: number }, refreshed: boolean): Session {
  return { user: data.user, expiresAt: data.expiresAt ?? null, refreshed }
}

/**
 * Get the current session using ONLY the cookies.
 *
 *  1. GET /me            -> works while the access cookie is still valid
 *  2. if that returns 401/403 (missing or expired access cookie), POST /refresh
 *  3. then GET /me again -> the refresh call just installed a new access cookie
 *
 * Why both 401 and 403? When the access cookie's Max-Age runs out the browser
 * deletes it, so the next request has NO access cookie and the backend answers
 * 401. A tampered/otherwise invalid cookie gives 403. Either way the refresh
 * cookie may still be good, so we try to renew before giving up.
 *
 * This is the piece that was missing before: on a page reload React state is
 * empty, but the cookies are still in the browser. Calling this on startup
 * rebuilds the session, so refreshing the page no longer logs you out.
 */
export async function getSession(): Promise<Session> {
  try {
    const res = await api.get('/me')
    return toSession(res.data, false)
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    if (status !== 401 && status !== 403) throw err

    // Access cookie missing/expired -> use the refresh cookie to get a new one.
    // If the refresh cookie is also gone, this throws and the caller treats
    // the visitor as logged out.
    await api.post('/refresh')
    const res = await api.get('/me')
    return toSession(res.data, true)
  }
}

/** Same as getSession, but never throws. Returns null when not logged in. */
export async function tryGetSession(): Promise<Session | null> {
  try {
    return await getSession()
  } catch {
    return null
  }
}
