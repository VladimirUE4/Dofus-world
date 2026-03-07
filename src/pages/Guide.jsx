import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import brakmarQuests from '../../guideopti_brakmar.json'
import bontaQuests from '../../guideopti_bonta.json'

const prepareQuests = (raw) => raw.map((q, idx) => ({ ...q, originalIndex: idx }))

const BRAKMAR_QUESTS = prepareQuests(brakmarQuests)
const BONTA_QUESTS = prepareQuests(bontaQuests)

// Build pagelevel → first-step mapping from raw data
function buildPageLevels(rawData) {
    const levels = []        // [{ level, firstStepId }]
    let current = 1
    let firstOfCurrent = null

    for (const item of rawData) {
        if (item.type === 'quest') {
            if (firstOfCurrent === null) firstOfCurrent = item.id
            if (item.pagelevel) {
                levels.push({ level: current, firstStepId: firstOfCurrent })
                current = parseInt(item.pagelevel, 10)
                firstOfCurrent = null
            }
        }
    }
    if (firstOfCurrent !== null) levels.push({ level: current, firstStepId: firstOfCurrent })

    return levels  // sorted by appearance order (level values ascend naturally)
}

const BONTA_PAGE_LEVELS = buildPageLevels(bontaQuests)
const BRAKMAR_PAGE_LEVELS = buildPageLevels(brakmarQuests)

const SCROLL_KEY_GUIDE = 'guide_scroll_page'

function CategoryItem({ category }) {
    let displayTitle = category.title
    let desc = ''
    const splitIndex = category.title.indexOf(' : ')
    if (splitIndex !== -1) {
        displayTitle = category.title.substring(0, splitIndex)
        desc = category.title.substring(splitIndex + 3)
    }
    return (
        <div className="category-card">
            <div className="category-image-wrap">
                <img src={category.image} alt={category.step} className="category-image" />
                <div className="category-step-badge">{category.step}</div>
            </div>
            <div className="category-content">
                <div className="category-title">{displayTitle}</div>
                {desc && <div className="category-desc">{desc}</div>}
            </div>
        </div>
    )
}

