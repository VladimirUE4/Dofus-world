import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const TOTAL_QUESTS = 1374

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
    const [userData, setUserData] = useState(null)
    const [guildData, setGuildData] = useState(null)
    const [guildMembers, setGuildMembers] = useState([])

    useEffect(() => {
        if (!currentUser) return
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), async (snap) => {
            if (!snap.exists()) return
            const data = snap.data()
            setUserData(data)

            if (data.guildId) {
                const guildSnap = await new Promise(res =>
                    onSnapshot(doc(db, 'guilds', data.guildId), res)
                )
                const guild = { id: guildSnap.id, ...guildSnap.data() }
                setGuildData(guild)

                const membersPromises = (guild.members || []).map(uid =>
                    new Promise(res => onSnapshot(doc(db, 'users', uid), snap => {
                        if (snap.exists()) res({ id: snap.id, ...snap.data() })
                        else res(null)
                    }))
                )
                const members = (await Promise.all(membersPromises)).filter(Boolean)
                setGuildMembers(members)
            }
        })
        return unsub
    }, [currentUser])

    const completedCount = (userData?.completedQuests || []).length
    const progressPct = Math.round((completedCount / TOTAL_QUESTS) * 100)

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
                    <div className="stat-value">{TOTAL_QUESTS - completedCount}</div>
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
                                {guildData.name} — {guildMembers.length} membre{guildMembers.length > 1 ? 's' : ''}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {guildMembers.map(member => {
                                    const pct = Math.round(((member.completedQuests?.length || 0) / TOTAL_QUESTS) * 100)
                                    const ini = (member.displayName || '?').slice(0, 2).toUpperCase()
                                    return (
                                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="member-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                                {ini}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                    {member.displayName}
                                                    {member.id === currentUser.uid && (
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
                            Vous avez complété {completedCount} quêtes sur l'ensemble du guide ({TOTAL_QUESTS}).
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
