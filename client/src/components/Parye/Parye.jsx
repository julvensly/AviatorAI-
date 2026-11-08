import { useCallback, useEffect, useState } from 'react'
import './Parye.css'

const PLAYER_KEY = 'coteai_test_player'

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
  const response = await fetch(url, {
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
    PENDING: 'EN ATTENTE',
    ACTIVE: 'EN COURS',
    CASHED_OUT: 'CASHOUT RÉUSSI',
    CANCELLED: 'ANNULÉ',
    LOST: 'PERDU'
  }

  return labels[status] || status || 'AUCUN'
}

function Parye() {
  const [stake, setStake] = useState('25')
  const [bet, setBet] = useState(null)
  const [balance, setBalance] = useState(0)
  const [engine, setEngine] = useState(null)

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [betData, historyData, engineData] = await Promise.all([
        requestJSON(
          `/api/bets/current?playerId=${encodeURIComponent(PLAYER_ID)}`
        ),
        requestJSON(
          `/api/bets/history?playerId=${encodeURIComponent(PLAYER_ID)}`
        ),
        requestJSON('/api/engine/status')
      ])

      setBet(betData.bet)
      setBalance(betData.balance)
      setEngine(engineData)
      setConnected(true)
      setError('')
    } catch (err) {
      setConnected(false)
      setError(err.message || 'Connexion au serveur impossible.')
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
        timer = setTimeout(poll, 900)
      }
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [refresh])

  async function performAction(action) {
    if (busy) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      let result

      if (action === 'PLACE') {
        const amount = Number(stake)

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error('Entrez un montant valide.')
        }

        result = await requestJSON('/api/bets', {
          method: 'POST',
          body: JSON.stringify({
            playerId: PLAYER_ID,
            stake: amount
          })
        })
      }

      if (action === 'CANCEL') {
        if (!bet) {
          throw new Error('Aucun pari à annuler.')
        }

        result = await requestJSON(
          `/api/bets/${encodeURIComponent(bet.id)}/cancel`,
          {
            method: 'POST',
            body: JSON.stringify({
              playerId: PLAYER_ID
            })
          }
        )
      }

      if (action === 'CASHOUT') {
        if (!bet) {
          throw new Error('Aucun pari actif.')
        }

        result = await requestJSON(
          `/api/bets/${encodeURIComponent(bet.id)}/cashout`,
          {
            method: 'POST',
            body: JSON.stringify({
              playerId: PLAYER_ID
            })
          }
        )
      }

      if (result) {
        setBet(
          ['CANCEL', 'CASHOUT'].includes(action)
            ? null
            : result.bet
        )

        if (typeof result.balance === 'number') {
          setBalance(result.balance)
        }

        if (action === 'PLACE') {
          setMessage(
            `Pari placé sur le round #${result.bet.roundId}.`
          )
        }

        if (action === 'CANCEL') {
          setMessage('Pari annulé. Vos crédits ont été remboursés.')
        }

        if (action === 'CASHOUT') {
          setMessage(
            `Cashout réussi à ${Number(
              result.bet.cashoutMultiplier
            ).toFixed(2)}x. Gain : ${formatCredits(result.bet.payout)} crédits.`
          )
        }
      }

      await refresh()
    } catch (err) {
      setError(err.message || 'Impossible de réaliser cette action.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const round = engine?.currentRound

  const isRunning = Boolean(
    engine?.running &&
    round
  )

  const openBet = Boolean(
    bet && ['PENDING', 'ACTIVE'].includes(bet.status)
  )

  const isPending = bet?.status === 'PENDING'
  const isActive = bet?.status === 'ACTIVE'

  const canCashout = Boolean(
    isActive &&
    isRunning &&
    round?.roundId === bet?.roundId
  )

  const amount = Number(stake)

  const validStake = Boolean(
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= balance
  )

  const estimatedPayout = isActive && round
    ? Number((bet.stake * round.multiplier).toFixed(2))
    : 0


  return (
    <section id="parye-section" className="parye-section">
      <div className="parye-heading">
        <div>
          <span className="parye-eyebrow">ESPACE JOUEUR</span>
          <h2>Mes paris</h2>
        </div>

        <span className={`parye-connection ${connected ? 'online' : ''}`}>
          <span />
          {connected ? 'CONNECTÉ' : 'HORS LIGNE'}
        </span>
      </div>

      <div className="parye-balance">
        <div>
          <span className="parye-label">SOLDE VIRTUEL</span>
          <strong>{formatCredits(balance)}</strong>
          <small>Crédits de simulation</small>
        </div>

        <div className="parye-balance-icon">₡</div>
      </div>

      {error && (
        <div className="parye-alert error" role="alert">
          <strong>Attention</strong>
          <p>{error}</p>
        </div>
      )}

      {message && !error && (
        <div className="parye-alert success" role="status">
          {message}
        </div>
      )}

      <div className="parye-card">
        <div className="parye-card-heading">
          <div>
            <span className="parye-label">VOTRE PARI</span>
            <h3>
              {openBet ? `Round #${bet.roundId}` : 'Nouveau pari'}
            </h3>
          </div>

          {bet && (
            <span className={`parye-status ${bet.status.toLowerCase()}`}>
              {getStatusLabel(bet.status)}
            </span>
          )}
        </div>

        {!openBet ? (
          <>
            <label className="parye-input-label" htmlFor="parye-stake">
              Montant du pari
            </label>

            <div className="parye-input-wrap">
              <input
                id="parye-stake"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={stake}
                onChange={(event) => setStake(event.target.value)}
                disabled={busy || !connected}
              />

              <span>CRÉDITS</span>
            </div>

            <div className="parye-presets">
              {[10, 25, 50, 100].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={Number(stake) === value ? 'selected' : ''}
                  onClick={() => setStake(String(value))}
                  disabled={busy || !connected}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="parye-info-row">
              <span>Round actuel</span>
              <strong>
                {round?.roundId
                  ? `#${round.roundId}`
                  : 'En attente'}
              </strong>
            </div>

            <div className="parye-info-row">
              <span>Prochain round</span>
              <strong>
                #{round?.roundId
                  ? round.roundId + 1
                  : engine?.nextRoundId ?? '—'}
              </strong>
            </div>

            <div className="parye-info-row">
              <span>Débit prévu</span>
              <strong>{formatCredits(amount)} crédits</strong>
            </div>

            <button
              type="button"
              className="parye-main-button"
              onClick={() => performAction('PLACE')}
              disabled={
                !connected ||
                loading ||
                busy ||
                !validStake ||
                openBet
              }
            >
              {busy ? 'TRAITEMENT…' : 'PARIER'}
            </button>

            <p className="parye-hint">
              Votre pari cible le prochain round. Les crédits seront
              débités lors de la validation du pari.
            </p>
          </>
        ) : (
          <>
            <div className="parye-bet-summary">
              <div className="parye-summary-item">
                <span>Montant</span>
                <strong>{formatCredits(bet.stake)}</strong>
              </div>

              <div className="parye-summary-item">
                <span>Round cible</span>
                <strong>#{bet.roundId}</strong>
              </div>

              <div className="parye-summary-item">
                <span>État</span>
                <strong>{getStatusLabel(bet.status)}</strong>
              </div>
            </div>

            {isActive && (
              <p className="parye-hint">
                Le cashout dépend du multiplicateur fourni par le backend.
                Le payout affiché est une estimation avant validation.
              </p>
            )}

            {isPending ? (
              <button
                type="button"
                className="parye-main-button cancel-button"
                onClick={() => performAction('CANCEL')}
                disabled={busy || !connected}
              >
                {busy ? 'TRAITEMENT…' : 'ANNULER LE PARI'}
              </button>
            ) : (
              <button
                type="button"
                className="parye-main-button cashout-button"
                onClick={() => performAction('CASHOUT')}
                disabled={busy || !connected || !canCashout}
              >
                {busy
                  ? 'TRAITEMENT…'
                  : canCashout
                    ? `CASHOUT · ${formatCredits(estimatedPayout)}`
                    : 'CASHOUT INDISPONIBLE'}
              </button>
            )}

            {isActive && !canCashout && (
              <p className="parye-hint">
                Le round cible n'est pas actuellement disponible pour le
                cashout.
              </p>
            )}
          </>
        )}
      </div>

      <div className="parye-test-notice">
        <strong>Mode test uniquement</strong>
        <p>
          Ce système utilise des crédits virtuels. Il ne s'agit pas
          d'argent réel. Les résultats sont ceux d'une simulation
          théorique et ne prédisent pas les résultats d'un jeu réel.
        </p>
      </div>
    </section>
  )
}

export default Parye
