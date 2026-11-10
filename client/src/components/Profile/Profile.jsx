import { useState } from 'react'
import API_BASE_URL from '../../config/api'
import './Profile.css'

export default function Profile({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState('menu')
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coteai_user'))
    } catch {
      return null
    }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitAuth(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = page === 'register'
        ? '/api/auth/register'
        : '/api/auth/login'

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Une erreur est survenue.')
      }

      if (page === 'register') {
        setPage('login')
        setPassword('')
        setError('Compte créé. Connectez-vous maintenant.')
        return
      }

      localStorage.setItem('coteai_token', data.token)
      localStorage.setItem('coteai_user', JSON.stringify(data.user))
      setUser(data.user)
      setEmail('')
      setPassword('')
      setPage('menu')
    } catch (err) {
      setError(err.message || 'Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('coteai_token')
    localStorage.removeItem('coteai_user')
    setUser(null)
    setPage('menu')
  }

  function navigateTo(destination) {
    setOpen(false)
    if (onNavigate) onNavigate(destination)
  }

  return (
    <div className="profile-container">
      <button
        type="button"
        className="profile-button"
        aria-label="Ouvrir le profil"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
          setPage('menu')
          setError('')
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
      </button>

      {open && (
        <>
          <button
            className="profile-backdrop"
            aria-label="Fermer le profil"
            onClick={() => setOpen(false)}
          />

          <section className="profile-panel">
            <div className="profile-panel-header">
              <strong>{user ? 'Mon compte' : 'Mon profil'}</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {page === 'menu' && (
              <div className="profile-menu">
                {user ? (
                  <>
                    <p className="profile-email">{user.email}</p>
                    <button onClick={() => navigateTo('api-keys')}>
                      API Keys
                    </button>
                    <button onClick={() => navigateTo('api-docs')}>
                      Documentation API Keys
                    </button>
                    <button className="profile-logout" onClick={logout}>
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      setPage('register')
                      setError('')
                    }}>
                      Enskri
                    </button>
                    <button onClick={() => {
                      setPage('login')
                      setError('')
                    }}>
                      Konekte
                    </button>
                  </>
                )}
              </div>
            )}

            {(page === 'register' || page === 'login') && (
              <form className="profile-form" onSubmit={submitAuth}>
                <h3>
                  {page === 'register' ? 'Créer un compte' : 'Connexion'}
                </h3>

                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Votre adresse email"
                  required
                />

                <label htmlFor="profile-password">Mot de passe</label>
                <input
                  id="profile-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="8 caractères minimum"
                  minLength={8}
                  required
                />

                {error && (
                  <p className="profile-feedback" role="alert">{error}</p>
                )}

                <button type="submit" disabled={loading}>
                  {loading
                    ? 'Veuillez patienter...'
                    : page === 'register'
                      ? 'Créer mon compte'
                      : 'Se connecter'}
                </button>

                <button
                  type="button"
                  className="profile-back"
                  onClick={() => {
                    setPage('menu')
                    setError('')
                  }}
                >
                  Retour
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  )
}
