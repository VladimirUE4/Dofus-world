import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    doc, setDoc, updateDoc,
    arrayUnion, arrayRemove, onSnapshot, collection, query, where, getDocs
} from 'firebase/firestore'
import { db } from '../firebase'

const TOTAL_QUESTS = 1374

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function MemberCard({ member, currentUserId, ownerId }) {
    const initials = (member.displayName || '?').slice(0, 2).toUpperCase()
    const completed = member.completedQuests?.length || 0
    const pct = Math.round((completed / TOTAL_QUESTS) * 100)
    const isOwner = member.id === ownerId
    const isMe = member.id === currentUserId

    return (
        <div className="member-card">
            <div className="member-header">
                <div className="member-avatar">{initials}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="member-name">
                            {member.displayName}
                            {isMe && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '6px' }}>(Vous)</span>}
                        </div>
                        {isOwner && <span className="member-owner-badge">Chef</span>}
                    </div>
                    <div className="member-role">{completed} quêtes complétées</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {pct}%
                    </div>
                </div>
            </div>
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function Guild() {
    const { currentUser } = useAuth()
    const [userData, setUserData] = useState(null)
    const [guildData, setGuildData] = useState(null)
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('members')
    const [createName, setCreateName] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    // Listen to user data
    useEffect(() => {
        if (!currentUser) return
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), async (snap) => {
            if (!snap.exists()) return
            const data = { id: snap.id, ...snap.data() }
            setUserData(data)

            if (data.guildId) {
                listenToGuild(data.guildId)
            } else {
                setGuildData(null)
                setMembers([])
                setLoading(false)
            }
        })
        return unsub
    }, [currentUser])

    function listenToGuild(guildId) {
        const unsub = onSnapshot(doc(db, 'guilds', guildId), async (snap) => {
            if (!snap.exists()) {
                setGuildData(null)
                setLoading(false)
                return
            }
            const guild = { id: snap.id, ...snap.data() }
            setGuildData(guild)

            const memberUnsubs = []
            const memberMap = {}
            const updateMembers = () => setMembers(Object.values(memberMap))

            for (const uid of guild.members || []) {
                const mu = onSnapshot(doc(db, 'users', uid), (mSnap) => {
                    if (mSnap.exists()) {
                        memberMap[uid] = { id: mSnap.id, ...mSnap.data() }
                        updateMembers()
                    }
                })
                memberUnsubs.push(mu)
            }
            setLoading(false)
            return () => memberUnsubs.forEach(u => u())
        })
        return unsub
    }

    async function handleCreateGuild(e) {
        e.preventDefault()
        setError('')
        setSuccess('')
        if (!createName.trim() || createName.trim().length < 2) {
            setError('Le nom de la guilde doit faire au moins 2 caractères.')
            return
        }
        setActionLoading(true)
        try {
            const inviteCode = generateInviteCode()
            const guildRef = doc(collection(db, 'guilds'))
            await setDoc(guildRef, {
                name: createName.trim(),
                inviteCode,
                ownerId: currentUser.uid,
                members: [currentUser.uid],
                createdAt: new Date(),
            })
            await updateDoc(doc(db, 'users', currentUser.uid), {
                guildId: guildRef.id,
            })
            setSuccess(`Guilde "${createName.trim()}" créée.`)
            setCreateName('')
        } catch (err) {
            setError('Erreur lors de la création de la guilde.')
        }
        setActionLoading(false)
    }

    async function handleJoinGuild(e) {
        e.preventDefault()
        setError('')
        setSuccess('')
        const code = joinCode.trim().toUpperCase()
        if (code.length !== 6) {
            setError('Le code d\'invitation doit faire 6 caractères.')
            return
        }
        setActionLoading(true)
        try {
            const q = query(collection(db, 'guilds'), where('inviteCode', '==', code))
            const snap = await getDocs(q)
            if (snap.empty) {
                setError('Code d\'invitation invalide.')
                setActionLoading(false)
                return
            }
            const guildDoc = snap.docs[0]
            await updateDoc(guildDoc.ref, { members: arrayUnion(currentUser.uid) })
            await updateDoc(doc(db, 'users', currentUser.uid), { guildId: guildDoc.id })
            setSuccess(`Vous avez rejoint la guilde "${guildDoc.data().name}".`)
            setJoinCode('')
        } catch (err) {
            setError('Erreur lors de la tentative de rejoindre la guilde.')
        }
        setActionLoading(false)
    }

    async function handleLeaveGuild() {
        if (!guildData) return
        if (!confirm('Êtes-vous sûr de vouloir quitter cette guilde ?')) return
        setActionLoading(true)
        try {
            await updateDoc(doc(db, 'guilds', guildData.id), {
                members: arrayRemove(currentUser.uid),
            })
            await updateDoc(doc(db, 'users', currentUser.uid), { guildId: null })
        } catch (err) {
            setError('Erreur lors de la tentative de quitter la guilde.')
        }
        setActionLoading(false)
    }

    if (loading) {
        return <div className="loading-center">Chargement...</div>
    }

    if (guildData) {
        const avgProgress = members.length > 0
            ? Math.round(members.reduce((acc, m) => acc + ((m.completedQuests?.length || 0) / TOTAL_QUESTS) * 100, 0) / members.length)
            : 0

        return (
            <div className="fade-in-up">
                <div className="page-header">
                    <h1 className="page-title">Ma Guilde</h1>
                </div>

                <div className="guild-banner">
                    <div>
                        <div className="guild-name">{guildData.name}</div>
                        <div className="guild-meta">{members.length} membre(s)</div>
                    </div>
                    <div className="guild-stats">
                        <div>
                            <div className="guild-stat-value">{members.length}</div>
                            <div className="guild-stat-label">Membres</div>
                        </div>
                        <div>
                            <div className="guild-stat-value">{avgProgress}%</div>
                            <div className="guild-stat-label">Moyenne</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="section-header">
                        <h2 className="section-title">Code d'invitation</h2>
                    </div>
                    <div className="invite-code-box">
                        <span className="invite-code">{guildData.inviteCode}</span>
                        <div className="invite-code-label">Partagez ce code pour inviter de nouveaux membres</div>
                    </div>
                </div>

                <div className="section-header" style={{ marginBottom: '16px' }}>
                    <h2 className="section-title">Membres et Progression</h2>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={handleLeaveGuild}
                        disabled={actionLoading}
                    >
                        Quitter la guilde
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="grid-2">
                    {members
                        .sort((a, b) => (b.completedQuests?.length || 0) - (a.completedQuests?.length || 0))
                        .map(member => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                currentUserId={currentUser.uid}
                                ownerId={guildData.ownerId}
                            />
                        ))}
                </div>
            </div>
        )
    }

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Guilde</h1>
                <p className="page-subtitle">Rejoignez ou créez une guilde pour comparer votre progression.</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab-btn${tab === 'create' ? ' active' : ''}`}
                    onClick={() => { setTab('create'); setError(''); setSuccess('') }}
                >
                    Créer une guilde
                </button>
                <button
                    className={`tab-btn${tab === 'join' ? ' active' : ''}`}
                    onClick={() => { setTab('join'); setError(''); setSuccess('') }}
                >
                    Rejoindre une guilde
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {tab === 'create' && (
                <div className="card">
                    <h2 className="card-title">Nouvelle Guilde</h2>
                    <p className="card-subtitle">Un code d'invitation vous sera attribué.</p>
                    <form onSubmit={handleCreateGuild}>
                        <div className="form-group">
                            <label className="form-label">Nom de la guilde</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Exénom..."
                                value={createName}
                                onChange={e => setCreateName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                            Créer la guilde
                        </button>
                    </form>
                </div>
            )}

            {tab === 'join' && (
                <div className="card">
                    <h2 className="card-title">Rejoindre</h2>
                    <p className="card-subtitle">Entrez le code d'invitation fourni par un membre.</p>
                    <form onSubmit={handleJoinGuild}>
                        <div className="form-group">
                            <label className="form-label">Code d'invitation</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ABCDEF"
                                maxLength={6}
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                style={{ letterSpacing: '0.2em', fontSize: '1.2rem', textTransform: 'uppercase' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary" disabled={actionLoading}>
                            Rejoindre
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
