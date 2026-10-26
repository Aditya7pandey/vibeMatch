/**
 * Login / Sign up page.
 *
 * The form is the same for both actions; the button you press decides which
 * endpoint is called. On success App moves to #/dashboard.
 */

import { useState } from 'react'
import { errorMessage } from '../api'

interface Props {
  notice: string | null
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (email: string, password: string) => Promise<void>
}

export function LoginPage({ notice, onLogin, onSignup }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'login' | 'signup' | null>(null)

  async function run(action: 'login' | 'signup') {
    setError(null)
    setBusy(action)
    try {
      if (action === 'login') await onLogin(email, password)
      else await onSignup(email, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ marginTop: 0, marginBottom: 4 }}>Cookie-only auth</h1>
      <p style={hintStyle}>
        Log in or sign up, and you will be taken to the dashboard. The dashboard
        is protected: opening it without a session sends you back here.
      </p>

      {notice && <div style={noticeStyle}>{notice}</div>}

      <form
        style={formStyle}
        onSubmit={(e) => {
          e.preventDefault()
          void run('login')
        }}
      >
        <label style={labelStyle} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          autoComplete="email"
          required
        />

        <label style={labelStyle} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
          autoComplete="current-password"
          required
        />

        {error && <div style={errorStyle}>{error}</div>}

        <div style={rowStyle}>
          <button type="submit" disabled={busy !== null} style={btnStyle}>
            {busy === 'login' ? 'Logging in…' : 'Login'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run('signup')}
            style={btnSecondaryStyle}
          >
            {busy === 'signup' ? 'Creating…' : 'Sign up'}
          </button>
        </div>
      </form>

      <div style={cardStyle}>
        <strong>What happens when you press Login</strong>
        <ol style={listStyle}>
          <li>
            <code>POST /api/login</code> with your email and password.
          </li>
          <li>
            The backend checks the password (bcrypt) and replies with{' '}
            <strong>two httpOnly cookies</strong>: <code>accessToken</code> (15 min)
            and <code>refreshToken</code> (7 days). No token in the JSON body.
          </li>
          <li>This page moves to <code>#/dashboard</code>.</li>
          <li>
            The dashboard calls <code>GET /api/me</code>; the browser attaches the
            cookie automatically, so the backend knows who you are.
          </li>
        </ol>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: '40px auto',
  padding: '0 20px 40px',
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '20px',
}

const labelStyle: React.CSSProperties = { fontSize: '14px', color: '#374151' }

const inputStyle: React.CSSProperties = {
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '8px',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 18px',
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

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  background: '#f9fafb',
}

const listStyle: React.CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: '20px',
  fontSize: '13px',
  color: '#374151',
  lineHeight: 1.7,
}

const hintStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: 1.5,
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
}
