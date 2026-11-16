import './ApiKeys.css'

export default function ApiKeys({ onNavigate }) {
  return (
    <section className="api-keys-page">
      <header className="api-keys-header">
        <button onClick={() => onNavigate('home')}>
          ← Retour
        </button>

        <h1>API Keys</h1>
        <p>Gérez vos clés API COTE.AI.</p>
      </header>

      <div className="api-keys-summary">
        <span>Mes API Keys</span>
        <strong>0</strong>
        <small>Clés API créées</small>
      </div>

      <div className="api-keys-empty">
        <h2>Aucune API Key</h2>
        <p>
          Vous n'avez pas encore créé de clé API.
          Consultez la documentation pour commencer.
        </p>

        <button onClick={() => onNavigate('api-docs')}>
          Créer une API Key
        </button>
      </div>
    </section>
  )
}
