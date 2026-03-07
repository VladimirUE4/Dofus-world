import { useState, useEffect } from 'react'
import donjonsData from '../data/donjons.json'

export default function Boss() {
    const [expandedBossId, setExpandedBossId] = useState(null)
    const [showOcreOnly, setShowOcreOnly] = useState(false)

    const toggleBoss = (bossName) => {
        if (expandedBossId === bossName) {
            setExpandedBossId(null)
        } else {
            setExpandedBossId(bossName)
        }
    }

    const filteredDonjons = showOcreOnly
        ? donjonsData.filter(d => d.useful_for_ocre)
        : donjonsData

    return (
        <div className="boss-page container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Encyclopédie des Boss</h1>

                <button
                    className={`btn ${showOcreOnly ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowOcreOnly(!showOcreOnly)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <img src="/donjons_data_images/picto_ocre.png" alt="Ocre" style={{ width: '20px', height: '20px' }} />
                    {showOcreOnly ? 'Tous les Boss' : 'Étape Ocre Uniquement'}
                </button>
            </div>

            <div className="boss-grid">
                {filteredDonjons.map((donjon, index) => {
                    const bossName = donjon.name
                    const isExpanded = expandedBossId === bossName
                    const hasOcre = donjon.useful_for_ocre
                    const isVulnerable = donjon.vulnerability && !donjon.vulnerability.includes("n’a pas d’invulnérabilité")

                    // Resolve image paths
                    // Note: The scraper saved them in donjons_data/images/...
                    // We copied them to public/donjons_data_images/...
                    let bossImgSrc = null
                    if (donjon.images && donjon.images.boss) {
                        const originalPath = donjon.images.boss
                        const parts = originalPath.split('/')
                        const filename = parts[parts.length - 1]
                        const folder = parts[parts.length - 2]
                        bossImgSrc = `/donjons_data_images/${folder}/${filename}`
                    }

                    return (
                        <div key={index} className={`boss-card ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleBoss(bossName)}>
                            <div className="boss-header">
                                {bossImgSrc ? (
                                    <img src={bossImgSrc} alt={bossName} className="boss-avatar" />
                                ) : (
                                    <div className="boss-avatar-placeholder"></div>
                                )}
                                <div className="boss-title-container">
                                    <h3 className="boss-name">{bossName}</h3>
                                    <p className="boss-name-sub">Gardien de Donjon</p>
                                </div>
                                <div className="boss-expand-icon">
                                    {isExpanded ? '▴' : '▾'}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="boss-details">
                                    <div className="boss-info-header">
                                        {/* State icon */}
                                        <div className="boss-badge">
                                            {isVulnerable ? (
                                                <img src="/donjons_data_images/invulnerable.png" alt="Invulnérable" title="Le boss a un état invulnérable" className="boss-icon" />
                                            ) : (
                                                <img src="/donjons_data_images/vulnerable.png" alt="Vulnérable" title="Le boss n'a pas d'état invulnérable" className="boss-icon" />
                                            )}
                                            <span>
                                                {isVulnerable ? "Invulnérabilité" : "Sans invulnérabilité"}
                                            </span>
                                        </div>

                                        {/* Ocre status */}
                                        {hasOcre && (
                                            <div className="boss-badge ocre-badge" title="Requis pour la quête de l'Ocre">
                                                <img src="/donjons_data_images/picto_ocre.png" alt="Ocre" className="boss-icon" />
                                                Etape Ocre
                                            </div>
                                        )}
                                    </div>

                                    {/* Mechanics */}
                                    {donjon.mechanics && (
                                        <div className="boss-section">
                                            <h4>Mécaniques particulières</h4>
                                            <p>{donjon.mechanics}</p>
                                        </div>
                                    )}

                                    {/* Spells */}
                                    {donjon.spells && donjon.spells.length > 0 && (
                                        <div className="boss-section boss-spells">
                                            <h4 className="flex-align-center">
                                                <img src="/donjons_data_images/picto_spells.png" alt="Sorts" className="boss-icon" />
                                                Sorts et Capacités
                                            </h4>
                                            <ul>
                                                {donjon.spells.map((spell, idx) => (
                                                    <li key={idx}>
                                                        {spell.type === 'phase' && <strong>{spell.text}</strong>}
                                                        {spell.type === 'spell' && <span>{spell.text}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Capture condition */}
                                    {donjon.capture && (
                                        <div className="boss-section">
                                            <h4>Capture</h4>
                                            <p>{donjon.capture}</p>
                                        </div>
                                    )}

                                    {/* Related quests */}
                                    {donjon.quests && donjon.quests.length > 0 && (
                                        <div className="boss-section boss-quests">
                                            <h4>Quêtes liées</h4>
                                            <ul>
                                                {donjon.quests.map((q, idx) => (
                                                    <li key={idx}>
                                                        <a href={q.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                            {q.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
