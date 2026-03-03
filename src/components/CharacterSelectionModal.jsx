import React, { useState, useEffect } from 'react';
import { useCharacter } from '../contexts/CharacterContext';

export default function CharacterSelectionModal({ isOpen, onClose, onAddCharacter }) {
    const { characters, activeCharacter, setActiveCharacterId, deleteCharacter } = useCharacter();
    const [hoveredChar, setHoveredChar] = useState(null);

    // Initial hover state
    useEffect(() => {
        if (activeCharacter) setHoveredChar(activeCharacter);
        else if (characters.length > 0) setHoveredChar(characters[0]);
    }, [activeCharacter, characters, isOpen]);

    if (!isOpen) return null;

    const displayChar = hoveredChar || activeCharacter || (characters.length > 0 ? characters[0] : null);

    const handleSelect = (char) => {
        setActiveCharacterId(char.id);
        onClose();
    };

    const handleDelete = (e, char) => {
        e.stopPropagation();
        if (window.confirm(`Supprimer définitivement ${char.name} ?`)) {
            deleteCharacter(char.id);
            if (hoveredChar?.id === char.id) setHoveredChar(null);
        }
    };

    return (
        <div className="v5-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div className="v5-container" onClick={e => e.stopPropagation()}>

                {/* Sidebar */}
                <aside className="v5-sidebar">
                    <div className="v5-sidebar-header">Mes Héros</div>
                    <div className="v5-hero-list">
                        {characters.map(char => (
                            <div
                                key={char.id}
                                className={`v5-hero-item ${displayChar?.id === char.id ? 'active' : ''}`}
                                onMouseEnter={() => setHoveredChar(char)}
                                onClick={() => handleSelect(char)}
                            >
                                <img
                                    src={`/assets/images/classes/${char.class}_${char.sex}.png`}
                                    className="v5-hero-thumb"
                                    alt=""
                                />
                                <div className="v5-hero-info-small">
                                    <span className="v5-hero-name-small">{char.name}</span>
                                    <span className="v5-hero-class-small">{char.class}</span>
                                </div>
                            </div>
                        ))}

                        <div className="v5-hero-item" onClick={onAddCharacter} style={{ marginTop: '20px', border: '2px dashed var(--v5-border)', justifyContent: 'center', opacity: 0.6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>+ NOUVEAU HÉROS</span>
                        </div>
                    </div>
                </aside>

                {/* Preview Stage */}
                <main className={`v5-main-stage ${displayChar?.alignment || ''}`}>
                    {displayChar ? (
                        <>
                            <div className="v5-hero-big-wrap">
                                <img
                                    src={`/assets/images/classes/${displayChar.class}_${displayChar.sex}.png`}
                                    className="v5-hero-big"
                                    alt={displayChar.name}
                                />
                            </div>

                            <div className="v5-details-panel">
                                <span className="v5-hero-meta">{displayChar.class} • NIVEAU 200</span>
                                <h1 className="v5-hero-name">{displayChar.name}</h1>

                                <div className="v5-stats-grid">
                                    <div className="v5-stat-card">
                                        <span className="v5-stat-label">ALIGNEMENT</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img
                                                src={displayChar.alignment === 'bonta' ? "/assets/images/json/alignments_1.png" : "/assets/images/json/alignments_2.png"}
                                                alt=""
                                                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                            />
                                            <span className="v5-stat-value" style={{ color: displayChar.alignment === 'bonta' ? '#29b6f6' : 'var(--danger)' }}>
                                                {displayChar.alignment?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="v5-stat-card">
                                        <span className="v5-stat-label">EXPLOITS</span>
                                        <span className="v5-stat-value">{displayChar.completedQuests?.length || 0} QUÊTES</span>
                                    </div>
                                </div>

                                <div className="v5-actions">
                                    <button className="v5-btn-primary" onClick={() => handleSelect(displayChar)}>
                                        INCARNER
                                    </button>
                                    <button className="v5-btn-danger" onClick={(e) => handleDelete(e, displayChar)}>
                                        SUPPRIMER
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                            SÉLECTIONNEZ UN HÉROS
                        </div>
                    )}
                </main>

                <button
                    onClick={onClose}
                    className="close-modal-btn"
                    style={{
                        position: 'absolute', top: '24px', right: '24px',
                        background: 'rgba(255,255,255,0.05)', border: 'none',
                        color: 'white', fontSize: '1.5rem', width: '40px', height: '40px',
                        borderRadius: '50%', cursor: 'pointer', zIndex: 11000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    &times;
                </button>
            </div>
        </div>
    );
}
