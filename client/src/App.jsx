import API_BASE_URL from './config/api'
import { useEffect, useState } from 'react'
import './App.css'

import History from './components/History/History'
import Enonce from './components/Enonce/Enonce'
import Parye from './components/Parye/Parye'
import Profile from './components/Profile/Profile'
import ApiKeys from './components/ApiKeys/ApiKeys'
import ApiDocumentation from './components/ApiDocumentation/ApiDocumentation'

const MULTIPLIER_POLL_INTERVAL = 50
const HISTORY_POLL_INTERVAL = 1000

async function fetchJSON(url) {
  const response = await fetch(`${API_BASE_URL}${url}`)
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Erreur serveur.')
  }

  return data
}

function App() {
  const [engine, setEngine] = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState('home')
  useEffect(() => {
    let active = true
    let statusTimer
    let historyTimer

    async function refreshStatus() {
      try {
        const statusData = await fetchJSON("/api/engine/status")

        if (!active) return

        setEngine(statusData)
        setConnected(true)
        setError("")
      } catch (err) {
        if (!active) return

        setConnected(false)
        setError(err.message || "Impossible de contacter COTE.AI.")
      } finally {
        if (active) {
          statusTimer = setTimeout(refreshStatus, MULTIPLIER_POLL_INTERVAL)
        }
      }
    }

    async function refreshHistory() {
      try {
        const historyData = await fetchJSON("/api/engine/history")

        if (!active) return

        setHistory(historyData.history || [])
      } catch (err) {
        console.error("Erreur chargement historique:", err)
      } finally {
        if (active) {
          historyTimer = setTimeout(refreshHistory, HISTORY_POLL_INTERVAL)
        }
      }
    }

    refreshStatus()
    refreshHistory()

    return () => {
      active = false
      clearTimeout(statusTimer)
      clearTimeout(historyTimer)
    }
  }, [])

  const currentRound = engine?.currentRound
  const running = Boolean(engine?.running && currentRound)

  const isCountdown = Boolean(
    connected &&
    engine?.running &&
    engine?.status === 'WAITING' &&
    typeof engine?.countdownRemainingSeconds === 'number'
  )

  const countdown = isCountdown
    ? engine.countdownRemainingSeconds
    : null

  const displayedRoundId =
    currentRound?.roundId ?? engine?.nextRoundId

  const multiplier =
    typeof currentRound?.multiplier === 'number'
      ? currentRound.multiplier.toFixed(2)
      : '—'

  return (
    <main className="app">

      <header className="topbar">
        <div className="brand">
          <Profile onNavigate={setActivePage} />

          <span className="brand-text">
            <strong>COTE.AI</strong>
            <small>SIMULATION ENGINE</small>
          </span>
        </div>

        <div
          className={`server-status ${
            connected ? 'online' : 'offline'
          }`}
        >
          <span className="status-dot" />
          <span>
            {connected ? 'SERVER CONNECTÉ' : 'DÉCONNECTÉ'}
          </span>
        </div>
      </header>

      {activePage === 'api-keys' ? (
        <ApiKeys onNavigate={setActivePage} />
      ) : activePage === 'api-docs' ? (
        <ApiDocumentation onNavigate={setActivePage} />
      ) : (
        <>
      <section className="welcome">
        <div className="eyebrow">
          <span className="live-indicator" />
          SIMULATION EN DIRECT
        </div>

        <h1>
          COTE<span>AI</span>
        </h1>
      </section>

      <div className="sticky-cote">

      <section className="live-card">
        <div className="round-header">
          <div>
            <span className="label">
              {isCountdown ? 'PROCHAIN ROUND' : 'ROUND ACTUEL'}
            </span>

            <h2>
              {displayedRoundId
                ? `#${displayedRoundId}`
                : '—'}
            </h2>
          </div>

          <span
            className={`badge ${
              running ? 'live' : 'waiting'
            }`}
          >
            <span className="badge-dot" />

            {running
              ? 'LIVE'
              : isCountdown
                ? 'PROCHAIN ROUND'
                : connected
                  ? engine?.status || 'EN ATTENTE'
                  : 'HORS LIGNE'}
          </span>
        </div>

        <div
          className={`multiplier-display ${
            running ? 'is-running' : ''
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="multiplier-label">
            {isCountdown ? 'PROCHAIN ROUND DANS' : 'COTE'}
          </span>

          <strong>
            {isCountdown ? countdown : multiplier}
            <span>{isCountdown ? 's' : 'x'}</span>
          </strong>

          <div className="multiplier-line" />
        </div>

        <div className="live-message">
          <span
            className={`message-dot ${
              running ? 'active' : ''
            }`}
          />

          {running
            ? 'Round en cours'
            : isCountdown
              ? `Le prochain round commence dans ${countdown} seconde${countdown > 1 ? 's' : ''}`
              : connected
                ? 'En attente du prochain round'
                : 'Connexion au serveur en cours…'}
        </div>
      </section>

        <nav className="sticky-navigation" aria-label="Navigation principale">
          <a href="#history-section">History</a>
          <a href="#parye-section">Parié</a>
          <a href="#enonce-section">Énoncé</a>
        </nav>

      </div>

      {error && (
        <section className="error-box" role="alert">
          <strong>Connexion interrompue</strong>
          <p>{error}</p>
          <small>
            La connexion sera réessayée automatiquement.
          </small>
        </section>
        )}

      <section
className="dashboard-panels" aria-label="Navigation du tableau de bord">
        <div id="history-section" className="navigation-target">
          <History history={history} />
        </div>
        <div id="parye-section" className="navigation-target">
          <Parye />
        </div>
        <div id="enonce-section" className="navigation-target">
          <Enonce />
          <div className="disclaimer">
            <span className="disclaimer-icon">i</span>
            <p>COTEAI est un outil expérimental de simulation. Les multiplicateurs affichés proviennent de nos algorithmes théoriques et ne prédisent pas les résultats d’un jeu réel.</p>
          </div>
        </div>
      </section>


        </>
      )}
      <footer className="footer">
        <span>COTEAI © 2026</span>
        <span>SIMULATION ENGINE</span>
      </footer>
    </main>
  )
}

export default App
