import React from 'react';
import { Link } from 'react-router-dom';

const UPDATES = [
    {
        version: '0.1.4',
        title: 'Encyclopédie des Boss, Suivi de Guilde & Ergonomie',
        date: '8 Mars 2026',
        image: '/assets/images/classes/cra_m.png',
        description: 'Ajout d\'une encyclopédie publique des boss et améliorations globales de l\'expérience utilisateur.',
        highlights: [
            'Nouvelle page publique des Boss avec filtrage Quête Ocre',
            'Ajout du suivi de validation des Succès en temps réel (Avatars des membres)',
            'Mémorisation intelligente de la position de scroll sur le Guide et les Succès',
            'Refonte des filtres de niveaux avec listes déroulantes stylisées'
        ]
    },
    {
        version: '0.1.3',
        title: 'Gestion des Guildes par Personnage',
        date: '4 Mars 2026',
        image: '/assets/images/json/alignments_1.png',
        description: 'Migration technique du système de guilde. L\'appartenance à une guilde est désormais rattachée à un personnage spécifique du compte.',
        highlights: [
            'Affichage des portraits de classes dans les listes de membres',
            'Intégration des avatars de personnages dans la barre de suivi',
            'Synchronisation de la progression par personnage membre'
        ]
    },
    {
        version: '0.1.2',
        title: 'Optimisation de l\'Interface de Création',
        date: '4 Mars 2026',
        image: '/assets/images/classes/iop_m.png',
        description: 'Révision de l\'ergonomie de l\'interface "Forge" pour maximiser l\'espace utile.',
        highlights: [
            'Suppression des bordures internes et des espacements inutiles',
            'Augmentation de la dimension de la grille de sélection',
            'Ajustement du ratio d\'aspect pour l\'aperçu des classes'
        ]
    },
    {
        version: '0.1.1',
        title: 'Support des Alignements Cités',
        date: '3 Mars 2026',
        image: '/assets/images/json/alignments_2.png',
        description: 'Implémentation des données d\'alignement (Bonta / Brâkmar) dans le flux de création.',
        highlights: [
            'Intégration des assets graphiques officiels d\'alignement',
            'Thématisation dynamique de l\'interface de création',
            'Équilibrage des contrôles de sélection Sexe/Alignement'
        ]
    },
    {
        version: '0.1.0',
        title: 'Refonte de l\'Identité Graphique',
        date: '3 Mars 2026',
        image: '/assets/images/classes/feca_f.png',
        description: 'Mise en conformité du design avec les nouveaux standards visuels du projet.',
        highlights: [
            'Déploiement de la typographie Outfit',
            'Uniformisation des rayons de bordure à 16px',
            'Réduction de la hauteur des sections pour limiter le scroll'
        ]
    }
];

export default function PatchNotes() {
    return (
        <div className="patch-notes-page fade-in-up" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 className="page-title" style={{ fontSize: '3rem', marginBottom: '16px' }}>Notes de mise à jour</h1>
                <p className="page-subtitle" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                    Historique des modifications et nouvelles fonctionnalités de Dofus World.
                </p>
            </div>

            <div className="patch-timeline">
                {/* Vertical Line */}
                <div className="patch-line"></div>

                {UPDATES.map((update, idx) => (
                    <div key={update.version} className={`patch-card-row ${idx % 2 === 0 ? 'even' : 'odd'}`}>
                        <div className="patch-card-visual">
                            <div className="patch-image-wrap" style={{
                                background: 'var(--bg-card)',
                                padding: '20px',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                display: 'inline-block'
                            }}>
                                <img src={update.image} alt={update.title} style={{ width: '200px', height: '200px', objectFit: 'contain' }} className="d-block" />
                            </div>
                        </div>

                        <div className="patch-card-content">
                            {/* Dot on line */}
                            <div className="patch-dot"></div>

                            <div className="card" style={{ padding: '32px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', letterSpacing: '2px' }}>V{update.version}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{update.date}</span>
                                </div>
                                <h2 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>{update.title}</h2>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                                    {update.description}
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {update.highlights.map((h, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span> {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '80px' }}>
                <Link to="/" className="btn btn-secondary">Retour à l'accueil</Link>
            </div>
        </div>
    );
}
