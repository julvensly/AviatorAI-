import './History.css'

function History({ history }) {
  const recentHistory = [...history].reverse().slice(0, 8)

  return (
    <section className="history-section">
      <div className="section-heading">
        <div>
          <span className="section-number">ACTIVITÉ</span>
          <h2>Historique des rounds</h2>
        </div>

        <span className="history-count">
          {history.length} enregistrés
        </span>
      </div>

      {recentHistory.length > 0 ? (
        <div className="history-list">
          {recentHistory.map((round) => (
            <article
              className="history-item"
              key={round.roundId}
            >
              <div className="history-round">
                <span className="history-check">✓</span>

                <div>
                  <strong>Round #{round.roundId}</strong>
                  <small>Round terminé</small>
                </div>
              </div>

              <div className="history-result">
                {typeof round.finalMultiplier === 'number'
                  ? `${round.finalMultiplier.toFixed(2)}x`
                  : '—'}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">↗</div>
          <h3>Aucun round terminé</h3>
          <p>
            Les résultats apparaîtront ici
            à mesure que les rounds se terminent.
          </p>
        </div>
      )}
    </section>
  )
}

export default History
