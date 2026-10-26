/**
 * App shell: tiny hash-based router + session restore.
 *
 * WHY THE RELOAD USED TO LOG YOU OUT
 * ----------------------------------
 * The previous version kept `user` in React state only. Pressing F5 wiped that
 * state, so the UI thought nobody was logged in — even though the cookies were
 * still in the browser.
 *
 * THE FIX
 * -------
 * On startup we call GET /me. The browser sends the accessToken cookie
 * automatically, so the backend tells us who we are and the session is rebuilt.
 * If the 15-minute access cookie has expired we call POST /refresh (the browser
 * sends the refreshToken cookie), get a new access cookie, and retry /me.
 *
 * ROUTING
 * -------
 * Two pages: #/login and #/dashboard. Visiting #/dashboard without a session
 * redirects to #/login, and visiting #/login while logged in redirects to
 * #/dashboard. No react-router needed for a demo this size.
 */

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { api, tryGetSession, type Session, type User } from './api'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

type Route = 'login' | 'dashboard'

function readRoute(): Route {
  return window.location.hash === '#/dashboard' ? 'dashboard' : 'login'
}

export function App() {
  const [route, setRoute] = useState<Route>(readRoute)
  const [session, setSession] = useState<Session | null>(null)

  // 'checking' while we ask the backend who we are on first load
  const [status, setStatus] = useState<'checking' | 'ready'>('checking')
  const [notice, setNotice] = useState<string | null>(null)

  // ---------- 1. restore the session from the cookies on every page load ----------
  useEffect(() => {
    let cancelled = false

    tryGetSession().then((restored) => {
      if (cancelled) return
      setSession(restored)
      if (restored?.refreshed) {
        setNotice('Access cookie had expired, so it was renewed with the refresh cookie.')
      }
      setStatus('ready')
    })

    return () => {
      cancelled = true
    }
  }, [])

  // ---------- 2. keep the URL and the session in sync ----------
  useEffect(() => {
    function onHashChange() {
      setRoute(readRoute())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (status !== 'ready') return

    // Not logged in but trying to view the dashboard -> send to login
    if (!session && route === 'dashboard') {
      window.location.hash = '#/login'
      setNotice('Please log in to open the dashboard.')
      return
    }

    // Logged in but sitting on the login page -> send to the dashboard
    if (session && route === 'login') {
      window.location.hash = '#/dashboard'
    }
  }, [session, route, status])

  // ---------- 3. actions ----------

  async function afterAuth(user: User, expiresAt: number | null) {
    setSession({ user, expiresAt, refreshed: false })
    setNotice(null)
    window.location.hash = '#/dashboard'
  }

  async function handleLogin(email: string, password: string) {
    const res = await api.post('/login', { email, password })
    await afterAuth(res.data.user, res.data.expiresAt ?? null)
  }

  async function handleSignup(email: string, password: string) {
    const res = await api.post('/signup', { email, password })
    await afterAuth(res.data.user, res.data.expiresAt ?? null)
  }

  async function handleLogout() {
    try {
      await api.post('/logout')
    } catch {
      // ignore: we still clear the local session below
    }
    setSession(null)
    setNotice('You have been logged out.')
    window.location.hash = '#/login'
  }

  async function handleRefresh() {
    const res = await api.post('/refresh')
    setSession({ user: res.data.user, expiresAt: res.data.expiresAt ?? null, refreshed: true })
    setNotice('Got a new access token cookie from the refresh token cookie.')
  }

  // ---------- 2b. renew the access cookie automatically when it expires ----------
  // The countdown on the dashboard hits zero after 15 minutes. Rather than let
  // the user discover a dead session, quietly trade the refresh cookie for a
  // new access cookie.
  const renewingRef = useRef(false)

  useEffect(() => {
    if (!session?.expiresAt) return

    const msLeft = session.expiresAt * 1000 - Date.now()
    const timer = window.setTimeout(async () => {
      if (renewingRef.current) return
      renewingRef.current = true
      try {
        const res = await api.post('/refresh')
        setSession({
          user: res.data.user,
          expiresAt: res.data.expiresAt ?? null,
          refreshed: true,
        })
        setNotice('Access cookie expired and was renewed automatically.')
      } catch {
        // Refresh cookie is gone/expired -> the session really is over.
        setSession(null)
        setNotice('Your session expired. Please log in again.')
      } finally {
        renewingRef.current = false
      }
    }, Math.max(msLeft, 0) + 500)

    return () => window.clearTimeout(timer)
  }, [session?.expiresAt])

  /** Ask a protected endpoint for data, renewing the access cookie once if needed. */
  async function handleLoadProfile(): Promise<{ user: User; expiresAt: number | null }> {
    try {
      const res = await api.get('/me')
      setSession((s) => (s ? { ...s, user: res.data.user, expiresAt: res.data.expiresAt } : s))
      return res.data
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status !== 401 && status !== 403) throw err

      // Access cookie expired (browser deleted it) or was invalid.
      // Trade the refresh cookie for a new access cookie, then retry once.
      const refreshed = await api.post('/refresh')
      const res = await api.get('/me')
      setSession({
        user: res.data.user,
        expiresAt: res.data.expiresAt ?? refreshed.data.expiresAt ?? null,
        refreshed: true,
      })
      setNotice('Your access cookie had expired; it was renewed automatically before retrying.')
      return { user: res.data.user, expiresAt: res.data.expiresAt ?? refreshed.data.expiresAt ?? null }
    }
  }

  // ---------- 4. render ----------

  if (status === 'checking') {
    return (
      <div style={centerStyle}>
        <p style={{ color: '#6b7280' }}>Checking your session…</p>
      </div>
    )
  }

  if (session && route === 'dashboard') {
    return (
      <DashboardPage
        user={session.user}
        expiresAt={session.expiresAt}
        notice={notice}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
        onLoadProfile={handleLoadProfile}
      />
    )
  }

  return (
    <LoginPage
      notice={notice}
      onLogin={handleLogin}
      onSignup={handleSignup}
    />
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
