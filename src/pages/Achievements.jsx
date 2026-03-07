import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCharacter } from '../contexts/CharacterContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import brakmarData from '../../guideopti_brakmar.json'
import bontaData from '../../guideopti_bonta.json'
import achievementIcon from '../images/achievement.png'

const SCROLL_KEY = 'achievements_scrollY'

// ─── Data Extraction ────────────────────────────────────────────────────────

function buildAchievementData(data, guideKey) {
    const achievementMap = {}
    const achievementOrder = []
    let currentCategory = null
    let currentPageLevel = 1 // default page = 1

    for (const item of data) {
        if (item.type === 'category') {
            currentCategory = item
            continue
        }
        if (item.type !== 'quest') continue

        // If this quest has a pagelevel, update current page
        if (item.pagelevel) {
            currentPageLevel = parseInt(item.pagelevel, 10)
        }

        if (!item.achievements) continue

        for (const ach of item.achievements) {
            if (!achievementMap[ach.id]) {
                achievementMap[ach.id] = {
                    id: ach.id,
                    name: ach.name,
                    description: ach.description,
                    category: currentCategory,
                    pageLevel: currentPageLevel,
                    questsByGuide: { bonta: [], brakmar: [] },
                }
                achievementOrder.push(ach.id)
            }
            const entry = achievementMap[ach.id]
            const guideQuests = entry.questsByGuide[guideKey]
            if (!guideQuests.find(q => q.id === item.id)) {
                guideQuests.push({
                    id: item.id,
                    name: item.name,
                    questLevel: item.questLevel,
                    link: item.link,
                    images: item.images || [],
                    description: item.description || null,
                })
            }
        }
    }
    return { achievementMap, achievementOrder }
}

function buildMergedAchievements() {
    const { achievementMap: bontaMap, achievementOrder: bontaOrder } = buildAchievementData(bontaData, 'bonta')
    const { achievementMap: brakmarMap, achievementOrder: brakmarOrder } = buildAchievementData(brakmarData, 'brakmar')

    const seen = new Set()
    const allIds = []
    for (const id of [...bontaOrder, ...brakmarOrder]) {
        if (!seen.has(id)) { seen.add(id); allIds.push(id) }
    }

    const merged = {}
    for (const id of allIds) {
        const b = bontaMap[id]
        const r = brakmarMap[id]
        merged[id] = {
            id,
            name: (b || r).name,
            description: (b || r).description,
            category: (b || r).category,
            pageLevel: (b || r).pageLevel,
            questsByGuide: {
                bonta: b?.questsByGuide?.bonta || [],
                brakmar: r?.questsByGuide?.brakmar || [],
            },
        }
    }
    return { achievements: merged, order: allIds }
}

const { achievements: ALL_ACHIEVEMENTS, order: ACHIEVEMENT_ORDER } = buildMergedAchievements()

// Compute page level ranges from data (sorted unique page levels)
const PAGE_LEVELS = (() => {
    const levels = new Set()
    for (const id of ACHIEVEMENT_ORDER) {
        levels.add(ALL_ACHIEVEMENTS[id].pageLevel)
    }
    return Array.from(levels).sort((a, b) => a - b)
})()

// Build category groups (for display, secondary grouping)
function buildCategoryGroups() {
    const groups = []
    const seen = new Set()
    for (const achId of ACHIEVEMENT_ORDER) {
        const ach = ALL_ACHIEVEMENTS[achId]
        const catStep = ach.category?.step || 'Sans catégorie'
        if (!seen.has(catStep)) {
            seen.add(catStep)
            groups.push({
                step: catStep,
                title: ach.category?.title || catStep,
                image: ach.category?.image || null,
                achievements: [],
            })
        }
        groups[groups.length - 1].achievements.push(achId)
    }
    return groups
}

const CATEGORY_GROUPS = buildCategoryGroups()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRequiredQuests(achId, alignment) {
    const ach = ALL_ACHIEVEMENTS[achId]
    const primary = ach.questsByGuide[alignment] || []
    const other = ach.questsByGuide[alignment === 'bonta' ? 'brakmar' : 'bonta'] || []
    const primaryIds = new Set(primary.map(q => q.id))
    const extra = other.filter(q => !primaryIds.has(q.id))
    return { primary, extra }
}

