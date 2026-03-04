import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import {
    doc, setDoc, updateDoc,
    arrayUnion, arrayRemove, onSnapshot, collection, query, where, getDocs
} from 'firebase/firestore'
import { db } from '../firebase'
import guildBg from '../images/5.jpg'

const TOTAL_QUESTS = 1374

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function MemberCard({ member, currentUserId, ownerId }) {
    const char = member.character || {}
    const className = char.class || 'iop'
    const sex = char.sex || 'm'
    const charName = char.name || member.displayName || 'Inconnu'

    // Character portrait
    const avatarUrl = `/assets/images/classes/${className}_${sex}.png`

    const completed = char.completedQuests?.length || 0
    const pct = Math.round((completed / TOTAL_QUESTS) * 100)
    const isOwner = member.uid === ownerId
    const isMe = member.uid === currentUserId

    return (
        <div className="member-card">
            <div className="member-header">
                <div className="member-avatar" style={{ background: 'none', border: '1px solid var(--v5-border)', overflow: 'hidden' }}>
                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(1.2)' }} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="member-name" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{charName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{className}</span>
                        </div>
                        {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700' }}>VOUS</span>}
                        {isOwner && <span className="member-owner-badge">Chef</span>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {pct}%
                    </div>
                </div>
            </div>
            <div className="progress-bar-bg" style={{ marginTop: '12px' }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function Guild() {
    const { currentUser } = useAuth()
    const { activeCharacter } = useCharacter()
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

    // 1. Listen to User Data
    useEffect(() => {
        if (!currentUser) {
            setUserData(null)
            setGuildData(null)
            setMembers([])
            setLoading(false)
            return
        }

        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
            if (snap.exists()) {
                setUserData({ id: snap.id, ...snap.data() })
            } else {
                setLoading(false)
            }
        })
        return unsubUser
    }, [currentUser])

    // 2. Listen to Guild & Members
    useEffect(() => {
        const guildId = userData?.guildId
        if (!guildId || !currentUser) {
            setGuildData(null)
            setMembers([])
            // If userData exists but no guildId, then we are not loading anymore
            if (userData || !currentUser) setLoading(false)
            return
        }

        let isMounted = true
        let memberUnsubs = []

        const cleanupMembers = () => {
            memberUnsubs.forEach(u => u())
            memberUnsubs = []
        }

        const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), (snap) => {
            if (!isMounted) return
            if (!snap.exists()) {
                setGuildData(null)
                setMembers([])
                setLoading(false)
                return
            }

            const guild = { id: snap.id, ...snap.data() }
            setGuildData(guild)

            // Cleanup old member listeners before setting up new ones
            cleanupMembers()

            const memberMap = {}
            const guildMembers = guild.members || []

            if (guildMembers.length === 0) {
                setMembers([])
                setLoading(false)
                return
            }

            guildMembers.forEach(mInfo => {
                const uid = typeof mInfo === 'string' ? mInfo : mInfo.uid
                const charId = typeof mInfo === 'string' ? null : mInfo.charId

                const mu = onSnapshot(doc(db, 'users', uid), (mSnap) => {
                    if (!isMounted || !mSnap.exists()) return

                    const mData = mSnap.data()
                    const character = charId
                        ? (mData.characters || []).find(c => c.id === charId)
                        : (mData.characters?.[0] || null)

                    memberMap[uid] = { uid, ...mData, character }

                    // Update main members list
                    setMembers(Object.values(memberMap))
                    setLoading(false)
                })
                memberUnsubs.push(mu)
            })
        })

        return () => {
            isMounted = false
            unsubGuild()
            cleanupMembers()
        }
    }, [userData?.guildId, currentUser])

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
                members: [{ uid: currentUser.uid, charId: activeCharacter?.id || null }],
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
            const memberInfo = { uid: currentUser.uid, charId: activeCharacter?.id || null }
            await updateDoc(guildDoc.ref, { members: arrayUnion(memberInfo) })
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
            const memberToRemove = guildData.members.find(m => (typeof m === 'string' ? m : m.uid) === currentUser.uid)
            if (memberToRemove) {
                await updateDoc(doc(db, 'guilds', guildData.id), {
                    members: arrayRemove(memberToRemove),
                })
            }
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
                        .sort((a, b) => (b.character?.completedQuests?.length || 0) - (a.character?.completedQuests?.length || 0))
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
        <div className="fade-in-up" style={{
            position: 'relative',
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            marginTop: '-40px',
            overflow: 'hidden',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '40px',
            color: 'white'
        }}>
            {/* Background Image with Gradient Fade */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${guildBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(10,10,12,0.2) 0%, rgba(10,10,12,0.95) 100%)',
                zIndex: 1
            }}></div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.5)', fontFamily: 'var(--font-display)' }}>Votre Guilde</h1>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>Rejoignez vos amis ou créez votre propre alliance pour comparer votre progression et conquérir ensemble.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button
                        className="btn-premium"
                        style={{ padding: '16px 32px', fontSize: '1.1rem', flex: 1, maxWidth: '250px' }}
                        onClick={() => { setTab('create'); setError(''); setSuccess('') }}
                    >
                        Créer une guilde
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '16px 32px', fontSize: '1.1rem', flex: 1, maxWidth: '250px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                        onClick={() => { setTab('join'); setError(''); setSuccess('') }}
                    >
                        Rejoindre
                    </button>
                </div>

                {error && <div className="alert alert-error" style={{ marginTop: '24px' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginTop: '24px' }}>{success}</div>}

                {tab === 'create' && (
                    <div className="card fade-in" style={{ marginTop: '32px', backgroundColor: 'var(--v5-surface)', textAlign: 'left' }}>
                        <h2 className="card-title">Nouvelle Guilde</h2>
                        <form onSubmit={handleCreateGuild}>
                            <div className="form-group">
                                <label className="form-label">Nom de la guilde</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Les Bouftous Soyeux..."
                                    value={createName}
                                    onChange={e => setCreateName(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                Fonder la guilde
                            </button>
                        </form>
                    </div>
                )}

                {tab === 'join' && (
                    <div className="card fade-in" style={{ marginTop: '32px', backgroundColor: 'var(--v5-surface)', textAlign: 'left' }}>
                        <h2 className="card-title">Rejoindre une guilde</h2>
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
                                    style={{ letterSpacing: '0.2em', fontSize: '1.2rem', textTransform: 'uppercase', textAlign: 'center' }}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-secondary btn-full" disabled={actionLoading}>
                                Rejoindre
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
