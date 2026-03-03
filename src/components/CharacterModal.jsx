import React, { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';

const CLASSES = [
    "feca", "osamodas", "enutrof", "sram", "xelor", "ecaflip", "eniripsa",
    "iop", "cra", "sadida", "sacrieur", "pandawa", "roublard", "zobal",
    "steamer", "eliotrope", "huppermage", "ouginak", "forgelance"
];

export default function CharacterModal({ isOpen, onClose }) {
    const { addCharacter } = useCharacter();
    const [name, setName] = useState('');
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [sex, setSex] = useState('m');
    const [alignment, setAlignment] = useState('bonta');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        await addCharacter({
            name,
            class: selectedClass,
            sex,
            alignment
        });

        setName('');
        onClose();
    };

    return (
        <div className="v5-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div className="v5-container v5-forge-container" onClick={e => e.stopPropagation()}>

                {/* Left: Preview */}
                <div className="v5-forge-left">
                    <img
                        src={`/assets/images/classes/${selectedClass}_${sex}.png`}
                        className="v5-hero-big"
                        alt="Hero Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }}
                    />
                </div>

                {/* Right: Form */}
                <div className="v5-forge-right">
                    <h2 className="v5-title">Créer votre Héros</h2>

                    <form onSubmit={handleSubmit} className="v5-forge-form" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                        <div className="v5-input-group" style={{ marginBottom: '12px' }}>
                            <label className="v5-label">Nom du Personnage</label>
                            <input
                                type="text"
                                className="v5-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Entrez un nom..."
                                required
                                autoFocus
                            />
                        </div>

                        <div className="v5-input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <label className="v5-label" style={{ marginBottom: '8px' }}>Classe</label>
                            <div className="v5-grid" style={{ flex: 1, minHeight: 0 }}>
                                {CLASSES.map(cls => (
                                    <div
                                        key={cls}
                                        className={`v5-grid-item ${selectedClass === cls ? 'active' : ''}`}
                                        onClick={() => setSelectedClass(cls)}
                                        title={cls}
                                        style={{ height: 'auto', aspectRatio: '1/1' }}
                                    >
                                        <img src={`/assets/images/classes/${cls}_${sex}.png`} alt={cls} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="v5-toggle-group">
                            <div style={{ flex: 1 }}>
                                <label className="v5-label">Sexe</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className={`v5-toggle-btn ${sex === 'm' ? 'active' : ''}`}
                                        onClick={() => setSex('m')}
                                    >M</button>
                                    <button
                                        type="button"
                                        className={`v5-toggle-btn ${sex === 'f' ? 'active' : ''}`}
                                        onClick={() => setSex('f')}
                                    >F</button>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <label className="v5-label">Alignement</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className={`v5-toggle-btn bonta ${alignment === 'bonta' ? 'active' : ''}`}
                                        onClick={() => setAlignment('bonta')}
                                    >
                                        <img src="/assets/images/json/alignments_1.png" alt="" />
                                        BONTA
                                    </button>
                                    <button
                                        type="button"
                                        className={`v5-toggle-btn brakmar ${alignment === 'brakmar' ? 'active' : ''}`}
                                        onClick={() => setAlignment('brakmar')}
                                    >
                                        <img src="/assets/images/json/alignments_2.png" alt="" />
                                        BRAKMAR
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="v5-btn-primary" style={{ marginTop: '20px', width: '100%', padding: '14px' }}>
                            CRÉER CE HÉROS
                        </button>
                    </form>
                </div>

                <button
                    onClick={onClose}
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