function getPageLevelLabel(level) {
    return `Avant Niv. ${level}`
}

// ─── Components ──────────────────────────────────────────────────────────────

function QuestRow({ quest, isCompleted, onToggle, isOtherGuide, alignment, trackedMembersCompleted }) {
    return (
        <div className="quest-row ach-quest-entry">
            <div
                className={`quest-item${isCompleted ? ' completed' : ''}`}
                onClick={() => onToggle(quest.id)}
            >
                <div className="quest-main-info">
                    <div className="quest-checkbox-wrapper">
                        <input
                            type="checkbox"
                            className="quest-checkbox"
                            checked={isCompleted}
                            onChange={() => onToggle(quest.id)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    {quest.questLevel && (
                        <span className="quest-level-badge">Lvl {quest.questLevel}</span>
                    )}
                    {quest.images && quest.images.length > 0 && (
                        <div className="quest-dataset-images">
                            {quest.images.map((imgUrl, idx) => (
                                <img key={idx} src={imgUrl} alt="" className="quest-dataset-img" />
                            ))}
                        </div>
                    )}
                    <span className="quest-name">{quest.name}</span>

                    {/* Guild member avatars */}
                    {trackedMembersCompleted && trackedMembersCompleted.length > 0 && (
                        <div className="quest-member-avatars">
                            {trackedMembersCompleted.map(member => (
                                <div key={member.id} className="quest-member-avatar" title={`${member.name} a terminé cette quête`} style={{ background: 'none', padding: 0, overflow: 'hidden', border: '1px solid var(--v5-border)' }}>
                                    <img src={`/assets/images/classes/${member.className}_${member.sex}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {isOtherGuide && (
                        <span className="ach-quest-guide-badge">
                            {alignment === 'bonta' ? 'Brakmar' : 'Bonta'}
                        </span>
                    )}
                    {quest.link && (
                        <a href={quest.link} target="_blank" rel="noopener noreferrer" className="quest-link" onClick={e => e.stopPropagation()}>
                            Ouvrir le guide
                        </a>
                    )}
                </div>
                {quest.description && (
                    <div className="quest-description">{quest.description}</div>
                )}
            </div>
        </div>
    )
}

function AchievementCard({ achId, completedQuests, alignment, onToggleQuest, onToggleAchievement, guildMembers, trackedMemberIds }) {
    const [open, setOpen] = useState(false)
    const ach = ALL_ACHIEVEMENTS[achId]
    const { primary, extra } = getRequiredQuests(achId, alignment)
    const allRequired = [...primary, ...extra]

    const totalRequired = allRequired.length
    const totalDone = allRequired.filter(q => completedQuests.includes(q.id)).length
    const isCompleted = totalRequired > 0 && totalDone === totalRequired
    const pct = totalRequired === 0 ? 0 : Math.round((totalDone / totalRequired) * 100)

    const trackedMembersCompletedAch = guildMembers
        .filter(m => trackedMemberIds.includes(m.id))
        .filter(m => {
            if (allRequired.length === 0) return false;
            return allRequired.every(q => m.completedQuests.includes(q.id));
        })
        .map(m => ({ id: m.id, name: m.charName || m.name, className: m.className || 'iop', sex: m.sex || 'm' }))

    return (
        <div className={`ach-card${isCompleted ? ' ach-card-done' : ''}`}>
            <div className="ach-card-header" onClick={() => setOpen(o => !o)}>
                <div
                    className={`ach-checkbox-wrap${isCompleted ? ' done' : ''}`}
                    onClick={e => { e.stopPropagation(); onToggleAchievement(achId, isCompleted) }}
                    title={isCompleted ? 'Décocher toutes les quêtes' : 'Cocher toutes les quêtes'}
                >
                    <img src={achievementIcon} alt="succès" className="ach-icon" />
                    {isCompleted && <span className="ach-done-overlay">✓</span>}
                </div>
                <div className="ach-card-info">
                    <div className="ach-card-name">{ach.name}</div>
                    <div className="ach-card-desc">{ach.description}</div>
                    <div className="ach-progress-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="ach-mini-bar-bg" style={{ flex: 1 }}>
                                <div className={`ach-mini-bar-fill${isCompleted ? ' done' : ''}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="ach-progress-text">{totalDone}/{totalRequired}</span>
                        </div>
                        {trackedMembersCompletedAch.length > 0 && (
                            <div className="quest-member-avatars" style={{ marginTop: 0 }}>
                                {trackedMembersCompletedAch.map(member => (
                                    <div key={member.id} className="quest-member-avatar" title={`${member.name} a terminé ce succès`} style={{ background: 'none', padding: 0, overflow: 'hidden', border: '1px solid var(--v5-border)' }}>
                                        <img src={`/assets/images/classes/${member.className}_${member.sex}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button className={`ach-chevron${open ? ' open' : ''}`} aria-label="Afficher les quêtes" onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>›</button>
            </div>

            {open && (
                <div className="ach-dropdown">
                    {allRequired.length === 0 ? (
                        <div className="ach-no-quests">Aucune quête dans le guide pour cet alignement.</div>
                    ) : (
                        <>
                            {primary.map(q => {
                                const trackedMembersCompleted = guildMembers
                                    .filter(m => trackedMemberIds.includes(m.id))
                                    .filter(m => m.completedQuests.includes(q.id))
                                    .map(m => ({ id: m.id, name: m.name, className: m.className || 'iop', sex: m.sex || 'm' }))
                                return (
                                    <QuestRow key={q.id} quest={q} isCompleted={completedQuests.includes(q.id)} onToggle={onToggleQuest} isOtherGuide={false} alignment={alignment} trackedMembersCompleted={trackedMembersCompleted} />
                                )
                            })}
                            {extra.map(q => {
                                const trackedMembersCompleted = guildMembers
                                    .filter(m => trackedMemberIds.includes(m.id))
                                    .filter(m => m.completedQuests.includes(q.id))
                                    .map(m => ({ id: m.id, name: m.name, className: m.className || 'iop', sex: m.sex || 'm' }))
                                return (
                                    <QuestRow key={q.id} quest={q} isCompleted={completedQuests.includes(q.id)} onToggle={onToggleQuest} isOtherGuide={true} alignment={alignment} trackedMembersCompleted={trackedMembersCompleted} />
                                )
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

function CategorySection({ group, completedQuests, alignment, onToggleQuest, onToggleAchievement, guildMembers, trackedMemberIds }) {
    const [collapsed, setCollapsed] = useState(false)
    let displayTitle = group.title
    const splitIdx = group.title.indexOf(' : ')
    if (splitIdx !== -1) displayTitle = group.title.substring(0, splitIdx)

    return (
        <div className="ach-category-section">
            <div className="ach-category-header" onClick={() => setCollapsed(c => !c)}>
                {group.image && <img src={group.image} alt={group.step} className="ach-category-img" />}
                <div className="ach-category-info">
                    <span className="ach-category-step">{group.step}</span>
                    <span className="ach-category-title">{displayTitle}</span>
                </div>
                <span className={`ach-section-chevron${collapsed ? ' collapsed' : ''}`}>▾</span>
            </div>
            {!collapsed && (
                <div className="ach-category-body">
                    {group.achievements.map(achId => (
                        <AchievementCard
                            key={achId}
                            achId={achId}
                            completedQuests={completedQuests}
                            alignment={alignment}
                            onToggleQuest={onToggleQuest}
                            onToggleAchievement={onToggleAchievement}
                            guildMembers={guildMembers}
                            trackedMemberIds={trackedMemberIds}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Achievements() {
    const { currentUser } = useAuth()
    const { activeCharacter, toggleQuest, checkMultipleQuests, updateCharacter } = useCharacter()
    const [filter, setFilter] = useState('all')
    const [pageLevelFilter, setPageLevelFilter] = useState('all')
    const [updating, setUpdating] = useState(false)
    const scrollSaveTimer = useRef(null)

    // Guild state
    const [userGuildId, setUserGuildId] = useState(null)
    const [guildMembers, setGuildMembers] = useState([])
    const [trackedMemberIds, setTrackedMemberIds] = useState([])

    const completedQuests = activeCharacter?.completedQuests || []
    const alignment = activeCharacter?.alignment || 'bonta'

    // Scroll persistence
    useEffect(() => {
        const saved = localStorage.getItem(SCROLL_KEY)
        if (saved) {
            requestAnimationFrame(() => {
                window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
            })
        }
    }, [])

    useEffect(() => {
        const onScroll = () => {
            clearTimeout(scrollSaveTimer.current)
            scrollSaveTimer.current = setTimeout(() => {
                localStorage.setItem(SCROLL_KEY, window.scrollY.toString())
            }, 200)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Sync guild info
    useEffect(() => {
        if (!currentUser) return
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), snap => {
            if (snap.exists()) setUserGuildId(snap.data().guildId || null)
        })
        return unsub
    }, [currentUser])

    // Sync guild members
    useEffect(() => {
        if (!userGuildId || !currentUser) { setGuildMembers([]); setTrackedMemberIds([]); return }
        let isMounted = true
        let memberUnsubs = []
        const cleanupMembers = () => { memberUnsubs.forEach(u => u()); memberUnsubs = [] }

        const unsubGuild = onSnapshot(doc(db, 'guilds', userGuildId), guildSnap => {
            if (!isMounted) return
            if (!guildSnap.exists()) { setGuildMembers([]); return }
            cleanupMembers()
            const memberInfos = guildSnap.data().members || []
            const otherMembers = memberInfos.filter(m => (typeof m === 'string' ? m : m.uid) !== currentUser.uid)
            setGuildMembers(otherMembers.map(m => ({ id: typeof m === 'string' ? m : m.uid, name: 'Chargement...', completedQuests: [] })))
            otherMembers.forEach(mInfo => {
                const uid = typeof mInfo === 'string' ? mInfo : mInfo.uid
                const charId = typeof mInfo === 'string' ? null : mInfo.charId
                const unsubMem = onSnapshot(doc(db, 'users', uid), mSnap => {
                    if (!isMounted || !mSnap.exists()) return
                    const mData = mSnap.data()
                    const char = charId ? (mData.characters || []).find(c => c.id === charId) : (mData.characters?.[0] || null)
                    const quests = char?.completedQuests || mData.completedQuests || []
                    const charName = char?.name || mData.displayName || 'Inconnu'
                    setGuildMembers(prev => prev.map(m => m.id === uid ? {
                        ...m, name: charName, charName: charName,
                        className: char?.class || 'iop', sex: char?.sex || 'm', completedQuests: quests
                    } : m))
                })
                memberUnsubs.push(unsubMem)
            })
        })
        return () => { isMounted = false; unsubGuild(); cleanupMembers() }
    }, [userGuildId, currentUser])

    const handleToggleQuest = useCallback(async (questId) => {
        setUpdating(true)
        try { await toggleQuest(questId) } finally { setUpdating(false) }
    }, [toggleQuest])

    const handleToggleAchievement = useCallback(async (achId, currentlyDone) => {
        if (!activeCharacter) return
        const { primary, extra } = getRequiredQuests(achId, alignment)
        const allQuestIds = [...primary, ...extra].map(q => q.id)
        setUpdating(true)
        try {
            if (currentlyDone) {
                const newCompleted = completedQuests.filter(id => !allQuestIds.includes(id))
                await updateCharacter(activeCharacter.id, { completedQuests: newCompleted })
            } else {
                await checkMultipleQuests(allQuestIds)
            }
        } finally { setUpdating(false) }
    }, [activeCharacter, alignment, completedQuests, checkMultipleQuests, updateCharacter])

    const stats = useMemo(() => {
        let total = 0, done = 0
        for (const achId of ACHIEVEMENT_ORDER) {
            const { primary, extra } = getRequiredQuests(achId, alignment)
            const all = [...primary, ...extra]
            if (all.length === 0) continue
            total++
            if (all.every(q => completedQuests.includes(q.id))) done++
        }
        return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
    }, [completedQuests, alignment])

    // Filter achievements
    const filteredGroups = useMemo(() => {
        return CATEGORY_GROUPS.map(group => {
            const ids = group.achievements.filter(achId => {
                const ach = ALL_ACHIEVEMENTS[achId]

                // Page level filter
                if (pageLevelFilter !== 'all' && ach.pageLevel !== parseInt(pageLevelFilter)) return false

                const { primary, extra } = getRequiredQuests(achId, alignment)
                const all = [...primary, ...extra]
                if (all.length === 0) return filter !== 'all' ? false : true
                const done = all.every(q => completedQuests.includes(q.id))
                if (filter === 'completed') return done
                if (filter === 'remaining') return !done
                return true
            })
            return { ...group, achievements: ids }
        }).filter(g => g.achievements.length > 0)
    }, [filter, pageLevelFilter, completedQuests, alignment])

    if (!activeCharacter) {
        return (
            <div className="fade-in-up">
                <div className="page-header">
                    <h1 className="page-title">Succès</h1>
                    <p className="page-subtitle">Veuillez créer ou sélectionner un personnage pour commencer.</p>
                </div>
                <div className="empty-state card" style={{ padding: '60px' }}>
                    <div className="empty-state-text">Aucun personnage actif.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="fade-in-up">
            <div className="page-header">
                <h1 className="page-title">Succès</h1>
                <p className="page-subtitle">
                    Cliquez sur l'icône pour tout cocher/décocher · cliquez sur une quête pour la toggler — Alignement :{' '}
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{alignment.toUpperCase()}</span>
                </p>
            </div>

            {/* Global Progress */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Succès complétés</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{stats.pct}%</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stats.done} / {stats.total} succès</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Restants</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>{stats.total - stats.done}</div>
                    </div>
                </div>
                <div className="progress-bar-bg" style={{ height: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${stats.pct}%` }} />
                </div>
            </div>

            {/* Page Level + Completion Filter Row */}
            <div className="filter-bar" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                {[
                    { key: 'all', label: `Tous (${stats.total})` },
                    { key: 'remaining', label: `En cours (${stats.total - stats.done})` },
                    { key: 'completed', label: `Complétés (${stats.done})` },
                ].map(f => (
                    <button key={f.key} className={`filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                        {f.label}
                    </button>
                ))}

                {PAGE_LEVELS.length > 1 && (
                    <select
                        value={pageLevelFilter}
                        onChange={e => setPageLevelFilter(e.target.value)}
                        className="guide-pagelevel-select"
                        title="Filtrer par tranche de niveau"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        <option value="all">Toutes les tranches</option>
                        {PAGE_LEVELS.map((level, idx) => (
                            <option key={level} value={String(level)}>
                                Niveaux {level}{idx + 1 < PAGE_LEVELS.length ? ` → ${PAGE_LEVELS[idx + 1] - 1}` : '+'}
                            </option>
                        ))}
                    </select>
                )}
                {updating && <span style={{ marginLeft: '8px', color: 'var(--primary)', fontSize: '0.85rem' }}>Sauvegarde...</span>}
            </div>

            {/* Guild Tracking */}
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
                </div>
            )}

            {/* Achievement Tree */}
            <div className="ach-tree">
                {filteredGroups.length === 0 ? (
                    <div className="empty-state card" style={{ padding: '40px' }}>
                        <div className="empty-state-text">Aucun succès trouvé.</div>
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <CategorySection
                            key={group.step}
                            group={group}
                            completedQuests={completedQuests}
                            alignment={alignment}
                            onToggleQuest={handleToggleQuest}
                            onToggleAchievement={handleToggleAchievement}
                            guildMembers={guildMembers}
                            trackedMemberIds={trackedMemberIds}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
