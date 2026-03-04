import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

function ProgressBar({ pct, label }) {
    return (
        <div className="progress-wrap">
            {label && (
                <div className="progress-label">
                    <span>{label}</span>
                    <span className="progress-pct">{pct}%</span>
                </div>
            )}
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function Dashboard() {
    const { currentUser } = useAuth()
    const { activeCharacter, characters } = useCharacter()
    const [userData, setUserData] = useState(null)
    const [guildData, setGuildData] = useState(null)
    const [guildMembers, setGuildMembers] = useState([])

    // 1. Sync User Data
    useEffect(() => {
        if (!currentUser) {
            setUserData(null)
            setGuildData(null)
            setGuildMembers([])
            return
        }

        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
            if (snap.exists()) {
                setUserData(snap.data())
            }
        })
        return unsubUser
    }, [currentUser])

    // 2. Sync Guild & Members (depends on userData.guildId)
    useEffect(() => {
        const guildId = userData?.guildId
        if (!guildId || !currentUser) {
            setGuildData(null)
            setGuildMembers([])
            return
        }

        // Listen to Guild Doc
        const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), async (guildSnap) => {
            if (!guildSnap.exists()) {
                setGuildData(null)
                setGuildMembers([])
                return
            }

            const guild = { id: guildSnap.id, ...guildSnap.data() }
            setGuildData(guild)

            // Resolve members
            const membersPromises = (guild.members || []).map(async mInfo => {
                const uid = typeof mInfo === 'string' ? mInfo : mInfo.uid
                const charId = typeof mInfo === 'string' ? null : mInfo.charId

                try {
                    const userSnap = await getDoc(doc(db, 'users', uid))
                    if (userSnap.exists()) {
                        const mData = userSnap.data()
                        const character = charId
                            ? (mData.characters || []).find(c => c.id === charId)
                            : (mData.characters?.[0] || null)
                        return { uid, ...mData, character }
                    }
                } catch (err) {
                    console.error("Error fetching member:", err)
                }
                return null
            })

            const resolvedMembers = (await Promise.all(membersPromises)).filter(Boolean)
            setGuildMembers(resolvedMembers)
        })

        return unsubGuild
    }, [userData?.guildId, currentUser])

    const totalQuests = 1374 // Approximate for display
    const completedCount = activeCharacter?.completedQuests?.length || 0
    const progressPct = Math.round((completedCount / totalQuests) * 100)

    return (
        <div className="fade-in-up">
            <div className="hero-section">
                <div className="hero-greeting">Bienvenue</div>
                <div className="hero-name">
                    {currentUser?.displayName}
                </div>
                <ProgressBar pct={progressPct} label="Progression globale du guide" />
            </div>

            <div className="grid-3" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-value">{completedCount}</div>
                    <div className="stat-label">Quêtes complétées</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalQuests - completedCount}</div>
                    <div className="stat-label">Quêtes restantes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{progressPct}%</div>
                    <div className="stat-label">Avancement</div>
                </div>
            </div>

            <div className="grid-2">
                {/* Guild Overview */}
                <div className="card">
                    <div className="card-title">Ma Guilde</div>
                    {guildData ? (
                        <>
                            <div className="card-subtitle" style={{ marginBottom: '16px' }}>
                                {guildData.name} — {guildData.members?.length || 0} membre{(guildData.members?.length || 0) > 1 ? 's' : ''}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {guildMembers.map(member => {
                                    const char = member.character || {}
                                    const mCompleted = char.completedQuests?.length || 0
                                    const pct = Math.round((mCompleted / totalQuests) * 100)
                                    const avatarUrl = `/assets/images/classes/${char.class || 'iop'}_${char.sex || 'm'}.png`

                                    return (
                                        <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="member-avatar" style={{ width: '32px', height: '32px', background: 'none', border: '1px solid var(--v5-border)', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {char.class ? (
                                                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-card)' }}>
                                                        N/A
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                    {char.name || member.displayName}
                                                    {member.uid === currentUser.uid && (
                                                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--primary)' }}>Vous</span>
                                                    )}
                                                </div>
                                                <ProgressBar pct={pct} />
                                            </div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', minWidth: '36px', textAlign: 'right' }}>
                                                {pct}%
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <Link to="/guild" className="btn btn-secondary btn-sm" style={{ marginTop: '16px', display: 'inline-flex' }}>
                                Voir la guilde complète
                            </Link>
                        </>
                    ) : (
                        <div>
                            <div className="empty-state" style={{ padding: '20px 0' }}>
                                <div className="empty-state-text">Vous n'êtes dans aucune guilde.</div>
                            </div>
                            <Link to="/guild" className="btn btn-secondary btn-sm">
                                Rejoindre ou créer une guilde
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick access */}
                <div className="card">
                    <div className="card-title">Continuer</div>
                    <div className="card-subtitle">Reprenez votre progression là où vous vous êtes arrêté.</div>

                    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                            Statut Actuel
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Vous avez complété {completedCount} quêtes sur l'ensemble du guide ({totalQuests}).
                        </div>
                    </div>

                    <Link to="/guide" className="btn btn-primary btn-full" style={{ marginTop: 'auto' }}>
                        Accéder au guide
                    </Link>
                </div>
            </div>
        </div>
    )
}
