import { useEffect, useState } from 'react'
import API_BASE_URL from '../../config/api'
import './ApiKeys.css'

export default function ApiKeys({ onNavigate, onContinue, newlyCreatedKeyId }) {
  const [showForm, setShowForm] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [apiKeys, setApiKeys] = useState([])
  const [revealedKeys, setRevealedKeys] = useState({})
  const [loadingSecrets, setLoadingSecrets] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadApiKeys() {
    const token = localStorage.getItem('coteai_token')

    if (!token) {
      setError('Veuillez vous connecter.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur serveur.')
      }

      setApiKeys(data.apiKeys || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Impossible de charger les API Keys.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  async function handleShowKey(keyId) {
    const token = localStorage.getItem('coteai_token')

    setLoadingSecrets(previous => ({
      ...previous,
      [keyId]: true
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/api-keys/${keyId}/secret`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success || !data.apiKey?.apiKey) {
        throw new Error(data.message || 'Impossible de récupérer cette clé.')
      }

      setRevealedKeys(previous => ({
        ...previous,
        [keyId]: data.apiKey.apiKey
      }))
    } catch (err) {
      setError(err.message || 'Impossible de récupérer cette clé.')
    } finally {
      setLoadingSecrets(previous => ({
        ...previous,
        [keyId]: false
      }))
    }
  }

  async function handleCopyKey(keyId) {
    try {
      await navigator.clipboard.writeText(revealedKeys[keyId])
      alert('API Key copiée avec succès.')
    } catch {
      setError('Impossible de copier la clé.')
    }
  }

  async function handleRevoke(keyId) {
    if (!window.confirm('Voulez-vous vraiment révoquer cette API Key ?')) {
      return
    }

    const token = localStorage.getItem('coteai_token')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/api-keys/${keyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur serveur.')
      }

      setRevealedKeys(previous => {
        const updated = { ...previous }
        delete updated[keyId]
        return updated
      })

      await loadApiKeys()
    } catch (err) {
      setError(err.message || 'Impossible de révoquer cette clé.')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const name = companyName.trim()

    if (!name) return

    onContinue(name)
  }

  useEffect(() => {
    if (
      newlyCreatedKeyId &&
      apiKeys.some(key => key.id === newlyCreatedKeyId)
    ) {
      handleShowKey(newlyCreatedKeyId)
    }
  }, [newlyCreatedKeyId, apiKeys])

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
        <strong>{apiKeys.length}</strong>
        <small>Clés API créées</small>
      </div>

      {loading ? (
        <div className="api-keys-empty">
          Chargement des API Keys...
        </div>
      ) : error ? (
        <div className="api-keys-empty">
          <p className="api-keys-error">{error}</p>
          <button onClick={loadApiKeys}>
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {apiKeys.length > 0 && (
            <div className="api-keys-list">
              {apiKeys.map(key => (
                <article className="api-key-card" key={key.id}>
                  <h3>{key.companyName}</h3>

                  <p>
                    Statut : <strong>{key.status}</strong>
                  </p>

                  <small>
                    Créée le : {
                      key.createdAt
                        ? new Date(key.createdAt).toLocaleDateString()
                        : '—'
                    }
   </small>

                  {key.status === 'active' && (
                    <>
                      {revealedKeys[key.id] ? (
                        <div className="api-key-secret">
                          <code>{revealedKeys[key.id]}</code>

                          <button
                            type="button"
                            onClick={() => handleCopyKey(key.id)}
                          >
                            Copier ma clé
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={loadingSecrets[key.id]}
                          onClick={() => handleShowKey(key.id)}
                        >
                          {loadingSecrets[key.id]
                            ? 'Chargement...'
                            : 'Afficher mon API Key'}
                        </button>
                      )}

                      <button
                        className="api-key-revoke"
                        onClick={() => handleRevoke(key.id)}
                      >
                        Révoquer
                      </button>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}

          {!showForm ? (
            <div className="api-keys-empty">
              <h2>
                {apiKeys.length === 0
                  ? 'Aucune API Key'
                  : 'Gérer vos API Keys'}
              </h2>

              <p>
                {apiKeys.length === 0
                  ? 'Vous n’avez pas encore créé de clé API. Consultez la documentation pour commencer.'
                  : 'Vous pouvez demander la création d’une nouvelle API Key.'}
              </p>

              <button onClick={() => setShowForm(true)}>
                Créer une API Key
              </button>
            </div>
          ) : (
            <div className="api-keys-empty">
              <h2>Informations de l'entreprise</h2>

              <p>
                Veuillez renseigner le nom de votre entreprise
                avant de continuer la création de votre API Key.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor="company-name">
                  Nom de l'entreprise
                </label>

                <input
                  id="company-name"
                  type="text"
                  placeholder="Entrez le nom de votre entreprise"
                  value={companyName}
                  onChange={event => setCompanyName(event.target.value)}
                  required
                  maxLength={100}
                />

                <button type="submit">
                  Continuer
                </button>

                <button
                  type="button"
                  className="api-keys-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </section>
  )
}
