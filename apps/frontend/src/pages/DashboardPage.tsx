/**
 * Protected dashboard.
 *
 * You can only see this page when App has a session. App restores that session
 * from the cookies on every page load, which is why refreshing no longer logs
 * you out.
 *
 * Everything here is a demonstration of one part of the cookie flow:
 *   - the countdown shows when the 15-minute access cookie expires
 *   - "Refresh" trades the 7-day refresh cookie for a new access cookie
 *   - "Load profile" calls a protected route with no headers at all
 *   - "Logout" clears both cookies on the backend
 */

import { useEffect, useState } from 'react'
import { errorMessage, type User } from '../api'

interface Props {
  user: User
  expiresAt: number | null
  notice: string | null
  onRefresh: () => Promise<void>
  onLogout: () => Promise<void>
  onLoadProfile: () => Promise<{ user: User; expiresAt: number | null }>
}

/** "12m 30s" / "expired" */
function formatRemaining(expiresAt: number | null, now: number): string {
  if (!expiresAt) return 'unknown'
  const seconds = Math.round(expiresAt - now / 1000)
  if (seconds <= 0) return 'expired'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function DashboardPage({
  user,
  expiresAt,
  notice,
  onRefresh,
  onLogout,
  onLoadProfile,
}: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [profile, setProfile] = useState<User | null>(null)
  const [busy, setBusy] = useState<'refresh' | 'profile' | 'logout' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  // Tick once a second so the countdown stays live.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  function addLog(line: string) {
    setLog((old) => [`${new Date().toLocaleTimeString()}  ${line}`, ...old].slice(0, 20))
  }

  async function run(action: 'refresh' | 'profile' | 'logout') {
    setError(null)
    setBusy(action)
    try {
      if (action === 'refresh') {
        addLog('-> POST /refresh')
        await onRefresh()
        addLog('<- 200 new accessToken cookie')
      } else if (action === 'profile') {
        addLog('-> GET /me')
        const data = await onLoadProfile()
        setProfile(data.user)
        addLog(`<- 200 ${data.user.email}`)
      } else {
        addLog('-> POST /logout')
        await onLogout()
      }
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      addLog(`<- failed: ${message}`)
    } finally {
      setBusy(null)
    }
  }

  const expired = expiresAt !== null && expiresAt - now / 1000 <= 0

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Protected page · signed in as <strong>{user.email}</strong>
          </p>
        </div>
        <button
          onClick={() => void run('logout')}
          disabled={busy !== null}
          style={btnDangerStyle}
        >
          {busy === 'logout' ? 'Logging out…' : 'Logout'}
        </button>
      </header>

      {notice && <div style={noticeStyle}>{notice}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {/* ---------- session ---------- */}
      <section style={cardStyle}>
        <h2 style={h2Style}>Session</h2>
        <dl style={dlStyle}>
          <dt style={dtStyle}>User ID</dt>
          <dd style={ddStyle}>
            <code>{user.id}</code>
          </dd>

          <dt style={dtStyle}>Email</dt>
          <dd style={ddStyle}>{user.email}</dd>

          <dt style={dtStyle}>Access cookie</dt>
          <dd style={ddStyle}>
            {expired ? (
              <span style={{ color: '#dc2626', fontWeight: 600 }}>expired</span>
            ) : (
              <span style={{ color: '#059669', fontWeight: 600 }}>
                valid · {formatRemaining(expiresAt, now)} left
              </span>
            )}
          </dd>

          <dt style={dtStyle}>Refresh cookie</dt>
          <dd style={ddStyle}>7 days (httpOnly, not readable by JS)</dd>
        </dl>

        <div style={rowStyle}>
          <button onClick={() => void run('refresh')} disabled={busy !== null} style={btnStyle}>
            {busy === 'refresh' ? 'Refreshing…' : 'Refresh access token'}
          </button>
          <button
            onClick={() => void run('profile')}
            disabled={busy !== null}
            style={btnSecondaryStyle}
          >
            {busy === 'profile' ? 'Loading…' : 'Load profile (GET /me)'}
          </button>
        </div>

        {profile && (
          <p style={hintStyle}>
            <strong>GET /me returned:</strong> {profile.email} ({profile.id})
          </p>
        )}
      </section>

      {/* ---------- how it works ---------- */}
      <section style={cardStyle}>
        <h2 style={h2Style}>Why refreshing keeps you logged in</h2>
        <p style={hintStyle}>
          React state is lost on reload, but the cookies are not. On startup the app
          calls <code>GET /api/me</code>; the browser sends the access cookie by
          itself, so the session comes back. If that cookie has expired, the app
          calls <code>POST /api/refresh</code>, gets a new one, and retries.
        </p>
        <p style={hintStyle}>
          Try it: press <strong>F5</strong> right now. You stay here. Then open
          DevTools → Application → Cookies: <code>accessToken</code> and{' '}
          <code>refreshToken</code> are both httpOnly, so{' '}
          <code>document.cookie</code> in the console prints nothing.
        </p>
        <p style={hintStyle}>
          Try the redirect too: log out, then type <code>#/dashboard</code> in the
          address bar. You are sent back to the login page.
        </p>
      </section>

      {/* ---------- log ---------- */}
      <section style={cardStyle}>
        <h2 style={h2Style}>Request log</h2>
        {log.length === 0 ? (
          <p style={hintStyle}>Nothing yet. Press a button above.</p>
        ) : (
          <pre style={logStyle}>{log.join('\n')}</pre>
        )}
      </section>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 20px 48px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
  paddingBottom: '16px',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '20px',
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 18px',
  marginBottom: '16px',
  background: '#ffffff',
}

const h2Style: React.CSSProperties = {
  fontSize: '15px',
  margin: '0 0 12px',
  color: '#111827',
}

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: '8px 12px',
  margin: 0,
  fontSize: '13px',
}

const dtStyle: React.CSSProperties = { color: '#6b7280' }
const ddStyle: React.CSSProperties = { margin: 0, wordBreak: 'break-all' }

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '16px',
}

const btnStyle: React.CSSProperties = {
  padding: '9px 16px',
  border: 'none',
  borderRadius: '6px',
  background: '#2563eb',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondaryStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#111827',
}

const btnDangerStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#dc2626',
}

const logStyle: React.CSSProperties = {
  margin: 0,
  padding: '10px',
  borderRadius: '6px',
  background: '#111827',
  color: '#e5e7eb',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const hintStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#4b5563',
  lineHeight: 1.6,
  margin: '12px 0 0',
}

const noticeStyle: React.CSSProperties = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  padding: '10px',
  borderRadius: '6px',
  fontSize: '13px',
  marginBottom: '16px',
}

const errorStyle: React.CSSProperties = {
  color: '#dc2626',
  background: '#fef2f2',
  padding: '10px',
  borderRadius: '6px',
  fontSize: '14px',
  marginBottom: '16px',
}
