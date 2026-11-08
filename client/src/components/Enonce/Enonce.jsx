import API_BASE_URL from '../../config/api'
import { useCallback, useEffect, useState } from 'react'
import './Enonce.css'

const PLAYER_KEY = 'coteai_test_player'
const POLL_INTERVAL = 1000

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_KEY)

  if (!id) {
    id = `test_${crypto.randomUUID()}`
    localStorage.setItem(PLAYER_KEY, id)
  }

  return id
}

const PLAYER_ID = getPlayerId()

async function requestJSON(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Une erreur est survenue.')
  }

  return data
}

function formatCredits(value) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function getStatusLabel(status) {
  const labels = {
    OPEN: 'EN ATTENTE',
    WON: 'GAGNÉ',
    LOST: 'PERDU'
  }

  return labels[status] || status || 'INCONNU'
}

function IntervalCard({
  title,
  seriesName,
  interval,
  completedIntervals,
  roundsPerInterval,
  gap,
  busy,
  onBet
}) {
  const results = interval?.results || []
  const completed = interval?.completed || false
  const total = interval?.expectedRounds || roundsPerInterval
  const progress = Math.min((results.length / total) * 100, 100)
  const bettingOpen = Boolean(interval?.bettingOpen && !completed)
  const stake = seriesName === 'A' ? 5 : 10

  return (
    <article className="interval-card">
      <div className="interval-heading">
        <h3>{title}</h3>
        <span>{completedIntervals} interval(s) terminé(s)</span>
      </div>

      {interval ? (
        <>
          <div className="interval-number">
            Intervalle #{interval.intervalNumber}
          </div>

          <div className="interval-rounds">
            Round {interval.startRound} – {interval.endRound}
          </div>

          <div className="interval-progress">
            <div
              className="interval-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="interval-progress-text">
            <span>{results.length} / {total} rounds</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="interval-metrics">
            <div>
              <small>Moyenne</small>
              <strong>
                {completed && Number.isFinite(interval.averageMultiplier)
                  ? `${interval.averageMultiplier.toFixed(2)}x`
                  : '—'}
              </strong>
            </div>

            <div>
              <small>Médiane</small>
              <strong>
                {completed && Number.isFinite(interval.medianMultiplier)
                  ? `${interval.medianMultiplier.toFixed(2)}x`
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="interval-objective">
            <span>Objectif fixe</span>
            <strong>
              {Number.isFinite(interval.objective)
                ? `${interval.objective.toFixed(2)}x`
                : 'En attente'}
            </strong>
          </div>

          <p className="interval-status">
            {completed
              ? 'Intervalle terminé'
              : bettingOpen
                ? 'Période de pari ouverte'
                : 'Intervalle en cours'}
          </p>

          {bettingOpen && (
            <button
              type="button"
              className="interval-bet-button"
              onClick={() => onBet(seriesName)}
              disabled={busy || !Number.isFinite(interval.objective)}
            >
              {busy
                ? 'TRAITEMENT…'
                : `PARIER · ${stake} DΛI`}
            </button>
          )}
        </>
      ) : (
        <p className="interval-empty">
          En attente du prochain intervalle.
        </p>
      )}

      <small className="interval-gap">
        {roundsPerInterval} rounds par intervalle · {gap} rounds de pause
      </small>
    </article>
  )
}

function Enonce() {
  const [intervalState, setIntervalState] = useState(null)
  const [history, setHistory] = useState([])
  const [balance, setBalance] = useState(0)

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busySeries, setBusySeries] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [intervalData, historyData] = await Promise.all([
        requestJSON('/api/intervals/status'),
        requestJSON(
          `/api/intervals/bets/history?playerId=${encodeURIComponent(PLAYER_ID)}`
        )
      ])

      setIntervalState(intervalData)
      setHistory(historyData.history || [])

      if (typeof historyData.balance === 'number') {
        setBalance(historyData.balance)
      }

      setConnected(true)
      setError('')
    } catch (err) {
      setConnected(false)
      setError(err.message || 'Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    let timer

    async function poll() {
      if (!active) return

      await refresh()

      if (active) {
        timer = setTimeout(poll, POLL_INTERVAL)
      }
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [refresh])

  async function placeIntervalBet(series) {
    if (busySeries) return

    setBusySeries(series)
    setError('')
    setMessage('')

    try {
      const result = await requestJSON('/api/intervals/bet', {
        method: 'POST',
        body: JSON.stringify({
          playerId: PLAYER_ID,
          series
        })
      })

      if (typeof result.balance === 'number') {
        setBalance(result.balance)
      }

      setMessage(
        `Pari placé sur la série ${series}, intervalle #${result.bet.intervalNumber}.`
      )

      await refresh()
    } catch (err) {
      setError(err.message || 'Impossible de placer le pari.')
      await refresh()
    } finally {
      setBusySeries(null)
    }
  }

  const config = intervalState?.config
  const series = intervalState?.series

  return (
    <section className="enonce-section">
      <div className="enonce-header">
        <div>
          <span className="enonce-eyebrow">SYSTÈME D'INTERVALLES</span>
          <h2>Énoncés</h2>
        </div>

        <span className={`enonce-live ${connected ? '' : 'offline'}`}>
          {connected ? 'SYSTÈME CONNECTÉ' : 'DÉCONNECTÉ'}
        </span>
      </div>

      <div className="interval-wallet">
        <div>
          <span>WALLET PARTAGÉ</span>
          <strong>{formatCredits(balance)} DΛI</strong>
          <small>Solde commun aux deux systèmes de paris</small>
        </div>
      </div>

      {error && (
        <p className="interval-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="interval-success" role="status">
          {message}
        </p>
      )}

      {!config || !series ? (
        <p className="interval-empty">
          {loading
            ? 'Chargement des intervalles...'
            : 'Données des intervalles indisponibles.'}
        </p>
      ) : (
        <>
          <div className="interval-grid">
            <IntervalCard
              title="Série A"
              seriesName="A"
              interval={series.A.currentInterval}
              completedIntervals={series.A.completedIntervals}
              roundsPerInterval={config.A.roundsPerInterval}
              gap={config.A.gap}
              busy={busySeries === 'A'}
              onBet={placeIntervalBet}
            />

            <IntervalCard
              title="Série B"
              seriesName="B"
              interval={series.B.currentInterval}
              completedIntervals={series.B.completedIntervals}
              roundsPerInterval={config.B.roundsPerInterval}
              gap={config.B.gap}
              busy={busySeries === 'B'}
              onBet={placeIntervalBet}
            />
          </div>
        </>
      )}

      <div className="interval-history">
        <div className="interval-history-heading">
          <h3>Historique de mes paris</h3>
          <span>{history.length} pari(s)</span>
        </div>

        {history.length === 0 ? (
          <p className="interval-empty">
            Aucun pari sur les intervalles pour le moment.
          </p>
        ) : (
          <div className="interval-history-list">
            {[...history].reverse().map((bet) => (
              <article className="interval-history-item" key={bet.id}>
                <div>
                  <strong>
                    Série {bet.series} · Intervalle #{bet.intervalNumber}
                  </strong>
                  <small>
                    Objectif : {Number(bet.objective).toFixed(2)}x
                    {' · '}
                    Mise : {formatCredits(bet.stake)} DΛI
                  </small>
                </div>

                <div className="interval-history-result">
                  <span className={`interval-bet-status ${String(bet.status).toLowerCase()}`}>
                    {getStatusLabel(bet.status)}
                  </span>

                  <strong>
                    {bet.status === 'OPEN'
                      ? 'En attente'
                      : `${formatCredits(bet.payout)} DΛI`}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="interval-test-notice">
        Mode test uniquement : DΛI représente des crédits virtuels de simulation,
        sans valeur monétaire réelle.
      </p>
    </section>
  )
}

export default Enonce
