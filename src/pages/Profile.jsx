import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import CharacterModal from '../components/CharacterModal'
import CharacterSelectionModal from '../components/CharacterSelectionModal'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase'
import brakmarQuests from '../../guideopti_brakmar.json'
import bontaQuests from '../../guideopti_bonta.json'

export default function Profile() {
    const { currentUser, userData } = useAuth()
    const { activeCharacter, characters, setActiveCharacterId, deleteCharacter } = useCharacter()
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
    const [isCharModalOpen, setIsCharModalOpen] = useState(false)
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const totalQuests = activeCharacter?.alignment === 'bonta' ? bontaQuests.length : brakmarQuests.length
    const completed = activeCharacter?.completedQuests?.length || 0
    const pct = Math.round((completed / totalQuests) * 100) || 0
    const initials = (currentUser?.displayName || '?').slice(0, 2).toUpperCase()

    async function handleSave(e) {
        e.preventDefault()
        if (!displayName.trim() || displayName.trim().length < 2) {
            setError('Le nom doit faire au moins 2 caractères.')
            return
        }
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            await updateProfile(auth.currentUser, { displayName: displayName.trim() })
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: displayName.trim()
            })
            setSuccess('Profil mis à jour avec succès.')
        } catch (err) {
            setError('Erreur lors de la mise à jour du profil.')
        }
        setLoading(false)
    }

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Profil</h1>
                <p className="page-subtitle">Gérez vos informations personnelles et vos statistiques.</p>
            </div>

            <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            flexShrink: 0,
                        }}>
                            {initials}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {currentUser?.displayName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {currentUser?.email}
                            </div>
                        </div>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Nom d'affichage</label>
                            <input
                                type="text"
                                className="form-input"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={currentUser?.email || ''}
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            Sauvegarder
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="v5-hub">
                        <div className="v5-hub-char">
                            {activeCharacter ? (
                                <>
                                    <img
                                        src={`/assets/images/classes/${activeCharacter.class}_${activeCharacter.sex}.png`}
                                        alt=""
                                        className="v5-hub-img"
                                    />
                                    <div>
                                        <h2 className="v5-hub-name">{activeCharacter.name.toUpperCase()}</h2>
                                        <div className="v5-hub-meta">
                                            {activeCharacter.class.toUpperCase()} • {activeCharacter.alignment.toUpperCase()} • {activeCharacter.completedQuests?.length || 0} SUCCES
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="v5-hub-name" style={{ opacity: 0.2 }}>AUCUN HÉROS ACTIF</div>
                            )}
                        </div>

                        <button
                            className="v5-hub-btn"
                            onClick={() => setIsSelectionModalOpen(true)}
                        >
                            GESTION DES HÉROS
                        </button>
                    </div>

                    <div className="card">
                        <h2 className="card-title">Statistiques Globales</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Progression {activeCharacter?.name}</span>
                                    <span style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontWeight: '700' }}>{pct}%</span>
                                </div>
                                <div className="progress-bar-bg" style={{ height: '10px' }}>
                                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: '12px' }}>
                                <div className="stat-card" style={{ padding: '16px' }}>
                                    <div className="stat-value" style={{ fontSize: '1.8rem' }}>{completed}</div>
                                    <div className="stat-label">Complétées</div>
                                </div>
                                <div className="stat-card" style={{ padding: '16px' }}>
                                    <div className="stat-value" style={{ fontSize: '1.8rem' }}>{totalQuests - completed}</div>
                                    <div className="stat-label">Restantes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CharacterModal
                isOpen={isCharModalOpen}
                onClose={() => setIsCharModalOpen(false)}
            />
            <CharacterSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onAddCharacter={() => {
                    setIsSelectionModalOpen(false);
                    setIsCharModalOpen(true);
                }}
            />
        </div>
    )
}
