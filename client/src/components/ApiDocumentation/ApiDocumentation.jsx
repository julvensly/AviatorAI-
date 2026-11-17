import { useState } from 'react'
import './ApiDocumentation.css'

const themes = [
  {
    id: 'cote-ai',
    title: 'COTE.AI',
    description: 'Découvrez notre plateforme, notre mission et notre technologie.',
    sections: [
      {
        content: (
          <>
            <p>COTE.AI est une plateforme technologique spécialisée dans la simulation, le suivi et l'analyse des multiplicateurs.</p>
            <p>Sa mission est de rendre les informations accessibles grâce à des outils permettant de suivre les rounds, les intervalles, les objectifs et les résultats.</p>
            <p>Sa vision est de développer un écosystème technologique réunissant utilisateurs, développeurs et partenaires.</p>
            <p>La plateforme s'appuie sur une architecture composée d'une interface, d'un serveur, d'un moteur de simulation et d'un système de gestion des données.</p>
            <p><strong>Important :</strong> COTE.AI est un outil expérimental de simulation. Il ne garantit aucun résultat et ne prédit pas avec certitude les résultats des jeux réels.</p>
          </>
        )
      }
    ]
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    description: 'Découvrez nos services API et les possibilités offertes aux développeurs.',
    sections: [
      {
        
        content: (
          <>
            <p>Les API Keys permettent aux développeurs et aux partenaires d'accéder aux données autorisées de COTE.AI et de les intégrer dans leurs propres applications.</p>
            <h3>Fonctionnalités principales</h3>
            <ul>
              <li>Consultation du numéro du round actuel.</li>
              <li>Suivi du multiplicateur et du statut du round.</li>
              <li>Consultation du compte à rebours.</li>
              <li>Suivi des intervalles et de leurs objectifs.</li>
              <li>Consultation des progressions et résultats.</li>
              <li>Accès aux informations autorisées en temps réel.</li>
            </ul>
            <h3>Création et paiement</h3>
            <p>La création d'une API Key est proposée au tarif de 1 000 HTG, l'API keys n'aura pas d'expiration, pour tout les modifications et amelioration du système votre API Keys sera  mise à jour automatiquement.</p>
            <p>Le paiement s'effectue par NatCash, MonCash, Zell. La création de la clé intervient uniquement après vérification et confirmation du paiement par le système.</p>
            <p> N.B: L'entreprise qui souhaite utiliser notre API keys devra céder mensuellement 15% du bénéfice total du jeux, par conséquent L'entreprise garde totalement le contrôle Sûr la mise et les paris de ces utilisateurs </p>
            <h3>Sécurité</h3>
            <p>Chaque utilisateur doit protéger sa clé API et éviter de la partager publiquement. L'utilisation des API Keys reste soumise aux conditions de COTE.AI.</p>
          </>
        )
      }
    ]
  },
  {
    id: 'partenaria',
    title: 'Partenaria',
    description: 'Découvrez les possibilités de collaboration avec COTE.AI.',
    sections: [
      {
        content: (
          <>
            <p>COTE.AI souhaite développer un réseau de partenaires intéressés par ses technologies et ses services.</p>
            <h3>Types de partenariats</h3>
            <ul>
              <li>Partenariats technologiques.</li>
              <li>Partenariats commerciaux.</li>
              <li>Collaboration avec des développeurs.</li>
              <li>Intégration des services API.</li>
            </ul>
            <h3>Avantages</h3>
            <p>Les partenaires peuvent bénéficier d'opportunités de collaboration, d'intégration technologique et de développement de nouveaux services.</p>
            <h3>Conditions</h3>
            <p>Chaque partenariat doit faire l'objet d'une entente précisant les responsabilités, les conditions de collaboration et les éventuelles rémunérations.</p>
            <p>Toute demande de partenariat doit être examinée et approuvée par l'équipe COTE.AI.</p>
          </>
        )
      }
    ]
  },
  {
    id: 'legalite',
    title: 'Légalité',
    description: 'Consultez les règles, les conditions et les responsabilités des utilisateurs.',
    sections: [
      {
        content: (
          <>
            <p>L'utilisation de COTE.AI implique le respect des règles et des conditions établies pour protéger la plateforme, ses utilisateurs et ses partenaires.</p>
            <h3>Conditions d'utilisation</h3>
            <p>Chaque utilisateur doit utiliser les services de manière responsable et respecter les fonctionnalités autorisées.</p>
            <h3>Confidentialité et données</h3>
            <p>Les informations personnelles et les données des comptes doivent être protégées conformément aux règles applicables.</p>
            <h3>Responsabilités</h3>
            <ul>
              <li>Protéger ses identifiants de connexion.</li>
      <li>Garder ses clés API confidentielles.</li>
              <li>Ne pas utiliser les services à des fins interdites.</li>
              <li>Respecter les limites d'accès aux données.</li>
            </ul>
            <h3>Limitation de responsabilité</h3>
            <p>Les simulations et les informations fournies par COTE.AI sont destinées à l'observation et à l'analyse. Elles ne constituent pas une garantie de gains ni une prédiction certaine de résultats réels.</p>
            <p>Les conditions peuvent être actualisées afin de tenir compte de l'évolution des services et des obligations applicables.</p>
          </>
        )
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contacter Nous',
    description: 'Retrouvez les informations nécessaires pour contacter notre équipe.',
    sections: [
      {
        content: (
          <>
            <p>L'équipe COTE.AI reste disponible pour accompagner les utilisateurs, les développeurs et les partenaires.</p>
            <h3>Assistance générale</h3>
            <p>Pour toute question concernant la plateforme, ses fonctionnalités ou son utilisation.</p>
            <h3>Support technique</h3>
            <p>Pour signaler un problème technique, une difficulté d'accès ou un dysfonctionnement des services API.</p>
            <h3>Support API Keys et paiements</h3>
            <p>Pour toute question concernant la création des clés API, leur utilisation et la vérification des paiements.</p>
            <h3>Partenariats</h3>
            <p>Pour proposer une collaboration ou discuter d'une opportunité commerciale ou technologique.</p>
            <p>Laissez nous un couriel support.coteai@gmail.com</p>
          </>
        )
      }
    ]
  }
]
export default function ApiDocumentation({ onNavigate }) {
  const [activeTheme, setActiveTheme] = useState(null)
  const [activeSection, setActiveSection] = useState(null)

  function toggleTheme(id) {
    setActiveTheme(current => current === id ? null : id)
    setActiveSection(null)
  }

  function toggleSection(id) {
    setActiveSection(current => current === id ? null : id)
  }

  return (
    <section className="api-docs-page">
      <header className="api-docs-header">
        <button onClick={() => onNavigate('home')}>
          ← Retour
        </button>

        <h1>Documentation COTE.AI</h1>
        <p>Documentation officielle de la plateforme COTE.AI.</p>
      </header>

      <div className="api-docs-themes">
        {themes.map((theme, index) => (
          <article
            className={`api-docs-theme ${activeTheme === theme.id ? 'active' : ''}`}
            key={theme.id}
          >
            <button
              type="button"
              className="api-docs-theme-button"
              onClick={() => toggleTheme(theme.id)}
              aria-expanded={activeTheme === theme.id}
            >
              <span className="api-docs-theme-number">
                0{index + 1}
              </span>

              <span className="api-docs-theme-info">
                <strong>{theme.title}</strong>
                <small>{theme.description}</small>
              </span>

              <span className="api-docs-theme-arrow">
                {activeTheme === theme.id ? '−' : '+'}
              </span>
            </button>

            {activeTheme === theme.id && (
              <div className="api-docs-theme-content">
                {theme.sections ? (
                  theme.sections.map((section, sectionIndex) => {
                    const sectionId = `${theme.id}-${sectionIndex}`

                    return (
                      <article className="api-docs-subsection" key={sectionId}>
                        <button
                          type="button"
                          className="api-docs-subsection-button"
                          onClick={() => toggleSection(sectionId)}
                          aria-expanded={activeSection === sectionId}
                        >
                          <strong>{section.title}</strong>
                          <span>{activeSection === sectionId ? '−' : '+'}</span>
                        </button>

                        {activeSection === sectionId && (
                          <div className="api-docs-subsection-content">
                            {section.content}
                          </div>
                        )}
                      </article>
                    )
                  })
                ) : (
                  <p>Contenu de cette section à définir.</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