function QuestItem({ quest, completed, onToggle, trackedMembersCompleted }) {
    const images = quest.images || []
    const bossImages = quest.bossImages || (quest.bossImage ? [quest.bossImage] : [])

    return (
        <div className="quest-row">
            <div className={`quest-item${completed ? ' completed' : ''}`} onClick={() => onToggle(quest.id)}>
                <div className="quest-main-info">
                    <div className="quest-checkbox-wrapper">
                        <input
                            type="checkbox"
                            className="quest-checkbox"
                            checked={completed}
                            onChange={() => onToggle(quest.id)}
                            onClick={e => e.stopPropagation()}
                            id={`quest-${quest.id}`}
                        />
                    </div>

                    <span className="quest-level-badge">Lvl {quest.questLevel}</span>
                    <div className="quest-dataset-images">
                        {images.map((imgUrl, idx) => (
                            <img key={idx} src={imgUrl} alt="" className="quest-dataset-img" />
                        ))}
                    </div>

                    <span className="quest-name">{quest.name}</span>

                    {trackedMembersCompleted && trackedMembersCompleted.length > 0 && (
                        <div className="quest-member-avatars">
                            {trackedMembersCompleted.map(member => (
                                <div key={member.id} className="quest-member-avatar" title={`${member.name} a terminé cette quête`} style={{ background: 'none', padding: 0, overflow: 'hidden', border: '1px solid var(--v5-border)' }}>
                                    <img src={`/assets/images/classes/${member.className}_${member.sex}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    <a href={quest.link} target="_blank" rel="noopener noreferrer" className="quest-link" onClick={e => e.stopPropagation()}>
                        Ouvrir le guide
                    </a>
                </div>
                {quest.description && (
                    <div className="quest-description">{quest.description}</div>
                )}
            </div>

            {bossImages.length > 0 && (
                <div className={`quest-boss-images ${bossImages.length > 3 ? 'many' : 'few'}`}>
                    {bossImages.map((bossUrl, idx) => (
                        <img key={idx} src={bossUrl} alt="Boss" className="quest-boss-img" />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function Guide() {
    const { currentUser } = useAuth()
    const { activeCharacter, toggleQuest, checkMultipleQuests } = useCharacter()
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = localStorage.getItem(SCROLL_KEY_GUIDE)
        return saved ? parseInt(saved, 10) : 1
    })
    const [updating, setUpdating] = useState(false)
    const [selectedPageLevel, setSelectedPageLevel] = useState('all')
    const scrollSaveTimer = useRef(null)
    const itemsPerPage = 50

    // Selected Dataset based on alignment
    const QUESTS = useMemo(() => {
        if (!activeCharacter) return []
        return activeCharacter.alignment === 'bonta' ? BONTA_QUESTS : BRAKMAR_QUESTS
    }, [activeCharacter])

    const PAGE_LEVELS = useMemo(() => {
        if (!activeCharacter) return []
        return activeCharacter.alignment === 'bonta' ? BONTA_PAGE_LEVELS : BRAKMAR_PAGE_LEVELS
    }, [activeCharacter])

    const TOTAL = useMemo(() => QUESTS.filter(q => q.type === 'quest').length, [QUESTS])
    const completedQuests = activeCharacter?.completedQuests || []

    // Guild specific state
    const [userGuildId, setUserGuildId] = useState(null)
    const [guildMembers, setGuildMembers] = useState([])
    const [trackedMemberIds, setTrackedMemberIds] = useState([])

    // Sync Guild info
    useEffect(() => {
        if (!currentUser) return
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
            if (snap.exists()) setUserGuildId(snap.data().guildId || null)
        })
        return unsub
    }, [currentUser])

    // Combined real-time sync for Guild & Members
    useEffect(() => {
        if (!userGuildId || !currentUser) { setGuildMembers([]); setTrackedMemberIds([]); return }

        let isMounted = true
        let memberUnsubs = []

        const cleanupMembers = () => { memberUnsubs.forEach(u => u()); memberUnsubs = [] }

        const unsubGuild = onSnapshot(doc(db, 'guilds', userGuildId), (guildSnap) => {
            if (!isMounted) return
            if (!guildSnap.exists()) { setGuildMembers([]); return }

            cleanupMembers()
            const memberInfos = guildSnap.data().members || []
            const otherMembers = memberInfos.filter(m => (typeof m === 'string' ? m : m.uid) !== currentUser.uid)

            setGuildMembers(otherMembers.map(m => ({ id: typeof m === 'string' ? m : m.uid, name: 'Chargement...', completedQuests: [] })))

            otherMembers.forEach(mInfo => {
                const uid = typeof mInfo === 'string' ? mInfo : mInfo.uid
                const charId = typeof mInfo === 'string' ? null : mInfo.charId

                const unsubMem = onSnapshot(doc(db, 'users', uid), (mSnap) => {
                    if (!isMounted || !mSnap.exists()) return
                    const mData = mSnap.data()
                    const char = charId ? (mData.characters || []).find(c => c.id === charId) : (mData.characters?.[0] || null)
                    const quests = char?.completedQuests || mData.completedQuests || []
                    const charName = char?.name || mData.displayName || 'Inconnu'
                    setGuildMembers(prev => prev.map(m => m.id === uid ? {
                        ...m, name: charName, charName,
                        className: char?.class || 'iop', sex: char?.sex || 'm', completedQuests: quests
                    } : m))
                })
                memberUnsubs.push(unsubMem)
            })
        })

        return () => { isMounted = false; unsubGuild(); cleanupMembers() }
    }, [userGuildId, currentUser])

    const handleToggle = useCallback(async (questId) => {
        setUpdating(true)
        try { await toggleQuest(questId) } finally { setUpdating(false) }
    }, [toggleQuest])

    const filteredQuests = useMemo(() => {
        let list = QUESTS
        const isFiltering = filter !== 'all' || search.trim() !== ''

        if (filter === 'completed') list = list.filter(q => q.type === 'category' || completedQuests.includes(q.id))
        else if (filter === 'remaining') list = list.filter(q => q.type === 'category' || (q.type === 'quest' && !completedQuests.includes(q.id)))

        if (search.trim()) {
            const s = search.toLowerCase()
            list = list.filter(q => q.type === 'category' || (q.name && q.name.toLowerCase().includes(s)))
        }

        if (isFiltering) {
            const finalFiltered = []
            for (let i = 0; i < list.length; i++) {
                const item = list[i]
                if (item.type === 'category') {
                    let hasQuests = false
                    for (let j = i + 1; j < list.length; j++) {
                        if (list[j].type === 'category') break
                        if (list[j].type === 'quest') hasQuests = true
                    }
                    if (hasQuests) finalFiltered.push(item)
                } else {
                    finalFiltered.push(item)
                }
            }
            return finalFiltered
        }

        return list
    }, [filter, search, completedQuests, QUESTS])

    // Reset pagination when filter or search changes (keep page when just loading)
    useEffect(() => {
        if (filter !== 'all' || search.trim() !== '') setCurrentPage(1)
    }, [filter, search])

    // Paginate by category chunks
    const pages = useMemo(() => {
        const result = []
        let currentPageChunk = []

        for (let i = 0; i < filteredQuests.length; i++) {
            const item = filteredQuests[i]
            if (item.type === 'category' && currentPageChunk.length >= 20) {
                result.push(currentPageChunk)
                currentPageChunk = [item]
            } else {
                currentPageChunk.push(item)
            }
            if (currentPageChunk.length >= itemsPerPage * 2) {
                result.push(currentPageChunk)
                currentPageChunk = []
            }
        }
        if (currentPageChunk.length > 0) result.push(currentPageChunk)
        return result
    }, [filteredQuests])

    const totalPages = Math.max(1, pages.length)
    const currentQuests = pages[currentPage - 1] || []

    // Build pagelevel → page index map (which paginated page each pagelevel section starts on)
    const pageLevelToPageMap = useMemo(() => {
        if (!PAGE_LEVELS.length || !pages.length) return {}
        const map = {}
        PAGE_LEVELS.forEach(({ level, firstStepId }) => {
            for (let pi = 0; pi < pages.length; pi++) {
                if (pages[pi].some(item => item.id === firstStepId)) {
                    map[level] = pi + 1
                    break
                }
            }
        })
        return map
    }, [pages, PAGE_LEVELS])

    // Handle pagelevel dropdown selection
    const handlePageLevelChange = (e) => {
        const val = e.target.value
        setSelectedPageLevel(val)
        if (val === 'all') return
        const targetPage = pageLevelToPageMap[parseInt(val)]
        if (targetPage) {
            setCurrentPage(targetPage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Save page to localStorage
    useEffect(() => {
        localStorage.setItem(SCROLL_KEY_GUIDE, currentPage.toString())
    }, [currentPage])

    // Save scroll position periodically
    useEffect(() => {
        const onScroll = () => {
            clearTimeout(scrollSaveTimer.current)
            scrollSaveTimer.current = setTimeout(() => {
                localStorage.setItem('guide_scrollY', window.scrollY.toString())
            }, 200)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Restore scroll position on mount (after data loads)
    useEffect(() => {
        const savedScrollY = localStorage.getItem('guide_scrollY')
        if (savedScrollY) {
            requestAnimationFrame(() => {
                window.scrollTo({ top: parseInt(savedScrollY, 10), behavior: 'instant' })
            })
        }
    }, [])

    const handleCheckAllOnPage = useCallback(async () => {
        if (!checkMultipleQuests) return
        const questsToCheck = currentQuests.filter(item => item.type === 'quest' && !completedQuests.includes(item.id)).map(item => item.id)
        if (questsToCheck.length === 0) return
        setUpdating(true)
        try { await checkMultipleQuests(questsToCheck) } finally { setUpdating(false) }
    }, [currentQuests, completedQuests, checkMultipleQuests])

    const progressPct = TOTAL === 0 ? 0 : Math.round((completedQuests.length / TOTAL) * 100)

    if (!activeCharacter) {
        return (
            <div className="fade-in-up">
                <div className="page-header">
                    <h1 className="page-title">Guide Optimisé</h1>
                    <p className="page-subtitle">Veuillez créer ou sélectionner un personnage pour commencer.</p>
                </div>
                <div className="empty-state card" style={{ padding: '60px' }}>
                    <div className="empty-state-text">Aucun personnage actif.</div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Créez votre premier personnage via le menu en haut à droite pour suivre votre progression.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Guide Optimisé</h1>
                <p className="page-subtitle">Suivez et sauvegardez votre avancée dans le jeu.</p>
            </div>

            {/* Progress Overview */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progression totale</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{progressPct}%</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{completedQuests.length} / {TOTAL} quêtes complétées</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restantes</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{TOTAL - completedQuests.length}</div>
                    </div>
                </div>
                <div className="progress-bar-bg" style={{ height: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
            </div>

            {/* Filter Bar + PageLevel Dropdown */}
            <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <input
                    type="text"
                    className="form-input filter-search"
                    placeholder="Rechercher une quête..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    id="quest-search"
                />
                {[
                    { key: 'all', label: `Toutes (${TOTAL})` },
                    { key: 'remaining', label: `Restantes (${TOTAL - completedQuests.length})` },
                    { key: 'completed', label: `Complétées (${completedQuests.length})` },
                ].map(f => (
                    <button key={f.key} id={`filter-${f.key}`} className={`filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                        {f.label}
                    </button>
                ))}

                {/* Pagelevel jump dropdown */}
                {PAGE_LEVELS.length > 0 && (
                    <select
                        value={selectedPageLevel}
                        onChange={handlePageLevelChange}
                        className="guide-pagelevel-select"
                        title="Sauter à une tranche de niveau"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        <option value="all">Tranche de niveau...</option>
                        {PAGE_LEVELS.map(({ level }) => (
                            <option key={level} value={level}>
                                Niveaux {level === PAGE_LEVELS[PAGE_LEVELS.length - 1]?.level ? `${level}+` :
                                    `${level} → ${PAGE_LEVELS[PAGE_LEVELS.findIndex(p => p.level === level) + 1]?.level - 1 || level}`}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Guild Tracking Section */}
            {userGuildId && guildMembers.length > 0 && (
                <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>
                        Suivre l'avancée des membres de la guilde
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {guildMembers.map(member => {
                            const isTracked = trackedMemberIds.includes(member.id)
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => setTrackedMemberIds(prev => isTracked ? prev.filter(id => id !== member.id) : [...prev, member.id])}
                                    className={`guild-track-btn ${isTracked ? 'active' : ''}`}
                                    title={`${member.charName || member.name} : ${member.completedQuests.length} quêtes terminées`}
                                >
                                    <div className="guild-track-avatar" style={{ overflow: 'hidden', padding: 0, background: 'none' }}>
                                        <img src={`/assets/images/classes/${member.className || 'iop'}_${member.sex || 'm'}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }}>{member.charName || member.name}</span>
                                </button>
                            )
                        })}
                    </div>
                    {trackedMemberIds.length > 0 && (
                        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Moyenne des joueurs suivis : </span>
                            {TOTAL > 0 ? Math.round((guildMembers.filter(m => trackedMemberIds.includes(m.id)).reduce((acc, m) => acc + m.completedQuests.length, 0) / trackedMemberIds.length) / TOTAL * 100) : 0}%
                            ({Math.round(guildMembers.filter(m => trackedMemberIds.includes(m.id)).reduce((acc, m) => acc + m.completedQuests.length, 0) / trackedMemberIds.length)} / {TOTAL} quêtes)
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Affichage de {filteredQuests.filter(q => q.type === 'quest').length} quête(s) — page {currentPage}/{totalPages}
                    {updating && <span style={{ marginLeft: '8px', color: 'var(--primary)' }}>Sauvegarde en cours...</span>}
                </div>
                {currentQuests.some(q => q.type === 'quest' && !completedQuests.includes(q.id)) && (
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleCheckAllOnPage} disabled={updating}>
                        Tout cocher sur la page
                    </button>
                )}
            </div>

            {/* Quest List */}
            <div className="quest-list">
                {currentQuests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">Aucun résultat trouvé.</div>
                    </div>
                ) : (
                    currentQuests.map((item) => {
                        if (item.type === 'category') {
                            return <CategoryItem key={`cat-${item.originalIndex}`} category={item} />
                        }

                        const trackedMembersCompleted = guildMembers
                            .filter(m => trackedMemberIds.includes(m.id))
                            .filter(m => m.completedQuests.includes(item.id))
                            .map(m => ({ id: m.id, name: m.charName || m.name, className: m.className || 'iop', sex: m.sex || 'm' }))

                        return (
                            <QuestItem key={item.id} quest={item} completed={completedQuests.includes(item.id)} onToggle={handleToggle} trackedMembersCompleted={trackedMembersCompleted} />
                        )
                    })
                )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '20px' }}>
                Mode Alignement : <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeCharacter.alignment.toUpperCase()}</span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                        Précédent
                    </button>
                    <div className="page-info">
                        Page {currentPage} sur {totalPages}
                    </div>
                    <button className="page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                        Suivant
                    </button>
                </div>
            )}
        </div>
    )
}
